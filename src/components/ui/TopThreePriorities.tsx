"use client";

import React, { useState, useEffect } from "react";
import { Target, CheckCircle2, Circle, Plus, Edit2, Lock } from "lucide-react";

interface PriorityItem {
  id: string;
  text: string;
  completed: boolean;
}

export function TopThreePriorities() {
  const [priorities, setPriorities] = useState<PriorityItem[]>([
    { id: "1", text: "Close key customer / executive partnership", completed: false },
    { id: "2", text: "Review and unblock team PRs & milestones", completed: false },
    { id: "3", text: "Ship core feature release & verify metrics", completed: false }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("openwork_top_priorities");
    if (saved) {
      try {
        setPriorities(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const savePriorities = (updated: PriorityItem[]) => {
    setPriorities(updated);
    localStorage.setItem("openwork_top_priorities", JSON.stringify(updated));
  };

  const toggleComplete = (id: string) => {
    const updated = priorities.map((p) =>
      p.id === id ? { ...p, completed: !p.completed } : p
    );
    savePriorities(updated);
  };

  const updateText = (id: string, text: string) => {
    const updated = priorities.map((p) =>
      p.id === id ? { ...p, text: text.trim() || p.text } : p
    );
    savePriorities(updated);
    setEditingId(null);
  };

  const completedCount = priorities.filter((p) => p.completed).length;

  return (
    <div className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 shadow-2xs">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <Target size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <span>Daily Top 3 Strategic Outcomes</span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">
                (CEO & High-Leverage Focus)
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-zinc-400">
            {completedCount}/3 Done
          </span>
          <div className="w-16 bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {priorities.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => toggleComplete(item.id)}
            className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center gap-2.5 ${
              item.completed
                ? "bg-slate-100/80 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 line-through"
                : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 text-slate-800 dark:text-zinc-200 shadow-2xs"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleComplete(item.id);
              }}
              className="text-amber-500 hover:text-amber-600 flex-shrink-0"
            >
              {item.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </button>

            {editingId === item.id ? (
              <input
                type="text"
                autoFocus
                defaultValue={item.text}
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => updateText(item.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateText(item.id, (e.target as HTMLInputElement).value);
                }}
                className="flex-1 bg-slate-50 dark:bg-zinc-950 border border-blue-500 rounded px-1.5 py-0.5 text-xs text-slate-900 dark:text-zinc-100 outline-none"
              />
            ) : (
              <div
                className="flex-1 text-xs font-medium truncate flex items-center justify-between group"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(item.id);
                }}
                title="Click to edit priority"
              >
                <span className="truncate">{idx + 1}. {item.text}</span>
                <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity ml-1 flex-shrink-0" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
