"use client";

import React, { useMemo, useState } from "react";
import { CS_MODULES, FLASHCARDS, CSModule } from "@/data/cs_fundamentals";
import { SpacedRepetitionDeck } from "@/components/SpacedRepetitionDeck";
import { NEW_CARDS_PER_DAY } from "@/lib/flashcard-queue";
import {
  Brain,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Terminal,
} from "lucide-react";

const ALL = "ALL";

// Filter pills derived from the deck itself (first-appearance order), with card counts.
const CATEGORY_FILTERS: Array<{ name: string; count: number }> = [
  { name: ALL, count: FLASHCARDS.length },
  ...Array.from(
    FLASHCARDS.reduce((counts, card) => counts.set(card.category, (counts.get(card.category) ?? 0) + 1), new Map<string, number>()),
    ([name, count]) => ({ name, count }),
  ),
];

export default function CSFundamentalsPage() {
  const [activeTab, setActiveTab] = useState<"flashcards" | "deep-dive">("flashcards");
  const [selectedModule, setSelectedModule] = useState<CSModule>(CS_MODULES[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);

  // Stable per category so the deck only rebuilds its queue when the filter changes.
  const filteredCards = useMemo(
    () => (selectedCategory === ALL ? FLASHCARDS : FLASHCARDS.filter((c) => c.category === selectedCategory)),
    [selectedCategory],
  );

  return (
    <div className="px-4 py-6 sm:px-7 lg:px-10 lg:py-9 max-w-[1500px] mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#29363c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
              PILLAR 5 &amp; 6
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CS Fundamentals &amp; Language Internals
            </h1>
          </div>
          <p className="text-sm leading-6 text-[#93a5a8] mt-2">
            Python foundations &amp; internals, DSA pattern recognition, Go GMP scheduler, Rust zero-cost ownership, OS paging/mmap, and CUDA AI inference architecture with SM-2 Spaced Repetition flashcards (due reviews first, up to {NEW_CARDS_PER_DAY} new cards a day).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-[#29363c] rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab("flashcards")}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "flashcards"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            SM-2 Flashcard Deck
          </button>
          <button
            onClick={() => setActiveTab("deep-dive")}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "deep-dive"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Curriculum Deep Dive
          </button>
        </div>
      </div>

      {/* VIEW 1: SM-2 Spaced Repetition Deck */}
      {activeTab === "flashcards" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {CATEGORY_FILTERS.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setSelectedCategory(name)}
                className={`px-3 py-1.5 rounded-lg border font-mono whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === name
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-[#141e23] text-slate-400 border-[#29363c] hover:border-slate-700"
                }`}
              >
                {name}
                <span className={`ml-1.5 ${selectedCategory === name ? "text-emerald-100" : "text-slate-600"}`}>{count}</span>
              </button>
            ))}
          </div>

          {/* Keyed by category: switching filters starts a fresh session from the latest saved state. */}
          <SpacedRepetitionDeck key={selectedCategory} cards={filteredCards} />
        </div>
      )}

      {/* VIEW 2: Curriculum Deep Dive Modules */}
      {activeTab === "deep-dive" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-2">
            {CS_MODULES.map((mod) => {
              const isSelected = selectedModule.id === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-emerald-950/40 border-emerald-500 shadow-md"
                      : "bg-[#141e23] border-[#29363c] hover:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-mono text-emerald-400 uppercase">{mod.category}</div>
                  <div className="text-sm font-semibold text-slate-200 mt-1">{mod.title}</div>
                  <p className="text-sm leading-6 text-[#93a5a8] mt-2 line-clamp-2">{mod.summary}</p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#141e23] border border-[#29363c] space-y-6">
            <div>
              <span className="text-xs font-mono text-emerald-400">{selectedModule.category}</span>
              <h2 className="text-xl font-bold text-white mt-1">{selectedModule.title}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{selectedModule.summary}</p>
            </div>

            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Key Concepts Breakdown:
              </div>
              {selectedModule.keyConcepts.map((concept, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/70 border border-[#29363c] space-y-2 text-xs">
                  <div className="font-bold text-emerald-300 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    {concept.term}
                  </div>
                  <div className="text-slate-300 leading-relaxed">
                    {concept.definition}
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-200">
                    <strong>Interview Significance: </strong>
                    {concept.interviewSignificance}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
