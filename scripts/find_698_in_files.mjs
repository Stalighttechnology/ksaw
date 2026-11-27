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

async function find698InFiles() {
  const authEmail = `find_698_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  // 1. Fetch all 698 candidates
  let page = 0;
  let candidates = [];
  while (true) {
    const { data } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .eq("status", "Rejected")
      .eq("nigama", "Veerashaiva Lingayat")
      .eq("admin_notes", "Rejected by Department (16-10-2026)")
      .range(page * 1000, (page + 1) * 1000 - 1);

    if (!data || data.length === 0) break;
    candidates.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`Fetched ${candidates.length} candidates from DB.`);
  const refSet = new Set(candidates.map(c => c.reference_number).filter(Boolean));
  const safSet = new Set(candidates.map(c => c.saf_number).filter(Boolean));

  // 2. Check each file in 'approved to dept'
  const folder = path.resolve(__dirname, "../approved to dept");
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".xlsx") || f.endsWith(".xls"));

  for (const f of files) {
    try {
      const wb = xlsx.readFile(path.join(folder, f));
      for (const s of wb.SheetNames) {
        const rows = xlsx.utils.sheet_to_json(wb.Sheets[s], { header: 1, defval: "" });
        if (rows.length === 0) continue;
        const h = rows[0].map(c => String(c).trim());
        const refIdx = h.findIndex(c => /reference/i.test(c));
        const safIdx = h.findIndex(c => /saf/i.test(c));

        let matchCount = 0;
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r];
          const ref = refIdx >= 0 ? String(row[refIdx]).trim() : "";
          const saf = safIdx >= 0 ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
          if ((ref && refSet.has(ref)) || (saf && safSet.has(saf))) {
            matchCount++;
          }
        }
        if (matchCount > 0) {
          console.log(`File: ${f} | Sheet: "${s}" -> Matched ${matchCount} of the 698 candidates! (Total sheet rows: ${rows.length - 1})`);
        }
      }
    } catch (err) {
      // ignore
    }
  }
}

find698InFiles().catch(console.error);
