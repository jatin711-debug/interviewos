import { DSAProblem, DSACategory } from "./types";

export type CoreSpec = {
  id: string; title: string; category: DSACategory; difficulty: DSAProblem["difficulty"]; level: number;
  description: string; constraints: string[]; method: string; signature: string;
  intuition: string; triggers: string[]; pitfalls: string[]; time: string; space: string;
  solution: string; cases: Array<{ args: unknown[]; expected: unknown }>;
};

const PATTERN_TEMPLATES: Partial<Record<DSACategory, string>> = {
  "Arrays & Hashing": "seen = {}\nfor value in values:\n    # Update or look up the information you need.\n    ...",
  "Graphs & Shortest Path": "from collections import deque\nqueue = deque([start])\nseen = {start}\nwhile queue:\n    node = queue.popleft()\n    # Add unseen neighbors, marking them when queued.",
  "Prefix Sums": "prefix = 0\nfor value in values:\n    prefix += value\n    # Use the current prefix to update your answer.",
  "Sorting": "# Divide into smaller parts, solve them, then combine.\n# Or partition the input around a useful boundary.",
  "Bit Manipulation": "# Isolate a bit with x & 1; shift with x >> 1.\n# XOR cancels matching values: x ^ x == 0.",
  "Math & Number Theory": "# Find an invariant, reduce the problem, and handle zero.\n# For GCD, replace (a, b) with (b, a % b).",
  "Union Find": "# Find the representative of each endpoint.\n# If roots differ, connect them and update the component count.",
  "Segment & Fenwick Trees": "tree = [0] * (n + 1)  # 1-indexed Fenwick tree\ndef add(i, delta):\n    while i <= n:\n        tree[i] += delta\n        i += i & -i\ndef prefix(i):  # sum of the first i values\n    total = 0\n    while i > 0:\n        total += tree[i]\n        i -= i & -i\n    return total",
  "String Algorithms": "pi = [0] * len(s)  # pi[i]: longest proper border of s[:i + 1]\nfor i in range(1, len(s)):\n    k = pi[i - 1]\n    while k and s[i] != s[k]:\n        k = pi[k - 1]  # fall back to a shorter border\n    pi[i] = k + (s[i] == s[k])",
  "Advanced DP": "# State over a subset, an interval, or a tree node, e.g. dp[mask][last].\nfor mask in range(1 << n):  # fill smaller states first\n    for last in range(n):\n        # Extend the state by one more choice and relax the target state.\n        ...",
};

// These exercises share a runner so examples and executable cases stay in sync.
export function makeProblem(s: CoreSpec): DSAProblem {
  const starterCode = `class Solution:\n    def ${s.method}(self, ${s.signature}):\n        # Write your solution here\n        pass\n`;
  const cases = JSON.stringify(s.cases);
  return {
    id: s.id, slug: s.id.replace(/^dsa-/, ""), title: s.title, category: s.category,
    level: s.level, difficulty: s.difficulty, acceptanceRate: "—", description: s.description,
    constraints: s.constraints,
    examples: s.cases.slice(0, 2).map(c => ({ input: JSON.stringify(c.args), output: JSON.stringify(c.expected) })),
    patternIntuition: { ruleOfThumb: s.intuition, recognitionTriggers: s.triggers, commonPitfalls: s.pitfalls, templateSnippet: PATTERN_TEMPLATES[s.category] || "# Define your state and invariant before coding." },
    timeComplexity: s.time, spaceComplexity: s.space, starterCode, solutionCode: s.solution,
    testCases: s.cases.map((c, i) => ({ id: i + 1, inputDesc: JSON.stringify(c.args), expectedDesc: JSON.stringify(c.expected), args: c.args, expected: c.expected })),
    runWrapper: userCode => `import json\n${userCode}\ncases = json.loads(${JSON.stringify(cases)})\nresults = []\nfor i, case in enumerate(cases):\n    try:\n        actual = getattr(Solution(), ${JSON.stringify(s.method)})(*case["args"])\n        passed = actual == case["expected"]\n        results.append({"testCase": i + 1, "passed": passed, "actual": actual, "expected": case["expected"]})\n    except Exception as exc:\n        results.append({"testCase": i + 1, "passed": False, "error": str(exc)})\nprint("JSON_OUTPUT_START")\nprint(json.dumps({"allPassed": all(r["passed"] for r in results), "results": results}))\nprint("JSON_OUTPUT_END")\n`,
  };
}

const specs: CoreSpec[] = [
  {
    id:"dsa-core-product-except-self", title:"Product of Array Except Self", category:"Arrays & Hashing", difficulty:"Medium", level:3,
    description:"Return an array where each element is the product of all other input elements. Do not use division.", constraints:["2 <= len(nums) <= 10000", "Values may be zero or negative."], method:"productExceptSelf", signature:"nums: list[int]",
    intuition:"Build the product to the left of each position, then multiply by a running product from the right.", triggers:["Each answer excludes its own element", "Division is unavailable or zeros are present"], pitfalls:["Handle multiple zeros.","Exclude the current element from both products."], time:"O(n)", space:"O(1) auxiliary space, excluding output",
    solution:`class Solution:\n    def productExceptSelf(self, nums: list[int]):\n        result = [1] * len(nums)\n        prefix = 1\n        for i, num in enumerate(nums):\n            result[i] = prefix\n            prefix *= num\n        suffix = 1\n        for i in range(len(nums) - 1, -1, -1):\n            result[i] *= suffix\n            suffix *= nums[i]\n        return result\n`,
    cases:[{args:[[1,2,3,4]],expected:[24,12,8,6]},{args:[[-1,1,0,-3,3]],expected:[0,0,9,0,0]},{args:[[0,0]],expected:[0,0]},{args:[[2,-3]],expected:[-3,2]}],
  },
  {
    id:"dsa-core-longest-consecutive", title:"Longest Consecutive Sequence", category:"Arrays & Hashing", difficulty:"Medium", level:3,
    description:"Return the length of the longest sequence of consecutive integers in an unsorted array. Aim for O(n) average time.", constraints:["0 <= len(nums) <= 100000", "Values may be negative or repeated."], method:"longestConsecutive", signature:"nums: list[int]",
    intuition:"Put values in a set and start counting only at values with no predecessor.", triggers:["Unsorted consecutive values", "Fast membership lookup"], pitfalls:["Only scan from the start of a sequence to avoid repeated work.","Duplicates do not extend a sequence."], time:"O(n) average", space:"O(n)",
    solution:`class Solution:\n    def longestConsecutive(self, nums: list[int]):\n        values = set(nums)\n        best = 0\n        for value in values:\n            if value - 1 not in values:\n                end = value\n                while end in values:\n                    end += 1\n                best = max(best, end - value)\n        return best\n`,
    cases:[{args:[[100,4,200,1,3,2]],expected:4},{args:[[0,3,7,2,5,8,4,6,0,1]],expected:9},{args:[[]],expected:0},{args:[[-1,-2,-2,1]],expected:2}],
  },
  {
    id:"dsa-core-first-unique", title:"First Unique Character", category:"Arrays & Hashing", difficulty:"Easy", level:1,
    description:"Return the index of the first character that appears exactly once in a string, or -1 if no such character exists.", constraints:["0 <= len(s) <= 100000", "s contains lowercase English letters."], method:"firstUniqChar", signature:"s: str",
    intuition:"Count frequencies in one pass and find the first count of one in a second pass.", triggers:["Frequency plus original order", "First non-repeating element"], pitfalls:["Return the index, not the character.","Handle an empty string."], time:"O(n)", space:"O(1) for a fixed alphabet",
    solution:`class Solution:\n    def firstUniqChar(self, s: str):\n        counts = {}\n        for char in s:\n            counts[char] = counts.get(char, 0) + 1\n        for i, char in enumerate(s):\n            if counts[char] == 1:\n                return i\n        return -1\n`,
    cases:[{args:["leetcode"],expected:0},{args:["loveleetcode"],expected:2},{args:["aabb"],expected:-1},{args:[""],expected:-1}],
  },
  {
    id:"dsa-core-bfs-distance", title:"Shortest Path in an Unweighted Graph", category:"Graphs & Shortest Path", difficulty:"Medium", level:4,
    description:"Given n nodes labeled 0 to n-1, undirected edges, and a source, return the shortest distance in edges from the source to every node. Use -1 for unreachable nodes.", constraints:["1 <= n <= 10000", "All node labels are valid."], method:"shortestDistances", signature:"n: int, edges: list[list[int]], source: int",
    intuition:"BFS visits nodes in increasing distance, so the first visit gives the shortest unweighted path.", triggers:["Shortest path in an unweighted graph", "Minimum number of steps"], pitfalls:["Mark nodes visited when enqueuing.","Keep unreachable nodes at -1."], time:"O(n + e)", space:"O(n + e)",
    solution:`from collections import deque\nclass Solution:\n    def shortestDistances(self, n: int, edges: list[list[int]], source: int):\n        graph = [[] for _ in range(n)]\n        for a, b in edges:\n            graph[a].append(b)\n            graph[b].append(a)\n        dist = [-1] * n\n        dist[source] = 0\n        queue = deque([source])\n        while queue:\n            node = queue.popleft()\n            for neighbor in graph[node]:\n                if dist[neighbor] == -1:\n                    dist[neighbor] = dist[node] + 1\n                    queue.append(neighbor)\n        return dist\n`,
    cases:[{args:[5,[[0,1],[1,2],[0,3]],0],expected:[0,1,2,1,-1]},{args:[1,[],0],expected:[0]},{args:[3,[[0,1],[1,2],[2,0]],2],expected:[1,1,0]}],
  },
  {
    id:"dsa-core-dijkstra", title:"Dijkstra's Shortest Paths", category:"Graphs & Shortest Path", difficulty:"Medium", level:5,
    description:"Given n nodes, directed edges [from, to, weight], and a source, return the minimum distance to every node. Return -1 for unreachable nodes.", constraints:["1 <= n <= 10000", "Edge weights are non-negative integers."], method:"shortestPaths", signature:"n: int, edges: list[list[int]], source: int",
    intuition:"Expand the unsettled node with the smallest known distance and relax its outgoing edges.", triggers:["Weighted shortest paths", "Non-negative edge weights"], pitfalls:["Ignore stale heap entries.","Dijkstra does not support negative edge weights."], time:"O((n + e) log n) with a binary heap", space:"O(n + e)",
    solution:`import heapq\nclass Solution:\n    def shortestPaths(self, n: int, edges: list[list[int]], source: int):\n        graph = [[] for _ in range(n)]\n        for a, b, weight in edges:\n            graph[a].append((b, weight))\n        dist = [float('inf')] * n\n        dist[source] = 0\n        heap = [(0, source)]\n        while heap:\n            distance, node = heapq.heappop(heap)\n            if distance != dist[node]:\n                continue\n            for neighbor, weight in graph[node]:\n                candidate = distance + weight\n                if candidate < dist[neighbor]:\n                    dist[neighbor] = candidate\n                    heapq.heappush(heap, (candidate, neighbor))\n        return [-1 if d == float('inf') else d for d in dist]\n`,
    cases:[{args:[4,[[0,1,4],[0,2,1],[2,1,2],[1,3,1],[2,3,5]],0],expected:[0,3,1,4]},{args:[3,[[0,1,0]],0],expected:[0,0,-1]},{args:[1,[],0],expected:[0]}],
  },
  {
    id: "dsa-prefix-running-sum", title: "Running Sum of an Array", category: "Prefix Sums", difficulty: "Easy", level: 1,
    description: "Return an array where each element is the sum of all input elements up to and including that position.", constraints: ["1 <= len(nums) <= 1000", "Elements may be negative."], method: "runningSum", signature: "nums: list[int]",
    intuition: "Carry a running total so each prefix is computed once.", triggers: ["Cumulative totals", "Repeated prefix calculations"], pitfalls: ["Do not reset the total on negative values."], time: "O(n)", space: "O(n) for the output",
    solution: `class Solution:\n    def runningSum(self, nums: list[int]):\n        total = 0\n        result = []\n        for num in nums:\n            total += num\n            result.append(total)\n        return result\n`,
    cases: [{args:[[1,2,3,4]],expected:[1,3,6,10]},{args:[[-2,3,-1]],expected:[-2,1,0]},{args:[[5]],expected:[5]}],
  },
  {
    id:"dsa-prefix-subarray-sum", title:"Subarray Sum Equals K", category:"Prefix Sums", difficulty:"Medium", level:3,
    description:"Count contiguous non-empty subarrays whose sum equals k. Numbers may be negative.", constraints:["1 <= len(nums) <= 20000", "Numbers and k are integers."], method:"subarraySum", signature:"nums: list[int], k: int",
    intuition:"A subarray ending here sums to k when an earlier prefix equals current prefix minus k.", triggers:["Count subarrays with a target sum", "Negative values rule out a simple sliding window"], pitfalls:["Seed the empty prefix with frequency one.","Count repeated prefix sums."], time:"O(n)", space:"O(n)",
    solution:`class Solution:\n    def subarraySum(self, nums: list[int], k: int):\n        counts = {0: 1}\n        total = answer = 0\n        for num in nums:\n            total += num\n            answer += counts.get(total - k, 0)\n            counts[total] = counts.get(total, 0) + 1\n        return answer\n`,
    cases:[{args:[[1,1,1],2],expected:2},{args:[[1,-1,0],0],expected:3},{args:[[3],3],expected:1},{args:[[1,2,3],7],expected:0}],
  },
  {
    id:"dsa-prefix-pivot", title:"Find Pivot Index", category:"Prefix Sums", difficulty:"Easy", level:2,
    description:"Return the leftmost index where the sum to its left equals the sum to its right, or -1 if none exists.", constraints:["1 <= len(nums) <= 10000", "Values may be negative."], method:"pivotIndex", signature:"nums: list[int]",
    intuition:"Track the left sum; the right sum is total minus left minus the current value.", triggers:["Balance around an index", "Repeated left and right sums"], pitfalls:["Exclude the pivot itself.","Return the leftmost valid pivot."], time:"O(n)", space:"O(1)",
    solution:`class Solution:\n    def pivotIndex(self, nums: list[int]):\n        total = sum(nums)\n        left = 0\n        for i, num in enumerate(nums):\n            if left == total - left - num:\n                return i\n            left += num\n        return -1\n`,
    cases:[{args:[[1,7,3,6,5,6]],expected:3},{args:[[1,2,3]],expected:-1},{args:[[2,1,-1]],expected:0},{args:[[0]],expected:0}],
  },
  {
    id:"dsa-sorting-merge", title:"Merge Sort", category:"Sorting", difficulty:"Medium", level:3,
    description:"Return the integers in ascending order using merge sort. Duplicates and negative values are allowed.", constraints:["0 <= len(nums) <= 10000"], method:"sortArray", signature:"nums: list[int]",
    intuition:"Sort two halves recursively, then merge their sorted results with two pointers.", triggers:["Stable divide-and-conquer sorting", "Guaranteed O(n log n) worst case"], pitfalls:["Copy the remaining tail after one half is exhausted."], time:"O(n log n)", space:"O(n) auxiliary space",
    solution:`class Solution:\n    def sortArray(self, nums: list[int]):\n        if len(nums) <= 1:\n            return nums[:]\n        mid = len(nums) // 2\n        left = self.sortArray(nums[:mid])\n        right = self.sortArray(nums[mid:])\n        result = []\n        i = j = 0\n        while i < len(left) and j < len(right):\n            if left[i] <= right[j]:\n                result.append(left[i]); i += 1\n            else:\n                result.append(right[j]); j += 1\n        return result + left[i:] + right[j:]\n`,
    cases:[{args:[[5,2,3,1]],expected:[1,2,3,5]},{args:[[5,-1,5,0]],expected:[-1,0,5,5]},{args:[[]],expected:[]},{args:[[1]],expected:[1]}],
  },
  {
    id:"dsa-sorting-colors", title:"Sort Colors", category:"Sorting", difficulty:"Medium", level:3,
    description:"Return the array sorted in ascending order. Each element is 0, 1, or 2. Aim for one pass and constant extra space.", constraints:["1 <= len(nums) <= 300", "Every element is 0, 1, or 2."], method:"sortColors", signature:"nums: list[int]",
    intuition:"Partition the array into known zeros, ones, unknowns, and twos using three pointers.", triggers:["Three distinct values", "In-place partitioning"], pitfalls:["After swapping with the high pointer, inspect the incoming value before advancing."], time:"O(n)", space:"O(1) auxiliary space",
    solution:`class Solution:\n    def sortColors(self, nums: list[int]):\n        low = mid = 0\n        high = len(nums) - 1\n        while mid <= high:\n            if nums[mid] == 0:\n                nums[low], nums[mid] = nums[mid], nums[low]\n                low += 1; mid += 1\n            elif nums[mid] == 1:\n                mid += 1\n            else:\n                nums[mid], nums[high] = nums[high], nums[mid]\n                high -= 1\n        return nums\n`,
    cases:[{args:[[2,0,2,1,1,0]],expected:[0,0,1,1,2,2]},{args:[[2,0,1]],expected:[0,1,2]},{args:[[2,2,0]],expected:[0,2,2]},{args:[[1]],expected:[1]}],
  },
  {
    id:"dsa-sorting-inversions", title:"Count Inversions", category:"Sorting", difficulty:"Hard", level:8,
    description:"Count pairs of indices (i, j) such that i < j and nums[i] > nums[j].", constraints:["0 <= len(nums) <= 10000"], method:"countInversions", signature:"nums: list[int]",
    intuition:"During merge sort, choosing an element from the right before the left counts every remaining left element as an inversion.", triggers:["Count out-of-order pairs", "Need better than quadratic time"], pitfalls:["Equal values are not inversions.","Count all remaining left elements, not just one."], time:"O(n log n)", space:"O(n)",
    solution:`class Solution:\n    def countInversions(self, nums: list[int]):\n        def sort(a):\n            if len(a) < 2:\n                return a, 0\n            mid = len(a) // 2\n            left, x = sort(a[:mid])\n            right, y = sort(a[mid:])\n            i = j = 0\n            merged = []\n            count = x + y\n            while i < len(left) and j < len(right):\n                if left[i] <= right[j]:\n                    merged.append(left[i]); i += 1\n                else:\n                    merged.append(right[j]); j += 1\n                    count += len(left) - i\n            return merged + left[i:] + right[j:], count\n        return sort(nums)[1]\n`,
    cases:[{args:[[2,4,1,3,5]],expected:3},{args:[[3,2,1]],expected:3},{args:[[1,1,1]],expected:0},{args:[[]],expected:0}],
  },
  {
    id:"dsa-bit-single", title:"Single Number", category:"Bit Manipulation", difficulty:"Easy", level:1,
    description:"Every integer appears twice except one. Return the integer that appears once, using constant extra space.", constraints:["1 <= len(nums) <= 30000", "Exactly one value occurs once; all others occur twice."], method:"singleNumber", signature:"nums: list[int]",
    intuition:"XOR cancels equal values and leaves the unpaired value.", triggers:["Pairs cancel out", "Constant-space parity tracking"], pitfalls:["Initialize the XOR accumulator to zero."], time:"O(n)", space:"O(1)",
    solution:`class Solution:\n    def singleNumber(self, nums: list[int]):\n        result = 0\n        for num in nums:\n            result ^= num\n        return result\n`,
    cases:[{args:[[2,2,1]],expected:1},{args:[[4,1,2,1,2]],expected:4},{args:[[-1,3,3]],expected:-1}],
  },
  {
    id:"dsa-bit-count", title:"Counting Bits", category:"Bit Manipulation", difficulty:"Easy", level:2,
    description:"For every integer from 0 through n, return the number of set bits in its binary representation.", constraints:["0 <= n <= 100000"], method:"countBits", signature:"n: int",
    intuition:"The set-bit count of i is the count of i shifted right, plus its low bit.", triggers:["Answers for all numbers up to n", "Reuse a smaller bit-count result"], pitfalls:["Include zero and n in the output."], time:"O(n)", space:"O(n) for the output",
    solution:`class Solution:\n    def countBits(self, n: int):\n        counts = [0] * (n + 1)\n        for i in range(1, n + 1):\n            counts[i] = counts[i >> 1] + (i & 1)\n        return counts\n`,
    cases:[{args:[2],expected:[0,1,1]},{args:[5],expected:[0,1,1,2,1,2]},{args:[0],expected:[0]}],
  },
  {
    id:"dsa-bit-missing", title:"Missing Number", category:"Bit Manipulation", difficulty:"Easy", level:2,
    description:"Given n distinct integers from 0 through n, return the one missing integer.", constraints:["1 <= n <= 10000", "Values are distinct and in [0, n]."], method:"missingNumber", signature:"nums: list[int]",
    intuition:"XOR all indices and values; matching numbers cancel, leaving the missing value.", triggers:["One missing member of a known range", "Constant extra space"], pitfalls:["Include n in the XOR as well as indices 0 through n-1."], time:"O(n)", space:"O(1)",
    solution:`class Solution:\n    def missingNumber(self, nums: list[int]):\n        result = len(nums)\n        for i, num in enumerate(nums):\n            result ^= i ^ num\n        return result\n`,
    cases:[{args:[[3,0,1]],expected:2},{args:[[0,1]],expected:2},{args:[[1]],expected:0},{args:[[0]],expected:1}],
  },
  {
    id:"dsa-math-gcd", title:"Greatest Common Divisor", category:"Math & Number Theory", difficulty:"Easy", level:1,
    description:"Return the greatest common divisor of two non-negative integers. Define gcd(0, 0) as 0.", constraints:["0 <= a, b <= 10^9"], method:"gcd", signature:"a: int, b: int",
    intuition:"The Euclidean algorithm repeatedly replaces (a, b) with (b, a mod b).", triggers:["Common divisors", "Reducing fractions"], pitfalls:["Handle zero without dividing by zero."], time:"O(log min(a, b)) for positive inputs", space:"O(1)",
    solution:`class Solution:\n    def gcd(self, a: int, b: int):\n        while b:\n            a, b = b, a % b\n        return a\n`,
    cases:[{args:[48,18],expected:6},{args:[0,7],expected:7},{args:[0,0],expected:0},{args:[17,13],expected:1}],
  },
  {
    id:"dsa-math-power", title:"Power by Squaring", category:"Math & Number Theory", difficulty:"Medium", level:3,
    description:"Compute x raised to a non-negative integer exponent n using exponentiation by squaring.", constraints:["-10 <= x <= 10", "0 <= n <= 30", "x and n are integers."], method:"power", signature:"x: int, n: int",
    intuition:"Square the base and halve the exponent; multiply the answer when the current exponent is odd.", triggers:["Large integer exponent", "Repeated squaring"], pitfalls:["Any number to exponent zero is one.","Update the exponent each iteration."], time:"O(log n)", space:"O(1)",
    solution:`class Solution:\n    def power(self, x: int, n: int):\n        result = 1\n        while n:\n            if n & 1:\n                result *= x\n            x *= x\n            n //= 2\n        return result\n`,
    cases:[{args:[2,10],expected:1024},{args:[-2,3],expected:-8},{args:[0,0],expected:1},{args:[5,0],expected:1}],
  },
  {
    id:"dsa-math-primes", title:"Count Primes", category:"Math & Number Theory", difficulty:"Medium", level:3,
    description:"Count prime numbers strictly less than n using the sieve of Eratosthenes.", constraints:["0 <= n <= 100000"], method:"countPrimes", signature:"n: int",
    intuition:"Mark multiples of each prime starting at its square; smaller multiples were already marked.", triggers:["Find all primes below a bound", "Many primality answers in a range"], pitfalls:["Zero and one are not prime.","The upper bound is exclusive."], time:"O(n log log n)", space:"O(n)",
    solution:`class Solution:\n    def countPrimes(self, n: int):\n        if n <= 2:\n            return 0\n        prime = [True] * n\n        prime[0] = prime[1] = False\n        p = 2\n        while p * p < n:\n            if prime[p]:\n                for multiple in range(p * p, n, p):\n                    prime[multiple] = False\n            p += 1\n        return sum(prime)\n`,
    cases:[{args:[10],expected:4},{args:[2],expected:0},{args:[3],expected:1},{args:[0],expected:0}],
  },
  {
    id:"dsa-uf-components", title:"Number of Connected Components", category:"Union Find", difficulty:"Medium", level:4,
    description:"Given n nodes labeled 0 to n-1 and undirected edges, return the number of connected components.", constraints:["1 <= n <= 2000", "Each edge contains two valid node labels."], method:"countComponents", signature:"n: int, edges: list[list[int]]",
    intuition:"Start with one component per node; each union of different roots reduces the count by one.", triggers:["Undirected connectivity", "Repeated merges"], pitfalls:["Duplicate edges must not decrement the count twice."], time:"O((n + e) α(n)) amortized", space:"O(n)",
    solution:`class Solution:\n    def countComponents(self, n: int, edges: list[list[int]]):\n        parent = list(range(n))\n        size = [1] * n\n        def find(x):\n            while x != parent[x]:\n                parent[x] = parent[parent[x]]\n                x = parent[x]\n            return x\n        count = n\n        for a, b in edges:\n            a, b = find(a), find(b)\n            if a != b:\n                if size[a] < size[b]:\n                    a, b = b, a\n                parent[b] = a\n                size[a] += size[b]\n                count -= 1\n        return count\n`,
    cases:[{args:[5,[[0,1],[1,2],[3,4]]],expected:2},{args:[3,[]],expected:3},{args:[2,[[0,1],[0,1]]],expected:1},{args:[1,[]],expected:1}],
  },
  {
    id:"dsa-uf-redundant", title:"Redundant Connection", category:"Union Find", difficulty:"Medium", level:4,
    description:"Edges form a tree on nodes 1 through n plus one extra edge. Return the first edge whose addition creates a cycle.", constraints:["3 <= n <= 1000", "The input is a tree plus one extra undirected edge."], method:"findRedundantConnection", signature:"edges: list[list[int]]",
    intuition:"An edge creates a cycle when both endpoints already have the same root.", triggers:["Detect a cycle in incremental undirected edges", "Connectivity queries"], pitfalls:["The nodes are labeled from 1 through n."], time:"O(n α(n)) amortized", space:"O(n)",
    solution:`class Solution:\n    def findRedundantConnection(self, edges: list[list[int]]):\n        parent = list(range(len(edges) + 1))\n        size = [1] * len(parent)\n        def find(x):\n            while x != parent[x]:\n                parent[x] = parent[parent[x]]\n                x = parent[x]\n            return x\n        for a, b in edges:\n            ra, rb = find(a), find(b)\n            if ra == rb:\n                return [a, b]\n            if size[ra] < size[rb]:\n                ra, rb = rb, ra\n            parent[rb] = ra\n            size[ra] += size[rb]\n        return []\n`,
    cases:[{args:[[[1,2],[1,3],[2,3]]],expected:[2,3]},{args:[[[1,2],[2,3],[3,4],[1,4],[1,5]]],expected:[1,4]}],
  },
  {
    id:"dsa-uf-provinces", title:"Number of Provinces", category:"Union Find", difficulty:"Medium", level:4,
    description:"Given a symmetric adjacency matrix of directly connected cities, count the groups connected directly or indirectly.", constraints:["1 <= n <= 200", "Matrix is symmetric with ones on the diagonal."], method:"findCircleNum", signature:"connected: list[list[int]]",
    intuition:"Union cities connected by each edge; count successful merges.", triggers:["Connectivity from an adjacency matrix", "Group membership"], pitfalls:["Inspect only one triangle of the symmetric matrix."], time:"O(n² α(n)) amortized", space:"O(n)",
    solution:`class Solution:\n    def findCircleNum(self, connected: list[list[int]]):\n        n = len(connected)\n        parent = list(range(n))\n        size = [1] * n\n        def find(x):\n            while parent[x] != x:\n                parent[x] = parent[parent[x]]\n                x = parent[x]\n            return x\n        count = n\n        for i in range(n):\n            for j in range(i + 1, n):\n                if connected[i][j]:\n                    a, b = find(i), find(j)\n                    if a != b:\n                        if size[a] < size[b]:\n                            a, b = b, a\n                        parent[b] = a\n                        size[a] += size[b]\n                        count -= 1\n        return count\n`,
    cases:[{args:[[[1,1,0],[1,1,0],[0,0,1]]],expected:2},{args:[[[1,0,0],[0,1,0],[0,0,1]]],expected:3},{args:[[[1]]],expected:1}],
  },
];

export const CORE_PROBLEMS = specs.map(makeProblem);
