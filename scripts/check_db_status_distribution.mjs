import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgtzcjsajncrvibtlhxv.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkStatusValues() {
  let all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('registrations')
      .select('status, admin_notes')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) {
      console.error(error);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    page++;
  }
  
  const statusCounts = {};
  const notesCounts = {};
  const comboCounts = {};

  all.forEach(r => {
    const s = r.status || 'NULL';
    const n = r.admin_notes || 'NULL';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
    notesCounts[n] = (notesCounts[n] || 0) + 1;
    const c = `status: [${s}] | notes: [${n}]`;
    comboCounts[c] = (comboCounts[c] || 0) + 1;
  });

  console.log('=== STATUS COUNTS IN DB ===');
  console.log(statusCounts);
  console.log('\n=== ADMIN NOTES COUNTS IN DB ===');
  console.log(notesCounts);
  console.log('\n=== COMBINATIONS IN DB ===');
  console.log(comboCounts);
}
checkStatusValues();
