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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  BookOpen,
  Users,
  UserCheck,
  UserX,
  Download,
} from "lucide-react"

const clients = [
  { id: "CLT-0456", name: "Marie Kabila", initials: "MK", phone: "+243 812 345 678", zone: "Lubumbashi-Centre", carnets: 2, totalEpargne: "3,650,000 FC", status: "active", since: "2022" },
  { id: "CLT-0457", name: "Pierre Mutombo", initials: "PM", phone: "+243 813 456 789", zone: "Lubumbashi-Est", carnets: 1, totalEpargne: "$1,200", status: "active", since: "2023" },
  { id: "CLT-0458", name: "Josephine Kayembe", initials: "JK", phone: "+243 814 567 890", zone: "Likasi", carnets: 1, totalEpargne: "850,000 FC", status: "active", since: "2023" },
  { id: "CLT-0459", name: "Albert Tshisekedi", initials: "AT", phone: "+243 815 678 901", zone: "Kolwezi", carnets: 3, totalEpargne: "5,200,000 FC", status: "inactive", since: "2021" },
  { id: "CLT-0460", name: "Francoise Mwamba", initials: "FM", phone: "+243 816 789 012", zone: "Lubumbashi-Centre", carnets: 2, totalEpargne: "$6,800", status: "active", since: "2022" },
  { id: "CLT-0461", name: "Jean-Baptiste Ilunga", initials: "JI", phone: "+243 817 890 123", zone: "Kipushi", carnets: 1, totalEpargne: "1,200,000 FC", status: "suspended", since: "2023" },
  { id: "CLT-0462", name: "Elisabeth Kasongo", initials: "EK", phone: "+243 818 901 234", zone: "Lubumbashi-Est", carnets: 2, totalEpargne: "4,100,000 FC", status: "active", since: "2021" },
  { id: "CLT-0463", name: "Claude Mbuyi", initials: "CM", phone: "+243 819 012 345", zone: "Likasi", carnets: 1, totalEpargne: "$2,800", status: "active", since: "2023" },
]

const statusMap: Record<string, { status: "success" | "warning" | "error"; label: string }> = {
  active: { status: "success", label: "Actif" },
  inactive: { status: "error", label: "Inactif" },
  suspended: { status: "warning", label: "Suspendu" },
}

export default function ClientsPage() {
  const [search, setSearch] = useState("")

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Clients" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion de votre portefeuille client
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total clients</p>
                <p className="text-xl font-bold text-foreground">1,247</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-xl font-bold text-foreground">1,089</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactifs</p>
                <p className="text-xl font-bold text-foreground">158</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">Liste des clients</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, ID ou telephone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-72 h-9"
                  />
                </div>
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
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Telephone</TableHead>
                    <TableHead className="font-semibold">Zone</TableHead>
                    <TableHead className="font-semibold text-center">Carnets</TableHead>
                    <TableHead className="font-semibold">Epargne totale</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {client.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/clients/${client.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                              {client.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">Depuis {client.since}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{client.id}</TableCell>
                      <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{client.zone}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                          {client.carnets}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums text-foreground">{client.totalEpargne}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={statusMap[client.status].status}
                          label={statusMap[client.status].label}
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
                              <Link href={`/clients/${client.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir profil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Nouveau carnet
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
