import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verify617Composition() {
  const f1Path = path.resolve(__dirname, "../approved to dept/Deveraj Urs Final List.xls");
  const f2Path = path.resolve(__dirname, "../approved to dept/D-13.10.2026.xlsx");

  const wb1 = xlsx.readFile(f1Path);
  const wb2 = xlsx.readFile(f2Path);

  const getRefs = (sheet) => {
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    const h = data[0].map(c => String(c).trim());
    const idx = h.findIndex(c => /reference/i.test(c));
    return new Set(data.slice(1).map(r => String(r[idx]).trim()).filter(Boolean));
  };

  const f1AppRefs = getRefs(wb1.Sheets["Approved"]); // 313
  const f1RejRefs = getRefs(wb1.Sheets["Rejected"]); // 209
  const f2MasterRefs = getRefs(wb2.Sheets["Master Sheet"]); // 213
  const f2Sheet2Refs = getRefs(wb2.Sheets["Sheet2"]); // 18

  const authEmail = `verify_617_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  // Fetch all 617 rows with nigama = 'Devraj Urs' and status = 'Sent to Department'
  let all617 = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from("registrations")
      .select("id, reference_number, nigama, status")
      .eq("nigama", "Devraj Urs")
      .eq("status", "Sent to Department")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    all617.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`Total 'Devraj Urs' records with status 'Sent to Department' in DB: ${all617.length}`);

  let inF1App = 0;
  let inF1Rej = 0;
  let inF2Master = 0;
  let inF2Sheet2 = 0;
  let inOthers = 0;

  for (const r of all617) {
    const ref = r.reference_number;
    if (f1AppRefs.has(ref)) inF1App++;
    else if (f1RejRefs.has(ref)) inF1Rej++;
    else if (f2MasterRefs.has(ref)) inF2Master++;
    else if (f2Sheet2Refs.has(ref)) inF2Sheet2++;
    else inOthers++;
  }

  console.log("Breakdown of the 617 records:");
  console.log(`- From Deveraj Urs Final List.xls [Approved tab]: ${inF1App}`);
  console.log(`- From D-13.10.2026.xlsx [Master Sheet]: ${inF2Master}`);
  console.log(`- Subtotal intended Approved: ${inF1App + inF2Master}`);
  console.log(`- From Deveraj Urs Final List.xls [Rejected tab]: ${inF1Rej}`);
  console.log(`- From D-13.10.2026.xlsx [Sheet2]: ${inF2Sheet2}`);
  console.log(`- Other Devraj Urs candidates: ${inOthers}`);
}

verify617Composition().catch(console.error);

