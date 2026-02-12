"use client"

import { useState } from "react"
import Link from "next/link"
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

const carnets = [
  { id: "C-2024-1847", client: "Marie Kabila", type: "Standard", solde: "2,450,000 FC", currency: "CDF", status: "active", cotisations: 48, zone: "Lubumbashi-Centre", createdAt: "15/01/2024" },
  { id: "C-2024-1846", client: "Pierre Mutombo", type: "Premium", solde: "$1,200", currency: "USD", status: "active", cotisations: 36, zone: "Lubumbashi-Est", createdAt: "12/01/2024" },
  { id: "C-2024-1845", client: "Josephine Kayembe", type: "Standard", solde: "850,000 FC", currency: "CDF", status: "active", cotisations: 24, zone: "Likasi", createdAt: "10/01/2024" },
  { id: "C-2024-1844", client: "Albert Tshisekedi", type: "Standard", solde: "0 FC", currency: "CDF", status: "closed", cotisations: 52, zone: "Kolwezi", createdAt: "08/01/2024" },
  { id: "C-2024-1843", client: "Francoise Mwamba", type: "Premium", solde: "$4,500", currency: "USD", status: "active", cotisations: 60, zone: "Lubumbashi-Centre", createdAt: "05/01/2024" },
  { id: "C-2024-1842", client: "Jean-Baptiste Ilunga", type: "Standard", solde: "1,200,000 FC", currency: "CDF", status: "suspended", cotisations: 12, zone: "Kipushi", createdAt: "02/01/2024" },
  { id: "C-2024-1841", client: "Elisabeth Kasongo", type: "Standard", solde: "3,100,000 FC", currency: "CDF", status: "active", cotisations: 72, zone: "Lubumbashi-Est", createdAt: "28/12/2023" },
  { id: "C-2024-1840", client: "Claude Mbuyi", type: "Premium", solde: "$2,800", currency: "USD", status: "active", cotisations: 44, zone: "Likasi", createdAt: "25/12/2023" },
]

const statusMap: Record<string, { status: "success" | "warning" | "error" | "info"; label: string }> = {
  active: { status: "success", label: "Actif" },
  suspended: { status: "warning", label: "Suspendu" },
  closed: { status: "error", label: "Cloture" },
}

export default function CarnetsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = carnets.filter((c) => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    return matchSearch && matchStatus
  })

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
                <p className="text-xl font-bold text-foreground">1,654</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspendus</p>
                <p className="text-xl font-bold text-foreground">127</p>
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
                <p className="text-xl font-bold text-foreground">111</p>
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
                    placeholder="Rechercher par ID ou client..."
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
                    <SelectItem value="suspended">Suspendu</SelectItem>
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
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Solde</TableHead>
                    <TableHead className="font-semibold text-center">Cotisations</TableHead>
                    <TableHead className="font-semibold">Zone</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((carnet) => (
                    <TableRow key={carnet.id} className="group">
                      <TableCell>
                        <Link
                          href={`/carnets/${carnet.id}`}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {carnet.id}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{carnet.client}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                          {carnet.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums text-foreground">{carnet.solde}</TableCell>
                      <TableCell className="text-center tabular-nums">{carnet.cotisations}</TableCell>
                      <TableCell className="text-muted-foreground">{carnet.zone}</TableCell>
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
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
