import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectFormats() {
  let allRows = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number")
      .range(from, from + step - 1);

    if (error) break;
    if (data && data.length > 0) {
      allRows.push(...data);
      from += step;
      if (data.length < step) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  const lengthMap = new Map();
  for (const r of allRows) {
    const ref = r.reference_number || "";
    const len = ref.length;
    lengthMap.set(len, (lengthMap.get(len) || 0) + 1);
  }

  console.log("Length distribution of reference_number:", Object.fromEntries(lengthMap));

  // Sample items of different lengths
  for (const len of lengthMap.keys()) {
    const samples = allRows.filter(r => (r.reference_number || "").length === len).slice(0, 3);
    console.log(`Length ${len} samples:`, samples.map(s => s.reference_number));
  }
}

inspectFormats().catch(console.error);
