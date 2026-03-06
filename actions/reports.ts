"use server"

import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

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
}

export async function getReportsDataAction(): Promise<ActionResult<ReportStats>> {
  try {
    const adminClient = createAdminClient()

    // Get monthly data for the last 6 months
    const { data: cotisations, error: cotisationsError } = await adminClient
      .from("cotisation")
      .select("amount, cotisation_date, currency")
      .gte("cotisation_date", new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
      .order("cotisation_date", { ascending: true })

    const { data: withdrawals, error: withdrawalsError } = await adminClient
      .from("withdrawal")
      .select("amount, withdrawal_date, currency")
      .gte("withdrawal_date", new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
      .order("withdrawal_date", { ascending: true })

    // Get all zones with their related data in one query
    const { data: allZones, error: zonesError } = await adminClient
      .from("zone")
      .select("id, name")

    const { data: allClients, error: clientsError } = await adminClient
      .from("client")
      .select("id, zone_id, code")

    const { data: allCarnets, error: carnetsError } = await adminClient
      .from("carnet")
      .select("id, client_code, is_archived")

    const { data: allZoneUsers, error: zoneUsersError } = await adminClient
      .from("zone_user")
      .select("zone_id, user_id")
      .is("unassigned_at", true)

    // Process monthly data
    const monthlyMap = new Map<string, { depots: number; retraits: number }>()

    if (cotisations) {
      cotisations.forEach((cot: any) => {
        const date = new Date(cot.cotisation_date)
        const monthKey = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
        const current = monthlyMap.get(monthKey) || { depots: 0, retraits: 0 }
        current.depots += Number(cot.amount || 0) / 1000 // Convert to thousands
        monthlyMap.set(monthKey, current)
      })
    }

    if (withdrawals) {
      withdrawals.forEach((w: any) => {
        const date = new Date(w.withdrawal_date)
        const monthKey = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
        const current = monthlyMap.get(monthKey) || { depots: 0, retraits: 0 }
        current.retraits += Number(w.amount || 0) / 1000 // Convert to thousands
        monthlyMap.set(monthKey, current)
      })
    }

    const monthlyReport: MonthlyReportData[] = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({
        month,
        depots: Math.round(data.depots),
        retraits: Math.round(data.retraits),
        soldeNet: Math.round(data.depots - data.retraits),
      })
    )

    // Process zone report from fetched data (avoiding nested queries)
    const zoneReport: ZoneReportData[] = []

    if (allZones && Array.isArray(allZones)) {
      for (const zone of allZones) {
        // Count clients in this zone
        const clientsInZone = allClients?.filter((c: any) => c.zone_id === zone.id) || []
        const clientCount = clientsInZone.length

        // Count carnets for clients in this zone
        const clientCodes = clientsInZone.map((c: any) => c.code)
        const carnetsInZone = allCarnets?.filter((cn: any) => clientCodes.includes(cn.client_code) && !cn.is_archived) || []
        const carnetCount = carnetsInZone.length

        // Count unique collectors in this zone
        const collectorsInZone = allZoneUsers?.filter((zu: any) => zu.zone_id === zone.id) || []
        const collectorCount = new Set(collectorsInZone.map((zu: any) => zu.user_id)).size

        // Calculate epargne (sum of cotisations for carnets in this zone)
        let epargneForZone = 0
        const carnetIdsInZone = carnetsInZone.map((cn: any) => cn.id)
        if (cotisations) {
          const cotisationsForZone = cotisations.filter((cot: any) => {
            const carnetForCot = allCarnets?.find((cn: any) => carnetIdsInZone.includes(cn.id))
            return carnetForCot && clientCodes.includes(carnetForCot.client_code)
          })
          epargneForZone = cotisationsForZone.reduce((sum: number, cot: any) => sum + Number(cot.amount || 0), 0)
        }

        zoneReport.push({
          zone: zone.name,
          clients: clientCount,
          carnets: carnetCount,
          epargne: Math.round(epargneForZone),
          collecteurs: collectorCount,
        })
      }
    }

    // Calculate totals
    const totalDeposits = cotisations
      ? Math.round(cotisations.reduce((sum: number, cot: any) => sum + Number(cot.amount || 0), 0))
      : 0

    const totalWithdrawals = withdrawals
      ? Math.round(withdrawals.reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0))
      : 0

    const netBalance = totalDeposits - totalWithdrawals

    // Get active clients and carnets count
    const { count: clientCount } = await adminClient
      .from("client")
      .select("*", { count: "exact", head: true })

    const { count: carnetCount } = await adminClient
      .from("carnet")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false)

    return {
      success: true,
      data: {
        monthlyReport: monthlyReport.slice(-6), // Last 6 months
        zoneReport,
        totalDeposits,
        totalWithdrawals,
        netBalance,
        activeClients: clientCount || 0,
        activeCarnets: carnetCount || 0,
      },
    }
  } catch (error) {
    console.error("getReportsDataAction error:", error)
    const message = error instanceof Error ? error.message : "Erreur lors de la recuperation des rapports"
    return { success: false, error: message }
  }
}
