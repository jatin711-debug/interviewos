"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Circle, Database, Gauge, Lightbulb, Search, Target, Trophy } from "lucide-react";
import { PythonChallenge } from "@/components/PythonChallenge";
import { SqlSchemaView } from "@/components/sql/SqlSchemaView";
import { SQL_CHALLENGES } from "@/data/sql-challenges";
import { buildSqlChallengeScript, type SqlChallenge, type SqlDifficulty } from "@/lib/sql-challenge";
import type { ProblemProgress, UserState } from "@/lib/storage";
import { apiFetch } from "@/lib/local-api";

const panel = "rounded-2xl border border-[#29363c] bg-[#141e23]";
const DIFFICULTIES: SqlDifficulty[] = ["Easy", "Medium", "Hard"];
const IDS = new Set(SQL_CHALLENGES.map(challenge => challenge.id));
/** Progress lives in the workspace's `progress` map under this key; DSA counts only read DSA problem ids. */
const progressKey = (id: string) => `sql:${id}`;
const draftKey = (id: string) => `interviewos:sql-practice:draft:v1:${id}`;

const DIFFICULTY_STYLE: Record<SqlDifficulty, string> = {
  Easy: "bg-[#c9f27b]/10 text-[#c9f27b]",
  Medium: "bg-[#f0c27b]/10 text-[#f0c27b]",
  Hard: "bg-rose-400/10 text-rose-300",
};

type Solved = Record<string, ProblemProgress>;

function readSolved(progress: Record<string, ProblemProgress> | undefined): Solved {
  const solved: Solved = {};
  for (const challenge of SQL_CHALLENGES) {
    const entry = progress?.[progressKey(challenge.id)];
    if (entry?.solved) solved[challenge.id] = entry;
  }
  return solved;
}

/** Renders `code` spans written with backticks in challenge text. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/`([^`]+)`/).map((part, index) => index % 2
    ? <code key={index} className="rounded bg-[#0d1718] px-1.5 py-0.5 font-mono text-[0.86em] text-[#d9f5b4]">{part}</code>
    : <Fragment key={index}>{part}</Fragment>)}</>;
}

function DifficultyBadge({ difficulty }: { difficulty: SqlDifficulty }) {
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${DIFFICULTY_STYLE[difficulty]}`}>{difficulty}</span>;
}

function setUrl(id: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "sql");
  url.searchParams.set("sql", id);
  window.history.replaceState(null, "", url);
}

export function SqlPractice() {
  const [selectedId, setSelectedId] = useState(SQL_CHALLENGES[0].id);
  const [solved, setSolved] = useState<Solved>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<SqlDifficulty | "All">("All");
  const [hintOpen, setHintOpen] = useState(false);
  const problemRef = useRef<HTMLElement>(null);
  const solvedRef = useRef(solved);
  solvedRef.current = solved;

  useEffect(() => {
    let cancelled = false;
    const requested = new URLSearchParams(window.location.search).get("sql");
    const deepLinked = requested && IDS.has(requested) ? requested : undefined;
    if (deepLinked) setSelectedId(deepLinked);
    (async () => {
      try {
        const response = await apiFetch("/api/state");
        if (!response.ok) throw new Error("Unable to load progress.");
        const progress = readSolved((await response.json() as UserState).progress);
        if (cancelled) return;
        setSolved(progress);
        if (!deepLinked) setSelectedId((SQL_CHALLENGES.find(challenge => !progress[challenge.id]) ?? SQL_CHALLENGES[0]).id);
      } catch {
        if (!cancelled) setError("Could not load your saved SQL progress. Check that the dev server is running; solves made now may not be saved.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const index = SQL_CHALLENGES.findIndex(challenge => challenge.id === selectedId);
  const selected: SqlChallenge = SQL_CHALLENGES[index] ?? SQL_CHALLENGES[0];
  const solvedCount = SQL_CHALLENGES.filter(challenge => solved[challenge.id]).length;
  const percentage = Math.round(solvedCount / SQL_CHALLENGES.length * 100);
  const nextUnsolved = SQL_CHALLENGES.find(challenge => !solved[challenge.id]);
  const progress = solved[selected.id];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SQL_CHALLENGES.filter(challenge => (difficulty === "All" || challenge.difficulty === difficulty)
      && `${challenge.title} ${challenge.topic}`.toLowerCase().includes(needle));
  }, [query, difficulty]);

  function select(id: string, scroll = true) {
    setSelectedId(id); setHintOpen(false); setUrl(id);
    if (scroll) requestAnimationFrame(() => problemRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function markSolved(id: string, code: string) {
    const previous = solvedRef.current;
    const solvedAt = previous[id]?.solvedAt ?? new Date().toISOString();
    setSolved({ ...previous, [id]: { ...previous[id], solved: true, solvedAt, userCode: code } });
    try {
      const response = await apiFetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: { [progressKey(id)]: { solved: true, solvedAt, userCode: code } } }),
      });
      const data = await response.json() as { error?: string; state?: UserState };
      if (!response.ok || !data.state) throw new Error(data.error || "Unable to save progress.");
      setSolved(readSolved(data.state.progress)); setError("");
    } catch {
      setSolved(previous);
      setError("You solved it, but your progress could not be saved. Check that the dev server is running and run the checks again.");
    }
  }

  const byDifficulty = DIFFICULTIES.map(level => {
    const all = SQL_CHALLENGES.filter(challenge => challenge.difficulty === level);
    return { level, total: all.length, done: all.filter(challenge => solved[challenge.id]).length };
  });

  return <div className="space-y-5">
    <header className="relative overflow-hidden rounded-[22px] border border-[#35483b] bg-[#1a2921] p-6 sm:p-7">
      <div className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full bg-[#a5d47b]/10 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div className="max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b6dca0]"><Database className="h-4 w-4" />SQL practice · graded on SQLite</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[#f3f8f2] sm:text-3xl">Write the query<span className="text-[#c9f27b]">.</span></h2>
          <p className="mt-3 text-sm leading-6 text-[#b4c6b7]">Backend interviews often include a live SQL round. Each check runs your query on a fresh database, including hidden edge cases with NULLs, ties, duplicates and empty tables, and compares your rows with a reference answer. In the indexing challenges you write the DDL instead, and the checks read the query plan.</p>
          {loaded && nextUnsolved && <button onClick={() => { setQuery(""); setDifficulty("All"); select(nextUnsolved.id); }} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#c9f27b] px-4 py-2.5 text-sm font-semibold text-[#172418] hover:bg-[#dcffa1]">{solvedCount ? "Next unsolved" : "Start practising"}<ArrowRight className="h-4 w-4" /></button>}
        </div>
        <div className="w-full max-w-sm rounded-xl border border-[#415348] bg-[#142019]/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-[#92a99a]">YOUR PROGRESS</p>
              <p className="mt-1 text-2xl font-semibold text-[#f3f8f2]">{loaded ? solvedCount : "—"}<span className="text-sm font-normal text-[#91a49a]"> / {SQL_CHALLENGES.length} solved</span></p>
            </div>
            <span className="rounded-lg bg-[#c9f27b]/10 px-2.5 py-1 text-sm font-semibold text-[#c9f27b]">{loaded ? percentage : 0}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#2a3a30]" role="progressbar" aria-label="SQL challenges solved" aria-valuemin={0} aria-valuemax={SQL_CHALLENGES.length} aria-valuenow={solvedCount}><div className="h-full rounded-full bg-[#c9f27b] transition-all" style={{ width: `${loaded ? percentage : 0}%` }} /></div>
          <p className="mt-3 text-xs text-[#90a699]">{byDifficulty.map(item => `${item.level} ${loaded ? item.done : "—"}/${item.total}`).join(" · ")}</p>
        </div>
      </div>
    </header>

    {error && <div role="alert" className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">{error}</div>}

    <div className="grid items-start gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
      <aside className={`${panel} min-w-0 p-4`} aria-label="SQL problems">
        <div className="flex items-center justify-between">
          <div><h3 className="text-sm font-semibold text-[#e2eee4]">Problems</h3><p className="mt-1 text-xs text-[#81978b]">{SQL_CHALLENGES.length} challenges · interview difficulty</p></div>
          <Gauge className="h-5 w-5 text-[#b7db98]" />
        </div>
        <label className="relative mt-4 block"><span className="sr-only">Search problems</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#758e81]" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search title or topic…" className="w-full rounded-lg border border-[#34463e] bg-[#0d1718] py-2.5 pl-9 pr-3 text-sm text-[#e2ede5] outline-none placeholder:text-[#71847e] focus:border-[#9dca7d]" /></label>
        <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg border border-[#29363c] bg-[#0f181b] p-1 text-[11.5px] font-medium" role="group" aria-label="Filter by difficulty">
          {(["All", ...DIFFICULTIES] as const).map(level => <button key={level} onClick={() => setDifficulty(level)} aria-pressed={difficulty === level} className={`rounded-md px-2 py-1.5 transition ${difficulty === level ? "bg-[#28382d] text-[#dff5c9]" : "text-[#93a69c] hover:text-white"}`}>{level}</button>)}
        </div>
        <ul className="mt-3 max-h-[45vh] sm:max-h-[360px] space-y-0.5 overflow-y-auto border-t border-[#29363c] pt-3 xl:max-h-[820px]">
          {filtered.map(challenge => {
            const active = challenge.id === selected.id;
            return <li key={challenge.id}><button onClick={() => select(challenge.id)} aria-current={active ? "true" : undefined} className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition ${active ? "bg-[#28382d]" : "hover:bg-[#1b272c]"}`}>
              {solved[challenge.id] ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#bde887]" aria-label="Solved" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#647d6f]" aria-label="Not solved" />}
              <span className="min-w-0 flex-1">
                <span className={`block text-[13px] leading-5 ${active ? "text-[#dff5c9]" : "text-[#c2d0c8]"}`}>{challenge.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#7f948a]"><span>{challenge.topic}</span><DifficultyBadge difficulty={challenge.difficulty} /></span>
              </span>
            </button></li>;
          })}
          {!filtered.length && <li className="px-2 py-4 text-sm text-[#91a69b]">No problems match. Try another search or difficulty.</li>}
        </ul>
      </aside>

      <section ref={problemRef} aria-label="Current SQL problem" className="min-w-0 scroll-mt-20 space-y-5 md:scroll-mt-6">
        <article className={`${panel} p-6 sm:p-7`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#293b2d] px-2.5 py-1 text-xs font-semibold text-[#c9eea5]">{selected.topic}</span>
            <DifficultyBadge difficulty={selected.difficulty} />
            <span className="text-xs text-[#7f948a]">Problem {index + 1} of {SQL_CHALLENGES.length}</span>
            {progress && <span className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[#c9f27b]/10 px-2.5 py-1 text-xs font-semibold text-[#c9f27b]"><Trophy className="h-3.5 w-3.5" />Solved{progress.solvedAt ? ` · ${new Date(progress.solvedAt).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}` : ""}</span>}
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-[#f1f7f2] sm:text-[28px]">{selected.title}</h3>
          <div className="mt-5 rounded-xl border border-[#385241] bg-[#142019] p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.11em] text-[#a9d08c]"><Lightbulb className="h-3.5 w-3.5" />Concept</p>
            <p className="mt-2 text-sm leading-7 text-[#c0d1be]"><Rich text={selected.concept} /></p>
          </div>
          <div className="mt-5">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.11em] text-[#91ae98]"><Target className="h-3.5 w-3.5" />Your task</p>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-[#c6d4cc]"><Rich text={selected.prompt} /></p>
          </div>
          {selected.kind === "index" && <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-[#91ae98]">Query to speed up</p>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-[#2b3a35] bg-[#1e1e1e] p-4 font-mono text-[13px] leading-5 text-[#d4d4d4]">{selected.query}</pre>
          </div>}
          {selected.hint && <>
            <button onClick={() => setHintOpen(open => !open)} aria-expanded={hintOpen} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c9e9a8] hover:text-white"><Lightbulb className="h-3.5 w-3.5" />{hintOpen ? "Hide hint" : "Show hint"}<ChevronDown className={`h-3.5 w-3.5 transition ${hintOpen ? "rotate-180" : ""}`} /></button>
            {hintOpen && <p className="mt-2 rounded-lg border border-[#385241] bg-[#142019] p-3 text-sm leading-6 text-[#c0d1be]"><Rich text={selected.hint} /></p>}
          </>}
        </article>

        <SqlSchemaView key={`schema-${selected.id}`} challenge={selected} />

        {loaded
          ? <PythonChallenge
              key={`sql-${selected.id}`}
              lessonId={selected.id}
              challenge={selected}
              passedCode={progress?.userCode}
              passedAt={progress?.solvedAt}
              onPassed={code => markSolved(selected.id, code)}
              language="sql"
              buildScript={code => buildSqlChallengeScript(code, selected)}
              draftKey={draftKey(selected.id)}
              hidePrompt
              tabularResults
              labels={selected.kind === "index" ? {
                title: "Your indexes",
                ariaLabel: "SQL indexing challenge",
                runtime: "SQLite DDL · checked in your browser",
                idle: "Run the checks to apply your CREATE INDEX statements, read the query plan and confirm the query still returns the same rows.",
                running: "Applying your indexes and reading the query plan…",
                allPassed: "All checks passed. Challenge solved.",
                loadError: "Your SQL could not run",
                noReport: "The checks finished without a report.",
              } : {
                title: "Your query",
                ariaLabel: "SQL challenge",
                runtime: "SQLite · checked in your browser",
                idle: "Run the checks to grade your query. Each check loads a fresh database and compares your rows with the reference answer.",
                running: "Running your query against each dataset…",
                allPassed: "All checks passed. Challenge solved.",
                loadError: "Your SQL could not run",
                noReport: "The checks finished without a report.",
              }}
            />
          : <div className={`${panel} p-5 text-sm text-[#81958b]`}>Loading your editor…</div>}

        <nav className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#29363c] bg-[#111b1d] p-4" aria-label="Problem navigation">
          <button onClick={() => select(SQL_CHALLENGES[index - 1].id)} disabled={index <= 0} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#aabdb1] hover:bg-[#24342d] disabled:opacity-35"><ArrowLeft className="h-4 w-4" />Previous</button>
          <p className="text-xs text-[#81958b]">Solves are saved with your workspace progress.</p>
          <button onClick={() => select(SQL_CHALLENGES[index + 1].id)} disabled={index >= SQL_CHALLENGES.length - 1} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#c0d5c2] hover:bg-[#24342d] disabled:opacity-35">Next<ArrowRight className="h-4 w-4" /></button>
        </nav>
      </section>
    </div>
  </div>;
}
