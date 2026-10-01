import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function normalizeStr(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeRef(str) {
  if (!str) return "";
  return String(str).toUpperCase().replace(/\s+/g, " ").trim();
}

function normalizeAadhaar(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}

function normalizeSaf(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").trim();
}

async function auditFile(filePath) {
  console.log(`\n========================================`);
  console.log(`Auditing: ${filePath}`);
  console.log(`========================================`);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const wb = xlsx.readFile(filePath);
  console.log(`Sheets in workbook:`, wb.SheetNames);

  // Fetch all registrations from DB
  let allRegs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone, institution_name, category, gender, religion")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allRegs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Total live registrations in DB: ${allRegs.length}`);

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
    console.log(`\n--- Sheet: "${sheetName}" | Total Rows: ${rows.length} ---`);
    if (rows.length === 0) continue;

    // Detect columns
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    console.log("Sample columns:", keys);

    let batchName = sheetName.replace(/\s+/g, "/").trim();
    // Check if there's a batch column or batch info
    const batchCol = keys.find(k => /batch/i.test(k));
    const refCol = keys.find(k => /ksaw|ref/i.test(k));
    const safCol = keys.find(k => /saf/i.test(k));
    const aadhCol = keys.find(k => /aadhaar|adhar|aadh/i.test(k));
    const nameCol = keys.find(k => /name|student|candidate/i.test(k));

    console.log(`Detected mapped cols -> Batch: ${batchCol}, Ref: ${refCol}, SAF: ${safCol}, Aadhaar: ${aadhCol}, Name: ${nameCol}`);

    let matched = 0;
    let unmatched = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const curBatch = batchCol && r[batchCol] ? String(r[batchCol]).trim() : batchName;
      const refVal = refCol ? normalizeRef(r[refCol]) : "";
      const safVal = safCol ? normalizeSaf(r[safCol]) : "";
      const aadhVal = aadhCol ? normalizeAadhaar(r[aadhCol]) : "";
      const nameVal = nameCol ? String(r[nameCol]).trim() : "";

      // Try finding match in allRegs
      let match = null;

      // 1. Match by SAF Number
      if (safVal) {
        const cleanSaf = safVal.replace(/\.+$/, "");
        match = allRegs.find(db => normalizeSaf(db.saf_number) === cleanSaf || normalizeSaf(db.saf_number).includes(cleanSaf));
      }

      // 2. Match by Reference Number
      if (!match && refVal) {
        const cleanRef = refVal.replace(/\s+/g, "");
        match = allRegs.find(db => {
          const dbRef = normalizeRef(db.reference_number).replace(/\s+/g, "");
          return dbRef === cleanRef || dbRef.replace(/0+/g, "") === cleanRef.replace(/0+/g, "");
        });
      }

      // 3. Match by 12-digit Aadhaar
      if (!match && aadhVal && aadhVal.length >= 10) {
        match = allRegs.find(db => normalizeAadhaar(db.aadhaar_number) === aadhVal);
      }

      // 4. Match by Name
      if (!match && nameVal) {
        const nNorm = normalizeStr(nameVal);
        match = allRegs.find(db => {
          const dbFullName = normalizeStr(`${db.first_name || ""} ${db.last_name || ""}`);
          return dbFullName === nNorm || (nNorm.length > 5 && dbFullName.includes(nNorm));
        });
      }

      if (match) {
        matched++;
      } else {
        unmatched.push({
          row: i + 2,
          ref: refVal,
          saf: safVal,
          aadhaar: aadhVal,
          name: nameVal
        });
      }
    }

    console.log(`Sheet "${sheetName}": Matched ${matched}/${rows.length} records.`);
    if (unmatched.length > 0) {
      console.log(`Unmatched sample (up to 5):`, unmatched.slice(0, 5));
    }
  }
}

async function run() {
  await auditFile("batch/AVK- Batch list updated (22-09-26).xlsx");
  await auditFile("batch/Central collegeBATCH WISE LIST ( 22-09-26).xlsx");
}

run();
