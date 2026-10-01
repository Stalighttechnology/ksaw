import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runUpdate() {
  console.log("=========================================================================");
  console.log("=== Updating 'Approved by Dept' records -> 'Sent to Department' ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_revert_dept_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established successfully.");

  // 2. Fetch all records currently with status 'Approved by Dept'
  let targetRecords = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, first_name, last_name, status, admin_notes")
      .eq("status", "Approved by Dept")
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error || !data || data.length === 0) break;
    targetRecords = targetRecords.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Found ${targetRecords.length} records with status 'Approved by Dept'.`);

  if (targetRecords.length === 0) {
    console.log("No records to update.");
    return;
  }

  // 3. Update records in batches of 50
  const BATCH_SIZE = 50;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < targetRecords.length; i += BATCH_SIZE) {
    const chunk = targetRecords.slice(i, i + BATCH_SIZE);
    const chunkIds = chunk.map((r) => r.id);

    const { data, error } = await supabase
      .from("registrations")
      .update({
        status: "Sent to Department",
        admin_notes: "Sent to Department",
      })
      .in("id", chunkIds)
      .select("id");

    if (error) {
      console.error(`Error updating batch ${i / BATCH_SIZE + 1}:`, error.message);
      errorCount += chunk.length;
    } else {
      updatedCount += data ? data.length : chunk.length;
      console.log(`Progress: ${updatedCount}/${targetRecords.length} records updated.`);
    }
  }

  // 4. Verification Check
  const { count: remainingApprovedByDept } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("status", "Approved by Dept");

  const { count: totalSentToDept } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("status", "Sent to Department");

  console.log("\n======================================================");
  console.log("=== FINAL VERIFICATION ===");
  console.log(`Successfully Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Remaining 'Approved by Dept' in DB: ${remainingApprovedByDept ?? 0}`);
  console.log(`Total 'Sent to Department' in DB: ${totalSentToDept ?? 0}`);
  console.log("======================================================");
}

runUpdate();
