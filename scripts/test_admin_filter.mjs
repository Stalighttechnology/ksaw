import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testFilter() {
  const authEmail = `test_filter_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  // 1. Total Approved in Veerashaiva Lingayat
  const { count: totalApproved } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Approved");

  // 2. Total Approved in Veerashaiva Lingayat with Strict Admin Visibility: Female + OBC + Hindu
  const { count: strictCount } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Approved")
    .ilike("category", "OBC")
    .ilike("gender", "Female")
    .ilike("religion", "Hindu");

  // 3. What is filtering out the rest?
  const { count: notFemale } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Approved")
    .not("gender", "ilike", "Female");

  const { count: notOBC } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Approved")
    .not("category", "ilike", "OBC");

  const { count: notHindu } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("status", "Approved")
    .not("religion", "ilike", "Hindu");

  console.log("Total in DB (nigama=Veerashaiva Lingayat, status=Approved):", totalApproved);
  console.log("Strict Admin Filter (Female + OBC + Hindu):", strictCount);
  console.log("Not Female:", notFemale);
  console.log("Not OBC:", notOBC);
  console.log("Not Hindu:", notHindu);
}

testFilter().catch(console.error);
