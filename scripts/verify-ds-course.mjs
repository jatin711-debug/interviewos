#!/usr/bin/env node
// Verifies the "Data structures & algorithms" course content in data/ds-course/*.ts.
//
//   node scripts/verify-ds-course.mjs [module.ts ...] [--only <lesson-id>] [--partial] [--complete]
//                                     [--pyodide <dir containing node_modules/pyodide>] [--fast]
//
// With no files it checks every module. For each lesson it
//   1. checks the shape of the data and some code-quality rules,
//   2. runs `code` twice under different PYTHONHASHSEED values and compares stdout with `output`,
//   3. grades `challenge.solution` (must pass every check) and `challenge.starter` (must fail some check)
//      through lib/python-challenge.ts, the same harness the app sends to /api/execute,
//   4. with --pyodide, also runs `code` in Pyodide (browser Python) and compares with `output`.
// --partial allows a module to hold only some of its planned lessons; --complete requires the whole plan.
// Exit code 1 when anything fails. Warnings never fail the run.
import cp from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";

process.emitWarning = () => {}; // stripTypeScriptTypes is experimental on some Node versions

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_DIR = path.join(ROOT, "data", "ds-course");

// The planned course: module file -> lesson ids in reading order.
const PLAN = {
  foundations: ["ds-class-design", "ds-iterators", "ds-complexity"],
  linear: ["dynamic-array", "singly-linked-list", "stack"],
  hashing: ["hash-table-chaining", "hash-table-open-addressing", "lru-cache"],
  trees: [],
  "range-queries": [],
  missing: ["doubly-linked-list", "avl-tree", "sparse-table", "scc-bridges", "intervals-sweep"],
  supplemental: ["queue", "binary-tree", "heap", "trie", "fenwick-tree", "segment-tree", "bst", "greedy", "bit-manipulation", "string-matching", "number-theory", "minimum-spanning-tree"],
  graphs: ["graph-representation", "bfs-dfs", "topological-sort", "dijkstra", "bellman-ford-floyd-warshall", "union-find"],
  "sorting-searching": ["binary-search", "elementary-sorts", "merge-sort", "quick-sort", "non-comparison-sorts"],
  paradigms: ["divide-and-conquer", "backtracking", "dp-memoization-tabulation", "dp-two-dimensional", "dp-advanced"],
  techniques: ["prefix-sums", "two-pointers-sliding-window", "monotonic-stack-queue"],
  advanced: ["skip-list", "bloom-filter", "sorted-list", "choosing-structures"],
};
const KINDS = new Set(["structure", "algorithm", "technique", "concept"]);
const SERVER_TIMEOUT_MS = 6000; // /api/execute kills a run after this long

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const flags = { partial: false, complete: false, fast: false, only: null, pyodide: null };
const files = [];
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--partial") flags.partial = true;
  else if (arg === "--complete") flags.complete = true;
  else if (arg === "--fast") flags.fast = true;
  else if (arg === "--only") flags.only = argv[++i];
  else if (arg === "--pyodide") flags.pyodide = path.resolve(argv[++i]);
  else if (arg.startsWith("--")) { console.error(`Unknown option ${arg}`); process.exit(2); }
  else files.push(path.resolve(arg));
}
const allModuleFiles = Object.keys(PLAN).map(name => path.join(COURSE_DIR, `${name}.ts`));
const targets = files.length ? files : allModuleFiles;

// ---------------------------------------------------------------- loading TypeScript data
function loadExports(file) {
  let source = fs.readFileSync(file, "utf8");
  // Drop the TypeScript imports at the top of the file (type-only in the data files); never touch Python inside templates.
  const leading = /\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/|import\b[^;]*;)/y;
  let head = "";
  let end = 0;
  for (let match; (match = leading.exec(source)) !== null; end = leading.lastIndex) {
    if (/^\s*import\b/.test(match[0])) head += "\n".repeat((match[0].match(/\n/g) ?? []).length);
    else head += match[0];
  }
  source = head + source.slice(end);
  const names = [...source.matchAll(/^export (?:const|function|class) (\w+)/gm)].map(match => match[1]);
  source = source.replace(/^export (?:default )?/gm, "");
  const code = `${stripTypeScriptTypes(source)}\n;globalThis.__exports = { ${names.join(", ")} };`;
  const context = vm.createContext({});
  vm.runInContext(code, context, { filename: file });
  return context.__exports;
}

function loadModule(file) {
  const exported = loadExports(file);
  const module = Object.values(exported).find(value => value && Array.isArray(value.lessons));
  if (!module) throw new Error(`${path.basename(file)} exports no module object with a lessons array`);
  return module;
}

const { buildChallengeScript } = loadExports(path.join(ROOT, "lib", "python-challenge.ts"));
const categories = new Set([...fs.readFileSync(path.join(ROOT, "data", "dsa", "types.ts"), "utf8").match(/export type DSACategory =([\s\S]*?);/)[1].matchAll(/"([^"]+)"/g)].map(match => match[1]));

// ---------------------------------------------------------------- results
let errorCount = 0;
let warningCount = 0;
const fail = (id, message) => { errorCount++; console.log(`  ERROR  ${id}: ${message}`); };
const warn = (id, message) => { warningCount++; console.log(`  warn   ${id}: ${message}`); };

// ---------------------------------------------------------------- python helpers
const work = fs.mkdtempSync(path.join(os.tmpdir(), "ds-verify-"));
process.on("exit", () => { try { fs.rmSync(work, { recursive: true, force: true }); } catch { /* best effort */ } });

function runPython(source, { seed = "1", timeout = 20000 } = {}) {
  const dir = fs.mkdtempSync(path.join(work, "run-"));
  const file = path.join(dir, "lesson_main.py");
  fs.writeFileSync(file, source, "utf8");
  const started = Date.now();
  const result = cp.spawnSync("python", [file], {
    cwd: dir, encoding: "utf8", timeout, windowsHide: true, maxBuffer: 20_000_000,
    env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8", PYTHONHASHSEED: seed, PYTHONDONTWRITEBYTECODE: "1" },
  });
  fs.rmSync(dir, { recursive: true, force: true });
  return { stdout: (result.stdout || "").replace(/\r\n/g, "\n"), stderr: (result.stderr || "").replace(/\r\n/g, "\n"), code: result.status, timedOut: result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM", ms: Date.now() - started, error: result.error };
}

function readReport(stdout) {
  const start = stdout.lastIndexOf("JSON_OUTPUT_START");
  const end = stdout.lastIndexOf("JSON_OUTPUT_END");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(stdout.slice(start + "JSON_OUTPUT_START".length, end)); } catch { return null; }
}

// ---------------------------------------------------------------- static checks
const text = (value, min = 1) => typeof value === "string" && value.trim().length >= min;
const textList = (value, min, max, minLength) => Array.isArray(value) && value.length >= min && value.length <= max && value.every(item => text(item, minLength));

function checkShape(lesson) {
  const id = lesson.id ?? "(no id)";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lesson.id ?? "")) fail(id, "id must be kebab-case");
  if (!text(lesson.title, 3)) fail(id, "title is missing");
  if (!KINDS.has(lesson.kind)) fail(id, `kind must be one of ${[...KINDS].join(", ")}`);
  if (!text(lesson.summary, 40)) fail(id, "summary is missing or shorter than 40 characters");
  if (!textList(lesson.concepts, 3, 6, 40)) fail(id, "concepts needs 3-6 items of at least 40 characters");
  if (!Array.isArray(lesson.complexity) || !lesson.complexity.length || !lesson.complexity.every(row => text(row?.operation) && text(row?.time))) fail(id, "complexity needs rows with operation and time");
  if (!text(lesson.space, 5)) fail(id, "space is missing");
  if (!text(lesson.code, 80)) fail(id, "code is missing");
  if (!text(lesson.output, 1)) fail(id, "output is missing");
  if (!textList(lesson.bestPractices, 3, 7, 40)) fail(id, "bestPractices needs 3-7 items of at least 40 characters");
  if (!textList(lesson.pitfalls, 2, 5, 30)) fail(id, "pitfalls needs 2-5 items of at least 30 characters");
  if (!textList(lesson.useWhen, 2, 5, 20)) fail(id, "useWhen needs 2-5 items of at least 20 characters");
  if (!text(lesson.inPractice, 40)) fail(id, "inPractice is missing or shorter than 40 characters");
  if (!Array.isArray(lesson.practice) || !lesson.practice.length) fail(id, "practice needs at least one DSA category");
  else for (const topic of lesson.practice) if (!categories.has(topic)) fail(id, `practice category "${topic}" is not a DSACategory`);
  if (!/^https?:\/\//.test(lesson.source ?? "")) fail(id, "source must be an http(s) URL");
  const challenge = lesson.challenge;
  if (!challenge || !text(challenge.prompt, 60) || !text(challenge.starter) || !text(challenge.tests) || !text(challenge.solution)) { fail(id, "challenge needs prompt (60+ chars), starter, tests and solution"); return; }
  if (!text(challenge.hint, 20)) fail(id, "challenge.hint is missing");
  if (challenge.starter.trim() === challenge.solution.trim()) fail(id, "challenge starter and solution are identical");
  const checkNames = [...challenge.tests.matchAll(/@check\(\s*(["'])(.*?)\1\s*\)/g)].map(match => match[2]);
  if (checkNames.length < 3) fail(id, `challenge needs at least 3 @check functions (found ${checkNames.length})`);
  else if (checkNames.length < 4) warn(id, "challenge has only 3 checks; 4-6 is better");
  if (new Set(checkNames).size !== checkNames.length) fail(id, "challenge check names must be unique");
}

function checkCodeQuality(lesson) {
  const id = lesson.id;
  const code = lesson.code ?? "";
  if (!/if __name__ == ["']__main__["']:/.test(code)) fail(id, 'code needs a demo under `if __name__ == "__main__":`');
  if (!code.includes('"""')) fail(id, "code needs docstrings");
  if (!code.includes("->")) fail(id, "code needs type hints (return annotations)");
  if (lesson.kind === "structure") {
    if (!/^class \w+/m.test(code)) fail(id, "a structure lesson must define a class");
    for (const dunder of ["__len__", "__repr__"]) if (!code.includes(`def ${dunder}`)) warn(id, `consider ${dunder} when appropriate for this structure`);
    if (!["__iter__", "__contains__", "__getitem__"].some(dunder => code.includes(`def ${dunder}`))) warn(id, "no iteration or membership protocol; verify it suits this structure");
    else if (!code.includes("def __iter__")) warn(id, "structure has no __iter__; iteration is part of being a good container (say why if it makes no sense)");
    if (!code.includes("__slots__") && !code.includes("slots=True")) warn(id, "no __slots__ / dataclass(slots=True) anywhere");
  }
  const banned = [[/^\s*import (time|os|sys|subprocess|socket|threading|multiprocessing|asyncio)\b/m, "imports a module the browser runner or determinism rules out"], [/^\s*from (time|os|sys|subprocess|socket|threading|multiprocessing|asyncio) import\b/m, "imports a module the browser runner or determinism rules out"], [/\binput\(/, "reads input"], [/\bopen\(/, "touches the filesystem"], [/^\s*except\s*:/m, "bare except"], [/def \w+\([^)]*=\s*(\[\]|\{\}|set\(\))/, "mutable default argument"], [/\bprint\(\s*id\(/, "prints an object id"]];
  for (const [pattern, reason] of banned) if (pattern.test(code)) fail(id, `code ${reason}`);
  if (/\bimport random\b|from random import/.test(code) && !/Random\(\s*\d+\s*\)/.test(code)) fail(id, "uses random without a fixed seed (random.Random(seed))");
  if (code.split("\n").length > 170) warn(id, `code is ${code.split("\n").length} lines; aim for ~120 so it stays readable`);
  if (lesson.output.split("\n").length > 40) warn(id, "output is longer than 40 lines");
}

// ---------------------------------------------------------------- execution checks
function normalize(value) { return value.replace(/\r\n/g, "\n").trim(); }

function checkDemo(lesson) {
  const id = lesson.id;
  const expected = normalize(lesson.output);
  const times = [];
  for (const seed of ["1", "12345"]) {
    const run = runPython(lesson.code, { seed });
    times.push(run.ms);
    if (run.timedOut) { fail(id, "demo code timed out"); return; }
    if (run.code !== 0) { fail(id, `demo code exited ${run.code}:\n${run.stderr.split("\n").slice(-12).join("\n")}`); return; }
    if (normalize(run.stdout) !== expected) {
      fail(id, `demo output differs (PYTHONHASHSEED=${seed}).\n--- expected ---\n${expected}\n--- actual ---\n${normalize(run.stdout)}\n---`);
      return;
    }
    if (run.stderr.trim()) warn(id, `demo wrote to stderr: ${run.stderr.trim().split("\n")[0]}`);
  }
  return Math.max(...times);
}

function checkChallenge(lesson) {
  const id = lesson.id;
  const { starter, solution, tests } = lesson.challenge;
  const solved = runPython(buildChallengeScript(solution, tests), { timeout: SERVER_TIMEOUT_MS });
  if (solved.timedOut) { fail(id, `challenge solution exceeded the server's ${SERVER_TIMEOUT_MS / 1000}s limit`); return; }
  const report = readReport(solved.stdout);
  if (!report) { fail(id, `challenge solution produced no report. stderr: ${solved.stderr.trim().slice(0, 400)}`); return; }
  if (report.loadError) fail(id, `challenge solution failed to load:\n${report.loadError}`);
  if (report.error) fail(id, `challenge checks failed to load:\n${report.error}`);
  const failed = report.results.filter(result => !result.passed);
  for (const result of failed) fail(id, `solution fails check "${result.name}": ${String(result.error).split("\n").slice(-3).join(" | ")}`);
  if (solved.ms > 3500) fail(id, `challenge solution takes ${solved.ms}ms; keep a wide margin under the ${SERVER_TIMEOUT_MS}ms limit`);
  else if (solved.ms > 2000) warn(id, `challenge solution takes ${solved.ms}ms; slower machines may time out`);
  const slow = report.results.find(result => /Timed out/.test(result.error ?? ""));
  if (slow) fail(id, `check "${slow.name}" timed out for the solution`);

  const stub = runPython(buildChallengeScript(starter, tests), { timeout: SERVER_TIMEOUT_MS });
  const stubReport = readReport(stub.stdout);
  if (!stubReport) { fail(id, `starter produced no report (does it exit the interpreter?). stderr: ${stub.stderr.trim().slice(0, 300)}`); return; }
  if (stubReport.loadError) fail(id, `starter raises while loading, so the learner sees no check results:\n${stubReport.loadError}`);
  const stubFailed = stubReport.results.filter(result => !result.passed).length;
  if (stubReport.allPassed || stubFailed === 0) fail(id, "starter already passes every check");
  return { ms: solved.ms, checks: report.results.length, starterFails: stubFailed };
}

let pyodide = null;
async function loadPyodideOnce() {
  const module = await import(pathToFileURL(path.join(flags.pyodide, "node_modules", "pyodide", "pyodide.mjs")).href);
  pyodide = await module.loadPyodide();
  console.log(`Pyodide runs Python ${pyodide.runPython("import sys; sys.version.split()[0]")}`);
}

function checkPyodide(lesson) {
  const id = lesson.id;
  let out = "";
  pyodide.setStdout({ batched: line => { out += `${line}\n`; } });
  pyodide.setStderr({ batched: line => { out += `${line}\n`; } });
  const dict = pyodide.globals.get("dict");
  const globals = dict();
  globals.set("__name__", "__main__");
  try {
    pyodide.runPython(lesson.code, { globals });
  } catch (error) {
    fail(id, `Pyodide (browser) run failed: ${String(error.message).split("\n").slice(-4).join(" | ")}`);
    return;
  } finally { globals.destroy(); dict.destroy(); }
  if (normalize(out) !== normalize(lesson.output)) fail(id, `Pyodide (browser) output differs.\n--- expected ---\n${normalize(lesson.output)}\n--- actual ---\n${normalize(out)}\n---`);
}

// ---------------------------------------------------------------- main
const ids = new Map(); // id -> module
for (const file of allModuleFiles) {
  if (!fs.existsSync(file)) { console.log(`Missing module file ${path.relative(ROOT, file)}`); errorCount++; continue; }
  const module = loadModule(file);
  for (const lesson of module.lessons) {
    if (ids.has(lesson.id)) fail(lesson.id, `duplicate id (also in module "${ids.get(lesson.id)}")`);
    ids.set(lesson.id, module.id);
  }
}

if (flags.pyodide) await loadPyodideOnce();
let checked = 0;
for (const file of targets) {
  if (!fs.existsSync(file)) { console.log(`File not found: ${file}`); errorCount++; continue; }
  const module = loadModule(file);
  const key = path.basename(file, ".ts");
  console.log(`\n== ${module.title} (${path.relative(ROOT, file)}): ${module.lessons.length} lesson${module.lessons.length === 1 ? "" : "s"}`);
  const planned = PLAN[key];
  if (!planned) fail(key, "not a planned module file");
  else {
    const actual = module.lessons.map(lesson => lesson.id);
    const unexpected = actual.filter(id => !planned.includes(id));
    const missing = planned.filter(id => !actual.includes(id));
    if (unexpected.length) fail(key, `lessons not in the plan: ${unexpected.join(", ")}`);
    if (missing.length && (!flags.partial || flags.complete)) fail(key, `planned lessons missing: ${missing.join(", ")}`);
    else if (missing.length) console.log(`  (partial) missing: ${missing.join(", ")}`);
    const order = actual.filter(id => planned.includes(id));
    if (JSON.stringify(order) !== JSON.stringify(planned.filter(id => actual.includes(id)))) fail(key, "lessons are not in the planned order");
  }
  for (const lesson of module.lessons) {
    if (flags.only && lesson.id !== flags.only) continue;
    const before = errorCount;
    checkShape(lesson);
    if (lesson.code && lesson.output) checkCodeQuality(lesson);
    let demoMs, challenge;
    if (!flags.fast && errorCount === before) {
      demoMs = checkDemo(lesson);
      if (lesson.challenge?.tests && lesson.challenge?.solution && lesson.challenge?.starter) challenge = checkChallenge(lesson);
      if (pyodide && errorCount === before) checkPyodide(lesson);
    }
    checked++;
    const status = errorCount === before ? "ok   " : "FAIL ";
    const detail = challenge ? ` demo ${demoMs ?? "?"}ms, ${challenge.checks} checks in ${challenge.ms}ms, starter fails ${challenge.starterFails}` : "";
    console.log(`${status} ${lesson.id}${detail}`);
  }
}

if (flags.complete) {
  const wanted = Object.values(PLAN).flat();
  const missing = wanted.filter(id => !ids.has(id));
  if (missing.length) fail("course", `missing lessons: ${missing.join(", ")}`);
  console.log(`\nCourse has ${ids.size} of ${wanted.length} planned lessons.`);
}
console.log(`\nChecked ${checked} lesson${checked === 1 ? "" : "s"}: ${errorCount} error${errorCount === 1 ? "" : "s"}, ${warningCount} warning${warningCount === 1 ? "" : "s"}.`);
process.exit(errorCount ? 1 : 0);
