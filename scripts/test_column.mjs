import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testGeneratedColumn() {
  const { data, error } = await supabase
    .from("registrations")
    .select("reference_number, first_name, last_name")
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("Current latest by created_at:", data);
}

testGeneratedColumn().catch(console.error);
