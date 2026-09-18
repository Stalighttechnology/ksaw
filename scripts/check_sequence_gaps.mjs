import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkSequenceAndGaps() {
  let allRows = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, created_at")
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

  console.log(`Total rows in DB: ${allRows.length}`);

  const nums = [];
  for (const r of allRows) {
    const d = (r.reference_number || "").replace(/\D/g, "");
    if (d) {
      nums.push({ num: parseInt(d, 10), id: r.id, created_at: r.created_at, ref: r.reference_number });
    }
  }

  const existingNumSet = new Set(nums.map(n => n.num));
  const minNum = Math.min(...nums.map(n => n.num));
  const maxNum = Math.max(...nums.map(n => n.num));

  console.log(`Min Ref Number: ${minNum}, Max Ref Number: ${maxNum}`);
  console.log(`Total records with numeric ref: ${nums.length}`);
  console.log(`Unique ref numbers: ${existingNumSet.size}`);

  const missingNumbers = [];
  for (let i = 1; i <= maxNum; i++) {
    if (!existingNumSet.has(i)) {
      missingNumbers.push(i);
    }
  }

  console.log(`Missing numbers count between 1 and ${maxNum}: ${missingNumbers.length}`);
  if (missingNumbers.length > 0) {
    console.log(`Sample missing numbers:`, missingNumbers.slice(0, 30));
  }
}

checkSequenceAndGaps().catch(console.error);
