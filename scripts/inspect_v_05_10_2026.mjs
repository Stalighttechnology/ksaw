import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function analyze() {
  console.log("=================================================");
  console.log("=== Analyzing V-05.10.2026.xlsx ===");
  console.log("=================================================");

  const authEmail = `inspector_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });
  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }
  console.log("Authenticated successfully.");

  const filePath = path.resolve(__dirname, "../V-05.10.2026.xlsx");
  const wb = xlsx.readFile(filePath);
  console.log("Sheet names in workbook:", wb.SheetNames);

  for (const sname of wb.SheetNames) {
    const sheet = wb.Sheets[sname];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    console.log(`\n--- Sheet: '${sname}', Total Rows: ${data.length} ---`);
    for (let r = 0; r < Math.min(3, data.length); r++) {
      console.log(`Row ${r}:`, data[r].slice(0, 15).filter(c => c !== ""));
    }
  }
}

analyze().catch(console.error);
