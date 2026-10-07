import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const file1Path = "c:/Users/raghu/Desktop/ksaw/approved to dept/V-21.09.2026 (1).xlsx";
const file2Path = "c:/Users/raghu/Desktop/ksaw/approved to dept/V-28.09.2026 (1).xlsx";

async function executeApprovedByDeptUpdate() {
  console.log("=========================================================================");
  console.log("=== BATCH UPDATE: Transitioning 302 Candidates to 'Approved by Dept' ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with Supabase session
  const authEmail = `updater_both_${Date.now()}@gleamator.com`;
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
  const parseFile = (filePath, label) => {
    const wb = xlsx.readFile(filePath);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    return rows.map((r, idx) => {
      const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
      const aadhaar = String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "");
      const saf = String(r["SAF Number"] || r["SAF No"] || r["SAF"] || "").trim().toUpperCase();
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

  const f1Rows = parseFile(file1Path, "V-21.09.2026 (1).xlsx");
  const f2Rows = parseFile(file2Path, "V-28.09.2026 (1).xlsx");
  const allRows = [...f1Rows, ...f2Rows];

  console.log(`✓ Read ${f1Rows.length} rows from File 1 (V-21.09)`);
  console.log(`✓ Read ${f2Rows.length} rows from File 2 (V-28.09)`);
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

  // 3. Fetch current status of all 302 candidates from DB
  const aadhaarList = Array.from(uniqueCandidateMap.keys());
  let dbRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, center_location, status, admin_notes")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error fetching matching DB records:", error);
      process.exit(1);
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`✓ Fetched ${dbRecords.length} matching candidate records from DB.`);
  const dbByAadhaar = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // 4. Perform Updates
  let updatedCount = 0;
  let alreadyApprovedCount = 0;
  let errors = [];
  const now = new Date().toISOString();

  console.log("\nStarting update to 'Approved by Dept'...");

  for (const [aadhaar, candidate] of uniqueCandidateMap.entries()) {
    const dbRow = dbByAadhaar.get(aadhaar);
    if (!dbRow) {
      errors.push({ aadhaar, name: candidate.name, error: "Not found in DB" });
      continue;
    }

    if (dbRow.status === "Approved by Dept") {
      alreadyApprovedCount++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Approved by Dept",
        admin_notes: "Approved by Dept",
        updated_at: now,
      })
      .eq("id", dbRow.id);

    if (updateErr) {
      console.error(`✗ Error updating ${dbRow.reference_number} (${candidate.name}):`, updateErr.message);
      errors.push({ aadhaar, ref: dbRow.reference_number, error: updateErr.message });
    } else {
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === 298) {
        console.log(`Progress: ${updatedCount} / 298 records updated to 'Approved by Dept'...`);
      }
    }
  }

  console.log("\n================ UPDATE RESULTS ================");
  console.log(`Newly Updated to 'Approved by Dept': ${updatedCount}`);
  console.log(`Already 'Approved by Dept' (Skipped): ${alreadyApprovedCount}`);
  console.log(`Errors encountered: ${errors.length}`);
  console.log("================================================\n");

  // 5. Post-Update Verification: Re-query all 302 candidates from Supabase
  console.log("Performing 100% Live DB Verification...");
  let verifyRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, center_location, status, admin_notes")
      .in("aadhaar_number", chunk);
    if (error) {
      console.error("Verification query error:", error);
    }
    if (data) verifyRecords.push(...data);
  }

  const liveStatusCounts = {};
  for (const v of verifyRecords) {
    liveStatusCounts[v.status] = (liveStatusCounts[v.status] || 0) + 1;
  }

  console.log("\n=== POST-UPDATE LIVE DATABASE VERIFICATION ===");
  console.log(`Total records re-checked: ${verifyRecords.length} / ${uniqueCandidateMap.size}`);
  console.log("Live DB Status Breakdown:", liveStatusCounts);

  if (liveStatusCounts["Approved by Dept"] === 302 && verifyRecords.length === 302) {
    console.log("\n🎉 SUCCESS: All 302 candidates are now officially verified as 'Approved by Dept' in the database!");
  } else {
    console.warn("\n⚠️ Warning: Some records did not match expected 'Approved by Dept' status:", liveStatusCounts);
  }
}

executeApprovedByDeptUpdate().catch(console.error);
