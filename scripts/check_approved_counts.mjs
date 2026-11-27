import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkApprovedCounts() {
  const authEmail = `app_cnt_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const { count: c1 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "Approved");

  const { count: c2 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "Approved by Dept");

  const { count: c3 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "Sent to Department");

  console.log("Status 'Approved' count in DB:", c1);
  console.log("Status 'Approved by Dept' count in DB:", c2);
  console.log("Status 'Sent to Department' count in DB:", c3);

  // For Veerashaiva Lingayat specifically:
  const { count: vl1 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Approved");

  const { count: vl2 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Approved by Dept");

  const { count: vl3 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Sent to Department");

  console.log("Veerashaiva Lingayat 'Approved':", vl1);
  console.log("Veerashaiva Lingayat 'Approved by Dept':", vl2);
  console.log("Veerashaiva Lingayat 'Sent to Department':", vl3);
}

checkApprovedCounts().catch(console.error);
