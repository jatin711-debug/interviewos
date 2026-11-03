import { DSAProblem } from "./types";

export const STACK_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-st-1",
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    level: 1,
    category: "Stack & Monotonic Queue",
    difficulty: "Easy",
    acceptanceRate: "40.8%",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    patternIntuition: {
      ruleOfThumb: "Use a LIFO Stack: Push opening brackets onto the stack. When encountering a closing bracket, pop the top element and verify it matches the corresponding opening bracket.",
      recognitionTriggers: ["Nested bracket matching", "Ensuring innermost opened structures close first"],
      commonPitfalls: ["Popping from an empty stack when starting with a closing bracket like `)`", "Non-empty stack at the end (e.g. `(((`)"],
      templateSnippet: `def isValid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for c in s:
        if c in mapping:
            if not stack or stack[-1] != mapping[c]: return False
            stack.pop()
        else: stack.append(c)
    return not stack`,
    },
    timeComplexity: "O(N) - Single pass through string.",
    spaceComplexity: "O(N) - Stack storing up to N opening brackets.",
    starterCode: `class Solution:
    def isValid(self, s: str) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        matching = {')': '(', '}': '{', ']': '['}

        for ch in s:
            # If closing bracket, check top of stack
            if ch in matching:
                # If stack empty or top bracket doesn't match, invalid
                if not stack or stack[-1] != matching[ch]:
                    return False
                stack.pop()
            else:
                # Opening bracket -> push onto stack
                stack.append(ch)

        # Valid only if all opened brackets were successfully matched and popped
        return len(stack) == 0
`,
    testCases: [
      { id: 1, inputDesc: 's = "()"', expectedDesc: "true", args: ["()"], expected: true },
      { id: 2, inputDesc: 's = "()[]{}"', expectedDesc: "true", args: ["()[]{}"], expected: true },
      { id: 3, inputDesc: 's = "(]"', expectedDesc: "false", args: ["(]"], expected: false },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.isValid("()")
r2 = sol.isValid("()[]{}")
r3 = sol.isValid("(]")
passed = (r1 == True and r2 == True and r3 == False)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == True, "actual": r1, "expected": True},
    {"testCase": 2, "passed": r2 == True, "actual": r2, "expected": True},
    {"testCase": 3, "passed": r3 == False, "actual": r3, "expected": False}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-st-2",
    title: "Min Stack",
    slug: "min-stack",
    level: 2,
    category: "Stack & Monotonic Queue",
    difficulty: "Medium",
    acceptanceRate: "53.6%",
    description: `Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

Implement the \`MinStack\` class:
- \`MinStack()\` initializes the stack object.
- \`void push(int val)\` pushes the element val onto the stack.
- \`void pop()\` removes the element on the top of the stack.
- \`int top()\` gets the top element of the stack.
- \`int getMin()\` retrieves the minimum element in the stack.

You must implement a solution with **O(1)** time complexity for each function.`,
    examples: [
      { input: '["MinStack","push","push","push","getMin","pop","top","getMin"]\n[[],[-2],[0],[-3],[],[],[],[]]', output: '[null,null,null,null,-3,null,0,-2]' },
    ],
    constraints: ["-2^31 <= val <= 2^31 - 1", "Methods pop, top and getMin operations will always be called on non-empty stacks.", "At most 3 * 10^4 calls will be made to push, pop, top, and getMin."],
    patternIntuition: {
      ruleOfThumb: "Maintain an auxiliary stack `min_stack` that records the running minimum value at every depth alongside the primary stack. When pushing, push `min(val, min_stack[-1])`.",
      recognitionTriggers: ["Constant time O(1) state query on dynamic stack structures"],
      commonPitfalls: ["Using an integer `min_val`: when the minimum element is popped, you cannot find the previous minimum in O(1) without an auxiliary stack!"],
      templateSnippet: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []
    def push(self, val: int):
        self.stack.append(val)
        val = min(val, self.min_stack[-1] if self.min_stack else val)
        self.min_stack.append(val)
    def pop(self):
        self.stack.pop()
        self.min_stack.pop()
    def top(self): return self.stack[-1]
    def getMin(self): return self.min_stack[-1]`,
    },
    timeComplexity: "O(1) for push, pop, top, and getMin.",
    spaceComplexity: "O(N) - Storing elements in stack and min_stack.",
    starterCode: `class MinStack:
    def __init__(self):
        pass

    def push(self, val: int) -> None:
        pass

    def pop(self) -> None:
        pass

    def top(self) -> int:
        pass

    def getMin(self) -> int:
        pass
`,
    solutionCode: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []

    def push(self, val: int) -> None:
        self.stack.append(val)
        # Record running minimum at current stack depth
        current_min = min(val, self.min_stack[-1] if self.min_stack else val)
        self.min_stack.append(current_min)

    def pop(self) -> None:
        self.stack.pop()
        self.min_stack.pop()

    def top(self) -> int:
        return self.stack[-1]

    def getMin(self) -> int:
        return self.min_stack[-1]
`,
    testCases: [
      { id: 1, inputDesc: "push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()", expectedDesc: "getMin=-3, top=0, getMin=-2", args: [], expected: [-3, 0, -2] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

st = MinStack()
st.push(-2)
st.push(0)
st.push(-3)
m1 = st.getMin() # -3
st.pop()
t1 = st.top()    # 0
m2 = st.getMin() # -2
passed = (m1 == -3 and t1 == 0 and m2 == -2)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": [m1, t1, m2], "expected": [-3, 0, -2]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-st-3",
    title: "Evaluate Reverse Polish Notation",
    slug: "evaluate-reverse-polish-notation",
    level: 2,
    category: "Stack & Monotonic Queue",
    difficulty: "Medium",
    acceptanceRate: "50.4%",
    description: `You are given an array of strings \`tokens\` that represents an arithmetic expression in a **Reverse Polish Notation** (postfix notation).

Evaluate the expression. Return an integer that represents the value of the expression.

Valid operators are \`'+'\`, \`'-'\`, \`'*'\`, and \`'/'\`. Division between two integers always **truncates toward zero**.`,
    examples: [
      { input: 'tokens = ["2","1","+","3","*"]', output: "9", explanation: "((2 + 1) * 3) = 9" },
      { input: 'tokens = ["4","13","5","/","+"]', output: "6", explanation: "(4 + (13 / 5)) = 6" },
    ],
    constraints: ["1 <= tokens.length <= 10^4", "tokens[i] is either an operator or an integer in range [-200, 200]."],
    patternIntuition: {
      ruleOfThumb: "Postfix evaluation: Push operands to stack. When an operator is encountered, pop the right operand `b = pop()` then left operand `a = pop()`, evaluate `a op b`, and push result back.",
      recognitionTriggers: ["Evaluating RPN / postfix arithmetic notation"],
      commonPitfalls: ["Division order and rounding: In Python, `int(a / b)` truncates toward zero; `a // b` rounds down towards negative infinity (e.g. -6 // 132 == -1, but int(-6 / 132) == 0)!"],
      templateSnippet: `def evalRPN(tokens: list[str]) -> int:
    stack = []
    for t in tokens:
        if t in "+-*/":
            b, a = stack.pop(), stack.pop()
            if t == '+': stack.append(a + b)
            elif t == '-': stack.append(a - b)
            elif t == '*': stack.append(a * b)
            else: stack.append(int(a / b))
        else: stack.append(int(t))
    return stack[0]`,
    },
    timeComplexity: "O(N) - Single pass through tokens.",
    spaceComplexity: "O(N) - Stack storing operands.",
    starterCode: `class Solution:
    def evalRPN(self, tokens: list[str]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def evalRPN(self, tokens: list[str]) -> int:
        stack = []

        for token in tokens:
            if token in {"+", "-", "*", "/"}:
                # First popped is right operand, second popped is left operand
                b = stack.pop()
                a = stack.pop()

                if token == "+":
                    stack.append(a + b)
                elif token == "-":
                    stack.append(a - b)
                elif token == "*":
                    stack.append(a * b)
                elif token == "/":
                    # int(a / b) truncates toward zero in Python (unlike //)
                    stack.append(int(a / b))
            else:
                stack.append(int(token))

        return stack[0]
`,
    testCases: [
      { id: 1, inputDesc: 'tokens = ["2","1","+","3","*"]', expectedDesc: "9", args: [["2","1","+","3","*"]], expected: 9 },
      { id: 2, inputDesc: 'tokens = ["4","13","5","/","+"]', expectedDesc: "6", args: [["4","13","5","/","+"]], expected: 6 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.evalRPN(["2","1","+","3","*"])
r2 = sol.evalRPN(["4","13","5","/","+"])
passed = (r1 == 9 and r2 == 6)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 9, "actual": r1, "expected": 9},
    {"testCase": 2, "passed": r2 == 6, "actual": r2, "expected": 6}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-st-4",
    title: "Daily Temperatures",
    slug: "daily-temperatures",
    level: 3,
    category: "Stack & Monotonic Queue",
    difficulty: "Medium",
    acceptanceRate: "66.5%",
    description: `Given an array of integers \`temperatures\` represents the daily temperatures, return an array \`answer\` such that \`answer[i]\` is the number of days you have to wait after the \`i-th\` day to get a warmer temperature. If there is no future day for which this is possible, keep \`answer[i] == 0\` instead.`,
    examples: [
      { input: "temperatures = [73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" },
      { input: "temperatures = [30,40,50,60]", output: "[1,1,1,0]" },
    ],
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    patternIntuition: {
      ruleOfThumb: "Use a Monotonic Decreasing Stack storing indices `[idx]`. When the current temperature is warmer than `temperatures[stack[-1]]`, pop and calculate `days_waited = curr_idx - popped_idx`.",
      recognitionTriggers: ["Finding Next Greater Element (NGE) for every item in an array"],
      commonPitfalls: ["Storing temperature values on the stack instead of indices (indices give you both value and position difference)"],
      templateSnippet: `def dailyTemperatures(T: list[int]) -> list[int]:
    res = [0] * len(T)
    stack = [] # indices
    for i, t in enumerate(T):
        while stack and t > T[stack[-1]]:
            prev_i = stack.pop()
            res[prev_i] = i - prev_i
        stack.append(i)
    return res`,
    },
    timeComplexity: "O(N) - Every index is pushed and popped at most once.",
    spaceComplexity: "O(N) - Stack storing indices.",
    starterCode: `class Solution:
    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:
        pass
`,
    solutionCode: `class Solution:
    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:
        res = [0] * len(temperatures)
        stack = []  # Monotonic decreasing stack storing indices

        for curr_day, curr_temp in enumerate(temperatures):
            # While today is warmer than previous un-resolved days in stack
            while stack and curr_temp > temperatures[stack[-1]]:
                prev_day = stack.pop()
                res[prev_day] = curr_day - prev_day

            stack.append(curr_day)

        return res
`,
    testCases: [
      { id: 1, inputDesc: "temperatures = [73,74,75,71,69,72,76,73]", expectedDesc: "[1,1,4,2,1,1,0,0]", args: [[73,74,75,71,69,72,76,73]], expected: [1,1,4,2,1,1,0,0] },
      { id: 2, inputDesc: "temperatures = [30,40,50,60]", expectedDesc: "[1,1,1,0]", args: [[30,40,50,60]], expected: [1,1,1,0] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.dailyTemperatures([73,74,75,71,69,72,76,73])
r2 = sol.dailyTemperatures([30,40,50,60])
passed = (r1 == [1,1,4,2,1,1,0,0] and r2 == [1,1,1,0])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == [1,1,4,2,1,1,0,0], "actual": r1, "expected": [1,1,4,2,1,1,0,0]},
    {"testCase": 2, "passed": r2 == [1,1,1,0], "actual": r2, "expected": [1,1,1,0]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-st-5",
    title: "Largest Rectangle in Histogram",
    slug: "largest-rectangle-in-histogram",
    level: 5,
    category: "Stack & Monotonic Queue",
    difficulty: "Hard",
    acceptanceRate: "44.2%",
    description: `Given an array of integers \`heights\` representing the histogram's bar height where the width of each bar is \`1\`, return the area of the largest rectangle in the histogram.`,
    examples: [
      { input: "heights = [2,1,5,6,2,3]", output: "10", explanation: "The largest rectangle has height 5 and width 2 (bars 5 and 6), area = 10." },
      { input: "heights = [2,4]", output: "4" },
    ],
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Use a Monotonic Increasing Stack of `(start_index, height)`. When a shorter bar is encountered, pop the taller bar and calculate rectangle area with `width = current_index - start_index`. The popped bar's start_index extends backwards to the shorter bar!",
      recognitionTriggers: ["Finding maximum area in histograms or 2D binary matrices (Maximal Rectangle)"],
      commonPitfalls: ["Forgetting remaining bars in stack at the end of array: append a sentinel height of 0 to flush the entire stack automatically"],
      templateSnippet: `def largestRectangleArea(heights: list[int]) -> int:
    stack = [] # (index, height)
    max_area = 0
    for i, h in enumerate(heights + [0]):
        start = i
        while stack and stack[-1][1] > h:
            idx, height = stack.pop()
            max_area = max(max_area, height * (i - idx))
            start = idx
        stack.append((start, h))
    return max_area`,
    },
    timeComplexity: "O(N) - Each bar pushed and popped once.",
    spaceComplexity: "O(N) - Stack storing indices and heights.",
    starterCode: `class Solution:
    def largestRectangleArea(self, heights: list[int]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def largestRectangleArea(self, heights: list[int]) -> int:
        max_area = 0
        stack = []  # Monotonic increasing stack: (start_index, height)

        # Append sentinel height 0 to flush remaining bars in stack at the end
        for curr_idx, curr_h in enumerate(heights + [0]):
            start = curr_idx

            # While current height is shorter than top of stack
            while stack and stack[-1][1] > curr_h:
                popped_idx, popped_h = stack.pop()
                # Width extends from popped start index to current index
                width = curr_idx - popped_idx
                max_area = max(max_area, popped_h * width)
                # The shorter current bar can extend backward to popped_idx
                start = popped_idx

            stack.append((start, curr_h))

        return max_area
`,
    testCases: [
      { id: 1, inputDesc: "heights = [2,1,5,6,2,3]", expectedDesc: "10", args: [[2,1,5,6,2,3]], expected: 10 },
      { id: 2, inputDesc: "heights = [2,4]", expectedDesc: "4", args: [[2,4]], expected: 4 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.largestRectangleArea([2,1,5,6,2,3])
r2 = sol.largestRectangleArea([2,4])
passed = (r1 == 10 and r2 == 4)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 10, "actual": r1, "expected": 10},
    {"testCase": 2, "passed": r2 == 4, "actual": r2, "expected": 4}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
