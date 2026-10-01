import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runUpdate() {
  console.log("=========================================================================");
  console.log("=== Updating V-21.09.2026 (1).xlsx records to 'Approved by Dept' ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_v21_1_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established successfully.");

  // 2. Load DB records for matching
  let allDbRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
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

  // 3. Read Excel file
  const excelFilePath = path.resolve(__dirname, "../public/V-21.09.2026 (1).xlsx");
  const wb = xlsx.readFile(excelFilePath);
  const sheet = wb.Sheets["Master Sheet"];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  console.log(`Extracted ${rows.length} rows from Master Sheet in V-21.09.2026 (1).xlsx.`);

  const toUpdate = [];
  const unmatched = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const rawRef = r["Reference ID"] || r["Ref ID"] || r["Reference Number"] || "";
    const rawSaf = r["SAF Number"] || r["SAF No"] || "";
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || "";
    const rawName = `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim();

    const cRef = cleanRef(rawRef);
    const cAadhaar = cleanAadhaar(rawAadhaar);
    const cSaf = cleanSaf(rawSaf);

    const match = allDbRows.find((p) => {
      const pRef = cleanRef(p.reference_number);
      const pAadhaar = cleanAadhaar(p.aadhaar_number);
      const pSaf = cleanSaf(p.saf_number);

      if (cRef && pRef && pRef === cRef) return true;
      if (cAadhaar && pAadhaar && cAadhaar.length >= 10 && pAadhaar === cAadhaar) return true;
      if (cSaf && pSaf && cSaf.startsWith("SAF") && pSaf === cSaf) return true;
      return false;
    });

    if (match) {
      toUpdate.push({
        dbId: match.id,
        ref: match.reference_number,
        name: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
        oldStatus: match.status,
        newStatus: "Approved by Dept",
        saf: match.saf_number,
      });
    } else {
      unmatched.push({ row: idx + 1, rawRef, rawName, rawAadhaar, rawSaf });
    }
  }

  console.log(`\nMatched: ${toUpdate.length} | Unmatched: ${unmatched.length}`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const item of toUpdate) {
    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Approved by Dept",
        admin_notes: "Approved by Dept",
      })
      .eq("id", item.dbId);

    if (updateErr) {
      console.error(`Error updating record ${item.ref}:`, updateErr.message);
      errorCount++;
    } else {
      updatedCount++;
      console.log(`[${updatedCount}/${toUpdate.length}] Updated ${item.ref} (${item.name}) from "${item.oldStatus}" -> "Approved by Dept"`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`=== BATCH UPDATE COMPLETED ===`);
  console.log(`Successfully Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Unmatched: ${unmatched.length}`);
  console.log(`======================================================`);
}

runUpdate();
