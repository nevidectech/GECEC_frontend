"use client"

import { useEffect, useMemo, useState } from "react"
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
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import { getReportsDataAction, type ReportPeriod, type ReportStats } from "@/actions/reports"
import { toast } from "sonner"

const predefinedReports = [
  {
    name: "Rapport mensuel d'activite",
    description: "Synthese de la collecte et des retraits sur la periode selectionnee.",
    icon: Calendar,
    format: "PDF / Excel",
  },
  {
    name: "Etat des soldes par zone",
    description: "Vue comparee des clients, carnets actifs et epargne par zone.",
    icon: BarChart3,
    format: "PDF / Excel",
  },
  {
    name: "Performance des collecteurs",
    description: "Base de pilotage des collecteurs actifs par zone de collecte.",
    icon: Users,
    format: "PDF / Excel",
  },
  {
    name: "Tendance de tresorerie",
    description: "Lecture rapide de la croissance nette mois par mois.",
    icon: Wallet,
    format: "PDF",
  },
]

const periods: Array<{ value: ReportPeriod; label: string }> = [
  { value: "3m", label: "3 derniers mois" },
  { value: "6m", label: "6 derniers mois" },
  { value: "12m", label: "12 derniers mois" },
]

function formatCurrency(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FC"
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export default function RapportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("6m")
  const [reportData, setReportData] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getReportsDataAction(period)
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

    void loadReports()
  }, [period])

  const monthlyReport = reportData?.monthlyReport || []
  const zoneReport = reportData?.zoneReport || []
  const topZone = useMemo(() => {
    if (zoneReport.length === 0) return null
    return [...zoneReport].sort((a, b) => b.epargne - a.epargne)[0]
  }, [zoneReport])

  const totalClients = reportData?.activeClients || 0
  const totalCarnets = reportData?.activeCarnets || 0
  const totalDeposits = reportData?.totalDeposits || 0
  const totalWithdrawals = reportData?.totalWithdrawals || 0
  const netBalance = reportData?.netBalance || 0
  const averageDeposit = reportData?.averageDeposit || 0
  const averageWithdrawal = reportData?.averageWithdrawal || 0
  const periodLabel = reportData?.periodLabel || periods.find((item) => item.value === period)?.label || ""

  const handleExportZonesCsv = () => {
    if (zoneReport.length === 0) return
    
    const headers = ["Zone", "Clients", "Carnets", "Epargne Totale", "Collecteurs"]
    const rows = zoneReport.map(z => [
      z.zone,
      z.clients.toString(),
      z.carnets.toString(),
      z.epargne.toString(),
      z.collecteurs.toString()
    ])
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `rapport_zones_${period}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Rapport CSV exporté")
  }

  const handleExportPredefined = async (reportName: string, format: "pdf" | "excel") => {
    try {
      toast.loading(`Génération du rapport ${reportName}...`, { id: "report-export" })

      if (format === "excel") {
        const { utils, writeFile } = await import("xlsx")
        let data: any[] = []
        
        if (reportName.includes("zone")) {
          data = zoneReport.map(z => ({
            "Zone": z.zone,
            "Clients": z.clients,
            "Carnets": z.carnets,
            "Epargne (FC)": z.epargne,
            "Collecteurs": z.collecteurs
          }))
        } else if (reportName.includes("mensuel")) {
          data = monthlyReport.map(m => ({
            "Mois": m.month,
            "Dépôts (FC)": m.depots,
            "Retraits (FC)": m.retraits,
            "Solde Net (FC)": m.soldeNet
          }))
        } else {
          data = [
            { "Indicateur": "Clients actifs", "Valeur": totalClients },
            { "Indicateur": "Carnets actifs", "Valeur": totalCarnets },
            { "Indicateur": "Total dépôts (FC)", "Valeur": totalDeposits },
            { "Indicateur": "Total retraits (FC)", "Valeur": totalWithdrawals },
            { "Indicateur": "Solde net (FC)", "Valeur": netBalance }
          ]
        }

        const ws = utils.json_to_sheet(data)
        const wb = utils.book_new()
        utils.book_append_sheet(wb, ws, "Rapport")
        writeFile(wb, `${reportName.replace(/ /g, "_")}.xlsx`)
        toast.success("Fichier Excel généré", { id: "report-export" })
        return
      }

      // PDF Export
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default
      const doc = new jsPDF()

      doc.setFontSize(18)
      doc.text(reportName.toUpperCase(), 105, 15, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Période: ${periodLabel}`, 14, 25)
      doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")}`, 14, 30)

      if (reportName.includes("zone")) {
        autoTable(doc, {
          startY: 40,
          head: [["Zone", "Clients", "Carnets", "Epargne"]],
          body: zoneReport.map(z => [z.zone, z.clients, z.carnets, formatCurrency(z.epargne)]),
        })
      } else if (reportName.includes("mensuel")) {
        autoTable(doc, {
          startY: 40,
          head: [["Mois", "Dépôts", "Retraits", "Solde Net"]],
          body: monthlyReport.map(m => [m.month, formatCurrency(m.depots), formatCurrency(m.retraits), formatCurrency(m.soldeNet)]),
        })
      } else {
        doc.text("Détails du rapport:", 14, 40)
        doc.text(`- Clients totaux: ${totalClients.toLocaleString()}`, 20, 50)
        doc.text(`- Carnets totaux: ${totalCarnets.toLocaleString()}`, 20, 55)
        doc.text(`- Dépôts totaux: ${formatCurrency(totalDeposits)}`, 20, 60)
        doc.text(`- Retraits totaux: ${formatCurrency(totalWithdrawals)}`, 20, 65)
      }

      doc.save(`${reportName.replace(/ /g, "_")}.pdf`)
      toast.success("Rapport généré", { id: "report-export" })
    } catch (err) {
      console.error(err)
      toast.error(`Erreur lors de l'export ${format.toUpperCase()}`, { id: "report-export" })
    }
  }

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Rapports" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Rapports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analyses dynamiques de la collecte sur {periodLabel.toLowerCase()}
            </p>
          </div>
          <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)} disabled={loading}>
            <SelectTrigger className="h-9 w-52">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">Chargement des rapports...</span>
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Clients actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{totalClients.toLocaleString("fr-FR")}</div>
                  <p className="mt-1 text-xs text-muted-foreground">portefeuille client actif</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Carnets actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{totalCarnets.toLocaleString("fr-FR")}</div>
                  <p className="mt-1 text-xs text-muted-foreground">carnets non clotures</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total dépôts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{formatCompactCurrency(totalDeposits)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">moyenne: {formatCurrency(averageDeposit)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total retraits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{formatCompactCurrency(totalWithdrawals)}</div>
                  <p className="mt-1 text-xs text-muted-foreground">moyenne: {formatCurrency(averageWithdrawal)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Solde net</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCompactCurrency(netBalance)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">dépôts - retraits</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                <TabsTrigger value="zones">Par zone</TabsTrigger>
                <TabsTrigger value="predefined">Rapports prédefinis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">Flux financiers mensuels</CardTitle>
                      <CardDescription>{periodLabel} • Dépôts vs retraits (FC)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {monthlyReport.length > 0 ? (
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyReport}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                              <YAxis tickFormatter={formatCompactCurrency} tick={{ fontSize: 12 }} />
                              <Tooltip
                                formatter={(value: number) => [formatCurrency(value), ""]}
                                contentStyle={{
                                  backgroundColor: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "8px",
                                  color: "hsl(var(--foreground))",
                                }}
                              />
                              <Legend />
                              <Bar dataKey="depots" name="Dépôts" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="retraits" name="Retraits" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="flex h-[350px] items-center justify-center">
                          <span className="text-sm text-muted-foreground">Pas de données disponibles</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Croissance nette</CardTitle>
                        <CardDescription>Évolution du solde net sur {periodLabel.toLowerCase()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {monthlyReport.length > 0 ? (
                          <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={monthlyReport}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                <YAxis tickFormatter={formatCompactCurrency} tick={{ fontSize: 12 }} />
                                <Tooltip
                                  formatter={(value: number) => [formatCurrency(value), "Solde net"]}
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
                          <div className="flex h-[250px] items-center justify-center">
                            <span className="text-sm text-muted-foreground">Pas de données disponibles</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">Faits marquants</CardTitle>
                        <CardDescription>Lecture rapide de la période</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-lg border bg-emerald-500/5 p-4">
                          <div className="flex items-center gap-2 text-emerald-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">Dépôts cumulés</span>
                          </div>
                          <p className="mt-2 text-xl font-bold text-foreground">{formatCurrency(totalDeposits)}</p>
                        </div>
                        <div className="rounded-lg border bg-amber-500/5 p-4">
                          <div className="flex items-center gap-2 text-amber-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-medium">Retraits cumulés</span>
                          </div>
                          <p className="mt-2 text-xl font-bold text-foreground">{formatCurrency(totalWithdrawals)}</p>
                        </div>
                        <div className="rounded-lg border bg-primary/5 p-4">
                          <div className="flex items-center gap-2 text-primary">
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-medium">Zone la plus active</span>
                          </div>
                          <p className="mt-2 text-base font-semibold text-foreground">{topZone?.zone || "Aucune zone"}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {topZone ? `${formatCurrency(topZone.epargne)} d'épargne cumulée` : "Pas assez de données"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="zones" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold">Répartition par zone géographique</CardTitle>
                        <CardDescription>Synthèse dynamique de l&apos;activité par zone</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1.5" 
                        disabled={zoneReport.length === 0}
                        onClick={handleExportZonesCsv}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {zoneReport.length > 0 ? (
                      <div className="overflow-hidden rounded-lg border">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">Zone</TableHead>
                              <TableHead className="text-right font-semibold">Clients</TableHead>
                              <TableHead className="text-right font-semibold">Carnets</TableHead>
                              <TableHead className="text-right font-semibold">Épargne totale</TableHead>
                              <TableHead className="text-right font-semibold">Collecteurs</TableHead>
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
                        <span className="text-sm text-muted-foreground">Pas de données par zone disponibles</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="predefined" className="mt-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {predefinedReports.map((report) => (
                    <Card key={report.name} className="group transition-colors hover:border-primary/30">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <report.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{report.name}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{report.format}</span>
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleExportPredefined(report.name, "pdf")}
                              >
                                <FileText className="h-3 w-3" />
                                PDF
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 gap-1 text-xs"
                                onClick={() => handleExportPredefined(report.name, "excel")}
                              >
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
