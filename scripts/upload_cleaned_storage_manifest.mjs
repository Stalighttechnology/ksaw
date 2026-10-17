import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function uploadStorageManifest() {
  const authEmail = `updater_manifest_${Date.now()}@gleamator.com`;
  const authPass = "AdminManifest@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({ email: authEmail, password: authPass });
  if (authErr) {
    console.error("Auth error:", authErr);
    process.exit(1);
  }

  const useBatchesContent = fs.readFileSync("src/lib/useBatches.ts", "utf8");
  const batchRegex = /export const (BUILTIN_BATCH_\d+): BatchItem = \{([\s\S]*?)\n\};/g;
  let batchMatch;
  const batches = [];
  const applicantBatchMap = {};
  const safBatchMap = {};
  const refBatchMap = {};
  const aadhaarBatchMap = {};

  const parseArray = (str) => {
    if (!str) return [];
    return str.split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  };

  while ((batchMatch = batchRegex.exec(useBatchesContent)) !== null) {
    const body = batchMatch[2];
    const idMatch = body.match(/id:\s*"([^"]+)"/);
    const nameMatch = body.match(/name:\s*"([^"]+)"/);
    const sheetMatch = body.match(/sheetName:\s*"([^"]+)"/);
    const totalCountMatch = body.match(/totalCount:\s*(\d+)/);

    const appIdsMatch = body.match(/applicantIds:\s*\[([\s\S]*?)\]/);
    const safsMatch = body.match(/safNumbers:\s*\[([\s\S]*?)\]/);
    const refsMatch = body.match(/referenceNumbers:\s*\[([\s\S]*?)\]/);
    const aadhsMatch = body.match(/aadhaarNumbers:\s*\[([\s\S]*?)\]/);

    const batch = {
      id: idMatch ? idMatch[1] : "",
      name: nameMatch ? nameMatch[1] : "",
      sheetName: sheetMatch ? sheetMatch[1] : "",
      totalCount: totalCountMatch ? parseInt(totalCountMatch[1], 10) : 0,
      applicantIds: parseArray(appIdsMatch ? appIdsMatch[1] : ""),
      safNumbers: parseArray(safsMatch ? safsMatch[1] : ""),
      referenceNumbers: parseArray(refsMatch ? refsMatch[1] : ""),
      aadhaarNumbers: parseArray(aadhsMatch ? aadhsMatch[1] : ""),
    };
    batches.push(batch);

    batch.applicantIds.forEach(id => { applicantBatchMap[id] = batch.name; });
    batch.safNumbers.forEach(saf => {
      const clean = saf.trim().toUpperCase();
      safBatchMap[clean] = batch.name;
      safBatchMap[clean.replace(/\.+$/, "")] = batch.name;
    });
    batch.referenceNumbers.forEach(ref => {
      const clean = ref.trim().toUpperCase();
      refBatchMap[clean] = batch.name;
      refBatchMap[clean.replace(/\s+/g, "")] = batch.name;
    });
    batch.aadhaarNumbers.forEach(aadh => {
      aadhaarBatchMap[aadh.replace(/\D/g, "")] = batch.name;
    });
  }

  const manifest = {
    version: 9,
    lastUpdated: new Date().toISOString(),
    batches,
    applicantBatchMap,
    safBatchMap,
    refBatchMap,
    aadhaarBatchMap,
  };

  const buffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  const { error } = await supabase.storage.from("registrations").upload("batches_manifest.json", buffer, {
    contentType: "application/json",
    upsert: true,
  });

  if (error) {
    console.error("Storage upload error:", error);
    process.exit(1);
  } else {
    console.log(`✓ Successfully uploaded batches_manifest.json (v9) to Supabase Storage with ${batches.length} batches and ${Object.keys(applicantBatchMap).length} active assigned candidates.`);
  }
}

uploadStorageManifest().catch(console.error);
