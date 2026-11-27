import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

// Let's import the actual normalization functions from options.ts by testing how admin.tsx builds allowedInstitutionsForApproved
const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function exactAdminQuery() {
  const authEmail = `exact_q_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  // Let's query registrations count in Supabase exactly as admin.tsx does with allowedInstitutionsForApproved
  // In admin.tsx:
  // q = q.ilike("category", "OBC").ilike("gender", "Female").ilike("religion", "Hindu");
  // q = q.eq("status", "Approved");
  // q = q.in("nigama", ["Veerashaiva Lingayat", ...aliases]);
  // q = q.in("institution_name", allowedInstitutionsForApproved);

  // First fetch all registrations to compute partnerPipelineCounts with normalized names
  let allRows = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from("registrations")
      .select("id, institution_name, status, nigama")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  console.log("Total rows in DB:", allRows.length);
}

exactAdminQuery().catch(console.error);
