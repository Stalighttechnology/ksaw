import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSampleRejectedNotes() {
  const filePath = path.resolve(__dirname, "../approved to dept/Deveraj Urs Final List.xls");
  const wb = xlsx.readFile(filePath);
  const rejSheet = wb.Sheets["Rejected"];
  const rejData = xlsx.utils.sheet_to_json(rejSheet, { header: 1, defval: "" });
  const h = rejData[0].map(c => String(c).trim());
  const refIdx = h.findIndex(c => /reference/i.test(c));

  const refs = rejData.slice(1).map(r => String(r[refIdx]).trim()).filter(Boolean);

  const authEmail = `notes_chk_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const { data: rows } = await supabase
    .from("registrations")
    .select("reference_number, status, admin_notes")
    .in("reference_number", refs.slice(100, 150));

  console.log("Sample rejected records admin_notes (from 100 to 150):");
  rows.slice(0, 5).forEach(r => {
    console.log(`Ref: ${r.reference_number} | status: '${r.status}' | admin_notes: '${r.admin_notes}'`);
  });
}

checkSampleRejectedNotes().catch(console.error);
