import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function check() {
    if (!url || !serviceRoleKey) return
    const supabase = createClient(url, serviceRoleKey)
    
    console.log("Checking tables...")
    const tables = ["user_profile", "global_variable", "client", "carnet", "cotisation", "withdrawal"]
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select("*").limit(0)
        if (error) {
            console.error(`Table ${table} error: `, error.message)
        } else {
            console.log(`Table ${table} found!`)
        }
    }
}

check()
