"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

const monthlyReport = [
  { month: "Sep", depots: 3800, retraits: 1200, soldeNet: 2600 },
  { month: "Oct", depots: 4200, retraits: 1500, soldeNet: 2700 },
  { month: "Nov", depots: 3600, retraits: 1800, soldeNet: 1800 },
  { month: "Dec", depots: 5100, retraits: 2000, soldeNet: 3100 },
  { month: "Jan", depots: 4700, retraits: 1600, soldeNet: 3100 },
  { month: "Fev", depots: 5500, retraits: 1900, soldeNet: 3600 },
]

const zoneReport = [
  { zone: "Lubumbashi-Centre", clients: 425, carnets: 612, epargne: "12,500,000 FC", collecteurs: 8 },
  { zone: "Lubumbashi-Est", clients: 312, carnets: 445, epargne: "8,200,000 FC", collecteurs: 6 },
  { zone: "Likasi", clients: 218, carnets: 298, epargne: "5,100,000 FC", collecteurs: 4 },
  { zone: "Kolwezi", clients: 178, carnets: 234, epargne: "3,800,000 FC", collecteurs: 3 },
  { zone: "Kipushi", clients: 114, carnets: 156, epargne: "2,100,000 FC", collecteurs: 2 },
]

const predefinedReports = [
  { name: "Rapport mensuel d'activite", description: "Resume complet des operations du mois", icon: Calendar, format: "PDF / Excel" },
  { name: "Etat des soldes par zone", description: "Repartition des soldes d'epargne par zone geographique", icon: BarChart3, format: "PDF / Excel" },
  { name: "Performance des collecteurs", description: "Analyse de la performance individuelle des collecteurs", icon: Users, format: "PDF / Excel" },
  { name: "Remunerations versees", description: "Detail des remunerations calculees et versees", icon: Wallet, format: "PDF / Excel" },
  { name: "Rapport de croissance", description: "Evolution de l'epargne et projections", icon: TrendingUp, format: "PDF" },
]

function formatK(value: number) {
  return `${value.toLocaleString("fr-FR")}K`
}

export default function RapportsPage() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Rapports" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Rapports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Rapports predefinis et analyses personnalisees
            </p>
          </div>
          <Select defaultValue="feb-2024">
            <SelectTrigger className="w-44 h-9">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="feb-2024">Fevrier 2024</SelectItem>
              <SelectItem value="jan-2024">Janvier 2024</SelectItem>
              <SelectItem value="dec-2023">Decembre 2023</SelectItem>
              <SelectItem value="q4-2023">Q4 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="zones">Par zone</TabsTrigger>
            <TabsTrigger value="predefined">Rapports predefinis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Flux financiers mensuels</CardTitle>
                  <CardDescription>Depots vs Retraits (en milliers FC)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyReport}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={formatK} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => [`${value.toLocaleString("fr-FR")}K FC`, ""]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="depots" name="Depots" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="retraits" name="Retraits" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Croissance nette</CardTitle>
                  <CardDescription>Solde net mensuel (depots - retraits) en milliers FC</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyReport}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={formatK} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value: number) => [`${value.toLocaleString("fr-FR")}K FC`, "Croissance nette"]}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="soldeNet"
                          name="Solde net"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2.5}
                          dot={{ fill: "hsl(var(--chart-2))", strokeWidth: 0, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="zones" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Repartition par zone geographique</CardTitle>
                    <CardDescription>Synthese de l&apos;activite par zone de collecte</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Zone</TableHead>
                        <TableHead className="font-semibold text-right">Clients</TableHead>
                        <TableHead className="font-semibold text-right">Carnets</TableHead>
                        <TableHead className="font-semibold text-right">Epargne totale</TableHead>
                        <TableHead className="font-semibold text-right">Collecteurs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zoneReport.map((zone) => (
                        <TableRow key={zone.zone}>
                          <TableCell className="font-medium text-foreground">{zone.zone}</TableCell>
                          <TableCell className="text-right tabular-nums">{zone.clients}</TableCell>
                          <TableCell className="text-right tabular-nums">{zone.carnets}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-foreground">{zone.epargne}</TableCell>
                          <TableCell className="text-right tabular-nums">{zone.collecteurs}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 font-semibold">
                        <TableCell className="text-foreground">Total</TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">1,247</TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">1,745</TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">31,700,000 FC</TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">23</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predefined" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {predefinedReports.map((report) => (
                <Card key={report.name} className="group hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <report.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{report.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{report.format}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <FileText className="h-3 w-3" />
                            PDF
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                            <FileSpreadsheet className="h-3 w-3" />
                            Excel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
