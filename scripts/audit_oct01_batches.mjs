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
  "batch/Central college approval list ( 01-10-26).xlsx",
  "batch/KSAWU - B.V.V. Sangha's Mudhol approval list ( 01-10-26).xlsx",
  "batch/KSAWU - Raj Rajeshwari, Rannebenur Approval list ( 01-10-26).xlsx",
  "batch/KSAWU BVVS Akkamahadevi, Bagalokot approval list ( 01-10-26).xlsx",
  "batch/Mandavya approval list ( 01-10-26).xlsx",
  "batch/Minerva approval list ( 01-10-26).xlsx",
  "batch/PES mandya approval list ( 01-10-26).xlsx",
  "batch/Polytechnic Ramnagra-GT Approval list ( 01-10-26).xlsx",
  "batch/Vittal college approval data ( 01-10-26).xlsx"
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

  // Build lookup maps for fast & robust matching
  const aadhaarMap = new Map();
  const safMap = new Map();
  const refMap = new Map();
  const phoneMap = new Map();
  const nameMap = new Map();

  for (const reg of allRegs) {
    const aadh = normalizeAadhaar(reg.aadhaar_number);
    if (aadh && aadh.length >= 10) aadhaarMap.set(aadh, reg);

    const saf = normalizeSaf(reg.saf_number);
    if (saf) {
      safMap.set(saf, reg);
      safMap.set(saf.replace(/\.+$/, ""), reg);
    }

    const ref = normalizeRef(reg.reference_number).replace(/\s+/g, "");
    if (ref) {
      refMap.set(ref, reg);
      refMap.set(ref.replace(/0+/g, ""), reg);
      // also handle with/without KSAW prefix
      const numOnly = ref.replace(/^[^\d]+/, "");
      if (numOnly) refMap.set(numOnly, reg);
    }

    const ph = String(reg.phone || "").replace(/\D/g, "").slice(-10);
    if (ph && ph.length === 10) {
      if (!phoneMap.has(ph)) phoneMap.set(ph, []);
      phoneMap.get(ph).push(reg);
    }

    const fullName = normalizeStr(`${reg.first_name || ""} ${reg.last_name || ""}`);
    if (fullName) {
      if (!nameMap.has(fullName)) nameMap.set(fullName, []);
      nameMap.get(fullName).push(reg);
    }
  }

  const auditResults = [];

  for (const filePath of FILES_TO_AUDIT) {
    if (!fs.existsSync(filePath)) {
      auditResults.push({ file: filePath, error: "File not found", sheets: [] });
      continue;
    }

    const fileReport = { file: filePath, sheets: [] };
    const wb = xlsx.readFile(filePath);

    for (const sheetName of wb.SheetNames) {
      // Check if it's a summary/metadata sheet
      if (/batch\s*id\s*report|summary|overview/i.test(sheetName.trim())) {
        fileReport.sheets.push({
          sheetName,
          isSummary: true,
          totalRows: 0,
          matchedCount: 0,
          unmatchedCount: 0,
          batchName: "N/A (Summary Sheet)"
        });
        continue;
      }

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
      const matchedDetails = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const refVal = refCol ? normalizeRef(r[refCol]) : "";
        const safVal = safCol ? normalizeSaf(r[safCol]) : "";
        const aadhVal = aadhCol ? normalizeAadhaar(r[aadhCol]) : "";
        const nameVal = nameCol ? String(r[nameCol]).trim() : "";
        const phoneVal = phoneCol ? String(r[phoneCol]).replace(/\D/g, "").slice(-10) : "";

        let match = null;
        let matchMethod = "";

        // 1. Aadhaar (12 digits)
        if (aadhVal && aadhVal.length >= 10 && aadhaarMap.has(aadhVal)) {
          match = aadhaarMap.get(aadhVal);
          matchMethod = "Aadhaar";
        }

        // 2. SAF Number
        if (!match && safVal) {
          const cleanSaf = safVal.replace(/\.+$/, "");
          if (safMap.has(cleanSaf)) {
            match = safMap.get(cleanSaf);
            matchMethod = "SAF Number";
          }
        }

        // 3. Reference ID
        if (!match && refVal) {
          const cleanRef = refVal.replace(/\s+/g, "");
          if (refMap.has(cleanRef)) {
            match = refMap.get(cleanRef);
            matchMethod = "Reference ID";
          } else if (refMap.has(cleanRef.replace(/0+/g, ""))) {
            match = refMap.get(cleanRef.replace(/0+/g, ""));
            matchMethod = "Reference ID (zero-stripped)";
          } else {
            const numOnly = cleanRef.replace(/^[^\d]+/, "");
            if (numOnly && refMap.has(numOnly)) {
              match = refMap.get(numOnly);
              matchMethod = "Reference ID (Numeric)";
            }
          }
        }

        // 4. Phone match with name verification
        if (!match && phoneVal && phoneVal.length === 10 && phoneMap.has(phoneVal)) {
          const cands = phoneMap.get(phoneVal);
          if (cands.length === 1) {
            match = cands[0];
            matchMethod = "Phone";
          } else if (nameVal) {
            const nNorm = normalizeStr(nameVal);
            const found = cands.find(c => normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`).includes(nNorm) || nNorm.includes(normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`)));
            if (found) {
              match = found;
              matchMethod = "Phone + Name";
            }
          }
        }

        // 5. Name match (exact full name)
        if (!match && nameVal) {
          const nNorm = normalizeStr(nameVal);
          if (nameMap.has(nNorm)) {
            const cands = nameMap.get(nNorm);
            if (cands.length === 1) {
              match = cands[0];
              matchMethod = "Candidate Name";
            }
          }
        }

        if (match) {
          matched++;
          matchedIds.add(match.id);
          matchedDetails.push({
            row: i + 2,
            excelRef: refVal,
            excelSaf: safVal,
            excelAadhaar: aadhVal,
            excelName: nameVal,
            dbId: match.id,
            dbRef: match.reference_number,
            dbName: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
            matchMethod
          });
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
        unmatchedList: unmatched,
        matchedDetails
      });
    }

    auditResults.push(fileReport);
  }

  // Save audit data to scratch for reference
  fs.writeFileSync("scripts/audit_oct01_results.json", JSON.stringify(auditResults, null, 2));

  // Print results
  console.log("\n=======================================================");
  console.log("             OCTOBER 01 BATCH AUDIT REPORT            ");
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
      if (s.isSummary) {
        console.log(`  • Sheet: "${s.sheetName}" -> [Summary Sheet Skipped]`);
        continue;
      }
      grandTotalBatches++;
      grandTotalRows += s.totalRows;
      grandTotalMatched += s.matchedCount;
      grandTotalUnmatched += s.unmatchedCount;
      const status = s.unmatchedCount === 0 ? "✅ 100% Matched" : `⚠️ ${s.unmatchedCount} Unmatched`;
      console.log(`  • Sheet: "${s.sheetName}"`);
      console.log(`    Batch ID: ${s.batchName}`);
      console.log(`    Rows: ${s.totalRows} | Matched: ${s.matchedCount} | ${status}`);
      if (s.unmatchedCount > 0) {
        console.log(`    Unmatched records:`, JSON.stringify(s.unmatchedList, null, 2));
      }
    }
  }

  console.log(`\n=======================================================`);
  console.log(`SUMMARY ACROSS ALL 9 FILES (01-10-26):`);
  console.log(`  Total Batch Sheets: ${grandTotalBatches}`);
  console.log(`  Total Excel Rows: ${grandTotalRows}`);
  console.log(`  Total Live DB Matched: ${grandTotalMatched}`);
  console.log(`  Total Unmatched: ${grandTotalUnmatched}`);
  console.log(`  Overall Accuracy: ${((grandTotalMatched / grandTotalRows) * 100).toFixed(2)}%`);
  console.log(`=======================================================\n`);
}

runAudit();
