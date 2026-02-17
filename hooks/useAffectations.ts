"use client"

import { useCallback, useEffect, useState } from "react"
import type { ZoneUser } from "@/types/db"
import {
  createAffectationAction,
  listAffectationsAction,
  unassignAffectationAction,
  updateAffectationAction,
} from "@/actions/affectations"

type AffectationInput = {
  zoneId: string
  userId: string
}

export function useAffectations() {
  const [affectations, setAffectations] = useState<ZoneUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await listAffectationsAction()
    if (!result.success) {
      setAffectations([])
      setError(result.error ?? "Impossible de charger les affectations")
    } else {
      setAffectations(result.data ?? [])
    }

    setLoading(false)
  }, [])

  const createAffectation = useCallback(
    async (payload: AffectationInput) => {
      const result = await createAffectationAction(payload)
      if (!result.success) {
        setError(result.error ?? "Impossible de creer l'affectation")
        return result
      }

      await refetch()
      return result
    },
    [refetch],
  )

  const updateAffectation = useCallback(
    async (id: string, payload: AffectationInput) => {
      const previous = affectations
      setAffectations((current) =>
        current.map((item) =>
          item.id === id ? { ...item, zone_id: payload.zoneId, user_id: payload.userId } : item,
        ),
      )

      const result = await updateAffectationAction({ id, ...payload })
      if (!result.success) {
        setAffectations(previous)
        setError(result.error ?? "Impossible de modifier l'affectation")
        return result
      }

      return result
    },
    [affectations],
  )

  const unassignAffectation = useCallback(
    async (id: string) => {
      const previous = affectations
      setAffectations((current) => current.filter((item) => item.id !== id))

      const result = await unassignAffectationAction({ id })
      if (!result.success) {
        setAffectations(previous)
        setError(result.error ?? "Impossible de desaffecter")
        return result
      }

      return result
    },
    [affectations],
  )

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    affectations,
    loading,
    error,
    createAffectation,
    updateAffectation,
    unassignAffectation,
    refetch,
  }
}
