"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Circle, Clock3, Code2, GraduationCap, Lightbulb, Network, Search, Sparkles } from "lucide-react";
import { PYTHON_COURSE, PYTHON_LESSONS } from "@/data/python-course";
import { topicsForLesson } from "@/data/topic-links";
import { PythonChallenge } from "@/components/PythonChallenge";
import { PythonLessonExample } from "@/components/PythonLessonExample";
import type { PythonCourseProgress, UserState } from "@/lib/storage";
import { apiFetch } from "@/lib/local-api";

// Progress used to live only in localStorage; it is moved into the saved workspace state once.
const LEGACY_PROGRESS_KEY = "interviewos:python-course:completed:v1";
const LEGACY_CURRENT_KEY = "interviewos:python-course:current:v1";
const LESSON_IDS = new Set(PYTHON_LESSONS.map(lesson => lesson.id));
const CHALLENGE_COUNT = PYTHON_LESSONS.filter(lesson => lesson.challenge).length;
const panel = "rounded-2xl border border-[#29363c] bg-[#141e23]";

type Progress = Required<Pick<PythonCourseProgress, "completed" | "exercises">> & { currentLessonId?: string };
const EMPTY: Progress = { completed: [], exercises: {} };

function normalize(course: PythonCourseProgress | undefined): Progress {
  return {
    completed: [...new Set((course?.completed ?? []).filter(id => LESSON_IDS.has(id)))],
    exercises: course?.exercises ?? {},
    currentLessonId: course?.currentLessonId,
  };
}

async function saveCourse(patch: Partial<PythonCourseProgress>): Promise<Progress> {
  const response = await apiFetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pythonCourse: patch }) });
  const data = await response.json() as { error?: string; state?: UserState };
  if (!response.ok || !data.state) throw new Error(data.error || "Unable to save progress.");
  return normalize(data.state.pythonCourse);
}

function readLegacyProgress(): { completed: string[]; current?: string } {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(LEGACY_PROGRESS_KEY) || "[]");
    const completed = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string" && LESSON_IDS.has(id)) : [];
    const current = localStorage.getItem(LEGACY_CURRENT_KEY);
    return { completed, current: current && LESSON_IDS.has(current) ? current : undefined };
  } catch { return { completed: [] }; }
}

export default function PythonCoursePage() {
  const [selectedId, setSelectedId] = useState(PYTHON_LESSONS[0].id);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  // Below xl the curriculum sits above the lesson, so it starts collapsed on phones and tablets.
  const [listOpen, setListOpen] = useState(false);
  const lessonRef = useRef<HTMLElement>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    let cancelled = false;
    const requested = new URLSearchParams(window.location.search).get("lesson");
    const deepLinked = requested && LESSON_IDS.has(requested) ? requested : undefined;
    if (deepLinked) setSelectedId(deepLinked);
    const legacy = readLegacyProgress();
    (async () => {
      try {
        const response = await apiFetch("/api/state");
        if (!response.ok) throw new Error("Unable to load progress.");
        let course = normalize((await response.json() as UserState).pythonCourse);
        const missing = legacy.completed.filter(id => !course.completed.includes(id));
        const current = course.currentLessonId ?? legacy.current;
        if (missing.length || (current && current !== course.currentLessonId)) {
          course = await saveCourse({ ...(missing.length ? { completed: [...course.completed, ...missing] } : {}), ...(current ? { currentLessonId: current } : {}) });
        }
        try { localStorage.removeItem(LEGACY_PROGRESS_KEY); localStorage.removeItem(LEGACY_CURRENT_KEY); } catch { /* already migrated */ }
        if (cancelled) return;
        setProgress(course);
        if (!deepLinked && course.currentLessonId && LESSON_IDS.has(course.currentLessonId)) setSelectedId(course.currentLessonId);
      } catch {
        if (cancelled) return;
        setProgress({ ...EMPTY, completed: legacy.completed });
        if (!deepLinked && legacy.current) setSelectedId(legacy.current);
        setError("Could not load your saved course progress. Check that the dev server is running; changes made now may not be saved.");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { completed, exercises } = progress;
  const selected = PYTHON_LESSONS.find(item => item.id === selectedId) || PYTHON_LESSONS[0];
  const module = PYTHON_COURSE.find(item => item.lessons.some(lesson => lesson.id === selected.id))!;
  const index = PYTHON_LESSONS.findIndex(item => item.id === selected.id);
  const done = completed.includes(selected.id);
  const percentage = Math.round(completed.length / PYTHON_LESSONS.length * 100);
  const challengesPassed = PYTHON_LESSONS.filter(lesson => lesson.challenge && exercises[lesson.id]).length;
  const nextIncomplete = PYTHON_LESSONS.find(item => !completed.includes(item.id));
  const dsaTopics = topicsForLesson(selected.id);
  const filtered = useMemo(() => PYTHON_COURSE.map(group => ({ ...group, lessons: group.lessons.filter(lesson => `${lesson.title} ${lesson.summary} ${group.title}`.toLowerCase().includes(query.trim().toLowerCase())) })).filter(group => group.lessons.length), [query]);

  function select(id: string) {
    setSelectedId(id); setHintOpen(false);
    setListOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("lesson", id);
    window.history.replaceState(null, "", url);
    if (loaded) saveCourse({ currentLessonId: id }).catch(() => { /* resuming position is best effort */ });
    requestAnimationFrame(() => lessonRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  async function update(next: Progress, patch: Partial<PythonCourseProgress>, failure: string) {
    const previous = progressRef.current;
    setProgress(next);
    try { setProgress(await saveCourse(patch)); setError(""); }
    catch { setProgress(previous); setError(failure); }
  }

  function toggleComplete() {
    const list = done ? completed.filter(id => id !== selected.id) : [...completed, selected.id];
    update({ ...progress, completed: list }, { completed: list }, "Could not save your progress. Check that the dev server is running and try again.");
  }

  function challengePassed(lessonId: string, code: string) {
    const current = progressRef.current;
    const list = current.completed.includes(lessonId) ? current.completed : [...current.completed, lessonId];
    const result = { passedAt: new Date().toISOString(), code };
    update({ ...current, completed: list, exercises: { ...current.exercises, [lessonId]: result } }, { completed: list, exercises: { [lessonId]: result } }, "You passed, but your progress could not be saved. Check that the dev server is running and run the checks again.");
  }

  return <div className="mx-auto max-w-[1700px] px-4 pb-12 pt-6 sm:px-7 lg:px-10 lg:pt-9">
    <div className="mb-6 flex flex-wrap items-center gap-2 text-xs text-[#758890]"><span>YOUR LEARNING</span><span className="text-[#52636b]">/</span><span className="font-medium text-[#b2c0bf]">Python foundations</span></div>
    <header className="relative overflow-hidden rounded-[22px] border border-[#35483b] bg-[#1a2921] p-6 sm:p-8"><div className="pointer-events-none absolute -right-12 -top-28 h-72 w-72 rounded-full bg-[#a5d47b]/10 blur-3xl"/><div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end"><div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b6dca0]"><Sparkles className="h-4 w-4"/> YOUR PYTHON LEARNING PATH</div><h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#f3f8f2] sm:text-4xl">Python, from the ground up<span className="text-[#c9f27b]">.</span></h1><p className="mt-3 text-sm leading-6 text-[#b4c6b7]">Build the foundations for DSA, write reliable Python with Pydantic, threads, processes, and async, then see how CPython works underneath. Every lesson ends with a graded challenge.</p><div className="mt-5 flex flex-wrap gap-3"><button onClick={() => { setQuery(""); select((nextIncomplete || PYTHON_LESSONS[0]).id); }} className="inline-flex items-center gap-2 rounded-lg bg-[#c9f27b] px-4 py-2.5 text-sm font-semibold text-[#172418] hover:bg-[#dcffa1]">{completed.length ? "Continue learning" : "Start learning"}<ArrowRight className="h-4 w-4"/></button><Link href="/python-playground" className="inline-flex items-center gap-2 rounded-lg border border-[#526855] bg-[#1d2c22] px-4 py-2.5 text-sm font-medium text-[#e0eee0] hover:bg-[#283c2b]"><Code2 className="h-4 w-4"/>Code playground</Link></div></div><div className="w-full max-w-sm rounded-xl border border-[#415348] bg-[#142019]/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold tracking-wider text-[#92a99a]">YOUR PROGRESS</p><p className="mt-1 text-2xl font-semibold text-[#f3f8f2]">{loaded ? completed.length : "—"}<span className="text-sm font-normal text-[#91a49a]"> / {PYTHON_LESSONS.length} lessons</span></p></div><span className="rounded-lg bg-[#c9f27b]/10 px-2.5 py-1 text-sm font-semibold text-[#c9f27b]">{loaded ? percentage : 0}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#2a3a30]" role="progressbar" aria-label="Lessons completed" aria-valuemin={0} aria-valuemax={PYTHON_LESSONS.length} aria-valuenow={completed.length}><div className="h-full rounded-full bg-[#c9f27b] transition-all" style={{width: `${percentage}%`}}/></div><p className="mt-3 text-xs text-[#90a699]">{PYTHON_COURSE.length} modules · {loaded ? challengesPassed : "—"}/{CHALLENGE_COUNT} challenges passed</p></div></div></header>
    {error && <div role="alert" className="mt-4 rounded-lg border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">{error}</div>}
    <div className="mt-7 grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className={`${panel} min-w-0 p-4`} aria-label="Course curriculum"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-[#e2eee4]">Course curriculum</h2><p className="mt-1 text-xs text-[#81978b]">{PYTHON_LESSONS.length} lessons · learn at your pace</p></div><GraduationCap className="h-5 w-5 text-[#b7db98]"/></div><button onClick={() => setListOpen(!listOpen)} aria-expanded={listOpen} aria-controls="python-curriculum" className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border border-[#34463e] bg-[#0d1718] px-3 py-2.5 text-left text-sm text-[#d7e6da] xl:hidden"><span className="min-w-0 truncate"><span className="text-[#81978b]">Lesson {index + 1}/{PYTHON_LESSONS.length} · </span>{selected.title}</span><span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#c9e9a8]">{listOpen ? "Hide" : "All lessons"}<ChevronDown className={`h-4 w-4 transition ${listOpen ? "rotate-180" : ""}`}/></span></button><div id="python-curriculum" className={listOpen ? "" : "hidden xl:block"}><label className="relative mt-4 block"><span className="sr-only">Search lessons</span><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#758e81]"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search lessons…" className="w-full rounded-lg border border-[#34463e] bg-[#0d1718] py-2.5 pl-9 pr-3 text-sm text-[#e2ede5] outline-none placeholder:text-[#71847e] focus:border-[#9dca7d]"/></label>
        <div className="mt-4 max-h-[60vh] xl:max-h-[700px] space-y-3 overflow-y-auto border-t border-[#29363c] pt-3">{filtered.map(group => {const original = PYTHON_COURSE.find(item => item.id === group.id)!; const count = original.lessons.filter(item => completed.includes(item.id)).length; return <div key={group.id}><div className="flex items-center justify-between gap-2 px-2 pb-1 pt-2"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8da99a]">{group.title}</p><span className="shrink-0 text-[11px] text-[#718a7d]">{count}/{original.lessons.length}</span></div><div className="space-y-0.5">{group.lessons.map(item => <button key={item.id} onClick={() => select(item.id)} aria-pressed={selected.id === item.id} className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13px] leading-5 transition ${selected.id === item.id ? "bg-[#28382d] text-[#dff5c9]" : "text-[#a9bab3] hover:bg-[#1b272c] hover:text-white"}`}>{completed.includes(item.id) ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#bde887]"/> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[#647d6f]"/>}<span>{item.title}</span></button>)}</div></div>})}{!filtered.length && <p className="px-2 py-4 text-sm text-[#91a69b]">No lessons match. Try another search.</p>}</div></div>
      </aside>
      <section ref={lessonRef} aria-label="Current lesson" className="min-w-0 space-y-5 scroll-mt-20 md:scroll-mt-6"><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8da199]"><span>{module.title} <span className="mx-1 text-[#526a5e]">/</span> Lesson {index + 1} of {PYTHON_LESSONS.length}</span><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5"/> Learn at your own pace</span></div>
        <section className={`${panel} p-6 sm:p-7`}><div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-md bg-[#293b2d] px-2.5 py-1.5 text-xs font-semibold text-[#c9eea5]"><BookOpen className="h-3.5 w-3.5"/>{module.title}</span>{done && <span className="inline-flex items-center gap-1 text-xs font-medium text-[#b8dc9e]"><CheckCircle2 className="h-3.5 w-3.5"/>Completed</span>}</div><h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] text-[#f1f7f2] sm:text-3xl">{selected.title}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-[#aabeb4]">{selected.summary}</p><div className="mt-6 border-t border-[#2b393c] pt-5"><h3 className="text-xs font-bold uppercase tracking-[0.11em] text-[#91ae98]">What to understand</h3><ul className="mt-4 space-y-4">{selected.concepts.map((concept,i)=><li key={i} className="flex gap-3 text-sm leading-7 text-[#bbc9c2]"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#bfe895]"/><span>{concept}</span></li>)}</ul></div>
          {dsaTopics.length > 0 && <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-[#2b393c] pt-4 text-xs"><span className="flex items-center gap-1 text-[#81958b]"><Network className="h-3.5 w-3.5"/> Use it in DSA:</span>{dsaTopics.map(topic => <Link key={topic} href={`/dsa?topic=${encodeURIComponent(topic)}`} className="text-[#c9e9a8] underline-offset-2 hover:text-white hover:underline">{topic}</Link>)}</p>}
        </section>
        <PythonLessonExample key={selected.id} lesson={selected}/>
        {selected.challenge && (loaded
          ? <PythonChallenge key={`challenge-${selected.id}`} lessonId={selected.id} challenge={selected.challenge} passedCode={exercises[selected.id]?.code} passedAt={exercises[selected.id]?.passedAt} onPassed={code => challengePassed(selected.id, code)}/>
          : <div className={`${panel} p-5 text-sm text-[#81958b]`}>Loading your challenge…</div>)}
        <section className="rounded-2xl border border-[#304334] bg-[#1a2820] p-5 sm:p-6"><p className="flex items-center gap-2 text-sm font-semibold text-[#d7eec7]"><Lightbulb className="h-4 w-4 text-[#c9f27b]"/>{selected.challenge ? "Explore further" : "Practice it"}</p><p className="mt-3 text-sm leading-6 text-[#bacbbd]">{selected.exercise}</p><button onClick={() => setHintOpen(!hintOpen)} aria-expanded={hintOpen} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#c9e9a8] hover:text-white">{hintOpen ? "Hide hint" : "Show hint"}<ChevronDown className={`h-3.5 w-3.5 transition ${hintOpen ? "rotate-180" : ""}`}/></button>{hintOpen && <p className="mt-3 rounded-lg border border-[#385241] bg-[#142019] p-3 text-sm leading-6 text-[#c0d1be]">{selected.hint}</p>}</section>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#29363c] bg-[#111b1d] p-4"><button onClick={() => select(PYTHON_LESSONS[index-1].id)} disabled={index===0} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#aabdb1] hover:bg-[#24342d] disabled:opacity-35"><ArrowLeft className="h-4 w-4"/>Previous</button><button onClick={toggleComplete} disabled={!loaded} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${done ? "border-[#597761] bg-[#25382b] text-[#c7eeb2] hover:bg-[#304834]" : "border-[#94b767] bg-[#c9f27b] text-[#172418] hover:bg-[#dcffa1]"}`}><Check className="h-4 w-4"/>{done ? "Completed · undo" : "Mark as complete"}</button><button onClick={() => select(PYTHON_LESSONS[index+1].id)} disabled={index===PYTHON_LESSONS.length-1} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#c0d5c2] hover:bg-[#24342d] disabled:opacity-35">Next<ArrowRight className="h-4 w-4"/></button></div>
        <p className="pb-2 text-xs leading-5 text-[#81958b]">Passing a lesson&apos;s challenge marks it complete; you can also mark lessons yourself. Progress is saved with the rest of your workspace. <a href={selected.source} target="_blank" rel="noreferrer" className="text-[#c9e9a8] underline decoration-[#698660] underline-offset-4">Read the official documentation ↗</a></p>
      </section>
    </div>
  </div>;
}
