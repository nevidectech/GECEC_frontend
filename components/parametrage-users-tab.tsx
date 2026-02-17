"use client"

import { useMemo, useState } from "react"
import { Plus, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUsers } from "@/hooks/useUsers"
import type { Profile, ProfileRole } from "@/types/db"
import { Button } from "@/components/ui/button"
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
  email: string
  password: string
  role: ProfileRole
}

const defaultForm: FormState = {
  fullName: "",
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

export function ParametrageUsersTab() {
  const { users, loading, error, createUser, updateUserRole } = useUsers()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)

  const usersCountLabel = useMemo(() => `${users.length} utilisateur(s)`, [users.length])

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const result = await createUser(form)
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
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Utilisateur</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                    Chargement des utilisateurs...
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-red-500">
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
                          <span className="text-xs text-muted-foreground font-mono">
                            {user.id}
                          </span>
                        </div>
                      </div>
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
                        {user.function === "admin" && (
                          <Shield className="h-3.5 w-3.5 text-primary" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && !error && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
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
