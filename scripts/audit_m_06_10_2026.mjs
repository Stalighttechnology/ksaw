import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const filePath = "c:/Users/raghu/Desktop/ksaw/approved to dept/M-06.10.2026.xlsx";

async function auditM06102026() {
  console.log("=========================================================================");
  console.log("=== Comprehensive Audit for M-06.10.2026.xlsx ===");
  console.log("=========================================================================\n");

  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`Extracted ${rows.length} rows from Master Sheet in M-06.10.2026.xlsx.`);

  const parsed = rows.map((r, idx) => {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
    const aadhaar = String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "");
    const safNo = String(r["SAF Number"] || r["SAF No"] || r["SAF"] || "").trim().toUpperCase();
    const refId = String(r["Reference ID"] || r["Reference Number"] || r["Ref No"] || r["KSAW Ref No"] || "").trim().toUpperCase();
    const firstName = String(r["First Name"] || r["Applicant Name"] || r["Name"] || "").trim();
    const lastName = String(r["Last Name"] || "").trim();
    const center = String(r["Center Location"] || r["Center"] || "").trim();
    const caste = String(r["Caste"] || "").trim();
    const nigama = String(r["Nigama"] || "").trim();
    const rdNo = String(r["RD Number"] || r["RD No"] || "").trim();
    const skill = String(r["Skill Sought / Course"] || r["Skill Sought"] || "").trim();
    const gender = String(r["Gender"] || "").trim();
    const dob = r["Date Of Birth"] || r["DOB"] || "";
    const slNo = r["SL No"] || r["SL NO"] || idx + 1;

    return {
      rowIndex: idx + 1,
      slNo,
      aadhaar,
      safNo,
      refId,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      center,
      caste,
      nigama,
      rdNo,
      skill,
      gender,
      dob,
      raw: r,
    };
  });

  // Check file internal duplicates
  const aadhaarSet = new Set();
  const fileDuplicates = [];
  parsed.forEach((p) => {
    if (p.aadhaar) {
      if (aadhaarSet.has(p.aadhaar)) {
        fileDuplicates.push(p);
      }
      aadhaarSet.add(p.aadhaar);
    }
  });

  console.log(`Valid Aadhaar count: ${parsed.filter((p) => p.aadhaar).length}`);
  console.log(`Unique Aadhaars in Excel: ${aadhaarSet.size}`);
  console.log(`Internal Duplicates in Excel: ${fileDuplicates.length}`);

  // Fetch matching DB records
  const uniqueAadhaars = Array.from(aadhaarSet);
  let dbRecords = [];
  for (let i = 0; i < uniqueAadhaars.length; i += 50) {
    const chunk = uniqueAadhaars.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, dob, gender, caste, nigama, rd_number, center_location, skill_sought, status, admin_notes, institution_name, phone, email")
      .in("aadhaar_number", chunk);

    if (error) {
      console.error("DB Query error:", error);
      return;
    }
    if (data) dbRecords.push(...data);
  }

  console.log(`Matched DB records on Aadhaar: ${dbRecords.length} / ${uniqueAadhaars.length}`);

  const dbByAadhaar = new Map();
  dbRecords.forEach((r) => {
    const a = (r.aadhaar_number || "").toString().trim().replace(/\s+/g, "").replace(/-/g, "");
    if (a) dbByAadhaar.set(a, r);
  });

  // Detailed comparisons
  const matchedRows = [];
  const unmatchedRows = [];
  const statusCounts = {};
  const statusAndNotesCounts = {};
  const centerCounts = {};
  const casteCounts = {};
  const discrepancies = [];

  for (const item of parsed) {
    if (!item.aadhaar) {
      unmatchedRows.push({ ...item, reason: "No Aadhaar in Excel row" });
      continue;
    }
    const dbRec = dbByAadhaar.get(item.aadhaar);
    if (!dbRec) {
      unmatchedRows.push({ ...item, reason: "Aadhaar not found in DB" });
      continue;
    }

    const currentStatus = dbRec.status || "NULL";
    const currentNotes = dbRec.admin_notes || "NULL";
    statusCounts[currentStatus] = (statusCounts[currentStatus] || 0) + 1;
    const combo = `Status: [${currentStatus}] | AdminNotes: [${currentNotes}]`;
    statusAndNotesCounts[combo] = (statusAndNotesCounts[combo] || 0) + 1;

    const cLoc = item.center || dbRec.center_location || "Unknown";
    centerCounts[cLoc] = (centerCounts[cLoc] || 0) + 1;

    const casteVal = item.caste || dbRec.caste || "Unknown";
    casteCounts[casteVal] = (casteCounts[casteVal] || 0) + 1;

    // Check field mismatches
    const rowDisc = [];

    // Name check
    const exNameClean = item.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const dbNameClean = `${dbRec.first_name || ""} ${dbRec.last_name || ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (exNameClean && dbNameClean && exNameClean !== dbNameClean && !dbNameClean.includes(exNameClean) && !exNameClean.includes(dbNameClean)) {
      rowDisc.push({ field: "Name", excel: item.fullName, db: `${dbRec.first_name} ${dbRec.last_name}` });
    }

    // Gender check
    if (item.gender && dbRec.gender && item.gender.toLowerCase() !== dbRec.gender.toLowerCase()) {
      rowDisc.push({ field: "Gender", excel: item.gender, db: dbRec.gender });
    }

    // Caste check
    if (item.caste && dbRec.caste && item.caste.trim().toLowerCase() !== dbRec.caste.trim().toLowerCase()) {
      rowDisc.push({ field: "Caste", excel: item.caste, db: dbRec.caste });
    }

    // RD check
    const exRd = item.rdNo.trim().toUpperCase();
    const dbRd = (dbRec.rd_number || "").trim().toUpperCase();
    if (exRd && dbRd && exRd !== dbRd) {
      rowDisc.push({ field: "RD Number", excel: item.rdNo, db: dbRec.rd_number });
    }

    // Center check
    const exCenter = item.center.trim().toUpperCase();
    const dbCenter = (dbRec.center_location || "").trim().toUpperCase();
    if (exCenter && dbCenter && exCenter !== dbCenter) {
      rowDisc.push({ field: "Center", excel: item.center, db: dbRec.center_location });
    }

    if (rowDisc.length > 0) {
      discrepancies.push({
        row: item.rowIndex,
        sl: item.slNo,
        name: item.fullName,
        aadhaar: item.aadhaar,
        ref: dbRec.reference_number,
        saf: dbRec.saf_number,
        mismatches: rowDisc,
      });
    }

    matchedRows.push({
      item,
      dbRec,
    });
  }

  console.log("\n--- STATUS BREAKDOWN IN DB ---");
  console.log(statusCounts);

  console.log("\n--- STATUS & ADMIN NOTES COMBINATIONS ---");
  console.log(statusAndNotesCounts);

  console.log("\n--- CENTER LOCATION BREAKDOWN ---");
  console.log(centerCounts);

  console.log("\n--- CASTE BREAKDOWN ---");
  console.log(casteCounts);

  console.log("\n--- FIELD DISCREPANCIES ---");
  console.log(`Total rows with minor differences: ${discrepancies.length}`);
  if (discrepancies.length > 0) {
    console.log(JSON.stringify(discrepancies, null, 2));
  }

  // Save full audit details
  fs.writeFileSync(
    "scripts/audit_m_06_10_2026_report.json",
    JSON.stringify(
      {
        totalRows: parsed.length,
        matchedCount: matchedRows.length,
        unmatchedCount: unmatchedRows.length,
        statusCounts,
        statusAndNotesCounts,
        centerCounts,
        casteCounts,
        discrepancies,
        matchedRows,
        unmatchedRows,
      },
      null,
      2
    )
  );

  console.log("\nFull report JSON saved to scripts/audit_m_06_10_2026_report.json");
}

auditM06102026().catch(console.error);
