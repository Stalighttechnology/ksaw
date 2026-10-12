import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const filePath = path.resolve(__dirname, "../public/update/M-12.10.2026 (1).xlsx");

async function executeSentToDeptUpdate() {
  console.log("=========================================================================");
  console.log("=== BATCH UPDATE: Updating all 79 records to 'Sent to Department' ===");
  console.log("=== Source: M-12.10.2026 (1).xlsx ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_m12_${Date.now()}@gleamator.com`;
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
  const sheet = wb.Sheets["Master Sheet"];
  if (!sheet) {
    console.error("Master Sheet not found in Excel!");
    process.exit(1);
  }
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`✓ Read ${rows.length} rows from Master Sheet in M-12.10.2026 (1).xlsx.`);

  const excelRecords = rows.map((r, idx) => {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
    const aadhaar = String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "");
    const refId = String(r["Reference ID"] || "").trim();
    const safNo = String(r["SAF Number"] || "").trim();
    const name = `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim();
    const center = String(r["Center Location"] || "").trim();
    return {
      rowIndex: idx + 1,
      refId,
      safNo,
      aadhaar,
      name,
      center,
      currentStatus: r["Status"],
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

  // 4. Update all 79 records
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < excelRecords.length; i++) {
    const item = excelRecords[i];
    const dbRow = dbMap.get(item.aadhaar);

    if (!dbRow) {
      errors.push({
        ref: item.refId,
        aadhaar: item.aadhaar,
        name: item.name,
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
      console.error(`✗ Failed to update ${dbRow.reference_number}:`, updateErr.message);
      errors.push({
        ref: dbRow.reference_number,
        aadhaar: item.aadhaar,
        reason: updateErr.message,
      });
    } else {
      updatedCount++;
      console.log(`[${updatedCount}/${excelRecords.length}] Updated ${dbRow.reference_number || 'ID:' + dbRow.id} (${item.name}) from "${dbRow.status}" -> "Sent to Department"`);
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`Total Records in Excel: ${excelRecords.length}`);
  console.log(`Successfully Updated to 'Sent to Department': ${updatedCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Post-Update Live DB Verification
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

  const statusSummary = {};
  const notesSummary = {};
  for (const r of verifyList) {
    statusSummary[r.status] = (statusSummary[r.status] || 0) + 1;
    notesSummary[r.admin_notes] = (notesSummary[r.admin_notes] || 0) + 1;
  }

  console.log("Verified Live DB Status Count:", statusSummary);
  console.log("Verified Live DB Admin Notes Count:", notesSummary);
  console.log(`Verified Total Records in DB: ${verifyList.length}/${excelRecords.length}`);

  if (statusSummary["Sent to Department"] === excelRecords.length) {
    console.log("✓ SUCCESS: All 79 records successfully updated and verified in database!");
  } else {
    console.warn("⚠ WARNING: Some records may have different statuses:", statusSummary);
  }
}

executeSentToDeptUpdate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
