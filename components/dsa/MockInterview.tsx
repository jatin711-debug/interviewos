"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Flag, History, Timer, XCircle } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { DSA_PROBLEMS, type DSAProblem } from "@/data/dsa";
import { problemProgress } from "@/data/dsa-curriculum";
import type { MockSession, ProblemProgress } from "@/lib/storage";
import { ProblemPanel } from "./ProblemPanel";
import { apiFetch } from "@/lib/local-api";

const SESSION_KEY = "interviewos:dsa:mock-session:v1";
export const MOCK_DRAFT_PREFIX = "interviewos:dsa:mock-draft:";
const LIMIT_SECONDS = 35 * 60;
const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];
const SELF_RATINGS: ReadonlyArray<readonly [number, string, string]> = [
  [0, "Blank", "Couldn’t find an approach"],
  [1, "Stuck", "Wrong approach"],
  [2, "Close", "Right idea, buggy code"],
  [3, "Struggled", "Solved with hesitation"],
  [4, "Solid", "Solved and explained it"],
  [5, "Ready", "Clean, quick, well explained"],
];
const field = "w-full rounded-lg border border-slate-700/80 bg-[#111827] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

type Base = { problemId: string; difficulty: Difficulty; startedAt: string; passed: boolean; statedTime: string; statedSpace: string };
type Session = (Base & { phase: "active" }) | (Base & { phase: "finished"; durationSeconds: number });

function pickProblem(difficulty: Difficulty, progress: Record<string, ProblemProgress>): DSAProblem {
  const pool = DSA_PROBLEMS.filter(problem => problem.difficulty === difficulty);
  const unsolved = pool.filter(problem => !problemProgress(problem, progress)?.solved);
  const choices = unsolved.length ? unsolved : pool.length ? pool : DSA_PROBLEMS;
  return choices[Math.floor(Math.random() * choices.length)];
}

function clock(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function restore(): Session | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!parsed || (parsed.phase !== "active" && parsed.phase !== "finished")) return null;
    if (!DSA_PROBLEMS.some(problem => problem.id === parsed.problemId) || Number.isNaN(Date.parse(parsed.startedAt))) return null;
    return parsed as Session;
  } catch {
    return null;
  }
}

interface MockInterviewProps {
  progress: Record<string, ProblemProgress>;
  sessions: MockSession[];
  onProgress: (problemId: string, entry: ProblemProgress) => void;
  onSessionsSaved: (sessions: MockSession[]) => void;
  onOpenProblem: (problem: DSAProblem) => void;
}

export function MockInterview({ progress, sessions, onProgress, onSessionsSaved, onOpenProblem }: MockInterviewProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [restored, setRestored] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [rating, setRating] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [now, setNow] = useState(0);

  // A refresh should not lose an interview in progress.
  useEffect(() => { setSession(restore()); setRestored(true); }, []);
  useEffect(() => {
    if (!restored) return;
    try { if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session)); else localStorage.removeItem(SESSION_KEY); } catch {}
  }, [session, restored]);
  const active = session?.phase === "active";
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [active]);

  function start() {
    const problem = pickProblem(difficulty, progress);
    try { localStorage.removeItem(`${MOCK_DRAFT_PREFIX}${problem.id}`); } catch {}
    setRating(null); setSaveState("idle");
    setSession({ phase: "active", problemId: problem.id, difficulty, startedAt: new Date().toISOString(), passed: false, statedTime: "", statedSpace: "" });
  }
  function update(changes: Partial<Base>) {
    setSession(current => current ? { ...current, ...changes } as Session : current);
  }
  function finish() {
    if (session?.phase !== "active") return;
    setSession({ ...session, phase: "finished", durationSeconds: Math.round((Date.now() - Date.parse(session.startedAt)) / 1000) });
  }
  function abandon() {
    if (confirm("Abandon this mock interview? It won’t be saved.")) setSession(null);
  }
  async function save() {
    if (session?.phase !== "finished" || rating === null) return;
    setSaveState("saving");
    try {
      const response = await apiFetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mockSession: { problemId: session.problemId, startedAt: session.startedAt, durationSeconds: session.durationSeconds, passed: session.passed, statedTime: session.statedTime, statedSpace: session.statedSpace, selfRating: rating } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save");
      onSessionsSaved(data.state?.mockSessions ?? []);
      if (session.passed) {
        // A passing mock also schedules the next from-scratch review.
        const review = await apiFetch("/api/dsa/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ problemId: session.problemId, quality: rating }) });
        const reviewed = await review.json();
        if (review.ok && reviewed.progress) onProgress(session.problemId, reviewed.progress);
      }
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  const problem = session ? DSA_PROBLEMS.find(item => item.id === session.problemId) : undefined;
  if (!restored) return <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-6 text-sm text-slate-400">Loading…</div>;

  if (session?.phase === "active" && problem) {
    const elapsed = now ? (now - Date.parse(session.startedAt)) / 1000 : 0;
    const remaining = LIMIT_SECONDS - elapsed;
    const ready = session.statedTime.trim() && session.statedSpace.trim();
    return <section className="space-y-5" aria-label="Mock interview in progress">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0b111d] px-5 py-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mock interview · {session.difficulty}</p><p className="mt-1 text-sm text-slate-300">Think aloud, test edge cases, then state your complexity before you finish.</p></div>
        <div className="flex items-center gap-3">
          <span role="timer" aria-label="Time remaining" className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-lg font-semibold ${remaining <= 0 ? "border-rose-700/60 text-rose-300" : remaining < 300 ? "border-amber-700/60 text-amber-300" : "border-slate-700 text-slate-100"}`}><Timer className="h-4 w-4" />{remaining <= 0 ? `+${clock(-remaining)}` : clock(remaining)}</span>
          <button onClick={abandon} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white">Abandon</button>
        </div>
      </div>
      {remaining <= 0 && <p role="alert" className="rounded-lg border border-rose-800/50 bg-rose-950/20 px-4 py-3 text-sm text-rose-200">Time’s up. In a real interview you’d wrap up now: state your complexity and finish.</p>}
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
        <ProblemPanel key={problem.id} problem={problem} solved={false} lockedTabs={["intuition", "solution"]} lockedReason="Available after the interview" />
        <div className="min-w-0 space-y-4">
          <CodeEditor key={`mock:${problem.id}:${session.startedAt}`} initialCode={problem.starterCode} draftKey={`${MOCK_DRAFT_PREFIX}${problem.id}`} runWrapper={problem.runWrapper} problemId={problem.id} askRating={false} onSuccess={entry => onProgress(problem.id, entry)} onResult={passed => { if (passed) update({ passed: true }); }} />
          <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-4">
            <h3 className="text-sm font-semibold text-white">Before you finish</h3>
            <p className="mt-1 text-xs text-slate-400">State the complexity of your solution, as you would to an interviewer.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">Time complexity<input value={session.statedTime} onChange={event => update({ statedTime: event.target.value })} maxLength={200} placeholder="e.g. O(n log n)" className={`${field} mt-1`} /></label>
              <label className="text-xs text-slate-400">Space complexity<input value={session.statedSpace} onChange={event => update({ statedSpace: event.target.value })} maxLength={200} placeholder="e.g. O(n)" className={`${field} mt-1`} /></label>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className={`flex items-center gap-1.5 text-xs ${session.passed ? "text-emerald-300" : "text-slate-500"}`}>{session.passed ? <><CheckCircle2 className="h-3.5 w-3.5" /> All tests passed</> : "Tests not passing yet"}</span>
              <button onClick={finish} disabled={!ready} className="inline-flex items-center gap-2 rounded-lg bg-[#c9f27b] px-4 py-2 text-sm font-semibold text-[#172418] transition hover:bg-[#dcffa1] disabled:cursor-not-allowed disabled:opacity-40"><Flag className="h-4 w-4" /> Finish interview</button>
            </div>
          </div>
        </div>
      </div>
    </section>;
  }

  if (session?.phase === "finished" && problem) {
    return <section className="space-y-5" aria-label="Mock interview results">
      <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mock interview · results</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{problem.title}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-900/70 p-4"><p className="text-xs text-slate-500">TESTS</p><p className={`mt-1 flex items-center gap-1.5 text-sm font-semibold ${session.passed ? "text-emerald-300" : "text-rose-300"}`}>{session.passed ? <><CheckCircle2 className="h-4 w-4" /> All passed</> : <><XCircle className="h-4 w-4" /> Not passing</>}</p></div>
          <div className="rounded-lg bg-slate-900/70 p-4"><p className="text-xs text-slate-500">TIME USED</p><p className={`mt-1 text-sm font-semibold ${session.durationSeconds > LIMIT_SECONDS ? "text-amber-300" : "text-slate-100"}`}>{clock(session.durationSeconds)} <span className="font-normal text-slate-500">of {clock(LIMIT_SECONDS)}</span></p></div>
          <div className="rounded-lg bg-slate-900/70 p-4"><p className="text-xs text-slate-500">DIFFICULTY</p><p className="mt-1 text-sm font-semibold text-slate-100">{problem.difficulty} · {problem.category}</p></div>
        </div>
        <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="text-xs text-slate-500"><th className="pb-2 font-medium">Complexity</th><th className="pb-2 font-medium">You said</th><th className="pb-2 font-medium">Reference</th></tr></thead><tbody className="divide-y divide-slate-800">
          <tr><td className="py-2.5 text-slate-400">Time</td><td className="py-2.5 font-mono text-xs text-blue-200">{session.statedTime}</td><td className="py-2.5 font-mono text-xs text-emerald-300">{problem.timeComplexity}</td></tr>
          <tr><td className="py-2.5 text-slate-400">Space</td><td className="py-2.5 font-mono text-xs text-blue-200">{session.statedSpace}</td><td className="py-2.5 font-mono text-xs text-emerald-300">{problem.spaceComplexity}</td></tr>
        </tbody></table></div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-white">How did it go?</h3>
          <p className="mt-1 text-xs text-slate-400">Be honest; {session.passed ? "this also schedules your next from-scratch review." : "unsolved problems stay in the practice pool."}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{SELF_RATINGS.map(([value, label, hint]) => <button key={value} onClick={() => setRating(value)} aria-pressed={rating === value} disabled={saveState === "saving" || saveState === "saved"} className={`rounded-lg border px-3 py-2 text-left transition disabled:opacity-60 ${rating === value ? "border-[#c9f27b] bg-[#c9f27b]/10" : "border-slate-700 bg-slate-900 hover:border-slate-500"}`}><span className="block text-xs font-semibold text-slate-100">{value} · {label}</span><span className="block text-[10px] leading-4 text-slate-400">{hint}</span></button>)}</div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {saveState === "saved"
              ? <><span className="flex items-center gap-1.5 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Saved</span><button onClick={() => setSession(null)} className="rounded-lg bg-[#c9f27b] px-4 py-2 text-sm font-semibold text-[#172418] hover:bg-[#dcffa1]">Start another</button><button onClick={() => { setSession(null); onOpenProblem(problem); }} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500">See the solution</button></>
              : <><button onClick={save} disabled={rating === null || saveState === "saving"} className="rounded-lg bg-[#c9f27b] px-4 py-2 text-sm font-semibold text-[#172418] hover:bg-[#dcffa1] disabled:cursor-not-allowed disabled:opacity-40">{saveState === "saving" ? "Saving…" : "Save session"}</button><button onClick={() => { if (confirm("Discard this session without saving?")) setSession(null); }} className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white">Discard</button></>}
            {saveState === "error" && <span role="alert" className="text-xs text-amber-300">Couldn’t save the session. Try again.</span>}
          </div>
        </div>
      </div>
      <MockHistory sessions={sessions} />
    </section>;
  }

  const unsolvedLeft = DSA_PROBLEMS.filter(item => item.difficulty === difficulty && !problemProgress(item, progress)?.solved).length;
  return <section className="space-y-5" aria-label="Mock interview">
    <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5 sm:p-6">
      <div className="flex items-center gap-3"><div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-300"><Timer className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-white">Mock interview</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">A random unsolved problem, a 35-minute clock, and no pattern hints or solution until you finish. You’ll state the complexity, compare it with the reference, and rate yourself.</p></div></div>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-xs text-slate-400">Difficulty<select value={difficulty} onChange={event => setDifficulty(event.target.value as Difficulty)} className={`${field} mt-1 w-40`}>{DIFFICULTIES.map(value => <option key={value}>{value}</option>)}</select></label>
        <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-[#c9f27b] px-4 py-2.5 text-sm font-semibold text-[#172418] transition hover:bg-[#dcffa1]"><Timer className="h-4 w-4" /> Start the clock</button>
        <span className="pb-2.5 text-xs text-slate-500">{unsolvedLeft ? `${unsolvedLeft} unsolved ${difficulty} problems left` : `All ${difficulty} problems solved; you’ll get a repeat`}</span>
      </div>
    </div>
    <MockHistory sessions={sessions} />
  </section>;
}

function MockHistory({ sessions }: { sessions: MockSession[] }) {
  const recent = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 10);
  return <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><History className="h-4 w-4 text-slate-400" /> Recent mock interviews</h3>
    {recent.length ? <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="text-xs text-slate-500"><th className="pb-2 font-medium">Problem</th><th className="pb-2 font-medium">Date</th><th className="pb-2 font-medium">Time</th><th className="pb-2 font-medium">Tests</th><th className="pb-2 font-medium">Rating</th></tr></thead><tbody className="divide-y divide-slate-800">{recent.map(item => {
      const problem = DSA_PROBLEMS.find(entry => entry.id === item.problemId);
      return <tr key={item.id}><td className="py-2.5 text-slate-200">{problem?.title ?? item.problemId}</td><td className="py-2.5 text-xs text-slate-400">{new Date(item.startedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</td><td className={`py-2.5 font-mono text-xs ${item.durationSeconds > LIMIT_SECONDS ? "text-amber-300" : "text-slate-300"}`}>{clock(item.durationSeconds)}</td><td className="py-2.5">{item.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="Passed" /> : <XCircle className="h-4 w-4 text-rose-400" aria-label="Not passed" />}</td><td className="py-2.5 text-xs text-slate-300">{item.selfRating ?? "—"}/5</td></tr>;
    })}</tbody></table></div> : <p className="mt-3 text-sm text-slate-400">No mock interviews yet. Your results will appear here.</p>}
  </div>;
}
