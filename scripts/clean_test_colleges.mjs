import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";

const BUCKET = "registrations";
const MANIFEST_FILE = "colleges_manifest.json";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("📥 Downloading current colleges_manifest.json...");
  const { data, error } = await supabase.storage.from(BUCKET).download(MANIFEST_FILE);
  if (error) {
    throw new Error(`Failed to download manifest: ${error.message}`);
  }

  const text = await data.text();
  const list = JSON.parse(text);
  console.log(`Current items count: ${list.length}`);

  const itemsToRemove = new Set([
    "ok123",
    "okyyy",
    "pannaga",
    "raghu",
    "ritesh",
    "test"
  ]);

  const cleanedList = list.filter((item) => {
    if (itemsToRemove.has(item)) return false;
    if (typeof item === "string" && item.startsWith("__removed__:")) return false;
    return true;
  });

  console.log(`Cleaned items count: ${cleanedList.length}`);
  const removedCount = list.length - cleanedList.length;
  console.log(`Removed ${removedCount} test/tombstone entries.`);

  const jsonBlob = new Blob([JSON.stringify(cleanedList, null, 2)], {
    type: "application/json",
  });

  console.log("📤 Uploading cleaned colleges_manifest.json...");
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(MANIFEST_FILE, jsonBlob, {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Failed to upload cleaned manifest: ${uploadError.message}`);
  }

  console.log("✅ Successfully updated colleges_manifest.json in Supabase storage!");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
