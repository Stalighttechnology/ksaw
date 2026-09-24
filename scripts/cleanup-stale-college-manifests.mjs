/**
 * cleanup-stale-college-manifests.mjs
 * Deletes stale timestamped college backup files from Supabase Storage.
 * Run with: node scripts/cleanup-stale-college-manifests.mjs
 * or:       bun scripts/cleanup-stale-college-manifests.mjs
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (get from Supabase Dashboard > Settings > API)
 * Uses the publishable key as fallback (may not have delete rights without service role key).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://wgtzcjsajncrvibtlhxv.supabase.co";
// Prefer service role key for full delete rights; fall back to publishable key
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";

const BUCKET = "registrations";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listAllInFolder(folder) {
  const files = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit, offset });
    if (error || !data || data.length === 0) break;
    files.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function main() {
  console.log("🔍 Scanning root folder for stale timestamped college files...");

  // List root folder
  const rootFiles = await listAllInFolder("");
  const staleRootFiles = rootFiles
    .filter((f) => /^colleges_\d+\.json$/.test(f.name))
    .map((f) => f.name);

  console.log(`  Found ${staleRootFiles.length} stale root files.`);

  // List manifests/ folder
  const manifestsFiles = await listAllInFolder("manifests");
  const staleManifestsFiles = manifestsFiles
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => `manifests/${f.name}`);

  console.log(`  Found ${staleManifestsFiles.length} stale manifests/ folder files.`);

  // List manifests/colleges/ folder
  const collegesSubFiles = await listAllInFolder("manifests/colleges");
  const staleCollegesSubFiles = collegesSubFiles
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => `manifests/colleges/${f.name}`);

  console.log(`  Found ${staleCollegesSubFiles.length} stale manifests/colleges/ folder files.`);

  const allStale = [...staleRootFiles, ...staleManifestsFiles, ...staleCollegesSubFiles];

  if (allStale.length === 0) {
    console.log("✅ No stale files found. Nothing to clean up.");
    return;
  }

  console.log(`\n🗑️  Deleting ${allStale.length} stale files...`);

  // Delete in batches of 20
  const BATCH = 20;
  let deleted = 0;
  for (let i = 0; i < allStale.length; i += BATCH) {
    const batch = allStale.slice(i, i + BATCH);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) {
      console.error(`  ❌ Batch error: ${error.message}`);
    } else {
      deleted += batch.length;
      console.log(`  ✓ Deleted ${deleted}/${allStale.length}`);
    }
  }

  console.log(`\n✅ Done! Deleted ${deleted} stale backup files.`);
  console.log("   Only colleges_manifest.json remains as the canonical source.");
}

main().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
