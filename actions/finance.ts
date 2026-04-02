"use server"

import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export type FinancePeriod = "3m" | "6m" | "12m"

export interface FinancePeriodRow {
  key: string
  label: string
  totalInitialCdf: number
  totalInitialUsd: number
  totalCarnetCdf: number
  totalCarnetUsd: number
  totalDuplicataCdf: number
  totalDuplicataUsd: number
  totalCdf: number
  totalUsd: number
}

export interface FinanceStats {
  periodLabel: string
  selectedYear: number
  availableYears: number[]
  chart: Array<{
    label: string
    gainCdf: number
    gainUsd: number
  }>
  rows: FinancePeriodRow[]
  totals: {
    totalInitialCdf: number
    totalInitialUsd: number
    totalCarnetCdf: number
    totalCarnetUsd: number
    totalDuplicataCdf: number
    totalDuplicataUsd: number
    totalCdf: number
    totalUsd: number
  }
}

const periodToMonths: Record<FinancePeriod, number> = {
  "3m": 3,
  "6m": 6,
  "12m": 12,
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
}

function buildEmptyRow(date: Date): FinancePeriodRow {
  return {
    key: monthKey(date),
    label: monthLabel(date),
    totalInitialCdf: 0,
    totalInitialUsd: 0,
    totalCarnetCdf: 0,
    totalCarnetUsd: 0,
    totalDuplicataCdf: 0,
    totalDuplicataUsd: 0,
    totalCdf: 0,
    totalUsd: 0,
  }
}

export async function getFinanceDataAction(
  period: FinancePeriod = "6m",
  year?: number,
): Promise<ActionResult<FinanceStats>> {
  try {
    const adminClient = createAdminClient()
    const monthCount = periodToMonths[period] ?? 6
    const now = new Date()
    const selectedYear = year ?? now.getFullYear()
    const cappedEndMonth =
      selectedYear >= now.getFullYear() ? now.getMonth() : 11
    const startMonthIndex = Math.max(0, cappedEndMonth - (monthCount - 1))
    const rangeStart = startOfMonth(new Date(selectedYear, startMonthIndex, 1))

    const [carnetsRes, duplicatasRes, firstCarnetRes, firstDuplicataRes] = await Promise.all([
      adminClient
        .from("carnet")
        .select("initial_amount, price, currency, created_at")
        .gte("created_at", rangeStart.toISOString())
        .lt("created_at", new Date(selectedYear, cappedEndMonth + 1, 1).toISOString())
        .order("created_at", { ascending: true }),
      adminClient
        .from("carnet_duplicate")
        .select("price, currency, created_at")
        .gte("created_at", rangeStart.toISOString())
        .lt("created_at", new Date(selectedYear, cappedEndMonth + 1, 1).toISOString())
        .order("created_at", { ascending: true }),
      adminClient
        .from("carnet")
        .select("created_at")
        .not("created_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      adminClient
        .from("carnet_duplicate")
        .select("created_at")
        .not("created_at", "is", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ])

    if (carnetsRes.error) throw carnetsRes.error
    if (duplicatasRes.error) throw duplicatasRes.error

    const bucketMap = new Map<string, FinancePeriodRow>()
    const displayedMonthCount = cappedEndMonth - startMonthIndex + 1
    for (let i = 0; i < displayedMonthCount; i += 1) {
      const date = new Date(selectedYear, startMonthIndex + i, 1)
      const row = buildEmptyRow(date)
      bucketMap.set(row.key, row)
    }

    ;(carnetsRes.data ?? []).forEach((item) => {
      if (!item.created_at) return
      const key = monthKey(new Date(item.created_at))
      const bucket = bucketMap.get(key)
      if (!bucket) return

      const initial = Number(item.initial_amount ?? 0)
      const price = Number(item.price ?? 0)
      const currency = item.currency ?? 1

      if (currency === 2) {
        bucket.totalInitialUsd += initial
        bucket.totalCarnetUsd += price
      } else {
        bucket.totalInitialCdf += initial
        bucket.totalCarnetCdf += price
      }
    })

    ;(duplicatasRes.data ?? []).forEach((item) => {
      if (!item.created_at) return
      const key = monthKey(new Date(item.created_at))
      const bucket = bucketMap.get(key)
      if (!bucket) return

      const price = Number(item.price ?? 0)
      const currency = item.currency ?? 1

      if (currency === 2) {
        bucket.totalDuplicataUsd += price
      } else {
        bucket.totalDuplicataCdf += price
      }
    })

    const rows = [...bucketMap.values()].map((row) => ({
      ...row,
      totalCdf: Math.round(row.totalInitialCdf + row.totalCarnetCdf + row.totalDuplicataCdf),
      totalUsd: Math.round((row.totalInitialUsd + row.totalCarnetUsd + row.totalDuplicataUsd) * 100) / 100,
      totalInitialCdf: Math.round(row.totalInitialCdf),
      totalInitialUsd: Math.round(row.totalInitialUsd * 100) / 100,
      totalCarnetCdf: Math.round(row.totalCarnetCdf),
      totalCarnetUsd: Math.round(row.totalCarnetUsd * 100) / 100,
      totalDuplicataCdf: Math.round(row.totalDuplicataCdf),
      totalDuplicataUsd: Math.round(row.totalDuplicataUsd * 100) / 100,
    }))

    const totals = rows.reduce(
      (acc, row) => {
        acc.totalInitialCdf += row.totalInitialCdf
        acc.totalInitialUsd += row.totalInitialUsd
        acc.totalCarnetCdf += row.totalCarnetCdf
        acc.totalCarnetUsd += row.totalCarnetUsd
        acc.totalDuplicataCdf += row.totalDuplicataCdf
        acc.totalDuplicataUsd += row.totalDuplicataUsd
        acc.totalCdf += row.totalCdf
        acc.totalUsd += row.totalUsd
        return acc
      },
      {
        totalInitialCdf: 0,
        totalInitialUsd: 0,
        totalCarnetCdf: 0,
        totalCarnetUsd: 0,
        totalDuplicataCdf: 0,
        totalDuplicataUsd: 0,
        totalCdf: 0,
        totalUsd: 0,
      },
    )

    return {
      success: true,
      data: {
        periodLabel:
          period === "3m" ? "3 derniers mois" : period === "12m" ? "12 derniers mois" : "6 derniers mois",
        selectedYear,
        availableYears: (() => {
          const oldestCarnetYear = firstCarnetRes.data?.created_at ? new Date(firstCarnetRes.data.created_at).getFullYear() : selectedYear
          const oldestDuplicataYear = firstDuplicataRes.data?.created_at ? new Date(firstDuplicataRes.data.created_at).getFullYear() : selectedYear
          const startYear = Math.min(oldestCarnetYear, oldestDuplicataYear, selectedYear)
          const years: number[] = []
          for (let current = now.getFullYear(); current >= startYear; current -= 1) {
            years.push(current)
          }
          return years
        })(),
        chart: rows.map((row) => ({
          label: row.label,
          gainCdf: row.totalInitialCdf,
          gainUsd: row.totalInitialUsd,
        })),
        rows,
        totals: {
          totalInitialCdf: Math.round(totals.totalInitialCdf),
          totalInitialUsd: Math.round(totals.totalInitialUsd * 100) / 100,
          totalCarnetCdf: Math.round(totals.totalCarnetCdf),
          totalCarnetUsd: Math.round(totals.totalCarnetUsd * 100) / 100,
          totalDuplicataCdf: Math.round(totals.totalDuplicataCdf),
          totalDuplicataUsd: Math.round(totals.totalDuplicataUsd * 100) / 100,
          totalCdf: Math.round(totals.totalCdf),
          totalUsd: Math.round(totals.totalUsd * 100) / 100,
        },
      },
    }
  } catch (error) {
    console.error("getFinanceDataAction error:", error)
    const message = error instanceof Error ? error.message : "Erreur lors de la recuperation des donnees finance"
    return { success: false, error: message }
  }
}
