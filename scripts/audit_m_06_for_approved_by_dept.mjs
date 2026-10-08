import { createClient } from "@supabase/supabase-js";
import xlsx from "xlsx";
import fs from "fs";

const SUPABASE_URL = "https://wgtzcjsajncrvibtlhxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ipyAcrU1KLwKoS20uWRBdA_iMVuIWtx";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const filePath = "c:/Users/raghu/Desktop/ksaw/approved to dept/M-06.10.2026.xlsx";

async function auditM06ForApprovedByDept() {
  const wb = xlsx.readFile(filePath);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

  const aadhaarList = rows.map((r) => {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
    return String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "");
  }).filter(Boolean);

  let dbRecords = [];
  for (let i = 0; i < aadhaarList.length; i += 50) {
    const chunk = aadhaarList.slice(i, i + 50);
    const { data, error } = await supabase
      .from("registrations")
      .select("id, reference_number, saf_number, aadhaar_number, first_name, last_name, dob, gender, caste, nigama, rd_number, center_location, skill_sought, status, admin_notes, institution_name, phone, email")
      .in("aadhaar_number", chunk);
    if (error) {
      console.error(error);
      return;
    }
    if (data) dbRecords.push(...data);
  }

  const dbByAadhaar = new Map(dbRecords.map((r) => [r.aadhaar_number, r]));

  const statusBreakdown = {};
  const reportRows = [];

  rows.forEach((r, idx) => {
    const rawAadhaar = r["Aadhaar Number"] || r["Aadhaar"] || r["Aadhar Number"] || r["aadhaar"] || "";
    const aadhaar = String(rawAadhaar).trim().replace(/\s+/g, "").replace(/-/g, "");
    const db = dbByAadhaar.get(aadhaar);
    const status = db ? db.status : "NOT_FOUND";
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;

    reportRows.push({
      sl: r["SL No"] || idx + 1,
      excelName: `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim(),
      dbName: db ? `${db.first_name || ""} ${db.last_name || ""}`.trim() : "N/A",
      aadhaar,
      ksawRef: db ? (db.reference_number || "N/A") : "N/A",
      saf: db ? (db.saf_number || "N/A") : "N/A",
      center: r["Center Location"] || (db ? db.center_location : "N/A"),
      caste: r["Caste"] || (db ? db.caste : "N/A"),
      rdNumber: r["RD Number"] || (db ? db.rd_number : "N/A"),
      skill: r["Skill Sought / Course"] || (db ? db.skill_sought : "N/A"),
      currentStatus: status,
      adminNotes: db ? (db.admin_notes || "N/A") : "N/A",
    });
  });

  console.log("Total Rows in Excel:", rows.length);
  console.log("Matched in DB:", dbRecords.length);
  console.log("Current DB Status Breakdown:", statusBreakdown);
  fs.writeFileSync("scripts/m_06_10_2026_audit_details.json", JSON.stringify(reportRows, null, 2));
}

auditM06ForApprovedByDept();
