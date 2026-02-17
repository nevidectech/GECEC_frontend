"use server"

import { z } from "zod"
import type { ZoneUser } from "@/types/db"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

const createAffectationSchema = z.object({
  zoneId: z.string().uuid("Zone invalide"),
  userId: z.string().uuid("Utilisateur invalide"),
})

const updateAffectationSchema = z.object({
  id: z.string().uuid("Affectation invalide"),
  zoneId: z.string().uuid("Zone invalide"),
  userId: z.string().uuid("Utilisateur invalide"),
})

const unassignAffectationSchema = z.object({
  id: z.string().uuid("Affectation invalide"),
})

async function getCurrentUserId() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Utilisateur non authentifie")
  }

  return user.id
}

export async function listAffectationsAction(): Promise<ActionResult<ZoneUser[]>> {
  try {
    await getCurrentUserId()
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("zone_user")
      .select("*")
      .is("unassigned_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data ?? []) as ZoneUser[] }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function createAffectationAction(
  input: z.infer<typeof createAffectationSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const currentUserId = await getCurrentUserId()
    const payload = createAffectationSchema.parse(input)
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("zone_user")
      .upsert(
        {
          zone_id: payload.zoneId,
          user_id: payload.userId,
          created_by: currentUserId,
          updated_by: currentUserId,
          unassigned_at: null,
          unassigned_by: null,
        },
        { onConflict: "zone_id,user_id" },
      )
      .select("id")
      .single()

    if (error || !data) {
      return { success: false, error: error?.message ?? "Impossible de creer l'affectation" }
    }

    return { success: true, data: { id: data.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function updateAffectationAction(
  input: z.infer<typeof updateAffectationSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const currentUserId = await getCurrentUserId()
    const payload = updateAffectationSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("zone_user")
      .update({
        zone_id: payload.zoneId,
        user_id: payload.userId,
        updated_by: currentUserId,
      })
      .eq("id", payload.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: payload.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function unassignAffectationAction(
  input: z.infer<typeof unassignAffectationSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    const currentUserId = await getCurrentUserId()
    const payload = unassignAffectationSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("zone_user")
      .update({
        unassigned_at: new Date().toISOString(),
        unassigned_by: currentUserId,
        updated_by: currentUserId,
      })
      .eq("id", payload.id)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: payload.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}
