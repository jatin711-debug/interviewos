"use client";

import React, { useState, useEffect } from "react";
import { StarStory } from "@/lib/storage";
import {
  Plus,
  Trash2,
} from "lucide-react";
import { apiFetch } from "@/lib/local-api";

export default function InterviewPrepPage() {
  const [starStories, setStarStories] = useState<StarStory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStory, setEditingStory] = useState<Partial<StarStory>>({
    title: "",
    category: "Architecture",
    company: "",
    situation: "",
    task: "",
    action: "",
    result: "",
    metrics: "",
    tags: [],
  });

  useEffect(() => {
    fetchStarStories();
  }, []);

  const fetchStarStories = () => {
    apiFetch("/api/star")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setStarStories(data);
      })
      .catch(console.error);
  };

  const handleSaveStory = async () => {
    if (!editingStory.title || !editingStory.situation || !editingStory.action) {
      alert("Please fill in Title, Situation, and Action.");
      return;
    }

    try {
      await apiFetch("/api/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingStory),
      });
      setIsEditing(false);
      setEditingStory({
        title: "",
        category: "Architecture",
        company: "",
        situation: "",
        task: "",
        action: "",
        result: "",
        metrics: "",
        tags: [],
      });
      fetchStarStories();
    } catch (err) {
      console.error("Failed to save story", err);
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this STAR story?")) return;
    try {
      await apiFetch(`/api/star?id=${id}`, { method: "DELETE" });
      fetchStarStories();
    } catch (err) {
      console.error("Failed to delete story", err);
    }
  };

  return (
    <div className="px-4 py-6 sm:px-7 lg:px-10 lg:py-9 max-w-[1500px] mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="pb-6 border-b border-[#29363c]">
        <h1 className="text-2xl font-bold text-white tracking-tight">Interview prep: your STAR story vault</h1>
        <p className="text-sm leading-6 text-[#93a5a8] mt-2">
          Write down your best behavioral stories once, in Situation, Task, Action, Result form, and rehearse them before interviews.
          Stories are saved on this machine only.
        </p>
      </div>

      {/* VIEW 2: Behavioral STAR Vault */}
      {(
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#29363c]">
            <div>
              <h2 className="text-lg font-bold text-white">Your Behavioral STAR Stories</h2>
              <p className="text-xs text-slate-400">
                Structure your leadership and technical answers using the Situation, Task, Action, Result framework.
              </p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isEditing ? "Cancel" : "Add STAR Story"}
            </button>
          </div>

          {/* New Story Form */}
          {isEditing && (
            <div className="p-6 rounded-2xl bg-[#141e23] border border-amber-500/40 space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-white">Create New STAR Story</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Story Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Cutting API latency by 40%"
                    value={editingStory.title}
                    onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                    className="w-full bg-slate-900 border border-[#29363c] rounded-lg p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Company / Project</label>
                  <input
                    type="text"
                    placeholder="e.g. Acme Corp, or a side project"
                    value={editingStory.company}
                    onChange={(e) => setEditingStory({ ...editingStory, company: e.target.value })}
                    className="w-full bg-slate-900 border border-[#29363c] rounded-lg p-2.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={editingStory.category}
                    onChange={(e) =>
                      setEditingStory({
                        ...editingStory,
                        category: e.target.value as StarStory["category"],
                      })
                    }
                    className="w-full bg-slate-900 border border-[#29363c] rounded-lg p-2.5 text-slate-200"
                  >
                    <option value="Architecture">Architecture Decision</option>
                    <option value="Outage">Production Outage</option>
                    <option value="Conflict">Conflict Resolution</option>
                    <option value="Tight Deadline">Tight Deadline</option>
                    <option value="Trade-off">Technical Trade-off</option>
                    <option value="Leadership">Engineering Leadership</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-amber-400">
                    [S] Situation (Context, challenge, stakes)
                  </label>
                  <textarea
                    rows={2}
                    value={editingStory.situation}
                    onChange={(e) => setEditingStory({ ...editingStory, situation: e.target.value })}
                    placeholder="What was the business context, company scale, and the core challenge?"
                    className="w-full bg-slate-900 border border-[#29363c] rounded-lg p-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-amber-400">
                    [T] Task (What was YOUR explicit responsibility?)
                  </label>
                  <textarea
                    rows={2}
                    value={editingStory.task}
                    onChange={(e) => setEditingStory({ ...editingStory, task: e.target.value })}
                    placeholder="What goal or deliverable were you personally accountable for?"
                    className="w-full bg-slate-900 border border-[#29363c] rounded-lg p-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-amber-400">
                    [A] Action (Specific engineering steps YOU took)
                  </label>
                  <textarea
                    rows={3}
                    value={editingStory.action}
                    onChange={(e) => setEditingStory({ ...editingStory, action: e.target.value })}
                    placeholder="Walk through technical choices, tools used, trade-offs navigated, and team coordination."
                    className="w-full bg-slate-900 border border-[#29363c] rounded-lg p-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold text-amber-400">
                    [R] Result &amp; Quantitative Impact (Metrics, latency, dollars saved)
                  </label>
                  <textarea
                    rows={2}
                    value={editingStory.result}
                    onChange={(e) => setEditingStory({ ...editingStory, result: e.target.value })}
                    placeholder="Quantified outcome (e.g. 84% compression, 0 data loss, $35K saved)."
                    className="w-full bg-slate-900 border border-[#29363c] rounded-lg p-2.5 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStory}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Save to Vault
                </button>
              </div>
            </div>
          )}

          {/* Stories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {starStories.map((story) => (
              <div
                key={story.id}
                className="p-5 rounded-2xl bg-[#141e23] border border-[#29363c] space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                      {story.company} • {story.category}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{story.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    className="text-slate-500 hover:text-rose-400 transition cursor-pointer p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-[#29363c]">
                    <strong className="text-amber-400">Situation: </strong>
                    <span className="text-slate-300">{story.situation}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-[#29363c]">
                    <strong className="text-amber-400">Action: </strong>
                    <span className="text-slate-300">{story.action}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/40">
                    <strong className="text-emerald-400">Result: </strong>
                    <span className="text-emerald-100">{story.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
