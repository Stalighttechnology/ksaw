import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runUpdate() {
  console.log("============================================================================");
  console.log("=== Updating V-05.10.2026.xlsx: Update to 'Sent to Department' ===");
  console.log("============================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_v05_${Date.now()}@gleamator.com`;
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

  // 2. Read the Excel file (Master Sheet)
  const excelFilePath = path.resolve(__dirname, "../V-05.10.2026.xlsx");
  const wb = xlsx.readFile(excelFilePath);
  const sheet = wb.Sheets["Master Sheet"];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const headers = data[0].map((h) => String(h).trim());
  const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
  const rdIdx = headers.findIndex((h) => /rd\s*number/i.test(h));
  const locationIdx = headers.findIndex((h) => /location|center/i.test(h));

  console.log("Headers count:", headers.length);
  console.log("Aadhaar column:", headers[aadharIdx], "at index", aadharIdx);

  const excelRecords = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const rawAadhaar = row[aadharIdx];
    if (rawAadhaar) {
      excelRecords.push({
        excelRowNumber: r + 1,
        slNo: row[0],
        location: locationIdx !== -1 ? String(row[locationIdx]).trim() : "",
        firstName: nameIdx !== -1 ? String(row[nameIdx]).trim() : "",
        lastName: lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "",
        rd: rdIdx !== -1 ? String(row[rdIdx]).trim() : "",
        aadhaar: String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, ""),
      });
    }
  }

  console.log(`Extracted ${excelRecords.length} records from 'Master Sheet'.`);
  const uniqueAadhaars = [...new Set(excelRecords.map((r) => r.aadhaar).filter(Boolean))];
  console.log(`Unique Aadhaar numbers in Excel: ${uniqueAadhaars.length}`);

  // 3. Find matching rows in Supabase
  let dbRecords = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 100) {
    const chunk = uniqueAadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error fetching matching DB records:", error);
      process.exit(1);
    }
    if (res) dbRecords.push(...res);
  }

  console.log(`\nMatched ${dbRecords.length} records in registrations table.`);
  const currentStatusCounts = {};
  for (const d of dbRecords) {
    currentStatusCounts[d.status] = (currentStatusCounts[d.status] || 0) + 1;
  }
  console.log("Current DB status distribution before update:", currentStatusCounts);

  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  const missingInDb = excelRecords.filter((r) => !dbMap.has(r.aadhaar));
  console.log("Excel records missing in DB:", missingInDb.length);
  if (missingInDb.length > 0) {
    console.log("Missing sample:", JSON.stringify(missingInDb.slice(0, 5), null, 2));
  }

  // 4. Batch update each matched record to "Sent to Department"
  let updatedCount = 0;
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

    const { data: updateRes, error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Sent to Department",
        admin_notes: "Sent to Department",
        updated_at: now,
      })
      .eq("id", dbRow.id)
      .select("id, reference_number, saf_number, aadhaar_number, status, admin_notes");

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
        console.log(`Progress: [${updatedCount}/${excelRecords.length}] Updated -> 'Sent to Department'`);
      }
    } else {
      errors.push({
        ref: dbRow.reference_number,
        aadhaar: item.aadhaar,
        reason: "No rows updated",
      });
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`Total Records in Excel: ${excelRecords.length}`);
  console.log(`Successfully Updated to 'Sent to Department': ${updatedCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Verification: re-query all records to confirm their live status
  let verifyList = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 100) {
    const chunk = uniqueAadhaars.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, updated_at")
      .in("aadhaar_number", chunk);
    if (res) verifyList.push(...res);
  }

  const liveCounts = {};
  for (const v of verifyList) {
    liveCounts[v.status] = (liveCounts[v.status] || 0) + 1;
  }

  console.log("=== POST-UPDATE VERIFICATION IN SUPABASE ===");
  console.log(`Live DB Status Breakdown for all ${verifyList.length} records:`, liveCounts);

  // Print sample 5 records
  console.log("\nSample 5 Updated Records:");
  console.table(
    verifyList.slice(0, 5).map((r) => ({
      Reference: r.reference_number,
      SAF: r.saf_number || "N/A",
      Aadhaar: r.aadhaar_number,
      Name: `${r.first_name} ${r.last_name || ""}`.trim(),
      Status: r.status,
      AdminNotes: r.admin_notes,
    }))
  );
}

runUpdate().catch(console.error);
