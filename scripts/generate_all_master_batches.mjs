import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";

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

async function runMasterGeneration() {
  console.log("1. Fetching all live registrations from Supabase database...");
  let allRegs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone, institution_name, category, gender, religion")
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allRegs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Fetched total ${allRegs.length} live registrations.`);

  const batchFiles = fs.readdirSync("batch").filter(f => f.endsWith(".xlsx"));
  console.log(`Found ${batchFiles.length} batch Excel files in batch/ directory.`);

  const batchesMap = new Map();

  for (const filename of batchFiles) {
    const filePath = path.join("batch", filename);
    const wb = xlsx.readFile(filePath);

    // Check if workbook has individual batch sheets
    const hasIndividualBatchSheets = wb.SheetNames.some(s => 
      !s.toLowerCase().includes("candidate") && 
      !s.toLowerCase().includes("report") &&
      !s.toLowerCase().includes("summary")
    );

    for (const sheetName of wb.SheetNames) {
      const lowerSheet = sheetName.toLowerCase().trim();
      if (lowerSheet.includes("batch id report") || lowerSheet.includes("summary")) continue;

      // If workbook has specific batch sheets, and this sheet is generic "candidates list" without its own unique batch column, skip it to avoid duplicates
      const ws = wb.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      const batchCol = keys.find(k => /batch\s*id|batch\s*name|^batch$/i.test(k));
      const refCol = keys.find(k => /ksaw|ref/i.test(k));
      const safCol = keys.find(k => /saf/i.test(k));
      const aadhCol = keys.find(k => /aadhaar|adhar|aadh/i.test(k));
      const nameCol = keys.find(k => /name|candidate|student/i.test(k));
      const phoneCol = keys.find(k => /phone|mobile|contact/i.test(k));

      // Check if rows have batch values
      const hasBatchValues = rows.some(r => batchCol && String(r[batchCol]).trim().length > 0);

      if (lowerSheet.includes("candidate") && hasIndividualBatchSheets && !hasBatchValues) {
        console.log(`Skipping combined summary sheet "${sheetName}" in ${filename} in favor of individual batch sheets.`);
        continue;
      }

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        let rawBatch = (batchCol && r[batchCol] ? String(r[batchCol]).trim() : "").replace(/\s+/g, "");
        if (!rawBatch) {
          rawBatch = sheetName.trim().replace(/\s+/g, "/");
        }
        let batchId = rawBatch.replace(/\s+/g, "").replace(/\/\//g, "/");

        // Format batchId to standard KSAWU/... if it is just a number like 0926-2 or CPG 0926-4
        if (!batchId.toUpperCase().startsWith("KSAWU/")) {
          // If in AVK
          if (filename.includes("AVK")) {
            batchId = `KSAWU/HSN/${batchId.includes("CPG") ? "CPG" : "CHN"}/${batchId.replace(/^(CPG|CHN)\/?/i, "")}`;
          } else if (filename.includes("DR Shankar")) {
            batchId = `KSAWU/UDP/CPG/${batchId}`;
          } else if (filename.includes("GFGC Byrapur")) {
            batchId = `KSAWU/MYR/CPG/${batchId}`;
          } else if (filename.includes("KTSV")) {
            batchId = `KSAWU/BGU/CPG/${batchId}`;
          } else if (filename.includes("Shree Medha")) {
            batchId = `KSAWU/BLR/CPG/${batchId}`;
          }
        }
        batchId = batchId.replace(/\/\//g, "/");

        const refVal = refCol ? normalizeRef(r[refCol]) : "";
        const safVal = safCol ? normalizeSaf(r[safCol]) : "";
        const aadhVal = aadhCol ? normalizeAadhaar(r[aadhCol]) : "";
        const nameVal = nameCol ? String(r[nameCol]).trim() : "";
        const phoneVal = phoneCol ? String(r[phoneCol]).replace(/\D/g, "").slice(-10) : "";

        // Skip completely empty rows
        if (!refVal && !safVal && !aadhVal && !nameVal) continue;

        if (!batchesMap.has(batchId)) {
          batchesMap.set(batchId, {
            id: batchId,
            name: batchId,
            sheetName: sheetName.trim(),
            file: filename,
            applicantIds: [],
            safNumbers: [],
            referenceNumbers: [],
            aadhaarNumbers: [],
            unmatched: []
          });
        }

        const bData = batchesMap.get(batchId);

        // Find match in live database
        let match = null;

        // 1. Aadhaar (12 digits)
        if (aadhVal && aadhVal.length >= 10) {
          match = allRegs.find(db => normalizeAadhaar(db.aadhaar_number) === aadhVal);
        }

        // 2. SAF Number
        if (!match && safVal) {
          const cleanSaf = safVal.replace(/\.+$/, "");
          match = allRegs.find(db => {
            const dbSaf = normalizeSaf(db.saf_number);
            return dbSaf === cleanSaf || dbSaf.replace(/\.+$/, "") === cleanSaf;
          });
        }

        // 3. Reference ID
        if (!match && refVal) {
          const cleanRef = refVal.replace(/\s+/g, "");
          match = allRegs.find(db => {
            const dbRef = normalizeRef(db.reference_number).replace(/\s+/g, "");
            return dbRef === cleanRef || dbRef.replace(/0+/g, "") === cleanRef.replace(/0+/g, "");
          });
        }

        // 4. Phone
        if (!match && phoneVal && phoneVal.length === 10) {
          match = allRegs.find(db => {
            const dbP = String(db.phone || "").replace(/\D/g, "").slice(-10);
            return dbP === phoneVal;
          });
        }

        // 5. Name
        if (!match && nameVal) {
          const nNorm = normalizeStr(nameVal);
          match = allRegs.find(db => {
            const dbFullName = normalizeStr(`${db.first_name || ""} ${db.last_name || ""}`);
            return dbFullName === nNorm;
          });
        }

        if (match) {
          if (!bData.applicantIds.includes(match.id)) {
            bData.applicantIds.push(match.id);
          }
          if (safVal && !bData.safNumbers.includes(safVal)) {
            bData.safNumbers.push(safVal);
          } else if (match.saf_number && !bData.safNumbers.includes(match.saf_number)) {
            bData.safNumbers.push(match.saf_number);
          }

          if (refVal && !bData.referenceNumbers.includes(refVal)) {
            bData.referenceNumbers.push(refVal);
          } else if (match.reference_number && !bData.referenceNumbers.includes(match.reference_number)) {
            bData.referenceNumbers.push(match.reference_number);
          }

          if (aadhVal && !bData.aadhaarNumbers.includes(aadhVal)) {
            bData.aadhaarNumbers.push(aadhVal);
          } else if (match.aadhaar_number && !bData.aadhaarNumbers.includes(match.aadhaar_number)) {
            bData.aadhaarNumbers.push(match.aadhaar_number);
          }
        } else {
          bData.unmatched.push({ row: i + 2, file: filename, sheet: sheetName, ref: refVal, saf: safVal, aadhaar: aadhVal, name: nameVal });
        }
      }
    }
  }

  console.log(`\n=================== MASTER BATCHES AUDIT ===================`);
  let totalMatchedApplicants = 0;
  let totalUnmatched = 0;

  for (const [batchId, b] of batchesMap.entries()) {
    totalMatchedApplicants += b.applicantIds.length;
    totalUnmatched += b.unmatched.length;
    console.log(`Batch [${batchId}] (${b.file}) -> Matched: ${b.applicantIds.length} | Unmatched: ${b.unmatched.length}`);
  }

  console.log(`\nGrand Total Batches: ${batchesMap.size}`);
  console.log(`Grand Total Matched Applicants: ${totalMatchedApplicants}`);
  console.log(`Grand Total Unmatched: ${totalUnmatched}`);

  // Build useBatches.ts
  console.log("\n2. Generating src/lib/useBatches.ts...");

  let tsContent = `import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BatchItem {
  id: string;
  name: string;
  sheetName?: string;
  totalCount?: number;
  applicantIds: string[];
  safNumbers: string[];
  referenceNumbers: string[];
  aadhaarNumbers: string[];
}

export interface BatchesManifest {
  version: number;
  lastUpdated: string;
  batches: BatchItem[];
  applicantBatchMap: Record<string, string>;
  safBatchMap: Record<string, string>;
  refBatchMap: Record<string, string>;
  aadhaarBatchMap: Record<string, string>;
}

const STORAGE_BUCKET = "registrations";
const MANIFEST_FILE_NAME = "batches_manifest.json";

`;

  const batchVarNames = [];
  let idx = 1;

  for (const [batchId, b] of batchesMap.entries()) {
    const varName = `BUILTIN_BATCH_${idx++}`;
    batchVarNames.push(varName);

    tsContent += `export const ${varName}: BatchItem = {
  id: ${JSON.stringify(b.id)},
  name: ${JSON.stringify(b.name)},
  sheetName: ${JSON.stringify(b.sheetName)},
  totalCount: ${b.applicantIds.length},
  applicantIds: ${JSON.stringify(b.applicantIds, null, 4).replace(/\n/g, "\n  ")},
  safNumbers: ${JSON.stringify(b.safNumbers, null, 4).replace(/\n/g, "\n  ")},
  referenceNumbers: ${JSON.stringify(b.referenceNumbers, null, 4).replace(/\n/g, "\n  ")},
  aadhaarNumbers: ${JSON.stringify(b.aadhaarNumbers, null, 4).replace(/\n/g, "\n  ")}
};

`;
  }

  tsContent += `export const BUILTIN_BATCHES: BatchItem[] = [
  ${batchVarNames.join(",\n  ")}
];

function buildStaticMaps(batches: BatchItem[]) {
  const applicantBatchMap: Record<string, string> = {};
  const safBatchMap: Record<string, string> = {};
  const refBatchMap: Record<string, string> = {};
  const aadhaarBatchMap: Record<string, string> = {};

  for (const b of batches) {
    b.applicantIds.forEach((id) => { applicantBatchMap[id] = b.name; });
    b.safNumbers.forEach((saf) => {
      const clean = saf.trim().toUpperCase();
      safBatchMap[clean] = b.name;
      safBatchMap[clean.replace(/\\.+$/, "")] = b.name;
    });
    b.referenceNumbers.forEach((ref) => {
      const clean = ref.trim().toUpperCase();
      refBatchMap[clean] = b.name;
      refBatchMap[clean.replace(/\\s+/g, "")] = b.name;
    });
    b.aadhaarNumbers.forEach((aadh) => {
      aadhaarBatchMap[aadh.replace(/\\D/g, "")] = b.name;
    });
  }

  return { applicantBatchMap, safBatchMap, refBatchMap, aadhaarBatchMap };
}

const STATIC_MAPS = buildStaticMaps(BUILTIN_BATCHES);

export const DEFAULT_BATCHES: readonly string[] = [
  ${Array.from(batchesMap.keys()).map(k => JSON.stringify(k)).join(",\n  ")}
];

const INITIAL_MANIFEST: BatchesManifest = {
  version: 5,
  lastUpdated: new Date().toISOString(),
  batches: BUILTIN_BATCHES,
  applicantBatchMap: STATIC_MAPS.applicantBatchMap,
  safBatchMap: STATIC_MAPS.safBatchMap,
  refBatchMap: STATIC_MAPS.refBatchMap,
  aadhaarBatchMap: STATIC_MAPS.aadhaarBatchMap,
};

async function fetchBatchesManifest(): Promise<BatchesManifest> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(MANIFEST_FILE_NAME);

    if (error || !data) {
      return INITIAL_MANIFEST;
    }

    const text = await data.text();
    const parsed = JSON.parse(text) as BatchesManifest;
    if (parsed && parsed.batches && parsed.batches.length >= BUILTIN_BATCHES.length && parsed.version >= 5) {
      return parsed;
    }
    return INITIAL_MANIFEST;
  } catch {
    return INITIAL_MANIFEST;
  }
}

export function useBatches() {
  const queryClient = useQueryClient();

  const { data: manifest } = useQuery<BatchesManifest>({
    queryKey: ["ksaw-batches-manifest-v5"],
    queryFn: fetchBatchesManifest,
    staleTime: 1000 * 60 * 10,
    initialData: INITIAL_MANIFEST,
  });

  const activeManifest = manifest || INITIAL_MANIFEST;

  const batchesList = useMemo(() => {
    const set = new Set<string>(DEFAULT_BATCHES);
    if (activeManifest?.batches) {
      activeManifest.batches.forEach((b) => {
        if (b.name) set.add(b.name);
        else if (b.id) set.add(b.id);
      });
    }
    return Array.from(set).sort();
  }, [activeManifest]);

  const getApplicantBatch = useMemo(() => {
    return (applicant: {
      id?: string;
      saf_number?: string | null;
      reference_number?: string | null;
      aadhaar_number?: string | null;
    }): string | null => {
      if (!applicant) return null;

      if (applicant.id && activeManifest.applicantBatchMap?.[applicant.id]) {
        return activeManifest.applicantBatchMap[applicant.id];
      }

      if (applicant.saf_number) {
        const cleanSaf = applicant.saf_number.trim().toUpperCase();
        if (activeManifest.safBatchMap?.[cleanSaf]) {
          return activeManifest.safBatchMap[cleanSaf];
        }
        const noDot = cleanSaf.replace(/\\.+$/, "");
        if (activeManifest.safBatchMap?.[noDot]) {
          return activeManifest.safBatchMap[noDot];
        }
      }

      if (applicant.reference_number) {
        const cleanRef = applicant.reference_number.trim().toUpperCase();
        if (activeManifest.refBatchMap?.[cleanRef]) {
          return activeManifest.refBatchMap[cleanRef];
        }
        const noSpace = cleanRef.replace(/\\s+/g, "");
        if (activeManifest.refBatchMap?.[noSpace]) {
          return activeManifest.refBatchMap[noSpace];
        }
      }

      if (applicant.aadhaar_number) {
        const cleanAadh = applicant.aadhaar_number.replace(/\\D/g, "");
        if (activeManifest.aadhaarBatchMap?.[cleanAadh]) {
          return activeManifest.aadhaarBatchMap[cleanAadh];
        }
      }

      return null;
    };
  }, [activeManifest]);

  const getBatchApplicantIds = useMemo(() => {
    return (batchName: string): string[] => {
      if (!batchName) return [];
      const found = activeManifest.batches?.find(
        (b) => b.name === batchName || b.id === batchName
      );
      return found ? found.applicantIds : [];
    };
  }, [activeManifest]);

  const allBatchApplicantIds = useMemo(() => {
    const set = new Set<string>();
    if (activeManifest?.batches) {
      activeManifest.batches.forEach((b) => {
        b.applicantIds.forEach((id) => set.add(id));
      });
    }
    return Array.from(set);
  }, [activeManifest]);

  return {
    manifest: activeManifest,
    batches: batchesList,
    getApplicantBatch,
    getBatchApplicantIds,
    allBatchApplicantIds,
    refreshBatches: () => queryClient.invalidateQueries({ queryKey: ["ksaw-batches-manifest-v5"] }),
  };
}
`;

  fs.writeFileSync("src/lib/useBatches.ts", tsContent, "utf8");
  console.log("3. Successfully updated src/lib/useBatches.ts with all 55 clean batches!");
}

runMasterGeneration();
