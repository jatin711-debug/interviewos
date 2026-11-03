"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Play, CheckCircle2, XCircle, Clock, Terminal, RotateCcw, AlertTriangle, Maximize2, Minimize2 } from "lucide-react";
import type { ProblemProgress } from "@/lib/storage";
import { MonacoEditor } from "@/components/MonacoEditor";
import { apiFetch } from "@/lib/local-api";

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  lineHeight: 21,
  fontFamily: "JetBrains Mono, Fira Code, monospace",
  lineNumbers: "on",
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 4,
  bracketPairColorization: { enabled: true },
  padding: { top: 12, bottom: 12 },
} as const;

// Quality values follow SM-2: below 3 resets the review interval.
const RATINGS = [
  { label: "Again", quality: 1, hint: "Needed the solution" },
  { label: "Hard", quality: 3, hint: "Got there slowly" },
  { label: "Good", quality: 4, hint: "Some thinking" },
  { label: "Easy", quality: 5, hint: "Fluent" },
] as const;

interface CodeEditorProps {
  initialCode: string; // starter code; Reset returns here
  savedCode?: string; // used when there is no draft
  draftKey?: string; // localStorage key for the in-progress draft
  runWrapper?: (userCode: string) => string;
  problemId?: string; // enables saving progress and review scheduling
  askRating?: boolean;
  onSuccess?: (progress: ProblemProgress) => void;
  onResult?: (passed: boolean) => void;
  onRated?: (progress: ProblemProgress) => void;
  /** Fill the parent's height (the parent must set one) instead of using a fixed editor height. */
  fill?: boolean;
}

export function CodeEditor({
  initialCode,
  savedCode,
  draftKey,
  runWrapper,
  problemId,
  askRating = true,
  onSuccess,
  onResult,
  onRated,
  fill = false,
}: CodeEditorProps) {
  const language = "python";
  const [code, setCode] = useState(savedCode ?? initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [rating, setRating] = useState<"hidden" | "open" | "saving" | "error" | { nextReviewDate: string }>("hidden");
  const [focused, setFocused] = useState(false);
  const runRef = useRef<() => void>(() => {});
  const [output, setOutput] = useState<{
    success?: boolean;
    runtimeMs?: number;
    stdout?: string;
    stderr?: string;
    testResults?: any;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!draftKey) return;
    try {
      setCode(localStorage.getItem(draftKey) ?? savedCode ?? initialCode);
    } catch {
      setCode(savedCode ?? initialCode);
    }
    // The editor remounts when the selected problem or mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const updateCode = (value: string) => {
    setCode(value);
    if (draftKey) {
      try { localStorage.setItem(draftKey, value); }
      catch { setSaveError("Your browser could not save this draft."); }
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    setSaveError("");
    setRating("hidden");
    let passed = false;

    try {
      const codeToExecute = runWrapper ? runWrapper(code) : code;
      const res = await apiFetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          testWrapper: codeToExecute,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Execution failed");
      setOutput(data);
      passed = data.success && data.testResults?.allPassed === true;

      if (passed && problemId) {
        const saved: ProblemProgress = {
          solved: true, userCode: code, language, solvedAt: new Date().toISOString(),
        };
        try {
          const response = await apiFetch("/api/state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ progress: { [problemId]: saved } }),
          });
          if (!response.ok) throw new Error("Unable to save progress");
          const result = await response.json();
          onSuccess?.(result.state?.progress?.[problemId] ?? saved);
          if (askRating) setRating("open");
        } catch {
          setSaveError("Your solution passed, but progress could not be saved.");
        }
      }
    } catch (err: any) {
      setOutput({
        success: false,
        error: `Client request failed: ${err.message}`,
      });
    } finally {
      setIsRunning(false);
      onResult?.(passed);
    }
  };

  const rate = async (quality: number) => {
    if (!problemId) return;
    setRating("saving");
    try {
      const response = await apiFetch("/api/dsa/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId, quality }),
      });
      const data = await response.json();
      if (!response.ok || !data.progress) throw new Error(data.error || "Unable to schedule review");
      setRating({ nextReviewDate: data.progress.review.nextReviewDate });
      onRated?.(data.progress);
    } catch {
      setRating("error");
    }
  };

  // Focus mode: the workspace fills the window. Esc or the button returns to the page layout.
  useEffect(() => {
    if (!focused) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setFocused(false); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", onKey); };
  }, [focused]);

  const handleReset = () => {
    updateCode(initialCode);
    setOutput(null);
    setRating("hidden");
  };

  runRef.current = () => { if (!isRunning) handleRun(); };
  const fills = fill || focused;

  const workspace = (
    <div role={focused ? "dialog" : undefined} aria-modal={focused || undefined} aria-label={focused ? "Code workspace" : undefined}
      className={`flex flex-col bg-[#0a0e17] rounded-xl border border-slate-800 overflow-hidden shadow-2xl ${focused ? "fixed inset-2 z-50 sm:inset-4" : fills ? "h-full" : ""}`}>
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
            {language} workspace
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            onClick={() => setFocused(value => !value)}
            aria-pressed={focused}
            title={focused ? "Exit focus mode (Esc)" : "Focus mode: fill the window"}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded border border-slate-700/60 transition"
          >
            {focused ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span className="hidden sm:inline">{focused ? "Exit focus" : "Focus"}</span>
          </button>
          <button
            onClick={handleRun}
            title="Run test cases (Ctrl+Enter)"
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Running Local Subprocess..." : "Run Test Cases"}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Area */}
      <div className={`w-full ${fills ? "min-h-[240px] flex-1" : "h-[540px]"}`}>
        <MonacoEditor
          eager
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val) => updateCode(val || "")}
          onMount={(editor, monaco) => { editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current()); }}
          loading={<div className="p-5 text-sm text-slate-400">Loading editor…</div>}
          options={EDITOR_OPTIONS}
        />
      </div>

      {/* Execution Results Console */}
      <div className={`bg-slate-950 border-t border-slate-800 p-4 font-mono text-xs overflow-y-auto ${fills ? "h-[32%] min-h-[150px] shrink-0" : "flex-1 min-h-[160px]"}`}>
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-900 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-slate-300">Execution Console</span>
          </div>
          {output?.runtimeMs !== undefined && (
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{output.runtimeMs} ms</span>
            </div>
          )}
        </div>

        {!output && !isRunning && (
          <div className="text-slate-500 italic py-3">
            Write your solution, then run the test cases.{draftKey ? " Drafts are saved in this browser." : ""}
          </div>
        )}

        {isRunning && (
          <div className="flex items-center gap-2 text-blue-400 py-3">
            <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Running test cases locally...</span>
          </div>
        )}

        {saveError && <div role="alert" className="mb-3 text-amber-300">{saveError}</div>}
        {rating !== "hidden" && (
          <div className="mb-3 rounded-lg border border-emerald-800/50 bg-emerald-950/20 p-3 font-sans">
            {typeof rating === "object" ? (
              <p className="text-xs text-emerald-200">
                Scheduled. Re-solve it from scratch on{" "}
                <span className="font-semibold">{new Date(rating.nextReviewDate).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</span>.
              </p>
            ) : (
              <>
                <p className="text-xs font-semibold text-emerald-200">How did that feel?</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Your answer decides when this problem comes back for a from-scratch review.</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {RATINGS.map(option => (
                    <button
                      key={option.label}
                      onClick={() => rate(option.quality)}
                      disabled={rating === "saving"}
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-left transition hover:border-emerald-600 disabled:opacity-50"
                    >
                      <span className="block text-xs font-semibold text-slate-100">{option.label}</span>
                      <span className="block text-[10px] text-slate-400">{option.hint}</span>
                    </button>
                  ))}
                </div>
                {rating === "error" && <p role="alert" className="mt-2 text-[11px] text-amber-300">Could not schedule the review. Try again.</p>}
              </>
            )}
          </div>
        )}
        {output && (
          <div className="space-y-3">
            {/* Structured test cases results */}
            {output.testResults?.results && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  {output.testResults.allPassed ? (
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      All Test Cases Passed!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-rose-400">
                      <XCircle className="w-4 h-4" />
                      Test Case Assertions Failed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {output.testResults.results.map((res: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded border text-xs ${
                        res.passed
                          ? "bg-emerald-950/20 border-emerald-800/60 text-emerald-200"
                          : "bg-rose-950/20 border-rose-800/60 text-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>Case {res.testCase}</span>
                        <span>{res.passed ? "PASSED" : "FAILED"}</span>
                      </div>
                      {res.error && (
                        <div className="mt-1 text-rose-300 font-mono text-[11px]">
                          Runtime Error: {res.error}
                        </div>
                      )}
                      {!res.passed && res.expected !== undefined && (
                        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <div>Expected: <span className="text-emerald-400 font-mono">{JSON.stringify(res.expected)}</span></div>
                          <div>Actual: <span className="text-rose-400 font-mono">{JSON.stringify(res.actual)}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error or Timeout alert */}
            {output.error && (
              <div className="p-3 bg-red-950/30 border border-red-800 rounded text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">{output.error}</div>
                  {output.stderr && (
                    <pre className="mt-2 text-[11px] text-red-200 whitespace-pre-wrap">{output.stderr}</pre>
                  )}
                </div>
              </div>
            )}

            {!output.success && !output.error && output.stderr && (
              <pre className="whitespace-pre-wrap rounded bg-red-950/30 p-3 text-red-200">{output.stderr}</pre>
            )}

            {/* Raw stdout output */}
            {output.stdout && !output.testResults && (
              <div>
                <div className="text-[11px] text-slate-400 mb-1">Standard Output:</div>
                <pre className="p-2.5 bg-slate-900 rounded text-slate-200 whitespace-pre-wrap">
                  {output.stdout}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Focus mode renders on <body> so no ancestor stacking context (e.g. a sticky column) can cover it.
  if (!focused) return workspace;
  return <>
    <div className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-[#0a0e17] p-6 text-center text-sm text-slate-400 ${fills ? "h-full" : "h-[540px]"}`}>
      <Maximize2 className="h-5 w-5 text-slate-500" />
      Editing in focus mode. Press Esc to return.
    </div>
    {createPortal(<><div aria-hidden="true" className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setFocused(false)} />{workspace}</>, document.body)}
  </>;
}
