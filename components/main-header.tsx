"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { logoutAction } from "@/app/login/actions"

export default function MainHeader() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()
  }, [supabase.auth])

  async function handleLogout() {
    const result = await logoutAction()
    if (result?.error) {
      await supabase.auth.signOut()
    }
    router.push("/login")
    router.refresh()
  }

  const formatUserName = (value?: string | null) => {
    if (!value) return "User"

    return value
      .split("@")[0]
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ")
  }

  const userName =
    user?.user_metadata?.full_name || formatUserName(user?.email)

  return (
    <header
      className="sticky top-0 z-40 border-b-4 px-5"
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
          <button
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-white transition"
            style={{
              background: "linear-gradient(135deg, #0d5c4d 0%, #147a66 100%)",
              boxShadow: "0 4px 14px rgba(13, 92, 77, 0.25)",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.boxShadow =
                "0 6px 20px rgba(13, 92, 77, 0.40)"
              event.currentTarget.style.transform = "translateY(-1px)"
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.boxShadow =
                "0 4px 14px rgba(13, 92, 77, 0.25)"
              event.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
