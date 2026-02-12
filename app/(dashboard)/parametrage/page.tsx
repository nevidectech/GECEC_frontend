"use client"

import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import {
  Settings,
  Users,
  Building2,
  DollarSign,
  Percent,
  Receipt,
  Shield,
  Save,
  Plus,
  Edit,
} from "lucide-react"

const users = [
  { name: "Jean Dupont", email: "jean.dupont@gecec.cd", role: "Administrateur", initials: "JD", status: "active" },
  { name: "Sarah Kalala", email: "sarah.kalala@gecec.cd", role: "Agent", initials: "SK", status: "active" },
  { name: "Patrick Mbuyi", email: "patrick.mbuyi@gecec.cd", role: "Collecteur", initials: "PM", status: "active" },
  { name: "David Kasongo", email: "david.kasongo@gecec.cd", role: "Collecteur", initials: "DK", status: "active" },
  { name: "Grace Mwamba", email: "grace.mwamba@gecec.cd", role: "Collecteur", initials: "GM", status: "inactive" },
]

const remunerationTiers = [
  { tier: "Standard CDF", soldeMin: "0 FC", soldeMax: "1,000,000 FC", taux: "1.0%" },
  { tier: "Silver CDF", soldeMin: "1,000,001 FC", soldeMax: "5,000,000 FC", taux: "1.5%" },
  { tier: "Gold CDF", soldeMin: "5,000,001 FC", soldeMax: "20,000,000 FC", taux: "2.0%" },
  { tier: "Standard USD", soldeMin: "$0", soldeMax: "$500", taux: "1.5%" },
  { tier: "Silver USD", soldeMin: "$501", soldeMax: "$2,000", taux: "2.0%" },
  { tier: "Gold USD", soldeMin: "$2,001", soldeMax: "$10,000", taux: "2.5%" },
]

const fees = [
  { operation: "Ouverture carnet Standard", montant: "5,000 FC", status: "active" },
  { operation: "Ouverture carnet Premium", montant: "10,000 FC", status: "active" },
  { operation: "Emission duplicata", montant: "2,500 FC", status: "active" },
  { operation: "Retrait anticipe", montant: "1% du montant", status: "active" },
  { operation: "Cloture anticipee", montant: "5,000 FC", status: "inactive" },
]

export default function ParametragePage() {
  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Parametrage" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Parametrage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configuration du systeme et gestion des utilisateurs
          </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Organisation
            </TabsTrigger>
            <TabsTrigger value="currency" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Devises
            </TabsTrigger>
            <TabsTrigger value="remuneration" className="gap-1.5">
              <Percent className="h-3.5 w-3.5" />
              Remuneration
            </TabsTrigger>
            <TabsTrigger value="fees" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" />
              Frais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Utilisateurs & Roles</CardTitle>
                    <CardDescription>Gestion des acces et permissions</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Utilisateur</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Role</TableHead>
                        <TableHead className="font-semibold">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.email}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                  {user.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                              {user.role === "Administrateur" && <Shield className="h-3 w-3" />}
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={user.status === "active" ? "success" : "error"}
                              label={user.status === "active" ? "Actif" : "Inactif"}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              <Edit className="h-3 w-3" />
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Informations de l&apos;organisation</CardTitle>
                <CardDescription>Parametres de branding et identification</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 max-w-2xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
                    <Input id="org-name" defaultValue="GECEC Finance" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="org-code">Code</Label>
                    <Input id="org-code" defaultValue="GECEC-LBB" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="org-phone">Telephone</Label>
                    <Input id="org-phone" defaultValue="+243 997 123 456" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="org-email">Email</Label>
                    <Input id="org-email" defaultValue="contact@gecec.cd" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="org-address">Adresse</Label>
                  <Input id="org-address" defaultValue="Avenue Lumumba 125, Lubumbashi, RDC" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Mode maintenance</p>
                    <p className="text-xs text-muted-foreground">Desactiver les operations pendant la maintenance</p>
                  </div>
                  <Switch />
                </div>
                <Button className="w-fit gap-1.5">
                  <Save className="h-4 w-4" />
                  Sauvegarder
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="currency" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Devises & Taux de change</CardTitle>
                <CardDescription>Configuration des devises supportees</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 max-w-2xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">CDF</span>
                        <span className="text-sm text-muted-foreground">Franc Congolais</span>
                      </div>
                      <StatusBadge status="success" label="Principal" />
                    </div>
                    <p className="text-xs text-muted-foreground">Devise principale du systeme</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">USD</span>
                        <span className="text-sm text-muted-foreground">Dollar US</span>
                      </div>
                      <StatusBadge status="info" label="Secondaire" />
                    </div>
                    <p className="text-xs text-muted-foreground">Devise de reference internationale</p>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-3">
                  <Label>Taux de change actuel</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg border p-3 flex-1">
                      <span className="text-sm font-medium text-foreground">1 USD</span>
                      <span className="text-muted-foreground">=</span>
                      <Input defaultValue="2750" className="w-28 h-8" />
                      <span className="text-sm font-medium text-foreground">CDF</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Mis a jour le 10/02/2024</p>
                </div>
                <Button className="w-fit gap-1.5">
                  <Save className="h-4 w-4" />
                  Mettre a jour
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remuneration" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Paliers de remuneration</CardTitle>
                    <CardDescription>Taux de remuneration selon le solde moyen</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter palier
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Palier</TableHead>
                        <TableHead className="font-semibold">Solde min</TableHead>
                        <TableHead className="font-semibold">Solde max</TableHead>
                        <TableHead className="font-semibold">Taux</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remunerationTiers.map((tier) => (
                        <TableRow key={tier.tier}>
                          <TableCell className="font-medium text-foreground">{tier.tier}</TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{tier.soldeMin}</TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">{tier.soldeMax}</TableCell>
                          <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{tier.taux}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              <Edit className="h-3 w-3" />
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Grille tarifaire</CardTitle>
                    <CardDescription>Frais applicables aux operations</CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter frais
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Operation</TableHead>
                        <TableHead className="font-semibold">Montant</TableHead>
                        <TableHead className="font-semibold">Statut</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.map((fee) => (
                        <TableRow key={fee.operation}>
                          <TableCell className="font-medium text-foreground">{fee.operation}</TableCell>
                          <TableCell className="tabular-nums text-foreground">{fee.montant}</TableCell>
                          <TableCell>
                            <StatusBadge
                              status={fee.status === "active" ? "success" : "default"}
                              label={fee.status === "active" ? "Actif" : "Inactif"}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                              <Edit className="h-3 w-3" />
                              Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
