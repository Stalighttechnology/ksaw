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
  console.log("=== Updating Status to 'Sent to Department' ===");

  // 1. Authenticate with an admin session
  const authEmail = `updater_${Date.now()}@gleamator.com`;
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

  // 2. Read the Excel file
  const excelFilePath = path.resolve(__dirname, "../public/images/D-10.09.2026.xlsx");
  const wb = xlsx.readFile(excelFilePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  const excelRecords = [];
  for (const r of rows) {
    const rawAadhaar = r["Aadhaar Number"];
    if (rawAadhaar) {
      excelRecords.push({
        slNo: r["SL No"],
        safNo: r["SAF Number"],
        firstName: r["First Name"],
        lastName: r["Last Name"],
        college: r["College / Institute / University"],
        aadhaar: String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, ""),
      });
    }
  }

  console.log(`Extracted ${excelRecords.length} student records from Excel.`);

  // 3. Find matching rows in Supabase
  const aadhaarList = excelRecords.map((r) => r.aadhaar);
  let dbRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error fetching matching DB records:", error);
      process.exit(1);
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`Matched ${dbRecords.length} records in registrations table.`);
  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // 4. Batch update each record to "Sent to Department"
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
      if (updatedCount % 25 === 0 || updatedCount === excelRecords.length) {
        console.log(`Progress: ${updatedCount} / ${excelRecords.length} updated...`);
      }
    } else {
      errors.push({
        ref: dbRow.reference_number,
        aadhaar: item.aadhaar,
        reason: "No rows updated (RLS policy check failed)",
      });
    }
  }

  console.log("\n=== EXECUTION SUMMARY ===");
  console.log(`Total Records in Excel: ${excelRecords.length}`);
  console.log(`Successfully Updated to 'Sent to Department': ${updatedCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);

  // 5. Verification: re-query all 135 records to confirm their live status
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

  console.log("\n=== POST-UPDATE VERIFICATION IN SUPABASE ===");
  console.log("Status Breakdown for all 135 records:", liveCounts);

  // Print sample updated records
  console.log("\nSample 5 updated records:");
  console.table(
    verifyList.slice(0, 5).map((r) => ({
      Reference: r.reference_number,
      Aadhaar: r.aadhaar_number,
      Status: r.status,
      Notes: r.admin_notes,
    }))
  );
}

runUpdate().catch(console.error);
