import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const LINEAR_GUIDES: Record<string, DsGuide> = {
  "dynamic-array": {
    level: "Beginner",
    analogy: "Imagine an egg carton. It holds a fixed number of eggs. When it's full and you buy one more egg, you don't buy a carton with one extra slot. You buy a carton twice as big and move all the eggs over. Moving eggs is a chore, but because the carton doubles each time, you rarely have to do it.",
    explain: [
      "An **array** is a block of memory split into equal slots, numbered 0, 1, 2... Because the slots are side by side and the same size, the computer can jump straight to slot `i` with simple arithmetic. That's why `my_list[i]` is O(1), as fast for item 1,000,000 as for item 0.",
      "The catch: a block of memory has a fixed size. A **dynamic array** hides this. It keeps a block with some spare room (the **capacity**) and remembers how many slots are actually used (the **size**). `append` just writes into the next free slot.",
      "When the block is full, it allocates a new block **twice as big**, copies every item across, and throws the old block away. That one append costs O(n). But after a doubling to capacity 2n, the next n appends are all cheap. Spread the copying cost over all those appends and each one costs O(1) on average. This is called **amortized O(1)**.",
      "Python's `list` is exactly this (it grows by about 1.125× rather than 2×, but the idea is the same). So `append` and `pop()` from the end are fast. Inserting or deleting at the **front or middle** is O(n), because every later item has to shift over by one slot.",
    ],
    simpleCode: py`
# A dynamic array: a fixed-size block that we replace with a bigger one when it fills up.

class DynamicArray:
    def __init__(self):
        self.capacity = 1                  # how many slots the block has
        self.size = 0                      # how many slots are in use
        self.block = [None] * self.capacity

    def append(self, value):
        if self.size == self.capacity:     # no free slot left -> grow
            self._grow()
        self.block[self.size] = value      # write into the first free slot
        self.size += 1

    def _grow(self):
        new_block = [None] * (self.capacity * 2)   # twice as big
        for i in range(self.size):                 # copy every item: this is the O(n) part
            new_block[i] = self.block[i]
        print(f"   grow: capacity {self.capacity} -> {self.capacity * 2}, copied {self.size} items")
        self.block = new_block
        self.capacity *= 2

    def get(self, index):
        if not 0 <= index < self.size:
            raise IndexError("index out of range")
        return self.block[index]           # direct jump to the slot: O(1)

    def pop(self):
        if self.size == 0:
            raise IndexError("pop from empty array")
        self.size -= 1
        value = self.block[self.size]
        self.block[self.size] = None       # forget the old value
        return value


arr = DynamicArray()
for value in [10, 20, 30, 40, 50]:
    print(f"append({value})")
    arr.append(value)

print("items:", [arr.get(i) for i in range(arr.size)])
print("size =", arr.size, "| capacity =", arr.capacity)
print("get(3) =", arr.get(3))
print("pop() =", arr.pop(), "| size now", arr.size)

try:
    arr.get(7)
except IndexError as error:
    print("get(7) -> IndexError:", error)
`,
    simpleOutput: `append(10)
append(20)
   grow: capacity 1 -> 2, copied 1 items
append(30)
   grow: capacity 2 -> 4, copied 2 items
append(40)
append(50)
   grow: capacity 4 -> 8, copied 4 items
items: [10, 20, 30, 40, 50]
size = 5 | capacity = 8
get(3) = 40
pop() = 50 | size now 4
get(7) -> IndexError: index out of range`,
    codeNotes: [
      "Two numbers describe the array: `capacity` (slots in the block) and `size` (slots in use). Items live in `block[0]` to `block[size - 1]`.",
      "`append` writes into `block[size]`, the first free slot. Most appends do only this, which is O(1).",
      "When `size == capacity`, `_grow` makes a block twice as big and copies the items across. In the output, the copies are 1, 2, then 4, a total of 7 copies for 5 appends. Doubling keeps the total copying under 2 × n.",
      "`get(index)` checks the bounds and reads the slot directly. Real arrays compute the address as start + index × slot size, which is why indexing is O(1).",
      "`pop` takes from the end, so nothing has to shift. Removing from the front would require moving every other item one slot left, which is O(n).",
    ],
    takeaways: [
      "Index access is O(1) because slots are contiguous and equal-sized.",
      "Append is O(1) amortized: occasionally O(n) to grow, but doubling makes that rare.",
      "Insert/delete at the front or middle is O(n): everything after it shifts.",
      "Python's `list` is a dynamic array; prefer `append`/`pop()` at the end.",
    ],
  },

  "singly-linked-list": {
    level: "Beginner",
    analogy: "Think of a treasure hunt. Each clue tells you where the next clue is hidden. To reach clue 5 you must follow clues 1, 2, 3 and 4. You can't jump. But adding a new clue is easy: change one note to point at the new clue, and have the new clue point where the old note used to.",
    explain: [
      "A **linked list** stores items in separate little boxes called **nodes**. Each node holds a value and a **pointer** (a reference) to the next node. The list itself only remembers the first node, the **head**. The last node points to `None`, meaning 'the end'.",
      "Because nodes can live anywhere in memory, there's no arithmetic shortcut to item `i`. You must start at the head and follow `next` pointers `i` times. So access by position is **O(n)**, much slower than an array.",
      "What you get in return: **inserting or removing is just re-pointing**. To add at the front, make the new node point to the old head, then make it the head. That's O(1), with no shifting at all. Removing a node means making the previous node skip over it.",
      "Most linked-list interview questions are **pointer puzzles**: reversing the list, finding the middle, detecting a cycle, merging two sorted lists. The trick is always to keep a few pointers (like `prev`, `current`, `next`) and change them in the right order so you never lose the rest of the list.",
    ],
    simpleCode: py`
# A singly linked list: each node knows its value and the NEXT node.

class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next          # the node after this one (None = end of list)


class LinkedList:
    def __init__(self):
        self.head = None          # the first node; None means the list is empty

    def push_front(self, value):
        self.head = Node(value, self.head)    # new node points at the old head: O(1)

    def append(self, value):
        new = Node(value)
        if self.head is None:
            self.head = new
            return
        current = self.head
        while current.next is not None:       # walk to the last node: O(n)
            current = current.next
        current.next = new

    def remove(self, value):
        """Remove the first node holding value. Return True if something was removed."""
        if self.head is None:
            return False
        if self.head.value == value:          # removing the head is a special case
            self.head = self.head.next
            return True
        prev = self.head
        while prev.next is not None:
            if prev.next.value == value:
                prev.next = prev.next.next    # skip over the node: it's now unreachable
                return True
            prev = prev.next
        return False

    def reverse(self):
        prev = None
        current = self.head
        while current is not None:
            nxt = current.next      # 1. remember the rest of the list
            current.next = prev     # 2. turn this node's arrow around
            prev = current          # 3. step both pointers forward
            current = nxt
        self.head = prev            # the old last node is the new head

    def __str__(self):
        parts = []
        current = self.head
        while current is not None:
            parts.append(str(current.value))
            current = current.next
        return " -> ".join(parts + ["None"])


items = LinkedList()
for value in [2, 3, 4]:
    items.append(value)
print("append 2, 3, 4:  ", items)
items.push_front(1)
print("push_front(1):   ", items)
items.remove(3)
print("remove(3):       ", items)
print("remove(99) found?", items.remove(99))
items.reverse()
print("reverse():       ", items)
`,
    simpleOutput: `append 2, 3, 4:   2 -> 3 -> 4 -> None
push_front(1):    1 -> 2 -> 3 -> 4 -> None
remove(3):        1 -> 2 -> 4 -> None
remove(99) found? False
reverse():        4 -> 2 -> 1 -> None`,
    codeNotes: [
      "`Node` is the box: a `value` and a `next` reference. The list object only stores `head`.",
      "`push_front` is one line: a new node whose `next` is the old head becomes the head. It is O(1) regardless of length.",
      "`append` has to walk from the head to the last node (the one whose `next` is `None`), which is O(n). Real implementations also keep a `tail` pointer so that `append` becomes O(1).",
      "`remove` keeps a `prev` pointer, because to delete a node you change the node *before* it: `prev.next = prev.next.next`. Removing the head is special because no node comes before it.",
      "`reverse` is the classic interview question. Each loop saves `next`, flips `current.next` to point backwards, then moves forward. The visualizer steps through exactly this.",
    ],
    takeaways: [
      "Nodes + `next` pointers; the list only knows its `head`.",
      "Access by index is O(n): you must walk from the head.",
      "Insert/remove at a known spot is O(1): just re-point arrows.",
      "When rewiring, save the next node *before* overwriting `.next`.",
    ],
  },

  "doubly-linked-list": {
    level: "Beginner",
    analogy: "A train: every carriage is coupled to the one in front AND the one behind. You can walk through the train in either direction, and to remove a carriage you only need that carriage. Its two couplings tell you exactly which neighbours to join together.",
    explain: [
      "A **doubly linked list** is a linked list where each node has two pointers: `next` (the node after) and `prev` (the node before). The list remembers both ends: the `head` (first node) and the `tail` (last node).",
      "Having both ends makes adding or removing at **either end O(1)**. `append` doesn't need to walk the list, because we already know the tail. `pop` from the end doesn't need to find the second-to-last node, because `tail.prev` is right there.",
      "The biggest win: if you already hold a node (for example, a dict gave it to you), you can **unlink it in O(1)**. Just connect its neighbours to each other: `node.prev.next = node.next` and `node.next.prev = node.prev`. A singly linked list can't do this, because the node doesn't know who comes before it.",
      "That's why the doubly linked list powers the LRU cache and Python's `collections.deque` (which uses linked blocks). The cost is an extra pointer per node and more careful bookkeeping: every change must update **both** directions.",
    ],
    simpleCode: py`
# A doubly linked list: each node knows the node BEFORE it and the node AFTER it.

class Node:
    def __init__(self, value):
        self.value = value
        self.prev = None
        self.next = None


class DoublyLinkedList:
    def __init__(self):
        self.head = None   # first node
        self.tail = None   # last node

    def append(self, value):            # add at the end: O(1) thanks to tail
        node = Node(value)
        if self.tail is None:           # empty list: node is both head and tail
            self.head = self.tail = node
        else:
            node.prev = self.tail       # link new node <-> old tail, both ways
            self.tail.next = node
            self.tail = node
        return node

    def push_front(self, value):        # add at the start: O(1)
        node = Node(value)
        if self.head is None:
            self.head = self.tail = node
        else:
            node.next = self.head
            self.head.prev = node
            self.head = node
        return node

    def unlink(self, node):             # remove ANY node we hold: O(1)
        if node.prev is not None:
            node.prev.next = node.next  # left neighbour now skips the node
        else:
            self.head = node.next       # node was the head
        if node.next is not None:
            node.next.prev = node.prev  # right neighbour now skips back over it
        else:
            self.tail = node.prev       # node was the tail
        node.prev = node.next = None

    def forward(self):
        out, node = [], self.head
        while node:
            out.append(node.value)
            node = node.next
        return out

    def backward(self):
        out, node = [], self.tail
        while node:
            out.append(node.value)
            node = node.prev
        return out


dll = DoublyLinkedList()
dll.append("B")
middle = dll.append("C")       # keep a reference to this node
dll.append("D")
dll.push_front("A")
print("forward: ", dll.forward())
print("backward:", dll.backward())

dll.unlink(middle)             # no searching: we already hold the node
print("after unlinking C:", dll.forward(), "| backward:", dll.backward())
dll.unlink(dll.head)           # remove the first node
dll.unlink(dll.tail)           # remove the last node
print("after removing both ends:", dll.forward(), "| head =", dll.head.value, "| tail =", dll.tail.value)
`,
    simpleOutput: `forward:  ['A', 'B', 'C', 'D']
backward: ['D', 'C', 'B', 'A']
after unlinking C: ['A', 'B', 'D'] | backward: ['D', 'B', 'A']
after removing both ends: ['B'] | head = B | tail = B`,
    codeNotes: [
      "Each `Node` has `prev` and `next`. The list keeps `head` and `tail`, so both ends are reachable instantly.",
      "`append` links in both directions: `node.prev = tail` and `tail.next = node`. Forgetting one side is the most common bug, because walking forward would work while walking backward would not.",
      "`push_front` is the mirror image of `append`, working at the head.",
      "`unlink` connects the node's two neighbours to each other. The `if`s handle the ends: when there's no left neighbour the node was the head, and when there's no right neighbour it was the tail.",
      "The demo keeps a reference to node C and removes it without searching. That's the special power of this structure, and the reason LRU caches use it.",
    ],
    takeaways: [
      "Every node has `prev` and `next`; the list tracks `head` and `tail`.",
      "Add/remove at both ends is O(1).",
      "Holding a node lets you unlink it in O(1): join its neighbours.",
      "Always update both directions, and handle the head/tail edge cases.",
    ],
  },

  stack: {
    level: "Beginner",
    analogy: "A stack of plates: you put new plates on top, and you take plates off the top. The plate you put down last is the first one you pick up. You never pull a plate out of the middle.",
    explain: [
      "A **stack** is a collection where you only touch the top. **push** puts an item on top, **pop** takes the top item off, and **peek** looks at the top without removing it. This rule is called **LIFO**: Last In, First Out.",
      "In Python, a plain `list` is a perfect stack: `append` is push, `pop()` is pop, and `items[-1]` is peek. All are O(1) because they work at the end of the list, where nothing needs to shift.",
      "Stacks appear whenever you have to **come back to things in reverse order**: the undo button, the browser back button, matching brackets, evaluating expressions, and the function call stack itself (every function call is pushed, and every return pops). Depth-first search uses a stack too.",
      "The classic example is checking brackets like `{[()]}`. Every opening bracket is pushed. Every closing bracket must match the **most recent** unmatched opening bracket, which is exactly the top of the stack. If it doesn't match, or the stack is empty when you need it, or items are left over at the end, the string is unbalanced.",
    ],
    simpleCode: py`
# A stack: push on top, pop from the top (Last In, First Out).

class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)        # the end of the list is the "top"

    def pop(self):
        if not self.items:
            raise IndexError("pop from empty stack")
        return self.items.pop()        # remove and return the top item

    def peek(self):
        if not self.items:
            raise IndexError("peek at empty stack")
        return self.items[-1]          # look at the top without removing it

    def is_empty(self):
        return len(self.items) == 0


def is_balanced(text):
    """Every closing bracket must match the most recent unmatched opening one."""
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = Stack()
    for ch in text:
        if ch in "([{":
            stack.push(ch)                         # remember it until it's closed
        elif ch in ")]}":
            if stack.is_empty() or stack.pop() != pairs[ch]:
                return False                       # nothing to close, or wrong kind
    return stack.is_empty()                        # leftovers = never closed


s = Stack()
for page in ["home", "search", "results"]:
    s.push(page)
    print("visit", page, "-> stack:", s.items)
print("back button pops:", s.pop(), "| now on:", s.peek())

for text in ["{[()]}", "([)]", "((", "())"]:
    print(f"is_balanced({text!r}) = {is_balanced(text)}")

try:
    Stack().pop()
except IndexError as error:
    print("IndexError:", error)
`,
    simpleOutput: `visit home -> stack: ['home']
visit search -> stack: ['home', 'search']
visit results -> stack: ['home', 'search', 'results']
back button pops: results | now on: search
is_balanced('{[()]}') = True
is_balanced('([)]') = False
is_balanced('((') = False
is_balanced('())') = False
IndexError: pop from empty stack`,
    codeNotes: [
      "The stack wraps a list and uses its **end** as the top, so `append` and `pop()` are both O(1). Using the front with `insert(0, x)` would be O(n).",
      "`pop` and `peek` raise `IndexError` on an empty stack, just like `list.pop()` does. Returning `None` instead would hide bugs.",
      "The browser-history demo shows LIFO: the last page visited is the first one the back button returns to.",
      "`is_balanced` pushes every opening bracket. Every closing bracket pops the top and checks it's the matching type.",
      "Three ways to fail: a closing bracket with an empty stack (`'())'`), the wrong type on top (`'([)]'`), or brackets left over at the end (`'(('`).",
    ],
    takeaways: [
      "LIFO: the last thing pushed is the first thing popped.",
      "A Python list's end is a perfect O(1) stack.",
      "Think 'stack' when you must undo or match things in reverse order.",
      "Recursion uses the call stack; deep recursion can be rewritten with an explicit stack.",
    ],
  },

  queue: {
    level: "Beginner",
    analogy: "A line at a ticket counter. New people join at the back, and the person at the front gets served next. Whoever has waited longest goes first. Nobody cuts in, and nobody leaves from the middle.",
    explain: [
      "A **queue** is a collection with two ends: you **enqueue** (add) at the back and **dequeue** (remove) from the front. This rule is **FIFO**: First In, First Out. It's the opposite of a stack.",
      "Don't build a queue with a plain list and `pop(0)`. Removing the first item of a list shifts every other item one slot to the left, which is O(n) per dequeue. Over a big queue, that's painfully slow.",
      "Use `collections.deque` (a 'double-ended queue'). It's built from linked blocks, so `append` at the back and `popleft` at the front are both O(1).",
      "Queues model anything handled **in arrival order**: print jobs, requests to a web server, tasks for workers, and most importantly **breadth-first search** (BFS), which explores a graph level by level by always taking the oldest discovered node next.",
    ],
    simpleCode: py`
# A queue: join at the back, leave from the front (First In, First Out).
from collections import deque


class Queue:
    def __init__(self):
        self.items = deque()           # deque: O(1) at BOTH ends

    def enqueue(self, item):
        self.items.append(item)        # join at the back

    def dequeue(self):
        if not self.items:
            raise IndexError("dequeue from empty queue")
        return self.items.popleft()    # leave from the front: O(1) with deque

    def peek(self):
        if not self.items:
            raise IndexError("peek at empty queue")
        return self.items[0]

    def __len__(self):
        return len(self.items)


line = Queue()
for person in ["Ana", "Ben", "Cho"]:
    line.enqueue(person)
    print("join:", person, "-> line:", list(line.items))

print("serve:", line.dequeue(), "| next up:", line.peek())
line.enqueue("Dev")
print("Dev joins -> line:", list(line.items))
while len(line) > 0:
    print("serve:", line.dequeue())

# Round-robin: each task gets 1 unit of work, then goes to the back if unfinished.
tasks = Queue()
for name, work in [("A", 2), ("B", 1), ("C", 3)]:
    tasks.enqueue((name, work))
order = []
while len(tasks) > 0:
    name, work = tasks.dequeue()
    order.append(name)
    if work > 1:
        tasks.enqueue((name, work - 1))   # not done yet: back of the line
print("round-robin order:", " ".join(order))
`,
    simpleOutput: `join: Ana -> line: ['Ana']
join: Ben -> line: ['Ana', 'Ben']
join: Cho -> line: ['Ana', 'Ben', 'Cho']
serve: Ana | next up: Ben
Dev joins -> line: ['Ben', 'Cho', 'Dev']
serve: Ben
serve: Cho
serve: Dev
round-robin order: A B C A C C`,
    codeNotes: [
      "`deque` gives O(1) `append` (back) and `popleft` (front). A list's `pop(0)` would be O(n) because it shifts everything left.",
      "`enqueue` adds at the back, and `dequeue` removes from the front. The person who has waited longest is served first.",
      "`peek` looks at the front item (`items[0]`) without removing it. `dequeue` raises `IndexError` when the queue is empty.",
      "The round-robin demo is how operating systems share a CPU: take the front task, do one unit of work, and send it to the back if it's not finished.",
    ],
    takeaways: [
      "FIFO: first in, first out.",
      "Use `collections.deque`; never `list.pop(0)` in a loop.",
      "Queues drive BFS, schedulers and anything 'in arrival order'.",
      "Stack = most recent first; queue = oldest first.",
    ],
  },
};
