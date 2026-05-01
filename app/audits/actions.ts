"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/audit-log"
import { auditFormSchema, parseFormData, zodErrorMessage } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAudit(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  let values
  try {
    values = parseFormData(auditFormSchema, formData)
  } catch (error) {
    return { error: zodErrorMessage(error) }
  }

  // Count assets in the branch
  const { count: totalAssets } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true })
    .eq("branch_id", values.branch_id)
    .not("status", "in", "(disposed,lost,stolen)")

  const auditData = {
    branch_id: values.branch_id,
    audit_date: values.audit_date,
    auditor_name: values.auditor_name,
    status: "planned",
    total_assets: totalAssets || 0,
    verified_assets: 0,
    discrepancies: 0,
    notes: values.notes,
  }

  const { data: createdAudit, error } = await supabase
    .from("asset_audits")
    .insert(auditData)
    .select("id")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (createdAudit?.id) {
    await writeAuditLog(supabase, {
      entityType: "audit",
      entityId: createdAudit.id,
      action: "create",
      newValues: auditData,
    })
  }

  revalidatePath("/audits", "layout")
  revalidatePath("/", "layout")
  redirect("/audits")
}

export async function startAudit(id: string) {
  const supabase = await getSupabaseServerClient()

  // Get audit details
  const { data: audit } = await supabase
    .from("asset_audits")
    .select("branch_id")
    .eq("id", id)
    .single()

  if (!audit) {
    throw new Error("Audit not found")
  }

  // Get all assets for this branch and create audit items
  const { data: assets } = await supabase
    .from("assets")
    .select("id")
    .eq("branch_id", audit.branch_id)
    .not("status", "in", "(disposed,lost,stolen)")

  // Create audit items for each asset
  if (assets && assets.length > 0) {
    const auditItems = assets.map(asset => ({
      audit_id: id,
      asset_id: asset.id,
      status: "pending" as const,
    }))

    await supabase.from("audit_items").upsert(auditItems, {
      onConflict: "audit_id,asset_id",
      ignoreDuplicates: true,
    })
  }

  // Update audit status
  const { error } = await supabase
    .from("asset_audits")
    .update({
      status: "in_progress",
      total_assets: assets?.length || 0,
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  await writeAuditLog(supabase, {
    entityType: "audit",
    entityId: id,
    action: "start",
    changes: { status: "in_progress", total_assets: assets?.length || 0 },
  })

  revalidatePath("/audits", "layout")
}

export async function completeAudit(id: string) {
  const supabase = await getSupabaseServerClient()

  // Count verified and discrepancies
  const { data: items } = await supabase
    .from("audit_items")
    .select("status")
    .eq("audit_id", id)

  const verifiedCount = items?.filter(i => i.status === "verified").length || 0
  const discrepancyCount = items?.filter(i => i.status !== "verified").length || 0

  const { error } = await supabase
    .from("asset_audits")
    .update({
      status: "completed",
      verified_assets: verifiedCount,
      discrepancies: discrepancyCount,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  await writeAuditLog(supabase, {
    entityType: "audit",
    entityId: id,
    action: "complete",
    changes: { status: "completed", verified_assets: verifiedCount, discrepancies: discrepancyCount },
  })

  revalidatePath("/audits", "layout")
  revalidatePath("/", "layout")
}

export async function updateAuditItem(
  auditId: string,
  itemId: string,
  status: "verified" | "missing" | "damaged" | "discrepancy",
  notes?: string
) {
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from("audit_items")
    .update({
      status,
      notes: notes || null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", itemId)

  if (error) {
    return { error: error.message }
  }

  await writeAuditLog(supabase, {
    entityType: "audit_item",
    entityId: itemId,
    action: "update",
    changes: { audit_id: auditId, status, notes: notes || null },
  })

  // Update verified count
  const { data: items } = await supabase
    .from("audit_items")
    .select("status")
    .eq("audit_id", auditId)

  const verifiedCount = items?.filter(i => i.status === "verified").length || 0

  await supabase
    .from("asset_audits")
    .update({ verified_assets: verifiedCount })
    .eq("id", auditId)

  revalidatePath(`/audits/${auditId}`, "layout")
  revalidatePath("/audits", "layout")
}
