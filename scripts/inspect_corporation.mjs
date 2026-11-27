import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectSchemaAndCount() {
  const authEmail = `schema_check_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr) {
    console.error("Auth error:", authErr);
    return;
  }

  // Get one row to see all column names
  const { data: sampleRows, error: sampleErr } = await supabase
    .from("registrations")
    .select("*")
    .limit(1);

  if (sampleErr) {
    console.error("Sample row error:", sampleErr);
    return;
  }

  const columns = Object.keys(sampleRows[0] || {});
  console.log("All columns in registrations:", columns);

  // Look for any corporation, department, nigama, category column
  const candidateCols = columns.filter(c => /corp|dept|nigam|board|schem|cat/i.test(c));
  console.log("Relevant columns:", candidateCols);

  // Let's also check distinct values in these relevant columns
  for (const col of candidateCols) {
    const { data: distinctVals } = await supabase
      .from("registrations")
      .select(col)
      .limit(100);
    const unique = [...new Set(distinctVals?.map(v => v[col]).filter(Boolean))];
    console.log(`Sample values in '${col}':`, unique.slice(0, 10));
  }
}

inspectSchemaAndCount().catch(console.error);

