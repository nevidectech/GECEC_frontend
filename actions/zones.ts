"use server"

import { z } from "zod"
import type { Zone } from "@/types/db"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

const createZoneSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis").max(50, "Le nom est trop long"),
  code: z.string().trim().max(20, "Le code est trop long").optional(),
})

const updateZoneSchema = z.object({
  id: z.string().uuid("ID zone invalide"),
  name: z.string().trim().min(2, "Le nom est requis").max(50, "Le nom est trop long"),
  code: z.string().trim().max(20, "Le code est trop long").optional(),
})

const deleteZoneSchema = z.object({
  id: z.string().uuid("ID zone invalide"),
})

async function assertAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("Utilisateur non authentifie")
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profile")
    .select("function")
    .eq("user_id", user.id)
    .single()

  // if (profileError || !profile || profile.function !== "admin") {
  //   throw new Error("Action reservee aux administrateurs")
  // }
}

export async function listZonesAction(): Promise<ActionResult<Zone[]>> {
  try {
    await assertAdmin()
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("zone")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data ?? []) as Zone[] }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function createZoneAction(
  input: z.infer<typeof createZoneSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin()
    const payload = createZoneSchema.parse(input)
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("zone")
      .insert({
        name: payload.name,
        code: payload.code?.trim() || null,
      })
      .select("id")
      .single()

    if (error || !data) {
      return { success: false, error: error?.message ?? "Impossible de creer la zone" }
    }

    return { success: true, data: { id: data.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function updateZoneAction(
  input: z.infer<typeof updateZoneSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin()
    const payload = updateZoneSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("zone")
      .update({
        name: payload.name,
        code: payload.code?.trim() || null,
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

export async function deleteZoneAction(
  input: z.infer<typeof deleteZoneSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAdmin()
    const payload = deleteZoneSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient.from("zone").delete().eq("id", payload.id)
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: { id: payload.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}
