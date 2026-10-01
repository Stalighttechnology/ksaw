import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkStorage() {
  const { data, error } = await supabase.storage.from("registrations").download("batches_manifest.json");
  console.log("Download error:", error);
  if (data) {
    const text = await data.text();
    const json = JSON.parse(text);
    console.log("Storage manifest version:", json.version);
    console.log("Storage batch 7 applicantIds count:", json.batches?.[0]?.applicantIds?.length);
  }
}
checkStorage();
