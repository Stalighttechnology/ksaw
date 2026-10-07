import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/audit_two_files_report.json', 'utf8'));

// Find cross overlap
const f1Map = new Map();
data.file1Results.forEach(r => f1Map.set(r.excelData.aadhaar, r));

console.log('=== CROSS-FILE OVERLAP ===');
data.file2Results.forEach(r => {
  if (f1Map.has(r.excelData.aadhaar)) {
    const f1r = f1Map.get(r.excelData.aadhaar);
    console.log('Overlapping record found in BOTH files:');
    console.log('File 1 (V-21.09.2026 (1).xlsx): Row', f1r.rowIndex, 'SL No:', f1r.slNo, 'Aadhaar:', f1r.excelData.aadhaar, 'Name:', f1r.excelData.firstName, 'SAF:', f1r.excelData.saf);
    console.log('File 2 (V-28.09.2026 (1).xlsx): Row', r.rowIndex, 'SL No:', r.slNo, 'Aadhaar:', r.excelData.aadhaar, 'Name:', r.excelData.firstName, 'SAF:', r.excelData.saf);
    console.log('DB Record: id=', r.dbMatches[0].id, 'status=', r.dbMatches[0].status, 'admin_notes=', r.dbMatches[0].admin_notes, 'ref=', r.dbMatches[0].reference_number, 'saf=', r.dbMatches[0].saf_number);
  }
});

function checkFieldDifferences(results, fileLabel) {
  console.log('\n======================================================');
  console.log('=== FIELD COMPARISON FOR ' + fileLabel + ' ===');
  console.log('======================================================');
  let safDiffs = [];
  let nameDiffs = [];
  let genderDiffs = [];
  let casteDiffs = [];
  let rdDiffs = [];
  let centerDiffs = [];

  results.forEach(r => {
    const ex = r.excelData;
    const db = r.dbMatches[0];

    // SAF
    const exSaf = (ex.saf || '').trim().toUpperCase();
    const dbSaf = (db.saf_number || '').trim().toUpperCase();
    if (exSaf && dbSaf && exSaf !== dbSaf) {
      safDiffs.push({ row: r.rowIndex, sl: r.slNo, exSaf, dbSaf, name: ex.firstName, aadhaar: ex.aadhaar });
    } else if (exSaf && !dbSaf) {
      safDiffs.push({ row: r.rowIndex, sl: r.slNo, exSaf, dbSaf: '(NULL in DB)', name: ex.firstName, aadhaar: ex.aadhaar });
    }

    // Name
    const exName = `${ex.firstName || ''} ${ex.lastName || ''}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const dbName = `${db.first_name || ''} ${db.last_name || ''}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const exFirstOnly = (ex.firstName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const dbFirstOnly = (db.first_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (exName !== dbName && !dbName.includes(exName) && !exName.includes(dbName) && !dbName.includes(exFirstOnly) && !exName.includes(dbFirstOnly)) {
      nameDiffs.push({ row: r.rowIndex, sl: r.slNo, exName: `${ex.firstName} ${ex.lastName}`, dbName: `${db.first_name} ${db.last_name}`, aadhaar: ex.aadhaar });
    }

    // Gender
    const exGender = (ex.gender || '').trim().toLowerCase();
    const dbGender = (db.gender || '').trim().toLowerCase();
    if (exGender && dbGender && exGender !== dbGender) {
      genderDiffs.push({ row: r.rowIndex, sl: r.slNo, exGender: ex.gender, dbGender: db.gender, name: ex.firstName, aadhaar: ex.aadhaar });
    }

    // Caste
    const exCaste = (ex.caste || '').trim().toLowerCase();
    const dbCaste = (db.caste || '').trim().toLowerCase();
    if (exCaste && dbCaste && exCaste !== dbCaste) {
      casteDiffs.push({ row: r.rowIndex, sl: r.slNo, exCaste: ex.caste, dbCaste: db.caste, name: ex.firstName, aadhaar: ex.aadhaar });
    }

    // RD No
    const exRd = (ex.rdNo || '').trim().toUpperCase();
    const dbRd = (db.rd_number || '').trim().toUpperCase();
    if (exRd && dbRd && exRd !== dbRd) {
      rdDiffs.push({ row: r.rowIndex, sl: r.slNo, exRd: ex.rdNo, dbRd: db.rd_number, name: ex.firstName, aadhaar: ex.aadhaar });
    } else if (exRd && !dbRd) {
      rdDiffs.push({ row: r.rowIndex, sl: r.slNo, exRd: ex.rdNo, dbRd: '(NULL in DB)', name: ex.firstName, aadhaar: ex.aadhaar });
    }

    // Center
    const exCenter = (ex.center || '').trim().toUpperCase();
    const dbCenter = (db.center_location || '').trim().toUpperCase();
    if (exCenter && dbCenter && exCenter !== dbCenter) {
      centerDiffs.push({ row: r.rowIndex, sl: r.slNo, exCenter: ex.center, dbCenter: db.center_location, name: ex.firstName, aadhaar: ex.aadhaar });
    }
  });

  console.log(`Total rows checked: ${results.length}`);
  console.log(`SAF differences: ${safDiffs.length}`);
  if (safDiffs.length > 0) console.log('  Details:', JSON.stringify(safDiffs, null, 2));

  console.log(`Name notable variations: ${nameDiffs.length}`);
  if (nameDiffs.length > 0) console.log('  Details:', JSON.stringify(nameDiffs, null, 2));

  console.log(`Gender differences: ${genderDiffs.length}`);
  if (genderDiffs.length > 0) console.log('  Details:', JSON.stringify(genderDiffs, null, 2));

  console.log(`Caste differences: ${casteDiffs.length}`);
  if (casteDiffs.length > 0) console.log('  Details:', JSON.stringify(casteDiffs.slice(0, 10), null, 2));

  console.log(`RD Number differences: ${rdDiffs.length}`);
  if (rdDiffs.length > 0) console.log('  Details:', JSON.stringify(rdDiffs.slice(0, 10), null, 2));

  console.log(`Center differences: ${centerDiffs.length}`);
  if (centerDiffs.length > 0) console.log('  Details:', JSON.stringify(centerDiffs.slice(0, 10), null, 2));
}

checkFieldDifferences(data.file1Results, 'File 1: V-21.09.2026 (1).xlsx');
checkFieldDifferences(data.file2Results, 'File 2: V-28.09.2026 (1).xlsx');
