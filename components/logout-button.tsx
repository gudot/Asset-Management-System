"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { logoutAction } from "@/app/login/actions"

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const result = await logoutAction()
    if (result?.error) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.push("/login")
    router.refresh()
  }

  return (
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
  )
}
