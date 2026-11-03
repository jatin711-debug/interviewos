import type { PythonLesson, LessonChallenge } from "./python-course";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");
function make(id: string, title: string, summary: string, concepts: string[], code: string, output: string, exercise: string, hint: string, challenge: LessonChallenge, source: string): PythonLesson {
  return { id, title, summary, concepts, code, output, exercise, hint, challenge, runtime: "browser", source };
}
export const PYTHON_EXPANSIONS: Array<{ after: string; lesson: PythonLesson }> = [
{ after: "values", lesson: make("numbers-operators", "Numbers, division & rounding", "Choose the right numeric operation and understand how Python handles division and rounding.", [
  "Integer / always produces a float; // floors the quotient, including for negative numbers. The remainder satisfies a == (a // b) * b + a % b when b is nonzero.",
  "divmod returns the quotient and remainder together. Division by zero raises ZeroDivisionError, so decide how your function handles it.",
  "Floats are binary approximations. round uses ties-to-even, and decimal.Decimal constructed from strings is often appropriate when exact decimal arithmetic matters."
], py`
from decimal import Decimal

# A negative quotient is rounded toward negative infinity, not toward zero.
print(7 / 3, 7 // 3, 7 % 3)
print(divmod(-7, 3))

# Binary floats can carry small representation errors.
print(0.1 + 0.2 == 0.3)
price = Decimal("0.10") + Decimal("0.20")
print(price == Decimal("0.30"))
print(round(2.5), round(3.5))
`, `2.3333333333333335 2 1\n(-3, 2)\nFalse\nTrue\n2 4`, "For -11 and 4, predict the quotient and remainder, then check the division identity.", "Use divmod and remember that // rounds down.", {
  prompt: "Write split_batches(total, size) for a nonnegative number of items and a positive batch size. Return (full_batches, remaining_items). Raise ValueError for a negative total or nonpositive size.",
  hint: "Validate the inputs, then use divmod(total, size).",
  starter: py`def split_batches(total, size):
    raise NotImplementedError
`, solution: py`def split_batches(total, size):
    if total < 0 or size <= 0:
        raise ValueError("invalid batch size or total")
    return divmod(total, size)
`, tests: py`@check("full and partial batches")
def _():
    eq(split_batches(17, 5), (3, 2))
@check("exact and empty")
def _():
    eq(split_batches(10, 5), (2, 0))
    eq(split_batches(0, 3), (0, 0))
@check("invalid inputs")
def _():
    raises(ValueError, split_batches, -1, 5)
    raises(ValueError, split_batches, 1, 0)
    raises(ValueError, split_batches, 1, -3)
`}, "https://docs.python.org/3/tutorial/floatingpoint.html") },
{ after: "control-flow", lesson: make("truthiness-booleans", "Truthiness, None & boolean operators", "Make conditions precise without losing valid values such as zero or empty strings.", [
  "None, False, zero and empty containers are falsy; a nonempty string such as '0' is truthy. Use is None when only a missing value should be treated specially.",
  "and and or short-circuit and return an operand, not necessarily a bool. A fallback like value or default also replaces valid falsy values.",
  "Use explicit comparisons for boundaries and avoid evaluating expensive or unsafe expressions before their guard."
], py`
values = [None, 0, "", "0", [1]]
for value in values:
    print(repr(value), bool(value))

count = 0
print("using or:", count or 10)
print("explicit None:", 10 if count is None else count)
# The second expression is skipped because the first is false.
print(False and (1 / 0))
`, `None False\n0 False\n'' False\n'0' True\n[1] True\nusing or: 10\nexplicit None: 0\nFalse`, "Decide which of None, 0 and an empty string should cause a fallback in a configuration value.", "Compare with is None if zero is a valid value.", {
 prompt:"Write use_default(value, default) returning default only when value is None. Preserve all other values, including 0, False, empty strings, and empty lists.", hint:"Use an explicit identity check against None.", starter:py`def use_default(value, default):
    return value or default
`, solution:py`def use_default(value, default):
    return default if value is None else value
`, tests:py`@check("missing value")
def _():
    eq(use_default(None, 7), 7)
@check("preserves zero and false")
def _():
    eq(use_default(0, 7), 0)
    eq(use_default(False, True), False)
@check("preserves empty containers")
def _():
    eq(use_default("", "fallback"), "")
    eq(use_default([], [1]), [])
@check("ordinary value")
def _():
    eq(use_default("yes", "no"), "yes")
`}, "https://docs.python.org/3/library/stdtypes.html#truth-value-testing") },
{ after:"functions", lesson:make("function-arguments", "Function arguments & return contracts", "Use positional and keyword arguments deliberately, and avoid surprises from mutable defaults.", [
  "Parameters before / are positional-only; parameters after * are keyword-only. These markers can make public function calls clearer and less ambiguous.",
  "Defaults are evaluated when the function is defined, not on every call. Use None and create a new mutable container inside the function when each call needs fresh state.",
  "*args gathers extra positional arguments into a tuple; **kwargs gathers extra keyword arguments into a dict. Type hints document a contract but do not enforce it at runtime."
], py`
def describe(name, /, *scores, active=True):
    """Return a summary; scores are positional and active is keyword-only."""
    return {"name": name, "scores": list(scores), "active": active}

def add_item(item, items=None):
    # A fresh list is created on every call that omits items.
    if items is None:
        items = []
    items.append(item)
    return items

print(describe("Ada", 8, 9, active=False))
print(add_item("first"), add_item("second"))
shared = []
add_item("kept", shared)
print(shared)
`, `{'name': 'Ada', 'scores': [8, 9], 'active': False}\n['first'] ['second']\n['kept']`, "Change the example so a caller-supplied list is copied instead of mutated. What behavior should the docstring promise?", "Use list(items) when you want a new list.", {
 prompt:"Implement add_tag(tag, tags=None, *, unique=False). Return a new list containing the supplied tags and tag. If unique is True and tag is already present, do not add it. Never mutate a supplied list; each call must be independent.",hint:"Copy tags when it is not None; check membership before appending.",starter:py`def add_tag(tag, tags=None, *, unique=False):
    raise NotImplementedError
`,solution:py`def add_tag(tag, tags=None, *, unique=False):
    result = list(tags) if tags is not None else []
    if not unique or tag not in result:
        result.append(tag)
    return result
`,tests:py`@check("independent defaults")
def _():
    eq(add_tag("a"), ["a"])
    eq(add_tag("b"), ["b"])
@check("does not mutate the caller")
def _():
    original = ["a"]
    eq(add_tag("b", original), ["a", "b"])
    eq(original, ["a"])
@check("optional uniqueness")
def _():
    eq(add_tag("a", ["a"], unique=True), ["a"])
    eq(add_tag("a", ["a"]), ["a", "a"])
@check("keyword-only flag")
def _():
    raises(TypeError, add_tag, "a", [], True)
`},"https://docs.python.org/3/tutorial/controlflow.html#special-parameters") },
{ after:"control-flow", lesson:make("iteration-tools", "Loops, enumerate & zip", "Walk through sequences safely while retaining indices and combining related data.", [
 "Use enumerate(sequence, start=...) when you need both the index and the value; the default index starts at zero.",
 "zip stops at the shortest input by default. On Python 3.10+, zip(..., strict=True) raises ValueError when lengths differ, preventing silent data loss.",
 "Iterators are consumed as they advance. Avoid modifying a list while iterating over it; create a new result or iterate over a copy when appropriate."
], py`
names = ["Ada", "Lin", "Grace"]
scores = [90, 80, 95]
for position, (name, score) in enumerate(zip(names, scores, strict=True), start=1):
    print(position, name, score)

iterator = iter([10, 20])
print(next(iterator), list(iterator), list(iterator))
print(list(zip([1, 2], ["a"])))  # default zip stops early
`, `1 Ada 90\n2 Lin 80\n3 Grace 95\n10 [20] []\n[(1, 'a')]`, "Pair three names with three scores; then remove one score and observe the difference between ordinary zip and strict zip.", "Strict zip raises when iteration detects a length mismatch.", {
 prompt:"Write numbered_pairs(names, scores) returning (position, name, score) tuples in a list, with positions starting at 1. Reject mismatched lengths by raising ValueError; inputs are lists and neither may be modified.",hint:"Combine enumerate with zip(..., strict=True), and consume it into a list.",starter:py`def numbered_pairs(names, scores):
    raise NotImplementedError
`,solution:py`def numbered_pairs(names, scores):
    return [(i, name, score) for i, (name, score) in enumerate(zip(names, scores, strict=True), 1)]
`,tests:py`@check("pairs with one-based positions")
def _():
    eq(numbered_pairs(["A", "B"], [3, 4]), [(1, "A", 3), (2, "B", 4)])
@check("empty inputs")
def _():
    eq(numbered_pairs([], []), [])
@check("rejects either length mismatch")
def _():
    raises(ValueError, numbered_pairs, ["A"], [])
    raises(ValueError, numbered_pairs, [], [3])
@check("leaves inputs alone")
def _():
    names, scores = ["A"], [1]
    numbered_pairs(names, scores)
    eq((names, scores), (["A"], [1]))
`},"https://docs.python.org/3/library/functions.html#zip") },
{ after:"lists", lesson:make("slicing-aliasing", "Slicing, references & mutation", "Trace which objects are shared and how slices behave at boundaries.", [
 "A slice uses start:stop:step, excludes stop, and clips out-of-range bounds. A negative step walks backwards; step zero raises ValueError.",
 "A list slice creates a new outer list in O(k) time and space for k selected references. Nested mutable items are still shared.",
 "Assignment binds another name to the same object; use is to check identity and == to compare values. list.sort mutates and returns None, while sorted returns a new list."
], py`
values = [10, 20, 30, 40, 50]
print(values[1:4], values[::-1], values[3:99])
original = [[1], [2]]
outer_copy = original[:]
outer_copy[0].append(9)  # inner list is shared
outer_copy.append([3])  # outer list is separate
print(original, outer_copy)
print(original is outer_copy, original[0] is outer_copy[0])
`, `[20, 30, 40] [50, 40, 30, 20, 10] [40, 50]\n[[1, 9], [2]] [[1, 9], [2], [3]]\nFalse True`, "Make an independent copy of a list of lists, then change an inner item and check the original.", "Copy each inner list or use deepcopy where appropriate.", {
 prompt:"Write reversed_copy(values) that returns a new list in reverse order. Do not mutate the input, and preserve the contained objects rather than deep-copying them.",hint:"A slice with a negative step returns a new outer list.",starter:py`def reversed_copy(values):
    raise NotImplementedError
`,solution:py`def reversed_copy(values):
    return values[::-1]
`,tests:py`@check("reversed ordering")
def _():
    eq(reversed_copy([1, 2, 3]), [3, 2, 1])
    eq(reversed_copy([]), [])
@check("does not mutate input")
def _():
    values = [1, 2]
    result = reversed_copy(values)
    eq(values, [1, 2])
    eq(result is values, False)
@check("shallow copy preserves item identity")
def _():
    nested = [1]
    eq(reversed_copy([nested])[0] is nested, True)
`},"https://docs.python.org/3/tutorial/introduction.html#lists") },
{ after:"maps-sets", lesson:make("dictionary-patterns", "Dictionary counting & grouping", "Build counts and groups safely and distinguish missing keys from stored values.", [
 "Use get(key, default) for a lookup that does not insert; membership testing distinguishes a missing key from a key whose value is None.",
 "defaultdict(list) creates a new list when a missing key is accessed. That access changes the dictionary, while get does not call the default factory.",
 "Dictionary and set lookups are O(1) on average, not guaranteed in every case. Keys must be hashable and retain a stable hash while stored."
], py`
from collections import defaultdict

words = ["tea", "tea", "cake"]
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
print(counts)

groups = defaultdict(list)
for name, team in [("Ada", "red"), ("Lin", "blue"), ("Sam", "red")]:
    groups[team].append(name)
print(dict(groups))
record = {"score": None}
print("score" in record, "missing" in record, record.get("score"))
`, `{'tea': 2, 'cake': 1}\n{'red': ['Ada', 'Sam'], 'blue': ['Lin']}\nTrue False None`, "Count words case-insensitively while preserving the order in which distinct words first appear.", "Normalize each word before incrementing its count.", {
 prompt:"Write group_by_first(words) returning a dictionary from the first character to a list of words in input order. Skip empty strings. Treat uppercase and lowercase letters as different keys, and do not alter the input.",hint:"For each nonempty word, append to a list stored under word[0].",
 starter:py`def group_by_first(words):
    raise NotImplementedError
`,solution:py`def group_by_first(words):
    result = {}
    for word in words:
        if word:
            result.setdefault(word[0], []).append(word)
    return result
`,tests:py`@check("groups in input order")
def _():
    eq(group_by_first(["ant", "bee", "ape"]), {"a": ["ant", "ape"], "b": ["bee"]})
@check("empty strings")
def _():
    eq(group_by_first(["", "a", ""]), {"a": ["a"]})
    eq(group_by_first([]), {})
@check("case sensitivity")
def _():
    eq(group_by_first(["A", "a"]), {"A": ["A"], "a": ["a"]})
@check("does not change the input")
def _():
    words = ["a", "b"]
    group_by_first(words)
    eq(words, ["a", "b"])
`},"https://docs.python.org/3/library/collections.html#defaultdict-objects") },
{ after:"exceptions", lesson:make("exception-flow", "Exceptions: else, finally & chaining", "Control error paths without hiding unexpected failures or skipping cleanup.", [
 "try/except catches matching exceptions. The else block runs only when the try block succeeds; finally runs on both success and failure, even when a return is pending.",
 "Catch the narrowest exception you can handle. Raise a more useful exception with raise NewError(...) from error to preserve the original cause.",
 "Do not return from finally or silently catch Exception: doing so can hide an error or replace the intended return value."
], py`
def parse_positive(text):
    try:
        value = int(text)
    except ValueError as error:
        raise ValueError("expected an integer") from error
    else:
        if value <= 0:
            raise ValueError("must be positive")
        return value
    finally:
        print("finished parsing")

print(parse_positive("4"))
try:
    parse_positive("oops")
except ValueError as error:
    print(error, "| cause:", type(error.__cause__).__name__)
`, `finished parsing\n4\nfinished parsing\nexpected an integer | cause: ValueError`, "Add a test for '0' and notice that its validation error has no chained conversion error.", "The range check runs in else, after int(text) succeeds.", {
 prompt:"Implement parse_age(text) for strings. Return the integer if it is between 0 and 130 inclusive; otherwise raise ValueError. For invalid integer text, raise ValueError('invalid integer') with the original conversion error as __cause__.",hint:"Catch ValueError from int separately, chain it, then check the numeric range.",starter:py`def parse_age(text):
    raise NotImplementedError
`,solution:py`def parse_age(text):
    try:
        value = int(text)
    except ValueError as error:
        raise ValueError("invalid integer") from error
    if not 0 <= value <= 130:
        raise ValueError("age out of range")
    return value
`,tests:py`@check("valid boundaries")
def _():
    eq(parse_age("0"), 0)
    eq(parse_age("130"), 130)
    eq(parse_age(" 24 "), 24)
@check("invalid text preserves cause")
def _():
    error = raises(ValueError, parse_age, "abc")
    eq(str(error), "invalid integer")
    eq(isinstance(error.__cause__, ValueError), True)
@check("out of range")
def _():
    raises(ValueError, parse_age, "-1")
    raises(ValueError, parse_age, "131")
`},"https://docs.python.org/3/tutorial/errors.html") },
{ after:"classes-dataclasses", lesson:make("classes-properties", "Classes, instance state & properties", "Design a small class that protects its state and exposes a clear Python interface.", [
 "Instance attributes belong to each object; a class attribute is shared through the class unless an instance shadows it. Avoid mutable class attributes for per-instance data.",
 "A property exposes a computed value using attribute syntax. A method can validate changes before modifying private-by-convention state.",
 "__repr__ should help a developer understand an object. Type hints and leading underscores are conventions; they do not make a value private or automatically validate it."
], py`
class Counter:
    def __init__(self, start=0):
        if start < 0:
            raise ValueError("start must be nonnegative")
        self._value = start

    @property
    def value(self):
        return self._value

    def increment(self, amount=1):
        if amount < 0:
            raise ValueError("amount must be nonnegative")
        self._value += amount

    def __repr__(self):
        return f"Counter(start={self._value})"

first, second = Counter(), Counter(2)
first.increment(3)
print(first.value, second.value)
print(first)
`, `3 2\nCounter(start=3)`, "Create two counters and verify that increasing one never changes the other.", "Each __init__ call assigns its own _value.", {
 prompt:"Implement Counter(start=0) with a read-only value property and increment(amount=1). Each counter owns its own value. Reject a negative start or increment with ValueError; zero is allowed.",hint:"Store the state on self and validate before changing it.",starter:py`class Counter:
    pass
`,solution:py`class Counter:
    def __init__(self, start=0):
        if start < 0:
            raise ValueError("start must be nonnegative")
        self._value = start
    @property
    def value(self):
        return self._value
    def increment(self, amount=1):
        if amount < 0:
            raise ValueError("amount must be nonnegative")
        self._value += amount
`,tests:py`@check("independent instance state")
def _():
    a, b = Counter(), Counter(2)
    a.increment(3)
    eq((a.value, b.value), (3, 2))
@check("default and zero increments")
def _():
    c = Counter()
    c.increment()
    c.increment(0)
    eq(c.value, 1)
@check("rejects negative values")
def _():
    raises(ValueError, Counter, -1)
    c = Counter(2)
    raises(ValueError, c.increment, -1)
    eq(c.value, 2)
@check("read-only property")
def _():
    c = Counter()
    raises(AttributeError, setattr, c, "value", 3)
`},"https://docs.python.org/3/tutorial/classes.html") },
{ after:"strings", lesson:make("text-processing", "Text processing & Unicode", "Clean and compare text without confusing characters, encoded bytes, and whitespace.", [
 "str holds Unicode text. strip removes whitespace at the ends, split() without arguments groups runs of whitespace, and join combines an iterable of strings.",
 "casefold is intended for caseless matching and may change string length. Unicode normalization and locale-specific language rules can require additional decisions.",
 "Encode text to bytes at a boundary and decode bytes explicitly, commonly using UTF-8. len(text) counts code points rather than bytes or necessarily visible characters."
], py`
text = "  Python   makes DSA fun  "
words = text.strip().split()
print(words)
print(" ".join(words).casefold())
print("Straße".casefold() == "STRASSE".casefold())
name = "café"
encoded = name.encode("utf-8")
print(len(name), len(encoded), encoded.decode("utf-8"))
`, `['Python', 'makes', 'DSA', 'fun']\npython makes dsa fun\nTrue\n4 5 café`, "Normalize the whitespace of a sentence without removing punctuation; compare strings using casefold.", "Split without an argument, join with a single space, then casefold.", {
 prompt:"Write normalize_text(text) returning a version with leading and trailing whitespace removed, internal whitespace runs collapsed to one space, and text casefolded. Preserve punctuation and return an empty string for whitespace-only input.",hint:"Use text.split(), ' '.join(...), and casefold().",starter:py`def normalize_text(text):
    raise NotImplementedError
`,solution:py`def normalize_text(text):
    return " ".join(text.split()).casefold()
`,tests:py`@check("whitespace and case")
def _():
    eq(normalize_text("  Hello   WORLD \n"), "hello world")
@check("empty input")
def _():
    eq(normalize_text(" \t "), "")
    eq(normalize_text(""), "")
@check("unicode casefold")
def _():
    eq(normalize_text("Straße"), "strasse")
@check("punctuation")
def _():
    eq(normalize_text("Hi,  THERE!"), "hi, there!")
`},"https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str") },
];
