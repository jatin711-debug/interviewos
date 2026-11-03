"use client";

import React, { useEffect, useState } from "react";
import type { Flashcard } from "@/data/cs_fundamentals";
import type { FlashcardSM2, UserState } from "@/lib/storage";
import { buildFlashcardQueue, NEW_CARDS_PER_DAY, type FlashcardQueue } from "@/lib/flashcard-queue";
import { Brain, RotateCw, Check, Sparkles, ChevronLeft, ChevronRight, CalendarCheck, Hourglass } from "lucide-react";
import { apiFetch } from "@/lib/local-api";

interface SpacedRepetitionDeckProps {
  /** Cards in the current filter; the deck studies today's queue drawn from them. */
  cards: Flashcard[];
}

const RATINGS = [
  { score: 0, label: "Blackout", desc: "Repeat today", color: "hover:bg-red-900/40 border-red-800/40 text-red-300" },
  { score: 1, label: "Wrong", desc: "1 day", color: "hover:bg-orange-900/40 border-orange-800/40 text-orange-300" },
  { score: 2, label: "Hard", desc: "1 day", color: "hover:bg-amber-900/40 border-amber-800/40 text-amber-300" },
  { score: 3, label: "Good", desc: "3-6 days", color: "hover:bg-blue-900/40 border-blue-800/40 text-blue-300" },
  { score: 4, label: "Easy", desc: "1-2 weeks", color: "hover:bg-emerald-900/40 border-emerald-800/40 text-emerald-300" },
  { score: 5, label: "Perfect", desc: "3+ weeks", color: "hover:bg-teal-900/40 border-teal-800/40 text-teal-200" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function SpacedRepetitionDeck({ cards }: SpacedRepetitionDeckProps) {
  // The queue is a snapshot taken when the deck loads (or the card set changes), so
  // rating a card doesn't reshuffle the session. Remount the deck to rebuild it.
  const [queue, setQueue] = useState<FlashcardQueue | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [ratedCards, setRatedCards] = useState<Record<string, number>>({});
  const [loadingRating, setLoadingRating] = useState(false);
  const [ratingFailed, setRatingFailed] = useState(false);
  const [earliestScheduled, setEarliestScheduled] = useState<string | null>(null); // from this session's ratings

  useEffect(() => {
    let cancelled = false;
    const start = (flashcards: Record<string, FlashcardSM2>) => {
      if (cancelled) return;
      setQueue(buildFlashcardQueue(cards, flashcards, Date.now()));
      setCurrentIndex(0);
      setIsFlipped(false);
      setRatedCards({});
      setEarliestScheduled(null);
    };
    apiFetch("/api/state", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load review state");
        return response.json() as Promise<UserState>;
      })
      .then((state) => start(state.flashcards ?? {}))
      .catch(() => {
        if (cancelled) return;
        setLoadFailed(true);
        start({}); // still usable: treat every card as unseen
      });
    return () => {
      cancelled = true;
    };
  }, [cards]);

  if (!queue) {
    return (
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto text-sm text-slate-400 flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
        Building today&apos;s review queue…
      </div>
    );
  }

  const sessionCards = queue.cards;
  const card: Flashcard | undefined = sessionCards[currentIndex];
  const dueIds = new Set(queue.due.map((c) => c.id));
  const dueLeft = queue.due.filter((c) => ratedCards[c.id] === undefined).length;
  const newLeft = queue.fresh.filter((c) => ratedCards[c.id] === undefined).length;
  const newRatedThisSession = queue.fresh.length - newLeft;
  const introducedToday = queue.introducedToday + newRatedThisSession;
  const ratedCount = sessionCards.length - dueLeft - newLeft;
  const heldBack = Math.max(0, queue.newAvailable - queue.fresh.length);
  const sessionDone = sessionCards.length > 0 && ratedCount === sessionCards.length;
  const nextReviewAt = [queue.nextReviewAt, earliestScheduled]
    .filter((d): d is string => !!d)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  const handleRating = async (quality: number) => {
    if (!card || loadingRating || ratedCards[card.id] !== undefined) return;
    setLoadingRating(true);
    setRatingFailed(false);

    try {
      const response = await apiFetch("/api/flashcards/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, quality }),
      });
      if (!response.ok) throw new Error(`Review request failed (${response.status})`);
      const result = (await response.json().catch(() => null)) as { card?: FlashcardSM2 } | null;
      const scheduled = result?.card?.nextReviewDate;
      if (scheduled) setEarliestScheduled((prev) => (prev && prev < scheduled ? prev : scheduled));

      const nextRated = { ...ratedCards, [card.id]: quality };
      setRatedCards(nextRated);

      // Move to the next unrated card after a brief transition.
      setTimeout(() => {
        setIsFlipped(false);
        const after = sessionCards.findIndex((c, i) => i > currentIndex && nextRated[c.id] === undefined);
        const anyUnrated = sessionCards.findIndex((c) => nextRated[c.id] === undefined);
        const target = after !== -1 ? after : anyUnrated;
        if (target !== -1) setCurrentIndex(target);
        setLoadingRating(false);
      }, 300);
    } catch (err) {
      console.error("Failed to rate card", err);
      setRatingFailed(true);
      setLoadingRating(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < sessionCards.length - 1) setCurrentIndex((prev) => prev + 1);
  };

  const prevCard = () => {
    setIsFlipped(false);
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800 text-xs text-slate-400">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="font-semibold text-slate-200">SM-2 Spaced Repetition Engine</span>
        {card && !sessionDone && (
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 font-mono text-[10px]">
            {card.category}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span className="px-2 py-0.5 rounded-full bg-blue-950/40 border border-blue-900/50 text-blue-300">
          {dueLeft} due
        </span>
        <span className="px-2 py-0.5 rounded-full bg-amber-950/30 border border-amber-900/40 text-amber-300">
          {newLeft} new
        </span>
        <span title="New cards introduced today, across all categories" className="text-slate-500">
          new today {Math.min(introducedToday, NEW_CARDS_PER_DAY)}/{NEW_CARDS_PER_DAY}
        </span>
      </div>
    </div>
  );

  const loadWarning = loadFailed && (
    <p role="alert" className="mt-4 rounded-lg border border-amber-800/60 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
      Couldn&apos;t load your saved review schedule, so every card is shown as new. Refresh to try again.
    </p>
  );

  // Nothing to study (or everything in this session has been rated).
  if (!card || sessionDone) {
    // heldBack > 0 only happens when the daily allowance (not the deck) limited new cards.
    const allIntroduced = heldBack === 0 && newLeft === 0;
    return (
      <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto">
        {header}
        {loadWarning}
        <div className="min-h-[220px] my-6 p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center gap-3 shadow-inner">
          <CalendarCheck className="w-8 h-8 text-emerald-400" />
          <div className="text-base font-semibold text-slate-100">
            {sessionDone ? "Session complete — nice work." : "All caught up for today."}
          </div>
          <div className="text-xs text-slate-400 leading-relaxed max-w-md space-y-1">
            {sessionDone && <p>You rated {ratedCount} card{ratedCount === 1 ? "" : "s"} in this session.</p>}
            {heldBack > 0 && (
              <p className="flex items-center justify-center gap-1">
                <Hourglass className="w-3 h-3 text-amber-300" />
                Daily limit of {NEW_CARDS_PER_DAY} new cards reached. {heldBack} new card{heldBack === 1 ? " is" : "s are"} waiting — up to {NEW_CARDS_PER_DAY} more unlock tomorrow.
              </p>
            )}
            {allIntroduced && <p>Every card in this deck has been introduced.</p>}
            {nextReviewAt && <p>Next scheduled review: {formatDate(nextReviewAt)}.</p>}
          </div>
        </div>
      </div>
    );
  }

  const isNew = !dueIds.has(card.id);
  const rated = ratedCards[card.id];

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto">
      {header}
      {loadWarning}

      {/* Flashcard Body */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="min-h-[260px] my-6 p-6 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex flex-col justify-between shadow-inner relative group"
      >
        <div className="flex justify-between items-start text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-wider text-[11px]">
              {isFlipped ? "Answer & System Breakdown" : "Question / Interview Prompt"}
            </span>
            {isNew ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-900/50 text-amber-300 font-mono text-[10px]">
                <Sparkles className="w-3 h-3" />
                NEW
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-900/50 text-blue-300 font-mono text-[10px]">
                REVIEW
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-blue-400">
            <RotateCw className="w-3 h-3" />
            Click card to flip
          </span>
        </div>

        <div className="py-4">
          {!isFlipped ? (
            <div className="text-base font-medium text-slate-100 leading-relaxed">
              {card.question}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-emerald-300 font-medium whitespace-pre-line leading-relaxed">
                {card.answer}
              </div>
              {card.codeSnippet && (
                <pre
                  onClick={(e) => e.stopPropagation()}
                  className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed overflow-x-auto cursor-text"
                >
                  <code>{card.codeSnippet}</code>
                </pre>
              )}
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300">Staff-Level Note: </span>
                {card.explanation}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
          <span>Difficulty: <strong className="text-slate-400">{card.difficulty}</strong></span>
          {rated !== undefined && (
            <span className="flex items-center gap-1 text-emerald-400 font-mono">
              <Check className="w-3 h-3" />
              Reviewed today (Grade: {rated}/5)
            </span>
          )}
        </div>
      </div>

      {/* SM-2 Rating Controls (Shown when card is flipped and not yet rated this session) */}
      {isFlipped && rated === undefined && (
        <div className="space-y-2 pt-2 animate-fadeIn">
          <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
            Rate Your Recall (SuperMemo SM-2 Interval Calculation):
          </div>
          <div className="grid grid-cols-6 gap-2">
            {RATINGS.map((btn) => (
              <button
                key={btn.score}
                onClick={() => handleRating(btn.score)}
                disabled={loadingRating}
                className={`p-2 rounded-lg border bg-slate-900 text-center transition flex flex-col items-center justify-center cursor-pointer ${btn.color}`}
              >
                <span className="font-bold text-xs">{btn.score}</span>
                <span className="text-[10px] font-medium leading-tight">{btn.label}</span>
                <span className="text-[9px] opacity-70 mt-0.5">{btn.desc}</span>
              </button>
            ))}
          </div>
          {ratingFailed && (
            <p role="alert" className="text-[11px] text-center text-red-300">
              Couldn&apos;t save that rating. Try again.
            </p>
          )}
        </div>
      )}

      {/* Prev / Next Pagination Controls */}
      <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-800 text-xs">
        <button
          onClick={prevCard}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {sessionCards.length <= 30 ? (
          <div className="flex flex-wrap justify-center items-center gap-1.5">
            {sessionCards.map((c, i) => (
              <span
                key={c.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "bg-blue-400 w-4"
                    : ratedCards[c.id] !== undefined
                    ? "bg-emerald-500"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(ratedCount / sessionCards.length) * 100}%` }}
              />
            </div>
            <span>
              {currentIndex + 1}/{sessionCards.length}
            </span>
          </div>
        )}

        <button
          onClick={nextCard}
          disabled={currentIndex === sessionCards.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
