#!/usr/bin/env node
// Verifies the beginner layer of the DSA course: data/ds-course/guides/*.ts and lib/ds-viz/traces/*.ts.
//
//   node scripts/verify-ds-guides.mjs [--only <lesson-id>] [--write] [--show]
//
// For every lesson in the course it checks that a guide and a trace exist, then
//   1. checks the guide's shape (level, analogy, 3-6 explain paragraphs, notes, takeaways),
//   2. runs `simpleCode` under two PYTHONHASHSEED values and compares stdout with `simpleOutput`
//      (--write stores the actual output in the guide file instead of failing),
//   3. builds every trace and checks the visuals (steps, captions, panel shapes, tree/graph references).
// --show prints each simple program's output and every trace caption so you can read them.
import cp from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { stripTypeScriptTypes } from "node:module";

process.emitWarning = () => {};
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDE_DIR = path.join(ROOT, "data", "ds-course", "guides");
const TRACE_DIR = path.join(ROOT, "lib", "ds-viz", "traces");

const argv = process.argv.slice(2);
const flags = { only: null, write: false, show: false };
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--only") flags.only = argv[++i];
  else if (argv[i] === "--write") flags.write = true;
  else if (argv[i] === "--show") flags.show = true;
  else { console.error(`Unknown option ${argv[i]}`); process.exit(2); }
}

// ---------------------------------------------------------------- loading TypeScript
function transpile(file) {
  let source = fs.readFileSync(file, "utf8");
  // Drop only the leading TypeScript imports; never touch Python `import` lines inside templates.
  const leading = /\s*(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/|import\b[^;]*;)/y;
  let head = "", end = 0;
  for (let match; (match = leading.exec(source)) !== null; end = leading.lastIndex) head += /^\s*import\b/.test(match[0]) ? "\n".repeat((match[0].match(/\n/g) ?? []).length) : match[0];
  source = head + source.slice(end);
  const names = [...source.matchAll(/^export (?:const|function|class) (\w+)/gm)].map(match => match[1]);
  source = source.replace(/^export (?:default )?/gm, "");
  return { code: stripTypeScriptTypes(source), names };
}
function load(file, context = vm.createContext({})) {
  const { code, names } = transpile(file);
  vm.runInContext(`${code}\n;globalThis.__exports = { ${names.join(", ")} };`, context, { filename: file });
  return context.__exports;
}

const lessons = new Map(); // id -> lesson (for the challenge tests)
const lessonIds = (() => {
  // The course order comes from data/ds-course/index.ts; read lesson ids straight from the module files.
  const ids = new Set();
  for (const file of fs.readdirSync(path.join(ROOT, "data", "ds-course"))) {
    if (!file.endsWith(".ts") || file === "index.ts" || file === "types.ts") continue;
    const exported = load(path.join(ROOT, "data", "ds-course", file));
    for (const value of Object.values(exported)) if (value && Array.isArray(value.lessons)) for (const lesson of value.lessons) { ids.add(lesson.id); lessons.set(lesson.id, lesson); }
  }
  return ids;
})();

const guideFiles = fs.readdirSync(GUIDE_DIR).filter(file => file.endsWith(".ts") && file !== "index.ts" && file !== "solutions.ts").map(file => path.join(GUIDE_DIR, file));
const { DS_SOLUTIONS: solutions } = load(path.join(GUIDE_DIR, "solutions.ts"));
const { buildChallengeScript } = load(path.join(ROOT, "lib", "python-challenge.ts"));
const guides = new Map(); // id -> { guide, file }
for (const file of guideFiles) for (const record of Object.values(load(file))) for (const [id, guide] of Object.entries(record)) guides.set(id, { guide, file });

const helperContext = vm.createContext({});
const helpers = load(path.join(ROOT, "lib", "ds-viz", "helpers.ts"), helperContext);
const traces = new Map();
for (const file of fs.readdirSync(TRACE_DIR).filter(file => file.endsWith(".ts") && file !== "index.ts")) {
  const context = vm.createContext({ ...helpers });
  for (const record of Object.values(load(path.join(TRACE_DIR, file), context))) for (const [id, build] of Object.entries(record)) traces.set(id, build);
}

// ---------------------------------------------------------------- results
let errors = 0, warnings = 0;
const fail = (id, message) => { errors++; console.log(`  ERROR  ${id}: ${message}`); };
const warn = (id, message) => { warnings++; console.log(`  warn   ${id}: ${message}`); };

const work = fs.mkdtempSync(path.join(os.tmpdir(), "ds-guides-"));
process.on("exit", () => { try { fs.rmSync(work, { recursive: true, force: true }); } catch { /* best effort */ } });
function runPython(source, seed) {
  const file = path.join(work, "simple_main.py");
  fs.writeFileSync(file, source, "utf8");
  const result = cp.spawnSync("python", [file], { cwd: work, encoding: "utf8", timeout: 20000, windowsHide: true, env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8", PYTHONHASHSEED: seed, PYTHONDONTWRITEBYTECODE: "1" } });
  return { stdout: (result.stdout || "").replace(/\r\n/g, "\n"), stderr: (result.stderr || "").replace(/\r\n/g, "\n"), code: result.status };
}
const normalize = value => value.replace(/\r\n/g, "\n").trim();

function writeOutput(file, id, output) {
  const source = fs.readFileSync(file, "utf8");
  const start = source.search(new RegExp(String.raw`(^|\s)"?${id}"?: \{`, "m"));
  const field = source.indexOf("simpleOutput: `", start);
  if (start < 0 || field < 0) throw new Error(`cannot find simpleOutput for ${id} in ${file}`);
  const open = field + "simpleOutput: `".length;
  let close = open;
  while (source[close] !== "`" || source[close - 1] === "\\") close++;
  const escaped = output.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  fs.writeFileSync(file, source.slice(0, open) + escaped + source.slice(close), "utf8");
}

// ---------------------------------------------------------------- checks
const LEVELS = new Set(["Beginner", "Intermediate", "Advanced"]);
const TONES = new Set(["default", "active", "compare", "done", "found", "muted", "new", "removed", "path"]);
const isText = (value, min = 1) => typeof value === "string" && value.trim().length >= min;

function checkGuide(id, guide, file) {
  if (!LEVELS.has(guide.level)) fail(id, "level must be Beginner, Intermediate or Advanced");
  if (!isText(guide.analogy, 60)) fail(id, "analogy is missing or too short");
  if (!Array.isArray(guide.explain) || guide.explain.length < 3 || guide.explain.length > 7 || !guide.explain.every(item => isText(item, 60))) fail(id, "explain needs 3-7 paragraphs of 60+ characters");
  if (!Array.isArray(guide.codeNotes) || guide.codeNotes.length < 3 || !guide.codeNotes.every(item => isText(item, 20))) fail(id, "codeNotes needs 3+ items");
  if (!Array.isArray(guide.takeaways) || guide.takeaways.length < 3 || guide.takeaways.length > 6) fail(id, "takeaways needs 3-6 items");
  if (!isText(guide.simpleCode, 40)) { fail(id, "simpleCode is missing"); return; }
  const lines = guide.simpleCode.trimEnd().split("\n").length;
  if (lines > 90) warn(id, `simpleCode is ${lines} lines; the simple version should stay short`);
  if (/\b(TypeVar|Generic\[|__slots__|collections\.abc)\b/.test(guide.simpleCode)) warn(id, "simpleCode uses advanced typing/dunder machinery; keep it beginner-friendly");
  const outputs = [];
  for (const seed of ["1", "4242"]) {
    const run = runPython(guide.simpleCode, seed);
    if (run.code !== 0) { fail(id, `simpleCode exited ${run.code}:\n${run.stderr.split("\n").slice(-8).join("\n")}`); return; }
    outputs.push(normalize(run.stdout));
  }
  if (outputs[0] !== outputs[1]) { fail(id, "simpleCode output depends on the hash seed (iterating a set of strings? printing hash()?)"); return; }
  if (outputs[0].split("\n").length > 40) warn(id, `simpleCode prints ${outputs[0].split("\n").length} lines; aim for under 30`);
  if (flags.show) console.log(`\n--- ${id} output ---\n${outputs[0]}\n`);
  if (normalize(guide.simpleOutput ?? "") !== outputs[0]) {
    if (flags.write) { writeOutput(file, id, outputs[0]); console.log(`  wrote  ${id}: simpleOutput (${outputs[0].split("\n").length} lines)`); }
    else fail(id, `simpleOutput differs.\n--- expected ---\n${normalize(guide.simpleOutput ?? "")}\n--- actual ---\n${outputs[0]}\n---`);
  }
}

function checkPanel(id, where, panel) {
  const tone = (value, label) => { if (value !== undefined && !TONES.has(value)) fail(id, `${where}: unknown tone "${value}" in ${label}`); };
  switch (panel.type) {
    case "array":
      if (!Array.isArray(panel.items)) fail(id, `${where}: array items missing`);
      Object.entries(panel.tones ?? {}).forEach(([key, value]) => { tone(value, "array"); if (+key < 0 || +key >= panel.items.length) fail(id, `${where}: tone index ${key} outside the array`); });
      for (const range of panel.ranges ?? []) if (range.from < 0 || range.to >= panel.items.length) fail(id, `${where}: range ${range.from}..${range.to} outside the array`);
      if (panel.ids && (panel.ids.length !== panel.items.length || new Set(panel.ids).size !== panel.ids.length)) fail(id, `${where}: array ids must be unique and match the items (no slide animation otherwise)`);
      break;
    case "stack": Object.values(panel.tones ?? {}).forEach(value => tone(value, "stack")); break;
    case "linked": panel.nodes.forEach(node => tone(node.tone, "linked")); if (panel.nodes.some(node => node.id) && new Set(panel.nodes.map(node => node.id)).size !== panel.nodes.length) fail(id, `${where}: linked node ids must be unique`); for (const marker of panel.markers ?? []) if (marker.at < 0 || marker.at >= panel.nodes.length) fail(id, `${where}: marker ${marker.label} outside the list`); break;
    case "buckets": panel.buckets.flat().forEach(entry => tone(entry.tone, "bucket")); break;
    case "tree": { const walk = node => { if (!node) return; if (typeof node.label !== "string") fail(id, `${where}: tree node label must be a string`); tone(node.tone, "tree"); node.children.forEach(walk); }; walk(panel.root); break; }
    case "graph": { const ids = new Set(panel.nodes.map(node => node.id)); panel.nodes.forEach(node => { tone(node.tone, "graph node"); if (!(node.x >= 0 && node.x <= 100 && node.y >= 0 && node.y <= 70)) fail(id, `${where}: node ${node.id} position out of range`); }); for (const edge of panel.edges) { tone(edge.tone, "edge"); if (!ids.has(edge.from) || !ids.has(edge.to)) fail(id, `${where}: edge ${edge.from}-${edge.to} references a missing node`); } break; }
    case "grid": Object.entries(panel.tones ?? {}).forEach(([key, value]) => { tone(value, "grid"); const [r, c] = key.split(",").map(Number); if (!(r >= 0 && r < panel.cells.length && c >= 0 && c < (panel.cells[r]?.length ?? 0))) fail(id, `${where}: grid tone ${key} outside the grid`); }); break;
    case "vars": case "text": break;
    default: fail(id, `${where}: unknown panel type ${panel.type}`);
  }
}

function checkTrace(id, build) {
  let visuals;
  try { visuals = build(); } catch (error) { fail(id, `trace threw: ${error.stack?.split("\n").slice(0, 3).join(" | ")}`); return; }
  if (!Array.isArray(visuals) || !visuals.length) { fail(id, "trace returned no visuals"); return; }
  for (const visual of visuals) {
    if (!isText(visual.title)) fail(id, "visual without a title");
    if (!isText(visual.intro, 20)) warn(id, `visual "${visual.title}" has no intro (say what the example is and what to watch for)`);
    if (!Array.isArray(visual.steps) || visual.steps.length < 3) fail(id, `visual "${visual.title}" has fewer than 3 steps`);
    if (visual.steps.length > 60) warn(id, `visual "${visual.title}" has ${visual.steps.length} steps; that's a lot to click through`);
    visual.steps.forEach((step, i) => {
      if (!isText(step.caption, 15)) fail(id, `"${visual.title}" step ${i + 1} has no caption`);
      if (/undefined|NaN|\[object Object\]/.test(step.caption)) fail(id, `"${visual.title}" step ${i + 1} caption contains a broken value: ${step.caption}`);
      if (!step.panels.length) fail(id, `"${visual.title}" step ${i + 1} has no panels`);
      step.panels.forEach(panel => checkPanel(id, `"${visual.title}" step ${i + 1}`, panel));
    });
    if (flags.show) { console.log(`\n=== ${id}: ${visual.title}`); visual.steps.forEach((step, i) => console.log(`  ${i + 1}. ${step.caption}`)); }
  }
}

function checkSolution(id) {
  const entry = solutions[id];
  if (!entry) { warn(id, "no solution walkthrough in guides/solutions.ts"); return; }
  if (!Array.isArray(entry.notes) || entry.notes.length < 3 || !entry.notes.every(note => isText(note, 20))) fail(id, "solution notes need 3+ bullets");
  if (!entry.code) return;
  const { tests } = lessons.get(id).challenge;
  const run = runPython(buildChallengeScript(entry.code, tests), "1");
  const start = run.stdout.lastIndexOf("JSON_OUTPUT_START"), end = run.stdout.lastIndexOf("JSON_OUTPUT_END");
  let report = null;
  try { report = JSON.parse(run.stdout.slice(start + "JSON_OUTPUT_START".length, end)); } catch { /* reported below */ }
  if (!report) { fail(id, `simple solution produced no report: ${run.stderr.slice(0, 300)}`); return; }
  if (report.loadError) fail(id, `simple solution failed to load: ${report.loadError}`);
  for (const result of report.results.filter(r => !r.passed)) fail(id, `simple solution fails check "${result.name}": ${String(result.error).split(String.fromCharCode(10)).slice(-2).join(" | ")}`);
}

// ---------------------------------------------------------------- main
let checked = 0;
for (const id of lessonIds) {
  if (flags.only && id !== flags.only) continue;
  const before = errors;
  const entry = guides.get(id);
  if (!entry) warn(id, "no guide yet");
  else checkGuide(id, entry.guide, entry.file);
  checkSolution(id);
  if (!traces.has(id)) warn(id, "no visual trace yet");
  else checkTrace(id, traces.get(id));
  checked++;
  if (entry || traces.has(id)) console.log(`${errors === before ? "ok   " : "FAIL "} ${id}`);
}
for (const id of [...guides.keys(), ...traces.keys(), ...Object.keys(solutions)]) if (!lessonIds.has(id)) fail(id, "guide/trace for a lesson that does not exist");
console.log(`\nChecked ${checked} lessons: ${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}.`);
process.exit(errors ? 1 : 0);
