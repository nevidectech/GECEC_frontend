"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResult } from "./dashboard"

export type CurrentUser = {
    id: string
    username: string
    initials: string
    email: string | null
    function: string | null
    role: string
    zone: string | null
    avatarUrl: string | null
}

export type UserProfileDetails = CurrentUser & {
    phone: string | null
    zoneId: string | null
}

const updateCurrentUserProfileSchema = z.object({
    username: z.string().trim().min(3, "Le nom utilisateur doit contenir au moins 3 caracteres"),
    email: z.string().email("Email invalide"),
    phone: z.string().trim().min(3, "Telephone invalide").nullable().optional(),
    password: z.string().trim().min(6, "Le mot de passe doit contenir au moins 6 caracteres").optional().or(z.literal("")),
    avatarUrl: z
        .string()
        .trim()
        .refine(
            (value) =>
                value.length === 0 ||
                value.startsWith("http://") ||
                value.startsWith("https://") ||
                value.startsWith("data:image/"),
            "Image de profil invalide",
        )
        .nullable()
        .optional(),
})

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
                    function: null,
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
            superviseur: "Superviseur",
            caissiere: "Caissiere",
        }

        return {
            success: true,
            data: {
                id: user.id,
                username,
                initials: username.substring(0, 2).toUpperCase(),
                email: profile.email ?? user.email ?? null,
                function: profile.function ?? null,
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

export async function getCurrentUserProfileAction(): Promise<ActionResult<UserProfileDetails>> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Non authentifié" }
        }

        const adminClient = createAdminClient()
        const { data: profile } = await adminClient
            .from("user_profile")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()

        let zoneName: string | null = null
        if (profile?.zone_id) {
            const { data: zone } = await adminClient
                .from("zone")
                .select("name")
                .eq("id", profile.zone_id)
                .single()
            zoneName = zone?.name ?? null
        }

        const username = profile?.username ?? user.user_metadata?.username ?? user.email?.split("@")[0] ?? "Utilisateur"
        const roleLabels: Record<string, string> = {
            admin: "Administrateur",
            superviseur: "Superviseur",
            caissiere: "Caissiere",
        }
        const rawRole = profile?.function ?? (user.app_metadata?.function as string | undefined) ?? "admin"

        return {
            success: true,
            data: {
                id: user.id,
                username,
                initials: username.substring(0, 2).toUpperCase(),
                email: profile?.email ?? user.email ?? null,
                role: roleLabels[rawRole] ?? rawRole,
                zone: zoneName,
                zoneId: profile?.zone_id ?? null,
                phone: profile?.phone ?? null,
                avatarUrl: profile?.avatar_url ?? null,
            }
        }
    } catch (error) {
        console.error("getCurrentUserProfileAction error:", error)
        return { success: false, error: "Erreur lors de la récupération du profil" }
    }
}

export async function updateCurrentUserProfileAction(
    input: z.infer<typeof updateCurrentUserProfileSchema>,
): Promise<ActionResult<UserProfileDetails>> {
    try {
        const payload = updateCurrentUserProfileSchema.parse(input)
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: "Non authentifié" }
        }

        const adminClient = createAdminClient()
        const { data: existingProfile } = await adminClient
            .from("user_profile")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()

        const username = payload.username.trim()
        const email = payload.email.trim()
        const password = payload.password?.trim() || undefined
        const avatarUrl = payload.avatarUrl?.trim() || null
        const phone = payload.phone?.trim() || null

        const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(user.id, {
            email,
            password,
            user_metadata: {
                ...(user.user_metadata ?? {}),
                username,
            },
        })

        if (authUpdateError) {
            return { success: false, error: authUpdateError.message }
        }

        if (existingProfile) {
            const { error: updateError } = await adminClient
                .from("user_profile")
                .update({
                    username,
                    email,
                    phone,
                    avatar_url: avatarUrl,
                })
                .eq("user_id", user.id)

            if (updateError) {
                return { success: false, error: updateError.message }
            }
        } else {
            const { error: insertError } = await adminClient
                .from("user_profile")
                .insert({
                    user_id: user.id,
                    username,
                    email,
                    phone,
                    avatar_url: avatarUrl,
                    function: "admin",
                })

            if (insertError) {
                return { success: false, error: insertError.message }
            }
        }

        const refreshed = await getCurrentUserProfileAction()
        if (!refreshed.success || !refreshed.data) {
            return { success: false, error: refreshed.error ?? "Profil mis a jour, mais impossible de relire les donnees" }
        }

        return refreshed
    } catch (error) {
        console.error("updateCurrentUserProfileAction error:", error)
        const message = error instanceof Error ? error.message : "Erreur lors de la mise a jour du profil"
        return { success: false, error: message }
    }
}
