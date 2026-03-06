"use client"

import { useState, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import { getReportsDataAction, type ReportStats } from "@/actions/reports"

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

function formatCurrency(value: number) {
  return `${value.toLocaleString("fr-FR")} FC`
}

export default function RapportsPage() {
  const [reportData, setReportData] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReports = async () => {
      try {
        const result = await getReportsDataAction()
        if (result.success && result.data) {
          setReportData(result.data)
        } else {
          setError(result.error || "Erreur lors du chargement des rapports")
        }
      } catch (err) {
        setError("Erreur lors du chargement des rapports")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  const monthlyReport = reportData?.monthlyReport || []
  const zoneReport = reportData?.zoneReport || []
  const totalClients = reportData?.activeClients || 0
  const totalCarnets = reportData?.activeCarnets || 0
  const totalDeposits = reportData?.totalDeposits || 0
  const totalWithdrawals = reportData?.totalWithdrawals || 0
  const netBalance = reportData?.netBalance || 0
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
          <Select defaultValue="feb-2024" disabled={loading}>
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">
              Chargement des rapports...
            </span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <span className="text-sm text-red-500">{error}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Clients actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {totalClients.toLocaleString("fr-FR")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">clients enregistres</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Carnets actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {totalCarnets.toLocaleString("fr-FR")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">carnets non clotures</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total depots
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatK(totalDeposits / 1000)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">en FC</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Solde net
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netBalance > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatK(netBalance / 1000)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">depots - retraits</p>
                </CardContent>
              </Card>
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
                      {monthlyReport.length > 0 ? (
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
                      ) : (
                        <div className="flex items-center justify-center h-[350px]">
                          <span className="text-sm text-muted-foreground">Pas de donnees disponibles</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Croissance nette</CardTitle>
                      <CardDescription>Solde net mensuel (depots - retraits) en milliers FC</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {monthlyReport.length > 0 ? (
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
                      ) : (
                        <div className="flex items-center justify-center h-[250px]">
                          <span className="text-sm text-muted-foreground">Pas de donnees disponibles</span>
                        </div>
                      )}
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
                      <Button variant="outline" size="sm" className="gap-1.5" disabled={zoneReport.length === 0}>
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {zoneReport.length > 0 ? (
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
                                <TableCell className="text-right tabular-nums font-semibold text-foreground">
                                  {formatCurrency(zone.epargne)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{zone.collecteurs}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/30 font-semibold">
                              <TableCell className="text-foreground">Total</TableCell>
                              <TableCell className="text-right tabular-nums text-foreground">
                                {zoneReport.reduce((sum, z) => sum + z.clients, 0).toLocaleString("fr-FR")}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-foreground">
                                {zoneReport.reduce((sum, z) => sum + z.carnets, 0).toLocaleString("fr-FR")}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-foreground">
                                {formatCurrency(zoneReport.reduce((sum, z) => sum + z.epargne, 0))}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-foreground">
                                {zoneReport.reduce((sum, z) => sum + z.collecteurs, 0).toLocaleString("fr-FR")}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <span className="text-sm text-muted-foreground">Pas de donnees par zone disponibles</span>
                      </div>
                    )}
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
          </>
        )}
      </div>
    </>
  )
}
