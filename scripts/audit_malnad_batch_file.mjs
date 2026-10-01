import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

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

async function auditBatchFile() {
  const filePath = "batch/Malnad batch wise list( 22-09-26).xlsx";
  const wb = xlsx.readFile(filePath);

  console.log("==========================================================================");
  console.log("=== AUDIT REPORT: Malnad Batch Wise List (22-09-26) ===");
  console.log("==========================================================================");

  let totalExcelRows = 0;
  const allSheetResults = [];

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);
    totalExcelRows += rows.length;

    const sheetSummary = {
      sheetName,
      totalRows: rows.length,
      exactMatches: [],
      partialMatches: [],
      unmatched: [],
      duplicatesInSheet: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const refId = normalizeRef(r["Reference ID"]);
      const safNo = normalizeSaf(r["SAF Number"]);
      const aadhaar = normalizeAadhaar(r["Aadhaar Number"]);
      const firstName = String(r["First Name"] || "").trim();
      const lastName = String(r["Last Name"] || "").trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const batchId = String(r["Batch ID"] || sheetName).trim();

      // Look up in database
      // 1. By SAF Number
      let query = supabase.from("registrations").select("*");
      let matchedBy = "";
      let dbRecord = null;

      if (safNo) {
        const { data } = await supabase.from("registrations").select("*").eq("saf_number", safNo);
        if (data && data.length > 0) {
          dbRecord = data[0];
          matchedBy = "SAF Number";
        }
      }

      // 2. By Reference ID if not found by SAF
      if (!dbRecord && refId) {
        const { data } = await supabase.from("registrations").select("*").ilike("reference_number", `%${refId.replace("KSAW ", "").replace("KSAW", "")}%`);
        if (data && data.length > 0) {
          dbRecord = data.find(d => normalizeRef(d.reference_number) === refId) || data[0];
          matchedBy = "Reference ID";
        }
      }

      // 3. By Aadhaar if not found
      if (!dbRecord && aadhaar && aadhaar.length >= 12) {
        const { data } = await supabase.from("registrations").select("*").eq("aadhaar_number", aadhaar);
        if (data && data.length > 0) {
          dbRecord = data[0];
          matchedBy = "Aadhaar Number";
        }
      }

      const itemReport = {
        rowNum: i + 2,
        excelRef: refId,
        excelSaf: safNo,
        excelAadhaar: aadhaar,
        excelName: fullName,
        batchId: batchId,
      };

      if (dbRecord) {
        const dbAadhaar = normalizeAadhaar(dbRecord.aadhaar_number);
        const dbSaf = normalizeSaf(dbRecord.saf_number);
        const dbRef = normalizeRef(dbRecord.reference_number);
        const dbName = `${dbRecord.first_name || ""} ${dbRecord.last_name || ""}`.trim();

        const aadhaarMatch = !aadhaar || !dbAadhaar || aadhaar === dbAadhaar;
        const nameMatch = !firstName || normalizeStr(dbName).includes(normalizeStr(firstName)) || normalizeStr(firstName).includes(normalizeStr(dbName));

        itemReport.dbId = dbRecord.id;
        itemReport.dbRef = dbRef;
        itemReport.dbSaf = dbSaf;
        itemReport.dbAadhaar = dbAadhaar;
        itemReport.dbName = dbName;
        itemReport.dbStatus = dbRecord.status;
        itemReport.dbBatch = dbRecord.batch_name || "None";
        itemReport.matchedBy = matchedBy;
        itemReport.aadhaarMatch = aadhaarMatch;
        itemReport.nameMatch = nameMatch;

        if (aadhaarMatch && nameMatch) {
          sheetSummary.exactMatches.push(itemReport);
        } else {
          sheetSummary.partialMatches.push(itemReport);
        }
      } else {
        sheetSummary.unmatched.push(itemReport);
      }
    }

    allSheetResults.push(sheetSummary);
  }

  // Print Report
  console.log(`Total Sheets: ${wb.SheetNames.length}`);
  console.log(`Total Excel Rows: ${totalExcelRows}`);
  console.log("--------------------------------------------------------------------------\n");

  let grandTotalExact = 0;
  let grandTotalPartial = 0;
  let grandTotalUnmatched = 0;

  for (const s of allSheetResults) {
    grandTotalExact += s.exactMatches.length;
    grandTotalPartial += s.partialMatches.length;
    grandTotalUnmatched += s.unmatched.length;

    console.log(`📌 SHEET: ${s.sheetName}`);
    console.log(`   - Total Rows: ${s.totalRows}`);
    console.log(`   - ✅ 100% Verified Matches: ${s.exactMatches.length} / ${s.totalRows}`);
    console.log(`   - ⚠️ Partial Matches (Flagged): ${s.partialMatches.length}`);
    console.log(`   - ❌ Unmatched (Not Found): ${s.unmatched.length}`);

    if (s.partialMatches.length > 0) {
      console.log(`   [Partial Match Details]:`);
      s.partialMatches.forEach(p => {
        console.log(`     Row ${p.rowNum}: Excel[${p.excelRef}, ${p.excelSaf}, ${p.excelName}, Aadhaar:${p.excelAadhaar}] vs DB[${p.dbRef}, ${p.dbSaf}, ${p.dbName}, Aadhaar:${p.dbAadhaar}]`);
      });
    }

    if (s.unmatched.length > 0) {
      console.log(`   [Unmatched Details]:`);
      s.unmatched.forEach(u => {
        console.log(`     Row ${u.rowNum}: Excel[${u.excelRef}, ${u.excelSaf}, ${u.excelName}, Aadhaar:${u.excelAadhaar}]`);
      });
    }
    console.log("");
  }

  console.log("==========================================================================");
  console.log("=== GRAND SUMMARY ===");
  console.log(`=== Total Records: ${totalExcelRows}`);
  console.log(`=== ✅ Total Ready for Batch Assignment: ${grandTotalExact} (${((grandTotalExact/totalExcelRows)*100).toFixed(1)}%)`);
  console.log(`=== ⚠️ Total Flagged for Review: ${grandTotalPartial}`);
  console.log(`=== ❌ Total Unmatched: ${grandTotalUnmatched}`);
  console.log("==========================================================================");
}

auditBatchFile().catch(console.error);
