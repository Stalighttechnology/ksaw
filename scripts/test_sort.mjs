import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testSort() {
  const { data: descData } = await supabase
    .from("registrations")
    .select("reference_number, first_name, last_name, created_at")
    .order("reference_number", { ascending: false })
    .limit(10);

  console.log("Top 10 Reference ID Descending:");
  console.table(descData);

  const { data: ascData } = await supabase
    .from("registrations")
    .select("reference_number, first_name, last_name, created_at")
    .order("reference_number", { ascending: true })
    .limit(10);

  console.log("Top 10 Reference ID Ascending:");
  console.table(ascData);
}

testSort().catch(console.error);
