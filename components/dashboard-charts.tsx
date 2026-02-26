"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ChartDataProps {
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

export function DashboardCharts({ data }: { data: ChartDataProps }) {
  const { monthlyEvolution, weeklyCollections, geographicDistribution } = data
  const [currency, setCurrency] = useState<"FC" | "USD">("FC")

  // Evolution chart: show depots/retraits for selected currency
  const displayData = monthlyEvolution.map(item => ({
    month: item.month,
    "Dépôts": currency === "FC" ? item.depotsFC : item.depotsUSD,
    "Retraits": currency === "FC" ? item.retraitsFC : item.retraitsUSD,
  }))

  // Weekly chart: both currencies as grouped bars
  const weeklyDisplay = weeklyCollections.map(item => ({
    day: item.day,
    "FC": item.montantFC,
    "USD": item.montantUSD,
  }))

  function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-card p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs text-muted-foreground">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}: {entry.value.toLocaleString("fr-FR")} {entry.name === "USD" ? "$" : "FC"}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  function formatValue(value: number) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base font-semibold">Evolution de l&apos;epargne</CardTitle>
            <CardDescription>Dépôts et retraits par mois ({new Date().getFullYear()})</CardDescription>
          </div>
          <Tabs value={currency} onValueChange={(v) => setCurrency(v as "FC" | "USD")} className="w-[120px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="FC">FC</TabsTrigger>
              <TabsTrigger value="USD">USD</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="evolution" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="evolution">Evolution</TabsTrigger>
              <TabsTrigger value="collections">Collectes</TabsTrigger>
            </TabsList>
            <TabsContent value="evolution">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayData}>
                    <defs>
                      <linearGradient id="colorDepots" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRetraits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSolde" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tickFormatter={formatValue} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="Dépôts"
                      name="Dépôts"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorDepots)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Retraits"
                      name="Retraits"
                      stroke="hsl(var(--chart-2))"
                      fillOpacity={1}
                      fill="url(#colorRetraits)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="collections">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyDisplay}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatValue} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="FC"
                      name="FC"
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="USD"
                      name="USD"
                      fill="hsl(var(--chart-3))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Repartition geographique</CardTitle>
          <CardDescription>Epargne par zone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geographicDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {geographicDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Part"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {geographicDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
