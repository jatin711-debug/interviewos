import type { DSAProblem } from "@/data/dsa";
import { problemProgress } from "@/data/dsa-curriculum";
import type { ProblemProgress } from "@/lib/storage";

const DAY_MS = 86_400_000;

/** The fields scheduling needs, so callers can pass slim problem records. */
export type ProblemRef = Pick<DSAProblem, "id" | "slug">;
export type ReviewItem<P extends ProblemRef = DSAProblem> = { problem: P; dueAt: number; entry: ProblemProgress };

/** When a solved problem should next be re-solved; unscheduled solves are due a day after solving. */
export function reviewDueAt(entry?: ProblemProgress): number | null {
  if (!entry?.solved) return null;
  const scheduled = entry.review?.nextReviewDate ? Date.parse(entry.review.nextReviewDate) : NaN;
  if (!Number.isNaN(scheduled)) return scheduled;
  const solvedAt = entry.solvedAt ? Date.parse(entry.solvedAt) : NaN;
  return Number.isNaN(solvedAt) ? 0 : solvedAt + DAY_MS;
}

/** Reviews count as due for the whole local day they fall on. */
export function endOfToday(now: number): number {
  const date = new Date(now);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/** Solved problems ordered by when they are next due. */
export function reviewSchedule<P extends ProblemRef>(problems: P[], progress: Record<string, ProblemProgress>): ReviewItem<P>[] {
  const items: ReviewItem<P>[] = [];
  for (const problem of problems) {
    const entry = problemProgress(problem, progress);
    const dueAt = reviewDueAt(entry);
    if (entry && dueAt !== null) items.push({ problem, dueAt, entry });
  }
  return items.sort((a, b) => a.dueAt - b.dueAt);
}

export function dueReviews<P extends ProblemRef>(problems: P[], progress: Record<string, ProblemProgress>, now: number): ReviewItem<P>[] {
  const cutoff = endOfToday(now);
  return reviewSchedule(problems, progress).filter(item => item.dueAt <= cutoff);
}

export function describeDue(dueAt: number, now: number): string {
  const days = Math.round((startOfDay(dueAt) - startOfDay(now)) / DAY_MS);
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}
