"use client";

import { useState, type ReactNode } from "react";
import { Check, CheckCircle2, Copy, Lightbulb, Lock, Target } from "lucide-react";
import { CodeView } from "@/components/CodeView";
import type { DSAProblem } from "@/data/dsa";
import { TOPIC_GUIDES } from "@/data/dsa-curriculum";
import { LessonLinks } from "./LessonLinks";

export type ProblemTab = "problem" | "intuition" | "solution";
const TABS: ReadonlyArray<readonly [ProblemTab, string]> = [["problem", "Problem"], ["intuition", "Pattern intuition"], ["solution", "Solution"]];
const difficultyColor: Record<string, string> = { Easy: "text-emerald-400", Medium: "text-amber-400", Hard: "text-rose-400" };

interface ProblemPanelProps {
  problem: DSAProblem;
  solved: boolean;
  lockedTabs?: ProblemTab[]; // shown but not openable, e.g. during a mock interview
  lockedReason?: string;
  status?: ReactNode; // e.g. next review date
  children?: ReactNode; // rendered below the tab content
}

export function ProblemPanel({ problem, solved, lockedTabs = [], lockedReason = "Hidden for now", status, children }: ProblemPanelProps) {
  const [chosen, setChosen] = useState<ProblemTab>("problem");
  const tab = lockedTabs.includes(chosen) ? "problem" : chosen;
  return <section className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#0b111d]" aria-label="Problem details">
    <div className="border-b border-slate-800 p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-md bg-blue-500/10 px-2 py-1 text-blue-300">{problem.category}</span><span className={difficultyColor[problem.difficulty]}>{problem.difficulty}</span><span className="text-slate-500">· Level {problem.level}</span>{solved && <span className="ml-auto flex items-center gap-1 text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Solved</span>}</div>
      <h2 className="mt-3 text-xl font-bold text-white">{problem.title}</h2>
      {status && <div className="mt-1.5 text-xs text-slate-400">{status}</div>}
      <LessonLinks topic={problem.category} className="mt-3" />
    </div>
    <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-3" role="tablist" aria-label="Problem information">{TABS.map(([value, label]) => {
      const locked = lockedTabs.includes(value);
      return <button key={value} role="tab" aria-selected={tab === value} aria-disabled={locked} disabled={locked} title={locked ? lockedReason : undefined} onClick={() => setChosen(value)} className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium ${tab === value ? "border-blue-400 text-blue-300" : "border-transparent text-slate-400 hover:text-white"} disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:text-slate-600`}>{locked && <Lock className="h-3 w-3" />}{label}</button>;
    })}</div>
    <div className="max-h-[650px] overflow-y-auto p-5 text-sm leading-6 text-slate-300">
      {tab === "problem" && <div className="space-y-5"><p className="whitespace-pre-line">{problem.description.replace(/\*\*/g, "").replace(/`/g, "")}</p><div><h3 className="mb-2 font-semibold text-slate-100">Examples</h3><div className="space-y-2">{problem.examples.map((example, i) => <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 font-mono text-xs leading-6"><div><span className="text-slate-500">Input: </span><span className="break-words text-blue-200">{example.input}</span></div><div><span className="text-slate-500">Output: </span><span className="break-words text-emerald-200">{example.output}</span></div>{example.explanation && <p className="mt-1 font-sans text-slate-400">{example.explanation}</p>}</div>)}</div></div><div><h3 className="mb-2 font-semibold text-slate-100">Constraints</h3><ul className="list-disc space-y-1 pl-5 text-slate-400">{problem.constraints.map((constraint, i) => <li key={i}>{constraint}</li>)}</ul></div></div>}
      {tab === "intuition" && <div className="space-y-5"><div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4"><h3 className="flex items-center gap-2 font-semibold text-amber-300"><Lightbulb className="h-4 w-4" /> The idea</h3><p className="mt-2 text-amber-100/90">{problem.patternIntuition.ruleOfThumb}</p></div><div><h3 className="font-semibold text-white">When to use it</h3><ul className="mt-2 list-disc space-y-1 pl-5">{problem.patternIntuition.recognitionTriggers.map((x, i) => <li key={i}>{x}</li>)}</ul></div><div><h3 className="font-semibold text-white">Watch out for</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400">{problem.patternIntuition.commonPitfalls.map((x, i) => <li key={i}>{x}</li>)}</ul></div><div><h3 className="mb-2 font-semibold text-white">Pattern template</h3><pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 font-mono text-xs leading-5 text-blue-200">{problem.patternIntuition.templateSnippet}</pre></div>{TOPIC_GUIDES[problem.category] && <div className="rounded-lg border border-slate-800 p-4"><p className="flex items-center gap-2 font-semibold text-slate-200"><Target className="h-4 w-4 text-blue-400" /> Topic checkpoint</p><p className="mt-2 text-slate-400">{TOPIC_GUIDES[problem.category].checkpoint}</p></div>}</div>}
      {tab === "solution" && <SolutionTab problem={problem} />}
    </div>
    {children}
  </section>;
}

/** The worked solution: the idea in words, the cost, then highlighted code you can copy. */
function SolutionTab({ problem }: { problem: DSAProblem }) {
  const [copied, setCopied] = useState(false);
  const lines = problem.solutionCode.trimEnd().split("\n").length;
  return <div className="space-y-4">
    <p className="text-slate-400">Try explaining your approach and edge cases out loud before reading the code.</p>
    <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-4">
      <h3 className="text-sm font-semibold text-blue-200">The approach in one line</h3>
      <p className="mt-1.5 text-sm leading-6 text-slate-200">{problem.patternIntuition.ruleOfThumb}</p>
      {problem.patternIntuition.commonPitfalls.length > 0 && <><h4 className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Watch out for</h4><ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-300">{problem.patternIntuition.commonPitfalls.map((pitfall, i) => <li key={i}>{pitfall}</li>)}</ul></>}
    </div>
    <div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs text-slate-500">TIME</p><p className="mt-1 text-xs text-emerald-300">{problem.timeComplexity}</p></div><div className="rounded-lg bg-slate-950 p-3"><p className="text-xs text-slate-500">SPACE</p><p className="mt-1 text-xs text-blue-300">{problem.spaceComplexity}</p></div></div>
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-2"><p className="text-xs font-semibold text-slate-300">Solution code</p><button onClick={async () => { try { await navigator.clipboard.writeText(problem.solutionCode); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ } }} className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800">{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</button></div>
      <div style={{ height: Math.min(560, lines * 21 + 32) }}><CodeView code={problem.solutionCode} language="python" label={`${problem.title} solution`} /></div>
    </div>
  </div>;
}
