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
  const filePath = "c:/Users/raghu/Desktop/ksaw/public/M-21.09.2026 (1).xlsx";
  const wb = xlsx.readFile(filePath);
  console.log("Sheet names in M-21.09.2026 (1).xlsx:", wb.SheetNames);

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);
    console.log(`\n======================================================`);
    console.log(`=== Sheet: "${sheetName}" | Total Rows: ${rows.length} ===`);
    console.log(`======================================================`);

    if (rows.length === 0) continue;
    console.log("Columns:", Object.keys(rows[0]));

    const parsed = rows.map((r, idx) => {
      const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || r["AadhaarNo"] || r["Aadhar"];
      const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
      const safNo = String(r["SAF Number"] || r["SAF No"] || r["SAF"] || "").trim();
      const refId = String(r["Reference ID"] || r["SL No"] || r["Reference Number"] || r["Ref No"] || "").trim();
      const firstName = String(r["First Name"] || r["Applicant Name"] || r["Name"] || "").trim();
      const lastName = String(r["Last Name"] || "").trim();
      const slNo = r["SL NO"] || r["SL No_1"] || r["SL No"] || r["Sl. No."] || r["Sl No"] || idx + 1;
      return {
        rowIndex: idx + 1,
        slNo,
        refId,
        safNo,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        aadhaar,
        raw: r
      };
    });

    const aadhaars = parsed.map(p => p.aadhaar).filter(Boolean);
    const uniqueAadhaars = Array.from(new Set(aadhaars));
    console.log(`Valid Aadhaar rows: ${aadhaars.length}`);
    console.log(`Unique Aadhaar count: ${uniqueAadhaars.length}`);

    // Query DB
    let dbRecords = [];
    for (let i = 0; i < uniqueAadhaars.length; i += 50) {
      const chunk = uniqueAadhaars.slice(i, i + 50);
      const { data, error } = await supabase
        .from("registrations")
        .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, nigama, caste, created_at, updated_at")
        .in("aadhaar_number", chunk);
      if (error) {
        console.error("DB Query error:", error);
        return;
      }
      if (data) dbRecords.push(...data);
    }

    console.log(`Matched DB records on Aadhaar: ${dbRecords.length}`);

    const dbByAadhaar = new Map();
    for (const rec of dbRecords) {
      if (!dbByAadhaar.has(rec.aadhaar_number)) {
        dbByAadhaar.set(rec.aadhaar_number, []);
      }
      dbByAadhaar.get(rec.aadhaar_number).push(rec);
    }

    const statusBreakdown = {};
    const exactApprovedMatches = [];
    const alreadySentToDept = [];
    const otherStatusMatches = [];
    const notFoundInDb = [];

    let safMatches = 0;
    let safMismatches = [];
    let nameMatches = 0;
    let nameMismatches = [];

    for (const item of parsed) {
      if (!item.aadhaar) {
        notFoundInDb.push({ ...item, reason: "No Aadhaar in Excel row" });
        continue;
      }
      const matches = dbByAadhaar.get(item.aadhaar);
      if (!matches || matches.length === 0) {
        notFoundInDb.push({ ...item, reason: "Aadhaar not found in registrations" });
        continue;
      }

      const dbRec = matches[0];
      const currentStatus = dbRec.status || "Unknown";
      statusBreakdown[currentStatus] = (statusBreakdown[currentStatus] || 0) + 1;

      const dbSaf = String(dbRec.saf_number || "").trim();
      const dbRef = String(dbRec.reference_number || "").trim();
      const dbFirst = String(dbRec.first_name || "").trim();
      const dbLast = String(dbRec.last_name || "").trim();

      const exSaf = item.safNo;
      const exRef = item.refId;

      if (!exSaf || exSaf === dbSaf || exRef === dbRef) {
        safMatches++;
      } else {
        safMismatches.push({
          aadhaar: item.aadhaar,
          exSaf,
          dbSaf,
          exRef,
          dbRef,
          name: `${dbFirst} ${dbLast}`
        });
      }

      const exFullClean = item.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const dbFullClean = `${dbFirst}${dbLast}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (exFullClean && (exFullClean === dbFullClean || dbFullClean.includes(exFullClean) || exFullClean.includes(dbFullClean) || dbFullClean.includes(item.firstName.toLowerCase().replace(/[^a-z0-9]/g, "")))) {
        nameMatches++;
      } else {
        nameMismatches.push({
          aadhaar: item.aadhaar,
          exName: item.fullName,
          dbName: `${dbFirst} ${dbLast}`
        });
      }

      if (currentStatus === "Approved") {
        exactApprovedMatches.push({ ex: item, dbRec });
      } else if (currentStatus === "Sent to Department") {
        alreadySentToDept.push({ ex: item, dbRec });
      } else {
        otherStatusMatches.push({ ex: item, dbRec, currentStatus });
      }
    }

    console.log("\n--- STATUS BREAKDOWN ---");
    console.table(statusBreakdown);

    console.log(`\nSAF Comparisons: Matches=${safMatches}, Mismatches=${safMismatches.length}`);
    if (safMismatches.length > 0) {
      console.log("SAF Mismatches sample:", safMismatches);
    }

    console.log(`\nName Comparisons: Matches=${nameMatches}, Potential Mismatches/Variations=${nameMismatches.length}`);
    if (nameMismatches.length > 0) {
      console.log("Name variations sample:", nameMismatches);
    }

    console.log(`\nSummary:`);
    console.log(`- Total Excel rows: ${parsed.length}`);
    console.log(`- Matched & currently "Approved" (ready to transition to "Sent to Department"): ${exactApprovedMatches.length}`);
    console.log(`- Already "Sent to Department": ${alreadySentToDept.length}`);
    console.log(`- Other statuses: ${otherStatusMatches.length}`);
    console.log(`- Not found in DB: ${notFoundInDb.length}`);
  }
}

analyze().catch(err => {
  console.error("Error running analysis:", err);
});
