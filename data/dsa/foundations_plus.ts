import { makeProblem, type CoreSpec } from "./core";

// Additional practice for the thinner foundation topics: Union Find, Sorting, Prefix Sums, and the two math tracks.
// Original prompts; one list of cases drives the displayed examples and the Python runner.
const problems: CoreSpec[] = [
  // ── Union Find ──────────────────────────────────────────────────────────────
  {
    id:"dsa-uf-equations",title:"Satisfiable Equality Constraints",category:"Union Find",difficulty:"Medium",level:4,
    description:"Each constraint is a four-character string of the form \"x==y\" or \"x!=y\", where x and y are single lowercase letters naming integer variables. Return true if some assignment of integers to the variables satisfies every constraint at the same time, otherwise false.",
    constraints:["1 <= len(equations) <= 500", "Each string has length 4: a letter, then \"==\" or \"!=\", then a letter."],method:"equationsPossible",signature:"equations: list[str]",
    intuition:"Equality is transitive, so the \"==\" constraints split the letters into groups. Union every equality first; a \"!=\" constraint fails exactly when both letters end up with the same root.",
    triggers:["Transitive equivalence relations", "Many constraints that must hold simultaneously"],
    pitfalls:["Apply every \"==\" before checking any \"!=\"—the input order says nothing about dependency.", "\"a!=a\" can never be satisfied.", "Variables that appear only in \"!=\" constraints are still valid singleton groups."],
    time:"O(n · α(26)), effectively O(n)",space:"O(1) — one parent slot per letter",
    solution:`class Solution:
    def equationsPossible(self, equations: list[str]):
        parent = list(range(26))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for eq in equations:
            if eq[1] == "=":
                parent[find(ord(eq[0]) - 97)] = find(ord(eq[3]) - 97)
        for eq in equations:
            if eq[1] == "!" and find(ord(eq[0]) - 97) == find(ord(eq[3]) - 97):
                return False
        return True
`,
    cases:[{args:[["a==b","b!=a"]],expected:false},{args:[["b==a","a==b"]],expected:true},{args:[["a==b","b!=c","c==a"]],expected:false},{args:[["a==b","b==c","a==c"]],expected:true},{args:[["a!=a"]],expected:false},{args:[["c==c","b==d","x!=z"]],expected:true}],
  },
  {
    id:"dsa-uf-smallest-swaps",title:"Smallest String Using Allowed Swaps",category:"Union Find",difficulty:"Medium",level:5,
    description:"You are given a string s and a list of index pairs [i, j]. You may swap the characters at the two indices of any listed pair, as many times as you like and in any order. Return the lexicographically smallest string you can produce.",
    constraints:["1 <= len(s) <= 100000", "0 <= len(pairs) <= 100000", "0 <= i, j < len(s)", "s contains lowercase English letters."],method:"smallestStringWithSwaps",signature:"s: str, pairs: list[list[int]]",
    intuition:"Swaps chain together: if i can swap with j and j with k, the characters at i, j, and k can be permuted arbitrarily. Union the pairs, then within each component place the component's characters in sorted order onto its indices in sorted order.",
    triggers:["Repeated swaps between linked positions", "Any permutation is reachable inside a connected group"],
    pitfalls:["Swaps are not limited to the listed pairs directly—chains of pairs connect whole groups.", "Pair sorted characters with sorted indices of the same group.", "Pairs may repeat or be of the form [i, i]."],
    time:"O(n log n + p · α(n))",space:"O(n)",
    solution:`class Solution:
    def smallestStringWithSwaps(self, s: str, pairs: list[list[int]]):
        parent = list(range(len(s)))
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        for a, b in pairs:
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        groups = {}
        for i in range(len(s)):
            groups.setdefault(find(i), []).append(i)
        result = list(s)
        for indices in groups.values():
            for i, char in zip(indices, sorted(s[i] for i in indices)):
                result[i] = char
        return "".join(result)
`,
    cases:[{args:["dcab",[[0,3],[1,2]]],expected:"bacd"},{args:["dcab",[[0,3],[1,2],[0,2]]],expected:"abcd"},{args:["cba",[[0,1],[1,2]]],expected:"abc"},{args:["zyx",[[0,2]]],expected:"xyz"},{args:["q",[]],expected:"q"},{args:["badc",[[1,1],[2,3],[3,2]]],expected:"bacd"}],
  },
  {
    id:"dsa-uf-islands-online",title:"Island Count After Each Land Addition",category:"Union Find",difficulty:"Hard",level:7,
    description:"A rows × cols grid starts entirely as water. positions lists cells [r, c] that are turned into land one at a time. After each addition, record how many islands exist, where an island is a group of land cells connected horizontally or vertically. Turning a cell that is already land into land changes nothing. Return the recorded counts in order.",
    constraints:["1 <= rows, cols <= 10000", "1 <= rows × cols <= 100000", "1 <= len(positions) <= 10000", "Every position is inside the grid; positions may repeat."],method:"numIslands2",signature:"rows: int, cols: int, positions: list[list[int]]",
    intuition:"Each new land cell starts as its own island (count + 1). Then union it with every land neighbor; each union that joins two different roots merges two islands (count − 1). Union Find answers this online without rescanning the grid.",
    triggers:["Connectivity changes while you must answer after every update", "Grid flood fill would be too slow to repeat"],
    pitfalls:["A repeated position must not add a new island.", "Only union with neighbors that are already land.", "Decrement once per successful merge, not once per land neighbor—two neighbors may already share a root."],
    time:"O(k · α(rows × cols)) for k additions",space:"O(number of land cells)",
    solution:`class Solution:
    def numIslands2(self, rows: int, cols: int, positions: list[list[int]]):
        parent = {}
        size = {}
        def find(x):
            while parent[x] != x:
                parent[x] = parent[parent[x]]
                x = parent[x]
            return x
        islands = 0
        result = []
        for r, c in positions:
            cell = r * cols + c
            if cell not in parent:
                parent[cell] = cell
                size[cell] = 1
                islands += 1
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    neighbor = nr * cols + nc
                    if 0 <= nr < rows and 0 <= nc < cols and neighbor in parent:
                        a, b = find(cell), find(neighbor)
                        if a != b:
                            if size[a] < size[b]:
                                a, b = b, a
                            parent[b] = a
                            size[a] += size[b]
                            islands -= 1
            result.append(islands)
        return result
`,
    cases:[{args:[3,3,[[0,0],[0,1],[1,2],[2,1]]],expected:[1,1,2,3]},{args:[3,3,[[0,1],[1,0],[1,2],[2,1],[1,1]]],expected:[1,2,3,4,1]},{args:[1,1,[[0,0]]],expected:[1]},{args:[2,2,[[0,0],[1,1],[1,1],[0,1]]],expected:[1,2,2,1]},{args:[1,5,[[0,0],[0,4],[0,2],[0,1],[0,3]]],expected:[1,2,3,2,1]}],
  },

  // ── Sorting ─────────────────────────────────────────────────────────────────
  {
    id:"dsa-sorting-relative",title:"Sort by a Reference Order",category:"Sorting",difficulty:"Easy",level:2,
    description:"Rearrange arr so that values appearing in order come first, grouped together in the same sequence as order (keep every duplicate). Values that do not appear in order follow, in ascending order. The values in order are distinct.",
    constraints:["1 <= len(arr) <= 1000", "0 <= len(order) <= len(arr)", "Values in order are distinct; they may or may not appear in arr."],method:"relativeSortArray",signature:"arr: list[int], order: list[int]",
    intuition:"Give every value a sort key of (rank in order, value). Values missing from order get a rank larger than every listed rank, so they land at the end and break ties by their own value.",
    triggers:["Custom ordering defined by another list", "Sort with a key that mixes priority and natural order"],
    pitfalls:["Keep duplicates—do not deduplicate while grouping.", "Unlisted values are sorted ascending, not left in input order."],
    time:"O(n log n + m)",space:"O(n + m)",
    solution:`class Solution:
    def relativeSortArray(self, arr: list[int], order: list[int]):
        rank = {value: i for i, value in enumerate(order)}
        return sorted(arr, key=lambda value: (rank.get(value, len(order)), value))
`,
    cases:[{args:[[2,3,1,3,2,4,6,7,9,2,19],[2,1,4,3,9,6]],expected:[2,2,2,1,4,3,3,9,6,7,19]},{args:[[28,6,22,8,44,17],[22,28,8,6]],expected:[22,28,8,6,17,44]},{args:[[5,3,5],[]],expected:[3,5,5]},{args:[[-1,4,-3,4],[4,10]],expected:[4,4,-3,-1]},{args:[[1,1,1],[1]],expected:[1,1,1]}],
  },
  {
    id:"dsa-sorting-largest-number",title:"Largest Concatenated Number",category:"Sorting",difficulty:"Medium",level:4,
    description:"Arrange a list of non-negative integers in some order and concatenate their decimal forms. Return the largest number that can be produced, as a string with no leading zeros.",
    constraints:["1 <= len(nums) <= 100", "0 <= nums[i] <= 10^9"],method:"largestNumber",signature:"nums: list[int]",
    intuition:"Decide between two pieces a and b by comparing the strings a+b and b+a; put a first when a+b is larger. This pairwise rule is transitive, so sorting with it as a comparator yields the best arrangement.",
    triggers:["Order items so a concatenation is maximal", "Pairwise comparison that is not plain numeric or lexicographic order"],
    pitfalls:["Plain lexicographic order fails: \"3\" and \"30\" must give \"330\", not \"303\".", "If the first piece after sorting is \"0\", every piece is zero—return \"0\", not \"000\".", "Use functools.cmp_to_key; sort keys alone cannot express this rule directly."],
    time:"O(n log n · d) for d-digit numbers",space:"O(n · d)",
    solution:`from functools import cmp_to_key
class Solution:
    def largestNumber(self, nums: list[int]):
        parts = [str(num) for num in nums]
        def compare(a, b):
            if a + b > b + a:
                return -1
            if a + b < b + a:
                return 1
            return 0
        parts.sort(key=cmp_to_key(compare))
        result = "".join(parts)
        return "0" if result[0] == "0" else result
`,
    cases:[{args:[[10,2]],expected:"210"},{args:[[3,30,34,5,9]],expected:"9534330"},{args:[[0,0]],expected:"0"},{args:[[1]],expected:"1"},{args:[[121,12]],expected:"12121"},{args:[[8308,8308,830]],expected:"83088308830"}],
  },
  {
    id:"dsa-sorting-max-gap",title:"Maximum Gap in Linear Time",category:"Sorting",difficulty:"Hard",level:7,
    description:"Return the largest difference between two neighboring values in the sorted version of nums. If nums has fewer than two elements, return 0. Aim for linear time and space, for example with bucket sort or radix sort.",
    constraints:["1 <= len(nums) <= 100000", "0 <= nums[i] <= 10^9"],method:"maximumGap",signature:"nums: list[int]",
    intuition:"n values spread over [min, max] leave a gap of at least ceil((max − min) / (n − 1)) somewhere. Use buckets narrower than that bound: no answer can hide inside one bucket, so you only compare each non-empty bucket's minimum with the previous non-empty bucket's maximum.",
    triggers:["Sorted-order question with an explicit linear-time requirement", "Values are bounded integers (bucket or radix sort applies)"],
    pitfalls:["When all values are equal the range is zero—avoid a zero bucket width.", "Skip empty buckets when comparing neighbors.", "Track only each bucket's min and max; storing full buckets is unnecessary."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def maximumGap(self, nums: list[int]):
        n = len(nums)
        if n < 2:
            return 0
        low, high = min(nums), max(nums)
        if low == high:
            return 0
        width = max(1, (high - low) // (n - 1))
        count = (high - low) // width + 1
        bucket_min = [None] * count
        bucket_max = [None] * count
        for num in nums:
            b = (num - low) // width
            if bucket_min[b] is None or num < bucket_min[b]:
                bucket_min[b] = num
            if bucket_max[b] is None or num > bucket_max[b]:
                bucket_max[b] = num
        best = 0
        previous = low
        for b in range(count):
            if bucket_min[b] is not None:
                best = max(best, bucket_min[b] - previous)
                previous = bucket_max[b]
        return best
`,
    cases:[{args:[[3,6,9,1]],expected:3},{args:[[10]],expected:0},{args:[[1,1,1,1]],expected:0},{args:[[1,10000000]],expected:9999999},{args:[[1,3,100,7,90]],expected:83},{args:[[15,252,12,3,976,30,48]],expected:724}],
  },

  // ── Prefix Sums ─────────────────────────────────────────────────────────────
  {
    id:"dsa-prefix-2d-range",title:"Rectangle Sum Queries",category:"Prefix Sums",difficulty:"Medium",level:4,
    description:"Given an integer matrix and a list of queries [r1, c1, r2, c2], return the sum of each axis-aligned rectangle whose top-left corner is (r1, c1) and bottom-right corner is (r2, c2), inclusive. Preprocess the matrix so each query takes constant time.",
    constraints:["1 <= rows, cols <= 200", "0 <= len(queries) <= 10000", "0 <= r1 <= r2 < rows and 0 <= c1 <= c2 < cols", "Values may be negative."],method:"rangeSums",signature:"matrix: list[list[int]], queries: list[list[int]]",
    intuition:"Let P[r][c] be the sum of the rectangle above and left of (r, c), with an extra zero row and column. Any rectangle is P[bottom-right] − P[above] − P[left] + P[above-left]; the last term adds back the corner subtracted twice.",
    triggers:["Many rectangle-sum queries on a fixed grid", "2D generalization of range sums"],
    pitfalls:["Pad the table with a zero row and column to avoid boundary branches.", "Inclusion–exclusion: add back the overlapping corner exactly once.", "Shift query indices by one when reading the padded table."],
    time:"O(rows × cols + q)",space:"O(rows × cols)",
    solution:`class Solution:
    def rangeSums(self, matrix: list[list[int]], queries: list[list[int]]):
        rows, cols = len(matrix), len(matrix[0])
        prefix = [[0] * (cols + 1) for _ in range(rows + 1)]
        for r in range(rows):
            for c in range(cols):
                prefix[r + 1][c + 1] = matrix[r][c] + prefix[r][c + 1] + prefix[r + 1][c] - prefix[r][c]
        result = []
        for r1, c1, r2, c2 in queries:
            result.append(prefix[r2 + 1][c2 + 1] - prefix[r1][c2 + 1] - prefix[r2 + 1][c1] + prefix[r1][c1])
        return result
`,
    cases:[{args:[[[3,0,1,4,2],[5,6,3,2,1],[1,2,0,1,5],[4,1,0,1,7],[1,0,3,0,5]],[[2,1,4,3],[1,1,2,2],[1,2,2,4]]],expected:[8,11,12]},{args:[[[5]],[[0,0,0,0]]],expected:[5]},{args:[[[1,-2],[-3,4]],[[0,0,1,1],[1,0,1,1],[0,1,1,1]]],expected:[0,1,2]},{args:[[[1,2,3]],[]],expected:[]},{args:[[[1,2,3],[4,5,6]],[[0,0,1,2],[0,2,1,2],[1,0,1,1]]],expected:[21,9,9]}],
  },
  {
    id:"dsa-prefix-balanced-binary",title:"Longest Balanced Binary Subarray",category:"Prefix Sums",difficulty:"Medium",level:4,
    description:"Given an array containing only 0s and 1s, return the length of the longest contiguous subarray that contains the same number of 0s and 1s. Return 0 if there is none.",
    constraints:["1 <= len(nums) <= 100000", "Every element is 0 or 1."],method:"findMaxLength",signature:"nums: list[int]",
    intuition:"Count a 1 as +1 and a 0 as −1. A subarray is balanced exactly when the running balance is the same at both of its ends, so remember the first index where each balance appears and measure the distance back to it.",
    triggers:["Equal counts of two kinds inside a subarray", "Longest subarray with a zero net sum"],
    pitfalls:["Seed balance 0 at index −1 so prefixes starting at index 0 count.", "Store only the first index for each balance—overwriting it shortens answers."],
    time:"O(n)",space:"O(n)",
    solution:`class Solution:
    def findMaxLength(self, nums: list[int]):
        first = {0: -1}
        balance = best = 0
        for i, num in enumerate(nums):
            balance += 1 if num == 1 else -1
            if balance in first:
                best = max(best, i - first[balance])
            else:
                first[balance] = i
        return best
`,
    cases:[{args:[[0,1]],expected:2},{args:[[0,1,0]],expected:2},{args:[[0,0,0]],expected:0},{args:[[0,0,1,0,0,0,1,1]],expected:6},{args:[[1,1,0,1,1,0,0]],expected:6},{args:[[1]],expected:0}],
  },
  {
    id:"dsa-prefix-difference-bookings",title:"Seat Reservations with a Difference Array",category:"Prefix Sums",difficulty:"Medium",level:4,
    description:"There are n flights labeled 1 through n. Each booking [first, last, seats] reserves seats on every flight from first through last, inclusive. Return a list whose i-th element is the total seats reserved on flight i + 1.",
    constraints:["1 <= n <= 20000", "0 <= len(bookings) <= 20000", "1 <= first <= last <= n", "1 <= seats <= 10000"],method:"corpFlightBookings",signature:"bookings: list[list[int]], n: int",
    intuition:"Instead of touching every flight in a range, record +seats where the range starts and −seats just after it ends. One prefix sum over these markers recovers every flight's total.",
    triggers:["Many range increments followed by one read of all values", "Updates are known before any query"],
    pitfalls:["Flights are 1-indexed; convert carefully.", "The closing marker goes at last + 1 (allocate one spare slot)."],
    time:"O(n + b)",space:"O(n)",
    solution:`class Solution:
    def corpFlightBookings(self, bookings: list[list[int]], n: int):
        diff = [0] * (n + 1)
        for first, last, seats in bookings:
            diff[first - 1] += seats
            diff[last] -= seats
        result = []
        running = 0
        for i in range(n):
            running += diff[i]
            result.append(running)
        return result
`,
    cases:[{args:[[[1,2,10],[2,3,20],[2,5,25]],5],expected:[10,55,45,25,25]},{args:[[[1,2,10],[2,2,15]],2],expected:[10,25]},{args:[[],3],expected:[0,0,0]},{args:[[[1,1,5]],1],expected:[5]},{args:[[[3,4,7],[1,4,1]],4],expected:[1,1,8,8]}],
  },
  {
    id:"dsa-prefix-submatrix-target",title:"Count Submatrices with a Target Sum",category:"Prefix Sums",difficulty:"Hard",level:7,
    description:"Return the number of non-empty submatrices (contiguous blocks of rows and columns) of matrix whose elements add up to target. Values may be negative, so different submatrices with the same sum are all counted.",
    constraints:["1 <= rows, cols <= 100", "-1000 <= matrix[i][j] <= 1000", "-10^8 <= target <= 10^8"],method:"numSubmatrixSumTarget",signature:"matrix: list[list[int]], target: int",
    intuition:"Fix a top row and extend a bottom row downward, keeping each column's sum between them. That collapses the block to a 1D array, where \"count subarrays summing to target\" is solved with a running prefix sum and a hash map of earlier prefixes.",
    triggers:["Count 2D blocks with an exact sum", "Negative values rule out shrinking windows"],
    pitfalls:["Reset the hash map for every (top, bottom) pair and seed it with {0: 1}.", "Accumulate column sums incrementally as bottom grows instead of recomputing them.", "Iterate over the smaller dimension in the outer loops when the matrix is very wide or tall."],
    time:"O(rows² × cols)",space:"O(cols)",
    solution:`class Solution:
    def numSubmatrixSumTarget(self, matrix: list[list[int]], target: int):
        rows, cols = len(matrix), len(matrix[0])
        count = 0
        for top in range(rows):
            column_sums = [0] * cols
            for bottom in range(top, rows):
                for c in range(cols):
                    column_sums[c] += matrix[bottom][c]
                seen = {0: 1}
                running = 0
                for value in column_sums:
                    running += value
                    count += seen.get(running - target, 0)
                    seen[running] = seen.get(running, 0) + 1
        return count
`,
    cases:[{args:[[[0,1,0],[1,1,1],[0,1,0]],0],expected:4},{args:[[[1,-1],[-1,1]],0],expected:5},{args:[[[904]],0],expected:0},{args:[[[5]],5],expected:1},{args:[[[1,2,3],[4,5,6]],6],expected:2}],
  },

  // ── Math & Number Theory ────────────────────────────────────────────────────
  {
    id:"dsa-math-trailing-zeroes",title:"Trailing Zeros of a Factorial",category:"Math & Number Theory",difficulty:"Easy",level:2,
    description:"Return the number of trailing zeros in the decimal form of n! without computing n! itself.",
    constraints:["0 <= n <= 10^9"],method:"trailingZeroes",signature:"n: int",
    intuition:"Each trailing zero comes from a factor 10 = 2 × 5, and factors of 2 are plentiful, so count factors of 5: n // 5 + n // 25 + n // 125 + … (multiples of 25 contribute an extra five, and so on).",
    triggers:["Count a prime factor inside a factorial", "Answer would overflow if computed directly"],
    pitfalls:["Counting only n // 5 misses extra fives from 25, 125, ….", "0! = 1 has no trailing zeros."],
    time:"O(log₅ n)",space:"O(1)",
    solution:`class Solution:
    def trailingZeroes(self, n: int):
        count = 0
        while n:
            n //= 5
            count += n
        return count
`,
    cases:[{args:[3],expected:0},{args:[5],expected:1},{args:[0],expected:0},{args:[25],expected:6},{args:[100],expected:24},{args:[1000000000],expected:249999998}],
  },
  {
    id:"dsa-math-fraction-decimal",title:"Fraction to Decimal String",category:"Math & Number Theory",difficulty:"Medium",level:5,
    description:"Given an integer numerator and a non-zero integer denominator, return their quotient as a decimal string. If the fractional part repeats forever, enclose the shortest repeating block in parentheses, starting the block as early as possible (for example 1/6 is \"0.1(6)\"). Return integers without a decimal point and zero as \"0\".",
    constraints:["-2^31 <= numerator, denominator <= 2^31 - 1", "denominator != 0"],method:"fractionToDecimal",signature:"numerator: int, denominator: int",
    intuition:"Do long division on absolute values. The next digit depends only on the current remainder, so once a remainder repeats, the digits produced since its first appearance repeat forever. Store the digit position where each remainder first appeared.",
    triggers:["Exact decimal expansion of a fraction", "Detecting a cycle in a deterministic sequence of states"],
    pitfalls:["Determine the sign separately; a zero numerator gives \"0\" with no sign.", "Work with absolute values—Python's % on negatives does not match long division.", "Insert \"(\" at the position where the repeated remainder was first seen, not at the start of the fraction."],
    time:"O(d) where d < |denominator| is the number of fractional digits",space:"O(d)",
    solution:`class Solution:
    def fractionToDecimal(self, numerator: int, denominator: int):
        if numerator == 0:
            return "0"
        sign = "-" if (numerator < 0) != (denominator < 0) else ""
        numerator, denominator = abs(numerator), abs(denominator)
        whole, remainder = divmod(numerator, denominator)
        if remainder == 0:
            return sign + str(whole)
        digits = []
        seen = {}
        while remainder and remainder not in seen:
            seen[remainder] = len(digits)
            remainder *= 10
            digits.append(str(remainder // denominator))
            remainder %= denominator
        if remainder:
            start = seen[remainder]
            fraction = "".join(digits[:start]) + "(" + "".join(digits[start:]) + ")"
        else:
            fraction = "".join(digits)
        return sign + str(whole) + "." + fraction
`,
    cases:[{args:[1,2],expected:"0.5"},{args:[4,333],expected:"0.(012)"},{args:[2,1],expected:"2"},{args:[-50,8],expected:"-6.25"},{args:[1,6],expected:"0.1(6)"},{args:[0,-5],expected:"0"},{args:[7,-12],expected:"-0.58(3)"}],
  },
  {
    id:"dsa-math-nth-divisible",title:"Nth Number Divisible by A or B",category:"Math & Number Theory",difficulty:"Hard",level:7,
    description:"A positive integer qualifies if it is divisible by a or by b (or both). Return the nth smallest qualifying integer modulo 1,000,000,007.",
    constraints:["1 <= n <= 10^9", "2 <= a, b <= 40000"],method:"nthMagicalNumber",signature:"n: int, a: int, b: int",
    intuition:"The number of qualifying integers ≤ x is x//a + x//b − x//lcm(a, b) by inclusion–exclusion, and it never decreases as x grows. Binary search for the smallest x whose count reaches n.",
    triggers:["\"Nth smallest\" over a huge implicit sorted set", "A monotonic counting function is easy to evaluate"],
    pitfalls:["Subtract multiples of lcm(a, b) once so they are not double-counted.", "Search the true value and apply the modulo only to the final answer.", "lcm(a, b) = a // gcd(a, b) * b."],
    time:"O(log(n · min(a, b)) + log min(a, b))",space:"O(1)",
    solution:`class Solution:
    def nthMagicalNumber(self, n: int, a: int, b: int):
        x, y = a, b
        while y:
            x, y = y, x % y
        lcm = a // x * b
        low, high = 1, n * min(a, b)
        while low < high:
            mid = (low + high) // 2
            if mid // a + mid // b - mid // lcm >= n:
                high = mid
            else:
                low = mid + 1
        return low % 1000000007
`,
    cases:[{args:[1,2,3],expected:2},{args:[4,2,3],expected:6},{args:[5,2,4],expected:10},{args:[3,6,4],expected:8},{args:[1000000000,40000,40000],expected:999720007}],
  },

  // ── Math & Geometry ─────────────────────────────────────────────────────────
  {
    id:"dsa-geometry-rect-area",title:"Area Covered by Two Rectangles",category:"Math & Geometry",difficulty:"Medium",level:3,
    description:"Two axis-aligned rectangles are given as [x1, y1, x2, y2], where (x1, y1) is the bottom-left corner and (x2, y2) the top-right corner. Return the total area covered by at least one of them.",
    constraints:["-10^4 <= coordinates <= 10^4", "x1 <= x2 and y1 <= y2 for each rectangle"],method:"totalArea",signature:"a: list[int], b: list[int]",
    intuition:"Add both areas and subtract the overlap once. The overlap's width is min(right edges) − max(left edges), clamped at zero, and likewise for its height.",
    triggers:["Union area of two axis-aligned boxes", "Interval overlap applied to each axis independently"],
    pitfalls:["Clamp negative overlap widths and heights to zero for separated rectangles.", "Rectangles that only touch along an edge overlap with zero area.", "One rectangle may contain the other."],
    time:"O(1)",space:"O(1)",
    solution:`class Solution:
    def totalArea(self, a: list[int], b: list[int]):
        area_a = (a[2] - a[0]) * (a[3] - a[1])
        area_b = (b[2] - b[0]) * (b[3] - b[1])
        width = max(0, min(a[2], b[2]) - max(a[0], b[0]))
        height = max(0, min(a[3], b[3]) - max(a[1], b[1]))
        return area_a + area_b - width * height
`,
    cases:[{args:[[-3,0,3,4],[0,-1,9,2]],expected:45},{args:[[-2,-2,2,2],[-2,-2,2,2]],expected:16},{args:[[0,0,1,1],[2,2,3,3]],expected:2},{args:[[0,0,2,2],[2,0,4,2]],expected:8},{args:[[0,0,4,4],[1,1,2,2]],expected:16}],
  },
  {
    id:"dsa-geometry-max-points",title:"Most Points on One Line",category:"Math & Geometry",difficulty:"Hard",level:7,
    description:"Given a list of distinct points with integer coordinates, return the largest number of them that lie on one straight line.",
    constraints:["1 <= len(points) <= 300", "-10^4 <= x, y <= 10^4", "All points are distinct."],method:"maxPoints",signature:"points: list[list[int]]",
    intuition:"Fix an anchor point and group every later point by the direction to it. Represent the direction exactly as a reduced integer pair (dy, dx) divided by their gcd with a canonical sign, so equal slopes produce equal keys without floating-point error.",
    triggers:["Collinearity among many points", "Slopes must be compared exactly"],
    pitfalls:["Floating-point slopes can merge or split lines incorrectly—use reduced integer pairs.", "Normalize the sign so (1, 2) and (−1, −2) match, and handle vertical lines (dx = 0).", "A single point is a line of one."],
    time:"O(n² · log C) for coordinate range C",space:"O(n)",
    solution:`from math import gcd
class Solution:
    def maxPoints(self, points: list[list[int]]):
        best = 1
        for i, (x1, y1) in enumerate(points):
            slopes = {}
            for x2, y2 in points[i + 1:]:
                dx, dy = x2 - x1, y2 - y1
                g = gcd(dx, dy)
                dx, dy = dx // g, dy // g
                if dx < 0 or (dx == 0 and dy < 0):
                    dx, dy = -dx, -dy
                slopes[(dx, dy)] = slopes.get((dx, dy), 0) + 1
                best = max(best, slopes[(dx, dy)] + 1)
        return best
`,
    cases:[{args:[[[1,1],[2,2],[3,3]]],expected:3},{args:[[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]],expected:4},{args:[[[0,0]]],expected:1},{args:[[[0,0],[0,5],[0,-3],[2,1]]],expected:3},{args:[[[1,1],[2,3]]],expected:2},{args:[[[0,0],[2,1],[4,2],[1,1],[3,3],[-2,-1]]],expected:4}],
  },
  {
    id:"dsa-geometry-convex-hull",title:"Fence Around Every Tree (Convex Hull)",category:"Math & Geometry",difficulty:"Hard",level:8,
    description:"Trees stand at distinct integer points. A fence of minimum length is wrapped around all of them; it is the boundary of their convex hull. Return every tree that lies on the fence, including trees in the middle of a straight fence segment, as [x, y] pairs sorted by x and then by y.",
    constraints:["1 <= len(points) <= 3000", "0 <= x, y <= 100", "All points are distinct."],method:"outerTrees",signature:"points: list[list[int]]",
    intuition:"Sort the points and build the lower and upper hulls with a stack (Andrew's monotone chain). The cross product of the last two stack points and the new point tells you the turn direction; pop only on a clockwise turn (cross < 0) so collinear boundary points are kept.",
    triggers:["Smallest convex boundary enclosing points", "Orientation tests with cross products"],
    pitfalls:["Popping on cross <= 0 drops collinear boundary points the problem asks for.", "If every point is collinear both chains contain all points—deduplicate before returning.", "Return lists sorted by (x, y) so the answer is deterministic."],
    time:"O(n log n)",space:"O(n)",
    solution:`class Solution:
    def outerTrees(self, points: list[list[int]]):
        pts = sorted(map(tuple, points))
        if len(pts) <= 2:
            return [list(p) for p in pts]
        def cross(o, a, b):
            return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
        lower, upper = [], []
        for p in pts:
            while len(lower) >= 2 and cross(lower[-2], lower[-1], p) < 0:
                lower.pop()
            lower.append(p)
        for p in reversed(pts):
            while len(upper) >= 2 and cross(upper[-2], upper[-1], p) < 0:
                upper.pop()
            upper.append(p)
        return [list(p) for p in sorted(set(lower + upper))]
`,
    cases:[{args:[[[1,1],[2,2],[2,0],[2,4],[3,3],[4,2]]],expected:[[1,1],[2,0],[2,4],[3,3],[4,2]]},{args:[[[1,2],[2,2],[4,2]]],expected:[[1,2],[2,2],[4,2]]},{args:[[[0,0]]],expected:[[0,0]]},{args:[[[0,0],[0,2],[2,0],[2,2],[1,1],[1,0]]],expected:[[0,0],[0,2],[1,0],[2,0],[2,2]]},{args:[[[3,0],[0,3],[3,3],[0,0],[1,2],[2,1]]],expected:[[0,0],[0,3],[3,0],[3,3]]}],
  },
];

export const FOUNDATIONS_PLUS_PROBLEMS = problems.map(makeProblem);
