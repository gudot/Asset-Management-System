"use client"

import { useEffect, useState } from "react"
import { AppSidebarClient } from "./app-sidebar-client"
import type { UserRole } from "@/lib/auth/roles"

export function AppSidebar() {
  const [role, setRole] = useState<UserRole | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" })
        if (!response.ok) {
          if (!cancelled) setRole(null)
          return
        }

        const data = await response.json()
        if (!cancelled) setRole(data.user?.role ?? null)
      } catch {
        if (!cancelled) setRole(null)
      }
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [])

  return <AppSidebarClient role={role} />
}
