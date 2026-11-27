import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkPartnerCounts() {
  const authEmail = `test_partner_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  // Fetch all registrations (with status in Approved, Sent to Department, Approved by Dept)
  let allRows = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from("registrations")
      .select("id, institution_name, status, nigama")
      .in("status", ["Approved", "Sent to Department", "Approved by Dept"])
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  // Count per partner across pipeline
  const partnerPipelineCounts = {};
  for (const r of allRows) {
    const p = (r.institution_name || "").trim();
    if (p) {
      partnerPipelineCounts[p] = (partnerPipelineCounts[p] || 0) + 1;
    }
  }

  // Now count Veerashaiva Lingayat Approved candidates
  const vlApproved = allRows.filter(r => r.nigama === "Veerashaiva Lingayat" && r.status === "Approved");
  console.log("Total VL Approved:", vlApproved.length);

  let qualifying = 0;
  let nonQualifying = 0;
  const nonQualifyingPartners = {};

  for (const r of vlApproved) {
    const p = (r.institution_name || "").trim();
    const count = partnerPipelineCounts[p] || 0;
    if (count >= 15) {
      qualifying++;
    } else {
      nonQualifying++;
      nonQualifyingPartners[p || "(Blank institution)"] = (nonQualifyingPartners[p || "(Blank institution)"] || 0) + 1;
    }
  }

  console.log("Qualifying (partner >= 15 threshold):", qualifying);
  console.log("Non-Qualifying (partner < 15 threshold):", nonQualifying);
  console.log("Non-Qualifying partners breakdown:", nonQualifyingPartners);
  console.log("Sum:", qualifying + nonQualifying);
}

checkPartnerCounts().catch(console.error);
