// Grades every SQL practice challenge the same way the Databases page does: the reference solution
// must pass every check, the starter must run (no SQL errors) yet fail at least one check, and every
// challenge needs at least 2 datasets. A few reference results are also compared with rows worked
// out by hand, so a wrong reference can't pass just by agreeing with itself.
// Usage: node scripts/verify-sql-challenges.mjs [challenge-id ...]
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CHALLENGE_END_MARKER, CHALLENGE_START_MARKER, readChallengeReport } from "../lib/python-challenge.ts";
import { SQL_REPORT_END_MARKER, SQL_REPORT_START_MARKER, buildSqlChallengeScript, sqlCheckNames } from "../lib/sql-challenge.ts";
import { SQL_CHALLENGES } from "../data/sql-challenges.ts";

const TIMEOUT_MS = 6_000; // local CPython; the site grades the same scripts in browser Python
const SLOW_MS = 3_000;
const PARALLEL = Math.max(1, Math.min(4, os.availableParallelism() - 1));
const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const SQL_FAILURE = /^(SQLite error|Your index statement failed|Your statement ran but)/;

// Expected rows worked out by hand from the datasets in data/sql-challenges.ts.
const HAND_CHECKS = [
  { id: "recent-top-earners", dataset: 0, columns: ["name", "salary", "hired_on"], rows: [["Lena Ortiz", 156000, "2022-02-10"], ["Tomas Varga", 145000, "2023-08-21"], ["Mei Chen", 131000, "2023-01-09"]] },
  { id: "recent-top-earners", dataset: 1, columns: ["name", "salary", "hired_on"], rows: [["Cal Moss", 150000, "2024-01-01"], ["Ana Ruiz", 140000, "2022-09-09"], ["Ben Ito", 140000, "2023-03-01"]] },
  { id: "repeat-buyers", dataset: 0, columns: ["customer_id", "delivered_orders", "delivered_total"], rows: [[2, 2, 510], [1, 2, 200.5], [3, 3, 200]] },
  { id: "repeat-buyers", dataset: 2, columns: ["customer_id", "delivered_orders", "delivered_total"], rows: [[4, 2, 150], [9, 2, 150], [12, 3, 150]] },
  { id: "customers-without-orders", dataset: 1, columns: ["id", "name"], rows: [[2, "Kofi Mensah"], [3, "Lin Wei"]] },
  { id: "orders-per-customer-2024", dataset: 0, columns: ["customer_id", "name", "orders_2024"], rows: [[1, "Hana Sato", 3], [2, "Oliver Grant", 3], [3, "Fatima Noor", 2], [5, "Grace Kim", 1], [4, "Diego Alvarez", 0], [6, "Victor Amadi", 0]] },
  { id: "orders-per-customer-2024", dataset: 2, columns: ["customer_id", "name", "orders_2024"], rows: [[2, "Kofi Mensah", 2], [1, "Ava Byrne", 1], [3, "Lin Wei", 0]] },
  { id: "out-earning-manager", dataset: 0, columns: ["employee", "employee_salary", "manager", "manager_salary"], rows: [["Mei Chen", 131000, "Aisha Khan", 120000], ["Tomas Varga", 145000, "Marcus Bell", 142000]] },
  { id: "out-earning-manager", dataset: 2, columns: ["employee", "employee_salary", "manager", "manager_salary"], rows: [["Wes Clarke", 160000, "Vik Patel", 150000]] },
  { id: "big-spenders-no-refunds", dataset: 0, columns: ["id", "name"], rows: [[1, "Hana Sato"]] },
  { id: "total-compensation", dataset: 0, columns: ["name", "department", "total_comp"], rows: [
    ["Priya Raman", "Engineering", 205000], ["Lena Ortiz", "Engineering", 164000], ["Tomas Varga", "Engineering", 145000], ["Marcus Bell", "Engineering", 142000],
    ["Aisha Khan", "Sales", 135000], ["Mei Chen", "Sales", 131000], ["Jonah Price", "Sales", 110000], ["Sam Okafor", "Unassigned", 110000],
    ["Rafael Duarte", "Support", 90000], ["Nora Lindqvist", "Support", 75000],
  ] },
  { id: "order-status-breakdown", dataset: 0, columns: ["customer_id", "total_orders", "delivered_revenue", "cancel_rate"], rows: [[1, 3, 200.5, 33.3], [2, 3, 510, 0], [3, 3, 200, 0], [5, 1, 0, 0]] },
  { id: "order-status-breakdown", dataset: 1, columns: ["customer_id", "total_orders", "delivered_revenue", "cancel_rate"], rows: [[1, 2, 0, 100], [2, 3, 25, 33.3]] },
  { id: "first-signup-per-email", dataset: 0, columns: ["id", "email", "signed_up_at", "source"], rows: [
    [2, "leo@example.com", "2024-03-01 11:30:00", "ios"], [3, "Maya@Example.com", "2024-02-28 09:00:00", "android"],
    [4, "sven@example.com", "2024-03-02 08:00:00", "web"], [6, "ivy@example.com", "2024-03-03 07:45:00", null],
  ] },
  { id: "salary-rank-in-department", dataset: 1, columns: ["department_id", "name", "salary", "salary_rank"], rows: [
    [1, "Ada Moss", 100000, 1], [1, "Bea Kerr", 100000, 1], [1, "Cy Dunn", 90000, 2], [1, "Dov Hart", 80000, 3], [1, "Eve Sato", 80000, 3],
  ] },
  { id: "latest-two-orders", dataset: 0, columns: ["customer_id", "order_id", "created_at", "total"], rows: [
    [1, 103, "2024-02-12 10:00:00", 45], [1, 102, "2024-02-11 14:02:00", 80], [2, 105, "2024-03-02 11:45:00", 150], [2, 110, "2024-02-29 12:00:00", 210],
    [3, 108, "2024-03-31 23:59:59", 40], [3, 107, "2024-03-15 16:20:00", 99.75], [5, 109, "2024-04-01 00:00:00", 75],
  ] },
  { id: "running-revenue", dataset: 0, columns: ["day", "revenue", "running_revenue"], rows: [["2024-06-01", 155.5, 155.5], ["2024-06-02", 80.25, 235.75], ["2024-06-04", 164.5, 400.25], ["2024-06-05", 10, 410.25]] },
  { id: "day-over-day-active-users", dataset: 0, columns: ["day", "active_users", "change", "pct_change"], rows: [
    ["2024-09-01", 1200, null, null], ["2024-09-02", 1350, 150, 12.5], ["2024-09-03", 1290, -60, -4.4], ["2024-09-05", 1290, 0, 0], ["2024-09-06", 1548, 258, 20],
  ] },
  { id: "day-over-day-active-users", dataset: 1, columns: ["day", "active_users", "change", "pct_change"], rows: [["2024-01-01", 0, null, null], ["2024-01-02", 40, 40, null], ["2024-01-03", 10, -30, -75]] },
  { id: "category-best-sellers", dataset: 0, columns: ["category", "product", "units_sold"], rows: [["Accessories", "Wool Beanie", 2], ["Jackets", "Rain Shell", 2], ["Shoes", "City Sneaker", 4]] },
  { id: "category-best-sellers", dataset: 1, columns: ["category", "product", "units_sold"], rows: [["Jackets", "Fleece Vest", 1], ["Shoes", "Alpine Boot", 5], ["Shoes", "Court Classic", 5]] },
  { id: "monthly-revenue", dataset: 0, columns: ["month", "orders", "revenue"], rows: [["2024-01", 2, 420.5], ["2024-02", 2, 290], ["2024-03", 2, 139.75]] },
  { id: "monthly-revenue", dataset: 1, columns: ["month", "orders", "revenue"], rows: [["2024-01", 1, 20], ["2024-02", 2, 70.5]] },
  { id: "runner-up-score", dataset: 0, columns: ["player", "points"], rows: [["Devon", 910]] },
  { id: "runner-up-score", dataset: 1, columns: ["player", "points"], rows: [["Bo", 40], ["Cleo", 40]] },
  { id: "runner-up-score", dataset: 2, columns: ["player", "points"], rows: [] },
  { id: "index-composite-column-order", dataset: 0, columns: ["id", "created_at", "total"], rows: [[110, "2024-02-29 12:00:00", 210], [105, "2024-03-02 11:45:00", 150]] },
  { id: "index-covering-account-page", dataset: 1, columns: ["created_at", "status", "total"], rows: [
    ["2024-05-01 09:00:00", "delivered", 50], ["2024-03-01 09:00:00", "cancelled", 20], ["2024-02-01 09:00:00", "pending", 40],
    ["2024-01-01 09:00:00", "delivered", 10], ["2023-12-24 18:00:00", "refunded", 60],
  ] },
];

const literal = value => value === null ? "NULL" : typeof value === "number" ? String(value) : `'${String(value).replace(/'/g, "''")}'`;
/** A query that returns exactly `rows` under `columns`, in order. */
function rowsQuery(columns, rows) {
  if (!rows.length) return `SELECT ${columns.map(name => `NULL AS ${name}`).join(", ")} WHERE 0`;
  return `WITH expected(${columns.join(", ")}) AS (VALUES ${rows.map(row => `(${row.map(literal).join(", ")})`).join(", ")}) SELECT * FROM expected`;
}

function runPython(script) {
  return new Promise(async resolve => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "ivos-sql-verify-"));
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

async function grade(sql, challenge) {
  const run = await runPython(buildSqlChallengeScript(sql, challenge));
  return { ...run, report: readChallengeReport({ stdout: run.stdout }) };
}

function summarize(report) {
  if (!report) return "no report";
  const failed = report.results.filter(item => !item.passed).map(item => `  ✗ ${item.name}: ${item.error ?? ""}`.trimEnd());
  return [report.error, report.loadError, ...failed].filter(Boolean).join("\n");
}

function checkShape(challenge) {
  const problems = [];
  for (const field of ["id", "title", "topic", "concept", "prompt", "starter", "solution"]) {
    if (typeof challenge[field] !== "string" || !challenge[field].trim()) problems.push(`missing ${field}`);
  }
  if (!DIFFICULTIES.has(challenge.difficulty)) problems.push(`unknown difficulty "${challenge.difficulty}"`);
  if (typeof challenge.ordered !== "boolean") problems.push("ordered must be true or false");
  if (challenge.kind === "index" && (!challenge.query?.trim() || !challenge.plan?.length)) problems.push("index challenges need a query and at least one plan requirement");
  if (challenge.kind !== "index" && challenge.kind !== "query") problems.push(`unknown kind "${challenge.kind}"`);
  if (!Array.isArray(challenge.datasets) || challenge.datasets.length < 2) problems.push(`needs at least 2 datasets, found ${challenge.datasets?.length ?? 0}`);
  const tables = new Map((challenge.tables ?? []).map(table => [table.name, table.columns.length]));
  for (const dataset of challenge.datasets ?? []) {
    for (const [name, rows] of Object.entries(dataset.rows)) {
      if (!tables.has(name)) problems.push(`dataset "${dataset.name}" seeds unknown table ${name}`);
      else rows.forEach((row, i) => { if (row.length !== tables.get(name)) problems.push(`dataset "${dataset.name}" ${name} row ${i + 1} has ${row.length} values, expected ${tables.get(name)}`); });
    }
  }
  const names = sqlCheckNames(challenge);
  if (new Set(names).size !== names.length) problems.push("check names are not unique");
  if (names.length < 2) problems.push(`needs at least 2 checks, found ${names.length}`);
  return problems;
}

async function verify(challenge) {
  const problems = checkShape(challenge);
  const warnings = [];
  if (problems.length) return { id: challenge.id, problems, warnings };
  const names = sqlCheckNames(challenge);

  const solved = await grade(challenge.solution, challenge);
  if (solved.timedOut) problems.push(`solution timed out after ${TIMEOUT_MS / 1000}s`);
  else if (!solved.report?.allPassed) problems.push(`solution does not pass:\n${summarize(solved.report)}${solved.report ? "" : `\n${solved.stderr.slice(-1500)}`}`);
  else if (solved.report.results.map(item => item.name).join("\n") !== names.join("\n")) problems.push("report check names differ from sqlCheckNames()");
  if (solved.ms > SLOW_MS) warnings.push(`solution took ${solved.ms} ms (server limit ${TIMEOUT_MS} ms)`);

  const started = await grade(challenge.starter, challenge);
  const report = started.report;
  if (!report) problems.push(`starter produced no report:\n${started.stderr.slice(-1500)}`);
  else if (report.error) problems.push(`checks fail to load against the starter: ${report.error}`);
  else if (report.loadError) problems.push(`starter does not run: ${report.loadError}`);
  else if (report.allPassed) problems.push("starter already passes every check");
  else {
    const broken = report.results.filter(item => item.error && SQL_FAILURE.test(item.error));
    if (broken.length) problems.push(`starter should run but is wrong; it errors instead:\n  ${broken[0].name}: ${broken[0].error}`);
  }

  for (const hand of HAND_CHECKS.filter(item => item.id === challenge.id)) {
    const dataset = challenge.datasets[hand.dataset];
    // Grade the real reference as if it were a learner's answer against the hand-written rows.
    const probe = challenge.kind === "index"
      ? { ...challenge, kind: "query", datasets: [dataset], solution: rowsQuery(hand.columns, hand.rows) }
      : { ...challenge, datasets: [dataset], solution: rowsQuery(hand.columns, hand.rows) };
    const checked = await grade(challenge.kind === "index" ? challenge.query : challenge.solution, probe);
    if (!checked.report?.allPassed) problems.push(`reference disagrees with the hand-checked rows for "${dataset.name}":\n${summarize(checked.report)}`);
  }
  return { id: challenge.id, problems, warnings, ms: solved.ms, checks: names.length };
}

if (SQL_REPORT_START_MARKER !== CHALLENGE_START_MARKER || SQL_REPORT_END_MARKER !== CHALLENGE_END_MARKER) {
  console.error("lib/sql-challenge.ts report markers differ from lib/python-challenge.ts.");
  process.exit(1);
}

const ids = SQL_CHALLENGES.map(challenge => challenge.id);
const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
const unknownHand = HAND_CHECKS.filter(hand => !ids.includes(hand.id)).map(hand => hand.id);
const only = new Set(process.argv.slice(2));
const targets = SQL_CHALLENGES.filter(challenge => !only.size || only.has(challenge.id));

const results = [];
let next = 0;
await Promise.all(Array.from({ length: PARALLEL }, async () => {
  while (next < targets.length) results.push(await verify(targets[next++]));
}));

const order = new Map(ids.map((id, i) => [id, i]));
results.sort((a, b) => order.get(a.id) - order.get(b.id));
for (const result of results) {
  const mark = result.problems.length ? "FAIL" : "ok  ";
  const detail = result.ms ? ` (${result.checks} checks, ${result.ms} ms)` : "";
  console.log(`${mark} ${result.id}${detail}`);
  for (const problem of result.problems) console.log(`  - ${problem.replace(/\n/g, "\n    ")}`);
  for (const warning of result.warnings) console.log(`  ! ${warning}`);
}
if (duplicates.length) console.log(`\nDuplicate challenge ids: ${duplicates.join(", ")}`);
if (unknownHand.length) console.log(`\nHand checks for unknown challenge ids: ${unknownHand.join(", ")}`);
const failed = results.filter(result => result.problems.length).length;
console.log(`\n${results.length - failed}/${results.length} SQL challenges verified (${HAND_CHECKS.filter(hand => targets.some(c => c.id === hand.id)).length} hand-checked results).`);
process.exit(failed || duplicates.length || unknownHand.length ? 1 : 0);
