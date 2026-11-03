"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Circle, Lightbulb, ListChecks, Search, Sparkles } from "lucide-react";
import { DS_COURSE, DS_LESSONS } from "@/data/ds-course";
import { PythonLessonExample } from "@/components/PythonLessonExample";
import { PythonChallenge } from "@/components/PythonChallenge";
import { Visualizer } from "@/components/ds-viz/Visualizer";
import { DS_GUIDES, DS_SOLUTIONS } from "@/data/ds-course/guides";
import { rich } from "@/components/RichText";
import { DS_TRACES } from "@/lib/ds-viz/traces";

const KEY = "interviewos:ds-course:v1";
type Progress = { completed: string[]; current: string; passed: Record<string, { code: string; passedAt: string }> };
const empty: Progress = { completed: [], current: DS_LESSONS[0].id, passed: {} };
const panel = "rounded-2xl border border-[#293c35] bg-[#141e23]";
const LEVEL = { Beginner: "bg-[#1d3b26] text-[#bdf0c4]", Intermediate: "bg-[#13314a] text-[#bfe0ff]", Advanced: "bg-[#3d2353] text-[#e6d2ff]" } as const;

const code = rich;

export default function DataStructuresCourse() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [query, setQuery] = useState("");
  // Below xl the curriculum sits above the lesson, so it starts collapsed on phones and tablets.
  const [listOpen, setListOpen] = useState(false);
  const lessonRef = useRef<HTMLElement>(null);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && typeof raw === "object") {
        const ids = new Set(DS_LESSONS.map(item => item.id));
        setProgress({ completed: Array.isArray(raw.completed) ? [...new Set<string>(raw.completed.filter((id: unknown): id is string => typeof id === "string" && ids.has(id)))] : [], current: ids.has(raw.current) ? raw.current : empty.current, passed: raw.passed && typeof raw.passed === "object" && !Array.isArray(raw.passed) ? raw.passed : {} });
      }
    } catch { setStorageError(true); }
    const requested = new URLSearchParams(location.search).get("lesson");
    if (requested && DS_LESSONS.some(item => item.id === requested)) setProgress(previous => ({ ...previous, current: requested }));
    setLoaded(true);
  }, []);
  function save(next: Progress) {
    setProgress(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); }
  }
  function select(id: string) {
    save({ ...progress, current: id });
    setListOpen(false);
    const url = new URL(location.href); url.searchParams.set("lesson", id); history.replaceState(null, "", url);
    requestAnimationFrame(() => lessonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  const selected = DS_LESSONS.find(item => item.id === progress.current) || DS_LESSONS[0];
  const module = DS_COURSE.find(group => group.lessons.some(item => item.id === selected.id))!;
  const index = DS_LESSONS.findIndex(item => item.id === selected.id);
  const done = progress.completed.includes(selected.id);
  const guide = DS_GUIDES[selected.id];
  const visuals = useMemo(() => DS_TRACES[selected.id]?.(), [selected.id]);
  const filtered = useMemo(() => DS_COURSE.map(group => ({ ...group, lessons: group.lessons.filter(item => `${item.title} ${item.summary} ${group.title}`.toLowerCase().includes(query.trim().toLowerCase())) })).filter(group => group.lessons.length), [query]);
  function toggle() { save({ ...progress, completed: done ? progress.completed.filter(id => id !== selected.id) : [...progress.completed, selected.id] }); }
  function passed(code: string) { save({ ...progress, completed: done ? progress.completed : [...progress.completed, selected.id], passed: { ...progress.passed, [selected.id]: { code, passedAt: new Date().toISOString() } } }); }
  return <div className="mx-auto max-w-[1700px] px-4 pb-12 pt-6 sm:px-7 lg:px-10 lg:pt-9">
    <p className="mb-6 text-xs font-medium tracking-wide text-[#8da199]">YOUR LEARNING / DATA STRUCTURES &amp; ALGORITHMS</p>
    <header className="rounded-[22px] border border-[#35483b] bg-[#1a2921] p-6 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-6"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.15em] text-[#b6dca0]">Learn the building blocks</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#f3f8f2] sm:text-4xl">Data structures &amp; algorithms<span className="text-[#c9f27b]">.</span></h1><p className="mt-3 text-sm leading-7 text-[#b4c6b7]">Understand how structures work, why algorithms are correct, and when to use each one. Read idiomatic Python, experiment, and build confidence before tackling practice problems.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => select((DS_LESSONS.find(item => !progress.completed.includes(item.id)) || DS_LESSONS[0]).id)} className="rounded-lg bg-[#c9f27b] px-4 py-2.5 text-sm font-semibold text-[#172418] hover:bg-[#dcffa1]">{progress.completed.length ? "Continue learning" : "Start learning"} →</button><Link href="/dsa" className="rounded-lg border border-[#526855] px-4 py-2.5 text-sm font-medium text-[#e0eee0] hover:bg-[#283c2b]">Go to DSA practice</Link></div></div><div className="min-w-[220px] rounded-xl border border-[#415348] bg-[#142019]/70 p-4"><p className="text-xs text-[#92a99a]">YOUR PROGRESS</p><p className="mt-1 text-2xl text-[#f3f8f2]">{loaded ? progress.completed.length : "—"} <span className="text-sm text-[#91a49a]">/ {DS_LESSONS.length} lessons</span></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2a3a30]"><div className="h-full bg-[#c9f27b]" style={{width: `${progress.completed.length / DS_LESSONS.length * 100}%`}} /></div><p className="mt-3 text-xs text-[#90a699]">{DS_COURSE.length} modules · {Object.keys(progress.passed).length} challenges passed</p></div></div></header>
    {storageError && <p role="alert" className="mt-4 rounded-lg bg-amber-950/30 p-3 text-sm text-amber-200">Browser storage is unavailable or unreadable. Progress may not be saved.</p>}
    <div className="mt-7 grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className={`${panel} min-w-0 p-4`} aria-label="Course curriculum"><h2 className="text-sm font-semibold text-[#e2eee4]">Course curriculum</h2><button onClick={() => setListOpen(!listOpen)} aria-expanded={listOpen} aria-controls="ds-curriculum" className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-[#34463e] bg-[#0d1718] px-3 py-2.5 text-left text-sm text-[#d7e6da] xl:hidden"><span className="min-w-0 truncate"><span className="text-[#81978b]">Lesson {index + 1}/{DS_LESSONS.length} · </span>{selected.title}</span><span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#c9e9a8]">{listOpen ? "Hide" : "All lessons"}<ChevronDown className={`h-4 w-4 transition ${listOpen ? "rotate-180" : ""}`}/></span></button><div id="ds-curriculum" className={listOpen ? "" : "hidden xl:block"}><label className="relative mt-4 block"><span className="sr-only">Search lessons</span><Search className="absolute left-3 top-3 h-4 w-4 text-[#758e81]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search lessons…" className="w-full rounded-lg border border-[#34463e] bg-[#0d1718] py-2.5 pl-9 pr-3 text-sm text-[#e2ede5]"/></label><div className="mt-4 max-h-[60vh] xl:max-h-[700px] space-y-3 overflow-y-auto">{filtered.map(group => <div key={group.id}><p className="px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-[#8da99a]">{group.title}</p>{group.lessons.map(item => <button key={item.id} onClick={() => select(item.id)} aria-current={selected.id === item.id ? "true" : undefined} className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] ${selected.id === item.id ? "bg-[#28382d] text-[#dff5c9]" : "text-[#a9bab3] hover:bg-[#1b272c]"}`}>{progress.completed.includes(item.id) ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#bde887]"/> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#647d6f]"/>}{item.title}</button>)}</div>)}{!filtered.length && <p className="p-2 text-sm text-[#91a69b]">No lessons found.</p>}</div></div>
      </aside>
      <section ref={lessonRef} aria-label="Current lesson" className="min-w-0 scroll-mt-20 space-y-5 md:scroll-mt-6"><p className="text-xs text-[#8da199]">{module.title} / Lesson {index + 1} of {DS_LESSONS.length}</p>
      <section className={`${panel} p-6 sm:p-7`}>
        <div className="flex flex-wrap gap-2"><span className="rounded-md bg-[#293b2d] px-2.5 py-1 text-xs font-semibold text-[#c9eea5]">{selected.kind}</span>{guide && <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${LEVEL[guide.level]}`}>{guide.level}</span>}</div>
        <h2 className="mt-4 text-2xl font-semibold text-[#f1f7f2]">{selected.title}</h2>
        <p className="mt-3 text-[15px] leading-7 text-[#c3d3c9]">{selected.summary}</p>
        {guide && <>
          <div className="mt-5 flex gap-3 rounded-xl border border-[#4a5a2f] bg-[#232c17] p-4"><Lightbulb className="mt-1 h-5 w-5 shrink-0 text-[#e8d36b]"/><div><p className="text-xs font-bold uppercase tracking-wide text-[#e8d36b]">Think of it like this</p><p className="mt-1.5 text-[15px] leading-7 text-[#e6ead0]">{code(guide.analogy)}</p></div></div>
          <h3 className="mt-7 text-xs font-bold uppercase tracking-wide text-[#91ae98]">The idea in plain English</h3>
          <div className="mt-3 space-y-4 text-[15px] leading-7 text-[#c9d6cf]">{guide.explain.map((item, i) => <p key={i}>{code(item)}</p>)}</div>
        </>}
        {!guide && <><h3 className="mt-6 text-xs font-bold uppercase tracking-wide text-[#91ae98]">What to understand</h3><ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-7 text-[#bbc9c2]">{selected.concepts.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
      </section>
      {visuals && visuals.length > 0 && <Visualizer key={selected.id} visuals={visuals}/>}
      {guide && <>
        <PythonLessonExample key={`simple-${selected.id}`} heading="The simple version" subtitle="Short, commented Python · run it in your browser, then change things and see what happens" lesson={{ title: `${selected.title} (simple)`, code: guide.simpleCode, output: guide.simpleOutput, runtime: "browser" }}/>
        <section className={`${panel} p-6`}><h3 className="flex items-center gap-2 text-sm font-semibold text-[#d7eec7]"><ListChecks className="h-4 w-4"/>How the code works</h3><ol className="mt-4 space-y-3 text-sm leading-7 text-[#bfccc5]">{guide.codeNotes.map((item, i) => <li key={i} className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#293b2d] text-xs font-bold text-[#c9eea5]">{i + 1}</span><span>{code(item)}</span></li>)}</ol></section>
      </>}
      <div className="grid gap-4 lg:grid-cols-2">
        {guide && <section className={`${panel} p-5`}><h3 className="flex items-center gap-2 text-sm font-semibold text-[#d7eec7]"><Sparkles className="h-4 w-4"/>Remember this</h3><ul className="mt-3 space-y-2.5 text-sm leading-6 text-[#bfccc5]">{guide.takeaways.map((item, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#bde887]"/><span>{code(item)}</span></li>)}</ul></section>}
        <section className={`${panel} overflow-hidden ${guide ? "" : "lg:col-span-2"}`}><h3 className="px-5 pt-5 text-sm font-semibold text-[#e2eee4]">How fast is it?</h3><div className="overflow-x-auto"><table className="mt-3 w-full text-left text-sm"><thead className="text-xs uppercase text-[#8da99a]"><tr><th className="px-5 py-2">Operation</th><th className="px-5 py-2">Time</th><th className="px-5 py-2">Notes</th></tr></thead><tbody>{selected.complexity.map((row, i) => <tr key={i} className="border-t border-[#293c35] text-[#bbc9c2]"><td className="px-5 py-3">{row.operation}</td><td className="whitespace-nowrap px-5 py-3 font-mono text-[#c9e9a8]">{row.time}</td><td className="px-5 py-3">{row.note || "—"}</td></tr>)}</tbody></table></div><p className="border-t border-[#293c35] px-5 py-4 text-sm leading-6 text-[#aabeb4]"><strong className="text-[#dcebe0]">Memory:</strong> {selected.space}</p><p className="border-t border-[#293c35] bg-[#111a1e] px-5 py-3 text-xs leading-5 text-[#8ea49a]"><strong className="text-[#b9cdbf]">Reading Big-O:</strong> O(1) takes the same time at any size · O(log n) halves the work each step (1,000,000 items ≈ 20 steps) · O(n) looks at every item once · O(n log n) is what good sorting costs · O(n²) compares every pair and gets slow past about 10,000 items.</p></section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{([["Common mistakes", selected.pitfalls], ["Use it when", selected.useWhen]] as const).map(([title, items]) => <section key={title} className={`${panel} p-5`}><h3 className="text-sm font-semibold text-[#d7eec7]">{title}</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#aabeb4]">{items.map((item, i) => <li key={i}>{item}</li>)}</ul></section>)}</div>
      <details key={`deeper-${selected.id}`} className={`${panel} group overflow-hidden`} open={!guide}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden"><div><h3 className="text-sm font-semibold text-[#e2eee4]">Go deeper: the polished, interview-ready version</h3><p className="mt-1 text-xs leading-5 text-[#879b94]">Open this once the simple version makes sense. It has the full implementation with Python best practices, the finer details, and what to use in real projects.</p></div><ChevronDown className="h-5 w-5 shrink-0 text-[#8da99a] transition group-open:rotate-180"/></summary>
        <div className="space-y-5 border-t border-[#293c35] p-5">
          {guide && <div><h4 className="text-xs font-bold uppercase tracking-wide text-[#91ae98]">The finer details</h4><ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-7 text-[#bbc9c2]">{selected.concepts.map((item, i) => <li key={i}>{item}</li>)}</ul></div>}
          <PythonLessonExample key={selected.id} heading="Polished implementation" lesson={{ title: selected.title, code: selected.code, output: selected.output, runtime: "browser" }}/>
          <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-xl border border-[#293c35] p-5"><h4 className="text-sm font-semibold text-[#d7eec7]">Python best practices in this version</h4><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[#aabeb4]">{selected.bestPractices.map((item, i) => <li key={i}>{item}</li>)}</ul></section><section className="rounded-xl border border-[#293c35] p-5"><h4 className="text-sm font-semibold text-[#d7eec7]">In real projects</h4><p className="mt-3 text-sm leading-6 text-[#aabeb4]">{selected.inPractice}</p></section></div>
        </div>
      </details>
      {loaded && <PythonChallenge key={`challenge-${selected.id}`} lessonId={selected.id} challenge={selected.challenge} solutionNotes={DS_SOLUTIONS[selected.id]?.notes} simpleSolution={DS_SOLUTIONS[selected.id]?.code} draftKey={`interviewos:ds-course:draft:v1:${selected.id}`} passedCode={progress.passed[selected.id]?.code} passedAt={progress.passed[selected.id]?.passedAt} onPassed={passed}/>}
      {selected.practice.length > 0 && <div className={`${panel} p-5`}><p className="flex items-center gap-2 text-sm font-semibold text-[#d7eec7]"><BookOpen className="h-4 w-4"/>Continue with problems</p><div className="mt-3 flex flex-wrap gap-2">{selected.practice.map(topic => <Link key={topic} href={`/dsa?topic=${encodeURIComponent(topic)}`} className="rounded-lg border border-[#405749] px-3 py-2 text-xs text-[#c9e9a8] hover:bg-[#283c2b]">{topic} →</Link>)}</div></div>}
      <div className={`${panel} flex flex-wrap items-center justify-between gap-3 p-4`}><button disabled={index === 0} onClick={() => select(DS_LESSONS[index-1].id)} className="flex items-center gap-1 px-3 py-2 text-sm text-[#aabdb1] disabled:opacity-35"><ArrowLeft className="h-4 w-4"/>Previous</button><button disabled={!loaded} onClick={toggle} className="rounded-lg bg-[#c9f27b] px-4 py-2 text-sm font-semibold text-[#172418] disabled:opacity-40">{done ? "Completed · undo" : "Mark complete"}</button><button disabled={index === DS_LESSONS.length - 1} onClick={() => select(DS_LESSONS[index+1].id)} className="flex items-center gap-1 px-3 py-2 text-sm text-[#aabdb1] disabled:opacity-35">Next<ArrowRight className="h-4 w-4"/></button></div><p className="text-xs leading-5 text-[#81958b]">Progress and drafts are saved in this browser. Challenges run in browser Python. <a href={selected.source} target="_blank" rel="noreferrer" className="text-[#c9e9a8] underline">Read more ↗</a></p></section>
    </div>
  </div>;
}
