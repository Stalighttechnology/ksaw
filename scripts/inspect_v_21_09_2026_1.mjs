import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectFile() {
  const filePath = "c:/Users/raghu/Desktop/ksaw/public/V-21.09.2026 (1).xlsx";
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist:", filePath);
    return;
  }

  const wb = xlsx.readFile(filePath);
  console.log("Sheet names in V-21.09.2026 (1).xlsx:", wb.SheetNames);

  // Fetch all registrations from DB for instant in-memory matching
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
  console.log(`Loaded ${allDbRows.length} DB records.`);

  const cleanRef = (r) => (r ? String(r).trim().toUpperCase().replace(/\s+/g, " ") : "");
  const cleanAadhaar = (a) => (a ? String(a).replace(/\D/g, "") : "");
  const cleanSaf = (s) => (s ? String(s).trim().toUpperCase() : "");

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    console.log(`\n========================================================================`);
    console.log(`=== Sheet: "${sheetName}" | Total Rows: ${rows.length} ===`);
    console.log(`========================================================================`);

    if (rows.length === 0) continue;
    console.log("Columns:", Object.keys(rows[0]));

    let matchedByRef = 0;
    let matchedByAadhaar = 0;
    let matchedBySaf = 0;
    let unmatched = 0;

    const matchedList = [];
    const unmatchedList = [];

    const statusCounts = {};

    rows.forEach((r, idx) => {
      const keys = Object.keys(r);
      const findVal = (candidates) => {
        const k = keys.find((k) => candidates.some((c) => k.toLowerCase().includes(c)));
        return k ? r[k] : "";
      };

      const rawRef = findVal(["reference", "ref", "app_no", "reg", "sl no"]);
      const rawSaf = findVal(["saf", "saf_no", "saf no", "safid"]);
      const rawAadhaar = findVal(["aadhaar", "adhar", "uid", "aadhar"]);
      const rawName = `${findVal(["first name", "firstname", "name", "candidate"]) || ""} ${findVal(["last name", "lastname", "surname"]) || ""}`.trim();
      const rawDecision = findVal(["decision", "review", "action", "status", "remarks"]) || "";

      const cRef = cleanRef(rawRef);
      const cAadhaar = cleanAadhaar(rawAadhaar);
      const cSaf = cleanSaf(rawSaf);

      const dbMatch = allDbRows.find((p) => {
        const pRef = cleanRef(p.reference_number);
        const pAadhaar = cleanAadhaar(p.aadhaar_number);
        const pSaf = cleanSaf(p.saf_number);

        if (cRef && pRef && pRef === cRef) return true;
        if (cAadhaar && pAadhaar && cAadhaar.length >= 10 && pAadhaar === cAadhaar) return true;
        if (cSaf && pSaf && cSaf.startsWith("SAF") && pSaf === cSaf) return true;
        return false;
      });

      if (dbMatch) {
        if (cRef && cleanRef(dbMatch.reference_number) === cRef) matchedByRef++;
        else if (cAadhaar && cleanAadhaar(dbMatch.aadhaar_number) === cAadhaar) matchedByAadhaar++;
        else matchedBySaf++;

        const curStatus = dbMatch.status || "Pending";
        statusCounts[curStatus] = (statusCounts[curStatus] || 0) + 1;
        matchedList.push({
          row: idx + 1,
          excelRef: rawRef,
          excelAadhaar: rawAadhaar,
          excelSaf: rawSaf,
          excelName: rawName,
          excelDecision: rawDecision,
          dbRef: dbMatch.reference_number,
          dbName: `${dbMatch.first_name || ""} ${dbMatch.last_name || ""}`.trim(),
          dbStatus: dbMatch.status,
          dbAdminNotes: dbMatch.admin_notes,
          dbId: dbMatch.id,
        });
      } else {
        unmatched++;
        unmatchedList.push({
          row: idx + 1,
          excelRef: rawRef,
          excelAadhaar: rawAadhaar,
          excelSaf: rawSaf,
          excelName: rawName,
          excelDecision: rawDecision,
        });
      }
    });

    console.log(`Matched Records: ${matchedList.length}`);
    console.log(`- By Ref ID: ${matchedByRef}`);
    console.log(`- By Aadhaar: ${matchedByAadhaar}`);
    console.log(`- By SAF: ${matchedBySaf}`);
    console.log(`Unmatched Records: ${unmatched}`);
    console.log(`Current DB Statuses of Matched Records:`, statusCounts);

    console.log("\nSample 5 Matched Records:");
    matchedList.slice(0, 5).forEach((m) => {
      console.log(`Row ${m.row}: Excel [${m.excelRef} | ${m.excelName} | Dec: ${m.excelDecision}] -> DB [${m.dbRef} | ${m.dbName} | Status: ${m.dbStatus}]`);
    });

    if (unmatchedList.length > 0) {
      console.log(`\nSample Unmatched Records (${unmatchedList.length} total):`);
      unmatchedList.slice(0, 5).forEach((u) => {
        console.log(`Row ${u.row}: [${u.excelRef} | ${u.excelAadhaar} | ${u.excelSaf} | ${u.excelName}]`);
      });
    }
  }
}

inspectFile();
