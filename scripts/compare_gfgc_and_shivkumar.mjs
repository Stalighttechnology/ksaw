import xlsx from "xlsx";
import fs from "fs";

const text = fs.readFileSync("src/lib/useBatches.ts", "utf8");

function getBatchCandidateData(batchName) {
  const regex = new RegExp(`id:\\s*"${batchName.replace(/\//g, "\\/")}"[\\s\\S]*?safNumbers:\\s*\\[([\\s\\S]*?)\\][\\s\\S]*?referenceNumbers:\\s*\\[([\\s\\S]*?)\\][\\s\\S]*?aadhaarNumbers:\\s*\\[([\\s\\S]*?)\\]`);
  const match = text.match(regex);
  if (!match) return null;
  const safs = match[1].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  const refs = match[2].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  const aadhaars = match[3].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  return { safs, refs, aadhaars };
}

console.log("=== Checking GFGC Byrapura vs useBatches.ts ===");
const wbGFGC = xlsx.readFile("batch/GFGC Byrapura list.xlsx");
const dGFGC = xlsx.utils.sheet_to_json(wbGFGC.Sheets["Sheet1"]);

for (const b of ["KSAWU/MYR/CPG/0926-69", "KSAWU/MYR/CPG/0926-70"]) {
  const existing = getBatchCandidateData(b);
  const inExcel = dGFGC.filter(r => r["Batch"] === b);
  console.log(`\nBatch: ${b}`);
  console.log(`  Existing in useBatches: ${existing ? existing.safs.length : 0}`);
  console.log(`  In GFGC Byrapura Excel: ${inExcel.length}`);

  let overlaps = 0;
  let newCandidates = 0;
  for (const r of inExcel) {
    const saf = String(r["SAF Number"] || "").trim().toUpperCase().replace(/\.+$/, "");
    const aadh = String(r["Aadhaar Number"] || "").replace(/\D/g, "");
    const isOverlap = existing && (existing.safs.some(s => s.toUpperCase().includes(saf) || saf.includes(s.toUpperCase())) || existing.aadhaars.includes(aadh));
    if (isOverlap) overlaps++;
    else newCandidates++;
  }
  console.log(`  Overlaps with existing: ${overlaps} | Brand New candidates to add: ${newCandidates}`);
}

console.log("\n=== Checking Shivkumar vs useBatches.ts ===");
const wbShiv = xlsx.readFile("batch/Shivkumar approval list ( 01-10-26).xlsx");
const dShiv = xlsx.utils.sheet_to_json(wbShiv.Sheets["candidates list"]);
const existing25 = getBatchCandidateData("KSAWU/VJP/CPG/0926-25");
console.log(`Batch: KSAWU/VJP/CPG/0926-25`);
console.log(`  Existing in useBatches: ${existing25 ? existing25.safs.length : 0}`);
console.log(`  In Shivkumar Excel: ${dShiv.length}`);
for (const r of dShiv) {
  const saf = String(r["SAF Number"] || "").trim();
  const ref = String(r["Reference ID"] || "").trim();
  const isOverlap = existing25 && (existing25.safs.includes(saf) || existing25.refs.includes(ref));
  console.log(`  Candidate ${saf} (${ref}): ${isOverlap ? "ALREADY IN BATCH" : "NEW TO ADD"}`);
}
