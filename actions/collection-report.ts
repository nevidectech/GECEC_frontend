"use server"

import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export interface CollectionReportData {
  deposit: any
  cotisations: any[]
  duplicates: any[]
  withdrawals: any[]
}

export async function getCollectionReportDataAction(
  depositId: string,
): Promise<ActionResult<CollectionReportData>> {
  try {
    const adminClient = createAdminClient()

    // 1. Get Deposit Info
    const { data: deposit, error: depError } = await adminClient
      .from("collection_deposit" as any)
      .select(`
        id,
        collector_id,
        deposit_date,
        amount_cotisation,
        amount_carnet,
        amount_duplicate,
        amount_fiche_retrait,
        amount_cotisation_usd,
        created_at,
        status,
        collector:user_profile!collector_id(username, email)
      `)
      .eq("id", depositId)
      .single()

    if (depError) throw new Error(depError.message)
    if (!deposit) throw new Error("Dépôt introuvable")

    const collectorId = deposit.collector_id
    const date = deposit.deposit_date
    const searchDate = new Date(date).toISOString().split('T')[0]
    const startOfDay = `${searchDate}T00:00:00`
    const endOfDay = `${searchDate}T23:59:59`

    // 2. Get Cotisations
    const { data: cotisationsRaw, error: cotError } = await adminClient
      .from("cotisation")
      .select("*, carnet_id")
      .eq("created_by", collectorId)
      .gte("cotisation_date", startOfDay)
      .lte("cotisation_date", endOfDay)

    if (cotError) throw new Error(cotError.message)

    // 3. Get Duplicates
    const { data: duplicatesRaw, error: dupError } = await adminClient
      .from("carnet_duplicate")
      .select("*, original_carnet_id")
      .eq("created_by", collectorId)
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)

    if (dupError) throw new Error(dupError.message)

    // 4. Get Withdrawals
    const { data: withdrawalsRaw, error: witError } = await adminClient
      .from("withdrawal")
      .select("*, carnet_id")
      .eq("created_by", collectorId)
      .gte("withdrawal_date", startOfDay)
      .lte("withdrawal_date", endOfDay)

    if (witError) throw new Error(witError.message)

    // Fetch Carnet Details manually
    const allCarnetIds = [...new Set([
      ...(cotisationsRaw ?? []).map(c => c.carnet_id),
      ...(duplicatesRaw ?? []).map(d => d.original_carnet_id),
      ...(withdrawalsRaw ?? []).map(w => w.carnet_id)
    ].filter(Boolean))]

    let carnetMap: Record<string, { number: string; client_code: string }> = {}
    if (allCarnetIds.length > 0) {
      const { data: carnets } = await adminClient
        .from("carnet")
        .select("id, number, client_code")
        .in("id", allCarnetIds)
      
      carnetMap = Object.fromEntries(
        (carnets ?? []).map(c => [c.id, { number: c.number, client_code: c.client_code }])
      )
    }

    const cotisations = (cotisationsRaw ?? []).map(c => ({
      ...c,
      carnet: carnetMap[c.carnet_id] || null
    }))

    const duplicates = (duplicatesRaw ?? []).map(d => ({
      ...d,
      carnet: carnetMap[d.original_carnet_id] || null
    }))

    const withdrawals = (withdrawalsRaw ?? []).map(w => ({
      ...w,
      carnet: carnetMap[w.carnet_id] || null
    }))

    return {
      success: true,
      data: {
        deposit,
        cotisations: cotisations ?? [],
        duplicates: duplicates ?? [],
        withdrawals: withdrawals ?? [],
      },
    }
  } catch (error: any) {
    console.error("getCollectionReportDataAction error:", error)
    return { 
      success: false, 
      error: error?.message || "Erreur lors de la récupération des données du rapport" 
    }
  }
}
