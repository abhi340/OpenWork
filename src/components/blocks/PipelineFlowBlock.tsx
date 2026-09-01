"use client";

import React, { useState } from "react";
import { Plus, ArrowLeft, ArrowRight, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useWorkspaceStore, WorkBlock } from "@/store/workspaceStore";

interface PipelineCard {
  id: string;
  title: string;
  stage: string;
}

export function PipelineFlowBlock({ 
  block,
  onUpdate
}: { 
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardStage, setNewCardStage] = useState("");

  const stages: string[] = block.config?.stages || ["Backlog", "In Progress", "Review", "Done"];
  const cards: PipelineCard[] = block.items || [
    { id: "1", title: "API Authentication Middleware", stage: "In Progress" },
    { id: "2", title: "Landing Page Copy Polish", stage: "Done" }
  ];

  const moveCard = (id: string, direction: "next" | "prev", e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = cards.map((c) => {
      if (c.id !== id) return c;
      const currentIdx = stages.indexOf(c.stage);
      if (currentIdx === -1) return c;

      const newIdx = direction === "next" ? currentIdx + 1 : currentIdx - 1;
      if (newIdx < 0 || newIdx >= stages.length) return c;

      return { ...c, stage: stages[newIdx] };
    });

    updateBlock(block.id, { items: updated });
  };

  const addCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    const stage = newCardStage || stages[0];
    const newCard: PipelineCard = {
      id: crypto.randomUUID(),
      title: newCardTitle.trim(),
      stage
    };

    updateBlock(block.id, { items: [...cards, newCard] });
    setNewCardTitle("");
  };

  const removeCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = cards.filter((c) => c.id !== id);
    updateBlock(block.id, { items: updated });
  };

  return (
    <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Horizontal Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {stages.map((stage, stageIdx) => {
          const stageCards = cards.filter((c) => c.stage === stage);

          return (
            <div
              key={stage}
              className="bg-slate-50/70 dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between min-h-[130px]"
            >
              <div>
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200/60 dark:border-zinc-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  <span>{stage}</span>
                  <span className="font-mono text-[10px] bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.2 rounded text-slate-700 dark:text-zinc-300 font-semibold">
                    {stageCards.length}
                  </span>
                </div>

                {/* Cards in this stage */}
                <div className="space-y-1.5">
                  {stageCards.map((card) => (
                    <div
                      key={card.id}
                      className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs shadow-2xs group flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-slate-800 dark:text-zinc-200 text-xs leading-snug">
                          {card.title}
                        </span>
                        <button
                          onClick={(e) => removeCard(card.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>

                      {/* Move controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-zinc-800/60 text-[10px]">
                        <button
                          onClick={(e) => moveCard(card.id, "prev", e)}
                          disabled={stageIdx === 0}
                          className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-0 p-0.5"
                          title="Move stage left"
                        >
                          <ArrowLeft size={12} />
                        </button>
                        <button
                          onClick={(e) => moveCard(card.id, "next", e)}
                          disabled={stageIdx === stages.length - 1}
                          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 disabled:opacity-0 p-0.5"
                          title="Move stage right"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Add Form */}
      <form onSubmit={addCard} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          placeholder="New card title..."
          className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
        />

        <select
          value={newCardStage}
          onChange={(e) => setNewCardStage(e.target.value)}
          className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-zinc-300 outline-none cursor-pointer"
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={!newCardTitle.trim()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Add Card
        </button>
      </form>
    </div>
  );
}
