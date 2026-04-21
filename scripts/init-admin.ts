import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

// Charger les variables d'environnement
dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Nécessite la clé service_role

if (!url || !serviceRoleKey) {
    console.error("Erreur : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env")
    process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

async function initAdmin() {
    const email = process.env.ADMIN_EMAIL || "admin@admin.com"
    const password = process.env.ADMIN_PASSWORD || "admin1234"

    console.log(`Initialisation de l'utilisateur ${email}...`)

    // 1. Vérifier si l'utilisateur existe déjà
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
        console.error("Erreur lors de la récupération des utilisateurs :", listError.message)
        return
    }

    const existingUser = listData?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (existingUser) {
        console.log("L'utilisateur existe déjà dans Auth. Mise à jour du mot de passe...")
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password,
        })
        if (updateError) {
            console.error("Erreur lors de la mise à jour du mot de passe :", updateError.message)
            return
        }
        console.log("Mot de passe mis à jour avec succès.")
        await updateProfile(existingUser.id, email)
    } else {
        // 2. Créer l'utilisateur dans Auth
        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: "Administrateur Système", username: "admin" },
            app_metadata: { function: "admin" },
        })

        if (authError) {
            console.error("Erreur Auth lors de la création :", authError.message)
            return
        }

        if (userData?.user) {
            console.log("Utilisateur créé avec succès dans Auth.")
            await updateProfile(userData.user.id, email)
        }
    }
}

async function updateProfile(userId: string, email: string) {
    console.log("Mise à jour du profil dans la table public.user_profile...")

    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabase
        .from("user_profile")
        .select("id")
        .eq("user_id", userId)
        .single()

    if (existingProfile) {
        const { error: updateError } = await supabase
            .from("user_profile")
            .update({
                function: "admin",
                email: email,
                username: "admin"
            })
            .eq("user_id", userId)

        if (updateError) {
            console.error("Erreur lors de la mise à jour du profil :", updateError.message)
        } else {
            console.log("Profil mis à jour avec succès.")
        }
    } else {
        const { error: insertError } = await supabase
            .from("user_profile")
            .insert({
                user_id: userId,
                function: "admin",
                email: email,
                username: "admin",
                phone: null,
                avatar_url: null
            })

        if (insertError) {
            console.error("Erreur lors de la création du profil :", insertError.message)
        } else {
            console.log("Profil créé avec succès.")
        }
    }
}

initAdmin()
