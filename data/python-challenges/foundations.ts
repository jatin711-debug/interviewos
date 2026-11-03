import type { LessonChallenge } from "../python-course";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

// Auto-graded challenges for the essentials, collections, algorithm-thinking and programming modules. Key: lesson id.
export const FOUNDATION_CHALLENGES: Record<string, LessonChallenge> = {
  "values": {
    prompt: "Write parse_total(quantity, unit_price) that takes both values as text (for example \"3\" and \"2.50\"), converts them, and returns the total rounded to 2 decimal places. Return None when either value is blank or is not a valid number.",
    hint: "Strip whitespace first, then convert inside try/except ValueError. Use int() for the quantity and float() for the price.",
    starter: py`
def parse_total(quantity, unit_price):
    # Convert the text values, then multiply.
    return quantity * unit_price
`,
    solution: py`
def parse_total(quantity, unit_price):
    try:
        count = int(quantity.strip())
        price = float(unit_price.strip())
    except ValueError:
        return None
    return round(count * price, 2)
`,
    tests: py`
@check("converts text before multiplying")
def _():
    eq(parse_total("3", "2.50"), 7.5)

@check("ignores surrounding whitespace")
def _():
    eq(parse_total(" 4 ", " 1.25 "), 5.0)

@check("rounds to two decimal places")
def _():
    eq(parse_total("3", "0.1"), 0.3)

@check("returns None for invalid or blank input")
def _():
    eq(parse_total("three", "2.50"), None)
    eq(parse_total("", "2.50"), None)
    eq(parse_total("2", "abc"), None)
`,
  },
  "control-flow": {
    prompt: "Write grade_counts(scores) that returns a dict with the keys \"A\", \"B\", \"C\" and \"F\", counting how many scores fall in each band: A is 90 or more, B is at least 80 but below 90, C is at least 70 but below 80, and anything lower is F. Skip entries that are None, but count a score of 0 as an F. An empty list gives all four keys with a count of 0.",
    hint: "Test the bands from the top down with if / elif / else. Use \"is None\" to decide what to skip, because 0 is falsy too.",
    starter: py`
def grade_counts(scores):
    counts = {"A": 0, "B": 0, "C": 0, "F": 0}
    for score in scores:
        # Skip missing scores, then add one to the right band.
        pass
    return counts
`,
    solution: py`
def grade_counts(scores):
    counts = {"A": 0, "B": 0, "C": 0, "F": 0}
    for score in scores:
        if score is None:
            continue
        if score >= 90:
            counts["A"] += 1
        elif score >= 80:
            counts["B"] += 1
        elif score >= 70:
            counts["C"] += 1
        else:
            counts["F"] += 1
    return counts
`,
    tests: py`
@check("counts one score in each band")
def _():
    eq(grade_counts([95, 85, 75, 65]), {"A": 1, "B": 1, "C": 1, "F": 1})

@check("puts boundary scores in the higher band")
def _():
    eq(grade_counts([90, 89, 80, 79, 70, 69]), {"A": 1, "B": 2, "C": 2, "F": 1})

@check("skips None but counts 0 as an F")
def _():
    eq(grade_counts([None, 0, 100, None]), {"A": 1, "B": 0, "C": 0, "F": 1})

@check("returns all four keys for an empty list")
def _():
    eq(grade_counts([]), {"A": 0, "B": 0, "C": 0, "F": 0})
`,
  },
  "functions": {
    prompt: "Write with_tag(tag, tags=None) that returns a new list holding the existing tags followed by tag, without changing the list the caller passed in. When tags is omitted, start from an empty list, and separate calls must never share a list. If tag is already present, return a copy of tags without adding it again.",
    hint: "A default like tags=[] is created once and shared by every call. Default to None, and build a fresh list inside the function.",
    starter: py`
def with_tag(tag, tags=[]):
    tags.append(tag)
    return tags
`,
    solution: py`
def with_tag(tag, tags=None):
    result = list(tags) if tags is not None else []
    if tag not in result:
        result.append(tag)
    return result
`,
    tests: py`
@check("appends the tag after the existing tags")
def _():
    eq(with_tag("dsa", ["python"]), ["python", "dsa"])

@check("leaves the caller's list unchanged")
def _():
    tags = ["python"]
    result = with_tag("dsa", tags)
    eq(tags, ["python"], "the caller's list was modified")
    assert result is not tags, "returned the caller's list instead of a new one"

@check("starts a fresh list on every call without tags")
def _():
    first = with_tag("a")
    second = with_tag("b")
    eq(first, ["a"])
    eq(second, ["b"])

@check("returns a copy without duplicating an existing tag")
def _():
    tags = ["python", "dsa"]
    result = with_tag("python", tags)
    eq(result, ["python", "dsa"])
    assert result is not tags, "return a copy even when nothing is added"
`,
  },
  "comprehensions": {
    prompt: "Write wall_cells(grid) where grid is a list of equal-length strings and \"#\" marks a wall. Return a list of (row, column) tuples for every wall, ordered row by row and left to right within a row. Any other character is open space, and a grid that is empty or has no walls gives [].",
    hint: "One list comprehension can have two for clauses. enumerate gives you the index and the value at the same time.",
    starter: py`
def wall_cells(grid):
    # Return (row, column) for every "#" in the grid.
    return []
`,
    solution: py`
def wall_cells(grid):
    return [(row, col) for row, line in enumerate(grid) for col, cell in enumerate(line) if cell == "#"]
`,
    tests: py`
@check("finds walls row by row, left to right")
def _():
    eq(wall_cells(["#.#", "...", ".#."]), [(0, 0), (0, 2), (2, 1)])

@check("treats every other character as open space")
def _():
    eq(wall_cells(["a#b", "#  "]), [(0, 1), (1, 0)])

@check("handles a single row and a grid full of walls")
def _():
    eq(wall_cells(["..##"]), [(0, 2), (0, 3)])
    eq(wall_cells(["##", "##"]), [(0, 0), (0, 1), (1, 0), (1, 1)])

@check("returns [] for an empty grid or a grid without walls")
def _():
    eq(wall_cells([]), [])
    eq(wall_cells(["...", "..."]), [])
`,
  },
  "strings": {
    prompt: "Write slugify(title) that turns a title into a URL slug. Lowercase it with casefold(), drop every character that isn't a letter, digit or whitespace, and join the remaining words with single hyphens. Letters from any language are kept, and a title with nothing left gives an empty string.",
    hint: "str.isalnum() and str.isspace() decide what to keep. split() with no arguments ignores runs of whitespace, so \"-\".join() never sees an empty word.",
    starter: py`
def slugify(title):
    # Clean the text, then join the words with "-".
    return title.lower().replace(" ", "-")
`,
    solution: py`
def slugify(title):
    kept = "".join(char for char in title.casefold() if char.isalnum() or char.isspace())
    return "-".join(kept.split())
`,
    tests: py`
@check("joins lowercase words with hyphens")
def _():
    eq(slugify("Learn Python Fast"), "learn-python-fast")

@check("drops punctuation and collapses whitespace")
def _():
    eq(slugify("  Hello,   World!  "), "hello-world")
    eq(slugify("Rock & Roll"), "rock-roll")
    eq(slugify("Python 3.12\tTips"), "python-312-tips")

@check("keeps letters from any language and casefolds them")
def _():
    eq(slugify("Straße Café"), "strasse-café")

@check("returns an empty string when nothing is left")
def _():
    eq(slugify(""), "")
    eq(slugify("  ?!  "), "")
`,
  },
  "lists": {
    prompt: "Write rotate(items, k) that returns a new list with the items shifted k places to the right, so rotate([1, 2, 3, 4], 1) gives [4, 1, 2, 3]. A negative k shifts to the left, and k may be larger than the list. The original list must not change, and the result is always a new list, even when k is 0. An empty list gives an empty list.",
    hint: "Reduce k with % len(items) first, and guard the empty list before you do. Then two slices joined with + make the rotated copy.",
    starter: py`
def rotate(items, k):
    # Build the rotated list from slices.
    return items
`,
    solution: py`
def rotate(items, k):
    if not items:
        return []
    k %= len(items)
    return items[-k:] + items[:-k]
`,
    tests: py`
@check("shifts items to the right by k")
def _():
    eq(rotate([1, 2, 3, 4], 1), [4, 1, 2, 3])
    eq(rotate([1, 2, 3, 4], 3), [2, 3, 4, 1])

@check("handles k that is zero, negative or larger than the list")
def _():
    eq(rotate([1, 2, 3], 0), [1, 2, 3])
    eq(rotate([1, 2, 3], -1), [2, 3, 1])
    eq(rotate([1, 2, 3], 7), [3, 1, 2])

@check("returns a new list and leaves the original unchanged")
def _():
    items = ["a", "b", "c"]
    rotate(items, 1)
    eq(items, ["a", "b", "c"], "the original list was modified")
    assert rotate(items, 0) is not items, "rotate(items, 0) returned the original list instead of a copy"

@check("returns an empty list for empty input")
def _():
    eq(rotate([], 5), [])
`,
  },
  "maps-sets": {
    prompt: "Write route_counts(trips) that takes a list of (origin, destination) pairs and returns a dict counting how many times each route was travelled. Direction doesn't matter, so (\"B\", \"A\") and (\"A\", \"B\") are the same route: key each route by a tuple of its two place names in sorted order. No trips gives an empty dict.",
    hint: "A tuple can be a dict key but a list can't, and sorted() returns a list. counts.get(key, 0) + 1 handles a route seen for the first time.",
    starter: py`
def route_counts(trips):
    counts = {}
    for origin, destination in trips:
        # Count this trip under a key that ignores direction.
        pass
    return counts
`,
    solution: py`
def route_counts(trips):
    counts = {}
    for origin, destination in trips:
        route = tuple(sorted((origin, destination)))
        counts[route] = counts.get(route, 0) + 1
    return counts
`,
    tests: py`
@check("counts how often each route was travelled")
def _():
    eq(route_counts([("A", "B"), ("C", "D"), ("A", "B")]), {("A", "B"): 2, ("C", "D"): 1})

@check("treats both directions as the same route")
def _():
    trips = [("YYZ", "YVR"), ("YVR", "YYZ"), ("YVR", "YUL")]
    eq(route_counts(trips), {("YVR", "YYZ"): 2, ("YUL", "YVR"): 1})

@check("counts a trip that starts and ends in the same place")
def _():
    eq(route_counts([("A", "A"), ("A", "A")]), {("A", "A"): 2})

@check("returns an empty dict when there are no trips")
def _():
    eq(route_counts([]), {})
`,
  },
  "collections-toolkit": {
    prompt: "Write visit_order(links, start) where links is a list of (page, target) pairs, each a one-way link. Return the pages reachable from start in breadth-first order: start first, then the pages it links to in the order those links appear, then the pages they link to, and so on, listing each page once. Pages that can't be reached are left out, and a start page with no links gives [start].",
    hint: "Group each page's targets with defaultdict(list). Then take pages from the front of a deque with popleft(), and keep a set of pages you've already queued so cycles don't loop forever.",
    starter: py`
from collections import defaultdict, deque


def visit_order(links, start):
    # Group the links by page, then walk them breadth-first with a queue.
    return [start]
`,
    solution: py`
from collections import defaultdict, deque


def visit_order(links, start):
    targets = defaultdict(list)
    for page, target in links:
        targets[page].append(target)
    order, seen, queue = [], {start}, deque([start])
    while queue:
        page = queue.popleft()
        order.append(page)
        for target in targets[page]:
            if target not in seen:
                seen.add(target)
                queue.append(target)
    return order
`,
    tests: py`
@check("visits pages level by level")
def _():
    links = [("home", "about"), ("home", "blog"), ("about", "team"), ("blog", "post"), ("team", "jobs")]
    eq(visit_order(links, "home"), ["home", "about", "blog", "team", "post", "jobs"])

@check("lists each page once, even with cycles")
def _():
    links = [("a", "b"), ("b", "a"), ("b", "c"), ("c", "a"), ("a", "c")]
    eq(visit_order(links, "a"), ["a", "b", "c"])

@check("leaves out pages that can't be reached")
def _():
    eq(visit_order([("a", "b"), ("c", "d"), ("d", "a")], "a"), ["a", "b"])

@check("returns just the start page when it has no links")
def _():
    eq(visit_order([], "solo"), ["solo"])
    eq(visit_order([("x", "y")], "y"), ["y"])
`,
  },
  "sorting": {
    prompt: "Write leaderboard(entries) that takes a list of (name, score) tuples and returns a new list sorted by score from highest to lowest. Break score ties by name in alphabetical order, ignoring case; entries that still tie keep their original relative order. Don't modify the input list.",
    hint: "A key function can return a tuple. Negating the score puts higher scores first, and Python's sort is stable, so full ties stay in place.",
    starter: py`
def leaderboard(entries):
    # Sort with a key that captures both rules.
    return sorted(entries)
`,
    solution: py`
def leaderboard(entries):
    return sorted(entries, key=lambda entry: (-entry[1], entry[0].casefold()))
`,
    tests: py`
@check("orders by score, highest first")
def _():
    eq(leaderboard([("ana", 3), ("ben", 9), ("cy", 5)]), [("ben", 9), ("cy", 5), ("ana", 3)])

@check("breaks score ties by name, ignoring case")
def _():
    entries = [("bea", 7), ("Carl", 7), ("al", 7), ("Zed", 8)]
    eq(leaderboard(entries), [("Zed", 8), ("al", 7), ("bea", 7), ("Carl", 7)])

@check("keeps the original order of entries that fully tie")
def _():
    entries = [("sam", 4), ("Max", 6), ("SAM", 4), ("Sam", 4)]
    eq(leaderboard(entries), [("Max", 6), ("sam", 4), ("SAM", 4), ("Sam", 4)])

@check("returns a new list and leaves the input unchanged")
def _():
    entries = [("b", 1), ("a", 2)]
    result = leaderboard(entries)
    eq(entries, [("b", 1), ("a", 2)], "the input list was modified")
    assert result is not entries, "returned the input list instead of a new one"
    eq(leaderboard([]), [])
`,
  },
  "heapq": {
    prompt: "Write next_jobs(jobs, n) that returns the names of the n most urgent jobs, most urgent first. Each job is an (urgency, details) pair where a higher urgency number is more urgent and details is a dict with a \"name\" key; jobs with equal urgency come out in the order they were given. Return every name if n is larger than the number of jobs, return [] when n is 0, and don't modify the jobs list.",
    hint: "heapq is a min-heap, so push the urgency negated. Two dicts can't be compared with <, so put each job's position in the tuple before the details.",
    starter: py`
import heapq


def next_jobs(jobs, n):
    # Build a heap that pops the most urgent job first.
    return [details["name"] for urgency, details in jobs[:n]]
`,
    solution: py`
import heapq


def next_jobs(jobs, n):
    heap = [(-urgency, position, details["name"]) for position, (urgency, details) in enumerate(jobs)]
    heapq.heapify(heap)
    return [heapq.heappop(heap)[2] for _ in range(min(n, len(heap)))]
`,
    tests: py`
@check("returns the most urgent jobs first")
def _():
    jobs = [(2, {"name": "docs"}), (9, {"name": "outage"}), (5, {"name": "review"}), (1, {"name": "cleanup"})]
    eq(next_jobs(jobs, 2), ["outage", "review"])

@check("keeps the given order for equal urgency")
def _():
    jobs = [(3, {"name": "a"}), (7, {"name": "b"}), (3, {"name": "c"}), (7, {"name": "d"}), (3, {"name": "e"})]
    eq(next_jobs(jobs, 5), ["b", "d", "a", "c", "e"])

@check("handles n of 0 and n larger than the job count")
def _():
    jobs = [(1, {"name": "x"}), (4, {"name": "y"})]
    eq(next_jobs(jobs, 0), [])
    eq(next_jobs(jobs, 10), ["y", "x"])
    eq(next_jobs([], 3), [])

@check("leaves the jobs list unchanged")
def _():
    jobs = [(1, {"name": "x"}), (4, {"name": "y"}), (2, {"name": "z"})]
    snapshot = [(urgency, dict(details)) for urgency, details in jobs]
    next_jobs(jobs, 2)
    eq(jobs, snapshot, "next_jobs changed the jobs list")
`,
  },
  "big-o": {
    prompt: "count_pairs(values, target) returns how many pairs of positions i < j have values[i] + values[j] == target, so count_pairs([2, 2, 2], 4) is 3. The starter is correct but compares every pair, which is O(n²); rewrite it to run in O(n) so it handles 100,000 values within the time limit. Empty and single-value lists have no pairs, and values may be negative.",
    hint: "Walk the list once and keep a dict of how many times each value has appeared so far. Each new value pairs with every earlier copy of target - value.",
    starter: py`
def count_pairs(values, target):
    # Correct, but O(n^2): every position is compared with every later one.
    count = 0
    for i in range(len(values)):
        for j in range(i + 1, len(values)):
            if values[i] + values[j] == target:
                count += 1
    return count
`,
    solution: py`
def count_pairs(values, target):
    seen = {}
    pairs = 0
    for value in values:
        pairs += seen.get(target - value, 0)
        seen[value] = seen.get(value, 0) + 1
    return pairs
`,
    tests: py`
@check("counts pairs that add up to the target")
def _():
    eq(count_pairs([1, 5, 3, 3, 7], 8), 3)
    eq(count_pairs([1, 2, 3], 100), 0)

@check("counts equal values as separate pairs")
def _():
    eq(count_pairs([2, 2, 2], 4), 3)
    eq(count_pairs([4, 4], 8), 1)

@check("handles empty, single-value and negative inputs")
def _():
    eq(count_pairs([], 8), 0)
    eq(count_pairs([4], 8), 0)
    eq(count_pairs([-1, 1, 0, 0], 0), 2)

@check("handles 100,000 values in linear time")
def _():
    eq(count_pairs(list(range(100_000)), 99_999), 50_000)
    eq(count_pairs([1] * 100_000, 2), 4_999_950_000)
`,
  },
  "recursion": {
    prompt: "Write a recursive flatten(items) that takes a list whose elements may themselves be lists, nested to any depth, and returns a new flat list of all the non-list values in their original left-to-right order. Empty lists contribute nothing. Only lists count as nesting: strings, tuples and every other value stay as single items.",
    hint: "Decide the base case first: a value that isn't a list goes straight into the result. For a list element, flatten it and extend the result with what comes back. isinstance(item, list) tells the two apart.",
    starter: py`
def flatten(items):
    # Base case: a non-list value. Recursive case: flatten each nested list.
    return list(items)
`,
    solution: py`
def flatten(items):
    result = []
    for item in items:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result
`,
    tests: py`
@check("flattens nested lists in order")
def _():
    eq(flatten([1, [2, [3, 4]], 5]), [1, 2, 3, 4, 5])
    eq(flatten([1, 2, 3]), [1, 2, 3])

@check("drops empty lists")
def _():
    eq(flatten([[], [[]], 1, [[], 2]]), [1, 2])
    eq(flatten([]), [])

@check("keeps strings, tuples and None as single values")
def _():
    eq(flatten(["ab", ("c", "d"), ["e", [None]]]), ["ab", ("c", "d"), "e", None])

@check("handles lists nested 200 levels deep")
def _():
    nested = []
    for n in range(200):
        nested = [n, nested]
    eq(flatten(nested), list(range(199, -1, -1)))
`,
  },
  "iterators-generators": {
    prompt: "Write a generator function chunked(iterable, size) that yields lists of size consecutive items from any iterable, with a shorter final list if the items run out, and never an empty list. It must be lazy: pull items from the input only as each chunk is requested, so it works on huge or endless streams. Raise ValueError if size is less than 1; it's fine for the error to appear when iteration starts.",
    hint: "Append each item to a list and yield it once it reaches size, then start a new list. After the loop, yield whatever is left if it isn't empty.",
    starter: py`
def chunked(iterable, size):
    # Yield each chunk as soon as it is full instead of building everything first.
    items = list(iterable)
    return [items[i:i + size] for i in range(0, len(items), size)]
`,
    solution: py`
def chunked(iterable, size):
    if size < 1:
        raise ValueError("size must be at least 1")
    chunk = []
    for item in iterable:
        chunk.append(item)
        if len(chunk) == size:
            yield chunk
            chunk = []
    if chunk:
        yield chunk
`,
    tests: py`
@check("yields full chunks, then a shorter last one")
def _():
    eq(list(chunked([1, 2, 3, 4, 5], 2)), [[1, 2], [3, 4], [5]])

@check("works with any iterable and adds no empty chunk")
def _():
    eq(list(chunked("abc", 3)), [["a", "b", "c"]])
    eq(list(chunked(range(4), 2)), [[0, 1], [2, 3]])
    eq(list(chunked([], 3)), [])

@check("is lazy: reads input only as chunks are requested")
def _():
    pulled = []

    def source():
        for n in range(1000):
            pulled.append(n)
            yield n

    stream = chunked(source(), 2)
    assert iter(stream) is stream, "chunked should return an iterator (use yield), not a list"
    eq(pulled, [], "nothing should be read before the first chunk is requested")
    eq(next(stream), [0, 1])
    assert len(pulled) <= 3, "reading the first chunk of 2 pulled %d items from the input" % len(pulled)

@check("rejects a size below 1")
def _():
    raises(ValueError, lambda: list(chunked([1, 2], 0)))
    raises(ValueError, lambda: list(chunked([1, 2], -3)))
`,
  },
  "patterns": {
    prompt: "Write longest_window(costs, budget) that returns the length of the longest run of consecutive items in costs whose total is at most budget. Costs and budget are non-negative integers; return 0 for an empty list or when no single item fits. It has to handle 100,000 costs quickly, so checking every possible window won't do.",
    hint: "Sliding window: keep a running total for costs[left:right + 1]. Add each new item, and while the total is over budget, subtract costs[left] and move left forward.",
    starter: py`
def longest_window(costs, budget):
    # Grow the window on the right; shrink it from the left while it costs too much.
    return 0
`,
    solution: py`
def longest_window(costs, budget):
    best = total = left = 0
    for right, cost in enumerate(costs):
        total += cost
        while total > budget:
            total -= costs[left]
            left += 1
        best = max(best, right - left + 1)
    return best
`,
    tests: py`
@check("finds the longest run within budget")
def _():
    eq(longest_window([4, 1, 1, 2, 5, 1], 4), 3)
    eq(longest_window([3, 1, 2, 1, 1], 5), 4)
    eq(longest_window([2, 2], 10), 2)

@check("returns 0 for an empty list or when nothing fits")
def _():
    eq(longest_window([], 5), 0)
    eq(longest_window([7, 9, 6], 5), 0)

@check("counts zero-cost items and a zero budget")
def _():
    eq(longest_window([0, 0, 3, 0], 0), 2)
    eq(longest_window([0, 0, 3, 0], 3), 4)

@check("handles 100,000 costs in a single pass")
def _():
    eq(longest_window([1] * 100_000, 25_000), 25_000)
    eq(longest_window([(i * 7919) % 13 for i in range(100_000)], 50), 10)
`,
  },
  "json": {
    prompt: "Write parse_order(text) that parses a JSON object such as {\"id\": \"A7\", \"quantity\": 2, \"gift\": true} and returns a dict with exactly the keys \"id\", \"quantity\" and \"gift\", using False for gift when it is missing and dropping any other keys. Raise ValueError if the text isn't valid JSON or isn't an object, if id isn't a non-empty string, if quantity isn't an integer of at least 1 (true and false don't count as integers), or if gift is present but isn't a boolean.",
    hint: "json.JSONDecodeError is already a ValueError. Check each field with isinstance, and remember that isinstance(True, int) is True.",
    starter: py`
import json


def parse_order(text):
    data = json.loads(text)
    # Check each field before trusting it.
    return data
`,
    solution: py`
import json


def parse_order(text):
    data = json.loads(text)
    if not isinstance(data, dict):
        raise ValueError("an order must be a JSON object")
    order_id = data.get("id")
    if not isinstance(order_id, str) or not order_id:
        raise ValueError("id must be a non-empty string")
    quantity = data.get("quantity")
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
        raise ValueError("quantity must be a whole number of at least 1")
    gift = data.get("gift", False)
    if not isinstance(gift, bool):
        raise ValueError("gift must be true or false")
    return {"id": order_id, "quantity": quantity, "gift": gift}
`,
    tests: py`
def _rejects(text):
    try:
        result = parse_order(text)
    except ValueError:
        return
    except Exception as error:
        raise AssertionError("parse_order(%r) raised %s, expected ValueError" % (text, type(error).__name__))
    raise AssertionError("parse_order(%r) returned %r, expected ValueError" % (text, result))

@check("parses a valid order")
def _():
    eq(parse_order('{"id": "A7", "quantity": 2, "gift": true}'), {"id": "A7", "quantity": 2, "gift": True})

@check("defaults gift to False and drops extra keys")
def _():
    eq(parse_order('{"quantity": 1, "id": "B1", "note": "leave at door"}'), {"id": "B1", "quantity": 1, "gift": False})

@check("raises ValueError for malformed JSON or a non-object")
def _():
    for text in ['{"id": "A7", ', '', '[1, 2]', 'null', '"A7"']:
        _rejects(text)

@check("raises ValueError for missing or badly typed fields")
def _():
    for text in [
        '{"quantity": 2}',
        '{"id": "", "quantity": 2}',
        '{"id": 7, "quantity": 2}',
        '{"id": "A7"}',
        '{"id": "A7", "quantity": 0}',
        '{"id": "A7", "quantity": "2"}',
        '{"id": "A7", "quantity": 2.5}',
        '{"id": "A7", "quantity": true}',
        '{"id": "A7", "quantity": 2, "gift": "yes"}',
    ]:
        _rejects(text)
`,
  },
  "exceptions": {
    prompt: "Define an exception class ConfigError that subclasses ValueError, and write parse_port(text) that returns the stripped text as an int when it is between 1 and 65535. Raise ConfigError when the text isn't a whole number, raising it from the original ValueError so the cause is kept, and also when the number is outside the range. Catch only ValueError: a non-string such as None must still fail with its own AttributeError or TypeError.",
    hint: "Put only the conversion inside try / except ValueError as error, and use raise ConfigError(...) from error. Do the range check after the try block.",
    starter: py`
class ConfigError(ValueError):
    """A setting is present but can't be used."""


def parse_port(text):
    # Convert the text, check the range, and raise ConfigError with context.
    return int(text)
`,
    solution: py`
class ConfigError(ValueError):
    """A setting is present but can't be used."""


def parse_port(text):
    try:
        port = int(text.strip())
    except ValueError as error:
        raise ConfigError(f"port must be a whole number, got {text!r}") from error
    if not 1 <= port <= 65535:
        raise ConfigError(f"port must be between 1 and 65535, got {port}")
    return port
`,
    tests: py`
def _config_error(text):
    try:
        result = parse_port(text)
    except ConfigError as error:
        return error
    except Exception as error:
        raise AssertionError("parse_port(%r) raised %s, expected ConfigError" % (text, type(error).__name__))
    raise AssertionError("parse_port(%r) returned %r, expected ConfigError" % (text, result))

@check("returns valid ports as integers")
def _():
    eq(parse_port("8080"), 8080)
    eq(parse_port(" 443\n"), 443)
    eq(parse_port("1"), 1)
    eq(parse_port("65535"), 65535)

@check("ConfigError is a kind of ValueError")
def _():
    assert issubclass(ConfigError, ValueError), "ConfigError should subclass ValueError"

@check("raises ConfigError for numbers out of range")
def _():
    for text in ["0", "65536", "-80"]:
        _config_error(text)

@check("raises ConfigError from the original error for non-numeric text")
def _():
    for text in ["http", "", "80.5"]:
        error = _config_error(text)
        assert isinstance(error.__cause__, ValueError), "parse_port(%r) should raise ConfigError from the original ValueError" % text

@check("lets errors other than ValueError through")
def _():
    raises((AttributeError, TypeError), parse_port, None)
`,
  },
  "context-managers": {
    prompt: "Write a context manager temporarily_set(mapping, key, value), using @contextmanager or a class, that sets mapping[key] = value for the duration of a with block. When the block ends, put things back: restore the old value (even if it was None), or delete the key if it wasn't there before. This must also happen when the block raises, and the exception must still reach the caller.",
    hint: "With @contextmanager, wrap the yield in try / finally. Record whether the key existed before you change anything, because get() can't tell a missing key from a None value.",
    starter: py`
from contextlib import contextmanager


@contextmanager
def temporarily_set(mapping, key, value):
    mapping[key] = value
    yield
    # Put the old state back here, even when the block fails.
`,
    solution: py`
from contextlib import contextmanager


@contextmanager
def temporarily_set(mapping, key, value):
    had_key = key in mapping
    previous = mapping.get(key)
    mapping[key] = value
    try:
        yield
    finally:
        if had_key:
            mapping[key] = previous
        else:
            mapping.pop(key, None)
`,
    tests: py`
@check("sets the value inside the block and restores it after")
def _():
    settings = {"mode": "prod", "region": "ca"}
    with temporarily_set(settings, "mode", "test"):
        eq(settings["mode"], "test")
    eq(settings, {"mode": "prod", "region": "ca"})

@check("deletes a new key afterwards but keeps one that held None")
def _():
    settings = {"token": None}
    with temporarily_set(settings, "debug", True):
        eq(settings["debug"], True)
    eq(settings, {"token": None})
    with temporarily_set(settings, "token", "abc"):
        eq(settings["token"], "abc")
    eq(settings, {"token": None})

@check("restores the mapping and re-raises when the block fails")
def _():
    settings = {"mode": "prod"}

    def fail_inside():
        with temporarily_set(settings, "mode", "test"):
            with temporarily_set(settings, "extra", 1):
                raise RuntimeError("boom")

    raises(RuntimeError, fail_inside)
    eq(settings, {"mode": "prod"})

@check("unwinds nested uses of the same key in order")
def _():
    settings = {"mode": "prod"}
    with temporarily_set(settings, "mode", "test"):
        with temporarily_set(settings, "mode", "debug"):
            eq(settings["mode"], "debug")
        eq(settings["mode"], "test")
    eq(settings, {"mode": "prod"})
`,
  },
  "classes-dataclasses": {
    prompt: "Define a dataclass Account with fields owner (str), balance (int, default 0) and history (list[int], defaulting to a new empty list for every account). Add deposit(amount) and withdraw(amount) methods that change balance and append the change to history: +amount for a deposit and -amount for a withdrawal. Both raise ValueError for an amount that isn't positive, and withdraw raises ValueError rather than take the balance below zero; a rejected call must leave balance and history unchanged.",
    hint: "history: list[int] = field(default_factory=list) gives each account its own list. Validate the amount before you change any state.",
    starter: py`
from dataclasses import dataclass, field


@dataclass
class Account:
    owner: str
    balance: int = 0
    # history: a separate empty list for every account

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        self.balance -= amount
`,
    solution: py`
from dataclasses import dataclass, field


@dataclass
class Account:
    owner: str
    balance: int = 0
    history: list[int] = field(default_factory=list)

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self.balance += amount
        self.history.append(amount)

    def withdraw(self, amount):
        if amount <= 0:
            raise ValueError("withdrawal must be positive")
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
        self.history.append(-amount)
`,
    tests: py`
import dataclasses

@check("is a dataclass with owner, balance and history")
def _():
    assert dataclasses.is_dataclass(Account), "decorate Account with @dataclass"
    account = Account("Ada")
    eq((account.owner, account.balance, account.history), ("Ada", 0, []))
    eq(Account("Lin", 25).balance, 25)

@check("deposits and withdrawals update balance and history")
def _():
    account = Account("Ada")
    account.deposit(50)
    account.withdraw(20)
    eq(account.balance, 30)
    eq(account.history, [50, -20])

@check("each account has its own history")
def _():
    first, second = Account("Ada"), Account("Lin")
    first.deposit(5)
    eq(second.history, [], "a deposit to one account appeared in another")

@check("rejects amounts that are not positive")
def _():
    account = Account("Ada", 10)
    raises(ValueError, account.deposit, 0)
    raises(ValueError, account.deposit, -5)
    raises(ValueError, account.withdraw, -1)
    eq((account.balance, account.history), (10, []))

@check("refuses to overdraw and leaves the account unchanged")
def _():
    account = Account("Ada", 10)
    raises(ValueError, account.withdraw, 11)
    eq((account.balance, account.history), (10, []))
    account.withdraw(10)
    eq(account.balance, 0)
`,
  },
  "typing": {
    prompt: "Define a Protocol Priced that requires a price(self) -> float method, and write cheapest(items: Iterable[Priced]) -> Priced | None with exactly those annotations. It returns the item whose price() is lowest (the first one if several tie), or None when items is empty. It must accept any iterable, including a one-pass generator, and any object with a price() method, whether or not it inherits from Priced.",
    hint: "min() accepts key= and default= arguments. A Protocol method body can just be ...",
    starter: py`
from typing import Iterable, Protocol


class Priced(Protocol):
    # Declare the method every priced object must have.
    pass


def cheapest(items):
    # Add the annotations, then return the lowest-priced item.
    return None
`,
    solution: py`
from typing import Iterable, Protocol


class Priced(Protocol):
    def price(self) -> float: ...


def cheapest(items: Iterable[Priced]) -> Priced | None:
    return min(items, key=lambda item: item.price(), default=None)
`,
    tests: py`
import collections.abc
import typing

class _Book:
    def __init__(self, title, cost):
        self.title = title
        self.cost = cost

    def price(self):
        return self.cost

    def __repr__(self):
        return "Book(%r, %r)" % (self.title, self.cost)

@check("returns the cheapest item, the first one on a tie")
def _():
    books = [_Book("a", 12.0), _Book("b", 4.5), _Book("c", 9.0), _Book("d", 4.5)]
    eq(cheapest(books), books[1])

@check("returns None for an empty iterable")
def _():
    eq(cheapest([]), None)
    eq(cheapest(iter(())), None)

@check("accepts a one-pass generator")
def _():
    books = [_Book("a", 3.0), _Book("b", 1.0), _Book("c", 2.0)]
    eq(cheapest(book for book in books), books[1])

@check("is annotated as Iterable[Priced] -> Priced | None")
def _():
    hints = typing.get_type_hints(cheapest)
    items = hints.get("items")
    assert typing.get_origin(items) is collections.abc.Iterable and typing.get_args(items) == (Priced,), "annotate items as Iterable[Priced], got %r" % (items,)
    eq(hints.get("return"), typing.Optional[Priced], "annotate the return type as Priced | None, got %r" % (hints.get("return"),))

@check("Priced is a Protocol requiring price() -> float")
def _():
    assert typing.Protocol in Priced.__mro__, "Priced should subclass typing.Protocol"
    assert callable(getattr(Priced, "price", None)), "Priced should declare a price method"
    eq(typing.get_type_hints(Priced.price).get("return"), float, "annotate price's return type as float")
`,
  },
  "testing": {
    prompt: "The starter defines has_pair(values, target), which reports whether two different positions in values add up to target. Write at least three test functions named test_... that take no arguments and use assert to check it. The checks run your tests against a correct has_pair, which must pass all of them, and against three buggy versions that at least one test must fail: one that lets an element pair with itself, one that misses pairs made of two equal values, and one that crashes on an empty list.",
    hint: "Each test should check one small, specific input. Try [], a single value that is exactly half the target, and two equal values that add up to the target.",
    starter: py`
def has_pair(values, target):
    """Return True if two different positions in values add up to target."""
    seen = set()
    for value in values:
        if target - value in seen:
            return True
        seen.add(value)
    return False


def test_finds_a_pair():
    assert has_pair([1, 4, 6], 10)

# Add more test_ functions below.
`,
    solution: py`
def has_pair(values, target):
    """Return True if two different positions in values add up to target."""
    seen = set()
    for value in values:
        if target - value in seen:
            return True
        seen.add(value)
    return False


def test_finds_a_pair():
    assert has_pair([1, 4, 6], 10)


def test_empty_list_has_no_pair():
    assert not has_pair([], 5)


def test_one_element_cannot_pair_with_itself():
    assert not has_pair([5], 10)
    assert not has_pair([1, 5], 10)


def test_two_equal_values_form_a_pair():
    assert has_pair([3, 3], 6)
`,
    tests: py`
import types

def _correct(values, target):
    seen = set()
    for value in values:
        if target - value in seen:
            return True
        seen.add(value)
    return False

def _pairs_with_itself(values, target):
    seen = set()
    for value in values:
        seen.add(value)
        if target - value in seen:
            return True
    return False

def _misses_equal_values(values, target):
    unique = set(values)
    return any(target - value in unique and target - value != value for value in unique)

def _crashes_when_empty(values, target):
    seen = {values[0]}
    for value in values[1:]:
        if target - value in seen:
            return True
        seen.add(value)
    return False

def _learner_tests():
    return [(name, value) for name, value in sorted(globals().items()) if name.startswith("test_") and isinstance(value, types.FunctionType)]

_MISSING = object()

def _failing_tests(implementation):
    """Runs every test_ function with has_pair swapped for implementation; returns the names that fail."""
    failed = []
    for name, test in _learner_tests():
        module = test.__globals__
        saved = module.get("has_pair", _MISSING)
        module["has_pair"] = implementation
        try:
            test()
        except Exception:
            failed.append(name)
        finally:
            if saved is _MISSING:
                module.pop("has_pair", None)
            else:
                module["has_pair"] = saved
    return failed

@check("defines at least three test_ functions")
def _():
    names = [name for name, test in _learner_tests()]
    assert len(names) >= 3, "found %d test_ function(s): %s" % (len(names), ", ".join(names) or "none")

@check("every test passes on a correct has_pair")
def _():
    assert _learner_tests(), "no test_ functions found"
    failed = _failing_tests(_correct)
    assert not failed, "these tests fail even though has_pair is correct: " + ", ".join(failed)

@check("catches a has_pair that pairs an element with itself")
def _():
    assert _failing_tests(_pairs_with_itself), "every test passed on a has_pair that can use the same element twice"

@check("catches a has_pair that misses two equal values")
def _():
    assert _failing_tests(_misses_equal_values), "every test passed on a has_pair that never pairs two equal values"

@check("catches a has_pair that crashes on an empty list")
def _():
    assert _failing_tests(_crashes_when_empty), "every test passed on a has_pair that raises IndexError for []"
`,
  },
  "environments": {
    prompt: "Write parse_requirements(text) for requirements.txt-style text where each line is a bare package name such as rich or a pin such as FastAPI==0.115.0. Return a dict mapping each normalized name (lowercased, with every run of -, _ and . replaced by a single -) to its version string, or to None when the line has no == pin. Skip blank lines and comments (anything after a #), strip whitespace around names and versions, and raise ValueError when the same normalized name appears twice.",
    hint: "line.split(\"#\", 1)[0] drops a comment and line.partition(\"==\") splits off a pin. re.sub(r\"[-_.]+\", \"-\", name) collapses the separators.",
    starter: py`
def parse_requirements(text):
    packages = {}
    for line in text.splitlines():
        # Drop comments, split off any "==" pin, and normalize the name.
        pass
    return packages
`,
    solution: py`
import re


def parse_requirements(text):
    packages = {}
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        name, _, version = line.partition("==")
        name = re.sub(r"[-_.]+", "-", name.strip()).lower()
        if name in packages:
            raise ValueError(f"{name} is listed more than once")
        packages[name] = version.strip() or None
    return packages
`,
    tests: py`
@check("maps pinned packages to versions and bare names to None")
def _():
    eq(parse_requirements("fastapi==0.115.0\nrich\n"), {"fastapi": "0.115.0", "rich": None})

@check("skips comments and blank lines")
def _():
    text = "# web\n\nuvicorn==0.30.6  # server\n   \n# pytest==8.3.3\n"
    eq(parse_requirements(text), {"uvicorn": "0.30.6"})
    eq(parse_requirements(""), {})

@check("normalizes names and strips whitespace")
def _():
    text = "  Pydantic_Core == 2.23.4 \r\nzope.interface\r\nTyping--Extensions==4.12.2\r\n"
    eq(parse_requirements(text), {"pydantic-core": "2.23.4", "zope-interface": None, "typing-extensions": "4.12.2"})

@check("raises ValueError when a package is listed twice")
def _():
    raises(ValueError, parse_requirements, "Flask==3.0.0\nflask==3.0.3\n")
    raises(ValueError, parse_requirements, "typing_extensions\ntyping-extensions==4.12.2\n")
`,
  },
};
