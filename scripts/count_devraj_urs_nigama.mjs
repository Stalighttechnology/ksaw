import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function countDevrajUrsNigama() {
  const authEmail = `nigama_count_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  // 1. Fetch all distinct nigama values in registrations
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, nigama, status, admin_notes")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Fetch error:", error);
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...data);
      page++;
      if (data.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total rows fetched from registrations table: ${allRows.length}`);

  // Find all nigama variants
  const nigamaSet = new Set(allRows.map(r => r.nigama).filter(Boolean));
  console.log("All distinct nigama values in DB:", Array.from(nigamaSet));

  const devrajVariants = Array.from(nigamaSet).filter(n => /dev/i.test(n));
  console.log("\nDevraj variants found in 'nigama':", devrajVariants);

  const devrajRows = allRows.filter(r => /dev/i.test(r.nigama || ""));
  console.log(`\nTotal registrations with Devraj Urs Nigama: ${devrajRows.length}`);

  // Breakdown by status for Devraj Urs Nigama
  const statusBreakdown = {};
  const notesBreakdown = {};
  devrajRows.forEach(r => {
    statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
    if (r.status === "Sent to Department") {
      notesBreakdown[r.admin_notes] = (notesBreakdown[r.admin_notes] || 0) + 1;
    }
  });

  console.log("\n=== STATUS BREAKDOWN FOR DEVRAJ URS NIGAMA ===");
  console.table(statusBreakdown);

  console.log("\n=== ADMIN NOTES BREAKDOWN FOR 'Sent to Department' ===");
  console.table(notesBreakdown);
}

countDevrajUrsNigama().catch(console.error);

