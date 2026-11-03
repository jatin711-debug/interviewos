import type { GridPanel, Panel, TraceRegistry, Tone, TreeNode } from "../types";
import { GraphView, Recorder, array, fmt, text, vars } from "../helpers";

// A shared 6-vertex layout used by several lessons.
const SIX = [{ id: "A", x: 4, y: 30 }, { id: "B", x: 30, y: 6 }, { id: "C", x: 30, y: 54 }, { id: "D", x: 62, y: 6 }, { id: "E", x: 62, y: 54 }, { id: "F", x: 88, y: 30 }];
const WEIGHTED: [string, string, number][] = [["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8], ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["E", "F", 3]];
const key = (u: string, v: string) => `${u}-${v}`;

function representation() {
  const r = new Recorder();
  const edges: [string, string][] = [["A", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["C", "E"], ["D", "E"], ["D", "F"], ["E", "F"]];
  const view = new GraphView(SIX, edges.map(([from, to]) => ({ from, to })));
  const adj: Record<string, string[]> = {};
  const listPanel = () => text(Object.keys(adj).sort().map(v => `${v}: [${adj[v].join(", ")}]`), "Adjacency list (dict)");
  r.step("The input is an edge list: 8 pairs of connected vertices. We'll turn it into an adjacency list one edge at a time.", view.panel(Object.fromEntries(SIX.map(n => [n.id, "muted" as Tone])), Object.fromEntries(edges.map(([u, v]) => [key(u, v), "muted" as Tone]))), text(edges.map(([u, v]) => `(${u}, ${v})`), "Edge list"));
  edges.forEach(([u, v], i) => {
    (adj[u] ??= []).push(v); (adj[v] ??= []).push(u);
    r.step(`Edge (${u}, ${v}): the graph is undirected, so add ${v} to ${u}'s list AND ${u} to ${v}'s list.`, view.panel({ [u]: "active", [v]: "active" }, Object.fromEntries(edges.map(([a, b], j) => [key(a, b), j < i ? "done" : j === i ? "new" : "muted"] as [string, Tone]))), listPanel());
  });
  r.step("To list D's neighbours, read adj['D'] = [B, E, F]. Its degree (number of edges) is 3. The total memory is O(V + E).", view.panel({ D: "active", B: "found", E: "found", F: "found" }, { "B-D": "path", "D-E": "path", "D-F": "path" }), listPanel());
  const names = SIX.map(n => n.id);
  const matrix: GridPanel = { type: "grid", title: "Adjacency matrix (1 = edge)", rowLabels: names, colLabels: names, cells: names.map(a => names.map(b => (adj[a].includes(b) ? 1 : 0))), tones: { "0,3": "removed", "1,3": "found", "3,1": "found" } };
  r.step("The same graph as a matrix: row A, column D holds 0, so there's no edge A–D. Row B, column D holds 1. Each check is O(1), but the grid always has V × V cells, mostly zeros here.", view.panel({ A: "compare", D: "compare", B: "compare" }, { "B-D": "found" }), matrix);
  return [r.visual("Edge list → adjacency list → matrix", "8 undirected edges between A–F. Watch each edge get written into BOTH endpoints' lists, then see the same graph as a 0/1 matrix.", { muted: "Not added yet", new: "Adding now", done: "Added", active: "Endpoints", found: "Neighbour / edge exists", path: "D's edges", removed: "No edge", compare: "Rows/columns checked" })];
}

const BFS_GRAPH: Record<string, string[]> = { A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "F"], D: ["B"], E: ["B", "F"], F: ["C", "E"] };
const BFS_VIEW = new GraphView([{ id: "A", x: 4, y: 30 }, { id: "B", x: 32, y: 10 }, { id: "C", x: 32, y: 50 }, { id: "D", x: 62, y: 2 }, { id: "E", x: 62, y: 30 }, { id: "F", x: 62, y: 58 }], [["A", "B"], ["A", "C"], ["B", "D"], ["B", "E"], ["C", "F"], ["E", "F"]].map(([from, to]) => ({ from, to })));

function bfsDfs() {
  const bfs = new Recorder();
  const visited = new Set(["A"]);
  const queue = ["A"];
  const order: string[] = [];
  const treeEdges: Record<string, Tone> = {};
  const dist: Record<string, number> = { A: 0 };
  const show = (current?: string) => [
    BFS_VIEW.panel(Object.fromEntries(Object.keys(BFS_GRAPH).map(v => [v, v === current ? "active" : order.includes(v) ? "done" : queue.includes(v) ? "compare" : "default"] as [string, Tone])), treeEdges, { subs: Object.fromEntries(Object.entries(dist).map(([v, d]) => [v, `d=${d}`])) }),
    array(queue, { title: "Queue (front on the left)", empty: "empty", indices: false }),
    text([order.join(", ")], "Visited order"),
  ];
  bfs.step("BFS from A. Put A in the queue and mark it visited. Its distance is 0 edges (d=0).", ...show());
  while (queue.length) {
    const v = queue.shift()!;
    order.push(v);
    const fresh = BFS_GRAPH[v].filter(w => !visited.has(w));
    fresh.forEach(w => { visited.add(w); queue.push(w); treeEdges[key(v, w)] = "path"; dist[w] = dist[v] + 1; });
    bfs.step(`Take ${v} from the front. ${fresh.length ? `Unvisited neighbour${fresh.length > 1 ? "s" : ""} ${fresh.join(" and ")} ${fresh.length > 1 ? "are" : "is"} marked visited and added to the back, at distance ${dist[v] + 1}.` : "All its neighbours are already visited, so nothing new is added."}`, ...show(v));
  }
  bfs.step("Done. Vertices came out ring by ring: A (0), then B and C (1), then D, E and F (2). The highlighted edges form a shortest-path tree.", ...show());

  const dfs = new Recorder();
  const seen = new Set<string>();
  const dOrder: string[] = [];
  const stack: string[] = [];
  const dEdges: Record<string, Tone> = {};
  const dshow = (current?: string) => [
    BFS_VIEW.panel(Object.fromEntries(Object.keys(BFS_GRAPH).map(v => [v, v === current ? "active" : stack.includes(v) ? "compare" : seen.has(v) ? "done" : "default"] as [string, Tone])), dEdges),
    { type: "stack", title: "Call stack (recursion)", items: [...stack], empty: "empty" } as Panel,
    text([dOrder.join(", ")], "Visited order"),
  ];
  const go = (v: string, from?: string) => {
    seen.add(v); dOrder.push(v); stack.push(`dfs(${v})`);
    if (from) dEdges[key(from, v)] = "path";
    dfs.step(from ? `From ${from}, dive straight into its first unvisited neighbour ${v}. DFS goes deep before wide.` : "DFS from A: visit A. Then, for each neighbour, if it's unvisited, recurse into it right away.", ...dshow(v));
    for (const w of BFS_GRAPH[v]) if (!seen.has(w)) go(w, v);
    stack.pop();
    dfs.step(`${v} has no unvisited neighbours left. It returns, and we backtrack to ${stack.length ? stack[stack.length - 1].slice(4, -1) : "the start, so the search is done"}.`, ...dshow(stack.length ? stack[stack.length - 1].slice(4, -1) : undefined));
  };
  go("A");
  dfs.step(`DFS order: ${dOrder.join(", ")}. Compare with BFS (A, B, C, D, E, F): DFS reached F through E before ever visiting C.`, ...dshow());
  return [
    bfs.visual("BFS (queue)", "Breadth-first search from A. Watch the queue: vertices leave from the front in order of distance (d=0, then 1, then 2), like ripples spreading.", { active: "Being processed", compare: "In the queue", done: "Finished", path: "Discovery edge" }),
    dfs.visual("DFS (recursion)", "Depth-first search from A on the same graph. Watch the call stack grow as DFS dives deep, and shrink as it backtracks from dead ends.", { active: "Current call", compare: "On the call stack", done: "Finished", path: "Discovery edge" }),
  ];
}

function topo() {
  const r = new Recorder();
  const short: Record<string, string> = { intro: "In", math: "Ma", "data-structures": "DS", algorithms: "Al", systems: "Sy", ml: "ML" };
  const graph: Record<string, string[]> = { intro: ["data-structures"], math: ["algorithms", "ml"], "data-structures": ["algorithms", "systems"], algorithms: ["ml"], systems: [], ml: [] };
  const view = new GraphView([{ id: "intro", label: "In", x: 4, y: 8 }, { id: "math", label: "Ma", x: 4, y: 52 }, { id: "data-structures", label: "DS", x: 36, y: 8 }, { id: "algorithms", label: "Al", x: 60, y: 40 }, { id: "systems", label: "Sy", x: 88, y: 8 }, { id: "ml", label: "ML", x: 88, y: 52 }], Object.entries(graph).flatMap(([from, tos]) => tos.map(to => ({ from, to }))), true);
  const indeg: Record<string, number> = Object.fromEntries(Object.keys(graph).map(v => [v, 0]));
  for (const tos of Object.values(graph)) for (const t of tos) indeg[t]++;
  const order: string[] = [];
  let ready = Object.keys(graph).filter(v => indeg[v] === 0).sort();
  const done = new Set<string>();
  const show = (current?: string, hot: string[] = []) => [
    view.panel(Object.fromEntries(Object.keys(graph).map(v => [v, v === current ? "active" : done.has(v) ? "done" : hot.includes(v) ? "new" : ready.includes(v) ? "compare" : "default"] as [string, Tone])), Object.fromEntries(Object.entries(graph).flatMap(([f, ts]) => ts.map(t => [key(f, t), done.has(f) ? "muted" : "default"] as [string, Tone]))), { subs: Object.fromEntries(Object.keys(graph).filter(v => !done.has(v)).map(v => [v, `in=${indeg[v]}`])) }),
    text([ready.map(v => short[v]).join(", ") || "(empty)"], "Ready (in-degree 0)"),
    text([order.map(v => short[v]).join(" → ") || "(empty)"], "Order so far"),
  ];
  r.step("Arrows mean 'take this course before that one'. 'in' is the in-degree: the number of unmet prerequisites. Intro (In) and Math (Ma) have none, so they're ready.", ...show());
  while (ready.length) {
    const v = ready.shift()!;
    order.push(v); done.add(v);
    const unlocked: string[] = [];
    for (const w of graph[v]) { indeg[w]--; if (indeg[w] === 0) unlocked.push(w); }
    ready = [...ready, ...unlocked].sort();
    r.step(`Take ${short[v]} (alphabetically first among the ready). Remove its arrows: ${graph[v].length ? graph[v].map(w => `${short[w]} drops to in=${indeg[w]}`).join(", ") : "it has none"}.${unlocked.length ? ` ${unlocked.map(w => short[w]).join(" and ")} ${unlocked.length > 1 ? "are" : "is"} now ready.` : ""}`, ...show(v, unlocked));
  }
  r.step(`All 6 courses are placed: ${order.map(v => short[v]).join(" → ")}. Every arrow points forward in this order. If a cycle existed, some courses would never reach in=0 and would be left out.`, ...show());
  return [r.visual("Kahn's algorithm", "Courses: In = intro, Ma = math, DS = data-structures, Al = algorithms, Sy = systems, ML = ml", { compare: "Ready (in-degree 0)", active: "Taken now", new: "Just unlocked", done: "Placed in the order", muted: "Edge removed" })];
}

function dijkstra() {
  const r = new Recorder();
  const view = new GraphView(SIX, WEIGHTED.map(([from, to, w]) => ({ from, to, label: String(w) })));
  const adj: Record<string, [string, number][]> = {};
  for (const [u, v, w] of WEIGHTED) { (adj[u] ??= []).push([v, w]); (adj[v] ??= []).push([u, w]); }
  const dist: Record<string, number> = Object.fromEntries(SIX.map(n => [n.id, Infinity]));
  const prev: Record<string, string | null> = {};
  dist.A = 0;
  const finished = new Set<string>();
  let heap: [number, string][] = [[0, "A"]];
  const treeEdges = () => Object.fromEntries(Object.entries(prev).filter(([, p]) => p).map(([v, p]) => [key(p!, v), "path" as Tone]));
  const show = (current?: string, relaxing?: string, edge?: string) => [
    view.panel(Object.fromEntries(SIX.map(n => [n.id, n.id === current ? "active" : n.id === relaxing ? "compare" : finished.has(n.id) ? "done" : "default"] as [string, Tone])), { ...treeEdges(), ...(edge ? { [edge]: "compare" } : {}) }, { subs: Object.fromEntries(SIX.map(n => [n.id, fmt(dist[n.id])])) }),
    text([heap.slice().sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1])).map(([d, v]) => `(${d}, ${v})`).join("  ") || "(empty)"], "Min-heap of (distance, vertex)"),
  ];
  r.step("Shortest distances from A. Under each vertex is its best-known distance: 0 for A, ∞ (unknown) for the rest. The heap holds (0, A).", ...show());
  while (heap.length) {
    heap.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
    const [d, u] = heap.shift()!;
    if (d > dist[u]) { r.step(`Pop (${d}, ${u}), but ${u} already has distance ${dist[u]}. This entry is out of date, so skip it.`, ...show()); continue; }
    finished.add(u);
    r.step(`Pop (${d}, ${u}): ${u} is the closest unfinished vertex, so its distance ${d} is FINAL. No other route can be shorter, because every other route already costs at least ${d} before adding more non-negative edges.`, ...show(u));
    for (const [v, w] of adj[u]) {
      if (finished.has(v)) continue;
      const edge = SIX.findIndex(n => n.id === u) < SIX.findIndex(n => n.id === v) ? key(u, v) : key(v, u);
      if (d + w < dist[v]) {
        const old = dist[v];
        dist[v] = d + w; prev[v] = u; heap.push([dist[v], v]);
        r.step(`Relax ${u}→${v}: ${d} + ${w} = ${d + w} beats ${fmt(old)}, so update ${v} to ${d + w} and push (${d + w}, ${v}).`, ...show(u, v, edge));
      } else r.step(`Relax ${u}→${v}: ${d} + ${w} = ${d + w} is not better than ${v}'s current ${dist[v]}. No change.`, ...show(u, v, edge));
    }
  }
  r.step(`All vertices are final. A→B is 3 (via C, not the direct 4-edge), and A→F is ${dist.F}. The highlighted edges form the shortest-path tree, so following them back from any vertex gives its route.`, ...show());
  return [r.visual("Dijkstra from A", "Edge labels are weights. Numbers under the vertices are the best-known distances.", { active: "Finalised now", compare: "Edge / vertex being relaxed", done: "Final distance", path: "Shortest-path tree" })];
}

function bellmanFloyd() {
  const bf = new Recorder();
  const edges: [string, string, number][] = [["S", "A", 4], ["S", "B", 5], ["B", "A", -3], ["A", "C", 2], ["B", "C", 4]];
  const view = new GraphView([{ id: "S", x: 4, y: 30 }, { id: "A", x: 45, y: 4 }, { id: "B", x: 45, y: 56 }, { id: "C", x: 88, y: 30 }], edges.map(([from, to, w]) => ({ from, to, label: String(w) })), true);
  const dist: Record<string, number> = { S: 0, A: Infinity, B: Infinity, C: Infinity };
  const show = (hot?: string, edge?: string, tone: Tone = "compare") => view.panel(hot ? { [hot]: tone === "new" ? "new" : "compare" } : {}, edge ? { [edge]: tone } : {}, { subs: Object.fromEntries(Object.entries(dist).map(([v, d]) => [v, fmt(d)])) });
  bf.step("Bellman-Ford from S. Note the NEGATIVE edge B→A (−3), which Dijkstra can't handle. Each round relaxes every edge, in the same fixed order.", show());
  for (let round = 1; round <= 3; round++) {
    let changed = false;
    for (const [u, v, w] of edges) {
      if (dist[u] + w < dist[v]) {
        const old = dist[v]; dist[v] = dist[u] + w; changed = true;
        bf.step(`Round ${round}, edge ${u}→${v} (${w}): ${fmt(dist[u])} + ${w < 0 ? `(${w})` : w} = ${dist[v]} < ${fmt(old)}, so update ${v} to ${dist[v]}.`, show(v, key(u, v), "new"));
      } else bf.step(`Round ${round}, edge ${u}→${v} (${w}): ${fmt(dist[u])} + ${w < 0 ? `(${w})` : w} = ${fmt(dist[u] + w)} is not better than ${fmt(dist[v])}.`, show(undefined, key(u, v)));
    }
    if (!changed) { bf.step(`Round ${round} changed nothing, so every distance is final and we can stop early. S→A is 2 (via B, using the −3 edge), and S→C is 4.`, show()); break; }
  }
  const fw = new Recorder();
  const INF = Infinity, n = 4;
  const d: number[][] = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : INF)));
  for (const [u, v, w] of [[0, 1, 3], [1, 2, 1], [0, 2, 7], [2, 3, 2], [3, 0, 1]]) d[u][v] = w;
  const grid = (t: Record<string, Tone> = {}, title = "dist[i][j]"): GridPanel => ({ type: "grid", title, rowLabels: ["0", "1", "2", "3"], colLabels: ["→0", "→1", "→2", "→3"], cells: d.map(row => row.map(fmt)), tones: t });
  fw.step("Floyd-Warshall: start with direct edges only (0 on the diagonal, ∞ where there's no direct edge). Edges: 0→1 (3), 1→2 (1), 0→2 (7), 2→3 (2), 3→0 (1).", grid());
  for (let k = 0; k < n; k++) {
    const changed: string[] = [];
    const notes: string[] = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (d[i][k] + d[k][j] < d[i][j]) { notes.push(`${i}→${j}: ${fmt(d[i][j])} → ${d[i][k] + d[k][j]} (via ${k})`); d[i][j] = d[i][k] + d[k][j]; changed.push(`${i},${j}`); }
    const t: Record<string, Tone> = {};
    for (let i = 0; i < n; i++) { t[`${i},${k}`] = "compare"; t[`${k},${i}`] = "compare"; }
    for (const c of changed) t[c] = "new";
    fw.step(`Allow vertex ${k} as a stop-over. For every pair (i, j), check whether dist[i][${k}] + dist[${k}][j] is shorter. ${changed.length ? `Improved: ${notes.join("; ")}.` : "Nothing improves."}`, grid(t, `dist after allowing stop-overs 0..${k}`));
  }
  fw.step("All stop-overs have been tried, so the table holds the shortest distance between every pair. That's three nested loops: O(V³).", grid());
  return [
    bf.visual("Bellman-Ford (negative edge)", "Numbers under the vertices are the current best distances from S.", { compare: "Edge checked, no change", new: "Improved" }),
    fw.visual("Floyd-Warshall (all pairs)", "4 vertices, directed edges 0→1 (3), 1→2 (1), 0→2 (7), 2→3 (2), 3→0 (1). Watch ∞ cells fill in as each vertex k is allowed as a stop-over.", { compare: "Row/column of the stop-over k", new: "Improved via k" }),
  ];
}

function unionFind() {
  const r = new Recorder();
  const n = 8;
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = Array(n).fill(1);
  const forest = (t: Record<number, Tone> = {}): Panel[] => {
    const roots = parent.map((p, i) => (p === i ? i : -1)).filter(i => i >= 0);
    const build = (v: number): TreeNode => ({ label: String(v), tone: t[v], children: parent.map((p, i) => (p === v && i !== v ? i : -1)).filter(i => i >= 0).map(build) });
    return roots.map(root => ({ type: "tree", binary: false, compact: true, title: `group of ${root}`, root: build(root) }));
  };
  const parr = (t: Record<number, Tone> = {}) => array(parent, { title: "parent list", tones: t });
  const find = (x: number) => { let root = x; while (parent[root] !== root) root = parent[root]; return root; };
  r.step("8 items, each in its own group: everyone is their own root (parent[i] = i).", ...forest(), parr());
  for (const [a, b] of [[0, 1], [2, 3], [1, 3], [4, 5], [6, 7], [5, 7]]) {
    let ra = find(a), rb = find(b);
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    const explain = ra === a && rb === b ? "" : ` find(${a}) = ${find(a)} and find(${b}) = ${find(b)}: we link the ROOTS, not ${a} and ${b} themselves.`;
    parent[rb] = ra; size[ra] += size[rb];
    r.step(`union(${a}, ${b}):${explain} Hang root ${rb} under root ${ra}${size[ra] - size[rb] > size[rb] ? " (the smaller tree goes under the bigger one)" : ""}.`, ...forest({ [rb]: "new", [ra]: "found" }), parr({ [rb]: "new" }));
  }
  const compress = (x: number) => {
    const path: number[] = [];
    let v = x;
    while (parent[v] !== v) { path.push(v); v = parent[v]; }
    const root = v;
    r.step(`find(${x}): climb ${[...path, root].join(" → ")}. The root is ${root}.`, ...forest(Object.fromEntries([...path.map(p => [p, "path"]), [root, "found"]])), parr());
    for (const p of path) parent[p] = root;
    r.step(`Path compression: point everything on that path straight at ${root}. Next time find(${x}) takes one step.`, ...forest({ [x]: "new", [root]: "found" }), parr({ [x]: "new" }));
  };
  compress(3);
  compress(7);
  r.step("connected(3, 1)? Both have root 0, so yes. connected(7, 0)? Roots 4 and 0 differ, so no. Two groups remain: {0, 1, 2, 3} and {4, 5, 6, 7}.", ...forest({ 3: "compare", 1: "compare", 7: "removed", 0: "removed" }), parr());
  return [r.visual("union, find & path compression", "8 items in 8 groups. Watch roots get linked by union, then watch find re-point a whole path straight at the root (path compression).", { new: "Re-pointed", found: "Root", path: "Path climbed", compare: "Same root → connected", removed: "Different roots" })];
}

function mst() {
  const r = new Recorder();
  const view = new GraphView(SIX, WEIGHTED.map(([from, to, w]) => ({ from, to, label: String(w) })));
  const parent: Record<string, string> = Object.fromEntries(SIX.map(n => [n.id, n.id]));
  const find = (x: string): string => (parent[x] === x ? x : find(parent[x]));
  const status: Record<string, Tone> = {};
  const sorted = [...WEIGHTED].sort((a, b) => a[2] - b[2] || a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
  let total = 0, taken = 0;
  const groups = () => { const g: Record<string, string[]> = {}; for (const n of SIX) (g[find(n.id)] ??= []).push(n.id); return Object.values(g).map(x => `{${x.join(", ")}}`).join("  "); };
  const show = (hot?: string, nodes: Record<string, Tone> = {}) => [view.panel(nodes, { ...status, ...(hot ? { [hot]: status[hot] ?? "compare" } : {}) }), text([groups()], "Connected groups (union-find)"), vars({ "edges taken": taken, "total cost": total })];
  r.step(`Kruskal: sort the edges by weight: ${sorted.map(e => `${e[0]}${e[1]}(${e[2]})`).join(", ")}. Then try each in order. Every vertex starts in its own group.`, ...show());
  for (const [u, v, w] of sorted) {
    if (taken === SIX.length - 1) { r.step(`We already have ${taken} = V − 1 edges, so every vertex is connected. The remaining edges are never needed.`, ...show()); break; }
    const k = key(u, v);
    if (find(u) === find(v)) {
      status[k] = "removed";
      r.step(`${u}–${v} (${w}): ${u} and ${v} are already in the same group, so this edge would close a cycle. Skip it.`, ...show(k, { [u]: "removed", [v]: "removed" }));
    } else {
      parent[find(u)] = find(v); status[k] = "path"; total += w; taken++;
      r.step(`${u}–${v} (${w}): ${u} and ${v} are in different groups, so take it and merge the groups. It's the cheapest way left to join them.`, ...show(k, { [u]: "new", [v]: "new" }));
    }
  }
  r.step(`Minimum spanning tree: ${taken} edges with total cost ${total}. It connects all 6 vertices with no cycles, as cheaply as possible.`, view.panel({}, Object.fromEntries(Object.entries(status).filter(([, t]) => t === "path").map(([e]) => [e, "path" as Tone]))), vars({ "total cost": total }));
  return [r.visual("Kruskal's algorithm", "Edge labels are costs.", { path: "Taken (in the MST)", removed: "Skipped (would make a cycle)", new: "Groups merged" })];
}

function sccBridges() {
  const scc = new Recorder();
  const g: Record<string, string[]> = { A: ["B"], B: ["C"], C: ["A", "D"], D: ["E"], E: ["D", "F"], F: [] };
  const pos = [{ id: "A", x: 4, y: 30 }, { id: "B", x: 26, y: 4 }, { id: "C", x: 26, y: 56 }, { id: "D", x: 54, y: 30 }, { id: "E", x: 76, y: 4 }, { id: "F", x: 92, y: 50 }];
  const forward = new GraphView(pos, Object.entries(g).flatMap(([from, tos]) => tos.map(to => ({ from, to }))), true);
  const backward = new GraphView(pos, Object.entries(g).flatMap(([from, tos]) => tos.map(to => ({ from: to, to: from }))), true);
  const order: string[] = [];
  const seen = new Set<string>();
  const dfs1 = (v: string) => { seen.add(v); for (const w of g[v]) if (!seen.has(w)) dfs1(w); order.push(v); scc.step(`${v} finishes: everything reachable from it has been explored. Add it to the finish order.`, forward.panel(Object.fromEntries([...seen].map(x => [x, order.includes(x) ? (x === v ? "active" : "done") : "compare"] as [string, Tone])), {}), text([order.join(", ")], "Finish order")); };
  scc.step("Pass 1: DFS from A over the original edges. We record each vertex when it FINISHES.", forward.panel(), text([], "Finish order"));
  dfs1("A");
  scc.step("Pass 2 uses the REVERSED graph (every arrow flipped). We start from the vertex that finished last: A.", backward.panel(), text([order.slice().reverse().join(", ")], "Reverse finish order"));
  const comp: Record<string, Tone> = {};
  const colours: Tone[] = ["found", "path", "new"];
  const seen2 = new Set<string>();
  const rev: Record<string, string[]> = Object.fromEntries(Object.keys(g).map(v => [v, []]));
  for (const [v, tos] of Object.entries(g)) for (const t of tos) rev[t].push(v);
  let c = 0;
  for (const v of order.slice().reverse()) {
    if (seen2.has(v)) continue;
    const group: string[] = [];
    const go = (x: string) => { seen2.add(x); group.push(x); for (const w of rev[x]) if (!seen2.has(w)) go(w); };
    go(v);
    for (const x of group) comp[x] = colours[c % colours.length];
    scc.step(`DFS from ${v} in the reversed graph reaches exactly {${group.sort().join(", ")}}. That's one strongly connected component. ${group.length > 1 ? "Every vertex in it can reach every other." : `${v} can't get back to anything that reaches it, so it's alone.`}`, backward.panel(comp), text([order.slice().reverse().join(", ")], "Reverse finish order"));
    c++;
  }
  scc.step("Three SCCs: {A, B, C} (a cycle), {D, E} (they point at each other) and {F}. Shrink each to a dot and the graph becomes a DAG: ABC → DE → F.", forward.panel(comp));

  const br = new Recorder();
  const roads: Record<number, number[]> = { 1: [2, 3], 2: [1, 3], 3: [1, 2, 4], 4: [3, 5], 5: [4, 6, 7], 6: [5, 7], 7: [5, 6] };
  const rv = new GraphView([{ id: "1", x: 4, y: 8 }, { id: "2", x: 4, y: 52 }, { id: "3", x: 26, y: 30 }, { id: "4", x: 50, y: 30 }, { id: "5", x: 72, y: 30 }, { id: "6", x: 94, y: 8 }, { id: "7", x: 94, y: 52 }], [[1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [5, 6], [5, 7], [6, 7]].map(([a, b]) => ({ from: String(a), to: String(b) })));
  const tin: Record<number, number> = {}, low: Record<number, number> = {};
  const found: string[] = [];
  let timer = 0;
  const subs = () => Object.fromEntries(Object.keys(tin).map(v => [v, `${tin[+v]}/${low[+v]}`]));
  const dfs = (v: number, p: number | null) => {
    tin[v] = low[v] = timer++;
    for (const w of roads[v]) {
      if (w === p) continue;
      if (w in tin) low[v] = Math.min(low[v], tin[w]);
      else { dfs(w, v); low[v] = Math.min(low[v], low[w]); if (low[w] > tin[v]) found.push(`${Math.min(v, w)}-${Math.max(v, w)}`); }
    }
  };
  br.step("Find the bridges: edges whose removal disconnects the graph. One DFS from 1 gives each vertex tin (visit time) and low (the earliest tin reachable from its subtree using one back edge). They're shown as tin/low.", rv.panel());
  dfs(1, null);
  br.step("After the DFS: the triangle 1-2-3 all reach back to tin 0, and the triangle 5-6-7 all reach back to 4 (vertex 5's tin). Vertex 4 can only reach itself (low 3).", rv.panel({}, {}, { subs: subs() }));
  for (const e of found) {
    const [a, b] = e.split("-").map(Number);
    br.step(`Edge ${a}–${b}: low[${b}] = ${low[b]} > tin[${a}] = ${tin[a]}. Nothing below ${b} can climb back to ${a} or above, so this edge is the only link: a BRIDGE.`, rv.panel({ [a]: "compare", [b]: "compare" }, Object.fromEntries(found.map(f => [f, f === e ? "removed" : "default"] as [string, Tone])), { subs: subs() }));
  }
  br.step(`Bridges: ${found.join(" and ")}. Every other edge lies on a cycle (a triangle), so removing it leaves another way round.`, rv.panel({}, Object.fromEntries(found.map(f => [f, "removed" as Tone])), { subs: subs() }));
  return [
    scc.visual("Strongly connected components", "Kosaraju: finish order, then DFS on the reversed graph.", { compare: "Being explored", active: "Just finished", done: "Finished", found: "Component 1", path: "Component 2", new: "Component 3" }),
    br.visual("Bridges (tin/low)", "An undirected graph made of two triangles joined by the path 3–4–5. Watch which edges have no 'way round' when the low values are compared.", { removed: "Bridge", compare: "Endpoints" }),
  ];
}

export const GRAPHS_TRACES: TraceRegistry = {
  "graph-representation": () => representation(),
  "bfs-dfs": () => bfsDfs(),
  "topological-sort": () => topo(),
  dijkstra: () => dijkstra(),
  "bellman-ford-floyd-warshall": () => bellmanFloyd(),
  "union-find": () => unionFind(),
  "minimum-spanning-tree": () => mst(),
  "scc-bridges": () => sccBridges(),
};
