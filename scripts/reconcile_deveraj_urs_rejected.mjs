import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function reconcileRejectedTab() {
  console.log("=========================================================================");
  console.log("=== Reconciling 'Rejected' tab in Deveraj Urs Final List.xls ===");
  console.log("=========================================================================\n");

  const filePath = path.resolve(__dirname, "../approved to dept/Deveraj Urs Final List.xls");
  const wb = xlsx.readFile(filePath);

  const rejSheet = wb.Sheets["Rejected"];
  const rejData = xlsx.utils.sheet_to_json(rejSheet, { header: 1, defval: "" });
  const headers = rejData[0].map((h) => String(h).trim());

  const refIdx = headers.findIndex((h) => /reference/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));
  const nameIdx = headers.findIndex((h) => /first\s*name/i.test(h));
  const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));

  const rejectedCandidates = [];
  for (let r = 1; r < rejData.length; r++) {
    const row = rejData[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = String(row[refIdx]).trim();
    const saf = String(row[safIdx]).trim().replace(/\.$/, "");
    const firstName = String(row[nameIdx]).trim();
    const lastName = String(row[lastNameIdx]).trim();
    rejectedCandidates.push({
      rowNum: r,
      ref,
      saf,
      name: `${firstName} ${lastName}`.trim(),
    });
  }

  console.log(`Total rejected candidates in 'Rejected' tab: ${rejectedCandidates.length}`);

  // Authenticate
  const authEmail = `reconcile_rej_${Date.now()}@gleamator.com`;
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

  // Fetch current DB rows
  const refs = rejectedCandidates.map((c) => c.ref).filter(Boolean);
  let dbRows = [];
  for (let i = 0; i < refs.length; i += 100) {
    const chunk = refs.slice(i, i + 100);
    const { data: res, error: fetchErr } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, status, admin_notes")
      .in("reference_number", chunk);
    if (fetchErr) console.error("Fetch error:", fetchErr);
    if (res) dbRows.push(...res);
  }

  console.log(`Matched ${dbRows.length} rows in registrations table.`);

  const dbMap = new Map();
  dbRows.forEach((r) => dbMap.set(r.reference_number, r));

  const needsRejection = [];
  const alreadyRejected = [];

  for (const c of rejectedCandidates) {
    const dbRow = dbMap.get(c.ref);
    if (!dbRow) {
      console.warn(`Record not found in DB for ref: ${c.ref}`);
      continue;
    }
    if (dbRow.status === "Rejected") {
      alreadyRejected.push({ ...c, id: dbRow.id });
    } else {
      needsRejection.push({
        ...c,
        id: dbRow.id,
        currentStatus: dbRow.status,
        currentNotes: dbRow.admin_notes,
      });
    }
  }

  console.log(`Already marked 'Rejected': ${alreadyRejected.length}`);
  console.log(`To update to 'Rejected': ${needsRejection.length}`);

  const updateTimestamp = new Date().toISOString();
  let updatedCount = 0;
  let failedCount = 0;

  for (const candidate of needsRejection) {
    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Rejected",
        admin_notes: "Rejected by Department (16-10-2026)",
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

  console.log(`\nReconciliation Complete:`);
  console.log(`- Successfully updated to Rejected: ${updatedCount}`);
  console.log(`- Failed: ${failedCount}`);
  console.log(`- Already Rejected: ${alreadyRejected.length}`);

  // Comprehensive Post-Update Verification
  console.log("\n=== POST-UPDATE VERIFICATION ===");

  // 1. Verify Rejected tab (all 209)
  let verifiedRejRows = [];
  for (let i = 0; i < refs.length; i += 100) {
    const chunk = refs.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, status, admin_notes")
      .in("reference_number", chunk);
    if (res) verifiedRejRows.push(...res);
  }

  const rejCounts = {};
  verifiedRejRows.forEach((r) => {
    rejCounts[r.status] = (rejCounts[r.status] || 0) + 1;
  });
  console.log(`1. 'Rejected' tab (209 records) status distribution:`, rejCounts);

  // 2. Verify total Devraj Urs in 'Sent to Department' in entire DB
  let allDevrajSent = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from("registrations")
      .select("id, reference_number, status")
      .eq("nigama", "Devraj Urs")
      .eq("status", "Sent to Department")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allDevrajSent.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`2. Total 'Devraj Urs' records in DB with status 'Sent to Department': ${allDevrajSent.length}`);
}

reconcileRejectedTab().catch(console.error);

