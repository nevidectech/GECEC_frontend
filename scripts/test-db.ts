import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"

dotenv.config()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testConnection() {
    console.log(`Connecting to: ${url}`)
    console.log(`Using key: ${anonKey?.substring(0, 20)}...`)

    if (!url || !anonKey) {
        console.error("Error: URL or Anon Key is missing in .env")
        return
    }

    const supabase = createClient(url, anonKey)

    try {
        // Attempt to fetch a single row from any public table
        // Since I don't know the table names, I'll try to just check auth health
        const { data, error } = await supabase.from("global_variable").select("*").limit(1)

        if (error) {
            console.error("Query Error:", error.message)
        } else {
            console.log("Connection successful! Data fetched:", data)
        }
    } catch (err) {
        console.error("Unexpected Error:", err)
    }
}

testConnection()
