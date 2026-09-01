"use client";

import React, { useState } from "react";
import { useWorkspaceStore, BlockType } from "@/store/workspaceStore";
import { 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Table as TableIcon, 
  FileText, 
  ChevronUp, 
  ChevronDown, 
  GripVertical, 
  Edit2, 
  Copy, 
  Sliders,
  CheckSquare,
  GitCommit,
  Wand2,
  TrendingUp,
  Globe,
  LayoutGrid,
  Sparkles,
  Calendar
} from "lucide-react";
import { CounterBlock } from "./CounterBlock";
import { TimerBlock } from "./TimerBlock";
import { TableBlock } from "./TableBlock";
import { ChecklistBlock } from "./ChecklistBlock";
import { PipelineFlowBlock } from "./PipelineFlowBlock";
import { MetricKPIBlock } from "./MetricKPIBlock";
import { LinkHubBlock } from "./LinkHubBlock";
import { DateMilestonesBlock } from "./DateMilestonesBlock";
import { CustomBlockModal } from "./CustomBlockModal";

export function BlockEngine() {
  const { blocks, addBlock, removeBlock, updateBlock, setActiveBlock, activeBlockId } = useWorkspaceStore();
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  React.useEffect(() => {
    const handleOpenStudio = () => setIsCustomModalOpen(true);
    window.addEventListener("open-custom-studio", handleOpenStudio);
    return () => window.removeEventListener("open-custom-studio", handleOpenStudio);
  }, []);

  const handleAdd = (type: BlockType) => {
    addBlock({
      title: 
        type === "counter_batch" 
          ? "Daily Target Batch" 
          : type === "timer_task" 
          ? "Focus Sprint" 
          : type === "table" 
          ? "Lead Pipeline" 
          : type === "checklist"
          ? "Daily Priority Checklist"
          : type === "pipeline_flow"
          ? "Execution Stages"
          : type === "metric_kpi"
          ? "Key Performance Metric"
          : type === "link_hub"
          ? "Daily Launchpad Links"
          : type === "date_milestones"
          ? "Scheduled Milestones & Deadlines"
          : "Work Scratchpad",
      type,
      order_index: blocks.length,
      config: 
        type === "timer_task" 
          ? { timeRemaining: 25 * 60, initialDuration: 25 * 60, isRunning: false } 
          : type === "counter_batch" 
          ? { count: 0, target: 5, unit: "Tasks" } 
          : type === "table"
          ? { columns: ["Task / Lead", "Owner", "Status"] }
          : type === "pipeline_flow"
          ? { stages: ["Backlog", "In Progress", "Review", "Done"] }
          : type === "metric_kpi"
          ? { current: 0, target: 100, unit: "pts", prefix: "", step: 1 }
          : type === "link_hub"
          ? {}
          : {},
      items: 
        type === "checklist"
          ? [{ id: "1", text: "First priority task", completed: false }]
          : type === "pipeline_flow"
          ? [{ id: "1", title: "Task 1", stage: "In Progress" }]
          : type === "link_hub"
          ? [
              { id: "1", title: "GitHub Repo", url: "https://github.com" },
              { id: "2", title: "Documentation", url: "https://google.com" }
            ]
          : type === "date_milestones"
          ? [
              { id: "1", title: "Submit Board Deck Review", dueDate: new Date().toISOString().split("T")[0], completed: false, priority: "high" },
              { id: "2", title: "Contract Milestone Sign-off", dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], completed: false, priority: "medium" }
            ]
          : []
    });
  };

  const duplicateBlock = (block: any, e: React.MouseEvent) => {
    e.stopPropagation();
    addBlock({
      title: `${block.title} (Copy)`,
      type: block.type,
      config: JSON.parse(JSON.stringify(block.config || {})),
      items: JSON.parse(JSON.stringify(block.items || [])),
      order_index: blocks.length
    });
  };

  const moveBlock = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    if ((direction === "up" && index === 0) || (direction === "down" && index === blocks.length - 1)) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    newBlocks.forEach((b, idx) => {
      updateBlock(b.id, { order_index: idx });
    });
  };

  const actionBtnClass = 
    "px-3 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-zinc-100 shadow-2xs hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all";

  return (
    <div className="space-y-5">
      {/* Clean Utility Add Bar */}
      <div className="p-2.5 bg-slate-100/80 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => handleAdd("counter_batch")} className={actionBtnClass}>
            <CheckCircle2 size={13} className="text-purple-600 dark:text-purple-400" />
            <span>+ Counter</span>
          </button>
          <button onClick={() => handleAdd("timer_task")} className={actionBtnClass}>
            <Clock size={13} className="text-blue-600 dark:text-blue-400" />
            <span>+ Timer</span>
          </button>
          <button onClick={() => handleAdd("table")} className={actionBtnClass}>
            <TableIcon size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>+ Grid Table</span>
          </button>
          <button onClick={() => handleAdd("checklist")} className={actionBtnClass}>
            <CheckSquare size={13} className="text-cyan-600 dark:text-cyan-400" />
            <span>+ Checklist</span>
          </button>
          <button onClick={() => handleAdd("pipeline_flow")} className={actionBtnClass}>
            <GitCommit size={13} className="text-orange-600 dark:text-orange-400" />
            <span>+ Pipeline</span>
          </button>
          <button onClick={() => handleAdd("metric_kpi")} className={actionBtnClass}>
            <TrendingUp size={13} className="text-rose-600 dark:text-rose-400" />
            <span>+ KPI Goal</span>
          </button>
          <button onClick={() => handleAdd("link_hub")} className={actionBtnClass}>
            <Globe size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span>+ Links</span>
          </button>
          <button onClick={() => handleAdd("date_milestones")} className={actionBtnClass}>
            <Calendar size={13} className="text-amber-600 dark:text-amber-400" />
            <span>+ Scheduled</span>
          </button>
        </div>

        <button
          onClick={() => setIsCustomModalOpen(true)}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Sliders size={13} />
          <span>Custom Studio</span>
        </button>
      </div>

      {/* Block Cards List */}
      <div className="space-y-3.5">
        {blocks.map((block, idx) => {
          const isActive = activeBlockId === block.id;

          return (
            <div
              key={block.id}
              onClick={() => setActiveBlock(block.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-zinc-900 border-blue-500 dark:border-blue-500 shadow-md ring-1 ring-blue-500/20"
                  : "bg-white dark:bg-zinc-900/70 border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="text-slate-400 dark:text-zinc-500">
                    <GripVertical size={14} />
                  </div>

                  {block.type === "counter_batch" && <CheckCircle2 size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />}
                  {block.type === "timer_task" && <Clock size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                  {block.type === "table" && <TableIcon size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                  {block.type === "checklist" && <CheckSquare size={16} className="text-cyan-600 dark:text-cyan-400 flex-shrink-0" />}
                  {block.type === "pipeline_flow" && <GitCommit size={16} className="text-orange-600 dark:text-orange-400 flex-shrink-0" />}
                  {block.type === "metric_kpi" && <TrendingUp size={16} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />}
                  {block.type === "link_hub" && <Globe size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />}
                  {block.type === "date_milestones" && <Calendar size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />}
                  {block.type === "rich_doc" && <FileText size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />}

                  {editingTitleId === block.id ? (
                    <input
                      type="text"
                      autoFocus
                      defaultValue={block.title}
                      onBlur={(e) => {
                        updateBlock(block.id, { title: e.target.value.trim() || block.title });
                        setEditingTitleId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          updateBlock(block.id, { title: (e.target as HTMLInputElement).value.trim() || block.title });
                          setEditingTitleId(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold px-2 py-0.5 rounded border border-blue-500 text-sm outline-none w-full max-w-sm"
                    />
                  ) : (
                    <div 
                      className="flex items-center gap-1.5 group/title cursor-text min-w-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitleId(block.id);
                      }}
                    >
                      <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100 truncate">
                        {block.title}
                      </h3>
                      <Edit2 size={11} className="opacity-0 group-hover/title:opacity-100 text-slate-400 dark:text-zinc-500 transition-opacity" />
                    </div>
                  )}

                  {block.config?.tag && (
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold">
                      {block.config.tag}
                    </span>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => duplicateBlock(block, e)}
                    className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                    title="Duplicate Block"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => moveBlock(idx, "up", e)}
                    disabled={idx === 0}
                    className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-20 transition-colors"
                    title="Move Up"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    onClick={(e) => moveBlock(idx, "down", e)}
                    disabled={idx === blocks.length - 1}
                    className="p-1 text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-20 transition-colors"
                    title="Move Down"
                  >
                    <ChevronDown size={15} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBlock(block.id);
                    }}
                    className="p-1 text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1"
                    title="Delete Block"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div>
                {block.type === "counter_batch" && <CounterBlock block={block} />}
                {block.type === "timer_task" && <TimerBlock block={block} />}
                {block.type === "table" && <TableBlock block={block} />}
                {block.type === "checklist" && <ChecklistBlock block={block} />}
                {block.type === "pipeline_flow" && <PipelineFlowBlock block={block} />}
                {block.type === "metric_kpi" && <MetricKPIBlock block={block} />}
                {block.type === "link_hub" && <LinkHubBlock block={block} />}
                {block.type === "date_milestones" && <DateMilestonesBlock block={block} />}
                {block.type === "rich_doc" && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-600 dark:text-zinc-400">
                    Click this block to edit its full document scratchpad in the right panel.
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {blocks.length === 0 && (
          <div className="py-14 px-6 border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/40 text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center border border-blue-200 dark:border-blue-800/60 shadow-2xs">
              <LayoutGrid size={22} />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                Your Execution Board is Clear
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Design your ideal daily routine. Choose a pre-built role blueprint or assemble focus timers, batch counters, and data tables.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Sliders size={13} />
                <span>Open Custom Block Studio</span>
              </button>
            </div>

            {/* Quick 1-Click Starter Blocks */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 max-w-lg mx-auto">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mb-2.5 uppercase tracking-wider">
                Instant 1-Click Starters
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                <button
                  type="button"
                  onClick={() => handleAdd("timer_task")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-blue-500 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Clock size={12} className="text-blue-500" />
                  <span>Focus Sprint</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd("counter_batch")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-purple-500 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <CheckCircle2 size={12} className="text-purple-500" />
                  <span>Batch Counter</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd("checklist")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-cyan-500 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <CheckSquare size={12} className="text-cyan-500" />
                  <span>Checklist</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd("metric_kpi")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-rose-500 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <TrendingUp size={12} className="text-rose-500" />
                  <span>KPI Goal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd("table")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-emerald-500 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <TableIcon size={12} className="text-emerald-500" />
                  <span>Data Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAdd("date_milestones")}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300 hover:border-amber-500 flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <Calendar size={12} className="text-amber-500" />
                  <span>Scheduled Deadlines</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Block Studio Constructor Modal */}
      <CustomBlockModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
      />
    </div>
  );
}
