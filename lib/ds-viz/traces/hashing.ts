import type { Bucket, Panel, TraceRegistry, Tone } from "../types";
import { Recorder, text, vars } from "../helpers";

/** Same toy hash as the lesson code: total = total * 31 + ord(ch). */
function simpleHash(key: string): number {
  let total = 0;
  for (const ch of key) total = total * 31 + ch.charCodeAt(0);
  return total;
}

function chaining() {
  const r = new Recorder();
  let buckets: [string, number][][] = [[], [], [], []];
  const panel = (highlight: Record<number, Tone> = {}, entryTone: Record<string, Tone> = {}, title = `${buckets.length} buckets`): Panel => ({
    type: "buckets", title, tones: highlight,
    buckets: buckets.map(bucket => bucket.map(([key, value]): Bucket => ({ label: `${key}: ${value}`, tone: entryTone[key] }))),
  });
  r.step("We start with 4 empty buckets. Each bucket is a small list that will hold [key, value] pairs.", panel());
  const items: [string, number][] = [["ann", 31], ["bob", 25], ["cat", 40], ["eve", 22]];
  for (const [key, value] of items) {
    const h = simpleHash(key), index = h % buckets.length;
    r.step(`put("${key}", ${value}): simple_hash("${key}") = ${h}, and ${h} % ${buckets.length} = ${index}, so the key goes to bucket ${index}.`, panel({ [index]: "active" }), vars({ key, "hash": h, "index": index }));
    const collision = buckets[index].length > 0;
    buckets[index].push([key, value]);
    r.step(collision ? `Bucket ${index} already holds ${buckets[index].slice(0, -1).map(([k]) => `"${k}"`).join(", ")}. That's a collision, and with chaining it's fine: "${key}" just joins the list.` : `Bucket ${index} was empty, so "${key}" is now the only item there.`, panel({ [index]: "active" }, { [key]: "new" }), vars({ count: buckets.flat().length, "load factor": `${buckets.flat().length}/${buckets.length}` }));
  }
  const bob = simpleHash("bob") % buckets.length;
  r.step(`get("bob"): hash again, which gives bucket ${bob}. We only scan that one bucket: "ann" is not it, "bob" matches, so we return 25. The other buckets are never touched.`, panel({ [bob]: "active" }, { ann: "compare", bob: "found" }));
  const zed = simpleHash("zed") % buckets.length;
  r.step(`get("zed"): it hashes to bucket ${zed}. Scanning that bucket finds no "zed", so the key is missing and we return None.`, panel({ [zed]: "active" }, Object.fromEntries(buckets[zed].map(([k]) => [k, "muted" as Tone]))));
  const dan = simpleHash("dan") % buckets.length;
  buckets[dan].push(["dan", 19]);
  r.step(`put("dan", 19) lands in bucket ${dan} too. Now there are 5 items in 4 buckets, so the load factor is above 1. Bucket ${dan} is getting long, and long chains make lookups slow.`, panel({ [dan]: "removed" }, { dan: "new" }), vars({ count: 5, "load factor": "5/4 > 1" }));
  const old = buckets.flat();
  buckets = Array.from({ length: 8 }, () => []);
  r.step("Time to grow: make 8 empty buckets. Every key has to be placed again, because each index was computed with % 4 and must now use % 8.", panel({}, {}, "8 new buckets"), text(old.map(([k, v]) => `${k}: ${v}`), "Waiting to be re-inserted"));
  for (const [key, value] of old) buckets[simpleHash(key) % 8].push([key, value]);
  r.step(`Done. Using % 8, "ann" and "dan" stay in bucket 1, but "bob" moves to bucket 5. The longest chain is now 2 instead of 3. Doubling keeps the chains short, so get/put stay O(1) on average.`, panel({}, Object.fromEntries(old.map(([k]) => [k, "done" as Tone]))), vars({ count: 5, "load factor": "5/8" }));
  return [r.visual("Insert, collide, look up, grow", "Keys are names. Bucket index = simple_hash(name) % number_of_buckets.", { active: "Bucket being used", new: "Just inserted", found: "Match found", compare: "Checked, not a match", removed: "Too crowded", muted: "Checked, not a match", done: "Re-inserted" })];
}

function probing() {
  const r = new Recorder();
  const size = 8;
  const slots: (string | null)[] = Array(size).fill(null);
  const show = (t: Record<number, Tone> = {}): Panel => ({ type: "buckets", mode: "slots", title: "8 slots (one key each)", buckets: slots.map(key => (key === null ? [] : [{ label: key === "<del>" ? "✝" : key }])), tones: Object.fromEntries(slots.map((key, i) => [i, t[i] ?? (key === null ? "muted" : key === "<del>" ? "removed" : "default")])) });
  r.step("An empty table of 8 slots. Unlike chaining, each slot holds at most one key.", show());
  for (const key of ["ann", "dan", "bob", "amy", "cat"]) {
    const home = simpleHash(key) % size;
    let i = home;
    const tried: number[] = [];
    while (slots[i] !== null) { tried.push(i); i = (i + 1) % size; }
    if (tried.length) r.step(`put("${key}"): home slot is ${home}, but slot ${tried.join(" and ")} ${tried.length > 1 ? "are" : "is"} taken. Linear probing tries the next slot, and the next, until one is free.`, show({ ...Object.fromEntries(tried.map(t => [t, "compare"])), [i]: "active" }), vars({ key, home, landed: i }));
    slots[i] = key;
    r.step(tried.length ? `"${key}" lands in slot ${i}, ${tried.length} step${tried.length > 1 ? "s" : ""} away from home. A later search for "${key}" must walk this same path.` : `put("${key}"): simple_hash % 8 = ${home}. Slot ${home} is free, so "${key}" goes straight in.`, show({ [i]: "new" }), vars({ key, home, landed: i }));
  }
  r.step(`Notice the cluster in slots 5, 6 and 7. Keys that collide pile up next to each other, which is why we keep the table at most about 2/3 full.`, show({ 5: "compare", 6: "compare", 7: "compare" }));
  slots[1] = "<del>";
  r.step(`delete("ann"): we can't just empty slot 1. If we did, a search for "dan" (home = 1) would see an empty slot and stop too early. So we leave a tombstone ✝ there.`, show({ 1: "removed" }));
  r.step(`get("dan"): start at its home, slot 1. The tombstone means "keep going", so we check slot 2 and find "dan". The tombstone kept "dan" reachable.`, show({ 1: "compare", 2: "found" }));
  // get("zed"): walk the real probe path until an empty slot.
  const zed = simpleHash("zed") % size;
  const path: number[] = [];
  let at = zed;
  while (slots[at] !== null) { path.push(at); at = (at + 1) % size; }
  const said = path.map(i => (slots[i] === "<del>" ? `slot ${i} is a tombstone (keep going)` : `slot ${i} holds "${slots[i]}" (not it)`)).join(", ");
  r.step(`get("zed"): home slot ${zed}. ${said ? `${said[0].toUpperCase()}${said.slice(1)}, then slot` : "Slot"} ${at} is truly empty. An inserted "zed" can never sit beyond the first empty slot on its path, so it isn't in the table. Return None.`, show({ ...Object.fromEntries(path.map(i => [i, "compare"])), [at]: "active" }), vars({ home: zed, "stopped at": at, result: "None" }));
  return [r.visual("Linear probing & tombstones", "Home slot = simple_hash(key) % 8. When it's taken, try the next slot.", { muted: "Empty slot", new: "Just placed", compare: "Taken, keep probing", active: "Current slot", removed: "Tombstone (deleted)", found: "Found" })];
}

function lru() {
  const r = new Recorder();
  const capacity = 3;
  let order: string[] = []; // least recent first
  const values: Record<string, number> = {};
  const line = (t: Record<string, Tone> = {}): Panel => ({
    type: "linked", title: "Recency line: least recent (left) to most recent (right)", doubly: true, showNone: false,
    nodes: order.map(key => ({ label: `${key}:${values[key]}`, id: key, tone: t[key] })),
    markers: order.length ? [{ at: 0, label: "evict next", tone: "removed" }, { at: order.length - 1, label: "newest", tone: "done" }] : [],
  });
  const dict = (): Panel => vars(Object.fromEntries(Object.keys(values).sort().map(key => [key, `node(${values[key]})`])), "dict: key → node (O(1) lookup)");
  r.step(`An empty cache with capacity ${capacity}. It has two parts: a dict to find any key instantly, and a recency line that orders the entries by when they were last used.`, line(), dict());
  for (const [key, value] of [["a", 1], ["b", 2], ["c", 3]] as const) {
    order.push(key); values[key] = value;
    r.step(`put("${key}", ${value}): a new key goes into the dict and joins the line at the "newest" end.`, line({ [key]: "new" }), dict());
  }
  order = [...order.filter(k => k !== "a"), "a"];
  r.step(`get("a") returns 1, and reading counts as a use. The dict hands us a's node, which we unlink and move to the newest end in O(1). Now "b" is the least recently used.`, line({ a: "active" }), dict());
  r.step(`put("d", 4): "d" is new and the cache is full (3/3), so something must go. The entry at the "evict next" end, "b", is the one used longest ago.`, line({ b: "removed" }), dict());
  order = order.filter(k => k !== "b"); delete values.b;
  order.push("d"); values.d = 4;
  r.step(`"b" is removed from both the line and the dict, so they always agree. Then "d" joins the newest end. Reading "a" earlier is what saved it from eviction.`, line({ d: "new" }), dict());
  r.step(`get("b") misses because "b" was evicted. The dict lookup fails right away and we return -1. A miss doesn't change the order.`, line(), dict(), vars({ "get('b')": -1 }, "Result"));
  values.c = 30; order = [...order.filter(k => k !== "c"), "c"];
  r.step(`put("c", 30): "c" already exists, so this is an update. We change its value and move it to the newest end. An update never evicts anything.`, line({ c: "active" }), dict());
  return [r.visual("get / put with capacity 3", "Every get or put of a key moves it to the newest end. When the cache is full, the oldest entry is evicted.", { new: "Just added", active: "Just used (moved to newest)", removed: "Evicted" })];
}

export const HASHING_TRACES: TraceRegistry = {
  "hash-table-chaining": () => chaining(),
  "hash-table-open-addressing": () => probing(),
  "lru-cache": () => lru(),
};
