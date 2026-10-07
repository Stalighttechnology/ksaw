import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectFolder() {
  console.log("=========================================================================");
  console.log("=== Inspecting 4 Files in WhatsApp Unknown 2026-10-06 at 5.53.52 PM ===");
  console.log("=========================================================================\n");

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
  console.log("Supabase authentication session established successfully.");

  const folder = path.resolve(__dirname, "../WhatsApp Unknown 2026-10-06 at 5.53.52 PM");
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".xlsx")).sort();

  const allExcelRecords = [];
  const fileBreakdown = [];

  for (const file of files) {
    const filePath = path.join(folder, file);
    const wb = xlsx.readFile(filePath);
    let countInFile = 0;

    for (const sname of wb.SheetNames) {
      const sheet = wb.Sheets[sname];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      let headerRowIdx = -1;
      for (let r = 0; r < Math.min(5, data.length); r++) {
        if (data[r].some((cell) => String(cell).toLowerCase().includes("saf") || String(cell).toLowerCase().includes("name") || String(cell).toLowerCase().includes("aadhaar"))) {
          headerRowIdx = r;
          break;
        }
      }
      if (headerRowIdx === -1) continue;

      const headers = data[headerRowIdx].map((h) => String(h).trim());
      const safIdx = headers.findIndex((h) => /saf/i.test(h));
      const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
      const nameIdx = headers.findIndex((h) => /first\s*name|applicant\s*name|name/i.test(h));
      const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
      const rdIdx = headers.findIndex((h) => /rd\s*number/i.test(h));

      let sheetCount = 0;
      for (let r = headerRowIdx + 1; r < data.length; r++) {
        const row = data[r];
        if (!row || !row.some((c) => c !== "")) continue;

        const saf = safIdx !== -1 && row[safIdx] ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
        const aadhar = aadharIdx !== -1 && row[aadharIdx] ? String(row[aadharIdx]).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
        const firstName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
        const lastName = lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "";
        const rd = rdIdx !== -1 ? String(row[rdIdx]).trim() : "";

        sheetCount++;
        countInFile++;
        allExcelRecords.push({
          file,
          sheet: sname,
          saf,
          aadhar,
          name: `${firstName} ${lastName}`.trim(),
          rd,
        });
      }
      console.log(`File: ${file} | Sheet: '${sname}' (Header row ${headerRowIdx + 1}) | Records: ${sheetCount}`);
      console.log(`Headers:`, headers);
    }
    fileBreakdown.push({ file, count: countInFile });
  }

  console.log(`\nTotal extracted rows across all 4 files: ${allExcelRecords.length}`);

  const safs = [...new Set(allExcelRecords.map((r) => r.saf).filter(Boolean))];
  const aadhaars = [...new Set(allExcelRecords.map((r) => r.aadhar).filter(Boolean))];

  console.log(`Unique SAFs: ${safs.length}`);
  console.log(`Unique Aadhaars: ${aadhaars.length}`);

  // Query DB by SAF
  let dbBySaf = [];
  for (let i = 0; i < safs.length; i += 100) {
    const chunk = safs.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("saf_number", chunk);
    if (error) console.error("Error query by SAF:", error);
    if (res) dbBySaf.push(...res);
  }

  // Query DB by Aadhaar
  let dbByAadhaar = [];
  for (let i = 0; i < aadhaars.length; i += 100) {
    const chunk = aadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);
    if (error) console.error("Error query by Aadhaar:", error);
    if (res) dbByAadhaar.push(...res);
  }

  const dbMapById = new Map();
  dbBySaf.forEach((r) => dbMapById.set(r.id, r));
  dbByAadhaar.forEach((r) => dbMapById.set(r.id, r));

  console.log(`\nMatched unique DB records: ${dbMapById.size}`);
  const statusCounts = {};
  for (const r of dbMapById.values()) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }
  console.log("Current status distribution in DB:", statusCounts);

  const foundSafs = new Set(Array.from(dbMapById.values()).map((r) => r.saf_number));
  const foundAadhaars = new Set(Array.from(dbMapById.values()).map((r) => r.aadhaar_number));

  const missing = allExcelRecords.filter((r) => {
    const matchSaf = r.saf && foundSafs.has(r.saf);
    const matchAadh = r.aadhar && foundAadhaars.has(r.aadhar);
    return !matchSaf && !matchAadh;
  });

  console.log(`Missing records from DB: ${missing.length}`);
  if (missing.length > 0) {
    console.log("Missing sample:", missing);
  }
}

inspectFolder().catch(console.error);
