"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Cotisation, Carnet, Profile } from "@/types/db"

type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string
  count?: number
}

export type CotisationWithDetails = Cotisation & {
  carnet: Pick<Carnet, "number" | "client_code">
  collector: Pick<Profile, "username" | "email">
}

export async function listCotisationsAction({
  date,
  carnetNumber,
  collectorId,
  page = 1,
  pageSize = 10,
}: {
  date?: string
  carnetNumber?: string
  collectorId?: string
  page?: number
  pageSize?: number
}): Promise<ActionResult<CotisationWithDetails[]>> {
  try {
    const adminClient = createAdminClient()
    
    let query = adminClient
      .from("cotisation")
      .select(`
        *,
        carnet:carnet_id${carnetNumber ? "!inner" : ""}(number, client_code)
      `, { count: "exact" })

    if (date) {
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`
      query = query.gte("cotisation_date", startOfDay).lte("cotisation_date", endOfDay)
    }

    if (collectorId && collectorId !== "all") {
      query = query.eq("created_by", collectorId)
    }

    if (carnetNumber) {
      query = query.ilike("carnet.number", `%${carnetNumber}%`)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await query
      .order("cotisation_date", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching cotisations:", error)
      return { success: false, error: error.message }
    }

    // Manual join for collector profiles
    const collectorIds = [...new Set((data ?? []).map((c: any) => c.created_by).filter(Boolean))]
    let profileMap: Record<string, { username: string | null; email: string | null }> = {}
    
    if (collectorIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("user_profile")
        .select("user_id, username, email")
        .in("user_id", collectorIds)
      
      profileMap = Object.fromEntries(
        (profiles ?? []).map(p => [p.user_id, { username: p.username, email: p.email }])
      )
    }

    const cotisationsWithDetails = (data ?? []).map((c: any) => ({
      ...c,
      collector: profileMap[c.created_by] || { username: null, email: null }
    }))

    return {
      success: true,
      data: cotisationsWithDetails as unknown as CotisationWithDetails[],
      count: count || 0,
    }
  } catch (error) {
    console.error("Unexpected error in listCotisationsAction:", error)
    return { success: false, error: "Une erreur inattendue est survenue" }
  }
}

export async function getCotisationsSummaryAction({
  date,
  carnetNumber,
  collectorId,
}: {
  date?: string
  carnetNumber?: string
  collectorId?: string
}): Promise<ActionResult<{ totalCdf: number; totalUsd: number }>> {
  try {
    const adminClient = createAdminClient()
    
    let query = adminClient
      .from("cotisation")
      .select(`
        amount,
        currency,
        carnet:carnet_id${carnetNumber ? "!inner" : ""}(number)
      `)

    if (date) {
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`
      query = query.gte("cotisation_date", startOfDay).lte("cotisation_date", endOfDay)
    }

    if (collectorId && collectorId !== "all") {
      query = query.eq("created_by", collectorId)
    }

    if (carnetNumber) {
      query = query.ilike("carnet.number", `%${carnetNumber}%`)
    }

    const { data, error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    const totals = (data || []).reduce(
      (acc, item: any) => {
        if (item.currency === 1) acc.totalCdf += item.amount
        if (item.currency === 2) acc.totalUsd += item.amount
        return acc
      },
      { totalCdf: 0, totalUsd: 0 }
    )

    return { success: true, data: totals }
  } catch (error) {
    return { success: false, error: "Une erreur inattendue est survenue" }
  }
}
