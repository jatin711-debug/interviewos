import { DSAProblem } from "./types";

export const INTERVALS_PROBLEMS: DSAProblem[] = [
  {
    id: "dsa-int-1",
    title: "Insert Interval",
    slug: "insert-interval",
    level: 3,
    category: "Intervals & Sweepline",
    difficulty: "Medium",
    acceptanceRate: "41.8%",
    description: `You are given an array of non-overlapping intervals \`intervals\` where \`intervals[i] = [start_i, end_i]\` sorted in ascending order by \`start_i\`. You are also given an interval \`newInterval = [start, end]\`. Insert \`newInterval\` into \`intervals\` such that \`intervals\` is still sorted and has no overlapping intervals (merge if necessary).`,
    examples: [
      { input: "intervals = [[1,3],[6,9]], newInterval = [2,5]", output: "[[1,5],[6,9]]" },
      { input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]", output: "[[1,2],[3,10],[12,16]]" },
    ],
    constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^5"],
    patternIntuition: {
      ruleOfThumb: "Three-phase traversal: 1) Append all intervals ending before newInterval starts. 2) Merge all overlapping intervals: `newInterval = [min(start), max(end)]`. 3) Append newInterval, then append all remaining intervals.",
      recognitionTriggers: ["Inserting and merging into pre-sorted intervals"],
      commonPitfalls: ["Inserting newInterval at the end when it belongs at the very beginning"],
      templateSnippet: `def insert(intervals, newInterval):
    res = []
    for i, intv in enumerate(intervals):
        if newInterval[1] < intv[0]:
            return res + [newInterval] + intervals[i:]
        elif newInterval[0] > intv[1]:
            res.append(intv)
        else:
            newInterval = [min(newInterval[0], intv[0]), max(newInterval[1], intv[1])]
    res.append(newInterval)
    return res`,
    },
    timeComplexity: "O(N) - Single pass through pre-sorted intervals.",
    spaceComplexity: "O(N) - Output list.",
    starterCode: `class Solution:
    def insert(self, intervals: list[list[int]], newInterval: list[int]) -> list[list[int]]:
        pass
`,
    solutionCode: `class Solution:
    def insert(self, intervals: list[list[int]], newInterval: list[int]) -> list[list[int]]:
        result = []

        for i, interval in enumerate(intervals):
            # Case 1: newInterval comes strictly before current interval (no overlap)
            if newInterval[1] < interval[0]:
                result.append(newInterval)
                return result + intervals[i:]
            # Case 2: newInterval comes strictly after current interval (no overlap)
            elif newInterval[0] > interval[1]:
                result.append(interval)
            # Case 3: Overlap occurs -> merge intervals into newInterval
            else:
                newInterval = [
                    min(newInterval[0], interval[0]),
                    max(newInterval[1], interval[1]),
                ]

        # If newInterval was merged to the very end
        result.append(newInterval)
        return result
`,
    testCases: [
      { id: 1, inputDesc: "intervals=[[1,3],[6,9]], newInterval=[2,5]", expectedDesc: "[[1,5],[6,9]]", args: [[[1,3],[6,9]], [2,5]], expected: [[1,5],[6,9]] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.insert([[1,3],[6,9]], [2,5])
passed = (r1 == [[1,5],[6,9]])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": r1, "expected": [[1,5],[6,9]]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-int-2",
    title: "Merge Intervals",
    slug: "merge-intervals",
    level: 3,
    category: "Intervals & Sweepline",
    difficulty: "Medium",
    acceptanceRate: "47.5%",
    description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^4"],
    patternIntuition: {
      ruleOfThumb: "Sort intervals by start time: `intervals.sort(key=lambda x: x[0])`. Iterate through intervals: if `current.start <= last.end`, merge by updating `last.end = max(last.end, current.end)`. Otherwise append current.",
      recognitionTriggers: ["Merging overlapping contiguous segments"],
      commonPitfalls: ["Forgetting to sort intervals before comparing"],
      templateSnippet: `def merge(intervals: list[list[int]]) -> list[list[int]]:
    intervals.sort(key=lambda i: i[0])
    output = [intervals[0]]
    for start, end in intervals[1:]:
        lastEnd = output[-1][1]
        if start <= lastEnd:
            output[-1][1] = max(lastEnd, end)
        else:
            output.append([start, end])
    return output`,
    },
    timeComplexity: "O(N log N) - Sorting dominates.",
    spaceComplexity: "O(N) - Output list.",
    starterCode: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        pass
`,
    solutionCode: `class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        # Sort intervals by start time
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0]]

        for start, end in intervals[1:]:
            last_end = merged[-1][1]

            # Overlap: current start <= previous end
            if start <= last_end:
                merged[-1][1] = max(last_end, end)
            else:
                # No overlap: append new interval
                merged.append([start, end])

        return merged
`,
    testCases: [
      { id: 1, inputDesc: "[[1,3],[2,6],[8,10],[15,18]]", expectedDesc: "[[1,6],[8,10],[15,18]]", args: [[[1,3],[2,6],[8,10],[15,18]]], expected: [[1,6],[8,10],[15,18]] },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.merge([[1,3],[2,6],[8,10],[15,18]])
passed = (r1 == [[1,6],[8,10],[15,18]])

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": passed, "actual": r1, "expected": [[1,6],[8,10],[15,18]]}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-int-3",
    title: "Non-overlapping Intervals",
    slug: "non-overlapping-intervals",
    level: 3,
    category: "Intervals & Sweepline",
    difficulty: "Medium",
    acceptanceRate: "53.2%",
    description: `Given an array of intervals \`intervals\` where \`intervals[i] = [start_i, end_i]\`, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.`,
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "1", explanation: "[1,3] can be removed and the rest of the intervals are non-overlapping." },
      { input: "intervals = [[1,2],[1,2],[1,2]]", output: "2" },
      { input: "intervals = [[1,2],[2,3]]", output: "0" },
    ],
    constraints: ["1 <= intervals.length <= 10^5", "intervals[i].length == 2", "-5 * 10^4 <= start_i < end_i <= 5 * 10^4"],
    patternIntuition: {
      ruleOfThumb: "Greedy Earliest End Time (Interval Scheduling): Sort intervals by start time. When two intervals overlap (`start < prevEnd`), greedily KEEP the one with the smaller end time (`prevEnd = min(prevEnd, end)`) because it leaves more room for subsequent intervals!",
      recognitionTriggers: ["Minimizing removals to achieve mutually disjoint intervals"],
      commonPitfalls: ["Sorting by start time and keeping the first interval (always keep the interval that finishes earliest)"],
      templateSnippet: `def eraseOverlapIntervals(intervals: list[list[int]]) -> int:
    intervals.sort()
    res = 0
    prevEnd = intervals[0][1]
    for start, end in intervals[1:]:
        if start >= prevEnd:
            prevEnd = end
        else:
            res += 1
            prevEnd = min(end, prevEnd)
    return res`,
    },
    timeComplexity: "O(N log N) - Sorting.",
    spaceComplexity: "O(1) - Constant variables.",
    starterCode: `class Solution:
    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def eraseOverlapIntervals(self, intervals: list[list[int]]) -> int:
        intervals.sort(key=lambda x: x[0])
        removals = 0
        prev_end = intervals[0][1]

        for start, end in intervals[1:]:
            # No overlap: update prev_end to current interval's end
            if start >= prev_end:
                prev_end = end
            else:
                # Overlap detected: remove one interval
                removals += 1
                # Greedily keep interval that ends earlier to minimize future collisions
                prev_end = min(prev_end, end)

        return removals
`,
    testCases: [
      { id: 1, inputDesc: "[[1,2],[2,3],[3,4],[1,3]]", expectedDesc: "1", args: [[[1,2],[2,3],[3,4],[1,3]]], expected: 1 },
      { id: 2, inputDesc: "[[1,2],[1,2],[1,2]]", expectedDesc: "2", args: [[[1,2],[1,2],[1,2]]], expected: 2 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.eraseOverlapIntervals([[1,2],[2,3],[3,4],[1,3]])
r2 = sol.eraseOverlapIntervals([[1,2],[1,2],[1,2]])
passed = (r1 == 1 and r2 == 2)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 1, "actual": r1, "expected": 1},
    {"testCase": 2, "passed": r2 == 2, "actual": r2, "expected": 2}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-int-4",
    title: "Meeting Rooms",
    slug: "meeting-rooms",
    level: 1,
    category: "Intervals & Sweepline",
    difficulty: "Easy",
    acceptanceRate: "58.2%",
    description: `Given an array of meeting time intervals consisting of start and end times \`[[s1,e1],[s2,e2],...]\` (\`si < ei\`), determine if a person could attend all meetings.`,
    examples: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", output: "false" },
      { input: "intervals = [[7,10],[2,4]]", output: "true" },
    ],
    constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i < end_i <= 10^6"],
    patternIntuition: {
      ruleOfThumb: "Sort meetings by start time: `intervals.sort(key=lambda x: x[0])`. Check adjacent pairs: if `intervals[i][0] < intervals[i - 1][1]`, a conflict exists $\to$ return False.",
      recognitionTriggers: ["Checking if any intervals overlap"],
      commonPitfalls: ["Allowing equal times (e.g. [2, 4] and [4, 6] do NOT overlap)"],
      templateSnippet: `def canAttendMeetings(intervals: list[list[int]]) -> bool:
    intervals.sort()
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i - 1][1]: return False
    return True`,
    },
    timeComplexity: "O(N log N) - Sorting.",
    spaceComplexity: "O(1) - Constant auxiliary memory.",
    starterCode: `class Solution:
    def canAttendMeetings(self, intervals: list[list[int]]) -> bool:
        pass
`,
    solutionCode: `class Solution:
    def canAttendMeetings(self, intervals: list[list[int]]) -> bool:
        intervals.sort(key=lambda x: x[0])

        for i in range(1, len(intervals)):
            # If current meeting starts before previous meeting ends, collision!
            if intervals[i][0] < intervals[i - 1][1]:
                return False

        return True
`,
    testCases: [
      { id: 1, inputDesc: "[[0,30],[5,10],[15,20]]", expectedDesc: "false", args: [[[0,30],[5,10],[15,20]]], expected: false },
      { id: 2, inputDesc: "[[7,10],[2,4]]", expectedDesc: "true", args: [[[7,10],[2,4]]], expected: true },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.canAttendMeetings([[0,30],[5,10],[15,20]])
r2 = sol.canAttendMeetings([[7,10],[2,4]])
passed = (r1 == False and r2 == True)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == False, "actual": r1, "expected": False},
    {"testCase": 2, "passed": r2 == True, "actual": r2, "expected": True}
]}))
print("JSON_OUTPUT_END")
`,
  },
  {
    id: "dsa-int-5",
    title: "Meeting Rooms II",
    slug: "meeting-rooms-ii",
    level: 4,
    category: "Intervals & Sweepline",
    difficulty: "Medium",
    acceptanceRate: "51.4%",
    description: `Given an array of meeting time intervals \`intervals\` where \`intervals[i] = [start_i, end_i]\`, return the minimum number of conference rooms required.`,
    examples: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", output: "2", explanation: "Meeting [0, 30] and [5, 10] overlap, so at least 2 rooms are required." },
      { input: "intervals = [[7,10],[2,4]]", output: "1" },
    ],
    constraints: ["1 <= intervals.length <= 10^4", "0 <= start_i < end_i <= 10^6"],
    patternIntuition: {
      ruleOfThumb: "Sweepline Algorithm / Two Pointers: Separate `start` and `end` times into two sorted arrays. Iterate through start times: if `start[s] < end[e]`, a room is currently occupied $\to$ increment room count. Else `e += 1` (a room was vacated).",
      recognitionTriggers: ["Finding maximum number of concurrent overlapping intervals at any instant"],
      commonPitfalls: ["Sorting full intervals without separating start and end times"],
      templateSnippet: `def minMeetingRooms(intervals: list[list[int]]) -> int:
    start = sorted([i[0] for i in intervals])
    end = sorted([i[1] for i in intervals])
    res = count = s = e = 0
    while s < len(intervals):
        if start[s] < end[e]:
            count += 1
            s += 1
        else:
            count -= 1
            e += 1
        res = max(res, count)
    return res`,
    },
    timeComplexity: "O(N log N) - Sorting start and end arrays.",
    spaceComplexity: "O(N) - Storing separate start and end arrays.",
    starterCode: `class Solution:
    def minMeetingRooms(self, intervals: list[list[int]]) -> int:
        pass
`,
    solutionCode: `class Solution:
    def minMeetingRooms(self, intervals: list[list[int]]) -> int:
        # Separate start and end timestamps into sorted lists
        start_times = sorted([i[0] for i in intervals])
        end_times = sorted([i[1] for i in intervals])

        max_rooms = 0
        active_rooms = 0
        s_ptr = 0
        e_ptr = 0

        while s_ptr < len(intervals):
            # A meeting has started before the earliest current meeting finished
            if start_times[s_ptr] < end_times[e_ptr]:
                active_rooms += 1
                s_ptr += 1
            else:
                # An earlier meeting has concluded, freeing up a conference room
                active_rooms -= 1
                e_ptr += 1

            max_rooms = max(max_rooms, active_rooms)

        return max_rooms
`,
    testCases: [
      { id: 1, inputDesc: "[[0,30],[5,10],[15,20]]", expectedDesc: "2", args: [[[0,30],[5,10],[15,20]]], expected: 2 },
      { id: 2, inputDesc: "[[7,10],[2,4]]", expectedDesc: "1", args: [[[7,10],[2,4]]], expected: 1 },
    ],
    runWrapper: (userCode: string) => `
import sys, json
${userCode}

sol = Solution()
r1 = sol.minMeetingRooms([[0,30],[5,10],[15,20]])
r2 = sol.minMeetingRooms([[7,10],[2,4]])
passed = (r1 == 2 and r2 == 1)

print("JSON_OUTPUT_START")
print(json.dumps({"allPassed": passed, "results": [
    {"testCase": 1, "passed": r1 == 2, "actual": r1, "expected": 2},
    {"testCase": 2, "passed": r2 == 1, "actual": r2, "expected": 1}
]}))
print("JSON_OUTPUT_END")
`,
  },
];
