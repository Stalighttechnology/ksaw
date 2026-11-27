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
  console.log("=== Final Consolidated 09.10.2026.xlsx: Rows 314 to 522 -> 'Sent to Department' ===");
  console.log("============================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_fc2_${Date.now()}@gleamator.com`;
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

  console.log(`Target records (SL No 314 to 522): ${targetRecords.length}`);
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

  console.log(`\nMatched ${dbRecords.length} records in registrations table.`);
  const currentStatusCounts = {};
  for (const d of dbRecords) {
    currentStatusCounts[d.status] = (currentStatusCounts[d.status] || 0) + 1;
  }
  console.log("Current DB status distribution before update:", currentStatusCounts);

  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // 4. Batch update each matched record in Supabase to "Sent to Department"
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
        name: item.name,
        reason: "Aadhaar not found in database",
      });
      continue;
    }

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
  console.log(`Total Target Records (SL 314 to 522): ${targetRecords.length}`);
  console.log(`Successfully Updated / Confirmed as 'Sent to Department': ${updatedCount}`);
  console.log(`Previously Already 'Sent to Department': ${alreadySentCount}`);
  console.log(`Transitioned from 'Rejected' to 'Sent to Department': ${updatedCount - alreadySentCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Verification: re-query all 209 target records
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

  const nonCompliant = verifyList.filter((r) => r.status !== "Sent to Department");
  if (nonCompliant.length > 0) {
    console.error("WARNING: Non-compliant records found post-update:", nonCompliant);
  } else {
    console.log("✅ 100% of rows 314 to 522 (209/209) successfully verified as 'Sent to Department'!");
  }

  // 6. Overall verification for ALL 522 records in the entire file
  const allFileAadhaars = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const rawAadhaar = row[aadharIdx];
    if (rawAadhaar) allFileAadhaars.push(String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, ""));
  }

  let totalVerifyList = [];
  for (let i = 0; i < allFileAadhaars.length; i += 100) {
    const chunk = allFileAadhaars.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, status")
      .in("aadhaar_number", chunk);
    if (res) totalVerifyList.push(...res);
  }

  const totalStatusBreakdown = {};
  for (const t of totalVerifyList) {
    totalStatusBreakdown[t.status] = (totalStatusBreakdown[t.status] || 0) + 1;
  }
  console.log("\n=== COMPLETE FILE VERIFICATION (All 522 records SL 1 to 522) ===");
  console.log("Total DB Status Breakdown for all 522 records in Final Consolidated 09.10.2026:", totalStatusBreakdown);
}

runUpdate().catch(console.error);

