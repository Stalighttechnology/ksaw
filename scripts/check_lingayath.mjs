import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkLingayath() {
  const authEmail = `chk_ling_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const { data: rows } = await supabase
    .from("registrations")
    .select("id, reference_number, nigama, status, admin_notes")
    .eq("nigama", "LINGAYATH")
    .eq("status", "Rejected");

  console.log("LINGAYATH rejected count:", rows.length);
  const notes = {};
  rows.forEach(r => {
    notes[r.admin_notes] = (notes[r.admin_notes] || 0) + 1;
  });
  console.log("Notes for LINGAYATH rejected:", notes);
}

checkLingayath().catch(console.error);
