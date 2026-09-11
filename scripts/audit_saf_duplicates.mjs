import { createClient } from '@supabase/supabase-js';

const sb = createClient('https://wgtzcjsajncrvibtlhxv.supabase.co', 'sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx');

async function auditSaf() {
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await sb
      .from('registrations')
      .select('id, reference_number, first_name, last_name, saf_number, aadhaar_number, phone, institution_name, created_at')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log('Total records in DB:', allRows.length);

  const validSafRows = allRows.filter(r => {
    if (!r.saf_number) return false;
    const s = String(r.saf_number).trim().toUpperCase();
    return s !== '' && s !== 'N/A' && s !== 'NA' && s !== 'NULL' && s !== 'UNDEFINED';
  });

  console.log('Total records with a valid SAF number:', validSafRows.length);

  const safGroups = {};
  for (const r of validSafRows) {
    const cleanSaf = String(r.saf_number).trim().toUpperCase();
    if (!safGroups[cleanSaf]) safGroups[cleanSaf] = [];
    safGroups[cleanSaf].push(r);
  }

  const duplicates = Object.entries(safGroups).filter(([saf, list]) => list.length > 1);
  console.log('Total distinct duplicated SAF numbers:', duplicates.length);

  duplicates.sort((a, b) => b[1].length - a[1].length);

  console.log('\n--- DETAILED BREAKDOWN OF DUPLICATE SAF NUMBERS ---');
  for (const [saf, list] of duplicates) {
    console.log(`\nSAF: "${saf}" -> Repeated ${list.length} times:`);
    for (const r of list) {
      console.log(`  - Ref: ${r.reference_number} | Name: ${r.first_name} ${r.last_name} | Phone: ${r.phone} | Aadhaar: ${r.aadhaar_number} | Submitted: ${r.created_at}`);
    }
  }
}

auditSaf();
