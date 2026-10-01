import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function normalizeAadhaar(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}
function normalizeSaf(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").trim();
}
function normalizeRef(str) {
  if (!str) return "";
  return String(str).toUpperCase().replace(/\s+/g, " ").trim();
}

const FILES = [
  "batch/Angadi approval list ( 22-09-26).xlsx",
  "batch/BGS Chenraypatna approval list ( 22-09-26).xlsx",
  "batch/DR Shankar college - batch wise list ( 22-09-26).xlsx",
  "batch/GFGC Byrapur approval list ( 22-09-26).xlsx",
  "batch/Govt College Channaraypatna approval list ( 22-09-26).xlsx",
  "batch/KSAWU approval list ( 26-09-2026).xlsx",
  "batch/KTSV B'Lore Vijayanaga approval list ( 22-09-26).xlsx",
  "batch/PES - BATCH WISE LIST (22-09-26).xlsx",
  "batch/Shiva Kumar approval list ( 22-09-26) Batch Wise.xlsx",
  "batch/Shree Medha Bellary approval list ( 22-09-26).xlsx",
  "batch/Tersian BATCH WISE LIST ( 22-09-26).xlsx",
  "batch/Thenkanidiyur,Udupi approval data ( 22-09-26).xlsx"
];

async function inspect() {
  const batches = new Map();

  for (const filePath of FILES) {
    const wb = xlsx.readFile(filePath);
    for (const sheetName of wb.SheetNames) {
      if (sheetName.toLowerCase().includes("batch id report")) continue;

      const ws = wb.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      const batchCol = keys.find(k => /batch\s*id|batch\s*name|^batch$/i.test(k));
      const refCol = keys.find(k => /ksaw|ref/i.test(k));
      const safCol = keys.find(k => /saf/i.test(k));
      const aadhCol = keys.find(k => /aadhaar|adhar|aadh/i.test(k));

      for (const r of rows) {
        let bName = batchCol && r[batchCol] ? String(r[batchCol]).trim() : "";
        if (!bName) {
          bName = sheetName.trim().replace(/\s+/g, "/");
        }
        bName = bName.replace(/\s+/g, "").replace(/\/\//g, "/");

        const refVal = refCol ? normalizeRef(r[refCol]) : "";
        const safVal = safCol ? normalizeSaf(r[safCol]) : "";
        const aadhVal = aadhCol ? normalizeAadhaar(r[aadhCol]) : "";

        if (!refVal && !safVal && !aadhVal) continue; // Skip empty rows

        if (!batches.has(bName)) {
          batches.set(bName, { file: filePath.replace(/^batch\//, ""), count: 0, sample: [] });
        }
        const b = batches.get(bName);
        b.count++;
        if (b.sample.length < 2) {
          b.sample.push({ ref: refVal, saf: safVal });
        }
      }
    }
  }

  console.log(`\nFound ${batches.size} unique candidate batches across 12 files:\n`);
  for (const [name, data] of batches.entries()) {
    console.log(`• Batch: "${name}" | File: ${data.file} | Applicants: ${data.count}`);
  }
}

inspect();
