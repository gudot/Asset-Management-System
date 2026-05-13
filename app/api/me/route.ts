import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/server"
import { getUserRole } from "@/lib/auth/roles"

export async function GET() {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      role: getUserRole(user),
    },
  })
}
