import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function normalizeStr(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeRef(str) {
  if (!str) return "";
  return String(str).toUpperCase().replace(/\s+/g, " ").trim();
}

function normalizeAadhaar(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}

function normalizeSaf(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").trim();
}

async function uploadBatchesManifest() {
  const filePath = "batch/Malnad batch wise list( 22-09-26).xlsx";
  const wb = xlsx.readFile(filePath);

  console.log("Reading batch excel file:", filePath);

  const batches = [];
  const applicantBatchMap = {}; // id -> batchName
  const safBatchMap = {}; // saf -> batchName
  const refBatchMap = {}; // ref -> batchName
  const aadhaarBatchMap = {}; // aadhaar -> batchName

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const batchId = rows[0]?.["Batch ID"] || sheetName;

    const currentBatch = {
      id: batchId,
      name: batchId,
      sheetName: sheetName,
      totalCount: rows.length,
      applicantIds: [],
      safNumbers: [],
      referenceNumbers: [],
      aadhaarNumbers: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const refId = normalizeRef(r["Reference ID"]);
      const safNo = normalizeSaf(r["SAF Number"]);
      const aadhaar = normalizeAadhaar(r["Aadhaar Number"]);
      const firstName = String(r["First Name"] || "").trim();
      const lastName = String(r["Last Name"] || "").trim();

      // Look up in database
      let dbRecord = null;
      if (safNo) {
        const { data } = await supabase.from("registrations").select("id, reference_number, saf_number, aadhaar_number, first_name, last_name").eq("saf_number", safNo);
        if (data && data.length > 0) dbRecord = data[0];
      }
      if (!dbRecord && refId) {
        const { data } = await supabase.from("registrations").select("id, reference_number, saf_number, aadhaar_number, first_name, last_name").ilike("reference_number", `%${refId.replace("KSAW ", "").replace("KSAW", "")}%`);
        if (data && data.length > 0) {
          dbRecord = data.find(d => normalizeRef(d.reference_number) === refId) || data[0];
        }
      }
      if (!dbRecord && aadhaar) {
        const { data } = await supabase.from("registrations").select("id, reference_number, saf_number, aadhaar_number, first_name, last_name").eq("aadhaar_number", aadhaar);
        if (data && data.length > 0) dbRecord = data[0];
      }

      if (dbRecord) {
        currentBatch.applicantIds.push(dbRecord.id);
        if (dbRecord.saf_number) currentBatch.safNumbers.push(dbRecord.saf_number);
        if (dbRecord.reference_number) currentBatch.referenceNumbers.push(dbRecord.reference_number);
        if (dbRecord.aadhaar_number) currentBatch.aadhaarNumbers.push(dbRecord.aadhaar_number);

        applicantBatchMap[dbRecord.id] = batchId;
        if (dbRecord.saf_number) safBatchMap[dbRecord.saf_number] = batchId;
        if (dbRecord.reference_number) refBatchMap[dbRecord.reference_number] = batchId;
        if (dbRecord.aadhaar_number) aadhaarBatchMap[dbRecord.aadhaar_number] = batchId;
      } else {
        console.warn(`Record not found in DB for row ${i + 2}: ${refId}, ${safNo}`);
      }
    }

    batches.push(currentBatch);
    console.log(`Batch [${batchId}]: matched ${currentBatch.applicantIds.length}/${rows.length} applicants.`);
  }

  const manifestData = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    batches: batches,
    applicantBatchMap: applicantBatchMap,
    safBatchMap: safBatchMap,
    refBatchMap: refBatchMap,
    aadhaarBatchMap: aadhaarBatchMap,
  };

  const jsonBuffer = Buffer.from(JSON.stringify(manifestData, null, 2), "utf-8");

  console.log("Uploading batches_manifest.json to Supabase storage...");
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("registrations")
    .upload("batches_manifest.json", jsonBuffer, {
      contentType: "application/json",
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
  } else {
    console.log("✅ Successfully saved batches_manifest.json to Supabase storage!", uploadData);
  }
}

uploadBatchesManifest().catch(console.error);
