import type { Flashcard } from "@/data/cs_fundamentals";
import type { FlashcardSM2 } from "@/lib/storage";

// Daily study queue for the SM-2 flashcard deck.
// - Due reviews are always included (most overdue first).
// - Unseen cards are rationed: at most NEW_CARDS_PER_DAY may be introduced per
//   local calendar day, counted globally across every category.
// - "Introduced today" = a card whose FIRST review happened today (local time).
//   The review API stores only `lastReviewedAt` plus a `history` of grades, so a
//   card counts when it was last reviewed today and has exactly one grade.
// - Due-ness is day-granular: anything scheduled up to the end of the current
//   local day is due (SM-2 intervals are whole days; a card rated today is
//   always scheduled for tomorrow or later, so it never reappears the same day).

export const NEW_CARDS_PER_DAY = 20;

/** The fields the queue needs, so callers can pass slim card records. */
export type CardRef = Pick<Flashcard, "id" | "category">;

export interface FlashcardQueue<C extends CardRef = Flashcard> {
  /** Due reviews followed by today's new cards; the order to study in. */
  cards: C[];
  /** Previously reviewed cards scheduled on or before today, most overdue first. */
  due: C[];
  /** Unseen cards admitted today (bounded by the remaining daily allowance). */
  fresh: C[];
  /** Cards (all categories) whose first review happened today. */
  introducedToday: number;
  /** New cards that may still be introduced today, across all categories. */
  newAllowance: number;
  /** Unseen cards in the given card set (including ones held back by the limit). */
  newAvailable: number;
  /** Earliest future review among the given cards, if any (ISO string). */
  nextReviewAt: string | null;
}

/** Local calendar day key (YYYY-MM-DD) for a timestamp. */
export function localDayKey(time: number | string | Date): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function endOfLocalDay(now: number): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** True when the card has been graded at least once. */
export function hasBeenReviewed(s: FlashcardSM2 | undefined): s is FlashcardSM2 {
  return !!s && (!!s.lastReviewedAt || (s.history?.length ?? 0) > 0 || s.repetitions > 0);
}

/** True when the card's first-ever review happened on the local day of `now`. */
export function wasIntroducedToday(s: FlashcardSM2 | undefined, now: number): boolean {
  if (!s?.lastReviewedAt) return false;
  if (localDayKey(s.lastReviewedAt) !== localDayKey(now)) return false;
  // Missing history (legacy entries) is treated as a single review.
  return (s.history?.length ?? 1) === 1;
}

/** Number of cards (in any category) introduced today. */
export function countIntroducedToday(state: Record<string, FlashcardSM2>, now: number): number {
  let count = 0;
  for (const s of Object.values(state ?? {})) if (wasIntroducedToday(s, now)) count += 1;
  return count;
}

function reviewTime(s: FlashcardSM2): number {
  const t = new Date(s.nextReviewDate).getTime();
  return Number.isNaN(t) ? -Infinity : t; // unparseable dates are treated as due
}

// Round-robin across categories (keeping each category's own order) so the
// "ALL" view mixes topics instead of introducing one category at a time.
function interleaveByCategory<C extends CardRef>(cards: C[]): C[] {
  const groups = new Map<string, C[]>();
  for (const card of cards) {
    const group = groups.get(card.category);
    if (group) group.push(card);
    else groups.set(card.category, [card]);
  }
  const lists = Array.from(groups.values());
  const result: C[] = [];
  for (let round = 0; result.length < cards.length; round += 1) {
    for (const list of lists) if (round < list.length) result.push(list[round]);
  }
  return result;
}

export function buildFlashcardQueue<C extends CardRef>(
  cards: C[],
  state: Record<string, FlashcardSM2>,
  now: number,
  newCardsPerDay: number = NEW_CARDS_PER_DAY,
): FlashcardQueue<C> {
  state = state ?? {}; // tolerate a saved state without a flashcards map
  const dayEnd = endOfLocalDay(now);
  const due: Array<{ card: C; at: number }> = [];
  const unseen: C[] = [];
  let nextReview = Infinity;

  for (const card of cards) {
    const s = state[card.id];
    if (!hasBeenReviewed(s)) {
      unseen.push(card);
      continue;
    }
    const at = reviewTime(s);
    if (at <= dayEnd) due.push({ card, at });
    else if (at < nextReview) nextReview = at;
  }

  due.sort((a, b) => a.at - b.at); // stable: ties keep deck order
  const introducedToday = countIntroducedToday(state, now);
  const newAllowance = Math.max(0, newCardsPerDay - introducedToday);
  const fresh = interleaveByCategory(unseen).slice(0, newAllowance);
  const dueCards = due.map((d) => d.card);

  return {
    cards: [...dueCards, ...fresh],
    due: dueCards,
    fresh,
    introducedToday,
    newAllowance,
    newAvailable: unseen.length,
    nextReviewAt: Number.isFinite(nextReview) ? new Date(nextReview).toISOString() : null,
  };
}

/** Cards to study today: due reviews plus the remaining new-card allowance. */
export function countDueCards(cards: CardRef[], state: Record<string, FlashcardSM2>, now: number): number {
  const queue = buildFlashcardQueue(cards, state, now);
  return queue.due.length + queue.fresh.length;
}
