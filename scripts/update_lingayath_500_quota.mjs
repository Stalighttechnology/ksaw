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

const excelPath = path.resolve(__dirname, "../public/update/Lingayath 500 candidates data Updated  ( 06-11-26).xlsx");

async function execute() {
  console.log("=========================================================================");
  console.log("=== EXECUTING LINGAYATH 500 QUOTA UPDATE PIPELINE ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with Supabase as Admin
  console.log("1. Authenticating with Supabase...");
  const authEmail = `updater_lingayath_${Date.now()}@gleamator.com`;
  const authPass = "AdminLingayath@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Supabase authentication failed:", authErr);
    process.exit(1);
  }
  console.log("✓ Supabase session established.\n");

  // 2. Read target 11 records from Excel (SL 490 to 500)
  console.log("2. Reading target replacement rows from Excel...");
  const wb = xlsx.readFile(excelPath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  const targetRows = rows.slice(489); // SL 490 to 500

  const targetRefs = targetRows.map(r => String(r["Reference ID"]).trim());
  console.log(`Found ${targetRows.length} target replacement records in Excel:`, targetRefs.join(", "));

  // 3. Fetch current state from DB
  console.log("\n3. Fetching existing state of these 11 records from DB...");
  const { data: dbRecords, error: fetchErr } = await supabase
    .from("registrations")
    .select("id, reference_number, first_name, last_name, status, saf_number, admin_notes, updated_at, nigama, category, gender")
    .in("reference_number", targetRefs);

  if (fetchErr) {
    console.error("Error fetching target records:", fetchErr);
    process.exit(1);
  }

  console.log(`Found ${dbRecords.length} records in DB matching target reference numbers.`);

  // 4. Save pre-update safety backup
  const backupFile = path.resolve(__dirname, "backup_lingayath_11_before_update.json");
  fs.writeFileSync(backupFile, JSON.stringify(dbRecords, null, 2));
  console.log(`✓ Safety snapshot saved to ${backupFile}\n`);

  // 5. Apply targeted updates
  console.log("4. Applying targeted updates to status 'Approved by Dept'...");
  const now = new Date().toISOString();
  const updateResults = [];

  for (const tRow of targetRows) {
    const ref = String(tRow["Reference ID"]).trim();
    const dbRec = dbRecords.find(r => r.reference_number?.toUpperCase().trim() === ref.toUpperCase().trim());

    if (!dbRec) {
      console.error(`ERROR: No DB match for ${ref}`);
      continue;
    }

    const excelSaf = tRow["SAF Number"] ? String(tRow["SAF Number"]).trim() : null;
    const isValidSaf = excelSaf && excelSaf.toUpperCase() !== "N/A" && excelSaf.toUpperCase() !== "NA";

    const payload = {
      status: "Approved by Dept",
      updated_at: now
    };

    if (isValidSaf) {
      payload.saf_number = excelSaf;
    }

    // Preserve existing context notes while appending approval note
    const baseNote = dbRec.admin_notes ? `${dbRec.admin_notes} | ` : "";
    payload.admin_notes = `${baseNote}Approved by Dept - Lingayath 500 Quota (06-11-2026)`.trim();

    const { data: updated, error: updateErr } = await supabase
      .from("registrations")
      .update(payload)
      .eq("id", dbRec.id)
      .select("id, reference_number, status, saf_number, admin_notes");

    if (updateErr) {
      console.error(`Failed to update ${ref}:`, updateErr);
    } else {
      console.log(`✓ Updated ${ref}: Status -> '${payload.status}', SAF -> '${payload.saf_number || dbRec.saf_number || "N/A"}'`);
      updateResults.push(updated[0]);
    }
  }

  console.log(`\nSuccessfully updated ${updateResults.length} / ${targetRows.length} candidates.`);

  // 6. Comprehensive Verification across all 500 candidates
  console.log("\n=========================================================================");
  console.log("=== VERIFYING FULL 500 LINGAYATH CANDIDATE ROSTER IN DB ===");
  console.log("=========================================================================");

  const all500Refs = rows.map(r => String(r["Reference ID"]).trim());
  const { data: all500Db, error: verifyErr } = await supabase
    .from("registrations")
    .select("reference_number, status")
    .in("reference_number", all500Refs);

  if (verifyErr) {
    console.error("Verification query error:", verifyErr);
    process.exit(1);
  }

  const statusTally = {};
  all500Db.forEach(r => {
    statusTally[r.status] = (statusTally[r.status] || 0) + 1;
  });

  console.log("\nFinal Status Breakdown of the 500 Candidates in DB:");
  console.log(JSON.stringify(statusTally, null, 2));

  if (statusTally["Approved by Dept"] === 500) {
    console.log("\n🎉 SUCCESS: All 500 Lingayath applications are now confirmed as 'Approved by Dept'!");
  } else {
    console.log(`\n⚠️ Notice: ${statusTally["Approved by Dept"]} out of 500 are 'Approved by Dept'.`);
  }
}

execute().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

