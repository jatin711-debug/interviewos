import type { DsModule } from "./types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const SORTING_SEARCHING_MODULE: DsModule = {
  id: "sorting-searching",
  title: "Searching & sorting",
  description: "Binary search and the sorting algorithms behind sorted(): what they cost and when each wins.",
  lessons: [
    {
      id: "binary-search",
      title: "Binary search",
      kind: "algorithm",
      summary: "Halve the search space on every step. It finds a value in sorted data in O(log n), and the same idea finds the smallest answer that satisfies any monotone condition.",
      concepts: [
        "Binary search needs order: an item's position tells you which half can still hold the target. Compare with the middle, throw away the half that cannot contain the answer, and repeat. n items take about log2(n) steps, so a million items need roughly 20.",
        "Most bugs come from fuzzy boundaries. Fix an invariant first (for example: everything left of lo is too small, everything from hi on is big enough) and write the loop so each step keeps it true and shrinks the range.",
        "lower_bound returns the first position whose item is >= target and upper_bound the first position whose item is > target. Together they give membership, insertion points, first and last occurrence, and counts, which is why they are better building blocks than a plain \"find\".",
        "You can search an answer instead of an array. If a yes/no question is monotone (no, no, no, yes, yes), binary search finds the first yes without any sorted list: smallest capacity that works, smallest speed that finishes in time, integer square root."
      ],
      complexity: [
        { operation: "lower_bound / upper_bound / index_of", time: "O(log n)", note: "requires sorted input" },
        { operation: "count_in_range", time: "O(log n)", note: "two bound searches, no scanning" },
        { operation: "first_true over a range of size R", time: "O(log R) predicate calls" },
        { operation: "min_ship_capacity", time: "O(n log S)", note: "n weights, S = sum of weights" }
      ],
      space: "O(1): the loops keep only lo, hi and mid (no recursion).",
      code: py`
from __future__ import annotations

from bisect import bisect_left, bisect_right
from collections.abc import Callable, Sequence
from typing import TypeVar

T = TypeVar("T")


def lower_bound(items: Sequence[T], target: T) -> int:
    """Return the index of the first item >= target (len(items) if there is none).

    Invariant: every index < lo holds an item < target and every index >= hi
    holds an item >= target, so the answer always lies in [lo, hi].
    """
    lo, hi = 0, len(items)
    while lo < hi:
        mid = (lo + hi) // 2  # Python ints never overflow
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def upper_bound(items: Sequence[T], target: T) -> int:
    """Return the index of the first item > target (len(items) if there is none)."""
    lo, hi = 0, len(items)
    while lo < hi:
        mid = (lo + hi) // 2
        if items[mid] <= target:
            lo = mid + 1
        else:
            hi = mid
    return lo


def index_of(items: Sequence[T], target: T) -> int:
    """Return an index holding target, or -1 when it is absent."""
    i = lower_bound(items, target)
    return i if i < len(items) and items[i] == target else -1


def count_in_range(items: Sequence[T], low: T, high: T) -> int:
    """Count items with low <= item <= high in O(log n)."""
    return upper_bound(items, high) - lower_bound(items, low)


def first_true(lo: int, hi: int, predicate: Callable[[int], bool]) -> int:
    """Return the smallest n in [lo, hi) with predicate(n) true, or hi if none.

    predicate must be monotone: False, False, ..., True, True. This is binary
    search on the ANSWER, so no sorted array is needed.
    """
    while lo < hi:
        mid = (lo + hi) // 2
        if predicate(mid):
            hi = mid  # mid might be the answer, so keep it
        else:
            lo = mid + 1  # mid is too small, so discard it
    return lo


def min_ship_capacity(weights: Sequence[int], days: int) -> int:
    """Smallest capacity that ships every package, in order, in at most the given number of days."""

    def fits(capacity: int) -> bool:
        needed, load = 1, 0
        for weight in weights:
            if load + weight > capacity:
                needed += 1
                load = 0
            load += weight
        return needed <= days

    return first_true(max(weights), sum(weights) + 1, fits)


if __name__ == "__main__":
    data = [1, 3, 3, 3, 7, 9]
    print(lower_bound(data, 3), upper_bound(data, 3), count_in_range(data, 3, 3))
    print(index_of(data, 7), index_of(data, 4), lower_bound(data, 100))
    print(lower_bound(data, 4) == bisect_left(data, 4), upper_bound(data, 3) == bisect_right(data, 3))
    print(count_in_range(data, 3, 8))
    print(first_true(0, 50, lambda n: n * n >= 200))
    print(min_ship_capacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5))
`,
      output: `1 4 3
4 -1 6
True True
4
15
15`,
      bestPractices: [
        "Write the invariant in the docstring and loop with `while lo < hi` over a half-open range [lo, hi). One loop shape then serves lower_bound, upper_bound and first_true, with no off-by-one special cases.",
        "Compute mid as (lo + hi) // 2. Unlike C or Java, Python integers cannot overflow, so the classic `lo + (hi - lo) // 2` workaround is unnecessary.",
        "Return an insertion point, not a bare -1. lower_bound's result is the index where the target is or would be inserted, and index_of is a thin wrapper on top of it.",
        "Accept any Sequence[T] and use T-typed comparisons so the same function works for lists, tuples, ranges and strings. A range is a lazy sequence, so searching range(10**12) costs nothing.",
        "In production code call bisect.bisect_left / bisect_right (they are written in C), or the key= parameter added in Python 3.10. Hand-roll the loop when the predicate is not a simple comparison, as in first_true."
      ],
      pitfalls: [
        "Using `while lo <= hi` with `hi = mid` loops forever once lo == hi. Pair `<=` with `hi = mid - 1`, or `<` with `hi = mid`, and never mix them.",
        "Searching unsorted data, or data sorted with a different key than the one you compare by, silently returns wrong answers instead of raising.",
        "Using the wrong monotone direction in search-on-answer: the predicate must flip from False to True exactly once. If a larger value can fail again, binary search does not apply.",
        "Forgetting that equal items form a block: a plain \"find\" returns an arbitrary member of it. Use lower_bound or upper_bound when the first or last occurrence matters."
      ],
      useWhen: [
        "The input is sorted (or sortable once and queried many times) and you need a lookup, insertion point or count.",
        "\"Find the minimum/maximum value such that ...\" where checking one candidate is easy and feasibility only improves as the value grows.",
        "A brute-force loop tries every value in a numeric range; replace the loop with first_true.",
        "The constraints say n is large (10^5 and up) and the target complexity is O(log n) or O(n log n)."
      ],
      inPractice: "Use the bisect module for sorted lists (bisect_left, bisect_right, insort) and keep the list sorted with insort when inserts are rare. For a sorted container with frequent inserts and deletes, use a balanced tree or the sortedcontainers package. Write the loop yourself for search-on-answer problems, where no library knows your predicate.",
      challenge: {
        prompt: "Write search_rotated(nums, target). nums is a list of distinct integers that was sorted in ascending order and then rotated at an unknown pivot, for example [4, 5, 6, 7, 0, 1, 2]. Return the index of target, or -1 if it is not present. It must run in O(log n): the checks search a list of 200,000 numbers 5,000 times, so a linear scan will time out.",
        hint: "At every step one half of [lo, hi] is still sorted: if nums[lo] <= nums[mid] the left half is. Check whether the target lies inside that sorted half; if it does, keep that half, otherwise keep the other one.",
        starter: py`
def search_rotated(nums, target):
    """Return the index of target in a rotated sorted list, or -1."""
    # Keep lo and hi around the part that can still hold the target.
    raise NotImplementedError
`,
        solution: py`
def search_rotated(nums, target):
    """Return the index of target in a rotated sorted list, or -1."""
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:  # the left half is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:  # the right half is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
`,
        tests: py`
@check("finds every value in a rotated list")
def _():
    nums = [4, 5, 6, 7, 0, 1, 2]
    for index, value in enumerate(nums):
        eq(search_rotated(nums, value), index)

@check("returns -1 for missing values")
def _():
    nums = [4, 5, 6, 7, 0, 1, 2]
    eq(search_rotated(nums, 3), -1)
    eq(search_rotated(nums, 8), -1)
    eq(search_rotated(nums, -1), -1)

@check("handles empty, single and two-element lists")
def _():
    eq(search_rotated([], 1), -1)
    eq(search_rotated([5], 5), 0)
    eq(search_rotated([5], 1), -1)
    eq(search_rotated([3, 1], 1), 1)
    eq(search_rotated([3, 1], 3), 0)

@check("works when the list is not rotated or rotated by n - 1")
def _():
    eq(search_rotated([1, 2, 3, 4, 5], 4), 3)
    eq(search_rotated([5, 1, 2, 3, 4], 5), 0)
    eq(search_rotated([2, 3, 4, 5, 1], 1), 4)

@check("answers 5,000 searches on 200,000 numbers quickly")
def _():
    n = 200_000
    nums = list(range(0, 2 * n, 2))
    nums = nums[77_777:] + nums[:77_777]
    for step in range(5_000):
        value = (step * 79) % (2 * n)
        found = search_rotated(nums, value)
        if value % 2:
            eq(found, -1)
        else:
            eq(nums[found], value)
`
      },
      practice: ["Binary Search", "Sorting"],
      source: "https://docs.python.org/3/library/bisect.html"
    },
    {
      id: "elementary-sorts",
      title: "Bubble, selection & insertion sort",
      kind: "algorithm",
      summary: "The three simple O(n^2) sorts. They are rarely the right tool on big data, but they teach comparisons, swaps, stability and adaptivity, and insertion sort is the small-case engine inside Python's own sort.",
      concepts: [
        "Bubble sort swaps neighbours that are out of order, so each pass carries the largest remaining item to the end; stop as soon as a pass makes no swap and sorted input costs one pass. Selection sort scans the unsorted part for its minimum and swaps it into place: always n(n-1)/2 comparisons, but at most n - 1 swaps. Insertion sort grows a sorted prefix and slides each new item left into its slot, like sorting a hand of cards.",
        "An inversion is a pair of items that are in the wrong order. Bubble sort and insertion sort each fix exactly one inversion per move, so insertion sort costs n plus the number of inversions. A nearly sorted list has few inversions, which makes insertion sort close to O(n). This is why Timsort, the algorithm behind sorted() and list.sort(), builds short runs of 32 to 64 items with a binary variant of insertion sort before merging them.",
        "A sort is stable when equal items keep their original relative order. Bubble and insertion sort only move an item past a strictly greater one, so they are stable. Selection sort swaps across long distances and can jump an item over an equal one, so it is not. Stability is what lets you sort by one key and then by another.",
        "To sort by a key, compute key(item) once per item, bundle each item with its key, sort the bundles, and unwrap. The sorts below only ever use `<`, which is also all that Python's own sort asks of your objects. Return a new list unless the function's name says it works in place."
      ],
      complexity: [
        { operation: "bubble_sort", time: "O(n) best, O(n^2) average and worst", note: "the best case needs the early exit; stable" },
        { operation: "selection_sort", time: "O(n^2) always", note: "n(n-1)/2 comparisons but at most n - 1 swaps; not stable" },
        { operation: "insertion_sort", time: "O(n + inversions)", note: "O(n) when nearly sorted, O(n^2) worst case; stable" },
        { operation: "key= wrapping", time: "O(n) extra", note: "key is called once per item, not once per comparison" }
      ],
      space: "O(1) auxiliary for each sorting loop. The public functions copy their input, so a call uses O(n) overall (plus n small wrapper objects when key= is given).",
      code: py`
from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

T = TypeVar("T")


@dataclass(slots=True)
class Stats:
    """Work counters: key comparisons, and element swaps (bubble, selection) or shifts (insertion)."""

    comparisons: int = 0
    moves: int = 0


class _Keyed(Generic[T]):
    """An item bundled with its precomputed key. Ordering looks at the key only, which is
    what sorted(key=...) does internally: key(item) runs once per item, not once per comparison."""

    __slots__ = ("key", "item")

    def __init__(self, key: Any, item: T) -> None:
        self.key, self.item = key, item

    def __lt__(self, other: _Keyed[T]) -> bool:  # sorting only ever needs <
        return self.key < other.key


def _bubble(a: list[Any], stats: Stats) -> None:
    for end in range(len(a) - 1, 0, -1):
        # Invariant: a[end + 1:] holds the largest items, already in final order.
        swapped = False
        for j in range(end):
            stats.comparisons += 1
            if a[j + 1] < a[j]:  # strict <, so equal items never pass each other
                a[j], a[j + 1] = a[j + 1], a[j]
                stats.moves += 1
                swapped = True
        if not swapped:  # a pass without swaps proves the list is sorted: stop early
            return


def _selection(a: list[Any], stats: Stats) -> None:
    for i in range(len(a) - 1):
        # Invariant: a[:i] holds the i smallest items, in final order.
        smallest = i
        for j in range(i + 1, len(a)):
            stats.comparisons += 1
            if a[j] < a[smallest]:
                smallest = j
        if smallest != i:  # a long-distance swap can jump over an equal item: not stable
            a[i], a[smallest] = a[smallest], a[i]
            stats.moves += 1


def _insertion(a: list[Any], stats: Stats) -> None:
    for i in range(1, len(a)):
        # Invariant: a[:i] is sorted. Slide a[i] left until it fits.
        current = a[i]
        j = i
        while j > 0:
            stats.comparisons += 1
            if not current < a[j - 1]:  # equal items stay put: stable
                break
            a[j] = a[j - 1]
            stats.moves += 1
            j -= 1
        a[j] = current


def _sorted_copy(algorithm: Callable[[list[Any], Stats], None], items: Iterable[T],
                 key: Callable[[T], Any] | None, stats: Stats | None) -> list[T]:
    """Run an in-place algorithm on a copy, so the caller's data is never touched."""
    stats = stats if stats is not None else Stats()
    if key is None:
        data = list(items)
        algorithm(data, stats)
        return data
    wrapped = [_Keyed(key(item), item) for item in items]
    algorithm(wrapped, stats)
    return [entry.item for entry in wrapped]


def bubble_sort(items: Iterable[T], key: Callable[[T], Any] | None = None, stats: Stats | None = None) -> list[T]:
    """Return a new sorted list. Stable; O(n) on sorted input, O(n^2) otherwise."""
    return _sorted_copy(_bubble, items, key, stats)


def selection_sort(items: Iterable[T], key: Callable[[T], Any] | None = None, stats: Stats | None = None) -> list[T]:
    """Return a new sorted list. NOT stable; always O(n^2) comparisons but at most n - 1 swaps."""
    return _sorted_copy(_selection, items, key, stats)


def insertion_sort(items: Iterable[T], key: Callable[[T], Any] | None = None, stats: Stats | None = None) -> list[T]:
    """Return a new sorted list. Stable; O(n + inversions), so O(n) when nearly sorted."""
    return _sorted_copy(_insertion, items, key, stats)


if __name__ == "__main__":
    inputs = {"sorted": list(range(1, 9)), "reversed": list(range(8, 0, -1)), "shuffled": [5, 2, 8, 1, 7, 3, 6, 4]}
    print(f"{'input':9}{'algorithm':15}{'compares':>9}{'moves':>7}")
    for label, data in inputs.items():
        for sort in (bubble_sort, selection_sort, insertion_sort):
            stats = Stats()
            assert sort(data, stats=stats) == sorted(data)
            print(f"{label:9}{sort.__name__:15}{stats.comparisons:9}{stats.moves:7}")

    people = [("Ann", 30), ("Bo", 25), ("Cy", 30), ("Di", 25)]
    for sort in (bubble_sort, selection_sort, insertion_sort):
        print(f"{sort.__name__:15}", [name for name, _ in sort(people, key=lambda p: p[1])])
    print(people[0], insertion_sort([]), insertion_sort("cab"))
`,
      output: `input    algorithm       compares  moves
sorted   bubble_sort            7      0
sorted   selection_sort        28      0
sorted   insertion_sort         7      0
reversed bubble_sort           28     28
reversed selection_sort        28      4
reversed insertion_sort        28     28
shuffled bubble_sort           25     14
shuffled selection_sort        28      6
shuffled insertion_sort        19     14
bubble_sort     ['Bo', 'Di', 'Ann', 'Cy']
selection_sort  ['Bo', 'Di', 'Cy', 'Ann']
insertion_sort  ['Bo', 'Di', 'Ann', 'Cy']
('Ann', 30) [] ['a', 'b', 'c']`,
      bestPractices: [
        "Return a new list and leave the argument alone. _sorted_copy sorts a copy, the way sorted() does; list.sort() is the in-place twin and returns None. A function that mutates its argument should say so in its name (insertion_sort_in_place) or its docstring.",
        "Compute each key once. _Keyed stores key(item) next to the item, so the key function runs n times instead of once per comparison, exactly as sorted(key=...) does. It defines only __lt__, because that is the only comparison Python's sorting relies on.",
        "Compare with a strict `<` so equal items never pass each other: `a[j + 1] < a[j]` in bubble sort, `not current < a[j - 1]` in insertion sort. Writing `<=` quietly makes the sort unstable.",
        "Keep the algorithm apart from the bookkeeping. _bubble, _selection and _insertion are plain in-place loops, and one wrapper handles copying, keys and counting. A small @dataclass(slots=True) holds the counters, and `stats: Stats | None = None` avoids both a mutable default and a global.",
        "Write the loop invariant as a comment at the top of each outer loop (\"a[:i] is sorted\"). Once you can say what stays true after every iteration, the early exit and the final result are easy to justify."
      ],
      pitfalls: [
        "Dropping the early exit leaves bubble sort at O(n^2) even on sorted input: 28 comparisons instead of 7 for 8 items. The swapped flag is what makes it adaptive.",
        "Assuming selection sort is stable. Sorting Ann 30, Bo 25, Cy 30, Di 25 by age puts Cy before Ann, because the second swap carries Ann across Cy to the end of the list.",
        "Writing `<=` instead of `<`. Equal items then start swapping, bubble and insertion sort stop being stable, and a list of equal items does pointless work.",
        "Using these sorts on large random data. 100,000 items need billions of comparisons. Keep them for tiny inputs, nearly sorted inputs, or as the base case of a faster sort."
      ],
      useWhen: [
        "The list is tiny (a few dozen items) or already almost sorted, for example a sorted list that receives one new item at a time.",
        "Extra memory is not allowed and you have no library, or writes are expensive and you want the fewest swaps (selection sort makes at most n - 1).",
        "An interviewer asks you to hand-write a sort, or to explain in-place, stable and adaptive.",
        "You need the small-case base of a divide-and-conquer sort, which is how Timsort uses insertion sort."
      ],
      inPractice: "Call sorted(items, key=...) or items.sort(key=...). Both are stable, run Timsort in C, and detect runs that are already ordered, so they beat a hand-written elementary sort at every size. Write insertion sort yourself to learn, in an interview, or as the small-case step of your own hybrid sort. To keep a list sorted while adding items one at a time, use bisect.insort.",
      challenge: {
        prompt: "Write insertion_sort(items, key=None, reverse=False). It returns a NEW sorted list; items can be any iterable and must not be modified. key works like the key of sorted() and must be called exactly once per item. With reverse=True the result is in descending order, but equal items must still keep their original relative order (this is not the same as reversing the ascending result). Use insertion sort: do not call sorted(), list.sort() or heapq. It must be adaptive: the checks sort an already sorted list and a nearly sorted list of 100,000 numbers, which would take minutes with O(n^2) work.",
        hint: "Build (key, item) pairs once so key runs once per item. For each position i, hold pairs[i] in current, shift every earlier pair that must come AFTER it one slot to the right, and drop current into the gap. \"Must come after\" is a strict comparison: key greater than current's for ascending order, key smaller for descending. Strict keeps equal items in their original order, and stopping at the first earlier pair that does not move is what makes sorted input O(n).",
        starter: py`
def insertion_sort(items, key=None, reverse=False):
    """Return a new list with items sorted stably by insertion sort."""
    # TODO: build (key, item) pairs once, then slide each pair left into its place.
    raise NotImplementedError
`,
        solution: py`
def insertion_sort(items, key=None, reverse=False):
    """Return a new list with items sorted stably by insertion sort (O(n + inversions))."""
    pairs = [(item if key is None else key(item), item) for item in items]

    def goes_before(a, b):
        """True when key a must be placed strictly before key b."""
        return b < a if reverse else a < b

    for i in range(1, len(pairs)):
        current = pairs[i]
        j = i
        # Strict comparison: an equal key stops the shifting, so ties keep their order.
        while j > 0 and goes_before(current[0], pairs[j - 1][0]):
            pairs[j] = pairs[j - 1]
            j -= 1
        pairs[j] = current
    return [item for _, item in pairs]
`,
        tests: py`
@check("sorts numbers and strings, including empty and single inputs")
def _():
    eq(insertion_sort([5, 2, 9, 1, 5, 6]), [1, 2, 5, 5, 6, 9])
    eq(insertion_sort(["pear", "fig", "apple"]), ["apple", "fig", "pear"])
    eq(insertion_sort([]), [])
    eq(insertion_sort([7]), [7])
    eq(insertion_sort(iter([3, 1, 2])), [1, 2, 3])
    eq(insertion_sort("dcba"), ["a", "b", "c", "d"])

@check("returns a new list and leaves the input untouched")
def _():
    data = [3, 1, 2]
    result = insertion_sort(data)
    eq(data, [3, 1, 2])
    eq(result is data, False)
    already = [1, 2, 3]
    eq(insertion_sort(already) is already, False)

@check("is stable: equal keys keep their original order")
def _():
    people = [("Ann", 30), ("Bo", 25), ("Cy", 30), ("Di", 25), ("Ed", 30)]
    eq(insertion_sort(people, key=lambda p: p[1]),
       [("Bo", 25), ("Di", 25), ("Ann", 30), ("Cy", 30), ("Ed", 30)])
    eq(insertion_sort(["bb", "a", "cc", "d", "ee"], key=len), ["a", "d", "bb", "cc", "ee"])

@check("reverse=True is descending and still keeps equal items in original order")
def _():
    people = [("Ann", 30), ("Bo", 25), ("Cy", 30), ("Di", 25)]
    eq(insertion_sort(people, key=lambda p: p[1], reverse=True),
       [("Ann", 30), ("Cy", 30), ("Bo", 25), ("Di", 25)])
    eq(insertion_sort([2, 3, 1, 3], reverse=True), [3, 3, 2, 1])
    words = ["bb", "a", "cc", "d", "ee", "f"]
    eq(insertion_sort(words, key=len, reverse=True), sorted(words, key=len, reverse=True))

@check("calls key exactly once per item")
def _():
    calls = []
    def key(x):
        calls.append(x)
        return -x
    eq(insertion_sort([4, 1, 3, 2], key=key), [4, 3, 2, 1])
    eq(sorted(calls), [1, 2, 3, 4])

@check("sorted and nearly sorted lists of 100,000 items are fast (adaptive)")
def _():
    n = 100_000
    ordered = list(range(n))
    eq(insertion_sort(ordered) == ordered, True)
    nearly = list(range(n))
    for i in range(0, n - 1, 1000):
        nearly[i], nearly[i + 1] = nearly[i + 1], nearly[i]
    eq(insertion_sort(nearly) == ordered, True)
`
      },
      practice: ["Sorting"],
      source: "https://en.wikipedia.org/wiki/Insertion_sort"
    },
    {
      id: "merge-sort",
      title: "Merge sort",
      kind: "algorithm",
      summary: "Split the list in half, sort each half, and merge the two sorted halves with one sweep. It is a stable O(n log n) sort with no bad inputs, and counting during the merge answers \"how many pairs are out of order\" in the same time.",
      concepts: [
        "Merge sort is divide and conquer. Split the list in half, sort each half recursively, then merge: because both halves are sorted, one left-to-right sweep that repeatedly takes the smaller front item builds the sorted whole in O(n). There are about log2(n) levels of halving and each level does O(n) merging work, so the total is O(n log n) for every input, sorted or not.",
        "Stability comes from the tie rule. When the two front items are equal, take the one from the left half, because it came first in the input. The price is memory: the merge writes into a separate list, so the sort needs O(n) extra space. Merging in place is possible but complicated and rarely worth it.",
        "The top-down version recurses, but only log2(n) deep (about 20 frames for a million items), so Python's limit of 1000 frames is no problem. The bottom-up version has no recursion at all: merge neighbouring blocks of width 1, then 2, then 4, and so on until one block remains. It does the same merges in a different order.",
        "Merging can count inversions, the pairs that are in the wrong order. When an item from the right half is taken while k items are still waiting in the left half, it jumps over exactly those k items, which is k inversions. Summing over all merges counts every inversion in O(n log n) instead of checking all n(n-1)/2 pairs."
      ],
      complexity: [
        { operation: "merge two sorted lists of sizes n and m", time: "O(n + m)" },
        { operation: "merge_sort (top-down or bottom-up)", time: "O(n log n) best, average and worst", note: "stable" },
        { operation: "count_inversions", time: "O(n log n)", note: "brute force over all pairs is O(n^2)" },
        { operation: "heapq.merge of k sorted streams (N items in total)", time: "O(N log k)", note: "lazy: it yields items as they are requested" }
      ],
      space: "O(n) for the merged lists, plus O(log n) stack frames for the top-down recursion (the bottom-up version needs no stack).",
      code: py`
from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from heapq import merge as heap_merge
from typing import TypeVar

T = TypeVar("T")


def merge(left: Sequence[T], right: Sequence[T]) -> tuple[list[T], int]:
    """Merge two sorted sequences in O(len(left) + len(right)).

    Returns (merged, crossings). Ties take the LEFT item first, which makes merge sort
    stable. crossings counts the pairs (a in left, b in right) with b < a: exactly the
    inversions this merge repairs.
    """
    merged: list[T] = []
    crossings = 0
    i = j = 0
    # Invariant: merged holds the i + j smallest items of both inputs, in order.
    while i < len(left) and j < len(right):
        if right[j] < left[i]:  # strictly smaller, so ties stay on the left
            merged.append(right[j])
            crossings += len(left) - i  # right[j] jumps over every left item still waiting
            j += 1
        else:
            merged.append(left[i])
            i += 1
    merged.extend(left[i:])  # one side is used up; the other tail is already sorted
    merged.extend(right[j:])
    return merged, crossings


def sort_and_count(items: Iterable[T]) -> tuple[list[T], int]:
    """Top-down merge sort. Returns (sorted copy, number of inversions) in O(n log n).

    An inversion is a pair i < j with items[i] > items[j]. Recursion depth is
    about log2(n), far below Python's limit of 1000.
    """
    data = list(items)
    if len(data) <= 1:
        return data, 0
    middle = len(data) // 2
    left, inside_left = sort_and_count(data[:middle])
    right, inside_right = sort_and_count(data[middle:])
    merged, crossings = merge(left, right)
    return merged, inside_left + inside_right + crossings


def merge_sort(items: Iterable[T]) -> list[T]:
    """Return a new, stably sorted list in O(n log n) time and O(n) extra space."""
    return sort_and_count(items)[0]


def count_inversions(items: Iterable[T]) -> int:
    """Return the number of pairs i < j with items[i] > items[j], in O(n log n)."""
    return sort_and_count(items)[1]


def merge_sort_bottom_up(items: Iterable[T]) -> list[T]:
    """Same result without recursion: merge runs of width 1, 2, 4, ... until one run is left."""
    data = list(items)
    width = 1
    while width < len(data):
        # Invariant: every block data[k:k + width] with k a multiple of width is sorted.
        merged: list[T] = []
        for start in range(0, len(data), 2 * width):
            merged.extend(merge(data[start:start + width], data[start + width:start + 2 * width])[0])
        data = merged
        width *= 2
    return data


@dataclass(frozen=True, slots=True)
class Card:
    """A playing card that sorts by rank only, so equal ranks reveal whether a sort is stable."""

    rank: int
    suit: str

    def __lt__(self, other: Card) -> bool:  # sorting uses only the rank
        return self.rank < other.rank

    def __str__(self) -> str:
        return f"{self.rank}{self.suit}"


if __name__ == "__main__":
    a, b = [1, 4, 9], [2, 4, 10]
    print(merge(a, b), merge([], [7]), list(heap_merge(a, b)) == merge(a, b)[0])

    nums = [5, 2, 4, 6, 1, 3]
    print(merge_sort(nums), merge_sort_bottom_up(nums), nums)
    print(count_inversions(nums), count_inversions(sorted(nums)), count_inversions(sorted(nums, reverse=True)))

    cards = [Card(3, "H"), Card(1, "S"), Card(3, "C"), Card(1, "D")]
    print(" ".join(map(str, merge_sort(cards))), "|", " ".join(map(str, merge_sort_bottom_up(cards))))

    print(count_inversions(range(20_000, 0, -1)), merge_sort([]), merge_sort("merge"))
    try:
        merge_sort([3, "a", 1])
    except TypeError as error:
        print("error:", error)
`,
      output: `([1, 2, 4, 4, 9, 10], 3) ([7], 0) True
[1, 2, 3, 4, 5, 6] [1, 2, 3, 4, 5, 6] [5, 2, 4, 6, 1, 3]
9 0 15
1S 1D 3H 3C | 1S 1D 3H 3C
199990000 [] ['e', 'e', 'g', 'm', 'r']
error: '<' not supported between instances of 'int' and 'str'`,
      bestPractices: [
        "Make merge its own small function with the invariant in its docstring (\"merged holds the i + j smallest items\"). You can test it alone, reuse it for the top-down sort, the bottom-up sort and inversion counting, and see the O(n) bound by eye.",
        "Decide ties with a strict `right[j] < left[i]`, so equal items are taken from the left and the sort is stable. Taking from the right on a tie would reverse equal items, and would count equal pairs as inversions even though they are not.",
        "Accept any Iterable[T], copy it with list(items), and return a new list. The input is never mutated, and because only `<` is used, any class that defines __lt__ (like Card, which compares ranks only) can be sorted.",
        "Count inversions in the same loop that merges, by returning a (merged, crossings) pair, instead of writing a second merge. One piece of code means one place for bugs, and the extra cost is a single addition per right-side item.",
        "Flush the leftover tail with merged.extend(left[i:]) rather than a Python loop: slicing and extend run in C. Recursion depth is log2(n), safe under the 1000-frame limit even for millions of items, and the bottom-up version avoids recursion altogether."
      ],
      pitfalls: [
        "Forgetting the tail. When the while loop ends, one side may still hold items; without the two extend calls the largest items silently disappear from the result.",
        "Counting inversions with two nested loops. That is O(n^2): 100,000 items mean about 5 billion pairs. Count while merging instead.",
        "Claiming merge sort needs O(1) space, or sorts in place. The straightforward version uses an O(n) buffer, and its slices copy data at every level. Say so when an interviewer asks about space.",
        "Splitting unevenly. Halving keeps the recursion about log2(n) deep, but a version that peels off one item per call recurses n deep and raises RecursionError at roughly 1000 items. Always split at the middle."
      ],
      useWhen: [
        "You need a stable sort with a guaranteed O(n log n) worst case, or you are sorting a linked list, where merging needs no random access.",
        "A question asks for pairs that are out of order (inversions, reverse pairs, smaller elements to the right): count them while merging.",
        "The data does not fit in memory: sort chunks separately, then merge the sorted chunks lazily (external sorting).",
        "You must combine several already-sorted sources, such as sorted log files or the k lists of a \"merge k sorted lists\" problem."
      ],
      inPractice: "sorted() and list.sort() already are a merge-sort hybrid (Timsort) that is stable and exploits existing order, so use them to sort. Use heapq.merge(*sorted_iterables), which also accepts key= and reverse=, to merge sorted inputs lazily without building a list. Write merge sort yourself when you need to count something during the merge, or to sort a linked list.",
      challenge: {
        prompt: "Write count_reverse_pairs(nums). nums is a list of integers (negative values allowed). Return the number of pairs (i, j) with i < j and nums[i] > 2 * nums[j]. Do not modify nums. It must run in O(n log n): the checks use a list of 100,000 numbers, where comparing every pair (about 5 billion pairs) would take many minutes. For example, [1, 3, 2, 3, 1] has 2 such pairs and [2, 4, 3, 5, 1] has 3.",
        hint: "Use merge sort and count the crossing pairs after both halves are sorted, but BEFORE merging them, because the condition nums[i] > 2 * nums[j] does not line up with the merge order. Walk through the left half in ascending order with a pointer j into the right half that only moves forward: while left value > 2 * right[j], advance j. Every left value then forms j pairs. Add j to the count, then merge as usual (sorted(left + right) is also fine here, since Timsort merges two sorted runs in linear time).",
        starter: py`
def count_reverse_pairs(nums):
    """Count pairs i < j with nums[i] > 2 * nums[j] in O(n log n)."""
    # TODO: merge sort; count crossing pairs with a forward-only pointer before each merge.
    raise NotImplementedError
`,
        solution: py`
def count_reverse_pairs(nums):
    """Count pairs i < j with nums[i] > 2 * nums[j] using merge sort, in O(n log n)."""

    def sort_and_count(a):
        if len(a) <= 1:
            return a, 0
        middle = len(a) // 2
        left, count_left = sort_and_count(a[:middle])
        right, count_right = sort_and_count(a[middle:])
        count = count_left + count_right
        # Count crossing pairs first. left ascends, so every right item that is small
        # enough for one left value is also small enough for the next: j never moves back.
        j = 0
        for value in left:
            while j < len(right) and value > 2 * right[j]:
                j += 1
            count += j
        # Then merge as usual.
        merged = []
        i = j = 0
        while i < len(left) and j < len(right):
            if right[j] < left[i]:
                merged.append(right[j])
                j += 1
            else:
                merged.append(left[i])
                i += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged, count

    return sort_and_count(list(nums))[1]
`,
        tests: py`
def brute(nums):
    return sum(1 for i in range(len(nums)) for j in range(i + 1, len(nums)) if nums[i] > 2 * nums[j])

@check("matches the examples")
def _():
    eq(count_reverse_pairs([1, 3, 2, 3, 1]), 2)
    eq(count_reverse_pairs([2, 4, 3, 5, 1]), 3)
    eq(count_reverse_pairs([5, 4, 3, 2, 1]), 4)

@check("handles empty, single and equal items")
def _():
    eq(count_reverse_pairs([]), 0)
    eq(count_reverse_pairs([5]), 0)
    eq(count_reverse_pairs([5, 5, 5]), 0)
    eq(count_reverse_pairs([0, 0, 0]), 0)
    eq(count_reverse_pairs([1, 2, 3, 4]), 0)

@check("works with negative numbers (-1 > 2 * -1)")
def _():
    eq(count_reverse_pairs([-1, -1, -1]), 3)
    eq(count_reverse_pairs([-5, -2]), 0)
    eq(count_reverse_pairs([-2, -5]), 1)
    eq(count_reverse_pairs([3, -1]), 1)

@check("agrees with a brute-force count on 200 pseudo-random lists")
def _():
    seed = 2024
    for _ in range(200):
        seed = (seed * 1103515245 + 12345) % 2147483648
        size = (seed >> 8) % 14
        nums = []
        for _ in range(size):
            seed = (seed * 1103515245 + 12345) % 2147483648
            nums.append((seed >> 8) % 41 - 20)
        eq(count_reverse_pairs(nums), brute(nums), "wrong answer for " + repr(nums))

@check("does not modify the input list")
def _():
    nums = [4, 1, 3, 9, 2]
    count_reverse_pairs(nums)
    eq(nums, [4, 1, 3, 9, 2])

@check("100,000 numbers are counted in O(n log n)")
def _():
    n = 100_000
    nums = list(range(n, 0, -1))
    expected = sum(max(0, 2 * j - n) for j in range(n))
    eq(count_reverse_pairs(nums), expected)
`
      },
      practice: ["Sorting"],
      source: "https://docs.python.org/3/library/heapq.html#heapq.merge"
    },
    {
      id: "quick-sort",
      title: "Quicksort & quickselect",
      kind: "algorithm",
      summary: "Partition the list around a pivot, then recurse on each side. Quicksort sorts in place in O(n log n) on average, and keeping only the side that holds position k turns it into quickselect, which finds the k-th smallest item in expected O(n).",
      concepts: [
        "Quicksort chooses a pivot and partitions the list so that smaller items end up on its left and larger ones on its right. The pivot's side blocks are then sorted independently. The work happens before the recursion, so no merge and no buffer are needed: it sorts in place. It is O(n log n) on average but O(n^2) when the pivots split badly, and it is not stable, because swaps move items long distances.",
        "There are three common partition schemes. Lomuto walks once from left to right and moves smaller items into a growing prefix: simple, but every item equal to the pivot lands on one side. Hoare moves two pointers inwards from both ends and swaps pairs that are on the wrong side: about three times fewer swaps, and equal items spread over both sides. Three-way (the Dutch national flag) builds three regions, less than, equal to and greater than the pivot, and the equal block is finished at once, so a list of equal items is sorted in one pass.",
        "The pivot decides the speed. Always taking the first or last item gives O(n^2) time and n levels of recursion on sorted input. A random pivot makes a bad split unlikely for every input. Median-of-three (the median of the first, middle and last items) also fixes sorted input, but crafted inputs can still beat it. Seeding the generator with random.Random(seed) keeps each run repeatable.",
        "Recurse into the smaller side and loop on the larger one. Each recursive call then gets at most half of the items, so the stack never exceeds log2(n) frames, even when a split is terrible. Python does no tail-call elimination, so the loop has to be written by hand.",
        "Quickselect finds the k-th smallest item without sorting. Partition once, then continue with only the side that contains position k, or stop if k falls inside the block equal to the pivot. With a good pivot the sizes shrink geometrically, n + n/2 + n/4 + ..., so the expected cost is O(n) instead of O(n log n)."
      ],
      complexity: [
        { operation: "partition (any of the three schemes)", time: "O(n)", note: "one pass over a[lo:hi]" },
        { operation: "quicksort_in_place", time: "O(n log n) expected, O(n^2) worst case", note: "a random pivot makes the worst case very unlikely; not stable" },
        { operation: "quicksort on all-equal items", time: "O(n)", note: "the three-way partition finishes the equal block in one pass" },
        { operation: "quickselect", time: "O(n) expected, O(n^2) worst case", note: "one-sided recursion" }
      ],
      space: "O(1) extra apart from the stack: the smaller-side rule keeps it at O(log n) frames. quicksort() and quickselect() first copy the input, which costs O(n).",
      code: py`
from __future__ import annotations

import random
from collections.abc import Iterable
from typing import TypeVar

T = TypeVar("T")


def lomuto_partition(a: list[T], lo: int, hi: int) -> int:
    """Partition a[lo:hi] around its LAST item; return the pivot's final index (needs hi > lo).

    Invariant: a[lo:store] < pivot and a[store:i] >= pivot. Simple, but every item equal
    to the pivot lands on the right, so a list of equal items splits as badly as possible.
    """
    pivot = a[hi - 1]
    store = lo
    for i in range(lo, hi - 1):
        if a[i] < pivot:
            a[i], a[store] = a[store], a[i]
            store += 1
    a[store], a[hi - 1] = a[hi - 1], a[store]
    return store


def hoare_partition(a: list[T], lo: int, hi: int) -> int:
    """Partition a[lo:hi] around its middle value; return split with lo < split < hi (needs hi - lo >= 2).

    Afterwards a[lo:split] <= pivot <= a[split:hi]. Two pointers walk inwards and swap
    out-of-place pairs; they stop on equal items, so duplicates are spread over both sides.
    """
    pivot = a[(lo + hi - 1) // 2]
    i, j = lo - 1, hi
    while True:
        i += 1
        while a[i] < pivot:
            i += 1
        j -= 1
        while pivot < a[j]:
            j -= 1
        if i >= j:
            return j + 1
        a[i], a[j] = a[j], a[i]


def three_way_partition(a: list[T], lo: int, hi: int, pivot: T) -> tuple[int, int]:
    """Rearrange a[lo:hi] into  < pivot | == pivot | > pivot  and return (lt, gt).

    Invariant: a[lo:lt] < pivot, a[lt:i] == pivot, a[gt:hi] > pivot; a[i:gt] is unexamined.
    The block a[lt:gt] is already in its final place.
    """
    lt, i, gt = lo, lo, hi
    while i < gt:
        if a[i] < pivot:
            a[lt], a[i] = a[i], a[lt]
            lt += 1
            i += 1
        elif pivot < a[i]:
            gt -= 1
            a[i], a[gt] = a[gt], a[i]
        else:
            i += 1
    return lt, gt


def _random_pivot(a: list[T], lo: int, hi: int, rng: random.Random) -> T:
    """Pick a random item of a[lo:hi]. random() is the one method with a guaranteed sequence per seed."""
    return a[lo + int(rng.random() * (hi - lo))]


def _sort(a: list[T], lo: int, hi: int, rng: random.Random) -> None:
    while hi - lo > 1:
        lt, gt = three_way_partition(a, lo, hi, _random_pivot(a, lo, hi, rng))
        # a[lt:gt] is finished. Recurse into the SMALLER side and loop on the larger one,
        # so each recursive call gets at most half the items: depth <= log2(n).
        if lt - lo < hi - gt:
            _sort(a, lo, lt, rng)
            lo = gt
        else:
            _sort(a, gt, hi, rng)
            hi = lt


def quicksort_in_place(items: list[T], seed: int = 0) -> None:
    """Sort items in place. Expected O(n log n), not stable, never more than log2(n) frames deep."""
    _sort(items, 0, len(items), random.Random(seed))


def quicksort(items: Iterable[T], seed: int = 0) -> list[T]:
    """Return a new sorted list; the input is untouched."""
    data = list(items)
    quicksort_in_place(data, seed)
    return data


def quickselect(items: Iterable[T], k: int, seed: int = 0) -> T:
    """Return the k-th smallest item (k = 0 is the minimum) in expected O(n); input untouched.

    Partition like quicksort, then keep only the side that contains position k.
    Raises IndexError when k is outside 0 <= k < len(items), like sorted(items)[k].
    """
    data = list(items)
    if not 0 <= k < len(data):
        raise IndexError(f"k={k} is out of range for {len(data)} items")
    rng = random.Random(seed)
    lo, hi = 0, len(data)
    while True:  # Invariant: lo <= k < hi and the answer lies inside data[lo:hi]
        pivot = _random_pivot(data, lo, hi, rng)
        lt, gt = three_way_partition(data, lo, hi, pivot)
        if k < lt:
            hi = lt
        elif k >= gt:
            lo = gt
        else:
            return pivot  # position k falls inside the block of items equal to the pivot


if __name__ == "__main__":
    data = [7, 2, 9, 4, 7, 1, 8, 7, 3]
    work = data[:]
    print("lomuto", lomuto_partition(work, 0, len(work)), work)
    work = data[:]
    print("hoare ", hoare_partition(work, 0, len(work)), work)
    work = data[:]
    print("3-way ", three_way_partition(work, 0, len(work), 7), work)

    print(quicksort(data), data)
    print(quicksort([]), quicksort("quick"))
    print([quickselect(data, k) for k in (0, 4, 8)], sorted(data)[4])
    rng = random.Random(2024)
    shuffled = [int(rng.random() * 100) for _ in range(5000)]  # many duplicates
    flat, ordered = [3] * 5000, list(range(5000))  # both wreck a naive last-item pivot
    print([quicksort(case) == sorted(case) for case in (shuffled, flat, ordered)])
    try:
        quickselect(data, 9)
    except IndexError as error:
        print("error:", error)
`,
      output: `lomuto 2 [2, 1, 3, 4, 7, 7, 8, 7, 9]
hoare  5 [3, 2, 7, 4, 1, 7, 8, 9, 7]
3-way  (4, 7) [2, 3, 4, 1, 7, 7, 7, 8, 9]
[1, 2, 3, 4, 7, 7, 7, 8, 9] [7, 2, 9, 4, 7, 1, 8, 7, 3]
[] ['c', 'i', 'k', 'q', 'u']
[1, 7, 9] 7
[True, True, True]
error: k=9 is out of range for 9 items`,
      bestPractices: [
        "Recurse into the smaller partition and loop on the larger one (the if/else at the end of _sort). The stack then never exceeds log2(n) frames, even for adversarial input, which matters because CPython raises RecursionError at about 1000 frames.",
        "Seed the pivot generator: random.Random(seed) with only its .random() method, whose sequence Python guarantees for a given seed. Runs are repeatable and the demo output is exact, yet no fixed input can reliably force a bad pivot. Never touch the global random state.",
        "Pass the pivot's value and partition into three regions. Items equal to the pivot are finished immediately, so the duplicate-heavy lists that push a two-way Lomuto partition to O(n^2) cost only O(n).",
        "Work on one shared list with half-open bounds (lo, hi) instead of slicing. That is what makes the sort in place: no sublists are copied. Name the mutating function quicksort_in_place and give callers quicksort(), which copies first and returns a new list.",
        "Put the partition invariant in the docstring. For three_way_partition (a[lo:lt] < pivot, a[lt:i] == pivot, a[gt:hi] > pivot, a[i:gt] unexamined) the loop updates and the returned pair follow directly.",
        "Raise IndexError for an out-of-range k, as sorted(items)[k] would, rather than looping forever or returning None."
      ],
      pitfalls: [
        "A first-item or last-item pivot on sorted or reverse-sorted input peels off one item per partition: O(n^2) time and n levels of recursion. A naive version raises RecursionError on an already sorted list of a few thousand items.",
        "A two-way partition with many duplicates. Lomuto sends every item equal to the pivot to one side, so a list of equal items degrades to O(n^2). Use the three-way partition (or Hoare, which splits equal items evenly).",
        "Assuming quicksort is stable. It reorders equal items, so it cannot sort records by a second key while keeping the order from a first sort. Use sorted() or merge sort for that.",
        "Off-by-one errors with k. Here k = 0 is the smallest item, so the k-th largest of n items (counting from 1) is quickselect(items, n - k). Hoare's scheme has its own trap: it needs a middle pivot, not the last item, and the index it returns is the end of the left part, so recursing with the wrong bounds never terminates."
      ],
      useWhen: [
        "You need an in-place sort that uses no extra memory and does not need to be stable.",
        "A problem asks for the k-th smallest or largest item, the median, or the top k in any order: quickselect avoids sorting everything.",
        "The real task is partitioning: separate 0, 1 and 2 (Dutch national flag), move all zeros to the end, or split by a predicate, in O(n) time and O(1) space.",
        "The constraints allow O(n) expected time but a full sort would be O(n log n) over a very large input."
      ],
      inPractice: "Use sorted() or list.sort() to sort: Timsort is stable, adaptive, and runs its comparisons in C, so it beats a Python-level quicksort. For the k largest or smallest items use heapq.nlargest or heapq.nsmallest (O(n log k)). Write quickselect when you need the k-th item or the median of a large list in expected O(n); NumPy's np.partition is a C implementation of the same idea.",
      challenge: {
        prompt: "Write kth_largest(nums, k). nums is a list of integers and k counts from 1, so k = 1 is the maximum. Return the k-th largest value, counting duplicates separately: in [5, 5, 4] the 2nd largest is 5 and the 3rd largest is 4. Raise ValueError when k is not between 1 and len(nums) (including when nums is empty). Do not modify nums. Aim for expected O(n) time with a random pivot and a three-way partition: the checks include already sorted, reverse sorted and all-equal lists of 100,000 items, which make a naive first-item or last-item pivot quadratic.",
        hint: "Convert to a position in ascending order: target = len(nums) - k. Copy the list, then repeat: pick a random pivot value from data[lo:hi], run a three-way partition into < pivot, == pivot and > pivot, and compare target with the block boundaries lt and gt. If target < lt keep the left part, if target >= gt keep the right part, otherwise the pivot is the answer. Use random.Random(some_int).random() to pick the pivot index.",
        starter: py`
def kth_largest(nums, k):
    """Return the k-th largest value of nums (k = 1 is the maximum)."""
    # TODO: validate k, copy nums, then quickselect for position len(nums) - k.
    raise NotImplementedError
`,
        solution: py`
import random


def kth_largest(nums, k):
    """Return the k-th largest value (k = 1 is the maximum); duplicates count separately."""
    if not 1 <= k <= len(nums):
        raise ValueError(f"k must be between 1 and {len(nums)}, got {k}")
    data = list(nums)
    rng = random.Random(7)
    target = len(data) - k  # where the answer sits in ascending order
    lo, hi = 0, len(data)
    while True:
        pivot = data[lo + int(rng.random() * (hi - lo))]
        # data[lo:lt] < pivot, data[lt:i] == pivot, data[gt:hi] > pivot, data[i:gt] unexamined
        lt, i, gt = lo, lo, hi
        while i < gt:
            if data[i] < pivot:
                data[lt], data[i] = data[i], data[lt]
                lt += 1
                i += 1
            elif data[i] > pivot:
                gt -= 1
                data[i], data[gt] = data[gt], data[i]
            else:
                i += 1
        if target < lt:
            hi = lt
        elif target >= gt:
            lo = gt
        else:
            return pivot
`,
        tests: py`
@check("finds the k-th largest in the examples, including k = 1 and k = n")
def _():
    eq(kth_largest([3, 2, 1, 5, 6, 4], 2), 5)
    eq(kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4), 4)
    eq(kth_largest([3, 2, 1, 5, 6, 4], 1), 6)
    eq(kth_largest([3, 2, 1, 5, 6, 4], 6), 1)
    eq(kth_largest([-4], 1), -4)

@check("counts duplicates separately")
def _():
    eq(kth_largest([5, 5, 4], 1), 5)
    eq(kth_largest([5, 5, 4], 2), 5)
    eq(kth_largest([5, 5, 4], 3), 4)
    eq(kth_largest([7, 7, 7, 7], 3), 7)

@check("raises ValueError when k is out of range")
def _():
    raises(ValueError, kth_largest, [1, 2, 3], 0)
    raises(ValueError, kth_largest, [1, 2, 3], 4)
    raises(ValueError, kth_largest, [1, 2, 3], -1)
    raises(ValueError, kth_largest, [], 1)

@check("does not modify the input list")
def _():
    nums = [9, 1, 8, 2, 7, 3]
    kth_largest(nums, 3)
    eq(nums, [9, 1, 8, 2, 7, 3])

@check("agrees with sorting on 200 pseudo-random lists with many duplicates")
def _():
    seed = 31
    for _ in range(200):
        seed = (seed * 1103515245 + 12345) % 2147483648
        size = 1 + (seed >> 8) % 30
        nums = []
        for _ in range(size):
            seed = (seed * 1103515245 + 12345) % 2147483648
            nums.append((seed >> 8) % 15 - 7)
        ranked = sorted(nums, reverse=True)
        for k in range(1, size + 1):
            eq(kth_largest(nums, k), ranked[k - 1], "wrong answer for k=%d on %r" % (k, nums))

@check("sorted, reverse sorted, all-equal and random lists of 100,000 items are fast")
def _():
    n = 100_000
    ascending = list(range(n))
    for k in (1, n // 2, n):
        eq(kth_largest(ascending, k), n - k)
        eq(kth_largest(ascending[::-1], k), n - k)
    eq(kth_largest([4] * n, n // 3), 4)
    seed = 99
    scrambled = []
    for _ in range(n):
        seed = (seed * 1103515245 + 12345) % 2147483648
        scrambled.append((seed >> 8) % 1_000_000)
    eq(kth_largest(scrambled, 25_000), sorted(scrambled)[-25_000])
`
      },
      practice: ["Sorting", "Heaps & Priority Queues"],
      source: "https://en.wikipedia.org/wiki/Quickselect"
    },
    {
      id: "non-comparison-sorts",
      title: "Heap sort, counting sort & radix sort",
      kind: "algorithm",
      summary: "Heap sort is the in-place sort with a worst-case O(n log n) guarantee. Counting and radix sort beat the O(n log n) limit of comparison sorting by using the keys themselves, and Python's own sorted() is a stable, adaptive merge-sort hybrid.",
      concepts: [
        "Heap sort stores a max-heap inside the list itself (the children of index i are 2i + 1 and 2i + 2), so there are no node objects. It builds the heap in O(n), then repeatedly swaps the maximum at the root with the last heap item, shrinks the heap by one and sifts the new root down. It is O(n log n) in every case and needs O(1) extra space, but it is not stable and jumps around memory, which is why quicksort and Timsort usually beat it.",
        "Any sort that only compares items needs at least log2(n!) comparisons in the worst case, which is about n log2 n. The reason: it must tell apart all n! possible orderings, and each comparison has only two outcomes. Merge sort and heap sort are therefore optimal among comparison sorts. To go faster you must use more than comparisons, for example the fact that the keys are small integers.",
        "Counting sort sorts items by an integer key in range(k). Count how many items have each key, turn the counts into first-slot positions with prefix sums, then place each item, left to right, into the next free slot of its key. That is O(n + k) time, and it is stable, which is exactly what radix sort needs. It only pays off when k is not much larger than n.",
        "LSD (least significant digit) radix sort sorts by the last digit first, then the next one, up to the most significant digit, using a stable counting sort for every pass. After each pass the list is sorted by the digits seen so far, because ties on the new digit keep the order from the previous passes. With d digits it costs O(d * (n + base)). Bucket sort is the related idea of scattering evenly spread values into buckets, sorting each small bucket and concatenating them.",
        "Python's sorted() and list.sort() use Timsort: a stable merge sort that finds runs that are already ascending (or strictly descending, which it reverses), extends short runs with insertion sort, and merges them. Sorted input costs O(n); the worst case is O(n log n). key= is called once per item, reverse=True keeps equal items in their original order, and functools.cmp_to_key adapts an old-style comparison function."
      ],
      complexity: [
        { operation: "heap_sort_in_place", time: "O(n log n) worst case", note: "building the heap is O(n); not stable" },
        { operation: "counting_sort", time: "O(n + k)", note: "k = size of the key range; stable" },
        { operation: "radix_sort", time: "O(d * (n + base))", note: "d = number of digits of the largest value" },
        { operation: "sorted() / list.sort()", time: "O(n log n) worst case, O(n) on sorted input", note: "stable; O(n) extra space" },
        { operation: "any comparison sort", time: "Omega(n log n) worst case", note: "the lower bound that counting and radix sort sidestep" }
      ],
      space: "Heap sort uses O(1) extra space. Counting sort uses O(n + k) for the counts and the output, and each radix pass uses O(n + base). Timsort needs up to O(n) temporary space while merging.",
      code: py`
from __future__ import annotations

from collections.abc import Callable, Iterable
from functools import cmp_to_key, partial
from itertools import accumulate
from typing import Any, TypeVar

T = TypeVar("T")


def _sift_down(a: list[T], root: int, size: int) -> None:
    """Restore the max-heap property below root when only a[root] may break it. O(log n)."""
    while (child := 2 * root + 1) < size:  # children of i are 2i + 1 and 2i + 2
        if child + 1 < size and a[child] < a[child + 1]:
            child += 1  # follow the larger child
        if not a[root] < a[child]:
            return
        a[root], a[child] = a[child], a[root]
        root = child


def heap_sort_in_place(a: list[T]) -> None:
    """Sort a in place in O(n log n) worst case with O(1) extra space. Not stable.

    Phase 1 builds a max-heap bottom-up in O(n). Phase 2 invariant: a[:end + 1] is a
    max-heap and a[end + 1:] holds the largest items in final order.
    """
    size = len(a)
    for root in range(size // 2 - 1, -1, -1):  # leaves are already one-item heaps
        _sift_down(a, root, size)
    for end in range(size - 1, 0, -1):
        a[0], a[end] = a[end], a[0]  # the maximum goes to its final slot
        _sift_down(a, 0, end)


def counting_sort(items: Iterable[T], key: Callable[[T], int], key_range: int) -> list[T]:
    """Stable sort by an integer key in range(key_range), in O(n + key_range) time.

    Count the items per key, turn the counts into first-slot positions with prefix sums,
    then drop each item (left to right) into the next free slot of its key.
    """
    data = list(items)
    keys = [key(item) for item in data]  # key() runs once per item
    counts = [0] * key_range
    for k in keys:
        if not 0 <= k < key_range:  # a negative key would silently index from the end
            raise ValueError(f"key {k} is outside range({key_range})")
        counts[k] += 1
    slots = list(accumulate(counts, initial=0))  # slots[k] = items with a smaller key
    result: list[Any] = [None] * len(data)
    for item, k in zip(data, keys):
        result[slots[k]] = item
        slots[k] += 1
    return result


def _digit(number: int, place: int, base: int) -> int:
    return number // place % base


def radix_sort(numbers: Iterable[int], base: int = 10) -> list[int]:
    """LSD radix sort of non-negative ints in O(d * (n + base)) for d digits."""
    data = list(numbers)
    if base < 2 or any(n < 0 for n in data):
        raise ValueError("radix_sort needs base >= 2 and non-negative integers")
    place, biggest = 1, max(data, default=0)
    while place <= biggest:
        # Invariant: data is sorted by its lowest digits (those below place). Each pass
        # is a STABLE counting sort on the next digit, so ties keep the order from before.
        data = counting_sort(data, partial(_digit, place=place, base=base), base)
        place *= base
    return data


def largest_number(numbers: Iterable[int]) -> str:
    """Arrange the numbers so their digits, joined, form the biggest number: [3, 30] -> '330'."""

    def compare(a: str, b: str) -> int:  # negative: a goes first
        return (a + b < b + a) - (a + b > b + a)

    ordered = sorted(map(str, numbers), key=cmp_to_key(compare))
    return "".join(ordered).lstrip("0") or "0"


if __name__ == "__main__":
    values = [5, 2, 9, 1, 5, 6, 3]
    in_place = values[:]
    heap_sort_in_place(in_place)
    empty: list[int] = []
    heap_sort_in_place(empty)
    print(in_place, values, empty)

    pupils = [("Ann", 3), ("Bo", 1), ("Cy", 3), ("Di", 1)]
    print(counting_sort(pupils, key=lambda p: p[1], key_range=4))

    scores = [170, 45, 75, 90, 802, 24, 2, 66]
    print(radix_sort(scores), radix_sort(scores, base=256) == sorted(scores), radix_sort([]))
    for call in (lambda: counting_sort([1, 9], key=int, key_range=5), lambda: radix_sort([3, -1])):
        try:
            call()
        except ValueError as error:
            print("error:", error)

    words = ["bb", "a", "cc", "d"]
    print(sorted(words, key=len), sorted(words, key=len, reverse=True))
    print(largest_number([3, 30, 34, 5, 9]), largest_number([0, 0]))
`,
      output: `[1, 2, 3, 5, 5, 6, 9] [5, 2, 9, 1, 5, 6, 3] []
[('Bo', 1), ('Di', 1), ('Ann', 3), ('Cy', 3)]
[2, 24, 45, 66, 75, 90, 170, 802] True []
error: key 9 is outside range(5)
error: radix_sort needs base >= 2 and non-negative integers
['a', 'd', 'bb', 'cc'] ['bb', 'cc', 'a', 'd']
9534330 0`,
      bestPractices: [
        "Give the sift-down helper a size parameter instead of slicing or popping. The sorted tail then stays in the same list while the heap shrinks, which is what makes heap_sort_in_place sort in place. Name it _in_place, and have it return None like list.sort().",
        "Compute prefix sums with itertools.accumulate(counts, initial=0). slots[k] is then the first output position of key k, and the intent is clearer than a hand-written running total.",
        "Validate keys in counting_sort and raise ValueError for a key outside range(key_range). A negative key would otherwise silently index from the end of the counts list and corrupt the result without any error.",
        "Build radix_sort out of counting_sort: every pass is a stable sort on one digit. functools.partial(_digit, place=place, base=base) binds the current digit position without a lambda that captures a loop variable.",
        "Prefer key= over cmp_to_key. A key function runs once per item and compares in C; cmp_to_key is for orders that cannot be written as a key, like largest_number, where a comes first if a + b > b + a as strings.",
        "Use sorted(..., reverse=True) rather than reversing the result: it keeps equal items in their original order, as the words example shows (bb before cc)."
      ],
      pitfalls: [
        "Counting sort over a huge key range. Sorting ten numbers below 10**9 would allocate a billion counters. It only pays when the key range is about n or smaller.",
        "Radix sort with negative numbers, floats or an unstable digit pass. This version rejects negatives; they need an offset or a sign split, and every pass must be stable or the earlier digits are scrambled.",
        "Assuming a linear-time sort is always faster. In CPython the loops of counting and radix sort run in Python bytecode while sorted() runs in C, so sorted() usually wins until the lists are very large or the keys are tiny.",
        "Writing a cmp_to_key comparison that returns True or False (the Python 2 habit). It must return a negative number, zero or a positive number, and must be consistent: cmp(a, b) has the opposite sign of cmp(b, a), and the order must be transitive."
      ],
      useWhen: [
        "The keys are small integers or characters (ages, grades, scores from 0 to 100, letters): counting sort runs in O(n + k).",
        "You must sort many fixed-width integers or strings and want linear passes: radix sort.",
        "You must sort in place with a worst-case O(n log n) guarantee and O(1) extra space, with no library: heap sort.",
        "A question says \"sort in linear time\", \"sort colors\", \"maximum gap\", or asks you to sort by frequency."
      ],
      inPractice: "Call sorted(items, key=...) or items.sort(key=...). Timsort is stable, adaptive and implemented in C, so it is the right default; add reverse=True for descending order and use functools.cmp_to_key only to adapt an existing comparison function. For the k smallest or largest items use heapq.nsmallest and heapq.nlargest. Hand-write counting sort when keys are small integers and you also need the counts or positions, and radix sort for very large collections of fixed-width keys.",
      challenge: {
        prompt: "Write radix_sort(nums). nums is a list of integers that may include negative numbers, zero and values far larger than 64 bits. Return a NEW list in ascending order and do not modify nums. Implement it as an LSD radix sort (stable passes over digits or bytes, least significant first) and do not call sorted() or list.sort(). For example radix_sort([3, -1, 0, -10, 7, -1]) is [-10, -1, -1, 0, 3, 7]. The checks sort 100,000 numbers, so each pass must be linear in the list size.",
        hint: "Negative numbers are the only difficulty. Subtract min(nums) from every value so all of them are non-negative, radix sort those, then add min(nums) back. Sort by digits with a stable pass: loop while (biggest >> shift) > 0, distribute the numbers into 256 lists by (n >> shift) & 255, join the lists in order, and add 8 to shift. Remember the empty list.",
        starter: py`
def radix_sort(nums):
    """Return a new ascending list of the integers in nums using LSD radix sort."""
    # TODO: shift the values so they are all >= 0, sort by digits with stable passes, shift back.
    raise NotImplementedError
`,
        solution: py`
def radix_sort(nums):
    """Return a new ascending list of the integers in nums using LSD radix sort."""
    data = list(nums)
    if not data:
        return []
    low = min(data)
    shifted = [n - low for n in data]  # every value is now >= 0 and the order is unchanged
    biggest = max(shifted)
    shift = 0
    while biggest >> shift:
        # One stable pass on the next byte: distribute into 256 buckets, then concatenate.
        buckets = [[] for _ in range(256)]
        for n in shifted:
            buckets[(n >> shift) & 255].append(n)
        shifted = [n for bucket in buckets for n in bucket]
        shift += 8
    return [n + low for n in shifted]
`,
        tests: py`
@check("sorts non-negative numbers, including duplicates")
def _():
    eq(radix_sort([170, 45, 75, 90, 802, 24, 2, 66, 45]), [2, 24, 45, 45, 66, 75, 90, 170, 802])
    eq(radix_sort([5, 3, 5, 1, 3]), [1, 3, 3, 5, 5])

@check("sorts negative numbers, zero and mixed signs")
def _():
    eq(radix_sort([3, -1, 0, -10, 7, -1]), [-10, -1, -1, 0, 3, 7])
    eq(radix_sort([-3, -30, -300]), [-300, -30, -3])
    eq(radix_sort([-5, 5, -5, 5, 0]), [-5, -5, 0, 5, 5])

@check("handles empty, single, equal, sorted and reversed lists")
def _():
    eq(radix_sort([]), [])
    eq(radix_sort([7]), [7])
    eq(radix_sort([-7]), [-7])
    eq(radix_sort([4, 4, 4]), [4, 4, 4])
    eq(radix_sort(list(range(-5, 6))), list(range(-5, 6)))
    eq(radix_sort(list(range(5, -6, -1))), list(range(-5, 6)))

@check("returns a new list and leaves the input unchanged")
def _():
    data = [3, -2, 9, 0]
    result = radix_sort(data)
    eq(data, [3, -2, 9, 0])
    eq(result is data, False)
    ordered = [1, 2, 3]
    eq(radix_sort(ordered) is ordered, False)

@check("works for values far beyond 64 bits")
def _():
    big = [10**30, -10**30, 0, 5, 10**18, -7, 2**70, -(2**65)]
    eq(radix_sort(big), sorted(big))

@check("sorts 100,000 pseudo-random numbers correctly and quickly")
def _():
    seed = 5
    nums = []
    for _ in range(100_000):
        seed = (seed * 1103515245 + 12345) % 2147483648
        nums.append(seed - 1_000_000_000)
    eq(radix_sort(nums) == sorted(nums), True)
`
      },
      practice: ["Sorting", "Heaps & Priority Queues"],
      source: "https://docs.python.org/3/howto/sorting.html"
    }
  ],
};
