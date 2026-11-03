import type { GridPanel, Panel, TraceRegistry, Tone, TreeNode } from "../types";
import { Recorder, array, span, tones, vars } from "../helpers";

function fenwick() {
  const r = new Recorder();
  const values = [3, 2, -1, 6, 5, 4, -3, 3];
  const n = values.length;
  const tree = Array(n + 1).fill(0);
  for (let i = 1; i <= n; i++) for (let j = i; j <= n; j += j & -j) tree[j] += values[i - 1];
  const cover = (i: number) => `${i - (i & -i) + 1}..${i}`;
  const grid = (hotTree: Record<number, Tone> = {}, hotValues: Record<number, Tone> = {}): GridPanel => ({
    type: "grid", title: "Positions 1..8", colLabels: span(1, n).map(String), rowLabels: ["value", "tree[i]", "covers"],
    cells: [values, span(1, n).map(i => tree[i]), span(1, n).map(cover)],
    tones: { ...Object.fromEntries(Object.entries(hotValues).map(([i, t]) => [`0,${+i - 1}`, t])), ...Object.fromEntries(Object.entries(hotTree).flatMap(([i, t]) => [[`1,${+i - 1}`, t], [`2,${+i - 1}`, t]])) },
  });
  r.step("Each tree[i] stores the sum of a block of values that ends at position i. The block length is the lowest set bit of i (i & -i): odd positions cover 1 value, 2 and 6 cover 2, 4 covers 4, and 8 covers all 8.", grid());
  r.step("For example tree[6]: 6 is 110 in binary, its lowest set bit is 2, so it covers positions 5..6. 5 + 4 = 9.", grid({ 6: "active" }, { 5: "compare", 6: "compare" }));
  let i = 7, total = 0;
  const used: number[] = [];
  r.step("prefix_sum(7) = the sum of positions 1..7. Start at i = 7.", grid({}, tones(span(1, 7), "compare")), vars({ i, total }));
  while (i > 0) {
    total += tree[i]; used.push(i);
    const next = i - (i & -i);
    r.step(`Add tree[${i}] = ${tree[i]} (covers ${cover(i)}), so total = ${total}. Jump down: i = ${i} − ${i & -i} = ${next}.${next === 0 ? " That's 0, so we're done." : ""}`, grid(Object.fromEntries(used.map(u => [u, u === i ? "active" : "done"])), tones(span(i - (i & -i) + 1, i), "found")), vars({ i: next, total }));
    i = next;
  }
  r.step(`prefix_sum(7) = ${total}, built from just ${used.length} blocks (${used.join(", ")}) instead of adding 7 numbers. That's O(log n).`, grid(Object.fromEntries(used.map(u => [u, "done"]))), vars({ "prefix_sum(7)": total }));
  i = 3;
  const touched: number[] = [];
  r.step("update(3, +10): position 3 changes, so every block that contains position 3 must change too. Start at i = 3 and jump UP with i += i & -i.", grid({}, { 3: "new" }), vars({ i }));
  values[2] += 10;
  while (i <= n) {
    tree[i] += 10; touched.push(i);
    const next = i + (i & -i);
    r.step(`tree[${i}] covers ${cover(i)}, which includes 3, so add 10 → ${tree[i]}. Jump up: i = ${i} + ${i & -i} = ${next}.${next > n ? " That's past 8, so stop." : ""}`, grid(Object.fromEntries(touched.map(t => [t, t === i ? "new" : "done"])), { 3: "new" }), vars({ i: next }));
    i = next;
  }
  r.step(`Only ${touched.length} cells changed (${touched.join(", ")}) instead of every prefix sum after position 3. Both operations are O(log n).`, grid(Object.fromEntries(touched.map(t => [t, "done"]))));
  return [r.visual("prefix_sum and update", "Values (1-indexed): 3, 2, −1, 6, 5, 4, −3, 3", { active: "Block being used", done: "Used / updated", found: "Positions covered", compare: "Range we want", new: "Changed" })];
}

interface Seg { lo: number; hi: number; sum: number; left: Seg | null; right: Seg | null }
function segment() {
  const r = new Recorder();
  const values = [5, 8, 6, 3, 2, 7, 2, 6];
  const build = (lo: number, hi: number): Seg => {
    if (lo === hi) return { lo, hi, sum: values[lo], left: null, right: null };
    const mid = (lo + hi) >> 1;
    const left = build(lo, mid), right = build(mid + 1, hi);
    return { lo, hi, sum: left.sum + right.sum, left, right };
  };
  const root = build(0, values.length - 1);
  const panel = (toneOf: (s: Seg) => Tone | undefined): Panel => {
    const conv = (s: Seg): TreeNode => ({ label: String(s.sum), id: `${s.lo}-${s.hi}`, sub: s.lo === s.hi ? `[${s.lo}]` : `[${s.lo}..${s.hi}]`, tone: toneOf(s), children: s.left ? [conv(s.left), conv(s.right!)] : [] });
    return { type: "tree", title: "Segment tree (node = sum of its range)", root: conv(root) };
  };
  r.step("Each node stores the sum of a range of the array. Leaves are single elements, and every parent = left child + right child. The root (39) is the sum of everything.", panel(() => undefined), array(values, { title: "Array" }));
  const L = 2, R = 5;
  const status = new Map<Seg, Tone>();
  const visit = (s: Seg): number => {
    if (R < s.lo || s.hi < L) { status.set(s, "muted"); r.step(`Node [${s.lo}..${s.hi}] is completely OUTSIDE [${L}..${R}]. It contributes 0, so don't go further down.`, panel(x => status.get(x)), array(values, { title: "Array", tones: tones(span(L, R), "compare") })); return 0; }
    if (L <= s.lo && s.hi <= R) { status.set(s, "found"); r.step(`Node [${s.lo}..${s.hi}] is completely INSIDE [${L}..${R}]. Use its stored sum ${s.sum} as-is, with no need to look at its children.`, panel(x => status.get(x)), array(values, { title: "Array", tones: { ...tones(span(L, R), "compare"), ...tones(span(s.lo, s.hi), "found") } })); return s.sum; }
    status.set(s, "active");
    r.step(`Node [${s.lo}..${s.hi}] only PARTLY overlaps [${L}..${R}], so ask both of its children.`, panel(x => status.get(x)), array(values, { title: "Array", tones: tones(span(L, R), "compare") }));
    return visit(s.left!) + visit(s.right!);
  };
  r.step(`query(${L}, ${R}): the sum of indexes ${L}..${R} = 6 + 3 + 2 + 7. Start at the root.`, panel(() => undefined), array(values, { title: "Array", tones: tones(span(L, R), "compare") }));
  const answer = visit(root);
  r.step(`Add the green nodes: ${[...status].filter(([, t]) => t === "found").map(([s]) => s.sum).join(" + ")} = ${answer}. Only a few nodes were visited. A query touches about 4 nodes per level, so it's O(log n).`, panel(x => (status.get(x) === "found" ? "found" : undefined)), vars({ [`query(${L}, ${R})`]: answer }));
  const path: Seg[] = [];
  for (let s: Seg | null = root; s; s = s.left && 3 <= s.left.hi ? s.left : s.right) path.push(s);
  r.step("update(3, 10): change values[3] from 3 to 10. Walk down to the leaf [3]: root → [0..3] → [2..3] → [3].", panel(x => (path.includes(x) ? "path" : undefined)), array(values, { title: "Array", tones: { 3: "new" } }));
  values[3] = 10;
  const fix = (s: Seg): number => { if (s.lo === s.hi) return (s.sum = values[s.lo]); s.sum = fix(s.left!) + fix(s.right!); return s.sum; };
  fix(root);
  r.step("Set the leaf to 10, then recompute each node on the path back up (parent = left + right): [2..3] = 16, [0..3] = 29, and the root = 46. Only log₂ n nodes changed.", panel(x => (path.includes(x) ? "new" : undefined)), array(values, { title: "Array", tones: { 3: "new" } }));
  return [r.visual("Range-sum query & update", "Array: 5, 8, 6, 3, 2, 7, 2, 6", { active: "Partial overlap: split", found: "Fully inside: use it", muted: "Outside: skip", compare: "Query range", path: "Path to the leaf", new: "Recomputed" })];
}

function sparse() {
  const r = new Recorder();
  const values = [4, 6, 1, 5, 7, 3, 8, 2];
  const table: number[][] = [values.slice()];
  for (let k = 1; 1 << k <= values.length; k++) {
    const half = 1 << (k - 1);
    table.push(span(0, values.length - (1 << k)).map(i => Math.min(table[k - 1][i], table[k - 1][i + half])));
  }
  const grid = (rows: number, t: Record<string, Tone> = {}): GridPanel => ({ type: "grid", title: "table[k][i] = min of the 2^k values starting at i", colLabels: span(0, values.length - 1).map(i => `i=${i}`), rowLabels: span(0, rows - 1).map(k => `len ${1 << k}`), cells: table.slice(0, rows).map(row => span(0, values.length - 1).map(i => (i < row.length ? row[i] : null))), tones: t });
  r.step("Row 0 (blocks of length 1) is the array itself.", grid(1), array(values, { title: "Array" }));
  for (let k = 1; k < table.length; k++) {
    const half = 1 << (k - 1);
    r.step(`Row ${k} (blocks of length ${1 << k}): each cell is the min of two neighbouring cells from row ${k - 1}. For example table[${k}][0] = min(table[${k - 1}][0], table[${k - 1}][${half}]) = min(${table[k - 1][0]}, ${table[k - 1][half]}) = ${table[k][0]}.`, grid(k + 1, { [`${k - 1},0`]: "compare", [`${k - 1},${half}`]: "compare", [`${k},0`]: "new" }), array(values, { title: "Array", tones: tones(span(0, (1 << k) - 1), "compare") }));
  }
  for (const [L, R] of [[3, 6], [1, 5]] as const) {
    const len = R - L + 1, k = Math.floor(Math.log2(len)), second = R - (1 << k) + 1;
    const a = table[k][L], b = table[k][second];
    r.step(`Query min(${L}..${R}): the length is ${len}, so use blocks of 2^${k} = ${1 << k}. One starts at ${L} (${L}..${L + (1 << k) - 1}) and one ends at ${R} (${second}..${R}).${second === L ? " Here they are the very same block." : second < L + (1 << k) ? " They overlap, which is fine for min: counting a value twice doesn't change the minimum." : ""}`, grid(table.length, { [`${k},${L}`]: "active", [`${k},${second}`]: "active" }), array(values, { title: "Array", ranges: [{ from: L, to: L + (1 << k) - 1, label: `table[${k}][${L}]`, tone: "active" }, { from: second, to: R, label: `table[${k}][${second}]`, tone: "path" }], tones: tones(span(L, R), "compare") }));
    r.step(`Answer = min(${a}, ${b}) = ${Math.min(a, b)}. Just two lookups, whatever the range length, so every query is O(1).`, grid(table.length, { [`${k},${L}`]: "found", [`${k},${second}`]: "found" }), array(values, { title: "Array", tones: { ...tones(span(L, R), "compare"), [values.indexOf(Math.min(a, b))]: "found" } }));
  }
  return [r.visual("Build the table, then O(1) queries", "Array: 4, 6, 1, 5, 7, 3, 8, 2", { compare: "Inputs / query range", new: "Computed", active: "The two blocks", found: "Minimum" })];
}

export const RANGE_TRACES: TraceRegistry = {
  "fenwick-tree": () => fenwick(),
  "segment-tree": () => segment(),
  "sparse-table": () => sparse(),
};
