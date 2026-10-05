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
  console.log("=================================================");
  console.log("=== Analyzing V-03.10.2026 Submission.xlsx ===");
  console.log("=================================================");

  const authEmail = `inspector_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });
  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }
  console.log("Authenticated successfully.");

  const filePath = path.resolve(__dirname, "../public/V-03.10.2026 Submission.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets["Master Sheet"];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const headers = data[0].map((h) => String(h).trim());
  const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
  const collegeIdx = headers.findIndex((h) => /college/i.test(h));

  console.log("Headers count:", headers.length);
  console.log("Aadhaar column:", headers[aadharIdx], "at index", aadharIdx);

  const excelRows = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const rawAadhaar = row[aadharIdx];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const saf = safIdx !== -1 ? String(row[safIdx]).trim() : "";
    const firstName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
    const lastName = lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "";
    const college = collegeIdx !== -1 ? String(row[collegeIdx]).trim() : "";
    excelRows.push({
      rowIdx: r + 1,
      slNo: row[0],
      saf,
      aadhaar,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      college,
    });
  }

  console.log("Total data rows in Excel Master Sheet:", excelRows.length);
  const uniqueAadhaars = [...new Set(excelRows.map((r) => r.aadhaar).filter(Boolean))];
  console.log("Unique non-empty Aadhaars:", uniqueAadhaars.length);

  // Check for duplicate Aadhaars in Excel
  const aadhCounts = {};
  excelRows.forEach((r) => {
    aadhCounts[r.aadhaar] = (aadhCounts[r.aadhaar] || 0) + 1;
  });
  const duplicates = Object.entries(aadhCounts).filter(([k, v]) => v > 1);
  console.log("Duplicate Aadhaars within Excel:", duplicates.length > 0 ? duplicates : "None (0 duplicates)");

  // Query Supabase registrations table by Aadhaar
  let dbRecords = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 100) {
    const chunk = uniqueAadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name")
      .in("aadhaar_number", chunk);
    if (error) console.error("DB query error:", error);
    if (res) dbRecords.push(...res);
  }

  console.log("\n--- SUPABASE MATCHING ---");
  console.log("Matched DB records count:", dbRecords.length);

  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));
  const statusCounts = {};
  for (const r of dbRecords) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }
  console.log("Current status distribution in DB:", statusCounts);

  const missingInDb = excelRows.filter((r) => !dbMap.has(r.aadhaar));
  console.log("Excel records missing in DB:", missingInDb.length);
  if (missingInDb.length > 0) {
    console.log("Missing records details:", JSON.stringify(missingInDb, null, 2));
  }

  // Print sample 5 records comparison
  console.log("\n--- Sample 5 Matching Records ---");
  excelRows.slice(0, 5).forEach((ex, idx) => {
    const db = dbMap.get(ex.aadhaar);
    console.log(`[${idx + 1}] Aadhaar: ${ex.aadhaar}`);
    console.log(`    Excel Name: ${ex.name} | College: ${ex.college}`);
    if (db) {
      console.log(`    DB: Ref: ${db.reference_number} | SAF: ${db.saf_number} | Name: ${db.first_name} ${db.last_name} | Current Status: '${db.status}' | Current Admin Notes: '${db.admin_notes}'`);
    } else {
      console.log(`    DB: NOT FOUND`);
    }
  });
}

analyze().catch(console.error);
