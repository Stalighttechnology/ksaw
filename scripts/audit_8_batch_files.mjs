import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const files = [
  "Basaveshwar science batch wise list ( 01-10-26) (1).xlsx",
  "GFGC Byrapura list.xlsx",
  "KSAWU Godutai , Kalburgi Approval list ( 01-10-26).xlsx",
  "KSAWU J.M.M's , Belgaum approval list ( 01-10-26).xlsx",
  "KSAWU S.J.M.V's, Hubli approval list ( 01-10-26).xlsx",
  "KSAWU Uggama Devi , Hospet approval list ( 01-10-26).xlsx",
  "Shivkumar approval list ( 01-10-26).xlsx",
  "Sridevi institute Batch list ( 01-10-26).xlsx"
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
  console.log("=== 1. Inspecting File Sheets & Structure ===");
  for (const filename of files) {
    const filePath = path.join("batch", filename);
    const wb = xlsx.readFile(filePath);
    console.log(`\nFile: ${filename}`);
    console.log(`Sheets: ${wb.SheetNames.join(", ")}`);
    for (const sheet of wb.SheetNames) {
      const ws = wb.Sheets[sheet];
      const raw = xlsx.utils.sheet_to_json(ws, { header: 1 });
      console.log(`  Sheet [${sheet}]: ${raw.length} raw rows`);
      // look for metadata or header in first 10 rows
      for (let i = 0; i < Math.min(8, raw.length); i++) {
        const row = raw[i];
        if (Array.isArray(row) && row.some(c => c)) {
          const rowStr = row.map(c => String(c || "").trim()).filter(Boolean).join(" | ");
          if (rowStr.length > 0) {
            console.log(`    Row ${i + 1}: ${rowStr.slice(0, 140)}`);
          }
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
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone, institution_name, category, gender, religion")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allRegs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Fetched ${allRegs.length} live registrations.`);

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

  // Load existing assigned batches from useBatches.ts
  const useBatchesContent = fs.readFileSync("src/lib/useBatches.ts", "utf8");
  const existingBatchesMatch = [...useBatchesContent.matchAll(/id:\s*"([^"]+)",[\s\S]*?name:\s*"([^"]+)",[\s\S]*?applicantIds:\s*\[([\s\S]*?)\]/g)];
  const existingBatchMap = new Map(); // applicantId -> batchName
  const batchCounts = new Map();

  for (const m of existingBatchesMatch) {
    const bName = m[2];
    const ids = m[3].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    batchCounts.set(bName, ids.length);
    for (const id of ids) {
      existingBatchMap.set(id, bName);
    }
  }
  console.log(`Found ${batchCounts.size} currently active batches with ${existingBatchMap.size} candidates in useBatches.ts`);

  console.log("\n=== 3. Auditing Candidates in the 8 Files ===");
  const auditReport = [];

  for (const filename of files) {
    const filePath = path.join("batch", filename);
    const wb = xlsx.readFile(filePath);

    for (const sheetName of wb.SheetNames) {
      const lowerSheet = sheetName.toLowerCase().trim();
      if (lowerSheet.includes("batch id report") || lowerSheet.includes("summary") || lowerSheet === "batch id" || lowerSheet.startsWith("batch id")) continue;

      const ws = wb.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(ws, { header: 1 });
      if (!rawData || rawData.length === 0) continue;

      let headerRowIndex = -1;
      let headerRow = [];
      let metadataBatchName = null;

      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        if (!Array.isArray(row)) continue;

        for (const cell of row) {
          const s = String(cell || "").trim();
          if (s.startsWith("KSAWU/") || s.startsWith("KSAW/") || s.includes("/CPG/") || s.includes("/CHN/")) {
            metadataBatchName = s.replace(/\s+/g, "").replace(/^KSAW\//, "KSAWU/");
          }
        }

        const rowStr = row.map(c => String(c || "").toLowerCase()).join(" ");
        if ((rowStr.includes("saf") || rowStr.includes("ksaw") || rowStr.includes("reference") || rowStr.includes("aadhaar") || rowStr.includes("student name") || rowStr.includes("candidate name")) &&
            (rowStr.includes("name") || rowStr.includes("gender") || rowStr.includes("phone") || rowStr.includes("aadhaar"))) {
          headerRowIndex = i;
          headerRow = row.map(c => String(c || "").trim());
          break;
        }
      }

      if (headerRowIndex === -1) {
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const row = rawData[i];
          if (!Array.isArray(row)) continue;
          const rowStr = row.map(c => String(c || "").toLowerCase()).join(" ");
          if (rowStr.includes("name") && (rowStr.includes("aadhaar") || rowStr.includes("gender") || rowStr.includes("phone") || rowStr.includes("category"))) {
            headerRowIndex = i;
            headerRow = row.map(c => String(c || "").trim());
            break;
          }
        }
      }

      if (headerRowIndex === -1) {
        console.log(`Could not find header in ${filename} [${sheetName}]`);
        continue;
      }

      let refCol = -1, safCol = -1, aadhCol = -1, nameCol = -1, phoneCol = -1, batchCol = -1;
      headerRow.forEach((h, idx) => {
        const lower = h.toLowerCase().trim();
        if (lower.includes("reference") || lower.includes("ksaw") || lower === "ref no" || lower === "ref no.") refCol = idx;
        if (lower.includes("saf") || lower === "saf no" || lower === "saf no.") safCol = idx;
        if (lower.includes("aadhaar") || lower.includes("adhar") || lower.includes("uid")) aadhCol = idx;
        if (lower.includes("name") || lower.includes("candidate") || lower.includes("student")) {
          if (nameCol === -1 || lower.includes("candidate") || lower.includes("student")) nameCol = idx;
        }
        if (lower.includes("phone") || lower.includes("mobile") || lower.includes("contact")) phoneCol = idx;
        if (lower.includes("batch")) batchCol = idx;
      });

      const rows = rawData.slice(headerRowIndex + 1).filter(r => Array.isArray(r) && r.some(c => c !== undefined && c !== null && String(c).trim() !== ""));
      if (rows.length === 0) continue;

      let matchedCount = 0;
      let matchedByAadhaar = 0;
      let matchedBySaf = 0;
      let matchedByRef = 0;
      let matchedByPhone = 0;
      let matchedByName = 0;
      let unmatched = [];
      let matchedDetails = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const refVal = refCol !== -1 ? String(row[refCol] || "").trim() : "";
        const safVal = safCol !== -1 ? String(row[safCol] || "").trim() : "";
        const aadhVal = aadhCol !== -1 ? String(row[aadhCol] || "").trim() : "";
        const nameVal = nameCol !== -1 ? String(row[nameCol] || "").trim() : "";
        const phoneVal = phoneCol !== -1 ? String(row[phoneCol] || "").replace(/\D/g, "").slice(-10) : "";
        const rowBatch = batchCol !== -1 ? String(row[batchCol] || "").trim() : "";

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

        // 3. Reference ID / KSAW
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
          const alreadyAssignedTo = existingBatchMap.get(match.id) || null;
          matchedDetails.push({
            row: i + 1,
            matchId: match.id,
            matchName: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
            matchSaf: match.saf_number,
            matchRef: match.reference_number,
            matchAadhaar: match.aadhaar_number,
            matchMethod,
            excelRef: refVal,
            excelSaf: safVal,
            excelAadhaar: aadhVal,
            excelName: nameVal,
            rowBatch,
            alreadyAssignedTo
          });
        } else {
          unmatched.push({
            row: i + 1,
            excelRef: refVal,
            excelSaf: safVal,
            excelAadhaar: aadhVal,
            excelName: nameVal,
            excelPhone: phoneVal
          });
        }
      }

      auditReport.push({
        filename,
        sheetName,
        metadataBatchName,
        totalRows: rows.length,
        matchedCount,
        matchedByAadhaar,
        matchedBySaf,
        matchedByRef,
        matchedByPhone,
        matchedByName,
        unmatchedCount: unmatched.length,
        unmatched,
        matchedDetails
      });
    }
  }

  fs.writeFileSync("scripts/audit_8_files_results.json", JSON.stringify(auditReport, null, 2), "utf8");
  console.log(`\nAudit complete! Processed ${auditReport.length} sheets across 8 files.`);

  for (const item of auditReport) {
    console.log(`\n[${item.filename}] - Sheet: "${item.sheetName}"`);
    console.log(`  Metadata Batch: ${item.metadataBatchName || "N/A"}`);
    console.log(`  Rows: ${item.totalRows} | Matched: ${item.matchedCount} (${((item.matchedCount / item.totalRows) * 100).toFixed(1)}%) | Unmatched: ${item.unmatchedCount}`);
    console.log(`  Breakdown -> Aadhaar: ${item.matchedByAadhaar}, SAF: ${item.matchedBySaf}, Ref: ${item.matchedByRef}, Phone: ${item.matchedByPhone}, Name: ${item.matchedByName}`);
    const assignedAlready = item.matchedDetails.filter(d => d.alreadyAssignedTo);
    console.log(`  Currently already assigned in useBatches: ${assignedAlready.length} candidates (e.g. to ${Array.from(new Set(assignedAlready.map(d => d.alreadyAssignedTo))).slice(0, 3).join(", ")})`);
    if (item.unmatchedCount > 0) {
      console.log(`  Unmatched sample:`, item.unmatched.slice(0, 2));
    }
  }
}

auditFiles();
