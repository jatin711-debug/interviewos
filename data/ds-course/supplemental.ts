import type { DsLesson, DsModule } from "./types";
import type { DSACategory } from "../dsa/types";

const make = (id: string, title: string, summary: string, concepts: string[], time: string, space: string, code: string, demo: string, output: string, prompt: string, starter: string, tests: string, practice: DSACategory, source: string, tips: string[], pitfalls: string[], when: string[], inPractice: string): DsLesson => ({
  id, title, kind: "structure", summary, concepts, complexity: [{ operation: "Main operations", time }], space,
  code: `${code}\n\nif __name__ == "__main__":\n${demo.split("\n").map(line => `    ${line}`).join("\n")}\n`, output,
  bestPractices: tips, pitfalls, useWhen: when, inPractice,
  challenge: { prompt, hint: "Use the invariants in the example and check empty and boundary cases.", starter, tests, solution: code }, practice: [practice], source,
});
const queue = `from collections import deque
from collections.abc import Iterable, Iterator
from typing import Generic, TypeVar
T = TypeVar("T")
class Queue(Generic[T]):
    """FIFO queue with O(1) end operations."""
    def __init__(self, items: Iterable[T] = ()) -> None:
        self._items = deque(items)
    def enqueue(self, value: T) -> None:
        self._items.append(value)
    def dequeue(self) -> T:
        return self._items.popleft()
    def __len__(self) -> int:
        return len(self._items)
    def __iter__(self) -> Iterator[T]:
        return iter(self._items)
    def __repr__(self) -> str:
        return f"Queue({list(self._items)!r})"`;
const binary = `from __future__ import annotations
from dataclasses import dataclass
from collections.abc import Iterator
@dataclass(slots=True)
class Node:
    value: int
    left: Node | None = None
    right: Node | None = None
def inorder(root: Node | None) -> Iterator[int]:
    """Yield left-root-right, using O(h) stack space."""
    stack: list[Node] = []
    current = root
    while stack or current:
        while current:
            stack.append(current)
            current = current.left
        current = stack.pop()
        yield current.value
        current = current.right`;
const heap = `import heapq
from collections.abc import Iterable
class MinPriorityQueue:
    """Min heap: O(log n) push/pop; O(1) peek."""
    def __init__(self, values: Iterable[int] = ()) -> None:
        self._heap = list(values)
        heapq.heapify(self._heap)
    def push(self, value: int) -> None:
        heapq.heappush(self._heap, value)
    def pop(self) -> int:
        return heapq.heappop(self._heap)
    def peek(self) -> int:
        if not self._heap:
            raise IndexError("peek from empty heap")
        return self._heap[0]
    def __len__(self) -> int:
        return len(self._heap)
    def __repr__(self) -> str:
        return f"MinPriorityQueue({self._heap!r})"`;
const trie = `class Trie:
    """Distinct words in a prefix tree; operations take O(k) for k characters."""
    def __init__(self) -> None:
        self._root: dict = {}
        self._end = object()
        self._size = 0
    def add(self, word: str) -> None:
        node = self._root
        for char in word:
            node = node.setdefault(char, {})
        if self._end not in node:
            node[self._end] = True
            self._size += 1
    def __contains__(self, word: str) -> bool:
        node = self._find(word)
        return node is not None and self._end in node
    def _find(self, prefix: str) -> dict | None:
        node = self._root
        for char in prefix:
            if char not in node:
                return None
            node = node[char]
        return node
    def starts_with(self, prefix: str) -> bool:
        return self._find(prefix) is not None
    def __len__(self) -> int:
        return self._size`;
const fenwick = `class FenwickTree:
    """Point updates and prefix sums, each O(log n)."""
    def __init__(self, size: int) -> None:
        if size < 0:
            raise ValueError("size must be nonnegative")
        self._tree = [0] * (size + 1)
    def __len__(self) -> int:
        return len(self._tree) - 1
    def add(self, index: int, delta: int) -> None:
        if not 0 <= index < len(self):
            raise IndexError("index out of range")
        i = index + 1
        while i < len(self._tree):
            self._tree[i] += delta
            i += i & -i
    def prefix_sum(self, end: int) -> int:
        if not 0 <= end <= len(self):
            raise IndexError("end out of range")
        result = 0
        while end:
            result += self._tree[end]
            end -= end & -end
        return result
    def range_sum(self, start: int, end: int) -> int:
        if not 0 <= start <= end <= len(self):
            raise IndexError("invalid range")
        return self.prefix_sum(end) - self.prefix_sum(start)`;
const segment = `from collections.abc import Sequence
class SegmentTree:
    """Range sums and point updates with half-open bounds."""
    def __init__(self, values: Sequence[int]) -> None:
        self._n = len(values)
        self._tree = [0] * (2 * self._n)
        self._tree[self._n:] = values
        for i in range(self._n - 1, 0, -1):
            self._tree[i] = self._tree[2*i] + self._tree[2*i+1]
    def __len__(self) -> int:
        return self._n
    def set(self, index: int, value: int) -> None:
        if not 0 <= index < self._n:
            raise IndexError("index out of range")
        i = index + self._n
        self._tree[i] = value
        while i > 1:
            i //= 2
            self._tree[i] = self._tree[2*i] + self._tree[2*i+1]
    def range_sum(self, start: int, end: int) -> int:
        if not 0 <= start <= end <= self._n:
            raise IndexError("invalid range")
        left, right = start + self._n, end + self._n
        total = 0
        while left < right:
            if left & 1:
                total += self._tree[left]
                left += 1
            if right & 1:
                right -= 1
                total += self._tree[right]
            left //= 2
            right //= 2
        return total`;
export const SUPPLEMENTAL_MODULE: DsModule = { id: "core-structures", title: "Trees, queues & range queries", description: "Core hierarchical and range-query structures, with Python implementations.", lessons: [
make("queue", "Queue and deque", "A FIFO queue removes values in the order they were added.", ["Add at the back and remove from the front; the oldest item leaves first.", "A deque supports efficient end operations and makes an excellent breadth-first search queue.", "Empty removal raises IndexError; None remains a valid stored value."], "O(1) amortized enqueue and dequeue; O(n) iteration", "O(n) for n items.", queue, `q = Queue([1, 2])\nq.enqueue(3)\nprint(q.dequeue(), list(q), len(q))\nprint(list(Queue()))`, `1 [2, 3] 2\n[]`, "Implement Queue(items=()) with enqueue(value), dequeue(), len(queue), FIFO iteration, and IndexError on empty removal.", `class Queue:\n    pass`, `@check("FIFO order")\ndef _():\n    q = Queue([1, 2])\n    q.enqueue(3)\n    eq([q.dequeue(), q.dequeue(), q.dequeue()], [1, 2, 3])\n@check("empty removal")\ndef _():\n    raises(IndexError, Queue().dequeue)\n@check("iteration")\ndef _():\n    eq(list(Queue([None, 2])), [None, 2])\n@check("length")\ndef _():\n    q = Queue()\n    q.enqueue(4)\n    eq(len(q), 1)\n    q.dequeue()\n    eq(len(q), 0)`, "Graphs & Shortest Path", "https://docs.python.org/3/library/collections.html#collections.deque", ["The generic class accepts any element type, including None.", "Returning the deque iterator keeps iteration lazy.", "deque avoids shifting a list on each removal."], ["Calling dequeue on an empty queue raises IndexError.", "FIFO order differs from a stack's LIFO order."], ["Visit vertices in breadth-first order.", "Process tasks in arrival order."], "Use collections.deque directly in most single-threaded Python queues."),
make("binary-tree", "Binary tree traversal", "A binary tree stores at most two children per node. Traversal order determines when each value is visited.", ["In-order traversal visits the left subtree, the node, and then the right subtree.", "An explicit stack avoids Python's recursion depth limit; the generator yields one value at a time.", "In-order values are sorted only if the tree also satisfies the BST ordering invariant."], "O(n) traversal", "O(h) auxiliary stack for height h; O(n) nodes.", binary, `root = Node(2, Node(1), Node(3))\nprint(list(inorder(root)))\nprint(list(inorder(None)))`, `[1, 2, 3]\n[]`, "Implement Node(value, left=None, right=None) and inorder(root), yielding values left-root-right. An empty root yields no values.", `class Node:\n    def __init__(self, value, left=None, right=None):\n        self.value, self.left, self.right = value, left, right\ndef inorder(root):\n    raise NotImplementedError`, `@check("balanced")\ndef _():\n    eq(list(inorder(Node(2, Node(1), Node(3)))), [1, 2, 3])\n@check("empty")\ndef _():\n    eq(list(inorder(None)), [])\n@check("one node")\ndef _():\n    eq(list(inorder(Node(7))), [7])\n@check("left chain")\ndef _():\n    eq(list(inorder(Node(3, Node(2, Node(1))))), [1, 2, 3])`, "Trees & BST", "https://docs.python.org/3/tutorial/classes.html#generators", ["A slotted dataclass keeps node construction concise.", "A generator avoids building a list of results.", "An explicit stack also works for a deep tree."], ["In-order traversal is sorted only for a valid BST.", "A skewed tree can have height n."], ["Visit nodes in a hierarchical structure.", "Read BST values in sorted order."], "Use simple node classes for interviews; production needs depend on how the tree is used."),
make("heap", "Heap and priority queue", "A min-heap exposes the smallest item without keeping the entire collection sorted.", ["A min-heap maintains parent <= children, so the minimum is at index zero.", "heapify builds a heap in O(n); push and pop repair one path in O(log n).", "For equal-priority objects that cannot be compared, add a unique sequence number as a tie-breaker."], "O(1) peek, O(log n) push/pop, O(n) heapify", "O(n) for n entries.", heap, `q = MinPriorityQueue([5, 1, 3])\nq.push(2)\nprint(q.peek(), q.pop(), q.pop(), len(q))\nprint(len(MinPriorityQueue()))`, `1 1 2 2\n0`, "Implement MinPriorityQueue(values=()) for integers with push, pop, peek and len. Empty pop and peek raise IndexError.", `class MinPriorityQueue:\n    pass`, `@check("order")\ndef _():\n    q = MinPriorityQueue([5, 1, 3])\n    q.push(2)\n    eq([q.pop(), q.pop(), q.pop(), q.pop()], [1, 2, 3, 5])\n@check("empty pop")\ndef _():\n    raises(IndexError, MinPriorityQueue().pop)\n@check("empty peek")\ndef _():\n    raises(IndexError, MinPriorityQueue().peek)\n@check("peek and length")\ndef _():\n    q = MinPriorityQueue([2, 2])\n    eq(q.peek(), 2)\n    eq(len(q), 2)`, "Heaps & Priority Queues", "https://docs.python.org/3/library/heapq.html", ["Copy input before heapifying so the caller's list is unchanged.", "Raise IndexError explicitly for an empty peek.", "Use the standard-library heapq implementation."], ["The heap list is not globally sorted.", "An equal-priority tuple may try to compare non-orderable payloads."], ["Repeatedly process the smallest priority.", "Maintain a top-k set or a Dijkstra frontier."], "Use heapq for most single-threaded priority queues; queue.PriorityQueue adds synchronization."),
make("trie", "Trie for prefixes", "A trie stores one character per edge and shares common word prefixes.", ["Each character leads to another node; a terminal marker distinguishes a word from a prefix.", "Lookup and insertion follow the query characters, taking O(k) expected time for k characters.", "The empty string can be a stored word; the root's terminal marker tracks it."], "O(k) expected insert, membership and prefix lookup", "O(total characters) nodes in the worst case.", trie, `t = Trie()\nfor word in ["cat", "car", "cat"]:\n    t.add(word)\nprint("cat" in t, "ca" in t, t.starts_with("ca"), len(t))\nprint(t.starts_with("dog"))`, `True False True 2\nFalse`, "Implement Trie() with add(word), membership using in, starts_with(prefix), and len counting distinct words. The empty prefix exists and the empty word may be added.", `class Trie:\n    pass`, `@check("word and prefix")\ndef _():\n    t = Trie()\n    t.add("cat")\n    eq("cat" in t, True)\n    eq("ca" in t, False)\n    eq(t.starts_with("ca"), True)\n@check("empty word")\ndef _():\n    t = Trie()\n    eq(t.starts_with(""), True)\n    eq("" in t, False)\n    t.add("")\n    eq("" in t, True)\n@check("duplicate")\ndef _():\n    t = Trie()\n    t.add("a")\n    t.add("a")\n    eq(len(t), 1)\n@check("missing")\ndef _():\n    t = Trie()\n    t.add("car")\n    eq(t.starts_with("dog"), False)`, "Tries", "https://docs.python.org/3/library/stdtypes.html#mapping-types-dict", ["A unique object marks word ends without colliding with a character.", "Membership and len follow Python container conventions.", "Iterative traversal handles long words without recursion."], ["A prefix is not necessarily a complete word.", "Per-node dictionaries can use substantial memory."], ["Prefix search and autocomplete.", "Prune word-search paths when no prefix exists."], "For exact membership alone use a set; tries help when prefix operations are required."),
make("fenwick-tree", "Fenwick tree", "A Fenwick tree maintains prefix sums under point updates in logarithmic time.", ["Internal indices are one-based; i & -i selects the least significant set bit and determines the covered range.", "Updates move upward by that bit; prefix queries remove it repeatedly.", "The public API uses zero-based positions and a half-open prefix: prefix_sum(end) sums indices below end."], "O(log n) point update and prefix sum", "O(n) storage.", fenwick, `tree = FenwickTree(5)\nfor i, value in enumerate([2, 1, 4, 0, 3]):\n    tree.add(i, value)\nprint(tree.prefix_sum(3), tree.range_sum(1, 4))\ntree.add(2, -2)\nprint(tree.range_sum(0, 5))`, `7 5\n8`, "Implement FenwickTree(size), add(index, delta), prefix_sum(end), range_sum(start,end) using half-open ranges, and len. Invalid indices or ranges raise IndexError; negative size raises ValueError.", `class FenwickTree:\n    pass`, `@check("update")\ndef _():\n    t = FenwickTree(3)\n    t.add(0, 2)\n    t.add(2, 5)\n    eq(t.prefix_sum(3), 7)\n    eq(t.range_sum(1, 3), 5)\n@check("empty")\ndef _():\n    t = FenwickTree(0)\n    eq(t.prefix_sum(0), 0)\n    eq(len(t), 0)\n@check("bounds")\ndef _():\n    t = FenwickTree(2)\n    raises(IndexError, t.add, -1, 3)\n    raises(IndexError, t.prefix_sum, 3)\n    raises(IndexError, t.range_sum, 2, 1)\n@check("negative delta")\ndef _():\n    t = FenwickTree(1)\n    t.add(0, 3)\n    t.add(0, -4)\n    eq(t.range_sum(0, 1), -1)`, "Segment & Fenwick Trees", "https://cp-algorithms.com/data_structures/fenwick.html", ["Validate indices before the one-based update loop.", "Half-open intervals match Python slicing conventions.", "Separate public indexing from the internal representation."], ["Updating internal index zero would never advance.", "Prefix subtraction does not work for every aggregate operation."], ["Frequently update individual numbers and query sums.", "Maintain frequency prefixes or count inversions."], "For static ranges, a prefix-sum array is simpler; a Fenwick tree is useful when updates are frequent."),
make("segment-tree", "Segment tree", "A segment tree stores aggregates for ranges and supports updates without recomputing every range.", ["Leaves store values, and each parent stores the sum of its two children.", "A half-open query combines disjoint nodes covering exactly the requested range.", "Point updates repair ancestors; update and query take logarithmic time."], "O(n) build; O(log n) point update and range query", "O(n) storage.", segment, `tree = SegmentTree([2, 1, 4, 3])\nprint(tree.range_sum(1, 4))\ntree.set(2, 0)\nprint(tree.range_sum(0, 4), SegmentTree([]).range_sum(0, 0))`, `8\n6 0`, "Implement SegmentTree(values) for integers with set(index,value), range_sum(start,end) on half-open ranges, and len. Invalid indices or ranges raise IndexError; an empty range sums to zero.", `class SegmentTree:\n    pass`, `@check("sum and update")\ndef _():\n    t = SegmentTree([2, 1, 4, 3])\n    eq(t.range_sum(1, 4), 8)\n    t.set(2, 0)\n    eq(t.range_sum(0, 4), 6)\n@check("empty")\ndef _():\n    t = SegmentTree([])\n    eq(t.range_sum(0, 0), 0)\n    eq(len(t), 0)\n@check("single")\ndef _():\n    t = SegmentTree([5])\n    t.set(0, -2)\n    eq(t.range_sum(0, 1), -2)\n@check("invalid")\ndef _():\n    t = SegmentTree([1, 2])\n    raises(IndexError, t.set, 2, 1)\n    raises(IndexError, t.range_sum, 2, 1)`, "Segment & Fenwick Trees", "https://cp-algorithms.com/data_structures/segment_tree.html", ["The constructor builds its own storage from a sequence.", "Public operations validate half-open bounds.", "Iterative traversal avoids recursion overhead."], ["Other aggregates need an appropriate identity and combine operation.", "Empty arrays require care when indexing the root."], ["Combine range queries with point updates.", "Adapt the combine operation for range minimum or maximum."], "Prefix sums are simpler without updates; a segment tree is useful when range aggregation and updates coexist."),
] };
const bst = `from __future__ import annotations
from dataclasses import dataclass
from collections.abc import Iterator
@dataclass(slots=True)
class _Node:
    key: int
    left: _Node | None = None
    right: _Node | None = None
class BST:
    """Unbalanced BST storing distinct integer keys."""
    def __init__(self) -> None:
        self._root: _Node | None = None
        self._size = 0
    def add(self, key: int) -> None:
        if self._root is None:
            self._root = _Node(key)
            self._size += 1
            return
        node = self._root
        while True:
            if key == node.key:
                return
            side = "left" if key < node.key else "right"
            child = getattr(node, side)
            if child is None:
                setattr(node, side, _Node(key))
                self._size += 1
                return
            node = child
    def __contains__(self, key: int) -> bool:
        node = self._root
        while node:
            if key == node.key:
                return True
            node = node.left if key < node.key else node.right
        return False
    def __len__(self) -> int:
        return self._size
    def __iter__(self) -> Iterator[int]:
        stack: list[_Node] = []
        node = self._root
        while stack or node:
            while node:
                stack.append(node)
                node = node.left
            node = stack.pop()
            yield node.key
            node = node.right`;
SUPPLEMENTAL_MODULE.lessons.push(make("bst", "Binary search tree", "A binary search tree orders keys so comparisons can discard one subtree at each step.", ["Every key in the left subtree is smaller than the node and every key in the right subtree is larger.", "Insertion and membership follow one root-to-leaf path; a balanced tree is fast, but sorted insertions create a chain.", "This implementation ignores duplicates and yields its keys in sorted order without exposing its nodes."], "O(h) insert and lookup; O(n) traversal", "O(n) nodes and O(h) traversal stack.", bst, `tree = BST()\nfor value in [4, 2, 5, 2, 1]:\n    tree.add(value)\nprint(list(tree), len(tree))\nprint(2 in tree, 3 in tree)`, `[1, 2, 4, 5] 4\nTrue False`, "Implement BST() with add(key), membership using in, len(tree), and sorted iteration. Ignore duplicate integer keys.", `class BST:\n    pass`, `@check("sorted")\ndef _():\n    t = BST()\n    for x in [4, 2, 6, 1, 3]: t.add(x)\n    eq(list(t), [1, 2, 3, 4, 6])\n@check("duplicates")\ndef _():\n    t = BST()\n    t.add(2)\n    t.add(2)\n    eq(len(t), 1)\n@check("membership")\ndef _():\n    t = BST()\n    t.add(3)\n    eq(3 in t, True)\n    eq(4 in t, False)\n@check("empty")\ndef _():\n    t = BST()\n    eq(list(t), [])\n    eq(len(t), 0)`, "Trees & BST", "https://docs.python.org/3/library/bisect.html", ["Private slotted nodes keep the public API small.", "Iterative traversal works even on a skewed tree.", "Membership and iteration use Python container protocols."], ["This unbalanced tree has O(n) worst-case operations.", "Duplicates need an explicit policy; this version ignores them."], ["Need ordered traversal and lookup.", "Reason about ordering of all values in a subtree."], "Python has no built-in balanced tree; sorted lists and bisect suit small or mostly static collections."));
const greedy = `from collections.abc import Iterable
def select_intervals(intervals: Iterable[tuple[int, int]]) -> list[tuple[int, int]]:
    """Return a maximum-size set of compatible half-open intervals."""
    items = list(intervals)
    if any(start >= end for start, end in items):
        raise ValueError("intervals must have positive duration")
    result: list[tuple[int, int]] = []
    last_end: int | None = None
    for start, end in sorted(items, key=lambda interval: (interval[1], interval[0])):
        if last_end is None or start >= last_end:
            result.append((start, end))
            last_end = end
    return result`;
const greedyLesson = make("greedy", "Greedy interval scheduling", "A greedy algorithm commits to a locally best choice, but needs a proof that it leads to a globally optimal result.", ["For selecting the most non-overlapping intervals, sort by finish time and repeatedly pick the next compatible interval.", "An exchange argument replaces the first interval in an optimal solution with the earliest-finishing one without reducing space for the rest.", "Intervals use half-open boundaries: one meeting may start exactly when the previous one ends."], "O(n log n) due to sorting", "O(n) for the sorted copy and selected output.", greedy, `print(select_intervals([(1, 4), (0, 2), (2, 3), (3, 5)]))\nprint(select_intervals([]))`, `[(0, 2), (2, 3), (3, 5)]\n[]`, "Implement select_intervals(intervals) returning a maximum-size compatible list of half-open (start,end) intervals, sorted by end then start. Touching intervals are compatible; reject zero or negative duration with ValueError.", `def select_intervals(intervals):\n    raise NotImplementedError`, `@check("choice")\ndef _():\n    eq(select_intervals([(1, 4), (0, 2), (2, 3), (3, 5)]), [(0, 2), (2, 3), (3, 5)])\n@check("empty")\ndef _():\n    eq(select_intervals([]), [])\n@check("ties")\ndef _():\n    eq(select_intervals([(1, 3), (0, 3), (3, 4)]), [(0, 3), (3, 4)])\n@check("invalid")\ndef _():\n    raises(ValueError, select_intervals, [(1, 1)])`, "Greedy Algorithms", "https://en.wikipedia.org/wiki/Interval_scheduling", ["sorted returns a copy rather than mutating the caller's input.", "A None sentinel handles negative time values safely.", "The sorting key makes ties deterministic."], ["The earliest starting or shortest interval is not always optimal.", "Weighted interval scheduling needs a different algorithm."], ["Maximize the number of compatible intervals.", "A local choice can be supported with an exchange proof."], "For weighted scheduling, consider dynamic programming; greedy correctness must be proved for the actual objective.");
greedyLesson.kind = "algorithm";
SUPPLEMENTAL_MODULE.lessons.push(greedyLesson);
const bits = `def count_bits(n: int) -> int:
    """Count one-bits in a nonnegative integer."""
    if n < 0:
        raise ValueError("n must be nonnegative")
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count
def has_bit(n: int, bit: int) -> bool:
    if n < 0 or bit < 0:
        raise ValueError("n and bit must be nonnegative")
    return bool(n & (1 << bit))`;
const bitsLesson = make("bit-manipulation", "Bit manipulation", "Bit operations let you inspect flags, count set bits, and express compact state.", ["n & (n - 1) clears the least significant set bit of a positive integer.", "A mask 1 << bit isolates a bit; & tests it and | sets it.", "Python integers have arbitrary precision; negative values behave as if sign extended, so define a width for negative bit operations."], "O(k) iterations for k set bits; large integer operations depend on bit width", "A constant number of integer variables; their storage depends on bit length.", bits, `print(count_bits(13), has_bit(13, 2), has_bit(13, 1))\nprint(count_bits(0))`, `3 True False\n0`, "Implement count_bits(n) and has_bit(n,bit) for nonnegative integers. Return the number of set bits and a bool respectively. Negative arguments raise ValueError.", `def count_bits(n):\n    raise NotImplementedError\ndef has_bit(n, bit):\n    raise NotImplementedError`, `@check("count")\ndef _():\n    eq(count_bits(13), 3)\n    eq(count_bits(0), 0)\n@check("bit checks")\ndef _():\n    eq(has_bit(13, 2), True)\n    eq(has_bit(13, 1), False)\n@check("large")\ndef _():\n    eq(count_bits((1 << 200) | 1), 2)\n@check("negative")\ndef _():\n    raises(ValueError, count_bits, -1)\n    raises(ValueError, has_bit, 1, -1)`, "Bit Manipulation", "https://docs.python.org/3/library/stdtypes.html#bitwise-operations-on-integer-types", ["Return bool explicitly from a bit-mask test.", "Validate sign assumptions before the counting loop.", "The implementation supports arbitrary-precision integers."], ["The clear-lowest-bit loop does not terminate for negative integers.", "Complexity for large Python integers depends on their bit length."], ["Represent small sets or feature flags.", "Solve parity, subset, and bit-counting problems."], "Use int.bit_count() for production bit counting; the handwritten version illustrates the invariant.");
bitsLesson.kind = "technique";
SUPPLEMENTAL_MODULE.lessons.push(bitsLesson);
const kmp = `def find_matches(text: str, pattern: str) -> list[int]:
    """Return all start positions, including overlaps, using KMP."""
    if not pattern:
        return list(range(len(text) + 1))
    prefix = [0] * len(pattern)
    j = 0
    for i in range(1, len(pattern)):
        while j and pattern[i] != pattern[j]:
            j = prefix[j - 1]
        if pattern[i] == pattern[j]:
            j += 1
        prefix[i] = j
    matches = []
    j = 0
    for i, char in enumerate(text):
        while j and char != pattern[j]:
            j = prefix[j - 1]
        if char == pattern[j]:
            j += 1
        if j == len(pattern):
            matches.append(i - j + 1)
            j = prefix[j - 1]
    return matches`;
const kmpLesson = make("string-matching", "String matching with KMP", "Knuth-Morris-Pratt finds occurrences without repeatedly rechecking a matched prefix.", ["The prefix table records the longest proper prefix that is also a suffix for each pattern prefix.", "On mismatch, the table identifies the longest candidate prefix that may still match; the text position never moves backward.", "After a match, fall back through the table so overlapping occurrences are included."], "O(n + m) time for text length n and pattern length m", "O(m) prefix table plus O(k) for k returned matches.", kmp, `print(find_matches("ababa", "aba"))\nprint(find_matches("abc", ""))`, `[0, 2]\n[0, 1, 2, 3]`, "Implement find_matches(text,pattern), returning all start indices in increasing order including overlaps. The empty pattern matches every boundary from 0 through len(text).", `def find_matches(text, pattern):\n    raise NotImplementedError`, `@check("overlap")\ndef _():\n    eq(find_matches("ababa", "aba"), [0, 2])\n@check("empty pattern")\ndef _():\n    eq(find_matches("abc", ""), [0, 1, 2, 3])\n@check("missing")\ndef _():\n    eq(find_matches("abc", "zz"), [])\n@check("repeated")\ndef _():\n    eq(find_matches("aaaa", "aa"), [0, 1, 2])`, "String Algorithms", "https://cp-algorithms.com/string/prefix-function.html", ["The prefix table is built once and reused during search.", "Returning indices makes overlapping matches visible.", "Handle the empty pattern before indexing the pattern."], ["Forgetting the fallback after a match misses overlapping occurrences.", "Empty patterns need an explicitly defined contract."], ["Search a long text with worst-case linear complexity.", "Reuse prefix information when prefixes repeat."], "For ordinary searches use Python's built-in str.find; KMP teaches prefix reuse and predictable asymptotic behavior.");
kmpLesson.kind = "algorithm";
SUPPLEMENTAL_MODULE.lessons.push(kmpLesson);
const numberTheory = `def gcd(a: int, b: int) -> int:
    """Greatest common divisor, including for negative inputs."""
    a, b = abs(a), abs(b)
    while b:
        a, b = b, a % b
    return a

def primes_up_to(n: int) -> list[int]:
    """Return all primes <= n using the sieve of Eratosthenes."""
    if n < 2:
        return []
    prime = [True] * (n + 1)
    prime[0] = prime[1] = False
    p = 2
    while p * p <= n:
        if prime[p]:
            for multiple in range(p * p, n + 1, p):
                prime[multiple] = False
        p += 1
    return [i for i in range(2, n + 1) if prime[i]]`;
const numberLesson = make("number-theory", "GCD and prime sieve", "Euclid's algorithm and a prime sieve are useful foundations for divisibility and modular problems.", ["Euclid's algorithm preserves gcd(a, b) when replacing the pair with (b, a % b).", "A sieve crosses out multiples beginning at p squared; smaller multiples have already been crossed out.", "gcd(0, 0) is defined here as 0, consistent with Python's math.gcd."], "O(log min(a,b)) Euclid for positive inputs; O(n log log n) sieve", "O(n) sieve storage and output.", numberTheory, `print(gcd(48, 18), gcd(-9, 6))\nprint(primes_up_to(10), primes_up_to(1))`, `6 3\n[2, 3, 5, 7] []`, "Implement gcd(a,b) for integers, returning a nonnegative greatest common divisor with gcd(0,0)=0, and primes_up_to(n) returning all primes up to n in increasing order.", `def gcd(a, b):\n    raise NotImplementedError\ndef primes_up_to(n):\n    raise NotImplementedError`, `@check("gcd")\ndef _():\n    eq(gcd(48, 18), 6)\n    eq(gcd(-9, 6), 3)\n@check("zero gcd")\ndef _():\n    eq(gcd(0, 0), 0)\n    eq(gcd(0, 7), 7)\n@check("sieve")\ndef _():\n    eq(primes_up_to(10), [2, 3, 5, 7])\n@check("small inputs")\ndef _():\n    eq(primes_up_to(1), [])\n    eq(primes_up_to(2), [2])`, "Math & Number Theory", "https://docs.python.org/3/library/math.html#math.gcd", ["Normalize signs before the Euclidean loop.", "The sieve starts crossing off at the square of each prime.", "Use clear function contracts for zero and negative inputs."], ["A sieve uses memory proportional to its upper bound.", "One is not prime, and zero is not prime either."], ["Compute a common divisor or simplify a ratio.", "Answer many primality questions up to a fixed bound."], "Use math.gcd for the GCD in production; a sieve generates many primes at once.");
numberLesson.kind = "algorithm";
SUPPLEMENTAL_MODULE.lessons.push(numberLesson);
const mst = `from collections.abc import Iterable

def minimum_spanning_forest(n: int, edges: Iterable[tuple[int, int, int]]) -> tuple[int, list[tuple[int, int, int]]]:
    """Kruskal: return weight and selected (weight, u, v) edges."""
    if n < 0:
        raise ValueError("negative vertex count")
    ordered = sorted(edges)
    if any(not 0 <= u < n or not 0 <= v < n for _, u, v in ordered):
        raise ValueError("vertex out of range")
    parent = list(range(n))
    size = [1] * n
    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    chosen: list[tuple[int, int, int]] = []
    total = 0
    for weight, u, v in ordered:
        a, b = find(u), find(v)
        if a == b:
            continue
        if size[a] < size[b]:
            a, b = b, a
        parent[b] = a
        size[a] += size[b]
        chosen.append((weight, u, v))
        total += weight
    return total, chosen`;
const mstLesson = make("minimum-spanning-tree", "Minimum spanning trees", "Kruskal's algorithm finds a minimum-cost set of edges connecting each component of an undirected weighted graph.", ["Sort edges by weight and add an edge only when its endpoints are in different components.", "Union-find tracks components efficiently, preventing cycles as the algorithm chooses edges.", "A disconnected graph yields a minimum spanning forest; weights may be negative and parallel edges are allowed."], "O(E log E + V + E α(V)) time", "O(V + E) for union-find, sorted edges, and output.", mst, `total, edges = minimum_spanning_forest(3, [(3, 0, 2), (1, 0, 1), (2, 1, 2)])\nprint(total, edges)\nprint(minimum_spanning_forest(0, []))`, `3 [(1, 0, 1), (2, 1, 2)]\n(0, [])`, "Implement minimum_spanning_forest(n, edges) for an undirected graph with vertices 0..n-1. Edges are (weight,u,v). Return (total_weight, selected_edges) using Kruskal in tuple-sorted order. Negative vertex counts or out-of-range endpoints raise ValueError.", `def minimum_spanning_forest(n, edges):\n    raise NotImplementedError`, `@check("triangle")\ndef _():\n    eq(minimum_spanning_forest(3, [(3,0,2),(1,0,1),(2,1,2)]), (3, [(1,0,1),(2,1,2)]))\n@check("disconnected")\ndef _():\n    eq(minimum_spanning_forest(4, [(2,0,1),(1,2,3)]), (3, [(1,2,3),(2,0,1)]))\n@check("empty and cycles")\ndef _():\n    eq(minimum_spanning_forest(0, []), (0, []))\n    eq(minimum_spanning_forest(1, [(1,0,0)]), (0, []))\n@check("invalid")\ndef _():\n    raises(ValueError, minimum_spanning_forest, -1, [])\n    raises(ValueError, minimum_spanning_forest, 2, [(1,0,2)])`, "Advanced Graphs", "https://cp-algorithms.com/graph/mst_kruskal_with_dsu.html", ["Sort a copy rather than mutating the input.", "Union by size and path compression keep component operations efficient.", "Return the selected edges as well as their total weight."], ["A spanning tree is different from a shortest-path tree.", "Disconnected input produces a forest, not one spanning tree."], ["Connect sites with minimum total edge weight.", "Identify a minimum-cost backbone of an undirected graph."], "Use graph libraries for production graphs; the implementation illustrates the greedy and union-find invariants.");
mstLesson.kind = "algorithm";
SUPPLEMENTAL_MODULE.lessons.push(mstLesson);
