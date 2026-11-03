import { DSAProblem } from "./types";

export const GRAPHS_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-gr-1",
    title: "Number of Islands",
    slug: "number-of-islands",
    level: 3,
    category: "Graphs & Shortest Path",
    difficulty: "Medium",
    acceptanceRate: "59.2%",
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3" },
    ],
    constraints: ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 300", "grid[i][j] is '0' or '1'."],
    patternIntuition: {
      ruleOfThumb: "Connected Components in 2D Grid: Iterate through every cell. When encountering land `'1'`, increment island count, then trigger BFS/DFS to sink all connected land cells by flipping them to `'0'`.",
      recognitionTriggers: ["Counting connected disjoint components on a 2D matrix"],
      commonPitfalls: ["Not marking cell visited before adding to queue in BFS, leading to duplicate queue additions and memory explosion"],
      templateSnippet: `def numIslands(grid: list[list[str]]) -> int:
    islands = 0
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if grid[r][c] == "1":
                dfs(r, c)
                islands += 1
    return islands`,
    },
    timeComplexity: "O(M * N) - Every cell visited at most constant times.",
    spaceComplexity: "O(M * N) - Recursion/queue depth in worst case.",
    starterCode: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        if not grid:
            return 0

        rows, cols = len(grid), len(grid[0])
        island_count = 0

        def dfs(r: int, c: int):
            # Boundary check and water check
            if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != "1":
                return

            # Sink land cell to prevent duplicate visits
            grid[r][c] = "0"

            # Flood fill adjacent 4 cells
            dfs(r + 1, c)
            dfs(r - 1, c)
            dfs(r, c + 1)
            dfs(r, c - 1)

        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    island_count += 1
                    dfs(r, c)

        return island_count
`,
    testCases: [
      { id: 1, inputDesc: "grid with 1 island", expectedDesc: "1", args: [], expected: 1 },
      { id: 2, inputDesc: "grid with 3 islands", expectedDesc: "3", args: [], expected: 3 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
from typing import Optional
${userCode}

g1 = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]
g2 = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]

sol = Solution()
r1 = sol.numIslands(g1)
r2 = sol.numIslands(g2)
passed = (r1 == 1 and r2 == 3)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 1, "actual": r1, "expected": 1},
    {"testCase": 2, "passed": r2 == 3, "actual": r2, "expected": 3}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-gr-2",
    title: "Clone Graph",
    slug: "clone-graph",
    level: 3,
    category: "Graphs & Shortest Path",
    difficulty: "Medium",
    acceptanceRate: "57.4%",
    description: `Given a reference of a node in a connected undirected graph. Return a **deep copy** (clone) of the graph. Each node contains a value and a list of its neighbors.`,
    examples: [
      { input: "adjList = [[2,4],[1,3],[2,4],[1,3]]", output: "[[2,4],[1,3],[2,4],[1,3]]" },
    ],
    constraints: ["The number of nodes in the graph is in the range [0, 100].", "1 <= Node.val <= 100", "Node.val is unique for each node."],
    patternIntuition: {
      ruleOfThumb: "Use a Hash Map mapping `original_node -> cloned_node` with DFS or BFS. When visiting a node, if it's already cloned in the map, return it immediately to prevent infinite recursion on graph cycles.",
      recognitionTriggers: ["Deep copying cyclic graph structures"],
      commonPitfalls: ["Cloning neighbors recursively without memoization in a hash map, creating infinite cycle loop"],
      templateSnippet: `def cloneGraph(node):
    old_to_new = {}
    def dfs(n):
        if not n: return None
        if n in old_to_new: return old_to_new[n]
        copy = Node(n.val)
        old_to_new[n] = copy
        for nei in n.neighbors: copy.neighbors.append(dfs(nei))
        return copy
    return dfs(node)`,
    },
    timeComplexity: "O(V + E) - Visiting every vertex and edge once.",
    spaceComplexity: "O(V) - Hash map storing all cloned nodes.",
    starterCode: `class Solution:
    def cloneGraph(self, node: Optional['Node']) -> Optional['Node']:
        pass
`,
    solutionCode: `class Node:
    def __init__(self, val = 0, neighbors = None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

class Solution:
    def cloneGraph(self, node: Node) -> Node:
        if not node:
            return None

        # Map original node pointer -> newly cloned node pointer
        cloned_map = {}

        def dfs(curr: Node) -> Node:
            # If already cloned, return the cloned instance (breaks graph cycles)
            if curr in cloned_map:
                return cloned_map[curr]

            # Create clone of current node
            copy = Node(curr.val)
            cloned_map[curr] = copy

            # Deep copy all neighbor edges
            for neighbor in curr.neighbors:
                copy.neighbors.append(dfs(neighbor))

            return copy

        return dfs(node)
`,
    testCases: [
      { id: 1, inputDesc: "4-node cyclic graph", expectedDesc: "cloned", args: [], expected: 4 },
    ],
    runWrapper: (userCode: string) => `
import sys, json

class Node:
    def __init__(self, val = 0, neighbors = None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []

from typing import Optional
${userCode}

n1, n2, n3, n4 = Node(1), Node(2), Node(3), Node(4)
n1.neighbors = [n2, n4]
n2.neighbors = [n1, n3]
n3.neighbors = [n2, n4]
n4.neighbors = [n1, n3]

sol = Solution()
c1 = sol.cloneGraph(n1)
passed = (c1 is not n1 and c1.val == 1 and len(c1.neighbors) == 2 and c1.neighbors[0].val == 2)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": 4, "expected": 4}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-gr-3",
    title: "Course Schedule",
    slug: "course-schedule",
    level: 4,
    category: "Graphs & Shortest Path",
    difficulty: "Medium",
    acceptanceRate: "47.2%",
    description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [a_i, b_i]\` indicates that you **must** take course \`b_i\` first if you want to take course \`a_i\`. Return \`true\` if you can finish all courses. Otherwise, return \`false\`.`,
    examples: [
      { input: "numCourses = 2, prerequisites = [[1, 0]]", output: "true" },
      { input: "numCourses = 2, prerequisites = [[1, 0], [0, 1]]", output: "false" },
    ],
    constraints: ["1 <= numCourses <= 2000", "0 <= prerequisites.length <= 5000", "prerequisites[i].length == 2"],
    patternIntuition: {
      ruleOfThumb: "Kahn's Algorithm (Topological Sort with In-Degree): Build adjacency list and compute in-degrees for every course. Push all nodes with in-degree 0 into a BFS queue. Pop node, decrement neighbor in-degrees, and push if in-degree reaches 0. Cycle exists if processed count != numCourses.",
      recognitionTriggers: ["Dependency resolution or cycle detection in a directed graph"],
      commonPitfalls: ["Inverting edge direction: [a, b] means b -> a (b is prerequisite for a)"],
      templateSnippet: `def canFinish(numCourses, prerequisites):
    in_degree = [0] * numCourses
    adj = collections.defaultdict(list)
    for dest, src in prerequisites:
        adj[src].append(dest)
        in_degree[dest] += 1
    q = collections.deque([i for i in range(numCourses) if in_degree[i] == 0])
    count = 0
    while q:
        curr = q.popleft()
        count += 1
        for nxt in adj[curr]:
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0: q.append(nxt)
    return count == numCourses`,
    },
    timeComplexity: "O(V + E) - Processing every node and dependency edge once.",
    spaceComplexity: "O(V + E) - Adjacency list and in-degree array.",
    starterCode: `class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        pass
`,
    solutionCode: `from collections import deque, defaultdict

class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        in_degree = [0] * numCourses
        adj = defaultdict(list)

        # Build graph: dest requires src, so edge is src -> dest
        for dest, src in prerequisites:
            adj[src].append(dest)
            in_degree[dest] += 1

        # Queue courses that have 0 prerequisites initially
        queue = deque([i for i in range(numCourses) if in_degree[i] == 0])
        completed_courses = 0

        while queue:
            curr = queue.popleft()
            completed_courses += 1

            for neighbor in adj[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        # If completed all courses, graph is a valid DAG (no cycles)
        return completed_courses == numCourses
`,
    testCases: [
      { id: 1, inputDesc: "numCourses = 2, prerequisites = [[1, 0]]", expectedDesc: "true", args: [2, [[1, 0]]], expected: true },
      { id: 2, inputDesc: "numCourses = 2, prerequisites = [[1, 0], [0, 1]]", expectedDesc: "false", args: [2, [[1, 0], [0, 1]]], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
from typing import Optional
${userCode}

sol = Solution()
r1 = sol.canFinish(2, [[1, 0]])
r2 = sol.canFinish(2, [[1, 0], [0, 1]])
passed = (r1 == True and r2 == False)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == True, "actual": r1, "expected": True},
    {"testCase": 2, "passed": r2 == False, "actual": r2, "expected": False}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-gr-4",
    title: "Pacific Atlantic Water Flow",
    slug: "pacific-atlantic-water-flow",
    level: 4,
    category: "Graphs & Shortest Path",
    difficulty: "Medium",
    acceptanceRate: "55.8%",
    description: `There is an \`m x n\` rectangular island that borders both the Pacific Ocean and Atlantic Ocean. Return a 2D list of grid coordinates where rain water can flow to both oceans. Water can flow from a cell to an adjacent cell with an equal or lower height.`,
    examples: [
      { input: "heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]", output: "[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]" },
    ],
    constraints: ["m == heights.length", "n == heights[r].length", "1 <= m, n <= 200", "0 <= heights[r][c] <= 10^5"],
    patternIntuition: {
      ruleOfThumb: "Reverse Flow from Oceans: Instead of starting from interior cells flowing downhill, start BFS/DFS from the ocean boundaries flowing UPHILL (`neighbor_height >= current_height`). Find intersection of Pacific-reachable and Atlantic-reachable sets.",
      recognitionTriggers: ["Reachability to multiple separate boundaries simultaneously"],
      commonPitfalls: ["Starting DFS from every single interior cell: O((M * N)^2) which TLEs. Boundary-inward traversal is O(M * N)!"],
      templateSnippet: `def pacificAtlantic(heights):
    pac, atl = set(), set()
    # DFS from Pacific borders (top row, left col)
    # DFS from Atlantic borders (bottom row, right col)
    # return list(pac & atl)`,
    },
    timeComplexity: "O(M * N) - Visiting cells at most twice.",
    spaceComplexity: "O(M * N) - Reachable sets and recursion stack.",
    starterCode: `class Solution:
    def pacificAtlantic(self, heights: list[list[int]]) -> list[list[int]]:
        pass
`,
    solutionCode: `class Solution:
    def pacificAtlantic(self, heights: list[list[int]]) -> list[list[int]]:
        if not heights or not heights[0]:
            return []

        rows, cols = len(heights), len(heights[0])
        pacific_reachable = set()
        atlantic_reachable = set()

        def dfs(r: int, c: int, visited: set, prev_height: int):
            if ((r, c) in visited or 
                r < 0 or r >= rows or c < 0 or c >= cols or 
                heights[r][c] < prev_height):
                return

            visited.add((r, c))

            # Flow upward to adjacent neighbors
            dfs(r + 1, c, visited, heights[r][c])
            dfs(r - 1, c, visited, heights[r][c])
            dfs(r, c + 1, visited, heights[r][c])
            dfs(r, c - 1, visited, heights[r][c])

        # Run DFS from horizontal boundaries
        for c in range(cols):
            dfs(0, c, pacific_reachable, heights[0][c])               # Top border (Pacific)
            dfs(rows - 1, c, atlantic_reachable, heights[rows - 1][c]) # Bottom border (Atlantic)

        # Run DFS from vertical boundaries
        for r in range(rows):
            dfs(r, 0, pacific_reachable, heights[r][0])               # Left border (Pacific)
            dfs(r, cols - 1, atlantic_reachable, heights[r][cols - 1]) # Right border (Atlantic)

        # Cells reachable by both oceans
        return [[r, c] for r, c in (pacific_reachable & atlantic_reachable)]
`,
    testCases: [
      { id: 1, inputDesc: "5x5 island", expectedDesc: "7 cells", args: [], expected: 7 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
from typing import Optional
${userCode}

heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
sol = Solution()
res = sol.pacificAtlantic(heights)
passed = (len(res) == 7 and [0, 4] in res and [4, 0] in res)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": len(res), "expected": 7}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-gr-5",
    title: "Word Ladder",
    slug: "word-ladder",
    level: 6,
    category: "Graphs & Shortest Path",
    difficulty: "Hard",
    acceptanceRate: "39.5%",
    description: `A **transformation sequence** from word \`beginWord\` to word \`endWord\` using a dictionary \`wordList\` is a sequence of words \`beginWord -> s1 -> s2 -> ... -> sk\` such that every adjacent pair of words differs by a single letter. Return the number of words in the **shortest transformation sequence**, or \`0\` if no such sequence exists.`,
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: "5", explanation: '"hit" -> "hot" -> "dot" -> "dog" -> "cog"' },
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: "0" },
    ],
    constraints: ["1 <= beginWord.length <= 10", "endWord.length == beginWord.length", "1 <= wordList.length <= 5000", "wordList[i].length == beginWord.length"],
    patternIntuition: {
      ruleOfThumb: "Shortest path in an unweighted graph $\to$ Breadth-First Search (BFS). Precompute intermediate wildcard patterns `*ot -> [hot, dot, lot]` for O(1) neighbor discovery without testing all 26^L possibilities.",
      recognitionTriggers: ["Minimum number of 1-letter step transformations to reach target"],
      commonPitfalls: ["Using DFS which fails to guarantee the shortest path and blows the stack"],
      templateSnippet: `def ladderLength(beginWord, endWord, wordList):
    if endWord not in wordList: return 0
    nei = collections.defaultdict(list)
    for word in wordList:
        for j in range(len(word)):
            pattern = word[:j] + "*" + word[j+1:]
            nei[pattern].append(word)
    q = collections.deque([(beginWord, 1)])
    visited = {beginWord}
    # BFS level by level
    ...`,
    },
    timeComplexity: "O(M^2 * N) - Where M is word length and N is total words.",
    spaceComplexity: "O(M^2 * N) - Intermediate pattern hash map.",
    starterCode: `class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:
        pass
`,
    solutionCode: `from collections import deque, defaultdict

class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: list[str]) -> int:
        # If destination word is not in dictionary, no transformation possible
        if endWord not in set(wordList):
            return 0

        # Build intermediate wildcard adjacency list: "*ot" -> ["hot", "dot", "lot"]
        pattern_map = defaultdict(list)
        word_len = len(beginWord)

        for word in wordList:
            for i in range(word_len):
                pattern = word[:i] + "*" + word[i+1:]
                pattern_map[pattern].append(word)

        # BFS queue storing (current_word, transformation_length)
        queue = deque([(beginWord, 1)])
        visited = {beginWord}

        while queue:
            curr_word, step_count = queue.popleft()

            if curr_word == endWord:
                return step_count

            # Explore all 1-letter mutation patterns
            for i in range(word_len):
                pattern = curr_word[:i] + "*" + curr_word[i+1:]
                for neighbor in pattern_map[pattern]:
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, step_count + 1))

        return 0
`,
    testCases: [
      { id: 1, inputDesc: 'begin="hit", end="cog", list=["hot","dot","dog","lot","log","cog"]', expectedDesc: "5", args: [], expected: 5 },
      { id: 2, inputDesc: 'begin="hit", end="cog", list=["hot","dot","dog","lot","log"]', expectedDesc: "0", args: [], expected: 0 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
from typing import Optional
${userCode}

sol = Solution()
r1 = sol.ladderLength("hit", "cog", ["hot","dot","dog","lot","log","cog"])
r2 = sol.ladderLength("hit", "cog", ["hot","dot","dog","lot","log"])
passed = (r1 == 5 and r2 == 0)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 5, "actual": r1, "expected": 5},
    {"testCase": 2, "passed": r2 == 0, "actual": r2, "expected": 0}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
