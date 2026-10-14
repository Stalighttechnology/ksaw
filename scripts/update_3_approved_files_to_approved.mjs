import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const targetFiles = [
  "approved to dept/M-12.10.2026 (2).xlsx",
  "approved to dept/V-03.10.2026.xlsx",
  "approved to dept/V-05.10.2026.xlsx"
];

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

async function runUpdate() {
  console.log("=========================================================================");
  console.log("=== Updating Candidate Records to 'Approved by Dept' ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_approved_dept_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established successfully.");

  // 2. Load DB records for matching
  let allDbRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allDbRows = allDbRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  console.log(`Loaded ${allDbRows.length} DB records.`);

  // Build lookup maps
  const aadhaarMap = new Map();
  const safMap = new Map();
  const refMap = new Map();

  for (const reg of allDbRows) {
    const aadh = normalizeAadhaar(reg.aadhaar_number);
    if (aadh && aadh.length >= 10) aadhaarMap.set(aadh, reg);

    const saf = normalizeSaf(reg.saf_number);
    if (saf) {
      safMap.set(saf, reg);
      safMap.set(saf.replace(/\.+$/, ""), reg);
    }

    const ref = normalizeRef(reg.reference_number).replace(/\s+/g, "");
    if (ref) {
      refMap.set(ref, reg);
      refMap.set(ref.replace(/0+/g, ""), reg);
      const numOnly = ref.replace(/^[^\d]+/, "");
      if (numOnly) refMap.set(numOnly, reg);
    }
  }

  // 3. Extract and match records from all 3 files
  const matchedCandidateMap = new Map(); // id -> candidate data
  const filesStats = {};

  for (const filename of targetFiles) {
    const wb = xlsx.readFile(filename);
    filesStats[filename] = { totalRows: 0, matched: 0 };

    for (const sheetName of wb.SheetNames) {
      const lowerSheet = sheetName.toLowerCase().trim();
      if (lowerSheet.includes("summary") || lowerSheet.includes("report") && !lowerSheet.includes("candidate")) continue;

      const ws = wb.Sheets[sheetName];
      const rawData = xlsx.utils.sheet_to_json(ws, { header: 1 });
      if (!rawData || rawData.length === 0) continue;

      // Detect header row
      let headerRowIndex = -1;
      let headerRow = [];

      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        if (!Array.isArray(row)) continue;
        const rowStr = row.map(c => String(c || "").toLowerCase()).join(" ");
        if ((rowStr.includes("saf") || rowStr.includes("ksaw") || rowStr.includes("reference") || rowStr.includes("aadhaar") || rowStr.includes("first name")) &&
            (rowStr.includes("name") || rowStr.includes("gender") || rowStr.includes("phone") || rowStr.includes("aadhaar"))) {
          headerRowIndex = i;
          headerRow = row.map(c => String(c || "").trim());
          break;
        }
      }

      let isTwoColumnRaw = false;
      if (headerRowIndex === -1) {
        // Check if row 0 is 2-column [aadhaar, saf]
        if (rawData[0] && String(rawData[0][0] || "").replace(/\D/g, "").length >= 10) {
          isTwoColumnRaw = true;
          headerRowIndex = 0; // include row 0 as data
        } else {
          headerRowIndex = 0;
          headerRow = rawData[0].map(c => String(c || "").trim());
        }
      }

      let refCol = -1, safCol = -1, aadhCol = -1;
      if (isTwoColumnRaw) {
        aadhCol = 0;
        safCol = 1;
      } else {
        headerRow.forEach((h, idx) => {
          const lower = h.toLowerCase().trim();
          if (lower.includes("reference") || lower.includes("ksaw") || lower === "ref no" || lower === "ref no.") refCol = idx;
          if (lower.includes("saf") || lower === "saf no" || lower === "saf no.") safCol = idx;
          if (lower.includes("aadhaar") || lower.includes("adhar") || lower.includes("uid")) aadhCol = idx;
        });
      }

      const rows = isTwoColumnRaw ? rawData : rawData.slice(headerRowIndex + 1);

      for (const row of rows) {
        if (!Array.isArray(row) || !row.some(c => c)) continue;
        filesStats[filename].totalRows++;

        const refVal = refCol !== -1 ? String(row[refCol] || "").trim() : "";
        const safVal = safCol !== -1 ? String(row[safCol] || "").trim() : "";
        const aadhVal = aadhCol !== -1 ? String(row[aadhCol] || "").trim() : "";

        let match = null;

        // 1. Aadhaar
        const cleanAadh = normalizeAadhaar(aadhVal);
        if (cleanAadh && cleanAadh.length >= 10 && aadhaarMap.has(cleanAadh)) {
          match = aadhaarMap.get(cleanAadh);
        }

        // 2. SAF
        const cleanSaf = normalizeSaf(safVal);
        if (!match && cleanSaf) {
          if (safMap.has(cleanSaf)) match = safMap.get(cleanSaf);
          else if (safMap.has(cleanSaf.replace(/\.+$/, ""))) match = safMap.get(cleanSaf.replace(/\.+$/, ""));
        }

        // 3. Reference ID
        const cleanRef = normalizeRef(refVal).replace(/\s+/g, "");
        if (!match && cleanRef) {
          if (refMap.has(cleanRef)) match = refMap.get(cleanRef);
          else if (refMap.has(cleanRef.replace(/0+/g, ""))) match = refMap.get(cleanRef.replace(/0+/g, ""));
          else {
            const numOnly = cleanRef.replace(/^[^\d]+/, "");
            if (numOnly && refMap.has(numOnly)) match = refMap.get(numOnly);
          }
        }

        if (match) {
          filesStats[filename].matched++;
          if (!matchedCandidateMap.has(match.id)) {
            matchedCandidateMap.set(match.id, {
              id: match.id,
              ref: match.reference_number,
              saf: match.saf_number,
              aadhaar: match.aadhaar_number,
              name: `${match.first_name || ""} ${match.last_name || ""}`.trim(),
              currentStatus: match.status,
              currentAdminNotes: match.admin_notes,
            });
          }
        }
      }
    }
  }

  console.log("File Extraction Summary:");
  for (const [file, stats] of Object.entries(filesStats)) {
    console.log(`  ${file}: ${stats.matched} / ${stats.totalRows} records matched`);
  }

  const uniqueCandidates = Array.from(matchedCandidateMap.values());
  console.log(`\nTotal unique candidates to update in DB: ${uniqueCandidates.length}`);

  // 4. Update records in batches of 50
  const BATCH_SIZE = 50;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < uniqueCandidates.length; i += BATCH_SIZE) {
    const chunk = uniqueCandidates.slice(i, i + BATCH_SIZE);
    const chunkIds = chunk.map(c => c.id);

    const { data, error } = await supabase
      .from("registrations")
      .update({
        status: "Approved by Dept",
        admin_notes: "Approved by Dept",
      })
      .in("id", chunkIds)
      .select("id");

    if (error) {
      console.error(`Error updating batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      errorCount += chunk.length;
    } else {
      updatedCount += (data ? data.length : chunk.length);
      console.log(`Updated chunk ${Math.floor(i / BATCH_SIZE) + 1}: ${chunk.length} records (Progress: ${updatedCount}/${uniqueCandidates.length})`);
    }
  }

  console.log(`\n=========================================================================`);
  console.log(`=== DATABASE UPDATE COMPLETED ===`);
  console.log(`Total Candidates Targeted: ${uniqueCandidates.length}`);
  console.log(`Successfully Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`=========================================================================\n`);

  // 5. Verification: Check status of updated candidates in DB
  console.log("=== Verifying Live Status in Database ===");
  let verifyApprovedCount = 0;
  let verifyAdminNotesCount = 0;

  for (let i = 0; i < uniqueCandidates.length; i += BATCH_SIZE) {
    const chunk = uniqueCandidates.slice(i, i + BATCH_SIZE);
    const chunkIds = chunk.map(c => c.id);

    const { data } = await supabase
      .from("registrations")
      .select("id, status, admin_notes")
      .in("id", chunkIds);

    if (data) {
      for (const d of data) {
        if (d.status === "Approved by Dept") verifyApprovedCount++;
        if (d.admin_notes === "Approved by Dept") verifyAdminNotesCount++;
      }
    }
  }

  console.log(`Verified with status = 'Approved by Dept': ${verifyApprovedCount} / ${uniqueCandidates.length}`);
  console.log(`Verified with admin_notes = 'Approved by Dept': ${verifyAdminNotesCount} / ${uniqueCandidates.length}`);
}

runUpdate();
