"use server"

import { z } from "zod"
import type { GlobalVariable } from "@/types/db"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

const createGlobalVariableSchema = z.object({
  group: z.string().trim().min(2, "Le groupe est requis").max(50, "Le groupe est trop long"),
  key: z.string().trim().min(2, "La cle est requise").max(50, "La cle est trop longue"),
  value: z.string().trim().min(1, "La valeur est requise"),
  description: z.string().trim().optional(),
})

const updateGlobalVariableSchema = z.object({
  id: z.string().uuid("ID invalide"),
  group: z.string().trim().min(2, "Le groupe est requis").max(50, "Le groupe est trop long"),
  key: z.string().trim().min(2, "La cle est requise").max(50, "La cle est trop longue"),
  value: z.string().trim().min(1, "La valeur est requise"),
  description: z.string().trim().optional(),
})

const deleteGlobalVariableSchema = z.object({
  id: z.string().uuid("ID invalide"),
})

async function assertAuthenticated() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Utilisateur non authentifie")
  }
}

export async function listGlobalVariablesAction(): Promise<ActionResult<GlobalVariable[]>> {
  try {
    await assertAuthenticated()
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from("global_variable")
      .select("*")
      .order("group", { ascending: true })
      .order("key", { ascending: true })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data ?? []) as GlobalVariable[] }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function createGlobalVariableAction(
  input: z.infer<typeof createGlobalVariableSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAuthenticated()
    const payload = createGlobalVariableSchema.parse(input)
    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("global_variable")
      .insert({
        group: payload.group,
        key: payload.key,
        value: payload.value,
        description: payload.description?.trim() || null,
      })
      .select("id")
      .single()

    if (error || !data) {
      return { success: false, error: error?.message ?? "Impossible de creer la variable globale" }
    }

    return { success: true, data: { id: data.id } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}

export async function updateGlobalVariableAction(
  input: z.infer<typeof updateGlobalVariableSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAuthenticated()
    const payload = updateGlobalVariableSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("global_variable")
      .update({
        group: payload.group,
        key: payload.key,
        value: payload.value,
        description: payload.description?.trim() || null,
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

export async function deleteGlobalVariableAction(
  input: z.infer<typeof deleteGlobalVariableSchema>,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertAuthenticated()
    const payload = deleteGlobalVariableSchema.parse(input)
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("global_variable")
      .delete()
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
