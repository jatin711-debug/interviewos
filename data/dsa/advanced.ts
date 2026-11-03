import { makeProblem, type CoreSpec } from "./core";

// Advanced techniques: Segment & Fenwick Trees, String Algorithms, and Advanced DP.
// Original prompts; one list of cases drives the displayed examples and the Python runner.
// Trees are passed as edge lists so every input stays JSON-friendly.
const problems: CoreSpec[] = [
  // ── Segment & Fenwick Trees ─────────────────────────────────────────────────
  {
    id:"dsa-fenwick-range-sum",title:"Range Sums with Point Updates",category:"Segment & Fenwick Trees",difficulty:"Medium",level:5,
    description:"Process a list of operations on nums in order. [\"set\", i, value] replaces nums[i] with value. [\"sum\", left, right] asks for nums[left] + … + nums[right] (inclusive). Return the answers to the \"sum\" operations in order. Aim for O(log n) per operation.",
    constraints:["1 <= len(nums) <= 30000", "0 <= len(operations) <= 30000", "Indices are valid and left <= right.", "Values may be negative."],method:"rangeSumQueries",signature:"nums: list[int], operations: list[list]",
    intuition:"A Fenwick tree (binary indexed tree) stores sums of blocks whose sizes are powers of two. Adding i & -i jumps to the next block that covers index i, and subtracting it walks the blocks that make up a prefix, so both a point update and a prefix sum touch O(log n) cells.",
    triggers:["Range-sum queries interleaved with point updates", "A static prefix-sum array would need O(n) rebuilds"],
    pitfalls:["Fenwick trees are 1-indexed internally; shift input indices by one.", "\"set\" is an assignment: add the difference from the current value, and keep the current values to compute it.", "Range sum = prefix(right + 1) − prefix(left) with 1-indexed prefixes."],
    time:"O((n + q) log n)",space:"O(n)",
    solution:`class Solution:
    def rangeSumQueries(self, nums: list[int], operations: list[list]):
        n = len(nums)
        tree = [0] * (n + 1)
        def add(i, delta):
            i += 1
            while i <= n:
                tree[i] += delta
                i += i & -i
        def prefix(count):
            total = 0
            while count > 0:
                total += tree[count]
                count -= count & -count
            return total
        values = nums[:]
        for i, value in enumerate(values):
            add(i, value)
        answers = []
        for op in operations:
            if op[0] == "set":
                _, i, value = op
                add(i, value - values[i])
                values[i] = value
            else:
                _, left, right = op
                answers.append(prefix(right + 1) - prefix(left))
        return answers
`,
    cases:[{args:[[1,3,5],[["sum",0,2],["set",1,2],["sum",0,2]]],expected:[9,8]},{args:[[5],[["sum",0,0],["set",0,-2],["sum",0,0]]],expected:[5,-2]},{args:[[0,0,0,0],[["set",3,7],["sum",1,3],["sum",0,2]]],expected:[7,0]},{args:[[2,-1,4,6,3],[["sum",1,3],["set",2,0],["sum",1,3],["sum",3,4],["set",4,10],["sum",0,4]]],expected:[9,5,9,17]},{args:[[1,2],[]],expected:[]}],
  },
  {
    id:"dsa-segment-range-min",title:"Range Minimum with Point Updates",category:"Segment & Fenwick Trees",difficulty:"Medium",level:6,
    description:"Process a list of operations on nums in order. [\"set\", i, value] replaces nums[i] with value. [\"min\", left, right] asks for the smallest of nums[left..right] (inclusive). Return the answers to the \"min\" operations in order. Aim for O(log n) per operation.",
    constraints:["1 <= len(nums) <= 30000", "0 <= len(operations) <= 30000", "Indices are valid and left <= right."],method:"rangeMinQueries",signature:"nums: list[int], operations: list[list]",
    intuition:"A segment tree stores the minimum of each node's range, with leaves holding the array. A query combines the O(log n) nodes that exactly tile [left, right]; an update rewrites one leaf and recomputes only its ancestors. The iterative layout puts leaves at tree[n:] and the parent of i at i // 2.",
    triggers:["Range minimum or maximum with updates", "The combining operation has no inverse, so prefix differences do not work"],
    pitfalls:["Minimum is not invertible—min(left..right) cannot be derived from two prefix minimums, so a plain Fenwick tree does not apply.", "Keep half-open bounds [left, right + 1) consistent in the iterative query loop.", "After an update, recompute every ancestor up to the root."],
    time:"O(n + q log n)",space:"O(n)",
    solution:`class Solution:
    def rangeMinQueries(self, nums: list[int], operations: list[list]):
        n = len(nums)
        tree = [0] * n + nums[:]
        for i in range(n - 1, 0, -1):
            tree[i] = min(tree[2 * i], tree[2 * i + 1])
        answers = []
        for op in operations:
            if op[0] == "set":
                i = op[1] + n
                tree[i] = op[2]
                i //= 2
                while i >= 1:
                    tree[i] = min(tree[2 * i], tree[2 * i + 1])
                    i //= 2
            else:
                left, right = op[1] + n, op[2] + n + 1
                best = None
                while left < right:
                    if left & 1:
                        best = tree[left] if best is None else min(best, tree[left])
                        left += 1
                    if right & 1:
                        right -= 1
                        best = tree[right] if best is None else min(best, tree[right])
                    left //= 2
                    right //= 2
                answers.append(best)
        return answers
`,
    cases:[{args:[[5,2,8,6,3],[["min",0,4],["min",2,3],["set",1,9],["min",0,2],["min",1,1]]],expected:[2,6,5,9]},{args:[[7],[["min",0,0]]],expected:[7]},{args:[[4,4,4],[["set",0,1],["min",1,2],["min",0,2]]],expected:[4,1]},{args:[[-1,3,-5,2],[["min",0,1],["min",1,3],["set",2,10],["min",1,3]]],expected:[-1,-5,2]},{args:[[3,1],[["set",1,5],["set",0,6],["min",0,1]]],expected:[5]}],
  },
  {
    id:"dsa-fenwick-smaller-after",title:"Count Smaller Values to the Right",category:"Segment & Fenwick Trees",difficulty:"Hard",level:7,
    description:"For every index i of nums, count how many elements after position i are strictly smaller than nums[i]. Return the counts as a list.",
    constraints:["1 <= len(nums) <= 100000", "-10^4 <= nums[i] <= 10^4"],method:"countSmaller",signature:"nums: list[int]",
    intuition:"Walk from right to left so the Fenwick tree always holds exactly the elements to the right. Map values to compact ranks; the answer for nums[i] is the prefix count of ranks strictly below its rank, after which you insert nums[i].",
    triggers:["For each element, count later (or earlier) elements that are smaller or larger", "An O(n²) pairwise scan is too slow"],
    pitfalls:["Compress values to ranks 1..k (they can be negative or sparse).", "Query before inserting the current value, and query rank − 1 for strictly smaller.", "Equal values share one rank and are not counted as smaller."],
    time:"O(n log n)",space:"O(n)",
    solution:`class Solution:
    def countSmaller(self, nums: list[int]):
        ranks = {value: i + 1 for i, value in enumerate(sorted(set(nums)))}
        size = len(ranks)
        tree = [0] * (size + 1)
        result = [0] * len(nums)
        for i in range(len(nums) - 1, -1, -1):
            rank = ranks[nums[i]]
            j, total = rank - 1, 0
            while j > 0:
                total += tree[j]
                j -= j & -j
            result[i] = total
            j = rank
            while j <= size:
                tree[j] += 1
                j += j & -j
        return result
`,
    cases:[{args:[[5,2,6,1]],expected:[2,1,1,0]},{args:[[-1]],expected:[0]},{args:[[-1,-1]],expected:[0,0]},{args:[[3,3,1,2,3]],expected:[2,2,0,0,0]},{args:[[4,3,2,1]],expected:[3,2,1,0]},{args:[[1,2,3,4]],expected:[0,0,0,0]}],
  },
  {
    id:"dsa-fenwick-range-sum-count",title:"Count Subarray Sums Within Bounds",category:"Segment & Fenwick Trees",difficulty:"Hard",level:8,
    description:"Return the number of non-empty contiguous subarrays of nums whose sum lies between lower and upper, inclusive.",
    constraints:["1 <= len(nums) <= 100000", "-2^31 <= nums[i] <= 2^31 - 1", "lower <= upper"],method:"countRangeSum",signature:"nums: list[int], lower: int, upper: int",
    intuition:"With prefix sums P, subarray (i, j] has sum P[j] − P[i]. For each P[j], count earlier prefixes P[i] in [P[j] − upper, P[j] − lower]. A Fenwick tree over the sorted distinct prefix values counts those in O(log n); merge sort on prefixes is an equivalent alternative.",
    triggers:["Count subarrays whose sum falls in a range", "Pairs (i < j) satisfying a range condition on a difference"],
    pitfalls:["Include the empty prefix P[0] = 0 before any element.", "Translate value bounds to rank bounds with bisect_left for the low end and bisect_right for the high end.", "Insert P[j] only after counting, so a subarray never pairs a prefix with itself."],
    time:"O(n log n)",space:"O(n)",
    solution:`from bisect import bisect_left, bisect_right
class Solution:
    def countRangeSum(self, nums: list[int], lower: int, upper: int):
        prefixes = [0]
        for num in nums:
            prefixes.append(prefixes[-1] + num)
        values = sorted(set(prefixes))
        size = len(values)
        tree = [0] * (size + 1)
        def add(i):
            while i <= size:
                tree[i] += 1
                i += i & -i
        def count(i):
            total = 0
            while i > 0:
                total += tree[i]
                i -= i & -i
            return total
        result = 0
        for p in prefixes:
            result += count(bisect_right(values, p - lower)) - count(bisect_left(values, p - upper))
            add(bisect_left(values, p) + 1)
        return result
`,
    cases:[{args:[[-2,5,-1],-2,2],expected:3},{args:[[0],0,0],expected:1},{args:[[1,2,3],10,20],expected:0},{args:[[5,-5,5],0,0],expected:2},{args:[[2,-1,2,-1],0,1],expected:4}],
  },
  {
    id:"dsa-fenwick-range-add",title:"Range Additions with Range Sums",category:"Segment & Fenwick Trees",difficulty:"Hard",level:8,
    description:"Process a list of operations on nums in order. [\"add\", left, right, delta] adds delta to every element of nums[left..right]. [\"sum\", left, right] asks for the sum of nums[left..right]. Both ranges are inclusive. Return the answers to the \"sum\" operations in order, using O(log n) per operation.",
    constraints:["1 <= len(nums) <= 30000", "0 <= len(operations) <= 30000", "Indices are valid and left <= right.", "Values and deltas may be negative."],method:"rangeAddQueries",signature:"nums: list[int], operations: list[list]",
    intuition:"Store range additions as a difference array d. The prefix sum up to p equals Σ d[i] · (p − i + 1) = (p + 1) · Σ d[i] − Σ d[i] · i, so keep two Fenwick trees: one over d[i] and one over d[i] · i. Each range add is four point updates; each prefix sum is two prefix queries.",
    triggers:["Range updates and range queries mixed together", "A difference array alone only gives point values"],
    pitfalls:["One Fenwick tree over the difference array answers point queries, not range sums—you need the second tree.", "The closing update lands at right + 1; size the trees with a spare slot.", "Keep the 1-indexed formulas consistent: prefix(p) = p · B1(p) − B2(p) when B2 stores delta · (left − 1)."],
    time:"O((n + q) log n)",space:"O(n)",
    solution:`class Solution:
    def rangeAddQueries(self, nums: list[int], operations: list[list]):
        n = len(nums)
        b1 = [0] * (n + 2)
        b2 = [0] * (n + 2)
        def update(tree, i, delta):
            while i <= n + 1:
                tree[i] += delta
                i += i & -i
        def query(tree, i):
            total = 0
            while i > 0:
                total += tree[i]
                i -= i & -i
            return total
        def range_add(left, right, delta):
            # left and right are 1-indexed and inclusive
            update(b1, left, delta)
            update(b1, right + 1, -delta)
            update(b2, left, delta * (left - 1))
            update(b2, right + 1, -delta * right)
        def prefix_sum(p):
            return query(b1, p) * p - query(b2, p)
        for i, value in enumerate(nums, 1):
            range_add(i, i, value)
        answers = []
        for op in operations:
            if op[0] == "add":
                range_add(op[1] + 1, op[2] + 1, op[3])
            else:
                answers.append(prefix_sum(op[2] + 1) - prefix_sum(op[1]))
        return answers
`,
    cases:[{args:[[1,2,3,4,5],[["sum",0,4],["add",1,3,10],["sum",0,4],["sum",2,2],["add",0,0,-1],["sum",0,1]]],expected:[15,45,13,12]},{args:[[0],[["add",0,0,5],["add",0,0,5],["sum",0,0]]],expected:[10]},{args:[[0,0,0],[["sum",0,2]]],expected:[0]},{args:[[3,-2,7,1],[["add",0,3,2],["sum",1,2],["add",2,3,-4],["sum",0,3],["sum",3,3]]],expected:[9,9,-1]},{args:[[4,4],[]],expected:[]}],
  },

  // ── String Algorithms ───────────────────────────────────────────────────────
  {
    id:"dsa-string-repeated-block",title:"Built From a Repeated Block",category:"String Algorithms",difficulty:"Easy",level:3,
    description:"Return true if s can be written as two or more copies of one of its substrings joined together, otherwise false.",
    constraints:["1 <= len(s) <= 10000", "s contains lowercase English letters."],method:"repeatedSubstringPattern",signature:"s: str",
    intuition:"The prefix function's last value is the length of the longest proper prefix that is also a suffix (a border). The smallest period of s is n − border, and s is a repetition exactly when that period is shorter than n and divides n.",
    triggers:["Periodicity or repetition inside one string", "Prefixes that equal suffixes"],
    pitfalls:["A single copy does not count—the period must be strictly shorter than s.", "A border alone is not enough; the period must divide the length (\"abab\" + \"a\" has a border but is not a repetition)."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def repeatedSubstringPattern(self, s: str):
        n = len(s)
        pi = [0] * n
        for i in range(1, n):
            k = pi[i - 1]
            while k and s[i] != s[k]:
                k = pi[k - 1]
            if s[i] == s[k]:
                k += 1
            pi[i] = k
        border = pi[-1]
        return border > 0 and n % (n - border) == 0
`,
    cases:[{args:["abab"],expected:true},{args:["aba"],expected:false},{args:["abcabcabcabc"],expected:true},{args:["a"],expected:false},{args:["ababa"],expected:false},{args:["zzzz"],expected:true}],
  },
  {
    id:"dsa-string-kmp-search",title:"Find Every Pattern Occurrence (KMP)",category:"String Algorithms",difficulty:"Medium",level:5,
    description:"Return every index at which pattern starts inside text, in increasing order. Overlapping occurrences all count. Aim for O(len(text) + len(pattern)) time.",
    constraints:["0 <= len(text) <= 100000", "1 <= len(pattern) <= 100000", "Both strings contain lowercase English letters."],method:"findOccurrences",signature:"text: str, pattern: str",
    intuition:"Precompute the pattern's prefix function: for each prefix, the length of its longest proper border. While scanning text, a mismatch falls back to that border instead of restarting, so the text pointer only moves forward.",
    triggers:["Exact substring search with a linear-time requirement", "Many overlapping occurrences make a naive scan quadratic"],
    pitfalls:["After a full match, continue from pi[m − 1] (not 0) so overlapping matches are found.", "Build the failure table from the pattern only.", "A pattern longer than the text simply has no matches."],
    time:"O(n + m)",space:"O(m)",
    solution:`class Solution:
    def findOccurrences(self, text: str, pattern: str):
        m = len(pattern)
        pi = [0] * m
        for i in range(1, m):
            k = pi[i - 1]
            while k and pattern[i] != pattern[k]:
                k = pi[k - 1]
            if pattern[i] == pattern[k]:
                k += 1
            pi[i] = k
        result = []
        k = 0
        for i, char in enumerate(text):
            while k and char != pattern[k]:
                k = pi[k - 1]
            if char == pattern[k]:
                k += 1
            if k == m:
                result.append(i - m + 1)
                k = pi[k - 1]
        return result
`,
    cases:[{args:["abababa","aba"],expected:[0,2,4]},{args:["hello","ll"],expected:[2]},{args:["aaaa","aaaaa"],expected:[]},{args:["aaaaa","aa"],expected:[0,1,2,3]},{args:["abcxabcdabxabcdabcdabcy","abcdabcy"],expected:[15]},{args:["","a"],expected:[]}],
  },
  {
    id:"dsa-string-z-function",title:"Z-Function of a String",category:"String Algorithms",difficulty:"Medium",level:5,
    description:"For a string s of length n, z[i] is the length of the longest substring starting at index i that is also a prefix of s. By convention z[0] = n. Return the list z, computed in O(n) time.",
    constraints:["1 <= len(s) <= 100000", "s contains lowercase English letters."],method:"zFunction",signature:"s: str",
    intuition:"Keep the rightmost segment [left, right) known to match a prefix of s. For i inside it, s[i:] begins like s[i − left:], so z[i] starts at min(right − i, z[i − left]); only characters past right are compared explicitly, and right only moves forward.",
    triggers:["Prefix matches at every position", "Pattern search via pattern + separator + text"],
    pitfalls:["Copy at most right − i from the mirrored value; anything beyond right is unverified.", "Update [left, right) whenever a match extends past right.", "Remember the z[0] = n convention."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def zFunction(self, s: str):
        n = len(s)
        z = [0] * n
        z[0] = n
        left = right = 0
        for i in range(1, n):
            if i < right:
                z[i] = min(right - i, z[i - left])
            while i + z[i] < n and s[z[i]] == s[i + z[i]]:
                z[i] += 1
            if i + z[i] > right:
                left, right = i, i + z[i]
        return z
`,
    cases:[{args:["aaaaa"],expected:[5,4,3,2,1]},{args:["aabxaab"],expected:[7,1,0,0,3,1,0]},{args:["abacaba"],expected:[7,0,1,0,3,0,1]},{args:["x"],expected:[1]},{args:["abcd"],expected:[4,0,0,0]}],
  },
  {
    id:"dsa-string-longest-palindrome",title:"Longest Palindromic Substring",category:"String Algorithms",difficulty:"Medium",level:6,
    description:"Return the longest contiguous substring of s that reads the same forwards and backwards. If several substrings share the maximum length, return the one that starts earliest.",
    constraints:["1 <= len(s) <= 10000", "s contains lowercase English letters and digits."],method:"longestPalindrome",signature:"s: str",
    intuition:"Every palindrome mirrors around a center, either a character or a gap. Expanding from all 2n − 1 centers is O(n²). Manacher's algorithm inserts separators so every palindrome has odd length, then reuses the radius of the mirrored center inside the rightmost known palindrome, giving O(n).",
    triggers:["Longest or count of palindromic substrings", "Symmetry around a center"],
    pitfalls:["Handle both odd- and even-length palindromes (separators do this in Manacher's algorithm).", "Pick the earliest start among ties—choose the first center with the maximum radius.", "Use sentinels that cannot appear in s so expansion stops at the ends."],
    time:"O(n) with Manacher's algorithm (O(n²) with center expansion)",space:"O(n)",
    solution:`class Solution:
    def longestPalindrome(self, s: str):
        t = "^#" + "#".join(s) + "#$"
        radius = [0] * len(t)
        center = right = 0
        for i in range(1, len(t) - 1):
            if i < right:
                radius[i] = min(right - i, radius[2 * center - i])
            while t[i + radius[i] + 1] == t[i - radius[i] - 1]:
                radius[i] += 1
            if i + radius[i] > right:
                center, right = i, i + radius[i]
        best = max(range(len(t)), key=lambda i: radius[i])
        start = (best - radius[best] - 1) // 2
        return s[start:start + radius[best]]
`,
    cases:[{args:["babad"],expected:"bab"},{args:["cbbd"],expected:"bb"},{args:["a"],expected:"a"},{args:["abcde"],expected:"a"},{args:["forgeeksskeegfor"],expected:"geeksskeeg"},{args:["abacdfgdcaba"],expected:"aba"}],
  },
  {
    id:"dsa-string-shortest-palindrome",title:"Shortest Palindrome by Prepending",category:"String Algorithms",difficulty:"Hard",level:7,
    description:"You may add characters only to the front of s. Return the shortest palindrome you can create this way.",
    constraints:["0 <= len(s) <= 50000", "s contains lowercase English letters."],method:"shortestPalindrome",signature:"s: str",
    intuition:"Keep the longest prefix of s that is already a palindrome and mirror the remaining suffix in front. That prefix is the longest border of s + \"#\" + reverse(s), which the KMP prefix function finds in linear time.",
    triggers:["Longest palindromic prefix", "Matching a string against its own reverse"],
    pitfalls:["Use a separator that cannot occur in s so a border cannot cross the middle.", "Testing every prefix for being a palindrome is O(n²).", "An empty string is already a palindrome."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def shortestPalindrome(self, s: str):
        t = s + "#" + s[::-1]
        pi = [0] * len(t)
        for i in range(1, len(t)):
            k = pi[i - 1]
            while k and t[i] != t[k]:
                k = pi[k - 1]
            if t[i] == t[k]:
                k += 1
            pi[i] = k
        keep = pi[-1]
        return s[keep:][::-1] + s
`,
    cases:[{args:["aacecaaa"],expected:"aaacecaaa"},{args:["abcd"],expected:"dcbabcd"},{args:[""],expected:""},{args:["a"],expected:"a"},{args:["aba"],expected:"aba"},{args:["abb"],expected:"bbabb"}],
  },
  {
    id:"dsa-string-longest-repeat",title:"Longest Repeated Substring Length",category:"String Algorithms",difficulty:"Hard",level:8,
    description:"Return the length of the longest substring that occurs at least twice in s. The two occurrences may overlap. Return 0 if no substring repeats.",
    constraints:["1 <= len(s) <= 30000", "s contains lowercase English letters."],method:"longestRepeatedSubstring",signature:"s: str",
    intuition:"If some length-L substring repeats, a length-(L − 1) one does too, so binary search on L. To test a length, compute a polynomial (Rabin–Karp) hash of every window from prefix hashes in O(1) each and look for a hash seen before, confirming real equality on a hit.",
    triggers:["Longest substring with a property that is monotonic in length", "Comparing many substrings of equal length quickly"],
    pitfalls:["Hash collisions: confirm candidate matches (or use double hashing / a very large modulus).", "Window hash = (H[i + L] − H[i] · base^L) mod M—precompute the powers.", "Overlapping occurrences count, e.g. \"aaaaa\" gives 4."],
    time:"O(n log n) expected",space:"O(n)",
    solution:`class Solution:
    def longestRepeatedSubstring(self, s: str):
        n = len(s)
        mod = (1 << 61) - 1
        base = 131
        prefix = [0] * (n + 1)
        power = [1] * (n + 1)
        for i, char in enumerate(s):
            prefix[i + 1] = (prefix[i] * base + ord(char)) % mod
            power[i + 1] = power[i] * base % mod
        def repeats(length):
            seen = {}
            for start in range(n - length + 1):
                h = (prefix[start + length] - prefix[start] * power[length]) % mod
                for other in seen.get(h, []):
                    if s[other:other + length] == s[start:start + length]:
                        return True
                seen.setdefault(h, []).append(start)
            return False
        low, high = 0, n - 1
        while low < high:
            mid = (low + high + 1) // 2
            if repeats(mid):
                low = mid
            else:
                high = mid - 1
        return low
`,
    cases:[{args:["banana"],expected:3},{args:["abcd"],expected:0},{args:["aaaaa"],expected:4},{args:["abcabcab"],expected:5},{args:["mississippi"],expected:4},{args:["a"],expected:0}],
  },

  // ── Advanced DP ─────────────────────────────────────────────────────────────
  {
    id:"dsa-adp-assignment",title:"Minimum Cost Job Assignment",category:"Advanced DP",difficulty:"Medium",level:6,
    description:"There are n workers and n jobs; cost[i][j] is the cost for worker i to do job j. Give every worker exactly one job so that no job is shared, and return the minimum total cost.",
    constraints:["1 <= n <= 12", "0 <= cost[i][j] <= 1000"],method:"minAssignmentCost",signature:"cost: list[list[int]]",
    intuition:"Assign workers in index order. If mask is the set of jobs already taken, the next worker is popcount(mask). dp[mask] is the cheapest way to fill exactly those jobs with the first popcount(mask) workers; extend it by one unused job.",
    triggers:["n is small (about 20 or less) and each item is used once", "State must remember which items are taken, not just how many"],
    pitfalls:["The worker index is implied by the mask's popcount—no extra dimension needed.", "Iterate masks in increasing order; every extension produces a larger mask.", "Greedy (cheapest job per worker) is not optimal."],
    time:"O(2^n · n)",space:"O(2^n)",
    solution:`class Solution:
    def minAssignmentCost(self, cost: list[list[int]]):
        n = len(cost)
        INF = float("inf")
        dp = [INF] * (1 << n)
        dp[0] = 0
        for mask in range(1 << n):
            worker = bin(mask).count("1")
            if dp[mask] == INF or worker == n:
                continue
            for job in range(n):
                if not mask & (1 << job):
                    nxt = mask | (1 << job)
                    dp[nxt] = min(dp[nxt], dp[mask] + cost[worker][job])
        return dp[-1]
`,
    cases:[{args:[[[9,2,7,8],[6,4,3,7],[5,8,1,8],[7,6,9,4]]],expected:13},{args:[[[5]]],expected:5},{args:[[[1,2],[3,4]]],expected:5},{args:[[[0,0,0],[0,0,0],[0,0,0]]],expected:0},{args:[[[4,1,3],[2,0,5],[3,2,2]]],expected:5}],
  },
  {
    id:"dsa-adp-shortest-tour",title:"Shortest Round Trip Through Every City",category:"Advanced DP",difficulty:"Hard",level:8,
    description:"dist[i][j] is the cost of traveling directly from city i to city j; costs need not be symmetric. Starting at city 0, visit every other city exactly once and return to city 0. Return the minimum total cost of such a tour. With a single city the answer is 0.",
    constraints:["1 <= n <= 12", "0 <= dist[i][j] <= 1000", "dist[i][i] == 0"],method:"shortestTour",signature:"dist: list[list[int]]",
    intuition:"Held–Karp: dp[mask][last] is the cheapest path that starts at city 0, visits exactly the cities in mask, and ends at last. Extend it with an unvisited city; at the end, close the tour with the edge back to city 0.",
    triggers:["Visit every node once with a small n", "The order of visits matters and the visited set must be remembered"],
    pitfalls:["Initialize only dp[{0}][0] = 0—the tour starts at city 0.", "Add the return edge to city 0 when reading the answer.", "dist may be asymmetric, so use dist[last][next] in the travel direction."],
    time:"O(2^n · n²)",space:"O(2^n · n)",
    solution:`class Solution:
    def shortestTour(self, dist: list[list[int]]):
        n = len(dist)
        INF = float("inf")
        full = 1 << n
        dp = [[INF] * n for _ in range(full)]
        dp[1][0] = 0
        for mask in range(1, full, 2):
            for last in range(n):
                cost = dp[mask][last]
                if cost == INF:
                    continue
                for nxt in range(n):
                    if not mask & (1 << nxt):
                        new_mask = mask | (1 << nxt)
                        if cost + dist[last][nxt] < dp[new_mask][nxt]:
                            dp[new_mask][nxt] = cost + dist[last][nxt]
        return min(dp[full - 1][last] + dist[last][0] for last in range(n))
`,
    cases:[{args:[[[0,10,15,20],[10,0,35,25],[15,35,0,30],[20,25,30,0]]],expected:80},{args:[[[0]]],expected:0},{args:[[[0,5],[7,0]]],expected:12},{args:[[[0,1,9],[9,0,1],[1,9,0]]],expected:3},{args:[[[0,3,4,2,7],[3,0,4,6,3],[4,4,0,5,8],[2,6,5,0,6],[7,3,8,6,0]]],expected:19}],
  },
  {
    id:"dsa-adp-burst-balloons",title:"Burst Balloons for Maximum Coins",category:"Advanced DP",difficulty:"Hard",level:8,
    description:"A row of balloons carries the values nums. Bursting a balloon earns left × value × right coins, where left and right are the values of its nearest balloons that are still intact (use 1 when there is no balloon on that side). The burst balloon is then removed. Burst every balloon in some order and return the maximum total coins.",
    constraints:["1 <= len(nums) <= 300", "0 <= nums[i] <= 100"],method:"maxCoins",signature:"nums: list[int]",
    intuition:"Pad the row with 1 at both ends. Instead of the first balloon to burst, choose the last balloon k to burst strictly between boundaries i and j: at that moment its neighbors are exactly i and j, so the intervals (i, k) and (k, j) become independent subproblems.",
    triggers:["Removing an element changes its neighbors' contributions", "Optimal order over a sequence with interval structure"],
    pitfalls:["Choosing the first balloon to burst does not split the problem—neighbors keep changing.", "Fill the table by increasing interval length.", "Use open intervals (i, j) over the padded array."],
    time:"O(n³)",space:"O(n²)",
    solution:`class Solution:
    def maxCoins(self, nums: list[int]):
        values = [1] + nums + [1]
        n = len(values)
        dp = [[0] * n for _ in range(n)]
        for gap in range(2, n):
            for left in range(n - gap):
                right = left + gap
                best = 0
                for last in range(left + 1, right):
                    coins = dp[left][last] + values[left] * values[last] * values[right] + dp[last][right]
                    if coins > best:
                        best = coins
                dp[left][right] = best
        return dp[0][n - 1]
`,
    cases:[{args:[[3,1,5,8]],expected:167},{args:[[1,5]],expected:10},{args:[[7]],expected:7},{args:[[2,3]],expected:9},{args:[[0,0]],expected:0}],
  },
  {
    id:"dsa-adp-polygon-triangulation",title:"Cheapest Polygon Triangulation",category:"Advanced DP",difficulty:"Medium",level:6,
    description:"A convex polygon has n vertices with integer values listed in clockwise order. Split it into n − 2 triangles using non-crossing diagonals. Each triangle scores the product of its three vertex values; return the minimum possible total score.",
    constraints:["3 <= n <= 50", "1 <= values[i] <= 100"],method:"minScoreTriangulation",signature:"values: list[int]",
    intuition:"In any triangulation, the side between vertices i and j belongs to exactly one triangle (i, k, j) with i < k < j. Fixing k splits the polygon into the independent pieces i..k and k..j, so dp[i][j] = min over k of dp[i][k] + values[i]·values[k]·values[j] + dp[k][j].",
    triggers:["Split a sequence or polygon recursively by choosing a middle point", "Cost depends on the endpoints of an interval"],
    pitfalls:["Adjacent vertices (j = i + 1) form no triangle: dp[i][i + 1] = 0.", "Fill by increasing interval length so sub-intervals are ready.", "Do not try all diagonals independently—they must not cross."],
    time:"O(n³)",space:"O(n²)",
    solution:`class Solution:
    def minScoreTriangulation(self, values: list[int]):
        n = len(values)
        dp = [[0] * n for _ in range(n)]
        for gap in range(2, n):
            for i in range(n - gap):
                j = i + gap
                dp[i][j] = min(dp[i][k] + values[i] * values[k] * values[j] + dp[k][j] for k in range(i + 1, j))
        return dp[0][n - 1]
`,
    cases:[{args:[[1,2,3]],expected:6},{args:[[3,7,4,5]],expected:144},{args:[[1,3,1,4,1,5]],expected:13},{args:[[2,2,2,2]],expected:16},{args:[[4,1,5,2,6]],expected:46}],
  },
  {
    id:"dsa-adp-tree-independent-set",title:"Maximum Weight Independent Set on a Tree",category:"Advanced DP",difficulty:"Medium",level:6,
    description:"A tree has n nodes labeled 0 to n − 1 with non-negative weights values[i], connected by n − 1 undirected edges. Choose a set of nodes in which no two chosen nodes share an edge, maximizing the total weight. Return that maximum total.",
    constraints:["1 <= n <= 100000", "0 <= values[i] <= 10000", "edges form a tree (connected, no cycles)."],method:"maxIndependentSet",signature:"values: list[int], edges: list[list[int]]",
    intuition:"Root the tree at 0. For each node keep two numbers: take = its weight plus the skip values of its children, and skip = the sum over children of max(take, skip). Process nodes children-first and read max(take, skip) at the root.",
    triggers:["Choose nodes of a tree under a parent/child constraint", "House-robber style choices on a hierarchy"],
    pitfalls:["Build an adjacency list and remember each node's parent so you never walk back up.", "Deep trees overflow Python's recursion limit—use an explicit stack and process nodes in reverse visiting order.", "A leaf's skip value is 0, not its weight."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def maxIndependentSet(self, values: list[int], edges: list[list[int]]):
        n = len(values)
        graph = [[] for _ in range(n)]
        for a, b in edges:
            graph[a].append(b)
            graph[b].append(a)
        parent = [-1] * n
        seen = [False] * n
        seen[0] = True
        order, stack = [], [0]
        while stack:
            node = stack.pop()
            order.append(node)
            for neighbor in graph[node]:
                if not seen[neighbor]:
                    seen[neighbor] = True
                    parent[neighbor] = node
                    stack.append(neighbor)
        take = values[:]
        skip = [0] * n
        for node in reversed(order):
            p = parent[node]
            if p != -1:
                take[p] += skip[node]
                skip[p] += max(take[node], skip[node])
        return max(take[0], skip[0])
`,
    cases:[{args:[[3,2,3,3,1],[[0,1],[0,2],[1,3],[2,4]]],expected:7},{args:[[5],[]],expected:5},{args:[[1,10],[[0,1]]],expected:10},{args:[[1,4,5,6],[[0,1],[0,2],[0,3]]],expected:15},{args:[[2,7,9,3,1],[[0,1],[1,2],[2,3],[3,4]]],expected:12},{args:[[10,1,1,1,8],[[3,1],[1,0],[0,2],[2,4]]],expected:19}],
  },
  {
    id:"dsa-adp-sum-of-distances",title:"Sum of Distances From Every Node",category:"Advanced DP",difficulty:"Hard",level:8,
    description:"A tree has n nodes labeled 0 to n − 1 and n − 1 undirected edges. For every node i, compute the sum of the number of edges between i and each other node. Return the list of sums.",
    constraints:["1 <= n <= 30000", "edges form a tree."],method:"sumOfDistancesInTree",signature:"n: int, edges: list[list[int]]",
    intuition:"Rerooting. One bottom-up pass computes subtree sizes and the answer for root 0. Moving the root from a parent p to its child c brings the size[c] nodes in c's subtree one step closer and pushes the other n − size[c] nodes one step farther: answer[c] = answer[p] − size[c] + (n − size[c]).",
    triggers:["A per-node answer that depends on the whole tree", "Running a separate traversal from every node would be O(n²)"],
    pitfalls:["Running BFS from every node is quadratic.", "Compute sizes children-first, then push answers parent-first (two different orders).", "Use an explicit stack; recursion depth can reach n."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def sumOfDistancesInTree(self, n: int, edges: list[list[int]]):
        graph = [[] for _ in range(n)]
        for a, b in edges:
            graph[a].append(b)
            graph[b].append(a)
        parent = [-1] * n
        seen = [False] * n
        seen[0] = True
        order, stack = [], [0]
        while stack:
            node = stack.pop()
            order.append(node)
            for neighbor in graph[node]:
                if not seen[neighbor]:
                    seen[neighbor] = True
                    parent[neighbor] = node
                    stack.append(neighbor)
        size = [1] * n
        below = [0] * n
        for node in reversed(order):
            p = parent[node]
            if p != -1:
                size[p] += size[node]
                below[p] += below[node] + size[node]
        answer = [0] * n
        answer[0] = below[0]
        for node in order:
            p = parent[node]
            if p != -1:
                answer[node] = answer[p] - size[node] + (n - size[node])
        return answer
`,
    cases:[{args:[6,[[0,1],[0,2],[2,3],[2,4],[2,5]]],expected:[8,12,6,10,10,10]},{args:[1,[]],expected:[0]},{args:[2,[[1,0]]],expected:[1,1]},{args:[4,[[0,1],[1,2],[2,3]]],expected:[6,4,4,6]},{args:[5,[[3,0],[3,1],[3,2],[3,4]]],expected:[7,7,7,4,7]}],
  },
];

export const ADVANCED_PROBLEMS = problems.map(makeProblem);
