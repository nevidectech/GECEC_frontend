"use client"

import { useCallback, useEffect, useState } from "react"
import type { GlobalVariable } from "@/types/db"
import {
  createGlobalVariableAction,
  deleteGlobalVariableAction,
  listGlobalVariablesAction,
  updateGlobalVariableAction,
} from "@/actions/global-variables"

type GlobalVariableInput = {
  group: string
  key: string
  value: string
  description?: string
}

export function useGlobalVariables() {
  const [variables, setVariables] = useState<GlobalVariable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await listGlobalVariablesAction()
    if (!result.success) {
      setVariables([])
      setError(result.error ?? "Impossible de charger les variables globales")
    } else {
      setVariables(result.data ?? [])
    }

    setLoading(false)
  }, [])

  const createVariable = useCallback(
    async (payload: GlobalVariableInput) => {
      const result = await createGlobalVariableAction(payload)
      if (!result.success) {
        setError(result.error ?? "Impossible de creer la variable globale")
        return result
      }

      await refetch()
      return result
    },
    [refetch],
  )

  const updateVariable = useCallback(
    async (id: string, payload: GlobalVariableInput) => {
      const previous = variables
      setVariables((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                group: payload.group,
                key: payload.key,
                value: payload.value,
                description: payload.description?.trim() || null,
              }
            : item,
        ),
      )

      const result = await updateGlobalVariableAction({ id, ...payload })
      if (!result.success) {
        setVariables(previous)
        setError(result.error ?? "Impossible de modifier la variable globale")
        return result
      }

      return result
    },
    [variables],
  )

  const deleteVariable = useCallback(
    async (id: string) => {
      const previous = variables
      setVariables((current) => current.filter((item) => item.id !== id))

      const result = await deleteGlobalVariableAction({ id })
      if (!result.success) {
        setVariables(previous)
        setError(result.error ?? "Impossible de supprimer la variable globale")
        return result
      }

      return result
    },
    [variables],
  )

  useEffect(() => {
    void refetch()
  }, [refetch])

  return {
    variables,
    loading,
    error,
    createVariable,
    updateVariable,
    deleteVariable,
    refetch,
  }
}
