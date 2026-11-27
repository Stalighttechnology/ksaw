import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectApprovedTab() {
  console.log("=========================================================================");
  console.log("=== Inspecting 'Approved' tab in Deveraj Urs Final List.xls ===");
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
  const uniqueRefs = [...new Set(approvedCandidates.map((c) => c.ref).filter(Boolean))];
  const uniqueSafs = [...new Set(approvedCandidates.map((c) => c.saf).filter(Boolean))];
  console.log(`Unique References: ${uniqueRefs.length}`);
  console.log(`Unique SAFs: ${uniqueSafs.length}`);

  // Authenticate
  const authEmail = `inspect_app_${Date.now()}@gleamator.com`;
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

  // Query DB by reference_number
  let dbRows = [];
  for (let i = 0; i < uniqueRefs.length; i += 100) {
    const chunk = uniqueRefs.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("reference_number", chunk);
    if (res) dbRows.push(...res);
  }

  console.log(`Matched by Reference in DB: ${dbRows.length} / ${approvedCandidates.length}`);

  // If any missing by ref, check by saf
  const matchedRefs = new Set(dbRows.map((r) => r.reference_number));
  const missingByRef = approvedCandidates.filter((c) => !matchedRefs.has(c.ref));
  if (missingByRef.length > 0) {
    console.log(`Missing by Ref (${missingByRef.length}), querying by SAF...`);
    const safs = missingByRef.map((c) => c.saf).filter(Boolean);
    for (let i = 0; i < safs.length; i += 100) {
      const chunk = safs.slice(i, i + 100);
      const { data: res } = await supabase
        .from("registrations")
        .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
        .in("saf_number", chunk);
      if (res) dbRows.push(...res);
    }
  }

  const dbMap = new Map();
  dbRows.forEach((r) => {
    if (r.reference_number) dbMap.set(r.reference_number, r);
    if (r.saf_number) dbMap.set(r.saf_number, r);
  });

  const matched = [];
  const missing = [];
  const statusCounts = {};

  for (const c of approvedCandidates) {
    const dbRow = dbMap.get(c.ref) || dbMap.get(c.saf);
    if (dbRow) {
      matched.push({ ...c, dbId: dbRow.id, currentStatus: dbRow.status, currentNotes: dbRow.admin_notes });
      statusCounts[dbRow.status] = (statusCounts[dbRow.status] || 0) + 1;
    } else {
      missing.push(c);
    }
  }

  console.log(`\nMatched Candidates: ${matched.length} / ${approvedCandidates.length}`);
  console.log("Current DB Status distribution of Approved tab:", statusCounts);
  if (missing.length > 0) {
    console.log("Missing candidates:", missing);
  }

  console.log("\nSample 5 records from 'Approved' tab:");
  matched.slice(0, 5).forEach((m, idx) => {
    console.log(`[${idx + 1}] Ref: ${m.ref} | SAF: ${m.saf} | Name: ${m.name} | Status: '${m.currentStatus}' | Notes: '${m.currentNotes}'`);
  });
}

inspectApprovedTab().catch(console.error);

