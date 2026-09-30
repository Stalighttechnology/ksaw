import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

const sb = createClient('https://wgtzcjsajncrvibtlhxv.supabase.co', 'sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx');

async function checkVarnika() {
  const { data: dbRows } = await sb.from('registrations').select('*').or('reference_number.ilike.%1433%,first_name.ilike.%varnika%,aadhaar_number.eq.939643988825,aadhaar_number.eq.287991780239,aadhaar_number.eq.795012057889');
  console.log('--- DATABASE RECORD(S) ---');
  console.log(JSON.stringify(dbRows, null, 2));

  console.log('\n--- EXCEL 1: V-18.09.2026.xlsx ---');
  const wb1 = xlsx.readFile('c:/Users/raghu/Desktop/ksaw/approved to dept/V-18.09.2026.xlsx');
  const d1 = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { header: 1 });
  for (let i = 130; i < Math.min(138, d1.length); i++) {
    console.log(`Row ${i + 1}:`, d1[i]);
  }

  console.log('\n--- EXCEL 2: Vokkaliga-15.09.2026.xlsx ---');
  const wb2 = xlsx.readFile('c:/Users/raghu/Desktop/ksaw/approved to dept/Vokkaliga-15.09.2026.xlsx');
  const d2 = xlsx.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1 });
  for (let i = 120; i < Math.min(128, d2.length); i++) {
    console.log(`Row ${i + 1}:`, d2[i]);
  }
}
checkVarnika();
