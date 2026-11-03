"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MonacoEditor } from "@/components/MonacoEditor";
import Link from "next/link";
import { asset } from "@/lib/base-path";
import { PLAYGROUND_LANGUAGES, languageDraftKey, languageInputKey, type PlaygroundLanguage } from "@/data/playground";
import { ArrowLeft, Braces, CheckCircle2, CircleHelp, Clock3, Code2, LoaderCircle, Play, RotateCcw, Square, Terminal, Trash2, Wifi } from "lucide-react";

const EDITOR_OPTIONS = { minimap: { enabled: false }, fontSize: 14, fontFamily: "JetBrains Mono, Fira Code, monospace", lineNumbers: "on", scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, wordWrap: "on", padding: { top: 16, bottom: 16 } } as const;
const RUN_LIMIT_MS = 20_000;

type RuntimeState = "loading" | "ready" | "running" | "failed";
type Result = { kind: "success" | "error" | "stopped"; elapsed?: number } | null;

export default function PythonPlaygroundPage() {
  const [language, setLanguage] = useState<PlaygroundLanguage>("python");
  const [code, setCode] = useState(PLAYGROUND_LANGUAGES.python.examples[0].code);
  const examples = PLAYGROUND_LANGUAGES[language].examples;
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [runtime, setRuntime] = useState<RuntimeState>("loading");
  const [runtimeError, setRuntimeError] = useState("");
  const [draftError, setDraftError] = useState("");
  const [result, setResult] = useState<Result>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(0);
  const runRef = useRef<() => void>(() => {});

  const clearRunTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const initialize = useCallback(() => {
    clearRunTimeout();
    workerRef.current?.terminate();
    setRuntime("loading");
    setRuntimeError("");
    try {
      const worker = new Worker(asset("/python-worker.mjs"), { type: "module" });
      workerRef.current = worker;
      timeoutRef.current = setTimeout(() => {
        if (workerRef.current !== worker) return;
        worker.terminate();
        workerRef.current = null;
        setRuntime("failed");
        setRuntimeError("Loading Python took too long. Check your connection and try again.");
      }, 60_000);
      worker.onmessage = ({ data }) => {
        if (workerRef.current !== worker) return;
        if (data.type === "ready") { clearRunTimeout(); setRuntime("ready"); }
        if (data.type === "init-error") {
          clearRunTimeout();
          setRuntime("failed");
          setRuntimeError(data.error || "The Python runtime could not be loaded.");
        }
        if (data.type === "output") setOutput(previous => previous + data.text);
        if (data.type === "done" || data.type === "run-error") {
          clearRunTimeout();
          if (data.type === "run-error") setOutput(previous => previous + (previous && !previous.endsWith("\n") ? "\n" : "") + data.error);
          setResult({ kind: data.type === "done" ? "success" : "error", elapsed: Math.round(performance.now() - startedRef.current) });
          setRuntime("ready");
        }
      };
      worker.onerror = event => {
        if (workerRef.current !== worker) return;
        event.preventDefault();
        clearRunTimeout();
        worker.terminate();
        workerRef.current = null;
        setRuntime("failed");
        setRuntimeError("Could not load the Python runtime. Check your connection and try again.");
      };
    } catch {
      setRuntime("failed");
      setRuntimeError("Your browser could not start the Python worker. Try Chrome or a recent browser.");
    }
  }, [clearRunTimeout]);

  useEffect(() => {
    try {
      const savedCode = localStorage.getItem(languageDraftKey("python"));
      const savedInput = localStorage.getItem(languageInputKey("python"));
      if (savedCode !== null) setCode(savedCode);
      if (savedInput !== null) setInput(savedInput);
    } catch { setDraftError("Your browser could not restore the saved draft."); }
    initialize();
    return () => { clearRunTimeout(); workerRef.current?.terminate(); workerRef.current = null; };
  }, [initialize, clearRunTimeout]);

  const updateCode = (value: string) => {
    setCode(value);
    try { localStorage.setItem(languageDraftKey(language), value); setDraftError(""); }
    catch { setDraftError("Your browser could not save this draft."); }
  };
  const updateInput = (value: string) => {
    setInput(value);
    try { localStorage.setItem(languageInputKey(language), value); setDraftError(""); }
    catch { setDraftError("Your browser could not save the input."); }
  };
  const switchLanguage = (next: PlaygroundLanguage) => {
    if (next === language || runtime === "running") return;
    clearRunTimeout();
    workerRef.current?.terminate();
    workerRef.current = null;
    setLanguage(next); setOutput(""); setResult(null); setRuntimeError(""); setDraftError("");
    try {
      setCode(localStorage.getItem(languageDraftKey(next)) ?? PLAYGROUND_LANGUAGES[next].examples[0].code);
      setInput(localStorage.getItem(languageInputKey(next)) ?? "");
    } catch {
      setCode(PLAYGROUND_LANGUAGES[next].examples[0].code); setInput("");
      setDraftError("Your browser could not restore this draft.");
    }
    if (next === "python") initialize(); else setRuntime("ready");
  };
  const stop = useCallback((reason: string) => {
    workerRef.current?.terminate();
    workerRef.current = null;
    clearRunTimeout();
    setOutput(previous => previous + (previous && !previous.endsWith("\n") ? "\n" : "") + reason);
    setResult({ kind: "stopped" });
    if (language === "python") initialize(); else setRuntime("ready");
  }, [clearRunTimeout, initialize, language]);
  const run = async () => {
    if (runtime !== "ready") return;
    setOutput(""); setResult(null); setRuntime("running");
    startedRef.current = performance.now();
    if (language === "python") {
      if (!workerRef.current) { setRuntime("failed"); setRuntimeError("Python is not ready. Try again."); return; }
      workerRef.current.postMessage({ type: "run", code, input });
      timeoutRef.current = setTimeout(() => stop("Stopped after 20 seconds. You can edit the code and run it again."), RUN_LIMIT_MS);
      return;
    }
    if (language === "javascript") {
      try {
        const worker = new Worker(asset("/javascript-worker.js"));
        workerRef.current = worker;
        worker.onmessage = ({ data }) => {
          if (workerRef.current !== worker) return;
          if (data.type === "output") setOutput(previous => previous + data.text);
          if (data.type === "done" || data.type === "run-error") {
            clearRunTimeout(); worker.terminate(); workerRef.current = null;
            if (data.type === "run-error") setOutput(previous => previous + (previous && !previous.endsWith("\n") ? "\n" : "") + data.error);
            setResult({ kind: data.type === "done" ? "success" : "error", elapsed: Math.round(performance.now() - startedRef.current) });
            setRuntime("ready");
          }
        };
        worker.onerror = event => {
          if (workerRef.current !== worker) return;
          event.preventDefault(); clearRunTimeout(); worker.terminate(); workerRef.current = null;
          setOutput("Could not start the JavaScript worker."); setResult({ kind: "error" }); setRuntime("ready");
        };
        worker.postMessage({ type: "run", code, input });
        timeoutRef.current = setTimeout(() => stop("Stopped after 20 seconds. You can edit the code and run it again."), RUN_LIMIT_MS);
      } catch {
        setOutput("Could not start the JavaScript worker."); setResult({ kind: "error" }); setRuntime("ready");
      }
      return;
    }
  };
  runRef.current = run;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        runRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);
  const loadExample = (next: string) => {
    if (code !== next && code.trim() && !window.confirm("Replace your current code with this example?")) return;
    updateCode(next);
  };

  const stateLabel = runtime === "loading" ? "Loading Python…" : runtime === "ready" ? `${PLAYGROUND_LANGUAGES[language].label} ready` : runtime === "running" ? "Running…" : "Runtime unavailable";
  return <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-7 lg:px-8 lg:py-8">
    <header className="relative overflow-hidden rounded-[22px] border border-[#35483b] bg-[#1a2921] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#a5d47b]/10 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div>
        <Link href="/dsa" className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-blue-300 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to DSA Dojo</Link>
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b6dca0]"><Braces className="h-4 w-4" /> Your scratchpad</div>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#f3f8f2] sm:text-4xl">Code Playground<span className="text-[#c9f27b]">.</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b4c6b7]">Try an idea, trace an algorithm, or practice in Python or JavaScript.</p>
      </div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-slate-300">Python & JavaScript in your browser</span><span className="rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-slate-300">Draft saved in this browser</span></div></div>
    </header>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Choose language">{(Object.keys(PLAYGROUND_LANGUAGES) as PlaygroundLanguage[]).map(item => <button key={item} onClick={() => switchLanguage(item)} disabled={runtime === "running"} aria-pressed={language === item} className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${language === item ? "border-blue-500 bg-blue-500/15 text-blue-200" : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-white"}`}>{PLAYGROUND_LANGUAGES[item].label}</button>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-white">Your workspace</h2><p className="mt-1 text-xs text-slate-500">Ctrl + Enter runs code. Ctrl + Space shows suggestions; hover underlines for details.</p></div><div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${runtime === "failed" ? "border-rose-800/60 bg-rose-950/30 text-rose-300" : runtime === "ready" ? "border-emerald-800/50 bg-emerald-950/20 text-emerald-300" : "border-blue-800/50 bg-blue-950/20 text-blue-300"}`}>{runtime === "loading" || runtime === "running" ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <span className={`h-2 w-2 rounded-full ${runtime === "ready" ? "bg-emerald-400" : "bg-rose-400"}`} />}{stateLabel}</div></div>
    {runtime === "loading" && <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 px-4 py-3 text-sm text-blue-200">Downloading the Python runtime on first load. This may take a moment.</div>}
    {runtime === "failed" && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-900/60 bg-rose-950/20 px-4 py-3 text-sm text-rose-200"><span>{runtimeError}</span><button onClick={initialize} className="rounded-lg border border-rose-700/70 px-3 py-1.5 font-semibold hover:bg-rose-900/40">Try again</button></div>}
    {draftError && <div role="alert" className="rounded-lg border border-amber-800/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">{draftError}</div>}
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.8fr)]">
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-[#0b111d]" aria-label={`${PLAYGROUND_LANGUAGES[language].label} code editor`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-blue-400" /><span className="text-sm font-semibold text-slate-200">{PLAYGROUND_LANGUAGES[language].filename}</span><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">{PLAYGROUND_LANGUAGES[language].label.toUpperCase()}</span></div><div className="flex items-center gap-2"><button onClick={() => loadExample(examples[0].code)} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"><RotateCcw className="h-3.5 w-3.5" /> Reset</button>{runtime === "running" ? <button onClick={() => stop("Execution stopped.")} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"><Square className="h-3.5 w-3.5 fill-current" /> Stop</button> : <button onClick={run} disabled={runtime !== "ready"} className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-4 w-4 fill-current" /> Run code</button>}</div></div>
        <div className="h-[480px] sm:h-[570px]"><MonacoEditor eager key={language} height="100%" language={PLAYGROUND_LANGUAGES[language].monaco} theme="vs-dark" value={code} onChange={value => updateCode(value || "")} options={EDITOR_OPTIONS} /></div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 px-4 py-3"><span className="mr-1 text-xs text-slate-500">Try an example</span>{examples.slice(1).map(example => <button key={example.name} onClick={() => loadExample(example.code)} className="rounded-md border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-300 hover:border-blue-600 hover:text-blue-300">{example.name}</button>)}</div>
      </section>
      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0b111d]" aria-label="Program output"><div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-blue-400" /><h2 className="text-sm font-semibold text-slate-200">Output</h2></div><div className="flex items-center gap-3">{result?.elapsed !== undefined && <span className="flex items-center gap-1 text-xs text-slate-500"><Clock3 className="h-3.5 w-3.5" /> {result.elapsed} ms</span>}<button onClick={() => { setOutput(""); setResult(null); }} aria-label="Clear output" title="Clear output" className="rounded p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white"><Trash2 className="h-4 w-4" /></button></div></div>
          <div className="min-h-[240px] max-h-[410px] overflow-auto bg-[#080e18] p-4"><pre aria-live="polite" className={`whitespace-pre-wrap break-words font-mono text-xs leading-6 ${result?.kind === "error" ? "text-rose-300" : "text-slate-200"}`}>{output || (runtime === "running" ? "Running your code…" : "Your output will appear here.")}</pre></div>
          {result && <div className={`flex items-center gap-2 border-t border-slate-800 px-4 py-2.5 text-xs ${result.kind === "success" ? "text-emerald-400" : result.kind === "error" ? "text-rose-400" : "text-amber-400"}`}><CheckCircle2 className="h-3.5 w-3.5" />{result.kind === "success" ? "Finished successfully" : result.kind === "error" ? "Finished with an error" : "Run stopped"}</div>}
        </section>
        <section className="rounded-xl border border-slate-800 bg-[#0b111d] p-4"><div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-blue-400" /><h2 className="text-sm font-semibold text-slate-200">Input <span className="font-normal text-slate-500">· optional</span></h2></div><p className="mt-1 text-xs leading-5 text-slate-500">{language === "python" ? "For input(), add one response per line before running." : language === "javascript" ? "For prompt(), add one response per line before running." : "Standard input is sent to your program when it starts."}</p><label><span className="sr-only">Program input, one response per line</span><textarea value={input} onChange={e => updateInput(e.target.value)} rows={4} placeholder="Type input here…" className="mt-3 w-full resize-y rounded-lg border border-slate-800 bg-slate-950/70 p-3 font-mono text-xs leading-5 text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500" /></label></section>
        <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-4 text-xs leading-5 text-slate-400"><p className="flex items-center gap-2 font-semibold text-slate-200"><CircleHelp className="h-4 w-4 text-blue-400" /> Good to know</p><p className="mt-2 flex gap-2"><Wifi className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" /> {language === "python" ? "Python runs in your browser after its runtime downloads." : "JavaScript runs in a browser worker. prompt() reads from the Input panel."}</p><p className="mt-2">Each run starts fresh. Browser execution has different capabilities from desktop programs.</p></div>
      </div>
    </div>
  </div>;
}
