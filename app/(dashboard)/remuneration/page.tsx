"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  Coins,
  Calculator,
  TrendingUp,
  FileText,
  Download,
  Calendar,
} from "lucide-react"

const remunerationData = [
  { month: "Sep", montant: 285000 },
  { month: "Oct", montant: 310000 },
  { month: "Nov", montant: 295000 },
  { month: "Dec", montant: 340000 },
  { month: "Jan", montant: 380000 },
  { month: "Fev", montant: 420000 },
]

const remunerations = [
  { carnet: "C-2024-1847", client: "Marie Kabila", solde: "2,450,000 FC", taux: "1.5%", montant: "36,750 FC", periode: "Fev 2024", status: "paid" },
  { carnet: "C-2024-1846", client: "Pierre Mutombo", solde: "$1,200", taux: "2.0%", montant: "$24", periode: "Fev 2024", status: "paid" },
  { carnet: "C-2024-1845", client: "Josephine Kayembe", solde: "850,000 FC", taux: "1.5%", montant: "12,750 FC", periode: "Fev 2024", status: "pending" },
  { carnet: "C-2024-1843", client: "Francoise Mwamba", solde: "$4,500", taux: "2.5%", montant: "$112.50", periode: "Fev 2024", status: "paid" },
  { carnet: "C-2024-1841", client: "Elisabeth Kasongo", solde: "3,100,000 FC", taux: "1.5%", montant: "46,500 FC", periode: "Fev 2024", status: "pending" },
  { carnet: "C-2024-1840", client: "Claude Mbuyi", solde: "$2,800", taux: "2.0%", montant: "$56", periode: "Fev 2024", status: "paid" },
]

const projections = [
  { mois: "Mars 2024", estimation: "450,000 FC", croissance: "+7.1%" },
  { mois: "Avril 2024", estimation: "475,000 FC", croissance: "+5.6%" },
  { mois: "Mai 2024", estimation: "500,000 FC", croissance: "+5.3%" },
]

const statusMap: Record<string, { status: "success" | "warning"; label: string }> = {
  paid: { status: "success", label: "Verse" },
  pending: { status: "warning", label: "A verser" },
}

function formatFC(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

export default function RemunerationPage() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Remuneration" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Remuneration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Calcul automatique et suivi des remunerations d&apos;epargne
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1.5">
              <Calculator className="h-4 w-4" />
              Recalculer
            </Button>
            <Button className="gap-1.5">
              <Download className="h-4 w-4" />
              Exporter releves
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total verse (mois)</p>
                <p className="text-xl font-bold text-foreground">420,000 FC</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A verser</p>
                <p className="text-xl font-bold text-foreground">59,250 FC</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux moyen</p>
                <p className="text-xl font-bold text-foreground">1.75%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carnets eligibles</p>
                <p className="text-xl font-bold text-foreground">1,456</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evolution des remunerations</CardTitle>
              <CardDescription>6 derniers mois en FC</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={remunerationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={formatFC} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString("fr-FR")} FC`, "Remuneration"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Bar dataKey="montant" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Projections</CardTitle>
              <CardDescription>Estimations des prochains mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {projections.map((proj) => (
                  <div key={proj.mois} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{proj.mois}</p>
                      <p className="text-xs text-muted-foreground">Estimation</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{proj.estimation}</p>
                      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {proj.croissance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Detail par carnet - Fevrier 2024</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Carnet</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Solde moyen</TableHead>
                    <TableHead className="font-semibold">Taux</TableHead>
                    <TableHead className="font-semibold">Remuneration</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remunerations.map((rem) => (
                    <TableRow key={rem.carnet}>
                      <TableCell className="font-mono text-sm text-primary">{rem.carnet}</TableCell>
                      <TableCell className="font-medium text-foreground">{rem.client}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{rem.solde}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{rem.taux}</TableCell>
                      <TableCell className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{rem.montant}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={statusMap[rem.status].status}
                          label={statusMap[rem.status].label}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
