"use client"

import { use } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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

const cotisations = [
  { date: "10/02/2024", montant: "50,000 FC", collecteur: "Patrick Mbuyi", type: "Collecte terrain" },
  { date: "09/02/2024", montant: "75,000 FC", collecteur: "Patrick Mbuyi", type: "Depot agence" },
  { date: "07/02/2024", montant: "50,000 FC", collecteur: "Patrick Mbuyi", type: "Collecte terrain" },
  { date: "05/02/2024", montant: "100,000 FC", collecteur: "Sarah Kalala", type: "Depot agence" },
  { date: "03/02/2024", montant: "50,000 FC", collecteur: "Patrick Mbuyi", type: "Collecte terrain" },
  { date: "01/02/2024", montant: "50,000 FC", collecteur: "Patrick Mbuyi", type: "Collecte terrain" },
  { date: "29/01/2024", montant: "125,000 FC", collecteur: "Sarah Kalala", type: "Depot agence" },
  { date: "27/01/2024", montant: "50,000 FC", collecteur: "Patrick Mbuyi", type: "Collecte terrain" },
]

export default function CarnetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Carnets", href: "/carnets" },
          { label: id },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
                  {id}
                </h1>
                <StatusBadge status="success" label="Actif" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Carnet standard - Cree le 15/01/2024
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
            <Button size="sm" className="gap-1.5">
              <ArrowUpFromLine className="h-3.5 w-3.5" />
              Retrait
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-medium">Solde</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">2,450,000 FC</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium">Cotisations</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">48</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Moy. mensuelle</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">350,000 FC</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-xs font-medium">Remuneration</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">42,500 FC</p>
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
                            <TableHead className="font-semibold">Collecteur</TableHead>
                            <TableHead className="font-semibold">Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cotisations.map((cot, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-sm">{cot.date}</TableCell>
                              <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                                +{cot.montant}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{cot.collecteur}</TableCell>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                                  {cot.type}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="retraits" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                        <ArrowUpFromLine className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Aucun retrait</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ce carnet n&apos;a pas encore eu de retrait
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="duplicatas" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                        <Copy className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Aucun duplicata</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pas de duplicata emis pour ce carnet
                      </p>
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
                      MK
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">Marie Kabila</p>
                    <p className="text-xs text-muted-foreground">Client depuis 2022</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>ID: CLT-2022-0456</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Lubumbashi-Centre</span>
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
                  <span className="font-semibold text-foreground">2,450,000 FC</span>
                </div>
                <Progress value={49} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Objectif</span>
                  <span className="font-semibold text-foreground">5,000,000 FC</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  49% atteint - Estimation: 4 mois restants
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
