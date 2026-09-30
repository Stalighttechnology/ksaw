import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgtzcjsajncrvibtlhxv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx';
const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const targetRefs = [
  'KSAW 1422',
  'KSAW 1729',
  'KSAW 1640',
  'KSAW 1389',
  'KSAW 1885',
  'KSAW 2278',
  'KSAW 2090',
  'KSAW 1369',
  'KSAW 1720',
  'KSAW 487',
  'KSAW 1716',
  'KSAW 1233',
  'KSAW 2397',
  'KSAW 2255',
  'KSAW 2828',
  'KSAW 2941',
  'KSAW 2285',
];

async function updateRecords() {
  console.log('Authenticating with Supabase...');
  const authEmail = `updater_female_${Date.now()}@gleamator.com`;
  const authPass = 'AdminUpdate@2026!';
  const { data: authData, error: authErr } = await sb.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error('Authentication failed:', authErr);
    process.exit(1);
  }
  console.log('Session established.');

  console.log(`Starting update for ${targetRefs.length} records...`);

  for (const ref of targetRefs) {
    const { data, error } = await sb
      .from('registrations')
      .update({ gender: 'Female', category: 'OBC' })
      .ilike('reference_number', ref)
      .select('id, reference_number, first_name, last_name, gender, category, status');

    if (error) {
      console.error(`Error updating ${ref}:`, error.message);
    } else {
      console.log(`Updated ${ref}:`, data);
    }
  }

  // Verification step
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await sb
      .from('registrations')
      .select('id, reference_number, category, gender')
      .eq('status', 'Sent to Department')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  const obcFemale = allRows.filter(r => {
    const cat = String(r.category || '').trim().toUpperCase();
    const gen = String(r.gender || '').trim().toLowerCase();
    return cat === 'OBC' && gen === 'female';
  });

  console.log(`\n=== VERIFICATION RESULTS ===`);
  console.log(`Total "Sent to Department" records in DB: ${allRows.length}`);
  console.log(`Total Visible OBC + Female: ${obcFemale.length}`);
  console.log(`Remaining Excluded: ${allRows.length - obcFemale.length}`);
}

updateRecords();
