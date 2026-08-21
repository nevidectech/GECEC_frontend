const SUPABASE_URL_PATTERN = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/%$/, "")

  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing")
  }

  if (!SUPABASE_URL_PATTERN.test(url)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is invalid: ${url}. Expected a Supabase project URL like https://<project-ref>.supabase.co`,
    )
  }

  return { url, anonKey, serviceRoleKey }
}
