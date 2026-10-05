import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function printTable() {
  const authEmail = `inspector_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const filePath = path.resolve(__dirname, "../public/V-03.10.2026 Submission.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets["Master Sheet"];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const excelRows = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const rawAadhaar = row[14];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    excelRows.push({
      excelRowNumber: r + 1,
      slNo: row[0],
      saf: String(row[1] || ""),
      college: String(row[3] || ""),
      name: `${row[5] || ""} ${row[6] || ""}`.trim(),
      aadhaar,
    });
  }

  const aadhaars = excelRows.map((r) => r.aadhaar);
  let dbRecords = [];
  for (let i = 0; i < aadhaars.length; i += 100) {
    const chunk = aadhaars.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, institution_name")
      .in("aadhaar_number", chunk);
    if (res) dbRecords.push(...res);
  }

  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  console.log("FORMATTED_ROWS_START");
  excelRows.forEach((ex) => {
    const db = dbMap.get(ex.aadhaar);
    const ref = db ? db.reference_number : "N/A";
    const saf = (db && db.saf_number) ? db.saf_number : (ex.saf || "N/A");
    console.log(`| ${ex.excelRowNumber} | ${ex.slNo} | \`${ref}\` | ${saf} | \`${ex.aadhaar}\` | ${ex.name} | ${ex.college} |`);
  });
  console.log("FORMATTED_ROWS_END");
}

printTable().catch(console.error);
