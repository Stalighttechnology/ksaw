import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function runUpdate() {
  console.log("=========================================================================");
  console.log("=== Updating 4 Lingayath WhatsApp Sheets to 'Approved by Dept' in DB ===");
  console.log("=========================================================================\n");

  // 1. Authenticate with an admin session
  const authEmail = `updater_ling_${Date.now()}@gleamator.com`;
  const authPass = "AdminUpdate@2026!";
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: authEmail,
    password: authPass,
  });

  if (authErr || !authData.session) {
    console.error("Authentication failed:", authErr);
    process.exit(1);
  }
  console.log("Supabase authentication session established successfully.");

  // 2. Read all 4 Excel files
  const folder = path.resolve(__dirname, "../WhatsApp Unknown 2026-10-06 at 5.53.52 PM");
  const files = fs.readdirSync(folder).filter((f) => f.endsWith(".xlsx")).sort();

  const fileStats = [];
  const allExcelRecords = [];

  for (const file of files) {
    const filePath = path.join(folder, file);
    const wb = xlsx.readFile(filePath);
    let countInFile = 0;

    for (const sname of wb.SheetNames) {
      const sheet = wb.Sheets[sname];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });

      let headerRowIdx = -1;
      for (let r = 0; r < Math.min(5, data.length); r++) {
        if (data[r].some((cell) => String(cell).toLowerCase().includes("saf") || String(cell).toLowerCase().includes("name") || String(cell).toLowerCase().includes("aadhaar"))) {
          headerRowIdx = r;
          break;
        }
      }
      if (headerRowIdx === -1) continue;

      const headers = data[headerRowIdx].map((h) => String(h).trim());
      const safIdx = headers.findIndex((h) => /saf/i.test(h));
      const aadharIdx = headers.findIndex((h) => /aadhaar|aadhar|uid/i.test(h));
      const nameIdx = headers.findIndex((h) => /first\s*name|applicant\s*name|name/i.test(h));
      const lastNameIdx = headers.findIndex((h) => /last\s*name/i.test(h));
      const rdIdx = headers.findIndex((h) => /rd\s*number/i.test(h));

      for (let r = headerRowIdx + 1; r < data.length; r++) {
        const row = data[r];
        if (!row || !row.some((c) => c !== "")) continue;

        const saf = safIdx !== -1 && row[safIdx] ? String(row[safIdx]).trim().replace(/\.$/, "") : "";
        const aadhar = aadharIdx !== -1 && row[aadharIdx] ? String(row[aadharIdx]).trim().replace(/\s+/g, "").replace(/-/g, "") : "";
        const firstName = nameIdx !== -1 ? String(row[nameIdx]).trim() : "";
        const lastName = lastNameIdx !== -1 ? String(row[lastNameIdx]).trim() : "";
        const rd = rdIdx !== -1 ? String(row[rdIdx]).trim() : "";

        countInFile++;
        allExcelRecords.push({
          file,
          sheet: sname,
          saf,
          aadhar,
          name: `${firstName} ${lastName}`.trim(),
          rd,
        });
      }
    }
    fileStats.push({ file, records: countInFile });
  }

  console.log(`\nProcessed 4 files with a total of ${allExcelRecords.length} records.`);

  // 3. Query DB matching IDs
  const aadhaars = [...new Set(allExcelRecords.map((r) => r.aadhar).filter(Boolean))];
  const safs = [...new Set(allExcelRecords.map((r) => r.saf).filter(Boolean))];

  console.log(`Querying DB for ${aadhaars.length} unique Aadhaars and ${safs.length} unique SAFs...`);

  let dbByAadhaar = [];
  for (let i = 0; i < aadhaars.length; i += 100) {
    const chunk = aadhaars.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("aadhaar_number", chunk);
    if (error) {
      console.error("Error query by Aadhaar:", error);
      process.exit(1);
    }
    if (res) dbByAadhaar.push(...res);
  }

  let dbBySaf = [];
  for (let i = 0; i < safs.length; i += 100) {
    const chunk = safs.slice(i, i + 100);
    const { data: res, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes")
      .in("saf_number", chunk);
    if (error) {
      console.error("Error query by SAF:", error);
      process.exit(1);
    }
    if (res) dbBySaf.push(...res);
  }

  const dbMapById = new Map();
  dbByAadhaar.forEach((r) => dbMapById.set(r.id, r));
  dbBySaf.forEach((r) => dbMapById.set(r.id, r));

  const targetDbRecords = Array.from(dbMapById.values());
  console.log(`Found ${targetDbRecords.length} unique student records in Supabase 'registrations' table.`);

  const currentStatusCounts = {};
  for (const d of targetDbRecords) {
    currentStatusCounts[d.status] = (currentStatusCounts[d.status] || 0) + 1;
  }
  console.log("Current DB status distribution before update:", currentStatusCounts);

  // 4. Batch update target records to "Approved by Dept"
  console.log("\nStarting update to status: 'Approved by Dept'...");
  let updatedCount = 0;
  const errors = [];
  const now = new Date().toISOString();

  for (let i = 0; i < targetDbRecords.length; i++) {
    const rec = targetDbRecords[i];
    const { data: updateRes, error: updateErr } = await supabase
      .from("registrations")
      .update({
        status: "Approved by Dept",
        admin_notes: "Approved by Dept",
        updated_at: now,
      })
      .eq("id", rec.id)
      .select("id, reference_number, saf_number, aadhaar_number, status, admin_notes");

    if (updateErr) {
      console.error(`Error updating record ${rec.reference_number}:`, updateErr.message);
      errors.push({ id: rec.id, ref: rec.reference_number, error: updateErr.message });
    } else if (updateRes && updateRes.length > 0) {
      updatedCount++;
      if (updatedCount % 50 === 0 || updatedCount === targetDbRecords.length) {
        console.log(`Progress: [${updatedCount}/${targetDbRecords.length}] records updated.`);
      }
    } else {
      errors.push({ id: rec.id, ref: rec.reference_number, error: "No rows updated" });
    }
  }

  console.log("\n================ EXECUTION SUMMARY ================");
  console.log(`Total Excel Rows in 4 files: ${allExcelRecords.length}`);
  console.log(`Total Unique DB Target Records: ${targetDbRecords.length}`);
  console.log(`Successfully Updated to 'Approved by Dept': ${updatedCount}`);
  console.log(`Errors encountered: ${errors.length}`);
  console.log("====================================================\n");

  // 5. Verification: re-query all records
  console.log("Verifying live database status...");
  const targetIds = targetDbRecords.map((r) => r.id);
  let liveRecords = [];
  for (let i = 0; i < targetIds.length; i += 100) {
    const chunk = targetIds.slice(i, i + 100);
    const { data: res } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, status, admin_notes, updated_at")
      .in("id", chunk);
    if (res) liveRecords.push(...res);
  }

  const liveCounts = {};
  for (const r of liveRecords) {
    liveCounts[r.status] = (liveCounts[r.status] || 0) + 1;
  }
  console.log("Live Database Status Breakdown:", liveCounts);

  // Print sample 5 records
  console.log("\nSample 5 Updated Records:");
  console.table(
    liveRecords.slice(0, 5).map((r) => ({
      Reference: r.reference_number,
      SAF: r.saf_number || "N/A",
      Aadhaar: r.aadhaar_number,
      Name: `${r.first_name} ${r.last_name || ""}`.trim(),
      Status: r.status,
      AdminNotes: r.admin_notes,
    }))
  );
}

runUpdate().catch(console.error);
