import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectD13() {
  console.log("=========================================================================");
  console.log("=== Inspecting approved to dept/D-13.10.2026.xlsx ===");
  console.log("=========================================================================\n");

  const filePath = path.resolve(__dirname, "../approved to dept/D-13.10.2026.xlsx");
  const wb = xlsx.readFile(filePath);

  // Master Sheet
  const ms = wb.Sheets["Master Sheet"];
  const msData = xlsx.utils.sheet_to_json(ms, { header: 1, defval: "" });
  const msHeaders = msData[0].map(h => String(h).trim());
  const refIdx = msHeaders.findIndex(h => /reference/i.test(h));
  const aadhIdx = msHeaders.findIndex(h => /aadhaar/i.test(h));
  const safIdx = msHeaders.findIndex(h => /saf/i.test(h));
  const statusIdx = msHeaders.findIndex(h => /^status$/i.test(h));
  const notesIdx = msHeaders.findIndex(h => /admin\s*notes/i.test(h));

  const msRecords = [];
  for (let r = 1; r < msData.length; r++) {
    const row = msData[r];
    if (!row || !row.some(c => c !== "")) continue;
    msRecords.push({
      ref: String(row[refIdx]).trim(),
      aadhaar: String(row[aadhIdx]).trim().replace(/\s+/g, ""),
      saf: String(row[safIdx]).trim().replace(/\.$/, ""),
      name: `${row[8]} ${row[9]}`.trim(),
      status: row[statusIdx],
      notes: row[notesIdx],
    });
  }
  console.log(`Master Sheet candidates: ${msRecords.length}`);

  // Sheet2
  const s2 = wb.Sheets["Sheet2"];
  const s2Data = xlsx.utils.sheet_to_json(s2, { header: 1, defval: "" });
  const s2Records = [];
  for (let r = 0; r < s2Data.length; r++) {
    const row = s2Data[r];
    if (!row || !row.some(c => c !== "")) continue;
    s2Records.push({
      ref: String(row[0]).trim(),
      saf: String(row[1]).trim().replace(/\.$/, ""),
      name: `${row[8]} ${row[9]}`.trim(),
      aadhaar: String(row[28]).trim().replace(/\s+/g, ""),
      status: row[4],
      notes: row[5],
    });
  }
  console.log(`Sheet2 candidates: ${s2Records.length}`);

  // Auth Supabase
  const authEmail = `inspect_d13_${Date.now()}@gleamator.com`;
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

  // Check Master Sheet in DB
  const msAadhaars = msRecords.map(r => r.aadhaar).filter(Boolean);
  let msDbRows = [];
  for (let i = 0; i < msAadhaars.length; i += 100) {
    const chunk = msAadhaars.slice(i, i + 100);
    const { data: res } = await supabase.from("registrations").select("id, reference_number, aadhaar_number, first_name, last_name, status, admin_notes").in("aadhaar_number", chunk);
    if (res) msDbRows.push(...res);
  }
  console.log(`Master Sheet matched in DB: ${msDbRows.length} / ${msRecords.length}`);
  const msDbStatus = {};
  msDbRows.forEach(r => { msDbStatus[r.status] = (msDbStatus[r.status] || 0) + 1; });
  console.log("Master Sheet current DB status:", msDbStatus);

  // Check Sheet2 in DB
  const s2Aadhaars = s2Records.map(r => r.aadhaar).filter(Boolean);
  let s2DbRows = [];
  for (let i = 0; i < s2Aadhaars.length; i += 100) {
    const chunk = s2Aadhaars.slice(i, i + 100);
    const { data: res } = await supabase.from("registrations").select("id, reference_number, aadhaar_number, first_name, last_name, status, admin_notes").in("aadhaar_number", chunk);
    if (res) s2DbRows.push(...res);
  }
  console.log(`Sheet2 matched in DB: ${s2DbRows.length} / ${s2Records.length}`);
  const s2DbStatus = {};
  s2DbRows.forEach(r => { s2DbStatus[r.status] = (s2DbStatus[r.status] || 0) + 1; });
  console.log("Sheet2 current DB status:", s2DbStatus);

  // Sample 5 records from Master Sheet
  console.log("\nSample 5 records from Master Sheet:");
  msDbRows.slice(0, 5).forEach((r, idx) => {
    console.log(`[${idx + 1}] Ref: ${r.reference_number} | Aadhaar: ${r.aadhaar_number} | Name: ${r.first_name} ${r.last_name} | Status: '${r.status}' | Notes: '${r.admin_notes}'`);
  });
}

inspectD13().catch(console.error);

