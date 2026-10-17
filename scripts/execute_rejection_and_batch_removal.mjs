import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const filePath = path.resolve(__dirname, "../public/update/DEVRAJ URS & LINGYATH REJECTED LIST from DEPARTMENT ( 16-10-26) (1).xlsx");

function cleanAadhaar(val) {
  if (!val) return "";
  return String(val).replace(/\D/g, "").trim();
}

function cleanSaf(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, "").replace(/\.+$/, "").trim();
}

function cleanRef(val) {
  if (!val) return "";
  return String(val).toUpperCase().replace(/\s+/g, " ").trim();
}

async function execute() {
  console.log("=========================================================================");
  console.log("=== EXECUTING REJECTION & BATCH REMOVAL PIPELINE ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with Supabase
  const authEmail = `updater_reject_${Date.now()}@gleamator.com`;
  const authPass = "AdminReject@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Supabase authentication failed:", authErr);
    process.exit(1);
  }
  console.log("✓ Supabase session established.");

  // 2. Fetch all registrations from DB
  console.log("Fetching live registrations from Supabase...");
  let allRegs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, institution_name, category, nigama, updated_at")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error) {
      console.error("Error fetching db:", error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allRegs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`✓ Fetched ${allRegs.length} total registrations.`);

  // Build DB index
  const dbById = new Map();
  const dbByRef = new Map();
  const dbBySaf = new Map();
  const dbByAadhaar = new Map();

  for (const reg of allRegs) {
    dbById.set(reg.id, reg);
    const ref = cleanRef(reg.reference_number);
    if (ref) {
      if (!dbByRef.has(ref)) dbByRef.set(ref, []);
      dbByRef.get(ref).push(reg);
    }
    const saf = cleanSaf(reg.saf_number);
    if (saf) {
      if (!dbBySaf.has(saf)) dbBySaf.set(saf, []);
      dbBySaf.get(saf).push(reg);
    }
    const aadh = cleanAadhaar(reg.aadhaar_number);
    if (aadh && aadh.length >= 10) {
      if (!dbByAadhaar.has(aadh)) dbByAadhaar.set(aadh, []);
      dbByAadhaar.get(aadh).push(reg);
    }
  }

  // 3. Read Excel and match
  const wb = xlsx.readFile(filePath);
  const matchedCandidateMap = new Map(); // dbId -> { reg, excelSources }

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws);
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const ref = cleanRef(r["Reference ID"] || r["Reference Number"] || r["Ref No"] || "");
      const saf = cleanSaf(r["SAF Number"] || r["SAF No"] || r["SAF"] || "");
      const aadh = cleanAadhaar(r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "");

      let matched = null;
      if (ref && dbByRef.has(ref)) {
        const cands = dbByRef.get(ref);
        if (cands.length === 1) matched = cands[0];
        else if (aadh) matched = cands.find(c => cleanAadhaar(c.aadhaar_number) === aadh);
        else if (saf) matched = cands.find(c => cleanSaf(c.saf_number) === saf);
      }
      if (!matched && saf && dbBySaf.has(saf)) {
        const cands = dbBySaf.get(saf);
        if (cands.length === 1) matched = cands[0];
        else if (aadh) matched = cands.find(c => cleanAadhaar(c.aadhaar_number) === aadh);
      }
      if (!matched && aadh && dbByAadhaar.has(aadh)) {
        const cands = dbByAadhaar.get(aadh);
        if (cands.length === 1) matched = cands[0];
      }

      if (matched) {
        if (!matchedCandidateMap.has(matched.id)) {
          matchedCandidateMap.set(matched.id, {
            reg: matched,
            excelSources: [],
          });
        }
        matchedCandidateMap.get(matched.id).excelSources.push({
          sheet: sheetName,
          row: i + 2,
          ref,
          saf,
          aadh,
        });
      } else {
        console.error(`FATAL: Unmatched row in sheet ${sheetName}, row ${i + 2}: ref=${ref}, saf=${saf}, aadh=${aadh}`);
        process.exit(1);
      }
    }
  }

  console.log(`✓ Verified exactly ${matchedCandidateMap.size} unique candidate records in DB matching Excel.`);
  if (matchedCandidateMap.size !== 909) {
    console.error(`Expected 909 candidates, but found ${matchedCandidateMap.size}`);
    process.exit(1);
  }

  // 4. Save pre-execution backup
  const backupData = {
    timestamp: new Date().toISOString(),
    totalCount: matchedCandidateMap.size,
    records: Array.from(matchedCandidateMap.values()).map(v => ({
      id: v.reg.id,
      reference_number: v.reg.reference_number,
      saf_number: v.reg.saf_number,
      aadhaar_number: v.reg.aadhaar_number,
      name: `${v.reg.first_name} ${v.reg.last_name}`,
      status: v.reg.status,
      admin_notes: v.reg.admin_notes,
      updated_at: v.reg.updated_at,
      excelSources: v.excelSources,
    })),
  };
  fs.writeFileSync("scripts/backup_909_records_before_rejection.json", JSON.stringify(backupData, null, 2));
  console.log("✓ Pre-execution safety snapshot saved to scripts/backup_909_records_before_rejection.json");

  // 5. Perform DB updates in chunks
  console.log("\n--- Updating 909 records in Supabase to 'Rejected' ---");
  const candidateIds = Array.from(matchedCandidateMap.keys());
  const now = new Date().toISOString();
  let updatedCount = 0;
  let alreadyRejectedCount = 0;
  let errors = [];

  for (let i = 0; i < candidateIds.length; i += 25) {
    const chunkIds = candidateIds.slice(i, i + 25);
    const { error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Rejected",
        admin_notes: "Rejected by Department (16-10-2026)",
        updated_at: now,
      })
      .in("id", chunkIds);

    if (updateErr) {
      console.error(`Error updating chunk ${i / 25 + 1}:`, updateErr.message);
      errors.push({ chunk: i, error: updateErr.message });
    } else {
      updatedCount += chunkIds.length;
      if (updatedCount % 100 === 0 || updatedCount === 909) {
        console.log(`  Updated ${updatedCount} / 909 records to 'Rejected'...`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("Encountered errors during DB update:", errors);
    process.exit(1);
  }
  console.log("✓ All 909 candidates successfully updated to status 'Rejected' in Supabase!");

  // 6. Remove rejected candidates from useBatches.ts
  console.log("\n--- Cleaning batch assignments in src/lib/useBatches.ts ---");
  const useBatchesPath = "src/lib/useBatches.ts";
  const useBatchesBackupPath = "src/lib/useBatches.ts.bak";
  fs.copyFileSync(useBatchesPath, useBatchesBackupPath);
  console.log("✓ Backup of useBatches.ts saved to src/lib/useBatches.ts.bak");

  const rejectedIdSet = new Set(candidateIds);
  const rejectedSafSet = new Set();
  const rejectedRefSet = new Set();
  const rejectedAadhaarSet = new Set();

  for (const v of matchedCandidateMap.values()) {
    if (v.reg.saf_number) rejectedSafSet.add(cleanSaf(v.reg.saf_number));
    if (v.reg.reference_number) rejectedRefSet.add(cleanRef(v.reg.reference_number));
    if (v.reg.aadhaar_number) rejectedAadhaarSet.add(cleanAadhaar(v.reg.aadhaar_number));
  }

  let useBatchesContent = fs.readFileSync(useBatchesPath, "utf8");

  // Regex to extract each BUILTIN_BATCH_x block
  // export const BUILTIN_BATCH_(\d+): BatchItem = { ... };
  const batchRegex = /export const (BUILTIN_BATCH_\d+): BatchItem = \{([\s\S]*?)\n\};/g;
  let batchMatch;
  let totalCandidatesRemoved = 0;
  const batchesImpacted = {};
  let updatedContent = useBatchesContent;

  const replacements = [];

  while ((batchMatch = batchRegex.exec(useBatchesContent)) !== null) {
    const fullMatch = batchMatch[0];
    const varName = batchMatch[1];
    const body = batchMatch[2];

    // Extract fields
    const idMatch = body.match(/id:\s*"([^"]+)"/);
    const nameMatch = body.match(/name:\s*"([^"]+)"/);
    const sheetMatch = body.match(/sheetName:\s*"([^"]+)"/);
    const batchId = idMatch ? idMatch[1] : "";
    const batchName = nameMatch ? nameMatch[1] : "";
    const sheetName = sheetMatch ? sheetMatch[1] : "";

    const appIdsMatch = body.match(/applicantIds:\s*\[([\s\S]*?)\]/);
    const safsMatch = body.match(/safNumbers:\s*\[([\s\S]*?)\]/);
    const refsMatch = body.match(/referenceNumbers:\s*\[([\s\S]*?)\]/);
    const aadhsMatch = body.match(/aadhaarNumbers:\s*\[([\s\S]*?)\]/);

    const parseArray = (str) => {
      if (!str) return [];
      return str.split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    };

    const applicantIds = parseArray(appIdsMatch ? appIdsMatch[1] : "");
    const safNumbers = parseArray(safsMatch ? safsMatch[1] : "");
    const referenceNumbers = parseArray(refsMatch ? refsMatch[1] : "");
    const aadhaarNumbers = parseArray(aadhsMatch ? aadhsMatch[1] : "");

    // Filter out rejected
    const keptApplicantIds = [];
    let removedInBatch = 0;

    for (const id of applicantIds) {
      if (rejectedIdSet.has(id)) {
        removedInBatch++;
        totalCandidatesRemoved++;
      } else {
        keptApplicantIds.push(id);
      }
    }

    const keptSafNumbers = safNumbers.filter(saf => !rejectedSafSet.has(cleanSaf(saf)));
    const keptReferenceNumbers = referenceNumbers.filter(ref => !rejectedRefSet.has(cleanRef(ref)));
    const keptAadhaarNumbers = aadhaarNumbers.filter(aadh => !rejectedAadhaarSet.has(cleanAadhaar(aadh)));

    if (removedInBatch > 0) {
      batchesImpacted[batchName || batchId] = {
        before: applicantIds.length,
        removed: removedInBatch,
        after: keptApplicantIds.length,
      };
    }

    // Reconstruct block
    const formatArr = (arr) => {
      if (arr.length === 0) return "[]";
      return "[\n" + arr.map(x => `      "${x}"`).join(",\n") + "\n  ]";
    };

    const newBlock = `export const ${varName}: BatchItem = {
  id: "${batchId}",
  name: "${batchName}",
  sheetName: "${sheetName}",
  totalCount: ${keptApplicantIds.length},
  applicantIds: ${formatArr(keptApplicantIds)},
  safNumbers: ${formatArr(keptSafNumbers)},
  referenceNumbers: ${formatArr(keptReferenceNumbers)},
  aadhaarNumbers: ${formatArr(keptAadhaarNumbers)}
};`;

    replacements.push({ fullMatch, newBlock });
  }

  for (const { fullMatch, newBlock } of replacements) {
    updatedContent = updatedContent.replace(fullMatch, newBlock);
  }

  fs.writeFileSync(useBatchesPath, updatedContent, "utf8");
  console.log(`✓ useBatches.ts updated! Removed ${totalCandidatesRemoved} rejected applicants across ${Object.keys(batchesImpacted).length} batches.`);

  // 7. Post-verification
  console.log("\n--- Verification of DB state ---");
  const { data: verifyDb, error: vErr } = await supabase
    .from("registrations")
    .select("status, admin_notes")
    .in("id", candidateIds);

  if (vErr) {
    console.error("Verification query error:", vErr);
  } else {
    const statusCounts = {};
    const notesCounts = {};
    verifyDb.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      notesCounts[r.admin_notes] = (notesCounts[r.admin_notes] || 0) + 1;
    });
    console.log("Verified DB Status counts for 909 candidates:", statusCounts);
    console.log("Verified DB Admin Notes counts for 909 candidates:", notesCounts);
  }

  // Summary file
  const summaryReport = {
    executedAt: new Date().toISOString(),
    totalCandidatesRejected: matchedCandidateMap.size,
    dbStatus: "Rejected",
    dbAdminNotes: "Rejected by Department (16-10-2026)",
    totalBatchAllocationsRemoved: totalCandidatesRemoved,
    batchesImpactedCount: Object.keys(batchesImpacted).length,
    batchesImpacted,
  };
  fs.writeFileSync("scripts/rejection_execution_summary.json", JSON.stringify(summaryReport, null, 2));
  console.log("\nExecution summary written to scripts/rejection_execution_summary.json");
}

execute().catch(console.error);
