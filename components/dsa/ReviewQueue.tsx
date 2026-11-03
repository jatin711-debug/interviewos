"use client";

import { CalendarClock, CheckCircle2, RotateCcw } from "lucide-react";
import type { DSAProblem } from "@/data/dsa";
import { describeDue, endOfToday, type ReviewItem } from "@/lib/dsa-review";

const RATING_LABEL: Record<number, string> = { 0: "Again", 1: "Again", 2: "Again", 3: "Hard", 4: "Good", 5: "Easy" };
const difficultyColor: Record<string, string> = { Easy: "text-emerald-400", Medium: "text-amber-400", Hard: "text-rose-400" };
const UPCOMING_SHOWN = 8;

export function ReviewQueue({ schedule, now, onStart }: { schedule: ReviewItem[]; now: number; onStart: (problem: DSAProblem) => void }) {
  const cutoff = endOfToday(now);
  const due = schedule.filter(item => item.dueAt <= cutoff);
  const upcoming = schedule.filter(item => item.dueAt > cutoff).slice(0, UPCOMING_SHOWN);
  return <section className="space-y-5" aria-label="Review queue">
    <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3"><div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-300"><RotateCcw className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-white">Re-solve from scratch</h2><p className="mt-1 max-w-2xl text-sm text-slate-400">Solved problems come back on a spaced schedule. Each review starts from the starter code with the solution hidden; your rating after passing sets the next interval.</p></div></div>
        {due.length > 0 && <button onClick={() => onStart(due[0].problem)} className="inline-flex items-center gap-2 rounded-lg bg-[#c9f27b] px-4 py-2.5 text-sm font-semibold text-[#172418] transition hover:bg-[#dcffa1]">Start next review</button>}
      </div>
    </div>
    <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5">
      <h3 className="text-sm font-semibold text-white">Due now <span className="ml-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{due.length}</span></h3>
      {due.length ? <ul className="mt-3 divide-y divide-slate-800">{due.map(item => <ReviewRow key={item.problem.id} item={item} now={now} onStart={onStart} />)}</ul>
        : <p className="mt-3 flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{schedule.length ? "You’re all caught up for today." : "Nothing to review yet. Solve a problem and rate how it felt; it will come back here."}</p>}
    </div>
    {upcoming.length > 0 && <div className="rounded-xl border border-slate-800 bg-[#0b111d] p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><CalendarClock className="h-4 w-4 text-slate-400" /> Coming up</h3>
      <ul className="mt-3 divide-y divide-slate-800">{upcoming.map(item => <ReviewRow key={item.problem.id} item={item} now={now} onStart={onStart} early />)}</ul>
    </div>}
  </section>;
}

function ReviewRow({ item, now, onStart, early = false }: { item: ReviewItem; now: number; onStart: (problem: DSAProblem) => void; early?: boolean }) {
  const history = item.entry.review?.history ?? [];
  const last = history[history.length - 1];
  return <li className="flex flex-wrap items-center gap-3 py-3">
    <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{item.problem.title}</p><p className="mt-0.5 text-xs text-slate-500">{item.problem.category} · <span className={difficultyColor[item.problem.difficulty]}>{item.problem.difficulty}</span>{last !== undefined && <> · last rated {RATING_LABEL[last]}</>}</p></div>
    <span className={`text-xs ${item.dueAt < now && !early ? "text-amber-300" : "text-slate-400"}`}>{describeDue(item.dueAt, now)}</span>
    <button onClick={() => onStart(item.problem)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${early ? "border border-slate-700 text-slate-300 hover:border-slate-500" : "bg-blue-600 text-white hover:bg-blue-500"}`}>{early ? "Review early" : "Re-solve"}</button>
  </li>;
}
