import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/db"
import { getSupabaseConfig } from "@/lib/supabase/config"

export function createAdminClient() {
  const { url, serviceRoleKey } = getSupabaseConfig()

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing")
  }
  if (serviceRoleKey.startsWith("sb_publishable_")) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is invalid (publishable key provided)")
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
