"use client"

import { useMemo, useState } from "react"
import { Plus, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUsers } from "@/hooks/useUsers"
import { useZones } from "@/hooks/useZones"
import type { Profile, ProfileRole } from "@/types/db"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type FormState = {
  fullName: string
  username: string
  email: string
  password: string
  role: ProfileRole
}

const defaultForm: FormState = {
  fullName: "",
  username: "",
  email: "",
  password: "",
  role: "collector",
}

function getInitials(user: Profile) {
  const source = user.username?.trim() || user.email?.trim() || user.user_id
  const words = source.split(/\s+/).filter(Boolean)
  if (words.length < 2) return source.slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value))
}

const roleMeta: Record<ProfileRole, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin: { label: "Admin", variant: "default" },
  collector: { label: "Collector", variant: "secondary" },
  other: { label: "Other", variant: "outline" },
}

export function ParametrageUsersTab() {
  const { users, loading, error, createUser, updateUserRole } = useUsers()
  const { zones } = useZones()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const usersCountLabel = useMemo(() => `${users.length} utilisateur(s)`, [users.length])
  const adminsCount = useMemo(
    () => users.filter((user) => (user.function ?? "other") === "admin").length,
    [users],
  )
  const collectorsCount = useMemo(
    () => users.filter((user) => (user.function ?? "other") === "collector").length,
    [users],
  )
  const othersCount = useMemo(
    () => users.filter((user) => (user.function ?? "other") === "other").length,
    [users],
  )
  const zoneNameById = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone.name])),
    [zones],
  )

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const result = await createUser({
      ...form,
      username: form.username.trim() || undefined,
    })
    if (!result.success) {
      toast.error(result.error ?? "Impossible de creer l'utilisateur")
      setSubmitting(false)
      return
    }

    toast.success("Utilisateur cree avec succes")
    setForm(defaultForm)
    setOpen(false)
    setSubmitting(false)
  }

  async function handleRoleChange(userId: string, role: ProfileRole) {
    setBusyUserId(userId)
    const result = await updateUserRole(userId, role)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de modifier le role")
    } else {
      toast.success("Role mis a jour")
    }
    setBusyUserId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Utilisateurs & Roles</CardTitle>
            <CardDescription>Gestion des acces et permissions ({usersCountLabel})</CardDescription>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un utilisateur</DialogTitle>
                <DialogDescription>
                  Cree un compte auth + profil dans une seule operation securisee.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div className="space-y-2">
                  <Label htmlFor="full-name">Nom complet</Label>
                  <Input
                    id="full-name"
                    placeholder="Jean Dupont"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, fullName: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nom utilisateur</Label>
                  <Input
                    id="username"
                    placeholder="jean.dupont"
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, username: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jean@gecec.cd"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 caracteres"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, password: event.target.value }))
                    }
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, role: value as ProfileRole }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="collector">Collector</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Creer
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 pb-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Administrateurs</p>
            <p className="text-lg font-semibold text-foreground">{adminsCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Collectors</p>
            <p className="text-lg font-semibold text-foreground">{collectorsCount}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Autres roles</p>
            <p className="text-lg font-semibold text-foreground">{othersCount}</p>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Utilisateur</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Zone</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Cree le</TableHead>
                <TableHead className="font-semibold">ID auth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Chargement des utilisateurs...
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {user.username ?? "Sans nom"}
                            </span>
                            <span className="text-xs text-muted-foreground">{user.email ?? "-"}</span>
                          </div>
                        </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{user.phone ?? "-"}</span>
                        <span className="text-xs text-muted-foreground">{user.email ?? "-"}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {user.zone_id ? zoneNameById.get(user.zone_id) ?? "Zone inconnue" : "Non assigne"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.function ?? "other"}
                          onValueChange={(value) => handleRoleChange(user.id, value as ProfileRole)}
                          disabled={busyUserId === user.id}
                        >
                          <SelectTrigger className="h-8 w-[170px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="collector">Collector</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant={roleMeta[user.function ?? "other"].variant}>
                          {roleMeta[user.function ?? "other"].label}
                        </Badge>
                        {user.function === "admin" && (
                          <Shield className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {formatDate(user.created_at)}
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.user_id}
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && !error && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Aucun utilisateur trouve.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
