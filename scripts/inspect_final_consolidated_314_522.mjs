import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspect314to522() {
  console.log("=========================================================================");
  console.log("=== Inspecting Final Consolidated 09.10.2026.xlsx (Rows 314 to 522) ===");
  console.log("=========================================================================\n");

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

  const targetRows = [];
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
      const rd = rdIdx !== -1 ? String(row[rdIdx]).trim() : "";
      const location = locationIdx !== -1 ? String(row[locationIdx]).trim() : "";
      targetRows.push({
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
  }

  console.log(`Target rows (SL No 314 to 522): ${targetRows.length}`);
  const uniqueAadhaars = [...new Set(targetRows.map((r) => r.aadhaar).filter(Boolean))];
  console.log(`Unique Aadhaars: ${uniqueAadhaars.length}`);

  // Check duplicates
  const aadhCounts = {};
  targetRows.forEach((r) => {
    if (r.aadhaar) aadhCounts[r.aadhaar] = (aadhCounts[r.aadhaar] || 0) + 1;
  });
  const dupes = Object.entries(aadhCounts).filter(([k, v]) => v > 1);
  if (dupes.length > 0) {
    console.log("Duplicate Aadhaars:", dupes);
  } else {
    console.log("No duplicate Aadhaars found.");
  }

  // Auth Supabase
  const authEmail = `inspector_fc2_${Date.now()}@gleamator.com`;
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

  // Query DB
  let dbRecords = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 100) {
    const chunk = uniqueAadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);
    if (error) console.error("DB query error by Aadhaar:", error);
    if (res) dbRecords.push(...res);
  }

  console.log(`Matched by Aadhaar in DB: ${dbRecords.length} / ${targetRows.length}`);

  // Query any missing by SAF
  const matchedAadhaarSet = new Set(dbRecords.map((r) => r.aadhaar_number));
  const unmatched = targetRows.filter((r) => !matchedAadhaarSet.has(r.aadhaar));
  if (unmatched.length > 0) {
    console.log(`Unmatched by Aadhaar (${unmatched.length}), checking SAF...`);
    const safs = unmatched.map((r) => r.saf).filter(Boolean);
    for (let i = 0; i < safs.length; i += 100) {
      const chunk = safs.slice(i, i + 100);
      const { data: res, error } = await supabase
        .from("registrations")
        .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
        .in("saf_number", chunk);
      if (error) console.error("DB query error by SAF:", error);
      if (res) dbRecords.push(...res);
    }
  }

  const dbMap = new Map();
  dbRecords.forEach((r) => {
    if (r.aadhaar_number) dbMap.set(r.aadhaar_number, r);
    if (r.saf_number) dbMap.set(r.saf_number, r);
  });

  const matched = [];
  const missing = [];
  const statusCounts = {};

  for (const t of targetRows) {
    const dbRow = dbMap.get(t.aadhaar) || dbMap.get(t.saf);
    if (dbRow) {
      matched.push({ ...t, dbId: dbRow.id, currentDbStatus: dbRow.status, currentAdminNotes: dbRow.admin_notes });
      statusCounts[dbRow.status] = (statusCounts[dbRow.status] || 0) + 1;
    } else {
      missing.push(t);
    }
  }

  console.log(`Matched target rows: ${matched.length} / ${targetRows.length}`);
  console.log("Current DB Status distribution:", statusCounts);
  if (missing.length > 0) {
    console.log("Missing rows:", missing);
  }

  console.log("\nSample 5 records:");
  matched.slice(0, 5).forEach((m, idx) => {
    console.log(`[${idx + 1}] SL: ${m.slNo} | SAF: ${m.saf} | Aadhaar: ${m.aadhaar} | Name: ${m.name} | Status: '${m.currentDbStatus}' | Notes: '${m.currentAdminNotes}'`);
  });
}

inspect314to522().catch(console.error);

