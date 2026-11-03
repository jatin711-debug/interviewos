import type { DsModule } from "./types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const TECHNIQUES_MODULE: DsModule = {
  id: "techniques",
  title: "Array, string & math techniques",
  description: "Prefix sums, windows, monotonic stacks, bits, number theory and string matching.",
  lessons: [
    {
      id: "prefix-sums",
      title: "Prefix sums & difference arrays",
      kind: "technique",
      summary: "Precompute running totals once so any range sum is two lookups. The same idea answers rectangle sums on a grid, applies many range updates cheaply (difference arrays) and, paired with a hash map, counts subarrays with a target sum.",
      concepts: [
        "A prefix-sum array stores prefix[i] = the sum of the first i items, with prefix[0] = 0 for the empty prefix. Any range then costs one subtraction: sum(items[lo:hi]) = prefix[hi] - prefix[lo]. One O(n) pass builds it, so q queries cost O(n + q) instead of O(n * q).",
        "In two dimensions let p[r][c] be the sum of the top-left r-by-c block. A rectangle is the big block, minus the block above it, minus the block to its left, plus the corner that was subtracted twice (inclusion-exclusion): four lookups, O(1).",
        "A difference array is the inverse trick. Store diff[i] = items[i] - items[i - 1]. Adding delta to items[lo:hi] then changes only two entries, diff[lo] += delta and diff[hi] -= delta, and one running sum (accumulate) rebuilds the final values. q updates cost O(q + n) instead of O(q * n). It suits \"many updates, then one read\"; when updates and queries interleave use a Fenwick tree.",
        "Prefix sums plus a hash map count subarrays. A subarray ending at j sums to k exactly when some earlier prefix equals prefix[j] - k, so keep a Counter of the prefixes seen so far and add counter[prefix - k] for every new one. Seed it with {0: 1} for the empty prefix. Unlike a sliding window this works with negative numbers.",
        "The idea works for any quantity that can be undone: xor (its own inverse), counts per value, running remainders mod m (equal remainders mean a stretch whose sum is divisible by m) or +1 / -1 balances for \"equal numbers of 0s and 1s\". It does not work for min or max, which have no inverse."
      ],
      complexity: [
        { operation: "PrefixSums build", time: "O(n)", note: "one accumulate pass" },
        { operation: "range_sum", time: "O(1)", note: "two lookups and a subtraction" },
        { operation: "PrefixSums2D build / rect_sum", time: "O(rows * cols) / O(1)" },
        { operation: "apply_range_adds with q updates", time: "O(n + q)", note: "each update is two edits" },
        { operation: "count_subarrays_with_sum", time: "O(n) expected", note: "hash-map operations are O(1) expected" }
      ],
      space: "O(n) for the prefix list, O(rows * cols) for the 2-D table, O(n) for the Counter of distinct prefixes.",
      code: py`
from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Iterator, Sequence
from itertools import accumulate, pairwise


class PrefixSums:
    """Range sums over a fixed list: O(n) to build, O(1) per query.

    Invariant: _prefix[i] is the sum of the first i items (so _prefix[0] == 0),
    hence sum(items[lo:hi]) == _prefix[hi] - _prefix[lo] for any lo <= hi.
    """

    __slots__ = ("_prefix",)

    def __init__(self, items: Iterable[int]) -> None:
        self._prefix: list[int] = list(accumulate(items, initial=0))

    def range_sum(self, lo: int, hi: int) -> int:
        """Return the sum of items[lo:hi] (half-open, like a slice)."""
        if not 0 <= lo <= hi < len(self._prefix):
            raise ValueError(f"bad range [{lo}, {hi}) for {len(self)} items")
        return self._prefix[hi] - self._prefix[lo]

    def __len__(self) -> int:
        return len(self._prefix) - 1

    def __iter__(self) -> Iterator[int]:
        """Yield the original items: each is the gap between neighbouring prefixes."""
        return (after - before for before, after in pairwise(self._prefix))

    def __repr__(self) -> str:
        return f"PrefixSums({list(self)!r})"


class PrefixSums2D:
    """Rectangle sums over a fixed grid: O(rows * cols) to build, O(1) per query.

    Invariant: _p[r][c] is the sum of the top-left r x c block of the grid, so
    one rectangle is four lookups combined by inclusion-exclusion.
    """

    __slots__ = ("_p",)

    def __init__(self, grid: Sequence[Sequence[int]]) -> None:
        width = len(grid[0]) if grid else 0
        p = [[0] * (width + 1)]
        for row in grid:
            if len(row) != width:
                raise ValueError("grid rows must all have the same length")
            above, line, running = p[-1], [0], 0  # running = this row's sum so far
            for column, value in enumerate(row):
                running += value
                line.append(above[column + 1] + running)
            p.append(line)
        self._p = p

    def rect_sum(self, top: int, left: int, bottom: int, right: int) -> int:
        """Return the sum of grid[top:bottom][left:right] (half-open on both axes)."""
        p = self._p
        if not (0 <= top <= bottom < len(p) and 0 <= left <= right < len(p[0])):
            raise ValueError("rectangle outside the grid")
        return p[bottom][right] - p[top][right] - p[bottom][left] + p[top][left]

    def __repr__(self) -> str:
        return f"PrefixSums2D(rows={len(self._p) - 1}, cols={len(self._p[0]) - 1})"


def apply_range_adds(length: int, updates: Iterable[tuple[int, int, int]]) -> list[int]:
    """Return a zero list of the given length after adding delta to items[lo:hi] for each (lo, hi, delta).

    diff[i] is items[i] - items[i - 1]. A range add is two edits and one
    accumulate rebuilds the values: O(length + number of updates).
    """
    diff = [0] * (length + 1)  # one spare slot because hi may equal length
    for lo, hi, delta in updates:
        if not 0 <= lo <= hi <= length:
            raise ValueError(f"bad range [{lo}, {hi}) for length {length}")
        diff[lo] += delta
        diff[hi] -= delta
    return list(accumulate(diff[:length]))


def count_subarrays_with_sum(nums: Sequence[int], k: int) -> int:
    """Count contiguous non-empty subarrays whose sum is exactly k, in O(n).

    A subarray (i, j] sums to k exactly when prefix[j] - prefix[i] == k, so each
    new prefix pairs with every earlier prefix equal to prefix - k.
    """
    seen = Counter({0: 1})  # the empty prefix has sum 0
    prefix = count = 0
    for value in nums:
        prefix += value
        count += seen[prefix - k]  # a missing key reads as 0 and is not inserted
        seen[prefix] += 1
    return count


if __name__ == "__main__":
    nums = [3, 1, 4, 1, 5, 9, 2, 6]
    sums = PrefixSums(nums)
    print(sums, len(sums))
    print(sums.range_sum(2, 5), sum(nums[2:5]), sums.range_sum(0, 8), sums.range_sum(3, 3))

    table = PrefixSums2D([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
    print(table, table.rect_sum(1, 1, 3, 3), table.rect_sum(0, 0, 3, 3))

    print(apply_range_adds(6, [(0, 3, 2), (2, 6, 5), (1, 2, -1)]))
    print(count_subarrays_with_sum([1, 2, 3, -3, 3], 3), count_subarrays_with_sum([1, 1, 1], 2))

    try:
        sums.range_sum(5, 2)
    except ValueError as error:
        print("error:", error)
`,
      output: `PrefixSums([3, 1, 4, 1, 5, 9, 2, 6]) 8
10 10 31 0
PrefixSums2D(rows=3, cols=3) 28 45
[2, 1, 7, 5, 5, 5]
5 2
error: bad range [5, 2) for 8 items`,
      bestPractices: [
        "list(accumulate(items, initial=0)) builds the prefix array in one pass at C speed, and the leading 0 removes the special case for ranges that start at index 0.",
        "Use half-open [lo, hi) ranges to match slicing: the empty range sums to 0 and neighbouring ranges compose, so range_sum(a, b) + range_sum(b, c) == range_sum(a, c).",
        "Validate bounds and raise ValueError. A negative lo would otherwise index from the end of the list and silently return a wrong sum.",
        "Counter reads a missing key as 0 without inserting it, so seen[prefix - k] needs no .get(..., 0) and does not grow the table. Seeding it with {0: 1} handles the empty prefix.",
        "__iter__ returns a generator expression over itertools.pairwise, so walking the original items is lazy and never builds a second list.",
        "__slots__ plus a small class keeps the invariant (prefix[0] == 0, never mutated) in one place instead of passing a bare list around."
      ],
      pitfalls: [
        "Forgetting the empty prefix. With seen = Counter() instead of Counter({0: 1}), count_subarrays_with_sum([3], 3) returns 0, because a subarray starting at index 0 needs the prefix 0 to pair with.",
        "Mixing inclusive and half-open ranges. For an inclusive [lo, hi] the sum is prefix[hi + 1] - prefix[lo]; choose one convention and keep it everywhere.",
        "Treating the table as live. It is a snapshot, so changing the list afterwards makes range_sum stale, and rebuilding on every change is O(n). Use a Fenwick tree when updates and queries interleave.",
        "Using a sliding window for \"sum equals k\" when the numbers can be negative. A window assumes extending only grows the sum; negatives break that, while prefix sums with a hash map do not."
      ],
      useWhen: [
        "Many range-sum (or xor, or count) queries on data that does not change between them.",
        "Many range updates followed by a single read of the array: use a difference array.",
        "\"Count, or find the longest, subarray whose sum / remainder / balance equals X\": prefix values plus a hash map.",
        "A range sum sits inside a nested loop (O(n^2) or O(n^3)): replace it with an O(1) lookup."
      ],
      inPractice: "itertools.accumulate does the work in the standard library, and numpy.cumsum does the same for numeric arrays when NumPy is available. Hand-roll the class when you want bounds checks and a name for the invariant. When updates interleave with queries use a Fenwick tree; for min or max queries on static data use a sparse table, because prefix tricks only work for operations that can be undone (sum, xor, count).",
      challenge: {
        prompt: "Write count_divisible_subarrays(nums, k). nums is a list of integers (negatives allowed) and k is a positive integer. Return how many contiguous, non-empty subarrays have a sum divisible by k. Examples: ([4, 5, 0, -2, -3, 1], 5) -> 7 and ([5], 5) -> 1. An empty list gives 0. It must run in O(n): the checks use 200,000 numbers, so trying every subarray will time out.",
        hint: "Let r be the running sum mod k. Two prefixes with the same remainder differ by a multiple of k, so the stretch between them is divisible. Keep a Counter of remainders seen so far (start with {0: 1} for the empty prefix) and add the count of the current remainder before recording it. Python's % returns a value in 0..k-1 even for negative sums.",
        starter: py`
def count_divisible_subarrays(nums, k):
    """Count non-empty contiguous subarrays of nums whose sum is divisible by k (k > 0)."""
    # TODO: track the running sum modulo k and count equal remainders.
    raise NotImplementedError
`,
        solution: py`
from collections import Counter


def count_divisible_subarrays(nums, k):
    """Count non-empty contiguous subarrays of nums whose sum is divisible by k (k > 0)."""
    seen = Counter({0: 1})  # remainder of the empty prefix
    remainder = count = 0
    for value in nums:
        remainder = (remainder + value) % k
        count += seen[remainder]
        seen[remainder] += 1
    return count
`,
        tests: py`
@check("counts the classic example")
def _():
    eq(count_divisible_subarrays([4, 5, 0, -2, -3, 1], 5), 7)

@check("handles empty, single and non-divisible inputs")
def _():
    eq(count_divisible_subarrays([], 3), 0)
    eq(count_divisible_subarrays([5], 5), 1)
    eq(count_divisible_subarrays([3], 5), 0)
    eq(count_divisible_subarrays([0], 4), 1)

@check("negative numbers and k = 1")
def _():
    eq(count_divisible_subarrays([-1, 2, 9], 2), 2)
    eq(count_divisible_subarrays([-7, -3, 4], 1), 6)
    eq(count_divisible_subarrays([-5, -5], 5), 3)

@check("matches a brute-force count on small pseudo-random lists")
def _():
    state = 12345
    for _ in range(200):
        nums = []
        for _ in range(state % 12):
            state = (state * 1103515245 + 12345) % 2**31
            nums.append(state % 21 - 10)
        state = (state * 1103515245 + 12345) % 2**31
        k = state % 6 + 1
        expected = sum(
            1
            for i in range(len(nums))
            for j in range(i, len(nums))
            if sum(nums[i:j + 1]) % k == 0
        )
        eq(count_divisible_subarrays(nums, k), expected)

@check("200,000 numbers are counted in linear time")
def _():
    n = 200_000
    eq(count_divisible_subarrays([1] * n, 7), sum(n - length + 1 for length in range(7, n + 1, 7)))
    eq(count_divisible_subarrays([6] * n, 6), n * (n + 1) // 2)
`
      },
      practice: ["Prefix Sums", "Arrays & Hashing"],
      source: "https://docs.python.org/3/library/itertools.html#itertools.accumulate"
    },
    {
      id: "two-pointers-sliding-window",
      title: "Two pointers & sliding window",
      kind: "technique",
      summary: "Move two indexes through a sequence by a rule so each item is visited a constant number of times. Opposing pointers solve pair problems on sorted data, and a sliding window answers questions about contiguous ranges in O(n).",
      concepts: [
        "Opposing pointers start at both ends of sorted data. If nums[lo] + nums[hi] is too small, nums[lo] cannot pair with anything still in range (hi already holds the largest partner), so advance lo; if it is too large, retreat hi. Every step permanently discards one candidate, so n items need at most n steps instead of n^2 pairs.",
        "Same-direction pointers split one pass into a reader that scans every item and a writer that marks where the next kept item belongs. That is how you filter, partition or deduplicate a list in place with O(1) extra memory.",
        "A sliding window is a pair of same-direction pointers [left, right] plus a running summary (sum, Counter, distinct count) that is updated in O(1) as an item enters on the right and another leaves on the left. A fixed window of size k adds one item and drops one per step; a variable window grows and shrinks.",
        "The shrink-while-invalid template for a variable window: for each right, add the item; while the window breaks the rule, remove items[left] and advance left; then record the answer. Invariant: after the while loop, [left, right] is valid and left has never moved backwards. \"Longest\" problems record after the loop, \"shortest\" problems record inside a while-valid loop.",
        "The nested loop is still O(n) because each index enters the window once (right) and leaves at most once (left), so the inner loop runs at most n times in total. This needs a monotone rule: if a window is valid, every smaller window inside it is valid too (non-negative sums, counts of distinct characters). Negative numbers break it."
      ],
      complexity: [
        { operation: "pair_with_sum", time: "O(n)", note: "each step discards lo or hi for good" },
        { operation: "dedupe_sorted_in_place", time: "O(n)", note: "one reader pass" },
        { operation: "window_sums", time: "O(n) total", note: "O(1) per step instead of O(k) to re-add" },
        { operation: "longest_unique_run", time: "O(n)", note: "left and right each move at most n times" },
        { operation: "shortest_subarray_at_least", time: "O(n)" }
      ],
      space: "O(1) extra for the pointer loops; O(min(n, alphabet size)) for the Counter in longest_unique_run.",
      code: py`
from __future__ import annotations

from collections import Counter
from collections.abc import Iterator, Sequence


def pair_with_sum(nums: Sequence[int], target: int) -> tuple[int, int] | None:
    """Return indexes (i, j), i < j, of two items of SORTED nums that add up to target, or None.

    Invariant: if a valid pair exists, both of its indexes lie in [lo, hi].
    A total that is too small means nums[lo] is too small even with the largest
    partner left, so lo moves right; a total that is too large retires hi.
    O(n) time, O(1) space.
    """
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        total = nums[lo] + nums[hi]
        if total == target:
            return lo, hi
        if total < target:
            lo += 1
        else:
            hi -= 1
    return None


def dedupe_sorted_in_place(nums: list[int]) -> int:
    """Move the distinct items of sorted nums to the front IN PLACE and return how many there are.

    Invariant: nums[:write] holds the distinct items of nums[:read], so only
    nums[:result] is meaningful afterwards. O(n) time, O(1) space.
    """
    write = 0
    for read in range(len(nums)):
        if write == 0 or nums[read] != nums[write - 1]:
            nums[write] = nums[read]
            write += 1
    return write


def window_sums(nums: Sequence[int], k: int) -> Iterator[int]:
    """Yield the sum of every run of k consecutive items (k >= 1), O(n) in total.

    Each step adds the item entering the window and subtracts the one leaving.
    """
    if k < 1:
        raise ValueError("window size must be at least 1")
    if len(nums) < k:
        return
    window = sum(nums[:k])
    yield window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]
        yield window


def longest_unique_run(text: str) -> int:
    """Return the length of the longest substring of text with no repeated character.

    Template for the LONGEST valid window: grow right; while the window is
    invalid, shrink from the left; then record. Invariant: after the inner loop
    text[left:right + 1] has no repeats. left never moves back, so O(n).
    """
    counts: Counter[str] = Counter()  # the characters inside the window
    left = best = 0
    for right, char in enumerate(text):
        counts[char] += 1
        while counts[char] > 1:  # invalid: char is duplicated, evict from the left
            counts[text[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best


def shortest_subarray_at_least(nums: Sequence[int], target: int) -> int:
    """Return the length of the shortest run of non-negative numbers summing to >= target, or 0.

    Template for the SHORTEST valid window: grow right; while the window is
    VALID, record it and shrink from the left. Needs target >= 1 and no
    negative items, so removing an item can never raise the sum. O(n).
    """
    if target < 1:
        raise ValueError("target must be at least 1")
    total = left = 0
    best = len(nums) + 1  # longer than any real window
    for right, value in enumerate(nums):
        total += value
        while total >= target:
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return best if best <= len(nums) else 0


if __name__ == "__main__":
    ordered = [1, 3, 4, 6, 8, 11]
    print(pair_with_sum(ordered, 10), pair_with_sum(ordered, 100))

    data = [1, 1, 2, 2, 2, 3, 5, 5]
    kept = dedupe_sorted_in_place(data)
    print(kept, data[:kept])

    temps = [2, 1, 5, 1, 3, 2]
    print(list(window_sums(temps, 3)), max(window_sums(temps, 3)), list(window_sums(temps, 9)))

    for text in ("abcabcbb", "bbbb", "pwwkew", ""):
        print(f"{text!r:12} longest unique run = {longest_unique_run(text)}")
    print(shortest_subarray_at_least([2, 3, 1, 2, 4, 3], 7), shortest_subarray_at_least([1, 1, 1], 10))

    try:
        shortest_subarray_at_least([1], 0)
    except ValueError as error:
        print("error:", error)
`,
      output: `(2, 3) None
4 [1, 2, 3, 5]
[8, 7, 9, 6] 9 []
'abcabcbb'   longest unique run = 3
'bbbb'       longest unique run = 1
'pwwkew'     longest unique run = 3
''           longest unique run = 0
2 0
error: target must be at least 1`,
      bestPractices: [
        "Name pointers for what they mean (lo / hi, read / write, left / right) and write the invariant in the docstring. Most two-pointer bugs come from an unclear invariant, not a typo.",
        "Keep a running value (total, Counter) and update it as items enter and leave. Recomputing sum(nums[left:right + 1]) on every step would turn O(n) into O(n * window).",
        "Let the for loop own one pointer (right, via enumerate) and the while loop the other (left). Because left only ever moves forward inside the while, the total work is bounded by 2n.",
        "window_sums is a generator, so max(window_sums(...)) uses O(1) memory and a caller can stop early. Validating k inside it raises on the first next(), which is why the docstring states the precondition.",
        "Counter is a good window summary: counts[c] += 1 and -= 1 are O(1), and a missing key reads as 0. A function that mutates its argument says so in its name (dedupe_sorted_in_place) and returns the new length.",
        "Pick the template by the question: record AFTER the shrink loop for \"longest valid window\", and INSIDE a while-valid loop for \"shortest valid window\"."
      ],
      pitfalls: [
        "Running opposing pointers on unsorted data. The \"too small, advance lo\" argument needs sorted order; on unsorted input it silently misses pairs. Sort first (O(n log n)) or use a hash set.",
        "Using the shrinking window when numbers can be negative. For \"shortest subarray with sum >= target\", removing an item can raise the sum when it is negative, so shrinking skips valid windows. Use prefix sums with a monotonic deque instead.",
        "Off-by-one on the window length: [left, right] holds right - left + 1 items, not right - left.",
        "Leaving zero-count keys in a Counter. If the rule is \"at most k distinct characters\", len(counts) still counts a character whose count fell to 0; delete the key when it reaches 0."
      ],
      useWhen: [
        "Sorted data and a question about pairs or triples (\"two numbers that sum to\", closest pair, 3-sum): opposing pointers.",
        "Longest or shortest contiguous subarray or substring under a monotone rule (adding items can only break it, or only help): variable window.",
        "An aggregate (sum, average, distinct count) over every window of fixed size k: fixed window.",
        "Compacting, partitioning or deduplicating an array in place with O(1) extra memory: reader and writer pointers."
      ],
      inPractice: "There is no library call for this: pointers and windows are loop patterns you write yourself. Use collections.deque(maxlen=k) when you need the last k items themselves, itertools.islice and pairwise for simple fixed windows, and str.find for a fixed pattern rather than a hand-written window. When the window must report its maximum or minimum, pair it with a monotonic deque.",
      challenge: {
        prompt: "Write longest_with_k_distinct(text, k). Return the length of the longest substring of text that contains at most k distinct characters (k >= 0). Examples: ('eceba', 2) -> 3 (the substring 'ece'), ('aa', 1) -> 2, ('abc', 0) -> 0. An empty string gives 0. It must run in O(n): the checks use strings of 200,000 characters, so testing every substring will time out.",
        hint: "Slide a window and keep a Counter of the characters inside it. After adding text[right], while len(counts) > k remove text[left] from the counts and advance left. Delete a key when its count reaches 0: Counter keeps zero entries, and len() would still count them. Record right - left + 1 after the loop.",
        starter: py`
def longest_with_k_distinct(text, k):
    """Length of the longest substring of text with at most k distinct characters."""
    # TODO: grow the window on the right, shrink it from the left while it has more than k distinct characters.
    raise NotImplementedError
`,
        solution: py`
from collections import Counter


def longest_with_k_distinct(text, k):
    """Length of the longest substring of text with at most k distinct characters."""
    if k <= 0:
        return 0
    counts = Counter()  # characters inside the window
    left = best = 0
    for right, char in enumerate(text):
        counts[char] += 1
        while len(counts) > k:  # invalid: too many distinct characters
            dropped = text[left]
            counts[dropped] -= 1
            if counts[dropped] == 0:
                del counts[dropped]
            left += 1
        best = max(best, right - left + 1)
    return best
`,
        tests: py`
@check("finds the longest window in the examples")
def _():
    eq(longest_with_k_distinct("eceba", 2), 3)
    eq(longest_with_k_distinct("aa", 1), 2)
    eq(longest_with_k_distinct("aabbcc", 2), 4)
    eq(longest_with_k_distinct("abaccc", 2), 4)

@check("k = 0, empty text and k larger than the alphabet")
def _():
    eq(longest_with_k_distinct("abc", 0), 0)
    eq(longest_with_k_distinct("", 3), 0)
    eq(longest_with_k_distinct("abcabc", 3), 6)
    eq(longest_with_k_distinct("abcabc", 10), 6)

@check("single characters and k = 1")
def _():
    eq(longest_with_k_distinct("a", 1), 1)
    eq(longest_with_k_distinct("abc", 1), 1)
    eq(longest_with_k_distinct("aaabbbbc", 1), 4)

@check("matches a brute-force search on small pseudo-random strings")
def _():
    state = 2024
    for _ in range(300):
        letters = []
        for _ in range(state % 13):
            state = (state * 1103515245 + 12345) % 2**31
            letters.append("abcd"[(state >> 8) % 4])
        text = "".join(letters)
        state = (state * 1103515245 + 12345) % 2**31
        k = (state >> 8) % 5
        expected = max(
            (j - i for i in range(len(text)) for j in range(i, len(text) + 1) if len(set(text[i:j])) <= k),
            default=0,
        )
        eq(longest_with_k_distinct(text, k), expected)

@check("200,000 characters are handled in linear time")
def _():
    eq(longest_with_k_distinct("abcdefghij" * 20_000, 3), 3)
    blocks = "a" * 100_000 + "b" * 100_000
    eq(longest_with_k_distinct(blocks, 1), 100_000)
    eq(longest_with_k_distinct(blocks, 2), 200_000)
`
      },
      practice: ["Two Pointers", "Sliding Window"],
      source: "https://docs.python.org/3/library/collections.html#collections.Counter"
    },
    {
      id: "monotonic-stack-queue",
      title: "Monotonic stack & queue",
      kind: "technique",
      summary: "A stack or deque kept in sorted order by popping everything that breaks the order. It answers \"next greater element\", histogram and sliding-window-maximum questions in O(n) instead of O(n^2).",
      concepts: [
        "A monotonic stack keeps its items in order (for example never increasing from bottom to top) by popping every item that would break the order before pushing the new one. Items wait on the stack until something arrives that answers their question, and the pop IS the answer: the item that pops x is the first greater item to the right of x.",
        "Why it is O(n): the inner while loop looks quadratic, but every index is pushed exactly once and popped at most once, so the whole run performs at most n pushes and n pops. Charge each pop to the push that created it (amortized analysis) and the average cost per item is O(1).",
        "Store indexes, not values. An index gives you the value (nums[i]) and also the distance (j - i) or width a problem needs. \"Daily temperatures\" is next-greater-element with the distance reported instead of the value.",
        "For a histogram, the best rectangle limited by bar i stretches left and right until it meets a shorter bar. A stack of non-decreasing heights finds both boundaries in one pass: a shorter bar ends every taller bar on the stack, and each popped bar remembers how far left it could stretch. A sentinel height 0 at the end flushes whatever is left.",
        "Sliding-window maximum uses a monotonic queue (a deque). A new item still pops smaller items from the back, since they expire sooner and can never beat it, and the front is dropped when its index slides out of the window. The front is always the window's maximum, and each index enters and leaves once: O(n) instead of O(n * k)."
      ],
      complexity: [
        { operation: "next_greater_index / days_until_warmer", time: "O(n) amortized", note: "n pushes + at most n pops" },
        { operation: "largest_rectangle", time: "O(n) amortized" },
        { operation: "sliding_window_max (all windows)", time: "O(n) amortized", note: "brute force max() per window is O(n * k)" },
        { operation: "brute force \"scan right from every item\"", time: "O(n^2) worst case", note: "what the stack replaces" }
      ],
      space: "O(n) for the stack of waiting indexes and the result; O(k) for the sliding-window deque.",
      code: py`
from __future__ import annotations

from collections import deque
from collections.abc import Iterator, Sequence
from itertools import chain


def next_greater_index(nums: Sequence[int]) -> list[int]:
    """result[i] is the index of the first item right of i that is strictly greater than nums[i], or -1.

    Invariant: waiting holds the indexes whose answer is still unknown and
    their values never increase from bottom to top (a monotonic stack). A new
    item answers every smaller item on top, so those are popped. Each index is
    pushed once and popped at most once: O(n) in total, not O(n^2).
    """
    result = [-1] * len(nums)
    waiting: list[int] = []
    for i, value in enumerate(nums):
        while waiting and nums[waiting[-1]] < value:
            result[waiting.pop()] = i
        waiting.append(i)
    return result


def next_greater_values(nums: Sequence[int]) -> list[int]:
    """For each item, the next strictly greater value to its right, or -1."""
    return [nums[j] if j >= 0 else -1 for j in next_greater_index(nums)]


def days_until_warmer(temps: Sequence[int]) -> list[int]:
    """For each day, how many days until a warmer one (0 when there is none)."""
    return [j - i if j >= 0 else 0 for i, j in enumerate(next_greater_index(temps))]


def largest_rectangle(heights: Sequence[int]) -> int:
    """Return the area of the largest rectangle in a histogram of width-1 bars (heights >= 0).

    Invariant: bars holds (start, height) pairs with non-decreasing heights,
    where start is how far left that height can extend. A shorter bar ends
    every taller bar on the stack: its rectangle spans [start, i). The popped
    start passes to the new bar, which can reach back that far. The final
    height 0 flushes the stack. O(n).
    """
    best = 0
    bars: list[tuple[int, int]] = []
    for i, height in enumerate(chain(heights, (0,))):
        start = i
        while bars and bars[-1][1] > height:
            start, tall = bars.pop()
            best = max(best, tall * (i - start))
        bars.append((start, height))
    return best


def sliding_window_max(nums: Sequence[int], k: int) -> Iterator[int]:
    """Yield the maximum of every run of k consecutive items (k >= 1), O(n) in total.

    Invariant: window holds indexes of the current window whose values never
    increase from front to back, so nums[window[0]] is the maximum. A new item
    makes every smaller item behind it useless, so those leave from the BACK;
    the front leaves when its index slides out of the window.
    """
    if k < 1:
        raise ValueError("window size must be at least 1")
    window: deque[int] = deque()
    for i, value in enumerate(nums):
        while window and nums[window[-1]] <= value:
            window.pop()
        window.append(i)
        if window[0] <= i - k:  # the oldest index just left the window
            window.popleft()
        if i >= k - 1:
            yield nums[window[0]]


if __name__ == "__main__":
    print(next_greater_values([2, 1, 2, 4, 3]))
    print(days_until_warmer([73, 74, 75, 71, 69, 72, 76, 73]))
    print(largest_rectangle([2, 1, 5, 6, 2, 3]), largest_rectangle([4]), largest_rectangle([]))
    print(list(sliding_window_max([1, 3, -1, -3, 5, 3, 6, 7], 3)))
    print(list(sliding_window_max([4, 2], 5)), list(sliding_window_max([5, 5, 5], 2)))

    try:
        next(sliding_window_max([1], 0))
    except ValueError as error:
        print("error:", error)
`,
      output: `[4, 2, 4, -1, -1]
[1, 1, 4, 2, 1, 1, 0, 0]
10 4 0
[3, 3, 5, 5, 6, 7]
[] [5, 5]
error: window size must be at least 1`,
      bestPractices: [
        "Use a plain list as the stack (append and pop at the end are O(1)) and a collections.deque for the monotonic queue, which needs O(1) removal at both ends. list.pop(0) would cost O(k).",
        "Push indexes so one structure gives the value (nums[waiting[-1]]), the distance (j - i) and the width. Storing only values loses the position.",
        "Write the ordering invariant in the docstring. The comparison operator (< or <=) is that invariant turned into code, so decide what a tie means before writing the loop.",
        "Derive variants from one core. next_greater_values and days_until_warmer are one-line comprehensions over next_greater_index, so the subtle loop exists exactly once.",
        "chain(heights, (0,)) appends the sentinel lazily without copying the input, and none of these functions mutates its argument.",
        "sliding_window_max is a generator: each window's maximum is yielded as soon as it is known, so a long stream is processed with O(k) memory."
      ],
      pitfalls: [
        "Choosing the wrong tie rule. Popping on < in next_greater_index finds the next strictly greater item; popping on <= would find the next greater-or-equal one. Equal items need an explicit decision.",
        "Forgetting the leftovers. After the loop the stack still holds items with no answer: next_greater leaves them at -1, but for the histogram, skipping the sentinel 0 loses every rectangle that reaches the right edge (largest_rectangle([1, 2, 3]) would give 0 instead of 4).",
        "Storing values instead of indexes in the window deque. You can no longer tell when the front has slid out of the window.",
        "Calling max(nums[i - k + 1:i + 1]) per window is O(n * k). Conversely, do not assume every nested loop is quadratic: here the inner while is amortized O(1) per item."
      ],
      useWhen: [
        "\"Next or previous greater / smaller element\" for every position, or the distance to it (daily temperatures, stock span).",
        "An item is limited by its nearest smaller or larger neighbour: largest rectangle in a histogram, trapping rain water, sum of subarray minimums.",
        "The maximum or minimum of every window of size k, or a window whose bounds depend on a running max or min.",
        "A brute force scans left or right from each position to find the first item that beats it; that scan is what the stack replaces."
      ],
      inPractice: "There is no monotonic-stack class: a list (as the stack) or a collections.deque (as the queue) with the right pop rule is the standard solution, and it is what you write in interviews and on streaming data. heapq can answer sliding-window maximum with lazy deletion in O(n log n), but the deque version is O(n) and simpler. Hand-roll it whenever a problem asks for nearest-greater or nearest-smaller relationships.",
      challenge: {
        prompt: "Write class StockSpanner with a method next(price). Call it once per day with that day's price; it returns the span: the number of consecutive days, counting today and going backwards, on which the price was less than or equal to today's price. Prices 100, 80, 60, 70, 60, 75, 85 give spans 1, 1, 1, 2, 1, 4, 6, and the first call always returns 1. Each call must take amortized O(1) time: the checks make 200,000 calls, and rescanning backwards on every call will time out.",
        hint: "Keep a stack of (price, span) pairs whose prices strictly decrease from bottom to top. For a new price start with span = 1, pop every entry whose price is <= the new price and add its span to yours (today covers all the days it covered), then push (price, span) and return span.",
        starter: py`
class StockSpanner:
    """Reports, for each day's price, how many consecutive days up to today were priced <= today."""

    def __init__(self):
        self._days = []

    def next(self, price):
        # TODO: return the span for this price in amortized O(1).
        raise NotImplementedError
`,
        solution: py`
class StockSpanner:
    """Reports, for each day's price, how many consecutive days up to today were priced <= today."""

    def __init__(self):
        self._stack = []  # (price, span) pairs, prices strictly decreasing

    def next(self, price):
        span = 1
        while self._stack and self._stack[-1][0] <= price:
            span += self._stack.pop()[1]  # those days are covered by today's span
        self._stack.append((price, span))
        return span
`,
        tests: py`
@check("returns the spans of the classic example")
def _():
    spanner = StockSpanner()
    eq([spanner.next(price) for price in (100, 80, 60, 70, 60, 75, 85)], [1, 1, 1, 2, 1, 4, 6])

@check("equal prices count towards the span")
def _():
    spanner = StockSpanner()
    eq([spanner.next(5) for _ in range(4)], [1, 2, 3, 4])
    eq(spanner.next(4), 1)
    eq(spanner.next(5), 6)

@check("rising prices span every day, falling prices span one")
def _():
    rising = StockSpanner()
    eq([rising.next(price) for price in range(1, 9)], list(range(1, 9)))
    falling = StockSpanner()
    eq([falling.next(price) for price in range(8, 0, -1)], [1] * 8)

@check("separate spanners do not share history")
def _():
    first, second = StockSpanner(), StockSpanner()
    first.next(10)
    first.next(20)
    eq(second.next(15), 1)
    eq(first.next(15), 1)

@check("matches a brute-force scan on 500 pseudo-random prices")
def _():
    state = 99
    prices = []
    spanner = StockSpanner()
    for _ in range(500):
        state = (state * 1103515245 + 12345) % 2**31
        price = (state >> 8) % 50
        prices.append(price)
        span = 1
        while span < len(prices) and prices[-1 - span] <= price:
            span += 1
        eq(spanner.next(price), span)

@check("200,000 calls run in amortized constant time")
def _():
    n = 200_000
    spanner = StockSpanner()
    total = 0
    for price in range(n):
        total += spanner.next(price)  # every earlier day is cheaper, so span == day number
    eq(total, n * (n + 1) // 2)
    eq(spanner.next(n - 2), 1)  # cheaper than yesterday
    eq(spanner.next(n + 5), n + 2)  # beats the last two days and everything before them
`
      },
      practice: ["Stack & Monotonic Queue", "Sliding Window"],
      source: "https://docs.python.org/3/library/collections.html#collections.deque"
    },
    // NEXT-LESSON
  ],
};
