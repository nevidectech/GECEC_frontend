"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
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
import { Input } from "@/components/ui/input"
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
import { Coins, Calculator, TrendingUp, FileText, Calendar, Printer } from "lucide-react"
import {
  createRemunerationsForPeriodAction,
  getCollectorCarnetRemunerationDetailsAction,
  getRemunerationOverviewAction,
  updateRemunerationStatusAction,
  type CollectorCarnetRemunerationDetail,
  type RemunerationOverview,
} from "@/actions/remuneration"
import { toast } from "sonner"

const statusMap = {
  a_verser: { status: "warning" as const, label: "A verser" },
  verser: { status: "success" as const, label: "Verser" },
}

function formatFC(value: number) {
  return `${Math.round(value).toLocaleString("fr-FR")} FC`
}

function formatUSD(value: number) {
  return `$${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatCompactFC(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

function currentMonthValue() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export default function RemunerationPage() {
  const [periodMonth, setPeriodMonth] = useState(currentMonthValue())
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedCollectorId, setExpandedCollectorId] = useState<string | null>(null)
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null)
  const [detailsByCollector, setDetailsByCollector] = useState<Record<string, CollectorCarnetRemunerationDetail[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<RemunerationOverview | null>(null)

  const fetchData = async (month: string) => {
    setLoading(true)
    setError(null)
    const result = await getRemunerationOverviewAction(month)

    if (!result.success || !result.data) {
      setError(result.error ?? "Impossible de charger les remunerations")
      setData(null)
      setLoading(false)
      return
    }

    setData(result.data)
    setLoading(false)
  }

  useEffect(() => {
    void fetchData(periodMonth)
    setExpandedCollectorId(null)
    setDetailsByCollector({})
  }, [periodMonth])

  const pendingTotalFc = useMemo(() => data?.totals.totalRemunerationFc ?? 0, [data])
  const pendingTotalUsd = useMemo(() => data?.totals.totalRemunerationUsd ?? 0, [data])
  const enterpriseGainFc = useMemo(
    () => (data?.totals.totalInitialAmountFc ?? 0) - (data?.totals.totalRemunerationFc ?? 0),
    [data],
  )
  const enterpriseGainUsd = useMemo(
    () => (data?.totals.totalInitialAmountUsd ?? 0) - (data?.totals.totalRemunerationUsd ?? 0),
    [data],
  )

  const handleCreateRemunerations = async () => {
    setCreating(true)
    const result = await createRemunerationsForPeriodAction(periodMonth)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de creer les remunerations")
      setCreating(false)
      return
    }

    toast.success("Remunerations creees avec succes")
    await fetchData(periodMonth)
    setCreating(false)
  }

  const handleToggleStatus = async (collectorId: string, remunerationId: string | null, currentStatus: "a_verser" | "verser") => {
    setUpdatingId(collectorId)
    const nextStatus = currentStatus === "verser" ? "a_verser" : "verser"
    const result = await updateRemunerationStatusAction({
      collectorId,
      remunerationId,
      periodMonth,
      status: nextStatus,
    })

    if (!result.success) {
      toast.error(result.error ?? "Impossible de modifier le statut")
      setUpdatingId(null)
      return
    }

    toast.success(nextStatus === "verser" ? "Marque comme verser" : "Remis a verser")
    await fetchData(periodMonth)
    setUpdatingId(null)
  }

  const handleToggleDetails = async (collectorId: string) => {
    if (expandedCollectorId === collectorId) {
      setExpandedCollectorId(null)
      return
    }

    setExpandedCollectorId(collectorId)
    if (detailsByCollector[collectorId]) return

    setLoadingDetailsId(collectorId)
    const result = await getCollectorCarnetRemunerationDetailsAction({
      collectorId,
      periodMonth,
    })

    if (!result.success) {
      toast.error(result.error ?? "Impossible de charger le detail des carnets")
      setLoadingDetailsId(null)
      return
    }

    setDetailsByCollector((current) => ({
      ...current,
      [collectorId]: result.data ?? [],
    }))
    setLoadingDetailsId(null)
  }

  const ensureCollectorDetails = async (collectorId: string) => {
    if (detailsByCollector[collectorId]) return detailsByCollector[collectorId]

    setLoadingDetailsId(collectorId)
    const result = await getCollectorCarnetRemunerationDetailsAction({
      collectorId,
      periodMonth,
    })
    setLoadingDetailsId(null)

    if (!result.success) {
      toast.error(result.error ?? "Impossible de charger le detail des carnets")
      return null
    }

    const details = result.data ?? []
    setDetailsByCollector((current) => ({
      ...current,
      [collectorId]: details,
    }))
    return details
  }

  const escapeHtml = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;")

  const handlePrintCollectorDetails = async (collector: RemunerationOverview["collectors"][number]) => {
    const details = await ensureCollectorDetails(collector.collectorId)
    if (!details) return

    const printWindow = window.open("", "_blank", "width=1000,height=800")
    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenetre d'impression")
      return
    }

    const rowsHtml = details
      .map((detail) => {
        const initial = detail.currency === 2 ? formatUSD(detail.initialAmount) : formatFC(detail.initialAmount)
        return `
          <tr>
            <td>${escapeHtml(detail.carnetNumber)}</td>
            <td>${escapeHtml(detail.clientCode)}</td>
            <td>${escapeHtml(formatDate(detail.createdAt))}</td>
            <td class="num">${escapeHtml(initial)}</td>
            <td class="num">${escapeHtml(formatFC(detail.remunerationAmountFc))}</td>
            <td class="num">${escapeHtml(formatUSD(detail.remunerationAmountUsd))}</td>
          </tr>
        `
      })
      .join("")

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Detail Remuneration - ${escapeHtml(collector.collectorName)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 8px 0; }
            p { margin: 2px 0; }
            .meta { margin-bottom: 18px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; }
            .num { text-align: right; white-space: nowrap; }
            @media print {
              body { margin: 12px; }
            }
          </style>
        </head>
        <body>
          <h1>Detail remuneration par carnet</h1>
          <div class="meta">
            <p><strong>Collecteur:</strong> ${escapeHtml(collector.collectorName)}</p>
            <p><strong>Periode:</strong> ${escapeHtml(data?.periodLabel ?? periodMonth)}</p>
            <p><strong>Taux:</strong> ${escapeHtml((data?.appliedRatePercent ?? 40).toFixed(2))}%</p>
            <p><strong>Total collecteur:</strong> ${escapeHtml(formatFC(collector.remunerationAmountFc))} / ${escapeHtml(formatUSD(collector.remunerationAmountUsd))}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Carnet</th>
                <th>Client</th>
                <th>Date creation</th>
                <th class="num">Initial</th>
                <th class="num">Remuneration CDF</th>
                <th class="num">Remuneration USD</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="6">Aucun carnet sur cette periode.</td></tr>'}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  function formatDate(value: string | null) {
    if (!value) return "-"
    return new Date(value).toLocaleDateString("fr-FR")
  }

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Remuneration" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Remuneration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chaque collecteur est remunere sur {data?.appliedRatePercent ?? 40}% du montant initial total
              des carnets crees pendant la periode (incluant le mois precedent)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="month"
              className="w-[170px]"
              value={periodMonth}
              onChange={(event) => setPeriodMonth(event.target.value)}
            />
            <Button variant="outline" className="gap-1.5" onClick={() => void fetchData(periodMonth)}>
              <Calculator className="h-4 w-4" />
              Recalculer
            </Button>
            <Button className="gap-1.5" onClick={() => void handleCreateRemunerations()} disabled={creating || loading}>
              {creating ? "Creation..." : "Creer remunerations"}
            </Button>
          </div>
        </div>

        {error && (
          <Card>
            <CardContent className="p-4 text-sm text-red-500">{error}</CardContent>
          </Card>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total a verser CDF ({data?.periodLabel ?? "-"})</p>
                <p className="text-xl font-bold text-foreground">{formatFC(data?.totals.totalRemunerationFc ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total a verser USD ({data?.periodLabel ?? "-"})</p>
                <p className="text-xl font-bold text-foreground">{formatUSD(data?.totals.totalRemunerationUsd ?? 0)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A verser (CDF + USD)</p>
                <p className="text-sm font-bold text-foreground">
                  {formatFC(pendingTotalFc)} / {formatUSD(pendingTotalUsd)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gain entreprise</p>
                <p className="text-sm font-bold text-foreground">
                  {formatFC(enterpriseGainFc)} / {formatUSD(enterpriseGainUsd)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Evolution des remunerations</CardTitle>
            <CardDescription>6 derniers mois (base carnets crees)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.chart ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatCompactFC} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "Remuneration CDF") return [formatFC(value), name]
                      return [formatUSD(value), name]
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="montantFc" name="Remuneration CDF" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="montantUsd" name="Remuneration USD" fill="hsl(var(--chart-4))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">
              Detail par collecteur - {data?.periodLabel ?? "Periode"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Collecteur</TableHead>
                    <TableHead className="font-semibold text-right">Carnets</TableHead>
                    <TableHead className="font-semibold text-right">Base CDF</TableHead>
                    <TableHead className="font-semibold text-right">Base USD</TableHead>
                    <TableHead className="font-semibold text-right">Taux</TableHead>
                    <TableHead className="font-semibold text-right">Remuneration CDF</TableHead>
                    <TableHead className="font-semibold text-right">Remuneration USD</TableHead>
                    <TableHead className="font-semibold text-right">Gain entreprise CDF</TableHead>
                    <TableHead className="font-semibold text-right">Gain entreprise USD</TableHead>
                    <TableHead className="font-semibold text-center">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && (data?.collectors.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                        Aucune remuneration calculee pour cette periode.
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    (data?.collectors ?? []).map((row) => (
                      <Fragment key={row.collectorId}>
                        <TableRow>
                          <TableCell className="font-medium text-foreground">{row.collectorName}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{row.carnetCount}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatFC(row.totalInitialAmountFc)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatUSD(row.totalInitialAmountUsd)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {(data?.appliedRatePercent ?? 40).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{formatFC(row.remunerationAmountFc)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                            +{formatUSD(row.remunerationAmountUsd)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatFC(row.totalInitialAmountFc - row.remunerationAmountFc)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatUSD(row.totalInitialAmountUsd - row.remunerationAmountUsd)}
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge status={statusMap[row.status].status} label={statusMap[row.status].label} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => void handleToggleDetails(row.collectorId)}
                                disabled={loadingDetailsId === row.collectorId}
                              >
                                {expandedCollectorId === row.collectorId ? "Masquer carnets" : "Voir carnets"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handlePrintCollectorDetails(row)}
                                disabled={loadingDetailsId === row.collectorId}
                              >
                                <Printer className="h-3.5 w-3.5 mr-1.5" />
                                Imprimer PDF
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === row.collectorId || !row.remunerationId}
                                onClick={() => void handleToggleStatus(row.collectorId, row.remunerationId, row.status)}
                              >
                                {row.status === "verser" ? "Remettre a verser" : "Marquer verser"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedCollectorId === row.collectorId && (
                          <TableRow>
                            <TableCell colSpan={11} className="bg-muted/30 p-4">
                              {loadingDetailsId === row.collectorId ? (
                                <p className="text-sm text-muted-foreground">Chargement des carnets...</p>
                              ) : (
                                <div className="rounded-md border bg-background overflow-hidden">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Carnet</TableHead>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Date creation</TableHead>
                                        <TableHead className="text-right">Initial</TableHead>
                                        <TableHead className="text-right">Remuneration CDF</TableHead>
                                        <TableHead className="text-right">Remuneration USD</TableHead>
                                        <TableHead className="text-right">Gain entreprise</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(detailsByCollector[row.collectorId] ?? []).length === 0 && (
                                        <TableRow>
                                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                                            Aucun carnet sur cette periode.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                      {(detailsByCollector[row.collectorId] ?? []).map((detail) => (
                                        <TableRow key={detail.carnetId}>
                                          <TableCell className="font-mono text-xs">{detail.carnetNumber}</TableCell>
                                          <TableCell>{detail.clientCode}</TableCell>
                                          <TableCell>{formatDate(detail.createdAt)}</TableCell>
                                          <TableCell className="text-right">
                                            {detail.currency === 2 ? formatUSD(detail.initialAmount) : formatFC(detail.initialAmount)}
                                          </TableCell>
                                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                                            +{formatFC(detail.remunerationAmountFc)}
                                          </TableCell>
                                          <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                                            +{formatUSD(detail.remunerationAmountUsd)}
                                          </TableCell>
                                          <TableCell className="text-right">
                                            {detail.currency === 2
                                              ? formatUSD(detail.initialAmount - detail.remunerationAmountUsd)
                                              : formatFC(detail.initialAmount - detail.remunerationAmountFc)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  {!loading && (data?.collectors.length ?? 0) > 0 && (
                    <TableRow className="bg-muted/40">
                      <TableCell className="font-semibold">Total</TableCell>
                      <TableCell className="text-right font-semibold">
                        {(data?.collectors ?? []).reduce((sum, row) => sum + row.carnetCount, 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatFC((data?.collectors ?? []).reduce((sum, row) => sum + row.totalInitialAmountFc, 0))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatUSD((data?.collectors ?? []).reduce((sum, row) => sum + row.totalInitialAmountUsd, 0))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {(data?.appliedRatePercent ?? 40).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatFC((data?.collectors ?? []).reduce((sum, row) => sum + row.remunerationAmountFc, 0))}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatUSD((data?.collectors ?? []).reduce((sum, row) => sum + row.remunerationAmountUsd, 0))}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatFC(
                          (data?.collectors ?? []).reduce(
                            (sum, row) => sum + (row.totalInitialAmountFc - row.remunerationAmountFc),
                            0,
                          ),
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatUSD(
                          (data?.collectors ?? []).reduce(
                            (sum, row) => sum + (row.totalInitialAmountUsd - row.remunerationAmountUsd),
                            0,
                          ),
                        )}
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
