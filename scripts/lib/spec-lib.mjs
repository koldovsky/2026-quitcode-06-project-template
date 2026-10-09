// Спільні утиліти для scripts/check-*.mjs. Без залежностей: лише node:fs і node:path.
// Корінь проєкту — поточна тека (process.cwd()), тому тести запускають скрипти у fixture-теках.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// AC ID: AC-<AREA>-<NN>, AREA = 2–12 великих латинських літер, NN = рівно дві цифри.
export const AC_ID = "AC-[A-Z]{2,12}-\\d{2}";
export const AC_ID_AT_START = new RegExp(`^${AC_ID}(?![\\w-])`);
export const AC_ID_GLOBAL = new RegExp(`(?<![\\w-])${AC_ID}(?![\\w-])`, "g");

export const root = () => process.cwd();

export function rel(file) {
  return path.relative(root(), file).split(path.sep).join("/");
}

export function readText(file) {
  return readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

// Рекурсивний обхід теки. skip(relPath) → true пропускає файл або теку.
export function walk(dir, { skip = () => false, filter = () => true } = {}) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const r = rel(full);
    if (skip(r)) continue;
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, { skip, filter }));
    } else if (filter(r)) {
      out.push(full);
    }
  }
  return out.sort();
}

export const isMarkdown = (r) => r.endsWith(".md");
export const isArchive = (r) => /^openspec\/changes\/archive(\/|$)/.test(r);

// Сценарії (#### Scenario: …) у markdown-файлі.
// removed = true, якщо сценарій стоїть у секції «## REMOVED Requirements».
export function parseScenarios(file) {
  const lines = readText(file).split("\n");
  const result = [];
  let section = "";
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) return;
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) section = h2[1].trim();
    const scenario = line.match(/^(#{1,6})\s+Scenario:\s*(.*)$/);
    if (scenario) {
      result.push({
        file,
        line: i + 1,
        level: scenario[1].length,
        title: scenario[2].trim(),
        removed: /^REMOVED\s+Requirements/i.test(section),
      });
    }
  });
  return result;
}

export function acIdOf(title) {
  const m = title.match(AC_ID_AT_START);
  return m ? m[0] : null;
}

// AC зі специфікацій: лише з назв сценаріїв, без секцій REMOVED.
export function collectSpecAcs(dir = path.join(root(), "openspec", "specs")) {
  const acs = new Map(); // id → [{file, line}]
  for (const file of walk(dir, { filter: isMarkdown })) {
    for (const s of parseScenarios(file)) {
      if (s.removed || s.level !== 4) continue;
      const id = acIdOf(s.title);
      if (!id) continue;
      if (!acs.has(id)) acs.set(id, []);
      acs.get(id).push({ file: rel(file), line: s.line });
    }
  }
  return acs;
}

export function stripHtmlComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

// Рядки матриці docs/conformance.md: | AC-… | що перевіряє | код | тест | статус |
export function parseConformance(file = path.join(root(), "docs", "conformance.md")) {
  if (!existsSync(file)) return { exists: false, rows: [] };
  const rows = [];
  const lines = stripHtmlComments(readText(file)).split("\n");
  lines.forEach((line, i) => {
    if (!line.trim().startsWith("|")) return;
    const cells = line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
    const id = cells[0]?.replace(/`/g, "");
    if (!id || !new RegExp(`^${AC_ID}$`).test(id)) return;
    rows.push({ id, status: cells[cells.length - 1] ?? "", cells, line: i + 1 });
  });
  return { exists: true, rows };
}

// Назви тестів test()/it() з файлів коду. Пропущені (.skip/.todo/.fixme/.fails/.skipIf) не рахуються.
const TEST_CALL =
  /(?<![\w.$])(?:it|test)(?:\.(only|concurrent|sequential|skip|todo|fixme|fails|skipIf|runIf|describe|each|for|extend|step|beforeEach|afterEach|beforeAll|afterAll|use)\b(?:\([^)]*\))?)?\s*\(\s*(["'`])((?:\\.|(?!\2)[^\\])*)\2/g;
const COUNTED = new Set([undefined, "only", "concurrent", "sequential"]);

export function parseTestTitles(file) {
  const text = readText(file);
  const titles = [];
  for (const m of text.matchAll(TEST_CALL)) {
    const modifier = m[1];
    const line = text.slice(0, m.index).split("\n").length;
    titles.push({ title: m[3], counted: COUNTED.has(modifier), modifier, line });
  }
  return titles;
}

export const isCodeFile = (r) => /\.(?:[cm]?[jt]sx?)$/.test(r);
export const skipNonSource = (r) =>
  /(^|\/)(node_modules|\.next|\.git|coverage|dist|build)(\/|$)/.test(r) || /^tests\/fixtures(\/|$)/.test(r);

export function collectTestRefs(dirs = ["src", "tests"]) {
  const refs = new Map(); // id → [{file, line, title, counted}]
  for (const d of dirs) {
    for (const file of walk(path.join(root(), d), { skip: skipNonSource, filter: isCodeFile })) {
      for (const t of parseTestTitles(file)) {
        for (const id of t.title.match(AC_ID_GLOBAL) ?? []) {
          if (!refs.has(id)) refs.set(id, []);
          refs.get(id).push({ file: rel(file), line: t.line, title: t.title, counted: t.counted });
        }
      }
    }
  }
  return refs;
}

export function printList(label, items) {
  if (!items.length) return;
  console.log(`\n${label} (${items.length}):`);
  for (const item of items) console.log(`  - ${item}`);
}
