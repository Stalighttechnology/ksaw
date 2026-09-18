import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectDuplicates() {
  const dupRefs = ["KSAW 1433", "KSAW 1064", "KSAW 1094", "KSAW 1128", "KSAW 1584", "KSAW 1593"];
  
  const { data, error } = await supabase
    .from("registrations")
    .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone, created_at, status, admin_notes, institution_name, center_location")
    .in("reference_number", dupRefs)
    .order("reference_number", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total duplicate records: ${data.length}`);
  for (const r of data) {
    console.log(JSON.stringify(r));
  }
}

inspectDuplicates().catch(console.error);
