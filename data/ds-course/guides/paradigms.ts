import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const PARADIGMS_GUIDES: Record<string, DsGuide> = {
  "divide-and-conquer": {
    level: "Intermediate",
    analogy: "A teacher has 64 exam papers to find the top score. She splits the pile in half and gives each half to an assistant, who splits theirs again, and so on, until each person has one paper. Then answers flow back up: each person compares the two answers they get back and passes on the better one.",
    explain: [
      "**Divide and conquer** solves a problem in three moves. **Divide**: break it into smaller pieces of the same kind. **Conquer**: solve each piece with the same function (recursion). **Combine**: build the answer from the pieces' answers. Every recursive function needs a **base case**, a piece so small the answer is obvious.",
      "You've already met it: merge sort (split, sort halves, merge) and binary search (split, keep one half). Binary search only recurses into **one** half, which is why it's so fast.",
      "When each step **halves** the problem, the recursion is only about log₂ n levels deep. That's the source of the 'log n' in so many running times. **Fast power** is a beautiful example: to compute xⁿ, compute y = x^(n/2) once and square it. That's O(log n) multiplications instead of n.",
      "To estimate the cost, ask two questions: how many levels are there, and how much work happens at each level? For example, two halves plus O(n) combine work per level, over log n levels, gives O(n log n).",
      "Divide and conquer works best when the pieces are **independent**. When the same small pieces show up over and over, caching their answers turns it into **dynamic programming** (coming up soon).",
    ],
    simpleCode: py`
# Divide and conquer: split, solve the pieces recursively, combine.

def power(x, n, depth=0):
    """x ** n using about log2(n) multiplications."""
    print("    " * depth + f"power({x}, {n})")
    if n == 0:
        return 1                                   # base case
    half = power(x, n // 2, depth + 1)             # solve ONE smaller problem...
    if n % 2 == 0:
        return half * half                         # ...and reuse it twice
    return half * half * x                         # odd n needs one extra x


def biggest(items, lo, hi):
    """Max of items[lo..hi] by splitting in half."""
    if lo == hi:
        return items[lo]                           # base case: one item
    mid = (lo + hi) // 2
    left = biggest(items, lo, mid)                 # conquer the left half
    right = biggest(items, mid + 1, hi)            # conquer the right half
    return max(left, right)                        # combine


def count_inversions(items):
    """Count pairs i < j with items[i] > items[j], while merge-sorting."""
    if len(items) <= 1:
        return items, 0
    mid = len(items) // 2
    left, a = count_inversions(items[:mid])
    right, b = count_inversions(items[mid:])
    merged, i, j, crossing = [], 0, 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
            crossing += len(left) - i              # right[j] is smaller than ALL remaining left items
    merged += left[i:] + right[j:]
    return merged, a + b + crossing


print("2 ** 10 =", power(2, 10), "(only 5 levels of calls, not 10)")
scores = [3, 8, 2, 9, 4, 7, 1, 6]
print("biggest:", biggest(scores, 0, len(scores) - 1))
print("inversions in [3, 1, 2, 5, 4]:", count_inversions([3, 1, 2, 5, 4])[1], "-> (3,1) (3,2) (5,4)")
`,
    simpleOutput: `power(2, 10)
    power(2, 5)
        power(2, 2)
            power(2, 1)
                power(2, 0)
2 ** 10 = 1024 (only 5 levels of calls, not 10)
biggest: 9
inversions in [3, 1, 2, 5, 4]: 3 -> (3,1) (3,2) (5,4)`,
    codeNotes: [
      "`power` halves `n` each call, so `power(2, 10)` makes calls with n = 10, 5, 2, 1, 0. That's 5 levels instead of 10 multiplications. The indented printout shows the recursion depth.",
      "The key trick is computing `half` **once** and squaring it. Calling `power(x, n // 2)` twice would undo the whole speed-up.",
      "`biggest` shows the classic pattern: a base case of one item, two recursive calls on the halves, and a combine step (`max`).",
      "`count_inversions` piggybacks on merge sort. When a right-side item is placed before the remaining left-side items, it forms an inversion with every one of them, so they're counted all at once.",
    ],
    takeaways: [
      "Divide → conquer (recurse) → combine; always have a base case.",
      "Halving each step → about log₂ n levels deep.",
      "Cost ≈ (number of levels) × (work per level).",
      "Overlapping pieces? Cache them: that's dynamic programming.",
    ],
  },

  backtracking: {
    level: "Intermediate",
    analogy: "Solving a maze by walking. At each fork you pick a path. If you hit a dead end, you walk back to the last fork and try a different path. You never walk down the same bad corridor twice, and you give up on a corridor as soon as you can see it's blocked.",
    explain: [
      "**Backtracking** builds a solution **one choice at a time**. At each step, try every available choice: make it, explore further (recursion), then **undo it** so the next choice starts from a clean state. That 'undo' is what gives backtracking its name.",
      "The choices form a **decision tree**. The root is 'nothing chosen yet', each level is one decision, and each leaf is a complete candidate. Backtracking is a depth-first walk over that tree.",
      "The template is always the same: `if the partial answer is complete: record it`, otherwise `for each choice: if it's allowed: choose → recurse → un-choose`. Subsets, permutations, combinations, N-Queens, Sudoku and word search all fit it.",
      "**Pruning** is what makes it practical: as soon as a partial answer **can't possibly work** (two queens attack each other, the sum is already too big), stop exploring that branch. Good pruning can cut away almost the whole tree.",
      "Backtracking is still **exponential** in the worst case: 2ⁿ subsets, n! permutations. It's the right tool when you must list all solutions or search a space too irregular for DP, and when n is small (around 20 or less).",
    ],
    simpleCode: py`
# Backtracking: choose, explore, un-choose.

def subsets(items):
    result, current = [], []

    def explore(i):
        if i == len(items):                # decided about every item: record a copy
            result.append(current[:])
            return
        current.append(items[i])           # choice 1: take items[i]
        explore(i + 1)
        current.pop()                      # UNDO the choice...
        explore(i + 1)                     # choice 2: skip items[i]

    explore(0)
    return result


def permutations(items):
    result, current, used = [], [], [False] * len(items)

    def explore():
        if len(current) == len(items):
            result.append("".join(current))
            return
        for i, item in enumerate(items):
            if not used[i]:
                used[i] = True; current.append(item)      # choose
                explore()                                  # explore
                used[i] = False; current.pop()            # un-choose
    explore()
    return result


def n_queens(n):
    """Place n queens so none attack each other; return the first solution (one column per row)."""
    cols = []                              # cols[r] = column of the queen in row r

    def safe(row, col):
        for r, c in enumerate(cols):
            if c == col or abs(c - col) == row - r:   # same column or same diagonal
                return False
        return True

    def place(row):
        if row == n:
            return True                    # all rows filled
        for col in range(n):
            if safe(row, col):             # prune: never explore an attacked square
                cols.append(col)
                if place(row + 1):
                    return True
                cols.pop()                 # dead end below: backtrack
        return False

    place(0)
    return cols


print("subsets of [1, 2, 3]:", subsets([1, 2, 3]))
print("permutations of 'abc':", permutations("abc"))
solution = n_queens(4)
print("4-queens, column per row:", solution)
for row in range(4):
    print("  " + " ".join("Q" if solution[row] == c else "." for c in range(4)))
`,
    simpleOutput: `subsets of [1, 2, 3]: [[1, 2, 3], [1, 2], [1, 3], [1], [2, 3], [2], [3], []]
permutations of 'abc': ['abc', 'acb', 'bac', 'bca', 'cab', 'cba']
4-queens, column per row: [1, 3, 0, 2]
  . Q . .
  . . . Q
  Q . . .
  . . Q .`,
    codeNotes: [
      "`subsets` makes a yes/no decision for each item. `current.append` is 'take it', `current.pop()` undoes that, and the second `explore` call is 'skip it'. Every path through the decisions is one subset.",
      "`result.append(current[:])` stores a **copy**. Storing `current` itself would leave you with many references to the same list, which ends up empty.",
      "`permutations` tracks which items are already `used`. For each free item it chooses, recurses, then un-chooses, restoring both `used` and `current`.",
      "`n_queens` places one queen per row. `safe` prunes any square attacked by an earlier queen (same column, or a diagonal where the row distance equals the column distance).",
      "When `place(row + 1)` fails, `cols.pop()` removes the queen and the loop tries the next column. That's the backtrack. The visualizer shows every step for 4 queens.",
    ],
    takeaways: [
      "Template: if complete → record; else for each choice: choose, recurse, undo.",
      "It's a DFS over a decision tree.",
      "Prune early: skip branches that can't succeed.",
      "Exponential worst case; fine for small n or heavily pruned searches.",
    ],
  },

  "dp-memoization-tabulation": {
    level: "Intermediate",
    analogy: "If someone asks you '1+1+1+1+1 = ?', you count: 5. If they then add '+1', you don't count all over again. You remember 5 and say 6. Dynamic programming is just that: write down answers to smaller questions so you never work them out twice.",
    explain: [
      "**Dynamic programming (DP)** solves a problem by combining answers to **smaller versions of the same problem**, and it computes each smaller version **only once**. It applies when (1) the answer can be built from answers to subproblems, and (2) the same subproblems come up again and again (**overlapping subproblems**).",
      "Fibonacci shows why. `fib(n) = fib(n-1) + fib(n-2)`. Written as plain recursion, `fib(5)` calls `fib(3)` twice and `fib(2)` three times, and the work doubles with every extra n: exponential time. Yet there are only n different questions!",
      "**Memoization (top-down)**: keep the recursive function, but store each answer in a dict (or use `@functools.cache`). Before computing, check whether the answer is already known. Each subproblem is now solved once, so fib becomes O(n).",
      "**Tabulation (bottom-up)**: fill a table from the smallest subproblem up, with a loop, so that everything a cell needs is already filled in. There's no recursion, so there's no recursion-depth limit, and you can often keep only the last row or two to save memory.",
      "Every DP problem comes down to three decisions. **State**: what does `dp[i]` mean, in words? **Transition**: how is `dp[i]` built from smaller states? **Base case**: which answers are known directly? Write these in a comment before coding.",
    ],
    simpleCode: py`
# Dynamic programming: never solve the same subproblem twice.
from functools import cache

calls = 0
def fib_slow(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib_slow(n - 1) + fib_slow(n - 2)      # recomputes the same values again and again

memo_calls = 0
memo = {}
def fib_memo(n):
    global memo_calls
    memo_calls += 1
    if n < 2:
        return n
    if n not in memo:                               # compute each n only once
        memo[n] = fib_memo(n - 1) + fib_memo(n - 2)
    return memo[n]

@cache                                              # the standard-library way to memoize
def fib_cached(n):
    return n if n < 2 else fib_cached(n - 1) + fib_cached(n - 2)


def min_coins(coins, amount):
    """Fewest coins that add up to amount (-1 if impossible). Bottom-up table."""
    # State: best[a] = fewest coins to make amount a.
    # Transition: best[a] = 1 + min(best[a - coin]) over coins that fit.
    # Base case: best[0] = 0.
    INF = float("inf")
    best = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a and best[a - coin] + 1 < best[a]:
                best[a] = best[a - coin] + 1
    print("  table:", ["inf" if b == INF else b for b in best])
    return -1 if best[amount] == INF else best[amount]


print("fib_slow(20) =", fib_slow(20), "using", calls, "calls")
print("fib_memo(20) =", fib_memo(20), "using", memo_calls, "calls")
print("fib_cached(90) =", fib_cached(90))

print("min_coins([1, 2, 5], 11):")
print("  answer:", min_coins([1, 2, 5], 11), "(5 + 5 + 1)")
print("min_coins([2], 3):")
print("  answer:", min_coins([2], 3))
`,
    simpleOutput: `fib_slow(20) = 6765 using 21891 calls
fib_memo(20) = 6765 using 39 calls
fib_cached(90) = 2880067194370816120
min_coins([1, 2, 5], 11):
  table: [0, 1, 1, 2, 2, 1, 2, 2, 3, 3, 2, 3]
  answer: 3 (5 + 5 + 1)
min_coins([2], 3):
  table: [0, 'inf', 1, 'inf']
  answer: -1`,
    codeNotes: [
      "`fib_slow` is the plain recursion. It needs 21,891 calls for n = 20, because the same values are recomputed over and over.",
      "`fib_memo` adds a dict. Each `n` is computed once, and later calls just read `memo[n]`. Only 39 calls are needed for the same answer.",
      "`@cache` from `functools` does the memo dict for you. `fib_cached(90)` returns instantly, while the slow version would take years.",
      "`min_coins` is bottom-up. The comment states the **state**, the **transition** and the **base case** before the code. The table is filled from amount 0 upwards, so `best[a - coin]` is always ready.",
      "The printed table shows `best[a]` for every amount. An `inf` that stays at the end means the amount can't be made, so the function returns -1.",
    ],
    takeaways: [
      "DP = recursion + never solving a subproblem twice.",
      "Top-down: memoize with a dict or `@cache`. Bottom-up: fill a table in order.",
      "Define the state, transition and base case in words first.",
      "Turns exponential time into (number of states) × (work per state).",
    ],
  },

  "dp-two-dimensional": {
    level: "Intermediate",
    analogy: "Comparing two versions of an essay to find what they have in common. You build a grid: rows are the words of version 1, columns the words of version 2. Each cell answers 'how much do the first i words and the first j words share?', and each answer is built from the cells just above and to the left.",
    explain: [
      "Some problems need **two numbers** to describe a subproblem: a position in each of two strings, or 'the first i items with capacity w'. Then the DP table is a **grid**, `dp[i][j]`, and we fill it row by row so the cells it depends on (above, left, diagonal) are always ready.",
      "**Longest common subsequence (LCS)**: the longest sequence of characters that appears in both strings in order, though not necessarily side by side. `dp[i][j]` = LCS length of the first i characters of `a` and the first j characters of `b`. If `a[i-1] == b[j-1]`, the characters match and extend the diagonal: `dp[i-1][j-1] + 1`. Otherwise, drop one character from either string and take the better result: `max(dp[i-1][j], dp[i][j-1])`.",
      "**0/1 knapsack**: items have a weight and a value, and you have a bag of capacity W. Each item is taken whole or not at all. `dp[i][w]` = the best value using the first i items with capacity w. For item i, either **skip** it (`dp[i-1][w]`) or **take** it, if it fits (`dp[i-1][w - weight] + value`). Keep the better one.",
      "The table has (n + 1) × (m + 1) cells and each cell takes O(1), so both problems run in **O(n × m)**. Row 0 and column 0 are the base cases: an empty string, or zero items, gives 0.",
      "Edit distance, grid path counting, and 'distinct subsequences' all use this same grid pattern.",
    ],
    simpleCode: py`
# Two-dimensional DP: the table is a grid indexed by two numbers.

def lcs(a, b):
    # dp[i][j] = length of the LCS of a[:i] and b[:j]
    dp = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]   # row 0 / column 0 = empty string
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1              # match: extend the diagonal
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])   # drop a char from one side
    # walk back from the bottom-right corner to recover the actual subsequence
    i, j, letters = len(a), len(b), []
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            letters.append(a[i - 1]); i -= 1; j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return dp[len(a)][len(b)], "".join(reversed(letters)), dp


def knapsack(items, capacity):
    """items: list of (name, weight, value). Each item is taken whole or not at all."""
    n = len(items)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]       # dp[i][w]: first i items, capacity w
    for i in range(1, n + 1):
        name, weight, value = items[i - 1]
        for w in range(capacity + 1):
            dp[i][w] = dp[i - 1][w]                           # skip item i
            if weight <= w:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - weight] + value)   # or take it
    chosen, w = [], capacity
    for i in range(n, 0, -1):                                # which items did we take?
        if dp[i][w] != dp[i - 1][w]:
            chosen.append(items[i - 1][0])
            w -= items[i - 1][1]
    return dp[n][capacity], chosen[::-1]


length, text, table = lcs("ABCBD", "BDCAB")
print("LCS of ABCBD and BDCAB:", length, repr(text))
print("table:")
for row in table:
    print("  ", row)

loot = [("book", 1, 15), ("lamp", 3, 20), ("radio", 4, 30)]
print("knapsack, capacity 4:", knapsack(loot, 4))
print("knapsack, capacity 5:", knapsack(loot, 5))
`,
    simpleOutput: `LCS of ABCBD and BDCAB: 3 'BCB'
table:
   [0, 0, 0, 0, 0, 0]
   [0, 0, 0, 0, 1, 1]
   [0, 1, 1, 1, 1, 2]
   [0, 1, 1, 2, 2, 2]
   [0, 1, 1, 2, 2, 3]
   [0, 1, 2, 2, 2, 3]
knapsack, capacity 4: (35, ['book', 'lamp'])
knapsack, capacity 5: (45, ['book', 'radio'])`,
    codeNotes: [
      "`dp` has one extra row and column for the empty prefix. `dp[0][*]` and `dp[*][0]` stay 0, and those are the base cases.",
      "In `lcs`, a match copies the diagonal plus one. A mismatch takes the better of 'skip a character of a' (above) and 'skip a character of b' (left).",
      "The answer is the bottom-right cell. Walking back from there (diagonal on a match, otherwise toward the bigger neighbour) recovers one actual subsequence.",
      "In `knapsack`, every cell first copies 'skip this item' from the row above, then checks whether taking the item gives more. That's `dp[i - 1][w - weight] + value`.",
      "With capacity 4, book + lamp (weight 4, value 35) beats the radio alone (30). With capacity 5, book + radio (45) wins. The walk-back loop finds which items were chosen: wherever a row's value differs from the row above, that item was taken.",
    ],
    takeaways: [
      "Two-number state → 2-D table; fill so dependencies are ready.",
      "LCS: match → diagonal + 1; else max(up, left).",
      "0/1 knapsack: max(skip, take if it fits).",
      "O(n × m) time; walk back through the table to rebuild the answer.",
    ],
  },

  "dp-advanced": {
    level: "Advanced",
    analogy: "Building the tallest staircase of increasing steps from a pile of numbered blocks that arrive one at a time. Instead of remembering every staircase you could build, you keep a single cheat sheet: for each length, the smallest top step any staircase of that length can have. A small top is easier to build on.",
    explain: [
      "Some DP problems need a cleverer **state** than a simple index. This lesson shows three common shapes.",
      "**Longest increasing subsequence (LIS)** in O(n log n). Keep `tails[k]` = the **smallest possible last value** of an increasing subsequence of length k + 1. For each new number x, binary-search `tails` for the first value ≥ x and replace it with x (a smaller tail is never worse). If x is bigger than every tail, append it, because the best length just grew. The answer is `len(tails)`. Note: `tails` itself is not the subsequence, only its length is meaningful.",
      "**Bitmask DP**: when the state is 'which subset of up to ~15 items have I used?', store the subset as the bits of an integer. Bit i is 1 if item i is used. `mask | (1 << i)` adds item i, and `mask & (1 << i)` tests it. There are 2ⁿ masks, which is why n has to be small. Classic example: the shortest route visiting every city (travelling salesman).",
      "**Interval DP**: when the answer for a range `[i, j]` depends on smaller ranges inside it, fill the table **by increasing length**: all ranges of length 1, then length 2, and so on. **Longest palindromic subsequence**: if `s[i] == s[j]`, then `dp[i][j] = dp[i+1][j-1] + 2`; otherwise `max(dp[i+1][j], dp[i][j-1])`.",
      "The skill being practised is choosing the state: what is the smallest summary of 'what happened so far' that still lets you decide the future correctly?",
    ],
    simpleCode: py`
# Three advanced DP state shapes: a tails array, a bitmask and an interval.
import bisect


def lis_length(nums):
    tails = []                                   # tails[k] = smallest end of an increasing run of length k+1
    for x in nums:
        k = bisect.bisect_left(tails, x)         # first tail >= x
        if k == len(tails):
            tails.append(x)                      # x extends the longest run
        else:
            tails[k] = x                         # x is a smaller (better) end for length k+1
        print(f"  {x:>2} -> tails = {tails}")
    return len(tails)


def shortest_tour(dist):
    """Travelling salesman on a few cities: start and end at city 0, visit all once."""
    n = len(dist)
    INF = float("inf")
    # best[mask][last] = shortest path from 0 that visits exactly the cities in mask, ending at last
    best = [[INF] * n for _ in range(1 << n)]
    best[1][0] = 0                               # mask 0b0001: only city 0 visited, standing at 0
    for mask in range(1 << n):
        for last in range(n):
            if best[mask][last] == INF:
                continue
            for nxt in range(n):
                if mask & (1 << nxt):            # already visited
                    continue
                new_mask = mask | (1 << nxt)     # add city nxt to the set
                cost = best[mask][last] + dist[last][nxt]
                best[new_mask][nxt] = min(best[new_mask][nxt], cost)
    full = (1 << n) - 1
    return min(best[full][last] + dist[last][0] for last in range(n))


def longest_palindrome_subseq(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]             # dp[i][j] = answer for s[i..j]
    for i in range(n):
        dp[i][i] = 1                             # length 1: every char is a palindrome
    for length in range(2, n + 1):               # fill by increasing interval length
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                dp[i][j] = dp[i + 1][j - 1] + 2  # matching ends wrap the inside
            else:
                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
    return dp[0][n - 1]


print("LIS of [3, 1, 4, 1, 5, 9, 2, 6]:")
print("  length:", lis_length([3, 1, 4, 1, 5, 9, 2, 6]))

roads = [[0, 2, 9, 10],
         [2, 0, 6, 4],
         [9, 6, 0, 3],
         [10, 4, 3, 0]]
print("shortest tour of 4 cities:", shortest_tour(roads), "(0 -> 1 -> 3 -> 2 -> 0 = 2 + 4 + 3 + 9)")
print("longest palindromic subsequence of 'character':", longest_palindrome_subseq("character"), "('carac')")
`,
    simpleOutput: `LIS of [3, 1, 4, 1, 5, 9, 2, 6]:
   3 -> tails = [3]
   1 -> tails = [1]
   4 -> tails = [1, 4]
   1 -> tails = [1, 4]
   5 -> tails = [1, 4, 5]
   9 -> tails = [1, 4, 5, 9]
   2 -> tails = [1, 2, 5, 9]
   6 -> tails = [1, 2, 5, 6]
  length: 4
shortest tour of 4 cities: 18 (0 -> 1 -> 3 -> 2 -> 0 = 2 + 4 + 3 + 9)
longest palindromic subsequence of 'character': 5 ('carac')`,
    codeNotes: [
      "`lis_length` keeps `tails` sorted, so `bisect_left` finds where `x` belongs in O(log n). The printout shows each number either extending `tails` or replacing a bigger tail.",
      "In the LIS printout, `tails` ends as `[1, 2, 5, 6]`. Its length (4) is the answer, but it isn't necessarily a real subsequence. One real answer is 1, 4, 5, 9.",
      "`shortest_tour` stores visited cities as bits of `mask`. `mask & (1 << nxt)` checks whether a city was visited, and `mask | (1 << nxt)` adds it. With 4 cities there are only 16 masks.",
      "`longest_palindrome_subseq` loops over `length` first, so `dp[i + 1][j - 1]` (a shorter interval) is always filled before `dp[i][j]` needs it.",
    ],
    takeaways: [
      "LIS: `tails` + `bisect` → O(n log n); the length of tails is the answer.",
      "Bitmask DP: a subset as an int; 2ⁿ states, so n ≲ 15–20.",
      "Interval DP: fill by increasing length.",
      "The hard part is the state: the smallest summary of the past that's enough.",
    ],
  },

  greedy: {
    level: "Intermediate",
    analogy: "Booking as many meetings as possible into one room. The trick: always pick the meeting that **finishes earliest** among the ones that still fit. Finishing early leaves the most time for everything else. You never need to reconsider a choice.",
    explain: [
      "A **greedy algorithm** builds the answer step by step, always taking the choice that looks **best right now**, and never going back. It's simple and fast (often just a sort plus one pass). The catch is that greedy is only correct for some problems, so you need a reason to believe it works.",
      "**Interval scheduling**: given meetings `(start, end)`, choose the most that don't overlap. Greedy rule: sort by **end time**, then take each meeting whose start is at or after the end of the last one you took. Why does it work? Whatever the best schedule picks first, swapping it for the earliest-ending meeting can't hurt, because that meeting frees the room at least as early. This is called an **exchange argument**.",
      "Greedy rules that **sound** right often aren't. Picking the **shortest** meeting first, or the one that **starts** first, both fail on simple examples. Always test a greedy idea against small counterexamples.",
      "**Coin change** is the famous trap. With coins 1, 5, 10, 25, taking the biggest coin that fits always gives the fewest coins. But with coins 1, 3, 4 and amount 6, greedy takes 4 + 1 + 1 (3 coins), while 3 + 3 (2 coins) is better. When greedy fails, use DP.",
      "Other classic greedy algorithms: Dijkstra, Kruskal and Prim (MST), Huffman coding, and jump game. In each one, the 'best now' choice is provably safe.",
    ],
    simpleCode: py`
# Greedy: take the best-looking choice now and never undo it. It's only right with a proof.

def max_meetings(meetings):
    """Most non-overlapping meetings: sort by END time, take each one that fits."""
    chosen = []
    last_end = float("-inf")
    for start, end in sorted(meetings, key=lambda m: m[1]):   # earliest finish first
        if start >= last_end:                                  # fits after the last one
            chosen.append((start, end))
            last_end = end
            print(f"  take {start}-{end}")
        else:
            print(f"  skip {start}-{end} (overlaps a meeting ending at {last_end})")
    return chosen


def greedy_coins(coins, amount):
    """Always take the biggest coin that fits. Optimal for 1/5/10/25, NOT for every coin set."""
    used = []
    for coin in sorted(coins, reverse=True):
        while amount >= coin:
            used.append(coin)
            amount -= coin
    return used


meetings = [(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]
print("Scheduling, sorted by end time:")
print("max meetings:", max_meetings(meetings))

print("coins 1/5/10/25 for 63:", greedy_coins([1, 5, 10, 25], 63))
print("coins 1/3/4 for 6:", greedy_coins([1, 3, 4], 6), "<- 3 coins, but 3 + 3 uses only 2!")
`,
    simpleOutput: `Scheduling, sorted by end time:
  take 1-4
  skip 3-5 (overlaps a meeting ending at 4)
  skip 0-6 (overlaps a meeting ending at 4)
  take 5-7
  skip 3-9 (overlaps a meeting ending at 7)
  skip 5-9 (overlaps a meeting ending at 7)
  skip 6-10 (overlaps a meeting ending at 7)
  take 8-11
  skip 8-12 (overlaps a meeting ending at 11)
  skip 2-14 (overlaps a meeting ending at 11)
  take 12-16
max meetings: [(1, 4), (5, 7), (8, 11), (12, 16)]
coins 1/5/10/25 for 63: [25, 25, 10, 1, 1, 1]
coins 1/3/4 for 6: [4, 1, 1] <- 3 coins, but 3 + 3 uses only 2!`,
    codeNotes: [
      "`max_meetings` sorts by end time (`key=lambda m: m[1]`). That one line is the whole greedy rule.",
      "`last_end` remembers when the room becomes free. A meeting is taken only if it starts at or after that time. The output shows every take and skip decision.",
      "Each meeting is looked at once after sorting, so the cost is O(n log n), dominated by the sort.",
      "`greedy_coins` works for real-world coins, but the 1/3/4 example shows greedy giving a wrong (non-minimal) answer. That's the reason DP exists for coin change.",
    ],
    takeaways: [
      "Greedy = best choice now, never undo; usually sort + one pass.",
      "Interval scheduling: sort by END time.",
      "Prove it (exchange argument) or find a counterexample.",
      "When greedy fails (coin change 1/3/4), use DP.",
    ],
  },
};
