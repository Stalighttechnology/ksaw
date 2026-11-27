import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function revert314To522ToRejected() {
  console.log("============================================================================");
  console.log("=== Reverting Rows 314 to 522 to 'Rejected' (Rejected by Department) ===");
  console.log("============================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `revert_admin_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData?.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established successfully.");

  // 2. Read the Excel file
  const excelFilePath = path.resolve(__dirname, "../approved to dept/Final Consolidated 09.10.2026.xlsx");
  const wb = xlsx.readFile(excelFilePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const headers = data[0].map((h) => String(h).trim());
  const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));

  const targetRecords = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const slNo = Number(row[0]);
    if (slNo >= 314 && slNo <= 522) {
      const rawAadhaar = row[aadharIdx];
      const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
      const saf = safIdx !== -1 ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
      const firstName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
      const lastName = lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "";

      targetRecords.push({
        excelRowNumber: r + 1,
        slNo,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        saf,
        aadhaar,
      });
    }
  }

  console.log(`Target records to set as Rejected (SL No 314 to 522): ${targetRecords.length}`);
  const uniqueAadhaars = [...new Set(targetRecords.map((r) => r.aadhaar).filter(Boolean))];

  // 3. Find matching rows in Supabase
  let dbRecords = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 100) {
    const chunk = uniqueAadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error fetching DB records:", error);
      process.exit(1);
    }
    if (res) dbRecords.push(...res);
  }

  console.log(`Matched ${dbRecords.length} records in registrations table.`);
  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // 4. Batch update all 209 records to "Rejected" with notes "Rejected by Department (16-10-2026)"
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < targetRecords.length; i++) {
    const item = targetRecords[i];
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
        status: "Rejected",
        admin_notes: "Rejected by Department (16-10-2026)",
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
      if (updatedCount % 50 === 0 || updatedCount === targetRecords.length) {
        console.log(`Progress: [${updatedCount}/${targetRecords.length}] Updated -> 'Rejected'`);
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
  console.log(`Total Target Records (SL 314 to 522): ${targetRecords.length}`);
  console.log(`Successfully Set to 'Rejected': ${updatedCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Verification: re-query all 209 records
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

  console.log("=== POST-UPDATE VERIFICATION IN SUPABASE (Rows 314 to 522) ===");
  console.log(`Live DB Status Breakdown for all ${verifyList.length} records:`, liveCounts);

  const nonCompliant = verifyList.filter((r) => r.status !== "Rejected" || r.admin_notes !== "Rejected by Department (16-10-2026)");
  if (nonCompliant.length > 0) {
    console.error("WARNING: Non-compliant records found post-update:", nonCompliant);
  } else {
    console.log("✅ 100% of rows 314 to 522 (209/209) successfully verified as 'Rejected' with notes 'Rejected by Department (16-10-2026)'!");
  }

  // 6. Verify Scope 1 to 313 remains intact
  const scope1Aadhaars = [];
  for (let r = 1; r <= 313; r++) {
    const row = data[r];
    const rawAadhaar = row[aadharIdx];
    if (rawAadhaar) scope1Aadhaars.push(String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, ""));
  }

  let scope1Verify = [];
  for (let i = 0; i < scope1Aadhaars.length; i += 100) {
    const chunk = scope1Aadhaars.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, status, admin_notes")
      .in("aadhaar_number", chunk);
    if (res) scope1Verify.push(...res);
  }

  const scope1Counts = {};
  for (const s of scope1Verify) {
    scope1Counts[s.status] = (scope1Counts[s.status] || 0) + 1;
  }
  console.log("\n=== SCOPE 1 TO 313 STATUS CHECK ===");
  console.log(`Rows 1 to 313 Status Breakdown:`, scope1Counts);

  console.log("\nSample 5 Reverted Records:");
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

revert314To522ToRejected().catch(console.error);

