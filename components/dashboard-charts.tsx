"use client"

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
  monthlyEvolution: { month: string; depots: number; retraits: number; solde: number }[]
  weeklyCollections: { day: string; montant: number }[]
  geographicDistribution: { name: string; value: number; color: string }[]
}

export function DashboardCharts({ data }: { data: ChartDataProps }) {
  const { monthlyEvolution, weeklyCollections, geographicDistribution } = data

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
              {entry.name}: {entry.value.toLocaleString("fr-FR")} FC
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  function formatFC(value: number) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
    return value.toString()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Evolution de l&apos;epargne</CardTitle>
          <CardDescription>Depots, retraits et solde sur 6 mois</CardDescription>
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
                  <AreaChart data={monthlyEvolution}>
                    <defs>
                      <linearGradient id="colorDepots" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorRetraits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tickFormatter={formatFC} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="depots"
                      name="Depots"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorDepots)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="retraits"
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
                  <BarChart data={weeklyCollections}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatFC} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="montant"
                      name="Collectes"
                      fill="hsl(var(--chart-1))"
                      radius={[6, 6, 0, 0]}
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
