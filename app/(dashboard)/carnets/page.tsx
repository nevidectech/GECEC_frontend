"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { Carnet } from "@/types/db"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/status-badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Copy,
  ArrowUpFromLine,
  Download,
  Filter,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet,
  Calendar,
} from "lucide-react"
import React from "react"

const statusMap: Record<string, { status: "success" | "warning" | "error" | "info"; label: string }> = {
  active: { status: "success", label: "Actif" },
  closed: { status: "error", label: "Cloture" },
}

type CarnetView = {
  id: string
  number: string
  clientCode: string
  month: string
  initialAmount: number
  price: number
  currencyLabel: string
  status: "active" | "closed"
  createdAt: string
  validated: boolean
}

const currencyMap: Record<number, string> = {
  1: "CDF",
  2: "USD",
}

function formatMoney(value: number, currencyLabel: string) {
  const locale = currencyLabel === "USD" || currencyLabel === "EUR" ? "en-US" : "fr-FR"
  return `${new Intl.NumberFormat(locale).format(value)} ${currencyLabel}`
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value))
}

function mapCarnet(row: Carnet): CarnetView {
  return {
    id: row.id,
    number: row.number,
    clientCode: row.client_code ?? "-",
    month: row.month ?? "-",
    initialAmount: Number(row.initial_amount ?? 0),
    price: Number(row.price ?? 0),
    currencyLabel: currencyMap[row.currency] ?? `CUR-${row.currency}`,
    status: row.is_archived ? "closed" : "active",
    createdAt: formatDate(row.created_at),
    validated: !!row.validated_at,
  }
}

export default function CarnetsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [carnets, setCarnets] = useState<CarnetView[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const [totals, setTotals] = useState({
    cdf: { initial: 0, collected: 0, savings: 0, price: 0 },
    usd: { initial: 0, collected: 0, savings: 0, price: 0 },
  })
  const [counts, setCounts] = useState({
    active: 0,
    validated: 0,
    closed: 0,
  })

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ]

  const monthMap: Record<string, string> = {
    "Janvier": "01", "Février": "02", "Mars": "03", "Avril": "04",
    "Mai": "05", "Juin": "06", "Juillet": "07", "Août": "08",
    "Septembre": "09", "Octobre": "10", "Novembre": "11", "Décembre": "12"
  }

  const getDbMonth = (label: string) => {
    if (label === "all") return null
    return `${monthMap[label]}/2026`
  }

  useEffect(() => {
    async function fetchCarnets() {
      setLoading(true)
      setFetchError(null)

      let query = supabase
        .from("carnet")
        .select("*", { count: "exact" })

      if (statusFilter !== "all") {
        query = query.eq("is_archived", statusFilter === "closed")
      }

      const dbMonth = getDbMonth(monthFilter)
      if (dbMonth) {
        query = query.ilike("month", `%${dbMonth}%`)
      }

      if (search) {
        query = query.or(`number.ilike.%${search}%,client_code.ilike.%${search}%`)
      }

      // Fetch global counts for the current search/month filters
      const { count: activeCount } = await supabase.from("carnet").select("*", { count: "exact", head: true })
        .eq("is_archived", false)
        .ilike("month", dbMonth ? `%${dbMonth}%` : "%")
        .or(search ? `number.ilike.%${search}%,client_code.ilike.%${search}%` : "number.ilike.%")

      const { count: validatedCount } = await supabase.from("carnet").select("*", { count: "exact", head: true })
        .not("validated_at", "is", null)
        .ilike("month", dbMonth ? `%${dbMonth}%` : "%")
        .or(search ? `number.ilike.%${search}%,client_code.ilike.%${search}%` : "number.ilike.%")

      const { count: closedCount } = await supabase.from("carnet").select("*", { count: "exact", head: true })
        .eq("is_archived", true)
        .ilike("month", dbMonth ? `%${dbMonth}%` : "%")
        .or(search ? `number.ilike.%${search}%,client_code.ilike.%${search}%` : "number.ilike.%")

      setCounts({
        active: activeCount ?? 0,
        validated: validatedCount ?? 0,
        closed: closedCount ?? 0,
      })

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) {
        setFetchError(error.message)
        setCarnets([])
        setTotalCount(0)
      } else {
        setCarnets((data ?? []).map((row) => mapCarnet(row as Carnet)))
        setTotalCount(count ?? 0)
      }

      setLoading(false)
    }

    void fetchCarnets()
  }, [supabase, page, pageSize, search, statusFilter, monthFilter])

  useEffect(() => {
    async function fetchTotals() {
      let carnetQuery = supabase.from("carnet").select("id, initial_amount, price, currency, month, is_archived")

      if (statusFilter !== "all") {
        carnetQuery = carnetQuery.eq("is_archived", statusFilter === "closed")
      }

      const dbMonth = getDbMonth(monthFilter)
      if (dbMonth) {
        carnetQuery = carnetQuery.ilike("month", `%${dbMonth}%`)
      }

      if (search) {
        carnetQuery = carnetQuery.or(`number.ilike.%${search}%,client_code.ilike.%${search}%`)
      }

      const { data: carnetsData } = await carnetQuery
      const filteredCarnetIds = (carnetsData ?? []).map(c => (c as any).id)

      let cotisationsQuery = supabase.from("cotisation").select("amount, currency, carnet_id")
      if (filteredCarnetIds.length > 0) {
        cotisationsQuery = cotisationsQuery.in("carnet_id", filteredCarnetIds)
      } else {
        setTotals({
          cdf: { initial: 0, collected: 0, savings: 0, price: 0 },
          usd: { initial: 0, collected: 0, savings: 0, price: 0 },
        })
        return
      }

      const { data: cotisationsData } = await cotisationsQuery

      const calculate = (curr: number) => {
        const initial = (carnetsData ?? []).filter(c => c.currency === curr).reduce((sum, c) => sum + Number(c.initial_amount), 0)
        const price = (carnetsData ?? []).filter(c => c.currency === curr).reduce((sum, c) => sum + Number(c.price), 0)
        const cotisations = (cotisationsData ?? []).filter(c => c.currency === curr).reduce((sum, c) => sum + Number(c.amount), 0)
        return { initial, collected: initial + cotisations, savings: cotisations, price }
      }

      setTotals({
        cdf: calculate(1),
        usd: calculate(2),
      })
    }
    void fetchTotals()
  }, [supabase, statusFilter, monthFilter, search])

  const handleExport = async () => {
    let query = supabase.from("carnet").select("*")

    if (statusFilter !== "all") {
      query = query.eq("is_archived", statusFilter === "closed")
    }

    const dbMonth = getDbMonth(monthFilter)
    if (dbMonth) {
      query = query.ilike("month", `%${dbMonth}%`)
    }

    if (search) {
      query = query.or(`number.ilike.%${search}%,client_code.ilike.%${search}%`)
    }

    const { data: carnetsData, error: carnetError } = await query.order("created_at", { ascending: false })

    if (carnetError || !carnetsData || carnetsData.length === 0) return

    const carnetIds = carnetsData.map(c => c.id)
    const { data: cotisationsData, error: cotError } = await supabase
      .from("cotisation")
      .select("carnet_id, amount, currency")
      .in("carnet_id", carnetIds)

    if (cotError) return

    const headers = [
      "Numero",
      "Code Client",
      "Mois",
      "Statut",
      "Cree le",
      "Total Initial CDF",
      "Total Collecté CDF",
      "Épargne Totale CDF",
      "Total Initial USD",
      "Total Collecté USD",
      "Épargne Totale USD"
    ]

    const rows = carnetsData.map(c => {
      const relatedCotisations = (cotisationsData ?? []).filter(cot => cot.carnet_id === c.id)

      const initialCDF = c.currency === 1 ? Number(c.initial_amount) : 0
      const initialUSD = c.currency === 2 ? Number(c.initial_amount) : 0

      const epargneCDF = relatedCotisations.filter(cot => cot.currency === 1).reduce((sum, cot) => sum + Number(cot.amount), 0)
      const epargneUSD = relatedCotisations.filter(cot => cot.currency === 2).reduce((sum, cot) => sum + Number(cot.amount), 0)

      const collecteCDF = initialCDF + epargneCDF
      const collecteUSD = initialUSD + epargneUSD

      return [
        c.number,
        c.client_code,
        c.month,
        c.is_archived ? "Cloture" : "Actif",
        c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
        initialCDF,
        collecteCDF,
        epargneCDF,
        initialUSD,
        collecteUSD,
        epargneUSD
      ]
    })

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `carnets_detail_${monthFilter}_${statusFilter}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Carnets" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Carnets d&apos;epargne</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion des {carnets.length} carnets enregistres
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau carnet
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-xl font-bold text-foreground">{counts.active}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valides</p>
                <p className="text-xl font-bold text-foreground">{counts.validated}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <BookOpen className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clotures</p>
                <p className="text-xl font-bold text-foreground">{counts.closed}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/60"></div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Totaux Franc Congolais (CDF)</span>
            <div className="h-px flex-1 bg-border/60"></div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Initial CDF</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("fr-FR").format(totals.cdf.initial)} CDF
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <ArrowUpFromLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Collecté CDF</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("fr-FR").format(totals.cdf.collected)} CDF
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Épargne Totale CDF</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("fr-FR").format(totals.cdf.savings)} CDF
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Prix Carnets CDF</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("fr-FR").format(totals.cdf.price)} CDF
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border/60"></div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Totaux Dollar Américain (USD)</span>
            <div className="h-px flex-1 bg-border/60"></div>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Initial USD</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("en-US").format(totals.usd.initial)} USD
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <ArrowUpFromLine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Collecté USD</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("en-US").format(totals.usd.collected)} USD
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Épargne Totale USD</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("en-US").format(totals.usd.savings)} USD
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">Liste des carnets</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numero ou code client..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                  <SelectTrigger className="w-32 h-9">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous status</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="closed">Cloture</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={(val) => { setMonthFilter(val); setPage(1); }}>
                  <SelectTrigger className="w-32 h-9">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous mois</SelectItem>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Numero</TableHead>
                    <TableHead className="font-semibold">Code client</TableHead>
                    <TableHead className="font-semibold">Mois</TableHead>
                    <TableHead className="font-semibold">Montant initial</TableHead>
                    <TableHead className="font-semibold">Prix</TableHead>
                    <TableHead className="font-semibold">Devise</TableHead>
                    <TableHead className="font-semibold">Cree le</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        Chargement des carnets...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && fetchError && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-red-500">
                        {fetchError}
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    !fetchError &&
                    carnets.map((carnet) => (
                      <TableRow key={carnet.id} className="group">
                        <TableCell>
                          <Link
                            href={`/carnets/${carnet.id}`}
                            className="font-mono text-sm font-medium text-primary hover:underline"
                          >
                            {carnet.number}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{carnet.clientCode}</TableCell>
                        <TableCell className="text-muted-foreground">{carnet.month}</TableCell>
                        <TableCell className="font-semibold tabular-nums text-foreground">
                          {formatMoney(carnet.initialAmount, carnet.currencyLabel)}
                        </TableCell>
                        <TableCell className="font-semibold tabular-nums text-foreground">
                          {formatMoney(carnet.price, carnet.currencyLabel)}
                        </TableCell>
                        <TableCell>{carnet.currencyLabel}</TableCell>
                        <TableCell className="text-muted-foreground">{carnet.createdAt}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={statusMap[carnet.status].status}
                            label={statusMap[carnet.status].label}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/carnets/${carnet.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicata
                              </DropdownMenuItem>
                              {carnet.status === "active" && (
                                <DropdownMenuItem>
                                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                                  Retrait
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                  {!loading && !fetchError && carnets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        Aucun carnet trouve.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalCount > pageSize && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, totalCount)} sur {totalCount} carnets
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="gap-1 pl-2.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Button>
                    </PaginationItem>
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === Math.ceil(totalCount / pageSize) || Math.abs(p - page) <= 1)
                        .map((p, i, arr) => (
                          <React.Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted-foreground">...</span>}
                            <PaginationItem>
                              <Button
                                variant={page === p ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(p)}
                                className="h-8 w-8 p-0"
                              >
                                {p}
                              </Button>
                            </PaginationItem>
                          </React.Fragment>
                        ))
                      }
                    </div>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= Math.ceil(totalCount / pageSize)}
                        onClick={() => setPage((p) => p + 1)}
                        className="gap-1 pr-2.5"
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
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
