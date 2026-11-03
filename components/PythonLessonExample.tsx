"use client";

import { useEffect, useRef, useState } from "react";
import { CodeView } from "@/components/CodeView";
import { asset } from "@/lib/base-path";
import { Check, Copy, LoaderCircle, Play, Square, Terminal } from "lucide-react";
import type { PythonLesson } from "@/data/python-course";


type Status = "idle" | "loading" | "running" | "finished" | "error" | "stopped";
export function PythonLessonExample({ lesson, heading = "See it in action", subtitle }: { lesson: Pick<PythonLesson, "title" | "code" | "output" | "runtime">; heading?: string; subtitle?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clear() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
  }
  useEffect(() => () => { clear(); if (copyingRef.current) clearTimeout(copyingRef.current); }, []);
  async function copy() {
    try { await navigator.clipboard.writeText(lesson.code); setCopied(true); setCopyError(false); if (copyingRef.current) clearTimeout(copyingRef.current); copyingRef.current = setTimeout(() => setCopied(false), 1800); }
    catch { setCopyError(true); }
  }
  function stop(message = "Stopped.") { clear(); setStatus("stopped"); setOutput(previous => previous + (previous && !previous.endsWith("\n") ? "\n" : "") + message); }
  function run() {
    clear(); setStatus("loading"); setOutput("");
    try {
      const worker = new Worker(asset("/python-worker.mjs"), { type: "module" });
      workerRef.current = worker;
      timeoutRef.current = setTimeout(() => stop("Python took too long to load. Check your connection and try again."), 60_000);
      worker.onmessage = ({ data }) => {
        if (workerRef.current !== worker) return;
        if (data.type === "ready") {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setStatus("running"); worker.postMessage({ type: "run", code: lesson.code, input: "" });
          timeoutRef.current = setTimeout(() => stop("Stopped after 20 seconds."), 20_000);
        } else if (data.type === "output") setOutput(previous => previous + data.text);
        else if (data.type === "done") { clear(); setStatus("finished"); }
        else if (data.type === "run-error" || data.type === "init-error") {
          setOutput(previous => previous + (previous && !previous.endsWith("\n") ? "\n" : "") + (data.error || "Could not run the example."));
          clear(); setStatus("error");
        }
      };
      worker.onerror = event => { event.preventDefault(); if (workerRef.current === worker) { clear(); setStatus("error"); setOutput("Could not load browser Python. Check your connection and try again."); } };
    } catch { clear(); setStatus("error"); setOutput("Your browser could not start the Python worker."); }
  }
  const running = status === "loading" || status === "running";
  return <section className="overflow-hidden rounded-2xl border border-[#304039] bg-[#111920]" aria-label="Lesson code example">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#304039] px-4 py-3 sm:px-5"><div><h3 className="text-sm font-semibold text-[#e5efe6]">{heading}</h3><p className="mt-0.5 text-xs text-[#879b94]">{subtitle ?? (lesson.runtime === "browser" ? "Python · runnable in your browser" : lesson.runtime === "pydantic" ? "Python · requires Pydantic v2 locally" : "Python · run in a local environment")}</p></div><div className="flex items-center gap-2"><button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-[#394d42] px-3 py-2 text-xs font-medium text-[#c2d3c5] hover:bg-[#22332b]">{copied ? <Check className="h-3.5 w-3.5 text-[#c9f27b]" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</button>{lesson.runtime === "browser" && (running ? <button onClick={() => stop()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#613334] px-3 py-2 text-xs font-semibold text-white hover:bg-[#754044]"><Square className="h-3.5 w-3.5 fill-current"/>Stop</button> : <button onClick={run} className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9f27b] px-3 py-2 text-xs font-semibold text-[#172418] hover:bg-[#dcffa1]"><Play className="h-3.5 w-3.5 fill-current"/>Run example</button>)}</div></div>
    {copyError && <p role="alert" className="px-5 py-2 text-xs text-amber-300">Could not copy automatically. Select the code in the editor and copy it.</p>}
    <div className="bg-[#1e1e1e]" style={{height: Math.min(460, Math.max(180, lesson.code.trimEnd().split("\n").length * 21 + 38))}}><CodeView code={lesson.code} language="python" label={`${lesson.title} example code`} /></div>
    <div className="border-t border-[#304039] bg-[#0e1718] p-4 sm:px-5"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-semibold text-[#aebfb5]"><Terminal className="h-3.5 w-3.5"/> {status === "idle" ? "Expected output" : "Output"}</p>{running && <span className="flex items-center gap-1.5 text-xs text-[#b8db9f]"><LoaderCircle className="h-3.5 w-3.5 animate-spin"/>{status === "loading" ? "Loading Python…" : "Running…"}</span>}</div><pre aria-live="polite" className={`mt-2 whitespace-pre-wrap break-words font-mono text-xs leading-6 ${status === "error" ? "text-rose-300" : "text-[#c7d8ce]"}`}>{status === "idle" ? lesson.output : output || (running ? "Waiting for output…" : status === "finished" ? "Program finished without output." : "No output.")}</pre></div>
    {lesson.runtime !== "browser" && <div className="border-t border-[#304039] bg-[#17241e] px-4 py-3 text-xs leading-5 text-[#a7bcad] sm:px-5">{lesson.runtime === "pydantic" ? <>Install Pydantic v2 in a local virtual environment: <code className="text-[#d7f2c3]">python -m pip install &apos;pydantic&gt;=2,&lt;3&apos;</code>. Copy this example into a <code>.py</code> file and run it with <code>python filename.py</code>.</> : <>Run this example in local Python: copy it into a <code>.py</code> file and use <code className="text-[#d7f2c3]">python filename.py</code>. The browser runtime does not support this example&apos;s thread/process or event-loop behavior.</>}</div>}
  </section>;
}
