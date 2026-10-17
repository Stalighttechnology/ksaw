import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const filePath = "c:/Users/raghu/Desktop/ksaw/public/update/L.-21.09.2026 Final (1).xlsx";

function excelDateToString(val) {
  if (!val) return "";
  if (typeof val === "number") {
    // Excel date epoch starts on 1899-12-30
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split("T")[0];
  }
  return String(val).trim();
}

async function audit() {
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

  console.log(`Auditing file: ${filePath}`);
  console.log(`Total rows in Excel: ${rows.length}`);

  const excelItems = rows.map((r, idx) => {
    const rawAadhaar = String(r["Aadhaar Number"] || "").trim().replace(/\s+/g, "").replace(/-/g, "");
    const saf = String(r["SAF Number"] || "").trim();
    const firstName = String(r["First Name"] || "").trim();
    const lastName = String(r["Last Name"] || "").trim();
    const center = String(r["Center Location"] || "").trim();
    const dob = excelDateToString(r["Date Of Birth"]);
    const gender = String(r["Gender"] || "").trim();
    const caste = String(r["Caste"] || "").trim();
    const rd = String(r["RD Number"] || "").trim();
    const course = String(r["Skill Sought / Course"] || "").trim();
    const slNo = r["SL No"] || idx + 1;

    return {
      slNo,
      aadhaar: rawAadhaar,
      saf,
      firstName,
      lastName,
      center,
      dob,
      gender,
      caste,
      rd,
      course,
      raw: r
    };
  });

  const aadhaars = excelItems.map(x => x.aadhaar).filter(Boolean);
  const safs = excelItems.map(x => x.saf).filter(Boolean);

  // Fetch from DB by Aadhaar
  const { data: dbByAadhaarData, error: err1 } = await supabase
    .from("registrations")
    .select("*")
    .in("aadhaar_number", aadhaars);

  if (err1) {
    console.error("DB error (Aadhaar):", err1);
    return;
  }

  // Also query by SAF in case Aadhaar was mismatched
  const { data: dbBySafData, error: err2 } = await supabase
    .from("registrations")
    .select("*")
    .in("saf_number", safs);

  if (err2) {
    console.error("DB error (SAF):", err2);
    return;
  }

  const dbAadhaarMap = new Map();
  for (const r of dbByAadhaarData || []) {
    dbAadhaarMap.set(String(r.aadhaar_number).trim(), r);
  }

  const dbSafMap = new Map();
  for (const r of dbBySafData || []) {
    dbSafMap.set(String(r.saf_number).trim(), r);
  }

  console.log(`Matched by Aadhaar in DB: ${dbAadhaarMap.size}`);
  console.log(`Matched by SAF in DB: ${dbSafMap.size}`);

  const report = [];

  for (const item of excelItems) {
    let dbMatch = dbAadhaarMap.get(item.aadhaar);
    let matchedBy = "Aadhaar";

    if (!dbMatch) {
      dbMatch = dbSafMap.get(item.saf);
      if (dbMatch) {
        matchedBy = "SAF (Aadhaar did not match)";
      }
    }

    if (!dbMatch) {
      report.push({
        slNo: item.slNo,
        excelAadhaar: item.aadhaar,
        excelSaf: item.saf,
        excelName: `${item.firstName} ${item.lastName}`,
        status: "NOT_FOUND_IN_DB",
        dbRecord: null,
        discrepancies: ["Record not found in Supabase database registrations table"]
      });
      continue;
    }

    const discrepancies = [];

    // Compare Aadhaar
    const dbAadhaar = String(dbMatch.aadhaar_number || "").trim();
    if (dbAadhaar !== item.aadhaar) {
      discrepancies.push(`Aadhaar mismatch: Excel="${item.aadhaar}" vs DB="${dbAadhaar}"`);
    }

    // Compare SAF
    const dbSaf = String(dbMatch.saf_number || "").trim();
    if (dbSaf !== item.saf) {
      discrepancies.push(`SAF mismatch: Excel="${item.saf}" vs DB="${dbSaf}"`);
    }

    // Compare Name
    const excelFullName = `${item.firstName} ${item.lastName}`.trim().toLowerCase();
    const dbFullName = `${dbMatch.first_name || ""} ${dbMatch.last_name || ""}`.trim().toLowerCase();
    if (excelFullName !== dbFullName) {
      discrepancies.push(`Name diff: Excel="${item.firstName} ${item.lastName}" vs DB="${dbMatch.first_name || ""} ${dbMatch.last_name || ""}"`);
    }

    // Compare Center Location
    const dbCenter = String(dbMatch.center_location || "").trim().toLowerCase();
    const exCenter = item.center.toLowerCase();
    if (dbCenter && exCenter && dbCenter !== exCenter) {
      discrepancies.push(`Center diff: Excel="${item.center}" vs DB="${dbMatch.center_location}"`);
    }

    // Compare Gender
    const dbGender = String(dbMatch.gender || "").trim().toLowerCase();
    const exGender = item.gender.toLowerCase();
    if (dbGender && exGender && dbGender !== exGender) {
      discrepancies.push(`Gender diff: Excel="${item.gender}" vs DB="${dbMatch.gender}"`);
    }

    // Compare Caste
    const dbCaste = String(dbMatch.caste || "").trim().toLowerCase();
    const exCaste = item.caste.toLowerCase();
    if (dbCaste && exCaste && !dbCaste.includes(exCaste) && !exCaste.includes(dbCaste)) {
      discrepancies.push(`Caste diff: Excel="${item.caste}" vs DB="${dbMatch.caste}"`);
    }

    // Compare RD Number
    const dbRd = String(dbMatch.rd_number || "").trim();
    if (item.rd && dbRd && item.rd !== dbRd) {
      discrepancies.push(`RD diff: Excel="${item.rd}" vs DB="${dbRd}"`);
    }

    // Compare Course / Skill
    const dbCourse = String(dbMatch.skill_sought || "").trim().toLowerCase();
    const exCourse = item.course.toLowerCase();
    if (dbCourse && exCourse && !dbCourse.includes(exCourse) && !exCourse.includes(dbCourse)) {
      discrepancies.push(`Skill/Course diff: Excel="${item.course}" vs DB="${dbMatch.skill_sought}"`);
    }

    // Compare DOB
    const dbDob = String(dbMatch.dob || "").trim();
    if (item.dob && dbDob && item.dob !== dbDob) {
      discrepancies.push(`DOB diff: Excel="${item.dob}" vs DB="${dbDob}"`);
    }

    report.push({
      slNo: item.slNo,
      ksawRef: dbMatch.reference_number || "NO_REF",
      excelSaf: item.saf,
      dbSaf: dbMatch.saf_number || "",
      excelAadhaar: item.aadhaar,
      dbAadhaar: dbMatch.aadhaar_number || "",
      excelName: `${item.firstName} ${item.lastName}`,
      dbName: `${dbMatch.first_name || ""} ${dbMatch.last_name || ""}`,
      currentDbStatus: dbMatch.status,
      currentDbNotes: dbMatch.admin_notes,
      institution: dbMatch.institution_name,
      matchedBy,
      discrepancies,
      dbId: dbMatch.id
    });
  }

  console.log("\n==================== DETAILED AUDIT REPORT ====================");
  console.log(JSON.stringify(report, null, 2));

  // Also print status summary
  const statusCounts = {};
  for (const r of report) {
    const s = r.currentDbStatus || "NOT_FOUND";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  console.log("\n=== STATUS SUMMARY IN DATABASE ===");
  console.table(statusCounts);
}

audit();
