"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowUpFromLine,
  Search,
  Download,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Printer,
  CheckCircle2,
} from "lucide-react"

const retraits = [
  { id: "RET-2024-0234", carnet: "C-2024-1847", client: "Marie Kabila", montant: "500,000 FC", date: "10/02/2024", validateur: "Admin Dupont", status: "completed" },
  { id: "RET-2024-0233", carnet: "C-2024-1846", client: "Pierre Mutombo", montant: "$200", date: "09/02/2024", validateur: "-", status: "pending" },
  { id: "RET-2024-0232", carnet: "C-2024-1845", client: "Josephine Kayembe", montant: "300,000 FC", date: "08/02/2024", validateur: "Admin Kalala", status: "completed" },
  { id: "RET-2024-0231", carnet: "C-2024-1841", client: "Elisabeth Kasongo", montant: "1,000,000 FC", date: "07/02/2024", validateur: "-", status: "rejected" },
  { id: "RET-2024-0230", carnet: "C-2024-1840", client: "Claude Mbuyi", montant: "$500", date: "06/02/2024", validateur: "Admin Dupont", status: "completed" },
  { id: "RET-2024-0229", carnet: "C-2024-1843", client: "Francoise Mwamba", montant: "$1,000", date: "05/02/2024", validateur: "-", status: "pending" },
]

const statusMap: Record<string, { status: "success" | "warning" | "error"; label: string }> = {
  completed: { status: "success", label: "Valide" },
  pending: { status: "warning", label: "En attente" },
  rejected: { status: "error", label: "Rejete" },
}

export default function RetraitsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = retraits.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.client.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Retraits" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Retraits</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion securisee des retraits avec double validation
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <ArrowUpFromLine className="h-4 w-4" />
                Nouveau retrait
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nouveau retrait</DialogTitle>
                <DialogDescription>
                  Initier un retrait. Necessite une double validation.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="carnet-ref">Reference carnet</Label>
                  <Input id="carnet-ref" placeholder="C-2024-XXXX" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="montant">Montant</Label>
                  <Input id="montant" type="number" placeholder="0" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="devise">Devise</Label>
                  <Select>
                    <SelectTrigger id="devise">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDF">CDF (Franc Congolais)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="motif">Motif</Label>
                  <Input id="motif" placeholder="Raison du retrait" />
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700 dark:text-amber-300">
                      <p className="font-medium">Double validation requise</p>
                      <p className="mt-0.5 text-amber-600 dark:text-amber-400">
                        Ce retrait devra etre valide par un second administrateur.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Annuler</Button>
                <Button className="gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Soumettre
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valides ce mois</p>
                <p className="text-xl font-bold text-foreground">23</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-xl font-bold text-foreground">5</p>
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
                <p className="text-xl font-bold text-foreground">3,250,000 FC</p>
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
                    <SelectItem value="pending">En attente</SelectItem>
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
                  {filtered.map((retrait) => (
                    <TableRow key={retrait.id}>
                      <TableCell className="font-mono text-sm font-medium text-foreground">{retrait.id}</TableCell>
                      <TableCell className="font-mono text-sm text-primary">{retrait.carnet}</TableCell>
                      <TableCell className="font-medium text-foreground">{retrait.client}</TableCell>
                      <TableCell className="font-semibold tabular-nums text-red-600 dark:text-red-400">
                        -{retrait.montant}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{retrait.date}</TableCell>
                      <TableCell className="text-muted-foreground">{retrait.validateur}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={statusMap[retrait.status].status}
                          label={statusMap[retrait.status].label}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {retrait.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              Valider
                            </Button>
                          </div>
                        ) : retrait.status === "completed" ? (
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                            <Printer className="h-3 w-3" />
                            Recu
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
