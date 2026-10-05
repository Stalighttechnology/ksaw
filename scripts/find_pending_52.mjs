import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function find52() {
  const authEmail = `inspector_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  await supabase.auth.signUp({ email: authEmail, password: authPass });

  const filePath = path.resolve(__dirname, "../public/V-03.10.2026 Submission.xlsx");
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets["Master Sheet"];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const excelRows = [];
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.some((c) => c !== "")) continue;
    const rawAadhaar = row[14];
    const aadhaar = rawAadhaar ? String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
    const firstName = String(row[5] || "").trim();
    const lastName = String(row[6] || "").trim();
    excelRows.push({
      excelRowNumber: r + 1,
      slNo: row[0],
      saf: String(row[1] || ""),
      college: String(row[3] || ""),
      name: `${firstName} ${lastName}`.trim(),
      aadhaar,
    });
  }

  const aadhaars = excelRows.map((r) => r.aadhaar);
  let dbRecords = [];
  for (let i = 0; i < aadhaars.length; i += 100) {
    const chunk = aadhaars.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("*")
      .in("aadhaar_number", chunk);
    if (res) dbRecords.push(...res);
  }

  const dbMap = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  // Let's check which records had 'Pending Document' vs 'Approved'
  // In the registration table, let's see which colleges or criteria mapped to the 52 records
  // Let's inspect properties of all 232 records
  const allMapped = excelRows.map((ex) => {
    const db = dbMap.get(ex.aadhaar);
    return {
      excelRowNumber: ex.excelRowNumber,
      slNo: ex.slNo,
      referenceNumber: db ? db.reference_number : "N/A",
      safNumber: (db && db.saf_number) ? db.saf_number : ex.saf,
      name: ex.name,
      aadhaar: ex.aadhaar,
      college: ex.college,
      dbCollege: db ? db.institution_name : "N/A",
      safIsNull: !db?.saf_number,
      casteProof: !!db?.caste_proof,
      aadhaarProof: !!db?.aadhaar_proof,
      eduProof: !!db?.proof_of_education,
      ageProof: !!db?.proof_of_age,
    };
  });

  console.log("Total mapped:", allMapped.length);
  
  // Let's check college breakdown:
  const colCount = {};
  allMapped.forEach(m => colCount[m.college] = (colCount[m.college] || 0) + 1);
  console.log("College counts in Excel:", colCount);

  // Print the first 20 records and also the full table
  console.log("\n--- Full List of all records (sample 10) ---");
  console.table(allMapped.slice(0, 10));

  // Let's write out a JSON of all 232 with their Excel row numbers and KSAW numbers
  const out = allMapped.map(m => ({
    excelRowNumber: m.excelRowNumber,
    slNo: m.slNo,
    referenceNumber: m.referenceNumber,
    safNumber: m.safNumber,
    name: m.name,
    aadhaar: m.aadhaar,
    college: m.college,
  }));

  console.log("\nKukke Subramanya records (count:", allMapped.filter(m => m.college.includes("Kukke")).length, "):");
  console.table(allMapped.filter(m => m.college.includes("Kukke")).slice(0, 5));

  console.log("\nMalnad records (count:", allMapped.filter(m => m.college.includes("MALNAD")).length, "):");
  console.table(allMapped.filter(m => m.college.includes("MALNAD")).slice(0, 5));

  console.log("\nGovernment Polytechnic Ramanagar (count:", allMapped.filter(m => m.college.includes("Polytechnic")).length, "):");
  console.table(allMapped.filter(m => m.college.includes("Polytechnic")).slice(0, 5));
}

find52().catch(console.error);
