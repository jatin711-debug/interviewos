import type { LessonRuntime, PythonLesson, PythonModule } from "./python-course";

/** Python source written flush-left in a raw template: backslashes stay literal and the leading newline is dropped. */
const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");
const docs = "https://docs.python.org/3/";
const lesson = (fields: Omit<PythonLesson, "runtime" | "challenge"> & { runtime?: LessonRuntime }): PythonLesson => ({ runtime: "browser", ...fields });

export const INTERNALS_MODULE: PythonModule = {
  id: "internals",
  title: "Python internals",
  description: "See how CPython stores objects, manages memory, and runs your code.",
  lessons: [
    lesson({
      id: "object-model",
      title: "Objects, identity & equality",
      summary: "Separate an object's identity from its value, and know which identity tricks are implementation details.",
      concepts: [
        "Every value is an object with an identity, a type and a value; a name is just a reference to one. id(obj) is unique only among objects alive at the same time, so an id can be reused after its object is freed. CPython happens to use the memory address, but treat ids as opaque.",
        "== compares values by calling __eq__, which classes can customize; is compares identity and cannot be overridden. Use is for singletons such as None and for sentinels you create with object(), which let a function tell \"no argument given\" apart from an explicit None. Use == for numbers, strings and everything else.",
        "CPython reuses some immutable objects: small integers (currently -5 to 256) are cached, many identifier-like strings are interned, and the compiler can merge equal constants within one code object. Since 3.12, None, True, False and small integers are also immortal, so their reference counts never change. All of this varies by version and context, so an is check on numbers or strings can pass in one place and fail in another; call sys.intern when you deliberately want shared strings.",
      ],
      code: py`
import sys

a = [1, 2]
b = a
c = [1, 2]
print(a is b, a == c, a is c)

MISSING = object()

def get(mapping, key, default=MISSING):
    value = mapping.get(key, MISSING)
    if value is not MISSING:
        return value
    if default is MISSING:
        raise KeyError(key)
    return default

print(get({"a": None}, "a"), get({}, "b", 0))

left = "".join(["inter", "view"])
right = "".join(["inter", "view"])
print(left == right, sys.intern(left) is sys.intern(right))
`,
      output: py`
True True False
None 0
True True`,
      exercise: "Predict the result of x is y after x = 256; y = 256, and after building two equal lists at runtime. Which of the two answers does the language guarantee?",
      hint: "Two separately created mutable objects are always distinct. Integer caching is a CPython optimization, not a language rule.",
      source: `${docs}reference/datamodel.html#objects-values-and-types`,
    }),
    lesson({
      id: "memory-gc",
      title: "Reference counting, GC & weak references",
      summary: "Know when CPython frees objects, what the cycle collector is for, and how weak references avoid keeping objects alive.",
      concepts: [
        "CPython counts the references to each object and frees it as soon as the count reaches zero, which is why an unreferenced file often closes on its own. That timing is a CPython detail: PyPy and other implementations use tracing collectors. Release files, sockets and locks with with or an explicit close(), not by relying on __del__.",
        "Reference counting alone cannot free cycles, such as two objects that point at each other or a caught exception that refers to the frame holding it. The gc module's cycle collector periodically finds unreachable groups of container objects, and gc.collect() forces a full pass. Generations and thresholds are tuning details, and recent versions have experimented with reworking the collector (for example, incremental collection to shorten pauses), so don't build behavior on them.",
        "A weak reference points at an object without keeping it alive. weakref.ref returns None once the object is gone, WeakValueDictionary drops entries automatically, and weakref.finalize runs a callback when an object is collected. They suit caches, registries and observer lists. sys.getrefcount is for debugging only: its numbers are implementation-specific and have changed between versions, so never assert on them.",
      ],
      code: py`
import gc
import weakref

class Node:
    def __init__(self, name):
        self.name = name
        self.peer = None

a = Node("a")
probe = weakref.ref(a)
del a
print("freed by refcount:", probe() is None)

b, c = Node("b"), Node("c")
b.peer, c.peer = c, b  # a reference cycle
probe = weakref.ref(b)
del b, c
gc.collect()
print("cycle collected:", probe() is None)

cache = weakref.WeakValueDictionary()
d = Node("d")
cache["d"] = d
before = len(cache)
del d
print("weak cache:", before, "->", len(cache))
`,
      output: py`
freed by refcount: True
cycle collected: True
weak cache: 1 -> 0`,
      exercise: "Build a small tree whose children point back to their parent. Store the back-reference with weakref.ref, delete the root, and confirm the whole tree is freed without calling gc.collect().",
      hint: "Keep self.parent = weakref.ref(parent) and call self.parent() to reach the parent (or get None).",
      source: `${docs}library/weakref.html`,
    }),
    lesson({
      id: "slots-memory",
      title: "Memory layout & __slots__",
      summary: "See where instance attributes live and when __slots__ is worth its trade-offs.",
      concepts: [
        "A normal instance stores its attributes in a per-instance __dict__. CPython shares one key table among instances of a class and, in recent versions, avoids building the dict until code asks for it, but every instance still has room for arbitrary new attributes. Containers hold references, not values: a list of a million floats is a million pointers plus a million float objects.",
        "__slots__ = (\"x\", \"y\") replaces the per-instance dict with fixed storage. The class gets a member descriptor for each name, instances have no __dict__ (and no __weakref__ unless you list it), and assigning an undeclared attribute raises AttributeError. That saves memory when you create many small objects and catches typos; on 3.10+, dataclass(slots=True) generates the slots for you.",
        "The trade-offs are real. Every class in a hierarchy must declare __slots__, listing only its new names, or instances get a __dict__ again; a class-level default can't share a name with a slot; and a class can't inherit from two bases that both have non-empty slots. Measure before and after: sys.getsizeof is shallow, so compare whole allocations with tracemalloc, and use array, bytes or NumPy for large homogeneous numeric data.",
      ],
      code: py`
from dataclasses import dataclass

class Point:
    __slots__ = ("x", "y")

    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
print(hasattr(p, "__dict__"), type(Point.x).__name__)
try:
    p.z = 3
except AttributeError:
    print("cannot add z")

class Point3(Point):
    pass  # no __slots__ here, so instances get a __dict__ again

print(hasattr(Point3(1, 2), "__dict__"))

@dataclass(slots=True)
class Pixel:
    x: int
    y: int

print(hasattr(Pixel(3, 4), "__dict__"), Pixel(3, 4))
`,
      output: py`
False member_descriptor
cannot add z
True
False Pixel(x=3, y=4)`,
      exercise: "Create 100,000 instances of a regular class and of a slotted class with the same two fields, and compare their memory with tracemalloc. Then measure a subclass that forgets __slots__.",
      hint: "Call tracemalloc.start(), build the list, read tracemalloc.get_traced_memory(), then stop. Compare the two runs rather than trusting sys.getsizeof.",
      source: `${docs}reference/datamodel.html#slots`,
    }),
    lesson({
      id: "data-model",
      title: "The data model: dunders, equality & hashing",
      summary: "Plug your classes into Python's syntax and built-ins without breaking dict, set and sorting invariants.",
      concepts: [
        "Operators and built-ins call special methods looked up on the type, not the instance. len(x) calls type(x).__len__, a + b tries a.__add__(b) and then b.__radd__(a), and a for loop calls __iter__. Return NotImplemented, rather than False or an exception, when you don't support the other operand, so Python can try the reflected method or fall back to its default.",
        "Hash-based containers rely on one rule: objects that compare equal must have equal hashes. Defining __eq__ without __hash__ sets __hash__ to None, which makes instances unhashable and is a safe default for mutable objects. For immutable objects, hash a tuple of exactly the fields __eq__ compares, and never hash a field that can change while the object is in a set or used as a dict key.",
        "functools.total_ordering derives <=, > and >= from __eq__ and one ordering method, at a small cost per comparison. dataclass(frozen=True, order=True) generates equality, hashing and ordering from the fields in declaration order, which is usually the clearest choice. Give every class a useful __repr__, since that is what you see in debuggers, logs and failed assertions.",
      ],
      code: py`
from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, text):
        self.parts = tuple(int(part) for part in text.split("."))

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self.parts == other.parts

    def __lt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self.parts < other.parts

    def __hash__(self):
        return hash(self.parts)

    def __repr__(self):
        return "Version(%r)" % ".".join(map(str, self.parts))

releases = {Version("1.10.0"), Version("1.2.3"), Version("1.2.3")}
print(sorted(releases))
print(Version("2.0") >= Version("1.9"), Version("1.0") == "1.0")

class Mutable:
    def __eq__(self, other):
        return isinstance(other, Mutable)

print(Mutable.__hash__ is None)
`,
      output: py`
[Version('1.2.3'), Version('1.10.0')]
True False
True`,
      exercise: "Give Version a mutable label field that is included in __hash__. Put a version in a set, change its label, and test membership. Explain what you see.",
      hint: "The set filed the object under its old hash, so the lookup searches in the wrong place.",
      source: `${docs}reference/datamodel.html#special-method-names`,
    }),
    lesson({
      id: "attribute-lookup",
      title: "Attribute lookup, descriptors & the MRO",
      summary: "Trace what obj.name really does, from descriptors to cooperative super() calls.",
      concepts: [
        "obj.name calls type(obj).__getattribute__. It first searches the class's MRO for a data descriptor (one that defines __set__ or __delete__, such as property), then checks the instance __dict__, then falls back to non-data descriptors and plain class attributes. Functions are non-data descriptors whose __get__ creates bound methods. Only when all of that raises AttributeError does Python call __getattr__.",
        "A descriptor is a class attribute that implements __get__ and optionally __set__, and __set_name__ tells it which name it was assigned to. One descriptor is shared by every instance, so keep per-instance values on the instance, never on the descriptor. Use __getattr__ for fallbacks such as proxies; override __getattribute__ only when you must intercept every access, and call super().__getattribute__ to avoid infinite recursion.",
        "Each class has a method resolution order computed by C3 linearization: subclasses come before their bases and the listed order of bases is kept, or class creation fails. super() means \"the next class after this one in the instance's MRO\", not \"my parent\". In multiple inheritance, every cooperating method should call super() and pass along the arguments it doesn't use, often via **kwargs.",
      ],
      code: py`
class Positive:
    def __set_name__(self, owner, name):
        self.private = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(self.private[1:] + " must be positive")
        setattr(obj, self.private, value)

class Order:
    quantity = Positive()

    def __init__(self, quantity):
        self.quantity = quantity

order = Order(3)
order.__dict__["quantity"] = -1  # the data descriptor still wins
print(order.quantity, sorted(vars(order)))
try:
    order.quantity = 0
except ValueError as error:
    print(error)

class Base:
    def path(self): return ["Base"]
class Left(Base):
    def path(self): return ["Left"] + super().path()
class Right(Base):
    def path(self): return ["Right"] + super().path()
class Child(Left, Right):
    def path(self): return ["Child"] + super().path()

print(Child().path())
`,
      output: py`
3 ['_quantity', 'quantity']
quantity must be positive
['Child', 'Left', 'Right', 'Base']`,
      exercise: "Add __getattr__ to Order so that names starting with opt_ return None and any other unknown name raises AttributeError. Why is it never called for quantity?",
      hint: "__getattr__ runs only after normal lookup fails. Raising AttributeError for unknown names keeps hasattr and getattr defaults working.",
      source: `${docs}howto/descriptor.html`,
    }),
    lesson({
      id: "profiling",
      title: "Profiling & measurement",
      summary: "Measure time and memory before optimizing, and read the numbers with suspicion.",
      concepts: [
        "Start with a hypothesis and a realistic input size, then measure. timeit runs a snippet many times and by default turns off the cycle collector while it times. Use repeat() and take the minimum to reduce noise, and use time.perf_counter for ad-hoc spans. Compare several input sizes so you see how cost grows, not just a constant factor.",
        "cProfile is a deterministic profiler: it records every call and reports call counts, tottime (time in the function itself) and cumtime (including its callees). It adds overhead to every call, so use it to find where time goes, not to time code precisely. For long-running or production processes, a sampling profiler such as py-spy attaches with much lower overhead.",
        "tracemalloc records memory allocated through Python's allocators, with the traceback that allocated it. get_traced_memory() returns current and peak bytes, and comparing two snapshots shows which lines allocated the difference. It doesn't see memory a native library allocates on its own, and tracing itself costs time and memory, so turn it on only while you investigate.",
      ],
      code: py`
import cProfile
import pstats
import timeit
import tracemalloc

def is_prime(n):
    return n > 1 and all(n % d for d in range(2, int(n ** 0.5) + 1))

def count_primes(limit):
    return sum(1 for n in range(limit) if is_prime(n))

runs = timeit.repeat(lambda: count_primes(2_000), number=5, repeat=3)
print("best of", len(runs), "runs measured:", min(runs) > 0)

profiler = cProfile.Profile()
profiler.runcall(count_primes, 2_000)
profile = pstats.Stats(profiler).get_stats_profile()
print("is_prime calls:", profile.func_profiles["is_prime"].ncalls)

tracemalloc.start()
squares = [n * n for n in range(100_000)]
current, peak = tracemalloc.get_traced_memory()
tracemalloc.stop()
print("peak covers the list:", peak >= current > 0)
`,
      output: py`
best of 3 runs measured: True
is_prime calls: 2000
peak covers the list: True`,
      exercise: "Compare building a string with += in a loop against \"\".join at three input sizes. Which numbers would you put in a design review, and what would you leave out?",
      hint: "Report the minimum of timeit.repeat for each size, and use cProfile only to confirm where the time goes.",
      runtime: "local",
      source: `${docs}library/profile.html`,
    }),
    lesson({
      id: "bytecode-gil",
      title: "Bytecode, the interpreter & the GIL",
      summary: "Follow source code to bytecode, and see what the GIL does and does not protect.",
      concepts: [
        "CPython compiles each module and function to a code object: bytecode plus constants, names and other metadata, cached in __pycache__ as .pyc files. The interpreter loop executes those instructions one at a time. dis shows them, which makes it clear that counter += 1 is a separate load, add and store. The instruction set changes in every release, so read bytecode to understand behavior but never depend on specific opcodes.",
        "Since 3.11, the specializing adaptive interpreter rewrites frequently executed instructions into type-specialized forms, such as attribute access for one particular class, and falls back when its guess stops holding. That is why hot loops over consistent types tend to run faster. Recent versions also include an experimental JIT compiler that is off unless you opt in.",
        "In the default build, the global interpreter lock lets only one thread run Python bytecode at a time. A waiting thread asks for it after the switch interval (sys.getswitchinterval(), 5 ms by default), and blocking I/O and many C extensions release it. The GIL protects the interpreter's own data, not your invariants, so a thread can be switched out between the load and the store of counter += 1. Python 3.13 added an optional free-threaded build without the GIL, experimental at first and officially supported but still separate and non-default in recent versions. On 3.13+, sys._is_gil_enabled() reports whether the GIL is active, because importing an extension that isn't marked as free-threading safe can switch it back on.",
      ],
      code: py`
import dis
import sys

counter = 0

def bump():
    global counter
    counter += 1

ops = [ins.opname for ins in dis.get_instructions(bump)]
print("load before store:", ops.index("LOAD_GLOBAL") < ops.index("STORE_GLOBAL"))

code = compile('greeting = "hi " + name', "<demo>", "exec")
print(type(code).__name__, code.co_names, "hi " in code.co_consts)

def gil_enabled():
    check = getattr(sys, "_is_gil_enabled", None)  # added in 3.13
    return True if check is None else check()

print("GIL enabled:", gil_enabled())  # False on a free-threaded build running without the GIL
`,
      output: py`
load before store: True
code ('name', 'greeting') True
GIL enabled: True`,
      exercise: "Disassemble a function that calls items.append(x) and one that runs counter += 1. Which one is a single call into a C method, and why do both still need a lock when they belong to a larger multi-step update?",
      hint: "append is one method call, while += reads, adds and writes back in separate instructions. A lock protects your invariant, not individual bytecodes.",
      source: `${docs}library/dis.html`,
    }),
  ],
};
