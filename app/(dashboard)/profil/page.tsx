"use client"

import { ChangeEvent, useEffect, useState } from "react"
import { toast } from "sonner"
import { AppHeader } from "@/components/app-header"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentUserProfileAction, type UserProfileDetails, updateCurrentUserProfileAction } from "@/actions/user"
import { Camera, KeyRound, Loader2, Mail, Phone, Save, Shield, User } from "lucide-react"

function getInitials(username: string) {
  const parts = username.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return username.slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

type FormState = {
  username: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  avatarUrl: string
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<UserProfileDetails | null>(null)
  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    avatarUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)

      const result = await getCurrentUserProfileAction()
      if (!result.success || !result.data) {
        setError(result.error ?? "Impossible de charger le profil")
        setLoading(false)
        return
      }

      setProfile(result.data)
      setForm({
        username: result.data.username,
        email: result.data.email ?? "",
        phone: result.data.phone ?? "",
        password: "",
        confirmPassword: "",
        avatarUrl: result.data.avatarUrl ?? "",
      })
      setLoading(false)
    }

    void loadProfile()
  }, [])

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez choisir une image valide")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setForm((current) => ({ ...current, avatarUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (form.password && form.password !== form.confirmPassword) {
      toast.error("La confirmation du mot de passe ne correspond pas")
      return
    }

    setSaving(true)

    const result = await updateCurrentUserProfileAction({
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      password: form.password.trim() || undefined,
      avatarUrl: form.avatarUrl.trim() || null,
    })

    if (!result.success || !result.data) {
      toast.error(result.error ?? "Impossible de mettre a jour le profil")
      setSaving(false)
      return
    }

    setProfile(result.data)
    setForm({
      username: result.data.username,
      email: result.data.email ?? "",
      phone: result.data.phone ?? "",
      password: "",
      confirmPassword: "",
      avatarUrl: result.data.avatarUrl ?? "",
    })
    window.dispatchEvent(new Event("user-profile-updated"))
    toast.success("Profil mis a jour")
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <>
        <AppHeader breadcrumbs={[{ label: "Profil" }]} />
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center text-red-500">{error}</CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!profile) return null

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Profil" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Mon profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Modifiez vos informations personnelles, votre image et votre mot de passe.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Apercu</CardTitle>
              <CardDescription>Informations visibles dans la navigation.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-28 w-28">
                {form.avatarUrl && <AvatarImage src={form.avatarUrl} alt={form.username} />}
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                  {getInitials(form.username || profile.username)}
                </AvatarFallback>
              </Avatar>

              <div className="text-center">
                <p className="text-lg font-semibold text-foreground">{form.username || profile.username}</p>
                <p className="text-sm text-muted-foreground">{profile.role}</p>
                <p className="text-xs text-muted-foreground">{profile.zone || "Aucune zone"}</p>
              </div>

              <div className="w-full rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Rôle: {profile.role}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{form.email || "-"}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{form.phone || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Informations du compte</CardTitle>
              <CardDescription>Vous pouvez modifier votre nom utilisateur, email, telephone, photo et mot de passe.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-username">Nom utilisateur</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="profile-username"
                        className="pl-9"
                        value={form.username}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, username: event.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="profile-email"
                        type="email"
                        className="pl-9"
                        value={form.email}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, email: event.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Telephone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="profile-phone"
                        className="pl-9"
                        value={form.phone}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, phone: event.target.value }))
                        }
                        placeholder="+257 ..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-avatar-file">Image de profil</Label>
                    <div className="flex items-center gap-3">
                      <label
                        htmlFor="profile-avatar-file"
                        className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        <Camera className="h-4 w-4" />
                        Choisir une image
                      </label>
                      {form.avatarUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setForm((current) => ({ ...current, avatarUrl: "" }))}
                        >
                          Retirer
                        </Button>
                      )}
                    </div>
                    <Input
                      id="profile-avatar-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      Vous pouvez aussi coller une image chargee localement. Elle sera enregistree sur votre profil.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 p-4 text-sm">
                  <p className="font-medium text-foreground">Informations en lecture seule</p>
                  <p className="mt-2 text-muted-foreground">Rôle: {profile.role}</p>
                  <p className="text-muted-foreground">Zone: {profile.zone || "Aucune zone"}</p>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground">Modifier le mot de passe</p>
                    <p className="text-xs text-muted-foreground">
                      Laissez ces champs vides si vous ne souhaitez pas changer votre mot de passe.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="profile-password">Nouveau mot de passe</Label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="profile-password"
                          type="password"
                          className="pl-9"
                          value={form.password}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, password: event.target.value }))
                          }
                          minLength={6}
                          placeholder="Minimum 6 caracteres"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profile-confirm-password">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="profile-confirm-password"
                          type="password"
                          className="pl-9"
                          value={form.confirmPassword}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, confirmPassword: event.target.value }))
                          }
                          minLength={6}
                          placeholder="Retapez le mot de passe"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
