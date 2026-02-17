"use client"

import { useCallback, useEffect, useState } from "react"
import type { Zone } from "@/types/db"
import {
  createZoneAction,
  deleteZoneAction,
  listZonesAction,
  updateZoneAction,
} from "@/actions/zones"

type ZoneInput = {
  name: string
  code?: string
}

export function useZones() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await listZonesAction()
    if (!result.success) {
      setZones([])
      setError(result.error ?? "Impossible de charger les zones")
    } else {
      setZones(result.data ?? [])
    }

    setLoading(false)
  }, [])

  const createZone = useCallback(
    async (payload: ZoneInput) => {
      const result = await createZoneAction(payload)
      if (!result.success) {
        setError(result.error ?? "Impossible de creer la zone")
        return result
      }

      await refetch()
      return result
    },
    [refetch],
  )

  const updateZone = useCallback(
    async (id: string, payload: ZoneInput) => {
      const previousZones = zones
      setZones((current) =>
        current.map((zone) =>
          zone.id === id ? { ...zone, name: payload.name, code: payload.code?.trim() || null } : zone,
        ),
      )

      const result = await updateZoneAction({ id, ...payload })
      if (!result.success) {
        setZones(previousZones)
        setError(result.error ?? "Impossible de modifier la zone")
        return result
      }

      return result
    },
    [zones],
  )

  const deleteZone = useCallback(
    async (id: string) => {
      const previousZones = zones
      setZones((current) => current.filter((zone) => zone.id !== id))

      const result = await deleteZoneAction({ id })
      if (!result.success) {
        setZones(previousZones)
        setError(result.error ?? "Impossible de supprimer la zone")
        return result
      }

      return result
    },
    [zones],
  )

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    zones,
    loading,
    error,
    createZone,
    updateZone,
    deleteZone,
    refetch,
  }
}
