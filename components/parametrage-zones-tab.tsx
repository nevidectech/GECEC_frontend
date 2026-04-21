"use client"

import { useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useZones } from "@/hooks/useZones"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type FormState = {
  name: string
  code: string
}

const emptyForm: FormState = {
  name: "",
  code: "",
}

export function ParametrageZonesTab() {
  const { zones, loading, error, createZone, updateZone, deleteZone } = useZones()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const zonesCountLabel = useMemo(() => `${zones.length} zone(s)`, [zones.length])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    const result = await createZone({ name: createForm.name, code: createForm.code })
    if (!result.success) {
      toast.error(result.error ?? "Impossible de creer la zone")
      setSubmitting(false)
      return
    }

    toast.success("Zone creee avec succes")
    setCreateForm(emptyForm)
    setCreateOpen(false)
    setSubmitting(false)
  }

  function startEdit(id: string, name: string, code: string | null) {
    setEditingId(id)
    setEditForm({ name, code: code ?? "" })
    setEditOpen(true)
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingId) return
    setSubmitting(true)

    const result = await updateZone(editingId, { name: editForm.name, code: editForm.code })
    if (!result.success) {
      toast.error(result.error ?? "Impossible de modifier la zone")
      setSubmitting(false)
      return
    }

    toast.success("Zone modifiee avec succes")
    setEditOpen(false)
    setEditingId(null)
    setSubmitting(false)
  }

  function confirmDelete(id: string) {
    setDeleteId(id)
    setDeleteOpen(true)
  }

  async function handleDelete() {
    if (!deleteId) return
    setBusyId(deleteId)
    setDeleteOpen(false)

    const result = await deleteZone(deleteId)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de supprimer la zone")
    } else {
      toast.success("Zone supprimee avec succes")
    }
    setBusyId(null)
    setDeleteId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Zones</CardTitle>
            <CardDescription>Gestion des zones geographiques ({zonesCountLabel})</CardDescription>
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
                <DialogTitle>Ajouter une zone</DialogTitle>
                <DialogDescription>Creez une zone avec son nom et son code optionnel.</DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label htmlFor="zone-name">Nom</Label>
                  <Input
                    id="zone-name"
                    placeholder="Lubumbashi-Centre"
                    value={createForm.name}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, name: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zone-code">Code</Label>
                  <Input
                    id="zone-code"
                    placeholder="LBB-C"
                    value={createForm.code}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, code: event.target.value }))
                    }
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
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
                <TableHead className="font-semibold">Nom</TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Chargement des zones...
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
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium text-foreground">{zone.name}</TableCell>
                    <TableCell className="text-muted-foreground">{zone.code ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled={busyId === zone.id}
                          onClick={() => startEdit(zone.id, zone.name, zone.code)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                         <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          disabled={busyId === zone.id}
                          onClick={() => confirmDelete(zone.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && !error && zones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                    Aucune zone trouvee.
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
            <DialogTitle>Modifier la zone</DialogTitle>
            <DialogDescription>Mettez a jour le nom et le code de la zone.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEdit}>
            <div className="space-y-2">
              <Label htmlFor="edit-zone-name">Nom</Label>
              <Input
                id="edit-zone-name"
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-zone-code">Code</Label>
              <Input
                id="edit-zone-code"
                value={editForm.code}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, code: event.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <AlertDialogTitle>Supprimer la zone ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les affectations liées à cette zone seront également supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmer la suppression
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
