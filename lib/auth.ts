"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import bcrypt from "bcryptjs";

// Verify password against hashed value
async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
    try {
        // Attempt bcrypt comparison
        return await bcrypt.compare(plain, hashed);
    } catch (err) {
        // If bcrypt fails (e.g. invalid hash format), fallback to plain comparison for now
        // In production, this should only handle bcrypt
        console.warn("Bcrypt verification failed, falling back to plain comparison", err);
        return plain === hashed;
    }
}

export async function login(formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { success: false, error: "Nom d'utilisateur et mot de passe requis." };
    }

    const supabase = await createClient();

    // Query the custom auth_user table
    const { data: user, error } = await supabase
        .from("auth_user")
        .select("*")
        .eq("username", username)
        .single();

    if (error || !user) {
        return { success: false, error: "Utilisateur non trouvé." };
    }

    if (!user.is_active) {
        return { success: false, error: "Ce compte est désactivé." };
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
        return { success: false, error: "Mot de passe incorrect." };
    }

    // Set a custom session cookie
    const cookieStore = await cookies();
    cookieStore.set("custom_session", JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        is_superuser: user.is_superuser,
    }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
    });

    return { success: true };
}

export async function register(formData: FormData) {
    const username = formData.get("username") as string;
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!username || !password || !email) {
        return { success: false, error: "Tous les champs requis ne sont pas remplis." };
    }

    const supabase = await createClient();

    // Check if user already exists (username)
    const { data: existingUserByUsername } = await supabase
        .from("auth_user")
        .select("id")
        .eq("username", username)
        .maybeSingle();

    if (existingUserByUsername) {
        return { success: false, error: "Ce nom d'utilisateur est déjà utilisé." };
    }

    // Check if user already exists (email)
    const { data: existingUserByEmail } = await supabase
        .from("auth_user")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (existingUserByEmail) {
        return { success: false, error: "Cet email est déjà utilisé." };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const { error } = await supabase.from("auth_user").insert([
        {
            username,
            first_name,
            last_name,
            email,
            password: hashedPassword,
            is_superuser: false,
            is_staff: false,
            is_active: true,
            date_joined: new Date().toISOString(),
        },
    ]);

    if (error) {
        console.error("Registration Supabase error:", error);
        return { success: false, error: `Erreur base de données: ${error.message}` };
    }

    return { success: true };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("custom_session");
    redirect("/login");
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("custom_session")?.value;
    return session ? JSON.parse(session) : null;
}
