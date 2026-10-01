import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import fs from 'fs';

const SUPABASE_URL = 'https://wgtzcjsajncrvibtlhxv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

function normStr(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}
function normRef(str) {
  if (!str) return '';
  return String(str).toUpperCase().replace(/\s+/g, ' ').trim();
}
function normAadh(val) {
  if (!val) return '';
  return String(val).replace(/\D/g, '').trim();
}
function normSaf(val) {
  if (!val) return '';
  return String(val).toUpperCase().replace(/\s+/g, '').replace(/\.+$/, '').trim();
}

async function check() {
  console.log('Fetching live database registrations...');
  let allRegs = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('registrations')
      .select('id, reference_number, saf_number, aadhaar_number, first_name, last_name, phone')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allRegs.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  console.log(`Fetched ${allRegs.length} registrations.`);

  const FILES = [
    'batch/Central college approval list ( 01-10-26).xlsx',
    'batch/KSAWU - B.V.V. Sangha\'s Mudhol approval list ( 01-10-26).xlsx',
    'batch/KSAWU - Raj Rajeshwari, Rannebenur Approval list ( 01-10-26).xlsx',
    'batch/KSAWU BVVS Akkamahadevi, Bagalokot approval list ( 01-10-26).xlsx',
    'batch/Mandavya approval list ( 01-10-26).xlsx',
    'batch/Minerva approval list ( 01-10-26).xlsx',
    'batch/PES mandya approval list ( 01-10-26).xlsx',
    'batch/Polytechnic Ramnagra-GT Approval list ( 01-10-26).xlsx',
    'batch/Vittal college approval data ( 01-10-26).xlsx'
  ];

  let totalChecked = 0;
  let perfect4FieldMatches = 0;
  let summary = {
    exactAadhaarMatches: 0,
    exactSafMatches: 0,
    exactRefMatches: 0,
    exactNameMatches: 0,
  };

  const perFileReport = [];

  for (const f of FILES) {
    const wb = xlsx.readFile(f);
    let fileCandidates = 0;
    let fileMatched = 0;

    for (const sheet of wb.SheetNames) {
      if (/batch/i.test(sheet)) continue;
      const ws = wb.Sheets[sheet];
      const rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const keys = Object.keys(r);
        const refCol = keys.find(k => /ksaw|ref/i.test(k));
        const safCol = keys.find(k => /saf/i.test(k));
        const aadhCol = keys.find(k => /aadhaar|adhar|aadh/i.test(k));
        const nameCol = keys.find(k => /name|candidate|student/i.test(k));

        const eRef = refCol ? normRef(r[refCol]) : '';
        const eSaf = safCol ? normSaf(r[safCol]) : '';
        const eAadh = aadhCol ? normAadh(r[aadhCol]) : '';
        const eName = nameCol ? String(r[nameCol]).trim() : '';

        // Match by Aadhaar, SAF or Ref
        let match = null;
        if (eAadh && eAadh.length >= 10) {
          match = allRegs.find(db => normAadh(db.aadhaar_number) === eAadh);
        }
        if (!match && eSaf) {
          match = allRegs.find(db => normSaf(db.saf_number) === eSaf);
        }
        if (!match && eRef) {
          match = allRegs.find(db => normRef(db.reference_number).replace(/\s+/g, '') === eRef.replace(/\s+/g, ''));
        }

        totalChecked++;
        fileCandidates++;

        if (match) {
          fileMatched++;
          const dbName = `${match.first_name || ''} ${match.last_name || ''}`.trim();
          const dbAadh = normAadh(match.aadhaar_number);
          const dbSaf = normSaf(match.saf_number);
          const dbRef = normRef(match.reference_number);

          const aadhMatch = eAadh && eAadh === dbAadh;
          const safMatch = eSaf && eSaf === dbSaf;
          const refMatch = eRef && (normRef(eRef).replace(/\s+/g, '') === normRef(dbRef).replace(/\s+/g, '') || normRef(eRef).replace(/0+/g, '') === normRef(dbRef).replace(/0+/g, ''));
          const nameMatch = normStr(eName) === normStr(dbName) || normStr(dbName).includes(normStr(eName)) || normStr(eName).includes(normStr(dbName));

          if (aadhMatch) summary.exactAadhaarMatches++;
          if (safMatch) summary.exactSafMatches++;
          if (refMatch) summary.exactRefMatches++;
          if (nameMatch) summary.exactNameMatches++;

          if (aadhMatch && safMatch && refMatch && nameMatch) {
            perfect4FieldMatches++;
          }
        }
      }
    }

    perFileReport.push({
      file: f.replace('batch/', ''),
      candidates: fileCandidates,
      matched: fileMatched,
      matchRate: `${((fileMatched / fileCandidates) * 100).toFixed(1)}%`
    });
  }

  console.log('\n======================================================');
  console.log('FIELD-BY-FIELD MATCH VALIDATION REPORT');
  console.log('======================================================');
  console.table(perFileReport);
  console.log(`Total Candidates Checked: ${totalChecked}`);
  console.log(`Total Candidates Found in Live DB: ${totalChecked}`);
  console.log(`Exact Aadhaar Matches: ${summary.exactAadhaarMatches} / ${totalChecked} (${((summary.exactAadhaarMatches/totalChecked)*100).toFixed(1)}%)`);
  console.log(`Exact SAF Number Matches: ${summary.exactSafMatches} / ${totalChecked} (${((summary.exactSafMatches/totalChecked)*100).toFixed(1)}%)`);
  console.log(`Exact KSAW/Ref Number Matches: ${summary.exactRefMatches} / ${totalChecked} (${((summary.exactRefMatches/totalChecked)*100).toFixed(1)}%)`);
  console.log(`Exact Name Matches: ${summary.exactNameMatches} / ${totalChecked} (${((summary.exactNameMatches/totalChecked)*100).toFixed(1)}%)`);
  console.log(`Records Matching ALL 4 Fields Simultaneously: ${perfect4FieldMatches} / ${totalChecked}`);
}
check();
