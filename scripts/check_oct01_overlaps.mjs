import fs from 'fs';

const auditData = JSON.parse(fs.readFileSync('scripts/audit_oct01_results.json', 'utf-8'));
const useBatchesContent = fs.readFileSync('src/lib/useBatches.ts', 'utf-8');

const existingBatchMatch = useBatchesContent.matchAll(/name:\s*["']([^"']+)["']/g);
const existingBatches = new Set([...existingBatchMatch].map(m => m[1]));
console.log('Existing batch count in useBatches.ts:', existingBatches.size);

const batchIdMap = {
  'Central college approval list ( 01-10-26).xlsx': 'KSAWU/HSN/CPG/0926-33',
  'KSAWU - B.V.V. Sangha\'s Mudhol approval list ( 01-10-26).xlsx': 'KSAWU/BKT/CPG/0926-80',
  'KSAWU - Raj Rajeshwari, Rannebenur Approval list ( 01-10-26).xlsx': 'KSAWU/HVR/CPG/0926-86',
  'KSAWU BVVS Akkamahadevi, Bagalokot approval list ( 01-10-26).xlsx': 'KSAWU/BKT/CPG/0926-81',
  'Mandavya approval list ( 01-10-26).xlsx': 'KSAWU/MDY/CPG/0926-96',
  'Minerva approval list ( 01-10-26).xlsx': 'KSAWU/CMR/CPG/0926-97',
  'PES mandya approval list ( 01-10-26).xlsx': 'KSAWU/MDY/CPG/0926-98',
  'Polytechnic Ramnagra-GT Approval list ( 01-10-26).xlsx': 'KSAWU/RMG/CPG/0926-79',
  'Vittal college approval data ( 01-10-26).xlsx': 'KSAWU/BGU/CPG/0926-106'
};

for (const [file, batchId] of Object.entries(batchIdMap)) {
  console.log(`Batch: ${batchId} | Already in useBatches.ts? ${existingBatches.has(batchId)}`);
}

// Check student IDs in existing useBatches
const existingIds = new Set();
const idRegex = /ids:\s*new\s*Set\(\[([^\]]+)\]\)/g;
let match;
while ((match = idRegex.exec(useBatchesContent)) !== null) {
  const ids = match[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  ids.forEach(id => existingIds.add(id));
}
console.log('Total student IDs in existing batches:', existingIds.size);

let overlapCount = 0;
for (const fileObj of auditData) {
  for (const sheet of fileObj.sheets) {
    if (sheet.isSummary || !sheet.matchedDetails || sheet.matchedDetails.length === 0) continue;
    for (const d of sheet.matchedDetails) {
      if (existingIds.has(d.dbId)) {
        console.log(`Overlap candidate: ${d.dbId} | ${d.excelName} | ${d.excelRef}`);
        overlapCount++;
      }
    }
  }
}
console.log('Total Overlap Count:', overlapCount);
