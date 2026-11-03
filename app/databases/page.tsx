"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { DB_TOPICS, DB_DECISION_MATRIX, DBTopic } from "@/data/databases";
import { MermaidViewer } from "@/components/MermaidViewer";
import {
  Database,
  Layers,
  Sparkles,
  HelpCircle,
  CheckCircle,
  XCircle,
  Table,
  HardDrive,
  GitCompare,
  Code2,
} from "lucide-react";

// Loaded only when the SQL practice tab opens: it brings the challenge data and the editor.
const SqlPractice = dynamic(() => import("@/components/sql/SqlPractice").then(module => module.SqlPractice), {
  loading: () => <div className="rounded-2xl border border-[#29363c] bg-[#141e23] p-6 text-sm text-[#81958b]">Loading SQL practice…</div>,
});

type Tab = "topics" | "matrix" | "sql";
const TABS: Tab[] = ["topics", "matrix", "sql"];

export default function DatabaseInternalsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("topics");
  const [selectedTopic, setSelectedTopic] = useState<DBTopic>(DB_TOPICS[0]);

  // ?tab=sql opens SQL practice directly (SqlPractice reads ?sql=<id> for the problem).
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (tab && TABS.includes(tab)) setActiveTab(tab);
  }, []);

  function openTab(tab: Tab) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "topics") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    if (tab !== "sql") url.searchParams.delete("sql");
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="px-4 py-6 sm:px-7 lg:px-10 lg:py-9 max-w-[1500px] mx-auto space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#29363c]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-mono text-xs font-semibold">
              PILLAR 4
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Database Internals Lab</h1>
          </div>
          <p className="text-sm leading-6 text-[#93a5a8] mt-2">
            ACID isolation anomalies, B-Tree vs LSM-Tree storage engines (PostgreSQL vs PebbleDB), WAL &amp; Group Commit, Raft Consensus, and SQL vs NoSQL decision matrix, plus graded SQL practice for interview-style queries.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900/90 border border-[#29363c] rounded-xl text-xs font-medium">
          <button
            onClick={() => openTab("topics")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "topics" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Core Storage Internals
          </button>
          <button
            onClick={() => openTab("matrix")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "matrix" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            SQL vs NoSQL Matrix
          </button>
          <button
            onClick={() => openTab("sql")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "sql" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            SQL Practice
          </button>
        </div>
      </div>

      {/* VIEW 1: Core Storage Topics */}
      {activeTab === "topics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Topic selector */}
          <div className="lg:col-span-4 space-y-2">
            {DB_TOPICS.map((topic) => {
              const isSelected = selectedTopic.id === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={`w-full text-left p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-teal-950/40 border-teal-500 shadow-md"
                      : "bg-[#141e23] border-[#29363c] hover:border-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-mono text-teal-400 uppercase">{topic.category}</div>
                  <div className="text-sm font-semibold text-slate-200 mt-1">{topic.title}</div>
                  <p className="text-sm leading-6 text-[#93a5a8] mt-2 line-clamp-2">{topic.summary}</p>
                </button>
              );
            })}
          </div>

          {/* Deep dive content */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-[#141e23] border border-[#29363c] space-y-6">
            <div>
              <span className="text-xs font-mono text-teal-400">{selectedTopic.category}</span>
              <h2 className="text-xl font-bold text-white mt-1">{selectedTopic.title}</h2>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">{selectedTopic.summary}</p>
            </div>

            {/* Deep dive bullet breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                System Deep Dive:
              </div>
              <ul className="space-y-2 text-xs text-slate-300 leading-relaxed pl-4 list-disc">
                {selectedTopic.deepDive.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            {/* Trade-Off Table if present */}
            {selectedTopic.tradeOffTable && selectedTopic.tradeOffTable.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <GitCompare className="w-3.5 h-3.5" />
                  Engineering Trade-Off Table:
                </div>
                <div className="border border-[#29363c] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 border-b border-[#29363c] text-slate-400 font-mono">
                      <tr>
                        <th className="p-3">Evaluation Dimension</th>
                        <th className="p-3">Approach A</th>
                        <th className="p-3">Approach B</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                      {selectedTopic.tradeOffTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="p-3 font-semibold text-slate-300 font-mono text-xs">
                            {row.dimension}
                          </td>
                          <td className="p-3 text-emerald-300/90">{row.optionA}</td>
                          <td className="p-3 text-amber-300/90">{row.optionB}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mermaid diagram */}
            {selectedTopic.mermaidDiagram && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Internal Architectural Flow:
                </div>
                <MermaidViewer chart={selectedTopic.mermaidDiagram} />
              </div>
            )}

            {/* Interview Q&A Section */}
            <div className="space-y-3 pt-3 border-t border-[#29363c]">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-400" />
                Staff-Level Interview Defense Drill:
              </div>
              {selectedTopic.interviewQuestions.map((iq, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-[#29363c] space-y-2 text-xs">
                  <div className="font-semibold text-teal-300">
                    Q: {iq.question}
                  </div>
                  <div className="text-slate-300 leading-relaxed pl-3 border-l-2 border-teal-500/60">
                    {iq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Graded SQL practice */}
      {activeTab === "sql" && <SqlPractice />}

      {/* VIEW 2: SQL vs NoSQL Decision Matrix */}
      {activeTab === "matrix" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-[#29363c] text-xs text-slate-300 leading-relaxed">
            <strong className="text-teal-400">Interviewer Rubric: </strong>
            During system design rounds, never say &quot;I prefer SQL&quot; or &quot;NoSQL is faster&quot;. Justify your choice through access patterns, read vs. write ratios, ACID isolation requirements, and scaling topologies.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DB_DECISION_MATRIX.map((item, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-[#141e23] border border-[#29363c] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono text-xs font-bold">
                    {item.recommendedDB}
                  </span>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Target Workload:</div>
                  <div className="text-xs font-semibold text-white mt-0.5">{item.useCase}</div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-[#29363c]/80 space-y-1">
                  <div className="font-semibold text-emerald-400">Architectural Rationale:</div>
                  <div>{item.rationale}</div>
                </div>

                <div className="text-xs text-rose-300 bg-rose-950/20 p-2.5 rounded border border-rose-900/30 space-y-1">
                  <div className="font-semibold text-rose-400">Avoid When:</div>
                  <div>{item.avoidWhen}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
