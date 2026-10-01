import xlsx from "xlsx";

function checkCrossOverlaps() {
  const files = [
    { name: "Malnad", path: "batch/Malnad batch wise list( 22-09-26).xlsx" },
    { name: "AVK", path: "batch/AVK- Batch list updated (22-09-26).xlsx" },
    { name: "Central", path: "batch/Central collegeBATCH WISE LIST ( 22-09-26).xlsx" }
  ];

  const studentToBatches = {};

  for (const f of files) {
    const wb = xlsx.readFile(f.path);
    for (const sheet of wb.SheetNames) {
      const rows = xlsx.utils.sheet_to_json(wb.Sheets[sheet], { defval: "" });
      for (const r of rows) {
        const batch = r["Batch ID"] || r["Batch"] || sheet;
        const ref = String(r["Reference ID"] || r["KSAW ID"] || r["Sl.no"] || "").trim().toUpperCase();
        const saf = String(r["SAF Number"] || "").trim().toUpperCase();
        const aadh = String(r["Aadhaar Number"] || "").replace(/\D/g, "");
        const key = saf || ref || aadh;

        if (key) {
          if (!studentToBatches[key]) {
            studentToBatches[key] = [];
          }
          studentToBatches[key].push({ file: f.name, sheet, batch, ref, saf, aadh });
        }
      }
    }
  }

  const duplicates = Object.entries(studentToBatches).filter(([k, list]) => list.length > 1);
  console.log(`Total unique applicants across all 3 files: ${Object.keys(studentToBatches).length}`);
  console.log(`Overlapping applicants found across multiple batches: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log("Duplicate details:", JSON.stringify(duplicates, null, 2));
  } else {
    console.log("PERFECT! 0 overlapping students across all batches and files.");
  }
}

checkCrossOverlaps();
