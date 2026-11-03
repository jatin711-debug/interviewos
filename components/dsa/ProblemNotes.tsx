"use client";

import { useEffect, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";
import { apiFetch } from "@/lib/local-api";

const SAVE_DELAY_MS = 800;

function saveNotes(problemId: string, notes: string) {
  return apiFetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress: { [problemId]: { notes } } }),
    keepalive: true, // lets a pending save finish when the user switches problems or leaves
  });
}

// onChange fires on every edit so the parent's copy stays current; saving is debounced.
export function ProblemNotes({ problemId, initialNotes = "", onChange }: { problemId: string; initialNotes?: string; onChange?: (notes: string) => void }) {
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);

  async function save(value: string) {
    pending.current = null;
    setStatus("saving");
    try {
      const response = await saveNotes(problemId, value);
      if (!response.ok) throw new Error("Unable to save notes");
      setStatus(pending.current === null ? "saved" : "pending");
    } catch {
      setStatus("error");
    }
  }

  function change(value: string) {
    setNotes(value);
    onChange?.(value);
    setStatus("pending");
    pending.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), SAVE_DELAY_MS);
  }

  // Flush an unsaved edit when this problem's notes unmount.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (pending.current !== null) void saveNotes(problemId, pending.current).catch(() => {});
  }, [problemId]);

  const label = { idle: "", pending: "Unsaved changes…", saving: "Saving…", saved: "Saved", error: "Couldn’t save. Keep typing to retry." }[status];
  return <div className="border-t border-slate-800 p-5">
    <div className="mb-2 flex items-center justify-between gap-3"><label htmlFor={`notes-${problemId}`} className="flex items-center gap-2 text-sm font-semibold text-slate-200"><NotebookPen className="h-4 w-4 text-[#c9f27b]" /> Your notes</label><span role="status" className={`text-[11px] ${status === "error" ? "text-amber-300" : "text-slate-500"}`}>{label}</span></div>
    <textarea id={`notes-${problemId}`} value={notes} onChange={event => change(event.target.value)} maxLength={20_000} rows={4} placeholder="Approach in your own words, the invariant, edge cases you missed…" className="w-full resize-y rounded-lg border border-slate-700/80 bg-[#111827] px-3 py-2.5 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
  </div>;
}
