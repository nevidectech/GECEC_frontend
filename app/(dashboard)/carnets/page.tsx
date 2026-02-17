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
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Copy,
  ArrowUpFromLine,
  Download,
  Filter,
  BookOpen,
} from "lucide-react"

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
  0: "CDF",
  1: "USD",
  2: "EUR",
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

  useEffect(() => {
    async function fetchCarnets() {
      setLoading(true)
      setFetchError(null)

      const { data, error } = await supabase
        .from("carnet")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        setFetchError(error.message)
        setCarnets([])
      } else {
        setCarnets((data ?? []).map((row) => mapCarnet(row as Carnet)))
      }

      setLoading(false)
    }

    void fetchCarnets()
  }, [supabase])

  const filtered = carnets.filter((c) => {
    const matchSearch =
      c.number.toLowerCase().includes(search.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = carnets.filter((c) => c.status === "active").length
  const validatedCount = carnets.filter((c) => c.validated).length
  const closedCount = carnets.filter((c) => c.status === "closed").length

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
                <p className="text-xl font-bold text-foreground">{activeCount}</p>
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
                <p className="text-xl font-bold text-foreground">{validatedCount}</p>
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
                <p className="text-xl font-bold text-foreground">{closedCount}</p>
              </div>
            </CardContent>
          </Card>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="closed">Cloture</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
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
                    filtered.map((carnet) => (
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
                            <DropdownMenuItem>
                              <ArrowUpFromLine className="h-4 w-4 mr-2" />
                              Retrait
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))}

                  {!loading && !fetchError && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                        Aucun carnet trouve.
                      </TableCell>
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
