import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const targetFiles = [
  "approved to dept/M-12.10.2026 (2).xlsx",
  "approved to dept/V-03.10.2026.xlsx",
  "approved to dept/V-05.10.2026.xlsx"
];

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

async function auditFiles() {
  console.log("=== 1. Inspecting Sheets and Row Counts ===");
  for (const f of targetFiles) {
    const wb = xlsx.readFile(f);
    console.log(`\nFile: ${f}`);
    console.log(`Sheets: ${wb.SheetNames.join(", ")}`);
    for (const sheet of wb.SheetNames) {
      const ws = wb.Sheets[sheet];
      const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
      console.log(`  Sheet [${sheet}]: ${raw.length} raw lines`);
      if (raw.length > 0) {
        console.log(`    Header (Row 1):`, raw[0].slice(0, 10));
        if (raw.length > 1) {
          console.log(`    Sample (Row 2):`, raw[1].slice(0, 10));
        }
      }
    }
  }

  console.log("\n=== 2. Fetching Supabase Registrations ===");
  let allRegs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone, status, admin_notes, institution_name, category, gender")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allRegs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Fetched total ${allRegs.length} live registrations.`);

  // Build lookup maps
  const aadhaarMap = new Map();
  const safMap = new Map();
  const refMap = new Map();
  const phoneMap = new Map();
  const nameMap = new Map();

  for (const reg of allRegs) {
    const aadh = normalizeAadhaar(reg.aadhaar_number);
    if (aadh && aadh.length >= 10) aadhaarMap.set(aadh, reg);

    const saf = normalizeSaf(reg.saf_number);
    if (saf) {
      safMap.set(saf, reg);
      safMap.set(saf.replace(/\.+$/, ""), reg);
    }

    const ref = normalizeRef(reg.reference_number).replace(/\s+/g, "");
    if (ref) {
      refMap.set(ref, reg);
      refMap.set(ref.replace(/0+/g, ""), reg);
      const numOnly = ref.replace(/^[^\d]+/, "");
      if (numOnly) refMap.set(numOnly, reg);
    }

    const ph = String(reg.phone || "").replace(/\D/g, "").slice(-10);
    if (ph && ph.length === 10) {
      if (!phoneMap.has(ph)) phoneMap.set(ph, []);
      phoneMap.get(ph).push(reg);
    }

    const fullName = normalizeStr(`${reg.first_name || ""} ${reg.last_name || ""}`);
    if (fullName) {
      if (!nameMap.has(fullName)) nameMap.set(fullName, []);
      nameMap.get(fullName).push(reg);
    }
  }

  console.log("\n=== 3. Matching File Records against Live DB ===");
  const auditReport = [];

  for (const filename of targetFiles) {
    const wb = xlsx.readFile(filename);
    const fileReport = {
      filename,
      sheets: []
    };

    for (const sheetName of wb.SheetNames) {
      const lowerSheet = sheetName.toLowerCase().trim();
      if (lowerSheet.includes("summary") || lowerSheet.includes("report") && !lowerSheet.includes("candidate")) continue;

      const ws = wb.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(ws, { header: 1 });
      if (!rawData || rawData.length === 0) continue;

      // Find header row
      let headerRowIndex = -1;
      let headerRow = [];

      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        if (!Array.isArray(row)) continue;
        const rowStr = row.map(c => String(c || "").toLowerCase()).join(" ");
        if ((rowStr.includes("saf") || rowStr.includes("ksaw") || rowStr.includes("reference") || rowStr.includes("aadhaar") || rowStr.includes("first name")) &&
            (rowStr.includes("name") || rowStr.includes("gender") || rowStr.includes("phone") || rowStr.includes("aadhaar"))) {
          headerRowIndex = i;
          headerRow = row.map(c => String(c || "").trim());
          break;
        }
      }

      if (headerRowIndex === -1) {
        // Fallback: row 0
        headerRowIndex = 0;
        headerRow = rawData[0].map(c => String(c || "").trim());
      }

      let refCol = -1, safCol = -1, aadhCol = -1, nameCol = -1, phoneCol = -1, lNameCol = -1;
      headerRow.forEach((h, idx) => {
        const lower = h.toLowerCase().trim();
        if (lower.includes("reference") || lower.includes("ksaw") || lower === "ref no" || lower === "ref no.") refCol = idx;
        if (lower.includes("saf") || lower === "saf no" || lower === "saf no.") safCol = idx;
        if (lower.includes("aadhaar") || lower.includes("adhar") || lower.includes("uid")) aadhCol = idx;
        if (lower.includes("first name") || lower === "first_name" || lower === "name" || lower.includes("candidate")) nameCol = idx;
        if (lower.includes("last name") || lower === "last_name") lNameCol = idx;
        if (lower.includes("phone") || lower.includes("mobile") || lower.includes("contact")) phoneCol = idx;
      });

      const rows = rawData.slice(headerRowIndex + 1).filter(r => Array.isArray(r) && r.some(c => c !== undefined && c !== null && String(c).trim() !== ""));

      let matchedCount = 0;
      let matchedByAadhaar = 0;
      let matchedBySaf = 0;
      let matchedByRef = 0;
      let matchedByPhone = 0;
      let matchedByName = 0;
      const matchedDetails = [];
      const unmatched = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const refVal = refCol !== -1 ? String(row[refCol] || "").trim() : "";
        const safVal = safCol !== -1 ? String(row[safCol] || "").trim() : "";
        const aadhVal = aadhCol !== -1 ? String(row[aadhCol] || "").trim() : "";
        const fName = nameCol !== -1 ? String(row[nameCol] || "").trim() : "";
        const lName = lNameCol !== -1 ? String(row[lNameCol] || "").trim() : "";
        const nameVal = `${fName} ${lName}`.trim();
        const phoneVal = phoneCol !== -1 ? String(row[phoneCol] || "").replace(/\D/g, "").slice(-10) : "";

        let match = null;
        let matchMethod = "";

        // 1. Aadhaar
        const cleanAadh = normalizeAadhaar(aadhVal);
        if (cleanAadh && cleanAadh.length >= 10 && aadhaarMap.has(cleanAadh)) {
          match = aadhaarMap.get(cleanAadh);
          matchMethod = "Aadhaar";
          matchedByAadhaar++;
        }

        // 2. SAF
        const cleanSaf = normalizeSaf(safVal);
        if (!match && cleanSaf) {
          if (safMap.has(cleanSaf)) {
            match = safMap.get(cleanSaf);
            matchMethod = "SAF No.";
            matchedBySaf++;
          } else if (safMap.has(cleanSaf.replace(/\.+$/, ""))) {
            match = safMap.get(cleanSaf.replace(/\.+$/, ""));
            matchMethod = "SAF No. (trimmed)";
            matchedBySaf++;
          }
        }

        // 3. Reference ID
        const cleanRef = normalizeRef(refVal).replace(/\s+/g, "");
        if (!match && cleanRef) {
          if (refMap.has(cleanRef)) {
            match = refMap.get(cleanRef);
            matchMethod = "Reference ID";
            matchedByRef++;
          } else if (refMap.has(cleanRef.replace(/0+/g, ""))) {
            match = refMap.get(cleanRef.replace(/0+/g, ""));
            matchMethod = "Reference ID (zero-stripped)";
            matchedByRef++;
          } else {
            const numOnly = cleanRef.replace(/^[^\d]+/, "");
            if (numOnly && refMap.has(numOnly)) {
              match = refMap.get(numOnly);
              matchMethod = "Reference ID (numeric)";
              matchedByRef++;
            }
          }
        }

        // 4. Phone
        if (!match && phoneVal && phoneVal.length === 10 && phoneMap.has(phoneVal)) {
          const cands = phoneMap.get(phoneVal);
          if (cands.length === 1) {
            match = cands[0];
            matchMethod = "Phone";
            matchedByPhone++;
          } else if (nameVal) {
            const nNorm = normalizeStr(nameVal);
            const found = cands.find(c => normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`).includes(nNorm) || nNorm.includes(normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`)));
            if (found) {
              match = found;
              matchMethod = "Phone + Name";
              matchedByPhone++;
            }
          }
        }

        // 5. Name
        if (!match && nameVal) {
          const nNorm = normalizeStr(nameVal);
          if (nameMap.has(nNorm)) {
            const cands = nameMap.get(nNorm);
            if (cands.length === 1) {
              match = cands[0];
              matchMethod = "Candidate Name";
              matchedByName++;
            }
          }
        }

        if (match) {
          matchedCount++;
          matchedDetails.push({
            excelRow: i + 1,
            excelRef: refVal,
            excelSaf: safVal,
            excelAadhaar: aadhVal,
            excelName: nameVal,
            dbId: match.id,
            dbRef: match.reference_number,
            dbSaf: match.saf_number,
            dbAadhaar: match.aadhaar_number,
            dbName: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
            currentStatus: match.status,
            currentAdminNotes: match.admin_notes,
            matchMethod
          });
        } else {
          unmatched.push({
            excelRow: i + 1,
            excelRef: refVal,
            excelSaf: safVal,
            excelAadhaar: aadhVal,
            excelName: nameVal,
            excelPhone: phoneVal
          });
        }
      }

      fileReport.sheets.push({
        sheetName,
        totalRows: rows.length,
        matchedCount,
        matchedByAadhaar,
        matchedBySaf,
        matchedByRef,
        matchedByPhone,
        matchedByName,
        unmatchedCount: unmatched.length,
        unmatchedSample: unmatched.slice(0, 5),
        matchedDetails
      });
    }

    auditReport.push(fileReport);
  }

  fs.writeFileSync("scripts/audit_3_approved_results.json", JSON.stringify(auditReport, null, 2), "utf8");

  console.log("\n=======================================================");
  console.log("            AUDIT REPORT FOR 3 APPROVED FILES          ");
  console.log("=======================================================\n");

  let grandTotalRows = 0;
  let grandTotalMatched = 0;
  let grandTotalUnmatched = 0;
  const statusDistribution = {};

  for (const f of auditReport) {
    console.log(`📁 File: ${f.filename}`);
    console.log(`-------------------------------------------------------`);
    for (const s of f.sheets) {
      grandTotalRows += s.totalRows;
      grandTotalMatched += s.matchedCount;
      grandTotalUnmatched += s.unmatchedCount;

      console.log(`  • Sheet: "${s.sheetName}"`);
      console.log(`    Rows: ${s.totalRows} | Matched: ${s.matchedCount} (${((s.matchedCount / s.totalRows) * 100).toFixed(1)}%) | Unmatched: ${s.unmatchedCount}`);
      console.log(`    Matching Methods: Aadhaar: ${s.matchedByAadhaar}, SAF: ${s.matchedBySaf}, Ref: ${s.matchedByRef}, Phone: ${s.matchedByPhone}, Name: ${s.matchedByName}`);

      for (const d of s.matchedDetails) {
        const cur = d.currentStatus || "null/empty";
        statusDistribution[cur] = (statusDistribution[cur] || 0) + 1;
      }

      if (s.unmatchedCount > 0) {
        console.log(`    Unmatched details sample:`, JSON.stringify(s.unmatchedSample, null, 2));
      }
    }
  }

  console.log(`\n=======================================================`);
  console.log(`SUMMARY:`);
  console.log(`  Total Rows across 3 files: ${grandTotalRows}`);
  console.log(`  Total Matched in Live DB: ${grandTotalMatched} (${((grandTotalMatched / grandTotalRows) * 100).toFixed(2)}%)`);
  console.log(`  Total Unmatched: ${grandTotalUnmatched}`);
  console.log(`\nCurrent Status breakdown of matched records in DB:`, statusDistribution);
  console.log(`=======================================================\n`);
}

auditFiles();
