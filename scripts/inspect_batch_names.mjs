import xlsx from "xlsx";

function checkBatchIds(filePath) {
  console.log(`\n=== Batch IDs in ${filePath} ===`);
  const wb = xlsx.readFile(filePath);
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
    const batchValues = new Set(rows.map(r => r["Batch ID"] || r["Batch"] || "").filter(Boolean));
    console.log(`Sheet "${sheetName}" (${rows.length} rows): Batch IDs found ->`, Array.from(batchValues));
  }
}

checkBatchIds("batch/AVK- Batch list updated (22-09-26).xlsx");
checkBatchIds("batch/Central collegeBATCH WISE LIST ( 22-09-26).xlsx");
