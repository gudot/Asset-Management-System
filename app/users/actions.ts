"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth/server"
import { USER_ROLES, getRoleLabel, isUserRole } from "@/lib/auth/roles"
import { writeAuditLog } from "@/lib/audit-log"
import { getSupabaseServerClient } from "@/lib/supabase/server"

function redirectWithError(message: string): never {
  redirect(`/users?error=${encodeURIComponent(message)}`)
}

export async function createUser(formData: FormData) {
  const { user: currentUser } = await requireRole(["admin"])
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "")
  const fullName = String(formData.get("full_name") || "").trim()
  const role = String(formData.get("role") || "")

  if (!email || !password || !fullName || !isUserRole(role)) {
    redirectWithError("Provide a name, email, password, and valid role.")
  }

  if (password.length < 8) {
    redirectWithError("Password must be at least 8 characters.")
  }

  if (!USER_ROLES.includes(role)) {
    redirectWithError("Invalid user role.")
  }

  let adminSupabase
  try {
    adminSupabase = getSupabaseAdminClient()
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Supabase admin access is not configured.")
  }

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  })

  if (error) {
    redirectWithError(error.message)
  }

  const supabase = await getSupabaseServerClient()
  await writeAuditLog(supabase, {
    entityType: "auth",
    entityId: data.user?.id,
    action: "create_user",
    changes: {
      email,
      role,
      created_by: currentUser.email,
    },
  })

  revalidatePath("/users")
  redirect(`/users?success=${encodeURIComponent(`${getRoleLabel(role)} user created.`)}`)
}

export async function updateUser(formData: FormData) {
  const { user: currentUser } = await requireRole(["admin"])
  const id = String(formData.get("id") || "").trim()
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const fullName = String(formData.get("full_name") || "").trim()
  const role = String(formData.get("role") || "")
  const password = String(formData.get("password") || "")

  if (!id || !email || !fullName || !isUserRole(role)) {
    redirectWithError("Provide a name, email, and valid role.")
  }

  if (password && password.length < 8) {
    redirectWithError("New password must be at least 8 characters.")
  }

  let adminSupabase
  try {
    adminSupabase = getSupabaseAdminClient()
  } catch (error) {
    redirectWithError(error instanceof Error ? error.message : "Supabase admin access is not configured.")
  }

  const updatePayload: Parameters<typeof adminSupabase.auth.admin.updateUserById>[1] = {
    email,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  }

  if (password) {
    updatePayload.password = password
  }

  const { error } = await adminSupabase.auth.admin.updateUserById(id, updatePayload)

  if (error) {
    redirectWithError(error.message)
  }

  const supabase = await getSupabaseServerClient()
  await writeAuditLog(supabase, {
    entityType: "auth",
    entityId: id,
    action: "update_user",
    changes: {
      email,
      role,
      updated_by: currentUser.email,
      password_reset: Boolean(password),
    },
  })

  revalidatePath("/users")
  redirect(`/users?success=${encodeURIComponent("User updated.")}`)
}
