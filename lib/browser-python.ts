"use client";

// Runs Python in the browser with Pyodide (public/python-worker.mjs). The site is static, so this
// replaces the old server-side runner for graded challenges and DSA test runs.
//
// One loaded worker is kept warm between runs: Pyodide takes a few seconds to start, and each run
// already gets a fresh global namespace. A run that times out or is cancelled terminates its worker
// (the only way to stop running Python), and the next run starts a new one.
import { asset } from "@/lib/base-path";

export interface PythonRun {
  /** Everything the program printed (stdout and stderr, in order). */
  output: string;
  /** Python exception text if the program raised, or why it could not start. */
  error?: string;
  timedOut: boolean;
  runtimeMs: number;
}

export interface RunOptions {
  input?: string;
  /** Extra source scanned for imports, so packages such as pydantic or sqlite3 get loaded. */
  imports?: string;
  /** Total time allowed once Python is loaded. */
  timeoutMs?: number;
  /**
   * Graded scripts print "@@IVOS_RUN <n>" before each check and "@@IVOS_DONE" after it. If one check
   * runs longer than this, the run is stopped (Python has no way to interrupt itself in the browser).
   */
  checkTimeoutMs?: number;
  signal?: AbortSignal;
  onOutput?: (text: string) => void;
}

const LOAD_TIMEOUT_MS = 90_000;
let warm: Promise<Worker> | null = null;

function startWorker(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try { worker = new Worker(asset("/python-worker.mjs"), { type: "module" }); }
    catch { reject(new Error("Your browser could not start the Python worker.")); return; }
    const timer = setTimeout(() => { worker.terminate(); reject(new Error("Python took too long to load. Check your connection and try again.")); }, LOAD_TIMEOUT_MS);
    worker.onmessage = ({ data }) => {
      clearTimeout(timer);
      if (data?.type === "ready") resolve(worker);
      else { worker.terminate(); reject(new Error(data?.error || "Python could not load.")); }
    };
    worker.onerror = event => {
      event.preventDefault();
      clearTimeout(timer);
      worker.terminate();
      reject(new Error("Could not load browser Python. Check your connection and try again."));
    };
  });
}

function takeWorker(): Promise<Worker> {
  const ready = warm ?? startWorker();
  warm = null;
  return ready;
}

/** Start loading Pyodide ahead of the first run (for example when a challenge scrolls into view). */
export function preloadPython(): void {
  if (!warm) {
    warm = startWorker();
    warm.catch(() => { warm = null; });
  }
}

export async function runPython(code: string, { input = "", imports, timeoutMs = 30_000, checkTimeoutMs, signal, onOutput }: RunOptions = {}): Promise<PythonRun> {
  if (signal?.aborted) return { output: "", error: "Cancelled.", timedOut: false, runtimeMs: 0 };
  let worker: Worker;
  try { worker = await takeWorker(); }
  catch (error) { return { output: "", error: error instanceof Error ? error.message : String(error), timedOut: false, runtimeMs: 0 }; }
  if (signal?.aborted) { warm = Promise.resolve(worker); return { output: "", error: "Cancelled.", timedOut: false, runtimeMs: 0 }; }

  const started = performance.now();
  return new Promise<PythonRun>(resolve => {
    let output = "";
    let checkTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = (result: Omit<PythonRun, "output" | "runtimeMs">, reuse: boolean) => {
      clearTimeout(totalTimer);
      clearTimeout(checkTimer);
      signal?.removeEventListener("abort", onAbort);
      worker.onmessage = null;
      worker.onerror = null;
      if (reuse && !warm) warm = Promise.resolve(worker);
      else worker.terminate();
      resolve({ ...result, output, runtimeMs: Math.round(performance.now() - started) });
    };
    const stop = (error: string, timedOut: boolean) => finish({ error, timedOut }, false);
    const onAbort = () => stop("Cancelled.", false);
    const totalTimer = setTimeout(() => stop(`Stopped after ${Math.round(timeoutMs / 1000)} seconds.`, true), timeoutMs);
    signal?.addEventListener("abort", onAbort, { once: true });

    worker.onmessage = ({ data }) => {
      if (data?.type === "output") {
        output += data.text;
        onOutput?.(data.text);
        if (checkTimeoutMs && data.text.includes("@@IVOS_")) {
          const last = data.text.lastIndexOf("@@IVOS_");
          clearTimeout(checkTimer);
          if (data.text.startsWith("@@IVOS_RUN", last)) {
            checkTimer = setTimeout(() => stop(`A check ran longer than ${Math.round(checkTimeoutMs / 1000)} seconds.`, true), checkTimeoutMs);
          }
        }
      } else if (data?.type === "done") finish({ timedOut: false }, true);
      else if (data?.type === "run-error") finish({ error: data.error || "The program raised an error.", timedOut: false }, true);
    };
    worker.onerror = event => { event.preventDefault(); stop("Browser Python crashed while running this code.", false); };
    worker.postMessage({ type: "run", code, input, imports });
  });
}
