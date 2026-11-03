import type { DsSolutionGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

/**
 * "How the solution works" for every lesson challenge, shown when the learner reveals the solution.
 * `code` (optional) is a simpler solution shown instead of the polished reference; it must pass every check
 * (scripts/verify-ds-guides.mjs grades it with the same harness as the app).
 */
export const DS_SOLUTIONS: Record<string, DsSolutionGuide> = {
  "ds-class-design": { notes: [
    "Key idea: a dict already does everything we need. Its keys are unique, lookups are O(1), and it remembers insertion order. `dict.fromkeys(items)` turns any iterable into ordered, de-duplicated keys.",
    "`add` writes `self._items[item] = None`. Writing an existing key does not move it, so the first position wins automatically.",
    "`discard` uses `pop(item, None)`, which does nothing when the item is absent.",
    "Each special method delegates to the dict: `__len__`, `__iter__` and `__contains__`. `__getitem__` makes a list for indexing and slicing (slices return a new OrderedSet).",
    "`__eq__` compares order too (two lists), returns `NotImplemented` for other types, and `__hash__ = None` because the set is mutable.",
  ] },
  "ds-iterators": { notes: [
    "`Collatz` is an iterable, not an iterator. Its `__iter__` is a generator, so every `for` loop gets a FRESH generator that starts again from `start`. That's why nested loops work.",
    "Inside `__iter__`, `n` is a local variable. Never store the 'current position' on `self`, or two loops would interfere with each other.",
    "`chunked` calls `iter()` once and then repeatedly takes `islice(iterator, size)`. Each chunk reads only what it needs, so it also works on infinite or one-shot iterators.",
    "`while chunk := list(...)` stops when a chunk comes back empty. Both functions validate their argument and raise `ValueError` early.",
  ] },
  "ds-complexity": { notes: [
    "Simulate the counter directly: `bits[0]` is the lowest bit. An increment turns trailing 1s into 0s (each is a flip), then turns the first 0 into 1 (one more flip). If the counter is all 1s, append a new bit instead.",
    "Track the total and the worst single increment. The worst case grows like log n (a long run of trailing 1s), but most increments flip only 1 or 2 bits.",
    "The total stays under 2n: bit 0 flips every time, bit 1 every 2nd time, bit 2 every 4th time... 1 + 1/2 + 1/4 + … < 2. That's amortized O(1) per increment, which is the point of the exercise.",
  ] },
  "dynamic-array": { notes: [
    "Keep a fixed-length `_buffer` plus a `_size`. Only indexes `0.._size-1` are real items.",
    "`_resize` copies every item into a new buffer and adds `_size` to `moves`. It's called when an insert finds the buffer full (double) and when a pop leaves it at most a quarter full (halve). Halving at 1/4, not 1/2, avoids flip-flopping between growing and shrinking.",
    "`insert(index, item)` shifts items right, starting from the END, so nothing gets overwritten, then writes the item. Each shifted item counts as one move.",
    "`pop(index)` shifts the later items left by one, clears the old last slot and maybe shrinks. `_locate` turns negative indexes into positive ones and raises `IndexError` when out of range.",
  ] },
  "singly-linked-list": { notes: [
    "Two pointers with a fixed gap: move `lead` n steps ahead, then move `lead` and `trail` together until `lead` is the last node. Now `trail` is just before the node to remove. That's one pass.",
    "A `dummy` node in front of `head` means removing the real head needs no special case: `trail` simply stays on the dummy.",
    "If `lead` runs off the list while opening the gap, the list has fewer than n nodes, so raise `ValueError`.",
    "Removal is a single re-pointing: `trail.next = trail.next.next`. Return `dummy.next`, which may be a new head or `None`.",
  ] },
  "doubly-linked-list": { notes: [
    "Keep `head`, `tail` and a `size`. Every node has `prev` and `next`.",
    "`append` links the new node after the tail in BOTH directions. If the list was empty, the node is also the head. `appendleft` is the mirror image.",
    "`pop` and `popleft` unlink an end node, and the neighbour becomes the new end (its pointer toward the removed node becomes `None`). If the list becomes empty, both `head` and `tail` become `None`. Raise `IndexError` when it's already empty.",
    "Forward iteration follows `next` from the head, and `__reversed__` follows `prev` from the tail. Because we check `node is not None` rather than the value, stored `None` values work too.",
  ], code: py`
class Node:
    def __init__(self, value, prev=None, next=None):
        self.value = value
        self.prev = prev
        self.next = next


class DoublyLinkedList:
    def __init__(self, values=()):
        self.head = None
        self.tail = None
        self.size = 0
        for value in values:
            self.append(value)

    def append(self, value):
        node = Node(value, prev=self.tail)
        if self.tail is None:          # empty list: the node is also the head
            self.head = node
        else:
            self.tail.next = node      # link both directions
        self.tail = node
        self.size += 1

    def appendleft(self, value):
        node = Node(value, next=self.head)
        if self.head is None:
            self.tail = node
        else:
            self.head.prev = node
        self.head = node
        self.size += 1

    def pop(self):
        if self.tail is None:
            raise IndexError("pop from empty list")
        node = self.tail
        self.tail = node.prev
        if self.tail is None:
            self.head = None           # the list is now empty
        else:
            self.tail.next = None
        self.size -= 1
        return node.value

    def popleft(self):
        if self.head is None:
            raise IndexError("pop from empty list")
        node = self.head
        self.head = node.next
        if self.head is None:
            self.tail = None
        else:
            self.head.prev = None
        self.size -= 1
        return node.value

    def __len__(self):
        return self.size

    def __iter__(self):
        node = self.head
        while node is not None:
            yield node.value
            node = node.next

    def __reversed__(self):
        node = self.tail
        while node is not None:
            yield node.value
            node = node.prev
` },
  stack: { notes: [
    "Keep a second stack, `_maxes`, the same height as the main one: `_maxes[i]` is the maximum of everything up to and including item i.",
    "`push` appends the item and also appends `max(item, current max)`. `pop` pops from both stacks, so the max 'rewinds' to what it was before.",
    "Now `maximum()` is just `_maxes[-1]`: O(1), and duplicates are handled for free (a stack of 5, 5 has maxes 5, 5).",
    "Iterating from the top down is `reversed(self._items)`. Empty `pop`, `peek` and `maximum` raise `IndexError`.",
  ] },
  queue: { notes: [
    "Wrap a `collections.deque`: `append` adds at the back and `popleft` removes from the front, both in O(1).",
    "`deque.popleft()` already raises `IndexError` on an empty deque, which is exactly the error the challenge asks for.",
    "`len` and iteration delegate to the deque, so iteration runs from front to back (FIFO order).",
  ], code: py`
from collections import deque


class Queue:
    def __init__(self, items=()):
        self.items = deque(items)

    def enqueue(self, value):
        self.items.append(value)         # join at the back

    def dequeue(self):
        return self.items.popleft()      # leave from the front; IndexError when empty

    def __len__(self):
        return len(self.items)

    def __iter__(self):
        return iter(self.items)          # front to back
` },
  "hash-table-chaining": { notes: [
    "Start with 8 empty bucket lists. The bucket for an item is `hash(item) % bucket_count`.",
    "`add` looks only in that one bucket. If the item is there, return `False`. Otherwise append it, increase the size, and grow if `size > 0.75 * bucket_count`.",
    "`_grow` doubles the bucket count and re-inserts every item, because each item's bucket index changes when the count changes.",
    "`discard` removes from the item's bucket, and `remove` turns 'not found' into `KeyError`. Iteration walks every bucket and yields its items.",
  ] },
  "hash-table-open-addressing": { notes: [
    "The table is one list of slots: `None` means never used, and a special `_DELETED` object is a tombstone.",
    "`_probe` yields the home slot `item % capacity`, then the next slots, wrapping around, each at most once.",
    "`_find` walks the probe sequence. It stops at `None` (the item can't be further along) and skips tombstones (they never equal an int).",
    "`add` first checks the item isn't already present, then places it in the first `None` or tombstone slot. If there's none, the table is full. `discard` writes a tombstone instead of `None`, so later items stay reachable.",
  ] },
  "lru-cache": { notes: [
    "Use `collections.OrderedDict`, kept with the least recently used key first and the most recent last.",
    "`get` on a hit calls `move_to_end(key)` (marking it most recent) and returns the value. A miss returns -1.",
    "`put` on an existing key moves it to the end and updates the value. For a NEW key in a full cache, `popitem(last=False)` evicts the oldest entry first.",
    "`peek` uses `.get(key, -1)`, which doesn't change the order. `keys()` returns most-recent-first, so reverse the dict's order.",
  ] },
  "binary-tree": { notes: [
    "`Node` just stores a value and two children.",
    "Inorder means left, node, right. The recursive version is 3 lines, but deep trees can hit Python's recursion limit, so this solution uses an explicit stack.",
    "Loop: walk as far LEFT as possible, pushing each node. Then pop one, yield its value, and move to its right child. Repeat while there's a current node or anything on the stack.",
    "An empty tree (`root is None`) yields nothing, because the loop condition is false straight away.",
  ], code: py`
class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right


def inorder(root):
    stack = []
    current = root
    while stack or current:
        while current:                 # go as far left as possible
            stack.append(current)
            current = current.left
        current = stack.pop()          # the leftmost unvisited node
        yield current.value
        current = current.right        # then do its right subtree
` },
  bst: { notes: [
    "`add` walks down from the root: go left if the key is smaller, right if bigger, and stop (do nothing) if equal. When the next spot is empty, put the new node there and increase the size.",
    "`in` is the same walk, returning `True` on an equal key and `False` when it falls off the tree.",
    "Sorted iteration is an inorder traversal (left, node, right). It uses an explicit stack, so very deep (unbalanced) trees don't hit the recursion limit.",
  ], code: py`
class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None


class BST:
    def __init__(self):
        self.root = None
        self.size = 0

    def add(self, key):
        if self.root is None:
            self.root = Node(key)
            self.size += 1
            return
        node = self.root
        while True:
            if key == node.key:
                return                          # duplicate: ignore
            if key < node.key:
                if node.left is None:
                    node.left = Node(key)
                    self.size += 1
                    return
                node = node.left
            else:
                if node.right is None:
                    node.right = Node(key)
                    self.size += 1
                    return
                node = node.right

    def __contains__(self, key):
        node = self.root
        while node:
            if key == node.key:
                return True
            node = node.left if key < node.key else node.right
        return False

    def __len__(self):
        return self.size

    def __iter__(self):                         # inorder = sorted
        stack, node = [], self.root
        while stack or node:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            yield node.key
            node = node.right
` },
  "avl-tree": { notes: [
    "Each node stores its `height`. `balance(node)` recomputes the height, then checks the balance factor (left height − right height).",
    "Factor > 1 means left-heavy. If the left child leans right (the Left-Right case), rotate it left first, then rotate the node right. Factor < −1 is the mirror image.",
    "`add` is a normal recursive BST insert that calls `balance` on every node on the way back up.",
    "`discard` is a normal BST delete (a leaf or one-child node is replaced by its child; a node with two children copies its successor and deletes that) that also re-balances on the way up.",
    "`height` of the tree is the root's stored height (0 when empty). Iteration is an iterative inorder traversal.",
  ] },
  heap: { notes: [
    "Store the items in a plain list and let `heapq` keep the heap rule. `heapify` arranges the starting values in O(n).",
    "`push` is `heappush` and `pop` is `heappop`, both O(log n). `heappop` already raises `IndexError` on an empty list.",
    "`peek` is `self._heap[0]`, the smallest item, after checking the heap isn't empty.",
  ], code: py`
import heapq


class MinPriorityQueue:
    def __init__(self, values=()):
        self.heap = list(values)
        heapq.heapify(self.heap)           # O(n): arrange into a heap

    def push(self, value):
        heapq.heappush(self.heap, value)

    def pop(self):
        return heapq.heappop(self.heap)    # IndexError when empty

    def peek(self):
        if not self.heap:
            raise IndexError("peek from empty heap")
        return self.heap[0]                # the minimum is always at index 0

    def __len__(self):
        return len(self.heap)
` },
  trie: { notes: [
    "Each trie node is a dict from a character to a child dict. A unique marker key (`self._end`) inside a node means 'a word ends here'.",
    "`add` walks or creates the path with `setdefault`, then sets the end marker. The size only increases if the marker wasn't there already, so words are counted once.",
    "`_find(prefix)` follows the characters and returns the node, or `None` if the path breaks. `in` also requires the end marker. `starts_with` only requires the path.",
    "The empty prefix is the root itself, so `starts_with('')` is `True`, and adding `''` marks the root as a word.",
  ] },
  "fenwick-tree": { notes: [
    "Internally the tree is 1-indexed: position `index` lives at `index + 1`, and `tree[0]` is unused.",
    "`add` climbs with `i += i & -i`, updating every block that covers the position.",
    "`prefix_sum(end)` sums positions `0..end-1` by descending with `end -= end & -end`. `range_sum(start, end)` is `prefix_sum(end) - prefix_sum(start)` (half-open).",
    "Bounds are checked up front, raising `IndexError` for bad indexes and `ValueError` for a negative size.",
  ] },
  "segment-tree": { notes: [
    "Store sums in a list where node `k` has children `2k` and `2k+1`, and the root is node 1 covering `[0, n)`. Build recursively: a leaf takes its value, and a parent takes the sum of its children.",
    "`range_sum(start, end)` is half-open. A node outside the range adds 0, a node fully inside adds its stored sum, and a partial overlap asks both children.",
    "`set(index, value)` walks down to the leaf, changes it, and recomputes the sums on the way back up.",
    "Validate bounds first (`IndexError`). An empty range (start == end) naturally sums to 0. This recursive version is easier to follow than the reference's bottom-up loop, but both are O(log n).",
  ], code: py`
class SegmentTree:
    def __init__(self, values):
        self.n = len(values)
        self.sums = [0] * (4 * max(1, self.n))   # node k has children 2k and 2k + 1
        if self.n:
            self._build(1, 0, self.n, values)

    def _build(self, k, lo, hi, values):          # node k covers values[lo:hi]
        if hi - lo == 1:
            self.sums[k] = values[lo]
            return
        mid = (lo + hi) // 2
        self._build(2 * k, lo, mid, values)
        self._build(2 * k + 1, mid, hi, values)
        self.sums[k] = self.sums[2 * k] + self.sums[2 * k + 1]

    def __len__(self):
        return self.n

    def set(self, index, value):
        if not 0 <= index < self.n:
            raise IndexError("index out of range")
        self._set(1, 0, self.n, index, value)

    def _set(self, k, lo, hi, index, value):
        if hi - lo == 1:
            self.sums[k] = value
            return
        mid = (lo + hi) // 2
        if index < mid:
            self._set(2 * k, lo, mid, index, value)
        else:
            self._set(2 * k + 1, mid, hi, index, value)
        self.sums[k] = self.sums[2 * k] + self.sums[2 * k + 1]

    def range_sum(self, start, end):
        if not 0 <= start <= end <= self.n:
            raise IndexError("invalid range")
        if start == end:
            return 0
        return self._sum(1, 0, self.n, start, end)

    def _sum(self, k, lo, hi, start, end):
        if end <= lo or hi <= start:             # completely outside
            return 0
        if start <= lo and hi <= end:            # completely inside
            return self.sums[k]
        mid = (lo + hi) // 2                     # partial overlap: ask both children
        return self._sum(2 * k, lo, mid, start, end) + self._sum(2 * k + 1, mid, hi, start, end)
` },
  "sparse-table": { notes: [
    "Row 0 is a copy of the values. Row k holds the minimum of each block of length 2^k, built from two neighbouring blocks of row k−1.",
    "`minimum(start, end)` is half-open. Let `length = end - start` and `power = length.bit_length() - 1` (the biggest power of two that fits).",
    "The answer is the min of the block starting at `start` and the block ending at `end`. They may overlap, which is harmless for min.",
    "Empty input builds no rows, and an empty or out-of-range query raises `IndexError`.",
  ] },
  "graph-representation": { notes: [
    "Store one `set` of out-neighbours per vertex. A set gives O(1) `has_edge` and ignores duplicate edges automatically.",
    "Keep an `_in_degree` counter list, increased only when an edge is actually new. Then both degrees are O(1): `len(out[v])` and `_in_degree[v]`.",
    "`neighbors(v)` returns `sorted(...)`, a new list, so callers can't change our internal set.",
    "`_check` validates every vertex and raises `ValueError` for anything outside `range(n)`. `edges()` yields `(u, v)` pairs in sorted order.",
  ] },
  "bfs-dfs": { notes: [
    "Multi-source BFS: put EVERY 0 cell into the queue at distance 0 at the same time. The BFS then spreads outward from all zeros together.",
    "The first time BFS reaches a cell is via its nearest zero, so its distance is final. `-1` marks 'not reached yet', which doubles as the visited check.",
    "Each cell is queued once and checks 4 neighbours, so the cost is O(rows × cols). Starting a separate BFS from every 1 would be far too slow.",
    "The result is a new matrix, so the input is never modified.",
  ] },
  "topological-sort": { notes: [
    "Build `after[prereq]` (the courses that wait for it) and `indegree[course]` (the number of unmet prerequisites). Duplicate prerequisite entries are counted on both sides, so they cancel correctly.",
    "Kahn's algorithm with a HEAP instead of a queue: always take the smallest course that's ready. That gives the lexicographically smallest valid order.",
    "Taking a course lowers the in-degree of everything after it, and courses reaching 0 are pushed onto the heap.",
    "If the order doesn't contain every course, the rest are stuck in a cycle, so return `[]`.",
  ] },
  dijkstra: { notes: [
    "Build an adjacency list `u -> [(v, w)]`. Parallel links are just extra entries.",
    "Standard Dijkstra: pop the smallest `(distance, node)` from a heap, skip it if it's stale, and relax each outgoing link.",
    "`dist` only contains nodes that have been reached. If it ends with fewer than n entries, some node is unreachable, so return -1.",
    "Otherwise every node has heard the signal by the LARGEST shortest distance: `max(dist.values())`.",
  ] },
  "bellman-ford-floyd-warshall": { notes: [
    "Start every distance at 0, as if an invisible source reached every vertex for free. Then a negative cycle ANYWHERE in the graph becomes detectable, not just one reachable from vertex 0.",
    "Run Bellman-Ford rounds: relax every edge. If a whole round changes nothing, the distances are final and there's no negative cycle.",
    "If distances are still improving in round n, some cycle keeps getting cheaper, so return `True`.",
    "Cost: O(n × edges) in the worst case, but the early exit usually stops much sooner.",
  ] },
  "union-find": { notes: [
    "Union-find with path compression and union by size. Each component's root also stores its size.",
    "For each edge, find both roots. If they differ, hang the smaller tree under the bigger one, add the sizes, and update the running `largest`.",
    "Self-loops and duplicate edges find the same root twice, so nothing changes, but we still record the current `largest`.",
    "The largest component can only grow, so a running maximum is enough. That's practically O(1) per edge, fine for 100,000 edges.",
  ] },
  "minimum-spanning-tree": { notes: [
    "Validate the input (raise `ValueError` for a negative n or a bad endpoint), then sort the edges as `(weight, u, v)` tuples.",
    "Kruskal: for each edge in order, find the roots of `u` and `v`. If they're the same, the edge would close a cycle, so skip it. Otherwise union them and keep the edge.",
    "On a disconnected graph this naturally gives a spanning FOREST (one tree per component).",
    "Return the total weight and the chosen edges, in the order they were taken.",
  ], code: py`
def minimum_spanning_forest(n, edges):
    if n < 0:
        raise ValueError("negative vertex count")
    ordered = sorted(edges)                       # (weight, u, v): cheapest first
    for _, u, v in ordered:
        if not (0 <= u < n and 0 <= v < n):
            raise ValueError("vertex out of range")

    parent = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]         # path halving
            x = parent[x]
        return x

    chosen, total = [], 0
    for weight, u, v in ordered:
        root_u, root_v = find(u), find(v)
        if root_u == root_v:
            continue                              # would close a cycle
        parent[root_u] = root_v                   # join the two groups
        chosen.append((weight, u, v))
        total += weight
    return total, chosen
` },
  "scc-bridges": { notes: [
    "SCCs (Kosaraju): pass 1 is a DFS recording finish order. Pass 2 runs DFS on the REVERSED graph in reverse finish order, and each search collects one component.",
    "The reference uses explicit stacks of `(vertex, iterator)` instead of recursion. A 1,500-vertex path would exceed Python's recursion limit, so this is necessary here, not just style.",
    "Bridges: a DFS assigns discovery times and low-links. A tree edge to a child is a bridge when `low[child] > tin[parent]`.",
    "For multigraphs, skip only the exact edge you arrived by (tracked by its edge id), not every edge to the parent. A parallel edge is a genuine second route, so it means 'no bridge'.",
  ] },
  "binary-search": { notes: [
    "In a rotated sorted list, at least one half around `mid` is always properly sorted. Check which: if `nums[lo] <= nums[mid]`, the left half is sorted.",
    "If the target lies inside the sorted half's range, search there. Otherwise it must be in the other half.",
    "Each step still throws away half the list, so it's O(log n). The usual `lo <= hi` loop returns -1 when the range empties.",
  ] },
  "elementary-sorts": { notes: [
    "Compute each key exactly once up front, as `(key, item)` pairs. The key function is never called again during sorting.",
    "Insertion sort: lift out `current` and shift earlier pairs right while `current` must go strictly BEFORE them.",
    "'Strictly before' (`a < b`, or `b < a` when reversed) is what keeps the sort stable. Equal keys never pass each other, even with `reverse=True`.",
    "Return just the items, as a new list. The input iterable is never modified.",
  ] },
  "merge-sort": { notes: [
    "Merge sort with a counting step. After sorting both halves, count the pairs (one from the left half, one from the right) with `left > 2 * right`.",
    "Because both halves are sorted, one moving pointer `j` into the right half is enough. As `value` increases, `j` only moves forward, so counting is O(n) per level.",
    "Then merge the halves normally. Total = left count + right count + crossing count, which gives O(n log n) overall.",
    "Copy the list first (`list(nums)`) so the input isn't modified.",
  ] },
  "quick-sort": { notes: [
    "The k-th largest is at index `len - k` in ascending order. Find it with quickselect instead of sorting.",
    "Pick a random pivot and do a THREE-WAY partition: `< pivot | == pivot | > pivot`. Many duplicates then don't slow it down.",
    "If the target index is in the `<` part, keep only that part. In the `>` part, keep only that one. In the middle, the answer is the pivot.",
    "A seeded `random.Random` keeps runs deterministic while still avoiding the O(n²) case on sorted input. Expected cost is O(n).",
  ] },
  "non-comparison-sorts": { notes: [
    "Negative numbers: subtract the minimum from everything, so all values are ≥ 0 and their order is unchanged. Add it back at the end.",
    "LSD radix sort on BYTES (base 256): each pass drops numbers into 256 buckets by `(n >> shift) & 255`, then reads them back in order.",
    "Buckets keep their arrival order (stable), so each pass preserves the order set by the less significant bytes.",
    "Passes continue while the biggest value still has bits left (`biggest >> shift`). This handles numbers far beyond 64 bits.",
  ] },
  "divide-and-conquer": { notes: [
    "Split at `mid`. The best slice is either entirely in the left half, entirely in the right half, or CROSSES the middle.",
    "The best crossing slice is the best suffix of the left half plus the best prefix of the right half. Each takes one O(n) scan outwards from the middle.",
    "Ties need care: `>=` when scanning left picks the smallest start, and `>` when scanning right keeps the smallest end. `min(..., key=rank)` then chooses by largest total, smallest start, smallest end.",
    "Two halves plus O(n) work per level gives O(n log n). (Kadane's O(n) algorithm also works.)",
  ] },
  backtracking: { notes: [
    "Build the string one character at a time, tracking how many `(` are open and how many `)` are closed.",
    "You may add `(` while `opened < n`, and `)` only while `closed < opened`. Those two rules mean every partial string is valid, so nothing is ever generated and thrown away.",
    "Trying `(` before `)` produces the answers in ascending order, because '(' sorts before ')'.",
    "Choose (append), explore (recurse), un-choose (pop): the backtracking template.",
  ] },
  "dp-memoization-tabulation": { notes: [
    "Bottom-up DP: `fewest[a]` = the fewest coins that pay exactly `a`. It's filled for a = 1..amount from smaller amounts.",
    "If `fewest[amount]` is still 'unreachable', raise `ValueError`.",
    "Rebuild the actual coins: from `remaining`, take the LARGEST coin that keeps the count optimal, meaning `fewest[remaining - coin] == fewest[remaining] - 1`.",
    "Taking the largest valid coin first produces the list that is biggest when compared from the front, and it's already sorted largest to smallest.",
  ] },
  "dp-two-dimensional": { notes: [
    "`table[i][j]` = the longest palindromic subsequence of `s[i..j]`. Each single character is 1.",
    "If `s[i] == s[j]`, both ends wrap the inside: `table[i+1][j-1] + 2`. Otherwise drop one end: `max(table[i+1][j], table[i][j-1])`.",
    "Fill `i` from the bottom up (row i needs row i+1), and `j` left to right. The answer is `table[0][n-1]`.",
    "That's O(n²) time and memory, fine for n = 500.",
  ] },
  "dp-advanced": { notes: [
    "Bitmask DP: `mask` says which jobs are taken. Workers get jobs in order, so the number of set bits in `mask` is the next worker's number.",
    "`best[mask]` = the cheapest way for the first `popcount(mask)` workers to take exactly those jobs. Start with `best[0] = 0`.",
    "From each mask, give the next worker any free job: `best[mask | (1 << job)] = min(..., best[mask] + cost[worker][job])`.",
    "The answer is `best[all jobs]`. That's 2ⁿ × n work (about 500,000 for n = 15) instead of 15! permutations.",
  ] },
  greedy: { notes: [
    "Reject zero- or negative-length intervals first (`ValueError`).",
    "Sort by END time (then start), and keep each interval that starts at or after the last chosen end. Touching intervals are allowed because the intervals are half-open.",
    "Earliest end first is provably optimal (an exchange argument), and the result is already sorted the way the prompt asks.",
  ], code: py`
def select_intervals(intervals):
    items = list(intervals)
    for start, end in items:
        if start >= end:
            raise ValueError("intervals must have positive duration")
    chosen = []
    last_end = None
    for start, end in sorted(items, key=lambda iv: (iv[1], iv[0])):   # earliest end first
        if last_end is None or start >= last_end:                       # fits after the last one
            chosen.append((start, end))
            last_end = end
    return chosen
` },
  "prefix-sums": { notes: [
    "A subarray `l..r` has a sum divisible by k exactly when the prefix sums before l and after r have the SAME remainder mod k.",
    "Walk once, keeping a running remainder and a Counter of the remainders seen so far, starting with `{0: 1}` for the empty prefix.",
    "At each position, every earlier prefix with the same remainder starts a valid subarray ending here, so add `seen[remainder]`.",
    "Python's `%` always returns a non-negative result for k > 0, so negative numbers just work. That's O(n).",
  ] },
  "two-pointers-sliding-window": { notes: [
    "A sliding window with a Counter of the characters inside it.",
    "Add `text[right]`. While the window has more than k distinct characters, remove `text[left]` (deleting its key when its count hits 0) and move `left` forward.",
    "After each step the window is valid, so record its length. Each character enters and leaves once: O(n).",
    "With k = 0, no non-empty window is allowed, so return 0 straight away.",
  ] },
  "monotonic-stack-queue": { notes: [
    "Keep a stack of `(price, span)` pairs with strictly decreasing prices.",
    "For a new price, pop every pair whose price is ≤ today's, adding its span to today's. Those days are now covered by today.",
    "Push `(price, span)` and return the span. Each day is pushed once and popped at most once, so this is amortized O(1) per call.",
  ] },
  "intervals-sweep": { notes: [
    "Merge: sort the intervals. If the next one starts at or before the current block's end, extend the block. Otherwise start a new block. `<=` merges touching intervals.",
    "Rooms: turn each interval into `(start, +1)` and `(end, -1)` events and sort them. At equal times, -1 sorts before +1, so a freed room is reused.",
    "The running sum of the events is the number of meetings in progress, and its maximum is the answer.",
    "Both reject intervals with `start >= end` using `ValueError`, and handle empty input naturally.",
  ], code: py`
def merge_intervals(intervals):
    items = sorted(intervals)
    for start, end in items:
        if start >= end:
            raise ValueError("intervals must have positive length")
    merged = []
    for start, end in items:
        if merged and start <= merged[-1][1]:            # overlaps or touches the last block
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))
    return merged


def min_rooms(intervals):
    events = []
    for start, end in intervals:
        if start >= end:
            raise ValueError("intervals must have positive length")
        events.append((start, +1))
        events.append((end, -1))
    in_use = most = 0
    for _, change in sorted(events):                     # ends (-1) sort before starts (+1)
        in_use += change
        most = max(most, in_use)
    return most
` },
  "bit-manipulation": { notes: [
    "`count_bits`: `n &= n - 1` deletes the lowest 1-bit, so count how many times you can do it before n reaches 0.",
    "`has_bit`: build the mask `1 << bit` and test `n & mask`. Wrap it in `bool()` to return `True` or `False`.",
    "Both validate their inputs and raise `ValueError` for negatives.",
  ] },
  "number-theory": { notes: [
    "`gcd`: take absolute values, then apply Euclid: `a, b = b, a % b` until b is 0. `gcd(0, 0)` falls out as 0.",
    "`primes_up_to`: the Sieve of Eratosthenes. For each prime p with p² ≤ n, cross out p², p² + p, …. What remains is prime.",
    "Return the surviving numbers ≥ 2 in increasing order. For n < 2 there are none.",
  ] },
  "string-matching": { notes: [
    "The empty pattern matches at every boundary, `0..len(text)`, so handle it first.",
    "Build the KMP prefix (failure) table for the pattern.",
    "Scan the text keeping `j` = the number of matched characters. On a mismatch, fall back with `j = prefix[j - 1]`. When `j` reaches the pattern length, record `i - j + 1`.",
    "After a match, set `j = prefix[j - 1]` instead of 0, so overlapping matches (like 'AA' in 'AAAA') are found too. That's O(n + m).",
  ] },
};
