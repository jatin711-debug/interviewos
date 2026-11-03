// Grades every challenge in browser Python (Pyodide), which is what the static site uses.
// The reference solution must pass every check; challenges that need threads or processes
// (see needsLocalPython) are expected to be impossible here and are graded locally instead.
//
//   node scripts/verify-browser-grading.mjs --pyodide <dir containing node_modules/pyodide> [id ...]
//
// Install Pyodide outside the repo first, e.g. `npm install --prefix C:/Windows/Temp/ds-pyodide pyodide@314.0.4`
// (keep the version in step with public/python-worker.mjs).
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildChallengeScript, needsLocalPython, readChallengeReport } from "../lib/python-challenge.ts";
import { buildSqlChallengeScript } from "../lib/sql-challenge.ts";
import { SQL_CHALLENGES } from "../data/sql-challenges.ts";

process.emitWarning = () => {};
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const at = argv.indexOf("--pyodide");
if (at < 0 || !argv[at + 1]) { console.error("Pass --pyodide <dir containing node_modules/pyodide>."); process.exit(2); }
const pyodideDir = path.resolve(argv[at + 1]);
const only = new Set(argv.filter((_, index) => index !== at && index !== at + 1));

async function pythonCourseChallenges() {
  const found = [];
  const directory = path.join(ROOT, "data", "python-challenges");
  for (const file of (await readdir(directory)).filter(name => name.endsWith(".ts")).sort()) {
    const exports = await import(pathToFileURL(path.join(directory, file)).href);
    for (const record of Object.values(exports)) {
      if (record && typeof record === "object") for (const [id, challenge] of Object.entries(record)) found.push({ id: `python/${id}`, challenge });
    }
  }
  const { PYTHON_EXPANSIONS } = await import(pathToFileURL(path.join(ROOT, "data", "python-course-expanded.ts")).href);
  for (const { lesson } of PYTHON_EXPANSIONS) found.push({ id: `python/${lesson.id}`, challenge: lesson.challenge });
  return found;
}

// The course module files only use type imports, so they can be evaluated without a bundler.
async function dsCourseChallenges() {
  const found = [];
  const directory = path.join(ROOT, "data", "ds-course");
  for (const file of (await readdir(directory)).filter(name => name.endsWith(".ts") && !["types.ts", "index.ts"].includes(name)).sort()) {
    let source = await readFile(path.join(directory, file), "utf8");
    if (/^import (?!type)/m.test(source)) continue;
    source = source.replace(/^import type[^;]*;/gm, "");
    const names = [...source.matchAll(/^export const (\w+)/gm)].map(match => match[1]);
    if (!names.length) continue;
    const context = vm.createContext({});
    vm.runInContext(`${stripTypeScriptTypes(source.replace(/^export /gm, ""))}\n;globalThis.__exports = { ${names.join(", ")} };`, context);
    for (const value of Object.values(context.__exports)) {
      for (const lesson of value?.lessons ?? []) if (lesson.challenge) found.push({ id: `ds/${lesson.id}`, challenge: lesson.challenge });
    }
  }
  return found;
}

const { loadPyodide } = await import(pathToFileURL(path.join(pyodideDir, "node_modules", "pyodide", "pyodide.mjs")).href);
const pyodide = await loadPyodide();
console.log(`Pyodide runs Python ${pyodide.runPython("import sys; sys.version.split()[0]")}`);

// Mirrors public/python-worker.mjs: load imported packages, then run with a fresh namespace.
async function run(script, imports) {
  let stdout = "";
  pyodide.setStdout({ batched: line => { stdout += `${line}\n`; } });
  pyodide.setStderr({ batched: line => { stdout += `${line}\n`; } });
  await pyodide.loadPackagesFromImports(script);
  await pyodide.loadPackagesFromImports(imports);
  const dict = pyodide.globals.get("dict");
  const globals = dict();
  globals.set("__name__", "__main__");
  const started = Date.now();
  let error;
  try { await pyodide.runPythonAsync(script, { globals }); }
  catch (caught) { error = String(caught.message).split("\n").slice(-3).join(" | "); }
  finally { globals.destroy(); dict.destroy(); }
  return { stdout, error, ms: Date.now() - started };
}

const targets = [
  ...(await pythonCourseChallenges()).map(item => ({ ...item, script: () => buildChallengeScript(item.challenge.solution, item.challenge.tests), imports: `${item.challenge.solution}\n${item.challenge.tests}`, local: needsLocalPython(item.challenge) })),
  ...(await dsCourseChallenges()).map(item => ({ ...item, script: () => buildChallengeScript(item.challenge.solution, item.challenge.tests), imports: `${item.challenge.solution}\n${item.challenge.tests}`, local: needsLocalPython(item.challenge) })),
  ...SQL_CHALLENGES.map(challenge => ({ id: `sql/${challenge.id}`, script: () => buildSqlChallengeScript(challenge.kind === "query" ? challenge.solution : challenge.solution ?? challenge.query, challenge), imports: "import sqlite3", local: false })),
].filter(item => !only.size || only.has(item.id));

let failures = 0;
let slowest = { id: "", ms: 0 };
for (const target of targets) {
  const result = await run(target.script(), target.imports);
  const report = readChallengeReport({ stdout: result.stdout });
  const passed = Boolean(report?.allPassed);
  if (result.ms > slowest.ms) slowest = { id: target.id, ms: result.ms };
  if (target.local) {
    console.log(`${passed ? "note" : "local"} ${target.id}${passed ? " passes in the browser too; it could be graded there" : " (needs local Python, as expected)"}`);
    continue;
  }
  if (passed) { console.log(`ok    ${target.id} (${result.ms} ms)`); continue; }
  failures++;
  const reasons = report ? [report.error, report.loadError, ...report.results.filter(item => !item.passed).map(item => `${item.name}: ${item.error}`)].filter(Boolean) : [result.error ?? "no report"];
  console.log(`FAIL  ${target.id}\n      ${reasons.join("\n      ").slice(0, 1500)}`);
}
console.log(`\n${targets.length - failures}/${targets.length} graded as expected; slowest ${slowest.id} at ${slowest.ms} ms.`);
process.exit(failures ? 1 : 0);
