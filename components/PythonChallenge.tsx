"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import { Check, CheckCircle2, ChevronDown, CircleX, Copy, Download, Eye, EyeOff, FlaskConical, Laptop, Lightbulb, ListChecks, LoaderCircle, Play, RotateCcw, Trophy, Undo2, Upload } from "lucide-react";
import { CodeView } from "@/components/CodeView";
import { rich } from "@/components/RichText";
import type { LessonChallenge } from "@/data/python-course";
import { buildChallengeScript, needsLocalPython, readChallengeReport, type ChallengeReport, type ExecuteResponse } from "@/lib/python-challenge";
import { preloadPython } from "@/lib/browser-python";
import { apiFetch } from "@/lib/local-api";

const EDITOR_OPTIONS = { minimap: { enabled: false }, lineNumbers: "on", fontSize: 13, lineHeight: 20, tabSize: 4, insertSpaces: true, scrollBeyondLastLine: false, automaticLayout: true, padding: { top: 12, bottom: 12 }, wordWrap: "off" } as const;
const pythonDraftKey = (lessonId: string) => `interviewos:python-course:draft:v1:${lessonId}`;
/** Failed runs after which the solution opens without an "are you sure?" step. */
const ATTEMPTS_BEFORE_SOLUTION = 3;

/** Text that differs between graded challenge kinds. The defaults are the Python course's wording. */
export interface ChallengeLabels {
  title: string;
  ariaLabel: string;
  runtime: ReactNode;
  idle: string;
  running: string;
  allPassed: string;
  loadError: string;
  noReport: string;
}
const PYTHON_LABELS: ChallengeLabels = {
  title: "Challenge",
  ariaLabel: "Lesson challenge",
  runtime: "Python 3 · checked in your browser",
  idle: "Run the checks to grade your code. Passing every check completes this lesson.",
  running: "Running your code against the checks… (the first run loads Python, which takes a few seconds)",
  allPassed: "All checks passed. Lesson complete.",
  loadError: "Your code raised an error while loading",
  noReport: "The checks finished without a report. Make sure your code does not exit the interpreter.",
};

interface Props {
  lessonId: string;
  /** `tests` is only needed by the default Python grader. */
  challenge: Omit<LessonChallenge, "tests"> & { tests?: string };
  /** Code from a previous passing run, saved with your progress. */
  passedCode?: string;
  passedAt?: string;
  onPassed: (code: string) => void;
  /** Monaco language id for the editor. Defaults to Python. */
  language?: string;
  /** Builds the script sent to /api/execute; it must print a python-challenge report. Defaults to the Python lesson harness. */
  buildScript?: (code: string) => string;
  /** localStorage key for the draft. Defaults to the Python course's key for lessonId. */
  draftKey?: string;
  /** Leave out the prompt and hint, for pages that show them elsewhere. */
  hidePrompt?: boolean;
  labels?: Partial<ChallengeLabels>;
  /** Keep each check's error and output lines unwrapped (scrolling sideways), for aligned tables. */
  tabularResults?: boolean;
  /** "How the solution works" bullets shown with the revealed solution (`code` spans are rendered). */
  solutionNotes?: string[];
  /** A simpler solution to show first; the polished `challenge.solution` stays one click away. */
  simpleSolution?: string;
}

export function PythonChallenge({ lessonId, challenge, passedCode, passedAt, onPassed, language = "python", buildScript, draftKey, hidePrompt = false, labels: labelOverrides, tabularResults = false, solutionNotes, simpleSolution }: Props) {
  const labels = { ...PYTHON_LABELS, ...labelOverrides };
  const storageKey = draftKey ?? pythonDraftKey(lessonId);
  const [code, setCode] = useState(challenge.starter);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState<ChallengeReport | null>(null);
  const [runError, setRunError] = useState("");
  const [failedRuns, setFailedRuns] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [showPolished, setShowPolished] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [confirmLoad, setConfirmLoad] = useState(false);
  const [backup, setBackup] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef<() => void>(() => {});

  // Restore the browser draft first, then the last passing submission, then the starter.
  useEffect(() => { if (language === "python" || buildScript) preloadPython(); }, [language, buildScript]);

  useEffect(() => {
    let draft: string | null = null;
    try { draft = localStorage.getItem(storageKey); } catch { /* storage unavailable */ }
    setCode(draft ?? passedCode ?? challenge.starter);
    return () => abortRef.current?.abort();
    // Only on mount: the parent remounts this component for each lesson.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edit(value: string) {
    setCode(value);
    try {
      if (value === challenge.starter) localStorage.removeItem(storageKey);
      else localStorage.setItem(storageKey, value);
    } catch { /* drafts are best effort */ }
  }

  function reset() {
    if (code !== challenge.starter && !window.confirm("Replace your code with the starter code?")) return;
    edit(challenge.starter);
    setReport(null); setRunError("");
  }

  async function run() {
    if (running || !code.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setRunning(true); setRunError(""); setReport(null);
    let executed = false;
    try {
      const response = await apiFetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: "python", code, imports: challenge.tests ?? "", testWrapper: buildScript ? buildScript(code) : buildChallengeScript(code, challenge.tests ?? "") }),
        signal: controller.signal,
      });
      const data = await response.json() as ExecuteResponse;
      if (!response.ok) throw new Error(data.error || "The checks could not run.");
      executed = true;
      const parsed = readChallengeReport(data);
      if (!parsed) {
        const detail = data.timeout ? data.error : [data.error, data.stderr?.trim()].filter(Boolean).join("\n");
        throw new Error(detail || labels.noReport);
      }
      setReport(parsed);
      if (parsed.allPassed) onPassed(code);
      else setFailedRuns(count => count + 1);
    } catch (error) {
      if (controller.signal.aborted) return;
      setRunError(error instanceof Error ? error.message : "The checks could not run.");
      if (executed) setFailedRuns(count => count + 1);
    } finally {
      if (abortRef.current === controller) { abortRef.current = null; setRunning(false); }
    }
  }
  runRef.current = run;

  /** Python-course checks only (SQL practice passes its own grader). */
  const gradesLocally = !buildScript && needsLocalPython(challenge);
  const noStackSwitching = Boolean(report?.results.some(item => item.error?.includes("stack switching not supported")));

  // Download the graded script, to run with a local Python when the browser can't (threads, processes).
  function download() {
    const script = buildChallengeScript(code, challenge.tests ?? "");
    const url = URL.createObjectURL(new Blob([script], { type: "text/x-python" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `${lessonId}_checks.py` });
    link.click();
    URL.revokeObjectURL(url);
  }

  const passed = Boolean(passedAt) || Boolean(report?.allPassed);
  const canReveal = passed || failedRuns >= ATTEMPTS_BEFORE_SOLUTION;
  const passedCount = report?.results.filter(item => item.passed).length ?? 0;
  const lines = code.split("\n").length;
  const checkText = tabularResults ? "overflow-x-auto whitespace-pre" : "whitespace-pre-wrap break-words";

  return <section className="overflow-hidden rounded-2xl border border-[#304334] bg-[#141e23]" aria-label={labels.ariaLabel}>
    <div className={`border-b border-[#2b3a35] bg-[#1a2820] ${hidePrompt ? "px-4 py-3 sm:px-5" : "p-5 sm:p-6"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#d7eec7]"><FlaskConical className="h-4 w-4 text-[#c9f27b]" />{labels.title}</p>
        {passed && <span className="inline-flex items-center gap-1.5 rounded-md bg-[#c9f27b]/10 px-2.5 py-1 text-xs font-semibold text-[#c9f27b]"><Trophy className="h-3.5 w-3.5" />Passed{passedAt ? ` · ${new Date(passedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}` : ""}</span>}
      </div>
      {!hidePrompt && <p className="mt-3 text-sm leading-6 text-[#c3d3c5]">{challenge.prompt}</p>}
      {!hidePrompt && challenge.hint && <>
        <button onClick={() => setHintOpen(open => !open)} aria-expanded={hintOpen} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c9e9a8] hover:text-white"><Lightbulb className="h-3.5 w-3.5" />{hintOpen ? "Hide hint" : "Show hint"}<ChevronDown className={`h-3.5 w-3.5 transition ${hintOpen ? "rotate-180" : ""}`} /></button>
        {hintOpen && <p className="mt-2 rounded-lg border border-[#385241] bg-[#142019] p-3 text-sm leading-6 text-[#c0d1be]">{challenge.hint}</p>}
      </>}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2b3a35] px-4 py-2.5 sm:px-5">
      <p className="text-xs text-[#879b94]">{labels.runtime} · <kbd className="rounded border border-[#3a4c44] px-1 font-mono text-[10px]">Ctrl</kbd>+<kbd className="rounded border border-[#3a4c44] px-1 font-mono text-[10px]">Enter</kbd> to run{language === "python" && " · Ctrl+Space for suggestions · hover underlines for details"}</p>
      <div className="flex items-center gap-2">
        <button onClick={reset} disabled={running} className="inline-flex items-center gap-1.5 rounded-lg border border-[#394d42] px-3 py-2 text-xs font-medium text-[#c2d3c5] hover:bg-[#22332b] disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
        <button onClick={run} disabled={running || !code.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9f27b] px-3.5 py-2 text-xs font-semibold text-[#172418] hover:bg-[#dcffa1] disabled:opacity-60">{running ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}{running ? "Checking…" : "Run checks"}</button>
      </div>
    </div>

    <div className="bg-[#1e1e1e]" style={{ height: Math.min(520, Math.max(220, lines * 20 + 40)) }}>
      <MonacoEditor
        height="100%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={value => edit(value ?? "")}
        onMount={(editor, monaco) => { editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current()); }}
        loading={<div className="p-5 text-sm text-slate-400">Loading editor…</div>}
        options={EDITOR_OPTIONS}
      />
    </div>

    <div className="border-t border-[#2b3a35] bg-[#0e1718] p-4 sm:px-5" aria-live="polite">
      {gradesLocally && <div className="mb-3 rounded-lg border border-[#3d4f3a] bg-[#172219] p-3 text-xs leading-5 text-[#c3d3c5]">
        <p className="flex items-center gap-1.5 font-semibold text-[#d7eec7]"><Laptop className="h-3.5 w-3.5" />This challenge needs a local Python</p>
        <p className="mt-1">It uses threads or processes, which Python in the browser can&apos;t start. Download your code with the checks, run <code className="text-[#d7f2c3]">python {lessonId}_checks.py</code>, and mark the lesson complete when every check passes.</p>
        <button onClick={download} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#4a6450] px-3 py-1.5 font-semibold text-[#c9e9a8] hover:bg-[#22332b]"><Download className="h-3.5 w-3.5" />Download checks</button>
      </div>}
      {noStackSwitching && <p role="alert" className="mb-3 rounded-lg border border-amber-800/60 bg-amber-950/20 p-3 text-xs leading-5 text-amber-200">This browser can&apos;t run <code>asyncio.run()</code> inside browser Python (it needs WebAssembly stack switching, which recent Chrome and Edge have). Try Chrome or Edge, or <button onClick={download} className="font-semibold underline">download the checks</button> and run them with a local Python.</p>}
      {!report && !runError && !running && !gradesLocally && <p className="text-xs leading-5 text-[#81958b]">{labels.idle}</p>}
      {running && <p className="flex items-center gap-2 text-xs text-[#b8db9f]"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />{labels.running}</p>}
      {runError && <pre role="alert" className="whitespace-pre-wrap break-words rounded-lg border border-rose-900/60 bg-rose-950/30 p-3 font-mono text-xs leading-5 text-rose-200">{runError}</pre>}
      {report && <div className="space-y-3">
        <p className={`flex items-center gap-2 text-sm font-semibold ${report.allPassed ? "text-[#c9f27b]" : "text-[#f0c27b]"}`}>{report.allPassed ? <CheckCircle2 className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}{report.allPassed ? labels.allPassed : `${passedCount} of ${report.results.length} checks passed`}</p>
        {report.loadError && <div><p className="text-xs font-semibold text-rose-300">{labels.loadError}</p><pre className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-[#1a1416] p-3 font-mono text-xs leading-5 text-rose-200">{report.loadError}</pre></div>}
        {report.error && <pre className="whitespace-pre-wrap break-words rounded-lg bg-[#1a1416] p-3 font-mono text-xs leading-5 text-rose-200">{report.error}</pre>}
        {report.output && <div><p className="text-xs font-semibold text-[#aebfb5]">Printed while loading</p><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#121c1e] p-3 font-mono text-xs leading-5 text-[#c7d8ce]">{report.output}</pre></div>}
        <ul className="space-y-1.5">{report.results.map(item => <li key={item.name} className="rounded-lg border border-[#253430] bg-[#111b1d] px-3 py-2">
          <p className="flex items-start gap-2 text-[13px] leading-5 text-[#d3e0d6]">{item.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#bde887]" /> : <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />}<span>{item.name}</span></p>
          {item.error && <pre className={`ml-6 mt-1.5 ${checkText} font-mono text-xs leading-5 text-rose-200/90`}>{item.error}</pre>}
          {item.output && <pre className={`ml-6 mt-1.5 max-h-32 overflow-auto ${checkText} font-mono text-xs leading-5 text-[#9fb4a8]`}>{item.output}</pre>}
        </li>)}</ul>
      </div>}
    </div>

    <div className="border-t border-[#2b3a35] px-4 py-3 sm:px-5">
      {!solutionOpen && !confirmReveal && <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => (canReveal ? setSolutionOpen(true) : setConfirmReveal(true))} className="inline-flex items-center gap-1.5 rounded-lg border border-[#3d5545] px-3 py-1.5 text-xs font-semibold text-[#c9e9a8] hover:bg-[#1f2f25]"><Eye className="h-3.5 w-3.5" />Show solution</button>
        {!canReveal && <p className="text-xs text-[#71857c]">Tip: try the hint and a run or two first. You learn more from a near-miss than from reading the answer.</p>}
      </div>}
      {!solutionOpen && confirmReveal && <div role="alertdialog" aria-label="Show the solution?" className="rounded-lg border border-[#5a4d26] bg-[#262212] p-3">
        <p className="text-sm leading-6 text-[#efe2b8]">Show the solution now? {failedRuns === 0 ? "You haven't run your code yet." : `You've made ${failedRuns} attempt${failedRuns === 1 ? "" : "s"}.`} Peeking is fine when you're stuck. Afterwards, close it and try to write it again from memory.</p>
        <div className="mt-2 flex gap-2"><button onClick={() => { setConfirmReveal(false); setSolutionOpen(true); }} className="rounded-lg bg-[#e8d36b] px-3 py-1.5 text-xs font-semibold text-[#2a2410] hover:bg-[#f3e08a]">Show it</button><button onClick={() => setConfirmReveal(false)} className="rounded-lg border border-[#5a4d26] px-3 py-1.5 text-xs font-medium text-[#efe2b8] hover:bg-[#33301a]">Keep trying</button></div>
      </div>}
      {solutionOpen && (() => {
        const shown = showPolished || !simpleSolution ? challenge.solution : simpleSolution;
        const load = () => { setBackup(code); edit(shown); setConfirmLoad(false); setReport(null); setRunError(""); };
        return <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#d7eec7]"><Eye className="h-4 w-4 text-[#c9f27b]" />Solution{simpleSolution ? (showPolished ? " · polished reference" : " · simple version") : ""}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={async () => { try { await navigator.clipboard.writeText(shown); setCopiedSolution(true); setTimeout(() => setCopiedSolution(false), 1600); } catch { /* clipboard unavailable */ } }} className="inline-flex items-center gap-1.5 rounded-lg border border-[#394d42] px-2.5 py-1.5 text-xs font-medium text-[#c2d3c5] hover:bg-[#22332b]">{copiedSolution ? <Check className="h-3.5 w-3.5 text-[#c9f27b]" /> : <Copy className="h-3.5 w-3.5" />}{copiedSolution ? "Copied" : "Copy"}</button>
              {confirmLoad
                ? <span className="inline-flex items-center gap-1.5 text-xs text-[#efe2b8]">Replace your code?<button onClick={load} className="rounded-md bg-[#e8d36b] px-2 py-1 font-semibold text-[#2a2410]">Yes</button><button onClick={() => setConfirmLoad(false)} className="rounded-md border border-[#5a4d26] px-2 py-1">No</button></span>
                : <button onClick={() => (code.trim() === challenge.starter.trim() || code === shown ? load() : setConfirmLoad(true))} className="inline-flex items-center gap-1.5 rounded-lg border border-[#394d42] px-2.5 py-1.5 text-xs font-medium text-[#c2d3c5] hover:bg-[#22332b]"><Upload className="h-3.5 w-3.5" />Load into editor</button>}
              {backup !== null && backup !== code && <button onClick={() => { edit(backup); setBackup(null); setReport(null); }} className="inline-flex items-center gap-1.5 rounded-lg border border-[#394d42] px-2.5 py-1.5 text-xs font-medium text-[#c2d3c5] hover:bg-[#22332b]"><Undo2 className="h-3.5 w-3.5" />Restore my code</button>}
              <button onClick={() => { setSolutionOpen(false); setShowPolished(false); }} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#9fb4a8] hover:bg-[#22332b]"><EyeOff className="h-3.5 w-3.5" />Hide</button>
            </div>
          </div>
          {solutionNotes && solutionNotes.length > 0 && <div className="rounded-lg border border-[#2f4536] bg-[#16231c] p-4"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#91ae98]"><ListChecks className="h-3.5 w-3.5" />How the solution works</p><ol className="mt-3 space-y-2.5 text-sm leading-6 text-[#c3d3c5]">{solutionNotes.map((note, i) => <li key={i} className="flex gap-2.5"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#293b2d] text-[11px] font-bold text-[#c9eea5]">{i + 1}</span><span>{rich(note)}</span></li>)}</ol></div>}
          <div className="overflow-hidden rounded-lg border border-[#2b3a35]" style={{ height: Math.min(520, shown.trimEnd().split("\n").length * 21 + 32) }}>{language === "python" || language === "go" ? <CodeView code={shown} language={language} label="Solution code" /> : <pre className="h-full overflow-auto bg-[#1e1e1e] p-4 font-mono text-[13px] leading-5 text-[#d4d4d4]">{shown}</pre>}</div>
          {simpleSolution && <button onClick={() => setShowPolished(value => !value)} className="text-xs font-semibold text-[#c9e9a8] hover:text-white">{showPolished ? "← Back to the simple version" : "See the polished reference version (same idea, production style) →"}</button>}
        </div>;
      })()}
    </div>
  </section>;
}
