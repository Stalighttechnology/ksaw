import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function cleanAadhaar(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}

function cleanRef(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, " ").trim();
}

async function executeV12SentToDept() {
  console.log("=========================================================================");
  console.log("=== BATCH UPDATE: Transitioning 149 Candidates to 'Sent to Department' ===");
  console.log("=== Source: V-12.10.2026.xlsx (Master Data) ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with Supabase session
  const authEmail = `updater_v12_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("✓ Supabase authentication session established successfully.");

  // 2. Read Excel file
  const filePath = "c:/Users/raghu/Desktop/ksaw/public/update/V-12.10.2026.xlsx";
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Master Data"]);
  console.log(`✓ Read ${rows.length} rows from 'Master Data' in V-12.10.2026.xlsx.`);

  const excelRecords = rows.map((r, idx) => ({
    row: idx + 1,
    refId: cleanRef(r["Reference ID"]),
    safNo: String(r["SAF Number"] || "").trim(),
    aadhaar: cleanAadhaar(r["Aadhaar Number"]),
    name: `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim(),
    statusInExcel: r["Status"],
    notesInExcel: r["Admin Notes"]
  }));

  // 3. Query DB by Aadhaar
  const aadhaarList = excelRecords.map(r => r.aadhaar).filter(Boolean);
  let dbRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, institution_name, status, admin_notes, updated_at")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error querying DB:", error);
      process.exit(1);
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`✓ Fetched ${dbRecords.length} matching candidate records from DB.`);
  const dbByAadhaar = new Map(dbRecords.map(r => [cleanAadhaar(r.aadhaar_number), r]));

  // 4. Pre-execution Safety Backup Snapshot
  const backupData = {
    timestamp: new Date().toISOString(),
    totalCandidates: dbRecords.length,
    records: dbRecords.map(r => ({
      id: r.id,
      reference_number: r.reference_number,
      saf_number: r.saf_number,
      aadhaar_number: r.aadhaar_number,
      first_name: r.first_name,
      last_name: r.last_name,
      institution_name: r.institution_name,
      status: r.status,
      admin_notes: r.admin_notes,
      updated_at: r.updated_at
    }))
  };
  fs.writeFileSync("scripts/backup_149_records_before_v12_sent_to_dept.json", JSON.stringify(backupData, null, 2));
  console.log(`✓ Saved pre-execution safety snapshot to scripts/backup_149_records_before_v12_sent_to_dept.json`);

  // 5. Perform Updates
  let updatedApprovedCount = 0;
  let updatedPendingWithPreservedNotesCount = 0;
  let errors = [];
  const now = new Date().toISOString();

  console.log("\nStarting selective update...");

  for (const ex of excelRecords) {
    const dbRow = dbByAadhaar.get(ex.aadhaar);
    if (!dbRow) {
      errors.push({ ref: ex.refId, aadhaar: ex.aadhaar, name: ex.name, error: "Not found in DB" });
      continue;
    }

    const isPendingDoc = dbRow.status === "Pending Document";

    if (isPendingDoc) {
      // Group 2: Update status to 'Sent to Department' but KEEP admin_notes UNCHANGED
      const { error: updateErr } = await supabase
        .from("registrations")
        .update({
          status: "Sent to Department",
          // admin_notes is intentionally omitted to preserve the exact original document issue note
          updated_at: now
        })
        .eq("id", dbRow.id);

      if (updateErr) {
        console.error(`✗ Error updating pending candidate ${dbRow.reference_number}:`, updateErr.message);
        errors.push({ ref: dbRow.reference_number, error: updateErr.message });
      } else {
        updatedPendingWithPreservedNotesCount++;
        console.log(`  [Pending Doc Preserved] ${dbRow.reference_number} (${dbRow.first_name} ${dbRow.last_name}) -> status: 'Sent to Department', admin_notes kept: '${dbRow.admin_notes}'`);
      }
    } else {
      // Group 1: Standard Approved candidate -> update status & admin_notes to 'Sent to Department'
      const { error: updateErr } = await supabase
        .from("registrations")
        .update({
          status: "Sent to Department",
          admin_notes: "Sent to Department",
          updated_at: now
        })
        .eq("id", dbRow.id);

      if (updateErr) {
        console.error(`✗ Error updating candidate ${dbRow.reference_number}:`, updateErr.message);
        errors.push({ ref: dbRow.reference_number, error: updateErr.message });
      } else {
        updatedApprovedCount++;
        if (updatedApprovedCount % 25 === 0 || updatedApprovedCount === 136) {
          console.log(`  Progress (Approved): ${updatedApprovedCount} / 136 updated...`);
        }
      }
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`✓ Approved candidates updated (status & notes = 'Sent to Department'): ${updatedApprovedCount}`);
  console.log(`✓ Pending Document candidates updated (status = 'Sent to Department', notes preserved): ${updatedPendingWithPreservedNotesCount}`);
  console.log(`✓ Total candidates updated: ${updatedApprovedCount + updatedPendingWithPreservedNotesCount} / 149`);
  console.log(`✗ Errors / Failed: ${errors.length}`);
  console.log("===================================================\n");

  // 6. Verification
  console.log("=== Verifying Live Status in Supabase ===");
  let verifyRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);
    if (!error && data) verifyRecords.push(...data);
  }

  const liveStatusCounts = {};
  const liveAdminNotesCounts = {};
  for (const v of verifyRecords) {
    liveStatusCounts[v.status] = (liveStatusCounts[v.status] || 0) + 1;
    liveAdminNotesCounts[v.admin_notes] = (liveAdminNotesCounts[v.admin_notes] || 0) + 1;
  }

  console.log("\nLive Database Status Breakdown (149 Total):");
  console.table(liveStatusCounts);

  console.log("\nLive Admin Notes Breakdown (149 Total):");
  console.table(liveAdminNotesCounts);
}

executeV12SentToDept().catch(console.error);
