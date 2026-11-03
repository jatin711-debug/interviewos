import type { GridPanel, Panel, TraceRegistry, Tone } from "../types";
import { Recorder, array, span, text, tones, vars } from "../helpers";

function classDesign() {
  const r = new Recorder();
  const counts: [string, number][] = [];
  const table = (hot?: string, tone: Tone = "new"): GridPanel => ({ type: "grid", title: "fruit._counts (the dict inside the Bag)", colLabels: ["item", "count"], cells: counts.length ? counts.map(([k, v]) => [k, v]) : [["(empty)", ""]], tones: hot ? Object.fromEntries(counts.flatMap(([k], i) => (k === hot ? [[`${i},0`, tone], [`${i},1`, tone]] : []))) : {} });
  r.step("fruit = Bag() creates an object whose only data is an empty dict, self._counts. Every method reads or updates that dict.", table());
  for (const name of ["apple", "pear", "apple", "fig"]) {
    const row = counts.find(([k]) => k === name);
    if (row) row[1] += 1; else counts.push([name, 1]);
    r.step(`fruit.add("${name}"): ${row ? `"${name}" is already there, so its count goes up to ${row[1]}.` : `a new item, so it gets the count 1.`}`, table(name));
  }
  const calls: [string, string, string, string?][] = [
    ["len(fruit)", "fruit.__len__()", "sum of counts = 4"],
    ["'apple' in fruit", "fruit.__contains__('apple')", "'apple' in self._counts → True", "apple"],
    ["for item in fruit", "fruit.__iter__()", "yields apple, apple, pear, fig"],
    ["print(fruit)", "fruit.__repr__()", "\"Bag(['apple', 'apple', 'pear', 'fig'])\""],
    ["fruit == other", "fruit.__eq__(other)", "compare the two count dicts → True"],
  ];
  for (const [written, called, result, hot] of calls) r.step(`When you write ${written}, Python quietly calls ${called}. Our method answers with: ${result}.`, table(hot, "compare"), text([`you write:     ${written}`, `Python calls:  ${called}`, `result:        ${result}`], "Translation"));
  r.step("That's the whole trick: each special method plugs the Bag into one built-in tool, so it feels just like a list or a dict.", table(), text(calls.map(([w, c]) => `${w.padEnd(18)} → ${c}`), "Cheat sheet"));
  return [r.visual("What Python calls behind the scenes", "We add four fruits to a Bag, then use len, in, for, print and ==. Watch the 'Translation' box: each built-in quietly calls one of our special methods.", { new: "Just updated", compare: "Read by the method" })];
}

function iterators() {
  const r = new Recorder();
  const code = ["def countdown(n):", "    print('(starting)')", "    while n > 0:", "        yield n", "        n -= 1", "    print('(finished)')"];
  const show = (line: number | null, n: number | string, out: string[], state: string): Panel[] => [
    text(code.map((c, i) => `${i === line ? "▶ " : "  "}${c}`), `Generator body (▶ = ${state})`),
    vars({ n, state }, "Inside the paused function"),
    text(out, "Printed so far"),
  ];
  const out: string[] = [];
  r.step("gen = countdown(3) creates a generator object. The body has NOT run yet, so nothing is printed.", ...show(null, 3, out, "not started"));
  out.push("(starting)");
  r.step("next(gen): the body starts. It prints '(starting)', enters the loop and reaches yield 3. It hands back 3 and PAUSES on that line.", ...show(3, 3, [...out, "next(gen) → 3"], "paused"));
  out.push("next(gen) → 3");
  r.step("next(gen) again: it resumes right after the yield. n -= 1 makes n = 2, the loop runs again, and it pauses at yield 2. Local variables survived the pause.", ...show(3, 2, [...out, "next(gen) → 2"], "paused"));
  out.push("next(gen) → 2");
  r.step("next(gen): it resumes, n becomes 1, and it pauses at yield 1.", ...show(3, 1, [...out, "next(gen) → 1"], "paused"));
  out.push("next(gen) → 1");
  out.push("(finished)");
  r.step("next(gen): it resumes, n becomes 0, the loop ends, and it prints '(finished)'. The function returns, which raises StopIteration. A for loop treats that as 'done'.", ...show(5, 0, [...out, "StopIteration"], "finished"));
  r.step("So a generator gives one value per request and keeps its place in between. It never builds a list of every value, which is why it's called lazy.", ...show(null, "—", [...out, "StopIteration"], "finished"));
  return [r.visual("A generator pausing at yield", "countdown(3): watch where the function pauses and what it remembers.")];
}

function complexity() {
  const growth = new Recorder();
  const ns = [8, 64, 1024, 1_000_000];
  const rows: (string | number)[][] = [];
  const fmt = (x: number) => (x >= 1e12 ? `${(x / 1e12).toFixed(0)} trillion` : x >= 1e9 ? `${(x / 1e9).toFixed(0)} billion` : x >= 1e6 ? `${(x / 1e6).toFixed(x >= 1e7 ? 0 : 1)} million` : x.toLocaleString("en-US"));
  const grid = (hot: number | null): Panel => ({ type: "grid", title: "Approximate steps for input size n", colLabels: ["n", "O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"], cells: rows, tones: hot === null ? {} : { [`${hot},5`]: "removed", [`${hot},2`]: "done", [`${hot},1`]: "done" } });
  growth.step("We'll fill in a table: how many steps each growth rate needs as n gets bigger. Watch the right-hand column.", grid(null));
  for (const n of ns) {
    const log = Math.log2(n);
    rows.push([n.toLocaleString("en-US"), 1, Math.round(log), fmt(n), fmt(Math.round(n * log)), fmt(n * n)]);
    growth.step(n === 8 ? "n = 8: every column is small. At this size, any algorithm is fast." : n === 64 ? "n = 64: O(n²) is already 4,096 steps, while O(log n) is only 6." : n === 1024 ? "n = 1,024: O(log n) is still 10, but O(n²) is over a million." : "n = 1,000,000: O(log n) is 20 steps and O(n log n) about 20 million (fine), but O(n²) is a trillion steps. That would take hours.", grid(rows.length - 1));
  }
  const search = new Recorder();
  const data = span(1, 16).map(v => v * 3);
  const target = 42;
  let lo = 0, hi = data.length - 1, steps = 0;
  search.step(`Find ${target} in a sorted list of 16 numbers. Linear search checks items one by one, and ${target} is the 14th item, so it needs 14 checks. Binary search instead checks the middle and throws half away.`, array(data, { title: "Sorted list", markers: [{ at: lo, label: "lo" }, { at: hi, label: "hi" }] }), vars({ "linear search checks": 14 }));
  while (lo <= hi) {
    steps++;
    const mid = (lo + hi) >> 1;
    const muted = [...span(0, lo - 1), ...span(hi + 1, data.length - 1)];
    if (data[mid] === target) { search.step(`Check ${steps}: the middle item data[${mid}] = ${data[mid]}. Found it after only ${steps} checks instead of 14.`, array(data, { title: "Sorted list", tones: { ...tones(muted, "muted"), [mid]: "found" }, markers: [{ at: mid, label: "mid" }] }), vars({ checks: steps, "log₂(16)": 4 })); break; }
    const goRight = data[mid] < target;
    search.step(`Check ${steps}: the middle item data[${mid}] = ${data[mid]} is ${goRight ? "smaller" : "bigger"} than ${target}, so everything ${goRight ? "left" : "right"} of it is too ${goRight ? "small" : "big"}. Throw that half away.`, array(data, { title: "Sorted list", tones: { ...tones(muted, "muted"), ...tones(goRight ? span(lo, mid) : span(mid, hi), "removed"), [mid]: "active" }, markers: [{ at: lo, label: "lo" }, { at: mid, label: "mid" }, { at: hi, label: "hi" }] }), vars({ checks: steps }));
    if (goRight) lo = mid + 1; else hi = mid - 1;
  }
  search.step("Halving is the source of O(log n). 16 → 8 → 4 → 2 → 1 is at most 4 or 5 checks, and a million items need only about 20. Linear search would need up to a million.", array(data, { title: "Sorted list", tones: { 13: "found" } }), vars({ "binary search": "≈ log₂ n checks", "linear search": "≈ n checks" }));
  return [
    growth.visual("How growth rates compare", "Rows are added for n = 8, 64, 1,024 and 1,000,000. Watch the right-hand O(n²) column explode while O(log n) barely moves.", { removed: "O(n²) explodes", done: "Barely grows" }),
    search.visual("O(n) vs O(log n) search", "Searching for 42 in 16 sorted numbers. Watch how much of the list each check rules out (red), compared with checking one item at a time.", { muted: "Already ruled out", removed: "Ruled out by this check", active: "Middle item checked", found: "Found" }),
  ];
}

export const FOUNDATIONS_TRACES: TraceRegistry = {
  "ds-class-design": () => classDesign(),
  "ds-iterators": () => iterators(),
  "ds-complexity": () => complexity(),
};
