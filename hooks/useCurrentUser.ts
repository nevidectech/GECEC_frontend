"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { CurrentUser } from "@/actions/user"

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
          setUser(null)
          setError("Non authentifié")
          setLoading(false)
          return
        }

        // Try to fetch from API route or call the action directly
        const response = await fetch("/api/user/current")
        if (response.ok) {
          const data = await response.json()
          setUser(data.data || null)
        } else {
          // Fallback: create basic user object from auth user
          const email = authUser.email ?? null
          const name = email?.split("@")[0] ?? "Utilisateur"
          setUser({
            id: authUser.id,
            username: name,
            initials: name.substring(0, 2).toUpperCase(),
            email,
            role: "Utilisateur",
            zone: null,
            avatarUrl: null,
          })
        }
      } catch (err) {
        console.error("Error fetching current user:", err)
        setError("Erreur lors de la récupération du profil")
      } finally {
        setLoading(false)
      }
    }

    void fetchUser()

    const handleProfileUpdated = () => {
      void fetchUser()
    }

    window.addEventListener("user-profile-updated", handleProfileUpdated)
    return () => {
      window.removeEventListener("user-profile-updated", handleProfileUpdated)
    }
  }, [])

  return { user, loading, error }
}
