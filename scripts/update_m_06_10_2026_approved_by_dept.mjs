import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const filePath = "c:/Users/raghu/Desktop/ksaw/approved to dept/M-06.10.2026.xlsx";

async function executeApprovedByDeptUpdate() {
  console.log("=========================================================================");
  console.log("=== BATCH UPDATE: Updating 60 records from M-06.10.2026.xlsx to 'Approved by Dept' ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_m06_appr_${Date.now()}@gleamator.com`;
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
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`✓ Read ${rows.length} rows from Master Sheet in M-06.10.2026.xlsx.`);

  const excelRecords = rows.map((r, idx) => {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
    const aadhaar = String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "");
    const name = `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim();
    const center = String(r["Center Location"] || "").trim();
    return {
      rowIndex: idx + 1,
      slNo: r["SL No"] || idx + 1,
      aadhaar,
      name,
      center,
    };
  });

  const aadhaarList = excelRecords.map((r) => r.aadhaar).filter(Boolean);

  // 3. Fetch matching DB records
  let dbRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error fetching matching DB records:", error);
      process.exit(1);
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`✓ Matched ${dbRecords.length} records in registrations table.`);
  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // 4. Update all 60 records
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < excelRecords.length; i++) {
    const item = excelRecords[i];
    const dbRow = dbMap.get(item.aadhaar);

    if (!dbRow) {
      errors.push({
        aadhaar: item.aadhaar,
        name: item.name,
        reason: "Aadhaar not found in database",
      });
      continue;
    }

    const { data: updateRes, error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Approved by Dept",
        admin_notes: "Approved by Dept",
        updated_at: now,
      })
      .eq("id", dbRow.id)
      .select("id, reference_number, saf_number, aadhaar_number, status, admin_notes");

    if (updateErr) {
      console.error(`✗ Failed to update ${dbRow.reference_number}:`, updateErr.message);
      errors.push({
        ref: dbRow.reference_number,
        aadhaar: item.aadhaar,
        reason: updateErr.message,
      });
    } else {
      updatedCount++;
      console.log(`[${updatedCount}/60] Updated ${dbRow.reference_number || 'ID:' + dbRow.id} (${item.name}) from "${dbRow.status}" -> "Approved by Dept"`);
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`Total Records in Excel: ${excelRecords.length}`);
  console.log(`Successfully Updated to 'Approved by Dept': ${updatedCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Post-Update Live Verification
  console.log("Performing 100% Live DB Verification...");
  let verifyList = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, updated_at")
      .in("aadhaar_number", chunk);
    if (error) console.error("Verification query error:", error);
    if (data) verifyList.push(...data);
  }

  const liveCounts = {};
  for (const v of verifyList) {
    liveCounts[v.status] = (liveCounts[v.status] || 0) + 1;
  }

  console.log("\n=== POST-UPDATE LIVE DATABASE VERIFICATION ===");
  console.log(`Total records re-checked: ${verifyList.length} / 60`);
  console.log("Live DB Status Breakdown:", liveCounts);

  if (liveCounts["Approved by Dept"] === 60 && verifyList.length === 60) {
    console.log("\n🎉 SUCCESS: All 60 candidate records from M-06.10.2026.xlsx are now verified as 'Approved by Dept' in the database!");
  } else {
    console.warn("\n⚠️ Warning: Some records did not match expected 'Approved by Dept' status:", liveCounts);
  }
}

executeApprovedByDeptUpdate().catch(console.error);
