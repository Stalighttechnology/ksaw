import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkDevrajRejNotes() {
  const authEmail = `devraj_rej_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const { data: rows } = await supabase
    .from("registrations")
    .select("admin_notes")
    .eq("nigama", "Devraj Urs")
    .eq("status", "Rejected");

  const counts = {};
  rows.forEach(r => {
    counts[r.admin_notes] = (counts[r.admin_notes] || 0) + 1;
  });

  console.log("Devraj Urs Rejected Notes counts:", counts);
}

checkDevrajRejNotes().catch(console.error);
