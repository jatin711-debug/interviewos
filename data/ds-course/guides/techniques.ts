import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const TECHNIQUES_GUIDES: Record<string, DsGuide> = {
  "prefix-sums": {
    level: "Beginner",
    analogy: "A car's odometer. To know how far you drove between two towns, you don't add up every metre. You subtract: odometer at town B minus odometer at town A. A prefix-sum array is an odometer for a list of numbers.",
    explain: [
      "A **prefix sum** array stores running totals: `prefix[i]` = the sum of the first `i` numbers. With `prefix[0] = 0`, building it is one O(n) pass: `prefix[i + 1] = prefix[i] + nums[i]`.",
      "After that, the sum of **any range** `nums[l..r]` (inclusive) is `prefix[r + 1] - prefix[l]`: everything up to r, minus everything before l. That's **O(1)** per question instead of O(n). If you get thousands of range-sum questions, this is a huge win.",
      "The extra leading 0 isn't decoration. It makes ranges that start at index 0 work without a special case.",
      "**Subarray sum equals k**: count the subarrays that add up to k. A subarray `l..r` sums to k when `prefix[r+1] - prefix[l] == k`, which means `prefix[l] == prefix[r+1] - k`. So walk once, keep a dict counting how many times each prefix value has appeared, and at each step add `count[current - k]`. That's O(n) instead of checking every pair.",
      "The reverse trick is a **difference array**: to add `v` to every element in `l..r`, do `diff[l] += v` and `diff[r + 1] -= v`. After many such updates, one prefix-sum pass over `diff` gives the final values. That's O(1) per range update.",
    ],
    simpleCode: py`
# Prefix sums: precompute running totals once, answer range sums instantly.
from collections import defaultdict

nums = [3, 1, 4, 1, 5, 9, 2, 6]

prefix = [0]                          # prefix[i] = sum of the first i numbers
for x in nums:
    prefix.append(prefix[-1] + x)
print("nums:  ", nums)
print("prefix:", prefix)

def range_sum(l, r):
    """Sum of nums[l..r], inclusive, in O(1)."""
    return prefix[r + 1] - prefix[l]

print("sum of nums[2..5] =", range_sum(2, 5), "| check:", sum(nums[2:6]))
print("sum of nums[0..3] =", range_sum(0, 3), "| check:", sum(nums[0:4]))


def count_subarrays_with_sum(values, k):
    """How many contiguous subarrays add up to k? One pass with a dict of prefix counts."""
    seen = defaultdict(int)
    seen[0] = 1                       # the empty prefix
    running = count = 0
    for x in values:
        running += x
        count += seen[running - k]    # each earlier prefix equal to running - k ends a match here
        seen[running] += 1
    return count

print("subarrays of [1, 2, 1, 2, 1] summing to 3:", count_subarrays_with_sum([1, 2, 1, 2, 1], 3))


# Difference array: many "add v to l..r" updates, then one pass to finish.
size = 6
diff = [0] * (size + 1)
for l, r, v in [(0, 2, 5), (1, 4, 2), (3, 5, 1)]:
    diff[l] += v                      # start adding v at l
    diff[r + 1] -= v                  # stop adding after r
result, running = [], 0
for i in range(size):
    running += diff[i]
    result.append(running)
print("after the range updates:", result)
`,
    simpleOutput: `nums:   [3, 1, 4, 1, 5, 9, 2, 6]
prefix: [0, 3, 4, 8, 9, 14, 23, 25, 31]
sum of nums[2..5] = 19 | check: 19
sum of nums[0..3] = 9 | check: 9
subarrays of [1, 2, 1, 2, 1] summing to 3: 4
after the range updates: [5, 7, 7, 3, 3, 1]`,
    codeNotes: [
      "`prefix` starts with 0 and has one more element than `nums`. Each entry is the previous total plus the next number.",
      "`range_sum(l, r)` is a single subtraction: the total up to r minus the total before l. The checks confirm it against `sum()`.",
      "`count_subarrays_with_sum` asks at each position: how many earlier prefixes equal `running - k`? Each one marks the start of a subarray ending here with sum k. `seen[0] = 1` covers subarrays that start at index 0.",
      "The difference array records only where each update starts (+v) and stops (−v). The final pass's running total turns those marks into real values.",
    ],
    takeaways: [
      "prefix[i] = sum of the first i items; prefix[0] = 0.",
      "Range sum l..r = prefix[r + 1] − prefix[l], in O(1).",
      "Prefix sums + a dict count subarrays with sum k in O(n).",
      "Difference array: O(1) range updates, one pass to finish.",
    ],
  },

  "two-pointers-sliding-window": {
    level: "Beginner",
    analogy: "Two pointers are like two people searching a sorted bookshelf from both ends, walking towards each other. A sliding window is like a magnifying glass moving along a line of text: as it moves right, one letter enters on the right and one leaves on the left, and you only update what changed.",
    explain: [
      "Many 'check every pair' or 'check every subarray' problems are O(n²) when done naively. **Two pointers** walks two indexes through the data by a rule, so each element is visited a constant number of times: **O(n)**.",
      "**Opposite ends** (on sorted data): to find two numbers that add up to a target, put `left` at the start and `right` at the end. If the sum is too small, move `left` right to make it bigger. If it's too big, move `right` left. Each move rules out one number for good.",
      "**Sliding window** (same direction): keep a window `[left, right]` over a contiguous range plus a running summary (sum, counts, set of characters). Move `right` to grow the window, and move `left` to shrink it when it breaks a rule. Each element enters once and leaves once, so the whole thing is O(n).",
      "Typical window problems: longest substring without repeating characters, smallest subarray with sum ≥ target, maximum sum of k consecutive numbers. The question to ask yourself: what makes the window **invalid**, and how do I shrink it until it's valid again?",
    ],
    simpleCode: py`
# Two pointers and sliding windows: O(n) instead of checking every pair or every subarray.

def pair_with_sum(sorted_nums, target):
    left, right = 0, len(sorted_nums) - 1
    while left < right:
        total = sorted_nums[left] + sorted_nums[right]
        if total == target:
            return sorted_nums[left], sorted_nums[right]
        if total < target:
            left += 1          # need a bigger sum: move the small end up
        else:
            right -= 1         # need a smaller sum: move the big end down
    return None


def max_sum_of_k(nums, k):
    """Biggest sum of k consecutive numbers: slide a fixed-size window."""
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]   # one enters, one leaves
        best = max(best, window)
    return best


def longest_unique_substring(text):
    """Length of the longest substring with no repeated character: a variable-size window."""
    last_seen = {}             # char -> last index where we saw it
    left = best = 0
    for right, ch in enumerate(text):
        if ch in last_seen and last_seen[ch] >= left:
            left = last_seen[ch] + 1              # jump past the earlier copy of ch
        last_seen[ch] = right
        best = max(best, right - left + 1)
    return best


print("pair summing to 9 in [1, 2, 4, 5, 7, 11]:", pair_with_sum([1, 2, 4, 5, 7, 11], 9))
print("pair summing to 100:", pair_with_sum([1, 2, 4, 5, 7, 11], 100))
print("max sum of 3 in a row of [2, 1, 5, 1, 3, 2]:", max_sum_of_k([2, 1, 5, 1, 3, 2], 3))
for word in ["abcabcbb", "bbbbb", "pwwkew", ""]:
    print(f"longest unique substring of {word!r}: {longest_unique_substring(word)}")
`,
    simpleOutput: `pair summing to 9 in [1, 2, 4, 5, 7, 11]: (2, 7)
pair summing to 100: None
max sum of 3 in a row of [2, 1, 5, 1, 3, 2]: 9
longest unique substring of 'abcabcbb': 3
longest unique substring of 'bbbbb': 1
longest unique substring of 'pwwkew': 3
longest unique substring of '': 0`,
    codeNotes: [
      "`pair_with_sum` needs **sorted** input. If the sum is too small, the only way to grow it is to move `left` up. Every number skipped can't be part of any answer.",
      "`max_sum_of_k` doesn't re-add k numbers per window. It adds the one entering and subtracts the one leaving, so each step is O(1).",
      "`longest_unique_substring` grows the window with `right`. When `ch` repeats inside the window, `left` jumps just past the earlier copy, which restores the 'no repeats' rule.",
      "`last_seen[ch] >= left` matters: an old copy of `ch` from before the window doesn't count.",
    ],
    takeaways: [
      "Opposite pointers on sorted data for pair problems.",
      "Sliding window for contiguous ranges: add on the right, remove on the left.",
      "Each element enters and leaves once, so the total is O(n).",
      "Ask: what makes the window invalid, and how do I shrink it?",
    ],
  },

  "monotonic-stack-queue": {
    level: "Intermediate",
    analogy: "People standing in a line, each looking right for the first person taller than them. Walk along the line from left to right, keeping a stack of people still waiting for an answer. When someone tall arrives, everyone shorter at the top of the stack has found their answer and leaves. The stack always goes from tall (bottom) to short (top).",
    explain: [
      "A **monotonic stack** is a stack whose items are always in sorted order, for example decreasing from bottom to top. When a new item would break the order, we **pop** items until it fits, and each pop is the moment we learn something about the popped item.",
      "**Next greater element**: for each number, find the first bigger number to its right. Walk left to right with a stack of indexes still waiting for an answer. When the current number is bigger than the number at the top, it **is** that item's answer, so pop and record it, and repeat. Then push the current index. Each index is pushed once and popped at most once, so it's **O(n)** instead of O(n²).",
      "The same pattern solves daily temperatures (how many days until a warmer one?), stock span, and the largest rectangle in a histogram.",
      "A **monotonic deque** solves the **sliding window maximum**: keep indexes in a deque whose values are decreasing. When a new value arrives, pop smaller values from the back (they can never be the max again while it's in the window). Drop the front when it slides out of the window. The front is always the current maximum. That's O(n) overall.",
    ],
    simpleCode: py`
# Monotonic stack (next greater element) and monotonic deque (sliding window maximum).
from collections import deque


def next_greater(nums):
    answer = [-1] * len(nums)          # -1 = no bigger number to the right
    stack = []                         # indexes still waiting; their values decrease bottom -> top
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            waiting = stack.pop()
            answer[waiting] = x        # x is the first bigger number to the right of 'waiting'
        stack.append(i)
    return answer


def daily_temperatures(temps):
    """How many days until a warmer day? Same pattern, storing distances."""
    wait = [0] * len(temps)
    stack = []
    for day, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            earlier = stack.pop()
            wait[earlier] = day - earlier
        stack.append(day)
    return wait


def window_max(nums, k):
    result = []
    window = deque()                   # indexes; their values are decreasing front -> back
    for i, x in enumerate(nums):
        while window and nums[window[-1]] <= x:
            window.pop()               # smaller values behind x can never be the max again
        window.append(i)
        if window[0] <= i - k:
            window.popleft()           # the front slid out of the window
        if i >= k - 1:
            result.append(nums[window[0]])   # the front is the max of the current window
    return result


print("next greater of [2, 1, 2, 4, 3]:", next_greater([2, 1, 2, 4, 3]))
print("days to wait, [73, 74, 75, 71, 69, 72, 76, 73]:", daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))
print("window max, k=3, [1, 3, -1, -3, 5, 3, 6, 7]:", window_max([1, 3, -1, -3, 5, 3, 6, 7], 3))
`,
    simpleOutput: `next greater of [2, 1, 2, 4, 3]: [4, 2, 4, -1, -1]
days to wait, [73, 74, 75, 71, 69, 72, 76, 73]: [1, 1, 4, 2, 1, 1, 0, 0]
window max, k=3, [1, 3, -1, -3, 5, 3, 6, 7]: [3, 3, 5, 5, 6, 7]`,
    codeNotes: [
      "`next_greater` keeps indexes whose answer isn't known yet. Their values are decreasing, because a bigger value would already have popped the smaller ones.",
      "The `while` loop is where answers are found: the current `x` beats the value at the top of the stack, so `x` is that index's next greater element.",
      "Every index is pushed once and popped at most once. The nested `while` doesn't make it O(n²), because the total number of pops is at most n.",
      "`window_max` uses a deque instead of a stack, because old indexes must also leave from the front as the window slides. The front is always the largest value in the window.",
    ],
    takeaways: [
      "Monotonic stack = a stack kept sorted by popping what breaks the order.",
      "Each pop answers a question ('next greater', 'next warmer').",
      "Each item is pushed and popped once, so O(n).",
      "Sliding window max: a decreasing deque; the front is the max.",
    ],
  },

  "intervals-sweep": {
    level: "Intermediate",
    analogy: "Planning room bookings on a wall calendar. Merging means: if two bookings overlap, draw them as one block. Counting rooms means: run your finger along the day, adding 1 at each start and subtracting 1 at each end. The highest count you reach is how many rooms you need.",
    explain: [
      "Interval problems involve ranges like `(start, end)`: meetings, bookings, time slots. Almost all of them start the same way: **sort the intervals** (usually by start time). Sorting brings overlapping intervals next to each other.",
      "**Merging overlapping intervals**: sort by start. Keep the current merged interval. If the next interval starts **at or before** the current end, they overlap, so extend the end to `max(end, next_end)`. Otherwise, close the current one and start a new one. That's O(n log n) for the sort plus one pass.",
      "**Sweep line**: turn each interval into two **events**, `(start, +1)` and `(end, -1)`, and sort all events by time. Walk through them keeping a running count. The count at any moment is how many intervals are active. Its maximum is the number of rooms needed for meetings.",
      "**Ties matter.** If one meeting ends at 5 and another starts at 5, can they share a room? For half-open intervals `[start, end)`, yes: process the **end (-1) before the start (+1)** at equal times. Sorting `(time, delta)` tuples does this automatically, because -1 < +1.",
    ],
    simpleCode: py`
# Intervals: sort first, then sweep from left to right.

def merge_intervals(intervals):
    merged = []
    for start, end in sorted(intervals):                 # sort by start time
        if merged and start <= merged[-1][1]:            # overlaps the last merged block
            merged[-1][1] = max(merged[-1][1], end)      # extend it
        else:
            merged.append([start, end])                  # a gap: start a new block
    return [tuple(block) for block in merged]


def rooms_needed(meetings):
    events = []
    for start, end in meetings:
        events.append((start, +1))                       # a meeting begins
        events.append((end, -1))                         # a meeting ends
    events.sort()                                        # at equal times, -1 sorts before +1
    in_use = most = 0
    for time, change in events:
        in_use += change
        most = max(most, in_use)
        print(f"  t={time:>2}  {'+1 start' if change > 0 else '-1 end  '}  rooms in use: {in_use}")
    return most


print("merge:", merge_intervals([(8, 10), (1, 3), (2, 6), (15, 18), (17, 20)]))
print("touching intervals merge too:", merge_intervals([(1, 4), (4, 5)]))
print("sweeping the events:")
print("rooms needed:", rooms_needed([(0, 30), (5, 10), (15, 20), (10, 15)]))
`,
    simpleOutput: `merge: [(1, 6), (8, 10), (15, 20)]
touching intervals merge too: [(1, 5)]
sweeping the events:
  t= 0  +1 start  rooms in use: 1
  t= 5  +1 start  rooms in use: 2
  t=10  -1 end    rooms in use: 1
  t=10  +1 start  rooms in use: 2
  t=15  -1 end    rooms in use: 1
  t=15  +1 start  rooms in use: 2
  t=20  -1 end    rooms in use: 1
  t=30  -1 end    rooms in use: 0
rooms needed: 2`,
    codeNotes: [
      "`merge_intervals` sorts by start, then compares each interval only with the last merged block. Because of the sort, nothing earlier can overlap it.",
      "`start <= merged[-1][1]` uses `<=`, so touching intervals like (1, 4) and (4, 5) merge into one block.",
      "`rooms_needed` turns each meeting into two events. After sorting, the running total is the number of meetings in progress, and its peak is the number of rooms.",
      "At t = 10 one meeting ends and another starts. The −1 event is processed first (−1 sorts before +1), so the room is reused and the count doesn't spike.",
    ],
    takeaways: [
      "Step one for interval problems: sort.",
      "Merge: extend the current block while the next one starts before it ends.",
      "Sweep: +1 at starts, −1 at ends, sorted by time; the peak = max overlap.",
      "Decide the tie rule (end before start for half-open intervals).",
    ],
  },

  "bit-manipulation": {
    level: "Intermediate",
    analogy: "A row of light switches. Each switch is a bit, on (1) or off (0). A single number can represent the whole row: 13 is 1101 in binary, which means switches 0, 2 and 3 are on. Bit operations flip, test and count switches all at once.",
    explain: [
      "Integers are stored in **binary**: 13 = 8 + 4 + 1 = `1101`. Bit **i** (counting from 0 on the right) is worth 2ⁱ. `bin(13)` shows `'0b1101'`, and `1 << i` is 2ⁱ: a number with only bit i on.",
      "The operators: `&` (AND: 1 only where both are 1), `|` (OR: 1 where either is 1), `^` (XOR: 1 where they differ), `~` (NOT), and `<<` / `>>` (shift left/right, which multiply or divide by powers of 2).",
      "The common recipes: test bit i with `x & (1 << i)`. Set it with `x | (1 << i)`. Clear it with `x & ~(1 << i)`. Flip it with `x ^ (1 << i)`. And the classic: `x & (x - 1)` **removes the lowest 1-bit**, so a positive x is a power of two exactly when `x & (x - 1) == 0`, and repeating it counts the 1-bits.",
      "**XOR tricks**: `a ^ a = 0` and `a ^ 0 = a`. So XOR-ing a whole list where every number appears twice except one leaves exactly the unique number, in O(n) time with O(1) memory.",
      "An integer can also represent a **set** of up to ~60 small items (bit i = 'item i is in the set'). That's how bitmask DP and subset enumeration work: `for mask in range(1 << n)` visits every subset of n items.",
    ],
    simpleCode: py`
# Bit manipulation: an int is a row of on/off switches.

x = 13
print(f"{x} in binary: {x:04b}")                       # 1101
for i in range(4):
    print(f"  bit {i} is", "on" if x & (1 << i) else "off")

print("set bit 1:  ", f"{x | (1 << 1):04b}")            # 1111
print("clear bit 2:", f"{x & ~(1 << 2):04b}")           # 1001
print("flip bit 0: ", f"{x ^ (1 << 0):04b}")            # 1100


def count_ones(n):
    count = 0
    while n:
        n &= n - 1          # removes the lowest 1-bit each time
        count += 1
    return count

def is_power_of_two(n):
    return n > 0 and n & (n - 1) == 0      # exactly one bit set

print("ones in 13:", count_ones(13), "| built-in:", bin(13).count("1"))
print("powers of two up to 20:", [n for n in range(1, 21) if is_power_of_two(n)])


def single_number(nums):
    result = 0
    for n in nums:
        result ^= n         # pairs cancel out: a ^ a == 0
    return result

print("the number without a pair in [4, 1, 2, 1, 2]:", single_number([4, 1, 2, 1, 2]))


items = ["a", "b", "c"]
subsets = []
for mask in range(1 << len(items)):        # 0 .. 7: every on/off pattern of 3 switches
    subsets.append("".join(items[i] for i in range(len(items)) if mask & (1 << i)) or "-")
print("all subsets via bitmasks:", subsets)
`,
    simpleOutput: `13 in binary: 1101
  bit 0 is on
  bit 1 is off
  bit 2 is on
  bit 3 is on
set bit 1:   1111
clear bit 2: 1001
flip bit 0:  1100
ones in 13: 3 | built-in: 3
powers of two up to 20: [1, 2, 4, 8, 16]
the number without a pair in [4, 1, 2, 1, 2]: 4
all subsets via bitmasks: ['-', 'a', 'b', 'ab', 'c', 'ac', 'bc', 'abc']`,
    codeNotes: [
      "`f\"{x:04b}\"` prints x in binary with 4 digits. `x & (1 << i)` is non-zero exactly when bit i is on.",
      "Set uses `|`, clear uses `& ~`, and flip uses `^`, each combined with a single-bit mask `1 << i`.",
      "`count_ones` loops once per 1-bit, not once per bit position, because `n & (n - 1)` deletes the lowest 1-bit each time.",
      "`single_number` XORs everything. Each duplicated value cancels itself out, leaving the one without a pair.",
      "The last loop counts from 0 to 2³ − 1. Each number's bits say which items are in that subset, so every subset is listed once.",
    ],
    takeaways: [
      "Test `x & (1<<i)`, set `x | (1<<i)`, clear `x & ~(1<<i)`, flip `x ^ (1<<i)`.",
      "`x & (x - 1)` drops the lowest set bit (power-of-two check, popcount).",
      "XOR: `a ^ a = 0`, so pairs cancel.",
      "An int can be a set: loop `range(1 << n)` for all subsets.",
    ],
  },

  "number-theory": {
    level: "Beginner",
    analogy: "Tiling a 12 × 18 floor with the biggest square tiles that fit exactly. The tile side is the greatest common divisor: 6. Euclid's trick finds it by repeatedly cutting the biggest square off the rectangle until no rectangle is left.",
    explain: [
      "The **greatest common divisor** `gcd(a, b)` is the largest number that divides both. **Euclid's algorithm**: `gcd(a, b) = gcd(b, a % b)`, and `gcd(a, 0) = a`. It works because any number dividing both a and b also divides the remainder `a % b`. The numbers shrink fast, so it takes O(log min(a, b)) steps.",
      "The **least common multiple** follows from it: `lcm(a, b) = a // gcd(a, b) * b`. Python has `math.gcd` and `math.lcm` built in.",
      "**Primes**: a number > 1 whose only divisors are 1 and itself. To test one number, try dividing by 2, 3, … up to √n. If n had a divisor bigger than √n, it would pair with one smaller than √n, which we already tried.",
      "To find **all** primes up to n, use the **Sieve of Eratosthenes**: start by assuming every number is prime. For each prime p, cross out its multiples starting at p × p (smaller multiples were already crossed out by smaller primes). What remains is prime. It's O(n log log n), practically linear.",
      "**Modular arithmetic** (`% m`) keeps huge numbers small. Many problems ask for an answer 'mod 10⁹ + 7'. `pow(base, exp, mod)` computes powers mod m quickly, using the halving trick from divide and conquer.",
    ],
    simpleCode: py`
# GCD with Euclid, primes with a sieve, and fast modular powers.
import math


def gcd(a, b):
    while b:
        print(f"  gcd({a}, {b}) -> gcd({b}, {a % b})")
        a, b = b, a % b          # the remainder keeps every common divisor
    return a

print("gcd(48, 18):")
print("  answer:", gcd(48, 18), "| math.gcd:", math.gcd(48, 18), "| lcm:", 48 // math.gcd(48, 18) * 18)


def is_prime(n):
    if n < 2:
        return False
    d = 2
    while d * d <= n:            # only test divisors up to sqrt(n)
        if n % d == 0:
            return False
        d += 1
    return True


def sieve(limit):
    prime = [True] * (limit + 1)
    prime[0] = prime[1] = False
    p = 2
    while p * p <= limit:
        if prime[p]:
            for multiple in range(p * p, limit + 1, p):   # start at p*p
                prime[multiple] = False
        p += 1
    return [n for n in range(limit + 1) if prime[n]]

print("is_prime(97):", is_prime(97), "| is_prime(91):", is_prime(91), "(7 x 13)")
print("primes up to 50:", sieve(50))

MOD = 10**9 + 7
print("2^100 mod (10^9 + 7) =", pow(2, 100, MOD))      # fast: about 7 squarings, not 100 multiplications
print("(123456789 * 987654321) % MOD =", (123456789 * 987654321) % MOD)
`,
    simpleOutput: `gcd(48, 18):
  gcd(48, 18) -> gcd(18, 12)
  gcd(18, 12) -> gcd(12, 6)
  gcd(12, 6) -> gcd(6, 0)
  answer: 6 | math.gcd: 6 | lcm: 144
is_prime(97): True | is_prime(91): False (7 x 13)
primes up to 50: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
2^100 mod (10^9 + 7) = 976371285
(123456789 * 987654321) % MOD = 259106859`,
    codeNotes: [
      "`gcd` replaces `(a, b)` with `(b, a % b)` until `b` is 0. The printout shows 48, 18 → 18, 12 → 12, 6 → 6, 0, so the answer is 6.",
      "`lcm` divides before multiplying (`a // gcd * b`) to keep the numbers small.",
      "`is_prime` stops at `d * d <= n`. For 97 that's only 9 divisions instead of 95.",
      "`sieve` crosses out multiples of each prime starting at `p * p`. For p = 5 it starts at 25, because 10, 15 and 20 were already crossed out by 2 and 3.",
      "`pow(2, 100, MOD)` uses the fast-power idea internally and never builds the 31-digit number 2¹⁰⁰.",
    ],
    takeaways: [
      "gcd(a, b) = gcd(b, a % b); lcm = a // gcd * b.",
      "Primality test: divisors up to √n.",
      "Sieve: cross out multiples from p², O(n log log n).",
      "Use `% MOD` and `pow(b, e, MOD)` to keep numbers small.",
    ],
  },

  "string-matching": {
    level: "Advanced",
    analogy: "Looking for the word 'ABABC' in a long text. Suppose you've matched 'ABAB' and then hit a wrong letter. A naive search goes back and starts again one letter later. KMP notices that the 'AB' you just matched is also the start of the word, so it keeps those 2 letters and carries on. It never re-reads the text.",
    explain: [
      "**String matching** means finding every place where a pattern appears in a text. The naive way tries every starting position and compares character by character. In the worst case that's O(n × m) (text length × pattern length), for example searching for 'AAAAB' in 'AAAAAAAAA…'.",
      "**KMP (Knuth-Morris-Pratt)** guarantees **O(n + m)**. Its key idea: when a mismatch happens after matching some characters, those characters are known, so use them instead of starting over.",
      "First build the **failure table** (also called the prefix function) for the pattern: `fail[i]` = the length of the longest **proper prefix** of `pattern[:i+1]` that is also a **suffix** of it. For 'ABABC': A→0, AB→0, ABA→1 ('A'), ABAB→2 ('AB'), ABABC→0.",
      "Then scan the text with a counter `k` = how many pattern characters currently match. On a match, `k += 1`. On a mismatch, don't move back in the text. Instead fall back to `k = fail[k - 1]` and try again. When `k` reaches m, you've found an occurrence. The text index only ever moves forward.",
      "In everyday Python, use `text.find(pattern)` or `pattern in text`, which are highly optimised. Learn KMP for interviews and for the failure-table idea itself, which also solves 'shortest palindrome' and 'repeated substring pattern'.",
    ],
    simpleCode: py`
# KMP string search: never move backwards in the text.

def failure_table(pattern):
    """fail[i] = length of the longest proper prefix of pattern[:i+1] that is also its suffix."""
    fail = [0] * len(pattern)
    k = 0                                    # length of the current matching prefix
    for i in range(1, len(pattern)):
        while k > 0 and pattern[i] != pattern[k]:
            k = fail[k - 1]                  # fall back to a shorter prefix
        if pattern[i] == pattern[k]:
            k += 1
        fail[i] = k
    return fail


def kmp_search(text, pattern):
    fail = failure_table(pattern)
    found, k = [], 0                         # k = how many pattern chars match right now
    for i, ch in enumerate(text):
        while k > 0 and ch != pattern[k]:
            k = fail[k - 1]                  # reuse what we already matched
        if ch == pattern[k]:
            k += 1
        if k == len(pattern):                # a full match ends at i
            found.append(i - k + 1)
            k = fail[k - 1]                  # keep going: matches may overlap
    return found


def naive_search(text, pattern):
    return [i for i in range(len(text) - len(pattern) + 1) if text[i:i + len(pattern)] == pattern]


pattern = "ABABC"
print("failure table of", pattern, "->", failure_table(pattern))
print("failure table of AAAA ->", failure_table("AAAA"))

text = "ABABDABABCABABABC"
print("KMP finds", pattern, "at", kmp_search(text, pattern))
print("naive finds it at", naive_search(text, pattern))
print("overlapping 'AA' in 'AAAA':", kmp_search("AAAA", "AA"))
print("built-in str.find:", text.find(pattern))
`,
    simpleOutput: `failure table of ABABC -> [0, 0, 1, 2, 0]
failure table of AAAA -> [0, 1, 2, 3]
KMP finds ABABC at [5, 12]
naive finds it at [5, 12]
overlapping 'AA' in 'AAAA': [0, 1, 2]
built-in str.find: 5`,
    codeNotes: [
      "`failure_table('ABABC')` is `[0, 0, 1, 2, 0]`. After matching 'ABAB', the last 'AB' is also the first 'AB', so 2 characters can be kept on a mismatch.",
      "`kmp_search` keeps `k`, the number of pattern characters matched so far. On a mismatch, `k = fail[k - 1]` shrinks the match without moving `i` backwards.",
      "When `k` reaches the pattern length, a match ends at `i`, so it starts at `i - k + 1`. Resetting with the failure table lets overlapping matches be found.",
      "`naive_search` gives the same answers but may re-compare characters many times. On real text the difference is small. On adversarial input like 'AAAA…B' it's huge.",
    ],
    takeaways: [
      "Naive matching: O(n × m) worst case. KMP: O(n + m).",
      "Failure table = longest prefix that's also a suffix, for each pattern prefix.",
      "On mismatch, fall back with the table; never move backwards in the text.",
      "In real code use `in` / `str.find`.",
    ],
  },
};
