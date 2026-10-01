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

const FILES_TO_AUDIT = [
  "batch/Angadi approval list ( 22-09-26).xlsx",
  "batch/BGS Chenraypatna approval list ( 22-09-26).xlsx",
  "batch/DR Shankar college - batch wise list ( 22-09-26).xlsx",
  "batch/GFGC Byrapur approval list ( 22-09-26).xlsx",
  "batch/Govt College Channaraypatna approval list ( 22-09-26).xlsx",
  "batch/KSAWU approval list ( 26-09-2026).xlsx",
  "batch/KTSV B'Lore Vijayanaga approval list ( 22-09-26).xlsx",
  "batch/PES - BATCH WISE LIST (22-09-26).xlsx",
  "batch/Shiva Kumar approval list ( 22-09-26) Batch Wise.xlsx",
  "batch/Shree Medha Bellary approval list ( 22-09-26).xlsx",
  "batch/Tersian BATCH WISE LIST ( 22-09-26).xlsx",
  "batch/Thenkanidiyur,Udupi approval data ( 22-09-26).xlsx"
];

async function runAudit() {
  console.log("Fetching all live registrations from database...");
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
  console.log(`Fetched ${allRegs.length} live registrations.`);

  const auditResults = [];

  for (const filePath of FILES_TO_AUDIT) {
    if (!fs.existsSync(filePath)) {
      auditResults.push({ file: filePath, error: "File not found", sheets: [] });
      continue;
    }

    const fileReport = { file: filePath, sheets: [] };
    const wb = xlsx.readFile(filePath);

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      const batchCol = keys.find(k => /batch\s*id|batch\s*name|^batch$/i.test(k));
      const refCol = keys.find(k => /ksaw|ref/i.test(k));
      const safCol = keys.find(k => /saf/i.test(k));
      const aadhCol = keys.find(k => /aadhaar|adhar|aadh/i.test(k));
      const nameCol = keys.find(k => /name|candidate|student/i.test(k));
      const phoneCol = keys.find(k => /phone|mobile|contact/i.test(k));

      // Extract batch name
      const batchValues = new Set(rows.map(r => batchCol ? String(r[batchCol]).trim() : "").filter(Boolean));
      let detectedBatch = Array.from(batchValues)[0] || sheetName.trim();

      let matched = 0;
      const unmatched = [];
      const matchedIds = new Set();

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const refVal = refCol ? normalizeRef(r[refCol]) : "";
        const safVal = safCol ? normalizeSaf(r[safCol]) : "";
        const aadhVal = aadhCol ? normalizeAadhaar(r[aadhCol]) : "";
        const nameVal = nameCol ? String(r[nameCol]).trim() : "";
        const phoneVal = phoneCol ? String(r[phoneCol]).replace(/\D/g, "").slice(-10) : "";

        let match = null;

        // 1. Aadhaar (12 digits)
        if (aadhVal && aadhVal.length >= 10) {
          match = allRegs.find(db => normalizeAadhaar(db.aadhaar_number) === aadhVal);
        }

        // 2. SAF Number
        if (!match && safVal) {
          const cleanSaf = safVal.replace(/\.+$/, "");
          match = allRegs.find(db => {
            const dbSaf = normalizeSaf(db.saf_number);
            return dbSaf === cleanSaf || dbSaf.replace(/\.+$/, "") === cleanSaf;
          });
        }

        // 3. Reference ID
        if (!match && refVal) {
          const cleanRef = refVal.replace(/\s+/g, "");
          match = allRegs.find(db => {
            const dbRef = normalizeRef(db.reference_number).replace(/\s+/g, "");
            return dbRef === cleanRef || dbRef.replace(/0+/g, "") === cleanRef.replace(/0+/g, "");
          });
        }

        // 4. Phone match
        if (!match && phoneVal && phoneVal.length === 10) {
          match = allRegs.find(db => {
            const dbP = String(db.phone || "").replace(/\D/g, "").slice(-10);
            return dbP === phoneVal;
          });
        }

        // 5. Name match
        if (!match && nameVal) {
          const nNorm = normalizeStr(nameVal);
          match = allRegs.find(db => {
            const dbFullName = normalizeStr(`${db.first_name || ""} ${db.last_name || ""}`);
            return dbFullName === nNorm;
          });
        }

        if (match) {
          matched++;
          matchedIds.add(match.id);
        } else {
          unmatched.push({
            row: i + 2,
            ref: refVal,
            saf: safVal,
            aadhaar: aadhVal,
            name: nameVal,
            phone: phoneVal
          });
        }
      }

      fileReport.sheets.push({
        sheetName,
        batchName: detectedBatch,
        totalRows: rows.length,
        matchedCount: matched,
        uniqueMatchedIds: matchedIds.size,
        unmatchedCount: unmatched.length,
        unmatchedSample: unmatched.slice(0, 3)
      });
    }

    auditResults.push(fileReport);
  }

  // Print results
  console.log("\n=======================================================");
  console.log("             COMPREHENSIVE 12-FILE AUDIT REPORT        ");
  console.log("=======================================================\n");

  let grandTotalRows = 0;
  let grandTotalMatched = 0;
  let grandTotalUnmatched = 0;
  let grandTotalBatches = 0;

  for (const f of auditResults) {
    const filename = f.file.replace(/^batch\//, "");
    console.log(`\n📁 File: ${filename}`);
    console.log(`-------------------------------------------------------`);
    for (const s of f.sheets) {
      grandTotalBatches++;
      grandTotalRows += s.totalRows;
      grandTotalMatched += s.matchedCount;
      grandTotalUnmatched += s.unmatchedCount;
      const status = s.unmatchedCount === 0 ? "✅ 100% Matched" : `⚠️ ${s.unmatchedCount} Unmatched`;
      console.log(`  • Sheet: "${s.sheetName}"`);
      console.log(`    Batch ID: ${s.batchName}`);
      console.log(`    Rows: ${s.totalRows} | Matched: ${s.matchedCount} | ${status}`);
      if (s.unmatchedCount > 0) {
        console.log(`    Unmatched details:`, JSON.stringify(s.unmatchedSample, null, 2));
      }
    }
  }

  console.log(`\n=======================================================`);
  console.log(`SUMMARY ACROSS ALL 12 FILES:`);
  console.log(`  Total Batches Found: ${grandTotalBatches}`);
  console.log(`  Total Excel Rows: ${grandTotalRows}`);
  console.log(`  Total Live DB Matched: ${grandTotalMatched}`);
  console.log(`  Total Unmatched: ${grandTotalUnmatched}`);
  console.log(`  Overall Accuracy: ${((grandTotalMatched / grandTotalRows) * 100).toFixed(2)}%`);
  console.log(`=======================================================\n`);
}

runAudit();
