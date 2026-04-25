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

function itemId(bodySystem, bodySub, tag) {
  return `itm_${h16(["h2t", "item", bodySystem, bodySub, tag])}`;
}

function choiceId(itemId_, label, idx) {
  return `ch_${h16(["h2t", "choice", itemId_, label, String(idx)])}`;
}

/** Matches workbook lines that carry the narrative after `WDL=` (same idea as flowsheet.ts). */
const WDL_EQUALS_PREFIX = /^\s*WDL\s*=\s*/i;

/**
 * @param {string[]} labels
 * @returns {{ wdl: string[], exc: string[] }}
 */
function partitionWdlChoices(labels) {
  const wdl = [];
  const exc = [];
  for (const label of labels) {
    if (WDL_EQUALS_PREFIX.test(label)) {
      wdl.push(label);
    } else {
      exc.push(label);
    }
  }
  return { wdl, exc };
}

/**
 * @param {string} label
 */
function narrativeAfterWdlEquals(label) {
  const t = label.trim();
  const match = t.match(WDL_EQUALS_PREFIX);
  if (match && match.index !== undefined) {
    return t.slice(match.index + match[0].length).trim();
  }
  return t;
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

/** @type {Map<string, { L: string[]; primaryConceptRow: string; head: string }>} */
const wdlClusterByPair = new Map();
for (const pair of pairs) {
  const [bodySystem, bodySub] = pair.split("\u0000");
  const L = [];
  for (const k of sortedKeys) {
    const p = k.split("\u0000");
    if (p[0] !== bodySystem || p[1] !== bodySub) {
      continue;
    }
    const { choices } = byConcept.get(k);
    const { wdl, exc } = partitionWdlChoices(choices);
    if (wdl.length === 1 && exc.length >= 1) {
      L.push(k);
    }
  }
  if (L.length === 0) {
    continue;
  }
  L.sort((a, b) => byConcept.get(a).order - byConcept.get(b).order);
  const preferredKey = `${bodySystem}\u0000${bodySub}\u0000${bodySub} WDL`;
  /** WDL+exception row: stem after stripping ` WDL` matches subsection. */
  const primaryWdlSubsectionInL = L.find((k) => {
    const cr = k.split("\u0000")[2];
    return cr.endsWith(" WDL") && cr.replace(/ WDL$/, "") === bodySub;
  });
  const primaryConceptRow = byConcept.has(preferredKey)
    ? `${bodySub} WDL`
    : primaryWdlSubsectionInL
      ? primaryWdlSubsectionInL.split("\u0000")[2]
      : L[0].split("\u0000")[2];
  const head =
    L.find((k) => k.split("\u0000")[2] === primaryConceptRow) ??
    sortedKeys.find((sk) => L.includes(sk)) ??
    L[0];
  wdlClusterByPair.set(pair, { L, primaryConceptRow, head });
}

/** Subsection-level `Sub WDL` workbook rows (strip === bodySub): narrative for rollup WDL panel. */
/** @type {Map<string, string>} */
const aggregateWdlNarrativeByPair = new Map();
for (const key of sortedKeys) {
  const [bodySystem, bodySub, conceptRow] = key.split("\u0000");
  if (!conceptRow.endsWith(" WDL")) {
    continue;
  }
  if (conceptRow.replace(/ WDL$/, "") !== bodySub) {
    continue;
  }
  const { choices } = byConcept.get(key);
  const parts = choices.map((c) => String(c).trim()).filter(Boolean);
  if (parts.length === 0) {
    continue;
  }
  aggregateWdlNarrativeByPair.set(
    `${bodySystem}\u0000${bodySub}`,
    parts.join("\n\n"),
  );
}

/** @type {Set<string>} */
const keyEmitted = new Set();

/** @type {Array<Record<string, unknown>>} */
const items = [];

/**
 * WDL/exception cluster for one (body system, sub-system): one section gate + multiChoice per
 * wdl+exception concept (row may or may not end with " WDL").
 * @param {string} primaryConceptRow
 * @param {string[]} wdlLKeys  ordered keys, each `body\0sub\0concept` with wdl+exc partition
 */
function pushWdlCluster(bodySystem, bodySub, primaryConceptRow, wdlLKeys) {
  const gid = grpChild(bodySystem, bodySub);
  const kPreferred = `${bodySystem}\u0000${bodySub}\u0000${primaryConceptRow}`;
  const primaryKey =
    wdlLKeys.find((k) => k.split("\u0000")[2] === primaryConceptRow) ??
    (byConcept.has(kPreferred) ? kPreferred : wdlLKeys[0]);
  const rawChoices = byConcept.get(primaryKey).choices;
  const { wdl } = partitionWdlChoices(rawChoices);
  const firstPlain = String(rawChoices[0] ?? "").trim();
  const primaryWdlLabel = wdl[0] ?? (firstPlain ? `WDL= ${firstPlain}` : "");
  const cr = primaryKey.split("\u0000")[2];
  const gateId = itemId(
    bodySystem,
    bodySub,
    `${cr}\0section_rollup`,
  );

  const gate = {
    id: gateId,
    groupId: gid,
    prompt: cr.endsWith(" WDL") ? cr : `${cr} WDL`,
    responseType: "choice",
    x_flowsheetSectionRollup: true,
    definedLimits: { type: "none" },
    choices: [
      {
        id: choiceId(gateId, primaryWdlLabel, 0),
        label: primaryWdlLabel,
      },
    ],
  };
  const pairKey = `${bodySystem}\u0000${bodySub}`;
  const aggregateNarrative = aggregateWdlNarrativeByPair.get(pairKey);
  if (aggregateNarrative) {
    gate.x_flowsheetSectionAggregateWdlDefinition = aggregateNarrative;
  }
  items.push(gate);

  for (const k of wdlLKeys) {
    const conceptRow = k.split("\u0000")[2];
    if (
      conceptRow.endsWith(" WDL") &&
      conceptRow.replace(/ WDL$/, "") === bodySub
    ) {
      keyEmitted.add(k);
      continue;
    }
    const { choices: rawChoices } = byConcept.get(k);
    const { wdl, exc } = partitionWdlChoices(rawChoices);
    if (wdl.length < 1) {
      throw new Error(`Expected WDL= row for key ${k}`);
    }
    const wdlNarrative = narrativeAfterWdlEquals(wdl[0]);
    const mid = itemId(bodySystem, bodySub, `${conceptRow}\0exc_multi`);
    const choiceObjs = exc.map((label, idx) => ({
      id: choiceId(mid, label, idx),
      label,
    }));
    const prompt = conceptRow.replace(/ WDL$/, "");
    items.push({
      id: mid,
      groupId: gid,
      prompt,
      responseType: "multiChoice",
      definedLimits: { type: "none" },
      choices: choiceObjs,
      x_wdlListDefinition: wdlNarrative,
    });
    keyEmitted.add(k);
  }
}

for (const key of sortedKeys) {
  if (keyEmitted.has(key)) {
    continue;
  }
  const [bodySystem, bodySub, conceptRow] = key.split("\u0000");
  const pair = `${bodySystem}\u0000${bodySub}`;
  const cl = wdlClusterByPair.get(pair);
  if (cl && cl.L.includes(key) && key !== cl.head) {
    continue;
  }
  if (cl && key === cl.head) {
    const [bs, su] = pair.split("\u0000");
    pushWdlCluster(bs, su, cl.primaryConceptRow, cl.L);
    continue;
  }

  const { choices } = byConcept.get(key);
  if (choices.length === 0) {
    continue;
  }
  const { wdl, exc } = partitionWdlChoices(choices);
  if (wdl.length === 1 && exc.length >= 1) {
    pushWdlCluster(bodySystem, bodySub, conceptRow, [key]);
    continue;
  }
  if (conceptRow.endsWith(" WDL")) {
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
  keyEmitted.add(key);
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
  x_presentation: { layout: "flowsheet" },
  x_licenseNotice: LICENSE_NOTICE,
  provenance: {
    authoredBy: { actorType: "repository", actorId: "h2t_workbook" },
  },
  x_extensions: {},
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
console.log(`Wrote ${items.length} items, ${groups.length} groups -> ${outPath}`);
