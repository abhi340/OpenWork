"use client";

import React, { useState } from "react";
import { X, Copy, Check, FileCheck, Sparkles, Eye, Code } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailySummaryModal({ isOpen, onClose }: DailySummaryModalProps) {
  const { blocks } = useWorkspaceStore();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // Build comprehensive markdown summary across all 7 block types
  let summaryText = `### Daily Accomplishment & Standup Summary — ${todayStr}\n\n`;

  const batchBlocks = blocks.filter((b) => b.type === "counter_batch");
  const timerBlocks = blocks.filter((b) => b.type === "timer_task");
  const checklistBlocks = blocks.filter((b) => b.type === "checklist");
  const pipelineBlocks = blocks.filter((b) => b.type === "pipeline_flow");
  const metricBlocks = blocks.filter((b) => b.type === "metric_kpi");
  const tableBlocks = blocks.filter((b) => b.type === "table");
  const dateBlocks = blocks.filter((b) => b.type === "date_milestones");

  // 1. KPI Goals
  if (metricBlocks.length > 0) {
    summaryText += `**Key Results & Metrics:**\n`;
    metricBlocks.forEach((b) => {
      const current = b.config?.current || 0;
      const target = b.config?.target || 100;
      const prefix = b.config?.prefix || "";
      const unit = b.config?.unit || "";
      const pct = Math.round((current / (target || 1)) * 100);
      summaryText += `- **${b.title}:** ${prefix}${current.toLocaleString()}${unit ? ` ${unit}` : ""} / ${prefix}${target.toLocaleString()}${unit ? ` ${unit}` : ""} (${pct}% met)\n`;
    });
    summaryText += `\n`;
  }

  // 2. Batch Execution Goals
  if (batchBlocks.length > 0) {
    summaryText += `**Batch Execution Goals:**\n`;
    batchBlocks.forEach((b) => {
      const count = b.config?.count || 0;
      const target = b.config?.target || 5;
      const unit = b.config?.unit || "tasks";
      const percent = Math.round((count / target) * 100);
      summaryText += `- **${b.title}:** ${count}/${target} ${unit} completed (${percent}%)\n`;
      if (b.items && b.items.length > 0) {
        b.items.forEach((item: string) => {
          summaryText += `  - ${item}\n`;
        });
      }
    });
    summaryText += `\n`;
  }

  // 3. Action Checklists
  if (checklistBlocks.length > 0) {
    summaryText += `**Action Deliverables:**\n`;
    checklistBlocks.forEach((b) => {
      const items: any[] = b.items || [];
      const completed = items.filter((i) => i.completed).length;
      summaryText += `- **${b.title}** (${completed}/${items.length} items checked off):\n`;
      items.forEach((item) => {
        summaryText += `  - [${item.completed ? "x" : " "}] ${item.text}${item.isBlocker ? " [Blocker]" : ""}\n`;
      });
    });
    summaryText += `\n`;
  }

  // 4. Focus Sprints Logged
  if (timerBlocks.length > 0) {
    summaryText += `**Focus Work Sessions:**\n`;
    timerBlocks.forEach((b) => {
      const initial = Math.floor((b.config?.initialDuration || 1500) / 60);
      const remaining = Math.floor((b.config?.timeRemaining || 0) / 60);
      const spent = initial - remaining;
      summaryText += `- **${b.title}:** ~${Math.max(0, spent)} mins deep work session\n`;
    });
    summaryText += `\n`;
  }

  // 5. Workflow Stage Pipelines
  if (pipelineBlocks.length > 0) {
    summaryText += `**Pipeline Milestones:**\n`;
    pipelineBlocks.forEach((b) => {
      const cards: any[] = b.items || [];
      const stages: string[] = b.config?.stages || [];
      summaryText += `- **${b.title}:**\n`;
      stages.forEach((stg) => {
        const inStage = cards.filter((c) => c.stage === stg);
        if (inStage.length > 0) {
          summaryText += `  - *${stg}:* ${inStage.map((c) => c.title).join(", ")}\n`;
        }
      });
    });
    summaryText += `\n`;
  }

  // 6. Data & Pipeline Items
  if (tableBlocks.length > 0) {
    summaryText += `**Data Grids & Records:**\n`;
    tableBlocks.forEach((b) => {
      const rows = b.items || [];
      summaryText += `- **${b.title}:** ${rows.length} rows recorded\n`;
    });
    summaryText += `\n`;
  }

  // 7. Scheduled Milestones & Deadlines
  if (dateBlocks.length > 0) {
    summaryText += `**Scheduled Milestones & Deadlines:**\n`;
    dateBlocks.forEach((b) => {
      const items: any[] = b.items || [];
      const completed = items.filter((i) => i.completed).length;
      summaryText += `- **${b.title}** (${completed}/${items.length} milestones delivered):\n`;
      items.forEach((item) => {
        const status = item.completed ? "[Completed]" : `[Target: ${item.dueDate}]`;
        summaryText += `  - [${item.completed ? "x" : " "}] ${item.title} ${status}${item.priority === "high" ? " (High Priority)" : ""}\n`;
      });
    });
    summaryText += `\n`;
  }

  summaryText += `*Generated automatically from OpenWork Workspace.*`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-emerald-500" />
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                Daily Standup Summary
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Synthesized from all your live board blocks, checklists, and counters.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("formatted")}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold transition-all ${
                  viewMode === "formatted"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <Eye size={12} />
                <span>Executive View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("raw")}
                className={`px-2.5 py-1 rounded-md flex items-center gap-1 font-semibold transition-all ${
                  viewMode === "raw"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
                }`}
              >
                <Code size={12} />
                <span>Raw Markdown</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-5">
          {viewMode === "formatted" ? (
            <div className="bg-slate-50/80 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 max-h-80 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-zinc-200 shadow-inner">
              <MarkdownRenderer content={summaryText} />
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 font-mono text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {summaryText}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
            {blocks.length} active blocks synthesized
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Standup Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
