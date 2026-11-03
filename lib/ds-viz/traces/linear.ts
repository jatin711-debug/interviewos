import type { LinkedNode, Marker, Panel, TraceRegistry, Tone } from "../types";
import { Recorder, array, span, text, tones, vars } from "../helpers";

function dynamicArray() {
  const r = new Recorder();
  let capacity = 1, size = 0, copies = 0;
  let block: (number | null)[] = [null];
  const show = (t: Record<number, Tone> = {}, title = "The memory block"): Panel => array(block, { title: `${title} (capacity ${capacity})`, tones: { ...Object.fromEntries(block.map((v, i) => [i, i < size ? "default" : "muted"])), ...t }, markers: size < capacity ? [{ at: size, label: "next free" }] : [] });
  r.step("A new dynamic array: a block with room for 1 item and nothing in it yet. Grey slots exist in memory but aren't used.", show(), vars({ size, capacity }));
  for (const value of [10, 20, 30, 40, 50]) {
    if (size === capacity) {
      r.step(`append(${value}): the block is full (size ${size} = capacity ${capacity}), so there's no free slot. We have to grow.`, show(tones(span(0, size - 1), "removed")), vars({ size, capacity }));
      const old = block;
      capacity *= 2;
      block = Array(capacity).fill(null);
      for (let i = 0; i < size; i++) block[i] = old[i];
      copies += size;
      r.step(`Allocate a new block twice as big (capacity ${capacity}) and copy ${size === 1 ? "the 1 item" : `all ${size} items`} across. This copy is the O(n) part, but it only happens when the size hits a power of two.`, show(tones(span(0, size - 1), "compare"), "New block"), vars({ size, capacity, "total copies so far": copies }));
    }
    block[size] = value;
    size += 1;
    r.step(`append(${value}): write it into slot ${size - 1}, the first free slot. No shifting and no copying, so this is O(1).`, show({ [size - 1]: "new" }), vars({ size, capacity, "total copies so far": copies }));
  }
  r.step(`5 appends caused only ${copies} copies in total. Even with more appends, total copies stay below 2 × n, so each append is O(1) on average ("amortized").`, show(), vars({ appends: 5, copies }));
  r.step("get(3): the slots are side by side and equal-sized, so the computer computes where slot 3 is (start + 3 × slot size) and reads it in one step. That's O(1) for any index.", show({ 3: "found" }), vars({ "get(3)": block[3] as number }));
  size -= 1; const popped = block[size]; block[size] = null;
  r.step(`pop() removes the last item (${popped}). Nothing else moves, so it's O(1). Removing from the front would mean shifting every item left, which is O(n).`, show({}), vars({ size, capacity, popped: popped as number }));
  return [r.visual("append, grow, index, pop", "Start with capacity 1 and append 10, 20, 30, 40, 50.", { muted: "Allocated but unused", new: "Just written", removed: "Full, must grow", compare: "Copied to the new block", found: "Read directly" })];
}

function linkedPanel(values: (string | number)[], t: Record<number, Tone> = {}, markers: Marker[] = [], title = "The list"): Panel {
  return { type: "linked", title, nodes: values.map((v, i): LinkedNode => ({ label: String(v), id: String(v), tone: t[i] })), markers };
}

function singly() {
  const ops = new Recorder();
  let list: number[] = [2, 3, 4];
  ops.step("A list holding 2 → 3 → 4. We only store the head (the first node). Each node points to the next, and the last points to None.", linkedPanel(list, {}, [{ at: 0, label: "head" }]));
  list = [1, ...list];
  ops.step("push_front(1): make a new node whose next is the old head, then make it the head. Nothing else moves, so this is O(1).", linkedPanel(list, { 0: "new" }, [{ at: 0, label: "head" }]));
  for (let i = 0; i <= 3; i++) ops.step(i < 3 ? `append(5) must find the last node first. current = node ${list[i]}. Its next isn't None, so step forward.` : "current.next is None, so this is the last node. Walking here took O(n) steps.", linkedPanel(list, tones(span(0, i - 1), "muted", [i], "active"), [{ at: 0, label: "head" }, { at: i, label: "current" }]));
  list = [...list, 5];
  ops.step("Set current.next = new node(5). The list is now 1 → 2 → 3 → 4 → 5.", linkedPanel(list, { 4: "active", 5: "new" }, [{ at: 0, label: "head" }]));
  ops.step("remove(3): to delete a node we change the node BEFORE it. Walk with prev until prev.next holds 3. Here prev = node 2.", linkedPanel(list, { 1: "active", 2: "removed" }, [{ at: 0, label: "head" }, { at: 1, label: "prev" }, { at: 2, label: "prev.next" }]));
  list = list.filter(v => v !== 3);
  ops.step("prev.next = prev.next.next: node 2 now points straight to 4. Nothing points to node 3 any more, so it's gone. Python frees it automatically.", linkedPanel(list, { 1: "active", 2: "new" }, [{ at: 0, label: "head" }, { at: 1, label: "prev" }]));

  const rev = new Recorder();
  const values = [1, 2, 3, 4];
  // reversed part: values[0..k-1] reversed, remaining: values[k..]
  const state = (k: number, caption: string, highlightNext = true) => {
    const done = values.slice(0, k).reverse();
    const rest = values.slice(k);
    rev.step(caption,
      { type: "linked", title: "Already reversed (prev points to its first node)", nodes: done.map((v, i) => ({ label: String(v), tone: i === 0 ? "done" : "default" })), markers: done.length ? [{ at: 0, label: "prev" }] : [] },
      { type: "linked", title: "Still to reverse (current points to its first node)", nodes: rest.map((v, i) => ({ label: String(v), tone: i === 0 ? "active" : i === 1 && highlightNext ? "compare" : "default" })), markers: [...(rest.length ? [{ at: 0, label: "current" }] : []), ...(rest.length > 1 && highlightNext ? [{ at: 1, label: "nxt" }] : [])] },
      vars({ prev: done.length ? done[0] : "None", current: rest.length ? rest[0] : "None" }));
  };
  state(0, "Reverse 1 → 2 → 3 → 4. Think of it as two lists: the reversed part (empty, so prev = None) and the rest (current = head).");
  for (let k = 0; k < values.length; k++) {
    state(k, `Step ${k + 1}: save nxt = current.next (${values[k + 1] !== undefined ? `node ${values[k + 1]}` : "None"}) so we don't lose the rest. Then flip current.next to point at prev (${k === 0 ? "None" : values[k - 1]}).`);
    state(k + 1, `Move on: prev = current (node ${values[k]}), current = nxt (${values[k + 1] ?? "None"}). Node ${values[k]} now leads the reversed part.`, false);
  }
  rev.step("current is None, so we're done. prev points at node 4, which becomes the new head: 4 → 3 → 2 → 1. Each node was visited once, so this is O(n) time and O(1) extra space.", linkedPanel([4, 3, 2, 1], tones([0, 1, 2, 3], "done"), [{ at: 0, label: "head" }]));
  return [
    ops.visual("push, append, remove", "Starting from 2 → 3 → 4. Watch which operations are a single re-pointing (O(1)) and which must walk the list first (O(n)).", { new: "New / re-pointed", active: "Pointer is here", muted: "Already walked past", removed: "Being removed" }),
    rev.visual("Reverse the list", "Three pointers: prev, current and nxt. Each step flips one arrow.", { done: "Front of the reversed part", active: "current", compare: "nxt (saved)" }),
  ];
}

function doubly() {
  const r = new Recorder();
  let list: string[] = [];
  const show = (t: Record<number, Tone> = {}): Panel => ({ type: "linked", title: "Doubly linked list (⇄ = next and prev pointers)", doubly: true, nodes: list.map((v, i) => ({ label: v, id: v, tone: t[i] })), markers: list.length === 1 ? [{ at: 0, label: "head & tail" }] : list.length ? [{ at: 0, label: "head" }, { at: list.length - 1, label: "tail" }] : [] });
  r.step("An empty list: head and tail are both None.", show(), vars({ head: "None", tail: "None" }));
  list = ["B"];
  r.step('append("B"): the only node is both head and tail.', show({ 0: "new" }), vars({ head: "B", tail: "B" }));
  list = ["B", "C"];
  r.step('append("C"): we know the tail, so there\'s no walking. Set C.prev = B and B.next = C (both directions!), then tail = C.', show({ 0: "compare", 1: "new" }), vars({ head: "B", tail: "C" }));
  list = ["B", "C", "D"];
  r.step('append("D"): same three steps. O(1) thanks to the tail pointer.', show({ 1: "compare", 2: "new" }), vars({ head: "B", tail: "D" }));
  list = ["A", "B", "C", "D"];
  r.step('push_front("A"): A.next = B, B.prev = A, head = A. Also O(1).', show({ 0: "new", 1: "compare" }), vars({ head: "A", tail: "D" }));
  r.step("Forward walk: start at head and follow next (A, B, C, D). Backward walk: start at tail and follow prev (D, C, B, A).", show(tones([0, 1, 2, 3], "path")));
  r.step("unlink(C): we already hold node C (we saved it when we appended). Its prev is B and its next is D, so no search is needed.", show({ 1: "compare", 2: "removed", 3: "compare" }), vars({ "C.prev": "B", "C.next": "D" }));
  list = ["A", "B", "D"];
  r.step("Join the neighbours: B.next = D and D.prev = B. C is cut out in O(1). A singly linked list couldn't do this, because C wouldn't know about B.", show({ 1: "new", 2: "new" }));
  list = ["B", "D"];
  r.step("unlink(head): A has no prev, so head moves to A.next. B becomes the head and B.prev = None.", show({ 0: "new" }), vars({ head: "B", tail: "D" }));
  list = ["B"];
  r.step("unlink(tail): D has no next, so tail moves to D.prev. B is now both head and tail.", show({ 0: "new" }), vars({ head: "B", tail: "B" }));
  return [r.visual("Add and remove at both ends", "Build A ⇄ B ⇄ C ⇄ D, then remove C, the head and the tail. Watch that every change updates the arrows in BOTH directions.", { new: "Just linked / updated", compare: "Neighbour being re-pointed", removed: "Being unlinked", path: "Walked over" })];
}

function stack() {
  const r = new Recorder();
  const input = "{[()]}";
  const items: string[] = [];
  const inputPanel = (i: number) => array(input.split(""), { title: "Input", tones: { ...tones(span(0, i - 1), "muted"), ...(i < input.length ? { [i]: "active" } : {}) }, indices: false });
  r.step(`Check whether "${input}" is balanced. We read one character at a time and use a stack to remember the open brackets.`, inputPanel(0), { type: "stack", title: "Stack", items: [], empty: "empty stack" });
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if ("([{".includes(ch)) {
      items.push(ch);
      r.step(`"${ch}" is an opening bracket. Push it: it waits on top until something closes it.`, inputPanel(i), { type: "stack", title: "Stack", items, tones: { [items.length - 1]: "new" } });
    } else {
      r.step(`"${ch}" is a closing bracket. It must match the MOST RECENT open bracket, the top of the stack: "${items[items.length - 1]}".`, inputPanel(i), { type: "stack", title: "Stack", items, tones: { [items.length - 1]: "compare" } });
      const top = items.pop();
      r.step(`Pop "${top}". It is the partner of "${ch}", so this pair is closed.`, inputPanel(i + 1), { type: "stack", title: "Stack", items, empty: "empty stack" });
    }
  }
  r.step("We reached the end and the stack is empty: every bracket was closed in the right order. Balanced!", array(input.split(""), { title: "Input", tones: tones(span(0, input.length - 1), "done"), indices: false }), { type: "stack", title: "Stack", items: [], empty: "empty ✓" });
  const bad = new Recorder();
  bad.step('Now "([)]". Push "(" then "[". The stack (bottom to top) is ( [.', array(["(", "[", ")", "]"], { title: "Input", tones: { 0: "muted", 1: "muted", 2: "active" }, indices: false }), { type: "stack", title: "Stack", items: ["(", "["], tones: { 1: "compare" } });
  bad.step('")" arrives, but the top is "[". A ")" can only close "(". Mismatch, so this string is NOT balanced. Return False right away.', array(["(", "[", ")", "]"], { title: "Input", tones: { 0: "muted", 1: "muted", 2: "removed" }, indices: false }), { type: "stack", title: "Stack", items: ["(", "["], tones: { 1: "removed" } });
  bad.step('Other failures: "())" has a ")" when the stack is already empty, and "((" ends with items still on the stack. Both are unbalanced.', text(['"())"  -> pop from empty stack  -> False', '"(("   -> leftovers: ( (        -> False'], "Other ways to fail"));
  return [
    r.visual('Balanced: "{[()]}"', "Push opening brackets. Each closing bracket pops the top, and they must match.", { new: "Pushed", compare: "Top (to be matched)", active: "Current character", muted: "Already read", done: "All matched" }),
    bad.visual('Unbalanced: "([)]"', "Here the brackets are interleaved wrongly. Watch the moment a closing bracket meets the wrong kind of opening bracket on top.", { removed: "Mismatch", compare: "Top of stack", active: "Current character", muted: "Already read" }),
  ];
}

function queue() {
  const r = new Recorder();
  let line: string[] = [];
  const show = (t: Record<number, Tone> = {}): Panel => array(line, { title: "Queue (front on the left)", ids: line.slice(), tones: t, empty: "empty queue", markers: line.length ? (line.length === 1 ? [{ at: 0, label: "front/back" }] : [{ at: 0, label: "front" }, { at: line.length - 1, label: "back" }]) : [] });
  r.step("An empty queue. People join at the back and are served from the front.", show());
  for (const person of ["Ana", "Ben", "Cho"]) { line = [...line, person]; r.step(`enqueue("${person}"): join at the back. With a deque, append is O(1).`, show({ [line.length - 1]: "new" })); }
  r.step('dequeue(): the front person, Ana, waited longest, so she is served first (First In, First Out).', show({ 0: "removed" }));
  line = line.slice(1);
  r.step("deque.popleft() is O(1). (A list's pop(0) would shift every remaining item left, which is O(n).) Ben is at the front now.", show({ 0: "active" }));
  line = [...line, "Dev"];
  r.step('enqueue("Dev"): Dev joins behind Cho. Order of service: Ben, Cho, Dev.', show({ [line.length - 1]: "new" }));
  while (line.length) { const who = line[0]; r.step(`dequeue() → "${who}".`, show({ 0: "removed" })); line = line.slice(1); }
  r.step("The queue is empty. Everyone was served in exactly the order they arrived.", show());
  return [r.visual("Join at the back, leave from the front", "Ana, Ben and Cho join a line, then Dev. Watch everyone slide forward as the front person is served.", { new: "Just joined", removed: "Being served", active: "New front" })];
}

export const LINEAR_TRACES: TraceRegistry = {
  "dynamic-array": () => dynamicArray(),
  "singly-linked-list": () => singly(),
  "doubly-linked-list": () => doubly(),
  stack: () => stack(),
  queue: () => queue(),
};
