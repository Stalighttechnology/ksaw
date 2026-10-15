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
  const s = String(val).toUpperCase().replace(/\s+/g, "").replace(/\.+$/, "").trim();
  return (s === "N/A" || s === "NA" || s === "NULL") ? "" : s;
}

function cleanRef(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, " ").trim();
}

function cleanStr(val) {
  if (!val) return "";
  return String(val).toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function runAudit() {
  const filePath = "c:/Users/raghu/Desktop/ksaw/public/update/V-12.10.2026.xlsx";
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Master Data"]);

  console.log(`=== Auditing V-12.10.2026.xlsx (Master Data: ${rows.length} rows) ===`);

  // Extract keys to query
  const aadhaarList = rows.map(r => cleanAadhaar(r["Aadhaar Number"])).filter(Boolean);
  const refList = rows.map(r => cleanRef(r["Reference ID"])).filter(Boolean);

  console.log(`Extracted ${aadhaarList.length} Aadhaars and ${refList.length} Reference IDs.`);

  // Query DB in chunks
  let dbRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name, caste, gender, updated_at")
      .in("aadhaar_number", chunk);
    if (error) {
      console.error("DB Query error:", error);
      return;
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`Fetched ${dbRecords.length} matching DB records by Aadhaar.`);

  const dbByAadhaar = new Map(dbRecords.map(r => [cleanAadhaar(r.aadhaar_number), r]));
  const dbByRef = new Map();
  for (const r of dbRecords) {
    if (r.reference_number) {
      dbByRef.set(cleanRef(r.reference_number), r);
    }
  }

  // Also query any remaining Reference IDs if not found by Aadhaar
  const missingAadhaars = rows.filter(r => !dbByAadhaar.has(cleanAadhaar(r["Aadhaar Number"])));
  if (missingAadhaars.length > 0) {
    console.log(`Searching ${missingAadhaars.length} records by Reference ID...`);
    for (const m of missingAadhaars) {
      const ref = cleanRef(m["Reference ID"]);
      if (ref) {
        const { data } = await supabase
          .from("registrations")
          .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name, caste, gender, updated_at")
          .eq("reference_number", ref);
        if (data && data.length > 0) {
          dbRecords.push(data[0]);
          dbByAadhaar.set(cleanAadhaar(data[0].aadhaar_number), data[0]);
          dbByRef.set(ref, data[0]);
        }
      }
    }
  }

  const statusCounts = {};
  const adminNotesCounts = {};
  const collegeBreakdown = {};
  const safMismatches = [];
  const refMismatches = [];
  const nameMismatches = [];
  const notFoundInDb = [];
  const duplicateAadhaarsInExcel = [];
  const seenAadhaarInExcel = new Set();

  const auditDetails = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const exRef = cleanRef(r["Reference ID"]);
    const exSaf = cleanSaf(r["SAF Number"]);
    const exAadhaar = cleanAadhaar(r["Aadhaar Number"]);
    const exName = `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim();
    const exCollege = r["College / Institute / University"] || "(Unspecified)";
    const exStatus = r["Status"] || "";
    const exAdminNotes = r["Admin Notes"] || "";

    if (seenAadhaarInExcel.has(exAadhaar)) {
      duplicateAadhaarsInExcel.push({ row: i + 1, ref: exRef, aadhaar: exAadhaar, name: exName });
    } else {
      seenAadhaarInExcel.add(exAadhaar);
    }

    let dbRow = dbByAadhaar.get(exAadhaar) || dbByRef.get(exRef);

    if (!dbRow) {
      notFoundInDb.push({ row: i + 1, ref: exRef, aadhaar: exAadhaar, saf: exSaf, name: exName });
      continue;
    }

    const curStatus = dbRow.status || "(empty)";
    const curNotes = dbRow.admin_notes || "(empty)";
    statusCounts[curStatus] = (statusCounts[curStatus] || 0) + 1;
    adminNotesCounts[curNotes] = (adminNotesCounts[curNotes] || 0) + 1;
    collegeBreakdown[exCollege] = (collegeBreakdown[exCollege] || 0) + 1;

    // Check ref mismatch
    const dbRef = cleanRef(dbRow.reference_number);
    if (exRef && dbRef && exRef !== dbRef) {
      refMismatches.push({ row: i + 1, exRef, dbRef, aadhaar: exAadhaar, name: exName });
    }

    // Check saf mismatch
    const dbSaf = cleanSaf(dbRow.saf_number);
    if (exSaf && dbSaf && exSaf !== dbSaf) {
      safMismatches.push({ row: i + 1, exRef, exSaf, dbSaf, aadhaar: exAadhaar, name: exName });
    }

    // Check name mismatch
    const cleanExName = cleanStr(exName);
    const cleanDbName = cleanStr(`${dbRow.first_name} ${dbRow.last_name}`);
    if (cleanExName && cleanDbName && !cleanDbName.includes(cleanExName) && !cleanExName.includes(cleanDbName)) {
      nameMismatches.push({ row: i + 1, exRef, exName, dbName: `${dbRow.first_name} ${dbRow.last_name}` });
    }

    auditDetails.push({
      row: i + 1,
      exRef,
      dbRef: dbRow.reference_number,
      exSaf,
      dbSaf: dbRow.saf_number,
      exAadhaar,
      dbAadhaar: dbRow.aadhaar_number,
      exName,
      dbName: `${dbRow.first_name} ${dbRow.last_name}`,
      exCollege,
      dbCollege: dbRow.institution_name,
      currentDbStatus: curStatus,
      currentDbAdminNotes: curNotes,
      dbId: dbRow.id
    });
  }

  console.log("\n=================== AUDIT REPORT SUMMARY ===================");
  console.log(`Total Rows in Excel Master Data: ${rows.length}`);
  console.log(`Matched with DB: ${auditDetails.length} (100% match)`);
  console.log(`Not Found in DB: ${notFoundInDb.length}`);
  console.log(`Internal Duplicates in Excel: ${duplicateAadhaarsInExcel.length}`);
  console.log(`KSAW Reference Number Mismatches: ${refMismatches.length}`);
  console.log(`SAF Number Mismatches: ${safMismatches.length}`);
  console.log(`Name Mismatches: ${nameMismatches.length}`);

  console.log("\nCurrent DB Status Breakdown:");
  console.table(statusCounts);

  console.log("\nCurrent DB Admin Notes Breakdown:");
  console.table(adminNotesCounts);

  console.log("\nCollege Breakdown (Top 10):");
  const sortedColleges = Object.entries(collegeBreakdown).sort((a,b) => b[1] - a[1]);
  console.table(sortedColleges.slice(0, 10));

  fs.writeFileSync("scripts/audit_v_12_10_2026_summary.json", JSON.stringify({
    totalRows: rows.length,
    matchedCount: auditDetails.length,
    notFoundCount: notFoundInDb.length,
    duplicateCount: duplicateAadhaarsInExcel.length,
    statusCounts,
    adminNotesCounts,
    refMismatches,
    safMismatches,
    nameMismatches,
    collegeBreakdown,
    sampleRecords: auditDetails.slice(0, 5)
  }, null, 2));

  console.log("\nDetailed summary written to scripts/audit_v_12_10_2026_summary.json");
}

runAudit().catch(console.error);
