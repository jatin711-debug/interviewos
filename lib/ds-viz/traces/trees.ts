import type { Panel, TraceRegistry, Tone, TreeNode } from "../types";
import { Recorder, array, bnode, heapTree, text, toTree, vars, type BNode } from "../helpers";

const treePanel = (root: BNode | null, toneOf: (node: BNode) => Tone | undefined, title = "Tree", subOf?: (node: BNode) => string | undefined): Panel => ({ type: "tree", title, root: toTree(root, toneOf, subOf) });

// ---------------------------------------------------------------- binary tree traversals
function sample(): BNode { return bnode(1, bnode(2, bnode(4), bnode(5)), bnode(3, null, bnode(6))); }

function traversal(kind: "pre" | "in" | "post") {
  const r = new Recorder();
  const root = sample();
  const order: BNode[] = [];
  const walk = (node: BNode | null) => {
    if (!node) return;
    if (kind === "pre") order.push(node);
    walk(node.left);
    if (kind === "in") order.push(node);
    walk(node.right);
    if (kind === "post") order.push(node);
  };
  walk(root);
  const rule = { pre: "node → left → right", in: "left → node → right", post: "left → right → node" }[kind];
  r.step(`Rule: ${rule}. Grey nodes haven't been visited yet. Follow along and predict the next node before you click.`, treePanel(root, () => undefined), text([], "Visited order"));
  order.forEach((node, i) => {
    const visited = new Set(order.slice(0, i));
    const why = kind === "pre" ? (i === 0 ? "Preorder visits the node first, so the root comes first." : `Visit ${node.value} as soon as we arrive, before its children.`)
      : kind === "in" ? (node.left && visited.has(node.left) ? `${node.value}'s left subtree is finished, so now visit ${node.value} itself, then go right.` : `${node.value} has no unvisited left child, so visit it now.`)
      : (node.left || node.right ? `Both of ${node.value}'s subtrees are done, so ${node.value} is visited last.` : `${node.value} is a leaf with no children to wait for, so visit it.`);
    r.step(`Visit ${node.value}. ${why}`, treePanel(root, n => (n === node ? "active" : visited.has(n) ? "done" : undefined)), text([order.slice(0, i + 1).map(n => n.value).join(", ")], "Visited order"));
  });
  r.step(`${kind}order result: ${order.map(n => n.value).join(", ")}. Every node is visited exactly once, so this is O(n).`, treePanel(root, () => "done"), text([order.map(n => n.value).join(", ")], "Visited order"));
  return r.visual(`${kind === "pre" ? "Pre" : kind === "in" ? "In" : "Post"}order`, `Rule: ${rule}`, { active: "Visiting now", done: "Already visited" });
}

function levelOrder() {
  const r = new Recorder();
  const root = sample();
  const queue: BNode[] = [root];
  const seen: BNode[] = [];
  const show = (current?: BNode): Panel[] => [treePanel(root, n => (n === current ? "active" : seen.includes(n) ? "done" : queue.includes(n) ? "compare" : undefined)), array(queue.map(n => n.value), { title: "Queue (front on the left)", empty: "empty", indices: false }), text([seen.map(n => n.value).join(", ")], "Visited order")];
  r.step("Level order uses a queue. Start with just the root in it.", ...show());
  while (queue.length) {
    const node = queue.shift()!;
    seen.push(node);
    const kids = [node.left, node.right].filter((k): k is BNode => !!k);
    queue.push(...kids);
    r.step(`Take ${node.value} from the front and visit it. ${kids.length ? `Add its children ${kids.map(k => k.value).join(" and ")} to the BACK of the queue.` : "It has no children."}`, ...show(node));
  }
  r.step("The queue is empty, so we're done: 1 | 2, 3 | 4, 5, 6, one level at a time. This is breadth-first search on a tree.", ...show());
  return r.visual("Level order", "Row by row, using a queue.", { active: "Visiting now", done: "Visited", compare: "Waiting in the queue" });
}

// ---------------------------------------------------------------- BST
function bstInsert(root: BNode | null, value: number): BNode {
  if (!root) return bnode(value);
  if (value < (root.value as number)) root.left = bstInsert(root.left, value);
  else if (value > (root.value as number)) root.right = bstInsert(root.right, value);
  return root;
}

function bst() {
  const build = new Recorder();
  let root: BNode | null = null;
  build.step("An empty BST. We'll insert 50, 30, 70, 20, 40, 60, 80, and each value walks down comparing as it goes.", { type: "tree", title: "BST", root: null, empty: "empty tree (root = None)" });
  for (const value of [50, 30, 70, 20, 40, 60, 80]) {
    const path: BNode[] = [];
    for (let n = root; n; n = value < (n.value as number) ? n.left : n.right) path.push(n);
    root = bstInsert(root, value);
    const steps = path.map(n => `${value} ${value < (n.value as number) ? "<" : ">"} ${n.value} → go ${value < (n.value as number) ? "left" : "right"}`);
    build.step(path.length ? `insert(${value}): ${steps.join(", then ")}. That spot is empty, so ${value} goes there.` : `insert(${value}): the tree is empty, so ${value} becomes the root.`, treePanel(root, n => (n.value === value ? "new" : path.includes(n) ? "path" : undefined), "BST"));
  }
  const search = (target: number) => {
    const path: BNode[] = [];
    let n = root;
    while (n) { path.push(n); if (n.value === target) break; n = target < (n.value as number) ? n.left : n.right; }
    path.forEach((node, i) => build.step(node.value === target ? `search(${target}): ${target} == ${node.value}. Found it after ${i + 1} comparisons. We only looked at one path, never the rest of the tree.` : `search(${target}): ${target} ${target < (node.value as number) ? "<" : ">"} ${node.value}, so go ${target < (node.value as number) ? "left" : "right"}. ${target < (node.value as number) ? "Everything on the right" : "Everything on the left"} is ruled out.`, treePanel(root, x => (x === node ? (x.value === target ? "found" : "active") : path.slice(0, i).includes(x) ? "path" : undefined), "BST")));
    if (!n) build.step(`search(${target}): we fell off the tree below ${path[path.length - 1].value}, where ${target} would have to be. So ${target} isn't in the tree.`, treePanel(root, x => (path.includes(x) ? "removed" : undefined), "BST"));
  };
  search(60);
  search(65);
  build.step("Inorder (left, node, right) visits 20, 30, 40, 50, 60, 70, 80. That's sorted, because of the left < node < right rule.", treePanel(root, () => "done", "BST"), text(["20, 30, 40, 50, 60, 70, 80"], "Inorder"));

  const del = new Recorder();
  root = null;
  for (const value of [50, 30, 70, 20, 40, 60, 80]) root = bstInsert(root, value);
  const r0 = root!;
  del.step("delete(20): 20 is a leaf (no children), so we just remove it. Its parent's left pointer becomes None.", treePanel(r0, n => (n.value === 20 ? "removed" : undefined), "BST"));
  r0.left!.left = null;
  del.step("delete(30): 30 now has one child (40). Replace 30 with that child, so 50's left pointer goes straight to 40.", treePanel(r0, n => (n.value === 30 ? "removed" : n.value === 40 ? "compare" : undefined), "BST"));
  r0.left = r0.left!.right;
  del.step("delete(50): the root has two children, so we can't just drop it. Find its successor: go right once (70), then left as far as possible (60). 60 is the next value bigger than 50.", treePanel(r0, n => (n.value === 50 ? "removed" : n.value === 70 ? "path" : n.value === 60 ? "active" : undefined), "BST"));
  r0.value = 60;
  del.step("Copy 60 into the root. 60 is still bigger than everything on the left and smaller than everything on the right, so the BST rule holds. Now delete the old 60 from the right subtree.", treePanel(r0, n => (n === r0 ? "new" : n.value === 60 ? "removed" : undefined), "BST"));
  r0.right!.left = null;
  del.step("The old 60 was a leaf, so removing it is easy. The tree is 40, 60, 70, 80 in order. Still a valid BST.", treePanel(r0, n => (n === r0 ? "new" : undefined), "BST"), text(["40, 60, 70, 80"], "Inorder"));

  const chain = new Recorder();
  let c: BNode | null = null;
  for (const value of [1, 2, 3, 4, 5]) {
    c = bstInsert(c, value);
    chain.step(value === 1 ? "Insert 1, 2, 3, 4, 5, already in sorted order. 1 becomes the root." : `Insert ${value}: it's bigger than everything so far, so it always goes right. The tree is turning into a chain.`, treePanel(c, n => (n.value === value ? "new" : undefined), "BST of sorted input"));
  }
  chain.step("Height 5 for 5 nodes. Searching for 5 checks every node, which is O(n), just like a linked list. Self-balancing trees (AVL, red-black) prevent this.", treePanel(c, () => "removed", "BST of sorted input"));
  return [
    build.visual("Insert & search", "Insert 50, 30, 70, 20, 40, 60, 80, then search for 60 and 65. Watch each value walk down one path, turning left or right at every node.", { new: "Just inserted", path: "Path walked", active: "Comparing", found: "Found", removed: "Searched, not there", done: "Inorder = sorted" }),
    del.visual("Delete (3 cases)", "Delete a leaf (20), a node with one child (30) and a node with two children (50). Watch how the successor 60 moves up to replace 50.", { removed: "Being deleted", compare: "Takes its place", path: "Walked to find the successor", active: "Successor", new: "Replaced value" }),
    chain.visual("Worst case: sorted input", "Insert 1, 2, 3, 4, 5 in sorted order. Watch the 'tree' turn into a straight chain.", { new: "Just inserted", removed: "Every search walks the whole chain" }),
  ];
}

// ---------------------------------------------------------------- AVL
interface ANode extends BNode { height: number; left: ANode | null; right: ANode | null }
function avl() {
  const r = new Recorder();
  const h = (n: ANode | null) => (n ? n.height : 0);
  const upd = (n: ANode) => { n.height = 1 + Math.max(h(n.left), h(n.right)); };
  const bal = (n: ANode) => h(n.left) - h(n.right);
  const rotR = (y: ANode): ANode => { const x = y.left!; y.left = x.right; x.right = y; upd(y); upd(x); return x; };
  const rotL = (x: ANode): ANode => { const y = x.right!; x.right = y.left; y.left = x; upd(x); upd(y); return y; };
  let root: ANode | null = null;
  const show = (t: Record<number, Tone> = {}, title = "AVL tree (small text = balance factor)"): Panel => treePanel(root, n => t[n.value as number], title, n => { const b = bal(n as ANode); return `bal ${b > 0 ? "+" : ""}${b}`; });
  const ins = (node: ANode | null, value: number): ANode => {
    if (!node) return { value, left: null, right: null, height: 1 };
    if (value < (node.value as number)) node.left = ins(node.left, value); else node.right = ins(node.right, value);
    upd(node);
    const b = bal(node);
    const fix = (kind: string, explain: string, apply: () => ANode) => {
      r.step(`Walking back up from ${value}: node ${node.value} now has balance ${b > 0 ? "+" : ""}${b}, which is outside -1..+1. This is the ${kind} case. ${explain}`, show({ [node.value as number]: "removed", [value]: "new" }));
      return apply();
    };
    if (b > 1 && value < (node.left!.value as number)) return fix("Left-Left", `Fix: rotate right at ${node.value}, which lifts ${node.left!.value} up.`, () => rotR(node));
    if (b < -1 && value > (node.right!.value as number)) return fix("Right-Right", `Fix: rotate left at ${node.value}, which lifts ${node.right!.value} up.`, () => rotL(node));
    if (b > 1) return fix("Left-Right", `Fix: rotate left at ${node.left!.value} (making it Left-Left), then rotate right at ${node.value}.`, () => { node.left = rotL(node.left!); return rotR(node); });
    if (b < -1) return fix("Right-Left", `Fix: rotate right at ${node.right!.value} (making it Right-Right), then rotate left at ${node.value}. ${node.right!.left!.value} (the middle value) ends up on top.`, () => { node.right = rotR(node.right!); return rotL(node); });
    return node;
  };
  r.step("Insert 10, 20, 30, 40, 50, 25 into an AVL tree. In a plain BST, the first five would form a chain. Under each node is its balance factor = height(left) − height(right). It must stay between −1 and +1.", { type: "tree", title: "AVL tree", root: null });
  for (const value of [10, 20, 30, 40, 50, 25]) {
    const before = r.steps.length;
    root = ins(root, value);
    const rotated = r.steps.length > before;
    r.step(rotated ? `After the rotation every balance factor is back in −1..+1. The BST order is unchanged; only the shape changed. Root is now ${root.value}.` : `insert(${value}): a normal BST insert. Every balance factor is still within −1..+1, so no rotation is needed.`, show({ [value]: "new", ...(rotated ? { [root.value as number]: "done" } : {}) }));
  }
  r.step(`Final height is ${root!.height} for 6 nodes. A plain BST with the same inserts would have height 5. AVL keeps the height near log₂ n, so every search is O(log n).`, show());
  return [r.visual("Insertions with rotations", "Insert 10, 20, 30, 40, 50, 25. Watch the balance factors under each node; when one hits ±2, a rotation lifts a node up and the tree glides back into balance.", { new: "Just inserted", removed: "Out of balance", done: "New subtree root after rotation" })];
}

// ---------------------------------------------------------------- heap
function heap() {
  const r = new Recorder();
  const items: number[] = [];
  const show = (t: Record<number, Tone> = {}): Panel[] => [{ type: "tree", title: "As a tree (parent ≤ children)", root: heapTree(items, i => t[i]) }, array(items, { title: "As a list (what's really stored)", tones: t, empty: "[]", ids: items.slice() })];
  r.step("An empty min-heap. It's just a list, and we draw it as a tree: index i has children 2i+1 and 2i+2.", ...show());
  for (const value of [5, 3, 8, 1, 9, 2]) {
    items.push(value);
    let i = items.length - 1;
    r.step(`push(${value}): append it at the end (index ${i}), the next free spot in the bottom row.`, ...show({ [i]: "new" }));
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (items[i] >= items[p]) { r.step(`${items[i]} ≥ its parent ${items[p]}, so the rule holds. Stop sifting up.`, ...show({ [i]: "done", [p]: "compare" })); break; }
      r.step(`${items[i]} < its parent ${items[p]} (index ${p}). That breaks the rule, so swap them.`, ...show({ [i]: "active", [p]: "compare" }));
      [items[i], items[p]] = [items[p], items[i]];
      i = p;
    }
    if (i === 0 && items.length > 1) r.step(`${items[0]} reached the root. It's the new minimum.`, ...show({ 0: "found" }));
  }
  const smallest = items[0];
  const last = items.pop()!;
  items[0] = last;
  r.step(`pop(): the answer is the root, ${smallest}. To fill the hole, move the LAST item (${last}) to the root. The tree stays complete, but ${last} is probably too big up there.`, ...show({ 0: "active" }), vars({ returned: smallest }));
  let i = 0;
  while (true) {
    const l = 2 * i + 1, rr = 2 * i + 2;
    let c = i;
    if (l < items.length && items[l] < items[c]) c = l;
    if (rr < items.length && items[rr] < items[c]) c = rr;
    if (c === i) { r.step(`${items[i]} is ≤ all its children, so the heap rule holds again. pop() did only O(log n) swaps.`, ...show({ [i]: "done" })); break; }
    r.step(`Sift down: ${items[i]}'s smaller child is ${items[c]}. Swap with the SMALLER child so the new parent is ≤ both children.`, ...show({ [i]: "active", [c]: "compare" }));
    [items[i], items[c]] = [items[c], items[i]];
    i = c;
  }
  r.step(`The minimum is ${items[0]} again, at index 0. peek() is O(1); push and pop are O(log n) because they walk one path of a tree of height log₂ n.`, ...show({ 0: "found" }));
  return [r.visual("push (sift up) and pop (sift down)", "Push 5, 3, 8, 1, 9, 2, then pop once.", { new: "Just added", active: "Moving item", compare: "Compared with", done: "In place", found: "Minimum (root)" })];
}

// ---------------------------------------------------------------- trie
interface TNode { children: Map<string, TNode>; word: boolean }
function trie() {
  const r = new Recorder();
  const root: TNode = { children: new Map(), word: false };
  const toPanel = (tone: (path: string, node: TNode) => Tone | undefined): Panel => {
    const conv = (node: TNode, path: string, letter: string): TreeNode => ({ label: letter || "•", id: `trie:${path}`, sub: node.word ? "word" : undefined, tone: tone(path, node) ?? (node.word ? "done" : undefined), children: [...node.children.keys()].sort().map(k => conv(node.children.get(k)!, path + k, k)) });
    return { type: "tree", title: "Trie (each node shows the letter on the edge into it; green = a word ends here)", binary: false, root: conv(root, "", "") };
  };
  r.step("An empty trie: just a root node, which stands for the empty prefix \"\".", toPanel(() => undefined));
  for (const word of ["cat", "car", "cart", "dog"]) {
    let node = root;
    const created: string[] = [];
    for (let i = 0; i < word.length; i++) {
      if (!node.children.has(word[i])) { node.children.set(word[i], { children: new Map(), word: false }); created.push(word.slice(0, i + 1)); }
      node = node.children.get(word[i])!;
    }
    node.word = true;
    const reused = word.length - created.length;
    r.step(`insert("${word}"): ${reused ? `the first ${reused} letter${reused > 1 ? "s" : ""} ("${word.slice(0, reused)}") already exist, so reuse that path. ` : ""}${created.length ? `${reused ? "C" : "c"}reate ${created.length} new node${created.length > 1 ? "s" : ""} for "${word.slice(reused)}", ` : ""}then mark the last node as a word end.`, toPanel(path => (path === word ? "new" : word.startsWith(path) && path ? (created.includes(path) ? "new" : "path") : undefined)));
  }
  const walk = (text: string, caption: (ok: boolean, end: TNode | null, stop: number) => string, mode: "search" | "prefix") => {
    let node: TNode | null = root, i = 0;
    for (; i < text.length && node; i++) node = node.children.get(text[i]) ?? null;
    const ok = node !== null && (mode === "prefix" || node.word);
    r.step(caption(ok, node, i), toPanel(path => (path && text.startsWith(path) && path.length <= (node ? text.length : i - 1) ? (path === text ? (ok ? "found" : "removed") : "path") : undefined)));
  };
  walk("car", () => 'search("car"): follow c → a → r. The path exists AND the last node is marked as a word, so the answer is True.', "search");
  walk("ca", () => 'search("ca"): the path c → a exists, but no word ends at "a" (it\'s only a prefix of cat, car and cart), so the answer is False.', "search");
  walk("ca", () => 'starts_with("ca"): the same walk, but we only need the path to exist, so the answer is True. Autocomplete would now list every word below: car, cart, cat.', "prefix");
  walk("cow", () => 'search("cow"): c exists, but "c" has no child "o". The path breaks, so the answer is False. We stopped after just 2 letters.', "search");
  return [r.visual("Insert & search words", "Words: cat, car, cart, dog", { new: "Just created", path: "Path followed", found: "Match", removed: "Not a word / path breaks", done: "End of a word" })];
}

export const TREES_TRACES: TraceRegistry = {
  "binary-tree": () => [traversal("pre"), traversal("in"), traversal("post"), levelOrder()],
  bst: () => bst(),
  "avl-tree": () => avl(),
  heap: () => heap(),
  trie: () => trie(),
};
