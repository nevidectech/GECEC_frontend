"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Carnet, Client, Cotisation, Profile, Withdrawal, Zone } from "@/types/db"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react"

type ActivityItem = {
  id: string
  type: "deposit" | "withdrawal"
  date: string
  amount: number
  currency: number
  carnetNumber: string
  collectorName: string | null
}

type ClientCarnet = Carnet & {
  estimatedBalance: number
  statusLabel: string
}

type ClientDetails = Client & {
  zoneName: string | null
  collectorName: string | null
  carnets: ClientCarnet[]
  activities: ActivityItem[]
  stats: {
    estimatedBalanceCdf: number
    estimatedBalanceUsd: number
    totalDepositsCdf: number
    totalDepositsUsd: number
    totalWithdrawalsCdf: number
    totalWithdrawalsUsd: number
    activeCarnets: number
    lastActivityDate: string | null
  }
}

const statusMap: Record<string, { status: "success" | "warning" | "error"; label: string }> = {
  active: { status: "success", label: "Actif" },
  inactive: { status: "error", label: "Inactif" },
  suspended: { status: "warning", label: "Suspendu" },
}

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

function getGenderLabel(gender: number) {
  if (gender === 1) return "Masculin"
  if (gender === 2) return "Feminin"
  return "Non renseigne"
}

function getCarnetStatus(carnet: Carnet) {
  if (carnet.is_archived) {
    return { status: "default" as const, label: "Cloture" }
  }

  if (carnet.validated_at) {
    return { status: "success" as const, label: "Valide" }
  }

  return { status: "warning" as const, label: "En attente" }
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

      const [zoneRes, collectorRes, carnetsRes] = await Promise.all([
        clientData.zone_id
          ? supabase.from("zone").select("id, name, code").eq("id", clientData.zone_id).single()
          : Promise.resolve({ data: null, error: null }),
        clientData.created_by
          ? supabase.from("user_profile").select("user_id, username, email").eq("user_id", clientData.created_by).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase.from("carnet").select("*").eq("client_code", clientData.code).order("created_at", { ascending: false }),
      ])

      if (carnetsRes.error) {
        setError(carnetsRes.error.message)
        setLoading(false)
        return
      }

      const carnets = (carnetsRes.data ?? []) as Carnet[]
      const carnetIds = carnets.map((item) => item.id)
      const collectorIds = new Set<string>()
      if (clientData.created_by) {
        collectorIds.add(clientData.created_by)
      }
      carnets.forEach((item) => {
        if (item.created_by) collectorIds.add(item.created_by)
      })

      let cotisations: Cotisation[] = []
      let withdrawals: Withdrawal[] = []

      if (carnetIds.length > 0) {
        const [cotisationsRes, withdrawalsRes] = await Promise.all([
          supabase
            .from("cotisation")
            .select("*")
            .in("carnet_id", carnetIds)
            .order("cotisation_date", { ascending: false }),
          supabase
            .from("withdrawal")
            .select("*")
            .in("carnet_id", carnetIds)
            .order("withdrawal_date", { ascending: false }),
        ])

        if (cotisationsRes.error) {
          setError(cotisationsRes.error.message)
          setLoading(false)
          return
        }

        if (withdrawalsRes.error) {
          setError(withdrawalsRes.error.message)
          setLoading(false)
          return
        }

        cotisations = (cotisationsRes.data ?? []) as Cotisation[]
        withdrawals = (withdrawalsRes.data ?? []) as Withdrawal[]

        cotisations.forEach((item) => {
          if (item.created_by) collectorIds.add(item.created_by)
        })
        withdrawals.forEach((item) => {
          if (item.created_by) collectorIds.add(item.created_by)
        })
      }

      const collectorIdList = [...collectorIds]
      const profilesRes = collectorIdList.length > 0
        ? await supabase
            .from("user_profile")
            .select("user_id, username, email")
            .in("user_id", collectorIdList)
        : { data: [], error: null }

      if (profilesRes.error) {
        setError(profilesRes.error.message)
        setLoading(false)
        return
      }

      const profiles = (profilesRes.data ?? []) as Pick<Profile, "user_id" | "username" | "email">[]
      const profileMap = new Map(
        profiles.map((item) => [item.user_id, item.username || item.email || null]),
      )
      const carnetMap = new Map(carnets.map((item) => [item.id, item]))

      const depositsByCarnet = new Map<string, number>()
      const withdrawalsByCarnet = new Map<string, number>()
      let totalDepositsCdf = 0
      let totalDepositsUsd = 0
      let totalWithdrawalsCdf = 0
      let totalWithdrawalsUsd = 0

      cotisations.forEach((item) => {
        const current = depositsByCarnet.get(item.carnet_id) ?? 0
        depositsByCarnet.set(item.carnet_id, current + Number(item.amount ?? 0))

        if (item.currency === 2) {
          totalDepositsUsd += Number(item.amount ?? 0)
        } else {
          totalDepositsCdf += Number(item.amount ?? 0)
        }
      })

      withdrawals.forEach((item) => {
        const current = withdrawalsByCarnet.get(item.carnet_id) ?? 0
        withdrawalsByCarnet.set(item.carnet_id, current + Number(item.amount ?? 0))

        if (item.currency === 2) {
          totalWithdrawalsUsd += Number(item.amount ?? 0)
        } else {
          totalWithdrawalsCdf += Number(item.amount ?? 0)
        }
      })

      const clientCarnets: ClientCarnet[] = carnets.map((item) => {
        const deposits = depositsByCarnet.get(item.id) ?? 0
        const withdrawn = withdrawalsByCarnet.get(item.id) ?? 0
        const status = getCarnetStatus(item)

        return {
          ...item,
          estimatedBalance: Number(item.initial_amount ?? 0) + deposits - withdrawn,
          statusLabel: status.label,
        }
      })

      const activities: ActivityItem[] = [
        ...cotisations.map((item) => ({
          id: item.id,
          type: "deposit" as const,
          date: item.cotisation_date,
          amount: Number(item.amount ?? 0),
          currency: item.currency,
          carnetNumber: carnetMap.get(item.carnet_id)?.number ?? item.carnet_id,
          collectorName: profileMap.get(item.created_by) ?? null,
        })),
        ...withdrawals.map((item) => ({
          id: item.id,
          type: "withdrawal" as const,
          date: item.withdrawal_date,
          amount: Number(item.amount ?? 0),
          currency: item.currency,
          carnetNumber: carnetMap.get(item.carnet_id)?.number ?? item.card_number ?? item.carnet_id,
          collectorName: profileMap.get(item.created_by) ?? null,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      const estimatedBalanceCdf = clientCarnets
        .filter((item) => item.currency === 1)
        .reduce((sum, item) => sum + item.estimatedBalance, 0)
      const estimatedBalanceUsd = clientCarnets
        .filter((item) => item.currency === 2)
        .reduce((sum, item) => sum + item.estimatedBalance, 0)

      const clientDetails: ClientDetails = {
        ...clientData,
        zoneName: (zoneRes.data as Zone | null)?.name ?? null,
        collectorName:
          (collectorRes.data as Pick<Profile, "user_id" | "username" | "email"> | null)?.username ??
          (collectorRes.data as Pick<Profile, "user_id" | "username" | "email"> | null)?.email ??
          profileMap.get(clientData.created_by) ??
          null,
        carnets: clientCarnets,
        activities: activities.slice(0, 20),
        stats: {
          estimatedBalanceCdf,
          estimatedBalanceUsd,
          totalDepositsCdf,
          totalDepositsUsd,
          totalWithdrawalsCdf,
          totalWithdrawalsUsd,
          activeCarnets: clientCarnets.filter((item) => !item.is_archived).length,
          lastActivityDate: activities[0]?.date ?? null,
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
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
                <StatusBadge status={statusMap[clientStatus].status} label={statusMap[clientStatus].label} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Client depuis le {formatDate(client.created_at)} • Code: {client.code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau carnet
            </Button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Encours estimé (CDF)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatMoney(client.stats.estimatedBalanceCdf, 1)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dépôts: {formatMoney(client.stats.totalDepositsCdf, 1)} • Retraits: {formatMoney(client.stats.totalWithdrawalsCdf, 1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Encours estimé (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatMoney(client.stats.estimatedBalanceUsd, 2)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Dépôts: {formatMoney(client.stats.totalDepositsUsd, 2)} • Retraits: {formatMoney(client.stats.totalWithdrawalsUsd, 2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carnets actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{client.stats.activeCarnets}</p>
              <p className="mt-1 text-xs text-muted-foreground">{client.carnets.length} carnet(s) au total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Dernière activité</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-foreground">{formatDate(client.stats.lastActivityDate)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{client.activities.length} activité(s) trouvée(s)</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start">
                <Phone className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.phone || "-"}</span>
              </div>
              <div className="flex items-start">
                <Mail className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.email || "-"}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.address || client.zoneName || "-"}</span>
              </div>
              <div className="flex items-start">
                <User className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Genre: {getGenderLabel(client.gender)}</span>
              </div>
              <div className="flex items-start">
                <BriefcaseBusiness className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.job_title || "Profession non renseignée"}</span>
              </div>
              <div className="flex items-start">
                <CreditCard className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Carte: {client.card_number || "-"}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Zone: {client.zoneName || "-"}</span>
              </div>
              <div className="flex items-start">
                <User className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Créé par: {client.collectorName || "-"}</span>
              </div>
              <div className="flex items-start">
                <CalendarDays className="mr-3 mt-0.5 h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Mise à jour: {formatDate(client.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Carnets ({client.carnets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Mois</TableHead>
                      <TableHead>Création</TableHead>
                      <TableHead>Montant initial</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Solde estimé</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.carnets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                          Aucun carnet
                        </TableCell>
                      </TableRow>
                    ) : (
                      client.carnets.map((carnet) => {
                        const status = getCarnetStatus(carnet)

                        return (
                          <TableRow key={carnet.id}>
                            <TableCell className="font-mono text-xs">
                              <Link href={`/carnets/${carnet.id}`} className="text-primary hover:underline">
                                {carnet.number}
                              </Link>
                            </TableCell>
                            <TableCell>{carnet.month || "-"}</TableCell>
                            <TableCell>{formatDate(carnet.created_at)}</TableCell>
                            <TableCell>{formatMoney(Number(carnet.initial_amount), carnet.currency)}</TableCell>
                            <TableCell>{formatMoney(Number(carnet.price), carnet.currency)}</TableCell>
                            <TableCell className="font-semibold">
                              {formatMoney(carnet.estimatedBalance, carnet.currency)}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={status.status} label={status.label} />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Activités récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Carnet</TableHead>
                    <TableHead>Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client.activities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                        Aucune activité
                      </TableCell>
                    </TableRow>
                  ) : (
                    client.activities.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>
                          <span
                            className={`flex items-center gap-2 font-medium ${
                              item.type === "deposit" ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {item.type === "deposit" ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {item.type === "deposit" ? "Dépôt" : "Retrait"}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">{formatMoney(item.amount, item.currency)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <span className="inline-flex items-center gap-2">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            {item.carnetNumber}
                          </span>
                        </TableCell>
                        <TableCell>{item.collectorName || "-"}</TableCell>
                      </TableRow>
                    ))
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
