import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function analyzeTwoFiles() {
  const f1Path = path.resolve(__dirname, "../approved to dept/Deveraj Urs Final List.xls");
  const f2Path = path.resolve(__dirname, "../approved to dept/D-13.10.2026.xlsx");

  const wb1 = xlsx.readFile(f1Path);
  const wb2 = xlsx.readFile(f2Path);

  // File 1: Deveraj Urs Final List.xls - "Approved" tab
  const s1 = wb1.Sheets["Approved"];
  const d1 = xlsx.utils.sheet_to_json(s1, { header: 1, defval: "" });
  const h1 = d1[0].map(h => String(h).trim());
  const refIdx1 = h1.findIndex(h => /reference/i.test(h));
  const safIdx1 = h1.findIndex(h => /saf/i.test(h));
  const nameIdx1 = h1.findIndex(h => /first\s*name/i.test(h));

  const list1 = [];
  for (let r = 1; r < d1.length; r++) {
    const row = d1[r];
    if (!row || !row.some(c => c !== "")) continue;
    list1.push({
      ref: String(row[refIdx1]).trim(),
      saf: String(row[safIdx1]).trim().replace(/\.$/, ""),
      name: String(row[nameIdx1]).trim()
    });
  }

  // File 2: D-13.10.2026.xlsx - "Master Sheet"
  const s2 = wb2.Sheets["Master Sheet"];
  const d2 = xlsx.utils.sheet_to_json(s2, { header: 1, defval: "" });
  const h2 = d2[0].map(h => String(h).trim());
  const refIdx2 = h2.findIndex(h => /reference/i.test(h));
  const safIdx2 = h2.findIndex(h => /saf/i.test(h));
  const nameIdx2 = h2.findIndex(h => /first\s*name/i.test(h));

  const list2 = [];
  for (let r = 1; r < d2.length; r++) {
    const row = d2[r];
    if (!row || !row.some(c => c !== "")) continue;
    list2.push({
      ref: String(row[refIdx2]).trim(),
      saf: String(row[safIdx2]).trim().replace(/\.$/, ""),
      name: String(row[nameIdx2]).trim()
    });
  }

  // File 2: Sheet2 (19 rows) just to inspect
  const s2_sheet2 = wb2.Sheets["Sheet2"];
  const d2_sheet2 = xlsx.utils.sheet_to_json(s2_sheet2, { header: 1, defval: "" });
  const list2_sheet2 = [];
  for (let r = 1; r < d2_sheet2.length; r++) {
    const row = d2_sheet2[r];
    if (!row || !row.some(c => c !== "")) continue;
    list2_sheet2.push({
      ref: String(row[refIdx2]).trim(),
      saf: String(row[safIdx2]).trim().replace(/\.$/, ""),
      name: String(row[nameIdx2]).trim()
    });
  }

  console.log("=== FILE BREAKDOWN ===");
  console.log(`Deveraj Urs Final List.xls ('Approved' tab): ${list1.length} candidates`);
  console.log(`D-13.10.2026.xlsx ('Master Sheet'): ${list2.length} candidates`);
  console.log(`D-13.10.2026.xlsx ('Sheet2'): ${list2_sheet2.length} candidates`);

  // Check overlap between list1 and list2
  const set1Refs = new Set(list1.map(c => c.ref).filter(Boolean));
  const set1Safs = new Set(list1.map(c => c.saf).filter(Boolean));

  const overlapIn2 = list2.filter(c => set1Refs.has(c.ref) || set1Safs.has(c.saf));
  console.log(`Overlap between 'Approved' tab (313) and 'Master Sheet' (213): ${overlapIn2.length}`);

  const combinedUniqueRefs = new Set([...list1.map(c => c.ref), ...list2.map(c => c.ref)].filter(Boolean));
  console.log(`Combined unique reference numbers across both: ${combinedUniqueRefs.size}`);

  // Query Supabase for current live status
  const authEmail = `count_check_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData?.session) {
    console.error("Auth error:", authErr);
    return;
  }

  const allRefs = Array.from(combinedUniqueRefs);
  let dbRows = [];
  for (let i = 0; i < allRefs.length; i += 100) {
    const chunk = allRefs.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, status, admin_notes")
      .in("reference_number", chunk);
    if (res) dbRows.push(...res);
  }

  const dbStatusMap = new Map();
  dbRows.forEach(r => dbStatusMap.set(r.reference_number, r));

  const list1Sent = list1.filter(c => dbStatusMap.get(c.ref)?.status === "Sent to Department");
  const list2Sent = list2.filter(c => dbStatusMap.get(c.ref)?.status === "Sent to Department");

  console.log("\n=== LIVE SUPABASE STATUS ===");
  console.log(`Deveraj Urs Final List.xls ('Approved' tab): ${list1Sent.length} / ${list1.length} have status 'Sent to Department'`);
  console.log(`D-13.10.2026.xlsx ('Master Sheet'): ${list2Sent.length} / ${list2.length} have status 'Sent to Department'`);

  const uniqueSentToDeptRefs = new Set();
  list1Sent.forEach(c => uniqueSentToDeptRefs.add(c.ref));
  list2Sent.forEach(c => uniqueSentToDeptRefs.add(c.ref));

  console.log(`Total unique candidates currently 'Sent to Department' from these two files: ${uniqueSentToDeptRefs.size}`);

  // Also check if Sheet2 in D-13.10.2026 has any Sent to Dept
  const sheet2Sent = list2_sheet2.filter(c => dbStatusMap.get(c.ref)?.status === "Sent to Department");
  console.log(`D-13.10.2026.xlsx ('Sheet2', 19 rows): ${sheet2Sent.length} / ${list2_sheet2.length} have status 'Sent to Department'`);
}

analyzeTwoFiles().catch(console.error);

