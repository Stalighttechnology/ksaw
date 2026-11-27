import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fullVerification() {
  const authEmail = `verify_full_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const statuses = ["Approved", "Approved by Dept", "Rejected", "Pending", "Pending Document", "Sent to Department"];

  console.log("=== VEERASHAIVA LINGAYAT FULL STATUS COUNTS ===");
  for (const s of statuses) {
    const { count } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("nigama", "Veerashaiva Lingayat")
      .eq("status", s);
    console.log(`${s}: ${count}`);
  }

  // Check remaining Rejected with department note
  const { count: remDeptRej } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Rejected")
    .eq("admin_notes", "Rejected by Department (16-10-2026)");
  console.log("\nRemaining 'Rejected by Department (16-10-2026)' in Veerashaiva Lingayat:", remDeptRej);
}

fullVerification().catch(console.error);
