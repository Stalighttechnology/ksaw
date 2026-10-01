import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SUPABASE_URL = 'https://wgtzcjsajncrvibtlhxv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function detailedDuplicateAudit() {
  const folder = path.resolve(__dirname, '../approved to dept');
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.xlsx')).sort();

  const allDbRows = [];
  let page = 0;
  while (true) {
    const { data } = await supabase
      .from('registrations')
      .select('id, reference_number, saf_number, aadhaar_number, first_name, last_name, institution_name, caste, nigama, status')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allDbRows.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  const cleanRef = (r) => (r ? String(r).trim().toUpperCase().replace(/\s+/g, ' ') : '');
  const cleanAadhaar = (a) => (a ? String(a).replace(/\D/g, '') : '');
  const cleanSaf = (s) => (s ? String(s).trim().toUpperCase() : '');

  const appearances = {};

  for (const file of files) {
    const wb = xlsx.readFile(path.join(folder, file));
    for (const sheetName of wb.SheetNames) {
      const sheet = wb.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (rawRows.length < 2) continue;

      let headerRowIdx = -1;
      let refIdx = -1;
      let safIdx = -1;
      let aadhaarIdx = -1;
      let fnIdx = -1;
      let lnIdx = -1;

      for (let rIdx = 0; rIdx < Math.min(10, rawRows.length); rIdx++) {
        const row = rawRows[rIdx].map((c) => String(c).trim().toLowerCase());
        const findCol = (candidates) => row.findIndex((h) => candidates.some((c) => h.includes(c)));

        const fRef = findCol(['reference', 'ref no', 'app_no', 'reg', 'sl no']);
        const fSaf = findCol(['saf', 'saf_no', 'saf id', 'safid']);
        const fAadhaar = findCol(['aadhaar', 'adhar', 'uid', 'aadhar']);
        const fFn = findCol(['first name', 'firstname', 'name', 'candidate']);
        const fLn = findCol(['last name', 'lastname', 'surname']);

        if (fSaf !== -1 || fAadhaar !== -1 || (fRef !== -1 && fFn !== -1)) {
          headerRowIdx = rIdx;
          refIdx = fRef;
          safIdx = fSaf;
          aadhaarIdx = fAadhaar;
          fnIdx = fFn;
          lnIdx = fLn;
          break;
        }
      }

      if (headerRowIdx === -1) headerRowIdx = 0;

      for (let rIdx = headerRowIdx + 1; rIdx < rawRows.length; rIdx++) {
        const row = rawRows[rIdx];
        if (!row || row.every((c) => String(c).trim() === '')) continue;

        const rawRef = refIdx !== -1 ? row[refIdx] : '';
        const rawSaf = safIdx !== -1 ? row[safIdx] : '';
        const rawAadhaar = aadhaarIdx !== -1 ? row[aadhaarIdx] : '';
        const rawName = `${fnIdx !== -1 ? row[fnIdx] : ''} ${lnIdx !== -1 ? row[lnIdx] : ''}`.trim();

        const cRef = cleanRef(rawRef);
        const cAadhaar = cleanAadhaar(rawAadhaar);
        const cSaf = cleanSaf(rawSaf);

        if (!cRef && !cAadhaar && !cSaf && !rawName) continue;

        const match = allDbRows.find((p) => {
          const pRef = cleanRef(p.reference_number);
          const pAadhaar = cleanAadhaar(p.aadhaar_number);
          const pSaf = cleanSaf(p.saf_number);

          if (cRef && pRef && pRef === cRef) return true;
          if (cAadhaar && pAadhaar && cAadhaar.length >= 10 && pAadhaar === cAadhaar) return true;
          if (cSaf && pSaf && cSaf.startsWith('SAF') && pSaf === cSaf) return true;
          return false;
        });

        if (match) {
          if (!appearances[match.id]) {
            appearances[match.id] = {
              dbId: match.id,
              ref: match.reference_number,
              name: `${match.first_name || ''} ${match.last_name || ''}`.trim(),
              aadhaar: match.aadhaar_number,
              saf: match.saf_number,
              college: match.institution_name,
              caste: match.caste,
              nigama: match.nigama,
              status: match.status,
              instances: [],
            };
          }
          appearances[match.id].instances.push({
            file,
            sheet: sheetName,
            excelRow: rIdx + 1,
            excelRef: rawRef,
            excelSaf: rawSaf,
            excelAadhaar: rawAadhaar,
            excelName: rawName,
          });
        }
      }
    }
  }

  const duplicates = Object.values(appearances).filter((a) => a.instances.length > 1);

  console.log(`\n======================================================`);
  console.log(`=== DUPLICATE CANDIDATES IN EXCEL SHEETS (${duplicates.length} Candidates, ${duplicates.reduce((s, d) => s + (d.instances.length - 1), 0)} Extra Rows) ===`);
  console.log(`======================================================\n`);

  duplicates.forEach((d, idx) => {
    console.log(`${idx + 1}. [${d.ref}] ${d.name}`);
    console.log(`   - Aadhaar: ${d.aadhaar} | SAF: ${d.saf} | College: ${d.college}`);
    console.log(`   - Total Times Listed in Excel: ${d.instances.length} times`);
    d.instances.forEach((inst, iIdx) => {
      console.log(`     (${iIdx + 1}) File: "${inst.file}" [Sheet: ${inst.sheet}, Row: ${inst.excelRow}] -> Ref: "${inst.excelRef}", Aadhaar: "${inst.excelAadhaar}", SAF: "${inst.excelSaf}"`);
    });
    console.log('');
  });
}

detailedDuplicateAudit();
