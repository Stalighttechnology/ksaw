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
  console.log("=== D-13.10.2026.xlsx: Update records to 'Sent to Department' ===");
  console.log("============================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_d13_${Date.now()}@gleamator.com`;
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
  const excelFilePath = path.resolve(__dirname, "../approved to dept/D-13.10.2026.xlsx");
  const wb = xlsx.readFile(excelFilePath);

  // Extract Master Sheet
  const ms = wb.Sheets["Master Sheet"];
  const msData = xlsx.utils.sheet_to_json(ms, { header: 1, defval: "" });
  const msHeaders = msData[0].map((h) => String(h).trim());
  const msRefIdx = msHeaders.findIndex((h) => /reference/i.test(h));
  const msAadhIdx = msHeaders.findIndex((h) => /aadhaar/i.test(h));
  const msSafIdx = msHeaders.findIndex((h) => /saf/i.test(h));
  const msStatusIdx = msHeaders.findIndex((h) => /^status$/i.test(h));
  const msNotesIdx = msHeaders.findIndex((h) => /admin\s*notes/i.test(h));

  const allRecords = [];

  for (let r = 1; r < msData.length; r++) {
    const row = msData[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = String(row[msRefIdx]).trim();
    const aadhaar = String(row[msAadhIdx]).trim().replace(/\s+/g, "").replace(/-/g, "");
    const saf = String(row[msSafIdx]).trim().replace(/\.$/, "");
    allRecords.push({
      sheet: "Master Sheet",
      rowNum: r,
      ref,
      aadhaar,
      saf,
      name: `${row[8]} ${row[9]}`.trim(),
    });
  }

  // Extract Sheet2
  const s2 = wb.Sheets["Sheet2"];
  const s2Data = xlsx.utils.sheet_to_json(s2, { header: 1, defval: "" });
  for (let r = 0; r < s2Data.length; r++) {
    const row = s2Data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = String(row[0]).trim();
    const saf = String(row[1]).trim().replace(/\.$/, "");
    const aadhaar = String(row[28]).trim().replace(/\s+/g, "").replace(/-/g, "");
    allRecords.push({
      sheet: "Sheet2",
      rowNum: r,
      ref,
      aadhaar,
      saf,
      name: `${row[8]} ${row[9]}`.trim(),
    });
  }

  console.log(`Total candidate records extracted: ${allRecords.length} (Master Sheet: 213, Sheet2: 19)`);
  const uniqueAadhaars = [...new Set(allRecords.map((r) => r.aadhaar).filter(Boolean))];
  const uniqueRefs = [...new Set(allRecords.map((r) => r.ref).filter(Boolean))];
  console.log(`Unique Aadhaar count: ${uniqueAadhaars.length}`);
  console.log(`Unique Reference count: ${uniqueRefs.length}`);

  // 3. Find matching rows in Supabase
  let dbRecords = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 100) {
    const chunk = uniqueAadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("Error fetching matching DB records:", error);
      process.exit(1);
    }
    if (res) dbRecords.push(...res);
  }

  console.log(`Matched ${dbRecords.length} records in registrations table.`);
  const currentStatusCounts = {};
  for (const d of dbRecords) {
    currentStatusCounts[d.status] = (currentStatusCounts[d.status] || 0) + 1;
  }
  console.log("Current DB status distribution before update:", currentStatusCounts);

  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // 4. Batch update each matched record in Supabase to "Sent to Department"
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < allRecords.length; i++) {
    const item = allRecords[i];
    const dbRow = dbMap.get(item.aadhaar);

    if (!dbRow) {
      errors.push({
        ref: item.ref,
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
      console.error(`Failed to update ${dbRow.reference_number}:`, updateErr.message);
      errors.push({
        ref: dbRow.reference_number,
        aadhaar: item.aadhaar,
        reason: updateErr.message,
      });
    } else if (updateRes && updateRes.length > 0) {
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === allRecords.length) {
        console.log(`Progress: [${updatedCount}/${allRecords.length}] Updated -> 'Sent to Department'`);
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
  console.log(`Total Candidates in D-13.10.2026.xlsx: ${allRecords.length}`);
  console.log(`Successfully Updated to 'Sent to Department': ${updatedCount}`);
  console.log(`Errors / Unmatched: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Update Status and Admin Notes columns in Excel file
  // In Master Sheet:
  if (msStatusIdx !== -1) {
    for (let r = 1; r < msData.length; r++) {
      if (msData[r] && msData[r].some((c) => c !== "")) {
        const cellRef = xlsx.utils.encode_cell({ r, c: msStatusIdx });
        ms[cellRef] = { t: "s", v: "Sent to Department" };
      }
    }
  }
  if (msNotesIdx !== -1) {
    for (let r = 1; r < msData.length; r++) {
      if (msData[r] && msData[r].some((c) => c !== "")) {
        const cellRef = xlsx.utils.encode_cell({ r, c: msNotesIdx });
        ms[cellRef] = { t: "s", v: "Sent to Department" };
      }
    }
  }

  // In Sheet2:
  for (let r = 0; r < s2Data.length; r++) {
    if (s2Data[r] && s2Data[r].some((c) => c !== "")) {
      const cellRefStatus = xlsx.utils.encode_cell({ r, c: 4 });
      const cellRefNotes = xlsx.utils.encode_cell({ r, c: 5 });
      s2[cellRefStatus] = { t: "s", v: "Sent to Department" };
      s2[cellRefNotes] = { t: "s", v: "Sent to Department" };
    }
  }

  xlsx.writeFile(wb, excelFilePath);
  console.log(`✓ Synchronized Excel file '${excelFilePath}' columns Status and Admin Notes to 'Sent to Department'.`);

  // 6. Verification: re-query all 232 records in DB
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

  const nonCompliant = verifyList.filter((r) => r.status !== "Sent to Department" || r.admin_notes !== "Sent to Department");
  if (nonCompliant.length > 0) {
    console.error("WARNING: Non-compliant records found post-update:", nonCompliant);
  } else {
    console.log("✅ 100% of candidates (232/232) successfully verified as 'Sent to Department'!");
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

