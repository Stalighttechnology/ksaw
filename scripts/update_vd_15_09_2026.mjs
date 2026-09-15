import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function processFile(filePath, label) {
  console.log(`\n======================================================`);
  console.log(`=== Processing ${label} ===`);
  console.log(`======================================================`);

  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const excelRecords = [];
  for (const r of rows) {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"];
    if (rawAadhaar) {
      excelRecords.push({
        slNo: r["SL NO"] || r["SL No_1"] || r["SL No"],
        refId: r["Reference ID"] || r["SL No"],
        safNo: r["SAF Number"],
        firstName: r["First Name"],
        lastName: r["Last Name"],
        aadhaar: String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, ""),
      });
    }
  }

  console.log(`Extracted ${excelRecords.length} applicant records from ${label}.`);

  const aadhaarList = excelRecords.map((r) => r.aadhaar);
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

  console.log(`Matched ${dbRecords.length} records in registrations table.`);
  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  let updatedCount = 0;
  let skippedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < excelRecords.length; i++) {
    const item = excelRecords[i];
    const dbRow = dbMap.get(item.aadhaar);

    if (!dbRow) {
      errors.push({
        aadhaar: item.aadhaar,
        name: `${item.firstName} ${item.lastName}`,
        reason: "Aadhaar not found in database",
      });
      continue;
    }

    if (dbRow.status !== "Approved") {
      skippedCount++;
      continue;
    }

    const { data: updateRes, error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Sent to Department",
        admin_notes: "Sent to Department",
        updated_at: now,
      })
      .eq("id", dbRow.id)
      .select("id, reference_number, aadhaar_number, status, admin_notes");

    if (updateErr) {
      console.error(`Failed to update ${dbRow.reference_number}:`, updateErr.message);
      errors.push({
        ref: dbRow.reference_number,
        aadhaar: item.aadhaar,
        reason: updateErr.message,
      });
    } else if (updateRes && updateRes.length > 0) {
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === excelRecords.length) {
        console.log(`Progress (${label}): ${updatedCount} / ${excelRecords.length} updated...`);
      }
    } else {
      errors.push({
        ref: dbRow.reference_number,
        aadhaar: item.aadhaar,
        reason: "No rows updated",
      });
    }
  }

  console.log(`\n=== SUMMARY FOR ${label} ===`);
  console.log(`Total in Excel: ${excelRecords.length}`);
  console.log(`Successfully Updated: ${updatedCount}`);
  console.log(`Skipped (Non-Approved): ${skippedCount}`);
  console.log(`Errors: ${errors.length}`);

  // Re-verify in DB
  let verifyList = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data } = await supabase
      .from("registrations")
      .select("id, reference_number, aadhaar_number, status, admin_notes")
      .in("aadhaar_number", chunk);
    if (data) verifyList.push(...data);
  }

  const liveCounts = {};
  for (const v of verifyList) {
    liveCounts[v.status] = (liveCounts[v.status] || 0) + 1;
  }

  console.log(`Live DB Status Breakdown for ${label}:`, liveCounts);

  return { total: excelRecords.length, updated: updatedCount, skipped: skippedCount, errors: errors.length };
}

async function run() {
  console.log("=== Starting Batch Update for V-15.09.2026.xlsx and D-15.09.2026.xlsx ===");

  // 1. Authenticate with an admin session
  const authEmail = `updater_vd_${Date.now()}@gleamator.com`;
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

  const vRes = await processFile("c:/Users/raghu/Desktop/ksaw/public/V-15.09.2026.xlsx", "V-15.09.2026.xlsx (Vokkaliga)");
  const dRes = await processFile("c:/Users/raghu/Desktop/ksaw/public/D-15.09.2026.xlsx", "D-15.09.2026.xlsx (Devraj Urs)");

  console.log("\n======================================================");
  console.log("=== OVERALL TOTALS ===");
  console.log(`Total records processed: ${vRes.total + dRes.total}`);
  console.log(`Total successfully updated to 'Sent to Department': ${vRes.updated + dRes.updated}`);
  console.log(`Total errors: ${vRes.errors + dRes.errors}`);
  console.log("======================================================");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
