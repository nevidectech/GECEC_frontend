import { createAdminClient } from "../lib/supabase/admin";

async function checkColumns() {
  const adminClient = createAdminClient();
  
  console.log("--- carnet_duplicate ---");
  const { data: d1, error: e1 } = await adminClient.from("carnet_duplicate").select("*").limit(1);
  if (e1) console.error(e1);
  else console.log(Object.keys(d1[0] || {}));

  console.log("--- withdrawal ---");
  const { data: d2, error: e2 } = await adminClient.from("withdrawal").select("*").limit(1);
  if (e2) console.error(e2);
  else console.log(Object.keys(d2[0] || {}));
}

checkColumns();
