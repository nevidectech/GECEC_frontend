"use client"

import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { StatusBadge } from "@/components/status-badge"
import { createClient } from "@/lib/supabase/client"
import type { Carnet, Client, Withdrawal } from "@/types/db"
import {
  ArrowUpFromLine,
  Search,
  Download,
  Filter,
  AlertTriangle,
  Printer,
  CheckCircle2,
} from "lucide-react"

const currencyMap: Record<number, string> = {
  0: "CDF",
  1: "USD",
  2: "EUR",
}

type WithdrawalStatus = "completed" | "rejected"

type WithdrawalView = {
  id: string
  reference: string
  carnet: string
  client: string
  amount: number
  currency: number
  withdrawalDate: string
  date: string
  validator: string
  status: WithdrawalStatus
}

const statusMap: Record<WithdrawalStatus, { status: "success" | "warning" | "error"; label: string }> = {
  completed: { status: "success", label: "Valide" },
  rejected: { status: "error", label: "Rejete" },
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value))
}

function formatMoney(value: number, currency: number) {
  const label = currencyMap[currency] ?? `CUR-${currency}`
  const locale = label === "USD" || label === "EUR" ? "en-US" : "fr-FR"
  return `${new Intl.NumberFormat(locale).format(value)} ${label}`
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function formatMonthlyTotals(entries: WithdrawalView[]) {
  const totals = new Map<number, number>()
  entries.forEach((entry) => {
    const current = totals.get(entry.currency) ?? 0
    totals.set(entry.currency, current + entry.amount)
  })

  if (totals.size === 0) return "0"

  return Array.from(totals.entries())
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" / ")
}

export default function RetraitsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [withdrawals, setWithdrawals] = useState<WithdrawalView[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    async function fetchWithdrawals() {
      setLoading(true)
      setFetchError(null)

      const [withdrawalsRes, carnetsRes, clientsRes] = await Promise.all([
        supabase.from("withdrawal").select("*").order("withdrawal_date", { ascending: false }),
        supabase.from("carnet").select("id, number, client_code"),
        supabase.from("client").select("code, first_name, last_name"),
      ])

      if (withdrawalsRes.error) {
        setFetchError(withdrawalsRes.error.message)
        setWithdrawals([])
        setLoading(false)
        return
      }

      if (carnetsRes.error) {
        setFetchError(carnetsRes.error.message)
      }
      if (clientsRes.error) {
        setFetchError(clientsRes.error.message)
      }

      const carnetMap = new Map(
        ((carnetsRes.data ?? []) as Array<Pick<Carnet, "id" | "number" | "client_code">>).map((carnet) => [
          carnet.id,
          carnet,
        ]),
      )
      const clientMap = new Map(
        ((clientsRes.data ?? []) as Array<Pick<Client, "code" | "first_name" | "last_name">>).map((client) => [
          client.code,
          `${client.first_name} ${client.last_name}`.trim(),
        ]),
      )

      const mapped = ((withdrawalsRes.data ?? []) as Withdrawal[]).map((item, index) => {
        const carnet = carnetMap.get(item.carnet_id)
        const clientName = carnet?.client_code ? clientMap.get(carnet.client_code) : null
        const status: WithdrawalStatus = item.deleted_by ? "rejected" : "completed"

        return {
          id: item.id,
          reference: `RET-${new Date(item.withdrawal_date).getFullYear()}-${String(index + 1).padStart(4, "0")}`,
          carnet: carnet?.number ?? item.carnet_id,
          client: clientName ?? carnet?.client_code ?? "-",
          amount: Number(item.amount ?? 0),
          currency: item.currency,
          withdrawalDate: item.withdrawal_date,
          date: formatDate(item.withdrawal_date),
          validator: item.updated_by ?? item.created_by,
          status,
        } satisfies WithdrawalView
      })

      setWithdrawals(mapped)
      setLoading(false)
    }

    void fetchWithdrawals()
  }, [supabase])

  const filtered = withdrawals.filter((item) => {
    const matchSearch =
      item.reference.toLowerCase().includes(search.toLowerCase()) ||
      item.client.toLowerCase().includes(search.toLowerCase()) ||
      item.carnet.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || item.status === statusFilter
    return matchSearch && matchStatus
  })

  const now = new Date()
  const completedMonth = withdrawals.filter(
    (item) => item.status === "completed" && monthKey(new Date(item.withdrawalDate)) === monthKey(now),
  )
  const rejectedMonth = withdrawals.filter(
    (item) => item.status === "rejected" && monthKey(new Date(item.withdrawalDate)) === monthKey(now),
  )
  const totalMonthLabel = formatMonthlyTotals(completedMonth)

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Retraits" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Retraits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Historique des retraits enregistres
            </p>
          </div>
          <Button className="gap-2" disabled>
            <ArrowUpFromLine className="h-4 w-4" />
            Nouveau retrait
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valides ce mois</p>
                <p className="text-xl font-bold text-foreground">{completedMonth.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejetes ce mois</p>
                <p className="text-xl font-bold text-foreground">{rejectedMonth.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowUpFromLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Montant total (mois)</p>
                <p className="text-xl font-bold text-foreground">{totalMonthLabel}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">Historique des retraits</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-56 h-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-9">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="completed">Valide</SelectItem>
                    <SelectItem value="rejected">Rejete</SelectItem>
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
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Carnet</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Montant</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Validateur</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Chargement des retraits...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && fetchError && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-red-500">
                        {fetchError}
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    !fetchError &&
                    filtered.map((retrait) => (
                      <TableRow key={retrait.id}>
                        <TableCell className="font-mono text-sm font-medium text-foreground">
                          {retrait.reference}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary">{retrait.carnet}</TableCell>
                        <TableCell className="font-medium text-foreground">{retrait.client}</TableCell>
                        <TableCell className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                          -{formatMoney(retrait.amount, retrait.currency)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{retrait.date}</TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">{retrait.validator}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={statusMap[retrait.status].status}
                            label={statusMap[retrait.status].label}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {retrait.status === "completed" ? (
                            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                              <Printer className="h-3 w-3" />
                              Recu
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}

                  {!loading && !fetchError && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Aucun retrait trouve.
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
