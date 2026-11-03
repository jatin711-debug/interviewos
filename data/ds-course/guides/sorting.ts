import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const SORTING_GUIDES: Record<string, DsGuide> = {
  "binary-search": {
    level: "Beginner",
    analogy: "Looking up a word in a paper dictionary. You don't start at page 1. You open it in the middle, see whether your word comes before or after, and throw away the half that can't contain it. A few halvings later, you're on the right page.",
    explain: [
      "**Binary search** finds a target in a **sorted** list by repeatedly checking the middle element. If the middle is too small, the target must be to the right, so discard the left half. If it's too big, discard the right half. Each check halves the search space, so a list of a million items needs only about **20** checks: **O(log n)**.",
      "We keep two indexes, `lo` and `hi`, that mark the part of the list that could still hold the target. The loop runs while `lo <= hi`. `mid = (lo + hi) // 2`. The **invariant** (the thing that's always true) is: if the target is in the list, it's somewhere in `items[lo..hi]`. When the range becomes empty (`lo > hi`), the target isn't there.",
      "A very common variant is **'find the first position where items[i] >= target'** (called lower bound, or `bisect_left` in Python). It tells you where the target is or where it would be inserted, and it handles duplicates. The loop shape is slightly different (`lo < hi`, `hi = mid`), so be careful copying it.",
      "Binary search also works on **answers**, not just lists. If you can ask 'is x big enough?' and the answer goes from 'no, no, no' to 'yes, yes, yes' as x grows, you can binary search for the first 'yes'. Examples: integer square root, minimum speed to finish on time, smallest capacity to ship packages in D days.",
      "Most bugs are off-by-one errors: `<` vs `<=`, `mid` vs `mid + 1`. Trace a 1- or 2-element list by hand to check your loop always shrinks and always ends.",
    ],
    simpleCode: py`
# Binary search: halve the range that could still hold the answer.
import bisect


def binary_search(items, target):
    """Return the index of target in sorted items, or -1."""
    lo, hi = 0, len(items) - 1
    while lo <= hi:                      # the target, if present, is in items[lo..hi]
        mid = (lo + hi) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            lo = mid + 1                 # the whole left half (and mid) is too small
        else:
            hi = mid - 1                 # the whole right half (and mid) is too big
    return -1


def first_at_least(items, target):
    """Index of the first item >= target (len(items) if none). Same as bisect.bisect_left."""
    lo, hi = 0, len(items)
    while lo < hi:
        mid = (lo + hi) // 2
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid                     # mid might be the answer: keep it
    return lo


def int_sqrt(n):
    """Largest x with x * x <= n: a binary search on the ANSWER, not on a list."""
    lo, hi = 0, n
    while lo < hi:
        mid = (lo + hi + 1) // 2         # round up so the range always shrinks
        if mid * mid <= n:
            lo = mid                     # mid works: the answer is mid or bigger
        else:
            hi = mid - 1                 # mid is too big
    return lo


scores = [3, 8, 15, 21, 30, 42, 57, 63]
print("binary_search(42) ->", binary_search(scores, 42))
print("binary_search(10) ->", binary_search(scores, 10))

grades = [10, 20, 20, 20, 30]
print("first index >= 20:", first_at_least(grades, 20), "| bisect_left:", bisect.bisect_left(grades, 20))
print("first index >= 25:", first_at_least(grades, 25), "(where 25 would be inserted)")
print("first index >= 99:", first_at_least(grades, 99), "(past the end)")

print("int_sqrt(50) =", int_sqrt(50), "| int_sqrt(64) =", int_sqrt(64))
`,
    simpleOutput: `binary_search(42) -> 5
binary_search(10) -> -1
first index >= 20: 1 | bisect_left: 1
first index >= 25: 4 (where 25 would be inserted)
first index >= 99: 5 (past the end)
int_sqrt(50) = 7 | int_sqrt(64) = 8`,
    codeNotes: [
      "`binary_search` keeps `lo..hi` as the range that could still contain the target. Each step moves `lo` past `mid` or `hi` before `mid`, so the range always shrinks and the loop always ends.",
      "Searching for 10 returns -1: the range shrinks to empty (`lo > hi`) without ever finding it.",
      "`first_at_least` searches for a position rather than a value. With duplicates (`20, 20, 20`) it returns the first one, which is exactly what `bisect.bisect_left` does.",
      "`int_sqrt` searches the numbers 0..n for the last x with `x * x <= n`. The `+ 1` in `mid` avoids an infinite loop when `lo` and `hi` are next to each other.",
    ],
    takeaways: [
      "Needs sorted data (or a yes/no test that flips once).",
      "Each step halves the range: O(log n).",
      "Know the invariant: what's always true about lo..hi.",
      "In Python use `bisect`; test by hand on 1- and 2-element lists.",
    ],
  },

  "elementary-sorts": {
    level: "Beginner",
    analogy: "Sorting a hand of playing cards. Most people pick up cards one at a time and slide each into its correct place among the cards already held. That's insertion sort. Selection sort is scanning the whole table for the smallest card and putting it first, then the next smallest, and so on. Bubble sort is repeatedly swapping neighbouring cards that are in the wrong order.",
    explain: [
      "These three simple sorts are all **O(n²)**. That's too slow for big data, but they're the best way to understand what sorting does, and they come up in interviews.",
      "**Bubble sort**: walk through the list comparing each pair of neighbours, and swap them if they're out of order. After one pass, the biggest value has 'bubbled' to the end. Repeat on the rest. If a pass makes no swaps, the list is sorted and we can stop early.",
      "**Selection sort**: find the smallest value in the unsorted part and swap it into the first unsorted position. The sorted part grows by one each pass. It always does about n²/2 comparisons, even on sorted input, but at most n swaps.",
      "**Insertion sort**: take each value in turn and slide it left past every bigger value, inserting it into the already-sorted part on its left. On **nearly sorted** data it barely moves anything, close to O(n). That's why real-world sorts (like Python's Timsort) use insertion sort for small pieces.",
      "A sort is **stable** if equal items keep their original order. Bubble and insertion sort are stable; selection sort (with swaps) is not. Stability matters when sorting records by one field after another.",
    ],
    simpleCode: py`
# Three simple O(n^2) sorts. Each returns a NEW sorted list and leaves the input alone.

def bubble_sort(values):
    items = list(values)
    for end in range(len(items) - 1, 0, -1):      # after each pass the max is at 'end'
        swapped = False
        for i in range(end):
            if items[i] > items[i + 1]:           # neighbours out of order: swap
                items[i], items[i + 1] = items[i + 1], items[i]
                swapped = True
        print("  bubble pass:   ", items)
        if not swapped:
            break                                 # no swaps: already sorted
    return items


def selection_sort(values):
    items = list(values)
    for start in range(len(items) - 1):
        smallest = start
        for i in range(start + 1, len(items)):    # find the smallest in the unsorted part
            if items[i] < items[smallest]:
                smallest = i
        items[start], items[smallest] = items[smallest], items[start]
        print("  selection pass:", items)
    return items


def insertion_sort(values):
    items = list(values)
    for i in range(1, len(items)):
        current = items[i]
        j = i - 1
        while j >= 0 and items[j] > current:      # shift bigger items one step right
            items[j + 1] = items[j]
            j -= 1
        items[j + 1] = current                    # drop current into the gap
        print("  insertion step:", items)
    return items


data = [5, 2, 4, 6, 1, 3]
print("start:", data)
bubble_sort(data)
selection_sort(data)
insertion_sort(data)
print("input unchanged:", data, "| built-in sorted():", sorted(data))
`,
    simpleOutput: `start: [5, 2, 4, 6, 1, 3]
  bubble pass:    [2, 4, 5, 1, 3, 6]
  bubble pass:    [2, 4, 1, 3, 5, 6]
  bubble pass:    [2, 1, 3, 4, 5, 6]
  bubble pass:    [1, 2, 3, 4, 5, 6]
  bubble pass:    [1, 2, 3, 4, 5, 6]
  selection pass: [1, 2, 4, 6, 5, 3]
  selection pass: [1, 2, 4, 6, 5, 3]
  selection pass: [1, 2, 3, 6, 5, 4]
  selection pass: [1, 2, 3, 4, 5, 6]
  selection pass: [1, 2, 3, 4, 5, 6]
  insertion step: [2, 5, 4, 6, 1, 3]
  insertion step: [2, 4, 5, 6, 1, 3]
  insertion step: [2, 4, 5, 6, 1, 3]
  insertion step: [1, 2, 4, 5, 6, 3]
  insertion step: [1, 2, 3, 4, 5, 6]
input unchanged: [5, 2, 4, 6, 1, 3] | built-in sorted(): [1, 2, 3, 4, 5, 6]`,
    codeNotes: [
      "Each function starts with `items = list(values)`, a copy, so the caller's list isn't changed. That's what the last line checks.",
      "**Bubble**: the inner loop swaps neighbours. Look at the output: after pass 1 the 6 is at the end, and after pass 2 the 5 is next to it. `swapped` lets it stop early.",
      "**Selection**: the inner loop only *finds* the smallest. There is one swap per pass, putting it at `start`.",
      "**Insertion**: `current` is lifted out, bigger items shift right one step, and `current` drops into the gap. The left part is always sorted.",
      "Real code: use `sorted()` or `list.sort()`. They use Timsort, which is O(n log n), stable, and very fast on partly sorted data.",
    ],
    takeaways: [
      "Bubble: swap neighbours; the biggest sinks to the end each pass.",
      "Selection: pick the smallest remaining; ≤ n swaps.",
      "Insertion: slide each item left into place; great on nearly sorted data.",
      "All O(n²). In practice use `sorted()` (Timsort, O(n log n)).",
    ],
  },

  "merge-sort": {
    level: "Intermediate",
    analogy: "Two friends each have a sorted pile of exam papers, and you want one sorted pile. Look at the top paper of each pile, take the smaller one, and repeat. That 'merge' is easy. Merge sort's idea: split the papers in half, sort each half the same way (splitting again and again until piles have one paper), then merge everything back together.",
    explain: [
      "**Merge sort** is a **divide-and-conquer** algorithm. **Divide**: split the list into two halves. **Conquer**: sort each half by calling merge sort on it (recursion). **Combine**: merge the two sorted halves into one sorted list.",
      "The base case is a list of 0 or 1 items, which is already sorted. So the recursion keeps splitting until every piece is tiny, and all the real work happens while merging on the way back up.",
      "**Merging** two sorted lists uses two pointers, one at the front of each list. Compare the two front items, copy the smaller one to the output and advance that pointer. When one list runs out, copy the rest of the other. That's O(n) for n total items.",
      "Why **O(n log n)**? Halving n down to 1 takes log₂ n levels, and at every level the merges handle all n items in total. So it's n work × log n levels. Unlike quicksort, that holds for **every** input: there's no bad case.",
      "Merge sort is **stable** (with `<=` when comparing, equal items keep their order) but needs **O(n) extra memory** for the merged lists. It's also the natural way to sort linked lists and huge files that don't fit in memory.",
    ],
    simpleCode: py`
# Merge sort: split in half, sort each half, merge the two sorted halves.

def merge(left, right):
    """Combine two sorted lists into one sorted list."""
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:          # <= keeps equal items in order (stable)
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])              # one side is used up: copy the other's rest
    result.extend(right[j:])
    return result


def merge_sort(items, depth=0):
    pad = "    " * depth
    if len(items) <= 1:                  # base case: 0 or 1 item is already sorted
        return items
    mid = len(items) // 2
    print(f"{pad}split {items} -> {items[:mid]} {items[mid:]}")
    left = merge_sort(items[:mid], depth + 1)
    right = merge_sort(items[mid:], depth + 1)
    merged = merge(left, right)
    print(f"{pad}merge {left} + {right} -> {merged}")
    return merged


print("merge([1, 4, 9], [2, 3, 10]) =", merge([1, 4, 9], [2, 3, 10]))
print("sorting [38, 27, 43, 3, 9, 82, 10]:")
result = merge_sort([38, 27, 43, 3, 9, 82, 10])
print("result:", result)
`,
    simpleOutput: `merge([1, 4, 9], [2, 3, 10]) = [1, 2, 3, 4, 9, 10]
sorting [38, 27, 43, 3, 9, 82, 10]:
split [38, 27, 43, 3, 9, 82, 10] -> [38, 27, 43] [3, 9, 82, 10]
    split [38, 27, 43] -> [38] [27, 43]
        split [27, 43] -> [27] [43]
        merge [27] + [43] -> [27, 43]
    merge [38] + [27, 43] -> [27, 38, 43]
    split [3, 9, 82, 10] -> [3, 9] [82, 10]
        split [3, 9] -> [3] [9]
        merge [3] + [9] -> [3, 9]
        split [82, 10] -> [82] [10]
        merge [82] + [10] -> [10, 82]
    merge [3, 9] + [10, 82] -> [3, 9, 10, 82]
merge [27, 38, 43] + [3, 9, 10, 82] -> [3, 9, 10, 27, 38, 43, 82]
result: [3, 9, 10, 27, 38, 43, 82]`,
    codeNotes: [
      "`merge` is the heart of the algorithm. It walks both lists with indexes `i` and `j`, always taking the smaller front item. When one list ends, the other's leftovers are already in order, so they're copied as-is.",
      "`merge_sort` stops at lists of length 0 or 1, splits everything bigger at `mid`, sorts both halves recursively, then merges them.",
      "The printout is indented by recursion depth, so you can see the splits going down and the merges coming back up. The tree of splits has about log₂ n levels.",
      "Slicing (`items[:mid]`) copies data. That's part of the O(n) extra memory merge sort uses.",
    ],
    takeaways: [
      "Divide in half, sort each half recursively, merge.",
      "Merge = two pointers, take the smaller front item: O(n).",
      "Always O(n log n): log n levels × n work per level.",
      "Stable, but uses O(n) extra memory.",
    ],
  },

  "quick-sort": {
    level: "Intermediate",
    analogy: "Organising a class by height. Pick one student as the 'pivot'. Everyone shorter stands to their left, and everyone taller to their right. The pivot is now exactly where they belong. Then do the same thing separately within the left group and the right group.",
    explain: [
      "**Quicksort** is also divide and conquer, but it does the hard work **before** recursing. Pick a **pivot** value, then **partition**: rearrange the list so everything smaller than the pivot is on its left and everything bigger is on its right. The pivot is now in its final sorted position. Recursively sort the left part and the right part. No merging is needed.",
      "**Partition (Lomuto scheme)**: use the last element as the pivot. Keep a boundary `store` (everything before it is < pivot). Scan with `i`, and whenever `items[i] < pivot`, swap it to `store` and move the boundary right. At the end, swap the pivot into `store`.",
      "On average the pivot splits the list roughly in half, giving **O(n log n)**. But if the pivot is always the smallest or largest value (for example, the last element of an already sorted list), one side is empty every time, giving **O(n²)**. Choosing a **random pivot** makes that extremely unlikely.",
      "Quicksort sorts **in place** (only O(log n) extra stack space on average) and is very fast in practice. It is **not stable**.",
      "**Quickselect** uses the same partition to find the **k-th smallest** value without fully sorting: after partitioning, recurse into only the side that contains position k. That's O(n) on average, and it's how to answer 'find the median' or 'k-th largest' quickly.",
    ],
    simpleCode: py`
# Quicksort (Lomuto partition) and quickselect, sorting in place.

def partition(items, lo, hi):
    """Use items[hi] as the pivot. Put smaller items left of it; return the pivot's final index."""
    pivot = items[hi]
    store = lo                                   # items[lo:store] are all < pivot
    for i in range(lo, hi):
        if items[i] < pivot:
            items[i], items[store] = items[store], items[i]
            store += 1
    items[store], items[hi] = items[hi], items[store]   # pivot goes right after the small ones
    return store


def quicksort(items, lo=0, hi=None):
    if hi is None:
        hi = len(items) - 1
    if lo >= hi:                                 # 0 or 1 item: nothing to do
        return
    p = partition(items, lo, hi)
    print(f"  pivot {items[p]} placed at index {p}: {items}")
    quicksort(items, lo, p - 1)                  # sort the smaller side
    quicksort(items, p + 1, hi)                  # sort the bigger side


def quickselect(items, k):
    """k-th smallest (k = 0 is the minimum), without sorting everything."""
    items = list(items)
    lo, hi = 0, len(items) - 1
    while True:
        p = partition(items, lo, hi)
        if p == k:
            return items[p]
        if k < p:
            hi = p - 1                           # the answer is on the left side only
        else:
            lo = p + 1                           # ...or on the right side only


data = [7, 2, 9, 4, 3, 8, 5]
print("quicksort", data)
quicksort(data)
print("sorted:", data)

values = [7, 2, 9, 4, 3, 8, 5]
print("median (k=3) of", values, "->", quickselect(values, 3))
print("smallest:", quickselect(values, 0), "| largest:", quickselect(values, len(values) - 1))
`,
    simpleOutput: `quicksort [7, 2, 9, 4, 3, 8, 5]
  pivot 5 placed at index 3: [2, 4, 3, 5, 9, 8, 7]
  pivot 3 placed at index 1: [2, 3, 4, 5, 9, 8, 7]
  pivot 7 placed at index 4: [2, 3, 4, 5, 7, 8, 9]
  pivot 9 placed at index 6: [2, 3, 4, 5, 7, 8, 9]
sorted: [2, 3, 4, 5, 7, 8, 9]
median (k=3) of [7, 2, 9, 4, 3, 8, 5] -> 5
smallest: 2 | largest: 9`,
    codeNotes: [
      "`partition` uses the last item as the pivot. `store` marks the end of the 'smaller than pivot' zone, and each small item found is swapped into that zone.",
      "After the loop, the pivot is swapped into `store`. Everything left of it is smaller and everything right of it is bigger or equal, so the pivot is in its final place.",
      "`quicksort` partitions, then recurses on both sides. The output shows each pivot landing in its final position.",
      "`quickselect` partitions once, then keeps only the side that contains index `k`. It never sorts the other side, which is why it's O(n) on average.",
      "Production code would choose a random pivot (`random.randrange(lo, hi + 1)`, swapped to `hi`) to avoid the O(n²) case on sorted input.",
    ],
    takeaways: [
      "Partition around a pivot; the pivot lands in its final spot.",
      "Average O(n log n), worst O(n²); a random pivot avoids the worst case.",
      "In place, not stable.",
      "Quickselect: k-th smallest in O(n) average.",
    ],
  },

  "non-comparison-sorts": {
    level: "Intermediate",
    analogy: "Sorting mail into pigeonholes. You don't compare letters with each other. You read each one's house number and drop it straight into that number's box. Then you empty the boxes in order. When the keys are small whole numbers, this beats any comparison sort.",
    explain: [
      "Any sort that works only by **comparing** two items needs at least about n log n comparisons in the worst case. But if the keys are **small integers** (ages, scores 0–100, digits), we can avoid comparisons entirely and sort in **linear time**.",
      "**Counting sort**: count how many times each value appears (in a list of size k, the range of values), then write each value out as many times as it was counted. That's **O(n + k)**. It's great when k is small and terrible when values range up to a billion.",
      "**Radix sort**: sort numbers **one digit at a time**, starting from the least significant digit (ones, then tens, then hundreds), using a **stable** bucket pass for each digit. Stability is the key: after sorting by tens, numbers with the same tens digit keep their already-correct ones order. With d digits this is **O(d × (n + 10))**.",
      "**Heap sort** *is* a comparison sort, included here because it uses a heap: build a heap from the list in O(n), then pop the minimum n times at O(log n) each. That's **O(n log n) in the worst case**, with no extra memory when done in place, but it isn't stable.",
    ],
    simpleCode: py`
# Counting sort, radix sort and heap sort.
import heapq


def counting_sort(values, max_value):
    counts = [0] * (max_value + 1)           # one counter per possible value
    for v in values:
        counts[v] += 1
    result = []
    for value, count in enumerate(counts):   # write each value 'count' times, in order
        result.extend([value] * count)
    return result, counts


def radix_sort(values):
    """Sort non-negative ints digit by digit, least significant digit first."""
    items = list(values)
    place = 1
    while place <= max(items):
        buckets = [[] for _ in range(10)]        # one bucket per digit 0..9
        for v in items:
            digit = (v // place) % 10
            buckets[digit].append(v)             # appending keeps the order: STABLE
        items = [v for bucket in buckets for v in bucket]
        print(f"  after sorting by the {place}s digit: {items}")
        place *= 10
    return items


def heap_sort(values):
    heap = list(values)
    heapq.heapify(heap)                          # O(n)
    return [heapq.heappop(heap) for _ in range(len(heap))]   # n pops x O(log n)


scores = [3, 1, 4, 1, 5, 2, 3]
result, counts = counting_sort(scores, max_value=5)
print("counts per value 0..5:", counts)
print("counting sort:", result)

print("radix sort [170, 45, 75, 90, 802, 24, 2, 66]:")
print("result:", radix_sort([170, 45, 75, 90, 802, 24, 2, 66]))

print("heap sort:", heap_sort([9, 4, 7, 1, 8]))
`,
    simpleOutput: `counts per value 0..5: [0, 2, 1, 2, 1, 1]
counting sort: [1, 1, 2, 3, 3, 4, 5]
radix sort [170, 45, 75, 90, 802, 24, 2, 66]:
  after sorting by the 1s digit: [170, 90, 802, 2, 24, 45, 75, 66]
  after sorting by the 10s digit: [802, 2, 24, 45, 66, 170, 75, 90]
  after sorting by the 100s digit: [2, 24, 45, 66, 75, 90, 170, 802]
result: [2, 24, 45, 66, 75, 90, 170, 802]
heap sort: [1, 4, 7, 8, 9]`,
    codeNotes: [
      "`counting_sort` never compares two items. It just counts. `counts[v]` is how many times `v` appeared, and the output loop writes values in increasing order.",
      "The `counts` printout shows the idea: two 1s, one 2, two 3s and so on. Memory is O(k), so this only suits small value ranges.",
      "`radix_sort` makes one pass per digit. `(v // place) % 10` extracts the current digit. Appending to buckets in order keeps each pass stable.",
      "Watch the radix output: after the 1s pass, the numbers are ordered by their last digit, and after the 100s pass they're fully sorted.",
      "`heap_sort` relies on `heapq`: heapify, then pop the smallest repeatedly.",
    ],
    takeaways: [
      "Counting sort: O(n + k) for small integer keys.",
      "Radix sort: stable pass per digit, from the least significant digit.",
      "Heap sort: guaranteed O(n log n), in place, not stable.",
      "Comparison sorts can't beat n log n; these sidestep comparisons.",
    ],
  },
};
