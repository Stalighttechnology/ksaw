import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectApprovedStatus() {
  const authEmail = `app_inspect_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const { data: approvedSample } = await supabase
    .from("registrations")
    .select("status, admin_notes")
    .eq("status", "Approved")
    .limit(100);

  const notesCounts = {};
  approvedSample.forEach(r => {
    notesCounts[r.admin_notes] = (notesCounts[r.admin_notes] || 0) + 1;
  });

  console.log("Sample admin_notes for status = 'Approved':", notesCounts);

  // Check all distinct statuses in registrations
  const { data: allStatuses } = await supabase
    .from("registrations")
    .select("status")
    .limit(1000);

  const statusSet = new Set(allStatuses.map(r => r.status));
  console.log("Distinct statuses in sample:", Array.from(statusSet));
}

inspectApprovedStatus().catch(console.error);
