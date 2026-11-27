import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function fullAudit() {
  const f1Path = path.resolve(__dirname, "../approved to dept/Deveraj Urs Final List.xls");
  const f2Path = path.resolve(__dirname, "../approved to dept/D-13.10.2026.xlsx");

  const wb1 = xlsx.readFile(f1Path);
  const wb2 = xlsx.readFile(f2Path);

  // Authenticate
  const authEmail = `audit_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  // Extract all refs from wb1
  const s1_app = xlsx.utils.sheet_to_json(wb1.Sheets["Approved"], { header: 1, defval: "" });
  const s1_rej = xlsx.utils.sheet_to_json(wb1.Sheets["Rejected"], { header: 1, defval: "" });
  
  const getRefs = (data) => {
    const h = data[0].map(c => String(c).trim());
    const idx = h.findIndex(c => /reference/i.test(c));
    return data.slice(1).map(r => String(r[idx]).trim()).filter(Boolean);
  };

  const refs_f1_app = getRefs(s1_app);
  const refs_f1_rej = getRefs(s1_rej);

  const s2_master = xlsx.utils.sheet_to_json(wb2.Sheets["Master Sheet"], { header: 1, defval: "" });
  const s2_sheet2 = xlsx.utils.sheet_to_json(wb2.Sheets["Sheet2"], { header: 1, defval: "" });

  const refs_f2_master = getRefs(s2_master);
  const refs_f2_sheet2 = getRefs(s2_sheet2);

  const allRefs = [...new Set([...refs_f1_app, ...refs_f1_rej, ...refs_f2_master, ...refs_f2_sheet2])];

  let dbRows = [];
  for (let i = 0; i < allRefs.length; i += 100) {
    const chunk = allRefs.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, status")
      .in("reference_number", chunk);
    if (res) dbRows.push(...res);
  }

  const map = new Map();
  dbRows.forEach(r => map.set(r.reference_number, r.status));

  console.log("F1 Approved Tab (313):", refs_f1_app.filter(r => map.get(r) === "Sent to Department").length, "in Sent to Department");
  console.log("F1 Rejected Tab (209):", refs_f1_rej.filter(r => map.get(r) === "Sent to Department").length, "in Sent to Department");
  console.log("F2 Master Sheet (213):", refs_f2_master.filter(r => map.get(r) === "Sent to Department").length, "in Sent to Department");
  console.log("F2 Sheet2 (18):", refs_f2_sheet2.filter(r => map.get(r) === "Sent to Department").length, "in Sent to Department");
}

fullAudit().catch(console.error);

