import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const FILE_PATH = "/Users/pannagaja/Downloads/V-28.10.2026 (179 Candidates).xlsx";
const SHEET_NAME = "Approved List V-28.10.2026";
const BACKUP_PATH = "scripts/backup_179_records_before_v28_approved_by_dept.json";

const cleanRef = (r) => String(r || "").trim().toUpperCase().replace(/\s+/g, " ");
const cleanAadhaar = (a) => String(a || "").trim().replace(/\D/g, "");

async function executeApprovedByDeptUpdate() {
  console.log("===============================================================================");
  console.log("=== BATCH UPDATE: Updating 179 records from V-28.10.2026 to 'Approved by Dept' ===");
  console.log("===============================================================================\n");

  // 1. Authenticate with Supabase
  const authEmail = `updater_v28_appr_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("✓ Supabase authentication session established.");

  // 2. Read Excel file
  const wb = xlsx.readFile(FILE_PATH);
  const sheet = wb.Sheets[SHEET_NAME];
  if (!sheet) {
    console.error(`Sheet "${SHEET_NAME}" not found.`);
    process.exit(1);
  }
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  console.log(`✓ Read ${rows.length} rows from "${SHEET_NAME}".`);

  const excelRecords = rows.map((r, idx) => ({
    rowIndex: idx + 2,
    ref: cleanRef(r["Reference ID"]),
    aadhaar: cleanAadhaar(r["Aadhaar Number"]),
    name: `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim(),
    institution: String(r["College / Institute / University"] || "").trim(),
  }));

  const uniqueRefs = [...new Set(excelRecords.map((r) => r.ref).filter(Boolean))];
  const uniqueAadhaars = [...new Set(excelRecords.map((r) => r.aadhaar).filter(Boolean))];
  if (uniqueRefs.length !== excelRecords.length || uniqueAadhaars.length !== excelRecords.length) {
    console.error("Duplicate Reference IDs or Aadhaar numbers detected in Excel. Aborting.");
    process.exit(1);
  }

  // 3. Fetch matching DB records
  let dbRecords = [];
  for (let i = 0; i < uniqueRefs.length; i += 50) {
    const chunk = uniqueRefs.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, updated_at")
      .in("reference_number", chunk);

    if (error) {
      console.error("Error fetching matching DB records:", error);
      process.exit(1);
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`✓ Fetched ${dbRecords.length} candidate DB rows for ${uniqueRefs.length} reference numbers.`);

  // Group DB records by composite key: (reference_number, aadhaar_number)
  const dbByComposite = new Map();
  for (const r of dbRecords) {
    const key = `${cleanRef(r.reference_number)}|${cleanAadhaar(r.aadhaar_number)}`;
    if (!dbByComposite.has(key)) dbByComposite.set(key, []);
    dbByComposite.get(key).push(r);
  }

  // Verify every Excel row matches exactly 1 DB record on both Reference ID and Aadhaar, and is currently "Sent to Department"
  const matchedRows = [];
  for (const item of excelRecords) {
    const key = `${item.ref}|${item.aadhaar}`;
    const matches = dbByComposite.get(key) || [];
    if (matches.length !== 1) {
      console.error(`Expected exactly 1 DB match for row ${item.rowIndex} (${key}), found ${matches.length}. Aborting.`);
      process.exit(1);
    }
    const dbRow = matches[0];
    if (dbRow.status !== "Sent to Department") {
      console.error(`Unexpected status "${dbRow.status}" for ${item.ref} (${dbRow.id}). Expected "Sent to Department". Aborting.`);
      process.exit(1);
    }
    matchedRows.push({ item, dbRow });
  }
  console.log(`✓ Pre-flight checks passed: ${matchedRows.length}/${excelRecords.length} uniquely matched on (ref + aadhaar) and are 'Sent to Department'.`);

  // 4. Save pre-update backup
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(matchedRows.map((m) => m.dbRow), null, 2));
  console.log(`✓ Backup saved to ${BACKUP_PATH}`);

  // 5. Update all 179 records
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (const { item, dbRow } of matchedRows) {
    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Approved by Dept",
        admin_notes: "Approved by Dept",
        updated_at: now,
      })
      .eq("id", dbRow.id)
      .select("id");

    if (updateErr) {
      console.error(`✗ Failed to update ${dbRow.reference_number}:`, updateErr.message);
      errors.push({ ref: dbRow.reference_number, aadhaar: item.aadhaar, reason: updateErr.message });
    } else {
      updatedCount++;
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`Total Records in Excel: ${excelRecords.length}`);
  console.log(`Successfully Updated to 'Approved by Dept': ${updatedCount}`);
  console.log(`Errors / Failed: ${errors.length}`);
  if (errors.length > 0) console.log("Errors:", errors);
  console.log("===================================================\n");

  // 6. Post-Update Live Verification
  const ids = matchedRows.map((m) => m.dbRow.id);
  let verifyList = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, status, admin_notes, updated_at")
      .in("id", chunk);
    if (error) console.error("Verification query error:", error);
    if (data) verifyList.push(...data);
  }

  const liveStatusCounts = {};
  const liveNotesCounts = {};
  for (const v of verifyList) {
    liveStatusCounts[v.status] = (liveStatusCounts[v.status] || 0) + 1;
    liveNotesCounts[v.admin_notes] = (liveNotesCounts[v.admin_notes] || 0) + 1;
  }

  console.log("=== POST-UPDATE LIVE DATABASE VERIFICATION ===");
  console.log(`Total records re-checked: ${verifyList.length} / ${excelRecords.length}`);
  console.log("Live DB Status Breakdown:", liveStatusCounts);
  console.log("Live DB Admin Notes Breakdown:", liveNotesCounts);

  if (
    verifyList.length === excelRecords.length &&
    liveStatusCounts["Approved by Dept"] === excelRecords.length &&
    liveNotesCounts["Approved by Dept"] === excelRecords.length
  ) {
    console.log("\n🎉 SUCCESS: All 179 candidate records from V-28.10.2026 are now verified as 'Approved by Dept'!");
  } else {
    console.warn("\n⚠️ Warning: Verification counts did not match 179/179.");
    process.exit(1);
  }
}

executeApprovedByDeptUpdate().catch((err) => {
  console.error(err);
  process.exit(1);
});
