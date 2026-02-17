"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Profile, ProfileRole } from "@/types/db"
import { createClient } from "@/lib/supabase/client"
import {
  createUserWithProfileAction,
  updateUserRoleAction,
} from "@/actions/users"

type CreateUserInput = {
  fullName: string
  email: string
  password: string
  username?: string
  role: ProfileRole
}

export function useUsers() {
  const supabase = useMemo(() => createClient(), [])
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("user_profile")
      .select("*")
      .order("created_at", { ascending: false })

    if (fetchError) {
      setUsers([])
      setError(fetchError.message)
    } else {
      setUsers((data ?? []) as Profile[])
    }

    setLoading(false)
  }, [supabase])

  const createUser = useCallback(
    async (payload: CreateUserInput) => {
      const result = await createUserWithProfileAction(payload)
      if (!result.success) {
        setError(result.error ?? "Impossible de creer l'utilisateur")
        return result
      }

      await refetch()
      return result
    },
    [refetch],
  )

  const updateUserRole = useCallback(
    async (id: string, role: ProfileRole) => {
      const previousUsers = users
      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, function: role } : user)),
      )

      const result = await updateUserRoleAction({ id, role })
      if (!result.success) {
        setUsers(previousUsers)
        setError(result.error ?? "Impossible de modifier le role")
        return result
      }

      return result
    },
    [users],
  )

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    users,
    loading,
    error,
    createUser,
    updateUserRole,
    refetch,
  }
}
