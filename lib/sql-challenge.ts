// Builds the auto-graded SQL practice challenges for the Databases page.
// The page and the offline verifier both use buildSqlChallengeScript, so a challenge is graded by
// exactly the same script everywhere. The script runs on Python's built-in sqlite3 through
// POST /api/execute and prints the same report as lib/python-challenge.ts, between the same markers,
// so readChallengeReport parses it unchanged.
// No value imports: Node's type stripping loads this file directly in scripts/verify-sql-challenges.mjs.

/** Must match CHALLENGE_START_MARKER / CHALLENGE_END_MARKER in lib/python-challenge.ts. */
export const SQL_REPORT_START_MARKER = "JSON_OUTPUT_START";
export const SQL_REPORT_END_MARKER = "JSON_OUTPUT_END";
/** Seconds a single query may run before it is interrupted. */
export const SQL_CHECK_TIMEOUT_SECONDS = 2;
/** Seconds after interpreter start when remaining checks are skipped, keeping the report inside the server's ~6 s limit. */
export const SQL_RUN_BUDGET_SECONDS = 4.5;
/** Rows a query may return before it is reported as runaway (usually a missing join condition). */
export const SQL_MAX_ROWS = 1000;

export type SqlValue = string | number | null;
export type SqlDifficulty = "Easy" | "Medium" | "Hard";
export type SqlTopic =
  | "Filtering & sorting" | "Aggregation" | "Joins" | "Self-joins" | "Subqueries" | "NULL handling"
  | "Conditional aggregation" | "Deduplication" | "Window functions" | "CTEs" | "Dates" | "Indexing";

/** A column as [name, SQLite type and constraints], e.g. ["manager_id", "INTEGER REFERENCES employees(id)"]. */
export type SqlColumn = [name: string, type: string];
export interface SqlTable { name: string; columns: SqlColumn[] }
/** Seed rows per table name, positional in the table's column order. Missing tables start empty. */
export interface SqlDataset { name: string; rows: Record<string, SqlValue[][]> }

/** What EXPLAIN QUERY PLAN must show for one table of an index challenge's query. */
export interface SqlPlanRequirement {
  /** The table (or alias) as it appears in the plan, e.g. "orders" in "SEARCH orders USING INDEX ...". */
  table: string;
  /** Constraint terms the index search must include, e.g. ["customer_id=?", "created_at>?"]. */
  terms?: string[];
  /** Require USING COVERING INDEX (no table lookups). */
  covering?: boolean;
  /** Forbid USE TEMP B-TREE FOR ORDER BY. */
  noTempSort?: boolean;
}

interface SqlChallengeBase {
  id: string;
  title: string;
  topic: SqlTopic;
  difficulty: SqlDifficulty;
  /** Two or three sentences that teach the idea. */
  concept: string;
  /** The task, naming the exact output columns and ordering. */
  prompt: string;
  hint?: string;
  tables: SqlTable[];
  /** The first dataset is shown to the learner as sample data; the rest cover edge cases. */
  datasets: SqlDataset[];
  /** Compare rows in order (the prompt fixes the ordering) instead of as a multiset. */
  ordered: boolean;
  /** Runs, but is wrong. */
  starter: string;
  solution: string;
}
/** Write a query; each dataset's rows are compared with the reference solution's. */
export interface SqlQueryChallenge extends SqlChallengeBase { kind: "query" }
/** Write CREATE INDEX statements so `query` is planned with the required index access and still returns the same rows. */
export interface SqlIndexChallenge extends SqlChallengeBase { kind: "index"; query: string; plan: SqlPlanRequirement[] }
export type SqlChallenge = SqlQueryChallenge | SqlIndexChallenge;

type PlanCheck =
  | { kind: "search" | "covering" | "sorted"; table: string; name: string }
  | { kind: "terms"; table: string; terms: string[]; name: string };

/** CREATE TABLE statement for a table, as shown to the learner and executed by the grader. */
export function tableDdl(table: SqlTable): string {
  return `CREATE TABLE ${table.name} (\n${table.columns.map(([name, type]) => `  ${name} ${type}`).join(",\n")}\n);`;
}

function planChecks(challenge: SqlIndexChallenge): PlanCheck[] {
  return challenge.plan.flatMap((requirement): PlanCheck[] => [
    { kind: "search", table: requirement.table, name: `Query plan searches ${requirement.table} through your index (no full scan)` },
    ...(requirement.terms?.length ? [{ kind: "terms" as const, table: requirement.table, terms: requirement.terms, name: `Index search narrows by ${requirement.terms.join(" AND ")}` }] : []),
    ...(requirement.covering ? [{ kind: "covering" as const, table: requirement.table, name: `Covering index: the query never reads ${requirement.table} rows` }] : []),
    ...(requirement.noTempSort ? [{ kind: "sorted" as const, table: requirement.table, name: "ORDER BY comes from the index order (no temp B-tree sort)" }] : []),
  ]);
}

const resultCheckName = (challenge: SqlChallenge, dataset: SqlDataset) => challenge.kind === "index" ? `Same rows as without the index: ${dataset.name}` : dataset.name;

/** The checks a run reports, in order. */
export function sqlCheckNames(challenge: SqlChallenge): string[] {
  const results = challenge.datasets.map(dataset => resultCheckName(challenge, dataset));
  return challenge.kind === "index" ? [...planChecks(challenge).map(check => check.name), ...results] : results;
}

/** A Python string literal for `text` that is pure ASCII (\uXXXX / \UXXXXXXXX escapes for everything else). */
function pythonString(text: string): string {
  return JSON.stringify(text.replace(/\r\n?/g, "\n")).replace(/[^\x00-\x7f]/gu, char => {
    const point = char.codePointAt(0)!;
    return point > 0xffff ? `\\U${point.toString(16).padStart(8, "0")}` : `\\u${point.toString(16).padStart(4, "0")}`;
  });
}

function gradingSpec(challenge: SqlChallenge) {
  return {
    kind: challenge.kind,
    ordered: challenge.ordered,
    tables: challenge.tables.map(table => ({ name: table.name, ddl: tableDdl(table), width: table.columns.length })),
    datasets: challenge.datasets.map(dataset => ({ ...dataset, check: resultCheckName(challenge, dataset) })),
    reference: challenge.kind === "query" ? challenge.solution : challenge.query,
    planChecks: challenge.kind === "index" ? planChecks(challenge) : [],
  };
}

/**
 * Returns a complete Python script that grades `userSql` for `challenge` with sqlite3 and prints a
 * python-challenge report. Query challenges run the learner's single statement and the reference
 * solution on a fresh in-memory database per dataset and compare the rows. Index challenges apply the
 * learner's CREATE INDEX statements, check EXPLAIN QUERY PLAN for the challenge's query, and confirm
 * the query still returns the rows it returned without the indexes.
 */
export function buildSqlChallengeScript(userSql: string, challenge: SqlChallenge): string {
  return String.raw`# Generated by InterviewOS: grades your SQL with SQLite.
import json
import re
import sqlite3
import sys
import time

STARTED = time.perf_counter()
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except Exception:
        pass

SPEC = json.loads(${pythonString(JSON.stringify(gradingSpec(challenge)))})
USER_SQL = ${pythonString(userSql)}
CHECK_TIMEOUT = ${SQL_CHECK_TIMEOUT_SECONDS}
BUDGET = ${SQL_RUN_BUDGET_SECONDS}
MAX_ROWS = ${SQL_MAX_ROWS}
SHOW_ROWS = 8
TOLERANCE = 1e-6
MIN_VERSION = (3, 25, 0)
NUMBER = re.compile(r"^\s*[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?\s*$")
INDEX_DDL = re.compile(r"^CREATE\s+(UNIQUE\s+)?INDEX\b", re.IGNORECASE)


class Problem(Exception):
    """A failure explained to the learner, shown without a traceback."""


def clip(text, limit=3000):
    text = str(text)
    return text if len(text) <= limit else text[:limit] + "\n... [truncated]"


def one_line(sql, limit=120):
    text = " ".join(sql.split())
    return text if len(text) <= limit else text[:limit - 3] + "..."


def split_sql(text):
    """Splits on semicolons outside strings, quoted names and comments. Comments are dropped."""
    statements, current, i, n = [], [], 0, len(text)
    while i < n:
        char = text[i]
        if text.startswith("--", i):
            end = text.find("\n", i)
            i = n if end < 0 else end
            current.append(" ")
        elif text.startswith("/*", i):
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            current.append(" ")
        elif char in "'\"${"`"}[":
            close = "]" if char == "[" else char
            j = i + 1
            while j < n:
                if text[j] == close:
                    if close != "]" and text.startswith(close * 2, j):
                        j += 2
                        continue
                    break
                j += 1
            current.append(text[i:j + 1])
            i = j + 1
        elif char == ";":
            statement = "".join(current).strip()
            if statement:
                statements.append(statement)
            current = []
            i += 1
        else:
            current.append(char)
            i += 1
    statement = "".join(current).strip()
    if statement:
        statements.append(statement)
    return statements


def build(dataset):
    conn = sqlite3.connect(":memory:", isolation_level=None)
    conn.execute("BEGIN")
    for table in SPEC["tables"]:
        conn.execute(table["ddl"])
        rows = dataset["rows"].get(table["name"]) or []
        if rows:
            marks = ", ".join("?" for _ in range(table["width"]))
            conn.executemany("INSERT INTO %s VALUES (%s)" % (table["name"], marks), rows)
    conn.execute("COMMIT")
    return conn


def sqlite_error(error):
    return "SQLite error: %s" % error


def run(conn, sql, limit):
    deadline = time.perf_counter() + limit
    conn.set_progress_handler(lambda: 1 if time.perf_counter() > deadline else 0, 1000)
    try:
        cursor = conn.execute(sql)
        if cursor.description is None:
            raise Problem("Your statement ran but returned no result set. Write a single SELECT (or WITH ... SELECT) query.")
        columns = [str(item[0]) for item in cursor.description]
        rows = cursor.fetchmany(MAX_ROWS + 1)
    except sqlite3.OperationalError as error:
        if "interrupted" in str(error):
            raise Problem("Timed out after %.1fs. Look for an accidental cross join or a recursive CTE that never stops." % limit)
        raise
    finally:
        conn.set_progress_handler(None, 0)
    if len(rows) > MAX_ROWS:
        raise Problem("Your query returned more than %d rows. Check for a missing join condition: a cross join multiplies rows." % MAX_ROWS)
    return columns, [tuple(row) for row in rows]


def show(value):
    if value is None:
        return "NULL"
    if isinstance(value, float):
        if value != value or value in (float("inf"), float("-inf")):
            return repr(value)
        text = ("%.6f" % value).rstrip("0")
        return text + "0" if text.endswith(".") else text
    if isinstance(value, int):
        return str(value)
    if isinstance(value, bytes):
        return "x'%s'" % value.hex()[:40]
    text = str(value)
    if len(text) > 40:
        text = text[:37] + "..."
    if text == "" or text != text.strip() or text.upper() == "NULL" or NUMBER.match(text):
        return "'%s'" % text
    return text


def table(columns, rows, start=0):
    cells = [[show(value) for value in row] for row in rows[start:start + SHOW_ROWS]]
    widths = [max([len(name)] + [len(row[i]) for row in cells]) for i, name in enumerate(columns)]
    lines = ["  " + " | ".join(name.ljust(widths[i]) for i, name in enumerate(columns)).rstrip(),
             "  " + "-+-".join("-" * width for width in widths)]
    if start:
        lines.append("  ... %d earlier" % start)
    lines += ["  " + " | ".join(cell.ljust(widths[i]) for i, cell in enumerate(row)).rstrip() for row in cells]
    if not rows:
        lines.append("  (no rows)")
    elif len(rows) > start + SHOW_ROWS:
        lines.append("  ... %d more" % (len(rows) - start - SHOW_ROWS))
    return "\n".join(lines)


def count(n, word):
    return "%d %s%s" % (n, word, "" if n == 1 else "s")


def same(a, b):
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return abs(a - b) <= TOLERANCE * max(1.0, abs(a), abs(b))
    return type(a) is type(b) and a == b


def same_row(a, b):
    return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))


def unmatched(expected, rows):
    extra, missing = list(rows), []
    for row in expected:
        for i, candidate in enumerate(extra):
            if same_row(row, candidate):
                del extra[i]
                break
        else:
            missing.append(row)
    return missing, extra


def row_text(row):
    return "(" + ", ".join(show(value) for value in row) + ")"


def row_list(label, rows):
    shown = "; ".join(row_text(row) for row in rows[:3])
    more = " and %d more" % (len(rows) - 3) if len(rows) > 3 else ""
    return "%s: %s%s" % (label, shown, more)


def side_by_side(expected_columns, expected, columns, rows, start=0):
    return "Expected (%s):\n%s\n\nYours (%s):\n%s" % (count(len(expected), "row"), table(expected_columns, expected, start), count(len(rows), "row"), table(columns, rows, start))


def compare(expected_columns, expected, columns, rows):
    both = side_by_side(expected_columns, expected, columns, rows)
    if len(columns) != len(expected_columns):
        return "Your query returns %s (%s); expected %d: %s.\n\n%s" % (count(len(columns), "column"), ", ".join(columns), len(expected_columns), ", ".join(expected_columns), both)
    problems = []
    if [name.lower() for name in columns] != [name.lower() for name in expected_columns]:
        problems.append("Column names differ: expected %s; got %s. Name each output column with AS, in the order the prompt lists them." % (", ".join(expected_columns), ", ".join(columns)))
    missing, extra = unmatched(expected, rows)
    if missing or extra:
        if len(rows) != len(expected):
            problems.append("Expected %s, got %d." % (count(len(expected), "row"), len(rows)))
        else:
            problems.append("Right number of rows, but some values differ.")
        if missing:
            problems.append(row_list("Missing from yours", missing))
        if extra:
            problems.append(row_list("Not expected", extra))
        if extra and not missing and all(any(same_row(row, candidate) for row in expected) for candidate in extra):
            problems.append("Every expected row is there, but some appear more than once: a join may be multiplying rows (EXISTS, DISTINCT or GROUP BY can fix that).")
    elif SPEC["ordered"]:
        first = next((i for i, (a, b) in enumerate(zip(expected, rows)) if not same_row(a, b)), None)
        if first is not None:
            problems.append("Right rows, wrong order: row %d differs. Check the ORDER BY columns, directions and tie-breakers the prompt asks for." % (first + 1))
            if first >= SHOW_ROWS:
                both = side_by_side(expected_columns, expected, columns, rows, first - 2)
    if not problems:
        return None
    return "\n".join(problems) + "\n\n" + both


def entry(name):
    return {"name": name, "passed": False}


def out_of_time():
    return BUDGET - (time.perf_counter() - STARTED) < 0.1


def time_left():
    return max(0.1, min(CHECK_TIMEOUT, BUDGET - (time.perf_counter() - STARTED)))


def reference_rows(conn, dataset):
    try:
        return run(conn, SPEC["reference"], CHECK_TIMEOUT)
    except Exception as error:
        raise RuntimeError("The challenge's reference query failed on '%s': %s" % (dataset["name"], error))


def grade_query(report, statement):
    for index, dataset in enumerate(SPEC["datasets"]):
        result = entry(dataset["check"])
        report["results"].append(result)
        if out_of_time():
            result["error"] = "Not run: earlier checks used up this run's time budget."
            continue
        conn = build(dataset)
        try:
            expected_columns, expected = reference_rows(conn, dataset)
            conn.execute("PRAGMA query_only = ON")
            try:
                columns, rows = run(conn, statement, time_left())
            except Problem as problem:
                result["error"] = str(problem)
                continue
            except Exception as error:
                result["error"] = sqlite_error(error)
                continue
            failure = compare(expected_columns, expected, columns, rows)
            if failure:
                result["error"] = clip(failure)
            else:
                result["passed"] = True
                if index == 0:
                    result["output"] = clip("Your result:\n" + table(columns, rows), 1500)
        finally:
            conn.close()


def apply_indexes(conn, statements):
    for statement in statements:
        try:
            conn.execute(statement)
        except Exception as error:
            raise Problem("Your index statement failed on this data:\n  %s\n%s" % (one_line(statement), sqlite_error(error)))


def access_line(lines, name):
    pattern = re.compile(r"^(SCAN|SEARCH)( TABLE)? %s\b" % re.escape(name))
    return next((line for line in lines if pattern.match(line)), None)


def plan_failure(check, lines):
    line = access_line(lines, check["table"])
    if line is None:
        return "The plan has no step for %s, so this check can't run. This is a problem with the challenge." % check["table"]
    if check["kind"] == "search":
        if "AUTOMATIC" in line:
            return "SQLite built a temporary automatic index for this one query. Create a real index instead."
        if line.startswith("SCAN"):
            if "INDEX" in line:
                return "SQLite walks the whole index from start to end (SCAN ... USING INDEX) instead of jumping to the matching entries: the index's first column isn't the one the WHERE clause filters on."
            return "Full table scan: no index matches what the WHERE clause filters on, so SQLite reads every row of %s." % check["table"]
        if not re.search(r"USING (COVERING )?INDEX ", line):
            return "SQLite searches %s without using one of your indexes." % check["table"]
        return None
    if check["kind"] == "terms":
        match = re.search(r"\(([^()]*)\)\s*$", line)
        used = match.group(1) if match and "INDEX" in line else ""
        lacking = [term for term in check["terms"] if term not in used]
        if not lacking:
            return None
        if not used:
            return "The plan doesn't search %s through an index yet." % check["table"]
        return "Your index narrows only by (%s); it should also narrow by %s. In a composite index, put equality columns first, then the range or sort column." % (used, " AND ".join(lacking))
    if check["kind"] == "covering":
        if "USING COVERING INDEX" in line:
            return None
        return "SQLite finds the rows through an index, then reads each table row to get the other columns. Add every column the query reads to the index so it covers the query."
    if any("TEMP B-TREE" in item and "ORDER BY" in item for item in lines):
        return "SQLite sorts the results in a temporary B-tree. Put the ORDER BY column in the index right after the equality column(s), so rows come out of the index already sorted."
    return None


def grade_index(report, statements):
    checks = SPEC["planChecks"]
    first = SPEC["datasets"][0]
    lines, setup_error = [], None
    conn = build(first)
    try:
        apply_indexes(conn, statements)
        lines = [str(row[3]) for row in conn.execute("EXPLAIN QUERY PLAN " + SPEC["reference"])]
    except Problem as problem:
        setup_error = str(problem)
    finally:
        conn.close()
    shown = "Query plan:\n" + "\n".join("  " + line for line in lines)
    for index, check in enumerate(checks):
        result = entry(check["name"])
        report["results"].append(result)
        failure = setup_error or plan_failure(check, lines)
        if failure:
            result["error"] = clip(failure if setup_error else failure + "\n\n" + shown)
        else:
            result["passed"] = True
            if index == 0:
                result["output"] = shown
    for dataset in SPEC["datasets"]:
        result = entry(dataset["check"])
        report["results"].append(result)
        if out_of_time():
            result["error"] = "Not run: earlier checks used up this run's time budget."
            continue
        conn = build(dataset)
        try:
            expected_columns, expected = reference_rows(conn, dataset)
            try:
                apply_indexes(conn, statements)
                columns, rows = run(conn, SPEC["reference"], time_left())
            except Problem as problem:
                result["error"] = str(problem)
                continue
            failure = compare(expected_columns, expected, columns, rows)
            if failure:
                result["error"] = clip("With your indexes the query returns different rows.\n" + failure)
            else:
                result["passed"] = True
        finally:
            conn.close()


def not_run(report, names, reason):
    for name in names:
        report["results"].append({"name": name, "passed": False, "error": reason})


def check_names():
    return [check["name"] for check in SPEC["planChecks"]] + [dataset["check"] for dataset in SPEC["datasets"]]


def main():
    report = {"kind": "python-challenge", "version": 1, "results": []}
    try:
        if sqlite3.sqlite_version_info < MIN_VERSION:
            report["error"] = "Your Python ships SQLite %s, but these challenges need 3.25 or newer for window functions. Install a recent Python (3.8+ ships a newer SQLite)." % sqlite3.sqlite_version
            not_run(report, check_names(), "Not run: SQLite is too old.")
            return report
        statements = split_sql(USER_SQL)
        if SPEC["kind"] == "index":
            others = [statement for statement in statements if not INDEX_DDL.match(statement)]
            if not statements:
                report["loadError"] = "Write at least one CREATE INDEX statement."
            elif others:
                report["loadError"] = "Only CREATE INDEX statements run here (found: %s). The checks run EXPLAIN QUERY PLAN for you and show the plan." % one_line(others[0], 80)
        elif not statements:
            report["loadError"] = "Write a SELECT query first."
        elif len(statements) > 1:
            report["loadError"] = "Found %d SQL statements. Each check runs exactly one query, so keep only your SELECT (a trailing semicolon is fine)." % len(statements)
        if "loadError" in report:
            not_run(report, check_names(), "Not run: fix the problem above first.")
        elif SPEC["kind"] == "index":
            grade_index(report, statements)
        else:
            grade_query(report, statements[0])
    except Exception as error:
        report["error"] = clip("The checks could not run: %s: %s" % (type(error).__name__, error))
    return report


if __name__ == "__main__":
    REPORT = main()
    RESULTS = REPORT["results"]
    REPORT["allPassed"] = bool(RESULTS) and all(item["passed"] for item in RESULTS) and "error" not in REPORT and "loadError" not in REPORT
    sys.stdout.write("\n${SQL_REPORT_START_MARKER}\n" + json.dumps(REPORT) + "\n${SQL_REPORT_END_MARKER}\n")
    sys.stdout.flush()
`;
}
