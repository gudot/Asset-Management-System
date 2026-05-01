"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { writeAuditLog } from "@/lib/audit-log"
import { maintenanceFormSchema, parseFormData, zodErrorMessage } from "@/lib/validation"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createMaintenance(formData: FormData) {
  const supabase = await getSupabaseServerClient()

  let values
  try {
    values = parseFormData(maintenanceFormSchema, formData)
  } catch (error) {
    return { error: zodErrorMessage(error) }
  }

  const { data: maintenance, error } = await supabase
    .from("asset_maintenance")
    .insert(values)
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  if (maintenance?.id) {
    await writeAuditLog(supabase, {
      entityType: "maintenance",
      entityId: maintenance.id,
      action: "create",
      newValues: values,
    })
  }

  // Update asset status if corrective or emergency maintenance
  if (values.maintenance_type === "corrective" || values.maintenance_type === "emergency") {
    await supabase
      .from("assets")
      .update({ status: "in_repair", updated_at: new Date().toISOString() })
      .eq("id", values.asset_id)
  }

  // Update asset condition based on maintenance type
  const newCondition = values.maintenance_type === "preventive" ? "good" : "fair"
  await supabase
    .from("assets")
    .update({ condition: newCondition, updated_at: new Date().toISOString() })
    .eq("id", values.asset_id)

  revalidatePath("/maintenance", "layout")
  revalidatePath("/assets", "layout")
  revalidatePath("/", "layout")
  redirect("/maintenance")
}

export async function completeMaintenance(assetId: string) {
  const supabase = await getSupabaseServerClient()

  await supabase
    .from("assets")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", assetId)

  await writeAuditLog(supabase, {
    entityType: "maintenance",
    entityId: assetId,
    action: "complete",
    changes: { asset_id: assetId, asset_status: "active" },
  })

  revalidatePath("/maintenance", "layout")
  revalidatePath("/assets", "layout")
  revalidatePath("/", "layout")
}
