import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const GRAPHS_GUIDES: Record<string, DsGuide> = {
  "graph-representation": {
    level: "Beginner",
    analogy: "A map of cities and roads. The cities are the dots (vertices) and the roads are the lines (edges). Some roads are one-way (directed), and some have a length (a weight). How you write the map down decides how fast you can answer 'which cities can I drive to from here?'",
    explain: [
      "A **graph** is a set of **vertices** (also called nodes) connected by **edges**. Social networks (people + friendships), maps (places + roads), the web (pages + links) and course prerequisites are all graphs. An edge can be **undirected** (a friendship goes both ways) or **directed** (a one-way street, or 'A must come before B'), and it can carry a **weight** such as a distance or a cost.",
      "The most common way to store a graph is an **adjacency list**: a dict that maps each vertex to the list of its neighbours. `graph['A'] = ['B', 'C']` means A connects to B and C. Listing a vertex's neighbours costs O(its number of neighbours), and the total memory is O(V + E), where V is the number of vertices and E the number of edges.",
      "An **adjacency matrix** is a V × V grid where `matrix[i][j] = 1` if there's an edge from i to j. Checking 'is there an edge i→j?' is O(1), but it always uses V² memory, even when the graph has few edges. It suits small or **dense** graphs.",
      "An **edge list** is just a list of `(u, v, weight)` tuples. It's the natural input format, and it's what Kruskal's algorithm sorts.",
      "Many interview graphs are never stored at all. In a **grid** (a maze, an image, a game board), each cell's neighbours are computed on the fly (up, down, left, right). That's called an **implicit graph**, and BFS and DFS work on it unchanged.",
    ],
    simpleCode: py`
# Three ways to write down the same graph, and when each one is handy.

edges = [("A", "B"), ("A", "C"), ("B", "C"), ("B", "D"), ("C", "E"), ("D", "E"), ("D", "F"), ("E", "F")]

# 1) Adjacency list: vertex -> list of neighbours. The default choice.
graph = {}
for u, v in edges:
    graph.setdefault(u, []).append(v)
    graph.setdefault(v, []).append(u)      # undirected: store the edge both ways
for vertex in sorted(graph):
    print(f"{vertex}: {graph[vertex]}")
print("neighbours of D:", graph["D"], "| degree of D:", len(graph["D"]))

# 2) Adjacency matrix: a V x V grid of 0/1. O(1) edge check, but V*V memory.
names = sorted(graph)
index = {name: i for i, name in enumerate(names)}
matrix = [[0] * len(names) for _ in names]
for u, v in edges:
    matrix[index[u]][index[v]] = 1
    matrix[index[v]][index[u]] = 1
print("   " + " ".join(names))
for name, row in zip(names, matrix):
    print(name, " ", " ".join(map(str, row)))
print("edge A-D?", matrix[index["A"]][index["D"]] == 1, "| edge B-D?", matrix[index["B"]][index["D"]] == 1)

# 3) Directed + weighted: store (neighbour, weight) pairs.
roads = {"home": [("shop", 4), ("park", 1)], "park": [("shop", 2)], "shop": []}
print("one-way roads from home:", roads["home"])

# 4) An implicit graph: a grid where '#' is a wall. Neighbours are computed, not stored.
grid = ["..#",
        "...",
        "#.."]
def neighbours(r, c):
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:          # up, down, left, right
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(grid) and 0 <= nc < len(grid[0]) and grid[nr][nc] == ".":
            yield (nr, nc)
print("open neighbours of cell (1, 1):", list(neighbours(1, 1)))
`,
    simpleOutput: `A: ['B', 'C']
B: ['A', 'C', 'D']
C: ['A', 'B', 'E']
D: ['B', 'E', 'F']
E: ['C', 'D', 'F']
F: ['D', 'E']
neighbours of D: ['B', 'E', 'F'] | degree of D: 3
   A B C D E F
A   0 1 1 0 0 0
B   1 0 1 1 0 0
C   1 1 0 0 1 0
D   0 1 0 0 1 1
E   0 0 1 1 0 1
F   0 0 0 1 1 0
edge A-D? False | edge B-D? True
one-way roads from home: [('shop', 4), ('park', 1)]
open neighbours of cell (1, 1): [(0, 1), (2, 1), (1, 0), (1, 2)]`,
    codeNotes: [
      "`edges` is an edge list, the raw input. Everything else is built from it.",
      "The adjacency list uses `setdefault` to create an empty list the first time a vertex appears. Because the graph is undirected, each edge is added in both directions.",
      "The matrix maps names to row/column numbers with `index`. Checking an edge is a single lookup, but the grid needs V × V cells even though most are 0.",
      "For a weighted directed graph, store `(neighbour, weight)` pairs and add each edge only one way.",
      "The grid has no stored edges at all. `neighbours` generates the open cells next to `(r, c)` on demand, and BFS/DFS can use it directly.",
    ],
    takeaways: [
      "Graph = vertices + edges (directed or not, weighted or not).",
      "Default: adjacency list `dict[vertex] -> list of neighbours`, O(V + E) memory.",
      "Matrix: O(1) edge check, O(V²) memory, so use it for small or dense graphs.",
      "Grids are implicit graphs: compute neighbours on the fly.",
    ],
  },

  "bfs-dfs": {
    level: "Beginner",
    analogy: "BFS is like ripples in a pond: the circle of water spreads one ring at a time, reaching close places before far ones. DFS is like exploring a maze with one hand on the wall: you follow one corridor as far as it goes, and only when you hit a dead end do you back up and try the next turning.",
    explain: [
      "Both algorithms visit every vertex reachable from a start vertex. Both keep a **visited** set so they never process a vertex twice, which also stops them going round in circles. They differ in **which vertex they look at next**.",
      "**Breadth-first search (BFS)** uses a **queue** (first in, first out). It visits the start, then all its neighbours, then all of their neighbours, and so on, ring by ring. So the first time BFS reaches a vertex, it has found a path with the **fewest edges**. That's why BFS solves 'shortest path in an unweighted graph' and 'minimum number of moves' puzzles.",
      "**Depth-first search (DFS)** uses a **stack**: either the call stack (recursion) or an explicit list. It goes as deep as possible along one path before backtracking. DFS is the tool for 'explore everything', counting connected components, detecting cycles, topological sorting and backtracking puzzles.",
      "Both run in **O(V + E)**: each vertex is visited once, and each edge is looked at once (twice in an undirected graph).",
      "Key detail: in BFS, mark a vertex as visited **when you add it to the queue**, not when you take it out. Otherwise the same vertex can be added many times.",
    ],
    simpleCode: py`
# BFS (queue) and DFS (stack / recursion) on the same graph.
from collections import deque

graph = {
    "A": ["B", "C"],
    "B": ["A", "D", "E"],
    "C": ["A", "F"],
    "D": ["B"],
    "E": ["B", "F"],
    "F": ["C", "E"],
}


def bfs(start):
    visited = {start}             # mark when ADDED to the queue
    queue = deque([start])
    order = []
    while queue:
        vertex = queue.popleft()  # oldest first -> ring by ring
        order.append(vertex)
        for nxt in graph[vertex]:
            if nxt not in visited:
                visited.add(nxt)
                queue.append(nxt)
    return order


def dfs(vertex, visited=None, order=None):
    if visited is None:
        visited, order = set(), []
    visited.add(vertex)
    order.append(vertex)
    for nxt in graph[vertex]:
        if nxt not in visited:
            dfs(nxt, visited, order)   # go deep first; return here when stuck
    return order


def shortest_path(start, goal):
    """BFS that remembers how it reached each vertex, then walks back from the goal."""
    came_from = {start: None}
    queue = deque([start])
    while queue:
        vertex = queue.popleft()
        if vertex == goal:
            break
        for nxt in graph[vertex]:
            if nxt not in came_from:
                came_from[nxt] = vertex
                queue.append(nxt)
    if goal not in came_from:
        return None
    path = []
    while goal is not None:
        path.append(goal)
        goal = came_from[goal]
    return path[::-1]


print("BFS from A:", bfs("A"))
print("DFS from A:", dfs("A"))
print("fewest-edges path A -> F:", shortest_path("A", "F"))
print("fewest-edges path D -> F:", shortest_path("D", "F"))
`,
    simpleOutput: `BFS from A: ['A', 'B', 'C', 'D', 'E', 'F']
DFS from A: ['A', 'B', 'D', 'E', 'F', 'C']
fewest-edges path A -> F: ['A', 'C', 'F']
fewest-edges path D -> F: ['D', 'B', 'E', 'F']`,
    codeNotes: [
      "`bfs` uses a `deque` as a queue. `popleft` always takes the vertex that was discovered earliest, so vertices come out in order of distance from the start.",
      "`visited.add` happens when a vertex is **queued**. If we waited until it was dequeued, two neighbours could both queue the same vertex.",
      "`dfs` is recursive. It visits a vertex, then immediately dives into the first unvisited neighbour. Only when that whole branch is done does the loop continue with the next neighbour. Compare the BFS and DFS orders in the output.",
      "`shortest_path` is BFS plus a `came_from` dict that records the parent of each vertex. Walking back from the goal through the parents and reversing gives the path.",
      "BFS finds the path with the fewest **edges**. With weighted edges, use Dijkstra instead (two lessons from now).",
    ],
    takeaways: [
      "BFS = queue = ring by ring = fewest-edges shortest path.",
      "DFS = stack/recursion = go deep, then backtrack.",
      "Always keep a visited set; both are O(V + E).",
      "In BFS, mark visited when you enqueue.",
    ],
  },

  "topological-sort": {
    level: "Intermediate",
    analogy: "Getting dressed: socks before shoes, underwear before trousers, shirt before tie. A topological order is any order of putting on clothes that never breaks one of those 'this before that' rules. If the rules contradict each other (shoes before socks AND socks before shoes), no order works. That's a cycle.",
    explain: [
      "Given a **directed** graph where an edge `u → v` means '**u must come before v**' (a prerequisite, a build dependency, a task order), a **topological sort** lists all vertices so that every edge points forward in the list.",
      "This is only possible if the graph has **no cycles**. Such a graph is called a **DAG** (Directed Acyclic Graph). If A needs B and B needs A, neither can go first. So a topological sort algorithm also works as a **cycle detector**.",
      "**Kahn's algorithm** is the easiest to understand. Count each vertex's **in-degree**, the number of edges pointing into it (its unmet prerequisites). Every vertex with in-degree 0 is ready to go, so put it in a queue. Repeatedly take a ready vertex, add it to the order, and 'remove' its outgoing edges by decrementing its neighbours' in-degrees. A neighbour whose in-degree hits 0 becomes ready.",
      "If the order ends up containing every vertex, it's a valid topological order. If some vertices never become ready, they're stuck waiting on each other, which means there is a cycle.",
      "Topological orders are usually not unique. Using a heap instead of a plain queue gives the alphabetically smallest order, which is handy when an exact answer is expected. Complexity: O(V + E).",
    ],
    simpleCode: py`
# Topological sort with Kahn's algorithm: repeatedly take something with no unmet prerequisites.
import heapq


def topo_sort(graph):
    """graph: vertex -> list of vertices that depend on it (edges point "before -> after")."""
    indegree = {v: 0 for v in graph}
    for v in graph:
        for after in graph[v]:
            indegree[after] += 1               # one more prerequisite for 'after'

    ready = [v for v in graph if indegree[v] == 0]
    heapq.heapify(ready)                       # heap -> alphabetical choice among ready ones
    order = []
    while ready:
        v = heapq.heappop(ready)
        order.append(v)
        for after in graph[v]:
            indegree[after] -= 1               # v is done: 'after' has one fewer to wait for
            if indegree[after] == 0:
                heapq.heappush(ready, after)

    if len(order) < len(graph):
        stuck = sorted(v for v in graph if indegree[v] > 0)
        return None, stuck                     # these wait on each other: a cycle
    return order, []


courses = {
    "intro": ["data-structures"],
    "math": ["algorithms", "ml"],
    "data-structures": ["algorithms", "systems"],
    "algorithms": ["ml"],
    "systems": [],
    "ml": [],
}
order, _ = topo_sort(courses)
print("study order:", " -> ".join(order))

cyclic = {"a": ["b"], "b": ["c"], "c": ["a"], "d": ["a"]}
order, stuck = topo_sort(cyclic)
print("with a cycle:", order, "| stuck:", stuck)
`,
    simpleOutput: `study order: intro -> data-structures -> math -> algorithms -> ml -> systems
with a cycle: None | stuck: ['a', 'b', 'c']`,
    codeNotes: [
      "`indegree[v]` counts how many prerequisites `v` still has. It's computed by looking at every edge once.",
      "`ready` holds every vertex with no unmet prerequisites. It's a heap so that, when several are ready, the alphabetically first is chosen. That makes the answer unique.",
      "Taking `v` from `ready` 'completes' it: each vertex that depends on `v` gets its count reduced, and any that reach 0 become ready.",
      "In the cyclic example, `d` points into the cycle a → b → c → a. None of a, b or c ever reaches in-degree 0, so they're reported as stuck. `d` itself has in-degree 0, so it still gets processed.",
    ],
    takeaways: [
      "Edge u → v means u comes first; the order must respect every edge.",
      "Only possible for a DAG (no cycles).",
      "Kahn: start with in-degree 0, remove edges, repeat. O(V + E).",
      "If not every vertex is output, there's a cycle.",
    ],
  },

  dijkstra: {
    level: "Intermediate",
    analogy: "Imagine pouring water into a network of pipes from one tap. The water reaches nearby junctions first and distant ones later. The moment water first reaches a junction, it got there by the quickest route, and nothing that arrives later can beat it. Dijkstra's algorithm simulates that spreading wave.",
    explain: [
      "Dijkstra's algorithm finds the **shortest distance** from one start vertex to every other vertex in a graph whose edges have **non-negative weights** (distances, times, costs).",
      "It keeps a best-known distance for each vertex, starting at 0 for the start and ∞ (unknown) for everything else. At each step it picks the **unfinished vertex with the smallest known distance** and declares that distance **final**. Then it **relaxes** each outgoing edge `u → v` with weight `w`: if `dist[u] + w < dist[v]`, it has found a shorter way to `v`, so it updates `dist[v]`.",
      "Why is the smallest one final? Every other route to it would have to pass through some vertex that is already at least as far away, and with non-negative weights a path can only get longer. That argument breaks when weights can be **negative**. Use Bellman-Ford for those graphs.",
      "Finding 'the smallest unfinished vertex' quickly is a job for a **min-heap** (`heapq`). Push `(distance, vertex)` whenever a distance improves. When you pop an entry that is out of date (bigger than the current best), just skip it. The total cost is **O((V + E) log V)**.",
      "Think of Dijkstra as BFS for weighted graphs: BFS's queue becomes a priority queue ordered by distance.",
    ],
    simpleCode: py`
# Dijkstra: shortest distances from one start, with non-negative edge weights.
import heapq

graph = {   # vertex -> list of (neighbour, weight); undirected roads stored both ways
    "A": [("B", 4), ("C", 2)],
    "B": [("A", 4), ("C", 1), ("D", 5)],
    "C": [("A", 2), ("B", 1), ("D", 8), ("E", 10)],
    "D": [("B", 5), ("C", 8), ("E", 2), ("F", 6)],
    "E": [("C", 10), ("D", 2), ("F", 3)],
    "F": [("D", 6), ("E", 3)],
}


def dijkstra(start):
    dist = {v: float("inf") for v in graph}   # best distance found so far
    previous = {v: None for v in graph}       # how we got there (to rebuild paths)
    dist[start] = 0
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)            # the closest vertex not yet finished
        if d > dist[u]:
            continue                          # an old, out-of-date heap entry: skip it
        for v, weight in graph[u]:
            if d + weight < dist[v]:          # "relax": found a shorter way to v
                dist[v] = d + weight
                previous[v] = u
                heapq.heappush(heap, (dist[v], v))
    return dist, previous


def path_to(previous, goal):
    path = []
    while goal is not None:
        path.append(goal)
        goal = previous[goal]
    return path[::-1]


dist, previous = dijkstra("A")
for v in sorted(dist):
    print(f"A -> {v}: distance {dist[v]:>2}, path {' -> '.join(path_to(previous, v))}")
`,
    simpleOutput: `A -> A: distance  0, path A
A -> B: distance  3, path A -> C -> B
A -> C: distance  2, path A -> C
A -> D: distance  8, path A -> C -> B -> D
A -> E: distance 10, path A -> C -> B -> D -> E
A -> F: distance 13, path A -> C -> B -> D -> E -> F`,
    codeNotes: [
      "`dist` starts at infinity for every vertex except the start. `previous` remembers the vertex we came from, so paths can be rebuilt afterwards.",
      "The heap always pops the unfinished vertex with the smallest distance. That distance is final.",
      "`if d > dist[u]: continue` skips stale entries. A vertex can be pushed several times as its distance improves, and only the newest entry matters.",
      "Relaxing is the `if d + weight < dist[v]` check. Look at B: the direct edge A→B costs 4, but A→C→B costs 2 + 1 = 3, so B's distance improves.",
      "`path_to` follows `previous` back from the goal and reverses the result. The output shows the cheapest route to F goes through C, B, D and E.",
    ],
    takeaways: [
      "Shortest paths from one source, all weights ≥ 0.",
      "Always finish the closest unfinished vertex; its distance is final.",
      "Relax: if dist[u] + w < dist[v], update dist[v].",
      "Use a heap and skip stale entries: O((V + E) log V).",
    ],
  },

  "bellman-ford-floyd-warshall": {
    level: "Advanced",
    analogy: "Bellman-Ford is like spreading news by rounds of phone calls: in each round, everyone tells their neighbours the best price they've heard. After enough rounds, everyone knows the best price. Floyd-Warshall is like a travel agent checking, for every pair of cities, whether a stop-over in city 1 helps, then whether a stop-over in city 2 helps, and so on through every city.",
    explain: [
      "Dijkstra fails with **negative edge weights** (a refund, a gain, a time bonus). **Bellman-Ford** handles them. It simply relaxes **every edge**, over and over, **V − 1 times**. A shortest path uses at most V − 1 edges, and each round fixes at least one more edge of it, so after V − 1 rounds every distance is correct. That's O(V × E), slower than Dijkstra but more general.",
      "Bonus: if a **V-th round** still improves some distance, there's a **negative cycle**, a loop whose total weight is negative. Going round it forever makes paths cheaper without limit, so 'shortest path' has no answer. Bellman-Ford detects this.",
      "**Floyd-Warshall** finds the shortest distance between **every pair** of vertices. Keep a V × V table `dist`. For each vertex `k` in turn, ask for every pair (i, j): 'is going through k shorter?', that is `dist[i][k] + dist[k][j] < dist[i][j]`. After trying every k as a middle stop, the table holds all the answers.",
      "Floyd-Warshall is three nested loops, so O(V³). That's fine for a few hundred vertices, and the code is tiny. It also handles negative edges (but not negative cycles: a negative number on the diagonal reveals one).",
    ],
    simpleCode: py`
# Bellman-Ford (one source, negative edges OK) and Floyd-Warshall (all pairs).
INF = float("inf")


def bellman_ford(vertices, edges, start):
    dist = {v: INF for v in vertices}
    dist[start] = 0
    for round_number in range(1, len(vertices)):       # V - 1 rounds
        changed = False
        for u, v, w in edges:                          # relax EVERY edge
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        print(f"  after round {round_number}: {dist}")
        if not changed:
            break                                      # nothing improved: done early
    for u, v, w in edges:                              # one more round: still improving?
        if dist[u] + w < dist[v]:
            return None                                # -> negative cycle
    return dist


def floyd_warshall(n, edges):
    dist = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges:
        dist[u][v] = w
    for k in range(n):                                 # allow k as a middle stop
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return dist


edges = [("S", "A", 4), ("S", "B", 5), ("B", "A", -3), ("A", "C", 2), ("B", "C", 4)]
print("Bellman-Ford from S:")
print("result:", bellman_ford(["S", "A", "B", "C"], edges, "S"))

loop = [("S", "A", 1), ("A", "B", -2), ("B", "A", 1)]   # A -> B -> A totals -1
print("negative cycle ->", bellman_ford(["S", "A", "B"], loop, "S"))

table = floyd_warshall(4, [(0, 1, 3), (1, 2, 1), (0, 2, 7), (2, 3, 2), (3, 0, 1)])
print("Floyd-Warshall, all pairs:")
for row in table:
    print("  ", row)
`,
    simpleOutput: `Bellman-Ford from S:
  after round 1: {'S': 0, 'A': 2, 'B': 5, 'C': 4}
  after round 2: {'S': 0, 'A': 2, 'B': 5, 'C': 4}
result: {'S': 0, 'A': 2, 'B': 5, 'C': 4}
  after round 1: {'S': 0, 'A': 0, 'B': -1}
  after round 2: {'S': 0, 'A': -1, 'B': -2}
negative cycle -> None
Floyd-Warshall, all pairs:
   [0, 3, 4, 6]
   [4, 0, 1, 3]
   [3, 6, 0, 2]
   [1, 4, 5, 0]`,
    codeNotes: [
      "`bellman_ford` relaxes every edge in each round. The printout shows distances improving: A first gets 4 (S→A), then 2 (S→B→A, using the −3 edge).",
      "The `changed` flag stops early once a round makes no improvement. In the worst case it takes V − 1 rounds.",
      "The extra loop after the rounds is the negative-cycle check. If anything can still improve, a negative loop exists, and the function returns `None`.",
      "`floyd_warshall` starts with direct edges only (0 on the diagonal, ∞ for no edge). The k-loop must be the **outermost** loop: when we allow k as a stop-over, the table must already be correct for stop-overs 0..k−1.",
    ],
    takeaways: [
      "Bellman-Ford: relax all edges V − 1 times; O(V·E); negative edges OK.",
      "A V-th improving round means a negative cycle.",
      "Floyd-Warshall: all pairs, try each k as a middle stop; O(V³).",
      "Non-negative weights + one source → Dijkstra is faster.",
    ],
  },

  "union-find": {
    level: "Intermediate",
    analogy: "Think of friend groups at a party. Each group has one 'leader'. To check whether two people are in the same group, ask each one 'who's your leader?' and compare the answers. When two groups merge, one leader just agrees to follow the other. Nobody else needs to be told.",
    explain: [
      "**Union-find** (also called a **disjoint set union**, or DSU) keeps track of items split into groups. It supports two operations: **find(x)**, which asks which group x is in by returning the group's representative (its 'leader' or **root**), and **union(a, b)**, which merges the groups of a and b.",
      "It's stored as one list, `parent`. Each item points to a parent, and a root points to itself. `find` follows parent pointers up to the root. Two items are in the same group exactly when they have the same root. `union` finds both roots and makes one point to the other.",
      "Two small tricks make it lightning fast. **Path compression**: after `find` reaches the root, point every node on the path straight at the root, so the next find is instant. **Union by size**: always hang the smaller tree under the bigger one, so trees stay shallow. Together they make each operation run in practically constant time (the official bound is O(α(n)), where α grows so slowly it's below 5 for any real input).",
      "Union-find shines when connections arrive one at a time and you keep asking 'are these connected yet?': counting islands or friend circles, detecting a cycle in an undirected graph (an edge whose ends already share a root closes a cycle), and Kruskal's minimum spanning tree.",
    ],
    simpleCode: py`
# Union-find (disjoint set union) with path compression and union by size.

class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))   # everyone starts as their own leader
        self.size = [1] * n            # size of each root's group
        self.groups = n

    def find(self, x):
        root = x
        while self.parent[root] != root:     # climb to the leader
            root = self.parent[root]
        while self.parent[x] != root:        # path compression: point the path at the root
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                     # already in the same group
        if self.size[ra] < self.size[rb]:    # union by size: small tree goes under big tree
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.groups -= 1
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)


uf = UnionFind(8)
for a, b in [(0, 1), (2, 3), (1, 3), (4, 5), (6, 7), (5, 7)]:
    uf.union(a, b)
    print(f"union({a}, {b}) -> parent = {uf.parent}, groups = {uf.groups}")

print("connected(3, 1)?", uf.connected(3, 1), "| connected(7, 0)?", uf.connected(7, 0))
print("parent after finding 3 and 7 (their paths were compressed):", uf.parent)

# Cycle detection: an edge whose ends are already connected closes a cycle.
roads = UnionFind(4)
for a, b in [(0, 1), (1, 2), (2, 0), (2, 3)]:
    print(f"edge {a}-{b}:", "joins two groups" if roads.union(a, b) else "makes a CYCLE")
`,
    simpleOutput: `union(0, 1) -> parent = [0, 0, 2, 3, 4, 5, 6, 7], groups = 7
union(2, 3) -> parent = [0, 0, 2, 2, 4, 5, 6, 7], groups = 6
union(1, 3) -> parent = [0, 0, 0, 2, 4, 5, 6, 7], groups = 5
union(4, 5) -> parent = [0, 0, 0, 2, 4, 4, 6, 7], groups = 4
union(6, 7) -> parent = [0, 0, 0, 2, 4, 4, 6, 6], groups = 3
union(5, 7) -> parent = [0, 0, 0, 2, 4, 4, 4, 6], groups = 2
connected(3, 1)? True | connected(7, 0)? False
parent after finding 3 and 7 (their paths were compressed): [0, 0, 0, 0, 4, 4, 4, 4]
edge 0-1: joins two groups
edge 1-2: joins two groups
edge 2-0: makes a CYCLE
edge 2-3: joins two groups`,
    codeNotes: [
      "`parent[i] == i` means `i` is a root (a group leader). At first everyone is their own group.",
      "`find` first climbs to the root, then walks the path a second time, pointing every node directly at the root. That's path compression.",
      "`union` merges two roots, hanging the smaller group under the bigger one so the trees stay shallow. It returns `False` when both items are already in the same group.",
      "Watch `parent` in the output: union(1, 3) links the roots 0 and 2 rather than the nodes 1 and 3 themselves. Later, `find(3)` climbs 3 → 2 → 0 and then re-points 3 straight at 0, and `find(7)` does the same for 7.",
      "The cycle demo is exactly how Kruskal's algorithm avoids cycles: edge 2-0 joins two items that are already connected, so it would close a loop.",
    ],
    takeaways: [
      "find = climb to the root; union = link two roots.",
      "Path compression + union by size → practically O(1) per operation.",
      "Same root ⇔ same group.",
      "Use it for 'connected yet?' questions as edges arrive, cycle checks, and Kruskal.",
    ],
  },

  "minimum-spanning-tree": {
    level: "Intermediate",
    analogy: "A town needs to connect all its houses to the internet by laying cables along streets, and each street has a cost. You want every house connected, directly or indirectly, for the lowest total cost. You'd never lay a cable that closes a loop, because the houses on that loop are already connected.",
    explain: [
      "Given an **undirected, weighted, connected** graph, a **spanning tree** is a set of edges that connects all V vertices with **no cycles**. It always has exactly V − 1 edges. A **minimum spanning tree (MST)** is the spanning tree with the smallest total weight.",
      "**Kruskal's algorithm** is greedy and simple: sort all edges from cheapest to most expensive, then go through them in order. Take an edge if it connects two vertices that are **not yet connected**, and skip it if they already are (it would close a cycle). Stop after taking V − 1 edges.",
      "'Are these two already connected?' is exactly what **union-find** answers. Check `find(u) != find(v)`, and if they differ, `union(u, v)` and take the edge. The cost is dominated by sorting the edges: **O(E log E)**.",
      "Why does greedy work here? Take any way to split the vertices into two sides. The cheapest edge crossing between the sides is always safe to include in some MST (the 'cut property'). Kruskal's choices are always such cheapest crossing edges.",
      "**Prim's algorithm** is the other classic: grow one tree from a start vertex, always adding the cheapest edge that leaves the tree (using a heap, much like Dijkstra). Both give a minimum total weight.",
    ],
    simpleCode: py`
# Kruskal's minimum spanning tree: cheapest edges first, skipping any that would close a cycle.

def find(parent, x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path halving: a simple form of path compression
        x = parent[x]
    return x


def kruskal(vertices, edges):
    parent = {v: v for v in vertices}
    chosen, total = [], 0
    for weight, u, v in sorted(edges):                 # cheapest first
        ru, rv = find(parent, u), find(parent, v)
        if ru == rv:
            print(f"  skip {u}-{v} ({weight}): {u} and {v} are already connected -> cycle")
            continue
        parent[ru] = rv                                # union the two groups
        chosen.append((u, v, weight))
        total += weight
        print(f"  take {u}-{v} ({weight})")
        if len(chosen) == len(vertices) - 1:
            break                                      # V - 1 edges: everything is connected
    return chosen, total


edges = [(4, "A", "B"), (2, "A", "C"), (1, "B", "C"), (5, "B", "D"), (8, "C", "D"),
         (10, "C", "E"), (2, "D", "E"), (6, "D", "F"), (3, "E", "F")]
print("Trying edges from cheapest to most expensive:")
tree, total = kruskal("ABCDEF", edges)
print("MST edges:", tree)
print("total cost:", total, "| edges used:", len(tree), "for 6 vertices")
`,
    simpleOutput: `Trying edges from cheapest to most expensive:
  take B-C (1)
  take A-C (2)
  take D-E (2)
  take E-F (3)
  skip A-B (4): A and B are already connected -> cycle
  take B-D (5)
MST edges: [('B', 'C', 1), ('A', 'C', 2), ('D', 'E', 2), ('E', 'F', 3), ('B', 'D', 5)]
total cost: 13 | edges used: 5 for 6 vertices`,
    codeNotes: [
      "Edges are stored as `(weight, u, v)` so that `sorted(edges)` orders them cheapest first.",
      "`find` is a tiny union-find. Two vertices with the same root are already connected by edges we've taken.",
      "For each edge, compare roots. If they're the same, the edge would make a cycle and is skipped. Otherwise take it and union the groups.",
      "The loop stops after V − 1 = 5 edges, because a spanning tree of 6 vertices always has exactly 5. The expensive edges C-D (8) and C-E (10) are never even considered.",
    ],
    takeaways: [
      "MST: connect all vertices, no cycles, minimum total weight; V − 1 edges.",
      "Kruskal: sort edges, take each one unless it makes a cycle.",
      "Union-find answers 'would this make a cycle?'.",
      "O(E log E), dominated by the sort.",
    ],
  },

  "scc-bridges": {
    level: "Advanced",
    analogy: "Strongly connected components are like neighbourhoods in a city of one-way streets: inside a neighbourhood you can drive from anywhere to anywhere, but once you leave, you may not be able to come back. A bridge is like the only road to an island: close it, and the island is cut off.",
    explain: [
      "In a **directed** graph, two vertices are **strongly connected** if each can reach the other. A **strongly connected component (SCC)** is a maximal group of vertices that are all strongly connected to each other. Every directed graph splits into SCCs, and if you shrink each SCC to a single dot, what's left is a DAG.",
      "**Kosaraju's algorithm** finds them with two DFS passes. Pass 1: run DFS over the whole graph and record vertices in the order they **finish** (when all their descendants are done). Pass 2: **reverse every edge**, then take vertices in **reverse finishing order**. Each DFS in the reversed graph collects exactly one SCC. Reversing traps the search inside its component, because the edges that led out of it now point in.",
      "In an **undirected** graph, a **bridge** is an edge whose removal splits the graph into more pieces. An edge is a bridge exactly when it's **not on any cycle**.",
      "To find bridges with one DFS, give each vertex a **discovery time** `tin` (when DFS first reached it) and a **low** value: the smallest `tin` it can reach using its DFS subtree plus one back-edge. A tree edge `parent → child` is a bridge when `low[child] > tin[parent]`. That means nothing in the child's subtree can climb back up to the parent or above, so this edge is the only connection.",
      "Both run in O(V + E). These are advanced topics: understand BFS/DFS and topological sort well first.",
    ],
    simpleCode: py`
# Strongly connected components (Kosaraju) and bridges (low-link), kept small and readable.

def kosaraju(graph):
    order, seen = [], set()

    def dfs1(v):                       # pass 1: record finishing order
        seen.add(v)
        for w in graph[v]:
            if w not in seen:
                dfs1(w)
        order.append(v)                # v finishes after everything it reaches

    for v in sorted(graph):
        if v not in seen:
            dfs1(v)

    reverse = {v: [] for v in graph}   # flip every edge
    for v in graph:
        for w in graph[v]:
            reverse[w].append(v)

    components, seen = [], set()

    def dfs2(v, group):                # pass 2: one DFS = one component
        seen.add(v)
        group.append(v)
        for w in reverse[v]:
            if w not in seen:
                dfs2(w, group)

    for v in reversed(order):          # latest finisher first
        if v not in seen:
            group = []
            dfs2(v, group)
            components.append(sorted(group))
    return components


def bridges(graph):
    tin, low, found, timer = {}, {}, [], [0]

    def dfs(v, parent):
        tin[v] = low[v] = timer[0]
        timer[0] += 1
        for w in graph[v]:
            if w == parent:
                continue
            if w in tin:                           # back edge: can climb to w
                low[v] = min(low[v], tin[w])
            else:                                  # tree edge
                dfs(w, v)
                low[v] = min(low[v], low[w])
                if low[w] > tin[v]:                # w's subtree can't get back above v
                    found.append(tuple(sorted((v, w))))

    for v in sorted(graph):
        if v not in tin:
            dfs(v, None)
    return sorted(found)


one_way = {"A": ["B"], "B": ["C"], "C": ["A", "D"], "D": ["E"], "E": ["D", "F"], "F": []}
print("SCCs:", kosaraju(one_way))

roads = {1: [2, 3], 2: [1, 3], 3: [1, 2, 4], 4: [3, 5], 5: [4, 6, 7], 6: [5, 7], 7: [5, 6]}
print("bridges:", bridges(roads))
`,
    simpleOutput: `SCCs: [['A', 'B', 'C'], ['D', 'E'], ['F']]
bridges: [(3, 4), (4, 5)]`,
    codeNotes: [
      "`dfs1` appends a vertex to `order` only after exploring everything reachable from it, so `order` is the finishing order.",
      "`reverse` flips every edge. In the reversed graph, a DFS started from the latest finisher can't escape its own component.",
      "`dfs2` collects one component per start. The output finds {A, B, C} (a cycle), {D, E} (they point at each other) and {F} on its own.",
      "In `bridges`, `tin` is the visit time, and `low` is the earliest visit time reachable from the subtree using one back edge. A back edge to an already-visited vertex lowers `low`.",
      "The check `low[w] > tin[v]` marks edge v–w as a bridge. In the road graph, 3–4 and 4–5 are bridges: the triangles 1-2-3 and 5-6-7 survive losing any one edge, but the path through 4 doesn't.",
    ],
    takeaways: [
      "SCC = maximal group where everyone reaches everyone (directed).",
      "Kosaraju: DFS finish order, reverse the edges, DFS again in reverse order.",
      "Bridge = edge on no cycle; test `low[child] > tin[parent]`.",
      "Both are O(V + E) and built on DFS.",
    ],
  },
};
