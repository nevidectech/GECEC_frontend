"use client"

import { useState, useEffect, useCallback } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Search,
  Calendar as CalendarIcon,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  User,
  ListChecks,
} from "lucide-react"
import { toast } from "sonner"
import { listCollectorsAction } from "@/actions/collection-deposits"
import { listCotisationsAction, getCotisationsSummaryAction, type CotisationWithDetails } from "@/actions/cotisations"
import type { Profile } from "@/types/db"

const currencyMap: Record<number, string> = {
  1: "FC",
  2: "USD",
}

export default function CotisationsPage() {
  const [loading, setLoading] = useState(true)
  const [cotisations, setCotisations] = useState<CotisationWithDetails[]>([])
  const [collectors, setCollectors] = useState<Profile[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [summary, setSummary] = useState({ totalCdf: 0, totalUsd: 0 })

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [filterCollector, setFilterCollector] = useState("all")
  const [filterCarnet, setFilterCarnet] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [listResult, summaryResult] = await Promise.all([
        listCotisationsAction({
          date: filterDate,
          collectorId: filterCollector,
          carnetNumber: filterCarnet,
          page,
          pageSize,
        }),
        getCotisationsSummaryAction({
          date: filterDate,
          collectorId: filterCollector,
          carnetNumber: filterCarnet,
        }),
      ])

      if (listResult.success) {
        setCotisations(listResult.data || [])
        setTotalCount(listResult.count || 0)
      } else {
        toast.error("Erreur lors du chargement des cotisations: " + listResult.error)
      }

      if (summaryResult.success) {
        setSummary(summaryResult.data || { totalCdf: 0, totalUsd: 0 })
      }
    } catch (error) {
      toast.error("Une erreur inattendue est survenue")
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterCollector, filterCarnet, page])

  useEffect(() => {
    async function fetchCollectors() {
      const result = await listCollectorsAction()
      if (result.success && result.data) {
        setCollectors(result.data)
      }
    }
    fetchCollectors()
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    if (cotisations.length === 0) {
      toast.error("Aucune donnée à exporter")
      return
    }

    const headers = ["Date", "Heure", "Carnet #", "Client", "Montant", "Devise", "Collecteur", "Code Transaction"]
    const rows = cotisations.map((c) => {
      const date = new Date(c.cotisation_date)
      return [
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        c.carnet?.number || "-",
        c.carnet?.client_code || "-",
        c.amount,
        currencyMap[c.currency] || c.currency,
        c.collector?.username || c.collector?.email || "-",
        c.transaction_code || "-",
      ]
    })

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `cotisations_${filterDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Operations" }, { label: "Cotisations" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cotisations Journalières</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Liste détaillée des cotisations enregistrées
            </p>
          </div>
          <Button variant="outline" className="gap-2 h-9" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Collecté CDF</p>
                <p className="text-2xl font-bold text-foreground">
                  {summary.totalCdf.toLocaleString()} FC
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Collecté USD</p>
                <p className="text-2xl font-bold text-foreground">
                  ${summary.totalUsd.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4">
              <CardTitle className="text-base font-semibold">Filtres</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-9 h-10"
                      value={filterDate}
                      onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collector">Collecteur</Label>
                  <Select value={filterCollector} onValueChange={(val) => { setFilterCollector(val); setPage(1); }}>
                    <SelectTrigger id="collector" className="h-10">
                      <User className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Tous les collecteurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les collecteurs</SelectItem>
                      {collectors.map((c) => (
                        <SelectItem key={c.user_id} value={c.user_id}>
                          {c.username || c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carnet">N° Carnet / Client</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="carnet"
                      placeholder="Rechercher..."
                      className="pl-9 h-10"
                      value={filterCarnet}
                      onChange={(e) => { setFilterCarnet(e.target.value); setPage(1); }}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button variant="secondary" className="w-full h-10 gap-2" onClick={() => fetchData()}>
                    <Filter className="h-4 w-4" />
                    Actualiser
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Date & Heure</TableHead>
                    <TableHead className="font-semibold">Carnet #</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold text-right">Montant</TableHead>
                    <TableHead className="font-semibold">Devise</TableHead>
                    <TableHead className="font-semibold">Collecteur</TableHead>
                    <TableHead className="font-semibold">Référence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Chargement des cotisations...
                      </TableCell>
                    </TableRow>
                  ) : cotisations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Aucune cotisation trouvée pour ces filtres.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cotisations.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(c.cotisation_date).toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground">{new Date(c.cotisation_date).toLocaleTimeString()}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold text-primary">
                          {c.carnet?.number || "-"}
                        </TableCell>
                        <TableCell className="font-medium">{c.carnet?.client_code || "-"}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {c.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {currencyMap[c.currency] || c.currency}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {(c.collector?.username || c.collector?.email || "?")[0].toUpperCase()}
                            </div>
                            <span className="text-sm">{c.collector?.username || c.collector?.email || "-"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {c.transaction_code || c.receipt_number || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalCount > pageSize && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, totalCount)} sur {totalCount}
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="gap-1 h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <div className="flex items-center px-4 text-sm font-medium">
                      Page {page} sur {Math.ceil(totalCount / pageSize)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= Math.ceil(totalCount / pageSize)}
                      onClick={() => setPage(p => p + 1)}
                      className="gap-1 h-8 px-2"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
