"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/audit-log"
import { parseFormData, transferFormSchema, zodErrorMessage } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTransfer(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  let values
  try {
    values = parseFormData(transferFormSchema, formData)
  } catch (error) {
    return { error: zodErrorMessage(error) }
  }

  // Get current asset branch
  const { data: asset } = await supabase
    .from("assets")
    .select("branch_id")
    .eq("id", values.asset_id)
    .single()

  if (!asset) {
    return { error: "Asset not found" }
  }

  if (asset.branch_id === values.to_branch_id) {
    return { error: "Asset is already at this branch" }
  }

  const transferData = {
    asset_id: values.asset_id,
    from_branch_id: asset.branch_id,
    to_branch_id: values.to_branch_id,
    transfer_date: new Date().toISOString().split("T")[0],
    reason: values.reason,
    transferred_by: values.transferred_by,
    status: "pending",
  }

  const { data: createdTransfer, error } = await supabase
    .from("asset_transfers")
    .insert(transferData)
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (createdTransfer?.id) {
    await writeAuditLog(supabase, {
      entityType: "transfer",
      entityId: createdTransfer.id,
      action: "transfer",
      newValues: transferData,
    })
  }

  // Update asset status
  await supabase
    .from("assets")
    .update({ status: "transferred" })
    .eq("id", values.asset_id)

  revalidatePath("/transfers", "layout")
  revalidatePath("/assets", "layout")
  revalidatePath("/", "layout")
  redirect("/transfers")
}

export async function completeTransfer(id: string) {
  const supabase = await getSupabaseServerClient()

  // Get transfer details
  const { data: transfer } = await supabase
    .from("asset_transfers")
    .select("asset_id, to_branch_id")
    .eq("id", id)
    .single()

  if (!transfer) {
    throw new Error("Transfer not found")
  }

  // Update transfer status
  const { error: transferError } = await supabase
    .from("asset_transfers")
    .update({
      status: "completed",
    })
    .eq("id", id)

  if (transferError) {
    throw new Error(transferError.message)
  }

  // Update asset branch and status
  const { error: assetError } = await supabase
    .from("assets")
    .update({
      branch_id: transfer.to_branch_id,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", transfer.asset_id)

  if (assetError) {
    throw new Error(assetError.message)
  }

  await writeAuditLog(supabase, {
    entityType: "transfer",
    entityId: id,
    action: "complete",
    changes: { status: "completed", asset_id: transfer.asset_id, to_branch_id: transfer.to_branch_id },
  })

  revalidatePath("/transfers", "layout")
  revalidatePath("/assets", "layout")
  revalidatePath("/", "layout")
}

export async function cancelTransfer(id: string) {
  const supabase = await getSupabaseServerClient()

  // Get transfer details
  const { data: transfer } = await supabase
    .from("asset_transfers")
    .select("asset_id")
    .eq("id", id)
    .single()

  if (!transfer) {
    throw new Error("Transfer not found")
  }

  // Update transfer status
  const { error: transferError } = await supabase
    .from("asset_transfers")
    .update({ status: "cancelled" })
    .eq("id", id)

  if (transferError) {
    throw new Error(transferError.message)
  }

  // Restore asset status
  await supabase
    .from("assets")
    .update({ status: "active" })
    .eq("id", transfer.asset_id)

  await writeAuditLog(supabase, {
    entityType: "transfer",
    entityId: id,
    action: "cancel",
    changes: { status: "cancelled", asset_id: transfer.asset_id },
  })

  revalidatePath("/transfers", "layout")
  revalidatePath("/assets", "layout")
  revalidatePath("/", "layout")
}
