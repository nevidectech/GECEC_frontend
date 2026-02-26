"use server"

import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
    success: boolean
    data?: T
    error?: string
}

export type DashboardStats = {
    totalSavingsFC: number
    totalSavingsUSD: number
    activeClients: number
    activeCarnets: number
    monthlyWithdrawalsFC: number
    monthlyWithdrawalsUSD: number
    growthRate: number
    changes: {
        savingsFC: string
        savingsUSD: string
        clients: string
        carnets: string
        withdrawals: string
    }
}

export async function getDashboardStatsAction(): Promise<ActionResult<DashboardStats>> {
    try {
        const adminClient = createAdminClient()
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

        // 1. Total Savings (all time cotisations)
        const { data: totalCotisations, error: cotError } = await adminClient
            .from("cotisation")
            .select("amount, currency")

        if (cotError) throw cotError

        const totalSavingsFC = (totalCotisations ?? [])
            .filter((c) => c.currency === 1)
            .reduce((sum, c) => sum + Number(c.amount), 0)

        const totalSavingsUSD = (totalCotisations ?? [])
            .filter((c) => c.currency === 2)
            .reduce((sum, c) => sum + Number(c.amount), 0)

        // 2. Active Clients
        const { count: activeClients, error: clientError } = await adminClient
            .from("client")
            .select("*", { count: "exact", head: true })
            .is("deleted_at", null)

        if (clientError) throw clientError

        // 3. Active Carnets
        const { count: activeCarnets, error: carnetError } = await adminClient
            .from("carnet")
            .select("*", { count: "exact", head: true })
            .eq("is_archived", false)

        if (carnetError) throw carnetError

        // 4. Monthly Withdrawals
        const { data: monthlyWithdrawals, error: withdrawalError } = await adminClient
            .from("withdrawal")
            .select("amount, currency")
            .gte("withdrawal_date", startOfMonth)

        if (withdrawalError) throw withdrawalError

        const monthlyWithdrawalsFC = (monthlyWithdrawals ?? [])
            .filter((w) => w.currency === 1)
            .reduce((sum, w) => sum + Number(w.amount), 0)

        const monthlyWithdrawalsUSD = (monthlyWithdrawals ?? [])
            .filter((w) => w.currency === 2)
            .reduce((sum, w) => sum + Number(w.amount), 0)

        // 5. Calculate Changes (Simple mock logic for now, could be expanded)
        // In a real app, you'd query the previous month's data too.

        return {
            success: true,
            data: {
                totalSavingsFC,
                totalSavingsUSD,
                activeClients: activeClients ?? 0,
                activeCarnets: activeCarnets ?? 0,
                monthlyWithdrawalsFC,
                monthlyWithdrawalsUSD,
                growthRate: 15.5, // Mocked for now
                changes: {
                    savingsFC: "+12.5%",
                    savingsUSD: "+8.3%",
                    clients: "+24",
                    carnets: "+31",
                    withdrawals: "-5.2%",
                }
            }
        }
    } catch (error) {
        console.error("getDashboardStatsAction error:", error)
        return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" }
    }
}

export type ChartData = {
    monthlyEvolution: { month: string; depots: number; retraits: number; solde: number }[]
    weeklyCollections: { day: string; montant: number }[]
    geographicDistribution: { name: string; value: number; color: string }[]
}

export async function getDashboardChartsDataAction(): Promise<ActionResult<ChartData>> {
    try {
        const adminClient = createAdminClient()

        // Mocking chart data for now but structure is ready for Supabase aggregation
        // Real implementation would use RPC or complex filters

        return {
            success: true,
            data: {
                monthlyEvolution: [
                    { month: "Jan", depots: 4200000, retraits: 1800000, solde: 12500000 },
                    { month: "Fev", depots: 3800000, retraits: 2100000, solde: 14200000 },
                    { month: "Mar", depots: 5100000, retraits: 1500000, solde: 17800000 },
                    { month: "Avr", depots: 4700000, retraits: 2400000, solde: 20100000 },
                    { month: "Mai", depots: 5500000, retraits: 1900000, solde: 23700000 },
                    { month: "Jun", depots: 4900000, retraits: 2200000, solde: 24850000 },
                ],
                weeklyCollections: [
                    { day: "Lun", montant: 850000 },
                    { day: "Mar", montant: 1200000 },
                    { day: "Mer", montant: 950000 },
                    { day: "Jeu", montant: 1100000 },
                    { day: "Ven", montant: 1350000 },
                    { day: "Sam", montant: 780000 },
                    { day: "Dim", montant: 320000 },
                ],
                geographicDistribution: [
                    { name: "Lubumbashi", value: 45, color: "hsl(var(--chart-1))" },
                    { name: "Likasi", value: 25, color: "hsl(var(--chart-2))" },
                    { name: "Kolwezi", value: 18, color: "hsl(var(--chart-3))" },
                    { name: "Kipushi", value: 12, color: "hsl(var(--chart-4))" },
                ]
            }
        }
    } catch (error) {
        return { success: false, error: "Erreur lors de la récupération des données graphiques" }
    }
}

export type Activity = {
    id: string
    type: "deposit" | "client" | "carnet" | "withdrawal"
    title: string
    subtitle: string
    time: string
    amount?: string
}

export async function getRecentActivityAction(): Promise<ActionResult<Activity[]>> {
    try {
        const adminClient = createAdminClient()

        // Fetch latest cotisations
        const { data: cotisations } = await adminClient
            .from("cotisation")
            .select(`
        id,
        amount,
        currency,
        created_at,
        carnet:carnet_id (number, client_code)
      `)
            .order("created_at", { ascending: false })
            .limit(5)

        const activities: Activity[] = (cotisations ?? []).map((c: any) => ({
            id: c.id,
            type: "deposit",
            title: `Dépôt - Carnet #${c.carnet?.number || "N/A"}`,
            subtitle: `Client ${c.carnet?.client_code || "Inconnu"}`,
            time: new Date(c.created_at).toLocaleString("fr-FR"),
            amount: `${c.amount.toLocaleString("fr-FR")} ${c.currency === 1 ? "FC" : "USD"}`
        }))

        return { success: true, data: activities }
    } catch (error) {
        return { success: false, error: "Erreur lors de la récupération de l'activité" }
    }
}

export type CollectorPerf = {
    name: string
    initials: string
    zone: string
    collected: number
    target: number
    clients: number
}

export async function getCollectorPerformanceAction(): Promise<ActionResult<CollectorPerf[]>> {
    try {
        const adminClient = createAdminClient()

        const { data: perf } = await adminClient
            .from("cotisation")
            .select(`
                amount,
                created_by,
                user_profile!created_by(username, zone_id)
            `)
            .limit(200)

        // Aggregate by username
        const aggregation: Record<string, { collected: number, zoneId: string | null, initials: string }> = {}
        perf?.forEach((p: any) => {
            const name = p.user_profile?.username || "Inconnu"
            if (!aggregation[name]) {
                aggregation[name] = {
                    collected: 0,
                    zoneId: p.user_profile?.zone_id,
                    initials: name.substring(0, 2).toUpperCase()
                }
            }
            aggregation[name].collected += Number(p.amount)
        })

        // Fetch zones for names
        const { data: zones } = await adminClient.from("zone").select("id, name")
        const zoneMap = Object.fromEntries(zones?.map(z => [z.id, z.name]) || [])

        const result = Object.entries(aggregation)
            .map(([name, data]) => ({
                name,
                initials: data.initials,
                zone: data.zoneId ? zoneMap[data.zoneId] || "Zone inconnue" : "Non assigné",
                collected: data.collected,
                target: 5000000, // Mocked target
                clients: Math.floor(data.collected / 5000) // Mocked client count
            }))
            .sort((a, b) => b.collected - a.collected)
            .slice(0, 5)

        return { success: true, data: result }
    } catch (error) {
        return { success: false, error: "Erreur lors de la récupération des performances" }
    }
}
