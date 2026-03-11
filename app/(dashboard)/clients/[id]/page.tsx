"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Client, Carnet, Zone, Profile, Transaction } from "@/types/db"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Edit,
  Plus,
  User,
  MapPin,
  Phone,
  Mail,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react"

function formatMoney(value: number, currency: number) {
  const label = currency === 1 ? "CDF" : "USD"
  const locale = label === "USD" ? "en-US" : "fr-FR"
  return `${new Intl.NumberFormat(locale).format(value)} ${label}`
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const statusMap: Record<string, { status: "success" | "warning" | "error"; label: string }> = {
  active: { status: "success", label: "Actif" },
  inactive: { status: "error", label: "Inactif" },
  suspended: { status: "warning", label: "Suspendu" },
}

type TransactionWithCollector = Transaction & { collector_name: string | null }

type ClientDetails = Client & {
  zone_name: string | null
  collector_name: string | null
  carnets: Carnet[]
  transactions: TransactionWithCollector[]
  stats: {
    totalEpargneCdf: number
    totalEpargneUsd: number
    activeCarnets: number
  }
}

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  const supabase = useMemo(() => createClient(), [])

  const [client, setClient] = useState<ClientDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clientId) return

    async function fetchClientDetails() {
      setLoading(true)
      setError(null)

      const { data: clientData, error: clientError } = await supabase
        .from("client")
        .select("*")
        .eq("id", clientId)
        .single()

      if (clientError || !clientData) {
        setError("Client non trouvé.")
        setLoading(false)
        return
      }

      const [zoneRes, collectorRes, carnetsRes, transactionsRes, allCollectorsRes] = await Promise.all([
        clientData.zone_id ? supabase.from("zone").select("name").eq("id", clientData.zone_id).single() : Promise.resolve({ data: null }),
        clientData.collector_id ? supabase.from("user_profile").select("username, email").eq("user_id", clientData.collector_id).single() : Promise.resolve({ data: null }),
        supabase.from("carnet").select("*").eq("client_code", clientData.code).order("created_at", { ascending: false }),
        supabase.from("transaction").select("*").eq("client_id", clientData.id).order("transaction_date", { ascending: false }).limit(20),
        supabase.from("user_profile").select("user_id, username, email"),
      ])

      const carnets = (carnetsRes.data as Carnet[]) ?? []
      const rawTransactions = (transactionsRes.data as Transaction[]) ?? []
      const allCollectors = (allCollectorsRes.data as Profile[]) ?? []
      const collectorMap = new Map(allCollectors.map((c) => [c.user_id, c.username || c.email]))

      const transactions: TransactionWithCollector[] = rawTransactions.map((tx) => ({
        ...tx,
        collector_name: collectorMap.get(tx.created_by) ?? null,
      }))

      let totalEpargneCdf = 0
      let totalEpargneUsd = 0
      carnets.forEach((carnet) => {
        if (carnet.currency === 1) {
          totalEpargneCdf += Number(carnet.balance ?? 0)
        } else {
          totalEpargneUsd += Number(carnet.balance ?? 0)
        }
      })

      const clientDetails: ClientDetails = {
        ...clientData,
        zone_name: (zoneRes.data as Zone)?.name ?? null,
        collector_name: (collectorRes.data as Profile)?.username ?? (collectorRes.data as Profile)?.email ?? null,
        carnets,
        transactions,
        stats: {
          totalEpargneCdf,
          totalEpargneUsd,
          activeCarnets: carnets.filter((c) => c.status === "active").length,
        },
      }

      setClient(clientDetails)
      setLoading(false)
    }

    void fetchClientDetails()
  }, [clientId, supabase])

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <AppHeader breadcrumbs={[{ label: "Clients", href: "/clients" }, { label: "Erreur" }]} />
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center text-red-500">{error}</CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!client) return null

  const clientStatus = client.status === 1 ? "active" : client.status === 0 ? "inactive" : "suspended"
  const name = `${client.first_name} ${client.last_name}`.trim()
  const initials = `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase()

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Clients", href: "/clients" }, { label: name }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
                <StatusBadge status={statusMap[clientStatus].status} label={statusMap[clientStatus].label} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">Client depuis le {formatDate(client.created_at)} &bull; ID: {client.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2"><Edit className="h-4 w-4" />Modifier</Button>
            <Button className="gap-2"><Plus className="h-4 w-4" />Nouveau carnet</Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Epargne (CDF)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-foreground">{formatMoney(client.stats.totalEpargneCdf, 1)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Epargne (USD)</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-foreground">{formatMoney(client.stats.totalEpargneUsd, 2)}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Carnets actifs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-foreground">{client.stats.activeCarnets}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dernière activité</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-foreground">{formatDate(client.transactions[0]?.transaction_date)}</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1"><CardHeader><CardTitle className="text-base font-semibold">Informations personnelles</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><div className="flex items-start"><Phone className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" /><span className="text-foreground">{client.phone || "-"}</span></div><div className="flex items-start"><Mail className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" /><span className="text-foreground">{client.email || "-"}</span></div><div className="flex items-start"><MapPin className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" /><span className="text-foreground">{client.zone_name || "-"}</span></div><div className="flex items-start"><User className="h-4 w-4 mr-3 mt-0.5 text-muted-foreground" /><span className="text-foreground">Collecteur: {client.collector_name || "-"}</span></div></CardContent></Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base font-semibold">Carnets ({client.carnets.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow><TableHead>Numéro</TableHead><TableHead>Création</TableHead><TableHead>Montant Initial</TableHead><TableHead>Solde Actuel</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {client.carnets.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucun carnet</TableCell></TableRow> : client.carnets.map(carnet => (<TableRow key={carnet.id}><TableCell className="font-mono text-xs">{carnet.number}</TableCell><TableCell>{formatDate(carnet.created_at)}</TableCell><TableCell>{formatMoney(Number(carnet.initial_amount), carnet.currency)}</TableCell><TableCell className="font-semibold">{formatMoney(Number(carnet.balance), carnet.currency)}</TableCell><TableCell><StatusBadge status={carnet.status === "active" ? "success" : "default"} label={carnet.status} /></TableCell></TableRow>))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">Transactions récentes</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Montant</TableHead><TableHead>Carnet</TableHead><TableHead>Collecteur</TableHead></TableRow></TableHeader>
                <TableBody>
                  {client.transactions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Aucune transaction</TableCell></TableRow> : client.transactions.map(tx => (<TableRow key={tx.id}><TableCell>{formatDate(tx.transaction_date)}</TableCell><TableCell><span className={`flex items-center gap-2 font-medium ${tx.type === "depot" ? "text-emerald-600" : "text-amber-600"}`}>{tx.type === "depot" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{tx.type === "depot" ? "Dépôt" : "Retrait"}</span></TableCell><TableCell className="font-semibold">{formatMoney(Number(tx.amount), tx.currency)}</TableCell><TableCell className="font-mono text-xs">{tx.carnet_number}</TableCell><TableCell>{tx.collector_name || "-"}</TableCell></TableRow>))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}