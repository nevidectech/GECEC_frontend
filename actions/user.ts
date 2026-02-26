"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResult } from "./dashboard"

export type CurrentUser = {
    id: string
    username: string
    initials: string
    email: string | null
    role: string
    zone: string | null
    avatarUrl: string | null
}

export async function getCurrentUserAction(): Promise<ActionResult<CurrentUser>> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Non authentifié" }
        }

        const adminClient = createAdminClient()

        // Fetch user profile
        const { data: profile, error: profileError } = await adminClient
            .from("user_profile")
            .select("username, email, function, zone_id, avatar_url")
            .eq("user_id", user.id)
            .single()

        if (profileError || !profile) {
            // Fallback to auth user data
            const email = user.email ?? null
            const name = email?.split("@")[0] ?? "Utilisateur"
            return {
                success: true,
                data: {
                    id: user.id,
                    username: name,
                    initials: name.substring(0, 2).toUpperCase(),
                    email,
                    role: "Utilisateur",
                    zone: null,
                    avatarUrl: null,
                }
            }
        }

        // Resolve zone name if present
        let zoneName: string | null = null
        if (profile.zone_id) {
            const { data: zone } = await adminClient
                .from("zone")
                .select("name")
                .eq("id", profile.zone_id)
                .single()
            zoneName = zone?.name ?? null
        }

        const username = profile.username ?? user.email?.split("@")[0] ?? "Utilisateur"
        const roleLabels: Record<string, string> = {
            admin: "Administrateur",
            manager: "Gestionnaire",
            collecteur: "Collecteur",
            caissier: "Caissier",
            superviseur: "Superviseur",
        }

        return {
            success: true,
            data: {
                id: user.id,
                username,
                initials: username.substring(0, 2).toUpperCase(),
                email: profile.email ?? user.email ?? null,
                role: roleLabels[profile.function ?? ""] ?? profile.function ?? "Utilisateur",
                zone: zoneName,
                avatarUrl: profile.avatar_url ?? null,
            }
        }
    } catch (error) {
        console.error("getCurrentUserAction error:", error)
        return { success: false, error: "Erreur lors de la récupération du profil" }
    }
}
