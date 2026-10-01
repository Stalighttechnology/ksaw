import fs from 'fs';

const auditData = JSON.parse(fs.readFileSync('scripts/audit_oct01_results.json', 'utf-8'));
const useBatchesContent = fs.readFileSync('src/lib/useBatches.ts', 'utf-8');

// Extract existing batch objects
const existingBatchNames = [];
const nameRegex = /name:\s*"([^"]+)"/g;
let m;
while ((m = nameRegex.exec(useBatchesContent)) !== null) {
  existingBatchNames.push(m[1]);
}
const existingBatchesSet = new Set(existingBatchNames);

// Extract existing applicant IDs
const uuidRegex = /"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/g;
const existingApplicantIds = new Set();
while ((m = uuidRegex.exec(useBatchesContent)) !== null) {
  existingApplicantIds.add(m[1]);
}

console.log('---------------------------------------------------------');
console.log('EXISTING MASTER STATE:');
console.log(`Total Existing Batches: ${existingBatchesSet.size}`);
console.log(`Total Existing Assigned Applicants: ${existingApplicantIds.size}`);
console.log('---------------------------------------------------------\n');

const fileBatchMapping = {
  'Central college approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/HSN/CPG/0926-33',
    partner: 'Vinod-Central College',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'KSAWU - B.V.V. Sangha\'s Mudhol approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/BKT/CPG/0926-80',
    partner: 'KSAWU - B.V.V. Sangha\'s Danammadevi Arts, Commerce and Science College for Women, Mudhol',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'KSAWU - Raj Rajeshwari, Rannebenur Approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/HVR/CPG/0926-86',
    partner: 'KSAWU - Raj Rajeshwari Arts & Commerce College for Women, Ranebennur',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'KSAWU BVVS Akkamahadevi, Bagalokot approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/BKT/CPG/0926-81',
    partner: 'KSAWU - BVVS Akkamahadevi Women\'s Arts, Science & Commerce College, Bagalkot',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'Mandavya approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/MDY/CPG/0926-96',
    partner: 'Mandavya- Vinod',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'Minerva approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/CMR/CPG/0926-97',
    partner: 'Ramesh Sir- Minerva Chamrajnagar',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'PES mandya approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/MDY/CPG/0926-98',
    partner: 'Vinod-PES Mandya',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'Polytechnic Ramnagra-GT Approval list ( 01-10-26).xlsx': {
    batchId: 'KSAWU/RMG/CPG/0926-79',
    partner: 'RAMANAGAR POLYTECHNIC - GT',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  },
  'Vittal college approval data ( 01-10-26).xlsx': {
    batchId: 'KSAWU/BGU/CPG/0926-106',
    partner: 'Vinod- VIJAYA VITTALA INSTITUTE OF TECHNOLOGY',
    role: 'Computer Programming',
    deptDate: '28.09.2026'
  }
};

let totalNewCandidates = 0;
let totalMatched = 0;
let totalUnmatched = 0;
let overlapsWithExisting = [];

const reportRows = [];

for (const fileObj of auditData) {
  const fileName = fileObj.file.replace(/^batch\//, '');
  const mapping = fileBatchMapping[fileName];
  
  for (const sheet of fileObj.sheets) {
    if (sheet.isSummary || sheet.sheetName.toLowerCase().includes('batch id')) continue;
    
    totalNewCandidates += sheet.totalRows;
    totalMatched += sheet.matchedCount;
    totalUnmatched += sheet.unmatchedCount;

    const matchedApplicants = sheet.matchedDetails || [];
    for (const app of matchedApplicants) {
      if (existingApplicantIds.has(app.dbId)) {
        overlapsWithExisting.push({
          fileName,
          batchId: mapping.batchId,
          app
        });
      }
    }

    reportRows.push({
      fileName,
      sheetName: sheet.sheetName,
      batchId: mapping.batchId,
      partner: mapping.partner,
      totalRows: sheet.totalRows,
      matchedCount: sheet.matchedCount,
      unmatchedCount: sheet.unmatchedCount,
      accuracy: `${((sheet.matchedCount / sheet.totalRows) * 100).toFixed(1)}%`,
      status: sheet.unmatchedCount === 0 ? '100% Matched' : 'Needs Review'
    });
  }
}

console.log('AUDIT SUMMARY TABLE:');
console.table(reportRows);

console.log('\nOVERLAP CHECK:');
console.log(`Total overlaps with existing batches: ${overlapsWithExisting.length}`);

console.log('\nTOTALS:');
console.log(`Total Files: ${Object.keys(fileBatchMapping).length}`);
console.log(`Total Batches Identified: ${reportRows.length}`);
console.log(`Total Candidates across all sheets: ${totalNewCandidates}`);
console.log(`Total Matched against Live DB: ${totalMatched}`);
console.log(`Total Unmatched: ${totalUnmatched}`);
console.log(`Overall Accuracy: ${((totalMatched / totalNewCandidates) * 100).toFixed(2)}%`);
