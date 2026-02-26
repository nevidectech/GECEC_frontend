import { createClient } from "@supabase/supabase-js"

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim()
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim().replace(/%$/, "")

const supabase = createClient(url, serviceRoleKey)

async function debug() {
    console.log("Checking collection_deposit table...")

    // 1. Simple select to see raw data
    const { data: raw, error: rawError } = await supabase
        .from("collection_deposit" as any)
        .select("*")

    if (rawError) {
        console.error("Error fetching raw deposits:", rawError.message)
        return
    }

    console.log(`Found ${raw?.length || 0} deposits.`)
    console.table(raw)

    // 3. Test exact query from action
    const testDate = "2026-02-25"
    const searchDate = new Date(testDate).toISOString().split('T')[0]
    const startOfDay = `${searchDate}T00:00:00`
    const endOfDay = `${searchDate}T23:59:59`

    console.log(`\nTesting query for date: ${testDate}`)
    console.log(`Range: ${startOfDay} to ${endOfDay}`)

    const { data: actionQuery, error: actionError } = await supabase
        .from("collection_deposit" as any)
        .select(`
            *,
            collector:user_profile!collector_id(username, email)
        `)
        .gte("deposit_date", startOfDay)
        .lte("deposit_date", endOfDay)

    if (actionError) {
        console.error("Error with action query:", actionError.message)
    } else {
        console.log(`Action query found ${actionQuery?.length || 0} items.`)
        console.log(JSON.stringify(actionQuery, null, 2))
    }
}

debug()
