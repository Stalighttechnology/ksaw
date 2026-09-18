import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function inspectRange() {
  let allRows = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, created_at, first_name, last_name, aadhaar_number")
      .order("created_at", { ascending: true })
      .range(from, from + step - 1);

    if (error) {
      console.error(error);
      break;
    }
    if (data && data.length > 0) {
      allRows.push(...data);
      from += step;
      if (data.length < step) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total rows: ${allRows.length}`);

  const numericRefs = [];
  const nonStandardRefs = [];

  for (const r of allRows) {
    const ref = r.reference_number || "";
    const match = ref.match(/^KSAW\s*(\d+)$/i);
    if (match) {
      numericRefs.push({ num: parseInt(match[1], 10), raw: ref, row: r });
    } else {
      nonStandardRefs.push({ raw: ref, row: r });
    }
  }

  numericRefs.sort((a, b) => a.num - b.num);

  console.log(`Standard KSAW numbers count: ${numericRefs.length}`);
  console.log(`Non-standard reference numbers count: ${nonStandardRefs.length}`);
  if (nonStandardRefs.length > 0) {
    console.log("Non-standard sample:", nonStandardRefs.slice(0, 10));
  }

  console.log(`Min numeric reference: ${numericRefs[0]?.raw} (num: ${numericRefs[0]?.num})`);
  console.log(`Max numeric reference: ${numericRefs[numericRefs.length - 1]?.raw} (num: ${numericRefs[numericRefs.length - 1]?.num})`);
}

inspectRange().catch(console.error);
