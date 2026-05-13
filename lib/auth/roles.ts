import type { User } from "@supabase/supabase-js"

export const USER_ROLES = ["admin", "auditor", "accountant"] as const

export type UserRole = (typeof USER_ROLES)[number]

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  auditor: "Auditor",
  accountant: "Accountant",
}

const restrictedByRole: Record<UserRole, string[]> = {
  admin: [],
  auditor: ["/users"],
  accountant: ["/audits", "/reports", "/logs", "/users"],
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole)
}

export function getUserRole(user: User | null): UserRole | null {
  const role = user?.app_metadata?.role
  return isUserRole(role) ? role : null
}

export function getRoleLabel(role: UserRole) {
  return roleLabels[role]
}

export function canAccessPath(role: UserRole | null, pathname: string) {
  if (!role) return false

  return !restrictedByRole[role].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export function canCreateUsers(role: UserRole | null) {
  return role === "admin"
}
