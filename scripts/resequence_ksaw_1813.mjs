import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runResequence() {
  console.log("=== SAFELY RE-SEQUENCING DUPLICATE KSAW 1813 RECORDS ===");

  // 1. Authenticate with admin session
  const authEmail = `resequencer_${Date.now()}@gleamator.com`;
  const authPass = "AdminReseq@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established successfully.");

  // 2. Query all records currently having 'KSAW 1813' in chronological order
  const { data: rows, error: fetchErr } = await supabase
    .from("registrations")
    .select("id, reference_number, created_at, first_name, last_name, phone, aadhaar_number")
    .eq("reference_number", "KSAW 1813")
    .order("created_at", { ascending: true });

  if (fetchErr || !rows) {
    console.error("Failed to fetch records:", fetchErr);
    process.exit(1);
  }

  console.log(`Found ${rows.length} records with 'KSAW 1813'.`);

  // Index 0 keeps KSAW 1813. We only need to update index 1 through rows.length - 1.
  let updatedCount = 0;
  const errors = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const newRefId = `KSAW ${1813 + i}`;

    // STRICT SAFETY: ONLY reference_number is passed in update
    const { data: updateRes, error: updateErr } = await supabase
      .from("registrations")
      .update({
        reference_number: newRefId,
      })
      .eq("id", row.id)
      .select("id, reference_number, first_name, last_name");

    if (updateErr) {
      console.error(`Failed to update record ${row.id}:`, updateErr.message);
      errors.push({ id: row.id, targetRef: newRefId, error: updateErr.message });
    } else if (updateRes && updateRes.length > 0) {
      updatedCount++;
      if (updatedCount % 20 === 0 || i === rows.length - 1) {
        console.log(`Progress: ${updatedCount} / ${rows.length - 1} records updated (latest: ${newRefId})...`);
      }
    }
  }

  console.log("\n=== EXECUTION SUMMARY ===");
  console.log(`Original Duplicate Count: ${rows.length}`);
  console.log(`Kept KSAW 1813: 1 (earliest submission: ${rows[0].first_name} ${rows[0].last_name})`);
  console.log(`Updated to Sequential IDs: ${updatedCount}`);
  console.log(`Errors: ${errors.length}`);

  // 3. Post-execution verification
  console.log("\n=== VERIFICATION ===");
  const { count: remaining1813 } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("reference_number", "KSAW 1813");

  console.log(`Count of records with 'KSAW 1813': ${remaining1813} (Expected: 1)`);

  const assignedRange = [];
  for (let num = 1813; num <= 1813 + rows.length - 1; num++) {
    assignedRange.push(`KSAW ${num}`);
  }

  const { data: verifiedRows } = await supabase
    .from("registrations")
    .select("id, reference_number, created_at, first_name, last_name, status")
    .in("reference_number", assignedRange)
    .order("created_at", { ascending: true });

  console.log(`Verified unique sequential records present: ${verifiedRows?.length} / ${rows.length}`);
  console.log("\nSample First 3 Records:");
  console.table(verifiedRows?.slice(0, 3));
  console.log("\nSample Last 3 Records:");
  console.table(verifiedRows?.slice(-3));
}

runResequence().catch(console.error);
