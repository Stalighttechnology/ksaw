import fs from "fs";

const text = fs.readFileSync("src/lib/useBatches.ts", "utf8");
const targetBatches = [
  "KSAWU/MYR/CPG/0926-69",
  "KSAWU/MYR/CPG/0926-70",
  "KSAWU/KLB/CPG/0926-82",
  "KSAWU/BGM/CPG/0926-83",
  "KSAWU/DWD/CPG/0926-87",
  "KSAWU/VJN/CPG/0926-94",
  "KSAWU/VJP/CPG/0926-25",
  "KSAWU/TMK/CPG/0926-100",
  "KSAWU/TMK/CPG/0926-101",
  "KSAWU/TMK/CPG/0926-102",
  "KSAWU/TMK/CPG/0926-103",
  "KSAWU/TMK/CPG/0926-104",
  "KSAWU/TMK/CPG/0926-105",
  "KSAWU/BKT/CPG/0926-78"
];

for (const b of targetBatches) {
  const regex = new RegExp(`id:\\s*"${b.replace(/\//g, "\\/")}"[\\s\\S]*?totalCount:\\s*(\\d+)`);
  const match = text.match(regex);
  if (match) {
    console.log(`[EXISTS in useBatches.ts] ${b} -> current count: ${match[1]}`);
  } else {
    console.log(`[NEW / NOT in useBatches.ts] ${b}`);
  }
}
