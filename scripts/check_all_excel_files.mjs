import xlsx from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folder = path.resolve(__dirname, "../approved to dept");
const files = fs.readdirSync(folder).filter(f => f.endsWith(".xlsx") || f.endsWith(".xls"));

for (const f of files) {
  try {
    const wb = xlsx.readFile(path.join(folder, f));
    console.log(`File: ${f} | Sheets:`, wb.SheetNames.map(s => `${s} (${xlsx.utils.sheet_to_json(wb.Sheets[s], { header: 1 }).length} rows)`).join(", "));
  } catch (err) {
    console.error(`Error reading ${f}:`, err.message);
  }
}
