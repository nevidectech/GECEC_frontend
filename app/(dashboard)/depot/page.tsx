"use client"

import { useState } from "react"
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
} from "lucide-react"

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

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Depot & Collecte" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Depot & Collecte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saisie rapide des depots et suivi des collectes terrain
          </p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collectes jour</p>
                <p className="text-xl font-bold text-foreground">6</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <ArrowDownToLine className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total jour</p>
                <p className="text-xl font-bold text-foreground">425,000 FC</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
                <Wifi className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Synchronise</p>
                <p className="text-xl font-bold text-foreground">4/6</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente sync</p>
                <p className="text-xl font-bold text-foreground">2</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Saisie rapide</CardTitle>
              <CardDescription>Enregistrer un nouveau depot</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="scan-carnet">Reference carnet</Label>
                <div className="flex gap-2">
                  <Input
                    id="scan-carnet"
                    placeholder="C-2024-XXXX"
                    value={carnetRef}
                    onChange={(e) => setCarnetRef(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" className="shrink-0" title="Scanner code-barres">
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {carnetRef && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex flex-col gap-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium text-foreground">Marie Kabila</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Solde actuel</span>
                      <span className="font-medium text-foreground">2,450,000 FC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Statut</span>
                      <StatusBadge status="success" label="Actif" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="depot-montant">Montant</Label>
                <Input id="depot-montant" type="number" placeholder="0" />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="depot-devise">Devise</Label>
                <Select>
                  <SelectTrigger id="depot-devise">
                    <SelectValue placeholder="CDF" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDF">CDF (Franc Congolais)</SelectItem>
                    <SelectItem value="USD">USD (Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <Button className="w-full gap-2">
                <Send className="h-4 w-4" />
                Enregistrer le depot
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Rapport du jour</CardTitle>
                  <CardDescription>Collectes et depots enregistres aujourd&apos;hui</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Synchroniser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Heure</TableHead>
                      <TableHead className="font-semibold">Carnet</TableHead>
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold">Montant</TableHead>
                      <TableHead className="font-semibold">Mode</TableHead>
                      <TableHead className="font-semibold text-center">Sync</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyCollections.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.time}</TableCell>
                        <TableCell className="font-mono text-sm text-primary">{item.carnet}</TableCell>
                        <TableCell className="font-medium text-foreground">{item.client}</TableCell>
                        <TableCell className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          +{item.montant}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                            {item.mode}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.synced ? (
                            <Wifi className="h-4 w-4 text-emerald-500 mx-auto" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-amber-500 mx-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
