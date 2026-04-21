import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

// Charger les variables d'environnement
dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function createUser() {
    // Récupérer les arguments : email password role
    const args = process.argv.slice(2)
    const email = args[0] || process.env.ADMIN_EMAIL || "admin@admin.com"
    const password = args[1] || process.env.ADMIN_PASSWORD || "admin1234"
    const role = (args[2] || "admin") as "admin" | "collector" | "other"

    if (!email || !password) {
        console.log("Usage: npm run create-user -- <email> <password> <role>")
        return
    }

    console.log(`Initialisation de l'utilisateur ${email} avec le rôle ${role}...`)

    // 1. Vérifier si l'utilisateur existe déjà
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
        console.error("Erreur lors de la récupération des utilisateurs :", listError.message)
        return
    }

    const existingUser = listData?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (existingUser) {
        console.log("L'utilisateur existe déjà dans Auth. Mise à jour du mot de passe...")
        const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password,
            user_metadata: { full_name: role === 'admin' ? "Administrateur" : "Utilisateur" },
            app_metadata: { function: role },
        })
        if (updateError) {
            console.error("Erreur lors de la mise à jour :", updateError.message)
            return
        }
        userId = existingUser.id
        console.log("Compte Auth mis à jour.")
    } else {
        // 2. Créer l'utilisateur dans Auth
        const { data: userData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: role === 'admin' ? "Administrateur" : "Utilisateur" },
            app_metadata: { function: role },
        })

        if (authError) {
            console.error("Erreur Auth lors de la création :", authError.message)
            return
        }

        if (!userData?.user) {
            console.error("Erreur : utilisateur non retourné après création.")
            return
        }
        userId = userData.user.id
        console.log("Utilisateur créé avec succès dans Auth.")
    }

    // 3. Mettre à jour le profil public
    console.log(`Mise à jour du profil public (${role})...`)
    const { error: profileError } = await supabase
        .from("user_profile")
        .upsert({
            user_id: userId,
            email: email,
            username: email.split('@')[0],
            function: role,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

    if (profileError) {
        console.error("Erreur lors de la mise à jour du profil :", profileError.message)
    } else {
        console.log(`Utilisateur ${email} a été configuré avec succès avec le rôle ${role} !`)
    }
}

createUser()
