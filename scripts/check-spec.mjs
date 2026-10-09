#!/usr/bin/env node
// npm run spec:check — детерміновані перевірки специфікацій, яких не робить `openspec validate`:
//   1) кожен `#### Scenario:` в openspec/specs/** і openspec/changes/** (крім archive/)
//      починається з AC ID формату AC-<AREA>-<NN>;
//   2) сценарій з неправильним рівнем заголовка (### Scenario:) — помилка (OpenSpec його мовчки ігнорує);
//   3) AC ID унікальні в канонічних специфікаціях (openspec/specs/**);
//   4) жодне слово зі списку заборонених (product/denylist.txt + змінна середовища SPEC_DENYLIST)
//      не трапляється в product/ і openspec/ (без урахування регістру).
// Код виходу: 0 — усе гаразд, 1 — є помилки.
import { existsSync } from "node:fs";
import path from "node:path";
import {
  acIdOf,
  isArchive,
  isMarkdown,
  parseScenarios,
  printList,
  readText,
  rel,
  root,
  walk,
} from "./lib/spec-lib.mjs";

const errors = { title: [], level: [], duplicate: [], denylist: [] };
const specsDir = path.join(root(), "openspec", "specs");
const changesDir = path.join(root(), "openspec", "changes");

// 1–2. Назви й рівні сценаріїв.
const files = [
  ...walk(specsDir, { filter: isMarkdown }),
  ...walk(changesDir, { filter: isMarkdown, skip: isArchive }),
];
let scenarioCount = 0;
for (const file of files) {
  for (const s of parseScenarios(file)) {
    const where = `${rel(file)}:${s.line}`;
    if (s.level !== 4) {
      errors.level.push(`${where} — "${"#".repeat(s.level)} Scenario:" має бути "#### Scenario:"`);
      continue;
    }
    scenarioCount++;
    if (!acIdOf(s.title)) {
      errors.title.push(`${where} — "${s.title}" не починається з AC-<AREA>-<NN> (напр. AC-LEAVE-01: …)`);
    }
  }
}

// 3. Унікальність AC ID у канонічних специфікаціях.
const seen = new Map();
for (const file of walk(specsDir, { filter: isMarkdown })) {
  for (const s of parseScenarios(file)) {
    const id = s.level === 4 ? acIdOf(s.title) : null;
    if (!id) continue;
    const where = `${rel(file)}:${s.line}`;
    if (seen.has(id)) errors.duplicate.push(`${id} — ${where} (уже є в ${seen.get(id)})`);
    else seen.set(id, where);
  }
}

// 4. Denylist: файл product/denylist.txt (рядки, # — коментар) і секрет CI SPEC_DENYLIST
//    (через кому або з нового рядка). Справжні назви клієнтів у публічному репо тримайте в секреті,
//    а не у файлі: інакше сам файл стане витоком.
const denylistFile = path.join(root(), "product", "denylist.txt");
const words = []; // { word, fromEnv }
if (existsSync(denylistFile)) {
  for (const raw of readText(denylistFile).split("\n")) {
    const word = raw.trim();
    if (word && !word.startsWith("#")) words.push({ word, fromEnv: false });
  }
}
for (const raw of (process.env.SPEC_DENYLIST ?? "").split(/[\n,]/)) {
  if (raw.trim()) words.push({ word: raw.trim(), fromEnv: true });
}
if (words.length) {
  const escape = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = words.map(({ word, fromEnv }, i) => ({
    re: new RegExp(`(?<![\\p{L}\\p{N}])${escape(word)}(?![\\p{L}\\p{N}])`, "iu"),
    // Значення із SPEC_DENYLIST (секрет) не друкуємо — лише номер.
    label: fromEnv ? `слово #${i + 1} із SPEC_DENYLIST` : `"${word}"`,
  }));
  const scanned = [
    ...walk(path.join(root(), "product"), { skip: (r) => r === "product/denylist.txt" }),
    ...walk(path.join(root(), "openspec")),
  ];
  for (const file of scanned) {
    readText(file)
      .split("\n")
      .forEach((line, i) => {
        for (const p of patterns) {
          if (p.re.test(line)) errors.denylist.push(`${rel(file)}:${i + 1} — ${p.label}`);
        }
      });
  }
}

const total = Object.values(errors).reduce((n, list) => n + list.length, 0);
console.log(
  `spec:check — markdown-файлів: ${files.length}, сценаріїв: ${scenarioCount}, ` +
    `AC у канонічних специфікаціях: ${seen.size}, слів у denylist: ${words.length}`,
);
printList("BAD-TITLE: сценарій без AC ID на початку назви", errors.title);
printList("BAD-LEVEL: неправильний рівень заголовка сценарію", errors.level);
printList("DUPLICATE: AC ID повторюється в openspec/specs", errors.duplicate);
printList("DENYLIST: заборонене слово (анонімізація)", errors.denylist);
if (total) {
  console.log(`\nFAIL: помилок — ${total}.`);
  process.exit(1);
}
console.log("OK");
