import { Save, UserPlus, Users } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { requireRole } from "@/lib/auth/server"
import { getRoleLabel, isUserRole, type UserRole } from "@/lib/auth/roles"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"
import { createUser, updateUser } from "./actions"

type UsersPageProps = {
  searchParams?: Promise<{
    error?: string
    success?: string
  }>
}

function formatDate(value?: string) {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

function getRole(value: unknown): UserRole | null {
  return isUserRole(value) ? value : null
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requireRole(["admin"])
  const params = await searchParams
  let users: User[] = []
  let loadError = ""

  try {
    const adminSupabase = getSupabaseAdminClient()
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    })

    if (error) {
      loadError = error.message
    } else {
      users = data.users
    }
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Supabase admin access is not configured."
  }

  return (
    <DashboardLayout
      title="Users"
      description="Create and review system users"
    >
      <div className="space-y-6">
        {(params?.error || params?.success || loadError) && (
          <div
            className={
              params?.success
                ? "rounded-lg bg-green-50 p-3 text-sm text-green-700"
                : "rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            }
          >
            {params?.success || params?.error || loadError}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" name="full_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select name="role" defaultValue="accountant" required>
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="auditor">Auditor</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Existing Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => {
                const role = getRole(user.app_metadata?.role)

                return (
                  <form
                    key={user.id}
                    action={updateUser}
                    className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[1fr_1fr_170px_1fr_auto]"
                  >
                    <input type="hidden" name="id" value={user.id} />
                    <div className="space-y-2">
                      <Label htmlFor={`full_name_${user.id}`}>Full Name</Label>
                      <Input
                        id={`full_name_${user.id}`}
                        name="full_name"
                        defaultValue={String(user.user_metadata?.full_name || "")}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`email_${user.id}`}>Email Address</Label>
                      <Input
                        id={`email_${user.id}`}
                        name="email"
                        type="email"
                        defaultValue={user.email || ""}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`role_${user.id}`}>Role</Label>
                      <Select name="role" defaultValue={role || "accountant"} required>
                        <SelectTrigger id={`role_${user.id}`} className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="auditor">Auditor</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`password_${user.id}`}>New Password</Label>
                      <Input
                        id={`password_${user.id}`}
                        name="password"
                        type="password"
                        minLength={8}
                        placeholder="Leave unchanged"
                      />
                    </div>
                    <div className="flex flex-col justify-between gap-3 lg:items-end">
                      <Badge variant={role === "admin" ? "default" : "secondary"} className="w-fit">
                        {role ? getRoleLabel(role) : "Unassigned"}
                      </Badge>
                      <div className="text-xs text-muted-foreground lg:text-right">
                        <div>Created: {formatDate(user.created_at)}</div>
                        <div>Last sign in: {formatDate(user.last_sign_in_at)}</div>
                      </div>
                      <Button type="submit" size="sm">
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </form>
                )
              })}
              {users.length === 0 && (
                <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
                  No users found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
