// Both run in the browser: Python in Pyodide, JavaScript in a Web Worker.
export type PlaygroundLanguage = "python" | "javascript";
export const PLAYGROUND_LANGUAGES: Record<PlaygroundLanguage, { label: string; filename: string; monaco: string; examples: { name: string; code: string }[] }> = {
  python: { label: "Python", filename: "main.py", monaco: "python", examples: [
    { name: "Hello, Python", code: `# A little space to experiment\nname = "Ada"\nprint(f"Hello, {name}!")\n\nnumbers = [1, 2, 3, 4, 5]\nprint("Squares:", [number ** 2 for number in numbers])\n` },
    { name: "Two sum", code: `def two_sum(nums, target):\n    seen = {}\n    for index, number in enumerate(nums):\n        complement = target - number\n        if complement in seen:\n            return [seen[complement], index]\n        seen[number] = index\n    return []\n\nprint(two_sum([2, 7, 11, 15], 9))\n` },
    { name: "Read input", code: `# Add a name in the Input panel before running.\nname = input("What is your name? ")\nprint(f"Nice to meet you, {name}!")\n` },
    { name: "Frequency map", code: `from collections import Counter\n\nwords = ["tree", "graph", "tree", "heap", "graph", "tree"]\ncounts = Counter(words)\nfor word, count in counts.most_common():\n    print(f"{word}: {count}")\n` },
  ] },
  javascript: { label: "JavaScript", filename: "main.js", monaco: "javascript", examples: [
    { name: "Hello, JavaScript", code: `const name = "Ada";\nconsole.log(\`Hello, ${"${name}"}!\`);\n\nconst numbers = [1, 2, 3, 4, 5];\nconsole.log("Squares:", numbers.map(number => number ** 2));\n` },
    { name: "Two sum", code: `function twoSum(nums, target) {\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (seen.has(complement)) return [seen.get(complement), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));\n` },
    { name: "Read input", code: `// Add a name in the Input panel before running.\nconst name = prompt("What is your name? ");\nconsole.log(\`Nice to meet you, ${"${name}"}!\`);\n` },
  ] },
};

export const languageDraftKey = (language: PlaygroundLanguage) => language === "python" ? "interviewos:python-playground:code" : `interviewos:playground:${language}:code`;
export const languageInputKey = (language: PlaygroundLanguage) => language === "python" ? "interviewos:python-playground:input" : `interviewos:playground:${language}:input`;
