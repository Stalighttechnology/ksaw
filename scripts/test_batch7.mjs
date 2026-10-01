import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function check() {
  const code = fs.readFileSync("src/lib/useBatches.ts", "utf8");
  const batch7IdsMatch = code.match(/export const BUILTIN_BATCH_7: BatchItem = {[\s\S]*?applicantIds: \[([\s\S]*?)\]/);
  const ids = batch7IdsMatch[1].match(/[a-f0-9-]{36}/g);
  console.log("IDs count in BUILTIN_BATCH_7:", ids.length);
  
  const { data, count, error } = await supabase
    .from("registrations")
    .select("id, reference_number, saf_number, first_name, last_name, aadhaar_number, gender, category, religion", { count: "exact" })
    .in("id", ids);
  
  console.log("Found in DB:", data?.length, "Count:", count, "Error:", error);
  
  // Also check batch 8 and batch 37
  const batch8IdsMatch = code.match(/export const BUILTIN_BATCH_8: BatchItem = {[\s\S]*?applicantIds: \[([\s\S]*?)\]/);
  const ids8 = batch8IdsMatch[1].match(/[a-f0-9-]{36}/g);
  const res8 = await supabase.from("registrations").select("id", { count: "exact" }).in("id", ids8);
  console.log("Batch 8 found in DB:", res8.data?.length, "Count:", res8.count);

  const batch37IdsMatch = code.match(/export const BUILTIN_BATCH_37: BatchItem = {[\s\S]*?applicantIds: \[([\s\S]*?)\]/);
  const ids37 = batch37IdsMatch[1].match(/[a-f0-9-]{36}/g);
  const res37 = await supabase.from("registrations").select("id", { count: "exact" }).in("id", ids37);
  console.log("Batch 37 found in DB:", res37.data?.length, "Count:", res37.count);
}
check();
