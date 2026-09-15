import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function analyzeFile(filePath, label) {
  console.log(`\n======================================================`);
  console.log(`=== ANALYZING ${label} (${filePath}) ===`);
  console.log(`======================================================`);

  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet);

  console.log("Total rows in Excel:", rows.length);

  const parsedExcel = rows.map((r, idx) => {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const safNo = String(r["SAF Number"] || "").trim();
    const refId = String(r["Reference ID"] || r["SL No"] || "").trim();
    const firstName = String(r["First Name"] || "").trim();
    const lastName = String(r["Last Name"] || "").trim();
    const fullName = `${firstName} ${lastName}`.trim();
    return {
      rowIndex: idx + 1,
      slNo: r["SL NO"] || r["SL No_1"] || r["SL No"],
      refId,
      safNo,
      firstName,
      lastName,
      fullName,
      aadhaar,
      caste: r["Caste"],
      nigama: r["Nigama"],
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
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, nigama, caste")
      .in("aadhaar_number", chunk);
    if (error) {
      console.error("Fetch error:", error);
      return;
    }
    if (data) dbRecords.push(...data);
  }

  console.log("Total DB records matched on Aadhaar:", dbRecords.length);

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
  let safMatches = 0;
  let safMismatches = [];
  let nameMatches = 0;
  let nameMismatches = [];

  for (const ex of parsedExcel) {
    const matches = dbByAadhaar.get(ex.aadhaar);
    if (!matches || matches.length === 0) {
      notFoundInDb.push(ex);
      continue;
    }

    const dbRec = matches[0];
    const currentStatus = dbRec.status || "Unknown";
    statusBreakdown[currentStatus] = (statusBreakdown[currentStatus] || 0) + 1;

    const dbSaf = String(dbRec.saf_number || "").trim();
    const dbRef = String(dbRec.reference_number || "").trim();
    const dbFirst = String(dbRec.first_name || "").trim();
    const dbLast = String(dbRec.last_name || "").trim();

    const exSaf = ex.safNo;
    const exRef = ex.refId;

    if (exSaf === dbSaf || exRef === dbRef || !exSaf) {
      safMatches++;
    } else {
      safMismatches.push({ aadhaar: ex.aadhaar, exSaf, dbSaf, exRef, dbRef });
    }

    const exFull = (ex.firstName + " " + ex.lastName).toLowerCase().replace(/\s+/g, "");
    const dbFull = (dbFirst + " " + dbLast).toLowerCase().replace(/\s+/g, "");
    if (exFull === dbFull || dbFull.includes(ex.firstName.toLowerCase().replace(/\s+/g, "")) || exFull.includes(dbFirst.toLowerCase().replace(/\s+/g, ""))) {
      nameMatches++;
    } else {
      nameMismatches.push({ aadhaar: ex.aadhaar, exFirst: ex.firstName, exLast: ex.lastName, dbFirst, dbLast });
    }

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

  console.log(`SAF/Reference Matches: ${safMatches} / ${parsedExcel.length} (Mismatches: ${safMismatches.length})`);
  if (safMismatches.length > 0) console.log("SAF Mismatches:", safMismatches);

  console.log(`Name Matches: ${nameMatches} / ${parsedExcel.length} (Mismatches: ${nameMismatches.length})`);
  if (nameMismatches.length > 0) console.log("Name Mismatches:", nameMismatches);

  console.log(`\nExact matches with 'Approved' status (Ready for update): ${exactApprovedMatches.length}`);
  console.log(`Applicants already in 'Sent to Department' status: ${alreadySentToDept.length}`);
  console.log(`Applicants in other statuses: ${otherStatusMatches.length}`);
  if (otherStatusMatches.length > 0) {
    console.log("Other status records:", otherStatusMatches.map((m) => ({
      ref: m.dbRec.reference_number,
      name: `${m.dbRec.first_name} ${m.dbRec.last_name}`,
      aadhaar: m.ex.aadhaar,
      status: m.currentStatus,
      notes: m.dbRec.admin_notes,
    })));
  }
  console.log(`Applicants NOT found in DB: ${notFoundInDb.length}`);

  return {
    total: parsedExcel.length,
    approved: exactApprovedMatches.length,
    alreadySent: alreadySentToDept.length,
    other: otherStatusMatches.length,
    notFound: notFoundInDb.length,
  };
}

async function run() {
  await analyzeFile("c:/Users/raghu/Desktop/ksaw/public/V-15.09.2026.xlsx", "V-15.09.2026.xlsx (Vokkaliga)");
  await analyzeFile("c:/Users/raghu/Desktop/ksaw/public/D-15.09.2026.xlsx", "D-15.09.2026.xlsx (Devraj Urs)");
}

run();
