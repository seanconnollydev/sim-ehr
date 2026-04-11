/**
 * Reads the H2T workbook `data` sheet and emits lib/assessments/h2t-head-to-toe.generated.json
 * Run: node scripts/build-h2t-assessment.mjs
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const xlsxPath = join(
  repoRoot,
  "docs/H2T_Assessment_Workbook_5_14_2025 (2).xlsx",
);
const outDir = join(repoRoot, "lib/assessments");
const outPath = join(outDir, "h2t-head-to-toe.generated.json");

const TEMPLATE_ID = "h2t_head_to_toe_v1";
const SCHEMA_VERSION = "assessmentTemplate@0.2";

function h16(parts) {
  return createHash("sha256").update(parts.join("\u0001")).digest("hex").slice(0, 16);
}

function grpRoot(bodySystem) {
  return `grp_${h16(["h2t", "root", bodySystem])}`;
}

function grpChild(bodySystem, bodySub) {
  return `grp_${h16(["h2t", "child", bodySystem, bodySub])}`;
}

function itemId(bodySystem, bodySub, conceptRow) {
  return `itm_${h16(["h2t", "item", bodySystem, bodySub, conceptRow])}`;
}

function choiceId(itemId_, label, idx) {
  return `ch_${h16(["h2t", "choice", itemId_, label, String(idx)])}`;
}

const LICENSE_NOTICE =
  "This document created by NKBDS H2T Task Force is licensed under the Creative Commons Attribution Non-Commercial Share Alike 4.0 International License in January, 2020. To view a summary of the license, go to https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode";

const wb = XLSX.readFile(xlsxPath);
const sheetName = wb.SheetNames.includes("data") ? "data" : wb.SheetNames[2];
const ws = wb.Sheets[sheetName];
if (!ws) {
  throw new Error(`No sheet found (tried "data" and index): ${wb.SheetNames.join(", ")}`);
}

const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
if (matrix.length < 2) {
  throw new Error("Sheet has no data rows");
}

/** @type {Map<string, { choices: string[], order: number }>} */
const byConcept = new Map();
let orderSeq = 0;

for (let i = 1; i < matrix.length; i++) {
  const row = matrix[i];
  if (!Array.isArray(row)) {
    continue;
  }
  const bodySystem = String(row[0] ?? "").trim();
  const bodySub = String(row[1] ?? "").trim();
  const conceptRow = String(row[2] ?? "").trim();
  const listChoice = String(row[3] ?? "").trim();

  if (!bodySystem || !conceptRow) {
    continue;
  }
  const sub = bodySub || bodySystem;
  const key = `${bodySystem}\u0000${sub}\u0000${conceptRow}`;
  if (!byConcept.has(key)) {
    byConcept.set(key, { choices: [], order: orderSeq++ });
  }
  const entry = byConcept.get(key);
  if (listChoice && !entry.choices.includes(listChoice)) {
    entry.choices.push(listChoice);
  }
}

const sortedKeys = [...byConcept.keys()].sort(
  (a, b) => byConcept.get(a).order - byConcept.get(b).order,
);

/** @type {Set<string>} */
const systems = new Set();
/** @type {Set<string>} */
const pairs = new Set();

for (const key of sortedKeys) {
  const [bodySystem, sub] = key.split("\u0000");
  systems.add(bodySystem);
  pairs.add(`${bodySystem}\u0000${sub}`);
}

/** @type {Array<{ id: string; label: string; parentGroupId: string | null }>} */
const groups = [];

for (const sys of [...systems].sort()) {
  groups.push({
    id: grpRoot(sys),
    label: sys,
    parentGroupId: null,
  });
}

for (const pair of [...pairs].sort()) {
  const [bodySystem, bodySub] = pair.split("\u0000");
  groups.push({
    id: grpChild(bodySystem, bodySub),
    label: bodySub,
    parentGroupId: grpRoot(bodySystem),
  });
}

/** @type {Array<Record<string, unknown>>} */
const items = [];

for (const key of sortedKeys) {
  const [bodySystem, bodySub, conceptRow] = key.split("\u0000");
  const { choices } = byConcept.get(key);
  if (choices.length === 0) {
    continue;
  }
  const iid = itemId(bodySystem, bodySub, conceptRow);
  const choiceObjs = choices.map((label, idx) => ({
    id: choiceId(iid, label, idx),
    label,
  }));
  items.push({
    id: iid,
    groupId: grpChild(bodySystem, bodySub),
    prompt: conceptRow,
    responseType: "choice",
    definedLimits: { type: "none" },
    choices: choiceObjs,
  });
}

const now = new Date().toISOString();

const doc = {
  schemaVersion: SCHEMA_VERSION,
  id: TEMPLATE_ID,
  title: "Head-to-Toe Assessment (H2T)",
  description:
    "NKBDS H2T head-to-toe assessment workbook — grouped by body system and sub-system.",
  createdAt: now,
  updatedAt: now,
  status: "published",
  groups,
  items,
  x_presentation: { layout: "worksheet" },
  x_licenseNotice: LICENSE_NOTICE,
  provenance: {
    authoredBy: { actorType: "repository", actorId: "h2t_workbook" },
  },
  x_extensions: {},
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
console.log(`Wrote ${items.length} items, ${groups.length} groups -> ${outPath}`);
