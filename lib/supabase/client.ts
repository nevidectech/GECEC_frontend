import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/db"
import { getSupabaseConfig } from "@/lib/supabase/config"

export function createClient() {
  const { url, anonKey } = getSupabaseConfig()

  return createBrowserClient<Database>(
    url,
    anonKey,
  )
}
