import type { DsGuide } from "../types";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const HASHING_GUIDES: Record<string, DsGuide> = {
  "hash-table-chaining": {
    level: "Beginner",
    analogy: "Think of a cloakroom with a row of numbered hooks. To pick a hook you turn the guest's name into a number and use that hook. Two guests can land on the same hook, so each hook can hold a short pile of coats. To find a coat you never search the whole room, only the one pile on that guest's hook.",
    explain: [
      "A hash table stores key → value pairs (like a phone book: name → number) so that you can find a value from its key almost instantly. Python's `dict` and `set` are hash tables.",
      "The trick is a **hash function**: a function that turns any key into a number. We take that number modulo the number of buckets (`hash(key) % size`) to get a bucket index. The same key always gives the same index, so we always know exactly where to look.",
      "Different keys can land in the same bucket. This is called a **collision**, and it is normal. With **chaining**, each bucket is just a small list, and colliding keys sit side by side in it. To look up a key, we jump to its bucket and walk the few items in that one list.",
      "To stay fast, the lists must stay short. We track the **load factor** = items ÷ buckets. When it gets above 1 (more items than buckets), we make a bigger table, twice the size, and re-insert every item. Every key moves, because `% size` gives new answers for the new size. Resizing is slow when it happens but rare, so on average each insert is still O(1).",
      "So the promise is: get, put and delete are O(1) on average. The worst case, where every key lands in one bucket, is O(n), but a decent hash function plus resizing makes that practically never happen.",
    ],
    simpleCode: py`
# A tiny hash table using "separate chaining": every bucket is a list of [key, value] pairs.

def simple_hash(text):
    # Turn a string into a number. (Python's own hash() of a string changes
    # every run, so we use our own to get the same output every time.)
    total = 0
    for ch in text:
        total = total * 31 + ord(ch)
    return total


class HashTable:
    def __init__(self, size=4):
        self.buckets = [[] for _ in range(size)]  # 4 empty buckets
        self.count = 0                             # how many keys are stored

    def _index(self, key):
        return simple_hash(key) % len(self.buckets)  # which bucket this key belongs in

    def put(self, key, value):
        bucket = self.buckets[self._index(key)]
        for pair in bucket:
            if pair[0] == key:        # key already here: just update the value
                pair[1] = value
                return
        bucket.append([key, value])    # new key: add it to the end of the bucket
        self.count += 1
        if self.count > len(self.buckets):  # load factor above 1: too crowded
            self._grow()

    def get(self, key):
        bucket = self.buckets[self._index(key)]
        for k, v in bucket:            # only search ONE short bucket, not everything
            if k == key:
                return v
        return None                    # not found

    def _grow(self):
        old_pairs = [pair for bucket in self.buckets for pair in bucket]
        self.buckets = [[] for _ in range(len(self.buckets) * 2)]  # twice as many buckets
        self.count = 0
        for key, value in old_pairs:   # every key must be re-placed: % size changed
            self.put(key, value)

    def show(self):
        for i, bucket in enumerate(self.buckets):
            print(f"  bucket {i}: {bucket}")


table = HashTable()
for name, age in [("ann", 31), ("bob", 25), ("cat", 40), ("eve", 22)]:
    print(f"put {name!r} -> bucket {table._index(name)}")
    table.put(name, age)
table.show()
print("get('bob') =", table.get("bob"), "| get('zed') =", table.get("zed"))

table.put("dan", 19)      # 5 items in 4 buckets -> the table grows to 8
print("after adding 'dan' the table grew to", len(table.buckets), "buckets:")
table.show()
`,
    simpleOutput: `put 'ann' -> bucket 1
put 'bob' -> bucket 1
put 'cat' -> bucket 2
put 'eve' -> bucket 0
  bucket 0: [['eve', 22]]
  bucket 1: [['ann', 31], ['bob', 25]]
  bucket 2: [['cat', 40]]
  bucket 3: []
get('bob') = 25 | get('zed') = None
after adding 'dan' the table grew to 8 buckets:
  bucket 0: []
  bucket 1: [['ann', 31], ['dan', 19]]
  bucket 2: []
  bucket 3: []
  bucket 4: [['eve', 22]]
  bucket 5: [['bob', 25]]
  bucket 6: [['cat', 40]]
  bucket 7: []`,
    codeNotes: [
      "`simple_hash` turns a name into a big number by mixing in each character. Any function works, as long as the same key always gives the same number.",
      "`self.buckets` is a list of lists. Bucket `i` holds every `[key, value]` pair whose hash ends up at index `i`.",
      "`_index` is the heart of the table: `simple_hash(key) % len(self.buckets)` always gives a number between `0` and `size - 1`, so it is a valid bucket index.",
      "`put` first checks whether the key is already in its bucket and updates it. That is why a dict never holds the same key twice. Otherwise it appends the pair and grows the table when `count > len(buckets)`.",
      "`get` searches only one bucket. When buckets hold one or two items, that is a constant amount of work no matter how big the table is.",
      "`_grow` doubles the number of buckets and re-inserts everything. Look at the output: 'ann', 'bob' and 'dan' all shared bucket 1, and after growing they spread out.",
    ],
    takeaways: [
      "Hash table = an array of buckets + a hash function that picks the bucket.",
      "Collisions are normal; chaining keeps colliding keys in a small list.",
      "Grow (double and re-insert) when load factor gets high, so buckets stay short.",
      "Average O(1) get/put/delete. Keys must be hashable and must not change.",
    ],
  },

  "hash-table-open-addressing": {
    level: "Intermediate",
    analogy: "Picture a car park with numbered spaces. Your ticket says 'park in space 5'. If space 5 is taken, you drive to 6, then 7, until you find a free one. To find your car later you start at 5 and walk forward the same way. If a car leaves, you can't just mark the space empty, or people who parked further along would stop searching too early. Instead you put up a 'was used' cone.",
    explain: [
      "Open addressing is a second way to handle collisions. Instead of a list per bucket, the table is one flat array of **slots**, and every slot holds at most one key. When a key's home slot is taken, we **probe**: we try the next slot, then the next (`(index + 1) % size`), until we find a free one. This simplest probing rule is called **linear probing**.",
      "Lookups follow the exact same path: start at the home slot and walk forward. If we meet the key, found. If we reach a truly **empty** slot, the key cannot be further along (it would have been placed here), so it is not in the table.",
      "Deleting is the tricky part. If we simply emptied a slot, a later search would stop at that hole and miss keys that probed past it. So we leave a **tombstone**: a marker that means 'deleted, but keep searching'. Inserts may reuse tombstone slots.",
      "Because every key lives inside the array itself, open addressing must never get full: the load factor (filled ÷ size) is kept below about 2/3. Above that, probe runs get long, so we resize and re-insert. Python's own `dict` uses open addressing (with a smarter probe order than +1).",
    ],
    simpleCode: py`
# Open addressing with linear probing: one key per slot, collisions walk to the next slot.

EMPTY = None
DELETED = "<deleted>"   # tombstone: "something was here, keep searching"


def simple_hash(text):
    total = 0
    for ch in text:
        total = total * 31 + ord(ch)
    return total


class ProbingTable:
    def __init__(self, size=8):
        self.keys = [EMPTY] * size
        self.values = [EMPTY] * size

    def _probe(self, key):
        """Yield slot indexes to try: home slot, then home+1, home+2, ... (wrapping around)."""
        home = simple_hash(key) % len(self.keys)
        for step in range(len(self.keys)):
            yield (home + step) % len(self.keys)

    def put(self, key, value):
        for i in self._probe(key):
            if self.keys[i] in (EMPTY, DELETED) or self.keys[i] == key:
                self.keys[i] = key
                self.values[i] = value
                return i                     # report where it landed
        raise RuntimeError("table is full")  # a real table resizes long before this

    def get(self, key):
        for i in self._probe(key):
            if self.keys[i] is EMPTY:        # a truly empty slot ends the search
                return None
            if self.keys[i] == key:          # tombstones are skipped, not stopped at
                return self.values[i]
        return None

    def delete(self, key):
        for i in self._probe(key):
            if self.keys[i] is EMPTY:
                return False
            if self.keys[i] == key:
                self.keys[i] = DELETED       # leave a tombstone, NOT an empty slot
                self.values[i] = EMPTY
                return True
        return False


table = ProbingTable()
for name in ["ann", "dan", "bob", "amy", "cat"]:
    home = simple_hash(name) % 8
    print(f"put {name!r}: home slot {home}, landed in slot {table.put(name, len(name))}")
print("slots:", table.keys)

table.delete("ann")
print("after deleting 'ann':", table.keys)
print("get('dan') =", table.get("dan"), "(found by walking past the tombstone)")
print("get('zed') =", table.get("zed"))
`,
    simpleOutput: `put 'ann': home slot 1, landed in slot 1
put 'dan': home slot 1, landed in slot 2
put 'bob': home slot 5, landed in slot 5
put 'amy': home slot 5, landed in slot 6
put 'cat': home slot 6, landed in slot 7
slots: [None, 'ann', 'dan', None, None, 'bob', 'amy', 'cat']
after deleting 'ann': [None, '<deleted>', 'dan', None, None, 'bob', 'amy', 'cat']
get('dan') = 3 (found by walking past the tombstone)
get('zed') = None`,
    codeNotes: [
      "Two parallel lists, `keys` and `values`, form the table. Slot `i` holds `keys[i]` and `values[i]`.",
      "`_probe` is a generator that lists the slots to try in order: the home slot first, then each next slot, wrapping around with `% size`.",
      "`put` takes the first slot that is empty, a tombstone, or already holds this key (an update). In the output, 'dan' wanted slot 1, found 'ann' there, and landed in slot 2.",
      "`get` walks the same path. It stops at `EMPTY` (the key cannot be further along) but walks straight past `DELETED`.",
      "`delete` writes the `DELETED` tombstone. If it wrote `EMPTY` instead, `get('dan')` would stop at slot 1 and wrongly report that 'dan' is missing. Try changing it and running again.",
    ],
    takeaways: [
      "One key per slot; on a collision, probe to the next slot.",
      "Search stops at an empty slot, never at a tombstone.",
      "Deletes leave tombstones so later keys stay reachable.",
      "Keep the table under about 2/3 full and resize, or probes get long.",
    ],
  },

  "lru-cache": {
    level: "Intermediate",
    analogy: "Think of a small desk that holds only 3 books, with the rest on a far-away shelf. Every time you use a book you put it on top of the pile. When the desk is full and you need a new book, the one at the bottom of the pile goes back to the shelf, because you haven't touched it for the longest time. That's the whole idea: Least Recently Used goes first.",
    explain: [
      "A **cache** is a small, fast store that keeps answers you might need again, like recent database results, so you don't have to recompute or refetch them. Because memory is limited, a cache has a **capacity**. When it is full and something new arrives, it must **evict** (throw out) one entry.",
      "LRU means: evict the entry that was **used least recently**. The bet is that what you used recently, you'll use again soon. Reading a key (`get`) and writing a key (`put`) both count as 'using' it and move it to the 'most recent' end.",
      "So the cache must do two jobs fast. (1) Find a key instantly, which is a dict's job. (2) Know the order of use, so it can tell which entry is oldest and move any entry to the 'newest' end instantly. A plain list would know the order, but moving an item out of the middle of a list is O(n).",
      "**The simple trick (in the code below):** Python dicts remember insertion order. To mark a key as 'just used', pop it and put it back, so it moves to the end. The first key in the dict is then always the least recently used, and `next(iter(cache))` gives it in O(1).",
      "**The classic interview answer** (the 'Go deeper' version) builds that order by hand. A dict maps key → node, and the nodes form a **doubly linked list** from most to least recent. Because every node knows its neighbours on both sides, it can be unlinked and moved to the front in O(1). That's the picture in the visualizer.",
    ],
    simpleCode: py`
# LRU cache using one trick: a Python dict keeps keys in the order they were inserted.
# So: the FIRST key in the dict is the least recently used, the LAST one is the most recent.

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.data = {}

    def get(self, key):
        if key not in self.data:
            return -1                       # cache miss
        value = self.data.pop(key)          # take it out...
        self.data[key] = value              # ...and put it back at the END = "most recent"
        return value

    def put(self, key, value):
        if key in self.data:
            self.data.pop(key)              # updating also counts as a use: move to the end
        elif len(self.data) == self.capacity:
            oldest = next(iter(self.data))  # the first key is the least recently used
            self.data.pop(oldest)
            print(f"   (full! evicted {oldest!r})")
        self.data[key] = value

    def order(self):
        return list(self.data)              # least recent ... most recent


cache = LRUCache(capacity=3)
cache.put("a", 1)
cache.put("b", 2)
cache.put("c", 3)
print("order (oldest -> newest):", cache.order())

print("get('a') =", cache.get("a"), "-> 'a' is now the newest:", cache.order())

print("put('d', 4):")
cache.put("d", 4)                           # full: 'b' is the oldest, so it goes
print("order:", cache.order())

print("get('b') =", cache.get("b"), "(it was evicted)")
cache.put("c", 30)                          # an update: no eviction, 'c' becomes newest
print("after put('c', 30):", cache.order(), cache.data)
`,
    simpleOutput: `order (oldest -> newest): ['a', 'b', 'c']
get('a') = 1 -> 'a' is now the newest: ['b', 'c', 'a']
put('d', 4):
   (full! evicted 'b')
order: ['c', 'a', 'd']
get('b') = -1 (it was evicted)
after put('c', 30): ['a', 'd', 'c'] {'a': 1, 'd': 4, 'c': 30}`,
    codeNotes: [
      "`self.data` is an ordinary dict. Its insertion order is our 'recency line': the first key is the oldest and the last key is the newest.",
      "`get` on a hit does `pop` and then re-inserts. That moves the key to the end, which marks it 'just used'. A miss returns -1, the usual interview convention.",
      "`put` with an existing key also moves it to the end. Updating never evicts anything.",
      "`put` with a new key into a full cache evicts `next(iter(self.data))`, the first key. That is an O(1) way to get the least recently used one.",
      "Every operation is a few dict operations, so everything is O(1). In the output, notice that reading 'a' saved it, so 'b' was evicted instead.",
    ],
    takeaways: [
      "LRU = when full, throw out whatever was used longest ago.",
      "Both get and put count as a 'use' and move the key to the newest end.",
      "Need two things in O(1): find by key (dict) + track order (ordered dict or doubly linked list).",
      "In real code use `functools.lru_cache` or `collections.OrderedDict`.",
    ],
  },
};
