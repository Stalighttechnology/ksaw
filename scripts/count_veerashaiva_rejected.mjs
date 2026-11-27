import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function countVeerashaivaRejected() {
  const authEmail = `lingayat_chk_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  // Fetch all rows with status = 'Rejected'
  let allRejected = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, nigama, status, admin_notes")
      .eq("status", "Rejected")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }

    if (data && data.length > 0) {
      allRejected.push(...data);
      page++;
      if (data.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total 'Rejected' rows in registrations: ${allRejected.length}`);

  // Distinct nigama values among Rejected
  const nigamas = {};
  allRejected.forEach(r => {
    nigamas[r.nigama] = (nigamas[r.nigama] || 0) + 1;
  });
  console.log("\nNigama distribution among Rejected:", nigamas);

  // Filter for Veerashaiva Lingayat (exact and case-insensitive/variations)
  const exactVeerashaiva = allRejected.filter(r => r.nigama === "Veerashaiva Lingayat");
  const anyLingayat = allRejected.filter(r => /lingayat/i.test(r.nigama || ""));

  console.log(`\nExact 'Veerashaiva Lingayat' Rejected count: ${exactVeerashaiva.length}`);
  console.log(`Any Lingayat variation Rejected count: ${anyLingayat.length}`);

  // Breakdown of admin_notes for exact 'Veerashaiva Lingayat'
  const exactNotesCount = {};
  exactVeerashaiva.forEach(r => {
    const note = r.admin_notes || "(blank)";
    exactNotesCount[note] = (exactNotesCount[note] || 0) + 1;
  });
  console.log("\nAdmin notes breakdown for exact 'Veerashaiva Lingayat' (Rejected):");
  console.table(exactNotesCount);

  // Breakdown of admin_notes for any Lingayat variation
  const anyNotesCount = {};
  anyLingayat.forEach(r => {
    const note = r.admin_notes || "(blank)";
    anyNotesCount[note] = (anyNotesCount[note] || 0) + 1;
  });
  console.log("\nAdmin notes breakdown for any Lingayat variation (Rejected):");
  console.table(anyNotesCount);

  // Also query directly using count for exact check
  const { count: directCountExact, error: cErr1 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "Rejected")
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("admin_notes", "Rejected by Department (16-10-2026)");

  console.log(`\nDirect DB count (nigama = 'Veerashaiva Lingayat', status = 'Rejected', admin_notes = 'Rejected by Department (16-10-2026)'): ${directCountExact}`);

  // Also query if admin_notes ilike '%Rejected by Department%'
  const { count: directCountLike, error: cErr2 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "Rejected")
    .eq("nigama", "Veerashaiva Lingayat")
    .ilike("admin_notes", "%Rejected by Department%");

  console.log(`Direct DB count (nigama = 'Veerashaiva Lingayat', status = 'Rejected', admin_notes ILIKE '%Rejected by Department%'): ${directCountLike}`);
}

countVeerashaivaRejected().catch(console.error);
