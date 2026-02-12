"use client"

import { use } from "react"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BookOpen,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Edit,
  Wallet,
  TrendingUp,
  ArrowDownToLine,
} from "lucide-react"

const clientCarnets = [
  { id: "C-2024-1847", type: "Standard", solde: "2,450,000 FC", status: "active", cotisations: 48 },
  { id: "C-2023-0892", type: "Premium", solde: "1,200,000 FC", status: "active", cotisations: 72 },
]

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Clients", href: "/clients" },
          { label: `Client ${id}` },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                MK
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Marie Kabila
                </h1>
                <StatusBadge status="success" label="Actif" />
              </div>
              <p className="text-sm text-muted-foreground mt-1 font-mono">{id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button size="sm" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Nouveau carnet
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-medium">Epargne totale</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">3,650,000 FC</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-xs font-medium">Carnets</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">2</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Cotisations</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">120</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Carnets d&apos;epargne</CardTitle>
                <CardDescription>Tous les carnets associes a ce client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Reference</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Solde</TableHead>
                        <TableHead className="font-semibold text-center">Cotisations</TableHead>
                        <TableHead className="font-semibold">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientCarnets.map((carnet) => (
                        <TableRow key={carnet.id}>
                          <TableCell>
                            <Link
                              href={`/carnets/${carnet.id}`}
                              className="font-mono text-sm font-medium text-primary hover:underline"
                            >
                              {carnet.id}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                              {carnet.type}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums text-foreground">
                            {carnet.solde}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {carnet.cotisations}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status="success" label="Actif" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Informations</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">+243 812 345 678</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">marie.kabila@email.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">Av. Kasavubu 45, Lubumbashi</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-foreground">Client depuis Mars 2022</span>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Zone de collecte
                  </span>
                  <span className="text-sm font-medium text-foreground">Lubumbashi-Centre</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Collecteur attribue
                  </span>
                  <span className="text-sm font-medium text-foreground">Patrick Mbuyi</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <ArrowDownToLine className="h-4 w-4" />
                  Enregistrer un depot
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <BookOpen className="h-4 w-4" />
                  Creer un carnet
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
