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

async function findDups() {
  const folder = path.resolve(__dirname, '../approved to dept');
  const files = fs.readdirSync(folder).filter((f) => f.endsWith('.xlsx')).sort();

  const allDbRows = [];
  let page = 0;
  while (true) {
    const { data } = await supabase.from('registrations').select('id, reference_number, aadhaar_number, first_name, last_name').range(page * 1000, (page + 1) * 1000 - 1);
    if (!data || data.length === 0) break;
    allDbRows.push(...data);
    if (data.length < 1000) break;
    page++;
  }

  const cleanAadhaar = (a) => (a ? String(a).replace(/\D/g, '') : '');
  const cleanRef = (r) => (r ? String(r).trim().toUpperCase().replace(/\s+/g, ' ') : '');

  const idAppearances = {};

  for (const file of files) {
    const wb = xlsx.readFile(path.join(folder, file));
    for (const sheetName of wb.SheetNames) {
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
      for (const r of rows) {
        const rawAadhaar = cleanAadhaar(r['Aadhaar Number'] || r['Aadhaar'] || r['Aadhar Number'] || r['AadhaarNo']);
        const rawRef = cleanRef(r['Reference ID'] || r['Ref ID'] || r['SL No']);
        const match = allDbRows.find(p => (rawAadhaar && cleanAadhaar(p.aadhaar_number) === rawAadhaar) || (rawRef && cleanRef(p.reference_number) === rawRef));
        if (match) {
          if (!idAppearances[match.id]) idAppearances[match.id] = { ref: match.reference_number, name: `${match.first_name || ''} ${match.last_name || ''}`.trim(), files: [] };
          idAppearances[match.id].files.push(file);
        }
      }
    }
  }

  const dups = Object.values(idAppearances).filter(item => item.files.length > 1);
  console.log(`Total duplicate candidate records across sheets: ${dups.length}`);
  dups.forEach(d => console.log(`- ${d.ref} (${d.name}) appears in: ${d.files.join(', ')}`));
}
findDups();
