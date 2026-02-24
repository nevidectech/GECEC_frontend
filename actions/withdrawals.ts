"use server"

import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

const createWithdrawalSchema = z.object({
  carnetId: z.string().uuid("Carnet invalide"),
  orderType: z.union([z.literal(1), z.literal(2)]),
  proofUrl: z.string().trim().url("URL de preuve invalide").optional().or(z.literal("")),
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

export async function createWithdrawalAction(
  input: z.infer<typeof createWithdrawalSchema>,
): Promise<ActionResult<{ id: string; amount: number }>> {
  try {
    const currentUserId = await getCurrentUserId()
    const payload = createWithdrawalSchema.parse(input)
    const adminClient = createAdminClient()

    const { data: carnet, error: carnetError } = await adminClient
      .from("carnet")
      .select("id, number, initial_amount, currency, is_archived, created_at")
      .eq("id", payload.carnetId)
      .single()

    if (carnetError || !carnet) {
      return { success: false, error: carnetError?.message ?? "Carnet introuvable" }
    }

    if (carnet.is_archived) {
      return { success: false, error: "Ce carnet est deja cloture" }
    }

    const { data: cotisations, error: cotisationsError } = await adminClient
      .from("cotisation")
      .select("amount")
      .eq("carnet_id", payload.carnetId)

    if (cotisationsError) {
      return { success: false, error: cotisationsError.message }
    }

    const totalCotisations = (cotisations ?? []).reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0,
    )
    const amount = totalCotisations - Number(carnet.initial_amount ?? 0)

    if (amount <= 0) {
      return {
        success: false,
        error: "Montant de retrait invalide (cotisations insuffisantes par rapport au montant initial)",
      }
    }

    const withdrawalDate = new Date()
    const carnetCreatedAt = carnet.created_at ? new Date(carnet.created_at) : withdrawalDate
    const endOfCreatedMonth = new Date(
      carnetCreatedAt.getFullYear(),
      carnetCreatedAt.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    )
    const computedWithdrawalType = withdrawalDate < endOfCreatedMonth ? 1 : 0

    const { data: createdWithdrawal, error: createError } = await adminClient
      .from("withdrawal")
      .insert({
        carnet_id: payload.carnetId,
        withdrawal_date: withdrawalDate.toISOString(),
        amount,
        currency: carnet.currency,
        withdrawal_type: computedWithdrawalType,
        order_type: payload.orderType,
        card_number: carnet.number,
        proof_url: payload.proofUrl?.trim() || null,
        created_by: currentUserId,
      })
      .select("id")
      .single()

    if (createError || !createdWithdrawal) {
      return { success: false, error: createError?.message ?? "Impossible de creer le retrait" }
    }

    const { error: archiveError } = await adminClient
      .from("carnet")
      .update({
        is_archived: true,
        updated_by: currentUserId,
      })
      .eq("id", payload.carnetId)

    if (archiveError) {
      await adminClient.from("withdrawal").delete().eq("id", createdWithdrawal.id)
      return { success: false, error: archiveError.message }
    }

    return { success: true, data: { id: createdWithdrawal.id, amount } }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inattendue"
    return { success: false, error: message }
  }
}
