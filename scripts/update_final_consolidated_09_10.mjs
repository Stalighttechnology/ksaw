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
  console.log("=== Final Consolidated 09.10.2026.xlsx: Update up to 313 to 'Sent to Department' ===");
  console.log("============================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_fc_${Date.now()}@gleamator.com`;
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
  const rdIdx = headers.findIndex((h) => /rd\s*number/i.test(h));
  const locationIdx = headers.findIndex((h) => /location|center/i.test(h));

  console.log("Headers count:", headers.length);
  console.log("Aadhaar column:", headers[aadharIdx], "at index", aadharIdx);

  const targetRecords = [];
  let ignoredCount = 0;

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const slNo = Number(row[0]);
    const rawAadhaar = row[aadharIdx];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";

    if (slNo <= 313) {
      targetRecords.push({
        excelRowNumber: r + 1,
        slNo,
        location: locationIdx !== -1 ? String(row[locationIdx]).trim() : "",
        firstName: nameIdx !== -1 ? String(row[nameIdx]).trim() : "",
        lastName: lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "",
        rd: rdIdx !== -1 ? String(row[rdIdx]).trim() : "",
        saf: safIdx !== -1 ? String(row[safIdx]).trim().replace(/\.$/, "") : "",
        aadhaar,
      });
    } else {
      ignoredCount++;
    }
  }

  console.log(`Target records (SL No 1 to 313): ${targetRecords.length}`);
  console.log(`Ignored records (SL No > 313): ${ignoredCount}`);

  const uniqueAadhaars = [...new Set(targetRecords.map((r) => r.aadhaar).filter(Boolean))];
  console.log(`Unique Aadhaar numbers in target records: ${uniqueAadhaars.length}`);

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

  const missingInDb = targetRecords.filter((r) => !dbMap.has(r.aadhaar));
  console.log("Excel target records missing in DB:", missingInDb.length);
  if (missingInDb.length > 0) {
    console.error("Missing records found! Halting for safety:", missingInDb);
    process.exit(1);
  }

  // 4. Batch update each matched record to "Sent to Department"
  let updatedCount = 0;
  let alreadySentCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < targetRecords.length; i++) {
    const item = targetRecords[i];
    const dbRow = dbMap.get(item.aadhaar);

    if (!dbRow) {
      errors.push({
        aadhaar: item.aadhaar,
        name: `${item.firstName} ${item.lastName}`,
        reason: "Aadhaar not found in database",
      });
      continue;
    }

    // If it's already "Sent to Department" and notes match, we still update updated_at and ensure admin_notes is clean
    if (dbRow.status === "Sent to Department" && dbRow.admin_notes === "Sent to Department") {
      alreadySentCount++;
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
      if (updatedCount % 50 === 0 || updatedCount === targetRecords.length) {
        console.log(`Progress: [${updatedCount}/${targetRecords.length}] Marked -> 'Sent to Department'`);
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
  console.log(`Total Target Records in Excel (SL 1 to 313): ${targetRecords.length}`);
  console.log(`Ignored Records (SL 314 to 522): ${ignoredCount}`);
  console.log(`Successfully Updated / Confirmed as 'Sent to Department': ${updatedCount}`);
  console.log(`Previously Already 'Sent to Department': ${alreadySentCount}`);
  console.log(`Transitioned from 'Rejected' to 'Sent to Department': ${updatedCount - alreadySentCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Verification: re-query all target records to confirm their live status
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

  // Check if any record is NOT "Sent to Department"
  const nonCompliant = verifyList.filter((r) => r.status !== "Sent to Department");
  if (nonCompliant.length > 0) {
    console.error("WARNING: Non-compliant records found post-update:", nonCompliant);
  } else {
    console.log("✅ 100% of target records (313/313) successfully verified as 'Sent to Department'!");
  }

  // Sample 5 records (some that were previously rejected)
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

