"use client"

import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, CreditCard, DollarSign, Loader2, ReceiptText, Wallet } from "lucide-react"
import {
  getFinanceDataAction,
  type FinancePeriod,
  type FinanceStats,
} from "@/actions/finance"

const periods: Array<{ value: FinancePeriod; label: string }> = [
  { value: "3m", label: "3 derniers mois" },
  { value: "6m", label: "6 derniers mois" },
  { value: "12m", label: "12 derniers mois" },
]

function formatCurrency(value: number, currency: "CDF" | "USD") {
  const locale = currency === "USD" ? "en-US" : "fr-FR"
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(value)} ${currency}`
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export default function FinancePage() {
  const currentYear = new Date().getFullYear()
  const [period, setPeriod] = useState<FinancePeriod>("6m")
  const [year, setYear] = useState<number>(currentYear)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFinance = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getFinanceDataAction(period, year)
        if (result.success && result.data) {
          setData(result.data)
        } else {
          setError(result.error || "Erreur lors du chargement de la finance")
        }
      } catch (err) {
        setError("Erreur lors du chargement de la finance")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void loadFinance()
  }, [period, year])

  useEffect(() => {
    setPage(1)
  }, [period, year])

  const totals = data?.totals
  const rows = data?.rows || []
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize)
  const chart = data?.chart || []
  const periodLabel = data?.periodLabel || periods.find((item) => item.value === period)?.label || ""
  const availableYears = data?.availableYears || [currentYear]
  const bestCdfPeriod = useMemo(() => {
    if (rows.length === 0) return null
    return [...rows].sort((a, b) => b.totalCdf - a.totalCdf)[0]
  }, [rows])

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Finance" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Finance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Suivi des montants initiaux, carnets et duplicatas sur {periodLabel.toLowerCase()} {year}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={period} onValueChange={(value) => setPeriod(value as FinancePeriod)} disabled={loading}>
              <SelectTrigger className="h-9 w-52">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
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
            <Select value={String(year)} onValueChange={(value) => setYear(Number(value))} disabled={loading}>
              <SelectTrigger className="h-9 w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">Chargement des indicateurs financiers...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-red-500">{error}</CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant initial CDF</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(totals?.totalInitialCdf ?? 0, "CDF")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant initial USD</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(totals?.totalInitialUsd ?? 0, "USD")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total général CDF</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(totals?.totalCdf ?? 0, "CDF")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                    <ReceiptText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total général USD</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(totals?.totalUsd ?? 0, "USD")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Evolution des gains sur montants initiaux
                  </CardTitle>
                  <CardDescription>
                    Courbe des montants initiaux CDF et USD par période en {year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chart.length > 0 ? (
                    <div className="h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chart}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12 }} />
                          <Tooltip
                            formatter={(value: number, name: string) => [
                              name === "Gain USD" ? formatCurrency(value, "USD") : formatCurrency(value, "CDF"),
                              name,
                            ]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                              color: "hsl(var(--foreground))",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="gainCdf"
                            name="Gain CDF"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 0 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="gainUsd"
                            name="Gain USD"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2.5}
                            dot={{ r: 4, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
                      Pas de données disponibles
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Résumé période</CardTitle>
                  <CardDescription>Lecture rapide sur {periodLabel.toLowerCase()} {year}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-primary/5 p-4">
                    <p className="text-sm font-medium text-primary">Meilleure période CDF</p>
                    <p className="mt-2 text-lg font-bold text-foreground">{bestCdfPeriod?.label || "-"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {bestCdfPeriod ? formatCurrency(bestCdfPeriod.totalCdf, "CDF") : "Aucune donnée"}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Total carnet CDF</p>
                    <p className="mt-2 text-lg font-bold text-foreground">
                      {formatCurrency(totals?.totalCarnetCdf ?? 0, "CDF")}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">Total duplicata CDF</p>
                    <p className="mt-2 text-lg font-bold text-foreground">
                      {formatCurrency(totals?.totalDuplicataCdf ?? 0, "CDF")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Liste situation par période</CardTitle>
                <CardDescription>
                  Situation mensuelle filtrée sur {periodLabel.toLowerCase()}
                  {" "}en {year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Période</TableHead>
                        <TableHead className="text-right font-semibold">Montant total initial CDF</TableHead>
                        <TableHead className="text-right font-semibold">Montant total initial USD</TableHead>
                        <TableHead className="text-right font-semibold">Montant total carnet CDF</TableHead>
                        <TableHead className="text-right font-semibold">Montant total duplicata CDF</TableHead>
                        <TableHead className="text-right font-semibold">Total CDF</TableHead>
                        <TableHead className="text-right font-semibold">Total USD</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                            Aucune situation disponible
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedRows.map((row) => (
                          <TableRow key={row.key}>
                            <TableCell className="font-medium text-foreground">{row.label}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(row.totalInitialCdf, "CDF")}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(row.totalInitialUsd, "USD")}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(row.totalCarnetCdf, "CDF")}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(row.totalDuplicataCdf, "CDF")}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-foreground">
                              {formatCurrency(row.totalCdf, "CDF")}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-foreground">
                              {formatCurrency(row.totalUsd, "USD")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {rows.length > 0 && totals && (
                        <TableRow className="bg-muted/30 font-semibold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(totals.totalInitialCdf, "CDF")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(totals.totalInitialUsd, "USD")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(totals.totalCarnetCdf, "CDF")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(totals.totalDuplicataCdf, "CDF")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(totals.totalCdf, "CDF")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(totals.totalUsd, "USD")}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {rows.length > 0 && (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, rows.length)} sur {rows.length} périodes
                    </p>
                    <Pagination className="mx-0 w-auto justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              setPage((current) => Math.max(1, current - 1))
                            }}
                            className={page === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="px-3 text-sm text-muted-foreground">
                            Page {page} sur {totalPages}
                          </span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(event) => {
                              event.preventDefault()
                              setPage((current) => Math.min(totalPages, current + 1))
                            }}
                            className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
