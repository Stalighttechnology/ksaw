import fs from "fs";

const text = fs.readFileSync("src/lib/useBatches.ts", "utf8");
const batchDefs = text.match(/export const BUILTIN_BATCH_\d+: BatchItem/g);
console.log("Total BUILTIN_BATCH definitions:", batchDefs ? batchDefs.length : 0);

const defaultBatchesMatch = text.match(/export const DEFAULT_BATCHES: readonly string\[\] = sortBatchNames\(\[\s*([\s\S]*?)\s*\]\);/);
if (defaultBatchesMatch) {
  const list = defaultBatchesMatch[1].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  console.log("Total DEFAULT_BATCHES:", list.length);
}

const idMatches = [...text.matchAll(/"([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"/g)].map(m => m[1]);
const uniqueIds = new Set(idMatches);
console.log("Total matched applicant ID references:", idMatches.length);
console.log("Total unique applicants assigned across all batches:", uniqueIds.size);
console.log("Any cross-batch duplicates:", idMatches.length !== uniqueIds.size ? "YES" : "NO (Clean 100%)");
