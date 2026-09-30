import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const HIDDEN_APPLICANT_COLLEGES = [
  "Government College for Women (Autonomous), Mandya",
  "Government Womens college - Ramanagara",
  "GOVT. FIRST GRADE COLLEGE FOR WOMEN, NAUBAD BIDAR",
  "KSAWU - HKE Society's Smt Veeramma Gangasiri College for Women, PDA Engg College Road, Aiwan-E-Shahi Area, Kalaburgi",
  "KSAWU - Reshmi Educational & Charitable Trust's, Kum. Sharaneshwari Reshmi Women's B.Ed College, Kalaburgi",
  "KSAWU - S.J.M.V's Business Administration College for Women, J.C. Nagar, Hubli",
  "KSAWU - Smt. K.S. Jiglur Arts & Dr. (Smt.) S.M. Sheshgiri Commerce College for Women, Dharwad",
  "KSAWU - Sri Shivalingeshwar Degree College for Women, Haveri",
  "Royal Degree College, Mathikere, Bangalore",
  "Shanti Vardhak Education Society Akkaamahadevi Mahila Mahavidya Bidar, Udgir Road BIDAR",
  "Shridevi Degree College and P.G. Center Tumkur",
];

function isHidden(rawName) {
  if (!rawName) return false;
  const s = String(rawName).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return HIDDEN_APPLICANT_COLLEGES.some(h => {
    const hClean = h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    return s === hClean || s.includes(hClean) || hClean.includes(s);
  });
}

async function checkHiddenColleges() {
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, institution_name, status, category, gender")
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Total database registrations: ${allRows.length}`);

  const obcFemale = allRows.filter(r => {
    const cat = String(r.category || '').trim().toUpperCase();
    const gen = String(r.gender || '').trim().toLowerCase();
    return cat === 'OBC' && gen === 'female';
  });
  console.log(`Total OBC + Female registrations: ${obcFemale.length}`);

  const collegeCountsTotal = {};
  const collegeCountsObcFemale = {};

  for (const r of allRows) {
    const c = r.institution_name || "(Empty)";
    collegeCountsTotal[c] = (collegeCountsTotal[c] || 0) + 1;
  }

  for (const r of obcFemale) {
    const c = r.institution_name || "(Empty)";
    collegeCountsObcFemale[c] = (collegeCountsObcFemale[c] || 0) + 1;
  }

  console.log("\n=== HIDDEN / REMOVED COLLEGES AUDIT ===");

  let totalHiddenRecords = 0;
  let totalHiddenObcFemale = 0;

  for (const [col, count] of Object.entries(collegeCountsTotal)) {
    if (isHidden(col)) {
      const obcCount = collegeCountsObcFemale[col] || 0;
      totalHiddenRecords += count;
      totalHiddenObcFemale += obcCount;
      console.log(`- "${col}": ${count} total records (${obcCount} OBC Female)`);
    }
  }

  console.log(`\nTotal records in DB under removed colleges: ${totalHiddenRecords}`);
  console.log(`Total OBC Female records under removed colleges: ${totalHiddenObcFemale}`);
}

checkHiddenColleges();
