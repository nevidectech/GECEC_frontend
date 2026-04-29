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
  Download,
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
  FileText,
  FileSpreadsheet,
} from "lucide-react"
import {
  listCollectorsAction,
  getCollectionStatsAction,
  checkCollectionDepositExistsAction,
  createCollectionDepositAction,
  listCollectionDepositsAction
} from "@/actions/collection-deposits"
import { getCollectionReportDataAction } from "@/actions/collection-report"
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

  const handleExportDepositsExcel = async () => {
    if (deposits.length === 0) {
      toast.error("Aucun dépôt à exporter")
      return
    }

    try {
      const { utils, writeFile } = await import("xlsx")
      const rows = deposits.map((item) => {
        const totalFc = item.amount_cotisation + item.amount_carnet + item.amount_duplicate + (item.amount_fiche_retrait || 0)
        const totalUsd = item.amount_cotisation_usd || 0

        return {
          Date: new Date(item.deposit_date).toLocaleDateString("fr-FR"),
          Collecteur: item.collector?.username || item.collector?.email || "Inconnu",
          "Cotisations FC": item.amount_cotisation,
          "Cotisations USD": item.amount_cotisation_usd || 0,
          Carnets: item.amount_carnet,
          Duplicatas: item.amount_duplicate,
          "Fiche Retrait": item.amount_fiche_retrait || 0,
          "Total FC": totalFc,
          "Total USD": totalUsd,
          Statut: item.status === "validated" ? "Validé" : "En attente",
        }
      })

      const ws = utils.json_to_sheet(rows)
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, "Depots")
      writeFile(wb, `depots_${listFilterDate}.xlsx`)
      toast.success("Export Excel généré")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de générer l'export Excel")
    }
  }

  const handleExportDepositsPdf = async () => {
    if (deposits.length === 0) {
      toast.error("Aucun dépôt à exporter")
      return
    }

    try {
      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default
      const doc = new jsPDF({ orientation: "landscape" })

      doc.setFontSize(16)
      doc.text("LISTE DES DEPOTS", 148, 14, { align: "center" })
      doc.setFontSize(10)
      doc.text(`Date filtrée: ${new Date(listFilterDate + "T00:00:00").toLocaleDateString("fr-FR")}`, 14, 22)
      doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")}`, 14, 28)

      autoTable(doc, {
        startY: 34,
        head: [[
          "Date",
          "Collecteur",
          "Cotisations FC",
          "Cotisations USD",
          "Carnets",
          "Duplicatas",
          "Fiche Retrait",
          "Total FC",
          "Total USD",
          "Statut",
        ]],
        body: deposits.map((item) => {
          const totalFc = item.amount_cotisation + item.amount_carnet + item.amount_duplicate + (item.amount_fiche_retrait || 0)
          const totalUsd = item.amount_cotisation_usd || 0

          return [
            new Date(item.deposit_date).toLocaleDateString("fr-FR"),
            item.collector?.username || item.collector?.email || "Inconnu",
            `${item.amount_cotisation.toLocaleString()} FC`,
            `$${totalUsd.toLocaleString()}`,
            `${item.amount_carnet.toLocaleString()} FC`,
            `${item.amount_duplicate.toLocaleString()} FC`,
            `${(item.amount_fiche_retrait || 0).toLocaleString()} FC`,
            `${totalFc.toLocaleString()} FC`,
            `$${totalUsd.toLocaleString()}`,
            item.status === "validated" ? "Validé" : "En attente",
          ]
        }),
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246] },
      })

      doc.save(`depots_${listFilterDate}.pdf`)
      toast.success("Export PDF généré")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de générer l'export PDF")
    }
  }

  const handleExportPdf = async (item: any) => {
    try {
      toast.loading("Génération du PDF...", { id: "pdf-export" })
      const result = await getCollectionReportDataAction(item.id)

      if (!result.success || !result.data) {
        toast.error(result.error || "Erreur lors de la récupération des données", { id: "pdf-export" })
        return
      }

      const { deposit, cotisations, duplicates, withdrawals } = result.data
      const collectorName = deposit.collector?.username || deposit.collector?.email || "Inconnu"
      const dateStr = new Date(deposit.deposit_date).toLocaleDateString("fr-FR")

      const { jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default

      const doc = jsPDF ? new jsPDF() : null
      if (!doc) throw new Error("Could not initialize jsPDF")

      // Header
      doc.setFontSize(18)
      doc.text("RAPPORT DE COLLECTE JOURNALIERE", 105, 15, { align: "center" })

      doc.setFontSize(10)
      doc.text(`Collecteur: ${collectorName}`, 14, 25)
      doc.text(`Date: ${dateStr}`, 14, 30)
      doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")}`, 14, 35)

      let currentY = 45

      // Cotisations Table
      if (cotisations.length > 0) {
        doc.setFontSize(12)
        doc.text("LISTE DES COTISATIONS", 14, currentY)
        autoTable(doc, {
          startY: currentY + 5,
          head: [["Date", "Carnet #", "Client", "Montant", "Devise"]],
          body: cotisations.map((c: any) => [
            new Date(c.cotisation_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
            c.carnet?.number || "N/A",
            c.carnet?.client_code || "N/A",
            c.amount.toLocaleString(),
            c.currency === 2 ? "USD" : "CDF"
          ]),
        })
        currentY = (doc as any).lastAutoTable.finalY + 15
      }

      // Duplicates Table
      if (duplicates.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12)
        doc.text("LISTE DES DUPLICATAS", 14, currentY)
        autoTable(doc, {
          startY: currentY + 5,
          head: [["Date", "Carnet #", "Client", "Prix"]],
          body: duplicates.map((d: any) => [
            new Date(d.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
            d.carnet?.number || "N/A",
            d.carnet?.client_code || "N/A",
            d.price.toLocaleString() + " CDF"
          ]),
        })
        currentY = (doc as any).lastAutoTable.finalY + 15
      }

      // Withdrawals Table
      if (withdrawals.length > 0) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12)
        doc.text("FICHE DE RETRAIT (DETAILS)", 14, currentY)
        autoTable(doc, {
          startY: currentY + 5,
          head: [["Date", "Carnet #", "Client", "Montant", "Type"]],
          body: withdrawals.map((w: any) => [
            new Date(w.withdrawal_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
            w.carnet?.number || "N/A",
            w.carnet?.client_code || "N/A",
            w.amount.toLocaleString(),
            w.withdrawal_type === 2 ? "Anticipé" : "Normal"
          ]),
        })
        currentY = (doc as any).lastAutoTable.finalY + 15
      }

      // Totals Summary
      if (currentY > 220) { doc.addPage(); currentY = 20; }
      doc.setFontSize(12)
      doc.text("RESUME DES TOTAUX", 14, currentY)
      const totalFc = deposit.amount_cotisation + deposit.amount_carnet + deposit.amount_duplicate + (deposit.amount_fiche_retrait || 0)
      const totalUsd = deposit.amount_cotisation_usd || 0

      autoTable(doc, {
        startY: currentY + 5,
        body: [
          ["Cotisations CDF", `${deposit.amount_cotisation.toLocaleString()} FC`],
          ["Cotisations USD", `$${deposit.amount_cotisation_usd.toLocaleString()}`],
          ["Nouveaux Carnets", `${deposit.amount_carnet.toLocaleString()} FC`],
          ["Duplicatas", `${deposit.amount_duplicate.toLocaleString()} FC`],
          ["Fiches Retrait", `${(deposit.amount_fiche_retrait || 0).toLocaleString()} FC`],
          ["TOTAL GENERAL FC", `${totalFc.toLocaleString()} FC`],
          ["TOTAL GENERAL USD", `$${totalUsd.toLocaleString()}`],
        ],
        theme: 'grid',
        styles: { fontStyle: 'bold' }
      })
      currentY = (doc as any).lastAutoTable.finalY + 30

      // Signatures
      if (currentY > 250) { doc.addPage(); currentY = 40; }
      doc.setFontSize(10)
      doc.text("Signature Collecteur", 30, currentY)
      doc.text("____________________", 20, currentY + 15)

      doc.text("Signature Superviseur", 140, currentY)
      doc.text("____________________", 130, currentY + 15)

      doc.save(`Rapport_Collecte_${collectorName}_${dateStr.replace(/\//g, '-')}.pdf`)
      toast.success("PDF généré avec succès", { id: "pdf-export" })
    } catch (err) {
      console.error("PDF generation error:", err)
      toast.error("Erreur lors de la génération du PDF", { id: "pdf-export" })
    }
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-9"
                          onClick={handleExportDepositsPdf}
                          disabled={loadingDeposits || deposits.length === 0}
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 h-9"
                          onClick={handleExportDepositsExcel}
                          disabled={loadingDeposits || deposits.length === 0}
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          Excel
                        </Button>
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
                            <TableHead className="font-semibold text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingDeposits && (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                                Chargement des dépôts...
                              </TableCell>
                            </TableRow>
                          )}
                          {!loadingDeposits && deposits.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
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
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-primary"
                                    onClick={() => handleExportPdf(item)}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
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
