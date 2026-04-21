import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function list() {
    if (!url || !serviceRoleKey) return
    const supabase = createClient(url, serviceRoleKey)
    
    console.log("Listing users...")
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
        console.error("Error listing users:", error.message)
    } else {
        console.log(`Total users: ${users.length}`)
        users.forEach(u => console.log(`- ${u.email} (${u.id})`))
    }
}

list()
