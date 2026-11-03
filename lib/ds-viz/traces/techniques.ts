import type { GridPanel, Panel, TraceRegistry, Tone } from "../types";
import { Recorder, array, span, text, tones, vars } from "../helpers";

function prefixSums() {
  const r = new Recorder();
  const nums = [3, 1, 4, 1, 5, 9, 2, 6];
  const prefix: number[] = [0];
  r.step("prefix[i] will be the sum of the first i numbers. It starts with prefix[0] = 0, the sum of nothing.", array(nums, { title: "nums" }), array(prefix, { title: "prefix", tones: { 0: "new" } }));
  nums.forEach((x, i) => {
    prefix.push(prefix[i] + x);
    if (i < 3 || i === nums.length - 1) r.step(`prefix[${i + 1}] = prefix[${i}] + nums[${i}] = ${prefix[i]} + ${x} = ${prefix[i + 1]}.`, array(nums, { title: "nums", tones: { ...tones(span(0, i - 1), "compare"), [i]: "active" } }), array(prefix, { title: "prefix", tones: { [i]: "compare", [i + 1]: "new" } }));
    else if (i === 3) r.step("…and so on. One pass builds the whole table: O(n).", array(nums, { title: "nums" }), array(prefix, { title: "prefix" }));
  });
  for (const [l, rr] of [[2, 5], [0, 3]] as const) {
    r.step(`Sum of nums[${l}..${rr}] = prefix[${rr + 1}] − prefix[${l}] = ${prefix[rr + 1]} − ${prefix[l]} = ${prefix[rr + 1] - prefix[l]}. Everything up to ${rr}, minus everything before ${l}. That's two lookups, O(1)${l === 0 ? ". The leading 0 makes ranges that start at index 0 work too" : ""}.`, array(nums, { title: "nums", tones: tones(span(l, rr), "found") }), array(prefix, { title: "prefix", tones: { [rr + 1]: "active", [l]: "removed" } }));
  }
  const diff = new Recorder();
  const size = 6;
  const d = Array(size + 1).fill(0);
  const finalValues = () => { let run = 0; return span(0, size - 1).map(i => (run += d[i])); };
  diff.step("Difference array: we want to apply several 'add v to every element in l..r' updates to an array of 6 zeros, cheaply.", array(d, { title: "diff (one extra slot)" }), array(finalValues(), { title: "values (prefix sums of diff)" }));
  for (const [l, rr, v] of [[0, 2, 5], [1, 4, 2], [3, 5, 1]] as const) {
    d[l] += v; d[rr + 1] -= v;
    diff.step(`add ${v} to ${l}..${rr}: diff[${l}] += ${v} (start adding) and diff[${rr + 1}] −= ${v} (stop after ${rr}). Just two writes, whatever the range length.`, array(d, { title: "diff (one extra slot)", tones: { [l]: "new", [rr + 1]: "removed" } }), array(finalValues(), { title: "values (prefix sums of diff)", tones: tones(span(l, rr), "compare") }));
  }
  diff.step(`One running-total pass over diff gives the final values [${finalValues().join(", ")}].`, array(d, { title: "diff (one extra slot)" }), array(finalValues(), { title: "values (prefix sums of diff)", tones: tones(span(0, size - 1), "done") }));
  return [
    r.visual("Build & query", "nums = 3, 1, 4, 1, 5, 9, 2, 6. Watch the running totals build in one pass, then watch any range sum come from just two lookups.", { active: "Being added / prefix[r+1]", compare: "Used", new: "Just computed", found: "Range being summed", removed: "prefix[l] (subtracted)" }),
    diff.visual("Difference array", "Three 'add v to a range' updates on six zeros. Watch each update touch only two cells, then one running-total pass reveal the final values.", { new: "+v (start)", removed: "−v (stop)", compare: "Range affected", done: "Final values" }),
  ];
}

function twoPointers() {
  const pr = new Recorder();
  const nums = [1, 2, 4, 5, 7, 11];
  const target = 9;
  let l = 0, h = nums.length - 1;
  pr.step(`Find two numbers that add up to ${target} in a SORTED list. Start with one pointer at each end.`, array(nums, { markers: [{ at: l, label: "left" }, { at: h, label: "right" }] }));
  while (l < h) {
    const s = nums[l] + nums[h];
    const muted = [...span(0, l - 1), ...span(h + 1, nums.length - 1)];
    if (s === target) { pr.step(`${nums[l]} + ${nums[h]} = ${target}. Found!`, array(nums, { tones: { ...tones(muted, "muted"), [l]: "found", [h]: "found" }, markers: [{ at: l, label: "left" }, { at: h, label: "right" }] })); break; }
    pr.step(s < target ? `${nums[l]} + ${nums[h]} = ${s} is too small. The only way to grow the sum is to move left up. ${nums[l]} can't pair with anything, because even the biggest partner wasn't enough.` : `${nums[l]} + ${nums[h]} = ${s} is too big. Move right down. ${nums[h]} can't pair with anything, because even the smallest partner was too much.`, array(nums, { tones: { ...tones(muted, "muted"), [l]: s < target ? "removed" : "compare", [h]: s < target ? "compare" : "removed" }, markers: [{ at: l, label: "left" }, { at: h, label: "right" }] }));
    if (s < target) l++; else h--;
  }
  const sw = new Recorder();
  const t = "abcabcbb";
  const last: Record<string, number> = {};
  let left = 0, best = 0, bestRange: [number, number] = [0, 0];
  sw.step(`Longest substring of "${t}" without repeating characters. The window [left..right] always holds unique characters.`, array(t.split(""), {}));
  for (let right = 0; right < t.length; right++) {
    const ch = t[right];
    let note = "";
    if (ch in last && last[ch] >= left) { note = ` '${ch}' is already in the window at index ${last[ch]}, so move left to ${last[ch] + 1}, just past it.`; left = last[ch] + 1; }
    last[ch] = right;
    if (right - left + 1 > best) { best = right - left + 1; bestRange = [left, right]; }
    sw.step(`right = ${right} adds '${ch}'.${note} Window = "${t.slice(left, right + 1)}" (length ${right - left + 1}). Best so far: ${best}.`, array(t.split(""), { tones: { ...tones(span(0, left - 1), "muted"), ...tones(span(left, right), "compare"), [right]: note ? "removed" : "new" }, ranges: [{ from: left, to: right, label: "window", tone: "compare" }], markers: [{ at: left, label: "left" }, ...(right !== left ? [{ at: right, label: "right" }] : [])] }), vars({ best }));
  }
  sw.step(`The longest unique window is "${t.slice(bestRange[0], bestRange[1] + 1)}", length ${best}. Each character entered the window once and left at most once: O(n).`, array(t.split(""), { tones: tones(span(bestRange[0], bestRange[1]), "found") }));
  return [
    pr.visual("Pair with target sum", "Find two numbers that add up to 9 in 1, 2, 4, 5, 7, 11. Watch each comparison permanently rule out one end.", { removed: "Ruled out", compare: "Still possible", muted: "Ruled out earlier", found: "Answer" }),
    sw.visual("Sliding window", "Longest substring of \"abcabcbb\" with no repeated letter. Watch the window grow on the right and jump forward on the left when a letter repeats.", { compare: "In the window", new: "Just added", removed: "Duplicate: shrink", muted: "Left behind", found: "Best window" }),
  ];
}

function monotonic() {
  const r = new Recorder();
  const nums = [2, 1, 2, 4, 3];
  const answer: (number | string)[] = nums.map(() => "?");
  const stack: number[] = [];
  const show = (i: number | null, t: Record<number, Tone> = {}): Panel[] => [array(nums, { title: "nums", tones: { ...(i !== null ? { [i]: "active" } : {}), ...t } }), { type: "stack", title: "Stack of waiting indexes (values decrease upward)", items: stack.map(s => `i${s} (${nums[s]})`), empty: "empty" }, array(answer, { title: "next greater" })];
  r.step("For each number, find the first bigger number to its right. The stack holds indexes still waiting for their answer.", ...show(null));
  nums.forEach((x, i) => {
    const popped: number[] = [];
    while (stack.length && nums[stack[stack.length - 1]] < x) { const w = stack.pop()!; answer[w] = x; popped.push(w); }
    r.step(popped.length ? `${x} is bigger than ${popped.map(p => `nums[${p}] = ${nums[p]}`).join(" and ")} on the stack, so ${x} is ${popped.length > 1 ? "their" : "its"} answer. Pop ${popped.length > 1 ? "them" : "it"}. Then push index ${i}.` : `${x} is not bigger than the top of the stack${stack.length ? ` (${nums[stack[stack.length - 1]]})` : " (it's empty)"}, so nobody gets an answer yet. Push index ${i} to wait.`, ...(() => { stack.push(i); return show(i, Object.fromEntries(popped.map(p => [p, "found" as Tone]))); })());
  });
  stack.forEach(s => { answer[s] = -1; });
  r.step(`End of the list: whatever is still waiting on the stack (${stack.map(s => nums[s]).join(", ")}) has no bigger number to its right, so its answer is -1. Each index was pushed once and popped at most once: O(n).`, ...show(null, tones(stack, "removed")));

  const wq = new Recorder();
  const vals = [1, 3, -1, -3, 5, 3, 6, 7], k = 3;
  const dq: number[] = [];
  const result: number[] = [];
  vals.forEach((x, i) => {
    const dropped: number[] = [];
    while (dq.length && vals[dq[dq.length - 1]] <= x) dropped.push(dq.pop()!);
    dq.push(i);
    let expired: number | null = null;
    if (dq[0] <= i - k) expired = dq.shift()!;
    if (i >= k - 1) result.push(vals[dq[0]]);
    const lo = Math.max(0, i - k + 1);
    wq.step(`${x} arrives.${dropped.length ? ` It's ≥ ${dropped.map(d => vals[d]).join(", ")} at the back, and ${dropped.length > 1 ? "those" : "that"} can never be a window max again while ${x} is around, so pop ${dropped.length > 1 ? "them" : "it"}.` : ""}${expired !== null ? ` Index ${expired} slid out of the window, so drop it from the front.` : ""}${i >= k - 1 ? ` Window max = front = ${vals[dq[0]]}.` : " The window isn't full yet."}`, array(vals, { tones: { ...tones(span(lo, i), "compare"), [dq[0]]: "found" }, ranges: [{ from: lo, to: i, label: "window", tone: "compare" }] }), array(dq.map(d => vals[d]), { title: "Deque (values decrease front → back)", indices: false, ids: dq.slice() }), array(result, { title: "Maxima so far", empty: "[]", indices: false }));
  });
  return [
    r.visual("Next greater element", "nums = 2, 1, 2, 4, 3. Watch numbers wait on the stack until a bigger number arrives and answers for them.", { active: "Current number", found: "Got its answer", removed: "No answer (−1)" }),
    wq.visual("Sliding window maximum (k = 3)", "nums = 1, 3, −1, −3, 5, 3, 6, 7, window size 3. Watch smaller values get thrown out of the deque, so its front is always the window's max.", { compare: "Window", found: "Window max" }),
  ];
}

function intervals() {
  const m = new Recorder();
  const input: [number, number][] = [[8, 10], [1, 3], [2, 6], [15, 18], [17, 20]];
  const sorted = input.slice().sort((a, b) => a[0] - b[0]);
  const T = 21;
  const lane = (rows: [number, number][], labels: string[], t: Tone[] = []): GridPanel => ({ type: "grid", title: "Timeline", rowLabels: labels, colLabels: span(0, T - 1).map(String), cells: rows.map(([s, e]) => span(0, T - 1).map(x => (x >= s && x < e ? "■" : ""))), tones: Object.fromEntries(rows.flatMap(([s, e], i) => span(s, e - 1).map(x => [`${i},${x}`, t[i] ?? "default"] as [string, Tone]))) });
  m.step("Merge overlapping intervals. Step 1: sort by start time, so any intervals that overlap end up next to each other.", lane(sorted, sorted.map(([s, e]) => `${s}–${e}`)));
  const merged: [number, number][] = [];
  for (const [s, e] of sorted) {
    if (merged.length && s <= merged[merged.length - 1][1]) {
      const last = merged[merged.length - 1];
      const old = last[1];
      last[1] = Math.max(last[1], e);
      m.step(`${s}–${e} starts at ${s}, before the current block ends (${old}). They overlap, so extend the block to ${last[0]}–${last[1]}.`, lane(sorted, sorted.map(([a, b]) => `${a}–${b}`), sorted.map(([a]) => (a === s ? "active" : "muted"))), lane(merged, merged.map(([a, b]) => `${a}–${b}`), merged.map((_, i) => (i === merged.length - 1 ? "new" : "done"))));
    } else {
      merged.push([s, e]);
      m.step(merged.length === 1 ? `${s}–${e} is the first interval and starts the first block.` : `${s}–${e} starts after the current block ends, which leaves a gap. Start a new block.`, lane(sorted, sorted.map(([a, b]) => `${a}–${b}`), sorted.map(([a]) => (a === s ? "active" : "muted"))), lane(merged, merged.map(([a, b]) => `${a}–${b}`), merged.map((_, i) => (i === merged.length - 1 ? "new" : "done"))));
    }
  }
  m.step(`Merged: ${merged.map(([a, b]) => `${a}–${b}`).join(", ")}. A sort plus one pass: O(n log n).`, lane(merged, merged.map(([a, b]) => `${a}–${b}`), merged.map(() => "found")));

  const sw = new Recorder();
  const meetings: [number, number][] = [[0, 30], [5, 10], [15, 20], [10, 15]];
  const events = meetings.flatMap(([s, e]) => [[s, 1], [e, -1]] as [number, number][]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const labels = events.map(([t, d]) => `${t}${d > 0 ? "+" : "−"}`);
  let inUse = 0, most = 0;
  sw.step("Rooms needed for meetings 0–30, 5–10, 15–20, 10–15. Turn each into two events, +1 at the start and −1 at the end, and sort by time. At equal times −1 comes first, so a room freed at 10 can be reused at 10.", array(labels, { title: "Events (time and +/−)", indices: false }), vars({ "rooms in use": 0, "max so far": 0 }));
  events.forEach(([t, d], i) => {
    inUse += d; most = Math.max(most, inUse);
    sw.step(`t = ${t}: a meeting ${d > 0 ? "starts (+1)" : "ends (−1)"}. Rooms in use: ${inUse}.${t === 10 && d < 0 ? " The end at t = 10 is processed before the start at t = 10, so the count never reaches 3." : ""}`, array(labels, { title: "Events (time and +/−)", indices: false, tones: { ...tones(span(0, i - 1), "muted"), [i]: d > 0 ? "new" : "removed" } }), vars({ "rooms in use": inUse, "max so far": most }));
  });
  sw.step(`The peak was ${most}, so ${most} rooms are enough.`, array(labels, { title: "Events (time and +/−)", indices: false, tones: tones(span(0, labels.length - 1), "muted") }), vars({ "rooms needed": most }));
  return [
    m.visual("Merge intervals", "Intervals 8–10, 1–3, 2–6, 15–18, 17–20 on a timeline. Watch the sorted list being scanned once, with each block extended or a new one started.", { active: "Current interval", muted: "Other intervals", new: "Block being built", done: "Finished block", found: "Result" }),
    sw.visual("Sweep line: rooms needed", "Four meetings become eight +1/−1 events. Watch the 'rooms in use' counter rise and fall; its peak is the answer.", { new: "Start (+1)", removed: "End (−1)", muted: "Processed" }),
  ];
}

function bits() {
  const r = new Recorder();
  const bitsOf = (x: number, w = 4) => span(0, w - 1).map(i => (x >> (w - 1 - i)) & 1);
  const grid = (rows: [string, number][], hot: number | null = null, title = "Bits (bit 3 … bit 0)"): GridPanel => ({ type: "grid", title, rowLabels: rows.map(([n]) => n), colLabels: ["bit 3", "bit 2", "bit 1", "bit 0"], cells: rows.map(([, v]) => bitsOf(v)), tones: Object.fromEntries(rows.flatMap(([, v], ri) => bitsOf(v).map((b, ci) => [`${ri},${ci}`, ci === 3 - (hot ?? -9) ? "active" : b ? "found" : "muted"] as [string, Tone]))) });
  r.step("13 in binary is 1101 = 8 + 4 + 1. Bit i (counting from the right, starting at 0) is worth 2ⁱ.", grid([["13", 13]]));
  r.step("Test bit 2: AND with the mask 1 << 2 = 0100. The result is non-zero (0100), so bit 2 is ON.", grid([["x = 13", 13], ["1 << 2", 4], ["x & mask", 13 & 4]], 2));
  r.step("Set bit 1: OR with 1 << 1 = 0010. OR turns that bit on and leaves the rest alone, giving 1111 = 15.", grid([["x = 13", 13], ["1 << 1", 2], ["x | mask", 13 | 2]], 1));
  r.step("Clear bit 2: AND with ~(1 << 2), which has every bit on except bit 2. That gives 1001 = 9.", grid([["x = 13", 13], ["~(1 << 2)", 15 & ~4], ["x & ~mask", 13 & ~4]], 2));
  r.step("Flip bit 0: XOR with 1 << 0. XOR makes a bit 1 where the two differ. That gives 1100 = 12.", grid([["x = 13", 13], ["1 << 0", 1], ["x ^ mask", 13 ^ 1]], 0));
  let n = 13, count = 0;
  const rows: [string, number][] = [["n = 13", 13]];
  while (n) {
    const next = n & (n - 1); count++;
    rows.push([`n & (n−1)`, next]);
    r.step(`Count the 1-bits: n & (n − 1) removes the LOWEST 1-bit. ${n} (${bitsOf(n).join("")}) → ${next} (${bitsOf(next).join("")}). count = ${count}.${next === 0 ? " n is 0, so 13 has 3 one-bits." : ""}`, grid(rows.slice(), null, "Popcount: each step drops one 1-bit"));
    n = next;
  }
  const xr = new Recorder();
  const list = [4, 1, 2, 1, 2];
  let acc = 0;
  const xrows: [string, number][] = [];
  list.forEach(v => { acc ^= v; xrows.push([`^ ${v} → ${acc}`, acc]); xr.step(`result ^= ${v} → ${acc} (${bitsOf(acc).join("")}). ${list.indexOf(v) !== list.lastIndexOf(v) && xrows.length > list.indexOf(v) + 1 ? `The second ${v} cancels the first, because a ^ a = 0.` : ""}`, grid(xrows.slice(), null, "Running XOR")); });
  xr.step("Every number that appears twice cancelled itself out, leaving 4: the number without a pair. That's O(n) time and O(1) memory.", grid(xrows.slice(), null, "Running XOR"), vars({ answer: acc }));
  return [
    r.visual("Bit tricks on 13", "13 = 1101 in binary. Watch a single-bit mask test, set, clear and flip one bit, then watch n & (n − 1) knock off the lowest 1-bit.", { found: "1", muted: "0", active: "The bit we're targeting" }),
    xr.visual("XOR cancels pairs", "XOR together 4, 1, 2, 1, 2. Watch the running result: each number seen twice cancels out.", { found: "1", muted: "0" }),
  ];
}

function numberTheory() {
  const g = new Recorder();
  let a = 48, b = 18;
  g.step("gcd(48, 18) with Euclid: replace (a, b) with (b, a % b) until b = 0. Any number that divides both a and b also divides a % b, so the gcd never changes.", vars({ a, b }));
  while (b) { const r = a % b; g.step(`${a} % ${b} = ${r}, so gcd(${a}, ${b}) = gcd(${b}, ${r}).`, vars({ a: b, b: r }), text([`${a} = ${Math.floor(a / b)} × ${b} + ${r}`], "Division")); a = b; b = r; }
  g.step(`b is 0, so the gcd is ${a}. lcm(48, 18) = 48 // ${a} × 18 = ${(48 / a) * 18}.`, vars({ gcd: a, lcm: (48 / a) * 18 }));

  const s = new Recorder();
  const limit = 50;
  const prime = Array(limit + 1).fill(true);
  prime[0] = prime[1] = false;
  const board = (hot: number | null = null, fresh: number[] = []): GridPanel => ({
    type: "grid", title: "Numbers 1–50 (grey = crossed out)", cells: span(0, 4).map(r => span(1, 10).map(c => r * 10 + c)),
    tones: Object.fromEntries(span(1, limit).map(n => [`${Math.floor((n - 1) / 10)},${(n - 1) % 10}`, n === hot ? "active" : fresh.includes(n) ? "removed" : prime[n] ? (hot === null ? "found" : "default") : "muted"] as [string, Tone])),
  });
  s.step("Sieve of Eratosthenes up to 50. Start by assuming everything from 2 up is prime. (1 isn't prime.)", board(0));
  for (let p = 2; p * p <= limit; p++) {
    if (!prime[p]) continue;
    const crossed: number[] = [];
    for (let m = p * p; m <= limit; m += p) if (prime[m]) { prime[m] = false; crossed.push(m); }
    s.step(`${p} is prime. Cross out its multiples starting at ${p}×${p} = ${p * p}${p > 2 ? ` (smaller multiples like ${p * 2} were already crossed out by smaller primes)` : ""}: ${crossed.slice(0, 8).join(", ")}${crossed.length > 8 ? ", …" : ""}.`, board(p, crossed));
  }
  s.step(`The next prime would be 11, but 11 × 11 = 121 > 50, so we're done. Every number not crossed out is prime: ${span(2, limit).filter(n => prime[n]).join(", ")}.`, board());
  return [
    g.visual("Euclid's GCD", "gcd(48, 18). Watch the pair shrink fast: (48, 18) → (18, 12) → (12, 6) → (6, 0)."),
    s.visual("Sieve of Eratosthenes", "Numbers 1–50. Watch each prime cross out its multiples, starting from its square; what survives is prime.", { active: "Current prime", removed: "Crossed out now", muted: "Crossed out earlier", found: "Prime" }),
  ];
}

function kmp() {
  const ft = new Recorder();
  const pattern = "ABABC";
  const fail = Array(pattern.length).fill(0);
  ft.step(`Failure table of "${pattern}": fail[i] = the length of the longest proper prefix of pattern[:i+1] that is also its suffix. fail[0] is always 0.`, array(pattern.split(""), { title: "pattern" }), array(fail.map((v, i) => (i === 0 ? v : "?")), { title: "fail" }));
  let k = 0;
  for (let i = 1; i < pattern.length; i++) {
    while (k > 0 && pattern[i] !== pattern[k]) k = fail[k - 1];
    if (pattern[i] === pattern[k]) k++;
    fail[i] = k;
    const pre = pattern.slice(0, i + 1);
    ft.step(k ? `"${pre}": the prefix "${pre.slice(0, k)}" is also a suffix, so fail[${i}] = ${k}.` : `"${pre}": no proper prefix is also a suffix, so fail[${i}] = 0.`, array(pattern.split(""), { title: "pattern", tones: { ...tones(span(0, k - 1), "path"), ...tones(span(i - k + 1, i), "found") } }), array(fail.map((v, j) => (j <= i ? v : "?")), { title: "fail", tones: { [i]: "new" } }));
  }
  const sr = new Recorder();
  const textS = "ABABDABABC";
  k = 0;
  const found: number[] = [];
  /** Draw the text and the pattern lined up so that pattern[0] sits under text[at]; `good` pattern cells matched, `bad` is the mismatch. */
  const show = (i: number, at: number, good: number, bad: number | null, tone: Tone, note: string) => {
    const row: (string | null)[] = Array(textS.length).fill(null);
    for (let j = 0; j < pattern.length && at + j < textS.length; j++) row[at + j] = pattern[j];
    const pt: Record<number, Tone> = {};
    for (let j = 0; j < good; j++) pt[at + j] = tone === "found" ? "found" : "path";
    if (bad !== null && at + bad < textS.length) pt[at + bad] = "removed";
    sr.step(note, array(textS.split(""), { title: "text", tones: { ...tones(span(at, at + good - 1), "compare"), [i]: tone }, markers: [{ at: i, label: "i" }] }), array(row, { title: "pattern lined up under the text", indices: false, tones: pt }), vars({ k }));
  };
  sr.step(`Search for "${pattern}" in "${textS}". k = the number of pattern characters matched so far. The text index i only ever moves forward.`, array(textS.split(""), { title: "text" }), array(pattern.split(""), { title: "pattern", indices: false }), vars({ k: 0 }));
  for (let i = 0; i < textS.length; i++) {
    const ch = textS[i];
    let fell = "";
    const before = k;
    while (k > 0 && ch !== pattern[k]) { const old = k; k = fail[k - 1]; fell += ` Mismatch: '${ch}' ≠ pattern[${old}] = '${pattern[old]}', so fall back to k = fail[${old - 1}] = ${k}.`; }
    if (ch === pattern[k]) {
      k++;
      if (k === pattern.length) { found.push(i - k + 1); show(i, i - k + 1, k, null, "found", `${fell}'${ch}' matches, so k = ${k} = the pattern length. MATCH at index ${i - k + 1}!`); k = fail[k - 1]; }
      else show(i, i - k + 1, k, null, "new", `${fell ? fell.trim() + " Then " : ""}'${ch}' matches pattern[${k - 1}], so k = ${k}.`);
    } else show(i, i - before, before, before, "removed", `${fell.trim() || `'${ch}' doesn't match pattern[0] = '${pattern[0]}'.`} k = 0, so the text moves on. i never goes back.`);
  }
  sr.step(`Found at ${found.join(", ")}. At index 4 ('D') we didn't restart from scratch: we fell back to k = 2 ('AB' was already matched), then to 0. Each text character is read once: O(n + m).`, array(textS.split(""), { title: "text", tones: tones(found.flatMap(f => span(f, f + pattern.length - 1)), "found") }));
  return [
    ft.visual("Build the failure table", "Pattern \"ABABC\". For each prefix, watch for the longest start (blue) that also appears at the end (green).", { path: "Prefix", found: "Matching suffix", new: "Just computed" }),
    sr.visual("Scan the text", "Search for \"ABABC\" in \"ABABDABABC\". Watch i only move forward; on a mismatch the pattern shifts using the failure table instead of starting over.", { compare: "Currently matched", new: "Match extends", removed: "Mismatch", path: "Matched pattern chars", found: "Full match" }),
  ];
}

export const TECHNIQUES_TRACES: TraceRegistry = {
  "prefix-sums": () => prefixSums(),
  "two-pointers-sliding-window": () => twoPointers(),
  "monotonic-stack-queue": () => monotonic(),
  "intervals-sweep": () => intervals(),
  "bit-manipulation": () => bits(),
  "number-theory": () => numberTheory(),
  "string-matching": () => kmp(),
};
