"use client";

import React, { useState } from "react";
import { Plus, Minus, Check, Target, Trash2, AlertCircle } from "lucide-react";
import { useWorkspaceStore, WorkBlock } from "@/store/workspaceStore";

import { playGoalChime } from "@/lib/sound";

export function CounterBlock({ 
  block,
  onUpdate
}: { 
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;
  const [newSubtask, setNewSubtask] = useState("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isBlocker, setIsBlocker] = useState(false);

  const count = block.config?.count || 0;
  const target = block.config?.target || 5;
  const subitems: string[] = block.items || [];

  const updateCount = (newCount: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const clamped = Math.max(0, newCount);
    if (clamped >= target && count < target) {
      playGoalChime();
    }
    updateBlock(block.id, { 
      config: { ...block.config, count: clamped, target } 
    });
  };

  const setTargetValue = (newTarget: number) => {
    updateBlock(block.id, {
      config: { ...block.config, count, target: Math.max(1, newTarget) }
    });
    setIsEditingTarget(false);
  };

  const addSubitem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;

    let itemText = newSubtask.trim();
    if (isBlocker && !itemText.toLowerCase().includes("#blocker")) {
      itemText = `[#BLOCKER] ${itemText}`;
    }

    const updated = [...subitems, itemText];
    updateBlock(block.id, { 
      items: updated,
      config: { ...block.config, count: count + 1, target }
    });
    setNewSubtask("");
    setIsBlocker(false);
  };

  const removeSubitem = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = subitems.filter((_, idx) => idx !== index);
    updateBlock(block.id, { items: updated });
  };

  const progressPercent = Math.min(100, Math.round((count / target) * 100));
  const isComplete = count >= target;

  return (
    <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Main Counter Bar */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-slate-900 dark:text-zinc-50">
              {count}
            </span>
            <span className="text-sm font-semibold text-slate-400 dark:text-zinc-500">
              /
            </span>
            {isEditingTarget ? (
              <input
                type="number"
                defaultValue={target}
                autoFocus
                onBlur={(e) => setTargetValue(parseInt(e.target.value) || target)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setTargetValue(parseInt((e.target as HTMLInputElement).value) || target);
                }}
                className="w-12 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 px-1 py-0.5 rounded border border-blue-500 text-sm font-mono outline-none"
              />
            ) : (
              <button
                onClick={() => setIsEditingTarget(true)}
                className="text-sm font-bold text-slate-500 dark:text-zinc-400 hover:text-blue-500 font-mono transition-colors"
                title="Click to change target"
              >
                {target}
              </button>
            )}
          </div>

          {isComplete && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
              <Check size={12} /> Target Met
            </span>
          )}
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => updateCount(count - 1, e)}
            disabled={count === 0}
            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center justify-center font-bold disabled:opacity-40 transition-colors shadow-2xs"
            title="-1"
          >
            <Minus size={15} />
          </button>
          <button
            onClick={(e) => updateCount(count + 1, e)}
            className="px-3 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 font-semibold text-xs transition-colors shadow-xs"
            title="+1"
          >
            <Plus size={15} />
            <span>Count</span>
          </button>
          <button
            onClick={(e) => updateCount(count + 5, e)}
            className="px-2.5 h-8 rounded-lg bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
            title="+5 Fast Batch"
          >
            +5
          </button>
        </div>
      </div>

      {/* Clean Progress Bar */}
      <div className="w-full bg-slate-200/80 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete ? "bg-emerald-500" : "bg-blue-600"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Sub-item quick log + Blocker Tagging */}
      <div className="space-y-2">
        <form onSubmit={addSubitem} className="flex gap-2">
          <input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Log item detail, URL, or #blocker..."
            className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
          />

          <button
            type="button"
            onClick={() => setIsBlocker(!isBlocker)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isBlocker
                ? "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-red-500"
            }`}
            title="Flag as Manager Blocker"
          >
            <AlertCircle size={13} />
            <span>Blocker</span>
          </button>

          <button
            type="submit"
            disabled={!newSubtask.trim()}
            className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 disabled:opacity-40 rounded-lg text-xs font-medium text-slate-800 dark:text-zinc-200 transition-colors"
          >
            Log
          </button>
        </form>

        {subitems.length > 0 && (
          <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {subitems.map((item, idx) => {
              const isItemBlocker = item.toLowerCase().includes("#blocker") || item.includes("[#BLOCKER]");
              return (
                <li
                  key={idx}
                  className={`group flex items-center justify-between text-xs py-1 px-2.5 rounded-md border ${
                    isItemBlocker
                      ? "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 font-medium"
                      : "bg-slate-50 dark:bg-zinc-950/60 border-slate-200/60 dark:border-zinc-800/60 text-slate-700 dark:text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate flex-1">
                    {isItemBlocker && (
                      <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider">
                        Blocker
                      </span>
                    )}
                    <span className="truncate">{item.replace("[#BLOCKER]", "").trim()}</span>
                  </div>
                  <button
                    onClick={(e) => removeSubitem(idx, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity ml-2"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
