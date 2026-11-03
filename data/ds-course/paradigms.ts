import type { DsModule } from "./types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const PARADIGMS_MODULE: DsModule = {
  id: "paradigms",
  title: "Problem-solving paradigms",
  description: "Divide and conquer, backtracking, dynamic programming and greedy choice.",
  lessons: [
    {
      id: "divide-and-conquer",
      title: "Divide and conquer",
      kind: "algorithm",
      summary: "Split a problem into smaller copies of itself, solve each one recursively, then combine the answers. When the pieces halve every time, the recursion is only about log n levels deep, which is where O(log n) powers and O(n log n) sorting and counting come from.",
      concepts: [
        "Every divide-and-conquer algorithm has three parts: split the input into smaller instances of the same problem, solve each instance recursively (a tiny instance is the base case), and combine the sub-answers. To trust it, use induction: assume the recursive calls are right, then check that the base case and the combine step make the whole answer right.",
        "Its cost follows a recurrence T(n) = a*T(n/b) + f(n): a subproblems of size n/b, plus f(n) work to split and combine. Draw the recursion tree and compare the work done on each level. If the levels get cheaper going down, the top level dominates and the total is O(f(n)). If every level costs about the same, multiply by the number of levels, log n. If the levels get more expensive going down, the leaves dominate. This informal reading of the master theorem is enough for interviews.",
        "Fast exponentiation has ONE subproblem: x**n = (x**(n // 2))**2, times one more x when n is odd. That is about log2(n) squarings instead of n - 1 multiplications, so 3**(10**18) mod p takes roughly 60 steps. Computing the half twice would change the recurrence from T(n) = T(n/2) + O(1) to T(n) = 2*T(n/2) + O(1), which is O(n) again.",
        "Maximum subarray: the best slice lies entirely in the left half, entirely in the right half, or crosses the middle. A crossing slice is the best slice ending at mid - 1 joined to the best slice starting at mid, and each of those is one linear scan. That gives T(n) = 2*T(n/2) + O(n) = O(n log n). Kadane's one-pass scan (a dynamic-programming idea) does the same job in O(n), so divide and conquer is not always the fastest answer, but its split-and-merge shape is what segment trees and parallel reductions reuse.",
        "Counting inversions (pairs that are out of order) is merge sort with a counter. While merging two sorted halves, an item taken from the right half jumps ahead of every item still waiting on the left, so one step adds len(left) - i inversions at once. The combine step counts up to n*n/4 pairs in linear time."
      ],
      complexity: [
        { operation: "T(n) = T(n/2) + O(1)", time: "O(log n)", note: "one half only: power, binary search" },
        { operation: "T(n) = 2T(n/2) + O(n)", time: "O(n log n)", note: "both halves plus a linear combine: max_subarray_dc, sort_and_count, merge sort" },
        { operation: "T(n) = 2T(n/2) + O(1)", time: "O(n)", note: "both halves, constant combine: the leaves dominate" },
        { operation: "power(base, n, modulus)", time: "O(log n) multiplications", note: "with a modulus every number stays small; without one the numbers grow and each multiplication costs more" },
        { operation: "max_subarray_kadane", time: "O(n)", note: "single pass, no recursion" }
      ],
      space: "O(log n) recursion stack for power and max_subarray_dc: the depth is about log2(n), so the recursion limit is never a concern. sort_and_count uses O(n) for the merged lists. Kadane uses O(1).",
      code: py`
from __future__ import annotations

from collections.abc import Sequence


def power(base: int, exponent: int, modulus: int | None = None) -> int:
    """Return base ** exponent (reduced mod modulus when given) with O(log exponent) multiplications.

    Divide and conquer with ONE subproblem: base**n == (base**(n // 2))**2,
    times one extra base when n is odd. Precondition: exponent >= 0.
    """
    if exponent < 0:
        raise ValueError("exponent must be non-negative")

    def solve(n: int) -> int:
        if n == 0:
            return 1 if modulus is None else 1 % modulus
        half = solve(n // 2)  # computed ONCE and reused: calling it twice would make this O(n)
        result = half * half
        if n % 2:
            result *= base
        return result if modulus is None else result % modulus

    return solve(exponent)


def max_subarray_dc(nums: Sequence[int]) -> int:
    """Return the largest sum of a non-empty contiguous slice of nums in O(n log n).

    The best slice lies in the left half, in the right half, or crosses the middle.
    """
    if not nums:
        raise ValueError("nums must not be empty")

    def best_in(lo: int, hi: int) -> int:  # best slice inside nums[lo:hi], with lo < hi
        if hi - lo == 1:
            return nums[lo]
        mid = (lo + hi) // 2
        running, best_left = 0, nums[mid - 1]
        for i in range(mid - 1, lo - 1, -1):  # best slice that ENDS at mid - 1
            running += nums[i]
            best_left = max(best_left, running)
        running, best_right = 0, nums[mid]
        for i in range(mid, hi):  # best slice that STARTS at mid
            running += nums[i]
            best_right = max(best_right, running)
        return max(best_in(lo, mid), best_in(mid, hi), best_left + best_right)

    return best_in(0, len(nums))


def max_subarray_kadane(nums: Sequence[int]) -> int:
    """Return the same answer in O(n) time and O(1) space.

    Invariant: ending_here is the best sum of a slice that ends at the current item.
    """
    if not nums:
        raise ValueError("nums must not be empty")
    values = iter(nums)
    best = ending_here = next(values)
    for value in values:
        ending_here = max(value, ending_here + value)  # extend the run, or start fresh here
        best = max(best, ending_here)
    return best


def sort_and_count(items: Sequence[int]) -> tuple[list[int], int]:
    """Return (sorted copy, number of pairs i < j with items[i] > items[j]) in O(n log n).

    Merge sort plus one line: when an item from the right half is taken before
    the items still waiting on the left, it is out of order with every one of them.
    """
    if len(items) <= 1:
        return list(items), 0
    mid = len(items) // 2
    left, left_count = sort_and_count(items[:mid])
    right, right_count = sort_and_count(items[mid:])
    merged: list[int] = []
    crossing = i = j = 0
    while i < len(left) and j < len(right):
        if right[j] < left[i]:  # strict: equal items are not an inversion
            merged.append(right[j])
            crossing += len(left) - i
            j += 1
        else:
            merged.append(left[i])
            i += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged, left_count + right_count + crossing


if __name__ == "__main__":
    print(power(2, 10), power(2, 100))
    print(power(3, 10**18, 1_000_000_007) == pow(3, 10**18, 1_000_000_007))
    print("levels for a billion items:", (10**9 - 1).bit_length())

    nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
    print(max_subarray_dc(nums), max_subarray_kadane(nums), max_subarray_dc([-4, -2, -9]))

    print(sort_and_count([2, 4, 1, 3, 5]))
    print(sort_and_count([5, 4, 3, 2, 1])[1], sort_and_count([7, 7, 7])[1], sort_and_count([]))

    try:
        max_subarray_dc([])
    except ValueError as error:
        print("error:", error)
`,
      output: `1024 1267650600228229401496703205376
True
levels for a billion items: 30
6 6 -2
([1, 2, 3, 4, 5], 3)
10 0 ([], 0)
error: nums must not be empty`,
      bestPractices: [
        "Validate once in the public function, then recurse in a nested helper over half-open index ranges [lo, hi). max_subarray_dc never copies its input, whereas slicing at every level would copy O(n) items per level.",
        "Compute a shared subproblem once and reuse it: half = solve(n // 2) is called once and then squared. That one line is the difference between O(log n) and O(n).",
        "Split with mid = (lo + hi) // 2 and use a one-item base case, so neither half is ever empty and the depth stays at about log2(n) frames.",
        "Use a strict comparison in the merge (right[j] < left[i]). Equal items are then never counted as inversions and the merge stays stable.",
        "Treat inputs as read-only: sort_and_count accepts any Sequence[int], builds new lists and returns (sorted copy, count) as a tuple instead of sorting in place.",
        "Prefer the built-in when it exists: pow(base, exponent, modulus) does what power does, in C. The demo compares the two, which is also how you would test a hand-written version."
      ],
      pitfalls: [
        "Calling the half twice (solve(n // 2) * solve(n // 2)) makes two subproblems of size n/2 and the recursion O(n) again. Store the result in a variable.",
        "Forgetting the crossing case in maximum subarray: max(best(left), best(right)) misses [4, -1, 2, 1], which straddles the middle of the demo list.",
        "Splitting unevenly, for example peeling off one item per call, gives depth n and O(n^2) work, and a RecursionError past about 1000 items. Always split near the middle.",
        "Counting inversions with <= in the merge treats equal items as out of order, and adding 1 instead of len(left) - i per step counts only the pairs one at a time and gets the wrong total."
      ],
      useWhen: [
        "The problem splits into independent halves of the same shape and combining two answers is cheaper than solving from scratch: sorting, counting pairs across halves, closest pair of points.",
        "You need an O(log n) repeated operation: powers, matrix powers, Fibonacci numbers by doubling.",
        "A summary of each segment can be merged (sum, best prefix, best suffix, best): the same shape as segment trees and parallel reductions.",
        "The subproblems overlap (the same smaller instance is needed again and again): that is dynamic programming, not divide and conquer."
      ],
      inPractice: "Use the built-ins: pow(base, exp, mod) for modular powers, sorted() for sorting (Timsort is itself merge-based), and a plain Kadane scan for maximum subarray. For inversion counts on big inputs a Fenwick tree over compressed values is usually shorter and faster in Python than recursive merging. Write divide and conquer yourself when the combine step is specific to your problem and the depth is about log n, so recursion is safe.",
      challenge: {
        prompt: "Write max_subarray(nums). nums is a list of integers; raise ValueError if it is empty. Return a tuple (total, start, end): the largest sum of a non-empty contiguous slice and its bounds, so the slice is nums[start:end] (end is exclusive). If several slices share the largest sum, return the one with the smallest start and, among those, the smallest end. It must run in O(n log n) or better: the checks use 100,000 numbers, so trying every start and end will time out.",
        hint: "Split at mid. The answer is the best of three candidates: the best slice inside the left half, inside the right half, and crossing mid. For the crossing one, grow leftwards from mid - 1 keeping the best running sum and where it starts (use >= so ties keep moving left), then rightwards from mid keeping the best sum and where it ends (use > so ties stay short). Pick the winner with min(..., key=lambda c: (-c[0], c[1], c[2])).",
        starter: py`
def max_subarray(nums):
    """Return (total, start, end) of the best slice nums[start:end]."""
    # TODO: split at the middle and combine left, right and crossing candidates.
    raise NotImplementedError
`,
        solution: py`
def max_subarray(nums):
    """Return (total, start, end) of the best slice nums[start:end].

    Ties: smallest start, then smallest end. O(n log n) divide and conquer.
    """
    if not nums:
        raise ValueError("nums must not be empty")

    def rank(candidate):
        total, start, end = candidate
        return (-total, start, end)

    def solve(lo, hi):  # best slice inside nums[lo:hi], with lo < hi
        if hi - lo == 1:
            return nums[lo], lo, hi
        mid = (lo + hi) // 2
        running, left_sum, left_start = 0, nums[mid - 1], mid - 1
        for i in range(mid - 1, lo - 1, -1):
            running += nums[i]
            if running >= left_sum:  # >= keeps moving left on ties
                left_sum, left_start = running, i
        running, right_sum, right_end = 0, nums[mid], mid + 1
        for i in range(mid, hi):
            running += nums[i]
            if running > right_sum:  # > keeps the shorter slice on ties
                right_sum, right_end = running, i + 1
        crossing = (left_sum + right_sum, left_start, right_end)
        return min(solve(lo, mid), solve(mid, hi), crossing, key=rank)

    return solve(0, len(nums))
`,
        tests: py`
def brute(nums):
    best = None
    for start in range(len(nums)):
        total = 0
        for end in range(start + 1, len(nums) + 1):
            total += nums[end - 1]
            candidate = (-total, start, end)
            if best is None or candidate < best:
                best = candidate
    return (-best[0], best[1], best[2])

@check("finds the classic example with its bounds")
def _():
    eq(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]), (6, 3, 7))
    eq(max_subarray([1, 2, 3]), (6, 0, 3))

@check("handles one element and all-negative lists")
def _():
    eq(max_subarray([5]), (5, 0, 1))
    eq(max_subarray([-4, -2, -9]), (-2, 1, 2))

@check("ties go to the smallest start, then the smallest end")
def _():
    eq(max_subarray([0, 0]), (0, 0, 1))
    eq(max_subarray([2, -2, 3]), (3, 0, 3))
    eq(max_subarray([1, -1, 1]), (1, 0, 1))

@check("an empty list raises ValueError")
def _():
    raises(ValueError, max_subarray, [])

@check("matches brute force on 300 small pseudo-random lists")
def _():
    state = 12345
    for _ in range(300):
        nums = []
        for _ in range(1 + state % 12):
            state = (state * 1103515245 + 12345) % 2**31
            nums.append(state % 11 - 5)
        state = (state * 1103515245 + 12345) % 2**31
        eq(max_subarray(nums), brute(nums), "wrong answer for " + repr(nums))

@check("100,000 numbers finish quickly (no O(n^2) scan)")
def _():
    nums = [((i * 7919) % 201) - 100 for i in range(100_000)]
    total, start, end = max_subarray(nums)
    eq(sum(nums[start:end]), total)
    best = running = nums[0]
    for value in nums[1:]:
        running = max(value, running + value)
        best = max(best, running)
    eq(total, best)
`
      },
      practice: ["Sorting", "Math & Number Theory", "Backtracking & Recursion"],
      source: "https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms)"
    },
    {
      id: "backtracking",
      title: "Backtracking",
      kind: "algorithm",
      summary: "Build an answer one decision at a time, and undo the decision when you come back. With pruning it solves enumeration and constraint problems (subsets, permutations, N-Queens) without ever generating the hopeless branches.",
      concepts: [
        "Backtracking walks the tree of all partial answers depth first. At each node it does three things in order: choose an option (add it to the current partial answer), explore everything that can follow, then unchoose (remove the option again). Undoing the choice puts the shared state back exactly as it was, so the next sibling starts clean. Forgetting to undo is the classic bug.",
        "Pruning is what makes it practical: return as soon as a partial answer cannot lead to a valid one (a queen on an attacked square, too few items left to fill a combination, a running sum already over the target). The worst case stays exponential, but N-Queens on an 8x8 board visits 2,057 partial boards instead of the 16,777,216 ways to put one queen in each row without checking.",
        "Enumerate with generators. The number of answers is exponential (2**n subsets, n! permutations), so yield one at a time instead of returning a list: the caller can stop early with next(), islice or any(), and memory stays O(depth). One trap: the partial answer is a single mutable list, so yield a copy (chosen.copy() or tuple(chosen)); otherwise every result is the same list and ends up empty.",
        "To skip duplicates, sort first so equal items sit next to each other. For permutations, skip ordered[i] when it equals ordered[i - 1] and ordered[i - 1] is not in use: equal items must be used left to right, so each distinct arrangement appears once. For subsets and combinations, skip items[i] when i > start and it equals items[i - 1]. As a bonus the answers come out in lexicographic order.",
        "Keep the state in structures that update and restore in O(1): a list for the path, a list of booleans or sets for what is taken. N-Queens keeps three sets (columns, and the two diagonals, since row - col is constant along one diagonal and row + col along the other), so testing a square never scans the board."
      ],
      complexity: [
        { operation: "subsets(items)", time: "O(n * 2^n) to produce all", note: "2^n answers, each copy costs up to O(n); the first one arrives in O(1)" },
        { operation: "k_combinations(items, k)", time: "O(k * C(n, k)) to produce all", note: "the loop bound stops branches that cannot reach k items" },
        { operation: "unique_permutations(items)", time: "O(n * n!) worst case", note: "fewer when items repeat: n! divided by the factorial of each multiplicity" },
        { operation: "n_queens(n)", time: "exponential, but small in practice", note: "n = 8: 2,057 partial boards visited, 92 solutions" },
        { operation: "next(n_queens(n))", time: "far less than enumerating all", note: "a generator stops when the caller stops asking" }
      ],
      space: "O(n) for the path, the used markers and the recursion stack (depth is the solution length). The results are never stored: each one is produced, consumed and forgotten.",
      code: py`
from __future__ import annotations

import itertools
from collections.abc import Iterator, Sequence
from typing import TypeVar

T = TypeVar("T")


def subsets(items: Sequence[T]) -> Iterator[list[T]]:
    """Yield all 2**n subsets of items, each as a new list, in depth-first order."""
    chosen: list[T] = []

    def explore(start: int) -> Iterator[list[T]]:
        yield chosen.copy()  # every node of the search tree is itself a subset
        for i in range(start, len(items)):
            chosen.append(items[i])  # choose
            yield from explore(i + 1)  # explore
            chosen.pop()  # unchoose

    return explore(0)


def k_combinations(items: Sequence[T], k: int) -> Iterator[list[T]]:
    """Yield every k-item combination of items, keeping the input order inside each."""
    if k < 0:
        raise ValueError("k must be non-negative")  # no yield in THIS function, so it raises at the call
    chosen: list[T] = []

    def explore(start: int) -> Iterator[list[T]]:
        if len(chosen) == k:
            yield chosen.copy()
            return
        still_needed = k - len(chosen)
        for i in range(start, len(items) - still_needed + 1):  # prune: leave room for the rest
            chosen.append(items[i])
            yield from explore(i + 1)
            chosen.pop()

    return explore(0)


def unique_permutations(items: Sequence[T]) -> Iterator[tuple[T, ...]]:
    """Yield each distinct permutation once, in lexicographic order (items must be orderable)."""
    ordered = sorted(items)  # equal items become neighbours
    used = [False] * len(ordered)
    chosen: list[T] = []

    def explore() -> Iterator[tuple[T, ...]]:
        if len(chosen) == len(ordered):
            yield tuple(chosen)
            return
        for i, item in enumerate(ordered):
            if used[i]:
                continue
            if i > 0 and item == ordered[i - 1] and not used[i - 1]:
                continue  # the equal twin on the left is still free: it must go first
            used[i] = True
            chosen.append(item)
            yield from explore()
            chosen.pop()
            used[i] = False

    return explore()


def n_queens(n: int) -> Iterator[tuple[int, ...]]:
    """Yield every way to place n non-attacking queens; solution[row] is that row's column."""
    cols: list[int] = []
    taken_cols: set[int] = set()
    taken_down: set[int] = set()  # row - col is constant along a "\" diagonal
    taken_up: set[int] = set()  # row + col is constant along a "/" diagonal

    def place(row: int) -> Iterator[tuple[int, ...]]:
        if row == n:
            yield tuple(cols)
            return
        for col in range(n):
            if col in taken_cols or row - col in taken_down or row + col in taken_up:
                continue  # prune: this square is attacked
            cols.append(col)
            taken_cols.add(col)
            taken_down.add(row - col)
            taken_up.add(row + col)
            yield from place(row + 1)
            taken_up.remove(row + col)
            taken_down.remove(row - col)
            taken_cols.remove(col)
            cols.pop()

    return place(0)


def render_board(solution: Sequence[int]) -> str:
    """Draw a solution with Q for queens and . for empty squares."""
    return "\n".join("".join("Q" if c == col else "." for c in range(len(solution))) for col in solution)


if __name__ == "__main__":
    print(list(subsets([1, 2, 3])))
    print(list(k_combinations([1, 2, 3, 4], 2)))
    print(list(k_combinations(range(5), 3)) == [list(c) for c in itertools.combinations(range(5), 3)])
    print(list(unique_permutations([1, 1, 2])))
    print("itertools yields", len(list(itertools.permutations([1, 1, 2]))), "but only", len(set(itertools.permutations([1, 1, 2]))), "are distinct")
    print(list(itertools.islice(subsets(range(40)), 4)))  # 2**40 subsets exist; only 4 are built

    print([sum(1 for _ in n_queens(n)) for n in range(1, 9)])
    print(render_board(next(n_queens(6))))
    print(list(n_queens(3)), list(subsets([])))

    try:
        k_combinations([1, 2], -1)
    except ValueError as error:
        print("error:", error)
`,
      output: `[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
[[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]
True
[(1, 1, 2), (1, 2, 1), (2, 1, 1)]
itertools yields 6 but only 3 are distinct
[[], [0], [0, 1], [0, 1, 2]]
[1, 0, 0, 2, 10, 4, 40, 92]
.Q....
...Q..
.....Q
Q.....
..Q...
....Q.
[] [[]]
error: k must be non-negative`,
      bestPractices: [
        "Write each search as a lazy generator that delegates with yield from. Callers pick list(...), next(...) or islice(...), and nothing is built that is not asked for: the demo takes 4 of the 2**40 subsets of a 40-item range instantly.",
        "Keep ONE shared mutable path and restore it after every recursive call (append then pop, add then remove). That is O(1) per step, where copying the path at every node would cost O(n). Copy only at the moment of yielding.",
        "Validate arguments in a plain function that returns the inner generator. A generator function runs none of its body until the first next(), so a ValueError inside it would surface late; here k_combinations([1, 2], -1) raises at the call.",
        "Sort once and add a skip rule instead of de-duplicating afterwards. set(itertools.permutations(...)) still generates all n! orderings before discarding most of them, while unique_permutations never builds a repeat.",
        "Use sets of ints for the taken columns and diagonals: O(1) membership and O(1) add/remove, and the row - col / row + col identities turn two geometric checks into two set lookups.",
        "Reach for itertools when no pruning is needed: the demo checks k_combinations against itertools.combinations, which is written in C and also lazy."
      ],
      pitfalls: [
        "Forgetting to unchoose, or undoing in the wrong place. If chosen.pop() is skipped on one path, the leftover item leaks into every later branch and results are wrong or missing. Keep choose and unchoose as a pair around the recursive call.",
        "Yielding the shared list itself (yield chosen) instead of a copy: list(subsets(...)) then returns many references to one list that is empty by the time the generator finishes.",
        "Skipping duplicates without sorting, or with the used-flag test flipped. On [1, 2, 1] the equal items are not neighbours, so the skip rule never fires and repeats come out. Sort first, and skip only when the left twin is NOT in use.",
        "Assuming a generator makes the problem cheap. There are still 2**n subsets and n! permutations; laziness only means you pay for what you consume. If you only need a count, a dynamic-programming formulation is usually far faster than enumerating."
      ],
      useWhen: [
        "The task says list, generate or enumerate all valid arrangements: subsets, permutations, combinations, partitions, well-formed strings, board placements.",
        "A constraint puzzle with a small input where you can reject partial answers early: N-Queens, Sudoku, word search, subset sum with a target.",
        "Each step is a choice you can undo cheaply (append/pop, set add/remove), and a partial answer can be tested before it is finished.",
        "You only need to know whether ANY solution exists: backtracking with an early return (or next()) stops at the first one."
      ],
      inPractice: "itertools.permutations, combinations, combinations_with_replacement and product cover most plain enumeration, in C and lazily. They treat equal values at different positions as different, so sort and use a skip rule (or more_itertools.distinct_permutations) when duplicates matter. Hand-write backtracking for constraint problems where the pruning rules are yours (queens, Sudoku, word search); for large or messy constraint problems use a solver such as OR-Tools CP-SAT.",
      challenge: {
        prompt: "Write generate_parentheses(n). Return a list of every string made of n pairs of balanced parentheses (each ')' closes an earlier '(' and the string ends fully closed), in ascending string order (in ASCII '(' sorts before ')'). generate_parentheses(0) returns [''] and a negative n raises ValueError. The checks ask for n = 12, which has 208,012 answers, so building all 2**24 strings and filtering them will time out: only ever add a character that can still lead to a balanced string.",
        hint: "Track how many '(' and ')' you have used. You may add '(' while opened < n, and you may add ')' only while closed < opened. Try '(' first and the results come out already sorted. Append, recurse, then pop.",
        starter: py`
def generate_parentheses(n):
    """Return every balanced string of n pairs of parentheses, in ascending order."""
    # TODO: backtrack with counts of '(' and ')' used so far; prune impossible branches.
    raise NotImplementedError
`,
        solution: py`
def generate_parentheses(n):
    """Return every balanced string of n pairs of parentheses, in ascending order."""
    if n < 0:
        raise ValueError("n must be non-negative")
    result = []
    path = []

    def explore(opened, closed):
        if len(path) == 2 * n:
            result.append("".join(path))
            return
        if opened < n:  # we may still open a pair
            path.append("(")
            explore(opened + 1, closed)
            path.pop()
        if closed < opened:  # we may close only a pair that is open
            path.append(")")
            explore(opened, closed + 1)
            path.pop()

    explore(0, 0)
    return result
`,
        tests: py`
def is_balanced(text):
    depth = 0
    for char in text:
        depth += 1 if char == "(" else -1
        if depth < 0:
            return False
    return depth == 0

@check("small cases in order")
def _():
    eq(generate_parentheses(1), ["()"])
    eq(generate_parentheses(2), ["(())", "()()"])
    eq(generate_parentheses(3), ["((()))", "(()())", "(())()", "()(())", "()()()"])

@check("n = 0 gives the empty string and a negative n raises ValueError")
def _():
    eq(generate_parentheses(0), [""])
    raises(ValueError, generate_parentheses, -1)

@check("the number of answers is the Catalan number")
def _():
    eq([len(generate_parentheses(n)) for n in range(1, 9)], [1, 2, 5, 14, 42, 132, 429, 1430])

@check("every string is balanced, unique and the list is sorted (n = 7)")
def _():
    result = generate_parentheses(7)
    eq(all(len(text) == 14 and is_balanced(text) for text in result), True)
    eq(len(set(result)), len(result))
    eq(result, sorted(result))

@check("n = 12 (208,012 answers) finishes quickly")
def _():
    result = generate_parentheses(12)
    eq(len(result), 208012)
    eq(result[0], "(" * 12 + ")" * 12)
    eq(result[-1], "()" * 12)
    eq(result == sorted(result), True)
`
      },
      practice: ["Backtracking & Recursion"],
      source: "https://docs.python.org/3/library/itertools.html"
    },
    {
      id: "dp-memoization-tabulation",
      title: "Dynamic programming: memoization & tabulation",
      kind: "algorithm",
      summary: "Solve a problem by combining answers to smaller versions of itself, and compute each smaller version only once. It turns exponential recursion into a polynomial table fill, either top-down with a cache or bottom-up with loops.",
      concepts: [
        "Dynamic programming applies when a problem is built from smaller versions of itself and those smaller versions repeat. Naive Fibonacci recomputes fib(28) twice inside fib(30), and so on all the way down, so fib(30) makes about 2.7 million calls; remembering each result makes it 31. You need overlapping subproblems (otherwise a cache achieves nothing) and optimal substructure (the best answer for the whole is made of best answers for the parts).",
        "Design every DP in four lines: the STATE (the few numbers that identify a subproblem, such as the amount still to pay or how many houses are considered), the TRANSITION (how a state's answer comes from smaller states), the BASE CASE (answers you know without recursing) and the ORDER (smaller states before the states that need them). Once those four are written, the code follows almost mechanically.",
        "Top-down (memoization) writes the recursion exactly as the transition reads and adds a cache, functools.cache. It only computes states that are actually reached, but it is limited by Python's recursion limit (1000 frames by default): fib_top_down(5000) raises RecursionError. Bottom-up (tabulation) fills a table from the base case upward with plain loops: no recursion, less overhead, and the evaluation order is explicit.",
        "Space optimization: if each entry reads only the previous one or two, keep only those. Fibonacci and the house-robber value shrink from O(n) to O(1). The price is that the table is gone, so you can no longer say WHICH houses were robbed. To reconstruct a solution keep the table (or a choice array) and walk back from the final state, asking at each step which option produced the stored value.",
        "Counting problems are sensitive to loop order. In count_ways the coin loop is outermost, so each coin type is offered once in a fixed order and 1+2 and 2+1 are the same combination. Swapping the loops counts ordered sequences instead, which is a different problem. Climbing stairs (ways(n) = ways(n - 1) + ways(n - 2)) is the Fibonacci recurrence in disguise."
      ],
      complexity: [
        { operation: "fib, plain recursion", time: "O(1.6^n)", note: "the same subproblems are solved again and again" },
        { operation: "fib_top_down / fib_bottom_up", time: "O(n)", note: "n + 1 states, O(1) work each" },
        { operation: "house_robber", time: "O(n)", note: "table of n + 1 states; the walk back is O(n)" },
        { operation: "min_coins (either direction)", time: "O(amount * len(coins))", note: "amount + 1 states, one transition per coin" },
        { operation: "count_ways", time: "O(amount * len(coins))", note: "each coin type updates the whole table once" }
      ],
      space: "O(n) for a cache or table; O(1) for fib_bottom_up and house_robber_value, whose table shrinks to two numbers; O(amount) for the coin tables. Top-down adds O(depth) recursion stack (up to amount / smallest coin for min_coins_top_down).",
      code: py`
from __future__ import annotations

from collections.abc import Sequence
from functools import cache


@cache
def _fib(n: int) -> int:
    return n if n < 2 else _fib(n - 1) + _fib(n - 2)


def fib_top_down(n: int) -> int:
    """Return F(n) by memoized recursion: each n is computed once, so O(n) time and stack."""
    if n < 0:
        raise ValueError("n must be non-negative")
    return _fib(n)


def fib_bottom_up(n: int) -> int:
    """Return F(n) in O(n) time and O(1) space: only the last two values are ever read."""
    if n < 0:
        raise ValueError("n must be non-negative")
    previous, current = 0, 1  # F(0), F(1)
    for _ in range(n):
        previous, current = current, previous + current
    return previous


def house_robber(nums: Sequence[int]) -> tuple[int, list[int]]:
    """Return (best loot, indices robbed) when no two adjacent houses may both be robbed.

    best[i] is the most loot from the first i houses, so
    best[i] = max(best[i - 1], best[i - 2] + nums[i - 1]). O(n) time and space.
    """
    n = len(nums)
    best = [0] * (n + 1)  # base case: best[0] = 0, no houses at all
    for i in range(1, n + 1):  # order: each entry needs the two before it
        take = nums[i - 1] + (best[i - 2] if i >= 2 else 0)
        best[i] = max(best[i - 1], take)
    robbed: list[int] = []
    i = n
    while i > 0:  # walk back: which choice produced best[i]?
        if best[i] == best[i - 1]:
            i -= 1  # house i - 1 was not needed
        else:
            robbed.append(i - 1)
            i -= 2  # its neighbour is off limits
    robbed.reverse()
    return best[n], robbed


def house_robber_value(nums: Sequence[int]) -> int:
    """Return only the best loot, in O(1) space: the table shrinks to two numbers."""
    before, best = 0, 0  # best loot up to the previous house, and up to the current one
    for loot in nums:
        before, best = best, max(best, before + loot)
    return best


def min_coins_top_down(coins: Sequence[int], amount: int) -> int:
    """Return the fewest coins that sum to amount, or -1 if impossible. Coins must be positive.

    State: the amount still to pay. Recursion depth is up to amount / smallest coin.
    """
    if amount < 0 or any(coin <= 0 for coin in coins):
        raise ValueError("amount must be >= 0 and every coin positive")
    impossible = amount + 1  # more than any real answer, since each coin is worth at least 1

    @cache  # per-call cache: freed when min_coins_top_down returns
    def fewest(remaining: int) -> int:
        if remaining == 0:
            return 0
        best = impossible
        for coin in coins:
            if coin <= remaining:
                best = min(best, fewest(remaining - coin) + 1)
        return best

    answer = fewest(amount)
    return -1 if answer >= impossible else answer


def min_coins_bottom_up(coins: Sequence[int], amount: int) -> int:
    """Return the same answer from a table filled from small amounts to large: no recursion."""
    if amount < 0 or any(coin <= 0 for coin in coins):
        raise ValueError("amount must be >= 0 and every coin positive")
    impossible = amount + 1
    fewest = [0] + [impossible] * amount  # fewest[a] = coins needed to pay exactly a
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a:
                fewest[a] = min(fewest[a], fewest[a - coin] + 1)
    return -1 if fewest[amount] >= impossible else fewest[amount]


def count_ways(coins: Sequence[int], amount: int) -> int:
    """Return how many combinations of coins (order ignored) sum to amount.

    Coins are the OUTER loop: each coin type is offered once, so 1+2 and 2+1 are one way.
    """
    ways = [1] + [0] * amount  # one way to pay 0: take nothing
    for coin in coins:
        for a in range(coin, amount + 1):
            ways[a] += ways[a - coin]
    return ways[amount]


if __name__ == "__main__":
    print(fib_top_down(30), fib_bottom_up(30), _fib.cache_info())
    print(house_robber([2, 7, 9, 3, 1]), house_robber_value([2, 7, 9, 3, 1]))
    print(house_robber([5, 1, 1, 5]), house_robber([]))
    print(min_coins_top_down([1, 3, 4], 6), min_coins_bottom_up([1, 3, 4], 6), min_coins_bottom_up([2], 3))
    print(count_ways([1, 2, 5], 5), count_ways([2], 3), count_ways([1, 2, 5], 0))
    try:
        fib_bottom_up(-1)
    except ValueError as error:
        print("error:", error)
`,
      output: `832040 832040 CacheInfo(hits=28, misses=31, maxsize=None, currsize=31)
(12, [0, 2, 4]) 12
(10, [0, 3]) (0, [])
2 2 -1
4 0 1
error: n must be non-negative`,
      bestPractices: [
        "functools.cache turns a plain recursive function into top-down DP with one decorator. It keys the cache on the arguments, so they must be hashable, and cache_info() shows the work saved: 31 misses and 28 hits for fib(30) instead of about 2.7 million calls.",
        "Put the cache on a nested function when it closes over per-call data (fewest inside min_coins_top_down): the cache is freed when the call returns. A module-level @cache such as _fib keeps every result for the life of the program, which is fine for a pure function of one small int and a memory leak for big inputs.",
        "Use a sentinel that is larger than any real answer (amount + 1) instead of None or 0. Everything stays an int, min() just works, and the -1 for impossible appears only at the boundary.",
        "Write what a table cell means next to the table (best[i] is the most loot from the first i houses). Most DP bugs are an off-by-one between a table index and a data index, and that comment is how you find them.",
        "Reconstruct by retracing the table rather than storing a whole path in every cell: house_robber walks back from best[n] and asks whether each house was needed. Keep a value-only version (house_robber_value) for when the list of choices is not wanted.",
        "Validate input before the DP starts. A zero or negative coin would make the coin-change recursion loop forever or read table entries that do not exist, so both versions raise ValueError first."
      ],
      pitfalls: [
        "Hitting the recursion limit. A cached recursive function still recurses: fib_top_down(5000) or min_coins_top_down([1], 5000) raises RecursionError. Convert to a bottom-up table for deep problems; raising sys.setrecursionlimit can crash the interpreter instead of failing cleanly.",
        "Caching on unhashable arguments: @cache on a function that takes a list raises TypeError. Pass an index or a tuple, and keep the big list in a closure. Remember @cache never evicts, so a long-lived one can grow without bound.",
        "Wrong loop order. A bottom-up table must be filled so every cell it reads is already final, and for counting problems the outer loop decides what is counted: with the amount outside and the coins inside, count_ways would count ordered sequences, so [1, 2, 5] and 5 would give 9, not 4.",
        "Space-optimizing too early. Once the table has shrunk to two variables there is nothing to walk back through, so you can report the best value but not the choices. Decide whether you need the solution before you throw the table away."
      ],
      useWhen: [
        "The question asks for a count, a minimum or maximum, or yes/no feasibility, and brute force would try exponentially many combinations (ways to climb, cheapest way to pay, best loot).",
        "Each step is a choice, and what remains depends only on a small summary of what you did (an index, a remaining amount), not on the whole history.",
        "Your recursive solution calls itself with the same arguments again and again: draw the call tree and look for repeated nodes.",
        "The constraints are modest (n up to about 10^3 to 10^5 for a one-dimensional table): states times transitions per state must fit in roughly 10^7 operations."
      ],
      inPractice: "functools.cache is the idiomatic top-down memoizer (use lru_cache(maxsize=N) when memory must stay bounded). Keep top-down for clarity while the depth stays under about 900 frames, and switch to a bottom-up table for deep or hot code: list loops are faster and have no recursion limit. For huge numeric tables, array libraries can vectorize a row at a time. Interviewers usually want you to say the state, transition, base case and order out loud, then write whichever direction is easier to get right.",
      challenge: {
        prompt: "Write coins_used(coins, amount). coins is a list of distinct positive integers in any order (each coin may be used any number of times) and amount is a non-negative integer. Return a list of coins that sum to amount using as few coins as possible, sorted from largest to smallest. If several lists use the fewest coins, return the one that is larger when compared element by element from the front: for coins [1, 2, 3] and amount 4 that is [3, 1], not [2, 2]. amount 0 gives []. If the amount cannot be paid, raise ValueError. The checks use an amount of 9,000, so plain recursion that does not remember results will time out.",
        hint: "fewest[a] = 1 + min(fewest[a - coin]) over the coins that fit, with fewest[0] = 0. Fill it for a = 1, 2, ... (or recurse with functools.cache). To rebuild the list, start with remaining = amount and repeatedly take the LARGEST coin with fewest[remaining - coin] == fewest[remaining] - 1, until remaining is 0.",
        starter: py`
def coins_used(coins, amount):
    """Return the fewest coins (largest first) that sum to amount; raise ValueError if impossible."""
    # TODO: build fewest[a] for every a up to amount, then walk back from amount.
    raise NotImplementedError
`,
        solution: py`
def coins_used(coins, amount):
    """Return the fewest coins (largest first) that sum to amount; raise ValueError if impossible.

    Ties: the answer that is largest when compared from its first (largest) coin.
    """
    if amount < 0:
        raise ValueError("amount must be non-negative")
    unreachable = amount + 1
    fewest = [0] + [unreachable] * amount  # fewest[a] = fewest coins that pay exactly a
    for a in range(1, amount + 1):
        for coin in coins:
            if coin <= a and fewest[a - coin] + 1 < fewest[a]:
                fewest[a] = fewest[a - coin] + 1
    if fewest[amount] >= unreachable:
        raise ValueError("amount cannot be paid with these coins")
    used = []
    remaining = amount
    biggest_first = sorted(coins, reverse=True)
    while remaining:
        for coin in biggest_first:  # the largest coin that keeps the count optimal
            if coin <= remaining and fewest[remaining - coin] == fewest[remaining] - 1:
                used.append(coin)
                remaining -= coin
                break
    return used
`,
        tests: py`
def brute(coins, amount):
    ordered = sorted(coins, reverse=True)
    best = []

    def rec(i, remaining, chosen):
        if remaining == 0:
            candidate = (len(chosen), [-coin for coin in chosen])
            if not best or candidate < best[0]:
                best[:] = [candidate]
            return
        if i == len(ordered):
            return
        for count in range(remaining // ordered[i] + 1):
            rec(i + 1, remaining - count * ordered[i], chosen + [ordered[i]] * count)

    rec(0, amount, [])
    return [-coin for coin in best[0][1]] if best else None

@check("pays with the fewest coins, largest first")
def _():
    eq(coins_used([1, 5, 10, 25], 63), [25, 25, 10, 1, 1, 1])
    eq(coins_used([2], 4), [2, 2])
    eq(coins_used([1, 2, 5], 11), [5, 5, 1])

@check("greedy (always take the biggest coin) is not enough")
def _():
    eq(coins_used([1, 3, 4], 6), [3, 3])
    eq(coins_used([1, 5, 6, 9], 11), [6, 5])

@check("ties go to the answer with the larger leading coins")
def _():
    eq(coins_used([1, 2, 3], 4), [3, 1])
    eq(coins_used([3, 1, 2], 4), [3, 1])
    eq(coins_used([1, 2, 3, 4], 6), [4, 2])

@check("amount 0 gives [] and an impossible amount raises ValueError")
def _():
    eq(coins_used([5, 7], 0), [])
    raises(ValueError, coins_used, [2], 3)
    raises(ValueError, coins_used, [5, 10], 7)
    raises(ValueError, coins_used, [], 5)

@check("matches brute force on 300 small pseudo-random cases")
def _():
    state = 7
    for _ in range(300):
        state = (state * 1103515245 + 12345) % 2**31
        coins = sorted({1 + (state >> shift) % 9 for shift in (3, 7, 11)[: 1 + state % 3]}, key=lambda c: (c * 7) % 11)
        state = (state * 1103515245 + 12345) % 2**31
        amount = state % 25
        expected = brute(coins, amount)
        if expected is None:
            raises(ValueError, coins_used, coins, amount)
        else:
            eq(coins_used(coins, amount), expected, "wrong answer for " + repr((coins, amount)))

@check("amount 9,000 with four coins finishes quickly")
def _():
    coins = [20, 50, 99, 137]
    result = coins_used(coins, 9000)
    eq(sum(result), 9000)
    eq(result, sorted(result, reverse=True))
    eq(set(result) <= set(coins), True)
    fewest = [0] + [10**9] * 9000
    for a in range(1, 9001):
        fewest[a] = 1 + min((fewest[a - c] for c in coins if c <= a), default=10**9)
    eq(len(result), fewest[9000])
`
      },
      practice: ["1D Dynamic Programming"],
      source: "https://docs.python.org/3/library/functools.html#functools.cache"
    },
    {
      id: "dp-two-dimensional",
      title: "Two-dimensional DP: sequences & knapsack",
      kind: "algorithm",
      summary: "When a subproblem needs two numbers to describe it (a prefix of each of two strings, or an item count and a remaining capacity), the DP table is a grid. It solves longest common subsequence, edit distance, knapsack and grid paths in O(n*m).",
      concepts: [
        "A two-dimensional DP has a state with two indices: usually a prefix of each of two sequences (the first i characters of a, the first j of b), or an item count and a remaining capacity. The table is (n + 1) x (m + 1); row 0 and column 0 are the base cases (an empty prefix), and each cell is computed from the cells above, to the left and diagonally above-left, which fixes the fill order: row by row.",
        "Longest common subsequence: if the last characters a[i - 1] and b[j - 1] match, they can be paired, so length[i][j] = length[i - 1][j - 1] + 1; otherwise one of them goes unused, so take the larger of dropping a character from a or from b. The table gives the length. To get an actual subsequence, walk back from the corner: on a match collect the character and go diagonally, otherwise step toward the larger neighbour. Edit distance has the same shape with min: if the last characters differ, the cost is 1 + min(replace, delete, insert), which are the diagonal, upper and left cells.",
        "0/1 knapsack: each item is taken once or skipped, so table[i][w] = max(skip: table[i - 1][w], take: table[i - 1][w - weight] + value). Row i reads only row i - 1, so ONE row is enough if you update it from the right end downward: then best[w - weight] still belongs to the previous item. Looping upward would let an item be used again and again, which is a different problem (unbounded knapsack).",
        "Rolling rows save memory but throw away the path. Two rows (edit_distance) or one row (knapsack_value) give the value in O(min(n, m)) or O(capacity) space, while walking back to find WHICH characters or items were used needs the full table. That is why lcs and knapsack_items keep the table and the other two do not.",
        "Grid problems use the same idea with the state (row, column): the cheapest way to reach a cell is its own cost plus the cheaper of the cell above and the cell to the left. Counting paths replaces min with +, and a wall is just a cell with zero paths."
      ],
      complexity: [
        { operation: "lcs(a, b)", time: "O(n * m)", note: "n = len(a), m = len(b); the length alone needs only O(min(n, m)) space" },
        { operation: "edit_distance(a, b)", time: "O(n * m)", note: "two rolling rows of the shorter string" },
        { operation: "knapsack_value", time: "O(n * capacity)", note: "pseudo-polynomial: proportional to the capacity's value, not its digit count" },
        { operation: "knapsack_items", time: "O(n * capacity)", note: "full table kept so the chosen items can be recovered" },
        { operation: "min_path_sum / count_paths", time: "O(rows * cols)", note: "one visit per cell" }
      ],
      space: "O(n*m) for the tables that support walking back (lcs, knapsack_items, min_path_sum). The rolling versions need O(min(n, m)) for edit_distance, O(capacity) for knapsack_value and O(cols) for count_paths.",
      code: py`
from __future__ import annotations

from collections.abc import Sequence


def lcs(a: str, b: str) -> str:
    """Return a longest common subsequence of a and b in O(len(a) * len(b)) time and space.

    length[i][j] is the LCS length of a[:i] and b[:j]; row 0 and column 0 stay 0
    because an empty prefix shares nothing.
    """
    length = [[0] * (len(b) + 1) for _ in range(len(a) + 1)]  # not [[0] * m] * n: that repeats ONE row
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            if a[i - 1] == b[j - 1]:
                length[i][j] = length[i - 1][j - 1] + 1
            else:
                length[i][j] = max(length[i - 1][j], length[i][j - 1])
    pieces: list[str] = []
    i, j = len(a), len(b)
    while i > 0 and j > 0:  # trace back from the corner, mirroring the fill rule
        if a[i - 1] == b[j - 1]:
            pieces.append(a[i - 1])
            i -= 1
            j -= 1
        elif length[i - 1][j] >= length[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return "".join(reversed(pieces))


def edit_distance(a: str, b: str) -> int:
    """Return the fewest single-character inserts, deletes and replacements that turn a into b.

    previous[j] holds the distance between a[:i - 1] and b[:j]; only the previous
    row is ever read, so two rows replace the whole table: O(min(len)) space.
    """
    if len(b) > len(a):
        a, b = b, a  # the distance is symmetric, so keep the rows short
    previous = list(range(len(b) + 1))  # "" -> b[:j] needs j inserts
    for i, char_a in enumerate(a, start=1):
        current = [i]  # a[:i] -> "" needs i deletes
        for j, char_b in enumerate(b, start=1):
            if char_a == char_b:
                current.append(previous[j - 1])
            else:
                current.append(1 + min(previous[j - 1], previous[j], current[j - 1]))
        previous = current
    return previous[-1]


def knapsack_value(weights: Sequence[int], values: Sequence[int], capacity: int) -> int:
    """Return the best total value of items (each used at most once) that fit in capacity.

    best[w] is the best value with weight limit w. Looping w DOWNWARD means best[w - weight]
    still belongs to the previous item, so no item is counted twice. O(n * capacity) time.
    """
    best = [0] * (capacity + 1)
    for weight, value in zip(weights, values):
        for w in range(capacity, weight - 1, -1):
            best[w] = max(best[w], best[w - weight] + value)
    return best[capacity]


def knapsack_items(weights: Sequence[int], values: Sequence[int], capacity: int) -> tuple[int, list[int]]:
    """Return (best value, indices of the chosen items). Keeps the full table so it can walk back."""
    n = len(weights)
    table = [[0] * (capacity + 1) for _ in range(n + 1)]  # table[i][w]: first i items, limit w
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            table[i][w] = table[i - 1][w]  # skip item i - 1
            if weights[i - 1] <= w:
                table[i][w] = max(table[i][w], table[i - 1][w - weights[i - 1]] + values[i - 1])
    chosen: list[int] = []
    w = capacity
    for i in range(n, 0, -1):
        if table[i][w] != table[i - 1][w]:  # the value changed, so item i - 1 was taken
            chosen.append(i - 1)
            w -= weights[i - 1]
    chosen.reverse()
    return table[n][capacity], chosen


def min_path_sum(grid: Sequence[Sequence[int]]) -> tuple[int, str]:
    """Return (cheapest total, moves) from top-left to bottom-right, moving only Right or Down."""
    if not grid or not grid[0]:
        raise ValueError("grid must not be empty")
    rows, cols = len(grid), len(grid[0])
    cost = [[0] * cols for _ in range(rows)]  # cost[r][c]: cheapest path that ends at (r, c)
    for r in range(rows):
        for c in range(cols):
            arrivals = [cost[r - 1][c]] if r else []
            if c:
                arrivals.append(cost[r][c - 1])
            cost[r][c] = grid[r][c] + min(arrivals, default=0)  # the start cell has no arrival
    moves: list[str] = []
    r, c = rows - 1, cols - 1
    while r or c:
        if r and (not c or cost[r - 1][c] <= cost[r][c - 1]):
            moves.append("D")
            r -= 1
        else:
            moves.append("R")
            c -= 1
    return cost[-1][-1], "".join(reversed(moves))


def count_paths(grid: Sequence[Sequence[int]]) -> int:
    """Count Right/Down paths from top-left to bottom-right that avoid walls (cells equal to 1)."""
    if not grid or not grid[0]:
        raise ValueError("grid must not be empty")
    ways = [0] * len(grid[0])  # ways[c]: paths into column c of the row being processed
    ways[0] = 1
    for row in grid:
        for c, wall in enumerate(row):
            if wall:
                ways[c] = 0
            elif c:
                ways[c] += ways[c - 1]  # ways[c] already holds "from above"; add "from the left"
    return ways[-1]


if __name__ == "__main__":
    best = lcs("AGGTAB", "GXTXAYB")
    print(best, len(best), repr(lcs("abc", "xyz")))
    print(edit_distance("kitten", "sitting"), edit_distance("", "abc"), edit_distance("flaw", "flaw"))
    print(knapsack_value([1, 3, 4, 5], [1, 4, 5, 7], 7))
    print(knapsack_items([1, 3, 4, 5], [1, 4, 5, 7], 7), knapsack_items([5], [10], 3))
    print(min_path_sum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]))
    print(count_paths([[0, 0, 0], [0, 1, 0], [0, 0, 0]]), count_paths([[0] * 5 for _ in range(3)]))
    try:
        min_path_sum([])
    except ValueError as error:
        print("error:", error)
`,
      output: `GTAB 4 ''
3 3 0
9
(9, [1, 2]) (0, [])
(7, 'RRDD')
2 15
error: grid must not be empty`,
      bestPractices: [
        "Build tables with a comprehension, [[0] * (m + 1) for _ in range(n + 1)]. The tempting [[0] * (m + 1)] * (n + 1) repeats ONE row object n + 1 times, so writing to one cell appears to write to every row.",
        "Pad the table with a base row and column (size (n + 1) x (m + 1)) so that index i means the first i characters. The loops then start at 1 and the empty prefix needs no special case; the price is reading a[i - 1] instead of a[i].",
        "Keep only the rows you read. edit_distance holds previous and current rows, and knapsack_value one list updated downward, which cuts memory from O(n*m) to O(min(n, m)) or O(capacity). Swap the arguments so the rolling row belongs to the shorter string: edit distance is symmetric.",
        "Reconstruct by walking back with the same comparison the fill used (lcs, knapsack_items, min_path_sum) and no extra storage. In knapsack_items, table[i][w] != table[i - 1][w] means item i - 1 changed the value, so it was taken.",
        "Use min(..., default=0) to give the start cell of the grid an empty list of arrivals. That avoids padding the grid with infinity or writing a special case for row 0 and column 0.",
        "Use zip(weights, values) and enumerate(a, start=1) rather than index arithmetic where the index is not otherwise needed: fewer places for an off-by-one."
      ],
      pitfalls: [
        "Aliased rows: [[0] * m] * n gives n references to the same list, so setting table[1][2] changes every row. Always build rows in a comprehension.",
        "Looping the knapsack capacity upward in the one-row version. With weights [3], values [5] and capacity 9 the correct 0/1 answer is 5, but an upward loop reuses the item and returns 15. Loop from capacity down to the item's weight.",
        "Off-by-one between table index and string index: in the padded table cell [i][j] describes a[:i], so the characters being compared are a[i - 1] and b[j - 1]. Mixing a[i] with a padded table silently compares the wrong characters.",
        "Treating O(n * capacity) as cheap for any input. The table size grows with the VALUE of the capacity (pseudo-polynomial): a capacity of 10**12 cannot be tabulated, and the general knapsack problem is NP-hard."
      ],
      useWhen: [
        "Two strings or sequences must be compared or aligned: longest common subsequence, edit distance, diff, spell-check suggestions, interleavings.",
        "You pick items under a budget (weight, time, money) to maximize value; subset sum and equal-partition problems are the same table with true/false cells.",
        "Paths or counts on a grid where every cell depends on the cell above and the cell to the left.",
        "The state is two small numbers (i, j) and n * m fits in roughly 10^7 cell updates."
      ],
      inPractice: "difflib.SequenceMatcher compares sequences by repeatedly finding the longest matching block, which is what Python diff tools use, though it is not an exact LCS. For edit distance on real data use a C-backed library such as rapidfuzz, which runs this DP far faster than pure Python. Memoize a 2-D recursion with functools.cache when the depth is small, and use a mixed-integer solver such as scipy.optimize.milp for knapsacks with huge capacities or extra constraints.",
      challenge: {
        prompt: "Write longest_palindromic_subsequence(s). Return the length of the longest subsequence of the string s that reads the same forwards and backwards. A subsequence keeps the order of characters but they need not be adjacent: in 'bbbab' the answer is 'bbbb', so the length is 4. The empty string gives 0. The checks use strings of 500 characters, so trying every subsequence (2**500 of them) or recursion that remembers nothing will time out.",
        hint: "Let f(i, j) be the answer for s[i..j]. If s[i] == s[j] then f(i, j) = f(i + 1, j - 1) + 2, otherwise f(i, j) = max(f(i + 1, j), f(i, j - 1)). A single character gives 1 and an empty range gives 0. Fill the table with i going downward from the end of the string and j going up from i + 1, or notice that the answer is the LCS of s and its reverse.",
        starter: py`
def longest_palindromic_subsequence(s):
    """Return the length of the longest palindromic subsequence of s."""
    # TODO: define f(i, j) for the slice s[i..j] and fill a table.
    raise NotImplementedError
`,
        solution: py`
def longest_palindromic_subsequence(s):
    """Return the length of the longest palindromic subsequence of s (O(n^2))."""
    n = len(s)
    if n == 0:
        return 0
    table = [[0] * n for _ in range(n)]  # table[i][j]: answer for s[i..j]; empty ranges stay 0
    for i in range(n - 1, -1, -1):  # row i needs row i + 1
        table[i][i] = 1
        for j in range(i + 1, n):
            if s[i] == s[j]:
                table[i][j] = table[i + 1][j - 1] + 2
            else:
                table[i][j] = max(table[i + 1][j], table[i][j - 1])
    return table[0][n - 1]
`,
        tests: py`
def brute(s):
    best = 0
    for mask in range(1 << len(s)):
        kept = [s[i] for i in range(len(s)) if mask >> i & 1]
        if len(kept) > best and kept == kept[::-1]:
            best = len(kept)
    return best

@check("small known examples")
def _():
    eq(longest_palindromic_subsequence("bbbab"), 4)
    eq(longest_palindromic_subsequence("cbbd"), 2)
    eq(longest_palindromic_subsequence("character"), 5)
    eq(longest_palindromic_subsequence("agbdba"), 5)

@check("empty, single character and no repeated characters")
def _():
    eq(longest_palindromic_subsequence(""), 0)
    eq(longest_palindromic_subsequence("a"), 1)
    eq(longest_palindromic_subsequence("abcde"), 1)

@check("a whole palindrome and a long run of one character")
def _():
    eq(longest_palindromic_subsequence("racecar"), 7)
    eq(longest_palindromic_subsequence("z" * 40), 40)

@check("matches brute force on 100 short pseudo-random strings")
def _():
    state = 99
    for _ in range(100):
        state = (state * 1103515245 + 12345) % 2**31
        chars = []
        for _ in range(state % 11):
            state = (state * 1103515245 + 12345) % 2**31
            chars.append("abc"[(state >> 8) % 3])
        text = "".join(chars)
        eq(longest_palindromic_subsequence(text), brute(text), "wrong answer for " + repr(text))

@check("a 500-character string finishes quickly")
def _():
    state = 2024
    chars = []
    for _ in range(500):
        state = (state * 1103515245 + 12345) % 2**31
        chars.append("abcd"[(state >> 16) % 4])
    eq(longest_palindromic_subsequence("".join(chars)), 325)
    eq(longest_palindromic_subsequence("ab" * 250), 499)
`
      },
      practice: ["2D Dynamic Programming"],
      source: "https://en.wikipedia.org/wiki/Longest_common_subsequence"
    },
    {
      id: "dp-advanced",
      title: "Advanced DP: LIS, bitmask & interval",
      kind: "algorithm",
      summary: "Three ways to encode a DP state beyond a simple index: a tails array searched with bisect (longest increasing subsequence in O(n log n)), a bitmask for a subset of up to about 15 items, and an interval [i, j] filled by increasing length.",
      concepts: [
        "The textbook LIS DP is O(n^2): dp[i] = 1 + the best dp[j] over earlier, smaller items. To reach O(n log n), keep for each length k + 1 the SMALLEST value that can end an increasing subsequence of that length: tails[k]. The array is always sorted, so each new value either extends the longest subsequence (it is larger than every tail) or replaces the first tail that is at least as large, found with bisect_left. A replacement never changes the length, but a smaller tail keeps more future options open.",
        "tails is bookkeeping, not the answer: for [4, 5, 6, 1] it ends as [1, 5, 6], yet 1 comes after 5 and 6 in the input, so that is not a subsequence. Its length is correct, its contents are not. To recover a real subsequence, record for each element the index of its predecessor and follow those links back from the end of the longest one. bisect_left gives STRICTLY increasing; bisect_right gives non-decreasing (equal values allowed).",
        "Bitmask DP: when the question is 'which subset of at most about 15-20 things have I used so far', store the subset as an integer where bit i means item i is used. A state such as (mask, last) indexes a table of 2^n x n entries; test a bit with (mask >> i) & 1 and set it with mask | (1 << i). Looping masks in increasing order is a valid evaluation order, because adding a bit always makes the number bigger. For 12 cities that is about 590,000 transitions instead of 12! = 479 million permutations.",
        "Interval DP: when the answer for a contiguous range [i, j] is built from answers for smaller ranges split at some k, make the range the state and fill by increasing length, so shorter ranges are ready before the longer ranges that need them. Matrix-chain multiplication tries every last multiplication k: cost[i][k] + cost[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]. There are O(n^2) ranges and O(n) splits each, so O(n^3). Burst balloons uses the same loops once you choose the LAST balloon to burst, which makes the two sides independent.",
        "All three are ordinary DP; only the state encoding changes: a length (LIS), a subset (bitmask) or a range (interval). Reconstruction follows the same rule as before: store a parent or split choice next to each value and walk back, as longest_increasing_subsequence, shortest_tour and matrix_chain do."
      ],
      complexity: [
        { operation: "lis_tails / longest_increasing_subsequence", time: "O(n log n)", note: "one bisect per element" },
        { operation: "shortest_tour(dist)", time: "O(2^n * n^2)", note: "2^n masks x n last cities x n next cities; realistic for n up to about 12-15 in Python" },
        { operation: "matrix_chain(dims)", time: "O(n^3)", note: "O(n^2) ranges, O(n) split points each" },
        { operation: "min_assignment_cost (challenge)", time: "O(2^n * n)", note: "the worker is implied by the mask, so there is no 'last' dimension" }
      ],
      space: "O(n) for the LIS arrays; O(2^n * n) for the shortest_tour tables; O(n^2) for the matrix_chain tables plus O(n) recursion to print the answer.",
      code: py`
from __future__ import annotations

from bisect import bisect_left
from collections.abc import Sequence


def lis_tails(nums: Sequence[int]) -> list[int]:
    """Return the final tails array of the strictly-increasing scan in O(n log n).

    tails[k] is the smallest last value of any increasing subsequence of length k + 1,
    so tails is sorted and bisect can place each value. It is NOT a subsequence of nums.
    """
    tails: list[int] = []
    for value in nums:
        k = bisect_left(tails, value)  # first tail >= value: replace it (strict increase)
        if k == len(tails):
            tails.append(value)  # value extends the longest subsequence found so far
        else:
            tails[k] = value  # a smaller tail for length k + 1 keeps more options open
    return tails


def longest_increasing_subsequence(nums: Sequence[int]) -> list[int]:
    """Return one longest strictly increasing subsequence of nums in O(n log n)."""
    tails: list[int] = []  # tails[k] == nums[tail_index[k]]
    tail_index: list[int] = []
    parent = [-1] * len(nums)  # parent[i]: index of the item before nums[i] in its best subsequence
    for i, value in enumerate(nums):
        k = bisect_left(tails, value)
        if k == len(tails):
            tails.append(value)
            tail_index.append(i)
        else:
            tails[k] = value
            tail_index[k] = i
        parent[i] = tail_index[k - 1] if k else -1
    result: list[int] = []
    i = tail_index[-1] if tail_index else -1
    while i != -1:  # follow the parent links back from the end of the longest subsequence
        result.append(nums[i])
        i = parent[i]
    result.reverse()
    return result


def shortest_tour(dist: Sequence[Sequence[int]]) -> tuple[int, list[int]]:
    """Return (cost, visiting order) of the cheapest round trip from city 0 through every city.

    best[mask][last] is the cheapest path that starts at city 0, visits exactly the cities
    in the bitmask mask, and ends at last. Distances must be non-negative.
    O(2^n * n^2) time and O(2^n * n) space, so only for small n.
    """
    n = len(dist)
    if n == 0:
        raise ValueError("need at least one city")
    full = (1 << n) - 1
    unreachable = sum(max(row) for row in dist) + 1  # beats the cost of any real path
    best = [[unreachable] * n for _ in range(full + 1)]
    parent = [[-1] * n for _ in range(full + 1)]
    best[1][0] = 0  # only city 0 visited, and we stand on it
    for mask in range(1, full + 1):  # mask | bit > mask: subsets are finished before supersets
        for last in range(n):
            if not (mask >> last) & 1 or best[mask][last] >= unreachable:
                continue
            for city in range(n):
                if (mask >> city) & 1:
                    continue  # already visited
                bigger = mask | (1 << city)
                cost = best[mask][last] + dist[last][city]
                if cost < best[bigger][city]:
                    best[bigger][city] = cost
                    parent[bigger][city] = last
    total, end = min((best[full][last] + dist[last][0], last) for last in range(n))
    order: list[int] = []
    mask, city = full, end
    while city != -1:  # walk the parent links back to city 0
        order.append(city)
        mask, city = mask ^ (1 << city), parent[mask][city]
    order.reverse()
    return total, order


def matrix_chain(dims: Sequence[int]) -> tuple[int, str]:
    """Return (fewest scalar multiplications, parenthesization) for matrices A1..An.

    Matrix Ai has dims[i - 1] rows and dims[i] columns. cost[i][j] is the cheapest way to
    multiply matrices i..j (0-based), found by trying every split k. O(n^3) time.
    """
    n = len(dims) - 1
    if n < 1:
        raise ValueError("need at least one matrix")
    cost = [[0] * n for _ in range(n)]
    split = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):  # shorter ranges first: they feed the longer ones
        for i in range(n - length + 1):
            j = i + length - 1
            cost[i][j], split[i][j] = min(
                (cost[i][k] + cost[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1], k) for k in range(i, j)
            )

    def render(i: int, j: int) -> str:
        if i == j:
            return f"A{i + 1}"
        k = split[i][j]
        return f"({render(i, k)}{render(k + 1, j)})"

    return cost[0][n - 1], render(0, n - 1)


if __name__ == "__main__":
    nums = [4, 5, 6, 1]
    print(lis_tails(nums), longest_increasing_subsequence(nums))
    print(longest_increasing_subsequence([10, 9, 2, 5, 3, 7, 101, 18]), longest_increasing_subsequence([]))
    print(len(lis_tails([2, 2, 2])), len(lis_tails(range(100_000))))

    cities = [[0, 10, 15, 20], [10, 0, 35, 25], [15, 35, 0, 30], [20, 25, 30, 0]]
    print(shortest_tour(cities), shortest_tour([[0]]))
    print(matrix_chain([10, 30, 5, 60]), matrix_chain([40, 20, 30, 10, 30]), matrix_chain([7, 3]))
    try:
        matrix_chain([5])
    except ValueError as error:
        print("error:", error)
`,
      output: `[1, 5, 6] [4, 5, 6]
[2, 3, 7, 18] []
1 100000
(80, [0, 2, 3, 1]) (0, [0])
(4500, '((A1A2)A3)') (26000, '((A1(A2A3))A4)') (0, 'A1')
error: need at least one matrix`,
      bestPractices: [
        "Let bisect do the searching: tails is sorted by construction, so bisect_left finds the slot in O(log n) in C, and the list is never re-sorted. The demo scans 100,000 numbers instantly, where the O(n^2) DP would take minutes in Python.",
        "Store indices as well as values (tail_index and parent) when you must return the subsequence itself. The extra lists cost O(n) and keep the whole scan O(n log n).",
        "Parenthesize every bit operation: (mask >> city) & 1 and mask | (1 << city). Python's precedence is shifts, then &, then |, but 1 << i + 1 means 1 << (i + 1), and the explicit brackets make the intent obvious to the reader.",
        "Use an int sentinel (unreachable) that is larger than any real cost, and test best >= unreachable to skip states that were never reached. It keeps all arithmetic in ints and avoids float('inf') mixing into integer results.",
        "min() over (cost, k) tuples picks the cheapest split and records it in one expression, and ties go to the smallest k, so the printed parenthesization is deterministic.",
        "Keep recursion out of the DP and use it only to print: the tables are filled by loops (no recursion limit problem), and render recurses to a depth of at most n over the split table."
      ],
      pitfalls: [
        "bisect_left versus bisect_right: bisect_left yields a strictly increasing subsequence, bisect_right a non-decreasing one. On [2, 2, 2] the strict answer is 1 and the non-decreasing answer is 3. Pick the one the problem asks for.",
        "Returning tails as if it were the subsequence. Its length is right but its contents can be out of order in the input: for [4, 5, 6, 1] it is [1, 5, 6], whereas the real answer is [4, 5, 6].",
        "Underestimating bitmask size. The table has 2^n x n entries: n = 20 means 20 million cells, far more memory than a Python list of lists can comfortably hold, and the loops take minutes. Check n before choosing this technique.",
        "Wrong fill order in interval DP. Looping i and then j upward reads cost[k + 1][j] before it exists. Loop over the interval LENGTH from short to long so every smaller range is already computed."
      ],
      useWhen: [
        "Longest increasing or non-decreasing subsequence with n up to 10^5, or any chain problem (nesting envelopes, stacking boxes) that becomes one after sorting.",
        "n is at most about 15-20 and the natural brute force tries all permutations or subsets: assignments, tours, covering or scheduling everything at minimum cost.",
        "The answer for a range depends on the best split point inside it: matrix chain, merging stones, burst balloons, optimal binary search tree, palindrome partitioning.",
        "The constraints hint at the technique: n <= 20 suggests a bitmask, n <= 400 with O(n^3) suggests an interval DP, n <= 10^5 with the word subsequence suggests bisect."
      ],
      inPractice: "For LIS use bisect exactly as shown; the standard library has nothing higher level. numpy.linalg.multi_dot runs the matrix-chain DP to choose the multiplication order. For assignment at scale use scipy.optimize.linear_sum_assignment (the Hungarian algorithm, O(n^3)), for big travelling-salesman instances use heuristics or a solver such as OR-Tools, because the bitmask DP is exponential, and use itertools.permutations to brute-force tiny cases and test your DP against it.",
      challenge: {
        prompt: "Write min_assignment_cost(cost). cost is an n x n list of lists of integers: cost[i][j] is what it costs to give job j to worker i. Give every worker a different job (each job goes to exactly one worker) and return the smallest possible total cost. An empty list gives 0, and a matrix that is not square raises ValueError. The checks use n = 15, which has 15! (over a trillion) assignments, so trying every permutation will time out: use a DP over the set of jobs already taken.",
        hint: "Hand out jobs to workers in order 0, 1, 2, ... Let best[mask] be the cheapest way for the first popcount(mask) workers to take exactly the jobs in mask (bit j set means job j is taken). The next worker is mask.bit_count(); try every job not in mask and update best[mask | (1 << job)]. Loop masks upward; the answer is best[(1 << n) - 1].",
        starter: py`
def min_assignment_cost(cost):
    """Return the minimum total cost of assigning each worker a different job."""
    # TODO: best[mask] over the set of jobs already taken; the worker is the number of bits set.
    raise NotImplementedError
`,
        solution: py`
def min_assignment_cost(cost):
    """Return the minimum total cost of assigning each worker a different job.

    best[mask] is the cheapest way for workers 0..popcount(mask) - 1 to take exactly the jobs in mask.
    O(2^n * n) time.
    """
    n = len(cost)
    if any(len(row) != n for row in cost):
        raise ValueError("cost must be a square matrix")
    if n == 0:
        return 0
    unreachable = float("inf")
    best = [unreachable] * (1 << n)
    best[0] = 0
    for mask in range(1 << n):
        worker = mask.bit_count()  # workers 0..worker-1 already have their jobs
        if worker == n:
            continue
        for job in range(n):
            if not (mask >> job) & 1:
                bigger = mask | (1 << job)
                best[bigger] = min(best[bigger], best[mask] + cost[worker][job])
    return best[(1 << n) - 1]
`,
        tests: py`
from itertools import permutations

def brute(cost):
    n = len(cost)
    return min(sum(cost[i][job] for i, job in enumerate(jobs)) for jobs in permutations(range(n)))

@check("a 3 x 3 example")
def _():
    eq(min_assignment_cost([[9, 2, 7], [6, 4, 3], [5, 8, 1]]), 9)
    eq(min_assignment_cost([[4, 1, 3], [2, 0, 5], [3, 2, 2]]), 5)

@check("one worker, and no workers")
def _():
    eq(min_assignment_cost([[7]]), 7)
    eq(min_assignment_cost([]), 0)

@check("picking each row's cheapest job greedily is wrong here")
def _():
    eq(min_assignment_cost([[1, 2], [1, 100]]), 3)

@check("a matrix that is not square raises ValueError")
def _():
    raises(ValueError, min_assignment_cost, [[1, 2], [3]])
    raises(ValueError, min_assignment_cost, [[1, 2, 3], [4, 5, 6]])

@check("matches brute force on 60 pseudo-random matrices (n up to 6)")
def _():
    state = 31
    for _ in range(60):
        state = (state * 1103515245 + 12345) % 2**31
        n = 1 + state % 6
        cost = []
        for _ in range(n):
            row = []
            for _ in range(n):
                state = (state * 1103515245 + 12345) % 2**31
                row.append((state >> 10) % 26 - 5)
            cost.append(row)
        eq(min_assignment_cost(cost), brute(cost), "wrong answer for " + repr(cost))

@check("n = 15 finishes quickly (15! assignments cannot be enumerated)")
def _():
    n = 15
    cost = [[10 + (i * 31 + j * 17) % 23 for j in range(n)] for i in range(n)]
    for i in range(n):
        cost[i][(i * 7 + 3) % n] = 1  # a hidden perfect assignment costing 1 per worker
    eq(min_assignment_cost(cost), n)
`
      },
      practice: ["Advanced DP", "1D Dynamic Programming"],
      source: "https://docs.python.org/3/library/bisect.html"
    },
    // @@NEXT@@
  ],
};
