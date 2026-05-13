import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getUserRole, type UserRole } from "@/lib/auth/roles"

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  const role = getUserRole(user)

  if (!role || !allowedRoles.includes(role)) {
    redirect("/")
  }

  return { user, role }
}
