"use server"

import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export interface AuditLog {
  id: string
  action: string
  description: string
  user: string
  role: string
  timestamp: string
  type: "depot" | "retrait" | "edit" | "create" | "settings" | "validation"
}

export async function getAuditHistoryAction(limit: number = 50): Promise<ActionResult<AuditLog[]>> {
  try {
    const adminClient = createAdminClient()
    const logs: AuditLog[] = []

    // Get cotisations (deposits)
    const { data: cotisations, error: cotisationsError } = await adminClient
      .from("cotisation")
      .select(
        `
        id,
        amount,
        cotisation_date,
        created_by,
        carnet_id,
        carnet (
          number,
          client_code,
          carnet!inner (
            client (
              first_name,
              last_name
            )
          )
        ),
        created_by (
          username,
          user_profile (
            function
          )
        )
      `
      )
      .order("cotisation_date", { ascending: false })
      .limit(limit)

    if (!cotisationsError && cotisations) {
      cotisations.forEach((cot: any) => {
        const user = cot.created_by?.username || "Utilisateur inconnu"
        const role = cot.created_by?.user_profile?.function || "Agent"
        const clientName = cot.carnet?.client?.[0]?.first_name 
          ? `${cot.carnet.client[0].first_name} ${cot.carnet.client[0].last_name || ""}`
          : "Client inconnu"
        
        logs.push({
          id: `cotisation-${cot.id}`,
          action: "Depot enregistre",
          description: `Depot de ${Number(cot.amount).toLocaleString("fr-FR")} FC sur carnet ${cot.carnet?.number || "N/A"} - ${clientName}`,
          user,
          role,
          timestamp: new Date(cot.cotisation_date).toLocaleString("fr-FR"),
          type: "depot",
        })
      })
    }

    // Get withdrawals
    const { data: withdrawals, error: withdrawalsError } = await adminClient
      .from("withdrawal")
      .select(
        `
        id,
        amount,
        withdrawal_date,
        withdrawal_type,
        created_by,
        carnet (
          number,
          client_code
        )
      `
      )
      .order("withdrawal_date", { ascending: false })
      .limit(limit)

    if (!withdrawalsError && withdrawals) {
      withdrawals.forEach((w: any) => {
        const user = w.created_by || "Utilisateur inconnu"
        const action = w.withdrawal_type === 1 ? "Retrait initie" : "Retrait valide"
        
        logs.push({
          id: `withdrawal-${w.id}`,
          action,
          description: `Retrait de ${Number(w.amount).toLocaleString("fr-FR")} FC sur carnet ${w.carnet?.number || "N/A"}`,
          user,
          role: "Agent",
          timestamp: new Date(w.withdrawal_date).toLocaleString("fr-FR"),
          type: "retrait",
        })
      })
    }

    // Sort all logs by timestamp descending
    logs.sort((a, b) => {
      const dateA = new Date(a.timestamp.split(" ")[0].split("/").reverse().join("-")).getTime()
      const dateB = new Date(b.timestamp.split(" ")[0].split("/").reverse().join("-")).getTime()
      return dateB - dateA
    })

    return { success: true, data: logs.slice(0, limit) }
  } catch (error) {
    console.error("getAuditHistoryAction error:", error)
    const message = error instanceof Error ? error.message : "Erreur lors de la recuperation de l'historique"
    return { success: false, error: message }
  }
}
