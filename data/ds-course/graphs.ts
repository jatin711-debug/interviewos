import type { DsModule } from "./types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const GRAPHS_MODULE: DsModule = {
  id: "graphs",
  title: "Graphs",
  description: "Represent connections, traverse them, find shortest paths and spanning trees, and decompose directed graphs.",
  lessons: [
    {
      id: "graph-representation",
      title: "Representing graphs",
      kind: "structure",
      summary: "A graph is a set of vertices joined by edges. How you store those edges (adjacency list, matrix or edge list) decides which questions are cheap, so every graph algorithm starts with this choice.",
      concepts: [
        "A graph is vertices plus edges. An edge is undirected (a friendship: both ends are equal) or directed (a one-way road, a dependency: u -> v is not v -> u), and it may carry a weight such as a distance or a cost. The degree of a vertex is the number of edges at it, a path is a walk along edges, and a cycle is a path that returns to where it started.",
        "The default layout is an adjacency list: a dict that maps each vertex to the list of its neighbours (and weights). It takes O(V + E) space, add_edge is O(1), and walking the neighbours of v costs O(degree of v), which is exactly what traversal algorithms need. Checking one specific edge scans a list, so it costs O(degree) unless you store neighbours in a set instead.",
        "An adjacency matrix is a V x V table where cell [u][v] says whether the edge u -> v exists. It answers has_edge in O(1) and is the natural input for Floyd-Warshall, but it always costs O(V^2) memory and finding the neighbours of a vertex scans a whole row of V cells. It wins only for dense graphs (E close to V^2) or small V.",
        "An edge list is just a list of (u, v, weight) tuples: O(E) space and no structure at all. It is the right shape when an algorithm treats edges as a bag, such as sorting them by weight (Kruskal) or relaxing every edge in rounds (Bellman-Ford), and the wrong shape for \"who are the neighbours of v\", which becomes an O(E) scan.",
        "Some graphs are never stored. In a grid or a puzzle, the neighbours of a cell or state are computed on demand from a rule (up, down, left, right, if open). This implicit graph can have millions of vertices and still need no memory for edges, and every traversal in the next lessons works on it unchanged."
      ],
      complexity: [
        { operation: "add_vertex / add_edge", time: "O(1) amortized", note: "an undirected edge appends to two lists" },
        { operation: "degree(v)", time: "O(1)" },
        { operation: "neighbors(v)", time: "O(degree of v)", note: "to consume the generator; creating it is O(1)" },
        { operation: "has_edge(u, v)", time: "O(degree of u)", note: "O(1) in a matrix, or with sets instead of lists" },
        { operation: "edges() / iterate everything", time: "O(V + E)" },
        { operation: "to_matrix", time: "O(V^2)", note: "building the table dominates; the edges add O(E)" }
      ],
      space: "O(V + E) for the adjacency list (an undirected edge is stored twice). An adjacency matrix needs O(V^2). A grid used as an implicit graph needs no extra space for edges.",
      code: py`
from __future__ import annotations

from collections.abc import Hashable, Iterable, Iterator
from typing import Generic, TypeVar

V = TypeVar("V", bound=Hashable)


class Graph(Generic[V]):
    """A graph stored as a dict of adjacency lists.

    Invariant: every endpoint of every edge is a key of _adj, and in an
    undirected graph u is listed under v exactly when v is listed under u.
    add_edge is O(1), neighbors(v) is O(degree of v), memory is O(V + E).
    """

    __slots__ = ("_adj", "_edge_count", "directed")

    def __init__(self, vertices: Iterable[V] = (), *, directed: bool = False) -> None:
        self._adj: dict[V, list[tuple[V, float]]] = {v: [] for v in vertices}
        self._edge_count = 0
        self.directed = directed

    @classmethod
    def from_edges(cls, edges: Iterable[tuple[V, ...]], *, directed: bool = False) -> Graph[V]:
        """Build a graph from (u, v) or (u, v, weight) tuples."""
        graph = cls(directed=directed)
        for u, v, *weight in edges:
            graph.add_edge(u, v, *weight)
        return graph

    @property
    def edge_count(self) -> int:
        return self._edge_count

    def add_vertex(self, v: V) -> None:
        self._adj.setdefault(v, [])

    def add_edge(self, u: V, v: V, weight: float = 1) -> None:
        """Add an edge, creating missing endpoints. Parallel edges are allowed."""
        self.add_vertex(u)
        self.add_vertex(v)
        self._adj[u].append((v, weight))
        if not self.directed and u != v:  # a self-loop is stored once
            self._adj[v].append((u, weight))
        self._edge_count += 1

    def neighbors(self, v: V) -> Iterator[V]:
        """Return the vertices one edge away from v (KeyError if v is unknown)."""
        # The outermost iterable of a generator expression is evaluated NOW,
        # so a missing vertex raises here instead of at the first next().
        return (w for w, _ in self._adj[v])

    def weighted_neighbors(self, v: V) -> Iterator[tuple[V, float]]:
        return iter(self._adj[v])

    def degree(self, v: V) -> int:
        return len(self._adj[v])

    def has_edge(self, u: V, v: V) -> bool:
        return u in self._adj and any(w == v for w in self.neighbors(u))

    def edges(self) -> Iterator[tuple[V, V, float]]:
        """Yield every edge once as (u, v, weight); an undirected edge is not repeated."""
        done: set[V] = set()
        for u, out in self._adj.items():
            done.add(u)
            for v, weight in out:
                if self.directed or v == u or v not in done:
                    yield u, v, weight

    def __len__(self) -> int:  # number of vertices; an empty graph is falsy
        return len(self._adj)

    def __iter__(self) -> Iterator[V]:
        return iter(self._adj)

    def __contains__(self, v: object) -> bool:
        return v in self._adj

    def __repr__(self) -> str:
        kind = "directed" if self.directed else "undirected"
        return f"Graph({kind}, vertices={len(self)}, edges={self._edge_count})"


def to_matrix(graph: Graph[int]) -> list[list[int]]:
    """Adjacency matrix for vertices 0..n-1: matrix[u][v] is 1 when u -> v exists. O(V^2) space."""
    n = len(graph)
    matrix = [[0] * n for _ in range(n)]  # never [[0] * n] * n: that repeats ONE row
    for u, v, _ in graph.edges():
        matrix[u][v] = 1
        if not graph.directed:
            matrix[v][u] = 1
    return matrix


def grid_neighbors(grid: list[str], row: int, col: int) -> Iterator[tuple[int, int]]:
    """Yield the open ('.') cells next to (row, col). The graph is implicit: no edge is stored."""
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        r, c = row + dr, col + dc
        if 0 <= r < len(grid) and 0 <= c < len(grid[r]) and grid[r][c] == ".":
            yield r, c


if __name__ == "__main__":
    g = Graph.from_edges([(0, 1), (0, 2), (1, 2), (2, 3)])
    print(g, 2 in g, 9 in g)
    print(list(g), list(g.neighbors(2)), g.degree(2), g.has_edge(3, 0))
    print(list(g.edges()))
    for row in to_matrix(g):
        print(row)

    roads = Graph.from_edges([("A", "B", 4), ("A", "C", 1), ("C", "B", 2)], directed=True)
    print(roads, list(roads.weighted_neighbors("A")), roads.has_edge("B", "A"))

    maze = ["..#",
            ".#.",
            "..."]
    print(list(grid_neighbors(maze, 1, 0)), list(grid_neighbors(maze, 2, 1)))

    try:
        g.neighbors(9)
    except KeyError as error:
        print("KeyError:", error)
`,
      output: `Graph(undirected, vertices=4, edges=4) True False
[0, 1, 2, 3] [0, 1, 3] 3 False
[(0, 1, 1), (0, 2, 1), (1, 2, 1), (2, 3, 1)]
[0, 1, 1, 0]
[1, 0, 1, 0]
[1, 1, 0, 1]
[0, 0, 1, 0]
Graph(directed, vertices=3, edges=3) [('B', 4), ('C', 1)] False
[(0, 0), (2, 0)] [(2, 0), (2, 2)]
KeyError: 9`,
      bestPractices: [
        "Store the graph as a dict of lists. add_edge is O(1), memory is O(V + E), and any hashable value (an int, a string, a tuple such as a grid cell) can be a vertex with no index bookkeeping.",
        "Make neighbors() a generator expression over the stored list. Nothing is copied, callers cannot mutate your internals through it, and because the outermost iterable of a generator expression is evaluated immediately, an unknown vertex raises KeyError at the call.",
        "Let from_edges accept (u, v) and (u, v, weight) with `for u, v, *weight in edges` and `add_edge(u, v, *weight)`. One alternate constructor then serves weighted and unweighted data, and a default weight of 1 stays in a single place.",
        "Implement __len__, __iter__ and __contains__ over the vertices so `len(graph)`, `for v in graph` and `v in graph` behave like a dict's keys. __len__ also makes an empty graph falsy.",
        "Make edges() a generator that remembers which vertices it has finished (`done`). An undirected edge is stored under both ends, but it is yielded once, and the whole listing needs no temporary list of edges.",
        "Make `directed` keyword-only. Graph(directed=True) reads clearly and cannot be mistaken for a list of vertices passed by position."
      ],
      pitfalls: [
        "Building a matrix with `[[0] * n] * n` repeats one row n times, so setting matrix[0][1] = 1 changes every row. Use `[[0] * n for _ in range(n)]`.",
        "Deriving the vertices from the edges drops isolated vertices: a graph with 5 vertices and edges among only 0-3 would claim 4. Pass the vertex count (or add_vertex) explicitly, especially when counting connected components.",
        "Using defaultdict(list) and then reading adj[v] for a vertex you never added silently creates it, so `v in adj` flips to True after a mere lookup. A plain dict that raises KeyError (as this class does) exposes the typo.",
        "Forgetting the reverse entry in an undirected graph (or adding it in a directed one). A traversal then misses vertices or invents paths, and the bug only shows up on some inputs.",
        "Calling has_edge in a hot loop on a high-degree vertex: it scans the neighbour list, O(degree). Store neighbours as a set (or use a matrix) when edge-existence queries dominate."
      ],
      useWhen: [
        "The data is pairwise relationships: roads, dependencies, friendships, hyperlinks, transitions between states.",
        "The graph is sparse (E is about V, not V^2): use an adjacency list. It is also the shape BFS, DFS, Dijkstra and topological sort expect.",
        "You need constant-time edge lookups on a small or dense graph (or an all-pairs algorithm): use a matrix. The algorithm sorts or loops over edges: keep an edge list.",
        "A grid, maze or puzzle: compute neighbours from the rule instead of building the graph first."
      ],
      inPractice: "For quick work a plain dict[int, list[int]] (or defaultdict(list) when you accept its auto-creation) is the standard answer. Use networkx when you want ready-made graph algorithms and drawing, and scipy.sparse.csgraph for large numeric graphs stored as sparse matrices. Hand-roll a class like Graph when you want an invariant (undirected symmetry), validation and a narrow API.",
      challenge: {
        prompt: "Write a Digraph class for a simple directed graph on vertices 0..n-1 (no parallel edges). Digraph(n) starts with no edges. add_edge(u, v) adds u -> v and silently ignores a duplicate; a self-loop (u == v) is allowed. has_edge(u, v) must take O(1) on average. neighbors(v) returns a NEW list of the vertices v points to, in ascending order. out_degree(v) and in_degree(v) count the edges leaving and entering v, and both must be O(1). edges() is a generator that lazily yields every (u, v) pair sorted by u, then by v. Every method raises ValueError if a vertex is outside range(n) (note that -1 must be rejected too).",
        hint: "Keep a list of n sets, one per vertex, for the out-neighbours: a set makes has_edge O(1) and ignores duplicates for free, and sorted(set) gives the ascending order on demand. Keep a second list of in-degree counters and bump it only when the edge was really new. Write one small _check(v) helper for the range test.",
        starter: py`
class Digraph:
    """A simple directed graph on vertices 0..n-1."""

    def __init__(self, n):
        self._n = n
        # TODO: store the out-neighbours of every vertex and the in-degrees

    def add_edge(self, u, v):
        raise NotImplementedError

    def has_edge(self, u, v):
        raise NotImplementedError

    def neighbors(self, v):
        raise NotImplementedError

    def out_degree(self, v):
        raise NotImplementedError

    def in_degree(self, v):
        raise NotImplementedError

    def edges(self):
        raise NotImplementedError
`,
        solution: py`
class Digraph:
    """A simple directed graph on vertices 0..n-1."""

    def __init__(self, n):
        self._n = n
        self._out = [set() for _ in range(n)]
        self._in_degree = [0] * n

    def _check(self, v):
        if not 0 <= v < self._n:
            raise ValueError(f"vertex {v} is not in range({self._n})")

    def add_edge(self, u, v):
        self._check(u)
        self._check(v)
        if v not in self._out[u]:
            self._out[u].add(v)
            self._in_degree[v] += 1

    def has_edge(self, u, v):
        self._check(u)
        self._check(v)
        return v in self._out[u]

    def neighbors(self, v):
        self._check(v)
        return sorted(self._out[v])

    def out_degree(self, v):
        self._check(v)
        return len(self._out[v])

    def in_degree(self, v):
        self._check(v)
        return self._in_degree[v]

    def edges(self):
        for u in range(self._n):
            for v in sorted(self._out[u]):
                yield u, v
`,
        tests: py`
@check("neighbors are sorted and edges are directed")
def _():
    g = Digraph(5)
    for u, v in [(0, 3), (0, 1), (1, 2), (3, 2), (0, 2)]:
        g.add_edge(u, v)
    eq(g.neighbors(0), [1, 2, 3])
    eq(g.neighbors(2), [])
    eq(g.neighbors(4), [])
    eq(g.has_edge(0, 3), True)
    eq(g.has_edge(3, 0), False)
    g.neighbors(0).append(99)  # a copy: the graph must not change
    eq(g.neighbors(0), [1, 2, 3])

@check("in_degree and out_degree count each edge once")
def _():
    g = Digraph(4)
    for u, v in [(0, 1), (0, 2), (3, 2), (1, 2)]:
        g.add_edge(u, v)
    eq([g.out_degree(v) for v in range(4)], [2, 1, 0, 1])
    eq([g.in_degree(v) for v in range(4)], [0, 1, 3, 0])

@check("duplicate edges are ignored and a self-loop is allowed")
def _():
    g = Digraph(3)
    g.add_edge(0, 1)
    g.add_edge(0, 1)
    g.add_edge(1, 1)
    eq(g.out_degree(0), 1)
    eq(g.in_degree(1), 2)
    eq(g.out_degree(1), 1)
    eq(g.neighbors(1), [1])
    eq(g.has_edge(1, 1), True)

@check("edges() lazily yields (u, v) sorted by u then v")
def _():
    g = Digraph(4)
    for u, v in [(2, 0), (0, 3), (0, 1), (3, 3)]:
        g.add_edge(u, v)
    stream = g.edges()
    eq(next(stream), (0, 1))
    eq(list(stream), [(0, 3), (2, 0), (3, 3)])
    eq(list(Digraph(2).edges()), [])

@check("vertices outside range(n) raise ValueError")
def _():
    g = Digraph(3)
    raises(ValueError, g.add_edge, 0, 3)
    raises(ValueError, g.add_edge, -1, 0)
    raises(ValueError, g.neighbors, 5)
    raises(ValueError, g.has_edge, 0, 9)
    raises(ValueError, g.out_degree, -2)
    raises(ValueError, g.in_degree, 3)

@check("20,000 has_edge queries on a vertex with 60,000 neighbours stay fast")
def _():
    n = 60_001
    g = Digraph(n)
    for leaf in range(1, n):
        g.add_edge(0, leaf)
    hits = 0
    for step in range(20_000):
        if g.has_edge(0, n - 1 - step % 1000):
            hits += 1
    eq(hits, 20_000)
    eq(g.has_edge(0, 0), False)
    eq(g.out_degree(0), 60_000)
    eq(g.in_degree(5), 1)
`
      },
      practice: ["Graphs & Shortest Path"],
      source: "https://www.python.org/doc/essays/graphs/"
    },
    {
      id: "bfs-dfs",
      title: "Breadth-first & depth-first search",
      kind: "algorithm",
      summary: "The two basic ways to visit every vertex reachable from a start. BFS spreads outward in rings and finds fewest-edge paths; DFS dives down one path and backtracks. Nearly every other graph algorithm is one of them with extra bookkeeping.",
      concepts: [
        "BFS keeps a FIFO queue. It visits the start, then everything one edge away, then everything two edges away, and so on, so the queue always holds one distance layer followed by the next. In an unweighted graph the first time BFS reaches a vertex is therefore along a path with the fewest edges.",
        "DFS keeps a LIFO structure, either the call stack (recursion) or an explicit stack. It follows one path as deep as it will go, then backs up to the most recent vertex that still has an unvisited neighbour. That makes it the tool for exhaustive exploration: components, cycle detection, topological order, backtracking.",
        "Both mark a vertex as seen the first time they discover it and never expand it again, so every vertex is processed once and every edge is examined once (twice in an undirected graph): O(V + E) time and O(V) extra space. Mark a vertex when you enqueue it, not when you dequeue it, or the same vertex enters the queue many times.",
        "To recover the route, record where you came from. A parent dict maps each discovered vertex to the vertex that discovered it; it doubles as the seen set. Walk the parents back from the goal and reverse the list to get the path. Seeding the queue with several start vertices at once (a multi-source BFS) gives each vertex its distance to the nearest start.",
        "Recursive DFS is the shortest code but its depth can reach V on a long chain, and CPython stops at about 1000 frames. Replacing the call stack with an explicit stack of neighbour iterators visits vertices in exactly the same order with no depth limit."
      ],
      complexity: [
        { operation: "bfs_order / dfs_order", time: "O(V + E)", note: "each vertex once, each edge once or twice" },
        { operation: "shortest_path (unweighted)", time: "O(V + E)", note: "path reconstruction adds O(path length)" },
        { operation: "connected_components", time: "O(V + E)", note: "every vertex belongs to exactly one search" },
        { operation: "grid_distance on R x C cells", time: "O(R * C)", note: "V = R * C and each cell has at most 4 edges" }
      ],
      space: "O(V): the seen set or parent map, plus the queue (up to one whole layer) or the DFS stack (up to one whole path, V deep in the worst case).",
      code: py`
from __future__ import annotations

from collections import deque
from collections.abc import Iterator, Mapping, Sequence

Graph = Mapping[int, Sequence[int]]  # vertex -> its neighbours


def bfs_order(graph: Graph, start: int) -> Iterator[int]:
    """Yield the vertices reachable from start in breadth-first order. O(V + E).

    Invariant: a vertex joins seen the moment it is enqueued, so it is queued
    once, and the queue holds vertices at distance d followed by vertices at
    distance d + 1, never anything farther.
    """
    seen = {start}
    queue = deque([start])
    while queue:
        u = queue.popleft()  # O(1); list.pop(0) would be O(n)
        yield u
        for v in graph[u]:
            if v not in seen:
                seen.add(v)
                queue.append(v)


def dfs_recursive(graph: Graph, u: int, seen: set[int]) -> Iterator[int]:
    """Yield vertices depth-first (preorder). Short, but depth is capped by the recursion limit."""
    seen.add(u)
    yield u
    for v in graph[u]:
        if v not in seen:
            yield from dfs_recursive(graph, v, seen)


def dfs_order(graph: Graph, start: int) -> Iterator[int]:
    """Yield the same preorder as dfs_recursive using an explicit stack, so depth is unlimited.

    The stack holds one neighbour iterator per vertex on the current path:
    exactly what the call stack would hold.
    """
    seen = {start}
    yield start
    stack = [iter(graph[start])]
    while stack:
        for v in stack[-1]:  # resumes where this iterator stopped
            if v not in seen:
                seen.add(v)
                yield v
                stack.append(iter(graph[v]))
                break  # go deeper first
        else:  # no unvisited neighbours left: backtrack
            stack.pop()


def shortest_path(graph: Graph, start: int, goal: int) -> list[int] | None:
    """Return a path from start to goal with the fewest edges, or None if unreachable."""
    parent: dict[int, int | None] = {start: None}  # also serves as the seen set
    queue = deque([start])
    while queue and goal not in parent:
        u = queue.popleft()
        for v in graph[u]:
            if v not in parent:
                parent[v] = u
                queue.append(v)
    if goal not in parent:
        return None
    path: list[int] = []
    node: int | None = goal
    while node is not None:  # walk the parent links back to start
        path.append(node)
        node = parent[node]
    path.reverse()
    return path


def connected_components(graph: Graph) -> list[list[int]]:
    """Group an undirected graph's vertices into components, each in BFS order. O(V + E) overall."""
    seen: set[int] = set()
    components = []
    for start in graph:
        if start not in seen:
            component = list(bfs_order(graph, start))
            seen.update(component)
            components.append(component)
    return components


def grid_distance(grid: Sequence[str], start: tuple[int, int], goal: tuple[int, int]) -> int:
    """Fewest steps from start to goal over open '.' cells (4 directions), or -1."""
    dist = {start: 0}
    queue = deque([start])
    while queue:
        r, c = queue.popleft()
        if (r, c) == goal:
            return dist[r, c]
        for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
            if 0 <= nr < len(grid) and 0 <= nc < len(grid[nr]) and grid[nr][nc] == "." and (nr, nc) not in dist:
                dist[nr, nc] = dist[r, c] + 1
                queue.append((nr, nc))
    return -1


if __name__ == "__main__":
    graph = {0: [1, 2], 1: [3], 2: [3, 4], 3: [5], 4: [5], 5: [], 6: [7], 7: [6]}
    print(list(bfs_order(graph, 0)))
    print(list(dfs_order(graph, 0)), list(dfs_recursive(graph, 0, set())))
    print(shortest_path(graph, 0, 5), shortest_path(graph, 0, 6))
    print(connected_components({0: [1], 1: [0], 2: [], 3: [4], 4: [3]}))

    maze = ["..#.",
            ".#..",
            "...#"]
    print(grid_distance(maze, (0, 0), (0, 3)), grid_distance(maze, (0, 0), (2, 3)))

    chain = {i: [i + 1] for i in range(5000)} | {5000: []}  # far deeper than the recursion limit
    print(sum(1 for _ in dfs_order(chain, 0)))
`,
      output: `[0, 1, 2, 3, 4, 5]
[0, 1, 3, 5, 2, 4] [0, 1, 3, 5, 2, 4]
[0, 1, 3, 5] None
[[0, 1], [2], [3, 4]]
7 -1
5001`,
      bestPractices: [
        "Use collections.deque as the BFS queue. popleft() is O(1), while list.pop(0) shifts every remaining element and turns BFS into O(V^2).",
        "Write traversals as generators (yield). bfs_order and dfs_order produce vertices lazily, so a caller can stop at the first match with next() or any() without visiting the rest, and nothing builds a list unless asked.",
        "Let one dict do two jobs. In shortest_path, parent is both the seen set (`v not in parent`) and the route back, with None marking the start so the reconstruction loop knows when to stop.",
        "Drive iterative DFS with a stack of iterators and for/else. Each stack entry resumes its neighbour loop where it left off, `break` means go deeper, and the else branch (no break) means backtrack; the order matches the recursive version exactly.",
        "Mark a vertex as seen when it is enqueued or pushed onto the path, not when it is later taken out. Each vertex is then queued exactly once.",
        "Use tuples as vertices for grids, and iterate over a tuple of four (dr, dc) steps. dist[r, c] (a tuple key without extra parentheses) keeps the distance map and the seen set in one dict."
      ],
      pitfalls: [
        "Using a list as the queue (`queue.pop(0)`) makes BFS quadratic on big graphs. Use deque.popleft().",
        "Marking vertices as seen only when they are dequeued lets the same vertex be queued once per incoming edge: wasted work, and a parent map would be overwritten by a later discoverer.",
        "Recursive DFS on a long path raises RecursionError after roughly 1000 frames: the 5,000-vertex chain in the demo would fail with dfs_recursive. Use the explicit stack rather than raising the recursion limit.",
        "Stack-based DFS that pushes every neighbour and marks vertices at push time is not a true depth-first order. It is fine for plain reachability, but cycle detection and topological sort need real DFS timing, so push iterators (or mark on pop).",
        "Running connected_components on a directed graph with one-way adjacency lists returns reachability groups that depend on the start order, not components. Store both directions for an undirected graph."
      ],
      useWhen: [
        "\"Fewest moves / hops / steps\" in an unweighted graph or a grid (word ladder, shortest maze path, minimum mutations): BFS.",
        "Reachability, flood fill, counting islands or connected components: either search, with one search started per unvisited vertex.",
        "Exhaustive exploration, backtracking, cycle detection or ordering by finishing time: DFS.",
        "Weighted edges where cost differs per edge: BFS and DFS are not enough. Use Dijkstra, covered in a later lesson."
      ],
      inPractice: "The standard library has no graph traversal, so you write these short functions yourself: a deque for BFS and a plain list as the DFS stack. With networkx installed, bfs_tree, dfs_preorder_nodes and connected_components are ready-made. For very large graphs stored as sparse matrices, scipy.sparse.csgraph has fast C implementations.",
      challenge: {
        prompt: "Write distance_to_nearest_zero(matrix). matrix is a non-empty rectangular list of lists containing only 0 and 1, with at least one 0. Return a NEW matrix of the same shape in which each cell holds the number of steps (moving up, down, left or right, through any cells) needed to reach the nearest 0. A 0 cell has distance 0. Do not modify the input. It must run in O(rows * cols): the checks use 301 x 301 grids, so searching from every cell separately will time out.",
        hint: "Run one BFS that starts from all the zeros at once: put every 0 cell in the queue with distance 0, then expand layer by layer, giving each unvisited neighbour distance + 1. The first time a cell is reached is its shortest distance, exactly like the single-source BFS in the lesson.",
        starter: py`
def distance_to_nearest_zero(matrix):
    """Return, for every cell, the number of steps to the nearest 0."""
    # TODO: seed a queue with every 0 cell, then expand breadth-first.
    raise NotImplementedError
`,
        solution: py`
from collections import deque


def distance_to_nearest_zero(matrix):
    """Return, for every cell, the number of steps to the nearest 0 (multi-source BFS)."""
    rows, cols = len(matrix), len(matrix[0])
    dist = [[-1] * cols for _ in range(rows)]  # -1 means not reached yet
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            if matrix[r][c] == 0:
                dist[r][c] = 0
                queue.append((r, c))
    while queue:
        r, c = queue.popleft()
        for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
            if 0 <= nr < rows and 0 <= nc < cols and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                queue.append((nr, nc))
    return dist
`,
        tests: py`
@check("matches the worked example")
def _():
    eq(distance_to_nearest_zero([[0, 0, 0], [0, 1, 0], [1, 1, 1]]), [[0, 0, 0], [0, 1, 0], [1, 2, 1]])

@check("handles a single cell, an all-zero grid, one row and one column")
def _():
    eq(distance_to_nearest_zero([[0]]), [[0]])
    eq(distance_to_nearest_zero([[0, 0], [0, 0]]), [[0, 0], [0, 0]])
    eq(distance_to_nearest_zero([[1, 1, 0, 1, 1, 1]]), [[2, 1, 0, 1, 2, 3]])
    eq(distance_to_nearest_zero([[1], [1], [1], [0]]), [[3], [2], [1], [0]])

@check("uses the nearest of several zeros")
def _():
    grid = [[0, 1, 1, 1, 0],
            [1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1]]
    eq(distance_to_nearest_zero(grid), [[0, 1, 2, 1, 0], [1, 2, 3, 2, 1], [2, 3, 4, 3, 2]])

@check("does not modify the input and returns new rows")
def _():
    grid = [[1, 0], [1, 1]]
    result = distance_to_nearest_zero(grid)
    eq(grid, [[1, 0], [1, 1]])
    eq(result, [[1, 0], [2, 1]])
    eq(result is grid or result[0] is grid[0], False)

@check("a 301 x 301 grid with one zero in the corner is fast")
def _():
    n = 301
    grid = [[1] * n for _ in range(n)]
    grid[0][0] = 0
    result = distance_to_nearest_zero(grid)
    eq(result[0][0], 0)
    eq(result[n - 1][n - 1], 2 * (n - 1))
    eq(result[100][250], 350)
    eq(result[n - 1][0], n - 1)

@check("a 301 x 301 grid with 961 scattered zeros is fast")
def _():
    n = 301
    grid = [[0 if r % 10 == 0 and c % 10 == 0 else 1 for c in range(n)] for r in range(n)]
    result = distance_to_nearest_zero(grid)
    for r, c in ((0, 0), (5, 5), (7, 3), (123, 289), (300, 299), (299, 1)):
        expected = min(r % 10, 10 - r % 10) + min(c % 10, 10 - c % 10)
        eq(result[r][c], expected)
    eq(max(max(row) for row in result), 10)
`
      },
      practice: ["Graphs & Shortest Path"],
      source: "https://docs.python.org/3/library/collections.html#collections.deque"
    },
    {
      id: "topological-sort",
      title: "Topological sort",
      kind: "algorithm",
      summary: "Order the vertices of a directed graph so every edge points forward: prerequisites come before the things that need them. It exists exactly when the graph has no cycle, so the same algorithm also detects cycles.",
      concepts: [
        "A topological order lists every vertex so that for each edge u -> v, u appears before v. Think build steps, course prerequisites or spreadsheet formulas. It exists if and only if the directed graph has no cycle (it is a DAG), and usually many valid orders exist.",
        "Kahn's algorithm works like unlocking levels. Count each vertex's unplaced prerequisites (its in-degree). Place any vertex with in-degree 0, then decrement the in-degree of everything it points to; vertices that reach 0 become ready. If vertices remain but none is ready, they sit on or behind a cycle, so placing fewer vertices than exist is the cycle test.",
        "The DFS version records each vertex when it finishes, after everything reachable from it has finished; reversing that finish order gives a valid topological order. A cycle shows up as an edge into a vertex that is still on the current DFS path, so you need two states, on the path and finished, not a single visited flag.",
        "The order among equally ready vertices is your choice. Kahn with a FIFO queue releases vertices layer by layer; replacing the queue with a min-heap and always placing the smallest ready vertex gives the lexicographically smallest order, at O((V + E) log V). Picking the smallest available vertex at every position is optimal because it never blocks any later position.",
        "Python's standard library already has this: graphlib.TopologicalSorter (3.9+). Note that it takes the opposite orientation, mapping each node to its predecessors, and raises CycleError (a ValueError subclass) when no order exists."
      ],
      complexity: [
        { operation: "kahn_order / topological_order", time: "O(V + E)", note: "each vertex is placed once, each edge decrements one counter" },
        { operation: "dfs_order", time: "O(V + E)" },
        { operation: "smallest_order", time: "O((V + E) log V)", note: "heap push/pop per vertex" },
        { operation: "is_topological", time: "O(V + E)", note: "checks every edge once" }
      ],
      space: "O(V) beyond the input: the in-degree table and ready set (Kahn) or the state table and explicit stack (DFS).",
      code: py`
from __future__ import annotations

import heapq
from collections import deque
from collections.abc import Iterator, Mapping, Sequence
from graphlib import CycleError, TopologicalSorter

Graph = Mapping[str, Sequence[str]]  # task -> tasks that must come AFTER it


def _indegrees(graph: Graph) -> dict[str, int]:
    """Count the prerequisites of every vertex, including ones that only appear as targets."""
    indegree = {u: 0 for u in graph}
    for targets in graph.values():
        for v in targets:
            indegree[v] = indegree.get(v, 0) + 1
    return indegree


def kahn_order(graph: Graph) -> Iterator[str]:
    """Yield vertices so that every edge u -> v puts u first (Kahn's algorithm). O(V + E).

    Invariant: ready holds exactly the unplaced vertices whose prerequisites
    are all placed. If a cycle exists its vertices never become ready, so the
    generator simply stops early.
    """
    indegree = _indegrees(graph)
    ready = deque(v for v, count in indegree.items() if count == 0)
    while ready:
        u = ready.popleft()
        yield u
        for v in graph.get(u, ()):
            indegree[v] -= 1
            if indegree[v] == 0:
                ready.append(v)


def topological_order(graph: Graph) -> list[str]:
    """Return one valid order, or raise ValueError if the graph has a cycle."""
    order = list(kahn_order(graph))
    if len(order) != len(_indegrees(graph)):
        raise ValueError("graph has a cycle")
    return order


def smallest_order(graph: Graph) -> list[str]:
    """Return the lexicographically smallest valid order: always place the smallest ready vertex."""
    indegree = _indegrees(graph)
    ready = [v for v, count in indegree.items() if count == 0]
    heapq.heapify(ready)  # a min-heap instead of a FIFO queue
    order: list[str] = []
    while ready:
        u = heapq.heappop(ready)
        order.append(u)
        for v in graph.get(u, ()):
            indegree[v] -= 1
            if indegree[v] == 0:
                heapq.heappush(ready, v)
    if len(order) != len(indegree):
        raise ValueError("graph has a cycle")
    return order


def dfs_order(graph: Graph) -> list[str]:
    """Topological order from DFS: reverse the order in which vertices finish. ValueError on a cycle.

    state[v] is 1 while v is on the current DFS path and 2 once it is finished.
    An edge into a vertex that is still on the path closes a cycle.
    """
    state: dict[str, int] = {}
    finished: list[str] = []
    for root in _indegrees(graph):
        if root in state:
            continue
        state[root] = 1
        stack = [(root, iter(graph.get(root, ())))]
        while stack:
            u, targets = stack[-1]
            for v in targets:
                if v not in state:
                    state[v] = 1
                    stack.append((v, iter(graph.get(v, ()))))
                    break
                if state[v] == 1:
                    raise ValueError("graph has a cycle")
            else:
                state[u] = 2
                finished.append(u)
                stack.pop()
    finished.reverse()
    return finished


def is_topological(graph: Graph, order: Sequence[str]) -> bool:
    """Check the property itself: every edge goes from an earlier to a later position."""
    position = {v: i for i, v in enumerate(order)}
    return all(position[u] < position[v] for u, targets in graph.items() for v in targets)


if __name__ == "__main__":
    build = {"fetch": ["docs", "compile"], "compile": ["test", "package"],
             "docs": ["package"], "test": ["package"], "package": []}
    print(topological_order(build))
    print(smallest_order(build), is_topological(build, smallest_order(build)))
    print(dfs_order(build), is_topological(build, dfs_order(build)))

    loop = {"a": ["b"], "b": ["c"], "c": ["a"], "d": ["a"]}
    print(list(kahn_order(loop)))
    for solver in (topological_order, dfs_order):
        try:
            solver(loop)
        except ValueError as error:
            print(f"{solver.__name__}: {error}")

    # graphlib wants the opposite direction: node -> its PREREQUISITES.
    prerequisites = {"compile": ["fetch"], "docs": ["fetch"], "test": ["compile"],
                     "package": ["compile", "docs", "test"]}
    print(is_topological(build, list(TopologicalSorter(prerequisites).static_order())))
    try:
        list(TopologicalSorter({"a": ["b"], "b": ["a"]}).static_order())
    except CycleError as error:
        print("graphlib:", type(error).__name__)
`,
      output: `['fetch', 'docs', 'compile', 'test', 'package']
['fetch', 'compile', 'docs', 'test', 'package'] True
['fetch', 'compile', 'test', 'docs', 'package'] True
['d']
topological_order: graph has a cycle
dfs_order: graph has a cycle
True
graphlib: CycleError`,
      bestPractices: [
        "Split the mechanism from the policy. kahn_order is a generator that simply stops when a cycle blocks it, and topological_order decides that a short result is an error by comparing the count and raising ValueError. A partial order is never returned silently.",
        "Count in-degrees with `indegree.get(v, 0) + 1` and read adjacency with `graph.get(u, ())`. Vertices that only appear as targets (sinks) then need no empty entry in the input, and none is missed.",
        "Swap the container, keep the algorithm: replacing the deque with a heapq min-heap turns Kahn's algorithm into the lexicographically smallest order. Two lines change, and the cost becomes O((V + E) log V).",
        "Track DFS state with two values (on the path = 1, finished = 2) in a dict whose missing keys mean unvisited. That is what lets the iterative DFS tell a harmless revisit of a finished vertex from a real cycle.",
        "Test the property, not a literal order. is_topological checks that every edge goes forward, which is correct for every valid answer; comparing to one hard-coded list breaks whenever tie-breaking changes.",
        "In real code use graphlib.TopologicalSorter, and remember its input is node -> predecessors, the reverse orientation of the graphs above."
      ],
      pitfalls: [
        "Returning whatever Kahn's algorithm produced without comparing its length to the vertex count. On a cyclic graph that is a short, wrong list that looks valid.",
        "Using one visited set for DFS cycle detection. In the diamond a -> b, a -> c, b -> d, c -> d, vertex d is reached twice but there is no cycle; only an edge into a vertex still on the current path is a cycle.",
        "Mixing up edge direction. A course list entry [a, b] usually means b must come BEFORE a, so the edge is b -> a, and graphlib expects predecessors. Reversed edges give a reversed order.",
        "Expecting FIFO Kahn to be smallest-first. With edges 1 -> 2 and an independent vertex 5, the queue yields 1, 5, 2, but the smallest valid order is 1, 2, 5. Use a heap.",
        "Treating a BFS or DFS visit order as a topological order. Preorder does not respect edges that arrive from a different branch; only finish order (reversed) or in-degree counting does."
      ],
      useWhen: [
        "Tasks, packages or courses with prerequisites: find an order that respects every dependency, or report that none exists.",
        "\"Is there a cycle in this directed graph?\" or \"can all of these be completed?\": Kahn's count check answers it.",
        "Dynamic programming over a DAG (longest or shortest path, counting paths): process vertices in topological order so dependencies are ready.",
        "A deterministic or lexicographically smallest schedule is required: Kahn with a min-heap."
      ],
      inPractice: "Use graphlib.TopologicalSorter from the standard library (Python 3.9+): TopologicalSorter(graph).static_order() yields a valid order, raises CycleError on a cycle (the cycle is in error.args[1]), and its prepare / get_ready / done methods let you run independent tasks in parallel as dependencies finish. Hand-roll Kahn's algorithm when you need a specific tie-break such as smallest first, or when the problem gives edges in the other orientation.",
      challenge: {
        prompt: "Write find_order(num_courses, prerequisites). Courses are numbered 0..num_courses-1 (num_courses >= 1). Each prerequisites entry is [course, prereq]: prereq must be taken before course. Duplicate entries may appear. Return a list of all courses in an order that respects every prerequisite. If several orders exist, return the lexicographically smallest one (compare the lists element by element). If no order exists because of a cycle, including a course that requires itself, return an empty list. The checks use 100,000 courses, so it must run in O((V + E) log V).",
        hint: "Use Kahn's algorithm with a min-heap of ready courses. Build after[prereq] = [courses that need it] and an indegree count per course (counting duplicates both times, so they cancel out). Pop the smallest ready course, append it, and push any course whose indegree drops to 0. If you placed fewer than num_courses courses, return [].",
        starter: py`
def find_order(num_courses, prerequisites):
    """Return the lexicographically smallest valid course order, or [] if there is a cycle."""
    # TODO: Kahn's algorithm, but pop the smallest ready course each time.
    raise NotImplementedError
`,
        solution: py`
import heapq


def find_order(num_courses, prerequisites):
    """Return the lexicographically smallest valid course order, or [] if there is a cycle."""
    after = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses
    for course, prereq in prerequisites:
        after[prereq].append(course)
        indegree[course] += 1
    ready = [c for c in range(num_courses) if indegree[c] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        course = heapq.heappop(ready)
        order.append(course)
        for nxt in after[course]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                heapq.heappush(ready, nxt)
    return order if len(order) == num_courses else []
`,
        tests: py`
@check("orders a small diamond")
def _():
    eq(find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]), [0, 1, 2, 3])

@check("returns the lexicographically smallest valid order")
def _():
    eq(find_order(4, [[0, 3]]), [1, 2, 3, 0])
    eq(find_order(5, [[1, 4], [2, 4], [0, 2]]), [3, 4, 1, 2, 0])
    eq(find_order(3, []), [0, 1, 2])
    eq(find_order(1, []), [0])

@check("returns [] on a cycle, even when other courses are free")
def _():
    eq(find_order(2, [[0, 1], [1, 0]]), [])
    eq(find_order(4, [[1, 2], [2, 1]]), [])
    eq(find_order(3, [[0, 1], [1, 2], [2, 0]]), [])
    eq(find_order(1, [[0, 0]]), [])

@check("duplicate prerequisites do not break the count")
def _():
    eq(find_order(2, [[1, 0], [1, 0], [1, 0]]), [0, 1])
    eq(find_order(3, [[2, 0], [2, 1], [2, 1], [1, 0]]), [0, 1, 2])

@check("a long chain and a 100,000-way fan-out are fast")
def _():
    n = 100_000
    chain = [[i, i - 1] for i in range(n - 1, 0, -1)]
    eq(find_order(n, chain), list(range(n)))
    fan = [[i, n - 1] for i in range(n - 1)]
    order = find_order(n, fan)
    eq(order[:3], [n - 1, 0, 1])
    eq(order[-1], n - 2)
    eq(len(order), n)
`
      },
      practice: ["Graphs & Shortest Path", "Advanced Graphs"],
      source: "https://docs.python.org/3/library/graphlib.html"
    },
    {
      id: "dijkstra",
      title: "Dijkstra's shortest paths",
      kind: "algorithm",
      summary: "Find the cheapest route from one source to every other vertex when edges have non-negative weights. It is BFS with a priority queue: always expand the closest unfinished vertex, and its distance is final.",
      concepts: [
        "Dijkstra's algorithm grows a region of finished vertices outward from the source. Keep a min-heap of (distance, vertex). Pop the closest entry, then relax its outgoing edges: if going through this vertex gives a neighbour a shorter route than any known so far, record the new distance and push it. It is BFS where the plain queue becomes a priority queue because edges cost different amounts.",
        "Why a popped distance is final: any other route to that vertex has to leave the finished region through a vertex still in the heap, whose distance is at least as large, and adding more non-negative edges can never make a route shorter. With a negative edge this argument fails, because a longer-looking route could later dip below the value you finalized. That is why Dijkstra requires weights >= 0.",
        "heapq has no decrease-key operation, so use lazy deletion. When a shorter route to v is found, push a new entry and leave the old one in the heap. When an entry is popped with d > dist[u], it is stale (a better route was already processed), so skip it. The heap never holds more than E + 1 entries, so each operation is O(log E) = O(log V), giving O((V + E) log V) overall.",
        "To get the route, not just the cost, record parent[v] = u whenever dist[v] improves. Follow parents from the target back to the source and reverse the list. Vertices that are never reached are simply absent from dist, which makes unreachable targets easy to detect.",
        "Special cases are cheaper. When every edge costs the same, plain BFS works. When every weight is 0 or 1, a deque replaces the heap: a 0-weight edge pushes the neighbour on the front (same distance) and a 1-weight edge pushes it on the back, which keeps the deque sorted by distance in O(V + E). To reach only one target, stop as soon as it is popped."
      ],
      complexity: [
        { operation: "dijkstra (binary heap, lazy deletion)", time: "O((V + E) log V)", note: "at most E + 1 pushes and pops, each O(log E) = O(log V)" },
        { operation: "shortest_path", time: "O((V + E) log V)", note: "plus O(path length) to rebuild the route" },
        { operation: "zero_one_bfs", time: "O(V + E)", note: "deque instead of a heap" },
        { operation: "array-scan Dijkstra (no heap)", time: "O(V^2)", note: "competitive only on dense graphs" }
      ],
      space: "O(V + E): dist and parent hold O(V) entries, and with lazy deletion the heap can hold up to E + 1.",
      code: py`
from __future__ import annotations

import heapq
from collections import deque
from collections.abc import Mapping, Sequence
from math import inf

Graph = Mapping[int, Sequence[tuple[int, int]]]  # u -> [(v, weight), ...]


def dijkstra(graph: Graph, source: int) -> tuple[dict[int, int], dict[int, int]]:
    """Return (dist, parent) for every vertex reachable from source. Weights must be >= 0.

    Invariant: when an entry (d, u) is popped with d == dist[u], d is final:
    any other route to u passes through a vertex still in the heap with
    distance >= d, and non-negative weights only add to it. Unreachable
    vertices are absent from dist. O((V + E) log V).
    """
    dist = {source: 0}
    parent: dict[int, int] = {}
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue  # stale entry: a shorter route to u was already processed
        for v, weight in graph.get(u, ()):
            if weight < 0:
                raise ValueError(f"negative weight on edge {u} -> {v}")
            new_d = d + weight
            if new_d < dist.get(v, inf):
                dist[v] = new_d
                parent[v] = u
                heapq.heappush(heap, (new_d, v))  # lazy: the old entry for v stays
    return dist, parent


def shortest_path(graph: Graph, source: int, target: int) -> tuple[int, list[int]] | None:
    """Return (distance, vertices along a cheapest path), or None if target is unreachable."""
    dist, parent = dijkstra(graph, source)
    if target not in dist:
        return None
    path = [target]
    while path[-1] != source:
        path.append(parent[path[-1]])
    path.reverse()
    return dist[target], path


def zero_one_bfs(graph: Graph, source: int) -> dict[int, int]:
    """Shortest distances when every weight is 0 or 1: O(V + E), no heap needed.

    The deque stays ordered by distance: a 0-edge goes to the FRONT (same
    distance as the current vertex), a 1-edge to the BACK (one more).
    """
    dist = {source: 0}
    queue = deque([source])
    while queue:
        u = queue.popleft()
        for v, weight in graph.get(u, ()):
            new_d = dist[u] + weight
            if new_d < dist.get(v, inf):
                dist[v] = new_d
                if weight == 0:
                    queue.appendleft(v)
                else:
                    queue.append(v)
    return dist


if __name__ == "__main__":
    roads = {0: [(1, 4), (2, 1)], 1: [(3, 1)], 2: [(1, 2), (3, 5)], 3: [], 4: [(0, 1)]}
    dist, parent = dijkstra(roads, 0)
    print(sorted(dist.items()))
    print(shortest_path(roads, 0, 3), shortest_path(roads, 0, 4))
    print(parent)

    bad = {0: [(1, 1), (2, 2)], 1: [], 2: [(1, -5)]}
    try:
        dijkstra(bad, 0)
    except ValueError as error:
        print("ValueError:", error)

    flips = {0: [(1, 1), (2, 0)], 1: [(3, 0)], 2: [(3, 1)], 3: []}
    print(sorted(zero_one_bfs(flips, 0).items()), zero_one_bfs(flips, 0) == dijkstra(flips, 0)[0])
`,
      output: `[(0, 0), (1, 3), (2, 1), (3, 4)]
(4, [0, 2, 1, 3]) None
{1: 2, 2: 0, 3: 1}
ValueError: negative weight on edge 2 -> 1
[(0, 0), (1, 1), (2, 0), (3, 1)] True`,
      bestPractices: [
        "Push (distance, vertex) tuples onto a heapq list. Tuples compare element by element, so the smallest distance pops first, and heapq stays a plain list with no wrapper class.",
        "Use lazy deletion: `if d > dist[u]: continue` skips stale entries. Searching for and removing an old entry from the middle of a heap would cost O(n), and the check costs O(1).",
        "Read distances with dist.get(v, inf) from math. No table pre-filled with infinity is needed, and unreachable vertices stay absent, so `target not in dist` answers reachability.",
        "Validate the precondition and fail loudly: raising ValueError on a negative weight is better than returning plausible but wrong distances.",
        "Return (dist, parent) from one function and rebuild routes in a separate shortest_path. A single run then answers every target, and the path-building loop is easy to test alone.",
        "Reach for a deque when weights are 0 or 1. appendleft and append are both O(1), so zero_one_bfs removes the heap and its log factor entirely."
      ],
      pitfalls: [
        "Feeding Dijkstra negative weights. In 0 -> 1 (cost 1), 0 -> 2 (cost 2), 2 -> 1 (cost -5), vertex 1 is finalized at 1 even though the true distance is -3. Versions that re-relax finished vertices avoid that but can be exponentially slow and loop forever on a negative cycle. Check weights, or use Bellman-Ford.",
        "Marking a vertex as visited when it is first pushed, as BFS does. The first route found is not necessarily the cheapest; a vertex is final only when it is popped.",
        "Forgetting the stale-entry check. The result stays correct, but every outdated entry re-scans the neighbours of its vertex, which can turn O(E log V) into something close to O(V * E) on dense or adversarial graphs.",
        "Using vertices that cannot be ordered. When two heap entries tie on distance, Python compares the vertices, and unorderable objects raise TypeError. Add a counter as a tie-breaker, (distance, counter, vertex), or use integer ids."
      ],
      useWhen: [
        "The cheapest or fastest route with non-negative costs: road networks, network latency, minimum total fees, signal propagation time.",
        "Any search over states with different step costs, where the 'graph' is implicit, such as the cheapest sequence of moves in a puzzle.",
        "Weights are only 0 and 1 (number of walls broken, number of flips): 0-1 BFS. All weights equal: plain BFS.",
        "Negative edges call for Bellman-Ford; distances between every pair of vertices on a small graph call for Floyd-Warshall (both in the next lesson)."
      ],
      inPractice: "The standard library supplies the priority queue (heapq; its documentation describes this lazy-deletion pattern) but no shortest-path routine. With third-party code use networkx.dijkstra_path or scipy.sparse.csgraph.dijkstra. In interviews, and whenever the graph is implicit or the state needs extra fields, write the short heap loop yourself.",
      challenge: {
        prompt: "Write network_delay_time(times, n, k). A signal is sent from node k at time 0. Nodes are labelled 1..n (n >= 1). Each entry of times is [u, v, w]: a directed link from u to v that takes w time units (w is an integer >= 0); several links may connect the same pair. Return the time at which every node has received the signal, which is the largest shortest-path distance from k, or -1 if some node is unreachable. The checks use a graph with 20,000 nodes and about 100,000 links, so use a heap: scanning every node for the closest one each time (O(V^2)) or repeating Bellman-Ford rounds will time out.",
        hint: "Build a dict from each node to its list of (neighbour, weight) pairs, then run Dijkstra from k with heapq and lazy deletion (skip an entry when d > dist[u]). The answer is max(dist.values()) when dist has n entries, otherwise -1.",
        starter: py`
def network_delay_time(times, n, k):
    """Return the time for a signal from k to reach all n nodes, or -1."""
    # TODO: build adjacency lists, then run Dijkstra from k with heapq.
    raise NotImplementedError
`,
        solution: py`
import heapq


def network_delay_time(times, n, k):
    """Return the time for a signal from k to reach all n nodes, or -1."""
    graph = {}
    for u, v, w in times:
        graph.setdefault(u, []).append((v, w))
    dist = {k: 0}
    heap = [(0, k)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue  # stale entry
        for v, w in graph.get(u, ()):
            new_d = d + w
            if new_d < dist.get(v, float("inf")):
                dist[v] = new_d
                heapq.heappush(heap, (new_d, v))
    return max(dist.values()) if len(dist) == n else -1
`,
        tests: py`
@check("the classic example")
def _():
    eq(network_delay_time([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2), 2)

@check("a cheaper route with more links beats a direct expensive link")
def _():
    times = [[1, 2, 10], [1, 3, 1], [3, 2, 1], [2, 4, 1]]
    eq(network_delay_time(times, 4, 1), 3)

@check("returns -1 when a node cannot be reached, and respects link direction")
def _():
    eq(network_delay_time([[1, 2, 1]], 2, 1), 1)
    eq(network_delay_time([[1, 2, 1]], 2, 2), -1)
    eq(network_delay_time([[1, 2, 1], [3, 2, 1]], 3, 1), -1)

@check("a single node, zero-weight links and parallel links")
def _():
    eq(network_delay_time([], 1, 1), 0)
    eq(network_delay_time([[1, 2, 0], [2, 3, 0]], 3, 1), 0)
    eq(network_delay_time([[1, 2, 5], [1, 2, 2], [2, 3, 4]], 3, 1), 6)

@check("20,000 nodes and 100,000 links finish quickly")
def _():
    n = 20_000
    times = [[i, i + 1, 2] for i in range(n - 1, 0, -1)]
    x = 12345
    for _ in range(80_000):
        x = (x * 1103515245 + 12345) % 2**31
        i = 1 + x % (n - 2)
        x = (x * 1103515245 + 12345) % 2**31
        j = i + 1 + x % min(500, n - i)
        times.append([i, j, 2 * (j - i) + 1])
    eq(network_delay_time(times, n, 1), 2 * (n - 1))
    eq(network_delay_time(times, n, n // 2), -1)
`
      },
      practice: ["Graphs & Shortest Path", "Advanced Graphs", "Heaps & Priority Queues"],
      source: "https://docs.python.org/3/library/heapq.html#priority-queue-implementation-notes"
    },
    {
      id: "bellman-ford-floyd-warshall",
      title: "Bellman-Ford & Floyd-Warshall",
      kind: "algorithm",
      summary: "Two shortest-path algorithms for the cases Dijkstra cannot handle. Bellman-Ford allows negative edge weights from one source and detects negative cycles; Floyd-Warshall finds the distance between every pair of vertices.",
      concepts: [
        "Relaxing an edge u -> v means checking whether dist[u] + weight is smaller than dist[v] and, if so, updating dist[v]. Bellman-Ford simply relaxes every edge, in any order, and repeats. After round k every shortest path that uses at most k edges is correct, and a shortest path without a cycle has at most V - 1 edges, so V - 1 rounds are enough. There is no heap and no ordering assumption, so negative weights are fine.",
        "A negative cycle is a cycle whose weights add up to less than zero: walking it again and again makes any route cheaper without limit, so shortest paths through it are undefined. If an edge can still be relaxed after V - 1 rounds, a negative cycle is reachable from the source. Bellman-Ford only sees cycles it can reach; one in an unreachable part of the graph leaves dist at infinity and goes unnoticed. In an undirected graph a negative edge is already a negative cycle (u -> v -> u).",
        "Floyd-Warshall is dynamic programming over which vertices may be used as intermediate stops. Let d[i][j] be the best cost using only vertices 0..k as stops; allowing vertex k as well gives min(d[i][j], d[i][k] + d[k][j]). The loop over k must be the OUTERMOST loop: each pass of k completes the 'allowed stops' set before moving on. The result is a V x V table in O(V^3) time and O(V^2) space.",
        "Both detect negative cycles. In Floyd-Warshall, any vertex whose distance to itself ends below zero lies on a negative cycle, and unlike Bellman-Ford it notices cycles anywhere in the graph, not just reachable ones.",
        "Choosing: non-negative weights from one source, use Dijkstra. Negative weights from one source, use Bellman-Ford at O(V * E). Every pair on a small or dense graph, use Floyd-Warshall. Every pair on a sparse graph with non-negative weights, run Dijkstra from each vertex; with negative weights that need Johnson's algorithm, which combines Bellman-Ford and Dijkstra."
      ],
      complexity: [
        { operation: "bellman_ford", time: "O(V * E) worst case", note: "stops early after any round that changes nothing" },
        { operation: "negative-cycle check", time: "O(E)", note: "one extra pass over the edges" },
        { operation: "floyd_warshall", time: "O(V^3)", note: "three nested loops over the vertices" },
        { operation: "single path query after Floyd-Warshall", time: "O(1)", note: "a table lookup" }
      ],
      space: "O(V) for Bellman-Ford (one distance list). O(V^2) for Floyd-Warshall (the distance matrix, updated in place).",
      code: py`
from __future__ import annotations

from collections.abc import Sequence
from math import inf

Edge = tuple[int, int, float]  # (u, v, weight): a directed edge u -> v


def bellman_ford(n: int, edges: Sequence[Edge], source: int) -> list[float] | None:
    """Return the shortest distance from source to every vertex (inf if unreachable).

    Weights may be negative. Returns None when a negative cycle is reachable from source.

    Invariant: after round k, dist[v] is at most the cost of the cheapest path
    to v that uses k edges or fewer. A shortest path has at most n - 1 edges,
    so n - 1 rounds suffice; a further improvement proves a negative cycle.
    O(V * E) time, O(V) space.
    """
    dist = [inf] * n
    dist[source] = 0
    for _ in range(n - 1):
        changed = False
        for u, v, weight in edges:
            if dist[u] + weight < dist[v]:  # inf + weight stays inf: unreached u never relaxes
                dist[v] = dist[u] + weight
                changed = True
        if not changed:
            return dist  # nothing moved, so nothing ever will
    if any(dist[u] + weight < dist[v] for u, v, weight in edges):
        return None  # still improving after n - 1 rounds: a negative cycle
    return dist


def floyd_warshall(n: int, edges: Sequence[Edge]) -> list[list[float]] | None:
    """Return the matrix of shortest distances between every pair (inf if no path).

    Returns None when the graph has a negative cycle anywhere. O(V^3) time, O(V^2) space.

    Invariant: after the pass for k, dist[i][j] is the cheapest cost from i
    to j using only vertices 0..k as intermediate stops.
    """
    dist = [[inf] * n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for u, v, weight in edges:
        dist[u][v] = min(dist[u][v], weight)  # keep the lightest of parallel edges
    for k in range(n):  # the intermediate vertex must be the OUTERMOST loop
        row_k = dist[k]
        for i in range(n):
            via = dist[i][k]
            if via == inf:
                continue  # i cannot reach k, so k helps no route from i
            row_i = dist[i]
            for j in range(n):
                if via + row_k[j] < row_i[j]:
                    row_i[j] = via + row_k[j]
    if any(dist[i][i] < 0 for i in range(n)):
        return None  # a vertex can reach itself at negative cost
    return dist


if __name__ == "__main__":
    edges = [(0, 1, 4), (0, 2, 5), (1, 2, -3), (2, 3, 2), (3, 1, 2), (4, 3, 1)]
    print(bellman_ford(5, edges, 0))
    print(bellman_ford(5, edges + [(3, 1, -4)], 0))

    far = [(0, 1, 1), (2, 3, -1), (3, 2, -1)]  # the negative cycle 2 <-> 3 cannot be reached from 0
    print(bellman_ford(4, far, 0), floyd_warshall(4, far))

    table = floyd_warshall(4, edges[:5])
    assert table is not None
    for row in table:
        print(row)
    print(table[0][3] == bellman_ford(4, edges[:5], 0)[3])
`,
      output: `[0, 4, 1, 3, inf]
None
[0, 1, inf, inf] None
[0, 4, 1, 3]
[inf, 0, -3, -1]
[inf, 4, 0, 2]
[inf, 2, -1, 0]
True`,
      bestPractices: [
        "Use math.inf as the 'unreachable' value. inf + weight is still inf and compares correctly, so the relax test `dist[u] + weight < dist[v]` needs no special case for vertices that have not been reached yet.",
        "Stop a Bellman-Ford round loop as soon as a full round changes nothing. The worst case stays O(V * E), but most graphs converge in a few rounds.",
        "Test for the negative cycle with any(...) over a generator. It stops at the first edge that can still be relaxed and avoids building a list.",
        "Signal 'no answer exists' with one documented value or exception. Here bellman_ford and floyd_warshall return None, which can never be confused with a valid distance list, and the type hint `list[float] | None` makes callers handle it.",
        "Hoist loop-invariant lookups in Floyd-Warshall: row_k and row_i are bound once outside the inner loop, and `via == inf` skips the whole j loop when i cannot reach k. The triple loop is the hot path, so these cheap changes matter.",
        "Build the matrix with a list comprehension and keep the lightest parallel edge with min(). Update the table in place: during pass k, row k and column k do not change (dist[k][k] stays 0 unless there is a negative cycle), so no copy of the matrix is needed."
      ],
      pitfalls: [
        "Putting k anywhere but the outermost loop of Floyd-Warshall. With loops ordered i, j, k the code runs without error but misses routes: for the edges 0 -> 1, 1 -> 3 and 3 -> 2 (each cost 1) it leaves dist[0][2] at infinity instead of 3.",
        "Treating an undirected graph's negative edge as one directed edge. Undirected means u -> v and v -> u, so a single negative edge is a negative cycle; shortest paths are undefined, and these algorithms (or Dijkstra) will not give a meaningful answer.",
        "Assuming Bellman-Ford proves the whole graph has no negative cycle. It only reports cycles reachable from the source; for 'is there a negative cycle anywhere', start every vertex at distance 0 or use Floyd-Warshall.",
        "Using Floyd-Warshall on large graphs in pure Python. V = 200 is 8 million inner steps, but V = 2,000 is 8 billion and a 2,000 x 2,000 table of floats. Beyond a few hundred vertices, run Dijkstra from each source (non-negative weights) or use a numeric library."
      ],
      useWhen: [
        "Edge weights can be negative (refunds, discounts, energy gains) and you need distances from one source: Bellman-Ford.",
        "The question is whether a negative cycle (an arbitrage, an infinitely improving loop) exists: Bellman-Ford or Floyd-Warshall.",
        "A route may use at most k edges or stops: run exactly k rounds of Bellman-Ford, updating from a copy of the previous round.",
        "You need the distance between many or all pairs on a small, dense graph, or the transitive closure of a relation: Floyd-Warshall."
      ],
      inPractice: "The standard library has neither. For real work use networkx (bellman_ford_path, floyd_warshall) or scipy.sparse.csgraph (bellman_ford, floyd_warshall, johnson), which run in compiled code. Hand-roll Bellman-Ford when you need its per-round behaviour (a hop limit, a custom relax rule) and Floyd-Warshall when the graph is small enough that a 10-line triple loop is clearer than a dependency.",
      challenge: {
        prompt: "Write has_negative_cycle(n, edges). The graph is directed with vertices 0..n-1 (n >= 1). Each entry of edges is [u, v, w], a directed edge u -> v with integer weight w (negative weights allowed; u == v is a self-loop). Return True if the graph contains a cycle whose total weight is strictly less than zero ANYWHERE in the graph (a zero-weight cycle does not count), otherwise False. The checks include a graph with 1,000 vertices, so running a separate search from every vertex (or Floyd-Warshall) is too slow: aim for O(V * E).",
        hint: "Run Bellman-Ford once, but start EVERY vertex at distance 0 instead of just one source (as if a hidden source reached every vertex for free). Do at most n rounds of relaxing all edges. If a round changes nothing, return False. If the n-th round still changes something, a negative cycle exists, so return True.",
        starter: py`
def has_negative_cycle(n, edges):
    """Return True if the directed graph has a cycle with negative total weight."""
    # TODO: Bellman-Ford with every vertex starting at distance 0.
    raise NotImplementedError
`,
        solution: py`
def has_negative_cycle(n, edges):
    """Return True if the directed graph has a cycle with negative total weight."""
    dist = [0] * n  # as if a hidden source reached every vertex for free
    for _ in range(n):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            return False
    return True  # still improving in round n: some cycle keeps getting cheaper
`,
        tests: py`
@check("finds a negative triangle and ignores a zero-weight one")
def _():
    eq(has_negative_cycle(3, [[0, 1, 1], [1, 2, -3], [2, 0, 1]]), True)
    eq(has_negative_cycle(3, [[0, 1, 1], [1, 2, -2], [2, 0, 1]]), False)

@check("negative edges without a cycle are fine")
def _():
    eq(has_negative_cycle(4, [[0, 1, -5], [1, 2, -5], [0, 2, -1], [2, 3, -100]]), False)
    eq(has_negative_cycle(3, [[0, 1, -1], [1, 2, -1], [0, 2, 5]]), False)
    eq(has_negative_cycle(2, [[0, 1, -4]]), False)

@check("self-loops and a single vertex")
def _():
    eq(has_negative_cycle(1, []), False)
    eq(has_negative_cycle(1, [[0, 0, -1]]), True)
    eq(has_negative_cycle(1, [[0, 0, 0]]), False)
    eq(has_negative_cycle(2, [[0, 0, 3], [0, 1, 1]]), False)

@check("a negative cycle in a part of the graph vertex 0 cannot reach")
def _():
    eq(has_negative_cycle(4, [[0, 1, 1], [2, 3, -1], [3, 2, -1]]), True)
    eq(has_negative_cycle(5, [[0, 1, 1], [1, 0, 1], [3, 4, -2], [4, 3, 2]]), False)
    eq(has_negative_cycle(4, [[3, 2, -2], [2, 1, -2], [1, 3, 3]]), True)

@check("a chain of 1,000 vertices closed by a heavier or lighter edge")
def _():
    n = 1_000
    chain = [[i, i + 1, -1] for i in reversed(range(n - 1))]
    eq(has_negative_cycle(n, chain), False)
    eq(has_negative_cycle(n, chain + [[n - 1, 0, n - 1]]), False)
    eq(has_negative_cycle(n, chain + [[n - 1, 0, n - 2]]), True)
`
      },
      practice: ["Advanced Graphs", "Graphs & Shortest Path"],
      source: "https://cp-algorithms.com/graph/bellman_ford.html"
    },
    {
      id: "union-find",
      title: "Union-find (disjoint sets)",
      kind: "structure",
      summary: "Keeps track of which items belong to the same group while groups merge. union and find run in near-constant amortized time, so it answers \"are these connected?\" as edges arrive and powers Kruskal's algorithm.",
      concepts: [
        "Each set is stored as a tree in which every element points to a parent. The root points to itself and is the set's representative. find(x) follows parents up to the root, and two elements are in the same set exactly when their roots match. union links one root underneath the other, which merges two whole trees by changing a single pointer.",
        "Two tricks keep the trees almost flat. Union by size attaches the smaller tree under the larger root, so an element's depth grows by one only when the size of its set at least doubles, which keeps every depth at O(log n). Path compression repoints every node visited by find straight at the root, so the next find from any of them takes a single step.",
        "With both tricks, a sequence of m operations on n elements costs O(m * alpha(n)) in total, where alpha is the inverse Ackermann function. It grows so slowly that it is at most 4 for any n you could ever store, so the cost is effectively constant but not literally constant, and it is an amortized bound: one find can still walk O(log n) nodes. Either trick alone gives O(log n).",
        "union returns a bool: True when it merged two different sets, False when the items were already together. That one answer is a cycle test for undirected edges (an edge whose ends are already connected closes a cycle), it is how Kruskal's algorithm decides to keep an edge, and counting the True results tells you how many sets are left.",
        "Union-find only merges; it cannot split a set or remove an element. Its strength is incremental connectivity: after each new edge it tells you the connectivity instantly, where a BFS would have to start over. Extra facts (size, sum, minimum) can be stored at the root and combined in union."
      ],
      complexity: [
        { operation: "find / connected", time: "O(alpha(n)) amortized", note: "inverse Ackermann; at most 4 for any practical n" },
        { operation: "union", time: "O(alpha(n)) amortized", note: "two finds plus one pointer change" },
        { operation: "add / len / size_of", time: "O(1) / O(1) / O(alpha(n))" },
        { operation: "iterate over sets", time: "O(n * alpha(n))", note: "one find per element" },
        { operation: "build from n items", time: "O(n)" }
      ],
      space: "O(n): a parent entry and a size entry per element, plus a counter. No recursion, so no stack space.",
      code: py`
from __future__ import annotations

from collections.abc import Hashable, Iterable, Iterator
from typing import Generic, TypeVar

T = TypeVar("T", bound=Hashable)


class UnionFind(Generic[T]):
    """Disjoint sets with union by size and path compression.

    Invariant: _parent[x] == x exactly when x is the representative (root) of
    its set, following parents from any element always reaches that root, and
    _size[root] is the number of elements in the set. find and union cost
    O(alpha(n)) amortized, where alpha is the inverse Ackermann function.
    """

    __slots__ = ("_parent", "_size", "_count")

    def __init__(self, items: Iterable[T] = ()) -> None:
        self._parent: dict[T, T] = {}
        self._size: dict[T, int] = {}  # kept for roots only
        self._count = 0  # number of sets
        for item in items:
            self.add(item)

    def add(self, item: T) -> bool:
        """Make item a singleton set. Return False (changing nothing) if it is already present."""
        if item in self._parent:
            return False
        self._parent[item] = item
        self._size[item] = 1
        self._count += 1
        return True

    def find(self, item: T) -> T:
        """Return the representative of item's set (KeyError if item is unknown)."""
        if item not in self._parent:
            raise KeyError(f"{item!r} is not in the union-find")
        root = item
        while self._parent[root] != root:
            root = self._parent[root]
        while item != root:  # path compression: point every node on the path at the root
            parent = self._parent[item]
            self._parent[item] = root
            item = parent
        return root

    def union(self, a: T, b: T) -> bool:
        """Merge the sets of a and b. Return True if they were separate, False if already together."""
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False
        if self._size[root_a] < self._size[root_b]:
            root_a, root_b = root_b, root_a  # hang the smaller tree under the larger
        self._parent[root_b] = root_a
        self._size[root_a] += self._size.pop(root_b)
        self._count -= 1
        return True

    def connected(self, a: T, b: T) -> bool:
        return self.find(a) == self.find(b)

    def size_of(self, item: T) -> int:
        """Return the number of elements in item's set."""
        return self._size[self.find(item)]

    def __len__(self) -> int:  # the number of SETS, not of elements
        return self._count

    def __contains__(self, item: object) -> bool:
        return item in self._parent

    def __iter__(self) -> Iterator[list[T]]:
        """Yield each set as a list, ordered by the first-added member of each set."""
        groups: dict[T, list[T]] = {}
        for item in self._parent:  # find() rewrites values, never keys: safe while iterating
            groups.setdefault(self.find(item), []).append(item)
        yield from groups.values()

    def __repr__(self) -> str:
        return f"UnionFind({list(self)!r})"


def first_redundant_edge(edges: Iterable[tuple[int, int]]) -> tuple[int, int] | None:
    """Return the first edge whose endpoints are already connected (it closes a cycle), or None."""
    sets: UnionFind[int] = UnionFind()
    for u, v in edges:
        sets.add(u)
        sets.add(v)
        if not sets.union(u, v):
            return u, v
    return None


if __name__ == "__main__":
    sets = UnionFind(range(6))
    print(sets, len(sets))
    print(sets.union(0, 1), sets.union(1, 2), sets.union(0, 2))
    print(sets.connected(0, 2), sets.connected(0, 3), sets.size_of(2))
    sets.union(4, 5)
    print(sets, len(sets), 3 in sets, 9 in sets)
    print(first_redundant_edge([(1, 2), (2, 3), (3, 4), (1, 4), (1, 5)]))
    try:
        sets.find(9)
    except KeyError as error:
        print("KeyError:", error)
`,
      output: `UnionFind([[0], [1], [2], [3], [4], [5]]) 6
True True False
True False 3
UnionFind([[0, 1, 2], [3], [4, 5]]) 3 True False
(1, 4)
KeyError: '9 is not in the union-find'`,
      bestPractices: [
        "Write find iteratively with two passes: the first finds the root, the second compresses the path. There is no recursion to overflow, and no third-party trick is needed to make it fast.",
        "Have union return a bool. One call merges and reports whether anything changed, so cycle detection, Kruskal and component counting need no separate (and doubly expensive) connected() call.",
        "Keep the number of sets in a counter that union decrements. len(sets) is then O(1), and bool(sets) is False only when there are no elements.",
        "Remove the absorbed root from _size with pop. Then _size holds exactly the roots, the invariant stated in the docstring, and a stale size can never be read by mistake.",
        "Make it generic over any hashable (Generic[T]), with a dict for parent and size. Strings, tuples and grid cells work directly; for dense integer ids 0..n-1 a plain list is faster (the MST lesson does that).",
        "Raise KeyError with a message for an unknown element, and make __iter__ a generator yielding one list per set, with __repr__ built on top of it."
      ],
      pitfalls: [
        "Comparing parents instead of roots. After union(0, 1) and union(1, 2), parent[0] and parent[2] can still differ even though the items are connected. Always compare find(a) == find(b).",
        "Linking elements instead of roots: `parent[a] = b` detaches a from its own set and leaves a's former members pointing at the old root. Link find(a) to find(b).",
        "Skipping both optimizations. With plain linking, the edges (0, 1), (0, 2), (0, 3), ... build one long chain, and without path compression every find(0) walks the whole chain, giving O(n^2) in total.",
        "Expecting to split a set or delete an element: it cannot. If edges are removed over time, process the operations in reverse order and turn each removal into a union."
      ],
      useWhen: [
        "Edges arrive one at a time and you must answer \"are a and b connected?\" or \"how many groups are there?\" after each one.",
        "Detecting a cycle in an undirected graph, finding the redundant edge, or building a minimum spanning tree with Kruskal's algorithm.",
        "Merging items into equivalence groups: accounts with a shared email, synonyms, friend circles, land cells that join into islands.",
        "Each group must carry an aggregate (size, total, smallest element): store it at the root and combine in union."
      ],
      inPractice: "The standard library has no union-find, and it is short enough to write yourself. networkx ships networkx.utils.UnionFind, and scipy.sparse.csgraph.connected_components labels components of a static graph in one call. If the whole graph is known up front, a single BFS or DFS answers connectivity; union-find wins when edges arrive over time or when you need Kruskal.",
      challenge: {
        prompt: "Write largest_component_sizes(n, edges). There are n vertices labelled 0..n-1 (n >= 1) that start with no edges. edges is a list of undirected pairs [u, v] that are added one at a time in the given order. Return a list with one number per edge: the size of the largest connected component right after that edge is added. Duplicate edges and self-loops are allowed and change nothing. With no edges, return []. The checks add 100,000 edges, so each edge must cost near-constant time: re-running a search or relabelling a component after every edge will time out.",
        hint: "Use a union-find with parent and size lists. For each edge, find both roots. If they differ, attach the smaller tree under the larger, add the sizes, and update a running maximum with the new size. Append the running maximum to the result after every edge, whether or not a merge happened.",
        starter: py`
def largest_component_sizes(n, edges):
    """Return the size of the largest component after each edge is added."""
    # TODO: union-find with sizes, and a running maximum.
    raise NotImplementedError
`,
        solution: py`
def largest_component_sizes(n, edges):
    """Return the size of the largest component after each edge is added."""
    parent = list(range(n))
    size = [1] * n

    def find(x):
        root = x
        while parent[root] != root:
            root = parent[root]
        while x != root:  # path compression: repoint the whole path at the root
            above = parent[x]
            parent[x] = root
            x = above
        return root

    largest = 1
    result = []
    for u, v in edges:
        root_u, root_v = find(u), find(v)
        if root_u != root_v:
            if size[root_u] < size[root_v]:
                root_u, root_v = root_v, root_u
            parent[root_v] = root_u
            size[root_u] += size[root_v]
            largest = max(largest, size[root_u])
        result.append(largest)
    return result
`,
        tests: py`
@check("tracks the largest component as groups merge")
def _():
    eq(largest_component_sizes(5, [[0, 1], [2, 3], [1, 2], [3, 4]]), [2, 2, 4, 5])
    eq(largest_component_sizes(6, [[0, 1], [1, 2], [3, 4], [5, 3]]), [2, 3, 3, 3])

@check("no edges, and a single vertex")
def _():
    eq(largest_component_sizes(4, []), [])
    eq(largest_component_sizes(1, [[0, 0]]), [1])

@check("duplicate edges and self-loops change nothing")
def _():
    edges = [[0, 1], [1, 0], [0, 1], [2, 2], [2, 3], [1, 2]]
    eq(largest_component_sizes(4, edges), [2, 2, 2, 2, 2, 4])

@check("edges that only join small groups do not lower the maximum")
def _():
    edges = [[0, 1], [0, 2], [0, 3], [4, 5], [6, 7], [4, 6]]
    eq(largest_component_sizes(8, edges), [2, 3, 4, 4, 4, 4])

@check("100,000 edges in a star, joined in either direction, stay fast")
def _():
    n = 100_001
    forward = largest_component_sizes(n, [[0, k] for k in range(1, n)])
    eq(forward[:3], [2, 3, 4])
    eq(forward[-1], n)
    eq(len(forward), n - 1)
    backward = largest_component_sizes(n, [[k, 0] for k in range(1, n)])
    eq(backward[-1], n)
    eq(backward[1000], 1002)
`
      },
      practice: ["Union Find", "Advanced Graphs"],
      source: "https://cp-algorithms.com/data_structures/disjoint_set_union.html"
    },
    // @@NEXT_LESSON@@
  ],
};
