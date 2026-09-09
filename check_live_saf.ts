import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, reference_number, aadhaar_number, first_name, saf_number")
    .or("reference_number.ilike.%044%,reference_number.ilike.%852%,reference_number.ilike.%850%")
    .limit(10);

  if (error) {
    console.error("Error querying Supabase:", error);
    return;
  }

  console.log("Queried sample records:");
  console.log(JSON.stringify(data, null, 2));
}

check();
