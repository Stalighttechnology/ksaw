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
  console.log("=== Analyzing V-12.10.2026.xlsx ===");
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

  const filePath = path.resolve(__dirname, "../approved to dept/V-12.10.2026.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets["Master Data"];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const headers = data[0].map((h) => String(h).trim());
  console.log("Headers:", headers);

  const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
  const rdIdx = headers.findIndex((h) => /rd\s*number/i.test(h));

  const excelRows = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const rawAadhaar = row[aadharIdx];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const saf = safIdx !== -1 ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
    const firstName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
    const lastName = lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "";
    const rd = rdIdx !== -1 ? String(row[rdIdx]).trim() : "";
    excelRows.push({
      excelRowNumber: r + 1,
      slNo: row[0],
      saf,
      aadhaar,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      rd,
    });
  }

  console.log("Total data rows in Excel:", excelRows.length);
  const uniqueAadhaars = [...new Set(excelRows.map((r) => r.aadhaar).filter(Boolean))];
  const uniqueSafs = [...new Set(excelRows.map((r) => r.saf).filter(Boolean))];
  console.log("Unique Aadhaars:", uniqueAadhaars.length);
  console.log("Unique SAFs:", uniqueSafs.length);

  // Check for duplicates
  const aadhCounts = {};
  excelRows.forEach((r) => {
    aadhCounts[r.aadhaar] = (aadhCounts[r.aadhaar] || 0) + 1;
  });
  const dupAadhaars = Object.entries(aadhCounts).filter(([k, v]) => v > 1);
  console.log("Duplicate Aadhaars in Excel:", dupAadhaars);

  // Query Supabase by Aadhaar
  let dbRecords = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 100) {
    const chunk = uniqueAadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name")
      .in("aadhaar_number", chunk);
    if (error) console.error("DB query error by Aadhaar:", error);
    if (res) dbRecords.push(...res);
  }

  // Also query by SAF for any not matched
  const matchedAadhaarSet = new Set(dbRecords.map((r) => r.aadhaar_number));
  const missingAadhaarRows = excelRows.filter((r) => !matchedAadhaarSet.has(r.aadhaar));
  console.log("Not matched by Aadhaar count:", missingAadhaarRows.length);

  if (missingAadhaarRows.length > 0) {
    const safsToQuery = missingAadhaarRows.map((r) => r.saf).filter(Boolean);
    for (let i = 0; i < safsToQuery.length; i += 100) {
      const chunk = safsToQuery.slice(i, i + 100);
      const { data: res, error } = await supabase
        .from("registrations")
        .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name")
        .in("saf_number", chunk);
      if (error) console.error("DB query error by SAF:", error);
      if (res) dbRecords.push(...res);
    }
  }

  const dbMapById = new Map();
  dbRecords.forEach((r) => dbMapById.set(r.id, r));
  console.log("\nMatched DB unique records:", dbMapById.size);

  const statusCounts = {};
  for (const r of dbMapById.values()) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }
  console.log("Current status distribution in DB:", statusCounts);

  const foundAadhaars = new Set(Array.from(dbMapById.values()).map((r) => r.aadhaar_number));
  const foundSafs = new Set(Array.from(dbMapById.values()).map((r) => r.saf_number));

  const missing = excelRows.filter((r) => {
    const matchAadh = r.aadhaar && foundAadhaars.has(r.aadhaar);
    const matchSaf = r.saf && foundSafs.has(r.saf);
    return !matchAadh && !matchSaf;
  });

  console.log("Excel records missing in DB:", missing.length);
  if (missing.length > 0) {
    console.log("Missing records details:", JSON.stringify(missing, null, 2));
  }

  console.log("\nSample 5 records:");
  excelRows.slice(0, 5).forEach((ex, idx) => {
    const db = Array.from(dbMapById.values()).find(
      (r) => r.aadhaar_number === ex.aadhaar || (ex.saf && r.saf_number === ex.saf)
    );
    console.log(`[${idx + 1}] Excel: ${ex.name} | SAF: ${ex.saf} | Aadhaar: ${ex.aadhaar}`);
    if (db) {
      console.log(`    DB: Ref: ${db.reference_number} | SAF: ${db.saf_number} | Status: '${db.status}' | AdminNotes: '${db.admin_notes}'`);
    } else {
      console.log(`    DB: NOT FOUND`);
    }
  });
}

analyze().catch(console.error);
