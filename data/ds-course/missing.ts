import type { DsLesson, DsLessonKind, DsModule } from "./types";
import type { DSACategory } from "../dsa/types";

type Spec = {
  id: string; title: string; kind: DsLessonKind; summary: string; concepts: string[];
  complexity: DsLesson["complexity"]; space: string; code: string; demo: string; output: string;
  bestPractices: string[]; pitfalls: string[]; useWhen: string[]; inPractice: string;
  prompt: string; hint: string; starter: string; tests: string; practice: DSACategory[]; source: string;
};
function lesson(s: Spec): DsLesson {
  return { ...s, code: s.code + "\n\nif __name__ == '__main__':\n" + s.demo.split("\n").map(line => "    " + line).join("\n") + "\n", challenge: { prompt: s.prompt, hint: s.hint, starter: s.starter, tests: s.tests, solution: s.code } };
}
const dll = `from __future__ import annotations
from collections.abc import Iterable, Iterator
from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")

@dataclass(slots=True)
class _Node(Generic[T]):
    value: T
    prev: _Node[T] | None = None
    next: _Node[T] | None = None

class DoublyLinkedList(Generic[T]):
    """End operations are O(1); traversal is O(n)."""
    def __init__(self, values: Iterable[T] = ()) -> None:
        self._head: _Node[T] | None = None
        self._tail: _Node[T] | None = None
        self._size = 0
        for value in values:
            self.append(value)
    def append(self, value: T) -> None:
        node = _Node(value, prev=self._tail)
        if self._tail is None:
            self._head = node
        else:
            self._tail.next = node
        self._tail = node
        self._size += 1
    def appendleft(self, value: T) -> None:
        node = _Node(value, next=self._head)
        if self._head is None:
            self._tail = node
        else:
            self._head.prev = node
        self._head = node
        self._size += 1
    def pop(self) -> T:
        if self._tail is None:
            raise IndexError("pop from empty list")
        node = self._tail
        self._tail = node.prev
        if self._tail is None:
            self._head = None
        else:
            self._tail.next = None
        self._size -= 1
        return node.value
    def popleft(self) -> T:
        if self._head is None:
            raise IndexError("pop from empty list")
        node = self._head
        self._head = node.next
        if self._head is None:
            self._tail = None
        else:
            self._head.prev = None
        self._size -= 1
        return node.value
    def __len__(self) -> int:
        return self._size
    def __iter__(self) -> Iterator[T]:
        node = self._head
        while node is not None:
            yield node.value
            node = node.next
    def __reversed__(self) -> Iterator[T]:
        node = self._tail
        while node is not None:
            yield node.value
            node = node.prev
    def __repr__(self) -> str:
        return f"DoublyLinkedList({list(self)!r})"`;
const avl = `from __future__ import annotations
from dataclasses import dataclass
from collections.abc import Iterator

@dataclass(slots=True)
class _Node:
    key: int
    left: _Node | None = None
    right: _Node | None = None
    height: int = 1

def _height(node: _Node | None) -> int:
    return node.height if node else 0

def _refresh(node: _Node) -> None:
    node.height = 1 + max(_height(node.left), _height(node.right))

def _right(root: _Node) -> _Node:
    top = root.left
    assert top is not None
    root.left = top.right
    top.right = root
    _refresh(root)
    _refresh(top)
    return top

def _left(root: _Node) -> _Node:
    top = root.right
    assert top is not None
    root.right = top.left
    top.left = root
    _refresh(root)
    _refresh(top)
    return top

def _balance(node: _Node) -> _Node:
    _refresh(node)
    factor = _height(node.left) - _height(node.right)
    if factor > 1:
        assert node.left is not None
        if _height(node.left.left) < _height(node.left.right):
            node.left = _left(node.left)
        return _right(node)
    if factor < -1:
        assert node.right is not None
        if _height(node.right.right) < _height(node.right.left):
            node.right = _right(node.right)
        return _left(node)
    return node

class AVLTree:
    """Distinct integer keys; insert, discard and lookup take O(log n)."""
    def __init__(self) -> None:
        self._root: _Node | None = None
        self._size = 0
    @property
    def height(self) -> int:
        return _height(self._root)
    def __len__(self) -> int:
        return self._size
    def __contains__(self, key: int) -> bool:
        node = self._root
        while node is not None:
            if key == node.key:
                return True
            node = node.left if key < node.key else node.right
        return False
    def add(self, key: int) -> None:
        def insert(node: _Node | None) -> _Node:
            if node is None:
                self._size += 1
                return _Node(key)
            if key < node.key:
                node.left = insert(node.left)
            elif key > node.key:
                node.right = insert(node.right)
            else:
                return node
            return _balance(node)
        self._root = insert(self._root)
    def discard(self, key: int) -> bool:
        if key not in self:
            return False
        def delete(node: _Node, target: int) -> _Node | None:
            if target < node.key:
                assert node.left is not None
                node.left = delete(node.left, target)
            elif target > node.key:
                assert node.right is not None
                node.right = delete(node.right, target)
            elif node.left is None:
                return node.right
            elif node.right is None:
                return node.left
            else:
                successor = node.right
                while successor.left is not None:
                    successor = successor.left
                node.key = successor.key
                node.right = delete(node.right, successor.key)
            return _balance(node)
        assert self._root is not None
        self._root = delete(self._root, key)
        self._size -= 1
        return True
    def __iter__(self) -> Iterator[int]:
        stack: list[_Node] = []
        node = self._root
        while stack or node:
            while node is not None:
                stack.append(node)
                node = node.left
            node = stack.pop()
            yield node.key
            node = node.right
    def __repr__(self) -> str:
        return f"AVLTree({list(self)!r})"`;
const sparse = `from collections.abc import Sequence

class SparseTable:
    """Static range minima: O(n log n) build, O(1) non-empty query."""
    def __init__(self, values: Sequence[int]) -> None:
        self._n = len(values)
        self._rows: list[list[int]] = []
        if not values:
            return
        self._rows.append(list(values))
        width = 2
        while width <= self._n:
            previous = self._rows[-1]
            half = width // 2
            self._rows.append([min(previous[i], previous[i + half])
                               for i in range(self._n - width + 1)])
            width *= 2
    def __len__(self) -> int:
        return self._n
    def minimum(self, start: int, end: int) -> int:
        """Minimum over the nonempty half-open interval [start, end)."""
        if not 0 <= start < end <= self._n:
            raise IndexError("expected a nonempty range inside the table")
        power = (end - start).bit_length() - 1
        width = 1 << power
        return min(self._rows[power][start], self._rows[power][end - width])`;
const connectivity = `from collections.abc import Iterable

def strongly_connected_components(n: int, edges: Iterable[tuple[int, int]]) -> list[list[int]]:
    """Kosaraju's algorithm for directed vertices 0..n-1 in O(V+E)."""
    if n < 0:
        raise ValueError("negative vertex count")
    graph = [[] for _ in range(n)]
    reverse = [[] for _ in range(n)]
    for u, v in edges:
        if not 0 <= u < n or not 0 <= v < n:
            raise ValueError("vertex out of range")
        graph[u].append(v)
        reverse[v].append(u)
    seen = [False] * n
    order: list[int] = []
    for start in range(n):
        if seen[start]:
            continue
        seen[start] = True
        stack = [(start, iter(graph[start]))]
        while stack:
            vertex, neighbors = stack[-1]
            nxt = next(neighbors, None)
            if nxt is None:
                order.append(vertex)
                stack.pop()
            elif not seen[nxt]:
                seen[nxt] = True
                stack.append((nxt, iter(graph[nxt])))
    seen = [False] * n
    result: list[list[int]] = []
    for start in reversed(order):
        if seen[start]:
            continue
        seen[start] = True
        stack2 = [start]
        component = []
        while stack2:
            vertex = stack2.pop()
            component.append(vertex)
            for nxt in reverse[vertex]:
                if not seen[nxt]:
                    seen[nxt] = True
                    stack2.append(nxt)
        result.append(component)
    return result

def bridges(n: int, edges: Iterable[tuple[int, int]]) -> list[tuple[int, int]]:
    """Return bridges in an undirected multigraph in O(V+E)."""
    if n < 0:
        raise ValueError("negative vertex count")
    graph: list[list[tuple[int, int]]] = [[] for _ in range(n)]
    for edge_id, (u, v) in enumerate(edges):
        if not 0 <= u < n or not 0 <= v < n:
            raise ValueError("vertex out of range")
        graph[u].append((v, edge_id))
        graph[v].append((u, edge_id))
    entered = [-1] * n
    low = [0] * n
    clock = 0
    result: list[tuple[int, int]] = []
    for start in range(n):
        if entered[start] != -1:
            continue
        entered[start] = low[start] = clock
        clock += 1
        # Each frame is vertex, parent vertex, incoming edge id, neighbor iterator.
        stack = [(start, -1, -1, iter(graph[start]))]
        while stack:
            u, parent, incoming, neighbors = stack[-1]
            edge = next(neighbors, None)
            if edge is None:
                stack.pop()
                if parent != -1:
                    low[parent] = min(low[parent], low[u])
                    if low[u] > entered[parent]:
                        result.append((min(parent, u), max(parent, u)))
                continue
            v, edge_id = edge
            if edge_id == incoming:
                continue
            if entered[v] != -1:
                low[u] = min(low[u], entered[v])
            else:
                entered[v] = low[v] = clock
                clock += 1
                stack.append((v, u, edge_id, iter(graph[v])))
    return result`;
const intervals = `from collections.abc import Iterable

def merge_intervals(intervals: Iterable[tuple[int, int]]) -> list[tuple[int, int]]:
    """Return the union of nonempty half-open intervals, merging touching ones."""
    items = sorted(intervals)
    if any(start >= end for start, end in items):
        raise ValueError("intervals must have positive length")
    merged: list[tuple[int, int]] = []
    for start, end in items:
        if merged and start <= merged[-1][1]:
            left, right = merged[-1]
            merged[-1] = (left, max(right, end))
        else:
            merged.append((start, end))
    return merged

def min_rooms(intervals: Iterable[tuple[int, int]]) -> int:
    """Maximum simultaneous occupancy for nonempty half-open intervals."""
    events: list[tuple[int, int]] = []
    for start, end in intervals:
        if start >= end:
            raise ValueError("intervals must have positive length")
        events.append((start, 1))
        events.append((end, -1))
    active = maximum = 0
    # On a tie, end (-1) comes before start (+1): [a,b) and [b,c) do not overlap.
    for _, change in sorted(events):
        active += change
        maximum = max(maximum, active)
    return maximum`;
export const MISSING_MODULE: DsModule = { id: "missing-core", title: "Additional core topics", description: "Balanced trees, linked lists, range queries and graph connectivity.", lessons: [
lesson({ id: "doubly-linked-list", title: "Doubly linked list", kind: "structure", summary: "A doubly linked list connects every node in both directions, enabling constant-time changes at either end.",
concepts: ["Each node has a previous and next link. The head has no previous node and the tail has no next node; both are None when empty.", "Given a node, unlinking it is constant time, but finding a value or an index still requires O(n) traversal.", "Updating both ends correctly for empty and single-node lists is essential. A cached size makes len() constant time."],
complexity: [{operation:"append, appendleft, pop, popleft",time:"O(1)",note:"updates a constant number of links"},{operation:"forward or reverse iteration",time:"O(n)"},{operation:"search for a value",time:"O(n)"}], space:"O(n) nodes, each with two links; O(1) auxiliary space for iteration.", code:dll,
demo:`items = DoublyLinkedList([2, 3])\nitems.appendleft(1)\nitems.append(4)\nprint(list(items), list(reversed(items)))\nprint(items.popleft(), items.pop(), len(items))`, output:`[1, 2, 3, 4] [4, 3, 2, 1]\n1 4 2`,
bestPractices:["Generic slotted nodes avoid a per-node instance dictionary and accept any value type.","Forward and reverse iteration yield values lazily without copying the list.","Private head, tail and size keep the invariants behind a small public API."],pitfalls:["Removing the final node must clear both head and tail.","A stored None is a valid value, so empty removal raises IndexError."], useWhen:["A deque or cache must add and remove items at either end.","You already have a node reference and need constant-time unlinking."],inPractice:"Use collections.deque for ordinary end operations; a linked implementation is useful to understand how an LRU cache can unlink a known node.",
prompt:"Implement DoublyLinkedList(values=()) with append, appendleft, pop, popleft, len, forward iteration and reversed iteration. Empty pops raise IndexError; values including None are allowed.", hint:"Maintain head, tail and size; handle transitions between zero and one node explicitly.",starter:`class DoublyLinkedList:\n    pass`, tests:`@check("both ends and iteration")\ndef _():\n    q = DoublyLinkedList([2, 3])\n    q.appendleft(1)\n    q.append(4)\n    eq(list(q), [1,2,3,4])\n    eq(list(reversed(q)), [4,3,2,1])\n    eq(q.popleft(), 1)\n    eq(q.pop(), 4)\n    eq(len(q), 2)\n@check("empty exceptions")\ndef _():\n    q = DoublyLinkedList()\n    raises(IndexError, q.pop)\n    raises(IndexError, q.popleft)\n    eq(len(q), 0)\n@check("single node and None")\ndef _():\n    q = DoublyLinkedList([None])\n    eq(q.pop(), None)\n    q.appendleft(None)\n    eq(q.popleft(), None)\n    eq(list(q), [])\n    q.append(5)\n    eq(list(reversed(q)), [5])\n@check("mixed operations")\ndef _():\n    q = DoublyLinkedList()\n    for i in range(1000): q.append(i)\n    for i in range(500): eq(q.popleft(), i)\n    for i in range(999, 499, -1): eq(q.pop(), i)\n    eq(len(q), 0)`, practice:["Linked List"], source:"https://docs.python.org/3/library/collections.html#collections.deque" }),
lesson({ id:"avl-tree",title:"AVL tree: balanced search",kind:"structure",summary:"An AVL tree uses rotations to keep a binary search tree height-balanced after insertions and deletions.",
concepts:["Each node stores its subtree height. Its balance factor is left height minus right height, and an AVL tree keeps that factor in {-1, 0, 1}.","When a subtree becomes too tall, a left or right rotation restores balance while preserving in-order key order. A left-right or right-left case needs two rotations.","After insertion or deletion, update heights and rebalance ancestors on the return path. AVL height remains logarithmic, including for sorted input."],
complexity:[{operation:"lookup, add, discard",time:"O(log n) worst case",note:"including rebalancing"},{operation:"in-order iteration",time:"O(n)"}],space:"O(n) nodes; O(log n) recursion and traversal stack for a valid AVL tree.",code:avl,
demo:`t = AVLTree()\nfor value in [30, 10, 20, 40, 50]:\n    t.add(value)\nprint(list(t), len(t), t.height)\nprint(t.discard(30), t.discard(99), list(t))`,output:`[10, 20, 30, 40, 50] 5 3\nTrue False [10, 20, 40, 50]`,
bestPractices:["A private slotted node stores the cached subtree height next to its links.","Rotation helpers refresh the lower node before refreshing its new parent.","A generator supplies sorted iteration through Python's container protocol."],pitfalls:["Refreshing heights in the wrong order breaks later balance decisions.","Deletion can require rebalancing multiple ancestors; duplicates must not increase size.","This implementation accepts integer keys and rejects duplicates by ignoring them."],useWhen:["Ordered lookup and updates must remain logarithmic for adversarial input.","You need to understand balancing and rotations in a search tree."],inPractice:"Python's standard library does not provide a balanced ordered set. For mostly static data consider bisect over a sorted list; a maintained balanced-tree library is appropriate for frequent ordered updates.",
prompt:"Implement AVLTree() with add(key), discard(key) returning True only when a key was present, membership with in, len, sorted iteration, and a height property (empty height 0, leaf height 1). Store distinct integer keys and keep the tree AVL-balanced after insertion and deletion.",hint:"Update heights after changing children; choose one or two rotations using the child balance, then rebalance on deletion too.",starter:`class AVLTree:\n    pass`, tests:`@check("rotation shapes")\ndef _():\n    for values in ([3,2,1],[1,2,3],[3,1,2],[1,3,2]):\n        t = AVLTree()\n        for x in values: t.add(x)\n        eq(list(t), [1,2,3])\n        eq(t.height, 2)\n@check("duplicates and lookup")\ndef _():\n    t = AVLTree()\n    t.add(2)\n    t.add(2)\n    eq(len(t), 1)\n    eq(2 in t, True)\n    eq(3 in t, False)\n@check("remove cases")\ndef _():\n    t = AVLTree()\n    for x in [4,2,6,1,3,5,7]: t.add(x)\n    eq(t.discard(4), True)\n    eq(t.discard(1), True)\n    eq(t.discard(42), False)\n    eq(list(t), [2,3,5,6,7])\n    eq(len(t), 5)\n@check("large ordered updates")\ndef _():\n    t = AVLTree()\n    for x in range(1000): t.add(x)\n    for x in range(0, 1000, 2): eq(t.discard(x), True)\n    eq(list(t), list(range(1, 1000, 2)))\n    eq(t.height <= 2 * (len(t) + 1).bit_length(), True)\n@check("empty tree")\ndef _():\n    t = AVLTree()\n    eq(t.height, 0)\n    eq(t.discard(1), False)\n    eq(list(t), [])`,practice:["Trees & BST"],source:"https://xlinux.nist.gov/dads/HTML/avltree.html" }),
lesson({id:"sparse-table",title:"Sparse table: static range minima",kind:"structure",summary:"A sparse table preprocesses an unchanging array so a range-minimum query can be answered in constant time.",
concepts:["Row k stores the minimum of each interval of length 2^k, built from two half-length intervals in the previous row.","For [start,end), select the largest power of two no longer than the range and compare the blocks anchored at its two ends. They may overlap.","This O(1) overlapping-block trick works for idempotent operations such as min, max and gcd, but not sum: overlapping values would be counted twice. The array is static; updates need a rebuild."],
complexity:[{operation:"preprocessing",time:"O(n log n)",note:"for n > 0"},{operation:"nonempty range minimum",time:"O(1)",note:"two precomputed blocks"}],space:"O(n log n) table space; the input is copied.",code:sparse,demo:`table = SparseTable([5, 2, 7, 1, 4])\nprint(table.minimum(0, 3), table.minimum(1, 5))\nprint(len(SparseTable([])))`,output:`2 1\n0`,
bestPractices:["Copy the input so caller mutations do not invalidate precomputed rows.","Use bit_length to compute the integer floor of log2 without floating-point rounding.","Explicit half-open boundaries align with Python slice conventions."],pitfalls:["The query rejects an empty range, which has no minimum in this API.","Overlapping blocks cannot be summed without double counting.","Changing the source array does not update the precomputed table."],useWhen:["Many range-minimum queries are made over data that never changes.","The aggregation is associative and idempotent, such as min or gcd."],inPractice:"For a few queries use min on a slice. For point updates and queries, use a segment tree; a sparse table is designed for static data.",
prompt:"Implement SparseTable(values), len(table), and minimum(start,end) over nonempty half-open ranges. Copy the input; an invalid or empty range raises IndexError, and empty tables have length zero.",hint:"Precompute minimums for intervals of lengths 1, 2, 4, ...; combine the two largest fitting end blocks.",starter:`class SparseTable:\n    pass`,tests:`@check("range queries")\ndef _():\n    t = SparseTable([5,2,7,1,4])\n    eq(t.minimum(0,3), 2)\n    eq(t.minimum(1,5), 1)\n    eq(t.minimum(4,5), 4)\n@check("invalid ranges")\ndef _():\n    t = SparseTable([1,2])\n    raises(IndexError, t.minimum, 0, 0)\n    raises(IndexError, t.minimum, -1, 1)\n    raises(IndexError, t.minimum, 0, 3)\n@check("empty and copied input")\ndef _():\n    eq(len(SparseTable([])), 0)\n    values = [3, 1]\n    t = SparseTable(values)\n    values[1] = 9\n    eq(t.minimum(0, 2), 1)\n@check("many ranges")\ndef _():\n    values = [(i * 37) % 101 - 50 for i in range(64)]\n    t = SparseTable(values)\n    for start in range(64):\n        for end in range(start + 1, 65):\n            eq(t.minimum(start, end), min(values[start:end]))`,practice:["Segment & Fenwick Trees"],source:"https://cp-algorithms.com/data_structures/sparse-table.html"}),
lesson({id:"scc-bridges",title:"Strongly connected components & bridges",kind:"algorithm",summary:"Find mutually reachable groups in directed graphs and critical edges in undirected graphs using DFS.",
concepts:["A strongly connected component is a maximal set of vertices with paths in both directions between every pair. Kosaraju visits vertices in finishing order, then explores the reversed graph in reverse finishing order.","A bridge is an undirected edge whose removal increases the number of connected components. A DFS child edge is a bridge when its subtree cannot reach the parent or an ancestor via another edge.","Discovery times and low-link values summarize that reachability. In multigraphs, skip only the incoming edge by edge ID: a parallel edge is a valid return path."],
complexity:[{operation:"SCC or bridge detection",time:"O(V + E)",note:"each vertex and edge is processed a constant number of times"}],space:"O(V + E) adjacency storage, DFS stacks and result.",code:connectivity,demo:`parts = strongly_connected_components(5, [(0,1),(1,0),(1,2),(2,3),(3,2)])\nprint(sorted(sorted(part) for part in parts))\nprint(sorted(bridges(4, [(0,1),(1,2),(2,0),(2,3)])))`,output:`[[0, 1], [2, 3], [4]]\n[(2, 3)]`,
bestPractices:["Explicit iterator stacks preserve real DFS finish order without recursion limits.","Mark vertices when pushing them so each is discovered only once.","Distinct edge IDs make parallel edges and self-loops work correctly."],pitfalls:["SCCs apply to directed reachability; bridges here apply to undirected graphs.","Skipping every edge to the parent mistakes a parallel edge for a bridge.","Component and bridge order is not unique; compare normalized results when testing."],useWhen:["Group mutually dependent services or collapse directed cycles into a DAG.","Identify connections whose failure disconnects an undirected network."],inPractice:"Use a graph library for production graph workloads; these implementations expose the DFS invariants used in interviews.",
prompt:"Implement strongly_connected_components(n,edges) for a directed graph and bridges(n,edges) for an undirected multigraph. Vertices are 0..n-1; return lists of components and normalized endpoint pairs respectively in any order. Reject negative n or invalid endpoints with ValueError; support self-loops and parallel edges.",hint:"Use two DFS passes for SCCs. For bridges track discovery times, low-link values, and the ID of the incoming edge.",starter:`def strongly_connected_components(n, edges):\n    raise NotImplementedError\ndef bridges(n, edges):\n    raise NotImplementedError`,tests:`@check("directed SCCs")\ndef _():\n    parts = strongly_connected_components(5, [(0,1),(1,0),(1,2),(2,3),(3,2)])\n    eq(sorted(sorted(c) for c in parts), [[0,1],[2,3],[4]])\n@check("bridges and cycles")\ndef _():\n    eq(sorted(bridges(5, [(0,1),(1,2),(2,0),(2,3)])), [(2,3)])\n@check("parallel edges and loops")\ndef _():\n    eq(bridges(2, [(0,1),(0,1),(0,0)]), [])\n@check("empty and invalid")\ndef _():\n    eq(strongly_connected_components(0, []), [])\n    eq(bridges(0, []), [])\n    raises(ValueError, bridges, 2, [(0,2)])\n    raises(ValueError, strongly_connected_components, -1, [])\n@check("deep path")\ndef _():\n    edges = [(i, i+1) for i in range(1500)]\n    eq(len(bridges(1501, edges)), 1500)\n    eq(len(strongly_connected_components(1501, edges)), 1501)`,practice:["Advanced Graphs"],source:"https://cp-algorithms.com/graph/strongly-connected-components.html"}),
lesson({id:"intervals-sweep",title:"Intervals & sweep lines",kind:"technique",summary:"Sort interval endpoints to merge ranges or count simultaneous events, with boundary rules made explicit.",
concepts:["Sorting by start lets us extend a merged interval until the next interval begins beyond its end.","A sweep line treats starts as +1 and ends as -1; the largest running count is the number of rooms needed for half-open meetings.","At equal times, process an end before a start for half-open intervals, so a room can be reused immediately. Merging touching intervals is safe when computing their union."],
complexity:[{operation:"merge intervals or sweep events",time:"O(n log n)",note:"sorting dominates"}],space:"O(n) copied intervals or event list and result.",code:intervals,demo:`meetings = [(1, 4), (2, 5), (5, 7)]\nprint(merge_intervals(meetings))\nprint(min_rooms(meetings), min_rooms([]))`,output:`[(1, 7)]\n2 0`,
bestPractices:["sorted creates a copy and preserves the caller's input.","Tuple ordering makes ends sort before starts at identical times.","Reject zero-length and reversed intervals before processing them."],pitfalls:["Closed intervals need a different tie rule than half-open intervals.","Counting all starts before all ends at a shared endpoint overcounts rooms."],useWhen:["Merge overlapping bookings or report their union.","Count maximum simultaneous activity or allocate meeting rooms."],inPractice:"For a stream of bookings, a heap of current end times can allocate rooms incrementally after sorting starts; sweep lines are convenient for offline analysis.",
prompt:"Implement merge_intervals(intervals), returning the sorted union of positive-length half-open intervals and merging touching ranges, and min_rooms(intervals), returning maximum concurrent intervals. Invalid intervals raise ValueError; empty input returns [] and 0 respectively.",hint:"Sort intervals by start for merging. For room count, sort (time, delta) events with -1 before +1 at a tie.",starter:`def merge_intervals(intervals):\n    raise NotImplementedError\ndef min_rooms(intervals):\n    raise NotImplementedError`,tests:`@check("merge")\ndef _():\n    eq(merge_intervals([(5,7),(1,4),(2,5)]), [(1,7)])\n    eq(merge_intervals([(1,2),(4,5)]), [(1,2),(4,5)])\n@check("room boundary")\ndef _():\n    eq(min_rooms([(1,2),(2,3)]), 1)\n    eq(min_rooms([(1,4),(2,5),(5,7)]), 2)\n@check("empty")\ndef _():\n    eq(merge_intervals([]), [])\n    eq(min_rooms([]), 0)\n@check("invalid")\ndef _():\n    raises(ValueError, merge_intervals, [(1,1)])\n    raises(ValueError, min_rooms, [(3,2)])`,practice:["Intervals & Sweepline"],source:"https://algs4.cs.princeton.edu/93intersection/"})
]};
