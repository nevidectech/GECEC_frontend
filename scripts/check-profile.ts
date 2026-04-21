import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function check() {
    if (!url || !serviceRoleKey) return
    const supabase = createClient(url, serviceRoleKey)
    
    const userId = "1de1312b-21c0-4b1f-bd16-66ce4e52b9cf"
    const { data: profile, error } = await supabase
        .from("user_profile")
        .select("*")
        .eq("user_id", userId)
        .single()
        
    if (error) {
        console.error("Profile Error:", error.message)
    } else {
        console.log("Profile found:", profile)
    }
}

check()
