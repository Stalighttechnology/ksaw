import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectSendToDept() {
  console.log("=========================================================================");
  console.log("=== Inspecting approved to dept/sendtodept.xlsx ===");
  console.log("=========================================================================\n");

  const filePath = path.resolve(__dirname, "../approved to dept/sendtodept.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheetName = wb.SheetNames.find((s) => /approved/i.test(s)) || wb.SheetNames[1];
  console.log("Using sheet:", sheetName);

  const sheet = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headers = data[0].map((h) => String(h).trim());

  const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
  const refIdx = headers.findIndex((h) => /reference\s*id|reference\s*number|reference/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
  const statusIdx = headers.findIndex((h) => /^status$/i.test(h));

  console.log(`Indices: Ref: ${refIdx}, Aadhaar: ${aadharIdx}, SAF: ${safIdx}, Status: ${statusIdx}`);

  const rows = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = refIdx !== -1 ? String(row[refIdx]).trim() : "";
    const rawAadhaar = aadharIdx !== -1 ? row[aadharIdx] : "";
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const saf = safIdx !== -1 ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
    const name = `${nameIdx !== -1 ? row[nameIdx] : ""} ${lastNameIdx !== -1 ? row[lastNameIdx] : ""}`.trim();
    const excelStatus = statusIdx !== -1 ? String(row[statusIdx]).trim() : "";

    rows.push({
      excelRowNum: r + 1,
      ref,
      aadhaar,
      saf,
      name,
      excelStatus,
    });
  }

  console.log(`Total data rows extracted: ${rows.length}`);
  const uniqueRefs = [...new Set(rows.map((r) => r.ref).filter(Boolean))];
  const uniqueAadhaars = [...new Set(rows.map((r) => r.aadhaar).filter(Boolean))];
  console.log(`Unique References: ${uniqueRefs.length}`);
  console.log(`Unique Aadhaars: ${uniqueAadhaars.length}`);

  // Authenticate
  const authEmail = `inspector_std_${Date.now()}@gleamator.com`;
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

  // Fetch DB records by reference_number and aadhaar_number
  let dbRecords = [];
  for (let i = 0; i < uniqueRefs.length; i += 100) {
    const chunk = uniqueRefs.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("reference_number", chunk);
    if (error) console.error("Error querying by ref:", error);
    if (res) dbRecords.push(...res);
  }

  const matchedRefMap = new Map(dbRecords.map((r) => [r.reference_number, r]));
  const missingByRef = rows.filter((r) => !matchedRefMap.has(r.ref));
  console.log(`Matched by Reference ID: ${matchedRefMap.size} / ${rows.length}`);
  if (missingByRef.length > 0) {
    console.log(`Missing by Ref (${missingByRef.length}), querying by Aadhaar...`);
    const missingAadhaars = missingByRef.map((r) => r.aadhaar).filter(Boolean);
    for (let i = 0; i < missingAadhaars.length; i += 100) {
      const chunk = missingAadhaars.slice(i, i + 100);
      const { data: res, error } = await supabase
        .from("registrations")
        .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
        .in("aadhaar_number", chunk);
      if (error) console.error("Error querying by aadhaar:", error);
      if (res) dbRecords.push(...res);
    }
  }

  const dbMap = new Map();
  dbRecords.forEach((r) => {
    if (r.reference_number) dbMap.set(r.reference_number, r);
    if (r.aadhaar_number) dbMap.set(r.aadhaar_number, r);
  });

  const matchedRows = [];
  const unmatchedRows = [];
  const statusCounts = {};

  for (const r of rows) {
    const dbRow = dbMap.get(r.ref) || dbMap.get(r.aadhaar);
    if (dbRow) {
      matchedRows.push({ ...r, dbId: dbRow.id, currentDbStatus: dbRow.status, currentAdminNotes: dbRow.admin_notes });
      statusCounts[dbRow.status] = (statusCounts[dbRow.status] || 0) + 1;
    } else {
      unmatchedRows.push(r);
    }
  }

  console.log(`\nMatched in DB: ${matchedRows.length} / ${rows.length}`);
  console.log("Current DB Status distribution:", statusCounts);
  if (unmatchedRows.length > 0) {
    console.log("Unmatched records:", unmatchedRows);
  }

  console.log("\nSample 5 records to update:");
  matchedRows.slice(0, 5).forEach((m, idx) => {
    console.log(`[${idx + 1}] Ref: ${m.ref} | Name: ${m.name} | Current Status: '${m.currentDbStatus}' | Notes: '${m.currentAdminNotes}'`);
  });
}

inspectSendToDept().catch(console.error);

