"use client";

import React from "react";
import { X, Sunrise, ArrowRight, Archive, Trash2, CheckCircle2, RotateCcw } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface MorningTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MorningTriageModal({ isOpen, onClose }: MorningTriageModalProps) {
  const { blocks, updateBlock, removeBlock } = useWorkspaceStore();

  if (!isOpen) return null;

  const incompleteBatches = blocks.filter(
    (b) => b.type === "counter_batch" && (b.config?.count || 0) < (b.config?.target || 5)
  );

  const handleRollOver = () => {
    // Reset counters and metrics to fresh daily count, uncheck completed checklists
    blocks.forEach((b) => {
      if (b.type === "counter_batch") {
        updateBlock(b.id, {
          config: { ...b.config, count: 0 }
        });
      } else if (b.type === "metric_kpi") {
        updateBlock(b.id, {
          config: { ...b.config, current: 0 }
        });
      } else if (b.type === "timer_task") {
        updateBlock(b.id, {
          config: { ...b.config, isRunning: false, timeRemaining: b.config?.initialDuration || 25 * 60 }
        });
      } else if (b.type === "checklist" && b.items) {
        // Reset checkmarks for recurring checklist routine
        const resetItems = b.items.map((item: any) => ({ ...item, completed: false }));
        updateBlock(b.id, { items: resetItems });
      }
    });
    onClose();
  };

  const handleClearFinished = () => {
    // Delete completed batch blocks and completed checklist items
    blocks.forEach((b) => {
      if (b.type === "counter_batch" && (b.config?.count || 0) >= (b.config?.target || 5)) {
        removeBlock(b.id);
      } else if (b.type === "metric_kpi" && (b.config?.current || 0) >= (b.config?.target || 100)) {
        removeBlock(b.id);
      } else if (b.type === "checklist" && b.items) {
        const remaining = b.items.filter((item: any) => !item.completed);
        updateBlock(b.id, { items: remaining });
      } else if (b.type === "timer_task") {
        updateBlock(b.id, {
          config: { ...b.config, isRunning: false, timeRemaining: b.config?.initialDuration || 25 * 60 }
        });
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Sunrise size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                Morning Board Triage
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Clean slate protocol: start today with zero backlog clutter.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-700 dark:text-zinc-300">
            <span className="font-semibold text-slate-900 dark:text-zinc-100 block mb-1">
              Active Board Summary:
            </span>
            <span>You currently have <strong>{blocks.length} active blocks</strong> ({incompleteBatches.length} batch goals ready for progress).</span>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleRollOver}
              className="w-full p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/60 text-left flex items-start gap-3 transition-all group"
            >
              <RotateCcw size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-100">
                  Reset & Roll Over to Today's Fresh Board
                </div>
                <div className="text-[11px] text-blue-700/80 dark:text-blue-300/70 mt-0.5">
                  Resets counts to 0 and clears checkmarks while keeping your targets, tables, and routines intact.
                </div>
              </div>
            </button>

            <button
              onClick={handleClearFinished}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 text-left flex items-start gap-3 transition-all group"
            >
              <Archive size={18} className="text-slate-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  Archive Finished & Keep Incomplete
                </div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Removes 100% completed batches and checked-off tasks, leaving only in-progress work.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Keep Board Exactly as Is
          </button>
        </div>
      </div>
    </div>
  );
}
