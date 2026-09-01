"use client";

import React, { useState } from "react";
import { X, Award, Copy, Check, Printer, FileText, Sparkles, Eye, Code } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AccomplishmentPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccomplishmentPortfolioModal({ isOpen, onClose }: AccomplishmentPortfolioModalProps) {
  const { blocks } = useWorkspaceStore();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const batchBlocks = blocks.filter((b) => b.type === "counter_batch");
  const timerBlocks = blocks.filter((b) => b.type === "timer_task");
  const checklistBlocks = blocks.filter((b) => b.type === "checklist");
  const pipelineBlocks = blocks.filter((b) => b.type === "pipeline_flow");
  const metricBlocks = blocks.filter((b) => b.type === "metric_kpi");
  const tableBlocks = blocks.filter((b) => b.type === "table");
  const dateBlocks = blocks.filter((b) => b.type === "date_milestones");

  const totalBatchesCount = batchBlocks.reduce((acc, b) => acc + Math.max(0, b.config?.count || 0), 0);
  const totalSubtasksCount = 
    batchBlocks.reduce((acc, b) => acc + (b.items?.length || 0), 0) +
    checklistBlocks.reduce((acc, b) => acc + (b.items?.filter((i: any) => i.completed)?.length || 0), 0);

  const totalSprintMins = Math.max(0, timerBlocks.reduce((acc, b) => {
    const initial = Math.max(0, Math.floor((b.config?.initialDuration || 1500) / 60));
    const remaining = Math.max(0, Math.floor((b.config?.timeRemaining ?? b.config?.initialDuration ?? 1500) / 60));
    return acc + Math.max(0, initial - remaining);
  }, 0));

  // Markdown Resume / Portfolio report
  let reportText = `# Executive Accomplishment Portfolio
**Contributor:** ${user.name} (${user.email})  
**Role:** ${user.jobTitle || "Professional Contributor"}  
**Organization:** ${user.workspaceName}  
**Date Generated:** ${todayStr}

---

## Executive Performance Metrics
- **Execution Output:** ${totalBatchesCount} batch items & ${totalSubtasksCount} verified deliverables logged
- **Deep Focus Sprint Time:** ~${totalSprintMins} minutes (~${(totalSprintMins / 60).toFixed(1)} hours)
- **Active Data & Workflow Pipelines:** ${tableBlocks.length + pipelineBlocks.length} operational pipelines
`;

  // 1. KPI Milestones
  if (metricBlocks.length > 0) {
    reportText += `\n---\n\n## Key Results & Strategic Metrics\n`;
    metricBlocks.forEach((b) => {
      const current = b.config?.current || 0;
      const target = b.config?.target || 100;
      const prefix = b.config?.prefix || "";
      const unit = b.config?.unit || "";
      const pct = Math.round((current / (target || 1)) * 100);
      reportText += `### ${b.title}\n- **Performance:** ${prefix}${current.toLocaleString()}${unit ? ` ${unit}` : ""} / ${prefix}${target.toLocaleString()}${unit ? ` ${unit}` : ""} (${pct}% goal achieved)\n\n`;
    });
  }

  // 2. Batch Execution Breakdown
  if (batchBlocks.length > 0) {
    reportText += `\n---\n\n## Deliverables & Execution Summary\n`;
    batchBlocks.forEach((b) => {
      const count = b.config?.count || 0;
      const target = b.config?.target || 5;
      reportText += `### ${b.title} (${count}/${target} Target Achieved)\n`;
      if (b.items && b.items.length > 0) {
        b.items.forEach((item: string) => {
          reportText += `- [x] ${item}\n`;
        });
      } else {
        reportText += `- ${count} units executed successfully\n`;
      }
      reportText += `\n`;
    });
  }

  // 3. Action Checklists
  if (checklistBlocks.length > 0) {
    reportText += `\n---\n\n## Action Deliverables & Status\n`;
    checklistBlocks.forEach((b) => {
      const items: any[] = b.items || [];
      const completed = items.filter((i) => i.completed);
      reportText += `### ${b.title} (${completed.length}/${items.length} Finished)\n`;
      items.forEach((i) => {
        reportText += `- [${i.completed ? "x" : " "}] ${i.text}\n`;
      });
      reportText += `\n`;
    });
  }

  // 4. Tables and Datasets
  if (tableBlocks.length > 0) {
    reportText += `\n---\n\n## Managed Pipelines & Datasets\n`;
    tableBlocks.forEach((b) => {
      const rows = b.items || [];
      reportText += `- **${b.title}:** ${rows.length} records curated and maintained\n`;
    });
    reportText += `\n`;
  }

  // 5. Scheduled Milestones & Strategic Deadlines
  if (dateBlocks.length > 0) {
    reportText += `\n---\n\n## Scheduled Milestones & Deliverable Deadlines\n`;
    dateBlocks.forEach((b) => {
      const items: any[] = b.items || [];
      const completed = items.filter((i) => i.completed);
      reportText += `### ${b.title} (${completed.length}/${items.length} Milestones Verified)\n`;
      items.forEach((i) => {
        reportText += `- [${i.completed ? "x" : " "}] ${i.title} ${i.completed ? "(Delivered)" : `(Scheduled for ${i.dueDate})`}\n`;
      });
      reportText += `\n`;
    });
  }

  reportText += `---\n*Generated automatically by OpenWork — Verified Proof-of-Work System*`;

  const copyReport = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <Award size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                Accomplishment Portfolio (Proof of Work)
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Exportable proof of your deliverables for reviews, promotions, or client updates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Quick Stat Pill Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-center">
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100">
                {totalBatchesCount}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Tasks Completed
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-center">
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100">
                {(totalSprintMins / 60).toFixed(1)}h
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Deep Sprint Hours
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-center">
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100">
                {totalSubtasksCount}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                Logged Deliverables
              </div>
            </div>
          </div>

          {/* Formatted Report Presentation */}
          {viewMode === "formatted" ? (
            <div className="bg-slate-50/80 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 max-h-80 overflow-y-auto font-sans leading-relaxed text-slate-800 dark:text-zinc-200 shadow-inner">
              <MarkdownRenderer content={reportText} />
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 font-mono text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
              {reportText}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50">
          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
            Clean typography formatted for executive reviews
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={copyReport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Full Portfolio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
