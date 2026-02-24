"use client"

import { useMemo, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useGlobalVariables } from "@/hooks/useGlobalVariables"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type FormState = {
  group: string
  key: string
  value: string
  description: string
}

const emptyForm: FormState = {
  group: "",
  key: "",
  value: "",
  description: "",
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value))
}

export function ParametrageGlobalTab() {
  const { variables, loading, error, createVariable, updateVariable, deleteVariable } = useGlobalVariables()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(emptyForm)

  const countLabel = useMemo(() => `${variables.length} variable(s)`, [variables.length])

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const result = await createVariable(createForm)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de creer la variable globale")
      setSubmitting(false)
      return
    }

    toast.success("Variable globale creee")
    setCreateForm(emptyForm)
    setCreateOpen(false)
    setSubmitting(false)
  }

  function startEdit(id: string, group: string, key: string, value: string, description: string | null) {
    setEditingId(id)
    setEditForm({ group, key, value, description: description ?? "" })
    setEditOpen(true)
  }

  async function handleEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingId) return
    setSubmitting(true)

    const result = await updateVariable(editingId, editForm)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de modifier la variable globale")
      setSubmitting(false)
      return
    }

    toast.success("Variable globale modifiee")
    setEditOpen(false)
    setEditingId(null)
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer cette variable globale ?")) return
    setBusyId(id)
    const result = await deleteVariable(id)
    if (!result.success) {
      toast.error(result.error ?? "Impossible de supprimer la variable globale")
    } else {
      toast.success("Variable globale supprimee")
    }
    setBusyId(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold">Variables globales</CardTitle>
            <CardDescription>Configuration systeme centralisee ({countLabel})</CardDescription>
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
                <DialogTitle>Ajouter une variable globale</DialogTitle>
                <DialogDescription>
                  Renseignez le groupe, la cle et la valeur de configuration.
                </DialogDescription>
              </DialogHeader>

              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="space-y-2">
                  <Label htmlFor="global-group">Groupe</Label>
                  <Input
                    id="global-group"
                    placeholder="system"
                    value={createForm.group}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, group: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="global-key">Cle</Label>
                  <Input
                    id="global-key"
                    placeholder="default_currency"
                    value={createForm.key}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, key: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="global-value">Valeur</Label>
                  <Input
                    id="global-value"
                    placeholder="CDF"
                    value={createForm.value}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, value: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="global-description">Description</Label>
                  <Textarea
                    id="global-description"
                    placeholder="Description optionnelle"
                    value={createForm.description}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, description: event.target.value }))
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
                <TableHead className="font-semibold">Groupe</TableHead>
                <TableHead className="font-semibold">Cle</TableHead>
                <TableHead className="font-semibold">Valeur</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold">Mise a jour</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Chargement des variables globales...
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
                variables.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.group}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">{item.key}</TableCell>
                    <TableCell className="text-foreground">{item.value}</TableCell>
                    <TableCell className="text-muted-foreground">{item.description ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(item.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          disabled={busyId === item.id}
                          onClick={() =>
                            startEdit(item.id, item.group, item.key, item.value, item.description)
                          }
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-red-500 hover:text-red-600"
                          disabled={busyId === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && !error && variables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Aucune variable globale trouvee.
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
            <DialogTitle>Modifier la variable globale</DialogTitle>
            <DialogDescription>
              Mettez a jour les informations de cette variable.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleEdit}>
            <div className="space-y-2">
              <Label htmlFor="edit-global-group">Groupe</Label>
              <Input
                id="edit-global-group"
                value={editForm.group}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, group: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-global-key">Cle</Label>
              <Input
                id="edit-global-key"
                value={editForm.key}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, key: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-global-value">Valeur</Label>
              <Input
                id="edit-global-value"
                value={editForm.value}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, value: event.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-global-description">Description</Label>
              <Textarea
                id="edit-global-description"
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, description: event.target.value }))
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
    </Card>
  )
}
