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

async function runAudit() {
  console.log("Loading all DB registrations for fast matching...");
  let allDbRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name, category, gender")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allDbRows = allDbRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Loaded ${allDbRows.length} DB records.\n`);

  const cleanRef = (r) => (r ? String(r).trim().toUpperCase().replace(/\s+/g, " ") : "");
  const cleanAadhaar = (a) => (a ? String(a).replace(/\D/g, "") : "");
  const cleanSaf = (s) => (s ? String(s).trim().toUpperCase() : "");

  const folder = path.resolve(__dirname, "../approved to dept");
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".xlsx")).sort();

  console.log(`Found ${files.length} Excel files in "${folder}":\n`);

  const totalOverallMatchedIds = new Set();
  const fileReports = [];

  for (const file of files) {
    const filePath = path.join(folder, file);
    const wb = xlsx.readFile(filePath);

    let fileTotalRows = 0;
    let fileMatchedCount = 0;
    let fileMatchedByRef = 0;
    let fileMatchedByAadhaar = 0;
    let fileMatchedBySaf = 0;
    let fileUnmatchedCount = 0;

    const fileMatchedIds = new Set();
    const curStatuses = {};

    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (rawRows.length < 2) continue;

      // Find header row
      let headerRowIdx = -1;
      let refIdx = -1;
      let safIdx = -1;
      let aadhaarIdx = -1;
      let fnIdx = -1;
      let lnIdx = -1;

      for (let rIdx = 0; rIdx < Math.min(10, rawRows.length); rIdx++) {
        const row = rawRows[rIdx].map((c) => String(c).trim().toLowerCase());
        const findCol = (candidates) => row.findIndex((h) => candidates.some((c) => h.includes(c)));

        const fRef = findCol(["reference", "ref no", "app_no", "reg", "sl no"]);
        const fSaf = findCol(["saf", "saf_no", "saf id", "safid"]);
        const fAadhaar = findCol(["aadhaar", "adhar", "uid", "aadhar"]);
        const fFn = findCol(["first name", "firstname", "name", "candidate"]);
        const fLn = findCol(["last name", "lastname", "surname"]);

        if (fSaf !== -1 || fAadhaar !== -1 || (fRef !== -1 && fFn !== -1)) {
          headerRowIdx = rIdx;
          refIdx = fRef;
          safIdx = fSaf;
          aadhaarIdx = fAadhaar;
          fnIdx = fFn;
          lnIdx = fLn;
          break;
        }
      }

      if (headerRowIdx === -1) {
        // Fallback to first row
        headerRowIdx = 0;
      }

      for (let rIdx = headerRowIdx + 1; rIdx < rawRows.length; rIdx++) {
        const row = rawRows[rIdx];
        if (!row || row.every((c) => String(c).trim() === "")) continue;

        const rawRef = refIdx !== -1 ? row[refIdx] : "";
        const rawSaf = safIdx !== -1 ? row[safIdx] : "";
        const rawAadhaar = aadhaarIdx !== -1 ? row[aadhaarIdx] : "";
        const rawName = `${fnIdx !== -1 ? row[fnIdx] : ""} ${lnIdx !== -1 ? row[lnIdx] : ""}`.trim();

        const cRef = cleanRef(rawRef);
        const cAadhaar = cleanAadhaar(rawAadhaar);
        const cSaf = cleanSaf(rawSaf);

        if (!cRef && !cAadhaar && !cSaf && !rawName) continue;

        fileTotalRows++;

        const match = allDbRows.find((p) => {
          const pRef = cleanRef(p.reference_number);
          const pAadhaar = cleanAadhaar(p.aadhaar_number);
          const pSaf = cleanSaf(p.saf_number);

          if (cRef && pRef && pRef === cRef) return true;
          if (cAadhaar && pAadhaar && cAadhaar.length >= 10 && pAadhaar === cAadhaar) return true;
          if (cSaf && pSaf && cSaf.startsWith("SAF") && pSaf === cSaf) return true;
          return false;
        });

        if (match) {
          fileMatchedCount++;
          if (cRef && cleanRef(match.reference_number) === cRef) fileMatchedByRef++;
          else if (cAadhaar && cleanAadhaar(match.aadhaar_number) === cAadhaar) fileMatchedByAadhaar++;
          else fileMatchedBySaf++;

          fileMatchedIds.add(match.id);
          totalOverallMatchedIds.add(match.id);

          const st = match.status || "Pending";
          curStatuses[st] = (curStatuses[st] || 0) + 1;
        } else {
          fileUnmatchedCount++;
        }
      }
    }

    fileReports.push({
      file,
      totalRows: fileTotalRows,
      matched: fileMatchedCount,
      uniqueMatched: fileMatchedIds.size,
      byRef: fileMatchedByRef,
      byAadhaar: fileMatchedByAadhaar,
      bySaf: fileMatchedBySaf,
      unmatched: fileUnmatchedCount,
      curStatuses,
    });
  }

  console.log("=== FILE BY FILE AUDIT REPORT ===");
  fileReports.forEach((r, idx) => {
    console.log(`\n${idx + 1}. [${r.file}]`);
    console.log(`   - Total Data Rows: ${r.totalRows}`);
    console.log(`   - Matched: ${r.matched} (Unique DB Applicants: ${r.uniqueMatched})`);
    console.log(`     (By Ref: ${r.byRef} | By Aadhaar: ${r.byAadhaar} | By SAF: ${r.bySaf})`);
    console.log(`   - Unmatched: ${r.unmatched}`);
    console.log(`   - Current DB Statuses:`, r.curStatuses);
  });

  console.log("\n=========================================================================");
  console.log("=== OVERALL CONSOLIDATED SUMMARY ===");
  console.log(`Total Files Checked: ${files.length}`);
  console.log(`Total Excel Rows Processed: ${fileReports.reduce((s, r) => s + r.totalRows, 0)}`);
  console.log(`Total Matches Found across all sheets: ${fileReports.reduce((s, r) => s + r.matched, 0)}`);
  console.log(`Total DISTINCT Database Applicants Matched: ${totalOverallMatchedIds.size}`);
  console.log("=========================================================================");
}

runAudit();
