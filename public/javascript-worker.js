// A new worker is created for each JavaScript run, so Stop can terminate it.
self.onmessage = async ({ data }) => {
  if (data?.type !== "run") return;
  const lines = data.input ? data.input.replace(/\r\n?/g, "\n").split("\n") : [];
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  let line = 0, written = 0, truncated = false;
  const format = value => {
    if (typeof value === "string") return value;
    if (value === undefined) return "undefined";
    if (typeof value === "bigint") return `${value}n`;
    if (value instanceof Error) return value.stack || String(value);
    try { return JSON.stringify(value) ?? String(value); } catch { return String(value); }
  };
  const print = (...values) => {
    const text = values.map(format).join(" ") + "\n";
    const remaining = Math.max(0, 100_000 - written);
    if (remaining) { const part = text.slice(0, remaining); self.postMessage({ type: "output", text: part }); written += part.length; }
    if (text.length > remaining && !truncated) { self.postMessage({ type: "output", text: "\n[Output truncated at 100,000 characters.]\n" }); truncated = true; }
  };
  const console = { log: print, info: print, warn: print, error: print, debug: print };
  const prompt = message => {
    if (message) self.postMessage({ type: "output", text: String(message) });
    return line < lines.length ? lines[line++] : null;
  };
  try {
    const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
    await new AsyncFunction("console", "prompt", data.code)(console, prompt);
    self.postMessage({ type: "done" });
  } catch (error) {
    self.postMessage({ type: "run-error", error: String(error?.stack || error) });
  }
};
self.postMessage({ type: "ready" });
