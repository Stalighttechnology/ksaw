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

async function checkSheets() {
  const result = [];

  for (const f of FILES) {
    const wb = xlsx.readFile(f);
    const fObj = { file: f.replace(/^batch\//, ""), sheets: [] };
    for (const s of wb.SheetNames) {
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[s], { defval: "" });
      const firstRow = rows[0] || {};
      const batchCol = Object.keys(firstRow).find(k => /batch\s*id|batch\s*name|^batch$/i.test(k));
      const batchVals = Array.from(new Set(rows.map(r => batchCol ? String(r[batchCol]).trim() : "").filter(Boolean)));
      fObj.sheets.push({
        name: s,
        rows: rows.length,
        batchVals: batchVals
      });
    }
    result.push(fObj);
  }

  console.log(JSON.stringify(result, null, 2));
}

checkSheets();
