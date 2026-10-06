import fs from 'fs';

const useBatchesContent = fs.readFileSync('src/lib/useBatches.ts', 'utf-8');

const nameRegex = /name:\s*"([^"]+)"/g;
const existingBatches = new Set();
let m;
while ((m = nameRegex.exec(useBatchesContent)) !== null) {
  existingBatches.add(m[1]);
}

const uuidRegex = /"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/g;
const existingUuids = new Set();
while ((m = uuidRegex.exec(useBatchesContent)) !== null) {
  existingUuids.add(m[1]);
}

console.log('Existing Batches in useBatches.ts:', existingBatches.size);
console.log('Existing Assigned Applicants in useBatches.ts:', existingUuids.size);

const auditData = JSON.parse(fs.readFileSync('scripts/audit_bulkbatchassign2_results.json', 'utf-8'));

let overlapCount = 0;
let newBatchesCount = 0;
let existingBatchesExpanded = 0;
const reportRows = [];

for (const fileObj of auditData) {
  for (const sheet of fileObj.sheets) {
    if (sheet.totalRows === 0 || sheet.matchedDetails.length === 0) continue;
    const cleanBatch = sheet.batchName.replace(/\s+\/1/, '/1').trim();
    const isExisting = existingBatches.has(cleanBatch) || existingBatches.has(sheet.batchName);
    
    if (isExisting) {
      existingBatchesExpanded++;
    } else {
      newBatchesCount++;
    }

    let sheetOverlap = 0;
    for (const d of sheet.matchedDetails) {
      if (existingUuids.has(d.dbId)) {
        overlapCount++;
        sheetOverlap++;
      }
    }

    reportRows.push({
      file: fileObj.file,
      sheet: sheet.sheetName,
      batchId: cleanBatch,
      rows: sheet.totalRows,
      matched: sheet.matchedCount,
      accuracy: `${((sheet.matchedCount / sheet.totalRows) * 100).toFixed(1)}%`,
      status: isExisting ? 'Expands Existing Batch' : 'New Batch',
      overlaps: sheetOverlap
    });
  }
}

console.table(reportRows);
console.log('Total Batches in folder:', reportRows.length);
console.log('New Batches:', newBatchesCount);
console.log('Existing Batches Expanded:', existingBatchesExpanded);
console.log('Total Candidate Overlaps:', overlapCount);
