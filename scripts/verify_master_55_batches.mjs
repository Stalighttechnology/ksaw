import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function verifyAll() {
  const code = fs.readFileSync("src/lib/useBatches.ts", "utf8");
  const batchBlocks = code.match(/export const BUILTIN_BATCH_\d+: BatchItem = {[\s\S]*?^};/gm);
  
  console.log(`\nVerifying all ${batchBlocks.length} master batches against live database...\n`);
  let totalLive = 0;
  let perfectCount = 0;

  for (const block of batchBlocks) {
    const nameMatch = block.match(/name:\s*"([^"]+)"/);
    const countMatch = block.match(/totalCount:\s*(\d+)/);
    const ids = block.match(/[a-f0-9-]{36}/g) || [];

    const name = nameMatch ? nameMatch[1] : "Unknown";
    const expected = countMatch ? parseInt(countMatch[1]) : ids.length;

    const { data, count, error } = await supabase
      .from("registrations")
      .select("id", { count: "exact" })
      .in("id", ids);

    const liveCount = count || 0;
    totalLive += liveCount;
    if (liveCount === expected && !error) {
      perfectCount++;
    } else {
      console.log(`❌ Mismatch in [${name}]: Expected ${expected}, Found ${liveCount}`);
    }
  }

  console.log(`===================================================`);
  console.log(`Result: ${perfectCount} / ${batchBlocks.length} Batches 100% Verified!`);
  console.log(`Total Live DB Applicants Linked: ${totalLive}`);
  console.log(`===================================================\n`);
}

verifyAll();
