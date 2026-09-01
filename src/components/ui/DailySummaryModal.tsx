"use client";

import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  FileCheck2, 
  Sparkles, 
  Eye, 
  Code, 
  Mail, 
  MessageSquare, 
  Share2, 
  Loader2, 
  Layers, 
  TrendingUp, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChannelFormat = "slack" | "executive" | "standup" | "blueprint";

export function DailySummaryModal({ isOpen, onClose }: DailySummaryModalProps) {
  const { blocks, addBlock } = useWorkspaceStore();
  const { aiConfig, user } = useAuth();
  
  const [activeFormat, setActiveFormat] = useState<ChannelFormat>("slack");
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState(false);
  
  // AI Polish states
  const [isPolishing, setIsPolishing] = useState(false);
  const [aiPolishedText, setAiPolishedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const batchBlocks = blocks.filter((b) => b.type === "counter_batch");
  const timerBlocks = blocks.filter((b) => b.type === "timer_task");
  const checklistBlocks = blocks.filter((b) => b.type === "checklist");
  const pipelineBlocks = blocks.filter((b) => b.type === "pipeline_flow");
  const metricBlocks = blocks.filter((b) => b.type === "metric_kpi");
  const tableBlocks = blocks.filter((b) => b.type === "table");
  const dateBlocks = blocks.filter((b) => b.type === "date_milestones");

  // Computed summary metrics
  const totalChecklistItems = checklistBlocks.reduce((acc, b) => acc + (b.items?.length || 0), 0);
  const completedChecklistItems = checklistBlocks.reduce((acc, b) => acc + (b.items?.filter((i: any) => i.completed)?.length || 0), 0);
  const totalCountersCompleted = batchBlocks.reduce((acc, b) => acc + (b.config?.count || 0), 0);
  const totalTargetCounters = batchBlocks.reduce((acc, b) => acc + (b.config?.target || 0), 0);

  // Generate channel-specific texts
  const generateSlackFormat = () => {
    let text = `🚀 *Daily Execution Update — ${todayStr}* (${user.name || "Worker"})\n\n`;
    
    // Core KPIs
    if (metricBlocks.length > 0) {
      text += `📊 *Key Performance Indicators*\n`;
      metricBlocks.forEach((b) => {
        const cur = b.config?.current || 0;
        const tgt = b.config?.target || 100;
        const pfx = b.config?.prefix || "";
        const unt = b.config?.unit || "";
        const pct = Math.round((cur / (tgt || 1)) * 100);
        text += `• *${b.title}*: ${pfx}${cur.toLocaleString()}${unt ? ` ${unt}` : ""} / ${pfx}${tgt.toLocaleString()}${unt ? ` ${unt}` : ""} \`[${pct}%]\`\n`;
      });
      text += `\n`;
    }

    // Counters & Batches
    if (batchBlocks.length > 0) {
      text += `🎯 *Target Batches & Sprints*\n`;
      batchBlocks.forEach((b) => {
        const c = b.config?.count || 0;
        const t = b.config?.target || 5;
        const u = b.config?.unit || "tasks";
        text += `• *${b.title}*: \`${c}/${t} ${u}\` (${Math.round((c / t) * 100)}%)\n`;
      });
      text += `\n`;
    }

    // Completed deliverables
    if (checklistBlocks.length > 0) {
      text += `✅ *Delivered Tasks & Checklists*\n`;
      checklistBlocks.forEach((b) => {
        const items = b.items || [];
        const done = items.filter((i: any) => i.completed);
        if (done.length > 0) {
          text += `• *${b.title}* (${done.length}/${items.length} completed):\n`;
          done.forEach((item: any) => {
            text += `  - ✅ ${item.text}\n`;
          });
        }
      });
      text += `\n`;
    }

    // Sprints Logged
    if (timerBlocks.length > 0) {
      const totalMins = timerBlocks.reduce((acc, b) => {
        const init = Math.floor((b.config?.initialDuration || 1500) / 60);
        const rem = Math.floor((b.config?.timeRemaining || 0) / 60);
        return acc + Math.max(0, init - rem);
      }, 0);
      text += `⏱️ *Deep Work Time*: ~${totalMins} minutes focused execution\n\n`;
    }

    text += `_Generated via OpenWork Workspace OS_`;
    return text;
  };

  const generateExecutiveEmail = () => {
    let text = `Subject: Executive Progress Summary: ${todayStr} — ${user.name || "Operations"}\n\n`;
    text += `Hi Team,\n\nHere is a high-level briefing of our operational milestones and execution metrics delivered today:\n\n`;

    text += `### 1. Strategic Highlights\n`;
    text += `- **Tasks Completed**: ${completedChecklistItems} of ${totalChecklistItems} planned action items closed out (${totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 100}% delivery rate).\n`;
    if (totalTargetCounters > 0) {
      text += `- **Throughput Volume**: Logged ${totalCountersCompleted} units across active workflow batches.\n`;
    }

    if (metricBlocks.length > 0) {
      text += `\n### 2. Key Metrics & Progress\n`;
      metricBlocks.forEach((b) => {
        const cur = b.config?.current || 0;
        const tgt = b.config?.target || 100;
        const pfx = b.config?.prefix || "";
        const unt = b.config?.unit || "";
        text += `- **${b.title}**: ${pfx}${cur.toLocaleString()}${unt ? ` ${unt}` : ""} achieved against ${pfx}${tgt.toLocaleString()}${unt ? ` ${unt}` : ""} target.\n`;
      });
    }

    if (dateBlocks.length > 0) {
      text += `\n### 3. Critical Milestones\n`;
      dateBlocks.forEach((b) => {
        const items = b.items || [];
        items.forEach((m: any) => {
          text += `- [${m.completed ? "Delivered" : "In Progress"}] **${m.title}** (Target: ${m.dueDate || "Immediate"})\n`;
        });
      });
    }

    text += `\nPlease let me know if you need additional detail on any of the above.\n\nBest regards,\n${user.name || "OpenWork Lead"}\n${user.jobTitle || "Executive Workspace"}`;
    return text;
  };

  const generateStandupFormat = () => {
    let text = `### 📋 Daily Standup — ${todayStr}\n\n`;
    
    // Yesterday / Done Today
    text += `**1. What was accomplished today:**\n`;
    if (checklistBlocks.length === 0 && batchBlocks.length === 0) {
      text += `- Initialized workspace routines and prepared sprint priorities.\n`;
    } else {
      checklistBlocks.forEach((b) => {
        const done = (b.items || []).filter((i: any) => i.completed);
        done.forEach((i: any) => {
          text += `- Completed: ${i.text} (${b.title})\n`;
        });
      });
      batchBlocks.forEach((b) => {
        if ((b.config?.count || 0) > 0) {
          text += `- Logged ${b.config?.count} ${b.config?.unit || "tasks"} in ${b.title}\n`;
        }
      });
    }
    text += `\n`;

    // Next Focus
    text += `**2. Priorities for next session:**\n`;
    checklistBlocks.forEach((b) => {
      const pending = (b.items || []).filter((i: any) => !i.completed);
      pending.slice(0, 3).forEach((i: any) => {
        text += `- Close out: ${i.text}\n`;
      });
    });
    if (dateBlocks.length > 0) {
      dateBlocks.forEach((b) => {
        const pending = (b.items || []).filter((i: any) => !i.completed);
        pending.slice(0, 2).forEach((i: any) => {
          text += `- Advance milestone: ${i.title} (${i.dueDate})\n`;
        });
      });
    }
    text += `\n`;

    // Blockers
    text += `**3. Impediments / Blockers:**\n`;
    const blockersFound = checklistBlocks.some((b) => (b.items || []).some((i: any) => i.isBlocker && !i.completed));
    if (blockersFound) {
      checklistBlocks.forEach((b) => {
        const bItems = (b.items || []).filter((i: any) => i.isBlocker && !i.completed);
        bItems.forEach((i: any) => {
          text += `- ⚠️ *Blocker*: ${i.text} (${b.title})\n`;
        });
      });
    } else {
      text += `- None currently. Execution is unblocked.\n`;
    }

    return text;
  };

  const generateBlueprintJSON = () => {
    const blueprint = {
      title: `${user.workspaceName || "OpenWork"} Template Blueprint`,
      exportedAt: new Date().toISOString(),
      author: user.name || "OpenWork Creator",
      blockCount: blocks.length,
      blocks: blocks.map((b) => ({
        type: b.type,
        title: b.title,
        config: b.config,
        items: b.items
      }))
    };
    return JSON.stringify(blueprint, null, 2);
  };

  const rawActiveText = 
    activeFormat === "slack" ? generateSlackFormat() :
    activeFormat === "executive" ? generateExecutiveEmail() :
    activeFormat === "standup" ? generateStandupFormat() :
    generateBlueprintJSON();

  const displayText = aiPolishedText || rawActiveText;

  // Handle AI Polish & Elevate
  const handleAIPolish = async () => {
    setIsPolishing(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          baseUrl: aiConfig.baseUrl,
          model: aiConfig.model,
          messages: [
            {
              role: "system",
              content: "You are an executive communications director. Rewrite the user's raw daily tasks into an authoritative, punchy, high-impact executive summary. Keep metrics quantified, eliminate fluff, and use clean markdown bullet points."
            },
            {
              role: "user",
              content: `Please elevate this ${activeFormat.toUpperCase()} update for executive leadership:\n\n${rawActiveText}`
            }
          ]
        })
      });

      const data = await res.json();
      if (data.reply) {
        setAiPolishedText(data.reply);
      }
    } catch (err) {
      console.error("AI Polish error:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
              <FileCheck2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-zinc-50">
                  Executive EOD Synthesis Studio
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  1-Click Publish
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Automated multi-channel reporting synthesized from your live {blocks.length} board blocks.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/60 dark:bg-zinc-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-zinc-800 p-1 rounded-xl">
            {[
              { id: "slack", label: "Slack / Teams", icon: MessageSquare },
              { id: "executive", label: "Executive Email", icon: Mail },
              { id: "standup", label: "Agile Standup", icon: FileCheck2 },
              { id: "blueprint", label: "Share Blueprint", icon: Share2 }
            ].map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = activeFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => {
                    setActiveFormat(fmt.id as ChannelFormat);
                    setAiPolishedText(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <Icon size={13} />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            {/* AI Polish Button */}
            <button
              onClick={handleAIPolish}
              disabled={isPolishing || activeFormat === "blueprint"}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              title="Enhance tone and business impact with AI"
            >
              {isPolishing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Elevating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="text-amber-300" />
                  <span>AI Polish</span>
                </>
              )}
            </button>

            {aiPolishedText && (
              <button
                onClick={() => setAiPolishedText(null)}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 underline"
              >
                Reset Raw
              </button>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/70 dark:bg-zinc-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setViewMode("formatted")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "formatted" ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs" : "text-slate-400"}`}
                title="Formatted Preview"
              >
                <Eye size={13} />
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "raw" ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs" : "text-slate-400"}`}
                title="Raw Text"
              >
                <Code size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          {viewMode === "formatted" && activeFormat !== "blueprint" ? (
            <div className="bg-slate-50/80 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-5 font-sans leading-relaxed text-slate-800 dark:text-zinc-200 shadow-inner">
              <MarkdownRenderer content={displayText} />
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 font-mono text-xs text-slate-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {displayText}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/40 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Layers size={13} className="text-blue-500" />
              <span>{blocks.length} Blocks</span>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp size={13} className="text-emerald-500" />
              <span>{completedChecklistItems} Deliverables</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Done
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
                  <span>Copy {activeFormat === "blueprint" ? "Blueprint" : "Update"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

