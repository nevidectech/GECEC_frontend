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
    monthlyEvolution: {
        month: string;
        depotsFC: number;
        retraitsFC: number;
        depotsUSD: number;
        retraitsUSD: number;
    }[]
    weeklyCollections: { day: string; montantFC: number; montantUSD: number }[]
    geographicDistribution: { name: string; value: number; color: string }[]
}

export async function getDashboardChartsDataAction(): Promise<ActionResult<ChartData>> {
    try {
        const adminClient = createAdminClient()

        const now = new Date()
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString()

        // Build month buckets for the current year up to now
        const months: { name: string; index: number }[] = []
        for (let i = 0; i <= now.getMonth(); i++) {
            const d = new Date(now.getFullYear(), i, 1)
            months.push({
                name: d.toLocaleString('fr-FR', { month: 'short' }).charAt(0).toUpperCase() +
                    d.toLocaleString('fr-FR', { month: 'short' }).slice(1),
                index: i,
            })
        }

        // Cotisations of the year — join with carnet to get currency
        const { data: cotisations, error: cotError } = await adminClient
            .from("cotisation")
            .select("amount, cotisation_date, carnet:carnet_id(currency)")
            .gte("cotisation_date", yearStart)
            .lte("cotisation_date", yearEnd)

        if (cotError) throw cotError

        // Withdrawals of the year — join with carnet to get currency
        const { data: withdrawals, error: witError } = await adminClient
            .from("withdrawal")
            .select("amount, withdrawal_date, carnet:carnet_id(currency)")
            .gte("withdrawal_date", yearStart)
            .lte("withdrawal_date", yearEnd)

        if (witError) throw witError

        // Aggregate per month
        const evolution = months.map(m => {
            const monthCots = (cotisations as any[] ?? []).filter(c => {
                const d = new Date(c.cotisation_date)
                return d.getMonth() === m.index && d.getFullYear() === now.getFullYear()
            })
            const monthWits = (withdrawals as any[] ?? []).filter(w => {
                const d = new Date(w.withdrawal_date)
                return d.getMonth() === m.index && d.getFullYear() === now.getFullYear()
            })

            const getCurrency = (item: any) => (item.carnet as any)?.currency ?? 1

            const depotsFC = monthCots.filter(c => getCurrency(c) === 1).reduce((s, c) => s + Number(c.amount), 0)
            const depotsUSD = monthCots.filter(c => getCurrency(c) === 2).reduce((s, c) => s + Number(c.amount), 0)
            const retraitsFC = monthWits.filter(w => getCurrency(w) === 1).reduce((s, w) => s + Number(w.amount), 0)
            const retraitsUSD = monthWits.filter(w => getCurrency(w) === 2).reduce((s, w) => s + Number(w.amount), 0)

            return { month: m.name, depotsFC, retraitsFC, depotsUSD, retraitsUSD }
        })

        // Weekly collections (last 7 days, both currencies)
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - 6)
        weekStart.setHours(0, 0, 0, 0)

        const weekly: { day: string; montantFC: number; montantUSD: number }[] = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toISOString().split('T')[0]

            const dayCots = (cotisations as any[] ?? []).filter(c => c.cotisation_date.startsWith(dateStr))
            const getCurrency = (item: any) => (item.carnet as any)?.currency ?? 1

            weekly.push({
                day: d.toLocaleString('fr-FR', { weekday: 'short' }),
                montantFC: dayCots.filter(c => getCurrency(c) === 1).reduce((s, c) => s + Number(c.amount), 0),
                montantUSD: dayCots.filter(c => getCurrency(c) === 2).reduce((s, c) => s + Number(c.amount), 0),
            })
        }

        // Geo distribution: aggregate cotisation amounts by zone
        // Chain: cotisation → carnet (client_code) → client (code) → zone (zone_id)
        const { data: cotWithClient } = await adminClient
            .from("cotisation")
            .select("amount, carnet:carnet_id(client_code)")

        // Unique client codes from cotisations
        const clientCodes = [...new Set(
            (cotWithClient ?? [])
                .map((c: any) => c.carnet?.client_code)
                .filter(Boolean)
        )]

        // Fetch clients and their zones in one query
        const { data: clients } = await adminClient
            .from("client")
            .select("code, zone_id, zone:zone_id(id, name)")
            .in("code", clientCodes)

        // Build a lookup: client_code → zone name
        const clientZoneMap: Record<string, string> = {}
            ; (clients ?? []).forEach((cl: any) => {
                clientZoneMap[cl.code] = cl.zone?.name || "Autre"
            })

        // Aggregate amounts by zone
        const zoneAmounts: Record<string, number> = {}
            ; (cotWithClient ?? []).forEach((c: any) => {
                const clientCode = c.carnet?.client_code
                if (!clientCode) return
                const zoneName = clientZoneMap[clientCode] || "Autre"
                zoneAmounts[zoneName] = (zoneAmounts[zoneName] || 0) + Number(c.amount)
            })

        const totalAmount = Object.values(zoneAmounts).reduce((s, v) => s + v, 0)

        const chartColors = [
            "hsl(var(--chart-1))",
            "hsl(var(--chart-2))",
            "hsl(var(--chart-3))",
            "hsl(var(--chart-4))",
            "hsl(var(--chart-5))",
        ]

        const geographicDistribution = Object.entries(zoneAmounts)
            .sort((a, b) => b[1] - a[1])
            .map(([name, amount], i) => ({
                name,
                value: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
                color: chartColors[i % chartColors.length],
            }))

        return {
            success: true,
            data: {
                monthlyEvolution: evolution,
                weeklyCollections: weekly,
                geographicDistribution,
            }
        }
    } catch (error) {
        console.error("getDashboardChartsDataAction error:", error)
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

        const now = new Date()
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString()
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString()

        // Fetch cotisations for the current year — join carnet for client_code and user_profile for zone
        // Step 1: fetch cotisations for the year (simple, no join)
        const { data: cotisations, error: cotError } = await adminClient
            .from("cotisation")
            .select("amount, created_by, carnet_id, cotisation_date")
            .gte("cotisation_date", yearStart)
            .lte("cotisation_date", yearEnd)

        if (cotError) throw cotError

        // Step 2: fetch carnets to get client_codes
        const carnetIds = [...new Set((cotisations ?? []).map(c => c.carnet_id).filter(Boolean))]
        const { data: carnets } = carnetIds.length > 0
            ? await adminClient.from("carnet").select("id, client_code").in("id", carnetIds)
            : { data: [] }

        const carnetMap: Record<string, string | null> = Object.fromEntries(
            (carnets ?? []).map(c => [c.id, c.client_code])
        )

        // Step 3: fetch user profiles for all unique collectors
        const collectorIds = [...new Set((cotisations ?? []).map(c => c.created_by).filter(Boolean))]
        const { data: profiles } = collectorIds.length > 0
            ? await adminClient.from("user_profile").select("user_id, username, zone_id").in("user_id", collectorIds)
            : { data: [] }

        const profileMap: Record<string, { username: string; zone_id: string | null }> = Object.fromEntries(
            (profiles ?? []).map(p => [p.user_id, { username: p.username ?? "Inconnu", zone_id: p.zone_id ?? null }])
        )

        // Step 4: aggregate
        const aggregation: Record<string, {
            collected: number
            zoneId: string | null
            initials: string
            clientCodes: Set<string>
        }> = {}

            ; (cotisations ?? []).forEach(p => {
                const profile = profileMap[p.created_by] ?? { username: "Inconnu", zone_id: null }
                const username = profile.username
                if (!aggregation[username]) {
                    aggregation[username] = {
                        collected: 0,
                        zoneId: profile.zone_id,
                        initials: username.substring(0, 2).toUpperCase(),
                        clientCodes: new Set(),
                    }
                }
                aggregation[username].collected += Number(p.amount)
                const clientCode = carnetMap[p.carnet_id]
                if (clientCode) aggregation[username].clientCodes.add(clientCode)
            })

        // Step 5: resolve zone names
        const { data: zones } = await adminClient.from("zone").select("id, name")
        const zoneMap = Object.fromEntries(zones?.map(z => [z.id, z.name]) ?? [])

        const result = Object.entries(aggregation)
            .map(([name, data]) => ({
                name,
                initials: data.initials,
                zone: data.zoneId ? zoneMap[data.zoneId] ?? "Zone inconnue" : "Non assigné",
                collected: data.collected,
                target: 5_000_000,
                clients: data.clientCodes.size,
            }))
            .sort((a, b) => b.collected - a.collected)
            .slice(0, 5)

        return { success: true, data: result }
    } catch (error) {
        console.error("getCollectorPerformanceAction error:", error)
        return { success: false, error: "Erreur lors de la récupération des performances" }
    }
}
