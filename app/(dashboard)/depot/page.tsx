"use client"

import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowDownToLine,
  ScanBarcode,
  Wifi,
  WifiOff,
  Send,
  Clock,
  CheckCircle2,
  Zap,
  User,
  Calendar as CalendarIcon,
  Calculator,
  Search,
} from "lucide-react"
import {
  listCollectorsAction,
  getCollectionStatsAction,
  checkCollectionDepositExistsAction,
  createCollectionDepositAction,
  listCollectionDepositsAction
} from "@/actions/collection-deposits"
import type { Profile } from "@/types/db"
import { toast } from "sonner"

const dailyCollections = [
  { time: "08:15", carnet: "C-2024-1847", client: "Marie Kabila", montant: "50,000 FC", mode: "Terrain", synced: true },
  { time: "08:42", carnet: "C-2024-1845", client: "Josephine Kayembe", montant: "75,000 FC", mode: "Terrain", synced: true },
  { time: "09:10", carnet: "C-2024-1841", client: "Elisabeth Kasongo", montant: "100,000 FC", mode: "Terrain", synced: true },
  { time: "09:35", carnet: "C-2024-1843", client: "Francoise Mwamba", montant: "$50", mode: "Terrain", synced: false },
  { time: "10:00", carnet: "C-2024-1840", client: "Claude Mbuyi", montant: "$100", mode: "Agence", synced: true },
  { time: "10:25", carnet: "C-2024-1846", client: "Pierre Mutombo", montant: "50,000 FC", mode: "Terrain", synced: false },
]

export default function DepotPage() {
  const [carnetRef, setCarnetRef] = useState("")
  const [listFilterDate, setListFilterDate] = useState(new Date().toISOString().split('T')[0])
  const [deposits, setDeposits] = useState<any[]>([])
  const [loadingDeposits, setLoadingDeposits] = useState(false)

  // States for Collection Deposit
  const [collectors, setCollectors] = useState<Profile[]>([])
  const [selectedCollector, setSelectedCollector] = useState("")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [stats, setStats] = useState({
    amountCotisation: 0,
    amountCarnet: 0,
    amountDuplicate: 0,
    amountFicheRetrait: 0,
    amountCotisationUsd: 0,
  })
  const [loadingStats, setLoadingStats] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchCollectors() {
      console.log("Fetching collectors...")
      const result = await listCollectorsAction()
      console.log("Fetch collectors result:", result)
      if (result.success && result.data) {
        setCollectors(result.data)
      } else if (!result.success) {
        toast.error("Erreur lors du chargement des collecteurs: " + result.error)
      }
    }
    fetchCollectors()
  }, [])

  useEffect(() => {
    async function fetchDeposits() {
      setLoadingDeposits(true)
      const result = await listCollectionDepositsAction(listFilterDate)
      if (result.success && result.data) {
        setDeposits(result.data)
      } else if (!result.success) {
        toast.error("Erreur lors du chargement de la liste: " + result.error)
      }
      setLoadingDeposits(false)
    }
    fetchDeposits()
  }, [listFilterDate])

  const handleFetchStats = async () => {
    if (!selectedCollector || !selectedDate) {
      toast.error("Veuillez sélectionner un collecteur et une date")
      return
    }

    setLoadingStats(true)
    const result = await getCollectionStatsAction(selectedCollector, selectedDate)
    if (result.success && result.data) {
      setStats(result.data)
      toast.success("Informations récupérées")
    } else {
      toast.error(result.error ?? "Erreur lors de la récupération des informations")
    }
    setLoadingStats(false)
  }

  const handleCreateCollectionDeposit = async () => {
    if (!selectedCollector || !selectedDate) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    setSubmitting(true)

    // Check if exists
    const exists = await checkCollectionDepositExistsAction(selectedCollector, selectedDate)
    if (exists.success && exists.data) {
      toast.error("Un dépôt existe déjà pour ce collecteur à cette date")
      setSubmitting(false)
      return
    }

    const result = await createCollectionDepositAction({
      collectorId: selectedCollector,
      date: selectedDate,
      ...stats
    })

    if (result.success) {
      toast.success("Dépôt de collecte enregistré avec succès")
      // Refresh the deposits list if we are on the same filter date
      if (selectedDate === listFilterDate) {
        const fetchResult = await listCollectionDepositsAction(listFilterDate)
        if (fetchResult.success && fetchResult.data) {
          setDeposits(fetchResult.data)
        }
      }
    } else {
      toast.error(result.error ?? "Erreur lors de l'enregistrement")
    }
    setSubmitting(false)
  }
  const totals = deposits.reduce((acc, item) => {
    acc.cdf += (item.amount_cotisation + item.amount_carnet + item.amount_duplicate + (item.amount_fiche_retrait || 0))
    acc.usd += (item.amount_cotisation_usd || 0)
    acc.carnetCdf += item.amount_carnet
    acc.duplicateCdf += item.amount_duplicate
    acc.ficheCdf += (item.amount_fiche_retrait || 0)
    return acc
  }, { cdf: 0, usd: 0, carnetCdf: 0, duplicateCdf: 0, ficheCdf: 0 })

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Depot & Collecte" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Depot & Collecte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi des collectes terrain et enregistrement des dépôts
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <ArrowDownToLine className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collecte CDF</p>
                <p className="text-xl font-bold text-foreground">{totals.cdf.toLocaleString()} FC</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowDownToLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collecte USD</p>
                <p className="text-xl font-bold text-foreground">${totals.usd.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                <ScanBarcode className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Carnets</p>
                <p className="text-sm font-bold text-foreground">
                  {totals.carnetCdf.toLocaleString()} FC
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duplicatas</p>
                <p className="text-sm font-bold text-foreground">
                  {totals.duplicateCdf.toLocaleString()} FC
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fiche Retrait</p>
                <p className="text-sm font-bold text-foreground">
                  {totals.ficheCdf.toLocaleString()} FC
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          <Tabs defaultValue="liste" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="liste">Liste des dépôts</TabsTrigger>
              <TabsTrigger value="collecte">Dépôt de Collecte</TabsTrigger>
            </TabsList>

            <TabsContent value="liste" className="mt-6">
              <div className="grid gap-6">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardTitle className="text-base font-semibold">Liste des dépôts</CardTitle>
                        <CardDescription>Consulter les collectes et dépôts enregistre</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pl-9 h-9 w-[160px]"
                            value={listFilterDate}
                            onChange={(e) => setListFilterDate(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" size="sm" className="gap-1.5 h-9">
                          <Zap className="h-3.5 w-3.5" />
                          Synchroniser
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Collecteur</TableHead>
                            <TableHead className="font-semibold text-right">Cotisations</TableHead>
                            <TableHead className="font-semibold text-right">Carnets</TableHead>
                            <TableHead className="font-semibold text-right">Duplicatas</TableHead>
                            <TableHead className="font-semibold text-right">Fiche Retrait</TableHead>
                            <TableHead className="font-semibold text-right">Total FC</TableHead>
                            <TableHead className="font-semibold text-right">Total USD</TableHead>
                            <TableHead className="font-semibold text-center">Statut</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingDeposits && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                Chargement des dépôts...
                              </TableCell>
                            </TableRow>
                          )}
                          {!loadingDeposits && deposits.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                Aucun dépôt enregistré pour cette date.
                              </TableCell>
                            </TableRow>
                          )}
                          {!loadingDeposits && deposits.map((item, i) => {
                            const totalFc = item.amount_cotisation + item.amount_carnet + item.amount_duplicate + (item.amount_fiche_retrait || 0);
                            const totalUsd = item.amount_cotisation_usd || 0;
                            return (
                              <TableRow key={item.id || i}>
                                <TableCell className="font-medium">
                                  {item.collector?.username || item.collector?.email || "Inconnu"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.amount_cotisation.toLocaleString()} FC / ${item.amount_cotisation_usd}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.amount_carnet.toLocaleString()} FC
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.amount_duplicate.toLocaleString()} FC
                                </TableCell>
                                <TableCell className="text-right">
                                  {(item.amount_fiche_retrait || 0).toLocaleString()} FC
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary">
                                  {totalFc.toLocaleString()} FC
                                </TableCell>
                                <TableCell className="text-right font-bold text-primary">
                                  ${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-center">
                                  <StatusBadge
                                    status={item.status === 'validated' ? 'success' : 'pending'}
                                    label={item.status === 'validated' ? 'Validé' : 'En attente'}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="collecte" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">Récapitulatif de Collecte</CardTitle>
                    <CardDescription>Enregistrer le montant total collecté par un agent</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label>Collecteur</Label>
                        <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                          <SelectTrigger>
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Sélectionner..." />
                          </SelectTrigger>
                          <SelectContent>
                            {collectors.map((c) => (
                              <SelectItem key={c.id} value={c.user_id}>
                                {c.username || c.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Date de collecte</Label>
                        <div className="relative">
                          <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            type="date"
                            className="pl-9"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={handleFetchStats}
                      disabled={loadingStats}
                    >
                      <Calculator className="h-4 w-4" />
                      {loadingStats ? "Chargement..." : "Récupérer les informations du carnet"}
                    </Button>

                    <Separator />

                    <div className="grid gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>Montant cotisations des carnets</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0"
                              className="pr-12"
                              value={stats.amountCotisation}
                              onChange={(e) => setStats({ ...stats, amountCotisation: Number(e.target.value) })}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">FC</span>
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pr-12"
                              value={stats.amountCotisationUsd}
                              onChange={(e) => setStats({ ...stats, amountCotisationUsd: Number(e.target.value) })}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">USD</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Montant carnet (nouveaux vendus)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0"
                            className="pr-12"
                            value={stats.amountCarnet}
                            onChange={(e) => setStats({ ...stats, amountCarnet: Number(e.target.value) })}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">FC</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Montant duplicata carnet</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0"
                            className="pr-12"
                            value={stats.amountDuplicate}
                            onChange={(e) => setStats({ ...stats, amountDuplicate: Number(e.target.value) })}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">FC</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label>Montant fiche de retrait</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0"
                            className="pr-12"
                            value={stats.amountFicheRetrait}
                            onChange={(e) => setStats({ ...stats, amountFicheRetrait: Number(e.target.value) })}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">FC</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Total FC à déposer</span>
                          <span className="font-bold text-primary">
                            {(stats.amountCotisation + stats.amountCarnet + stats.amountDuplicate + stats.amountFicheRetrait).toLocaleString()} FC
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">Total USD à déposer</span>
                          <span className="font-bold text-primary">
                            {(stats.amountCotisationUsd).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2 h-11"
                      onClick={handleCreateCollectionDeposit}
                      disabled={submitting}
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? "Enregistrement..." : "Enregistrer le dépôt de collecte"}
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-semibold">Conseils</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-3">
                      <p>
                        Le système vérifie automatiquement si un dépôt a déjà été enregistré pour ce collecteur à la date sélectionnée.
                      </p>
                      <p>
                        Les montants récupérés correspondent aux opérations déjà saisies individuellement dans le système pour cet agent.
                      </p>
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="h-4 w-4" />
                        <span>Validation par le caissier requise après enregistrement.</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
