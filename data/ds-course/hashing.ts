import type { DsModule } from "./types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const HASHING_MODULE: DsModule = {
  id: "hashing",
  title: "Hashing & caches",
  description: "Hash tables built two ways, and the LRU cache that combines a hash table with a linked list.",
  lessons: [
    {
      id: "hash-table-chaining",
      title: "Hash table with chaining",
      kind: "structure",
      summary: "A hash table turns a key into a bucket number, so lookup, insert and delete take O(1) time on average. Building one shows what dict and set really do, and why keys must be hashable and immutable.",
      concepts: [
        "A hash function turns a key into an integer, and hash(key) % number_of_buckets picks a bucket (here a small list). Looking a key up means hashing it once and scanning one short bucket instead of the whole collection, which is why dict and set lookups are constant time on average.",
        "Two keys can land in the same bucket (a collision), and with a fixed bucket count collisions are certain once there are more keys than buckets. Chaining keeps every colliding entry in that bucket's list. In the demo, 0, 8 and 16 all map to bucket 0 while there are 8 buckets, so that chain has length 3.",
        "The load factor is entries divided by buckets. Chains stay about one entry long only while it is bounded, so when it passes 0.75 the table doubles its bucket count and rehashes every entry. One resize costs O(n), but sizes double (8, 16, 32, ...), so n inserts cost O(n) in total and each insert is O(1) amortized.",
        "The contract: if a == b then hash(a) == hash(b). A lookup scans only one bucket, so equal keys must hash alike or the search goes to the wrong bucket. For the same reason a key whose hash changes while it is stored (a mutable key) is lost. That is why lists are unhashable and good keys are int, str, tuples of immutables and frozen dataclasses.",
        "Inheriting from MutableMapping means writing five methods (__getitem__, __setitem__, __delitem__, __iter__, __len__) and receiving get, pop, popitem, setdefault, update, keys, values, items, clear, in and == for free."
      ],
      complexity: [
        { operation: "get / set / delete / in", time: "O(1) expected", note: "O(n) worst case when every key lands in one bucket (a bad hash, or crafted keys)" },
        { operation: "insert, including resizes", time: "O(1) amortized", note: "a resize is O(n) but only happens after the table has doubled" },
        { operation: "iterate / items / repr", time: "O(buckets + n)", note: "this table never shrinks, so after many deletes it still visits every empty bucket" },
        { operation: "len", time: "O(1)", note: "a counter is kept instead of summing the buckets" }
      ],
      space: "O(n + b) for n entries and b buckets: one tuple per entry plus one list per bucket. While the table has only grown, the load limit keeps b proportional to n.",
      code: py`
from __future__ import annotations

from collections.abc import Hashable, Iterable, Iterator, MutableMapping
from dataclasses import dataclass
from typing import TypeVar

K = TypeVar("K", bound=Hashable)
V = TypeVar("V")


class HashMap(MutableMapping[K, V]):
    """A hash table that resolves collisions by chaining.

    Invariant: the entry for key k lives in bucket hash(k) % capacity, and the
    load factor len / capacity never exceeds 0.75, so a bucket holds about one
    entry and get / set / delete cost O(1) on average. get, pop, update, items
    and the rest come free from MutableMapping. Iteration follows bucket order,
    not insertion order (unlike dict).
    """

    __slots__ = ("_buckets", "_size")
    MAX_LOAD = 0.75

    def __init__(self, items: Iterable[tuple[K, V]] = (), *, capacity: int = 8) -> None:
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self._buckets: list[list[tuple[K, V]]] = [[] for _ in range(capacity)]
        self._size = 0
        self.update(items)

    @property
    def capacity(self) -> int:
        return len(self._buckets)

    @property
    def load_factor(self) -> float:
        return self._size / len(self._buckets)

    def bucket_sizes(self) -> list[int]:
        return [len(bucket) for bucket in self._buckets]

    def _bucket(self, key: K) -> list[tuple[K, V]]:
        return self._buckets[hash(key) % len(self._buckets)]

    def __getitem__(self, key: K) -> V:
        for existing, value in self._bucket(key):  # walk the chain
            if existing == key:
                return value
        raise KeyError(key)

    def __setitem__(self, key: K, value: V) -> None:
        bucket = self._bucket(key)
        for position, (existing, _) in enumerate(bucket):
            if existing == key:
                bucket[position] = (key, value)  # overwrite: the size is unchanged
                return
        bucket.append((key, value))
        self._size += 1
        if self._size > self.MAX_LOAD * len(self._buckets):
            self._resize(2 * len(self._buckets))

    def __delitem__(self, key: K) -> None:
        bucket = self._bucket(key)
        for position, (existing, _) in enumerate(bucket):
            if existing == key:
                del bucket[position]
                self._size -= 1
                return
        raise KeyError(key)

    def _resize(self, capacity: int) -> None:
        """Rehash every entry into a table of the new size: O(n), amortized O(1) per insert."""
        old_buckets = self._buckets
        self._buckets = [[] for _ in range(capacity)]
        for bucket in old_buckets:
            for key, value in bucket:
                self._buckets[hash(key) % capacity].append((key, value))

    def __iter__(self) -> Iterator[K]:
        for bucket in self._buckets:
            for key, _ in bucket:
                yield key

    def __len__(self) -> int:
        return self._size

    def __repr__(self) -> str:
        return f"HashMap({dict(self.items())!r})"


@dataclass(frozen=True, slots=True)
class Point:
    """Immutable, so its hash can never change. frozen + eq generate a matching __hash__."""

    x: int
    y: int


class MutableKey:
    """A BAD key: its hash depends on state that can change after insertion."""

    def __init__(self, n: int) -> None:
        self.n = n

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, MutableKey):
            return NotImplemented
        return self.n == other.n

    def __hash__(self) -> int:
        return hash(self.n)


if __name__ == "__main__":
    table: HashMap[int, str] = HashMap()
    for key in (0, 8, 16):  # all land in bucket 0 while there are 8 buckets
        table[key] = f"v{key}"
    print(table.bucket_sizes())
    table.update({1: "one", 2: "two", 3: "three", 4: "four"})  # the 7th entry passes 0.75 load
    print(table.capacity, table.bucket_sizes())
    print(table)
    print(table.get(8), table.get(99, "missing"), table.pop(16), len(table))
    del table[0]
    print(sorted(table), 0 in table, round(table.load_factor, 3))
    try:
        print(table[99])
    except KeyError as error:
        print("KeyError:", error)

    points: HashMap[Point, str] = HashMap()
    points[Point(1, 2)] = "A"
    print(points[Point(1, 2)])  # an equal but different object finds the entry

    bad: HashMap[MutableKey, str] = HashMap()
    key = MutableKey(1)
    bad[key] = "stuck"
    key.n = 2  # the entry stays in the bucket for hash 1
    print(key in bad, MutableKey(1) in bad, len(bad))
`,
      output: `[3, 0, 0, 0, 0, 0, 0, 0]
16 [2, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
HashMap({0: 'v0', 16: 'v16', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 8: 'v8'})
v8 missing v16 6
[1, 2, 3, 4, 8] False 0.312
KeyError: 99
A
False False 1`,
      bestPractices: [
        "Subclass collections.abc.MutableMapping and implement only __getitem__, __setitem__, __delitem__, __iter__ and __len__. get, pop, update, items, keys, values, setdefault, == and in then behave like dict's with no extra code.",
        "Raise KeyError(key) from __getitem__ and __delitem__ for a missing key. The inherited get, pop and __contains__ rely on exactly that exception to decide what to return.",
        "Bound the load factor and grow by doubling. Doubling, not adding a fixed amount, is what makes inserts O(1) amortized, and the limit lives in one class constant (MAX_LOAD) instead of a magic number.",
        "Compare with == inside the bucket after the hash has chosen it. Equal hashes do not mean equal keys, so __getitem__ and __setitem__ check existing == key before trusting an entry.",
        "Use immutable value objects as keys. @dataclass(frozen=True, slots=True) generates __eq__ and a matching __hash__ from the fields, so Point(1, 2) finds the entry stored under a different Point(1, 2) object.",
        "Make __iter__ a generator that walks the buckets lazily, and keep the bucket list private behind read-only properties (capacity, load_factor) so callers cannot break the invariant."
      ],
      pitfalls: [
        "Using a mutable object as a key. If its hash depends on fields that change, as MutableKey.n does in the demo, the entry stays in the old bucket: neither the changed key nor an equal-looking new one finds it, yet len() still counts it.",
        "Defining __eq__ without a matching __hash__. Python then sets __hash__ to None and the class becomes unhashable. The other way round is worse: hashing on fields that equal objects do not share breaks lookups silently.",
        "Trusting str hash values or the order they produce. Python randomizes str and bytes hashing for every process, so a table keyed by strings iterates in a different order each run. Never depend on order, and use your own deterministic hash if you need reproducible buckets.",
        "Patterned keys with a power-of-two bucket count. An int hashes to itself, so multiples of 8 all use bucket 0 until the table has more than 8 buckets. Real tables mix the hash bits first (CPython's probing uses the high bits, Java's HashMap xors the hash with a shifted copy of itself)."
      ],
      useWhen: [
        "You need membership or lookup by key faster than scanning: counting, deduplicating, grouping or caching.",
        "A problem asks \"have I seen this before?\" (two-sum, duplicates, anagrams): store what you have seen in a dict or set.",
        "You must explain dict and set performance: why lookups are O(1) on average, why keys must be hashable, and when they degrade to O(n)."
      ],
      inPractice: "Use dict and set. They are hash tables written in C (the next lesson, Hash table with open addressing, shows how CPython's work), they keep insertion order in the case of dict, and no Python class comes close to their speed. collections.Counter and defaultdict build on them. Write a table yourself to learn, to supply a custom hash function, or when you need behavior dict lacks; subclass collections.abc.MutableMapping, as HashMap does, so the rest of the mapping API comes for free.",
      challenge: {
        prompt: "Write a HashSet class: a set of hashable items stored in a list of buckets (chaining). Do not use set, dict or frozenset inside it. HashSet(items=()) adds every item of the iterable. add(item) returns True if the item was new and False if it was already present. discard(item) removes it and returns True, or returns False if it was absent; remove(item) raises KeyError instead of returning False. Support \"item in s\", len(s) and iteration (each item exactly once, in any order). A read-only property bucket_count starts at 8: whenever an add makes len(s) greater than 0.75 * bucket_count, double it and rehash every item, so len(s) <= 0.75 * bucket_count always holds after an add. Adding an unhashable item such as a list raises TypeError, as it does for a set. Operations must be O(1) on average: the checks add 40,000 items, which a table stuck at 8 buckets cannot do in time.",
        hint: "Store each item in the list at index hash(item) % len(buckets). add looks in that list first (item in bucket), then appends and counts it. After the append, if the size is above 0.75 * len(buckets), build twice as many empty buckets and re-insert every old item: the index changes when the bucket count does.",
        starter: py`
class HashSet:
    """A set of hashable items stored in buckets (no set, dict or frozenset inside)."""

    def __init__(self, items=()):
        self._buckets = [[] for _ in range(8)]
        self._size = 0
        # TODO: add every item from items

    @property
    def bucket_count(self):
        return len(self._buckets)

    def add(self, item):
        """Return True if item was new, False if it was already present."""
        raise NotImplementedError

    def discard(self, item):
        """Remove item and return True, or return False if it was absent."""
        raise NotImplementedError

    def remove(self, item):
        """Like discard, but raise KeyError when item is absent."""
        raise NotImplementedError

    def __contains__(self, item):
        raise NotImplementedError

    def __len__(self):
        return self._size

    def __iter__(self):
        raise NotImplementedError
`,
        solution: py`
class HashSet:
    """A set of hashable items stored in buckets: chaining, doubling at load 0.75."""

    def __init__(self, items=()):
        self._buckets = [[] for _ in range(8)]
        self._size = 0
        for item in items:
            self.add(item)

    @property
    def bucket_count(self):
        return len(self._buckets)

    def _bucket(self, item):
        return self._buckets[hash(item) % len(self._buckets)]

    def add(self, item):
        bucket = self._bucket(item)
        if item in bucket:
            return False
        bucket.append(item)
        self._size += 1
        if self._size > 0.75 * len(self._buckets):
            self._grow()
        return True

    def discard(self, item):
        bucket = self._bucket(item)
        if item not in bucket:
            return False
        bucket.remove(item)
        self._size -= 1
        return True

    def remove(self, item):
        if not self.discard(item):
            raise KeyError(item)

    def _grow(self):
        old_buckets = self._buckets
        self._buckets = [[] for _ in range(2 * len(old_buckets))]
        for bucket in old_buckets:
            for item in bucket:
                self._bucket(item).append(item)

    def __contains__(self, item):
        return item in self._bucket(item)

    def __len__(self):
        return self._size

    def __iter__(self):
        for bucket in self._buckets:
            yield from bucket
`,
        tests: py`
@check("add reports whether the item is new; duplicates are ignored")
def _():
    s = HashSet()
    eq(s.add(5), True)
    eq(s.add(5), False)
    eq(s.add(6), True)
    eq(len(s), 2)
    eq(5 in s, True)
    eq(7 in s, False)
    eq(len(HashSet([1, 2, 2, 3, 3, 3])), 3)

@check("colliding items share a bucket but stay distinct")
def _():
    s = HashSet()
    for item in (0, 8, 16, 24):  # all in bucket 0 while there are 8 buckets
        eq(s.add(item), True)
    eq(len(s), 4)
    eq(32 in s, False)
    eq(s.discard(8), True)
    eq(8 in s, False)
    eq(sorted(s), [0, 16, 24])

@check("discard returns a flag, remove raises KeyError")
def _():
    s = HashSet([1, 2, 3])
    eq(s.discard(2), True)
    eq(s.discard(2), False)
    s.remove(3)
    raises(KeyError, s.remove, 3)
    eq(sorted(s), [1])
    eq(len(s), 1)

@check("iteration yields every item once and can be repeated")
def _():
    items = [-3, 0, 4, 9, 100, 2**40, -2**40]
    s = HashSet(items)
    eq(sorted(s), sorted(items))
    eq(sorted(s), sorted(items))
    eq(list(HashSet()), [])

@check("items are compared by value; unhashable items raise TypeError")
def _():
    s = HashSet()
    s.add("ab" + "c")
    s.add((1, 2))
    eq("abc" in s, True)
    eq((1, 1 + 1) in s, True)
    eq(s.add("abc"), False)
    raises(TypeError, s.add, [1, 2])
    eq(len(s), 2)

@check("bucket_count starts at 8 and doubles when the load passes 0.75")
def _():
    s = HashSet()
    eq(s.bucket_count, 8)
    for n in range(1000):
        s.add(n * 3)
        assert len(s) <= 0.75 * s.bucket_count, "load factor went above 0.75 after add"
    eq(s.bucket_count, 2048)
    eq(all(n * 3 in s for n in range(1000)), True)

@check("40,000 adds, lookups and discards stay fast (needs resizing)")
def _():
    s = HashSet()
    for i in range(40_000):
        s.add((i * 7919) % 1_000_003)
    eq(len(s), 40_000)
    eq(sum(1 for i in range(40_000) if (i * 7919) % 1_000_003 in s), 40_000)
    eq(sum(1 for i in range(40_000, 80_000) if (i * 7919) % 1_000_003 in s), 0)
    for i in range(0, 40_000, 2):
        s.discard((i * 7919) % 1_000_003)
    eq(len(s), 20_000)
`
      },
      practice: ["Arrays & Hashing"],
      source: "https://docs.python.org/3/reference/datamodel.html#object.__hash__"
    },
    {
      id: "hash-table-open-addressing",
      title: "Hash table with open addressing",
      kind: "structure",
      summary: "Open addressing stores every item directly in one flat array and, on a collision, probes the following slots until it finds a free one. It is compact and cache friendly, and it is the family CPython's dict and set belong to, but deleting needs tombstones.",
      concepts: [
        "There are no buckets: the table is one array of slots, and each slot holds an item or is empty. An item belongs at its home slot, hash(item) % capacity. If that slot is taken, linear probing tries the next slot, then the next, wrapping around the end. A search follows the same path and may stop at the first slot that was never used.",
        "Deleting is the tricky part. If a deleted slot were simply set back to empty, a later search would stop there and wrongly report that items stored further along the same run are missing. So a deleted slot becomes a tombstone: searches walk past it and an add may reuse it. In the demo, deleting 11 leaves an x at slot 4 and 19 is still found.",
        "Probing needs free slots, so the load must stay low: here at most 60% of the slots may hold an item or a tombstone. Tombstones count because searches still step over them. When the limit is crossed the table is rebuilt: it doubles if the live items need the room, or is rebuilt at the same size if most of the clutter is tombstones. Either way the rebuild drops every tombstone.",
        "Linear probing suffers from clustering. Runs of occupied slots grow, and a new item whose home slot lies inside a run joins its end and makes it longer still (in the demo, 4 joins the cluster started by 3, 11 and 19). Longer runs mean slower searches, which is another reason to keep the load low.",
        "CPython's dict is open addressing too, with differences worth knowing: its probe sequence mixes in the high bits of the hash instead of stepping by one, it grows when it is about two thirds full, and it keeps the entries in a separate dense array in insertion order (guaranteed by the language since Python 3.7) while the sparse hash table holds only small integer indexes into that array. That is why a dict iterates in insertion order, whereas this set iterates in slot order."
      ],
      complexity: [
        { operation: "add / in / discard", time: "O(1) expected", note: "with random hashes at the 0.6 load limit a miss averages about 3.6 probes; O(n) worst case when most items form one cluster" },
        { operation: "rehash (grow or clean)", time: "O(capacity)", note: "amortized O(1) per add: a rebuild is preceded by at least 0.3 x capacity inserts that pay for it" },
        { operation: "iterate / repr", time: "O(capacity)", note: "every slot is visited, empty or not" },
        { operation: "a | b, a & b, a <= b", time: "O(len(a) + len(b)) expected", note: "inherited from MutableSet and built on in and iteration" }
      ],
      space: "O(capacity): one reference per slot and no per-item objects. The load is at most 0.6 at all times and at most 0.3 right after a rebuild, but the table never shrinks, so it can fall lower after many discards.",
      code: py`
from __future__ import annotations

from collections.abc import Hashable, Iterable, Iterator, MutableSet
from typing import Any, TypeVar

T = TypeVar("T", bound=Hashable)

_EMPTY: Any = object()  # a slot never used: a probe may stop here
_DELETED: Any = object()  # a tombstone: a probe must walk past it


class ProbingSet(MutableSet[T]):
    """A set stored in one flat array, resolved by linear probing.

    Invariants: an item sits in its home slot hash(item) % capacity or in a
    later slot of the same run, with no _EMPTY slot in between, so a search may
    stop at the first _EMPTY slot. Slots holding items or tombstones never
    exceed 60% of the capacity, so runs stay short. Iteration is in slot order.
    """

    __slots__ = ("_slots", "_live", "_used")
    MAX_LOAD = 0.6

    def __init__(self, items: Iterable[T] = ()) -> None:
        self._slots: list[Any] = [_EMPTY] * 8
        self._live = 0  # slots holding an item
        self._used = 0  # slots holding an item or a tombstone
        for item in items:
            self.add(item)

    @property
    def capacity(self) -> int:
        return len(self._slots)

    def _probe(self, item: object) -> Iterator[int]:
        """Yield every slot index once: the home slot first, then the next slots, wrapping around."""
        start = hash(item) % len(self._slots)
        for step in range(len(self._slots)):
            yield (start + step) % len(self._slots)

    def _find(self, item: object) -> int:
        """Return the slot holding item, or -1. Tombstones are skipped, never matched."""
        for index in self._probe(item):
            slot = self._slots[index]
            if slot is _EMPTY:
                return -1  # the run ends here, so item cannot be further on
            if slot is not _DELETED and slot == item:
                return index
        return -1

    def _place(self, item: T) -> None:
        """Put an item known to be absent into the first free slot of its run."""
        for index in self._probe(item):
            slot = self._slots[index]
            if slot is _EMPTY or slot is _DELETED:
                if slot is _EMPTY:
                    self._used += 1  # reusing a tombstone consumes nothing new
                self._slots[index] = item
                self._live += 1
                return

    def add(self, item: T) -> None:
        if item in self:
            return
        self._place(item)
        if self._used > self.MAX_LOAD * len(self._slots):
            self._rehash()

    def discard(self, item: T) -> None:
        index = self._find(item)
        if index >= 0:
            self._slots[index] = _DELETED  # never _EMPTY: that would cut the run in two
            self._live -= 1

    def _rehash(self) -> None:
        """Rebuild the table without tombstones; double it only if the live items need the room."""
        items = list(self)
        capacity = len(self._slots)
        if self._live > self.MAX_LOAD * capacity / 2:
            capacity *= 2
        self._slots = [_EMPTY] * capacity
        self._live = self._used = 0
        for item in items:
            self._place(item)

    def __contains__(self, item: object) -> bool:
        return self._find(item) >= 0

    def __iter__(self) -> Iterator[T]:
        for slot in self._slots:
            if slot is not _EMPTY and slot is not _DELETED:
                yield slot

    def __len__(self) -> int:
        return self._live

    def __repr__(self) -> str:
        return f"ProbingSet({list(self)!r})"

    def layout(self) -> str:
        """Show the slots: '.' is empty, 'x' is a tombstone, anything else is an item."""
        shown = ("." if slot is _EMPTY else "x" if slot is _DELETED else repr(slot) for slot in self._slots)
        return " ".join(shown)


if __name__ == "__main__":
    s = ProbingSet([3, 11, 19])  # 3, 11 and 19 all have home slot 3
    print(s.layout())
    s.add(4)  # its home slot 4 is taken, so it joins the cluster
    print(s.layout())
    s.discard(11)
    print(s.layout(), 19 in s, 11 in s)  # 19 is found by walking past the tombstone
    s.add(27)  # home slot 3: the first free slot is the tombstone
    print(s.layout())
    s.add(5)  # the fifth item passes 60% load: rehash into 16 slots
    print(s.capacity, s.layout())

    churn = ProbingSet()
    for n in range(100):
        churn.add(n)
        churn.discard(n)
    print(len(churn), churn.capacity)  # tombstones were cleaned up, not piled up

    print(sorted(s | ProbingSet([100, 5])), sorted(s & {3, 4, 99}), s <= ProbingSet(range(30)))
    try:
        s.remove(99)
    except KeyError as error:
        print("KeyError:", error)
`,
      output: `. . . 3 11 19 . .
. . . 3 11 19 4 .
. . . 3 x 19 4 . True False
. . . 3 27 19 4 .
16 . . . 3 19 4 5 . . . . 27 . . . .
0 8
[3, 4, 5, 19, 27, 100] [3, 4] True
KeyError: 99`,
      bestPractices: [
        "Inherit from collections.abc.MutableSet and implement only __contains__, __iter__, __len__, add and discard. remove, pop, clear, |, &, -, ^, <= and isdisjoint come free, and a | b builds a new ProbingSet because the constructor accepts an iterable.",
        "Use unique sentinels (_EMPTY = object(), _DELETED = object()) and compare them with is. A None sentinel would collide with a stored None, while an object() can never equal a caller's item.",
        "Write the probe order once, as a generator (_probe) that yields each slot index exactly once. _find and _place share it, and the range over the capacity bounds the walk so a search always ends.",
        "Separate \"is it there?\" (_find, read only) from \"where does it go?\" (_place). add can then check for a duplicate first and never store an item twice.",
        "Track two counters and document them: _live drives len(), while the load limit tests _used (items plus tombstones), because tombstones lengthen runs exactly as items do.",
        "Provide a debugging view. layout() joins a generator expression into one string, which makes slots, clusters and tombstones visible, and it is how the demo shows the structure rather than just asserting it."
      ],
      pitfalls: [
        "Setting a slot back to empty on delete. The run is cut in two and every item stored past that slot becomes unreachable (in the demo 19 would vanish). Mark the slot as a tombstone instead.",
        "Letting tombstones pile up. They count toward the load but not toward len(), so a loop of add and discard with fresh keys slowly fills the array with tombstones until searches for absent items walk the whole table. Rebuild when used slots pass the limit, not when live items do.",
        "Probing without a bound. If the table ever has no never-used slot, a loop that waits for an empty slot never ends. Bound the walk by the capacity, as _probe does, and keep free slots by capping the load.",
        "Placing a new item in the first tombstone you meet before searching the whole run. The item may already be stored later in the same run, and you have just created a duplicate. Search for the item first, then pick a slot."
      ],
      useWhen: [
        "You must reason about dict and set internals: why they need spare room, why lookups slow down as they fill, and what a resize costs.",
        "Memory or cache locality matters more than the simplest code: one flat array of slots beats a list object per bucket.",
        "An interview asks for a hash map without chaining, with deletes, or asks you to explain tombstones and load factor."
      ],
      inPractice: "Use dict and set, which are open-addressing tables written in C: they resize near two thirds load, probe with a perturbed sequence instead of plain +1 and, for dict, keep a compact insertion-ordered entries array. Python offers no hook to change how they probe. Hand-roll open addressing to learn, for a fixed-size table with special needs (like the challenge's IntSet), or in a language without a built-in hash table. If you need keys in sorted order, use a balanced tree or a sorted list instead.",
      challenge: {
        prompt: "Write IntSet, a fixed-size set of integers that uses open addressing with linear probing. Do not use set or dict. IntSet(capacity) creates capacity slots and raises ValueError if capacity < 1. The home slot of an item is item % capacity; if it is taken, try the next slot, wrapping from the last slot to slot 0. The table never resizes. add(item) returns True if it inserted the item and False if the item was already present; if the item is new and no slot can hold it, raise ValueError(\"table is full\"). discard(item) returns True if it removed the item and False if it was absent. Deleting must not hide items stored further along the same run, and a deleted slot must be reusable by later adds. Also support \"item in s\" and len(s). A lookup must stop after probing every slot at most once, so searching a completely full table terminates. Do not scan the whole table for an item that sits near its home slot: the checks use 60,000 slots.",
        hint: "Probe with (item + step) % capacity for step in range(capacity): that visits every slot once, starting at the home slot and wrapping around. A lookup stops at a slot holding None (never used), skips the _DELETED tombstone, and gives up after capacity steps. add searches for the item first; only when it is absent does it take the first slot that is None or _DELETED.",
        starter: py`
_DELETED = object()  # marks a tombstone: a deleted slot a probe must walk past


class IntSet:
    """A fixed-size set of ints: one flat array, linear probing, tombstones."""

    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self._slots = [None] * capacity  # None means never used
        self._size = 0

    def add(self, item):
        """Return True if item was inserted, False if it was already present."""
        # TODO: probe from item % capacity; raise ValueError("table is full") if nothing fits
        raise NotImplementedError

    def discard(self, item):
        """Return True if item was removed, False if it was absent."""
        raise NotImplementedError

    def __contains__(self, item):
        raise NotImplementedError

    def __len__(self):
        return self._size
`,
        solution: py`
_DELETED = object()  # marks a tombstone: a deleted slot a probe must walk past


class IntSet:
    """A fixed-size set of ints: one flat array, linear probing, tombstones."""

    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self._slots = [None] * capacity  # None means never used
        self._size = 0

    def _probe(self, item):
        """Yield each slot index at most once, starting at the home slot."""
        capacity = len(self._slots)
        for step in range(capacity):
            yield (item + step) % capacity

    def _find(self, item):
        for index in self._probe(item):
            slot = self._slots[index]
            if slot is None:
                return -1  # never-used slot: the run ends, item is absent
            if slot == item:  # a tombstone never equals an int, so it is skipped
                return index
        return -1

    def add(self, item):
        if self._find(item) >= 0:
            return False
        for index in self._probe(item):
            if self._slots[index] is None or self._slots[index] is _DELETED:
                self._slots[index] = item
                self._size += 1
                return True
        raise ValueError("table is full")

    def discard(self, item):
        index = self._find(item)
        if index < 0:
            return False
        self._slots[index] = _DELETED
        self._size -= 1
        return True

    def __contains__(self, item):
        return self._find(item) >= 0

    def __len__(self):
        return self._size
`,
        tests: py`
@check("add reports new items, ignores duplicates, handles negatives")
def _():
    s = IntSet(8)
    eq(s.add(3), True)
    eq(s.add(3), False)
    eq(s.add(-1), True)  # -1 % 8 is 7
    eq(len(s), 2)
    eq((3 in s, -1 in s, 4 in s), (True, True, False))
    raises(ValueError, IntSet, 0)

@check("probing wraps around from the last slot to slot 0")
def _():
    s = IntSet(8)
    for item in (7, 15, 23, 0):  # 7 -> slot 7, 15 -> slot 0, 23 -> slot 1, 0 -> slot 2
        eq(s.add(item), True)
    eq(len(s), 4)
    for item in (7, 15, 23, 0):
        eq(item in s, True)
    eq(31 in s, False)

@check("a deleted slot does not hide items stored further along the run")
def _():
    s = IntSet(8)
    for item in (0, 8, 16):  # all have home slot 0
        s.add(item)
    eq(s.discard(0), True)
    eq(8 in s, True)
    eq(16 in s, True)
    eq(0 in s, False)
    eq(s.discard(0), False)
    eq(s.discard(8), True)
    eq(16 in s, True)
    eq(len(s), 1)

@check("re-adding an item after a delete never stores it twice")
def _():
    s = IntSet(8)
    s.add(0)
    s.add(8)
    s.discard(0)
    eq(s.add(8), False)
    eq(len(s), 1)
    eq(s.add(0), True)
    eq(len(s), 2)
    eq(s.discard(8), True)
    eq(s.discard(8), False)
    eq(0 in s, True)

@check("deleted slots are reused, so add/discard churn never fills the table")
def _():
    s = IntSet(4)
    for item in range(1000):
        eq(s.add(item), True)
        eq(item in s, True)
        eq(s.discard(item), True)
    eq(len(s), 0)
    eq(5000 in s, False)

@check("a full table raises ValueError on a new item and still answers lookups")
def _():
    s = IntSet(4)
    for item in range(4):
        s.add(item)
    raises(ValueError, s.add, 4)
    eq(s.add(2), False)
    eq(9 in s, False)
    eq(len(s), 4)
    eq(s.discard(1), True)
    eq(s.add(5), True)  # home slot 1 holds a tombstone, which is reusable
    eq((5 in s, 1 in s, len(s)), (True, False, 4))
    raises(ValueError, s.add, 6)

@check("30,000 adds, lookups and discards in 60,000 slots stay fast")
def _():
    s = IntSet(60_000)
    keys = [(i * 7919) % 1_000_003 for i in range(30_000)]
    for key in keys:
        eq(s.add(key), True)
    eq(len(s), 30_000)
    eq(all(key in s for key in keys), True)
    eq(sum(1 for i in range(30_000, 60_000) if (i * 7919) % 1_000_003 in s), 0)
    for key in keys[::2]:
        eq(s.discard(key), True)
    eq(len(s), 15_000)
    eq(all(key in s for key in keys[1::2]), True)
`
      },
      practice: ["Arrays & Hashing"],
      source: "https://en.wikipedia.org/wiki/Open_addressing"
    },
    {
      id: "lru-cache",
      title: "LRU cache",
      kind: "structure",
      summary: "A cache with a fixed size that throws away the entry used least recently when it is full. A hash table plus a doubly linked list makes get, put and eviction all O(1).",
      concepts: [
        "A cache keeps a bounded number of entries. When it is full, an LRU cache evicts the entry that was used longest ago, betting that recent use predicts future use. Reading an entry and writing an entry both count as a use.",
        "The hard part is doing every operation in O(1). A dict finds a key in O(1) but knows nothing about recency. A list ordered by recency knows the oldest entry, but finding or moving an entry in it costs O(n). The cache combines them: the dict maps key -> node, and the nodes sit in a linked list ordered from most to least recently used.",
        "A doubly linked list can remove a node in O(1) when you already hold it, because the node knows both neighbours (a singly linked list would need the predecessor). The dict hands you the node, so \"mark as used\" is unlink plus push to the front. Eviction takes the node just before the tail, and removes its key from the dict, which is why each node stores its own key.",
        "Two sentinel nodes, head and tail, hold no data and remove every edge case. The list is never empty at either end, so _unlink and _push_front are the same four pointer assignments for the first, a middle and the last entry.",
        "Decide what counts as a use and be consistent. Here get, [] and put refresh an entry, while in, len and iteration do not, so you can inspect the cache without disturbing the order that decides what is evicted next."
      ],
      complexity: [
        { operation: "get / [] / put (including eviction)", time: "O(1) expected", note: "the dict lookup is O(1) on average; every list change is a fixed number of pointer assignments" },
        { operation: "del cache[key]", time: "O(1) expected", note: "dict.pop plus an unlink" },
        { operation: "in / len", time: "O(1) expected", note: "neither refreshes recency" },
        { operation: "iterate / items / repr", time: "O(n)", note: "walks the list from most to least recently used" }
      ],
      space: "O(capacity): one node per entry plus the dict, and never more than capacity entries.",
      code: py`
from __future__ import annotations

from collections.abc import Hashable, Iterator
from functools import lru_cache
from typing import Any, Generic, TypeVar

K = TypeVar("K", bound=Hashable)
V = TypeVar("V")


class _Node:
    """One cache entry. The two sentinels reuse this class with key and value None."""

    __slots__ = ("key", "value", "prev", "next")

    def __init__(self, key: Any = None, value: Any = None) -> None:
        self.key = key
        self.value = value
        self.prev: _Node = self  # a lone node points at itself, so no link is ever None
        self.next: _Node = self


class LRUCache(Generic[K, V]):
    """A cache that keeps at most capacity entries and evicts the least recently used.

    Invariant: _index maps each cached key to its node, and the nodes form a
    doubly linked list between two sentinels, most recently used first. The
    dict finds a node in O(1) and the list moves it in O(1), so get, set,
    delete and eviction are all O(1). get and set count as a use; "in", len
    and iteration do not.
    """

    __slots__ = ("_capacity", "_index", "_head", "_tail")

    def __init__(self, capacity: int) -> None:
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self._capacity = capacity
        self._index: dict[K, _Node] = {}
        self._head = _Node()  # sentinel: _head.next is the most recently used entry
        self._tail = _Node()  # sentinel: _tail.prev is the least recently used entry
        self._head.next = self._tail
        self._tail.prev = self._head

    def _unlink(self, node: _Node) -> None:
        node.prev.next = node.next
        node.next.prev = node.prev

    def _push_front(self, node: _Node) -> None:
        node.prev = self._head
        node.next = self._head.next
        self._head.next.prev = node
        self._head.next = node

    def __getitem__(self, key: K) -> V:
        """Return the value and mark the entry most recently used; KeyError if absent."""
        node = self._index[key]
        self._unlink(node)
        self._push_front(node)
        return node.value

    def get(self, key: K, default: V | None = None) -> V | None:
        """Like dict.get: the default for a missing key. A hit counts as a use."""
        try:
            return self[key]
        except KeyError:
            return default

    def __setitem__(self, key: K, value: V) -> None:
        node = self._index.get(key)
        if node is not None:  # existing key: update in place, never evict
            node.value = value
            self._unlink(node)
        else:
            if len(self._index) == self._capacity:
                oldest = self._tail.prev
                self._unlink(oldest)
                del self._index[oldest.key]  # the node stores its key for exactly this
            node = _Node(key, value)
            self._index[key] = node
        self._push_front(node)

    def __delitem__(self, key: K) -> None:
        self._unlink(self._index.pop(key))  # pop raises KeyError for a missing key

    def __contains__(self, key: object) -> bool:
        return key in self._index  # a membership test is not a use

    def __len__(self) -> int:
        return len(self._index)

    def items(self) -> Iterator[tuple[K, V]]:
        """Yield (key, value) pairs from most to least recently used, without refreshing them."""
        node = self._head.next
        while node is not self._tail:
            yield node.key, node.value
            node = node.next

    def __iter__(self) -> Iterator[K]:
        for key, _ in self.items():
            yield key

    def __repr__(self) -> str:
        return f"LRUCache(capacity={self._capacity}, items={list(self.items())!r})"


@lru_cache(maxsize=2)  # the standard-library version, for memoizing a function
def square(n: int) -> int:
    return n * n


if __name__ == "__main__":
    cache: LRUCache[str, int] = LRUCache(2)
    cache["a"] = 1
    cache["b"] = 2
    print(cache)
    print(cache.get("a"), list(cache))  # reading "a" made it the most recent
    cache["c"] = 3  # full: evicts "b", the least recently used
    print(list(cache), "b" in cache, cache.get("b", "miss"))
    print("a" in cache, list(cache))  # asking does not refresh "a"...
    cache["d"] = 4
    print(list(cache))  # ...so "a" is the next to go
    cache["c"] = 30  # overwriting refreshes and never evicts
    del cache["d"]
    print(len(cache), cache)
    try:
        print(cache["zzz"])
    except KeyError as error:
        print("KeyError:", error)
    print([square(n) for n in (2, 3, 2, 4)], square.cache_info())
`,
      output: `LRUCache(capacity=2, items=[('b', 2), ('a', 1)])
1 ['a', 'b']
['c', 'a'] False miss
True ['c', 'a']
['d', 'c']
1 LRUCache(capacity=2, items=[('c', 30)])
KeyError: 'zzz'
[4, 9, 4, 16] CacheInfo(hits=1, misses=3, maxsize=2, currsize=2)`,
      bestPractices: [
        "Treat dict and list as one invariant: every key in _index has exactly one node in the list and vice versa. Each mutating method (__setitem__, __delitem__) updates both, so the two structures cannot drift apart.",
        "Use sentinel head and tail nodes, and let a lone node point at itself. No link is ever None, so _unlink and _push_front need no if statements and work for the first, middle and last entry alike.",
        "Give _Node __slots__. A cache may hold millions of nodes, and dropping the per-instance __dict__ saves a large share of the memory. Nodes store their key because eviction only holds the node but must delete the dict entry.",
        "Follow the container protocol: [] and []= and del for dict-style use, get with a default exactly like dict.get, __contains__, __len__, a lazy __iter__ from most to least recent, and a __repr__ that shows that order.",
        "Make the side effects explicit and cheap to test. __contains__ is deliberately not a use, and the docstring says so, so inspecting the cache never changes which entry is evicted next.",
        "In production reach for collections.OrderedDict (move_to_end and popitem(last=False)) or functools.lru_cache, which do the same bookkeeping in C. The demo ends with the lru_cache version of a memoized function."
      ],
      pitfalls: [
        "Forgetting to refresh on an update. put(existing_key, value) must move the entry to the front, otherwise a key you just wrote can be the next one evicted.",
        "Evicting before looking the key up. When the cache is full and put is called with a key that is already cached, nothing may be evicted. Check for the key first and evict only for a genuinely new key.",
        "Leaving one structure behind. If eviction removes the list node but not the dict entry (or the reverse), len() is wrong and the stale key either leaks memory or points at a node that is no longer in the list.",
        "Reading entries while iterating. Every get moves its node, which changes node.next under the generator, so \"for key in cache: cache.get(key)\" can bounce between two entries forever. Iterate over list(cache) when you need to read as you go."
      ],
      useWhen: [
        "The same expensive results are requested repeatedly with a skewed pattern: database rows, API responses, rendered pages, memoized function results.",
        "Memory is bounded and recent use predicts future use, as in browser caches, page caches and DNS caches.",
        "An interview asks for get and put in O(1) with eviction (LeetCode 146), the classic hash table plus doubly linked list design."
      ],
      inPractice: "To memoize a function use functools.lru_cache (functools.cache when it need not be bounded): it is written in C and exposes cache_info() and cache_clear(). Put it on methods with care, because the cache keeps self alive. For a cache object, collections.OrderedDict does the same job in about ten lines: call move_to_end(key) on every access and popitem(last=False) when the size exceeds capacity. Hand-roll the dict plus linked list when you need custom eviction hooks or per-entry metadata, and when an interviewer wants to see it.",
      challenge: {
        prompt: "Write an LRUCache class for integer values. LRUCache(capacity) raises ValueError if capacity < 1. get(key) returns the value, or -1 if the key is absent, and marks the key most recently used. put(key, value) stores the value and marks the key most recently used; if the key is new and the cache already holds capacity entries, first evict the least recently used entry (updating an existing key never evicts anything). peek(key) returns the value or -1 without changing the recency order. keys() returns a list of the keys from most recently used to least recently used. len(cache) is the number of entries. Every operation must be O(1): the checks fill a cache with 40,000 entries and then run 100,000 more operations, which a list that is searched on every access cannot finish in time.",
        hint: "collections.OrderedDict remembers insertion order and has move_to_end(key) and popitem(last=False), which is all the bookkeeping you need: keep the least recently used key first and the most recent last. get and put call move_to_end for a key that exists, and put calls popitem(last=False) before inserting a new key into a full cache. keys() is list(reversed(the ordered dict)). Alternatively write the dict plus doubly linked list from the lesson.",
        starter: py`
class LRUCache:
    """A cache of at most capacity entries that evicts the least recently used one."""

    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self._capacity = capacity
        # TODO: keep the entries in an order that makes both lookup and eviction O(1)

    def get(self, key):
        """Return the value (and mark key most recently used), or -1 if absent."""
        raise NotImplementedError

    def put(self, key, value):
        """Store value and mark key most recently used, evicting the oldest entry if needed."""
        raise NotImplementedError

    def peek(self, key):
        """Return the value or -1 without changing the recency order."""
        raise NotImplementedError

    def keys(self):
        """Return the keys as a list, most recently used first."""
        raise NotImplementedError

    def __len__(self):
        raise NotImplementedError
`,
        solution: py`
from collections import OrderedDict


class LRUCache:
    """A cache of at most capacity entries that evicts the least recently used one."""

    def __init__(self, capacity):
        if capacity < 1:
            raise ValueError("capacity must be at least 1")
        self._capacity = capacity
        self._entries = OrderedDict()  # least recently used first, most recent last

    def get(self, key):
        if key not in self._entries:
            return -1
        self._entries.move_to_end(key)
        return self._entries[key]

    def put(self, key, value):
        if key in self._entries:
            self._entries.move_to_end(key)
        elif len(self._entries) == self._capacity:
            self._entries.popitem(last=False)  # evict the oldest entry
        self._entries[key] = value

    def peek(self, key):
        return self._entries.get(key, -1)

    def keys(self):
        return list(reversed(self._entries))

    def __len__(self):
        return len(self._entries)
`,
        tests: py`
from collections import OrderedDict

@check("get returns stored values, -1 on a miss, and zero is a real value")
def _():
    cache = LRUCache(3)
    cache.put(1, 10)
    cache.put(2, 0)
    eq(cache.get(1), 10)
    eq(cache.get(2), 0)
    eq(cache.get(3), -1)
    eq(len(cache), 2)

@check("evicts the least recently used entry when full")
def _():
    cache = LRUCache(2)
    cache.put(1, 10)
    cache.put(2, 20)
    cache.put(3, 30)
    eq(cache.get(1), -1)
    eq(cache.get(2), 20)
    eq(cache.get(3), 30)
    eq(cache.keys(), [3, 2])
    eq(len(cache), 2)

@check("get refreshes recency")
def _():
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    eq(cache.get(1), 1)
    cache.put(3, 3)
    eq(cache.get(2), -1)
    eq(cache.keys(), [3, 1])

@check("updating an existing key refreshes it and never evicts")
def _():
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    cache.put(1, 100)
    eq(len(cache), 2)
    eq(cache.keys(), [1, 2])
    cache.put(3, 3)
    eq(cache.get(2), -1)
    eq(cache.get(1), 100)

@check("peek reads without refreshing")
def _():
    cache = LRUCache(2)
    cache.put(1, 1)
    cache.put(2, 2)
    eq(cache.peek(1), 1)
    eq(cache.peek(9), -1)
    eq(cache.keys(), [2, 1])
    cache.put(3, 3)
    eq(cache.get(1), -1)
    eq(cache.keys(), [3, 2])

@check("capacity 1 works and capacity below 1 raises ValueError")
def _():
    cache = LRUCache(1)
    cache.put(1, 1)
    cache.put(2, 2)
    eq(cache.get(1), -1)
    eq(cache.get(2), 2)
    eq(len(cache), 1)
    raises(ValueError, LRUCache, 0)

@check("140,000 operations on 40,000 entries stay fast (everything O(1))")
def _():
    cache = LRUCache(40_000)
    reference = OrderedDict()

    def put(key, value):
        if key in reference:
            reference.move_to_end(key)
        elif len(reference) == 40_000:
            reference.popitem(last=False)
        reference[key] = value
        cache.put(key, value)

    def get(key):
        expected = reference.get(key, -1)
        if key in reference:
            reference.move_to_end(key)
        eq(cache.get(key), expected)

    for i in range(40_000):
        put(100_000 + i, i % 1000)  # fill the cache with cold keys
    for i in range(100_000):
        if i % 4 == 0:
            put(200_000 + i, i % 1000)  # a new cold key evicts the oldest entry
        elif i % 2:
            get((i * 13) % 3_000)  # reads of a hot set of 3,000 keys
        else:
            put((i * 13) % 3_000, i % 1000)
    eq(len(cache), 40_000)
    eq(cache.keys(), list(reversed(reference)))
`
      },
      practice: ["Linked List", "Arrays & Hashing"],
      source: "https://docs.python.org/3/library/functools.html#functools.lru_cache"
    }
  ],
};
