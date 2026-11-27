import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function analyze() {
  console.log("=========================================================================");
  console.log("=== Analyzing Final Consolidated 09.10.2026.xlsx (Rows 1 to 313) ===");
  console.log("=========================================================================\n");

  const authEmail = `inspector_fc_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });
  if (authErr || !authData?.session) {
    console.error("Auth error:", authErr);
    return;
  }
  console.log("Supabase authenticated successfully.");

  const filePath = path.resolve(__dirname, "../approved to dept/Final Consolidated 09.10.2026.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const headers = data[0].map((h) => String(h).trim());
  const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
  const rdIdx = headers.findIndex((h) => /rd\s*number/i.test(h));
  const locationIdx = headers.findIndex((h) => /location|center/i.test(h));

  console.log(`Headers found: Aadhaar at col ${aadharIdx}, SAF at col ${safIdx}`);

  const allRows = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const rawAadhaar = row[aadharIdx];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const saf = safIdx !== -1 ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
    const firstName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
    const lastName = lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "";
    const rd = rdIdx !== -1 ? String(row[rdIdx]).trim() : "";
    const location = locationIdx !== -1 ? String(row[locationIdx]).trim() : "";
    const slNo = Number(row[0]);
    allRows.push({
      excelRowNumber: r + 1,
      slNo,
      saf,
      aadhaar,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      rd,
      location,
    });
  }

  console.log(`Total data rows in file: ${allRows.length}`);

  // Filter upto 313
  const targetRows = allRows.filter((r) => r.slNo <= 313);
  const ignoredRows = allRows.filter((r) => r.slNo > 313);

  console.log(`Target rows (SL No <= 313): ${targetRows.length}`);
  console.log(`Ignored rows (SL No > 313): ${ignoredRows.length}`);

  // Check unique Aadhaars and SAFs in targetRows
  const targetAadhaars = targetRows.map((r) => r.aadhaar).filter(Boolean);
  const uniqueTargetAadhaars = [...new Set(targetAadhaars)];
  console.log(`Unique Aadhaars in target 313: ${uniqueTargetAadhaars.length}`);

  const aadhCounts = {};
  targetRows.forEach((r) => {
    if (r.aadhaar) aadhCounts[r.aadhaar] = (aadhCounts[r.aadhaar] || 0) + 1;
  });
  const dupAadhaars = Object.entries(aadhCounts).filter(([k, v]) => v > 1);
  if (dupAadhaars.length > 0) {
    console.log("Duplicate Aadhaars in target 313:", dupAadhaars);
  } else {
    console.log("No duplicate Aadhaars found in target 313.");
  }

  // Missing Aadhaar in target rows?
  const missingAadhaarTarget = targetRows.filter((r) => !r.aadhaar);
  console.log(`Target rows missing Aadhaar: ${missingAadhaarTarget.length}`);

  // Query Supabase for target rows by Aadhaar
  let dbRecords = [];
  for (let i = 0; i < uniqueTargetAadhaars.length; i += 100) {
    const chunk = uniqueTargetAadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name, created_at, updated_at")
      .in("aadhaar_number", chunk);
    if (error) {
      console.error("DB query error by Aadhaar:", error);
    }
    if (res) dbRecords.push(...res);
  }

  console.log(`\nMatched ${dbRecords.length} records by Aadhaar in DB.`);

  // If any not matched by Aadhaar, check by SAF
  const matchedAadhaarSet = new Set(dbRecords.map((r) => r.aadhaar_number));
  const unmatchedByAadhaar = targetRows.filter((r) => !matchedAadhaarSet.has(r.aadhaar));
  console.log(`Unmatched by Aadhaar: ${unmatchedByAadhaar.length}`);

  if (unmatchedByAadhaar.length > 0) {
    const safs = unmatchedByAadhaar.map((r) => r.saf).filter(Boolean);
    for (let i = 0; i < safs.length; i += 100) {
      const chunk = safs.slice(i, i + 100);
      const { data: res, error } = await supabase
        .from("registrations")
        .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name, created_at, updated_at")
        .in("saf_number", chunk);
      if (error) console.error("DB query error by SAF:", error);
      if (res) dbRecords.push(...res);
    }
  }

  const dbMapByAadhaar = new Map();
  const dbMapBySaf = new Map();
  dbRecords.forEach((r) => {
    if (r.aadhaar_number) dbMapByAadhaar.set(r.aadhaar_number, r);
    if (r.saf_number) dbMapBySaf.set(r.saf_number, r);
  });

  // Check how many target records are found
  let foundCount = 0;
  let missingList = [];
  const statusCounts = {};

  for (const t of targetRows) {
    const dbRow = dbMapByAadhaar.get(t.aadhaar) || dbMapBySaf.get(t.saf);
    if (dbRow) {
      foundCount++;
      statusCounts[dbRow.status] = (statusCounts[dbRow.status] || 0) + 1;
    } else {
      missingList.push(t);
    }
  }

  console.log(`\nTarget Records matched in DB: ${foundCount} / ${targetRows.length}`);
  console.log("Current DB Status distribution for the target 313 records:", statusCounts);
  if (missingList.length > 0) {
    console.log("Missing records count:", missingList.length);
    console.log("Missing records details:", JSON.stringify(missingList, null, 2));
  }

  // Print first 5 and last 5 target records
  console.log("\nFirst 3 Target Records:");
  targetRows.slice(0, 3).forEach((r) => {
    const db = dbMapByAadhaar.get(r.aadhaar) || dbMapBySaf.get(r.saf);
    console.log(`SL: ${r.slNo} | SAF: ${r.saf} | Aadhaar: ${r.aadhaar} | Name: ${r.name}`);
    console.log(`  -> DB: Ref: ${db?.reference_number} | Status: ${db?.status} | Notes: ${db?.admin_notes}`);
  });

  console.log("\nRecords 311 to 313:");
  targetRows.slice(310, 313).forEach((r) => {
    const db = dbMapByAadhaar.get(r.aadhaar) || dbMapBySaf.get(r.saf);
    console.log(`SL: ${r.slNo} | SAF: ${r.saf} | Aadhaar: ${r.aadhaar} | Name: ${r.name}`);
    console.log(`  -> DB: Ref: ${db?.reference_number} | Status: ${db?.status} | Notes: ${db?.admin_notes}`);
  });

  console.log("\nIgnored record 314:");
  const r314 = ignoredRows[0];
  if (r314) {
    const { data: db314 } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, status, admin_notes")
      .or(`aadhaar_number.eq.${r314.aadhaar},saf_number.eq.${r314.saf}`);
    console.log(`SL: ${r314.slNo} | SAF: ${r314.saf} | Aadhaar: ${r314.aadhaar} | Name: ${r314.name}`);
    console.log(`  -> DB:`, db314);
  }
}

analyze().catch(console.error);

