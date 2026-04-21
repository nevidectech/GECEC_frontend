"use server"

import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Profile } from "@/types/db"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

const createCollectionDepositSchema = z.object({
  collectorId: z.string().uuid("Collecteur invalide"),
  date: z.string().min(1, "Date requise"),
  amountCotisation: z.number().min(0),
  amountCarnet: z.number().min(0),
  amountDuplicate: z.number().min(0),
  amountFicheRetrait: z.number().min(0),
  amountCotisationUsd: z.number().min(0),
})

function parsePercent(raw: string | null | undefined): number | null {
  if (!raw) return null
  const cleaned = raw.replace("%", "").replace(",", ".").trim()
  const value = Number.parseFloat(cleaned)
  if (!Number.isFinite(value)) return null
  return value
}

function firstDay(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
}

function lastDay(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
}

async function computeCollectorRemunerationForPeriod(
  adminClient: ReturnType<typeof createAdminClient>,
  collectorId: string,
  date: string,
) {
  const focusDate = new Date(`${date}T00:00:00Z`)
  const year = focusDate.getUTCFullYear()
  const month = focusDate.getUTCMonth()
  const startPreviousMonth = firstDay(year, month - 1)
  const endCurrentMonth = lastDay(year, month)

  const [{ data: variables }, { data: carnets }] = await Promise.all([
    adminClient
      .from("global_variable")
      .select("group, key, value")
      .or("group.ilike.%remuner%,key.ilike.%remuner%,key.ilike.%collect%"),
    adminClient
      .from("carnet")
      .select("initial_amount, currency")
      .eq("created_by", collectorId)
      .gte("created_at", startPreviousMonth.toISOString())
      .lte("created_at", endCurrentMonth.toISOString())
      .eq("is_archived", false),
  ])

  const candidateKeys = [
    "collecteur_remuneration_rate",
    "collector_remuneration_rate",
    "remuneration_collecteur_percent",
    "remuneration_collecteur_rate",
    "taux_remuneration_collecteur",
    "remuneration_rate",
  ]

  let ratePercent: number | null = null
  for (const key of candidateKeys) {
    const row = (variables ?? []).find((item: any) => String(item.key || "").toLowerCase() === key)
    const parsed = parsePercent(row?.value)
    if (parsed !== null) {
      ratePercent = parsed
      break
    }
  }

  if (ratePercent === null) {
    const firstNumeric = (variables ?? [])
      .map((item: any) => parsePercent(item.value))
      .find((value) => value !== null)
    ratePercent = firstNumeric ?? 40
  }

  const totalInitialAmountFc = (carnets ?? [])
    .filter((item: any) => (item.currency || 1) === 1)
    .reduce((sum: number, item: any) => sum + Number(item.initial_amount || 0), 0)

  const totalInitialAmountUsd = (carnets ?? [])
    .filter((item: any) => (item.currency || 1) === 2)
    .reduce((sum: number, item: any) => sum + Number(item.initial_amount || 0), 0)

  const remunerationAmountFc = Math.round((totalInitialAmountFc * ratePercent) / 100)
  const remunerationAmountUsd = Number(((totalInitialAmountUsd * ratePercent) / 100).toFixed(2))

  return {
    ratePercent,
    totalInitialAmountFc: Math.round(totalInitialAmountFc),
    totalInitialAmountUsd: Number(totalInitialAmountUsd.toFixed(2)),
    remunerationAmountFc,
    remunerationAmountUsd,
  }
}

async function getCurrentUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Utilisateur non authentifie")
  }

  return user.id
}

export async function listCollectorsAction(): Promise<ActionResult<Profile[]>> {
  try {
    console.log("listCollectorsAction: Starting...")
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("user_profile")
      .select("*")
      .eq("function", "collector")
      .order("username", { ascending: true })

    if (error) {
      console.error("listCollectorsAction: Supabase error:", error)
      return { success: false, error: error.message }
    }

    console.log(`listCollectorsAction: Found ${data?.length || 0} collectors`)
    return { success: true, data: (data ?? []) as Profile[] }
  } catch (error) {
    console.error("listCollectorsAction: Unexpected error:", error)
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function checkCollectionDepositExistsAction(
  collectorId: string,
  date: string,
): Promise<ActionResult<boolean>> {
  try {
    const adminClient = createAdminClient()

    // Convert date to year-month-day for comparison if necessary
    const searchDate = new Date(date).toISOString().split('T')[0]

    // Note: This assumes a table 'collection_deposit' exists.
    // If it doesn't exist, we might need to use a different approach or 
    // ask the user to create it. For now, following the plan to assume existence.
    const { data, error } = await adminClient
      .from("collection_deposit" as any)
      .select("id")
      .eq("collector_id", collectorId)
      .gte("deposit_date", `${searchDate}T00:00:00`)
      .lte("deposit_date", `${searchDate}T23:59:59`)
      .maybeSingle()

    if (error && error.code !== "PGRST116") { // PGRST116 is 'no rows' for single()
      // If the table doesn't exist, Supabase will return an error.
      // We should handle that gracefully in a real app, but here we follow the request.
      return { success: false, error: error.message }
    }

    return { success: true, data: !!data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function getCollectionStatsAction(
  collectorId: string,
  date: string,
): Promise<ActionResult<{
  amountCotisation: number
  amountCarnet: number
  amountDuplicate: number
  amountFicheRetrait: number
  amountCotisationUsd: number
}>> {
  try {
    const adminClient = createAdminClient()
    const searchDate = new Date(date).toISOString().split('T')[0]
    const startOfDay = `${searchDate}T00:00:00`
    const endOfDay = `${searchDate}T23:59:59`

    // 1. Get Cotisations
    const { data: cotisations, error: cotError } = await adminClient
      .from("cotisation")
      .select("amount, currency")
      .eq("created_by", collectorId)
      .gte("cotisation_date", startOfDay)
      .lte("cotisation_date", endOfDay)

    // 2. Get Carnets
    const { data: carnets, error: carError } = await adminClient
      .from("carnet")
      .select("price, currency")
      .eq("created_by", collectorId)
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)

    // 3. Get Duplicates
    const { data: duplicates, error: dupError } = await adminClient
      .from("carnet_duplicate")
      .select("price, currency")
      .eq("created_by", collectorId)
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)

    if (cotError || carError || dupError) {
      return { success: false, error: "Erreur lors de la récupération des statistiques" }
    }

    // Helper to sum by currency
    const sumByCurrency = (items: { amount?: number; price?: number; currency?: number | null }[], targetCurrency: number) => {
      return items
        .filter(item => (item.currency || 1) === targetCurrency)
        .reduce((sum, item) => sum + Number(item.amount || item.price || 0), 0)
    }

    // FC is 1, USD is 2
    const amountCotisation = sumByCurrency(cotisations ?? [], 1)
    const amountCarnet = sumByCurrency(carnets ?? [], 1)
    const amountDuplicate = sumByCurrency(duplicates ?? [], 1)

    const amountCotisationUsd = sumByCurrency(cotisations ?? [], 2)
    const amountCarnetUsd = sumByCurrency(carnets ?? [], 2)
    const amountDuplicateUsd = sumByCurrency(duplicates ?? [], 2)

    return {
      success: true,
      data: {
        amountCotisation,
        amountCarnet,
        amountDuplicate,
        amountFicheRetrait: 0, // Default to 0 as we don't have a source table for this yet
        amountCotisationUsd,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function createCollectionDepositAction(
  input: z.infer<typeof createCollectionDepositSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const currentUserId = await getCurrentUserId()
    const payload = createCollectionDepositSchema.parse(input)
    const adminClient = createAdminClient()

    const remuneration = await computeCollectorRemunerationForPeriod(
      adminClient,
      payload.collectorId,
      payload.date,
    )

    const insertPayload = {
      collector_id: payload.collectorId,
      deposit_date: new Date(payload.date).toISOString(),
      amount_cotisation: payload.amountCotisation,
      amount_carnet: payload.amountCarnet,
      amount_duplicate: payload.amountDuplicate,
      amount_fiche_retrait: payload.amountFicheRetrait,
      amount_cotisation_usd: payload.amountCotisationUsd,
      remuneration_rate: remuneration.ratePercent,
      remuneration_amount: remuneration.remunerationAmountFc,
      remuneration_base_amount: remuneration.totalInitialAmountFc,
      remuneration_amount_usd: remuneration.remunerationAmountUsd,
      remuneration_base_amount_usd: remuneration.totalInitialAmountUsd,
      created_by: currentUserId,
      status: "pending", // Waiting for teller validation
    }

    let { data, error } = await adminClient
      .from("collection_deposit" as any)
      .insert(insertPayload as any)
      .select("id")
      .single()

    if (error && (/column .* does not exist/i.test(error.message) || /schema cache/i.test(error.message))) {
      ;({ data, error } = await adminClient
        .from("collection_deposit" as any)
        .insert({
          collector_id: payload.collectorId,
          deposit_date: new Date(payload.date).toISOString(),
          amount_cotisation: payload.amountCotisation,
          amount_carnet: payload.amountCarnet,
          amount_duplicate: payload.amountDuplicate,
          amount_fiche_retrait: payload.amountFicheRetrait,
          amount_cotisation_usd: payload.amountCotisationUsd,
          created_by: currentUserId,
          status: "pending",
        })
        .select("id")
        .single())
    }

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: (data as any).id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function listCollectionDepositsAction(
  date: string,
): Promise<ActionResult<any[]>> {
  try {
    const adminClient = createAdminClient()
    const searchDate = new Date(date).toISOString().split('T')[0]
    const startOfDay = `${searchDate}T00:00:00`
    const endOfDay = `${searchDate}T23:59:59`
    console.log(`[listCollectionDepositsAction] Fetching for ${startOfDay} to ${endOfDay}`)

    const { data, error } = await adminClient
      .from("collection_deposit" as any)
      .select(`
        *,
        collector:user_profile!collector_id(username, email)
      `)
      .gte("deposit_date", startOfDay)
      .lte("deposit_date", endOfDay)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[listCollectionDepositsAction] Error:", error)
      if (error.code === "PGRST116" || error.message.includes("does not exist")) {
        return { success: true, data: [] }
      }
      return { success: false, error: error.message }
    }

    console.log(`[listCollectionDepositsAction] Found ${data?.length || 0} items`)

    return { success: true, data: data ?? [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}
