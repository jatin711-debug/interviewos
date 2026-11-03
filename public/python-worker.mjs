// Python (Pyodide) runs in a module worker so the page stays responsive and a run can be stopped
// by terminating the worker. Used by lesson examples, the playground and graded challenges.
//
// Messages in:  { type: "run", code, input, imports? }  (imports: extra source to scan for packages to load)
// Messages out: { type: "ready" } once Pyodide has loaded, then for each run
//               { type: "output", text }  (stdout and stderr, in order)
//               { type: "done" } or { type: "run-error", error }
// Graded scripts print progress markers ("@@IVOS_..."); those are flushed at once so the page
// can enforce a per-check time limit by terminating the worker.
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.4/full/pyodide.mjs";

let pyodide;
let busy = false;

async function initialize() {
  try {
    pyodide = await loadPyodide();
    self.postMessage({ type: "ready" });
  } catch (error) {
    self.postMessage({ type: "init-error", error: String(error?.message || error) });
  }
}

self.onmessage = async ({ data }) => {
  if (data?.type !== "run" || busy || !pyodide) return;
  busy = true;
  const { code, input, imports } = data;
  let outputSize = 0;
  let pending = "";
  let truncated = false;
  const limit = 400_000;
  const decoder = new TextDecoder();
  const flush = () => {
    if (pending) self.postMessage({ type: "output", text: pending });
    pending = "";
  };
  const writer = {
    write(buffer) {
      const text = decoder.decode(buffer, { stream: true });
      const remaining = Math.max(0, limit - outputSize);
      if (remaining) {
        pending += text.slice(0, remaining);
        outputSize += Math.min(text.length, remaining);
        if (pending.length >= 2048 || text.includes("@@IVOS_")) flush();
      }
      if (text.length > remaining && !truncated) {
        pending += "\n[Output truncated.]\n";
        truncated = true;
        flush();
      }
      return buffer.length;
    },
  };
  const lines = input ? input.replace(/\r\n?/g, "\n").split("\n") : [];
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  let line = 0;
  pyodide.setStdin({ stdin: () => lines[line++] });
  pyodide.setStdout(writer);
  pyodide.setStderr(writer);
  let globals;
  let dict;
  try {
    // Load any packages the code imports that are not part of the core build (e.g. sqlite3).
    // Graded scripts embed the learner's code as a string, so the page also passes it in `imports`.
    await pyodide.loadPackagesFromImports(code);
    if (imports) await pyodide.loadPackagesFromImports(imports);
    dict = pyodide.globals.get("dict");
    globals = dict();
    globals.set("__name__", "__main__");
    // A fresh namespace keeps a previous run from changing the next one.
    const result = await pyodide.runPythonAsync(code, { globals });
    if (result && typeof result.destroy === "function") result.destroy();
    pending += decoder.decode();
    flush();
    self.postMessage({ type: "done" });
  } catch (error) {
    pending += decoder.decode();
    flush();
    self.postMessage({ type: "run-error", error: String(error?.message || error) });
  } finally {
    globals?.destroy();
    dict?.destroy();
    busy = false;
  }
};

initialize();
