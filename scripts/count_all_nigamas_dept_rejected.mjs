import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function countAllNigamasDeptRejected() {
  const authEmail = `all_nigamas_${Date.now()}@gleamator.com`;
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

  // Group by Nigama
  const summaryByNigama = {};

  for (const r of allRejected) {
    const nigamaName = r.nigama || "(Blank / Unassigned)";
    if (!summaryByNigama[nigamaName]) {
      summaryByNigama[nigamaName] = {
        totalRejected: 0,
        deptRejectedExact: 0, // 'Rejected by Department (16-10-2026)'
        deptRejectedLike: 0,  // any 'Rejected by Department'
        otherRejections: 0,
        otherNotesSample: new Set(),
      };
    }

    const nEntry = summaryByNigama[nigamaName];
    nEntry.totalRejected++;

    const note = (r.admin_notes || "").trim();
    if (note === "Rejected by Department (16-10-2026)") {
      nEntry.deptRejectedExact++;
      nEntry.deptRejectedLike++;
    } else if (/rejected\s*by\s*department/i.test(note)) {
      nEntry.deptRejectedLike++;
    } else {
      nEntry.otherRejections++;
      if (note && nEntry.otherNotesSample.size < 3) {
        nEntry.otherNotesSample.add(note);
      }
    }
  }

  console.log("\n=== SUMMARY BY NIGAMA ===");
  const tableData = Object.entries(summaryByNigama).map(([nigama, data]) => ({
    Nigama: nigama,
    "Rejected by Dept (16-10-2026)": data.deptRejectedExact,
    "Any 'Rejected by Dept'": data.deptRejectedLike,
    "Other Rejection Reasons": data.otherRejections,
    "Total Rejected": data.totalRejected,
  }));

  // Sort by deptRejectedExact descending
  tableData.sort((a, b) => b["Rejected by Dept (16-10-2026)"] - a["Rejected by Dept (16-10-2026)"]);
  console.table(tableData);

  // Check if there are any notes matching "Rejected by Department" with different dates or text
  const deptLikeDifferent = allRejected.filter(r => {
    const note = (r.admin_notes || "").trim();
    return /rejected\s*by\s*department/i.test(note) && note !== "Rejected by Department (16-10-2026)";
  });

  console.log("\nDepartment rejection notes different from 'Rejected by Department (16-10-2026)':", deptLikeDifferent.length);
  if (deptLikeDifferent.length > 0) {
    console.log(deptLikeDifferent.map(r => ({ nigama: r.nigama, notes: r.admin_notes })));
  }
}

countAllNigamasDeptRejected().catch(console.error);
