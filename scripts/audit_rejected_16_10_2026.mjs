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

function cleanPhone(val) {
  if (!val) return "";
  const d = String(val).replace(/\D/g, "");
  return d.slice(-10);
}

function normName(first, last) {
  return `${first || ""} ${last || ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function runAudit() {
  console.log("=== 1. Fetching ALL registrations from Supabase ===");
  let allRegs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone, email, dob, status, admin_notes, institution_name, category, caste, nigama, gender")
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
  console.log(`Fetched ${allRegs.length} total registrations from Supabase.\n`);

  // Build indexes for fast multi-dimensional lookup
  const dbById = new Map();
  const dbByRef = new Map(); // cleanRef -> [regs]
  const dbBySaf = new Map(); // cleanSaf -> [regs]
  const dbByAadhaar = new Map(); // cleanAadhaar -> [regs]
  const dbByPhone = new Map(); // cleanPhone -> [regs]

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

    const ph = cleanPhone(reg.phone);
    if (ph && ph.length === 10) {
      if (!dbByPhone.has(ph)) dbByPhone.set(ph, []);
      dbByPhone.get(ph).push(reg);
    }
  }

  // Read Excel
  const wb = xlsx.readFile(filePath);
  const sheetStats = [];
  const allExcelRows = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws);
    console.log(`Analyzing sheet: "${sheetName}" with ${rows.length} rows...`);

    const sheetRows = [];
    rows.forEach((r, idx) => {
      const rowNum = idx + 2; // header is row 1
      const ref = cleanRef(r["Reference ID"] || r["Reference Number"] || r["Ref No"] || "");
      const saf = cleanSaf(r["SAF Number"] || r["SAF No"] || r["SAF"] || "");
      const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
      const aadhaar = cleanAadhaar(rawAadhaar);
      const phone = cleanPhone(r["Phone"] || r["Mobile"] || "");
      const firstName = String(r["First Name"] || "").trim();
      const lastName = String(r["Last Name"] || "").trim();
      const email = String(r["Email"] || "").trim();
      const college = String(r["College / Institute / University"] || "").trim();
      const excelStatus = String(r["Status"] || "").trim();
      const excelAdminNotes = String(r["Admin Notes"] || "").trim();
      const nigama = String(r["Nigama"] || "").trim();

      const item = {
        sheetName,
        rowNum,
        ref,
        saf,
        aadhaar,
        phone,
        firstName,
        lastName,
        email,
        college,
        excelStatus,
        excelAdminNotes,
        nigama,
        rawRow: r,
      };
      sheetRows.push(item);
      allExcelRows.push(item);
    });

    sheetStats.push({ sheetName, count: sheetRows.length, rows: sheetRows });
  }

  // Cross-matching algorithm:
  // For each excel row, match against DB using:
  // 1. Ref AND Saf AND Aadhaar (exact 3-way match)
  // 2. Saf AND Aadhaar
  // 3. Ref AND Aadhaar
  // 4. Ref AND Saf
  // 5. Aadhaar only
  // 6. Saf only
  // 7. Ref only
  // 8. Phone & Name
  const matchResults = [];

  for (const item of allExcelRows) {
    let matchedReg = null;
    let matchType = null;
    let matchCandidates = new Set();

    // Check by ref
    if (item.ref && dbByRef.has(item.ref)) {
      dbByRef.get(item.ref).forEach(r => matchCandidates.add(r));
    }
    // Check by saf
    if (item.saf && dbBySaf.has(item.saf)) {
      dbBySaf.get(item.saf).forEach(r => matchCandidates.add(r));
    }
    // Check by aadhaar
    if (item.aadhaar && dbByAadhaar.has(item.aadhaar)) {
      dbByAadhaar.get(item.aadhaar).forEach(r => matchCandidates.add(r));
    }

    const cands = Array.from(matchCandidates);

    if (cands.length === 1) {
      matchedReg = cands[0];
      const mRef = cleanRef(matchedReg.reference_number) === item.ref;
      const mSaf = cleanSaf(matchedReg.saf_number) === item.saf;
      const mAadh = item.aadhaar ? cleanAadhaar(matchedReg.aadhaar_number) === item.aadhaar : null;

      if (mRef && mSaf && (mAadh === true || mAadh === null)) {
        matchType = "EXACT_ALL_KEYS";
      } else if (mRef && mSaf) {
        matchType = "REF_AND_SAF_MATCH";
      } else if (mSaf && mAadh) {
        matchType = "SAF_AND_AADHAAR_MATCH";
      } else if (mRef && mAadh) {
        matchType = "REF_AND_AADHAAR_MATCH";
      } else if (mAadh) {
        matchType = "AADHAAR_ONLY_MATCH";
      } else if (mSaf) {
        matchType = "SAF_ONLY_MATCH";
      } else if (mRef) {
        matchType = "REF_ONLY_MATCH";
      }
    } else if (cands.length > 1) {
      // Find the best candidate among multiple
      const exact = cands.filter(r => {
        const mRef = cleanRef(r.reference_number) === item.ref;
        const mSaf = cleanSaf(r.saf_number) === item.saf;
        const mAadh = item.aadhaar ? cleanAadhaar(r.aadhaar_number) === item.aadhaar : true;
        return mRef && mSaf && mAadh;
      });

      if (exact.length === 1) {
        matchedReg = exact[0];
        matchType = "EXACT_ALL_KEYS_FILTERED_AMONG_CANDS";
      } else {
        matchType = `AMBIGUOUS_MULTIPLE_CANDS_${cands.length}`;
      }
    } else {
      // No match by ref, saf, aadhaar - fallback to phone + name
      if (item.phone && dbByPhone.has(item.phone)) {
        const phCands = dbByPhone.get(item.phone);
        const nameMatch = phCands.filter(r => normName(r.first_name, r.last_name) === normName(item.firstName, item.lastName));
        if (nameMatch.length === 1) {
          matchedReg = nameMatch[0];
          matchType = "PHONE_AND_NAME_FALLBACK";
        } else {
          matchType = "PHONE_MATCH_ONLY";
        }
      } else {
        matchType = "NO_MATCH_FOUND";
      }
    }

    matchResults.push({
      item,
      matchedReg,
      matchType,
      allCandidatesCount: cands.length,
    });
  }

  // Summary analysis
  console.log("\n========================================================");
  console.log("=== MATCHING BREAKDOWN BY SHEET ===");
  console.log("========================================================");

  const breakdownBySheet = {};
  for (const r of matchResults) {
    const sName = r.item.sheetName;
    if (!breakdownBySheet[sName]) {
      breakdownBySheet[sName] = {
        total: 0,
        exactMatch: 0,
        otherMatch: 0,
        noMatch: 0,
        ambiguous: 0,
        currentStatusesInDb: {},
        uniqueDbIds: new Set(),
      };
    }
    const bs = breakdownBySheet[sName];
    bs.total++;
    if (r.matchedReg) {
      bs.uniqueDbIds.add(r.matchedReg.id);
      const st = r.matchedReg.status || "NULL";
      bs.currentStatusesInDb[st] = (bs.currentStatusesInDb[st] || 0) + 1;
      if (r.matchType.startsWith("EXACT")) {
        bs.exactMatch++;
      } else {
        bs.otherMatch++;
      }
    } else if (r.matchType.startsWith("AMBIGUOUS")) {
      bs.ambiguous++;
    } else {
      bs.noMatch++;
    }
  }

  console.log(JSON.stringify(
    Object.fromEntries(
      Object.entries(breakdownBySheet).map(([k, v]) => [
        k,
        {
          totalRows: v.total,
          exactMatched: v.exactMatch,
          otherMatched: v.otherMatch,
          ambiguous: v.ambiguous,
          noMatch: v.noMatch,
          uniqueDbRecordsMatched: v.uniqueDbIds.size,
          dbStatusDistribution: v.currentStatusesInDb,
        }
      ])
    ),
    null,
    2
  ));

  // Check unique DB IDs across all sheets (are there duplicates across sheets?)
  const allMatchedDbIds = new Map(); // dbId -> array of {sheet, rowNum, ref, saf}
  const unmatchedRows = [];
  const ambiguousRows = [];
  const partialMatches = [];

  for (const r of matchResults) {
    if (r.matchedReg) {
      const id = r.matchedReg.id;
      if (!allMatchedDbIds.has(id)) {
        allMatchedDbIds.set(id, []);
      }
      allMatchedDbIds.get(id).push({
        sheet: r.item.sheetName,
        rowNum: r.item.rowNum,
        excelRef: r.item.ref,
        excelSaf: r.item.saf,
        excelAadhaar: r.item.aadhaar,
        excelName: `${r.item.firstName} ${r.item.lastName}`,
        dbRef: r.matchedReg.reference_number,
        dbSaf: r.matchedReg.saf_number,
        dbAadhaar: r.matchedReg.aadhaar_number,
        dbName: `${r.matchedReg.first_name} ${r.matchedReg.last_name}`,
        dbStatus: r.matchedReg.status,
        dbNotes: r.matchedReg.admin_notes,
        matchType: r.matchType,
      });

      if (!r.matchType.startsWith("EXACT")) {
        partialMatches.push({
          sheet: r.item.sheetName,
          rowNum: r.item.rowNum,
          matchType: r.matchType,
          excelRef: r.item.ref,
          excelSaf: r.item.saf,
          excelAadhaar: r.item.aadhaar,
          dbRef: r.matchedReg.reference_number,
          dbSaf: r.matchedReg.saf_number,
          dbAadhaar: r.matchedReg.aadhaar_number,
          name: `${r.matchedReg.first_name} ${r.matchedReg.last_name}`,
        });
      }
    } else if (r.matchType.startsWith("AMBIGUOUS")) {
      ambiguousRows.push(r);
    } else {
      unmatchedRows.push(r);
    }
  }

  // Cross-sheet duplicate check
  const duplicateAcrossSheets = [];
  for (const [id, entries] of allMatchedDbIds.entries()) {
    if (entries.length > 1) {
      duplicateAcrossSheets.push({ id, entries });
    }
  }

  console.log("\n========================================================");
  console.log("=== OVERALL TOTALS & SUMMARY ===");
  console.log("========================================================");
  console.log(`Total Excel Rows Processed: ${allExcelRows.length}`);
  console.log(`Total Rows Matched to DB: ${matchResults.filter(r => r.matchedReg).length}`);
  console.log(`Total Unique DB Records Matched: ${allMatchedDbIds.size}`);
  console.log(`Cross-sheet duplicates: ${duplicateAcrossSheets.length}`);
  console.log(`Unmatched rows: ${unmatchedRows.length}`);
  console.log(`Ambiguous rows: ${ambiguousRows.length}`);
  console.log(`Partial / non-exact matches: ${partialMatches.length}`);

  // DB Status distribution across all unique matched records
  const globalDbStatusDist = {};
  const globalDbNotesDist = {};
  for (const [id, entries] of allMatchedDbIds.entries()) {
    const primary = entries[0];
    const st = primary.dbStatus || "NULL";
    const notes = primary.dbNotes || "NULL";
    globalDbStatusDist[st] = (globalDbStatusDist[st] || 0) + 1;
    globalDbNotesDist[notes] = (globalDbNotesDist[notes] || 0) + 1;
  }
  // Check special status records
  const specialRecords = [];
  for (const [id, entries] of allMatchedDbIds.entries()) {
    const primary = entries[0];
    if (primary.dbStatus !== "Approved" && primary.dbStatus !== "Sent to Department") {
      specialRecords.push(primary);
    }
  }

  // Check batch assignment in useBatches.ts
  const useBatchesContent = fs.readFileSync("src/lib/useBatches.ts", "utf8");
  const batchMatches = [...useBatchesContent.matchAll(/id:\s*"([^"]+)",[\s\S]*?name:\s*"([^"]+)",[\s\S]*?applicantIds:\s*\[([\s\S]*?)\]/g)];
  const candidateBatchMap = new Map();
  for (const b of batchMatches) {
    const bName = b[2];
    const ids = b[3].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
    ids.forEach(id => candidateBatchMap.set(id, bName));
  }

  let assignedToBatchCount = 0;
  const assignedBatchesSummary = {};
  for (const [id, entries] of allMatchedDbIds.entries()) {
    const bName = candidateBatchMap.get(id);
    if (bName) {
      assignedToBatchCount++;
      assignedBatchesSummary[bName] = (assignedBatchesSummary[bName] || 0) + 1;
    }
  }

  console.log("\nSpecial non-standard records in DB:", JSON.stringify(specialRecords, null, 2));
  console.log(`\nBatch assignment in useBatches.ts: ${assignedToBatchCount} of 909 are currently assigned to batches.`);
  console.log("Batches affected:", assignedBatchesSummary);

  // Save audit details to JSON file for in-depth inspection
  const reportData = {
    totalExcelRows: allExcelRows.length,
    matchedRowsCount: matchResults.filter(r => r.matchedReg).length,
    uniqueDbRecordsMatchedCount: allMatchedDbIds.size,
    duplicateAcrossSheetsCount: duplicateAcrossSheets.length,
    duplicateAcrossSheets,
    unmatchedRows: unmatchedRows.map(u => ({
      sheet: u.item.sheetName,
      row: u.item.rowNum,
      ref: u.item.ref,
      saf: u.item.saf,
      aadhaar: u.item.aadhaar,
      name: `${u.item.firstName} ${u.item.lastName}`,
      phone: u.item.phone,
      matchType: u.matchType,
    })),
    ambiguousRows: ambiguousRows.map(a => ({
      sheet: a.item.sheetName,
      row: a.item.rowNum,
      ref: a.item.ref,
      saf: a.item.saf,
      aadhaar: a.item.aadhaar,
      name: `${a.item.firstName} ${a.item.lastName}`,
    })),
    partialMatches,
    globalDbStatusDist,
    globalDbNotesDist,
  };

  fs.writeFileSync("scripts/rejected_audit_report.json", JSON.stringify(reportData, null, 2));
  console.log("\nSaved detailed report to scripts/rejected_audit_report.json");
}

runAudit().catch(console.error);
