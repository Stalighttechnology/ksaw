import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function moveVeerashaivaToApproved() {
  console.log("=========================================================================");
  console.log("=== Moving 698 Veerashaiva Lingayat Records to 'Approved' ===");
  console.log("=========================================================================\n");

  const authEmail = `move_vl_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData?.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established successfully.");

  // 1. Fetch all 698 candidates
  let allTargetCandidates = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .eq("status", "Rejected")
      .eq("nigama", "Veerashaiva Lingayat")
      .eq("admin_notes", "Rejected by Department (16-10-2026)")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("Fetch error:", error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      allTargetCandidates.push(...data);
      if (data.length < pageSize) break;
      page++;
    } else {
      break;
    }
  }

  console.log(`Fetched ${allTargetCandidates.length} candidate records matching target criteria.`);

  if (allTargetCandidates.length === 0) {
    console.log("No records to update.");
    return;
  }

  // 2. Perform batch updates in chunks of 50
  const targetIds = allTargetCandidates.map((c) => c.id);
  const now = new Date().toISOString();
  const chunkSize = 50;
  let updatedCount = 0;
  let failedCount = 0;

  console.log(`Updating in ${Math.ceil(targetIds.length / chunkSize)} batches of ${chunkSize}...`);

  for (let i = 0; i < targetIds.length; i += chunkSize) {
    const chunk = targetIds.slice(i, i + chunkSize);
    const { error: updateErr, count } = await supabase
      .from("registrations")
      .update(
        {
          status: "Approved",
          admin_notes: "Approved",
          updated_at: now,
        },
        { count: "exact" }
      )
      .in("id", chunk);

    if (updateErr) {
      console.error(`Error updating batch ${i / chunkSize + 1}:`, updateErr.message);
      failedCount += chunk.length;
    } else {
      updatedCount += count ?? chunk.length;
      console.log(`Batch ${i / chunkSize + 1}: updated ${count ?? chunk.length} records.`);
    }
  }

  console.log("\n=== UPDATE SUMMARY ===");
  console.log(`- Successfully updated: ${updatedCount}`);
  console.log(`- Failed: ${failedCount}`);

  // 3. Post-update Live Verification
  console.log("\n=== POST-UPDATE VERIFICATION ===");

  // Verify that target criteria count is now 0
  const { count: remainingRejectedDept } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "Rejected")
    .eq("nigama", "Veerashaiva Lingayat")
    .eq("admin_notes", "Rejected by Department (16-10-2026)");

  console.log(`Remaining matching criteria in DB: ${remainingRejectedDept}`);

  // Verify all 698 IDs are now 'Approved'
  let verifiedApproved = 0;
  for (let i = 0; i < targetIds.length; i += 100) {
    const chunk = targetIds.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, status, admin_notes")
      .in("id", chunk);

    if (res) {
      const valid = res.filter((r) => r.status === "Approved" && r.admin_notes === "Approved");
      verifiedApproved += valid.length;
    }
  }

  console.log(`Confirmed 'Approved' with notes 'Approved': ${verifiedApproved} / ${targetIds.length}`);

  // Overall Veerashaiva Lingayat status distribution
  const { data: allVL } = await supabase
    .from("registrations")
    .select("status")
    .eq("nigama", "Veerashaiva Lingayat");

  const vlCounts = {};
  allVL?.forEach((r) => {
    vlCounts[r.status] = (vlCounts[r.status] || 0) + 1;
  });

  console.log("\nNew status distribution for 'Veerashaiva Lingayat':", vlCounts);
}

moveVeerashaivaToApproved().catch(console.error);
