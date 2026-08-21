"use server"

import { z } from "zod"
import type { Profile, ProfileRole } from "@/types/db"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

const roleSchema = z.enum(["admin", "superviseur", "caissiere", "collector"])

const createUserSchema = z.object({
  fullName: z.string().trim().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres"),
  username: z.string().trim().min(3, "Le nom utilisateur doit contenir au moins 3 caracteres").optional(),
  role: roleSchema,
})

const updateRoleSchema = z.object({
  id: z.string().uuid("ID utilisateur invalide"),
  role: roleSchema,
})

const updateUserSchema = z.object({
  id: z.string().uuid("ID profil invalide"),
  userId: z.string().uuid("ID auth invalide"),
  username: z.string().trim().min(3, "Le nom utilisateur doit contenir au moins 3 caracteres"),
  email: z.string().email("Email invalide"),
  phone: z.string().trim().min(3, "Telephone invalide").nullable().optional(),
  zoneId: z.string().uuid("Zone invalide").nullable().optional(),
  role: roleSchema,
  password: z
    .string()
    .trim()
    .min(6, "Le mot de passe doit contenir au moins 6 caracteres")
    .optional()
    .or(z.literal("")),
})

const roleValues: ProfileRole[] = ["admin", "superviseur", "caissiere", "collector"]

function normalizeRole(value: unknown): ProfileRole {
  return roleValues.includes(value as ProfileRole) ? (value as ProfileRole) : "admin"
}

function mapAuthUserToProfile(user: {
  id: string
  email?: string | null
  created_at?: string
  user_metadata?: Record<string, unknown> | null
  app_metadata?: Record<string, unknown> | null
  banned_until?: string | null
}): Profile {
  const metadataUsername = user.user_metadata?.username as string | undefined
  const derivedUsername = user.email?.split("@")[0] ?? null
  const isActive = !user.banned_until || new Date(user.banned_until) < new Date()

  return {
    id: user.id,
    user_id: user.id,
    phone: null,
    avatar_url: null,
    zone_id: null,
    updated_at: null,
    username: metadataUsername ?? derivedUsername,
    email: user.email ?? null,
    function: normalizeRole(user.app_metadata?.function),
    is_active: isActive,
    created_at: user.created_at ?? null,
  }
}

async function assertAdmin() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Utilisateur non authentifie")
  }

  return { userId: user.id }
}

export async function listUsersAction(): Promise<ActionResult<Profile[]>> {
  try {
    await assertAdmin()
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })

    if (error) {
      return { success: false, error: error.message }
    }

    const authProfiles = (data.users ?? []).map((user) => mapAuthUserToProfile(user))

    const { data: dbProfiles } = await adminClient
      .from("user_profile")
      .select("user_id, phone, zone_id, avatar_url, username, email")

    const profileByUserId = new Map((dbProfiles ?? []).map((p) => [p.user_id, p]))

    const merged = authProfiles.map((authProfile) => {
      const dbProfile = profileByUserId.get(authProfile.user_id)
      if (!dbProfile) return authProfile
      return {
        ...authProfile,
        phone: dbProfile.phone ?? authProfile.phone,
        zone_id: dbProfile.zone_id ?? authProfile.zone_id,
        avatar_url: dbProfile.avatar_url ?? authProfile.avatar_url,
        username: dbProfile.username ?? authProfile.username,
        email: dbProfile.email ?? authProfile.email,
      }
    })

    return {
      success: true,
      data: merged.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function createUserWithProfileAction(
  input: z.infer<typeof createUserSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin()
    const payload = createUserSchema.parse(input)
    const adminClient = createAdminClient()
    const username = payload.username?.trim() || payload.email.split("@")[0]

    const { data: createdUser, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: { full_name: payload.fullName, username },
      app_metadata: { function: payload.role },
    })

    if (createAuthError || !createdUser.user) {
      return {
        success: false,
        error: createAuthError?.message ?? "Impossible de creer le compte utilisateur",
      }
    }

    const { error: profileError } = await adminClient.from("user_profile").insert({
      user_id: createdUser.user.id,
      username,
      function: payload.role,
      email: payload.email,
    })

    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUser.user.id)
      return { success: false, error: profileError.message }
    }

    return { success: true, data: { id: createdUser.user.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function updateUserRoleAction(
  input: z.infer<typeof updateRoleSchema>,
): Promise<ActionResult<{ id: string; role: ProfileRole }>> {
  try {
    await assertAdmin()
    const payload = updateRoleSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("user_profile")
      .update({ function: payload.role })
      .eq("id", payload.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: payload.id, role: payload.role } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function toggleUserActiveAction(
  input: { userId: string; active: boolean },
): Promise<ActionResult<{ id: string; active: boolean }>> {
  try {
    await assertAdmin()
    const adminClient = createAdminClient()

    const { error } = await adminClient.auth.admin.updateUserById(input.userId, {
      ban_duration: input.active ? "none" : "100y",
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: input.userId, active: input.active } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function updateUserDetailsAction(
  input: z.infer<typeof updateUserSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin()
    const payload = updateUserSchema.parse(input)
    const adminClient = createAdminClient()

    const normalizedPassword = payload.password?.trim() || undefined

    const { error: authError } = await adminClient.auth.admin.updateUserById(payload.userId, {
      email: payload.email,
      password: normalizedPassword,
      user_metadata: { username: payload.username },
      app_metadata: { function: payload.role },
    })

    if (authError) {
      return { success: false, error: authError.message }
    }

    const { error: profileError } = await adminClient
      .from("user_profile")
      .update({
        username: payload.username,
        email: payload.email,
        phone: payload.phone?.trim() || null,
        zone_id: payload.zoneId ?? null,
        function: payload.role,
      })
      .eq("id", payload.id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    return { success: true, data: { id: payload.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}
