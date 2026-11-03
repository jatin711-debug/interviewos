import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const FOUNDATIONS_GUIDES: Record<string, DsGuide> = {
  "ds-class-design": {
    level: "Beginner",
    analogy: "Think of a power socket. Any plug that fits it gets electricity, whether it belongs to a lamp, a laptop or a kettle. Python's built-in functions are sockets too: `len()`, `for`, `in` and `print()`. If your class has the right 'plug' (a special method like `__len__`), it works with them just like a list does.",
    explain: [
      "Every data structure in this course is a **class** that holds some items. We call such a class a **container**. To feel natural to use, a container should work with the tools Python programmers already know: `len(box)`, `for item in box`, `x in box`, `print(box)` and `box1 == box2`.",
      "Python makes this possible with **special methods** (also called 'dunder' methods, short for **d**ouble **under**score). When you write `len(box)`, Python actually calls `box.__len__()`. `x in box` calls `box.__contains__(x)`, `for` calls `box.__iter__()`, `print` uses `box.__repr__()`, and `==` calls `box.__eq__(other)`.",
      "You don't need all of them. Add the ones that make sense for your structure: almost every container wants `__len__`, `__iter__` and `__repr__`. Add `__contains__` when membership can be checked faster than looping, and `__eq__` when comparing two containers makes sense.",
      "Two more habits make a class pleasant: keep the internal data 'private' by naming it with a leading underscore (`self._items`), so users go through your methods, and raise the same errors the built-ins do (for example `KeyError` for a missing key), so error handling works as people expect.",
    ],
    simpleCode: py`
# A "bag" (multiset): like a set, but it counts how many times each item was added.

class Bag:
    def __init__(self):
        self._counts = {}               # item -> how many times it's in the bag

    def add(self, item):
        self._counts[item] = self._counts.get(item, 0) + 1

    def remove(self, item):
        if item not in self._counts:
            raise KeyError(item)        # same error a dict gives for a missing key
        self._counts[item] -= 1
        if self._counts[item] == 0:
            del self._counts[item]

    def count(self, item):
        return self._counts.get(item, 0)

    # ---- special methods: these plug the Bag into Python's built-in tools ----
    def __len__(self):                  # len(bag)
        return sum(self._counts.values())

    def __contains__(self, item):       # item in bag   (O(1): a dict lookup)
        return item in self._counts

    def __iter__(self):                 # for item in bag
        for item, n in self._counts.items():
            for _ in range(n):
                yield item

    def __repr__(self):                 # print(bag) / the REPL
        return f"Bag({list(self)})"

    def __eq__(self, other):            # bag1 == bag2
        if not isinstance(other, Bag):
            return NotImplemented       # "I don't know how to compare with that"
        return self._counts == other._counts


fruit = Bag()
for name in ["apple", "pear", "apple", "fig"]:
    fruit.add(name)

print(fruit)                            # uses __repr__
print("len:", len(fruit))               # uses __len__
print("'apple' in fruit:", "apple" in fruit, "| count:", fruit.count("apple"))
print("loop:", [item.upper() for item in fruit])   # uses __iter__

other = Bag()
for name in ["fig", "apple", "pear", "apple"]:
    other.add(name)
print("same contents, different order ->", fruit == other)   # uses __eq__

fruit.remove("fig")
print("after remove('fig'):", fruit, "| empty bag is falsy:", not Bag())
try:
    fruit.remove("kiwi")
except KeyError as error:
    print("KeyError:", error)
`,
    simpleOutput: `Bag(['apple', 'apple', 'pear', 'fig'])
len: 4
'apple' in fruit: True | count: 2
loop: ['APPLE', 'APPLE', 'PEAR', 'FIG']
same contents, different order -> True
after remove('fig'): Bag(['apple', 'apple', 'pear']) | empty bag is falsy: True
KeyError: 'kiwi'`,
    codeNotes: [
      "The bag stores a dict of counts in `self._counts`. The underscore says 'internal, use the methods instead'.",
      "`add`, `remove` and `count` are ordinary methods. `remove` raises `KeyError` for a missing item, the same as `dict` does.",
      "`__len__` makes `len(fruit)` work. As a bonus, Python treats an object with length 0 as false, so `not Bag()` is `True`.",
      "`__contains__` makes `'apple' in fruit` a fast O(1) dict lookup instead of a loop over every item.",
      "`__iter__` is a generator (it uses `yield`), so `for` loops, list comprehensions and `list(fruit)` all just work.",
      "`__eq__` compares the counts, so order doesn't matter. Returning `NotImplemented` for non-bags lets Python fall back gracefully instead of crashing.",
    ],
    takeaways: [
      "`len(x)` → `x.__len__()`, `in` → `__contains__`, `for` → `__iter__`, `print` → `__repr__`, `==` → `__eq__`.",
      "Implement the special methods your structure needs, and no more.",
      "Keep internals in `_underscore` attributes; expose methods.",
      "Raise the same errors the built-ins raise.",
    ],
  },

  "ds-iterators": {
    level: "Beginner",
    analogy: "A generator is like a bookmark in a recipe. You read until the next step, hand it over, then put the bookmark in and wait. When someone asks for the next step, you continue right where you stopped. You never have to copy out the whole recipe in advance.",
    explain: [
      "An **iterable** is anything you can loop over: a list, a string, a dict, or your own class. An **iterator** is the object that actually does the looping. It remembers where it is, and each call to `next()` gives the next item. When there are no more items it raises `StopIteration`, which tells the `for` loop to stop.",
      "A `for` loop does this for you: `for x in things` calls `iter(things)` to get an iterator, then calls `next()` on it over and over. One iterable can make many independent iterators. That's why you can loop over the same list twice.",
      "The easiest way to make an iterator is a **generator function**: any function containing `yield`. Calling it doesn't run the body. It returns a generator. Each `next()` runs the body up to the next `yield`, hands back that value, and **pauses**, keeping all its local variables. `yield from other` hands over every item from another iterable.",
      "Generators are **lazy**: they produce one item at a time instead of building a full list. That saves memory and lets you stop early. Every traversal in this course (walking a tree, exploring a graph) is written as a generator for this reason.",
      "One warning: don't add or remove items in a collection **while** you're looping over it. The iterator's position no longer matches the data, so you can skip items or crash. Loop over a copy (`list(things)`) if you need to change things as you go.",
    ],
    simpleCode: py`
# Iterables, iterators and generators, step by step.

numbers = [10, 20, 30]
it = iter(numbers)               # ask the list for an iterator
print(next(it), next(it), next(it))
try:
    next(it)
except StopIteration:
    print("StopIteration: the iterator is used up")


def countdown(n):
    """A generator: the body runs a little at a time, pausing at each yield."""
    print("  (starting)")
    while n > 0:
        yield n                  # hand back n and PAUSE here
        n -= 1                   # continue from here on the next next()
    print("  (finished)")


gen = countdown(3)               # nothing printed yet: the body hasn't started
print("created:", type(gen).__name__)
print("first next():", next(gen))
print("second next():", next(gen))
print("the rest:", list(gen))    # list() keeps calling next() until StopIteration


def evens_then_odds(values):
    yield from (v for v in values if v % 2 == 0)   # yield every item of another iterable
    yield from (v for v in values if v % 2 == 1)

print("evens then odds:", list(evens_then_odds([1, 2, 3, 4, 5, 6])))


def squares():
    """An infinite generator: fine, because values are only made when asked for."""
    n = 1
    while True:
        yield n * n
        n += 1

for square in squares():
    if square > 30:
        break                    # stop early: the rest are never computed
    print(square, end=" ")
print()

items = [1, 2, 3, 4]
for x in list(items):            # loop over a COPY when you change the original
    if x % 2 == 0:
        items.remove(x)
print("odd items kept:", items)
`,
    simpleOutput: `10 20 30
StopIteration: the iterator is used up
created: generator
  (starting)
first next(): 3
second next(): 2
  (finished)
the rest: [1]
evens then odds: [2, 4, 6, 1, 3, 5]
1 4 9 16 25 
odd items kept: [1, 3]`,
    codeNotes: [
      "`iter(numbers)` returns an iterator. Each `next(it)` gives the next item, and the extra `next` raises `StopIteration`. A `for` loop does exactly this behind the scenes.",
      "`countdown(3)` prints nothing when it's created: a generator's body only runs when you ask for a value. Look at where '(starting)' appears in the output.",
      "Each `yield n` hands back a value and pauses. The next `next()` resumes on the line after the `yield`, with `n` still remembered.",
      "`yield from` passes along every item of another iterable. It's how a tree traversal yields everything from a subtree in one line.",
      "`squares()` never ends, but that's fine: `break` stops asking, so only the values we used are ever computed. This is what 'lazy' means.",
      "The last loop walks `list(items)` (a copy) while removing from `items`. Removing from the list you're looping over would skip elements.",
    ],
    takeaways: [
      "Iterable = can be looped; iterator = remembers the position and has `next()`.",
      "A function with `yield` is a generator; it pauses at each `yield`.",
      "Generators are lazy: one item at a time, little memory, can stop early.",
      "Never change a collection while iterating over it; loop over a copy.",
    ],
  },

  "ds-complexity": {
    level: "Beginner",
    analogy: "To compare two routes to work, you don't time them to the second. You ask: 'If the city doubles in size, how much longer does each route take?' Big-O asks the same question about code: when the input gets bigger, how fast does the work grow?",
    explain: [
      "**Time complexity** describes how the number of steps an algorithm takes grows as the input size `n` grows. We don't count seconds, because those depend on the computer. We count basic operations, and we only care about the **growth rate**. That's written in **Big-O** notation.",
      "The common growth rates, from fastest to slowest: **O(1)** (constant: the same work for any n, like reading `list[5]`), **O(log n)** (logarithmic: the problem halves each step, like binary search; 1,000,000 items take about 20 steps), **O(n)** (linear: look at each item once), **O(n log n)** (good sorting), and **O(n²)** (quadratic: compare every pair; 10× more data means 100× more work).",
      "To find the Big-O of code, look at the loops. One loop over n items is O(n). A loop inside a loop over the same items is O(n²). A loop that halves its range each time is O(log n). Drop constants and smaller terms: `3n + 5` is just O(n), because for big n the largest term is all that matters.",
      "**Amortized** cost is the average per operation over a long sequence, even when a few operations are expensive. `list.append` sometimes copies the whole list (O(n)), but so rarely that the average is O(1).",
      "A practical rule for interviews: about 10⁷–10⁸ simple operations take roughly a second. So n = 10⁵ rules out O(n²) (that's 10¹⁰ operations) but allows O(n log n). The input size often tells you which algorithm is expected.",
    ],
    simpleCode: py`
# Count the steps instead of timing them, and watch how each one grows with n.

def constant(items):          # O(1): one step, whatever the size
    return items[0]

def linear_search(items, target):   # O(n): may look at every item
    steps = 0
    for value in items:
        steps += 1
        if value == target:
            break
    return steps

def binary_search(items, target):   # O(log n): halves the range each step
    lo, hi, steps = 0, len(items) - 1, 0
    while lo <= hi:
        steps += 1
        mid = (lo + hi) // 2
        if items[mid] == target:
            break
        if items[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return steps

def all_pairs(items):         # O(n^2): a loop inside a loop
    steps = 0
    for a in items:
        for b in items:
            steps += 1
    return steps


print("Steps needed in the worst case:")
print(f"{'n':>7} {'linear':>8} {'binary':>7} {'pairs':>14}")
for n in [10, 100, 1000, 10000]:
    data = list(range(n))
    target = n - 1                     # worst case for linear search: the last item
    pairs = all_pairs(data) if n <= 1000 else n * n   # (too slow to actually run at 10,000)
    print(f"{n:>7} {linear_search(data, target):>8} {binary_search(data, target):>7} {pairs:>14,}")

# Amortized O(1): count how many items list-like doubling copies in total.
copies, capacity = 0, 1
for size in range(1, 1001):
    if size > capacity:
        copies += capacity             # growing copies everything we have
        capacity *= 2
print("1000 appends caused", copies, "copies in total -> about", round(copies / 1000, 2), "per append")
`,
    simpleOutput: `Steps needed in the worst case:
      n   linear  binary          pairs
     10       10       4            100
    100      100       7         10,000
   1000     1000      10      1,000,000
  10000    10000      14    100,000,000
1000 appends caused 1023 copies in total -> about 1.02 per append`,
    codeNotes: [
      "Each function counts its own steps, so the numbers are the same on every computer. That's the point of Big-O: count work, not seconds.",
      "`linear_search` looks at items one by one. Searching for the last item takes n steps, so 10× more data means 10× more steps.",
      "`binary_search` throws away half the range on every step (the list must be sorted). Going from 1,000 to 10,000 items adds only about 3 or 4 steps.",
      "`all_pairs` has a loop inside a loop: n × n steps. At n = 10,000 that's 100 million, which is why O(n²) gets slow so quickly.",
      "The last part simulates a growing array. 1,000 appends cause only 1,023 copies in total, about 1 per append. That's amortized O(1).",
    ],
    takeaways: [
      "Big-O = how the work grows with n; ignore constants and small terms.",
      "One loop → O(n); nested loops → O(n²); halving → O(log n).",
      "Amortized = average over many operations (like `list.append`).",
      "~10⁸ simple steps per second: use n to guess the needed complexity.",
    ],
  },
};
