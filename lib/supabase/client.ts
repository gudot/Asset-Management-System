"use client"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let client: ReturnType<typeof createSupabaseClient> | null = null

export function getSupabaseBrowserClient() {
  if (client) return client
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Supabase environment variables missing:", {
      url: !!supabaseUrl,
      key: !!supabaseAnonKey
    })
  }
  
  client = createSupabaseClient(
    supabaseUrl || "",
    supabaseAnonKey || ""
  )
  
  return client
}

// Alias for convenience - used throughout the app
export const createClient = getSupabaseBrowserClient
