#!/usr/bin/env node
// npm run spec:source — у ФОРКУ розробника перевіряє, що product/ і openspec/specs/ збігаються
// з тегом специфікації в upstream PM, записаним у .spec-source:
//
//   upstream: <owner>/<repo>      # репозиторій PM (публічний)
//   version: spec-v0.1            # тег релізу специфікації
//
// Кроки: git fetch https://github.com/<owner>/<repo>.git refs/tags/<version> →
//        git diff --quiet <version> -- product openspec/specs
// У самому upstream (немає .spec-source, усі рядки закоментовані або upstream == цей репозиторій)
// перевірку пропускаємо з повідомленням. SPEC_SOURCE_REQUIRED=1 (CI у форку) робить відсутній
// .spec-source помилкою. SPEC_SOURCE_URL перевизначає адресу (тести, дзеркала).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { readText, root } from "./lib/spec-lib.mjs";

const PATHS = ["product", "openspec/specs"];

function git(args, opts = {}) {
  return execFileSync("git", args, { cwd: root(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
}

function skip(reason, { requiredInFork = false } = {}) {
  if (requiredInFork && process.env.SPEC_SOURCE_REQUIRED === "1") {
    fail(`${reason} У форку .spec-source обов'язковий: upstream і тег версії специфікації.`);
  }
  console.log(`spec:source — SKIP: ${reason}`);
  process.exit(0);
}

function fail(message) {
  console.log(`spec:source — FAIL: ${message}`);
  process.exit(1);
}

function parseSpecSource(file) {
  const values = {};
  for (const raw of readText(file).split("\n")) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([a-z_]+)\s*:\s*["']?([^"']*)["']?$/i);
    if (m) values[m[1]] = m[2].trim();
  }
  return values;
}

function ownRepo() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  try {
    const url = git(["remote", "get-url", "origin"]).trim();
    const m = url.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?\/?$/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

const file = path.join(root(), ".spec-source");
if (!existsSync(file)) skip("файлу .spec-source немає — це upstream PM (або форк ще не налаштовано).", { requiredInFork: true });

const { upstream, version } = parseSpecSource(file);
if (!upstream && !version) skip(".spec-source порожній або закоментований — це upstream PM.", { requiredInFork: true });
if (!upstream || !/^[\w.-]+\/[\w.-]+$/.test(upstream)) fail(`у .spec-source потрібен рядок "upstream: <owner>/<repo>", а є "${upstream ?? ""}".`);
if (!version || !/^spec-v\d+\.\d+$/.test(version)) fail(`у .spec-source потрібен рядок "version: spec-vX.Y", а є "${version ?? ""}".`);

const own = ownRepo();
if (own && own.toLowerCase() === upstream.toLowerCase()) skip(`це сам upstream (${own}).`);

const url = process.env.SPEC_SOURCE_URL || `https://github.com/${upstream}.git`;
try {
  git(["fetch", "--quiet", "--no-tags", "--force", url, `refs/tags/${version}:refs/tags/${version}`]);
} catch (e) {
  fail(`не вдалося отримати тег ${version} з ${url}. Чи опубліковано тег і чи репозиторій публічний?\n${e.stderr ?? e.message}`);
}

try {
  git(["diff", "--quiet", version, "--", ...PATHS]);
} catch (e) {
  if (e.status === 1) {
    const stat = git(["diff", "--stat", version, "--", ...PATHS]);
    fail(
      `${PATHS.join(" і ")} відрізняються від ${upstream}@${version}:\n${stat}\n` +
        `Специфікацію змінює лише PM в upstream. Синхронізація: гілка sync/${version} + git merge ${version}.`,
    );
  }
  fail(`git diff завершився з помилкою: ${e.stderr ?? e.message}`);
}

console.log(`spec:source — OK: ${PATHS.join(" і ")} збігаються з ${upstream}@${version}.`);
