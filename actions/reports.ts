"use server"

import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export type ReportPeriod = "3m" | "6m" | "12m"

export interface MonthlyReportData {
  month: string
  depots: number
  retraits: number
  soldeNet: number
}

export interface ZoneReportData {
  zone: string
  clients: number
  carnets: number
  epargne: number
  collecteurs: number
}

export interface ReportStats {
  monthlyReport: MonthlyReportData[]
  zoneReport: ZoneReportData[]
  totalDeposits: number
  totalWithdrawals: number
  netBalance: number
  activeClients: number
  activeCarnets: number
  averageDeposit: number
  averageWithdrawal: number
  periodLabel: string
}

const periodToMonths: Record<ReportPeriod, number> = {
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

export async function getReportsDataAction(period: ReportPeriod = "6m"): Promise<ActionResult<ReportStats>> {
  try {
    const adminClient = createAdminClient()
    const monthCount = periodToMonths[period] ?? 6
    const now = new Date()
    const rangeStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1))

    const [
      cotisationsRes,
      withdrawalsRes,
      zonesRes,
      clientsRes,
      carnetsRes,
      zoneUsersRes,
      activeClientsCountRes,
      activeCarnetsCountRes,
    ] = await Promise.all([
      adminClient
        .from("cotisation")
        .select("id, carnet_id, amount, cotisation_date, currency")
        .gte("cotisation_date", rangeStart.toISOString())
        .order("cotisation_date", { ascending: true }),
      adminClient
        .from("withdrawal")
        .select("id, carnet_id, amount, withdrawal_date, currency")
        .gte("withdrawal_date", rangeStart.toISOString())
        .order("withdrawal_date", { ascending: true }),
      adminClient.from("zone").select("id, name"),
      adminClient.from("client").select("id, zone_id, code").is("deleted_at", null),
      adminClient.from("carnet").select("id, client_code, is_archived").order("created_at", { ascending: false }),
      adminClient.from("zone_user").select("zone_id, user_id").is("unassigned_at", null),
      adminClient
        .from("client")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", 1),
      adminClient
        .from("carnet")
        .select("id", { count: "exact", head: true })
        .eq("is_archived", false),
    ])

    if (cotisationsRes.error) throw cotisationsRes.error
    if (withdrawalsRes.error) throw withdrawalsRes.error
    if (zonesRes.error) throw zonesRes.error
    if (clientsRes.error) throw clientsRes.error
    if (carnetsRes.error) throw carnetsRes.error
    if (zoneUsersRes.error) throw zoneUsersRes.error

    const cotisations = cotisationsRes.data ?? []
    const withdrawals = withdrawalsRes.data ?? []
    const zones = zonesRes.data ?? []
    const clients = clientsRes.data ?? []
    const carnets = carnetsRes.data ?? []
    const zoneUsers = zoneUsersRes.data ?? []

    const monthBuckets = new Map<string, MonthlyReportData>()
    for (let i = 0; i < monthCount; i += 1) {
      const date = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + i, 1)
      monthBuckets.set(monthKey(date), {
        month: monthLabel(date),
        depots: 0,
        retraits: 0,
        soldeNet: 0,
      })
    }

    cotisations.forEach((item) => {
      const date = new Date(item.cotisation_date)
      const key = monthKey(date)
      const bucket = monthBuckets.get(key)
      if (!bucket) return
      bucket.depots += Number(item.amount ?? 0)
      bucket.soldeNet += Number(item.amount ?? 0)
    })

    withdrawals.forEach((item) => {
      const date = new Date(item.withdrawal_date)
      const key = monthKey(date)
      const bucket = monthBuckets.get(key)
      if (!bucket) return
      bucket.retraits += Number(item.amount ?? 0)
      bucket.soldeNet -= Number(item.amount ?? 0)
    })

    const carnetToClientCode = new Map(
      carnets.map((item) => [item.id, item.client_code]),
    )
    const clientToZoneId = new Map(
      clients.map((item) => [item.code, item.zone_id]),
    )

    const zoneSavings = new Map<string, number>()
    cotisations.forEach((item) => {
      const clientCode = carnetToClientCode.get(item.carnet_id)
      if (!clientCode) return
      const zoneId = clientToZoneId.get(clientCode)
      if (!zoneId) return

      zoneSavings.set(zoneId, (zoneSavings.get(zoneId) ?? 0) + Number(item.amount ?? 0))
    })

    const zoneReport: ZoneReportData[] = zones.map((zone) => {
      const clientsInZone = clients.filter((item) => item.zone_id === zone.id)
      const clientCodes = new Set(clientsInZone.map((item) => item.code))
      const activeCarnetsInZone = carnets.filter(
        (item) => item.client_code && clientCodes.has(item.client_code) && !item.is_archived,
      )
      const collectors = new Set(
        zoneUsers.filter((item) => item.zone_id === zone.id).map((item) => item.user_id),
      )

      return {
        zone: zone.name,
        clients: clientsInZone.length,
        carnets: activeCarnetsInZone.length,
        epargne: Math.round(zoneSavings.get(zone.id) ?? 0),
        collecteurs: collectors.size,
      }
    })

    const totalDeposits = Math.round(
      cotisations.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    )
    const totalWithdrawals = Math.round(
      withdrawals.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    )
    const monthlyReport = [...monthBuckets.values()].map((item) => ({
      ...item,
      depots: Math.round(item.depots),
      retraits: Math.round(item.retraits),
      soldeNet: Math.round(item.soldeNet),
    }))

    return {
      success: true,
      data: {
        monthlyReport,
        zoneReport,
        totalDeposits,
        totalWithdrawals,
        netBalance: totalDeposits - totalWithdrawals,
        activeClients: activeClientsCountRes.count ?? 0,
        activeCarnets: activeCarnetsCountRes.count ?? 0,
        averageDeposit: cotisations.length > 0 ? Math.round(totalDeposits / cotisations.length) : 0,
        averageWithdrawal: withdrawals.length > 0 ? Math.round(totalWithdrawals / withdrawals.length) : 0,
        periodLabel:
          period === "3m" ? "3 derniers mois" : period === "12m" ? "12 derniers mois" : "6 derniers mois",
      },
    }
  } catch (error) {
    console.error("getReportsDataAction error:", error)
    const message = error instanceof Error ? error.message : "Erreur lors de la recuperation des rapports"
    return { success: false, error: message }
  }
}
