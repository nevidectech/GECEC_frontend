"use client"

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

export default function DashboardPage() {
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
            value="24,850,000 FC"
            change="+12.5%"
            changeType="positive"
            icon={Wallet}
            description="vs mois dernier"
          />
          <KpiCard
            title="Epargne totale (USD)"
            value="$18,420"
            change="+8.3%"
            changeType="positive"
            icon={Banknote}
            description="vs mois dernier"
          />
          <KpiCard
            title="Clients actifs"
            value="1,247"
            change="+24"
            changeType="positive"
            icon={Users}
            description="ce mois"
          />
          <KpiCard
            title="Carnets actifs"
            value="1,892"
            change="+31"
            changeType="positive"
            icon={BookOpen}
            description="ce mois"
          />
          <KpiCard
            title="Retraits (mois)"
            value="3,250,000 FC"
            change="-5.2%"
            changeType="negative"
            icon={ArrowUpFromLine}
            description="vs mois dernier"
          />
          <KpiCard
            title="Taux de croissance"
            value="18.7%"
            change="+2.1pts"
            changeType="positive"
            icon={TrendingUp}
            description="vs trimestre"
          />
        </div>

        <DashboardCharts />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentActivity />
          <CollectorPerformance />
        </div>
      </div>
    </>
  )
}
