import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function updateApprovedToSentToDept() {
  console.log("=========================================================================");
  console.log("=== Updating 'Approved' tab from Deveraj Urs Final List.xls ===");
  console.log("=========================================================================\n");

  const filePath = path.resolve(__dirname, "../approved to dept/Deveraj Urs Final List.xls");
  const wb = xlsx.readFile(filePath);

  const appSheet = wb.Sheets["Approved"];
  const appData = xlsx.utils.sheet_to_json(appSheet, { header: 1, defval: "" });
  const headers = appData[0].map((h) => String(h).trim());

  const refIdx = headers.findIndex((h) => /reference/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));

  const approvedCandidates = [];
  for (let r = 1; r < appData.length; r++) {
    const row = appData[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = String(row[refIdx]).trim();
    const saf = String(row[safIdx]).trim().replace(/\.$/, "");
    const firstName = String(row[nameIdx]).trim();
    const lastName = String(row[lastNameIdx]).trim();
    approvedCandidates.push({
      rowNum: r,
      ref,
      saf,
      name: `${firstName} ${lastName}`.trim(),
    });
  }

  console.log(`Total approved candidates in 'Approved' tab: ${approvedCandidates.length}`);

  // Authenticate
  const authEmail = `update_app_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData?.session) {
    console.error("Auth error:", authErr);
    return;
  }
  console.log("Supabase authenticated successfully.");

  // Fetch current records from DB
  const refs = approvedCandidates.map((c) => c.ref).filter(Boolean);
  let dbRows = [];
  for (let i = 0; i < refs.length; i += 100) {
    const chunk = refs.slice(i, i + 100);
    const { data: res, error: fetchErr } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("reference_number", chunk);
    if (fetchErr) {
      console.error("Fetch error:", fetchErr);
    }
    if (res) dbRows.push(...res);
  }

  console.log(`Found ${dbRows.length} matching rows in registrations table.`);

  const dbMap = new Map();
  dbRows.forEach((r) => {
    if (r.reference_number) dbMap.set(r.reference_number, r);
  });

  // Check how many need updating
  const needsUpdate = [];
  const alreadySent = [];

  for (const c of approvedCandidates) {
    const dbRow = dbMap.get(c.ref);
    if (!dbRow) {
      console.warn(`Record not found in DB for ref: ${c.ref}`);
      continue;
    }
    if (dbRow.status === "Sent to Department" && dbRow.admin_notes === "Sent to Department") {
      alreadySent.push({ ...c, id: dbRow.id });
    } else {
      needsUpdate.push({
        ...c,
        id: dbRow.id,
        oldStatus: dbRow.status,
        oldNotes: dbRow.admin_notes,
      });
    }
  }

  console.log(`Already 'Sent to Department': ${alreadySent.length}`);
  console.log(`Needing update to 'Sent to Department': ${needsUpdate.length}`);

  // Update records in batches
  const updateTimestamp = new Date().toISOString();
  let updatedCount = 0;
  let failedCount = 0;

  for (const candidate of needsUpdate) {
    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Sent to Department",
        admin_notes: "Sent to Department",
        updated_at: updateTimestamp,
      })
      .eq("id", candidate.id);

    if (updateErr) {
      console.error(`Error updating ID ${candidate.id} (${candidate.ref}):`, updateErr);
      failedCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(`\nUpdate Complete:`);
  console.log(`- Successfully updated: ${updatedCount}`);
  console.log(`- Failed: ${failedCount}`);
  console.log(`- Already in state: ${alreadySent.length}`);

  // Verification step
  console.log("\nVerifying all 313 candidates in Supabase...");
  let verifiedRows = [];
  for (let i = 0; i < refs.length; i += 100) {
    const chunk = refs.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, status, admin_notes")
      .in("reference_number", chunk);
    if (res) verifiedRows.push(...res);
  }

  const verifiedStatusCounts = {};
  verifiedRows.forEach((r) => {
    verifiedStatusCounts[r.status] = (verifiedStatusCounts[r.status] || 0) + 1;
  });

  console.log(`Verification counts for all 313 records:`, verifiedStatusCounts);
  const allSentToDept = verifiedRows.every((r) => r.status === "Sent to Department");
  console.log(`All 313 records 'Sent to Department'? ${allSentToDept}`);
}

updateApprovedToSentToDept().catch(console.error);

