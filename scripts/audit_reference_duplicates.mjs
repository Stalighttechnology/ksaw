import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function analyze() {
  console.log("Fetching all registrations to audit duplicate reference numbers...");

  // Fetch all registrations in batches
  let allRows = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, created_at, first_name, last_name, aadhaar_number, saf_number, center_location, institution_name, status, admin_notes")
      .order("created_at", { ascending: true })
      .range(from, from + step - 1);

    if (error) {
      console.error("Error fetching rows:", error);
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

  console.log(`Total rows fetched: ${allRows.length}`);

  // Count frequencies of reference_number
  const refMap = new Map();
  let nullOrEmptyCount = 0;

  for (const row of allRows) {
    const ref = row.reference_number ? row.reference_number.trim() : null;
    if (!ref) {
      nullOrEmptyCount++;
      continue;
    }
    if (!refMap.has(ref)) {
      refMap.set(ref, []);
    }
    refMap.get(ref).push(row);
  }

  console.log(`Unique reference numbers: ${refMap.size}`);
  console.log(`Null or empty reference numbers: ${nullOrEmptyCount}`);

  // Find duplicates
  const duplicates = [];
  for (const [ref, rows] of refMap.entries()) {
    if (rows.length > 1) {
      duplicates.push({ ref, count: rows.length, rows });
    }
  }

  duplicates.sort((a, b) => b.count - a.count);

  console.log(`\nFound ${duplicates.length} duplicate Reference IDs affecting a total of ${duplicates.reduce((acc, d) => acc + d.count, 0)} records!`);
  
  for (const d of duplicates) {
    console.log(`\nReference ID: "${d.ref}" -> ${d.count} records:`);
    for (const r of d.rows) {
      console.log(`  - ID: ${r.id} | Name: ${r.first_name} ${r.last_name} | SAF: ${r.saf_number || 'N/A'} | Aadhaar: ${r.aadhaar_number} | Created: ${r.created_at} | Center: ${r.center_location || r.institution_name}`);
    }
  }
}

analyze().catch(console.error);
