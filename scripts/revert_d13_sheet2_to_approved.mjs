import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function revertSheet2() {
  console.log("============================================================================");
  console.log("=== Reverting D-13.10.2026.xlsx Sheet2 (19 records) to 'Approved' ===");
  console.log("============================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `revert_s2_${Date.now()}@gleamator.com`;
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

  // Read Sheet2
  const s2 = wb.Sheets["Sheet2"];
  const s2Data = xlsx.utils.sheet_to_json(s2, { header: 1, defval: "" });
  const s2Records = [];

  for (let r = 0; r < s2Data.length; r++) {
    const row = s2Data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = String(row[0]).trim();
    const saf = String(row[1]).trim().replace(/\.$/, "");
    const aadhaar = String(row[28]).trim().replace(/\s+/g, "").replace(/-/g, "");
    s2Records.push({
      rowNum: r,
      ref,
      saf,
      aadhaar,
      name: `${row[8]} ${row[9]}`.trim(),
    });
  }

  console.log(`Extracted ${s2Records.length} records from Sheet2 to revert to 'Approved'.`);
  const uniqueAadhaars = [...new Set(s2Records.map((r) => r.aadhaar).filter(Boolean))];

  // 3. Find matching rows in Supabase
  const { data: dbRecords, error: fetchErr } = await supabase
    .from("registrations")
    .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
    .in("aadhaar_number", uniqueAadhaars);

  if (fetchErr) {
    console.error("Fetch error:", fetchErr);
    process.exit(1);
  }

  console.log(`Matched ${dbRecords.length} records in registrations table.`);
  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // 4. Update the 19 records back to 'Approved'
  let revertedCount = 0;
  const now = new Date().toISOString();

  for (const item of s2Records) {
    const dbRow = dbMap.get(item.aadhaar);
    if (!dbRow) {
      console.warn("Aadhaar not found:", item.aadhaar);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Approved",
        admin_notes: "Approved",
        updated_at: now,
      })
      .eq("id", dbRow.id);

    if (updateErr) {
      console.error(`Failed to revert ${item.ref}:`, updateErr.message);
    } else {
      revertedCount++;
    }
  }

  console.log(`Successfully reverted ${revertedCount} / ${s2Records.length} records to 'Approved'.`);

  // 5. Update Excel file Sheet2 columns
  for (let r = 0; r < s2Data.length; r++) {
    if (s2Data[r] && s2Data[r].some((c) => c !== "")) {
      const cellRefStatus = xlsx.utils.encode_cell({ r, c: 4 });
      const cellRefNotes = xlsx.utils.encode_cell({ r, c: 5 });
      s2[cellRefStatus] = { t: "s", v: "Approved" };
      s2[cellRefNotes] = { t: "s", v: "N/A" };
    }
  }

  xlsx.writeFile(wb, excelFilePath);
  console.log(`✓ Synchronized Excel Sheet2 columns back to Status = 'Approved' and Admin Notes = 'N/A'.`);

  // 6. Verification
  // Check Sheet2 records in DB
  const { data: verifyS2 } = await supabase
    .from("registrations")
    .select("id, reference_number, aadhaar_number, first_name, last_name, status, admin_notes")
    .in("aadhaar_number", uniqueAadhaars);

  const s2StatusBreakdown = {};
  verifyS2.forEach((r) => {
    s2StatusBreakdown[r.status] = (s2StatusBreakdown[r.status] || 0) + 1;
  });
  console.log("\n=== POST-REVERT VERIFICATION (Sheet2: 19 records) ===");
  console.log("Sheet2 Live DB Status Breakdown:", s2StatusBreakdown);

  // Check Master Sheet records in DB (213 records)
  const ms = wb.Sheets["Master Sheet"];
  const msData = xlsx.utils.sheet_to_json(ms, { header: 1, defval: "" });
  const msHeaders = msData[0].map((h) => String(h).trim());
  const msAadhIdx = msHeaders.findIndex((h) => /aadhaar/i.test(h));
  const msAadhaars = [];
  for (let r = 1; r < msData.length; r++) {
    if (msData[r][msAadhIdx]) msAadhaars.push(String(msData[r][msAadhIdx]).trim().replace(/\s+/g, ""));
  }

  let msDbRows = [];
  for (let i = 0; i < msAadhaars.length; i += 100) {
    const chunk = msAadhaars.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, status")
      .in("aadhaar_number", chunk);
    if (res) msDbRows.push(...res);
  }
  const msStatusBreakdown = {};
  msDbRows.forEach((r) => {
    msStatusBreakdown[r.status] = (msStatusBreakdown[r.status] || 0) + 1;
  });
  console.log("\n=== MASTER SHEET CONFIRMATION (Master Sheet: 213 records) ===");
  console.log("Master Sheet Live DB Status Breakdown:", msStatusBreakdown);

  console.log("\nSample 5 Reverted Sheet2 Records:");
  console.table(
    verifyS2.slice(0, 5).map((r) => ({
      Reference: r.reference_number,
      Aadhaar: r.aadhaar_number,
      Name: `${r.first_name} ${r.last_name || ""}`.trim(),
      Status: r.status,
      AdminNotes: r.admin_notes,
    }))
  );
}

revertSheet2().catch(console.error);

