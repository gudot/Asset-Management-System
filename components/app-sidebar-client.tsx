"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Package,
  ArrowLeftRight,
  Wrench,
  ClipboardCheck,
  FileText,
  Trash2,
  Tags,
  History,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { canAccessPath, canCreateUsers, type UserRole } from "@/lib/auth/roles"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Branches", href: "/branches", icon: Building2 },
  { name: "Assets", href: "/assets", icon: Package },
  { name: "Transfers", href: "/transfers", icon: ArrowLeftRight },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Audits", href: "/audits", icon: ClipboardCheck },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Disposals", href: "/disposals", icon: Trash2 },
]

const secondaryNavigation = [
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Audit Logs", href: "/logs", icon: History },
]

type AppSidebarClientProps = {
  role: UserRole | null | undefined
}

export function AppSidebarClient({ role }: AppSidebarClientProps) {
  const pathname = usePathname()
  const visibleNavigation = role
    ? navigation.filter((item) => canAccessPath(role, item.href))
    : []
  const visibleSecondaryNavigation = role
    ? secondaryNavigation.filter((item) => canAccessPath(role, item.href))
    : []

  return (
    <aside className="w-52 shrink-0 bg-sidebar">
      <nav className="sticky top-0 min-h-full space-y-1 px-2 py-4">
        {role === undefined && (
          <div className="px-3 py-2 text-sm text-sidebar-foreground/60">
            Loading navigation...
          </div>
        )}

        {role === null && (
          <div className="px-3 py-2 text-sm text-sidebar-foreground/60">
            No role assigned
          </div>
        )}

        {visibleNavigation.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}

        <div className="my-4 border-t border-sidebar-border" />

        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
          System
        </div>

        {canCreateUsers(role ?? null) && (
          <Link
            href="/users"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/users" || pathname.startsWith("/users/")
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            Users
          </Link>
        )}

        {visibleSecondaryNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
