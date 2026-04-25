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
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { Carnet, Client, Withdrawal } from "@/types/db"
import {
  ArrowUpFromLine,
  Calendar as CalendarIcon,
  Search,
  Download,
  Filter,
  AlertTriangle,
  Printer,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

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

type UserProfileName = {
  user_id: string
  username: string | null
}

const statusMap: Record<WithdrawalStatus, { status: "success" | "warning" | "error"; label: string }> = {
  completed: { status: "success", label: "Valide" },
  rejected: { status: "error", label: "Rejete" },
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value))
}

function toDateInputValue(value: string) {
  return new Date(value).toLocaleDateString("en-CA")
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

function getStatusLabel(status: WithdrawalStatus) {
  return statusMap[status].label
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export default function RetraitsPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user: currentUser } = useCurrentUser()
  const [withdrawals, setWithdrawals] = useState<WithdrawalView[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

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

      const validatorIds = Array.from(
        new Set(
          (withdrawalsRes.data ?? [])
            .flatMap((item) => [item.created_by, item.updated_by])
            .filter((value): value is string => Boolean(value)),
        ),
      )

      let profilesData: UserProfileName[] = []
      let profilesError: string | null = null

      if (validatorIds.length) {
        const profilesRes = await supabase.from("user_profile").select("user_id, username").in("user_id", validatorIds)
        profilesData = (profilesRes.data ?? []) as UserProfileName[]
        if (profilesRes.error) {
          profilesError = profilesRes.error.message
        }
      }

      if (profilesError) {
        console.error(profilesError)
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
      const profileMap = new Map(
        profilesData.map((profile) => [profile.user_id, profile.username?.trim() || profile.user_id]),
      )

      const mapped = ((withdrawalsRes.data ?? []) as Withdrawal[]).map((item, index) => {
        const carnet = carnetMap.get(item.carnet_id)
        const clientName = carnet?.client_code ? clientMap.get(carnet.client_code) : null
        const status: WithdrawalStatus = item.deleted_by ? "rejected" : "completed"
        const validatorId = item.updated_by ?? item.created_by
        const validatorName = validatorId ? profileMap.get(validatorId) : null

        return {
          id: item.id,
          reference: `RET-${new Date(item.withdrawal_date).getFullYear()}-${String(index + 1).padStart(4, "0")}`,
          carnet: carnet?.number ?? item.carnet_id,
          client: clientName ?? carnet?.client_code ?? "-",
          amount: Number(item.amount ?? 0),
          currency: item.currency,
          withdrawalDate: item.withdrawal_date,
          date: formatDate(item.withdrawal_date),
          validator: validatorName ?? validatorId ?? "-",
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
    const matchDate = !dateFilter || toDateInputValue(item.withdrawalDate) === dateFilter
    return matchSearch && matchStatus && matchDate
  })

  const now = new Date()
  const completedMonth = withdrawals.filter(
    (item) => item.status === "completed" && monthKey(new Date(item.withdrawalDate)) === monthKey(now),
  )
  const rejectedMonth = withdrawals.filter(
    (item) => item.status === "rejected" && monthKey(new Date(item.withdrawalDate)) === monthKey(now),
  )
  const totalMonthLabel = formatMonthlyTotals(completedMonth)

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      toast.error("Aucun retrait à exporter")
      return
    }

    try {
      const { utils, writeFile } = await import("xlsx")
      const rows = filtered.map((item) => ({
        Référence: item.reference,
        Carnet: item.carnet,
        Client: item.client,
        Montant: item.amount,
        Devise: currencyMap[item.currency] ?? `CUR-${item.currency}`,
        Date: item.date,
        Validateur: item.validator,
        Statut: getStatusLabel(item.status),
      }))

      const ws = utils.json_to_sheet(rows)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, "Retraits")
      writeFile(wb, `retraits_${dateFilter || "tous"}.xlsx`)
      toast.success("Export Excel généré")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de générer l'export Excel")
    }
  }

  const handleExportPdf = async () => {
    if (filtered.length === 0) {
      toast.error("Aucun retrait à exporter")
      return
    }

    try {
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default
      const doc = new jsPDF({ orientation: "landscape" })

      doc.setFontSize(16)
      doc.text("HISTORIQUE DES RETRAITS", 148, 14, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")}`, 14, 22)
      doc.text(
        `Filtres: ${search ? `recherche="${search}"` : "aucune recherche"} | ${statusFilter !== "all" ? `statut=${getStatusLabel(statusFilter as WithdrawalStatus)}` : "tous statuts"} | ${dateFilter ? `date=${dateFilter}` : "toutes dates"}`,
        14,
        28,
      )

      autoTable(doc, {
        startY: 34,
        head: [["Référence", "Carnet", "Client", "Montant", "Date", "Validateur", "Statut"]],
        body: filtered.map((item) => [
          item.reference,
          item.carnet,
          item.client,
          formatMoney(item.amount, item.currency),
          item.date,
          item.validator,
          getStatusLabel(item.status),
        ]),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [34, 197, 94] },
      })

      doc.save(`retraits_${dateFilter || "tous"}.pdf`)
      toast.success("Export PDF généré")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de générer l'export PDF")
    }
  }

  const handlePrintReceipt = (item: WithdrawalView) => {
    const printWindow = window.open("", "_blank", "width=900,height=700")

    if (!printWindow) {
      toast.error("Impossible d'ouvrir la fenêtre d'impression")
      return
    }

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Reçu de retrait</title>
          <style>
            :root {
              color-scheme: light;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 24px;
              color: #111827;
              background: #f9fafb;
            }
            .sheet {
              max-width: 780px;
              margin: 0 auto;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 28px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              align-items: flex-start;
              padding-bottom: 16px;
              border-bottom: 2px solid #10b981;
              margin-bottom: 20px;
            }
            h1 {
              margin: 0;
              font-size: 22px;
              letter-spacing: 0.04em;
            }
            .subtitle {
              margin: 6px 0 0;
              color: #6b7280;
              font-size: 13px;
            }
            .badge {
              padding: 8px 12px;
              border-radius: 999px;
              background: #ecfdf5;
              color: #047857;
              font-weight: 700;
              font-size: 12px;
              text-transform: uppercase;
            }
            .meta {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px 20px;
              margin-top: 20px;
            }
            .item {
              padding: 14px 16px;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              background: #f9fafb;
            }
            .label {
              display: block;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              color: #6b7280;
              margin-bottom: 6px;
            }
            .value {
              font-size: 15px;
              font-weight: 700;
              color: #111827;
              word-break: break-word;
            }
            .amount {
              font-size: 22px;
              color: #dc2626;
            }
            .footer {
              margin-top: 28px;
              padding-top: 16px;
              border-top: 1px dashed #d1d5db;
              display: flex;
              justify-content: space-between;
              gap: 16px;
              color: #6b7280;
              font-size: 12px;
            }
            @media print {
              body {
                background: #fff;
                padding: 0;
              }
              .sheet {
                border: none;
                border-radius: 0;
                padding: 18px;
              }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <div>
                <h1>RECU DE RETRAIT</h1>
                <p class="subtitle">Recu generé automatiquement depuis l'historique des retraits</p>
              </div>
              <div class="badge">${escapeHtml(getStatusLabel(item.status))}</div>
            </div>

            <div class="meta">
              <div class="item">
                <span class="label">Reference</span>
                <span class="value">${escapeHtml(item.reference)}</span>
              </div>
              <div class="item">
                <span class="label">Date</span>
                <span class="value">${escapeHtml(item.date)}</span>
              </div>
              <div class="item">
                <span class="label">Carnet</span>
                <span class="value">${escapeHtml(item.carnet)}</span>
              </div>
              <div class="item">
                <span class="label">Client</span>
                <span class="value">${escapeHtml(item.client)}</span>
              </div>
              <div class="item">
                <span class="label">Montant</span>
                <span class="value amount">${escapeHtml(formatMoney(item.amount, item.currency))}</span>
              </div>
              <div class="item">
                <span class="label">Validateur</span>
                <span class="value">${escapeHtml(item.validator)}</span>
              </div>
              <div class="item">
                <span class="label">Imprimé par</span>
                <span class="value">${escapeHtml(currentUser?.username || "Utilisateur")}</span>
              </div>
            </div>

            <div class="footer">
              <span>Imprime le ${escapeHtml(new Date().toLocaleString("fr-FR"))}</span>
              <span>${escapeHtml(item.reference)}</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
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
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <CalendarIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-9 w-44 h-9"
                  />
                </div>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={handleExportPdf}
                  disabled={loading || filtered.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={handleExportExcel}
                  disabled={loading || filtered.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
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
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1"
                              onClick={() => handlePrintReceipt(retrait)}
                            >
                              <Printer className="h-3 w-3" />
                              Imprimer le reçu
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
