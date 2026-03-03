import { AppHeader } from "@/components/app-header"
import { KpiCard } from "@/components/kpi-card"
import { DashboardCharts } from "@/components/dashboard-charts"
import { RecentActivity } from "@/components/recent-activity"
import { CollectorPerformance } from "@/components/collector-performance"
import {
  Wallet,
  Users,
  BookOpen,
  ArrowUpFromLine,
  TrendingUp,
  Banknote,
} from "lucide-react"
import {
  getDashboardStatsAction,
  getDashboardChartsDataAction,
  getRecentActivityAction,
  getCollectorPerformanceAction
} from "@/actions/dashboard"

export default async function DashboardPage() {
  const [statsRes, chartsRes, activityRes, perfRes] = await Promise.all([
    getDashboardStatsAction(),
    getDashboardChartsDataAction(),
    getRecentActivityAction(),
    getCollectorPerformanceAction(),
  ])

  const stats = statsRes.success ? statsRes.data : null
  const charts = chartsRes.success ? chartsRes.data : null
  const activities = activityRes.success && activityRes.data ? activityRes.data : []
  const performance = perfRes.success && perfRes.data ? perfRes.data : []

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Tableau de bord" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tableau de bord
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d&apos;ensemble de vos operations financieres
          </p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Epargne totale (CDF)"
            value={stats ? `${stats.totalSavingsFC.toLocaleString("fr-FR")} CDF` : "--- CDF"}
            change={stats?.changes.savingsFC}
            changeType="positive"
            icon={Wallet}
            description="vs mois dernier"
          />
          <KpiCard
            title="Epargne totale (USD)"
            value={stats ? `$${stats.totalSavingsUSD.toLocaleString("en-US")}` : "$ ---"}
            change={stats?.changes.savingsUSD}
            changeType="positive"
            icon={Banknote}
            description="vs mois dernier"
          />
          <KpiCard
            title="Clients actifs"
            value={stats ? stats.activeClients.toLocaleString("fr-FR") : "---"}
            change={stats?.changes.clients}
            changeType="positive"
            icon={Users}
            description="ce mois"
          />
          <KpiCard
            title="Carnets actifs"
            value={stats ? stats.activeCarnets.toLocaleString("fr-FR") : "---"}
            change={stats?.changes.carnets}
            changeType="positive"
            icon={BookOpen}
            description="ce mois"
          />
          <KpiCard
            title="Retraits (mois)"
            value={stats ? `${stats.monthlyWithdrawalsFC.toLocaleString("fr-FR")} CDF` : "--- CDF"}
            change={stats?.changes.withdrawals}
            changeType="negative"
            icon={ArrowUpFromLine}
            description="vs mois dernier"
          />
          <KpiCard
            title="Taux de croissance"
            value={stats ? `${stats.growthRate}%` : "---%"}
            change="+2.1pts"
            changeType="positive"
            icon={TrendingUp}
            description="vs trimestre"
          />
        </div>

        {charts && <DashboardCharts data={charts} />}

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity activities={activities} />
          <CollectorPerformance collectors={performance} />
        </div>
      </div>
    </>
  )
}
