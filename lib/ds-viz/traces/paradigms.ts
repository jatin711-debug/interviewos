import type { GridPanel, Panel, TraceRegistry, Tone, TreeNode } from "../types";
import { Recorder, array, span, text, tones, vars } from "../helpers";

/** A mutable call-tree node, converted to a panel at each step. */
interface Call { label: string; sub?: string; tone?: Tone; children: Call[] }
const callTree = (root: Call, title: string, binary = false): Panel => {
  const conv = (c: Call): TreeNode => ({ label: c.label, sub: c.sub, tone: c.tone, children: c.children.map(conv) });
  return { type: "tree", title, binary, root: conv(root) };
};

function divideConquer() {
  const pw = new Recorder();
  const calls: Call[] = [];
  let n = 10;
  const root: Call = { label: "n=10", children: [] };
  calls.push(root);
  pw.step("power(2, 10): instead of multiplying 2 ten times, compute power(2, 5) once and square it.", callTree(root, "Calls (each halves n)"));
  let cur = root;
  while (n > 0) {
    const parent = n;
    n = Math.floor(n / 2);
    const next: Call = { label: `n=${n}`, children: [], tone: "active" };
    calls.forEach(c => { if (c.tone === "active") c.tone = "compare"; });
    cur.children.push(next); calls.push(next); cur = next;
    pw.step(n === 0 ? "power(2, 0) is the base case: the answer is 1. Now the answers flow back up." : `power(2, ${parent}) needs power(2, ${n}), since ${parent} // 2 = ${n}. n halves at every level.`, callTree(root, "Calls (each halves n)"));
  }
  const values = [1, 2, 4, 32, 1024];
  const ns = [0, 1, 2, 5, 10];
  for (let i = calls.length - 1; i >= 0; i--) {
    const k = calls.length - 1 - i;
    calls[i].tone = "done"; calls[i].sub = `= ${values[k]}`;
    pw.step(k === 0 ? "Base case returns 1." : `n=${ns[k]}: half = ${values[k - 1]}, so ${ns[k] % 2 === 0 ? `half × half = ${values[k]}` : `half × half × 2 = ${values[k]} (n is odd)`}.`, callTree(root, "Calls (each halves n)"));
  }
  pw.step("2¹⁰ = 1024 with only 5 levels of calls. In general it takes about log₂ n multiplications instead of n. For n = 1,000,000 that's about 20.", callTree(root, "Calls (each halves n)"));

  const mx = new Recorder();
  const items = [3, 8, 2, 9, 4, 7, 1, 6];
  const node = (lo: number, hi: number): Call => ({ label: lo === hi ? String(items[lo]) : `${lo}..${hi}`, children: lo === hi ? [] : [node(lo, (lo + hi) >> 1), node(((lo + hi) >> 1) + 1, hi)] });
  const tree = node(0, items.length - 1);
  mx.step("Find the biggest of 8 numbers by splitting. Divide: each range splits in half until single items remain (the base case).", callTree(tree, "Recursion tree", true), array(items, { title: "items" }));
  const solve = (c: Call, lo: number, hi: number): number => {
    if (lo === hi) { c.tone = "done"; return items[lo]; }
    const mid = (lo + hi) >> 1;
    const a = solve(c.children[0], lo, mid), b = solve(c.children[1], mid + 1, hi);
    c.label = String(Math.max(a, b)); c.sub = `${lo}..${hi}`; c.tone = "new";
    mx.step(`Combine ${lo}..${hi}: max(${a}, ${b}) = ${Math.max(a, b)}. Each parent needs just one comparison of its children's answers.`, callTree(tree, "Recursion tree", true), array(items, { title: "items", tones: tones(span(lo, hi), "compare") }));
    c.tone = "done";
    return Math.max(a, b);
  };
  const best = solve(tree, 0, items.length - 1);
  mx.step(`The answer ${best} reached the root. There are log₂ 8 = 3 levels, and the work across each level is O(n).`, callTree(tree, "Recursion tree", true), array(items, { title: "items", tones: { [items.indexOf(best)]: "found" } }));
  return [
    pw.visual("Fast power: power(2, 10)", "Computing 2¹⁰ by halving n. Watch the chain of calls go down (n = 10, 5, 2, 1, 0), then answers come back up by squaring.", { active: "Current call", compare: "Waiting for its child", done: "Returned (value shown)" }),
    mx.visual("Max by splitting", "Finding the biggest of 8 numbers. Watch answers bubble up the recursion tree: each parent compares just its two children's answers.", { new: "Combined just now", done: "Solved", compare: "Range being combined", found: "Answer" }),
  ];
}

function backtracking() {
  const sub = new Recorder();
  const items = [1, 2, 3];
  const root: Call = { label: "{}", children: [] };
  const results: string[] = [];
  const all: Call[] = [];
  const explore = (i: number, current: number[], node: Call) => {
    all.forEach(c => { if (c.tone === "active") c.tone = "compare"; });
    node.tone = "active";
    if (i === items.length) {
      results.push(`{${current.join(",")}}`);
      node.tone = "found";
      sub.step(`Every item has been decided: record {${current.join(", ")}}, then backtrack (undo the last choice).`, callTree(root, "Decision tree (left = take, right = skip)", true), text([results.join("  ")], "Subsets found"));
      return;
    }
    const take: Call = { label: `{${[...current, items[i]].join(",")}}`, edgeLabel: undefined, children: [] } as Call;
    node.children.push(take); all.push(take);
    sub.step(`Decide on ${items[i]}. Choice 1: TAKE it. current.append(${items[i]}) gives [${[...current, items[i]].join(", ")}].`, callTree(root, "Decision tree (left = take, right = skip)", true), text([results.join("  ")], "Subsets found"));
    explore(i + 1, [...current, items[i]], take);
    const skip: Call = { label: `{${current.join(",")}}`, children: [] };
    node.children.push(skip); all.push(skip);
    all.forEach(c => { if (c.tone === "active") c.tone = "compare"; });
    node.tone = "active";
    sub.step(`Back at the decision on ${items[i]}: undo with current.pop(). Choice 2: SKIP ${items[i]}, so current stays [${current.join(", ")}].`, callTree(root, "Decision tree (left = take, right = skip)", true), text([results.join("  ")], "Subsets found"));
    explore(i + 1, current, skip);
    node.tone = "done";
  };
  all.push(root);
  sub.step("Subsets of [1, 2, 3]: for each item we make one yes/no decision. The decisions form a tree, and backtracking walks it depth-first.", callTree(root, "Decision tree (left = take, right = skip)", true), text([], "Subsets found"));
  explore(0, [], root);
  sub.step(`All 2³ = 8 subsets found. Every leaf of the decision tree is one subset.`, callTree(root, "Decision tree (left = take, right = skip)", true), text([results.join("  ")], "Subsets found"));

  const q = new Recorder();
  const n = 4;
  const cols: number[] = [];
  const board = (row: number | null = null, col: number | null = null, tone: Tone = "active"): GridPanel => {
    const cells: string[][] = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (cols[r] === c ? "Q" : "")));
    const t: Record<string, Tone> = {};
    cols.forEach((c, r) => { t[`${r},${c}`] = "done"; });
    if (row !== null && col !== null) { t[`${row},${col}`] = tone; if (tone === "active") cells[row][col] = "Q"; if (tone === "removed") cells[row][col] = "✗"; }
    return { type: "grid", title: "Board (one queen per row)", cells, rowLabels: ["row 0", "row 1", "row 2", "row 3"], colLabels: ["0", "1", "2", "3"], tones: t };
  };
  q.step("4-Queens: place 4 queens so that no two share a row, column or diagonal. We fill one row at a time, trying columns left to right.", board());
  const safe = (row: number, col: number) => cols.every((c, r) => c !== col && Math.abs(c - col) !== row - r);
  const place = (row: number): boolean => {
    if (row === n) return true;
    for (let col = 0; col < n; col++) {
      if (!safe(row, col)) { q.step(`Row ${row}, column ${col}: attacked by an earlier queen (same column or diagonal). Prune it and don't explore further.`, board(row, col, "removed")); continue; }
      cols.push(col);
      q.step(row === n - 1 ? `Row ${row}, column ${col} is safe. That's a queen in every row, so we have a solution!` : `Row ${row}, column ${col} is safe. Place a queen and move on to row ${row + 1}.`, board(row, col, "new"));
      if (place(row + 1)) return true;
      cols.pop();
      q.step(`Every column in row ${row + 1} failed, so this queen at (${row}, ${col}) leads to a dead end. BACKTRACK: remove it and try the next column.`, board(row, col, "compare"));
    }
    return false;
  };
  place(0);
  q.step(`Solved: columns ${cols.join(", ")} (one per row). Pruning skipped almost all of the 4⁴ = 256 possible placements.`, board());
  return [
    sub.visual("Subsets: the decision tree", "All subsets of [1, 2, 3]. Each level decides one item (left = take, right = skip). Watch the path go deep, record a leaf, then back up.", { active: "Current decision", compare: "On the current path", found: "Complete subset", done: "Fully explored" }),
    q.visual("4-Queens", "Place 4 queens, one per row, so that none attack each other. Watch red ✗ squares get pruned, and watch a queen being removed when a row below has no safe square (backtracking).", { new: "Queen placed", removed: "Attacked: pruned", compare: "Removed (backtrack)", done: "Queen" }),
  ];
}

function dpBasics() {
  const naive = new Recorder();
  const counts: Record<number, number> = {};
  const build = (k: number): Call => { counts[k] = (counts[k] ?? 0) + 1; return { label: `f${k}`, children: k < 2 ? [] : [build(k - 1), build(k - 2)] }; };
  const tree = build(5);
  const colour = (c: Call, target: number, tone: Tone) => { if (c.label === `f${target}`) c.tone = tone; c.children.forEach(x => colour(x, target, tone)); };
  naive.step(`Plain recursion for fib(5) makes ${Object.values(counts).reduce((a, b) => a + b, 0)} calls. Each node is a call, and fib(k) is written fk.`, callTree(tree, "Call tree of fib(5)", true));
  colour(tree, 3, "removed");
  naive.step(`fib(3) is computed ${counts[3]} times. Each time it redoes the same work.`, callTree(tree, "Call tree of fib(5)", true));
  colour(tree, 2, "compare");
  naive.step(`fib(2) is computed ${counts[2]} times. The repeats grow exponentially with n: fib(30) needs over 2.6 million calls for just 31 different questions.`, callTree(tree, "Call tree of fib(5)", true));
  const memoTree: Call = { label: "f5", children: [{ label: "f4", children: [{ label: "f3", children: [{ label: "f2", children: [{ label: "f1", children: [] }, { label: "f0", children: [] }] }, { label: "f1", children: [] }] }, { label: "f2", sub: "memo", tone: "found", children: [] }] }, { label: "f3", sub: "memo", tone: "found", children: [] }] };
  naive.step("With memoization, a second call to fib(3) or fib(2) just reads the saved answer (green), so whole subtrees disappear. Now each fib(k) is computed once: O(n).", callTree(memoTree, "Call tree with a memo", true));

  const table = new Recorder();
  const coins = [1, 2, 5], amount = 11;
  const best: (number | null)[] = [0, ...Array(amount).fill(null)];
  const show = (t: Record<number, Tone> = {}) => array(best.map(b => (b === null ? "∞" : b)), { title: "best[a] = fewest coins for amount a", tones: t });
  table.step("Bottom-up coin change with coins 1, 2, 5. best[0] = 0 (the base case). We fill a = 1, 2, … 11 in order, so smaller amounts are always ready.", show({ 0: "done" }));
  for (let a = 1; a <= amount; a++) {
    const options = coins.filter(c => c <= a).map(c => ({ c, v: (best[a - c] as number) + 1 }));
    const pick = options.reduce((x, y) => (y.v < x.v ? y : x));
    best[a] = pick.v;
    if (a <= 6 || a === 11) table.step(`a = ${a}: try each coin. ${options.map(o => `coin ${o.c} → best[${a - o.c}] + 1 = ${o.v}`).join("; ")}. The minimum is ${pick.v}.`, show({ ...tones(options.map(o => a - o.c), "compare"), [a - pick.c]: "path", [a]: "new" }));
    else if (a === 7) table.step("a = 7 to 10 are filled the same way, and each uses only cells to its left.", show({ [a]: "new" }));
  }
  table.step("best[11] = 3 (5 + 5 + 1). The whole table took 12 cells × 3 coins = 36 small steps. Compare that with trying every combination of coins.", show({ 11: "found" }));
  return [
    naive.visual("Why plain recursion is slow", "The call tree of fib(5). Watch how many times fib(3) and fib(2) are recomputed, and how a memo cuts those whole subtrees away.", { removed: "fib(3): repeated", compare: "fib(2): repeated", found: "Read from the memo" }),
    table.visual("Tabulation: coin change", "Coins 1, 2, 5 and amount 11. Watch each cell best[a] being built from cells to its left: one coin plus the best answer for what remains.", { done: "Base case", compare: "Options looked at", path: "Best option", new: "Just filled", found: "Answer" }),
  ];
}

function dp2d() {
  const lcs = new Recorder();
  const a = "ABCBD", b = "BDCAB";
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  const grid = (t: Record<string, Tone> = {}, upto?: [number, number]): GridPanel => ({ type: "grid", title: "dp[i][j] = LCS of a[:i] and b[:j]", rowLabels: ["∅", ...a.split("")], colLabels: ["∅", ...b.split("")], cells: dp.map((row, i) => row.map((v, j) => (upto && (i > upto[0] || (i === upto[0] && j > upto[1])) && i > 0 && j > 0 ? null : v))), tones: t });
  lcs.step(`Strings a = "${a}" (rows) and b = "${b}" (columns). Row ∅ and column ∅ are 0, because an empty string shares nothing.`, grid({}, [0, 0]));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    const match = a[i - 1] === b[j - 1];
    dp[i][j] = match ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    if (i <= 2 || (i === a.length && j === b.length) || (match && i <= 4)) lcs.step(match ? `a[${i - 1}] = '${a[i - 1]}' matches b[${j - 1}] = '${b[j - 1]}': extend the diagonal, ${dp[i - 1][j - 1]} + 1 = ${dp[i][j]}.` : `'${a[i - 1]}' ≠ '${b[j - 1]}': take the better of up (${dp[i - 1][j]}) and left (${dp[i][j - 1]}), which is ${dp[i][j]}.`, grid(match ? { [`${i - 1},${j - 1}`]: "compare", [`${i},${j}`]: "new" } : { [`${i - 1},${j}`]: "compare", [`${i},${j - 1}`]: "compare", [`${i},${j}`]: "new" }, [i, j]));
  }
  const path: Record<string, Tone> = {};
  let i = a.length, j = b.length; const letters: string[] = [];
  while (i > 0 && j > 0) { if (a[i - 1] === b[j - 1]) { path[`${i},${j}`] = "found"; letters.push(a[i - 1]); i--; j--; } else { path[`${i},${j}`] = "path"; if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--; } }
  lcs.step(`The answer is the bottom-right cell: ${dp[a.length][b.length]}. Walking back (diagonal on a match, otherwise toward the bigger neighbour) spells out "${letters.reverse().join("")}".`, grid(path));

  const ks = new Recorder();
  const items: [string, number, number][] = [["book", 1, 15], ["lamp", 3, 20], ["radio", 4, 30]];
  const W = 5;
  const k = Array.from({ length: items.length + 1 }, () => Array(W + 1).fill(0));
  const kg = (t: Record<string, Tone> = {}, filled = 0): GridPanel => ({ type: "grid", title: "dp[i][w] = best value, first i items, capacity w", rowLabels: ["none", ...items.map(([n, w, v]) => `${n} (w${w}, $${v})`)], colLabels: span(0, W).map(w => `w=${w}`), cells: k.map((row, r) => row.map((v, c) => (r > filled ? null : v))), tones: t });
  ks.step("0/1 knapsack, capacity 5. Row 'none' is all 0, because with no items there's no value. Each row decides one more item: skip it or take it.", kg({}, 0));
  items.forEach(([name, wt, val], idx) => {
    const r = idx + 1;
    for (let w = 0; w <= W; w++) k[r][w] = Math.max(k[r - 1][w], wt <= w ? k[r - 1][w - wt] + val : -1);
    const w = W;
    ks.step(`Row ${name}: for each capacity w, skip it (copy the cell above) or, if it fits, take it (${val} + the best value for the remaining capacity w − ${wt}, read from the row above). At w = ${w}: skip = ${k[r - 1][w]}, take = ${wt <= w ? `${val} + ${k[r - 1][w - wt]} = ${val + k[r - 1][w - wt]}` : "doesn't fit"}.`, kg({ [`${r - 1},${w}`]: "compare", ...(wt <= w ? { [`${r - 1},${w - wt}`]: "path" } : {}), [`${r},${w}`]: "new" }, r));
  });
  ks.step(`Best value with capacity 5: ${k[items.length][W]} (book + radio = 1 + 4 kg). Every cell was O(1), so the table costs O(items × capacity).`, kg({ [`${items.length},${W}`]: "found" }, items.length));
  return [
    lcs.visual("Longest common subsequence", "a = \"ABCBD\" (rows) and b = \"BDCAB\" (columns). Watch matches extend the diagonal, then the walk back from the corner that spells the answer.", { compare: "Cells it depends on", new: "Just filled", found: "Match on the answer path", path: "Walk-back path" }),
    ks.visual("0/1 knapsack", "Items book (1 kg, $15), lamp (3 kg, $20), radio (4 kg, $30) and capacity 5. Watch each row choose between 'skip' (the cell above) and 'take'.", { compare: "Skip (cell above)", path: "Take (row above, w − weight)", new: "Just filled", found: "Answer" }),
  ];
}

function dpAdvanced() {
  const lis = new Recorder();
  const nums = [3, 1, 4, 1, 5, 9, 2, 6];
  const tails: number[] = [];
  lis.step("Longest increasing subsequence. tails[k] = the smallest possible last value of an increasing run of length k + 1. It starts empty.", array(nums, { title: "Input" }), array(tails, { title: "tails", empty: "[]" }));
  nums.forEach((x, i) => {
    let lo = 0, hi = tails.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (tails[m] < x) lo = m + 1; else hi = m; }
    const grow = lo === tails.length;
    const old = tails[lo];
    if (grow) tails.push(x); else tails[lo] = x;
    lis.step(grow ? `${x} is bigger than every tail, so it extends the longest run. Append it: the length is now ${tails.length}.` : old === x ? `${x}: tails[${lo}] is already ${x}, so nothing improves.` : `${x}: the first tail ≥ ${x} is ${old} at index ${lo}. Replace it, because a run of length ${lo + 1} can now end at the smaller value ${x}, which is easier to extend later.`, array(nums, { title: "Input", tones: { ...tones(span(0, i - 1), "muted"), [i]: "active" } }), array(tails, { title: "tails", tones: { [lo]: grow ? "new" : "compare" } }));
  });
  lis.step(`The answer is len(tails) = ${tails.length}. (tails = [${tails.join(", ")}] isn't itself a valid subsequence; one real answer is 1, 4, 5, 9.) Each step is one binary search: O(n log n).`, array(tails, { title: "tails", tones: tones(span(0, tails.length - 1), "found") }));

  const pal = new Recorder();
  const s = "character", n = s.length;
  const dp: (number | null)[][] = Array.from({ length: n }, () => Array(n).fill(null));
  const g = (t: Record<string, Tone> = {}): GridPanel => ({ type: "grid", title: "dp[i][j] = longest palindromic subsequence of s[i..j]", rowLabels: s.split("").map((c, i) => `${i} ${c}`), colLabels: s.split("").map((c, j) => `${j} ${c}`), cells: dp.map((row, i) => row.map((v, j) => (j < i ? "" : v))), tones: t });
  for (let i = 0; i < n; i++) dp[i][i] = 1;
  pal.step(`s = "${s}". Interval DP fills the table by interval LENGTH. Length 1 (the diagonal): every single character is a palindrome of length 1.`, g(Object.fromEntries(span(0, n - 1).map(i => [`${i},${i}`, "new" as Tone]))));
  for (let len = 2; len <= n; len++) {
    const changed: Record<string, Tone> = {};
    let example = "";
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      const inner = len === 2 ? 0 : (dp[i + 1][j - 1] as number);
      dp[i][j] = s[i] === s[j] ? inner + 2 : Math.max(dp[i + 1][j] as number, dp[i][j - 1] as number);
      changed[`${i},${j}`] = s[i] === s[j] ? "found" : "new";
      if (s[i] === s[j] && !example) example = ` For example s[${i}] = s[${j}] = '${s[i]}', so dp[${i}][${j}] = inside (${inner}) + 2 = ${dp[i][j]}.`;
    }
    if (len <= 3 || len === n || example) pal.step(`Length ${len}: each cell needs only shorter intervals, which are already filled. If the ends match, it's inside + 2; otherwise drop one end and take the max.${example}`, g(changed));
  }
  pal.step(`dp[0][${n - 1}] = ${dp[0][n - 1]}: the longest palindromic subsequence of "${s}" has length ${dp[0][n - 1]} ("carac").`, g({ [`0,${n - 1}`]: "found" }));
  return [
    lis.visual("LIS with a tails array", "Numbers 3, 1, 4, 1, 5, 9, 2, 6. Watch tails either grow (a longer run) or get a smaller value swapped in (an easier run to extend).", { active: "Current number", muted: "Already processed", new: "Appended (longer run)", compare: "Replaced (smaller tail)", found: "Answer = length" }),
    pal.visual("Interval DP: palindromes", "s = \"character\". Watch the table fill diagonal by diagonal, from short intervals to long ones, and watch for cells where both ends match.", { new: "Filled this round", found: "Ends match (+2)" }),
  ];
}

function greedy() {
  const r = new Recorder();
  const meetings: [number, number][] = [[1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14], [12, 16]];
  const sorted = meetings.slice().sort((x, y) => x[1] - y[1]);
  const T = 16;
  const status: Tone[] = sorted.map(() => "default");
  const timeline = (current?: number): GridPanel => ({
    type: "grid", title: "Meetings sorted by END time (each row is one meeting on a 0–16 timeline)",
    rowLabels: sorted.map(([s, e]) => `${s}–${e}`), colLabels: span(0, T - 1).map(String),
    cells: sorted.map(([s, e]) => span(0, T - 1).map(t => (t >= s && t < e ? "■" : ""))),
    tones: Object.fromEntries(sorted.flatMap(([s, e], i) => span(s, e - 1).map(t => [`${i},${t}`, i === current ? (status[i] === "removed" ? "removed" : "active") : status[i]] as [string, Tone]))),
  });
  r.step("Choose the most meetings that don't overlap. Greedy rule: sort by END time, then take every meeting that starts after the last chosen one ends.", timeline());
  let lastEnd = -Infinity;
  sorted.forEach(([s, e], i) => {
    if (s >= lastEnd) { status[i] = "found"; lastEnd = e; r.step(i === 0 ? `${s}–${e} ends earliest of all and the room is empty, so take it. Finishing early leaves the most room for the rest.` : `${s}–${e} starts at ${s}, at or after the room frees up (${sorted.filter((_, k) => status[k] === "found" && k < i).slice(-1)[0]?.[1]}). Take it.`, timeline(i), vars({ "room free at": lastEnd, taken: status.filter(t => t === "found").length })); }
    else { status[i] = "removed"; r.step(`${s}–${e} starts at ${s}, before the room is free at ${lastEnd}. It overlaps, so skip it.`, timeline(i), vars({ "room free at": lastEnd, taken: status.filter(t => t === "found").length })); }
  });
  r.step(`Done: ${status.filter(t => t === "found").length} meetings (1–4, 5–7, 8–11, 12–16). One sort plus one pass, so O(n log n). An exchange argument proves no schedule can fit more.`, timeline());
  const coin = new Recorder();
  coin.step("Greedy isn't always right. Coins 1, 3, 4 and amount 6: greedy takes the biggest coin that fits, 4, leaving 2.", array([4], { title: "Greedy picks", tones: { 0: "active" } }), vars({ remaining: 2 }));
  coin.step("4 is now too big and so is 3, so greedy takes 1 + 1. That's 3 coins in total.", array([4, 1, 1], { title: "Greedy picks", tones: { 1: "active", 2: "active" } }), vars({ remaining: 0, coins: 3 }));
  coin.step("But 3 + 3 = 6 uses only 2 coins! The 'best now' choice (4) was a trap. For general coin sets, use DP (the coin-change table from the DP lesson).", array([3, 3], { title: "Optimal", tones: { 0: "found", 1: "found" } }), vars({ coins: 2 }));
  return [
    r.visual("Interval scheduling", "11 meetings on a 0–16 timeline, sorted by end time. Watch each meeting be taken (green) or skipped (red) in a single pass.", { found: "Taken", removed: "Skipped (overlaps)", active: "Considering" }),
    coin.visual("When greedy fails", "Coins 1, 3, 4 and amount 6. Watch the 'take the biggest coin' rule produce a worse answer than the best one.", { active: "Greedy choice", found: "Optimal" }),
  ];
}

export const PARADIGMS_TRACES: TraceRegistry = {
  "divide-and-conquer": () => divideConquer(),
  backtracking: () => backtracking(),
  "dp-memoization-tabulation": () => dpBasics(),
  "dp-two-dimensional": () => dp2d(),
  "dp-advanced": () => dpAdvanced(),
  greedy: () => greedy(),
};
