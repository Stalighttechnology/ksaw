import { createClient } from '@supabase/supabase-js';

const sb = createClient('https://wgtzcjsajncrvibtlhxv.supabase.co', 'sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx');

async function runAudit() {
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await sb
      .from('registrations')
      .select('id, reference_number, first_name, last_name, category, gender, caste, caste_sub_category, nigama, institution_name, status, saf_number, created_at, admin_notes')
      .eq('status', 'Sent to Department')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Total "Sent to Department" records in DB: ${allRows.length}`);

  const obcFemale = allRows.filter(r => {
    const cat = String(r.category || '').trim().toUpperCase();
    const gen = String(r.gender || '').trim().toLowerCase();
    return cat === 'OBC' && gen === 'female';
  });

  const excluded = allRows.filter(r => {
    const cat = String(r.category || '').trim().toUpperCase();
    const gen = String(r.gender || '').trim().toLowerCase();
    return !(cat === 'OBC' && gen === 'female');
  });

  console.log(`OBC + Female (Visible): ${obcFemale.length}`);
  console.log(`Excluded records: ${excluded.length}`);

  console.log('\n--- BREAKDOWN OF EXCLUSIONS ---');
  const catBreakdown = {};
  const genderBreakdown = {};
  for (const r of excluded) {
    const cat = r.category || '(Empty)';
    const gen = r.gender || '(Empty)';
    catBreakdown[cat] = (catBreakdown[cat] || 0) + 1;
    genderBreakdown[gen] = (genderBreakdown[gen] || 0) + 1;
  }
  console.log('By Category:', catBreakdown);
  console.log('By Gender:', genderBreakdown);

  console.log('\n--- DETAILED EXCLUDED RECORDS ---');
  excluded.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.reference_number}] ${r.first_name || ''} ${r.last_name || ''} | Gender: "${r.gender}" | Category: "${r.category}" | Caste: "${r.caste || ''}" | Nigama: "${r.nigama || ''}" | College: "${r.institution_name || ''}" | SAF: "${r.saf_number || ''}" | Submitted: ${r.created_at}`);
  });
}

runAudit();
