"use client"

import { use, useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import type { Carnet, CarnetDuplicate, Cotisation, Withdrawal } from "@/types/db"
import { createWithdrawalAction } from "@/actions/withdrawals"
import {
  ArrowUpFromLine,
  Copy,
  Printer,
  FileText,
  Calendar,
  Wallet,
  TrendingUp,
  User,
  MapPin,
} from "lucide-react"

const currencyMap: Record<number, string> = {
  0: "CDF",
  1: "USD",
  2: "EUR",
}

function formatMoney(value: number, currency: number) {
  const label = currencyMap[currency] ?? `CUR-${currency}`
  const locale = label === "USD" || label === "EUR" ? "en-US" : "fr-FR"
  return `${new Intl.NumberFormat(locale).format(value)} ${label}`
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value))
}

export default function CarnetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = useMemo(() => createClient(), [])

  const [carnet, setCarnet] = useState<Carnet | null>(null)
  const [cotisations, setCotisations] = useState<Cotisation[]>([])
  const [duplicatas, setDuplicatas] = useState<CarnetDuplicate[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [withdrawalOpen, setWithdrawalOpen] = useState(false)
  const [withdrawalSubmitting, setWithdrawalSubmitting] = useState(false)
  const [withdrawalForm, setWithdrawalForm] = useState({
    orderType: "1",
    proofUrl: "",
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)

      const [carnetRes, cotisationRes, duplicataRes, withdrawalRes] = await Promise.all([
        supabase.from("carnet").select("*").eq("id", id).single(),
        supabase
          .from("cotisation")
          .select("*")
          .eq("carnet_id", id)
          .order("cotisation_date", { ascending: false }),
        supabase
          .from("carnet_duplicate")
          .select("*")
          .eq("original_carnet_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("withdrawal")
          .select("*")
          .eq("carnet_id", id)
          .order("withdrawal_date", { ascending: false }),
      ])

      if (carnetRes.error) {
        setError(carnetRes.error.message)
        setCarnet(null)
      } else {
        setCarnet(carnetRes.data as Carnet)
      }

      if (cotisationRes.error) {
        setError(cotisationRes.error.message)
        setCotisations([])
      } else {
        setCotisations((cotisationRes.data ?? []) as Cotisation[])
      }

      if (duplicataRes.error) {
        setError(duplicataRes.error.message)
        setDuplicatas([])
      } else {
        setDuplicatas((duplicataRes.data ?? []) as CarnetDuplicate[])
      }

      if (withdrawalRes.error) {
        setError(withdrawalRes.error.message)
        setWithdrawals([])
      } else {
        setWithdrawals((withdrawalRes.data ?? []) as Withdrawal[])
      }

      setLoading(false)
    }

    void fetchData()
  }, [id, supabase])

  const cotisationsTotal = cotisations.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  const withdrawalsTotal = withdrawals.reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  const averageCotisation = cotisations.length > 0 ? cotisationsTotal / cotisations.length : 0
  const baseAmount = Number(carnet?.initial_amount ?? 0)
  const estimatedBalance = baseAmount + cotisationsTotal - withdrawalsTotal
  const withdrawableAmount = cotisationsTotal - baseAmount
  const progress = Math.max(0, Math.min(100, (estimatedBalance / Math.max(baseAmount, 1)) * 100))
  const headerNumber = carnet?.number ?? id
  const headerStatus = carnet?.is_archived ? "closed" : "active"
  const headerCurrency = carnet?.currency ?? 0

  const orderTypeLabel: Record<number, string> = {
    1: "Titulaire",
    2: "Collecteur",
  }
  const withdrawalTypeLabel: Record<number, string> = {
    0: "Normal",
    1: "Anticipe",
  }

  async function handleCreateWithdrawal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWithdrawalSubmitting(true)
    setError(null)

    const result = await createWithdrawalAction({
      carnetId: id,
      orderType: Number(withdrawalForm.orderType) as 1 | 2,
      proofUrl: withdrawalForm.proofUrl || undefined,
    })

    if (!result.success) {
      setError(result.error ?? "Impossible de creer le retrait")
      setWithdrawalSubmitting(false)
      return
    }

    const [carnetRes, withdrawalRes] = await Promise.all([
      supabase.from("carnet").select("*").eq("id", id).single(),
      supabase
        .from("withdrawal")
        .select("*")
        .eq("carnet_id", id)
        .order("withdrawal_date", { ascending: false }),
    ])

    if (!carnetRes.error) {
      setCarnet(carnetRes.data as Carnet)
    }
    if (!withdrawalRes.error) {
      setWithdrawals((withdrawalRes.data ?? []) as Withdrawal[])
    }

    setWithdrawalOpen(false)
    setWithdrawalSubmitting(false)
    setWithdrawalForm({
      orderType: "1",
      proofUrl: "",
    })
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Carnets", href: "/carnets" },
          { label: headerNumber },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        {error && (
          <Card>
            <CardContent className="p-4 text-sm text-red-500">{error}</CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {headerNumber}
                </h1>
                <StatusBadge
                  status={headerStatus === "active" ? "success" : "error"}
                  label={headerStatus === "active" ? "Actif" : "Cloture"}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Mois: {carnet?.month ?? "-"} - Cree le {formatDate(carnet?.created_at ?? null)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Duplicata
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              Imprimer
            </Button>
            {!carnet?.is_archived && (
              <Dialog open={withdrawalOpen} onOpenChange={setWithdrawalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <ArrowUpFromLine className="h-3.5 w-3.5" />
                    Retrait
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nouveau retrait</DialogTitle>
                    <DialogDescription>
                      Montant calcule automatiquement: {formatMoney(Math.max(0, withdrawableAmount), headerCurrency)}
                    </DialogDescription>
                  </DialogHeader>

                  <form className="space-y-4" onSubmit={handleCreateWithdrawal}>
                    <div className="space-y-2">
                      <Label>Ordre de retrait</Label>
                      <Select
                        value={withdrawalForm.orderType}
                        onValueChange={(value) =>
                          setWithdrawalForm((current) => ({ ...current, orderType: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selectionner le type d'ordre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Titulaire (lui-meme)</SelectItem>
                          <SelectItem value="2">Collecteur</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Type de retrait</Label>
                      <p className="text-sm text-muted-foreground">
                        Calcule automatiquement (1=anticipe avant fin du mois, 0=normal fin de mois)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Numero de carte</Label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {carnet?.number ?? "-"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="proof-url">URL preuve (optionnel)</Label>
                      <Input
                        id="proof-url"
                        placeholder="https://..."
                        value={withdrawalForm.proofUrl}
                        onChange={(event) =>
                          setWithdrawalForm((current) => ({ ...current, proofUrl: event.target.value }))
                        }
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setWithdrawalOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={withdrawalSubmitting || withdrawableAmount <= 0}>
                        {withdrawalSubmitting ? "Creation..." : "Valider retrait"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-medium">Solde estime</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {formatMoney(estimatedBalance, headerCurrency)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium">Cotisations</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{cotisations.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Moy. cotisation</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {formatMoney(averageCotisation, headerCurrency)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-medium">Retraits</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{withdrawals.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <Tabs defaultValue="cotisations">
                <CardHeader className="pb-0">
                  <TabsList>
                    <TabsTrigger value="cotisations">Cotisations</TabsTrigger>
                    <TabsTrigger value="retraits">Retraits</TabsTrigger>
                    <TabsTrigger value="duplicatas">Duplicatas</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4">
                  <TabsContent value="cotisations" className="mt-0">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Montant</TableHead>
                            <TableHead className="font-semibold">Transaction</TableHead>
                            <TableHead className="font-semibold">Recu</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading && (
                            <TableRow>
                              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                Chargement des cotisations...
                              </TableCell>
                            </TableRow>
                          )}

                          {!loading &&
                            cotisations.map((cot) => (
                              <TableRow key={cot.id}>
                                <TableCell className="font-mono text-sm">
                                  {formatDate(cot.cotisation_date)}
                                </TableCell>
                                <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  +{formatMoney(Number(cot.amount), cot.currency)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {cot.transaction_code ?? "-"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {cot.receipt_number ?? "-"}
                                </TableCell>
                              </TableRow>
                            ))}

                          {!loading && cotisations.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                Aucune cotisation pour ce carnet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="retraits" className="mt-0">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Montant</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                            <TableHead className="font-semibold">Ordre</TableHead>
                            <TableHead className="font-semibold">Carte</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                Chargement des retraits...
                              </TableCell>
                            </TableRow>
                          )}

                          {!loading &&
                            withdrawals.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-sm">
                                  {formatDate(item.withdrawal_date)}
                                </TableCell>
                                <TableCell className="font-semibold text-red-600 dark:text-red-400">
                                  -{formatMoney(Number(item.amount), item.currency)}
                                </TableCell>
                                <TableCell>{withdrawalTypeLabel[item.withdrawal_type] ?? item.withdrawal_type}</TableCell>
                                <TableCell>{orderTypeLabel[item.order_type] ?? item.order_type}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {item.card_number ?? "-"}
                                </TableCell>
                              </TableRow>
                            ))}

                          {!loading && withdrawals.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                Aucun retrait pour ce carnet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="duplicatas" className="mt-0">
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Numero</TableHead>
                            <TableHead className="font-semibold">Mois</TableHead>
                            <TableHead className="font-semibold">Montant initial</TableHead>
                            <TableHead className="font-semibold">Prix</TableHead>
                            <TableHead className="font-semibold">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                Chargement des duplicatas...
                              </TableCell>
                            </TableRow>
                          )}

                          {!loading &&
                            duplicatas.map((dup) => (
                              <TableRow key={dup.id}>
                                <TableCell className="font-mono text-sm">{dup.number}</TableCell>
                                <TableCell className="text-muted-foreground">{dup.month ?? "-"}</TableCell>
                                <TableCell className="font-semibold tabular-nums text-foreground">
                                  {formatMoney(Number(dup.initial_amount), dup.currency)}
                                </TableCell>
                                <TableCell className="font-semibold tabular-nums text-foreground">
                                  {formatMoney(Number(dup.price), dup.currency)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {formatDate(dup.created_at)}
                                </TableCell>
                              </TableRow>
                            ))}

                          {!loading && duplicatas.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                Aucun duplicata pour ce carnet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Titulaire</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {(carnet?.client_code ?? "CN").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{carnet?.client_code ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">Code client</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>ID carnet: {headerNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Zone: -</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-1">
                  Voir le profil client
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Objectif d&apos;epargne</CardTitle>
                <CardDescription>Progression vers l&apos;objectif</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Actuel</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(estimatedBalance, headerCurrency)}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Initial</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(baseAmount, headerCurrency)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Progression estimee sur la base des cotisations enregistrees
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
