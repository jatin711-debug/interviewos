import type { DsGuide } from "../types";

const py = (strings: TemplateStringsArray, ...values: unknown[]) => String.raw(strings, ...values).replace(/^\n/, "");

export const TREES_GUIDES: Record<string, DsGuide> = {
  "binary-tree": {
    level: "Beginner",
    analogy: "A family tree drawn upside down: one ancestor at the top (the root), and each person has at most two children below them. 'Traversing' the tree means visiting every person exactly once. The only question is the order: parents before children, children before parents, or one generation at a time.",
    explain: [
      "A **binary tree** is made of **nodes**. Each node holds a value and has up to two children, `left` and `right`. The top node is the **root**, and nodes with no children are **leaves**. A missing child is just `None`.",
      "Trees are naturally **recursive**: the left child is itself the root of a smaller tree (the left **subtree**), and so is the right child. So most tree code looks the same: handle the current node, then call the same function on `node.left` and `node.right`. The **base case** is an empty tree (`None`).",
      "The three depth-first orders differ only in **when you visit the node itself**: **preorder** = node, left, right (good for copying a tree). **Inorder** = left, node, right (in a search tree, this gives sorted order). **Postorder** = left, right, node (children finish first, so it's good for deleting a tree or computing sizes).",
      "**Level order** (breadth-first) visits the tree row by row, top to bottom. It uses a **queue**: take a node from the front, visit it, and add its children to the back.",
      "The **height** of a tree is the number of levels on the longest path from the root down to a leaf. Many tree operations cost O(height), so short, bushy trees are fast and long, skinny ones are slow.",
    ],
    simpleCode: py`
# A binary tree and the four classic ways to visit every node.
from collections import deque


class Node:
    def __init__(self, value, left=None, right=None):
        self.value = value
        self.left = left
        self.right = right

#         1
#       /   \
#      2     3
#     / \     \
#    4   5     6
root = Node(1, Node(2, Node(4), Node(5)), Node(3, None, Node(6)))


def preorder(node, out):          # node, then left subtree, then right subtree
    if node is None:              # base case: an empty tree has nothing to visit
        return
    out.append(node.value)
    preorder(node.left, out)
    preorder(node.right, out)

def inorder(node, out):           # left subtree, then node, then right subtree
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.value)
    inorder(node.right, out)

def postorder(node, out):         # left subtree, right subtree, then node
    if node is None:
        return
    postorder(node.left, out)
    postorder(node.right, out)
    out.append(node.value)

def level_order(root):            # row by row, using a queue
    out, queue = [], deque([root])
    while queue:
        node = queue.popleft()
        out.append(node.value)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return out

def height(node):                 # number of levels on the longest root-to-leaf path
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))


for name, walk in [("preorder ", preorder), ("inorder  ", inorder), ("postorder", postorder)]:
    result = []
    walk(root, result)
    print(name, result)
print("level    ", level_order(root))
print("height   ", height(root))
print("empty tree height:", height(None))
`,
    simpleOutput: `preorder  [1, 2, 4, 5, 3, 6]
inorder   [4, 2, 5, 1, 3, 6]
postorder [4, 5, 2, 6, 3, 1]
level     [1, 2, 3, 4, 5, 6]
height    3
empty tree height: 0`,
    codeNotes: [
      "A tree is just nodes linked by `left` and `right`. The comment shows the shape that the one-line `root = Node(...)` builds.",
      "All three recursive traversals share a structure: stop at `None`, otherwise handle `left`, `right` and the node itself. Only the position of `out.append(node.value)` changes.",
      "Trace preorder by hand: visit 1, go left to 2, visit it, go left to 4, visit it. 4's children are `None`, so return to 2 and go right to 5, and so on. Compare your answer with the output.",
      "`level_order` replaces recursion with a queue. Children are added to the back, so a whole level is finished before the next one starts.",
      "`height` is recursion at its neatest: an empty tree has height 0, otherwise it's 1 plus the taller subtree.",
    ],
    takeaways: [
      "Pre = node first, In = node in the middle, Post = node last.",
      "Recursive tree code: base case `None`, then recurse left and right.",
      "Level order uses a queue (BFS); depth-first orders use recursion or a stack.",
      "Every traversal is O(n); recursion depth is O(height).",
    ],
  },

  bst: {
    level: "Beginner",
    analogy: "Playing 'guess the number' with a friend who says 'higher' or 'lower'. Each answer rules out a whole range of numbers. A binary search tree stores numbers so that every node plays that game: smaller values are to the left, bigger ones to the right.",
    explain: [
      "A **binary search tree (BST)** is a binary tree with one rule, checked at **every** node: all values in the left subtree are smaller than the node, and all values in the right subtree are bigger.",
      "That rule makes searching fast. Start at the root. If the target is smaller, go left; if bigger, go right; if equal, you've found it. Each step goes one level down, so a search takes at most **height** steps. Insertion works the same way: walk down as if searching, and attach the new node where you fall off the tree.",
      "An **inorder** traversal (left, node, right) of a BST visits values in **sorted order**. That's a quick way to check that a tree really is a BST.",
      "Deleting has three cases. A **leaf** can just be removed. A node with **one child** is replaced by that child. A node with **two children** is trickier: copy in its **successor** (the smallest value in its right subtree, which is the next value up), then delete the successor from the right subtree.",
      "The catch is the shape. Insert random values and the height stays around log n, so operations are O(log n). Insert values **already in sorted order** and every node goes right, making a long chain with height n, so operations become O(n). Balanced trees (like AVL, next lesson) fix this.",
    ],
    simpleCode: py`
# A binary search tree: left subtree < node < right subtree, at every node.

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


def insert(node, value):
    """Insert value into the tree rooted at node; return the (possibly new) root."""
    if node is None:
        return Node(value)                 # fell off the tree: the new node goes here
    if value < node.value:
        node.left = insert(node.left, value)
    elif value > node.value:
        node.right = insert(node.right, value)
    return node                            # (duplicates are ignored)


def search(node, value):
    path = []
    while node is not None:
        path.append(node.value)
        if value == node.value:
            return True, path
        node = node.left if value < node.value else node.right   # go left or right
    return False, path


def inorder(node):
    if node is None:
        return []
    return inorder(node.left) + [node.value] + inorder(node.right)


def delete(node, value):
    if node is None:
        return None
    if value < node.value:
        node.left = delete(node.left, value)
    elif value > node.value:
        node.right = delete(node.right, value)
    else:                                  # found the node to delete
        if node.left is None:              # 0 or 1 child: replace it with the child
            return node.right
        if node.right is None:
            return node.left
        successor = node.right             # 2 children: find the smallest value on the right
        while successor.left is not None:
            successor = successor.left
        node.value = successor.value       # copy it up...
        node.right = delete(node.right, successor.value)   # ...and delete the copy below
    return node


root = None
for value in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, value)
print("inorder (sorted!):", inorder(root))

print("search 60 ->", search(root, 60))
print("search 65 ->", search(root, 65))

root = delete(root, 20)       # a leaf
root = delete(root, 30)       # now has one child (40)
root = delete(root, 50)       # the root, with two children: replaced by successor 60
print("after deleting 20, 30, 50:", inorder(root), "| new root:", root.value)

chain = None
for value in [1, 2, 3, 4, 5]:             # sorted input -> every node goes right
    chain = insert(chain, value)
print("sorted inserts make a chain; search 5 visits:", search(chain, 5)[1])
`,
    simpleOutput: `inorder (sorted!): [20, 30, 40, 50, 60, 70, 80]
search 60 -> (True, [50, 70, 60])
search 65 -> (False, [50, 70, 60])
after deleting 20, 30, 50: [40, 60, 70, 80] | new root: 60
sorted inserts make a chain; search 5 visits: [1, 2, 3, 4, 5]`,
    codeNotes: [
      "`insert` is recursive. It walks left or right by comparing values, and when it reaches `None` it creates the node there. Returning the node lets the parent reattach it.",
      "`search` walks down one path and records it. Searching for 60 visits only 50, 70 and 60, not the whole tree.",
      "`inorder` returns the values sorted. That follows directly from the left < node < right rule.",
      "`delete` handles all three cases. Look at the two-children branch: the successor is found by going right once and then left as far as possible.",
      "The last demo inserts 1 to 5 in order. The tree turns into a chain, and searching for 5 has to visit every node. That's the O(n) worst case.",
    ],
    takeaways: [
      "Rule: left < node < right, at every node.",
      "Search/insert/delete follow one root-to-leaf path: O(height).",
      "Inorder traversal gives sorted order.",
      "Sorted inserts make a chain (O(n)); balancing keeps it O(log n).",
    ],
  },

  "avl-tree": {
    level: "Advanced",
    analogy: "Think of a mobile hanging over a baby's crib. If one side gets too heavy, it tilts. You fix it by shifting where the arms connect, without removing any pieces. An AVL tree does the same: after each insert it checks the balance and 'rotates' nodes to level itself out.",
    explain: [
      "A plain BST can become a long chain, which makes it slow. An **AVL tree** is a BST that stays **balanced**: at every node, the heights of the left and right subtrees differ by at most 1. That guarantees a height of about 1.44 × log₂ n, so search, insert and delete are always **O(log n)**.",
      "Each node stores its **height**. The **balance factor** is `height(left) - height(right)`. It must be -1, 0 or +1. After inserting (an ordinary BST insert), we walk back up the path and recompute heights. If some node's balance becomes +2 or -2, that node is out of balance.",
      "We fix it with a **rotation**: a small local re-arrangement of 3 nodes that keeps the BST order but changes the shape. A **right rotation** lifts the left child up to replace its parent, and the parent becomes its right child. A **left rotation** is the mirror image.",
      "There are four cases, named by the path from the unbalanced node to the new value. **Left-Left**: one right rotation. **Right-Right**: one left rotation. **Left-Right**: first rotate the left child left (turning it into Left-Left), then rotate right. **Right-Left**: the mirror, rotating the right child right and then rotating left.",
      "You rarely write an AVL tree in real code. Python has none built in; use the `sortedcontainers` library or `bisect` on a list. But rotations show up in interviews and in every balanced tree, such as red-black trees and B-trees.",
    ],
    simpleCode: py`
# An AVL tree: a BST that rotates after each insert to stay balanced.

class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
        self.height = 1                    # a single node has height 1


def height(node):
    return node.height if node else 0

def update(node):
    node.height = 1 + max(height(node.left), height(node.right))

def balance(node):                         # > 1: left-heavy, < -1: right-heavy
    return height(node.left) - height(node.right)


def rotate_right(y):
    #       y            x
    #      /            / \
    #     x      ->    a   y
    #    / \              /
    #   a   b            b
    x = y.left
    y.left = x.right
    x.right = y
    update(y)
    update(x)
    return x                               # x is the new root of this subtree

def rotate_left(x):
    y = x.right
    x.right = y.left
    y.left = x
    update(x)
    update(y)
    return y


def insert(node, value):
    if node is None:
        return Node(value)
    if value < node.value:
        node.left = insert(node.left, value)
    else:
        node.right = insert(node.right, value)
    update(node)

    b = balance(node)
    if b > 1 and value < node.left.value:      # Left-Left
        print(f"   LL at {node.value}: rotate right")
        return rotate_right(node)
    if b < -1 and value > node.right.value:    # Right-Right
        print(f"   RR at {node.value}: rotate left")
        return rotate_left(node)
    if b > 1:                                  # Left-Right
        print(f"   LR at {node.value}: rotate left at {node.left.value}, then right")
        node.left = rotate_left(node.left)
        return rotate_right(node)
    if b < -1:                                 # Right-Left
        print(f"   RL at {node.value}: rotate right at {node.right.value}, then left")
        node.right = rotate_right(node.right)
        return rotate_left(node)
    return node


def shape(node):
    """Show the tree as nested (left, value, right) tuples."""
    if node is None:
        return "."
    return f"({shape(node.left)} {node.value} {shape(node.right)})"


root = None
for value in [10, 20, 30, 40, 50, 25]:
    print("insert", value)
    root = insert(root, value)
print("final tree:", shape(root))
print("root:", root.value, "| height:", root.height, "(a plain BST would have height 5)")
`,
    simpleOutput: `insert 10
insert 20
insert 30
   RR at 10: rotate left
insert 40
insert 50
   RR at 30: rotate left
insert 25
   RL at 20: rotate right at 40, then left
final tree: (((. 10 .) 20 (. 25 .)) 30 (. 40 (. 50 .)))
root: 30 | height: 3 (a plain BST would have height 5)`,
    codeNotes: [
      "Every node stores its `height`. `update` recomputes it from the children, and `balance` is the left height minus the right height.",
      "`rotate_right` and `rotate_left` change just two links, plus the heights of the two moved nodes. The diagram in the comment shows `x` moving up and `y` moving down, while `b` changes parents. The BST order is preserved.",
      "`insert` is the normal BST insert, followed by a balance check on the way back up the recursion. That's where any rotation happens.",
      "Inserting 10, 20, 30 makes a right-leaning chain, so the Right-Right case applies and a rotate-left at 10 makes 20 the root. Inserting 25 later triggers a Right-Left double rotation.",
      "`shape` prints the tree as `(left value right)`, with `.` for an empty child. The final height is 3, while the same inserts into a plain BST would give height 5.",
    ],
    takeaways: [
      "AVL rule: subtree heights differ by at most 1 at every node.",
      "Check the balance on the way back up after an insert.",
      "LL → rotate right; RR → rotate left; LR and RL → two rotations.",
      "Guaranteed O(log n) height, so every operation is O(log n).",
    ],
  },

  heap: {
    level: "Intermediate",
    analogy: "A hospital emergency room. Patients don't line up in arrival order: the most urgent case is always treated next. Whenever someone new arrives, they're slotted in by urgency. A heap is the data structure that always knows who is 'most urgent' and can hand them over quickly.",
    explain: [
      "A **heap** is a **priority queue**: you can add items in any order, and you can always remove the smallest one (a **min-heap**) quickly. Python's `heapq` module is a min-heap.",
      "Inside, a heap is a binary tree with one rule: **every parent is ≤ its children**. So the smallest item is always at the root. Unlike a BST, there's no left/right order between siblings. The tree is also always **complete**, filled row by row from left to right, so it's as short as possible: height ≈ log₂ n.",
      "Because it's complete, a heap is stored in a plain **list** with no node objects at all. The root is at index 0, and the node at index `i` has children at `2i + 1` and `2i + 2` and its parent at `(i - 1) // 2`.",
      "**Push**: put the new item at the end of the list (the next free spot in the bottom row), then **sift up**: while it's smaller than its parent, swap them. **Pop**: the answer is at index 0. Move the last item into the root, then **sift down**: while it's bigger than one of its children, swap it with the smaller child. Both walk one path of the tree, so they're **O(log n)**. Peeking at the smallest is O(1).",
      "Heaps are everywhere: Dijkstra's shortest path, scheduling, merging sorted lists, and the classic 'find the top k items' trick (keep a heap of size k).",
    ],
    simpleCode: py`
# A min-heap stored in a plain list. Parent of i: (i - 1) // 2. Children of i: 2i + 1 and 2i + 2.
import heapq


class MinHeap:
    def __init__(self):
        self.items = []

    def push(self, value):
        self.items.append(value)              # put it at the end of the bottom row...
        i = len(self.items) - 1
        while i > 0:                          # ...then sift it UP while it beats its parent
            parent = (i - 1) // 2
            if self.items[i] >= self.items[parent]:
                break
            self.items[i], self.items[parent] = self.items[parent], self.items[i]
            i = parent

    def pop(self):
        if not self.items:
            raise IndexError("pop from empty heap")
        smallest = self.items[0]
        last = self.items.pop()               # take the last item...
        if self.items:
            self.items[0] = last              # ...put it at the root...
            i = 0
            while True:                       # ...and sift it DOWN to where it belongs
                left, right = 2 * i + 1, 2 * i + 2
                child = i
                if left < len(self.items) and self.items[left] < self.items[child]:
                    child = left
                if right < len(self.items) and self.items[right] < self.items[child]:
                    child = right
                if child == i:                # both children are bigger: done
                    break
                self.items[i], self.items[child] = self.items[child], self.items[i]
                i = child
        return smallest

    def peek(self):
        return self.items[0]                  # the smallest is always at the root


heap = MinHeap()
for value in [5, 3, 8, 1, 9, 2]:
    heap.push(value)
    print(f"push {value} -> {heap.items}")
print("peek:", heap.peek())
print("pops:", [heap.pop() for _ in range(6)])   # comes out sorted

# The same with the standard library:
tasks = []
for priority, name in [(3, "email"), (1, "fix outage"), (2, "review PR")]:
    heapq.heappush(tasks, (priority, name))   # tuples compare by the first item first
print("next task:", heapq.heappop(tasks))
print("3 smallest of a list:", heapq.nsmallest(3, [7, 2, 9, 4, 1, 8]))
`,
    simpleOutput: `push 5 -> [5]
push 3 -> [3, 5]
push 8 -> [3, 5, 8]
push 1 -> [1, 3, 8, 5]
push 9 -> [1, 3, 8, 5, 9]
push 2 -> [1, 3, 2, 5, 9, 8]
peek: 1
pops: [1, 2, 3, 5, 8, 9]
next task: (1, 'fix outage')
3 smallest of a list: [1, 2, 4]`,
    codeNotes: [
      "The whole heap is `self.items`, a plain list. The index arithmetic `(i - 1) // 2`, `2i + 1` and `2i + 2` turns that list into a tree.",
      "`push` appends, then sifts up: swap with the parent while smaller. Look at `push 1` in the output: 1 travels all the way to index 0.",
      "`pop` saves the root, moves the last item into its place and sifts it down, always swapping with the **smaller** child so the parent ≤ children rule holds.",
      "Popping everything returns the values in sorted order. That's heap sort.",
      "In real code, use `heapq`. It works on a normal list. Push tuples like `(priority, name)` to order tasks by priority.",
    ],
    takeaways: [
      "Min-heap rule: parent ≤ children, so the minimum is at index 0.",
      "Stored as a list: children of i are at 2i+1 and 2i+2.",
      "push = append + sift up; pop = move last to root + sift down; both O(log n).",
      "Use `heapq`; negate values (or keys) for a max-heap.",
    ],
  },

  trie: {
    level: "Intermediate",
    analogy: "Think of your phone's autocomplete. After you type 'ca', it already knows every word that starts with 'ca': cat, car, cart. A trie stores words letter by letter in a tree, so words that share a beginning share the same path.",
    explain: [
      "A **trie** (pronounced 'try', from re**trie**val), also called a **prefix tree**, stores a set of strings. Each node stands for a prefix. The root is the empty string, and each edge adds one letter. Following the edges c → a → t spells 'cat'.",
      "Each node has a dict of **children** (letter → child node) and a flag `is_word` that marks whether a word ends exactly there. The flag matters: 'car' and 'cart' share a path, and only the flag at 'r' says 'car' is a word on its own.",
      "**Insert** walks letter by letter, creating missing children as it goes, then sets `is_word` on the last node. **Search** walks the same way. If a letter is missing, the word isn't there. At the end, the answer is the `is_word` flag. **starts_with(prefix)** is the same walk but ignores the flag: reaching the end of the prefix is enough.",
      "Every operation costs **O(length of the word)**, no matter how many words are stored. That's what makes tries great for autocomplete, spell-checkers, word games (Boggle, word search) and IP routing. The price is memory: one node per distinct prefix.",
    ],
    simpleCode: py`
# A trie (prefix tree): each node maps a letter to a child node.

class TrieNode:
    def __init__(self):
        self.children = {}      # letter -> TrieNode
        self.is_word = False    # does a word end exactly here?


class Trie:
    def __init__(self):
        self.root = TrieNode()  # the root stands for the empty prefix ""

    def insert(self, word):
        node = self.root
        for letter in word:
            if letter not in node.children:
                node.children[letter] = TrieNode()   # create the path as needed
            node = node.children[letter]
        node.is_word = True                          # mark the end of the word

    def _walk(self, text):
        """Follow text letter by letter; return the last node, or None if the path breaks."""
        node = self.root
        for letter in text:
            if letter not in node.children:
                return None
            node = node.children[letter]
        return node

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.is_word     # must END at a word

    def starts_with(self, prefix):
        return self._walk(prefix) is not None        # just needs the path to exist

    def words_with_prefix(self, prefix):
        """Autocomplete: every stored word that starts with prefix, alphabetically."""
        start = self._walk(prefix)
        results = []

        def collect(node, so_far):
            if node.is_word:
                results.append(so_far)
            for letter in sorted(node.children):
                collect(node.children[letter], so_far + letter)

        if start is not None:
            collect(start, prefix)
        return results


trie = Trie()
for word in ["cat", "car", "cart", "dog"]:
    trie.insert(word)

for word in ["car", "ca", "cart", "cow"]:
    print(f"search({word!r}) = {trie.search(word)}")
print("starts_with('ca') =", trie.starts_with("ca"))
print("autocomplete 'ca':", trie.words_with_prefix("ca"))
print("autocomplete 'd': ", trie.words_with_prefix("d"))
print("autocomplete 'x': ", trie.words_with_prefix("x"))
`,
    simpleOutput: `search('car') = True
search('ca') = False
search('cart') = True
search('cow') = False
starts_with('ca') = True
autocomplete 'ca': ['car', 'cart', 'cat']
autocomplete 'd':  ['dog']
autocomplete 'x':  []`,
    codeNotes: [
      "Each `TrieNode` has a `children` dict and an `is_word` flag. The letters live on the edges (the dict keys), not in the nodes.",
      "`insert` walks the word letter by letter and creates any missing child. 'car' reuses the 'c' → 'a' path that 'cat' made.",
      "`_walk` is the shared helper: follow the letters and return the node where you end up, or `None` if a letter is missing.",
      "`search('ca')` is `False` even though the path exists, because no word ends at 'a'. `starts_with('ca')` is `True` because it only needs the path.",
      "`words_with_prefix` walks to the prefix, then collects every word below it. That's autocomplete in about 10 lines.",
    ],
    takeaways: [
      "Each edge is one letter; each node is a prefix.",
      "`is_word` marks where a whole word ends.",
      "Insert/search/starts_with cost O(word length), not O(number of words).",
      "Great for prefixes: autocomplete, spell check, word games.",
    ],
  },
};
