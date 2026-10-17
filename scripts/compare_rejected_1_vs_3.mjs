import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const file1Path = path.resolve(__dirname, "../public/update/DEVRAJ URS & LINGYATH REJECTED LIST from DEPARTMENT ( 16-10-26) (1).xlsx");
const file3Path = path.resolve(__dirname, "../public/update/DEVRAJ URS & LINGYATH REJECTED LIST from DEPARTMENT ( 16-10-26) (3).xlsx");

function cleanAadhaar(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}

function cleanSaf(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").replace(/\.+$/, "").trim();
}

function cleanRef(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, " ").trim();
}

async function runComparison() {
  console.log("=== 1. Reading Both Excel Files ===");
  const wb1 = xlsx.readFile(file1Path);
  const wb3 = xlsx.readFile(file3Path);

  console.log("File (1) Sheet names:", wb1.SheetNames);
  console.log("File (3) Sheet names:", wb3.SheetNames);

  let totalDiffs = 0;
  const removedIn3 = [];
  const addedIn3 = [];

  for (const sheetName of wb1.SheetNames) {
    const d1 = xlsx.utils.sheet_to_json(wb1.Sheets[sheetName]);
    const d3 = xlsx.utils.sheet_to_json(wb3.Sheets[sheetName]);

    console.log(`\nSheet [${sheetName}]:`);
    console.log(`  File (1) rows: ${d1.length}`);
    console.log(`  File (3) rows: ${d3.length}`);

    const map1 = new Map();
    d1.forEach((r, idx) => {
      const ref = cleanRef(r["Reference ID"] || r["Reference Number"] || "");
      const aadh = cleanAadhaar(r["Aadhaar Number"] || "");
      const saf = cleanSaf(r["SAF Number"] || "");
      const key = ref || saf || aadh || `row_${idx}`;
      map1.set(key, { r, ref, aadh, saf, idx });
    });

    const map3 = new Map();
    d3.forEach((r, idx) => {
      const ref = cleanRef(r["Reference ID"] || r["Reference Number"] || "");
      const aadh = cleanAadhaar(r["Aadhaar Number"] || "");
      const saf = cleanSaf(r["SAF Number"] || "");
      const key = ref || saf || aadh || `row_${idx}`;
      map3.set(key, { r, ref, aadh, saf, idx });
    });

    for (const [key, item1] of map1.entries()) {
      if (!map3.has(key)) {
        removedIn3.push({ sheet: sheetName, key, record: item1 });
      } else {
        const item3 = map3.get(key);
        const r1 = item1.r;
        const r3 = item3.r;
        const keys = new Set([...Object.keys(r1), ...Object.keys(r3)]);
        for (const k of keys) {
          const v1 = String(r1[k] ?? "").trim();
          const v3 = String(r3[k] ?? "").trim();
          if (v1 !== v3) {
            totalDiffs++;
            console.log(`  Diff in [${sheetName}] ref=${item1.ref}, col=[${k}]: "${v1}" -> "${v3}"`);
          }
        }
      }
    }

    for (const [key, item3] of map3.entries()) {
      if (!map1.has(key)) {
        addedIn3.push({ sheet: sheetName, key, record: item3 });
      }
    }
  }

  console.log("\n========================================================");
  console.log(`Summary of Comparison between File (1) and File (3):`);
  console.log(`Total records in File (1): 909`);
  console.log(`Total records in File (3): 908`);
  console.log(`Records removed in File (3): ${removedIn3.length}`);
  console.log(`Records added in File (3): ${addedIn3.length}`);
  console.log(`Cell value differences in common records: ${totalDiffs}`);

  if (removedIn3.length > 0) {
    console.log("\nDetails of record(s) removed in File (3):");
    removedIn3.forEach(x => {
      console.log(`  Sheet: ${x.sheet}`);
      console.log(`  Reference ID: ${x.record.ref}`);
      console.log(`  SAF Number: ${x.record.saf}`);
      console.log(`  Aadhaar Number: ${x.record.aadh}`);
      console.log(`  Name: ${x.record.r["First Name"]} ${x.record.r["Last Name"]}`);
      console.log(`  College: ${x.record.r["College / Institute / University"]}`);
      console.log(`  Batch: ${x.record.r["Batch"]}`);
    });
  }

  // 2. Check the removed candidate in DB
  console.log("\n=== Checking the Removed Candidate in Supabase DB ===");
  if (removedIn3.length > 0) {
    for (const rem of removedIn3) {
      const ref = rem.record.ref;
      const { data: dbRec, error: dbErr } = await supabase
        .from("registrations")
        .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, updated_at")
        .eq("reference_number", ref);
      console.log(`DB Record for ${ref}:`, dbRec);
    }
  }
}

runComparison().catch(console.error);
