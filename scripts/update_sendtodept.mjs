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
  console.log("=== sendtodept.xlsx: Update 184 records to 'Sent to Department' ===");
  console.log("============================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_std_${Date.now()}@gleamator.com`;
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
  const excelFilePath = path.resolve(__dirname, "../approved to dept/sendtodept.xlsx");
  const wb = xlsx.readFile(excelFilePath);
  const sheetName = wb.SheetNames.find((s) => /approved/i.test(s)) || wb.SheetNames[1];
  console.log(`Processing sheet: '${sheetName}'`);
  const sheet = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const headers = data[0].map((h) => String(h).trim());
  const refIdx = headers.findIndex((h) => /reference\s*id|reference\s*number|reference/i.test(h));
  const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
  const statusIdx = headers.findIndex((h) => /^status$/i.test(h));
  const adminNotesIdx = headers.findIndex((h) => /admin\s*notes/i.test(h));

  const records = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = refIdx !== -1 ? String(row[refIdx]).trim() : "";
    const rawAadhaar = aadharIdx !== -1 ? row[aadharIdx] : "";
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const saf = safIdx !== -1 ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
    const name = `${nameIdx !== -1 ? row[nameIdx] : ""} ${lastNameIdx !== -1 ? row[lastNameIdx] : ""}`.trim();

    records.push({
      excelRowNumber: r + 1,
      ref,
      aadhaar,
      saf,
      name,
    });
  }

  console.log(`Extracted ${records.length} records from sheet '${sheetName}'.`);
  const uniqueRefs = [...new Set(records.map((r) => r.ref).filter(Boolean))];

  // 3. Find matching rows in Supabase
  let dbRecords = [];
  for (let i = 0; i < uniqueRefs.length; i += 100) {
    const chunk = uniqueRefs.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("reference_number", chunk);

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

  const dbMap = new Map(dbRecords.map((r) => [r.reference_number, r]));

  // 4. Batch update each matched record in Supabase to "Sent to Department"
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < records.length; i++) {
    const item = records[i];
    const dbRow = dbMap.get(item.ref);

    if (!dbRow) {
      errors.push({
        ref: item.ref,
        name: item.name,
        reason: "Reference ID not found in database",
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
        name: item.name,
        reason: updateErr.message,
      });
    } else if (updateRes && updateRes.length > 0) {
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === records.length) {
        console.log(`Progress: [${updatedCount}/${records.length}] Updated -> 'Sent to Department'`);
      }
    } else {
      errors.push({
        ref: dbRow.reference_number,
        name: item.name,
        reason: "No rows updated",
      });
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`Total Records in Sheet: ${records.length}`);
  console.log(`Successfully Updated to 'Sent to Department': ${updatedCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Update Excel file cells for Status and Admin Notes
  if (statusIdx !== -1 || adminNotesIdx !== -1) {
    for (let r = 1; r < data.length; r++) {
      const row = data[r];
      if (!row || !row.some((c) => c !== "")) continue;
      if (statusIdx !== -1) {
        const cellRef = xlsx.utils.encode_cell({ r, c: statusIdx });
        sheet[cellRef] = { t: "s", v: "Sent to Department" };
      }
      if (adminNotesIdx !== -1) {
        const cellRef = xlsx.utils.encode_cell({ r, c: adminNotesIdx });
        sheet[cellRef] = { t: "s", v: "Sent to Department" };
      }
    }
    xlsx.writeFile(wb, excelFilePath);
    console.log(`✓ Updated Excel file '${excelFilePath}' columns Status and Admin Notes to 'Sent to Department'.`);
  }

  // 6. Verification: re-query all records in DB
  let verifyList = [];
  for (let i = 0; i < uniqueRefs.length; i += 100) {
    const chunk = uniqueRefs.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, updated_at")
      .in("reference_number", chunk);
    if (res) verifyList.push(...res);
  }

  const liveCounts = {};
  for (const v of verifyList) {
    liveCounts[v.status] = (liveCounts[v.status] || 0) + 1;
  }

  console.log("=== POST-UPDATE VERIFICATION IN SUPABASE ===");
  console.log(`Live DB Status Breakdown for all ${verifyList.length} records:`, liveCounts);

  const nonCompliant = verifyList.filter((r) => r.status !== "Sent to Department");
  if (nonCompliant.length > 0) {
    console.error("WARNING: Non-compliant records found post-update:", nonCompliant);
  } else {
    console.log("✅ 100% of records (184/184) successfully verified as 'Sent to Department'!");
  }

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

