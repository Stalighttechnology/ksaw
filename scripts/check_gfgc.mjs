import xlsx from "xlsx";

function checkGFGC() {
  const wb = xlsx.readFile("batch/GFGC Byrapur approval list ( 22-09-26).xlsx");
  console.log("GFGC sheets:", wb.SheetNames);
  for (const s of wb.SheetNames) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[s], { defval: "" });
    console.log(`Sheet "${s}" has ${rows.length} rows`);
  }
}
checkGFGC();
