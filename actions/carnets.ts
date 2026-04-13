"use server"

import { createClient as createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ActionResult<T = any> = {
    success: boolean
    data?: T
    error?: string
}

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

export async function archiveCarnetAction(carnetId: string): Promise<ActionResult> {
    try {
        const currentUserId = await getCurrentUserId()
        const adminClient = createAdminClient()

        // Verify carnet status
        const { data: carnet, error: carnetError } = await adminClient
            .from("carnet")
            .select("is_archived")
            .eq("id", carnetId)
            .single()

        if (carnetError || !carnet) {
            return { success: false, error: "Carnet introuvable" }
        }

        if (carnet.is_archived) {
            return { success: false, error: "Ce carnet est deja cloture" }
        }

        // Archive it
        const { error: updateError } = await adminClient
            .from("carnet")
            .update({
                is_archived: true,
                updated_by: currentUserId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", carnetId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        return { success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erreur inattendue"
        return { success: false, error: message }
    }
}
