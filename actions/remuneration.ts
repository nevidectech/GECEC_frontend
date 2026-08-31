"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient as createServerClient } from "@/lib/supabase/server"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export type RemunerationStatus = "a_verser" | "verser"

type CollectorRemunerationRow = {
  remunerationId: string | null
  collectorId: string
  collectorName: string
  carnetCount: number
  totalInitialAmountFc: number
  totalInitialAmountUsd: number
  remunerationAmountFc: number
  remunerationAmountUsd: number
  status: RemunerationStatus
}

type RemunerationBase = {
  periodLabel: string
  periodMonth: string
  appliedRatePercent: number
  eligibleCarnets: number
  totals: {
    totalInitialAmountFc: number
    totalInitialAmountUsd: number
    totalRemunerationFc: number
    totalRemunerationUsd: number
  }
  chart: Array<{
    month: string
    montantFc: number
    montantUsd: number
  }>
  collectors: Omit<CollectorRemunerationRow, "remunerationId" | "status">[]
}

export type RemunerationOverview = Omit<RemunerationBase, "collectors"> & {
  collectors: CollectorRemunerationRow[]
}

export type CollectorCarnetRemunerationDetail = {
  carnetId: string
  carnetNumber: string
  clientCode: string
  createdAt: string | null
  currency: number
  initialAmount: number
  remunerationAmountFc: number
  remunerationAmountUsd: number
}

async function assertAuthenticated() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Utilisateur non authentifie")
  }
}

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

function monthLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
}

function normalizePeriodMonth(periodMonth?: string) {
  const now = new Date()
  const monthDate = periodMonth ? new Date(`${periodMonth}-01T00:00:00Z`) : now
  const year = monthDate.getUTCFullYear()
  const month = monthDate.getUTCMonth()
  return {
    monthDate,
    year,
    month,
    normalized: `${year}-${String(month + 1).padStart(2, "0")}`,
  }
}

async function resolveRatePercent(adminClient: ReturnType<typeof createAdminClient>) {
  const { data: globalVars } = await adminClient
    .from("global_variable")
    .select("group, key, value")
    .or("group.ilike.%remuner%,key.ilike.%remuner%,key.ilike.%collect%")

  const candidateKeys = [
    "collecteur_remuneration_rate",
    "collector_remuneration_rate",
    "remuneration_collecteur_percent",
    "remuneration_collecteur_rate",
    "taux_remuneration_collecteur",
    "remuneration_rate",
  ]

  for (const key of candidateKeys) {
    const row = (globalVars ?? []).find((item: any) => String(item.key || "").toLowerCase() === key)
    const parsed = parsePercent(row?.value)
    if (parsed !== null) return parsed
  }

  const firstNumeric = (globalVars ?? [])
    .map((item: any) => parsePercent(item.value))
    .find((value) => value !== null)

  return firstNumeric ?? 40
}

async function computeRemunerationBase(periodMonth?: string): Promise<RemunerationBase> {
  const adminClient = createAdminClient()
  const { monthDate, year, month, normalized } = normalizePeriodMonth(periodMonth)

  const endCurrentMonth = lastDay(year, month)
  const startPreviousMonth = firstDay(year, month - 1)

  const [ratePercent, collectorsRes, carnetsRes] = await Promise.all([
    resolveRatePercent(adminClient),
    adminClient
      .from("user_profile")
      .select("user_id, username, email")
      .in("function", ["collector", "collecteur"])
      .eq("is_active", true),
    adminClient
      .from("carnet")
      .select("id, initial_amount, currency, created_at, created_by")
      .gte("created_at", startPreviousMonth.toISOString())
      .lte("created_at", endCurrentMonth.toISOString())
      .eq("is_archived", false),
  ])

  const collectors = collectorsRes.data ?? []
  const carnets = carnetsRes.data ?? []

  const collectorsMap = new Map<string, string>()
  for (const collector of collectors) {
    collectorsMap.set(collector.user_id, collector.username || collector.email || collector.user_id)
  }

  const collectorsAgg = new Map<string, {
    carnetCount: number
    totalInitialAmountFc: number
    totalInitialAmountUsd: number
  }>()

  for (const carnet of carnets) {
    const collectorId = String((carnet as any).created_by || "")
    if (!collectorId) continue

    const current = collectorsAgg.get(collectorId) ?? {
      carnetCount: 0,
      totalInitialAmountFc: 0,
      totalInitialAmountUsd: 0,
    }

    current.carnetCount += 1

    if (((carnet as any).currency ?? 1) === 2) {
      current.totalInitialAmountUsd += Number((carnet as any).initial_amount ?? 0)
    } else {
      current.totalInitialAmountFc += Number((carnet as any).initial_amount ?? 0)
    }

    collectorsAgg.set(collectorId, current)
  }

  const activeCollectorIds = new Set(collectorsMap.keys())

  const collectorsRows = Array.from(collectorsAgg.entries())
    .filter(([collectorId]) => activeCollectorIds.has(collectorId))
    .map(([collectorId, value]) => ({
    collectorId,
    collectorName: collectorsMap.get(collectorId) ?? collectorId,
    carnetCount: value.carnetCount,
    totalInitialAmountFc: Math.round(value.totalInitialAmountFc),
    totalInitialAmountUsd: Number(value.totalInitialAmountUsd.toFixed(2)),
    remunerationAmountFc: Math.round((value.totalInitialAmountFc * ratePercent) / 100),
    remunerationAmountUsd: Number(((value.totalInitialAmountUsd * ratePercent) / 100).toFixed(2)),
  }))

  collectorsRows.sort((a, b) => {
    const aTotal = a.remunerationAmountFc + a.remunerationAmountUsd
    const bTotal = b.remunerationAmountFc + b.remunerationAmountUsd
    return bTotal - aTotal
  })

  const totalInitialAmountFc = collectorsRows.reduce((sum, row) => sum + row.totalInitialAmountFc, 0)
  const totalInitialAmountUsd = Number(
    collectorsRows.reduce((sum, row) => sum + row.totalInitialAmountUsd, 0).toFixed(2),
  )
  const totalRemunerationFc = collectorsRows.reduce((sum, row) => sum + row.remunerationAmountFc, 0)
  const totalRemunerationUsd = Number(
    collectorsRows.reduce((sum, row) => sum + row.remunerationAmountUsd, 0).toFixed(2),
  )

  const chart: Array<{ month: string; montantFc: number; montantUsd: number }> = []
  for (let i = 5; i >= 0; i -= 1) {
    const cursor = new Date(Date.UTC(year, month - i, 1))
    const cYear = cursor.getUTCFullYear()
    const cMonth = cursor.getUTCMonth()
    const start = firstDay(cYear, cMonth)
    const end = lastDay(cYear, cMonth)

    const monthly = carnets.filter((item: any) => {
      if (!item.created_at) return false
      const date = new Date(item.created_at)
      return date >= start && date <= end
    })

    const monthlyInitialFc = monthly
      .filter((item: any) => (item.currency ?? 1) !== 2)
      .reduce((sum: number, item: any) => sum + Number(item.initial_amount ?? 0), 0)

    const monthlyInitialUsd = monthly
      .filter((item: any) => (item.currency ?? 1) === 2)
      .reduce((sum: number, item: any) => sum + Number(item.initial_amount ?? 0), 0)

    chart.push({
      month: monthLabel(cursor),
      montantFc: Math.round((monthlyInitialFc * ratePercent) / 100),
      montantUsd: Number(((monthlyInitialUsd * ratePercent) / 100).toFixed(2)),
    })
  }

  return {
    periodLabel: monthDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    periodMonth: normalized,
    appliedRatePercent: ratePercent,
    eligibleCarnets: collectorsRows.reduce((sum, row) => sum + row.carnetCount, 0),
    totals: {
      totalInitialAmountFc,
      totalInitialAmountUsd,
      totalRemunerationFc,
      totalRemunerationUsd,
    },
    chart,
    collectors: collectorsRows,
  }
}

async function fetchRemunerationRecords(periodMonth: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from("collector_remuneration" as any)
    .select("id, collector_id, status")
    .eq("period_month", periodMonth)

  if (error) {
    const message = String(error.message || "")
    const code = String((error as any).code || "")
    const isMissingSchemaObject =
      /does not exist|schema cache|could not find the table|relation .*collector_remuneration|column .* does not exist/i.test(
        message,
      ) ||
      ["PGRST205", "42P01", "42703"].includes(code)

    if (isMissingSchemaObject) {
      return { rows: [], tableMissing: true }
    }

    // Do not block page rendering if persisted remunerations are temporarily unavailable.
    console.warn("fetchRemunerationRecords warning:", { code, message })
    return { rows: [], tableMissing: false }
  }

  return { rows: data ?? [], tableMissing: false }
}

export async function getRemunerationOverviewAction(
  periodMonth?: string,
): Promise<ActionResult<RemunerationOverview>> {
  try {
    await assertAuthenticated()
    const base = await computeRemunerationBase(periodMonth)

    const { rows: savedRows } = await fetchRemunerationRecords(base.periodMonth)
    const savedMap = new Map<string, { id: string; status: RemunerationStatus }>()

    for (const row of savedRows as any[]) {
      const rawStatus = String(row.status || "a_verser")
      const status: RemunerationStatus = rawStatus === "verser" ? "verser" : "a_verser"
      savedMap.set(String(row.collector_id), { id: String(row.id), status })
    }

    const collectors: CollectorRemunerationRow[] = base.collectors.map((collector) => {
      const persisted = savedMap.get(collector.collectorId)
      return {
        ...collector,
        remunerationId: persisted?.id ?? null,
        status: persisted?.status ?? "a_verser",
      }
    })

    return {
      success: true,
      data: {
        ...base,
        collectors,
      },
    }
  } catch (error) {
    console.error("getRemunerationOverviewAction error:", error)
    const message = error instanceof Error ? error.message : "Erreur lors du calcul de la remuneration"
    return { success: false, error: message }
  }
}

export async function createRemunerationsForPeriodAction(
  periodMonth?: string,
): Promise<ActionResult<{ created: number; updated: number }>> {
  try {
    await assertAuthenticated()
    const base = await computeRemunerationBase(periodMonth)
    const adminClient = createAdminClient()

    const payload = base.collectors.map((item) => ({
      collector_id: item.collectorId,
      period_month: base.periodMonth,
      amount_fc: item.remunerationAmountFc,
      amount_usd: item.remunerationAmountUsd,
      base_amount_fc: item.totalInitialAmountFc,
      base_amount_usd: item.totalInitialAmountUsd,
      rate_percent: base.appliedRatePercent,
      status: "a_verser",
    }))

    if (payload.length === 0) {
      return { success: true, data: { created: 0, updated: 0 } }
    }

    const { data: existingRows, error: existingError } = await adminClient
      .from("collector_remuneration" as any)
      .select("id, collector_id")
      .eq("period_month", base.periodMonth)

    if (existingError) {
      const message = String(existingError.message || "")
      const code = String((existingError as any).code || "")

      if (/does not exist|could not find the table|schema cache|relation .*collector_remuneration/i.test(message) || ["PGRST205", "42P01"].includes(code)) {
        return {
          success: false,
          error: "La table collector_remuneration est introuvable. Creez-la pour activer la creation de remuneration.",
        }
      }

      if (/column .* does not exist/i.test(message) || code === "42703") {
        return {
          success: false,
          error: "Structure collector_remuneration incomplete (colonnes manquantes).",
        }
      }

      return { success: false, error: message }
    }

    const existingMap = new Map(
      (existingRows ?? []).map((row: any) => [String(row.collector_id), String(row.id)]),
    )

    let created = 0
    let updated = 0

    for (const item of payload) {
      const existingId = existingMap.get(item.collector_id)

      if (existingId) {
        const { error: updateError } = await adminClient
          .from("collector_remuneration" as any)
          .update({
            amount_fc: item.amount_fc,
            amount_usd: item.amount_usd,
            base_amount_fc: item.base_amount_fc,
            base_amount_usd: item.base_amount_usd,
            rate_percent: item.rate_percent,
            status: item.status,
          })
          .eq("id", existingId)

        if (updateError) {
          const message = String(updateError.message || "")
          const code = String((updateError as any).code || "")

          if (/column .* does not exist/i.test(message) || code === "42703") {
            return {
              success: false,
              error: "Structure collector_remuneration incomplete (colonnes manquantes).",
            }
          }

          if (/invalid input value for enum|violates check constraint/i.test(message) || code === "22P02") {
            return {
              success: false,
              error: "Valeur de statut invalide en base. Verifiez que le statut accepte: a_verser, verser.",
            }
          }

          return { success: false, error: `Echec mise a jour remuneration (${item.collector_id}): ${updateError.message}` }
        }

        updated += 1
        continue
      }

      const { error: insertError } = await adminClient
        .from("collector_remuneration" as any)
        .insert(item)

      if (insertError) {
        const message = String(insertError.message || "")
        const code = String((insertError as any).code || "")

        if (/column .* does not exist/i.test(message) || code === "42703") {
          return {
            success: false,
            error: "Structure collector_remuneration incomplete (colonnes manquantes).",
          }
        }

        if (/invalid input value for enum|violates check constraint/i.test(message) || code === "22P02") {
          return {
            success: false,
            error: "Valeur de statut invalide en base. Verifiez que le statut accepte: a_verser, verser.",
          }
        }

        return { success: false, error: `Echec creation remuneration (${item.collector_id}): ${insertError.message}` }
      }

      created += 1
    }

    return { success: true, data: { created, updated } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la creation des remunerations"
    return { success: false, error: message }
  }
}

export async function updateRemunerationStatusAction(input: {
  remunerationId?: string | null
  collectorId: string
  periodMonth: string
  status: RemunerationStatus
}): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAuthenticated()
    const adminClient = createAdminClient()

    const { remunerationId, collectorId, periodMonth, status } = input

    if (remunerationId) {
      const { data, error } = await adminClient
        .from("collector_remuneration" as any)
        .update({ status })
        .eq("id", remunerationId)
        .select("id")

      if (error) return { success: false, error: error.message }
      if (!data || (data as any[]).length === 0) {
        return {
          success: false,
          error: "Aucune remuneration trouvee pour cette ligne.",
        }
      }

      return { success: true, data: { id: String((data as any[])[0].id) } }
    }

    const { data, error } = await adminClient
      .from("collector_remuneration" as any)
      .update({ status })
      .eq("collector_id", collectorId)
      .eq("period_month", periodMonth)
      .select("id")

    if (error) {
      if (/does not exist/i.test(error.message)) {
        return {
          success: false,
          error: "La table collector_remuneration est introuvable. Creez-la pour gerer le statut.",
        }
      }
      return { success: false, error: error.message }
    }

    if (!data || (data as any[]).length === 0) {
      return {
        success: false,
        error: "Aucune remuneration trouvee. Lancez d'abord la creation des remunerations.",
      }
    }

    return { success: true, data: { id: String((data as any[])[0].id) } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la mise a jour du statut"
    return { success: false, error: message }
  }
}

export async function getCollectorCarnetRemunerationDetailsAction(input: {
  collectorId: string
  periodMonth: string
}): Promise<ActionResult<CollectorCarnetRemunerationDetail[]>> {
  try {
    await assertAuthenticated()
    const adminClient = createAdminClient()
    const ratePercent = await resolveRatePercent(adminClient)

    const { year, month } = normalizePeriodMonth(input.periodMonth)
    const startPreviousMonth = firstDay(year, month - 1)
    const endCurrentMonth = lastDay(year, month)

    const { data, error } = await adminClient
      .from("carnet")
      .select("id, number, client_code, created_at, initial_amount, currency")
      .eq("created_by", input.collectorId)
      .gte("created_at", startPreviousMonth.toISOString())
      .lte("created_at", endCurrentMonth.toISOString())
      .eq("is_archived", false)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const details: CollectorCarnetRemunerationDetail[] = (data ?? []).map((item: any) => {
      const isUsd = (item.currency ?? 1) === 2
      const initialAmount = Number(item.initial_amount ?? 0)
      return {
        carnetId: String(item.id),
        carnetNumber: String(item.number ?? item.id),
        clientCode: String(item.client_code ?? "-"),
        createdAt: item.created_at ?? null,
        currency: Number(item.currency ?? 1),
        initialAmount,
        remunerationAmountFc: isUsd ? 0 : Math.round((initialAmount * ratePercent) / 100),
        remunerationAmountUsd: isUsd ? Number(((initialAmount * ratePercent) / 100).toFixed(2)) : 0,
      }
    })

    return { success: true, data: details }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors du chargement du detail par carnet"
    return { success: false, error: message }
  }
}
