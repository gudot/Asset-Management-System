export type AuditEntity =
  | "auth"
  | "asset"
  | "branch"
  | "category"
  | "transfer"
  | "maintenance"
  | "audit"
  | "disposal"
  | "audit_item"
  | "system"

interface AuditLogInput {
  entityType: AuditEntity
  entityId?: string
  action: string
  changes?: Record<string, unknown> | null
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
}

export async function writeAuditLog(supabase: any, input: AuditLogInput) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const entityId = input.entityId || user?.id || "00000000-0000-0000-0000-000000000000"

    const { error } = await supabase.from("audit_logs").insert({
      entity_type: input.entityType,
      entity_id: entityId,
      action: input.action,
      changes: input.changes || input.newValues || null,
      old_values: input.oldValues || null,
      new_values: input.newValues || null,
      performed_by: user?.email || user?.user_metadata?.full_name || "System",
    })

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("Audit log insert failed:", error.message)
      }
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Audit log write failed:",
        error instanceof Error ? error.message : error,
      )
    }
    // Audit logging must never block the operational action.
    return {
      error: error instanceof Error ? error.message : "Audit log write failed",
    }
  }
}
