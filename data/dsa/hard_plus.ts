import { makeProblem, type CoreSpec } from "./core";

// Harder practice for established topics (heaps, intervals, graphs, DP, greedy, monotonic queues, binary search).
// Original prompts; one list of cases drives the displayed examples and the Python runner.
const problems: CoreSpec[] = [
  {
    id:"dsa-heap-smallest-range",title:"Smallest Range Covering Every List",category:"Heaps & Priority Queues",difficulty:"Hard",level:7,
    description:"You are given k non-empty lists of integers, each sorted in ascending order. Return the smallest range [a, b] that includes at least one number from every list. Range [a, b] is smaller than [c, d] when b − a < d − c, or when the widths are equal and a < c.",
    constraints:["1 <= k <= 3500", "1 <= len(list) <= 50", "-10^5 <= values <= 10^5", "Each list is sorted ascending."],method:"smallestRange",signature:"nums: list[list[int]]",
    intuition:"Keep one pointer per list and a min-heap of the pointed values, plus the current maximum. The window [heap minimum, maximum] always covers every list. The only way to shrink it is to advance the list holding the minimum; stop when that list runs out.",
    triggers:["One element from each of k sorted lists", "Merge k sorted streams while tracking a window"],
    pitfalls:["Track the current maximum separately—a min-heap does not expose it.", "Stop as soon as the list that owns the minimum is exhausted.", "Update the answer only on a strictly smaller width so ties keep the smaller start."],
    time:"O(N log k) for N total values",space:"O(k)",
    solution:`import heapq
class Solution:
    def smallestRange(self, nums: list[list[int]]):
        heap = [(row[0], i, 0) for i, row in enumerate(nums)]
        heapq.heapify(heap)
        current_max = max(row[0] for row in nums)
        best = [heap[0][0], current_max]
        while True:
            value, i, j = heapq.heappop(heap)
            if current_max - value < best[1] - best[0]:
                best = [value, current_max]
            if j + 1 == len(nums[i]):
                return best
            nxt = nums[i][j + 1]
            current_max = max(current_max, nxt)
            heapq.heappush(heap, (nxt, i, j + 1))
`,
    cases:[{args:[[[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]],expected:[20,24]},{args:[[[1,2,3],[1,2,3],[1,2,3]]],expected:[1,1]},{args:[[[5]]],expected:[5,5]},{args:[[[1,10],[2,20]]],expected:[1,2]},{args:[[[-5,0],[10,12]]],expected:[0,10]},{args:[[[1,5],[3,7]]],expected:[1,3]}],
  },
  {
    id:"dsa-heap-max-capital",title:"Maximize Capital with Limited Projects",category:"Heaps & Priority Queues",difficulty:"Hard",level:7,
    description:"You start with capital w and may complete at most k distinct projects, one after another. Project i can start only when your capital is at least capital[i]; finishing it adds profits[i] to your capital (the requirement itself is not spent). Return the largest capital you can end with.",
    constraints:["0 <= k <= 100000", "0 <= w <= 10^9", "len(profits) == len(capital) <= 100000", "0 <= profits[i] <= 10^4", "0 <= capital[i] <= 10^9"],method:"findMaximizedCapital",signature:"k: int, w: int, profits: list[int], capital: list[int]",
    intuition:"Profits only increase capital, so among the projects you can currently afford, the most profitable one is always the best next pick. Sort projects by requirement, push newly affordable profits into a max-heap as capital grows, and pop the top k times.",
    triggers:["Repeatedly pick the best option among those currently unlocked", "Unlock conditions that only become easier over time"],
    pitfalls:["Stop early when no project is affordable.", "Python's heapq is a min-heap; push negated profits.", "Each project can be done at most once."],
    time:"O(n log n + k log n)",space:"O(n)",
    solution:`import heapq
class Solution:
    def findMaximizedCapital(self, k: int, w: int, profits: list[int], capital: list[int]):
        projects = sorted(zip(capital, profits))
        available = []
        i = 0
        for _ in range(k):
            while i < len(projects) and projects[i][0] <= w:
                heapq.heappush(available, -projects[i][1])
                i += 1
            if not available:
                break
            w -= heapq.heappop(available)
        return w
`,
    cases:[{args:[2,0,[1,2,3],[0,1,1]],expected:4},{args:[3,0,[1,2,3],[0,1,2]],expected:6},{args:[1,0,[5],[1]],expected:0},{args:[10,5,[1,2],[0,10]],expected:6},{args:[0,7,[3],[0]],expected:7}],
  },
  {
    id:"dsa-int-skyline",title:"City Skyline Outline",category:"Intervals & Sweepline",difficulty:"Hard",level:8,
    description:"Each building is a rectangle [left, right, height] standing on flat ground. Return the outline of the union of all buildings as key points [x, height] sorted by x: each key point is where the outline's height changes to the given value. Consecutive key points must have different heights, and the outline ends with a point of height 0.",
    constraints:["1 <= len(buildings) <= 10000", "0 <= left < right <= 2^31 - 1", "1 <= height <= 2^31 - 1"],method:"getSkyline",signature:"buildings: list[list[int]]",
    intuition:"Sweep the distinct x-coordinates from left to right. Add buildings that have started to a max-heap keyed by height, lazily discard ones whose right edge is at or before x, and the heap top is the outline height just after x. Emit a point whenever that height changes.",
    triggers:["Union outline of overlapping intervals with heights", "Maximum active value at each event in a sweep"],
    pitfalls:["A building's right edge is exclusive: at x == right it no longer counts.", "Merge equal adjacent heights—never emit two consecutive points with the same height.", "Lazy deletion: remove expired buildings only when they reach the heap top."],
    time:"O(n log n)",space:"O(n)",
    solution:`import heapq
class Solution:
    def getSkyline(self, buildings: list[list[int]]):
        xs = sorted({x for left, right, _ in buildings for x in (left, right)})
        buildings = sorted(buildings)
        heap = []
        result = []
        i = 0
        for x in xs:
            while i < len(buildings) and buildings[i][0] <= x:
                left, right, height = buildings[i]
                heapq.heappush(heap, (-height, right))
                i += 1
            while heap and heap[0][1] <= x:
                heapq.heappop(heap)
            height = -heap[0][0] if heap else 0
            if not result or result[-1][1] != height:
                result.append([x, height])
        return result
`,
    cases:[{args:[[[2,9,10],[3,7,15],[5,12,12],[15,20,10],[19,24,8]]],expected:[[2,10],[3,15],[7,12],[12,0],[15,10],[20,8],[24,0]]},{args:[[[0,2,3],[2,5,3]]],expected:[[0,3],[5,0]]},{args:[[[1,2,1]]],expected:[[1,1],[2,0]]},{args:[[[0,3,2],[1,2,5]]],expected:[[0,2],[1,5],[2,2],[3,0]]},{args:[[[1,5,3],[1,5,3],[2,4,1]]],expected:[[1,3],[5,0]]}],
  },
  {
    id:"dsa-int-min-interval-query",title:"Smallest Interval Containing Each Query",category:"Intervals & Sweepline",difficulty:"Hard",level:7,
    description:"You are given closed intervals [left, right] and a list of query points. For each query q, return the size (right − left + 1) of the smallest interval with left <= q <= right, or -1 if no interval contains q. Return the answers in the original query order.",
    constraints:["1 <= len(intervals) <= 100000", "1 <= len(queries) <= 100000", "1 <= left <= right <= 10^7", "1 <= q <= 10^7"],method:"minInterval",signature:"intervals: list[list[int]], queries: list[int]",
    intuition:"Answer queries offline in increasing order. Push every interval whose left end has been reached into a min-heap keyed by size, and pop intervals whose right end is already behind the query; the heap top is then the smallest interval covering it.",
    triggers:["Many point queries against many intervals", "Queries can be answered in any order and reassembled"],
    pitfalls:["Remember each query's original index before sorting.", "An interval popped for ending before q can never help a later (larger) query, so lazy removal is safe.", "Intervals are inclusive: size is right − left + 1."],
    time:"O((n + q) log n + q log q)",space:"O(n + q)",
    solution:`import heapq
class Solution:
    def minInterval(self, intervals: list[list[int]], queries: list[int]):
        intervals = sorted(intervals)
        answer = [-1] * len(queries)
        heap = []
        i = 0
        for q, index in sorted((q, index) for index, q in enumerate(queries)):
            while i < len(intervals) and intervals[i][0] <= q:
                left, right = intervals[i]
                heapq.heappush(heap, (right - left + 1, right))
                i += 1
            while heap and heap[0][1] < q:
                heapq.heappop(heap)
            if heap:
                answer[index] = heap[0][0]
        return answer
`,
    cases:[{args:[[[1,4],[2,4],[3,6],[4,4]],[2,3,4,5]],expected:[3,3,1,4]},{args:[[[2,3],[2,5],[1,8],[20,25]],[2,19,5,22]],expected:[2,-1,4,6]},{args:[[[1,1]],[1,2]],expected:[1,-1]},{args:[[[5,10]],[10,1,11]],expected:[6,-1,-1]},{args:[[[1,10],[3,4]],[4,4,9]],expected:[2,2,10]}],
  },
  {
    id:"dsa-advanced-swim",title:"Escape a Flooding Grid",category:"Advanced Graphs",difficulty:"Hard",level:7,
    description:"grid is an n × n map of elevations. At time t the water level everywhere is t, and you may move between 4-directionally adjacent cells whenever both cells have elevation at most t (moving takes no time). Starting in the top-left cell, return the earliest time at which you can reach the bottom-right cell.",
    constraints:["1 <= n <= 50", "0 <= grid[i][j] < n²", "All elevations are distinct."],method:"swimInWater",signature:"grid: list[list[int]]",
    intuition:"The time needed for a path is its highest elevation, so you want the path minimizing its maximum cell (a bottleneck path). Run Dijkstra where a path's cost is the maximum elevation seen so far; the first time the target is popped, its cost is the answer.",
    triggers:["Minimize the worst (maximum) value along a path", "A threshold must be high enough to connect two cells"],
    pitfalls:["The start cell's own elevation counts.", "Combine costs with max, not +.", "Binary search on t plus BFS, or Union Find adding cells in elevation order, are equivalent alternatives."],
    time:"O(n² log n)",space:"O(n²)",
    solution:`import heapq
class Solution:
    def swimInWater(self, grid: list[list[int]]):
        n = len(grid)
        heap = [(grid[0][0], 0, 0)]
        seen = {(0, 0)}
        while heap:
            level, r, c = heapq.heappop(heap)
            if r == n - 1 and c == n - 1:
                return level
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < n and 0 <= nc < n and (nr, nc) not in seen:
                    seen.add((nr, nc))
                    heapq.heappush(heap, (max(level, grid[nr][nc]), nr, nc))
        return -1
`,
    cases:[{args:[[[0,2],[1,3]]],expected:3},{args:[[[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]],expected:16},{args:[[[0]]],expected:0},{args:[[[3,2],[0,1]]],expected:3},{args:[[[0,1,2],[5,4,3],[6,7,8]]],expected:8}],
  },
  {
    id:"dsa-advanced-bridges",title:"Critical Connections in a Network",category:"Advanced Graphs",difficulty:"Hard",level:8,
    description:"A connected network has n servers labeled 0 to n − 1 and undirected connections [a, b] with no duplicates. A connection is critical if removing it disconnects some servers from others. Return all critical connections, each written as [u, v] with u < v, sorted in ascending order.",
    constraints:["2 <= n <= 100000", "n − 1 <= len(connections) <= 100000", "No self-loops or repeated connections; the network is connected."],method:"criticalConnections",signature:"n: int, connections: list[list[int]]",
    intuition:"Tarjan's bridge algorithm: during DFS, record each node's discovery time and low-link, the earliest discovery time reachable from its subtree using one back edge. Tree edge (parent, child) is a bridge exactly when low[child] > disc[parent]—the child's subtree has no other way back.",
    triggers:["Edges whose removal disconnects a graph", "Single points of failure in a network"],
    pitfalls:["Skip only the edge you arrived by, not every edge to the parent.", "Recursive DFS can exceed Python's recursion limit on long paths—use an explicit stack.", "Normalize each bridge to [min, max] and sort the result."],
    time:"O(n + e)",space:"O(n + e)",
    solution:`class Solution:
    def criticalConnections(self, n: int, connections: list[list[int]]):
        graph = [[] for _ in range(n)]
        for index, (a, b) in enumerate(connections):
            graph[a].append((b, index))
            graph[b].append((a, index))
        disc = [-1] * n
        low = [0] * n
        bridges = []
        timer = 0
        for root in range(n):
            if disc[root] != -1:
                continue
            disc[root] = low[root] = timer
            timer += 1
            stack = [(root, -1, iter(graph[root]))]
            while stack:
                node, via, neighbors = stack[-1]
                descended = False
                for neighbor, edge in neighbors:
                    if edge == via:
                        continue
                    if disc[neighbor] == -1:
                        disc[neighbor] = low[neighbor] = timer
                        timer += 1
                        stack.append((neighbor, edge, iter(graph[neighbor])))
                        descended = True
                        break
                    low[node] = min(low[node], disc[neighbor])
                if descended:
                    continue
                stack.pop()
                if stack:
                    parent = stack[-1][0]
                    low[parent] = min(low[parent], low[node])
                    if low[node] > disc[parent]:
                        bridges.append([min(parent, node), max(parent, node)])
        return sorted(bridges)
`,
    cases:[{args:[4,[[0,1],[1,2],[2,0],[1,3]]],expected:[[1,3]]},{args:[2,[[0,1]]],expected:[[0,1]]},{args:[3,[[0,1],[1,2],[2,0]]],expected:[]},{args:[6,[[0,1],[1,2],[2,0],[2,3],[3,4],[4,5],[5,3]]],expected:[[2,3]]},{args:[5,[[1,0],[2,1],[3,2],[4,3]]],expected:[[0,1],[1,2],[2,3],[3,4]]}],
  },
  {
    id:"dsa-graph-visit-all-nodes",title:"Shortest Walk Visiting Every Node",category:"Graphs & Shortest Path",difficulty:"Hard",level:8,
    description:"An undirected connected graph has n nodes labeled 0 to n − 1, given as an adjacency list: graph[i] lists the neighbors of node i. Return the length (number of edges) of the shortest walk that visits every node. You may start and end at any node and may reuse nodes and edges.",
    constraints:["1 <= n <= 12", "graph is undirected and connected; no self-loops."],method:"shortestPathLength",signature:"graph: list[list[int]]",
    intuition:"A position alone is not enough state—you also need the set of visited nodes. BFS over states (node, visited mask), starting from every node at once; the first state whose mask contains all nodes gives the shortest walk.",
    triggers:["Shortest walk that must cover all nodes", "Small n invites a bitmask in the BFS state"],
    pitfalls:["Mark (node, mask) pairs as seen, not nodes—revisiting a node with a new mask is progress.", "Start BFS from every node simultaneously because the start is free.", "A single node needs 0 edges."],
    time:"O(2^n · n²)",space:"O(2^n · n)",
    solution:`from collections import deque
class Solution:
    def shortestPathLength(self, graph: list[list[int]]):
        n = len(graph)
        full = (1 << n) - 1
        queue = deque((node, 1 << node, 0) for node in range(n))
        seen = {(node, 1 << node) for node in range(n)}
        while queue:
            node, mask, steps = queue.popleft()
            if mask == full:
                return steps
            for neighbor in graph[node]:
                state = (neighbor, mask | (1 << neighbor))
                if state not in seen:
                    seen.add(state)
                    queue.append((neighbor, state[1], steps + 1))
        return -1
`,
    cases:[{args:[[[1,2,3],[0],[0],[0]]],expected:4},{args:[[[1],[0,2,4],[1,3,4],[2],[1,2]]],expected:4},{args:[[[]]],expected:0},{args:[[[1],[0]]],expected:1},{args:[[[1],[0,2],[1,3],[2]]],expected:3}],
  },
  {
    id:"dsa-dp2-pattern-match",title:"Pattern Matching with Dot and Star",category:"2D Dynamic Programming",difficulty:"Hard",level:8,
    description:"Return whether the whole string s matches pattern p. In p, a letter matches itself, \".\" matches any single character, and \"*\" means zero or more repetitions of the element right before it. The match must cover all of s, not just part of it.",
    constraints:["0 <= len(s) <= 20", "1 <= len(p) <= 30", "s has lowercase letters; p has lowercase letters, \".\" and \"*\".", "Every \"*\" follows a letter or \".\"."],method:"isMatch",signature:"s: str, p: str",
    intuition:"Let dp[i][j] mean s[i:] matches p[j:]. If p[j + 1] is \"*\", either skip the pair p[j]p[j + 1] (zero copies) or, when s[i] matches p[j], consume one character of s and stay on the same pair. Otherwise the current characters must match and both pointers advance.",
    triggers:["Matching with wildcards or repetition operators", "Two sequences consumed from the front with choices"],
    pitfalls:["\"*\" applies to the element before it, so look ahead at p[j + 1].", "An empty s can still match patterns like \"a*b*\".", "Fill from the ends (i = len(s), j = len(p)) toward the start."],
    time:"O(len(s) × len(p))",space:"O(len(s) × len(p))",
    solution:`class Solution:
    def isMatch(self, s: str, p: str):
        m, n = len(s), len(p)
        dp = [[False] * (n + 1) for _ in range(m + 1)]
        dp[m][n] = True
        for i in range(m, -1, -1):
            for j in range(n - 1, -1, -1):
                first = i < m and p[j] in (s[i], ".")
                if j + 1 < n and p[j + 1] == "*":
                    dp[i][j] = dp[i][j + 2] or (first and dp[i + 1][j])
                else:
                    dp[i][j] = first and dp[i + 1][j + 1]
        return dp[0][0]
`,
    cases:[{args:["aa","a"],expected:false},{args:["aa","a*"],expected:true},{args:["ab",".*"],expected:true},{args:["aab","c*a*b"],expected:true},{args:["mississippi","mis*is*p*."],expected:false},{args:["","a*b*"],expected:true},{args:["ab",".*c"],expected:false}],
  },
  {
    id:"dsa-dp-longest-valid-parens",title:"Longest Well-Formed Parentheses Run",category:"1D Dynamic Programming",difficulty:"Hard",level:7,
    description:"Given a string of \"(\" and \")\" characters, return the length of the longest contiguous substring that is a well-formed (balanced and properly nested) parentheses sequence.",
    constraints:["0 <= len(s) <= 30000", "s contains only \"(\" and \")\"."],method:"longestValidParentheses",signature:"s: str",
    intuition:"Let dp[i] be the length of the longest valid run ending at i. A \")\" closes either the \"(\" just before it (dp[i − 2] + 2) or the \"(\" sitting just before the valid run that ends at i − 1; in the second case also append whatever valid run ends right before that \"(\".",
    triggers:["Longest valid or balanced substring", "Each position's answer extends one ending earlier"],
    pitfalls:["Only \")\" can end a valid run—dp is 0 at every \"(\".", "After matching an outer pair, join the valid run that ends just before it (\"()(())\" is 6).", "Guard every negative index."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def longestValidParentheses(self, s: str):
        dp = [0] * len(s)
        best = 0
        for i in range(1, len(s)):
            if s[i] == ")":
                if s[i - 1] == "(":
                    dp[i] = (dp[i - 2] if i >= 2 else 0) + 2
                else:
                    j = i - dp[i - 1] - 1
                    if j >= 0 and s[j] == "(":
                        dp[i] = dp[i - 1] + 2 + (dp[j - 1] if j >= 1 else 0)
                best = max(best, dp[i])
        return best
`,
    cases:[{args:["(()"],expected:2},{args:[")()())"],expected:4},{args:[""],expected:0},{args:["()(())"],expected:6},{args:["())(())"],expected:4},{args:["(((("],expected:0}],
  },
  {
    id:"dsa-greedy-candy",title:"Fewest Candies by Rating",category:"Greedy Algorithms",difficulty:"Hard",level:7,
    description:"Children stand in a line with integer ratings. Give each child at least one candy so that any child with a strictly higher rating than an adjacent child receives more candies than that neighbor. Return the minimum total number of candies.",
    constraints:["1 <= len(ratings) <= 20000", "0 <= ratings[i] <= 20000"],method:"candy",signature:"ratings: list[int]",
    intuition:"Handle the two neighbor constraints separately. A left-to-right pass satisfies \"more than the left neighbor\" with the smallest counts; a right-to-left pass raises counts where needed for \"more than the right neighbor\" while keeping the larger of the two requirements.",
    triggers:["Each element must exceed qualifying neighbors on both sides", "Minimum assignment under local ordering constraints"],
    pitfalls:["Equal neighbors impose no constraint—either may get fewer.", "In the second pass take max(current, right + 1); overwriting breaks the first pass's guarantee.", "A single pass in one direction is not enough for decreasing runs."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def candy(self, ratings: list[int]):
        n = len(ratings)
        candies = [1] * n
        for i in range(1, n):
            if ratings[i] > ratings[i - 1]:
                candies[i] = candies[i - 1] + 1
        for i in range(n - 2, -1, -1):
            if ratings[i] > ratings[i + 1]:
                candies[i] = max(candies[i], candies[i + 1] + 1)
        return sum(candies)
`,
    cases:[{args:[[1,0,2]],expected:5},{args:[[1,2,2]],expected:4},{args:[[5]],expected:1},{args:[[1,2,3,4]],expected:10},{args:[[3,2,1,2,3]],expected:11},{args:[[1,3,4,5,2]],expected:11}],
  },
  {
    id:"dsa-stack-window-max",title:"Sliding Window Maximum",category:"Stack & Monotonic Queue",difficulty:"Hard",level:7,
    description:"Slide a window of size k across nums from left to right one step at a time. Return the maximum value inside each window position, in order. Aim for O(n) time overall.",
    constraints:["1 <= k <= len(nums) <= 100000", "-10^4 <= nums[i] <= 10^4"],method:"maxSlidingWindow",signature:"nums: list[int], k: int",
    intuition:"Keep a deque of indices whose values are strictly decreasing. A new value removes smaller-or-equal values from the back (they can never be a future maximum), the front leaves once it falls out of the window, and the front is always the current maximum.",
    triggers:["Maximum or minimum of every fixed-size window", "Older, smaller candidates become useless once a larger value arrives"],
    pitfalls:["Store indices, not values, so you can tell when the front has expired.", "Record an answer only once the first full window is formed (i >= k − 1).", "A heap also works but costs O(n log n) and needs lazy deletion."],
    time:"O(n) — each index enters and leaves the deque once",space:"O(k)",
    solution:`from collections import deque
class Solution:
    def maxSlidingWindow(self, nums: list[int], k: int):
        window = deque()
        result = []
        for i, value in enumerate(nums):
            while window and nums[window[-1]] <= value:
                window.pop()
            window.append(i)
            if window[0] <= i - k:
                window.popleft()
            if i >= k - 1:
                result.append(nums[window[0]])
        return result
`,
    cases:[{args:[[1,3,-1,-3,5,3,6,7],3],expected:[3,3,5,5,6,7]},{args:[[1],1],expected:[1]},{args:[[9,8,7,6],2],expected:[9,8,7]},{args:[[4,2,12,3],4],expected:[12]},{args:[[2,2,2],2],expected:[2,2]}],
  },
  {
    id:"dsa-bs-split-array",title:"Split Array to Minimize the Largest Sum",category:"Binary Search",difficulty:"Hard",level:7,
    description:"Split nums into exactly k non-empty contiguous parts. Among all possible splits, return the smallest achievable value of the largest part sum.",
    constraints:["1 <= len(nums) <= 1000", "0 <= nums[i] <= 10^6", "1 <= k <= min(50, len(nums))"],method:"splitArray",signature:"nums: list[int], k: int",
    intuition:"Binary search on the answer. For a limit L, greedily extend the current part until the next number would exceed L; the number of parts this needs only decreases as L grows. The answer is the smallest L (between max(nums) and sum(nums)) needing at most k parts.",
    triggers:["Minimize a maximum (or maximize a minimum)", "Feasibility of a candidate answer is easy to check greedily"],
    pitfalls:["The lower bound is max(nums), not 0—no part can be smaller than its largest element.", "Needing fewer than k parts is fine: any part can be split further.", "Use the lower-bound form of binary search so the answer is the smallest feasible limit."],
    time:"O(n log(sum(nums)))",space:"O(1)",
    solution:`class Solution:
    def splitArray(self, nums: list[int], k: int):
        def parts_needed(limit):
            parts, current = 1, 0
            for num in nums:
                if current + num > limit:
                    parts += 1
                    current = num
                else:
                    current += num
            return parts
        low, high = max(nums), sum(nums)
        while low < high:
            mid = (low + high) // 2
            if parts_needed(mid) <= k:
                high = mid
            else:
                low = mid + 1
        return low
`,
    cases:[{args:[[7,2,5,10,8],2],expected:18},{args:[[1,2,3,4,5],2],expected:9},{args:[[1,4,4],3],expected:4},{args:[[5],1],expected:5},{args:[[0,0,0],2],expected:0},{args:[[2,3,1,2,4,3],5],expected:4}],
  },
];

export const HARD_PLUS_PROBLEMS = problems.map(makeProblem);
