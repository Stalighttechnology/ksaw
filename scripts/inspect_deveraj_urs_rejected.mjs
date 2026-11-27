import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectRejectedTab() {
  const filePath = path.resolve(__dirname, "../approved to dept/Deveraj Urs Final List.xls");
  const wb = xlsx.readFile(filePath);

  const rejSheet = wb.Sheets["Rejected"];
  const rejData = xlsx.utils.sheet_to_json(rejSheet, { header: 1, defval: "" });
  const headers = rejData[0].map((h) => String(h).trim());

  const refIdx = headers.findIndex((h) => /reference/i.test(h));
  const safIdx = headers.findIndex((h) => /saf/i.test(h));

  const rejectedCandidates = [];
  for (let r = 1; r < rejData.length; r++) {
    const row = rejData[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const ref = String(row[refIdx]).trim();
    const saf = String(row[safIdx]).trim().replace(/\.$/, "");
    rejectedCandidates.push({ rowNum: r, ref, saf });
  }

  console.log(`Total rejected candidates in 'Rejected' tab: ${rejectedCandidates.length}`);

  const authEmail = `inspect_rej_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData?.session) {
    console.error("Auth error:", authErr);
    return;
  }

  const refs = rejectedCandidates.map((c) => c.ref).filter(Boolean);
  let dbRows = [];
  for (let i = 0; i < refs.length; i += 100) {
    const chunk = refs.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, status, admin_notes")
      .in("reference_number", chunk);
    if (res) dbRows.push(...res);
  }

  const statusCounts = {};
  dbRows.forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });

  console.log(`Matched by Reference in DB: ${dbRows.length} / ${rejectedCandidates.length}`);
  console.log("Current DB Status distribution of Rejected tab:", statusCounts);
}

inspectRejectedTab().catch(console.error);

