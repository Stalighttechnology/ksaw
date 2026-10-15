import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function cleanAadhaar(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}

function cleanSaf(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").trim();
}

function cleanRef(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").trim();
}

function cleanStr(val) {
  if (!val) return "";
  return String(val).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function runAudit() {
  console.log("=== Fetching all registrations from Supabase ===");
  let allRegs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name, caste, gender, created_at, updated_at")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) {
      console.error("DB fetch error:", error);
      break;
    }
    if (!data || data.length === 0) break;
    allRegs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Loaded ${allRegs.length} DB records total.`);

  // Build indexes for DB records
  const dbByAadhaar = new Map();
  const dbBySaf = new Map();
  const dbByRef = new Map();

  for (const reg of allRegs) {
    const aadh = cleanAadhaar(reg.aadhaar_number);
    if (aadh) {
      if (!dbByAadhaar.has(aadh)) dbByAadhaar.set(aadh, []);
      dbByAadhaar.get(aadh).push(reg);
    }

    const saf = cleanSaf(reg.saf_number);
    if (saf) {
      if (!dbBySaf.has(saf)) dbBySaf.set(saf, []);
      dbBySaf.get(saf).push(reg);
    }

    const ref = cleanRef(reg.reference_number);
    if (ref) {
      if (!dbByRef.has(ref)) dbByRef.set(ref, []);
      dbByRef.get(ref).push(reg);
      const numOnly = ref.replace(/^[^\d]+/, "");
      if (numOnly) {
        if (!dbByRef.has(numOnly)) dbByRef.set(numOnly, []);
        dbByRef.get(numOnly).push(reg);
      }
    }
  }

  const files = [
    {
      name: "L.-21.09.2026 (2).xlsx",
      path: "c:/Users/raghu/Desktop/ksaw/public/update/L.-21.09.2026 (2).xlsx"
    },
    {
      name: "L.-28.09.2026 (2).xlsx",
      path: "c:/Users/raghu/Desktop/ksaw/public/update/L.-28.09.2026 (2).xlsx"
    }
  ];

  const overallResults = {};

  for (const f of files) {
    console.log(`\n======================================================`);
    console.log(`Analyzing File: ${f.name}`);
    console.log(`======================================================`);

    const wb = xlsx.readFile(f.path);
    const sheetName = wb.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
    console.log(`Sheet: "${sheetName}", Total rows: ${rows.length}`);

    const fileReport = {
      fileName: f.name,
      sheetName,
      totalRows: rows.length,
      matchedByAadhaar: 0,
      matchedBySafOnly: 0,
      matchedByRefOnly: 0,
      notFound: 0,
      dbStatusCounts: {},
      adminNotesCounts: {},
      safMismatches: [],
      nameMismatches: [],
      duplicateRowsInFile: [],
      records: []
    };

    const seenAadhaars = new Map();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const slNo = r["SL No"] || r["SL NO"] || r["SL No_1"] || (i + 1);
      const rawSaf = r["SAF Number"] || r["SAF No"] || r["SAF"] || "";
      const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || r["AadhaarNo"] || "";
      const firstName = r["First Name"] || r["Applicant Name"] || r["Name"] || "";
      const lastName = r["Last Name"] || "";
      const caste = r["Caste"] || "";
      const refCol = r["Reference ID"] || r["Reference Number"] || r["Ref No"] || r["KSAW Number"] || "";

      const aadhaar = cleanAadhaar(rawAadhaar);
      const saf = cleanSaf(rawSaf);
      const ref = cleanRef(refCol);
      const fullName = `${firstName} ${lastName}`.trim();

      // Check duplicate in file
      if (aadhaar) {
        if (seenAadhaars.has(aadhaar)) {
          fileReport.duplicateRowsInFile.push({
            slNo,
            aadhaar,
            saf,
            name: fullName,
            previousRow: seenAadhaars.get(aadhaar)
          });
        } else {
          seenAadhaars.set(aadhaar, slNo);
        }
      }

      // Match against DB
      let matchedDb = null;
      let matchMethod = "none";

      if (aadhaar && dbByAadhaar.has(aadhaar)) {
        matchedDb = dbByAadhaar.get(aadhaar)[0];
        matchMethod = "aadhaar";
        fileReport.matchedByAadhaar++;
      } else if (saf && dbBySaf.has(saf)) {
        matchedDb = dbBySaf.get(saf)[0];
        matchMethod = "saf";
        fileReport.matchedBySafOnly++;
      } else if (ref && dbByRef.has(ref)) {
        matchedDb = dbByRef.get(ref)[0];
        matchMethod = "ref";
        fileReport.matchedByRefOnly++;
      }

      if (!matchedDb) {
        fileReport.notFound++;
        fileReport.records.push({
          row: i + 1,
          slNo,
          aadhaar,
          saf,
          fullName,
          matched: false
        });
        continue;
      }

      // Record matched info
      const dbStatus = matchedDb.status || "(empty)";
      fileReport.dbStatusCounts[dbStatus] = (fileReport.dbStatusCounts[dbStatus] || 0) + 1;

      const adminNotes = matchedDb.admin_notes || "(empty)";
      fileReport.adminNotesCounts[adminNotes] = (fileReport.adminNotesCounts[adminNotes] || 0) + 1;

      // Check SAF discrepancy
      const dbSaf = cleanSaf(matchedDb.saf_number);
      if (saf && dbSaf && saf !== dbSaf) {
        fileReport.safMismatches.push({
          slNo,
          aadhaar,
          excelSaf: saf,
          dbSaf: dbSaf,
          dbRef: matchedDb.reference_number,
          dbName: `${matchedDb.first_name} ${matchedDb.last_name}`
        });
      }

      // Check name discrepancy
      const cleanExName = cleanStr(fullName);
      const cleanDbName = cleanStr(`${matchedDb.first_name} ${matchedDb.last_name}`);
      if (cleanExName && cleanDbName && !cleanDbName.includes(cleanExName) && !cleanExName.includes(cleanDbName)) {
        fileReport.nameMismatches.push({
          slNo,
          aadhaar,
          excelName: fullName,
          dbName: `${matchedDb.first_name} ${matchedDb.last_name}`,
          dbRef: matchedDb.reference_number
        });
      }

      fileReport.records.push({
        row: i + 1,
        slNo,
        excelAadhaar: aadhaar,
        excelSaf: saf,
        excelName: fullName,
        matched: true,
        matchMethod,
        dbId: matchedDb.id,
        dbRef: matchedDb.reference_number,
        dbSaf: matchedDb.saf_number,
        dbAadhaar: matchedDb.aadhaar_number,
        dbName: `${matchedDb.first_name} ${matchedDb.last_name}`,
        dbStatus: matchedDb.status,
        dbAdminNotes: matchedDb.admin_notes
      });
    }

    console.log(`Matched by Aadhaar: ${fileReport.matchedByAadhaar}`);
    console.log(`Matched by SAF only: ${fileReport.matchedBySafOnly}`);
    console.log(`Matched by Ref only: ${fileReport.matchedByRefOnly}`);
    console.log(`Not Found in DB: ${fileReport.notFound}`);
    console.log(`Duplicate Aadhaars in File: ${fileReport.duplicateRowsInFile.length}`);
    console.log(`SAF Mismatches: ${fileReport.safMismatches.length}`);
    console.log(`Name Mismatches: ${fileReport.nameMismatches.length}`);
    console.log("\nDatabase Status Distribution:");
    console.table(fileReport.dbStatusCounts);
    console.log("\nAdmin Notes Distribution:");
    console.table(fileReport.adminNotesCounts);

    overallResults[f.name] = fileReport;
  }

  // Cross-file overlap check
  console.log("\n======================================================");
  console.log("Cross-File Overlap Analysis");
  console.log("======================================================");
  const file1Aadhaars = new Set(overallResults["L.-21.09.2026 (2).xlsx"].records.filter(r => r.matched).map(r => r.excelAadhaar));
  const file2Aadhaars = new Set(overallResults["L.-28.09.2026 (2).xlsx"].records.filter(r => r.matched).map(r => r.excelAadhaar));

  const overlaps = [];
  for (const a of file1Aadhaars) {
    if (file2Aadhaars.has(a)) overlaps.push(a);
  }
  console.log(`Overlapping records between both files: ${overlaps.length}`);

  // Write detailed report to JSON for inspection
  fs.writeFileSync("scripts/tagged_files_audit_summary.json", JSON.stringify({
    summary: {
      file1: {
        name: "L.-21.09.2026 (2).xlsx",
        total: overallResults["L.-21.09.2026 (2).xlsx"].totalRows,
        matchedByAadhaar: overallResults["L.-21.09.2026 (2).xlsx"].matchedByAadhaar,
        notFound: overallResults["L.-21.09.2026 (2).xlsx"].notFound,
        statusCounts: overallResults["L.-21.09.2026 (2).xlsx"].dbStatusCounts,
        adminNotesCounts: overallResults["L.-21.09.2026 (2).xlsx"].adminNotesCounts,
        safMismatches: overallResults["L.-21.09.2026 (2).xlsx"].safMismatches,
        duplicateRowsInFile: overallResults["L.-21.09.2026 (2).xlsx"].duplicateRowsInFile
      },
      file2: {
        name: "L.-28.09.2026 (2).xlsx",
        total: overallResults["L.-28.09.2026 (2).xlsx"].totalRows,
        matchedByAadhaar: overallResults["L.-28.09.2026 (2).xlsx"].matchedByAadhaar,
        notFound: overallResults["L.-28.09.2026 (2).xlsx"].notFound,
        statusCounts: overallResults["L.-28.09.2026 (2).xlsx"].dbStatusCounts,
        adminNotesCounts: overallResults["L.-28.09.2026 (2).xlsx"].adminNotesCounts,
        safMismatches: overallResults["L.-28.09.2026 (2).xlsx"].safMismatches,
        duplicateRowsInFile: overallResults["L.-28.09.2026 (2).xlsx"].duplicateRowsInFile
      },
      crossFileOverlapCount: overlaps.length
    }
  }, null, 2));

  console.log("\nSummary written to scripts/tagged_files_audit_summary.json");
}

runAudit().catch(console.error);
