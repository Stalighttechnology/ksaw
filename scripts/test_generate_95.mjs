import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";

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

const OCT01_FILE_BATCH_MAP = {
  "Central college approval list ( 01-10-26).xlsx": "KSAWU/HSN/CPG/0926-33",
  "KSAWU - B.V.V. Sangha's Mudhol approval list ( 01-10-26).xlsx": "KSAWU/BKT/CPG/0926-80",
  "KSAWU - Raj Rajeshwari, Rannebenur Approval list ( 01-10-26).xlsx": "KSAWU/HVR/CPG/0926-86",
  "KSAWU BVVS Akkamahadevi, Bagalokot approval list ( 01-10-26).xlsx": "KSAWU/BKT/CPG/0926-81",
  "Mandavya approval list ( 01-10-26).xlsx": "KSAWU/MDY/CPG/0926-96",
  "Minerva approval list ( 01-10-26).xlsx": "KSAWU/CMR/CPG/0926-97",
  "PES mandya approval list ( 01-10-26).xlsx": "KSAWU/MDY/CPG/0926-98",
  "Polytechnic Ramnagra-GT Approval list ( 01-10-26).xlsx": "KSAWU/RMG/CPG/0926-79",
  "Vittal college approval data ( 01-10-26).xlsx": "KSAWU/BGU/CPG/0926-106",
  "VSM approval list ( 01-10-26).xlsx": "KSAWU/BGM/CPG/0926-54",
  "Shree Medha Bellary approval list ( 01-10-26).xlsx": "KSAWU/BLR/CPG/0926-99"
};

const BULKBATCH2_FILE_BATCH_MAP = {
  "Gandhadakoti, Hassan approval data ( 22-09-26).xlsx": "KSAWU/HSN/CPG/0926-16",
  "Govt Womens Yadgiri approval data ( 22-09-26).xlsx": "KSAWU/YDG/CPG/0926-35",
  "Lingeri Konnappa approval list ( 22-09-26).xlsx": "KSAWU/YDG/CPG/0926-51",
  "Minerva approval list -(22-09-26).xlsx": "KSAWU/CMR/CPG/0926-66"
};

async function testGenerate() {
  console.log("Fetching live registrations from Supabase...");
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

  const batchesMap = new Map();

  function addCandidateToBatch(batchId, match, safVal, refVal, aadhVal, sheetName) {
    if (!batchId) return;
    batchId = batchId.replace(/\s+/g, "").replace(/\/\//g, "/");
    if (!batchesMap.has(batchId)) {
      batchesMap.set(batchId, {
        id: batchId,
        name: batchId,
        sheetName: sheetName,
        applicantIds: [],
        safNumbers: [],
        referenceNumbers: [],
        aadhaarNumbers: [],
      });
    }
    const b = batchesMap.get(batchId);
    if (!b.applicantIds.includes(match.id)) {
      b.applicantIds.push(match.id);
      if (safVal) b.safNumbers.push(safVal);
      else if (match.saf_number) b.safNumbers.push(match.saf_number);

      if (refVal) b.referenceNumbers.push(refVal);
      else if (match.reference_number) b.referenceNumbers.push(match.reference_number);

      if (aadhVal) b.aadhaarNumbers.push(aadhVal);
      else if (match.aadhaar_number) b.aadhaarNumbers.push(match.aadhaar_number);
    }
  }

  function matchCandidate(refVal, safVal, aadhVal, nameVal, phoneVal) {
    let match = null;
    const cleanAadh = normalizeAadhaar(aadhVal);
    if (cleanAadh && cleanAadh.length >= 10 && aadhaarMap.has(cleanAadh)) {
      match = aadhaarMap.get(cleanAadh);
    }
    const cleanSaf = normalizeSaf(safVal);
    if (!match && cleanSaf) {
      if (safMap.has(cleanSaf)) match = safMap.get(cleanSaf);
      else if (safMap.has(cleanSaf.replace(/\.+$/, ""))) match = safMap.get(cleanSaf.replace(/\.+$/, ""));
    }
    const cleanRef = normalizeRef(refVal).replace(/\s+/g, "");
    if (!match && cleanRef) {
      if (refMap.has(cleanRef)) match = refMap.get(cleanRef);
      else if (refMap.has(cleanRef.replace(/0+/g, ""))) match = refMap.get(cleanRef.replace(/0+/g, ""));
      else {
        const numOnly = cleanRef.replace(/^[^\d]+/, "");
        if (numOnly && refMap.has(numOnly)) match = refMap.get(numOnly);
      }
    }
    if (!match && phoneVal && phoneVal.length === 10 && phoneMap.has(phoneVal)) {
      const cands = phoneMap.get(phoneVal);
      if (cands.length === 1) match = cands[0];
      else if (nameVal) {
        const nNorm = normalizeStr(nameVal);
        const found = cands.find(c => normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`).includes(nNorm) || nNorm.includes(normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`)));
        if (found) match = found;
      }
    }
    if (!match && nameVal) {
      const nNorm = normalizeStr(nameVal);
      if (nameMap.has(nNorm)) {
        const cands = nameMap.get(nNorm);
        if (cands.length === 1) match = cands[0];
      }
    }
    return match;
  }

  function processWorkbook(folder, filename) {
    const filePath = path.join(folder, filename);
    const wb = xlsx.readFile(filePath);

    const hasIndividualBatchSheets = wb.SheetNames.some(s => 
      !s.toLowerCase().includes("candidate") && 
      !s.toLowerCase().includes("report") &&
      !s.toLowerCase().includes("summary") &&
      !s.toLowerCase().includes("batch id")
    );

    for (const sheetName of wb.SheetNames) {
      const lowerSheet = sheetName.toLowerCase().trim();
      if (lowerSheet.includes("batch id report") || lowerSheet.includes("summary") || lowerSheet === "batch id" || lowerSheet.startsWith("batch id")) continue;

      if (hasIndividualBatchSheets && (lowerSheet.includes("candidate") || lowerSheet.includes("candidates")) && !OCT01_FILE_BATCH_MAP[filename]) {
        continue;
      }

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

      if (headerRowIndex === -1) continue;

      let sheetDetectedBatch = metadataBatchName;
      if (!sheetDetectedBatch && OCT01_FILE_BATCH_MAP[filename]) {
        sheetDetectedBatch = OCT01_FILE_BATCH_MAP[filename];
      }
      if (!sheetDetectedBatch && BULKBATCH2_FILE_BATCH_MAP[filename]) {
        sheetDetectedBatch = BULKBATCH2_FILE_BATCH_MAP[filename];
      }
      if (!sheetDetectedBatch) {
        let cleanSheet = sheetName.trim();
        if (cleanSheet.match(/^\d{4}-\d+/)) {
          if (filename.includes("Bailhongal") || filename.includes("BGM") || filename.includes("chikodi")) {
            if (cleanSheet.includes("88-1")) sheetDetectedBatch = "KSAWU/BGM/CPG/0926-88/1";
            else sheetDetectedBatch = `KSAWU/BGM/CPG/${cleanSheet}`;
          } else if (filename.includes("Basaveshwar science")) {
            sheetDetectedBatch = `KSAWU/BKT/CPG/${cleanSheet}`;
          } else if (filename.includes("Vijaypura") || filename.includes("VJP")) {
            sheetDetectedBatch = `KSAWU/VJP/CPG/${cleanSheet}`;
          } else if (filename.includes("Ramnagara") || filename.includes("RMG")) {
            sheetDetectedBatch = `KSAWU/RMG/CPG/${cleanSheet}`;
          } else {
            sheetDetectedBatch = `KSAWU/CPG/${cleanSheet}`;
          }
        } else if (cleanSheet.startsWith("KSAWU TMK CPG")) {
          const num = cleanSheet.replace("KSAWU TMK CPG", "").trim();
          sheetDetectedBatch = `KSAWU/TMK/CPG/${num}`;
        }
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
        if (lower.includes("batch") || lower === "batch id") batchCol = idx;
      });

      const rows = rawData.slice(headerRowIndex + 1).filter(r => Array.isArray(r) && r.some(c => c !== undefined && c !== null && String(c).trim() !== ""));
      if (rows.length === 0) continue;

      for (const row of rows) {
        const refVal = refCol !== -1 ? String(row[refCol] || "").trim() : "";
        const safVal = safCol !== -1 ? String(row[safCol] || "").trim() : "";
        const aadhVal = aadhCol !== -1 ? String(row[aadhCol] || "").trim() : "";
        const nameVal = nameCol !== -1 ? String(row[nameCol] || "").trim() : "";
        const phoneVal = phoneCol !== -1 ? String(row[phoneCol] || "").replace(/\D/g, "").slice(-10) : "";
        const rowBatch = batchCol !== -1 ? String(row[batchCol] || "").trim() : "";

        let rowDetectedBatch = rowBatch || sheetDetectedBatch;
        if (rowDetectedBatch) {
          rowDetectedBatch = rowDetectedBatch.replace(/\s+/g, "").replace(/\/\//g, "/");
          if (!rowDetectedBatch.toUpperCase().startsWith("KSAWU/")) {
            if (filename.includes("AVK")) {
              rowDetectedBatch = `KSAWU/HSN/${rowDetectedBatch.includes("CPG") ? "CPG" : "CHN"}/${rowDetectedBatch.replace(/^(CPG|CHN)\/?/i, "")}`;
            } else if (filename.includes("DR Shankar")) {
              rowDetectedBatch = `KSAWU/UDP/CPG/${rowDetectedBatch}`;
            } else if (filename.includes("GFGC Byrapur")) {
              rowDetectedBatch = `KSAWU/MYR/CPG/${rowDetectedBatch}`;
            } else if (filename.includes("KTSV")) {
              rowDetectedBatch = `KSAWU/BGU/CPG/${rowDetectedBatch}`;
            } else if (filename.includes("Shree Medha")) {
              rowDetectedBatch = `KSAWU/BLR/CPG/${rowDetectedBatch}`;
            }
          }
        }

        if (!rowDetectedBatch) rowDetectedBatch = sheetName.trim();

        const match = matchCandidate(refVal, safVal, aadhVal, nameVal, phoneVal);
        if (match) {
          addCandidateToBatch(rowDetectedBatch, match, safVal, refVal, aadhVal, sheetName);
        }
      }
    }
  }

  // Process batch/ folder
  const batchFiles = fs.readdirSync("batch").filter(f => f.endsWith(".xlsx"));
  console.log(`Processing ${batchFiles.length} files from batch/...`);
  for (const f of batchFiles) {
    processWorkbook("batch", f);
  }

  // Process bulkbatchassign2/ folder
  const bulkFiles = fs.readdirSync("bulkbatchassign2").filter(f => f.endsWith(".xlsx"));
  console.log(`Processing ${bulkFiles.length} files from bulkbatchassign2/...`);
  for (const f of bulkFiles) {
    processWorkbook("bulkbatchassign2", f);
  }

  console.log(`\n=== Generated Batches: ${batchesMap.size} ===`);
  let totalCandidates = 0;
  const allIds = new Set();
  const duplicateIds = [];

  for (const [name, b] of batchesMap.entries()) {
    totalCandidates += b.applicantIds.length;
    console.log(`  - [${name}] (${b.applicantIds.length} applicants)`);
    for (const id of b.applicantIds) {
      if (allIds.has(id)) duplicateIds.push({ id, batch: name });
      allIds.add(id);
    }
  }

  console.log(`\nTotal Batches: ${batchesMap.size}`);
  console.log(`Total Candidates: ${totalCandidates}`);
  console.log(`Unique Candidates: ${allIds.size}`);
  console.log(`Duplicate IDs count: ${duplicateIds.length}`);
  if (duplicateIds.length > 0) {
    console.log("Sample duplicates:", duplicateIds.slice(0, 5));
  }
}

testGenerate();
