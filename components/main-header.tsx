"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { LogoutButton } from "./logout-button"

type CurrentUser = {
  email?: string | null
  name?: string | null
}

function formatUserName(value?: string | null) {
  if (!value) return "User"

  return value
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export default function MainHeader() {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false

    async function loadUser() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" })
        if (!response.ok) {
          if (!cancelled) setUser(null)
          return
        }

        const data = await response.json()
        if (!cancelled) setUser(data.user ?? null)
      } catch {
        if (!cancelled) setUser(null)
      }
    }

    loadUser()

    return () => {
      cancelled = true
    }
  }, [])

  const userName =
    user === undefined
      ? "..."
      : user?.name || user?.email || formatUserName(user?.email)

  return (
    <header
      className="sticky top-0 z-40 w-full border-b-4 px-5"
      style={{
        background:
          "linear-gradient(90deg, #ffffffef 0%, #ffffff 50%, #fafffd 100%)",
        color: "#180505",
        borderBottomColor: "rgba(25, 102, 12, 0.9)",
      }}
    >
      <div className="flex h-12 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/fpIcon.png"
            height={36}
            width={40}
            alt="First Pack"
            className="h-9 w-auto object-contain"
            priority
          />
          <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">
            Asset Management System
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate text-sm font-semibold">Hi, {userName}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
