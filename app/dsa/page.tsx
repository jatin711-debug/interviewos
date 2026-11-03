"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Circle, Code2, Compass, PanelLeftClose, PanelLeftOpen, RotateCcw, Search, Sparkles, X } from "lucide-react";
import { CodeEditor } from "@/components/CodeEditor";
import { InterviewTimer } from "@/components/InterviewTimer";
import { LessonLinks } from "@/components/dsa/LessonLinks";
import { MockInterview } from "@/components/dsa/MockInterview";
import { ProblemNotes } from "@/components/dsa/ProblemNotes";
import { ProblemPanel } from "@/components/dsa/ProblemPanel";
import { ReviewQueue } from "@/components/dsa/ReviewQueue";
import { DSA_PROBLEMS, type DSACategory, type DSAProblem } from "@/data/dsa";
import { LEARNING_STAGES, TOPIC_GUIDES, problemProgress } from "@/data/dsa-curriculum";
import { describeDue, endOfToday, reviewDueAt, reviewSchedule } from "@/lib/dsa-review";
import type { MockSession, ProblemProgress, UserState } from "@/lib/storage";
import { readCollapsed, writeCollapsed } from "@/lib/ui-prefs";
import { apiFetch } from "@/lib/local-api";

type View = "practice" | "path" | "review" | "mock";
type Status = "all" | "unsolved" | "solved";
type ReviewSession = { problemId: string; passed: boolean; nextReviewDate?: string };
const VIEWS: ReadonlyArray<readonly [View, string]> = [["practice", "Practice workspace"], ["path", "Learning path"], ["review", "Review queue"], ["mock", "Mock interview"]];
const categories = LEARNING_STAGES.flatMap(stage => stage.categories);
const difficulties = ["Easy", "Medium", "Hard"] as const;
const difficultyColor: Record<string, string> = { Easy: "text-emerald-400", Medium: "text-amber-400", Hard: "text-rose-400" };
const field = "w-full rounded-lg border border-slate-700/80 bg-[#111827] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const practiceDraftKey = (id: string) => `interviewos:dsa:draft:${id}`;
const reviewDraftKey = (id: string) => `interviewos:dsa:review-draft:${id}`;

export default function DSADojoPage() {
  const [progress, setProgress] = useState<Record<string, ProblemProgress>>({});
  const [mockSessions, setMockSessions] = useState<MockSession[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [progressReady, setProgressReady] = useState(false);
  const [view, setView] = useState<View>("practice");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DSACategory | "all">("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [status, setStatus] = useState<Status>("all");
  const [selectedId, setSelectedId] = useState(DSA_PROBLEMS[0].id);
  const [review, setReview] = useState<ReviewSession | null>(null);
  const [now, setNow] = useState(0);
  // Layout comes from <html data-dsa-library>; this state only keeps aria-expanded accurate.
  const [libraryHidden, setLibraryHidden] = useState(false);
  useLayoutEffect(() => { setLibraryHidden(readCollapsed("dsaLibrary")); }, []);
  const toggleLibrary = () => { writeCollapsed("dsaLibrary", !libraryHidden); setLibraryHidden(!libraryHidden); };

  useEffect(() => {
    apiFetch("/api/state").then(res => {
      if (!res.ok) throw new Error("Could not load progress");
      return res.json() as Promise<UserState>;
    }).then(state => { setProgress(state.progress || {}); setMockSessions(state.mockSessions || []); }).catch(() => setLoadError(true)).finally(() => setProgressReady(true));
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const mergeProgress = useCallback((id: string, entry: Partial<ProblemProgress>) => {
    setProgress(old => ({ ...old, [id]: { ...(old[id] ?? { solved: false }), ...entry } }));
  }, []);

  const solvedCount = DSA_PROBLEMS.filter(p => problemProgress(p, progress)?.solved).length;
  const filtered = useMemo(() => DSA_PROBLEMS.filter(p => {
    const matchesQuery = `${p.title} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase());
    const solved = !!problemProgress(p, progress)?.solved;
    return matchesQuery && (category === "all" || p.category === category) &&
      (difficulty === "all" || p.difficulty === difficulty) &&
      (status === "all" || (status === "solved" ? solved : !solved));
  }), [query, category, difficulty, status, progress]);
  const schedule = useMemo(() => reviewSchedule(DSA_PROBLEMS, progress), [progress]);
  const dueCount = now ? schedule.filter(item => item.dueAt <= endOfToday(now)).length : 0;
  const selected = filtered.find(p => p.id === selectedId) || filtered[0];
  const selectedProgress = selected ? problemProgress(selected, progress) : undefined;
  const position = selected ? filtered.findIndex(p => p.id === selected.id) : -1;
  const reviewing = review && selected?.id === review.problemId ? review : null;
  const nextProblem = DSA_PROBLEMS.find(p => !problemProgress(p, progress)?.solved);
  const percent = Math.round(solvedCount / DSA_PROBLEMS.length * 100);

  function chooseProblem(problem: DSAProblem) { setSelectedId(problem.id); setReview(null); }
  function clearFilters() { setQuery(""); setCategory("all"); setDifficulty("all"); setStatus("all"); }
  function openTopic(topic: DSACategory) {
    setQuery(""); setDifficulty("all"); setStatus("all"); setCategory(topic);
    const first = DSA_PROBLEMS.find(p => p.category === topic && !problemProgress(p, progress)?.solved) || DSA_PROBLEMS.find(p => p.category === topic);
    if (first) chooseProblem(first);
    setView("practice");
  }
  function startReview(problem: DSAProblem) {
    // Each review is a fresh attempt, so drop any draft left from the last one.
    try { localStorage.removeItem(reviewDraftKey(problem.id)); } catch {}
    clearFilters();
    setSelectedId(problem.id);
    setReview({ problemId: problem.id, passed: false });
    setView("practice");
  }
  function openProblem(problem: DSAProblem) { clearFilters(); chooseProblem(problem); setView("practice"); }

  // Deep links: /dsa?topic=<category>, /dsa?problem=<id>, /dsa?view=review|mock|path
  useEffect(() => {
    if (!progressReady) return;
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    const problem = DSA_PROBLEMS.find(p => p.id === params.get("problem"));
    const requested = params.get("view");
    if (topic && categories.includes(topic as DSACategory)) openTopic(topic as DSACategory);
    else if (problem) openProblem(problem);
    if (requested === "path" || requested === "review" || requested === "mock") setView(requested);
    // Runs once, after saved progress is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressReady]);

  const nextDue = now ? schedule.find(item => item.dueAt <= endOfToday(now) && item.problem.id !== reviewing?.problemId) : undefined;
  const dueAt = reviewDueAt(selectedProgress);

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 px-4 py-6 sm:px-7 lg:px-8 lg:py-8">
      <header className="relative overflow-hidden rounded-[22px] border border-[#35483b] bg-[#1a2921] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#a5d47b]/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#b6dca0]"><Sparkles className="h-4 w-4" /> Your practice space</div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#f3f8f2] sm:text-4xl">The DSA Dojo<span className="text-[#c9f27b]">.</span></h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#b4c6b7]">Build intuition, practice the patterns, and turn each problem into progress. Start wherever you are and keep moving forward.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {nextProblem && <button onClick={() => openProblem(nextProblem)} className="inline-flex items-center gap-2 rounded-lg bg-[#c9f27b] px-4 py-2.5 text-sm font-semibold text-[#172418] transition hover:bg-[#dcffa1]">{solvedCount ? "Continue practicing" : "Start practicing"}<ArrowRight className="h-4 w-4" /></button>}
              {dueCount > 0 && <button onClick={() => setView("review")} className="inline-flex items-center gap-2 rounded-lg border border-[#6d8f5c] bg-[#22351f] px-4 py-2.5 text-sm font-semibold text-[#d9f5c0] transition hover:bg-[#2b4527]"><RotateCcw className="h-4 w-4" /> {dueCount} {dueCount === 1 ? "review" : "reviews"} due</button>}
              <button onClick={() => setView("path")} className="inline-flex items-center gap-2 rounded-lg border border-[#526855] bg-[#1d2c22] px-4 py-2.5 text-sm font-medium text-[#e0eee0] transition hover:bg-[#283c2b]"><Compass className="h-4 w-4" /> Explore the path</button>
              <Link href="/python-playground" className="inline-flex items-center gap-2 rounded-lg border border-[#526855] bg-[#1d2c22] px-4 py-2.5 text-sm font-medium text-[#e0eee0] transition hover:bg-[#283c2b]"><Code2 className="h-4 w-4" /> Code playground</Link>
              <Link href="/python-course" className="inline-flex items-center gap-2 rounded-lg border border-[#526855] bg-[#1d2c22] px-4 py-2.5 text-sm font-medium text-[#e0eee0] transition hover:bg-[#283c2b]"><BookOpen className="h-4 w-4" /> Python foundations</Link>
              <Link href="/ds-course" className="inline-flex items-center gap-2 rounded-lg border border-[#526855] bg-[#1d2c22] px-4 py-2.5 text-sm font-medium text-[#e0eee0] transition hover:bg-[#283c2b]"><BookOpen className="h-4 w-4" /> Learn data structures &amp; algorithms</Link>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-xl border border-[#415348] bg-[#142019]/70 p-4">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-slate-400">YOUR PROGRESS</p><p className="mt-1 text-2xl font-bold text-white">{solvedCount}<span className="text-base font-normal text-slate-500"> / {DSA_PROBLEMS.length} solved</span></p></div><span className="rounded-lg bg-[#c9f27b]/10 px-2.5 py-1 text-sm font-semibold text-[#c9f27b]">{percent}%</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Problems solved" aria-valuemin={0} aria-valuemax={DSA_PROBLEMS.length} aria-valuenow={solvedCount}><div className="h-full rounded-full bg-[#c9f27b] transition-all" style={{ width: `${percent}%` }} /></div>
            <p className="mt-3 text-xs text-slate-400">{categories.length} topics · {DSA_PROBLEMS.length} practice problems · {dueCount} due for review</p>
          </div>
        </div>
      </header>
      {loadError && <div role="alert" className="rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">Couldn’t load saved progress. Refresh to try again.</div>}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex gap-6 overflow-x-auto" aria-label="DSA sections">
          {VIEWS.map(([value, label]) => <button key={value} onClick={() => setView(value)} aria-current={view === value ? "page" : undefined} className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-semibold ${view === value ? "border-blue-400 text-white" : "border-transparent text-slate-400 hover:text-white"}`}>{label}{value === "review" && dueCount > 0 && <span className="rounded-full bg-emerald-500/15 px-1.5 text-[11px] text-emerald-300">{dueCount}</span>}</button>)}
        </div>
        {view !== "mock" && <div className="pb-2"><InterviewTimer initialMinutes={35} label="Practice timer" /></div>}
      </div>
      {view === "path" && (
        <section className="space-y-6" aria-label="DSA learning path">
          <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5 sm:p-6">
            <div className="flex items-center gap-3"><div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-400"><BookOpen className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-white">Start with the essentials</h2><p className="mt-1 text-sm text-slate-400">Use this sequence as a guide, or jump directly to a topic you want to improve.</p></div></div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-slate-200">1. Analyze</h3><p className="mt-1 text-xs leading-5 text-slate-400">Estimate time and space, identify constraints, and describe a brute-force approach.</p></div>
              <div className="rounded-lg bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-slate-200">2. Recognize</h3><p className="mt-1 text-xs leading-5 text-slate-400">Find the pattern, define the invariant, and work through a small example.</p></div>
              <div className="rounded-lg bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-slate-200">3. Practice & review</h3><p className="mt-1 text-xs leading-5 text-slate-400">Code it, test edge cases, rate how it felt, and re-solve it from scratch when it comes back in your review queue.</p></div>
            </div>
            <p className="mt-4 rounded-lg border border-[#3a4f36] bg-[#1a2820] px-4 py-3 text-xs leading-5 text-[#c3d6bb]"><span className="font-semibold text-[#d9f5c0]">Preparing for a mid-level role?</span> Stages 01–04 cover what coding rounds usually ask, mostly Easy and Medium problems. Stages 05–06 and the Hard problems are stretch practice: worth doing once the core feels solid, and great for standing out.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5 sm:p-6">
            <h2 className="text-base font-semibold text-white">Foundations to keep in mind</h2>
            <p className="mt-1 text-sm text-slate-400">Use these ideas throughout the path, regardless of the topic.</p>
            <Link href="/python-course" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#c9f27b] hover:text-[#e4ffba]">Explore the full Python course <ArrowRight className="h-4 w-4" /></Link>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-slate-200">Time & space</h3><p className="mt-1 text-xs leading-5 text-slate-400">Compare O(1), O(log n), O(n), O(n log n), and O(n²). Count auxiliary memory and recursion stack depth too.</p></div>
              <div className="rounded-lg bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-slate-200">Python toolkit</h3><p className="mt-1 text-xs leading-5 text-slate-400">Know lists, dictionaries, sets, deque, heapq, sorting keys, and the costs of slicing and membership checks.</p></div>
              <div className="rounded-lg bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-slate-200">Recursion</h3><p className="mt-1 text-xs leading-5 text-slate-400">Identify the base case, the smaller subproblem, and what each call returns. Track the call stack.</p></div>
              <div className="rounded-lg bg-slate-900/70 p-4"><h3 className="text-sm font-semibold text-slate-200">Interview habits</h3><p className="mt-1 text-xs leading-5 text-slate-400">Clarify input, walk through examples, state an invariant, check edge cases, and explain the trade-offs.</p></div>
            </div>
          </div>
          {LEARNING_STAGES.map(stage => <div key={stage.title}>
            <div className="mb-3"><div className="flex flex-wrap items-center gap-2.5"><h2 className="text-base font-semibold text-white">{stage.title}</h2>{stage.focus === "core"
              ? <span className="rounded-md bg-[#c9f27b]/10 px-2 py-0.5 text-[11px] font-semibold text-[#c9f27b]">Core for mid-level interviews</span>
              : <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-300">Stretch · after the core</span>}</div><p className="mt-1 text-sm text-slate-400">{stage.subtitle}</p></div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{stage.categories.map(topic => {
              const items = DSA_PROBLEMS.filter(p => p.category === topic); const done = items.filter(p => problemProgress(p, progress)?.solved).length; const guide = TOPIC_GUIDES[topic];
              return <div key={topic} className="group flex h-full flex-col rounded-xl border border-slate-800 bg-[#0b111d] transition hover:border-blue-700/70 hover:bg-[#0e1929]">
                <button onClick={() => openTopic(topic)} className="flex flex-1 flex-col rounded-t-xl p-4 pb-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <div className="flex w-full items-start justify-between gap-3"><h3 className="font-semibold text-slate-100 group-hover:text-blue-300">{topic}</h3><ArrowRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-blue-400" /></div>
                  <p className="mt-2 text-sm leading-5 text-slate-400">{guide?.summary}</p><p className="mt-3 text-xs leading-5 text-slate-500">{guide?.learn}</p>
                  <div className="mt-auto flex w-full items-center gap-3 pt-4"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{width: `${items.length ? done / items.length * 100 : 0}%`}} /></div><span className="text-xs text-slate-400">{done}/{items.length}</span></div>
                </button>
                <LessonLinks topic={topic} className="border-t border-slate-800/80 px-4 py-2.5" />
              </div>;
            })}</div>
          </div>)}
        </section>
      )}
      {view === "review" && <ReviewQueue schedule={schedule} now={now} onStart={startReview} />}
      {view === "mock" && (progressReady
        ? <MockInterview progress={progress} sessions={mockSessions} onProgress={mergeProgress} onSessionsSaved={setMockSessions} onOpenProblem={openProblem} />
        : <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-6 text-sm text-slate-400">Loading your workspace…</div>)}
      {view === "practice" && (
        <div className="grid items-start gap-5 2xl:grid-cols-[290px_minmax(0,1fr)] 2xl:library-collapsed:grid-cols-1">
          <aside id="dsa-problem-library" className="rounded-xl border border-slate-800 bg-[#0b111d] p-4 library-collapsed:hidden" aria-label="Problem library">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Problem library</h2><p className="mt-1 text-xs text-slate-500">{filtered.length} of {DSA_PROBLEMS.length} problems</p></div><button onClick={toggleLibrary} aria-expanded={!libraryHidden} aria-controls="dsa-problem-library" title="Hide the library to give the editor more room" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition hover:bg-slate-800/70 hover:text-slate-100"><PanelLeftClose className="h-4 w-4" /><span>Hide</span></button></div>
            <div className="space-y-2.5">
              <label className="relative block"><span className="sr-only">Search problems</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search problems..." className={`${field} pl-9`} /></label>
              <label className="block"><span className="sr-only">Filter by topic</span><select value={category} onChange={e => setCategory(e.target.value as DSACategory | "all")} className={field}><option value="all">All topics</option>{categories.map(c => <option value={c} key={c}>{c}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-2"><label><span className="sr-only">Filter by difficulty</span><select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={field}><option value="all">Any difficulty</option>{difficulties.map(d => <option key={d}>{d}</option>)}</select></label><label><span className="sr-only">Filter by status</span><select value={status} onChange={e => setStatus(e.target.value as Status)} className={field}><option value="all">Any status</option><option value="unsolved">Unsolved</option><option value="solved">Solved</option></select></label></div>
            </div>
            <div className="mt-4 max-h-[480px] space-y-1 overflow-y-auto border-t border-slate-800 pt-3 2xl:max-h-[690px]">
              {filtered.map(p => { const isSelected = selected?.id === p.id; const solved = problemProgress(p, progress)?.solved; return <button key={p.id} onClick={() => chooseProblem(p)} aria-pressed={isSelected} className={`flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition ${isSelected ? "bg-blue-500/15 ring-1 ring-blue-500/30" : "hover:bg-slate-800/60"}`}>
                {solved ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />}<span className="min-w-0 flex-1"><span className={`block text-sm font-medium ${isSelected ? "text-blue-200" : "text-slate-200"}`}>{p.title}</span><span className="mt-1 block text-xs text-slate-500">{p.category}</span></span><span className={`pt-0.5 text-[11px] ${difficultyColor[p.difficulty]}`}>{p.difficulty}</span>
              </button>; })}
              {!filtered.length && <div className="py-8 text-center text-sm text-slate-400"><p>No problems match these filters.</p><button onClick={clearFilters} className="mt-3 text-blue-400 hover:text-blue-300">Clear filters</button></div>}
            </div>
          </aside>
          {selected ? <div className="min-w-0 space-y-4">
            <div className="hidden flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-[#0b111d] px-3 py-2 library-collapsed:flex">
              <button onClick={toggleLibrary} aria-expanded={!libraryHidden} aria-controls="dsa-problem-library" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-slate-800/70"><PanelLeftOpen className="h-4 w-4 text-slate-400" />Problem library</button>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {position >= 0 && <span className="mr-1 hidden sm:inline">{position + 1} of {filtered.length}</span>}
                <button onClick={() => position > 0 && chooseProblem(filtered[position - 1])} disabled={position <= 0} aria-label="Previous problem" className="rounded-lg p-1.5 transition hover:bg-slate-800/70 hover:text-slate-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => position >= 0 && position < filtered.length - 1 && chooseProblem(filtered[position + 1])} disabled={position < 0 || position >= filtered.length - 1} aria-label="Next problem" className="rounded-lg p-1.5 transition hover:bg-slate-800/70 hover:text-slate-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            {reviewing && <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-800/50 bg-emerald-950/20 px-4 py-3 text-sm">
              <p className="flex items-center gap-2 text-emerald-100"><RotateCcw className="h-4 w-4 text-emerald-300" />{reviewing.nextReviewDate
                ? <>Review done. Next one on {new Date(reviewing.nextReviewDate).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}.</>
                : <>Review: re-solve from the starter code. Pattern hints and the solution unlock once your tests pass.</>}</p>
              <div className="flex items-center gap-2">
                {reviewing.nextReviewDate && nextDue && <button onClick={() => startReview(nextDue.problem)} className="rounded-lg bg-[#c9f27b] px-3 py-1.5 text-xs font-semibold text-[#172418] hover:bg-[#dcffa1]">Next due review</button>}
                <button onClick={() => setReview(null)} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-emerald-200 hover:bg-emerald-900/40"><X className="h-3.5 w-3.5" /> Exit review</button>
              </div>
            </div>}
            <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <ProblemPanel
                key={`${selected.id}:${reviewing ? "review" : "practice"}`}
                problem={selected}
                solved={!!selectedProgress?.solved}
                lockedTabs={reviewing && !reviewing.passed ? ["intuition", "solution"] : []}
                lockedReason="Unlocks when your tests pass"
                status={dueAt !== null && now ? <>Next review: {describeDue(dueAt, now).toLowerCase()}</> : undefined}
              >
                {progressReady && <ProblemNotes key={selected.id} problemId={selected.id} initialNotes={selectedProgress?.notes} onChange={notes => mergeProgress(selected.id, { notes })} />}
              </ProblemPanel>
              <div className="h-[82vh] min-h-[560px] min-w-0 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">{!progressReady ? <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-6 text-sm text-slate-400">Loading your workspace…</div>
                : reviewing ? <CodeEditor fill key={`${selected.id}:review`} initialCode={selected.starterCode} draftKey={reviewDraftKey(selected.id)} runWrapper={selected.runWrapper} problemId={selected.id}
                    onSuccess={saved => mergeProgress(selected.id, saved)}
                    onResult={passed => { if (passed) setReview(r => r && r.problemId === selected.id ? { ...r, passed: true } : r); }}
                    onRated={entry => { mergeProgress(selected.id, entry); setReview(r => r && r.problemId === selected.id ? { ...r, passed: true, nextReviewDate: entry.review?.nextReviewDate } : r); }} />
                : <CodeEditor fill key={`${selected.id}:practice`} initialCode={selected.starterCode} savedCode={selectedProgress?.userCode} draftKey={practiceDraftKey(selected.id)} runWrapper={selected.runWrapper} problemId={selected.id}
                    onSuccess={saved => mergeProgress(selected.id, saved)} onRated={entry => mergeProgress(selected.id, entry)} />}</div>
            </div>
          </div> : <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-[#0b111d] p-8 text-center"><Code2 className="h-8 w-8 text-slate-600" /><h2 className="mt-4 font-semibold text-slate-200">No problem selected</h2><p className="mt-2 text-sm text-slate-400">Adjust your filters to find a problem.</p><button onClick={clearFilters} className="mt-4 flex items-center gap-1 text-sm text-blue-400"><X className="h-4 w-4" /> Clear filters</button></div>}
        </div>
      )}
    </div>
  );
}
