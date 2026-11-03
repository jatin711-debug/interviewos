// Grades every Python course challenge the same way the course page does: the reference
// solution must pass every check and the starter code must fail at least one.
// Usage: node scripts/verify-python-challenges.mjs [lesson-id ...]
import { spawn } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildChallengeScript, readChallengeReport } from "../lib/python-challenge.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TIMEOUT_MS = 6_000; // local CPython; the site grades the same scripts in browser Python
const SLOW_MS = 3_500;
const PARALLEL = Math.max(1, Math.min(4, os.availableParallelism() - 1));

async function loadChallenges() {
  const directory = path.join(ROOT, "data", "python-challenges");
  const challenges = new Map();
  for (const file of (await readdir(directory)).filter(name => name.endsWith(".ts")).sort()) {
    const exports = await import(pathToFileURL(path.join(directory, file)).href);
    for (const record of Object.values(exports)) {
      if (!record || typeof record !== "object") continue;
      for (const [id, challenge] of Object.entries(record)) {
        if (challenges.has(id)) throw new Error(`Duplicate challenge for lesson "${id}" (${file}).`);
        challenges.set(id, { ...challenge, file });
      }
    }
  }
  const { PYTHON_EXPANSIONS } = await import(pathToFileURL(path.join(ROOT, "data", "python-course-expanded.ts")).href);
  for (const { lesson } of PYTHON_EXPANSIONS) {
    if (!lesson.challenge) throw new Error(`Missing challenge for lesson "${lesson.id}".`);
    if (challenges.has(lesson.id)) throw new Error(`Duplicate challenge for lesson "${lesson.id}".`);
    challenges.set(lesson.id, { ...lesson.challenge, file: "python-course-expanded.ts" });
  }
  return challenges;
}

async function loadLessonIds() {
  const course = await readFile(path.join(ROOT, "data", "python-course.ts"), "utf8");
  const ids = [...course.matchAll(/lesson\(\s*"([a-z0-9-]+)"/g)].map(match => match[1]);
  const { INTERNALS_MODULE } = await import(pathToFileURL(path.join(ROOT, "data", "python-course-internals.ts")).href);
  const { PYTHON_EXPANSIONS } = await import(pathToFileURL(path.join(ROOT, "data", "python-course-expanded.ts")).href);
  return new Set([...ids, ...INTERNALS_MODULE.lessons.map(lesson => lesson.id), ...PYTHON_EXPANSIONS.map(entry => entry.lesson.id)]);
}

function runPython(script) {
  return new Promise(async resolve => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "ivos-verify-"));
    await writeFile(path.join(directory, "main.py"), script, "utf8");
    const started = Date.now();
    const child = spawn("python", ["main.py"], {
      cwd: directory,
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8", PYTHONDONTWRITEBYTECODE: "1" },
      windowsHide: true,
    });
    let stdout = "", stderr = "", timedOut = false;
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true });
      else child.kill("SIGKILL");
    }, TIMEOUT_MS);
    child.on("close", async () => {
      clearTimeout(timer);
      await rm(directory, { recursive: true, force: true }).catch(() => {});
      resolve({ stdout, stderr, timedOut, ms: Date.now() - started });
    });
  });
}

function summarize(report) {
  if (!report) return "no report";
  const failed = report.results.filter(item => !item.passed).map(item => `    ✗ ${item.name}: ${item.error ?? ""}`.trimEnd());
  return [report.error, report.loadError, ...failed].filter(Boolean).join("\n");
}

async function verify(id, challenge) {
  const problems = [];
  const warnings = [];
  for (const field of ["prompt", "starter", "tests", "solution"]) {
    if (typeof challenge[field] !== "string" || !challenge[field].trim()) problems.push(`missing ${field}`);
  }
  if (problems.length) return { id, problems, warnings };
  const checkNames = [...challenge.tests.matchAll(/@check\(\s*["']([^"']+)["']/g)].map(match => match[1]);
  if (checkNames.length < 2) problems.push(`needs at least 2 checks, found ${checkNames.length}`);
  if (new Set(checkNames).size !== checkNames.length) problems.push("check names are not unique");

  const solution = await runPython(buildChallengeScript(challenge.solution, challenge.tests));
  const solved = readChallengeReport({ stdout: solution.stdout });
  if (solution.timedOut) problems.push(`solution timed out after ${TIMEOUT_MS / 1000}s`);
  else if (!solved?.allPassed) problems.push(`solution does not pass:\n${summarize(solved)}${solved ? "" : `\n${solution.stderr.slice(-1500)}`}`);
  else if (solved.results.length !== checkNames.length) problems.push(`report has ${solved.results.length} checks, source declares ${checkNames.length}`);
  if (solution.ms > SLOW_MS) warnings.push(`solution took ${solution.ms} ms (server limit ${TIMEOUT_MS} ms)`);

  const starter = await runPython(buildChallengeScript(challenge.starter, challenge.tests));
  const started = readChallengeReport({ stdout: starter.stdout });
  if (!starter.timedOut && !started) problems.push(`starter produced no report:\n${starter.stderr.slice(-1500)}`);
  else if (started?.error) problems.push(`checks fail to load against the starter: ${started.error}`);
  else if (started?.allPassed) problems.push("starter code already passes every check");
  if (starter.timedOut) warnings.push("starter run timed out instead of failing a check");
  return { id, problems, warnings, ms: solution.ms };
}

const challenges = await loadChallenges();
const lessonIds = await loadLessonIds();
const only = new Set(process.argv.slice(2));
const targets = [...challenges].filter(([id]) => !only.size || only.has(id));
const unknown = [...challenges.keys()].filter(id => !lessonIds.has(id));
const missing = [...lessonIds].filter(id => !challenges.has(id));

const results = [];
let next = 0;
await Promise.all(Array.from({ length: PARALLEL }, async () => {
  while (next < targets.length) {
    const [id, challenge] = targets[next++];
    results.push(await verify(id, challenge));
  }
}));

results.sort((a, b) => a.id.localeCompare(b.id));
for (const result of results) {
  const mark = result.problems.length ? "FAIL" : "ok  ";
  console.log(`${mark} ${result.id}${result.ms ? ` (${result.ms} ms)` : ""}`);
  for (const problem of result.problems) console.log(`  - ${problem.replace(/\n/g, "\n    ")}`);
  for (const warning of result.warnings) console.log(`  ! ${warning}`);
}
if (unknown.length) console.log(`\nChallenges for unknown lesson ids: ${unknown.join(", ")}`);
if (!only.size && missing.length) console.log(`\nLessons without a challenge (${missing.length}): ${missing.join(", ")}`);
const failed = results.filter(result => result.problems.length).length;
console.log(`\n${results.length - failed}/${results.length} challenges verified.`);
process.exit(failed || unknown.length ? 1 : 0);
