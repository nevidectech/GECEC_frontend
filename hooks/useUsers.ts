"use client"

import { useCallback, useEffect, useState } from "react"
import type { Profile, ProfileRole } from "@/types/db"
import {
  listUsersAction,
  createUserWithProfileAction,
  updateUserDetailsAction,
  updateUserRoleAction,
  toggleUserActiveAction,
} from "@/actions/users"

type CreateUserInput = {
  fullName: string
  email: string
  password: string
  username?: string
  role: ProfileRole
}

type UpdateUserInput = {
  id: string
  userId: string
  username: string
  email: string
  phone?: string | null
  zoneId?: string | null
  role: ProfileRole
  password?: string
}

export function useUsers() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await listUsersAction()
    if (!result.success) {
      setUsers([])
      setError(result.error ?? "Erreur de chargement")
    } else {
      setUsers(result.data ?? [])
    }

    setLoading(false)
  }, [])

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

  const updateUserDetails = useCallback(
    async (payload: UpdateUserInput) => {
      const result = await updateUserDetailsAction(payload)
      if (!result.success) {
        setError(result.error ?? "Impossible de modifier l'utilisateur")
        return result
      }

      await refetch()
      return result
    },
    [refetch],
  )

  const toggleUserActive = useCallback(
    async (userId: string, active: boolean) => {
      const previousUsers = users
      setUsers((current) =>
        current.map((user) =>
          user.user_id === userId ? { ...user, is_active: active } : user,
        ),
      )

      const result = await toggleUserActiveAction({ userId, active })
      if (!result.success) {
        setUsers(previousUsers)
        setError(result.error ?? "Impossible de modifier le statut")
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
    updateUserDetails,
    toggleUserActive,
    refetch,
  }
}
