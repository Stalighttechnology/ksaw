import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";

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

const FILES_TO_AUDIT = [
  "batch/VSM approval list ( 01-10-26).xlsx",
  "batch/Shree Medha Bellary approval list ( 01-10-26).xlsx"
];

async function runAudit() {
  console.log("Fetching all live registrations from database...");
  let allRegs = [];
  let page = 0;
  while (true) {
    console.log(`Fetching page ${page}...`);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone, institution_name, category, gender, religion")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) {
      console.error("Supabase fetch error:", error);
      break;
    }
    if (!data || data.length === 0) break;
    allRegs.push(...data);
    console.log(`Fetched page ${page} with ${data.length} records.`);
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

  for (const filePath of FILES_TO_AUDIT) {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }

    console.log(`\n=======================================================`);
    console.log(`Auditing File: ${filePath}`);
    console.log(`=======================================================`);

    const wb = xlsx.readFile(filePath);
    console.log(`Sheet Names:`, wb.SheetNames);

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
      const rawHeaderRows = xlsx.utils.sheet_to_json(ws, { header: 1 });
      
      console.log(`\n--- Sheet: "${sheetName}" | Rows: ${rows.length} ---`);
      console.log(`First 2 raw rows:`, JSON.stringify(rawHeaderRows.slice(0, 2)));

      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      const batchCol = keys.find(k => /batch\s*id|batch\s*name|^batch$/i.test(k));
      const refCol = keys.find(k => /ksaw|ref/i.test(k));
      const safCol = keys.find(k => /saf/i.test(k));
      const aadhCol = keys.find(k => /aadhaar|adhar|aadh/i.test(k));
      const nameCol = keys.find(k => /name|candidate|student/i.test(k));
      const phoneCol = keys.find(k => /phone|mobile|contact/i.test(k));

      // Extract batch name
      const batchValues = new Set(rows.map(r => batchCol ? String(r[batchCol]).trim() : "").filter(Boolean));
      let detectedBatch = Array.from(batchValues)[0] || sheetName.trim();

      let matched = 0;
      const unmatched = [];
      const matchedDetails = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const refVal = refCol ? normalizeRef(r[refCol]) : "";
        const safVal = safCol ? normalizeSaf(r[safCol]) : "";
        const aadhVal = aadhCol ? normalizeAadhaar(r[aadhCol]) : "";
        const nameVal = nameCol ? String(r[nameCol]).trim() : "";
        const phoneVal = phoneCol ? String(r[phoneCol]).replace(/\D/g, "").slice(-10) : "";

        if (!refVal && !safVal && !aadhVal && !nameVal) continue;

        let match = null;
        let matchMethod = "";

        // 1. Aadhaar (12 digits)
        if (aadhVal && aadhVal.length >= 10 && aadhaarMap.has(aadhVal)) {
          match = aadhaarMap.get(aadhVal);
          matchMethod = "Aadhaar";
        }

        // 2. SAF Number
        if (!match && safVal) {
          const cleanSaf = safVal.replace(/\.+$/, "");
          if (safMap.has(cleanSaf)) {
            match = safMap.get(cleanSaf);
            matchMethod = "SAF Number";
          }
        }

        // 3. Reference ID
        if (!match && refVal) {
          const cleanRef = refVal.replace(/\s+/g, "");
          if (refMap.has(cleanRef)) {
            match = refMap.get(cleanRef);
            matchMethod = "Reference ID";
          } else if (refMap.has(cleanRef.replace(/0+/g, ""))) {
            match = refMap.get(cleanRef.replace(/0+/g, ""));
            matchMethod = "Reference ID (zero-stripped)";
          } else {
            const numOnly = cleanRef.replace(/^[^\d]+/, "");
            if (numOnly && refMap.has(numOnly)) {
              match = refMap.get(numOnly);
              matchMethod = "Reference ID (Numeric)";
            }
          }
        }

        // 4. Phone
        if (!match && phoneVal && phoneVal.length === 10 && phoneMap.has(phoneVal)) {
          const cands = phoneMap.get(phoneVal);
          if (cands.length === 1) {
            match = cands[0];
            matchMethod = "Phone";
          } else if (nameVal) {
            const nNorm = normalizeStr(nameVal);
            const found = cands.find(c => normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`).includes(nNorm) || nNorm.includes(normalizeStr(`${c.first_name || ""} ${c.last_name || ""}`)));
            if (found) {
              match = found;
              matchMethod = "Phone + Name";
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
            }
          }
        }

        if (match) {
          matched++;
          matchedDetails.push({
            row: i + 2,
            excelRef: refVal,
            excelSaf: safVal,
            excelAadhaar: aadhVal,
            excelName: nameVal,
            dbId: match.id,
            dbRef: match.reference_number,
            dbName: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
            matchMethod
          });
        } else {
          unmatched.push({
            row: i + 2,
            ref: refVal,
            saf: safVal,
            aadhaar: aadhVal,
            name: nameVal,
            phone: phoneVal
          });
        }
      }

      console.log(`Matched: ${matched} | Unmatched: ${unmatched.length}`);
      if (unmatched.length > 0) {
        console.log(`Unmatched sample:`, JSON.stringify(unmatched.slice(0, 3), null, 2));
      }
    }
  }
}

runAudit();
