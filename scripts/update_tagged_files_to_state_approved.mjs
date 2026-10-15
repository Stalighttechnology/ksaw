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

function cleanSaf(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").replace(/\.+$/, "").trim();
}

const file1Path = "c:/Users/raghu/Desktop/ksaw/public/update/L.-21.09.2026 (2).xlsx";
const file2Path = "c:/Users/raghu/Desktop/ksaw/public/update/L.-28.09.2026 (2).xlsx";

async function executeStateApprovedUpdate() {
  console.log("=========================================================================");
  console.log("=== BATCH UPDATE: Transitioning 704 Candidates to 'Approved' (State Approved) ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with Supabase session
  const authEmail = `updater_state_${Date.now()}@gleamator.com`;
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

  // 2. Read both Excel files
  const parseFile = (filePath, sheetIndex, label) => {
    const wb = xlsx.readFile(filePath);
    const sheetName = wb.SheetNames[sheetIndex];
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
    return rows.map((r, idx) => {
      const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
      const aadhaar = cleanAadhaar(rawAadhaar);
      const saf = cleanSaf(r["SAF Number"] || r["SAF No"] || r["SAF"] || "");
      const name = `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim();
      const center = String(r["Center Location"] || "").trim();
      return {
        file: label,
        row: idx + 1,
        sl: r["SL No"] || idx + 1,
        aadhaar,
        saf,
        name,
        center,
      };
    });
  };

  const f1Rows = parseFile(file1Path, 0, "L.-21.09.2026 (2).xlsx");
  const f2Rows = parseFile(file2Path, 0, "L.-28.09.2026 (2).xlsx");
  const allRows = [...f1Rows, ...f2Rows];

  console.log(`✓ Read ${f1Rows.length} rows from File 1 (L.-21.09)`);
  console.log(`✓ Read ${f2Rows.length} rows from File 2 (L.-28.09)`);
  console.log(`✓ Total combined rows: ${allRows.length}`);

  // Deduplicate by Aadhaar
  const uniqueCandidateMap = new Map();
  for (const r of allRows) {
    if (r.aadhaar) {
      if (!uniqueCandidateMap.has(r.aadhaar)) {
        uniqueCandidateMap.set(r.aadhaar, { ...r, appearances: [r.file] });
      } else {
        uniqueCandidateMap.get(r.aadhaar).appearances.push(r.file);
      }
    }
  }
  console.log(`✓ Total unique candidates to process: ${uniqueCandidateMap.size}\n`);

  // 3. Fetch current status of all 705 candidates from DB
  const aadhaarList = Array.from(uniqueCandidateMap.keys());
  let dbRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, center_location, status, admin_notes, updated_at")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error fetching matching DB records:", error);
      process.exit(1);
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`✓ Fetched ${dbRecords.length} matching candidate records from DB.`);
  const dbByAadhaar = new Map(dbRecords.map((r) => [cleanAadhaar(r.aadhaar_number), r]));

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
      status: r.status,
      admin_notes: r.admin_notes,
      updated_at: r.updated_at
    }))
  };
  fs.writeFileSync("scripts/backup_704_records_before_state_approved.json", JSON.stringify(backupData, null, 2));
  console.log(`✓ Saved pre-execution safety snapshot to scripts/backup_704_records_before_state_approved.json`);

  // 5. Perform Updates
  let updatedCount = 0;
  let skippedPendingCount = 0;
  let alreadyTargetStateCount = 0;
  let errors = [];
  const now = new Date().toISOString();

  console.log("\nStarting update to 'Approved' with admin_notes 'State Approved'...");

  for (const [aadhaar, candidate] of uniqueCandidateMap.entries()) {
    const dbRow = dbByAadhaar.get(aadhaar);
    if (!dbRow) {
      errors.push({ aadhaar, name: candidate.name, error: "Not found in DB" });
      continue;
    }

    // Exclude flagged pending document record (KSAW 3792)
    if (dbRow.reference_number === "KSAW 3792" || dbRow.status === "Pending Document") {
      skippedPendingCount++;
      console.log(`ℹ Preserving flagged pending document record: ${dbRow.reference_number} (${dbRow.first_name} ${dbRow.last_name}) - Status: '${dbRow.status}', Note: '${dbRow.admin_notes}'`);
      continue;
    }

    if (dbRow.status === "Approved" && dbRow.admin_notes === "State Approved") {
      alreadyTargetStateCount++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Approved",
        admin_notes: "State Approved",
        updated_at: now,
      })
      .eq("id", dbRow.id);

    if (updateErr) {
      console.error(`✗ Error updating ${dbRow.reference_number} (${dbRow.saf_number}):`, updateErr.message);
      errors.push({ aadhaar, ref: dbRow.reference_number, error: updateErr.message });
    } else {
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === 704) {
        console.log(`  Progress: ${updatedCount} / 704 updated...`);
      }
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`✓ Successfully updated: ${updatedCount}`);
  console.log(`✓ Preserved Pending Document record: ${skippedPendingCount}`);
  console.log(`✓ Already in target state: ${alreadyTargetStateCount}`);
  console.log(`✗ Errors / Failed: ${errors.length}`);
  console.log("===================================================\n");

  // 6. Post-execution Verification
  console.log("=== Verifying Live Status in Supabase ===");
  let verifyRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, status, admin_notes")
      .in("aadhaar_number", chunk);

    if (!error && data) verifyRecords.push(...data);
  }

  const liveStatusCounts = {};
  const liveAdminNotesCounts = {};
  for (const v of verifyRecords) {
    liveStatusCounts[v.status] = (liveStatusCounts[v.status] || 0) + 1;
    liveAdminNotesCounts[v.admin_notes] = (liveAdminNotesCounts[v.admin_notes] || 0) + 1;
  }

  console.log("\nLive Database Status Breakdown (705 Total):");
  console.table(liveStatusCounts);

  console.log("\nLive Admin Notes Breakdown (705 Total):");
  console.table(liveAdminNotesCounts);
}

executeStateApprovedUpdate().catch(console.error);
