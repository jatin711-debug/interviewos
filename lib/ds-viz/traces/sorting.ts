import type { Panel, TraceRegistry, Tone } from "../types";
import { Recorder, array, span, tones, vars } from "../helpers";

function binarySearch() {
  const runs: ReturnType<Recorder["visual"]>[] = [];
  const scores = [3, 8, 15, 21, 30, 42, 57, 63];
  for (const target of [42, 10]) {
    const r = new Recorder();
    let lo = 0, hi = scores.length - 1, checks = 0;
    const panel = (t: Record<number, Tone>, markers: { at: number; label: string }[]) => array(scores, { title: "Sorted list", tones: { ...tones([...span(0, lo - 1), ...span(hi + 1, scores.length - 1)], "muted"), ...t }, markers });
    r.step(`Search for ${target}. At first the whole list could contain it: lo = 0, hi = ${hi}.`, panel({}, [{ at: lo, label: "lo" }, { at: hi, label: "hi" }]), vars({ lo, hi, target }));
    let found = false;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      checks++;
      if (scores[mid] === target) { r.step(`mid = (${lo} + ${hi}) // 2 = ${mid}. scores[${mid}] = ${scores[mid]} equals ${target}: found after ${checks} checks.`, panel({ [mid]: "found" }, [{ at: mid, label: "mid" }]), vars({ lo, hi, mid, checks })); found = true; break; }
      const right = scores[mid] < target;
      r.step(`mid = (${lo} + ${hi}) // 2 = ${mid}. scores[${mid}] = ${scores[mid]} is ${right ? "less" : "greater"} than ${target}, so the target can't be at mid or to its ${right ? "left" : "right"}. Set ${right ? `lo = mid + 1 = ${mid + 1}` : `hi = mid - 1 = ${mid - 1}`}.`, panel({ ...tones(right ? span(lo, mid) : span(mid, hi), "removed"), [mid]: "active" }, [{ at: lo, label: "lo" }, { at: mid, label: "mid" }, { at: hi, label: "hi" }]), vars({ lo, hi, mid, checks }));
      if (right) lo = mid + 1; else hi = mid - 1;
    }
    if (!found) r.step(`Now lo = ${lo} > hi = ${hi}: the range is empty. ${target} isn't in the list (it would sit between ${scores[hi]} and ${scores[lo]}). Return -1 after ${checks} checks.`, array(scores, { title: "Sorted list", tones: tones(span(0, scores.length - 1), "muted"), markers: [{ at: hi, label: "hi" }, { at: lo, label: "lo" }] }), vars({ lo, hi, result: -1 }));
    runs.push(r.visual(found ? `Find ${target} (present)` : `Find ${target} (missing)`, `Sorted list 3, 8, 15, 21, 30, 42, 57, 63. Watch lo, mid and hi slide as each check throws away half of what's left${found ? "" : ", until the range is empty"}.`, { muted: "Ruled out earlier", removed: "Ruled out by this check", active: "mid", found: "Found" }));
  }
  const lb = new Recorder();
  const grades = [10, 20, 20, 20, 30];
  let lo = 0, hi = grades.length;
  lb.step("first_at_least(20): find the FIRST index whose value is ≥ 20. Here hi = len(list) = 5, because the answer could be 'past the end'.", array(grades, { title: "Sorted list with duplicates", markers: [{ at: lo, label: "lo" }] }), vars({ lo, hi }));
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const small = grades[mid] < 20;
    lb.step(`mid = ${mid}, grades[mid] = ${grades[mid]}. ${small ? `${grades[mid]} < 20, so the answer is after mid: lo = ${mid + 1}.` : `${grades[mid]} ≥ 20, so mid MIGHT be the answer, but there could be an earlier one. Keep mid: hi = ${mid}.`}`, array(grades, { title: "Sorted list with duplicates", tones: { [mid]: small ? "removed" : "compare" }, markers: [{ at: lo, label: "lo" }, { at: mid, label: "mid" }] }), vars({ lo: small ? mid + 1 : lo, hi: small ? hi : mid }));
    if (small) lo = mid + 1; else hi = mid;
  }
  lb.step(`lo == hi == ${lo}: the first 20 is at index ${lo}. That's exactly what bisect.bisect_left returns.`, array(grades, { title: "Sorted list with duplicates", tones: { [lo]: "found" }, markers: [{ at: lo, label: "answer" }] }), vars({ answer: lo }));
  return [...runs, lb.visual("First index ≥ 20", "A sorted list with duplicates: 10, 20, 20, 20, 30. Watch hi stay ON a matching item (it might be the answer) while lo jumps past small ones.", { removed: "Too small", compare: "Big enough (keep looking left)", found: "Answer" })];
}

function elementary() {
  const data = [5, 2, 4, 6, 1, 3];
  const bubble = new Recorder();
  {
    const a = data.slice();
    bubble.step("Bubble sort: compare neighbours left to right and swap when they're out of order. Each pass carries the biggest remaining value to the end.", array(a, { ids: a.slice(), bars: true }));
    for (let end = a.length - 1; end > 0; end--) {
      let swapped = false;
      for (let i = 0; i < end; i++) {
        const swap = a[i] > a[i + 1];
        if (swap) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; swapped = true; }
        bubble.step(swap ? `${a[i + 1]} > ${a[i]}: they're in the wrong order, so swap them.` : `${a[i]} ≤ ${a[i + 1]}: already in order, so leave them.`, array(a, { ids: a.slice(), bars: true, tones: { ...tones(span(end + 1, a.length - 1), "done"), [i]: swap ? "active" : "compare", [i + 1]: swap ? "active" : "compare" } }));
      }
      bubble.step(`End of pass: ${a[end]} has bubbled up to index ${end}, its final place.${swapped ? "" : " No swaps happened this pass, so the list is sorted and we stop early."}`, array(a, { ids: a.slice(), bars: true, tones: tones(span(end, a.length - 1), "done") }));
      if (!swapped) break;
    }
    bubble.step("Sorted. Bubble sort made many comparisons: about n²/2 in the worst case.", array(a, { ids: a.slice(), bars: true, tones: tones(span(0, a.length - 1), "done") }));
  }
  const selection = new Recorder();
  {
    const a = data.slice();
    selection.step("Selection sort: find the smallest value in the unsorted part, then swap it into the first unsorted position.", array(a, { ids: a.slice(), bars: true }));
    for (let start = 0; start < a.length - 1; start++) {
      let small = start;
      for (let i = start + 1; i < a.length; i++) if (a[i] < a[small]) small = i;
      selection.step(`Scan indexes ${start}..${a.length - 1}: the smallest is ${a[small]} at index ${small}.`, array(a, { ids: a.slice(), bars: true, tones: { ...tones(span(0, start - 1), "done"), ...tones(span(start, a.length - 1), "compare"), [small]: "active" }, markers: [{ at: start, label: "start" }] }));
      [a[start], a[small]] = [a[small], a[start]];
      selection.step(small === start ? `${a[start]} is already at index ${start}, so no swap is needed. The sorted part grows by one.` : `Swap it into index ${start}. Indexes 0..${start} are now sorted and final.`, array(a, { ids: a.slice(), bars: true, tones: { ...tones(span(0, start), "done"), [start]: "new" } }));
    }
    selection.step("Sorted. Selection sort did at most n − 1 swaps, but always about n²/2 comparisons.", array(a, { ids: a.slice(), bars: true, tones: tones(span(0, a.length - 1), "done") }));
  }
  const insertion = new Recorder();
  {
    const a = data.slice();
    insertion.step("Insertion sort: the left part is always sorted. Take the next value and slide it left until it fits.", array(a, { ids: a.slice(), bars: true, tones: { 0: "done" } }));
    for (let i = 1; i < a.length; i++) {
      const current = a[i];
      let j = i - 1;
      insertion.step(`Lift out ${current} (index ${i}). Every bigger value to its left will shift one step right.`, array(a, { ids: a.slice(), bars: true, tones: { ...tones(span(0, i - 1), "done"), [i]: "active" } }));
      while (j >= 0 && a[j] > current) { a[j + 1] = a[j]; j--; }
      a[j + 1] = current;
      insertion.step(i - 1 - j === 0 ? `${current} is already bigger than everything on its left, so it stays. No shifting needed.` : `Shifted ${i - 1 - j} value${i - 1 - j > 1 ? "s" : ""} right; ${current} drops into index ${j + 1}. Indexes 0..${i} are sorted.`, array(a, { ids: a.slice(), bars: true, tones: { ...tones(span(0, i), "done"), [j + 1]: "new" } }));
    }
    insertion.step("Sorted. On a nearly sorted list, almost nothing shifts, so insertion sort is close to O(n).", array(a, { ids: a.slice(), bars: true, tones: tones(span(0, a.length - 1), "done") }));
  }
  return [
    bubble.visual("Bubble sort", "Sorting 5, 2, 4, 6, 1, 3", { compare: "Compared, no swap", active: "Swapped", done: "In final place" }),
    selection.visual("Selection sort", "Sorting 5, 2, 4, 6, 1, 3", { compare: "Unsorted part (scanned)", active: "Smallest found", new: "Just placed", done: "Sorted part" }),
    insertion.visual("Insertion sort", "Sorting 5, 2, 4, 6, 1, 3", { active: "Being inserted", new: "Just inserted", done: "Sorted part" }),
  ];
}

function mergeSort() {
  const r = new Recorder();
  const original = [38, 27, 43, 3, 9, 82, 10];
  const a = original.slice();
  const show = (lo: number, hi: number, t: Tone, label: string): Panel => array(a, { ids: a.slice(), title: "The list", ranges: [{ from: lo, to: hi, label, tone: t }], tones: tones(span(lo, hi), t) });
  r.step("Merge sort: keep splitting in half until the pieces have 1 item (already sorted), then merge the pieces back together in order.", array(a, { ids: a.slice(), title: "The list" }));
  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const mid = lo + Math.floor((hi - lo + 1) / 2) - 1; // same split as the Python: left half = n // 2 items
    r.step(`Split [${a.slice(lo, hi + 1).join(", ")}] into [${a.slice(lo, mid + 1).join(", ")}] and [${a.slice(mid + 1, hi + 1).join(", ")}].`, show(lo, hi, "compare", "split"));
    sort(lo, mid);
    sort(mid + 1, hi);
    const left = a.slice(lo, mid + 1), right = a.slice(mid + 1, hi + 1);
    const merged: number[] = [];
    let i = 0, j = 0;
    const picks: string[] = [];
    while (i < left.length && j < right.length) { if (left[i] <= right[j]) { picks.push(`${left[i]}`); merged.push(left[i++]); } else { picks.push(`${right[j]}`); merged.push(right[j++]); } }
    merged.push(...left.slice(i), ...right.slice(j));
    for (let k = 0; k < merged.length; k++) a[lo + k] = merged[k];
    r.step(`Merge [${left.join(", ")}] + [${right.join(", ")}]: repeatedly take the smaller front item (${picks.join(", ")}${merged.length > picks.length ? `, then the leftover ${merged.slice(picks.length).join(", ")}` : ""}) → [${merged.join(", ")}].`, show(lo, hi, "new", "merged"), array(left, { title: "left (sorted)", indices: false }), array(right, { title: "right (sorted)", indices: false }));
  };
  sort(0, a.length - 1);
  r.step("Fully sorted. There were about log₂ 7 ≈ 3 levels of splitting, and each level's merges touched all 7 items, so the cost is O(n log n).", array(a, { ids: a.slice(), title: "The list", tones: tones(span(0, a.length - 1), "done") }));
  return [r.visual("Split, then merge", "Sorting 38, 27, 43, 3, 9, 82, 10", { compare: "Being split", new: "Just merged (sorted)", done: "Sorted" })];
}

function quickSort() {
  const r = new Recorder();
  const a = [7, 2, 9, 4, 3, 8, 5];
  const placed = new Set<number>();
  const base = () => tones([...placed], "done");
  r.step("Quicksort: pick a pivot (here, the last item), move smaller items to its left, and the pivot lands in its final spot. Then repeat on each side.", array(a, { ids: a.slice() }));
  let detailed = true;
  const sort = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) { placed.add(lo); r.step(`The range [${lo}..${hi}] has one item (${a[lo]}), so it's already in place.`, array(a, { ids: a.slice(), tones: base() })); return; }
    const pivot = a[hi];
    let store = lo;
    if (detailed) r.step(`Partition indexes ${lo}..${hi}. Pivot = ${pivot} (the last item). 'store' marks where the next small item goes.`, array(a, { ids: a.slice(), tones: { ...base(), [hi]: "active" }, markers: [{ at: store, label: "store" }] }));
    for (let i = lo; i < hi; i++) {
      const small = a[i] < pivot;
      if (small) { [a[i], a[store]] = [a[store], a[i]]; store++; }
      if (detailed) r.step(small ? `${a[store - 1]} < ${pivot}: swap it to the store position and move store right. The small zone is now indexes ${lo}..${store - 1}.` : `${a[i]} ≥ ${pivot}: leave it. It belongs on the right side.`, array(a, { ids: a.slice(), tones: { ...base(), ...tones(span(lo, store - 1), "compare"), [hi]: "active", [i]: small ? "new" : "removed" }, markers: [{ at: store, label: "store" }, { at: i, label: "i" }] }));
    }
    [a[store], a[hi]] = [a[hi], a[store]];
    placed.add(store);
    r.step(`Swap the pivot ${pivot} into index ${store}. Everything left of it is smaller and everything right is bigger, so ${pivot} is in its FINAL position.${detailed ? " Now sort each side the same way." : ""}`, array(a, { ids: a.slice(), tones: { ...base(), ...tones(span(lo, store - 1), "compare"), [store]: "found" } }));
    detailed = false;
    sort(lo, store - 1);
    sort(store + 1, hi);
  };
  sort(0, a.length - 1);
  r.step("Sorted, in place, with no merging. With good pivots each partition splits the range roughly in half: O(n log n) on average.", array(a, { ids: a.slice(), tones: tones(span(0, a.length - 1), "done") }));
  return [r.visual("Partition & recurse", "Sorting 7, 2, 9, 4, 3, 8, 5", { active: "Pivot", compare: "Smaller than pivot", new: "Moved into the small zone", removed: "Stays on the big side", found: "Pivot in final place", done: "In final place" })];
}

function nonComparison() {
  const counting = new Recorder();
  const scores = [3, 1, 4, 1, 5, 2, 3];
  const counts = Array(6).fill(0);
  const countPanel = (t: Record<number, Tone> = {}) => array(counts, { title: "counts[value]", tones: t });
  counting.step("Counting sort: one counter per possible value (0..5). We never compare two scores with each other.", array(scores, { title: "Input" }), countPanel());
  scores.forEach((v, i) => { counts[v]++; counting.step(`Read ${v}, so counts[${v}] += 1 → ${counts[v]}.`, array(scores, { title: "Input", tones: { ...tones(span(0, i - 1), "muted"), [i]: "active" } }), countPanel({ [v]: "new" })); });
  const out: number[] = [];
  counts.forEach((c, v) => { if (!c) return; out.push(...Array(c).fill(v)); counting.step(`counts[${v}] = ${c}, so write ${v} ${c === 1 ? "once" : `${c} times`}.`, countPanel({ [v]: "active" }), array(out, { title: "Output", tones: tones(span(out.length - c, out.length - 1), "new") })); });
  counting.step("Sorted in O(n + k): one pass to count and one pass over the k counters. It needs no comparisons, but k counters, so it only suits small value ranges.", array(out, { title: "Output", tones: tones(span(0, out.length - 1), "done") }));

  const radix = new Recorder();
  let items = [170, 45, 75, 90, 802, 24, 2, 66];
  radix.step("Radix sort: sort by the ones digit, then the tens, then the hundreds. Each pass is a stable bucket pass (0–9).", array(items, { title: "Numbers", ids: items.slice() }));
  for (const place of [1, 10, 100]) {
    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    for (const v of items) buckets[Math.floor(v / place) % 10].push(v);
    radix.step(`Drop each number into the bucket for its ${place}s digit. Within a bucket, numbers keep their current order: that's stability.`, { type: "buckets", title: `Buckets by the ${place}s digit`, buckets: buckets.map(b => b.map(v => ({ label: String(v) }))) });
    items = buckets.flat();
    radix.step(`Read the buckets 0→9: [${items.join(", ")}]. ${place === 1 ? "The list is now ordered by its last digit." : place === 10 ? "Ordered by the last two digits; ties keep the ones-digit order from the previous pass." : "Ordered by all three digits, so it's fully sorted."}`, array(items, { title: "Numbers", ids: items.slice(), tones: place === 100 ? tones(span(0, items.length - 1), "done") : {} }));
  }
  return [
    counting.visual("Counting sort", "Scores 3, 1, 4, 1, 5, 2, 3 (values 0..5)", { active: "Reading", muted: "Already counted", new: "Updated / written", done: "Sorted" }),
    radix.visual("Radix sort", "Numbers 170, 45, 75, 90, 802, 24, 2, 66. Watch three bucket passes, by ones, tens and hundreds digit; each pass keeps the previous order within a bucket.", { done: "Sorted" }),
  ];
}

export const SORTING_TRACES: TraceRegistry = {
  "binary-search": () => binarySearch(),
  "elementary-sorts": () => elementary(),
  "merge-sort": () => mergeSort(),
  "quick-sort": () => quickSort(),
  "non-comparison-sorts": () => nonComparison(),
};
