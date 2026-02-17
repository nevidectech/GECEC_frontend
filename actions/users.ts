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

const roleSchema = z.enum(["admin", "collector", "other"])

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

const roleValues: ProfileRole[] = ["admin", "collector", "other"]

function normalizeRole(value: unknown): ProfileRole {
  return roleValues.includes(value as ProfileRole) ? (value as ProfileRole) : "other"
}

function mapAuthUserToProfile(user: {
  id: string
  email?: string | null
  created_at?: string
  user_metadata?: Record<string, unknown> | null
  app_metadata?: Record<string, unknown> | null
}): Profile {
  const metadataUsername = user.user_metadata?.username as string | undefined
  const derivedUsername = user.email?.split("@")[0] ?? null

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

    return {
      success: true,
      data: (data.users ?? [])
        .map((user) => mapAuthUserToProfile(user))
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")),
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
