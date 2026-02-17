"use client"

import { useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Unlink2 } from "lucide-react"
import { toast } from "sonner"
import { useAffectations } from "@/hooks/useAffectations"
import { useUsers } from "@/hooks/useUsers"
import { useZones } from "@/hooks/useZones"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type FormState = {
  zoneId: string
  userId: string
}

const emptyForm: FormState = {
  zoneId: "",
  userId: "",
}

export function ParametrageAffectationTab() {
  const { zones } = useZones()
  const { users } = useUsers()
  const { affectations, loading, error, createAffectation, updateAffectation, unassignAffectation } =
    useAffectations()

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<FormState>(emptyForm)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const countLabel = useMemo(() => `${affectations.length} affectation(s) active(s)`, [affectations.length])

  const zoneById = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone])),
    [zones],
  )
  const userByUserId = useMemo(
    () => new Map(users.map((user) => [user.user_id, user])),
    [users],
  )

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    const result = await createAffectation(createForm)

    if (!result.success) {
      toast.error(result.error ?? "Impossible de creer l'affectation")
      setSubmitting(false)
      return
    }

    toast.success("Affectation creee avec succes")
    setCreateForm(emptyForm)
    setCreateOpen(false)
    setSubmitting(false)
  }

  function startEdit(id: string, zoneId: string, userId: string) {
    setEditingId(id)
    setEditForm({ zoneId, userId })
    setEditOpen(true)
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingId) return
    setSubmitting(true)

    const result = await updateAffectation(editingId, editForm)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de modifier l'affectation")
      setSubmitting(false)
      return
    }

    toast.success("Affectation modifiee avec succes")
    setEditOpen(false)
    setEditingId(null)
    setSubmitting(false)
  }

  async function handleUnassign(id: string) {
    if (!window.confirm("Desaffecter cet utilisateur de la zone ?")) return
    setBusyId(id)
    const result = await unassignAffectation(id)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de desaffecter")
    } else {
      toast.success("Utilisateur desaffecte")
    }
    setBusyId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Affectations Zone-Utilisateur</CardTitle>
            <CardDescription>{countLabel}</CardDescription>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle affectation</DialogTitle>
                <DialogDescription>Selectionnez une zone et un utilisateur.</DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label>Zone</Label>
                  <Select
                    value={createForm.zoneId}
                    onValueChange={(value) => setCreateForm((current) => ({ ...current, zoneId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.name} {zone.code ? `(${zone.code})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Utilisateur</Label>
                  <Select
                    value={createForm.userId}
                    onValueChange={(value) => setCreateForm((current) => ({ ...current, userId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.username ?? user.email ?? user.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !createForm.zoneId || !createForm.userId}
                  >
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
                <TableHead className="font-semibold">Zone</TableHead>
                <TableHead className="font-semibold">Utilisateur</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Chargement des affectations...
                  </TableCell>
                </TableRow>
              )}

              {!loading && error && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-red-500">
                    {error}
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                !error &&
                affectations.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {zoneById.get(item.zone_id)?.name ?? item.zone_id}
                    </TableCell>
                    <TableCell>
                      {userByUserId.get(item.user_id)?.username ??
                        userByUserId.get(item.user_id)?.email ??
                        item.user_id}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled={busyId === item.id}
                          onClick={() => startEdit(item.id, item.zone_id, item.user_id)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-500 hover:text-red-600"
                          disabled={busyId === item.id}
                          onClick={() => handleUnassign(item.id)}
                        >
                          <Unlink2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && !error && affectations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Aucune affectation active.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'affectation</DialogTitle>
            <DialogDescription>Mettez a jour la zone et l'utilisateur.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEdit}>
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select
                value={editForm.zoneId}
                onValueChange={(value) => setEditForm((current) => ({ ...current, zoneId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} {zone.code ? `(${zone.code})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Utilisateur</Label>
              <Select
                value={editForm.userId}
                onValueChange={(value) => setEditForm((current) => ({ ...current, userId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.username ?? user.email ?? user.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting || !editForm.zoneId || !editForm.userId}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
