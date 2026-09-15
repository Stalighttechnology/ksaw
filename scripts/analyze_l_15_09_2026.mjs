import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function analyze() {
  const excelFilePath = path.resolve(__dirname, "../public/images/L-15.09.2026.xlsx");
  const wb = xlsx.readFile(excelFilePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log("=== EXCEL FILE ANALYSIS ===");
  console.log("Total rows in Excel:", rows.length);

  const parsedExcel = rows.map((r, idx) => {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const safNo = String(r["SAF Number"] || "").trim();
    const refId = String(r["Reference ID"] || "").trim();
    const firstName = String(r["First Name"] || "").trim();
    const lastName = String(r["Last Name"] || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    return {
      rowIndex: idx + 1,
      slNo: r["SL NO"] || r["SL No"],
      refId,
      safNo,
      firstName,
      lastName,
      fullName,
      aadhaar,
      caste: r["Caste"],
      college: r["College / Institute / University"],
      phone: r["Phone"],
    };
  });

  const aadhaars = parsedExcel.map((p) => p.aadhaar).filter(Boolean);
  const uniqueAadhaars = new Set(aadhaars);
  console.log("Valid Aadhaar rows in Excel:", aadhaars.length);
  console.log("Unique Aadhaar numbers in Excel:", uniqueAadhaars.size);

  let dbRecords = [];
  for (let i = 0; i < aadhaars.length; i += 50) {
    const chunk = aadhaars.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, created_at, caste")
      .in("aadhaar_number", chunk);
    if (error) {
      console.error("Fetch error:", error);
      return;
    }
    if (data) dbRecords.push(...data);
  }

  console.log("\n=== DATABASE MATCHING ===");
  console.log("Total DB records found matching Aadhaar list:", dbRecords.length);

  const dbByAadhaar = new Map();
  for (const rec of dbRecords) {
    if (!dbByAadhaar.has(rec.aadhaar_number)) {
      dbByAadhaar.set(rec.aadhaar_number, []);
    }
    dbByAadhaar.get(rec.aadhaar_number).push(rec);
  }

  const notFoundInDb = [];
  const statusBreakdown = {};
  const exactApprovedMatches = [];
  const alreadySentToDept = [];
  const otherStatusMatches = [];
  const nameAuditList = [];

  for (const ex of parsedExcel) {
    const matches = dbByAadhaar.get(ex.aadhaar);
    if (!matches || matches.length === 0) {
      notFoundInDb.push(ex);
      continue;
    }

    const dbRec = matches[0];
    const currentStatus = dbRec.status || "Unknown";
    statusBreakdown[currentStatus] = (statusBreakdown[currentStatus] || 0) + 1;

    const exFullName = ex.fullName.toLowerCase();
    const dbFullName = `${dbRec.first_name || ""} ${dbRec.last_name || ""}`.trim().toLowerCase();
    const dbSaf = String(dbRec.saf_number || "").trim();
    const dbRef = String(dbRec.reference_number || "").trim();

    // Check name similarity
    const exTokens = exFullName.split(/\s+/).filter(Boolean);
    const dbTokens = dbFullName.split(/\s+/).filter(Boolean);
    const nameSharesToken = exTokens.some((t) => dbTokens.includes(t)) || exFullName === dbFullName;

    nameAuditList.push({
      exSl: ex.slNo,
      exRef: ex.refId,
      exSaf: ex.safNo,
      exName: ex.fullName,
      dbRef: dbRec.reference_number,
      dbSaf: dbRec.saf_number,
      dbName: `${dbRec.first_name || ""} ${dbRec.last_name || ""}`.trim(),
      aadhaar: ex.aadhaar,
      status: currentStatus,
      nameSharesToken,
    });

    if (currentStatus === "Approved") {
      exactApprovedMatches.push({ ex, dbRec });
    } else if (currentStatus === "Sent to Department") {
      alreadySentToDept.push({ ex, dbRec });
    } else {
      otherStatusMatches.push({ ex, dbRec, currentStatus });
    }
  }

  console.log("\nStatus Breakdown of matched Excel applicants in DB:");
  console.table(statusBreakdown);

  console.log(`\nExact matches with 'Approved' status (Ready for update): ${exactApprovedMatches.length}`);
  console.log(`Applicants already in 'Sent to Department' status: ${alreadySentToDept.length}`);
  console.log(`Applicants in other statuses (Pending, Rejected, etc.): ${otherStatusMatches.length}`);
  console.log(`Applicants NOT found in DB: ${notFoundInDb.length}`);

  if (otherStatusMatches.length > 0) {
    console.log("\nApplicants with other statuses:", otherStatusMatches.map((m) => ({
      name: m.ex.fullName,
      aadhaar: m.ex.aadhaar,
      ref: m.dbRec.reference_number,
      status: m.currentStatus,
    })));
  }

  if (notFoundInDb.length > 0) {
    console.log("\nApplicants not found in DB:", notFoundInDb.map((n) => ({
      slNo: n.slNo,
      name: n.fullName,
      aadhaar: n.aadhaar,
      saf: n.safNo,
    })));
  }

  const nameDiscrepancies = nameAuditList.filter((a) => !a.nameSharesToken);
  console.log(`\nName Token Discrepancies count: ${nameDiscrepancies.length}`);
  if (nameDiscrepancies.length > 0) {
    console.log("Discrepant names:", nameDiscrepancies);
  }
}

analyze();
