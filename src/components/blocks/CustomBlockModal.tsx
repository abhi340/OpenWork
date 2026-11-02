"use client";

import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Table as TableIcon, 
  FileText, 
  CheckSquare, 
  GitCommit, 
  Sliders, 
  Sparkles,
  ArrowRight,
  Eye,
  Plus,
  Trash2,
  TrendingUp,
  Globe,
  Wand2,
  Loader2,
  Play,
  Briefcase,
  Terminal,
  PhoneCall,
  GitMerge,
  Compass
} from "lucide-react";
import { useWorkspaceStore, BlockType } from "@/store/workspaceStore";
import { useAuth } from "@/context/AuthContext";
import { sendAIChatRequest } from "@/lib/ai";
import { CounterBlock } from "./CounterBlock";
import { ChecklistBlock } from "./ChecklistBlock";
import { PipelineFlowBlock } from "./PipelineFlowBlock";
import { LinkHubBlock } from "./LinkHubBlock";

interface CustomBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_PRESETS = [
  {
    role: "Checklist",
    icon: CheckSquare,
    type: "checklist" as BlockType,
    title: "Daily Execution Tasks",
    tag: "Tasks"
  },
  {
    role: "Pipeline / PM",
    icon: GitMerge,
    type: "pipeline_flow" as BlockType,
    title: "Sprint Feature Stages",
    tag: "Product",
    stages: ["Backlog", "In Dev", "Code Review", "QA Testing", "Shipped"]
  },
  {
    role: "Sales SDR",
    icon: PhoneCall,
    type: "counter_batch" as BlockType,
    title: "Outreach & Prospect Batch",
    tag: "Sales",
    target: 20,
    unit: "Calls"
  },
  {
    role: "Daily Links",
    icon: Compass,
    type: "link_hub" as BlockType,
    title: "Daily Launchpad & Resources",
    tag: "Resources"
  },
  {
    role: "Notes & Specs",
    icon: FileText,
    type: "rich_doc" as BlockType,
    title: "Technical Notes & Specs",
    tag: "Docs"
  }
];

export function CustomBlockModal({ isOpen, onClose }: CustomBlockModalProps) {
  const { addBlock, blocks } = useWorkspaceStore();
  const { aiConfig } = useAuth();
  
  // Customization state
  const [selectedType, setSelectedType] = useState<BlockType>("checklist");
  const [title, setTitle] = useState("Daily Priority Checklist");
  const [categoryTag, setCategoryTag] = useState("Execution");
  const [isTestDrive, setIsTestDrive] = useState(false);

  // Counter options
  const [targetCount, setTargetCount] = useState(10);
  const [unitName, setUnitName] = useState("Tasks");

  // Pipeline options
  const [stagesList, setStagesList] = useState(["Backlog", "In Progress", "Review", "Done"]);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [previewOverrides, setPreviewOverrides] = useState<Record<string, any>>({});

  React.useEffect(() => {
    setPreviewOverrides({});
  }, [selectedType]);

  // AI Assistant in Studio
  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGeneratingWithAI) return;

    setIsGeneratingWithAI(true);
    try {
      const data = await sendAIChatRequest({
        provider: aiConfig.provider,
        apiKey: aiConfig.apiKey,
        baseUrl: aiConfig.baseUrl,
        model: aiConfig.model,
        messages: [
          {
            role: "system",
            content: `You are an expert workspace architect. The user will describe a widget or workflow engine.
Respond ONLY with a valid JSON object matching this schema, no surrounding conversational markdown:
{
  "type": "checklist" | "pipeline_flow" | "counter_batch" | "link_hub" | "rich_doc",
  "title": string,
  "tag": string,
  "target": number (optional for counter),
  "unit": string (optional for counter),
  "stages": string[] (optional for pipeline)
}`
          },
          {
            role: "user",
            content: aiPrompt
          }
        ]
      });

      if (data.reply) {
        // Extract JSON from response
        const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.type) setSelectedType(parsed.type);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.tag) setCategoryTag(parsed.tag);
          if (parsed.target) setTargetCount(parsed.target);
          if (parsed.unit) setUnitName(parsed.unit);
          if (parsed.stages && Array.isArray(parsed.stages)) setStagesList(parsed.stages);
        }
      }
    } catch (err) {
      console.log("AI block generation error", err);
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  const handleApplyPreset = (preset: typeof ROLE_PRESETS[0]) => {
    setSelectedType(preset.type);
    setTitle(preset.title);
    setCategoryTag(preset.tag);
    if ((preset as any).target) {
      setTargetCount((preset as any).target);
    }
    if ((preset as any).unit) {
      setUnitName((preset as any).unit);
    }
    if ((preset as any).stages) setStagesList((preset as any).stages);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || "My Custom Block";

    let config: any = {
      tag: categoryTag
    };

    let initialItems: any[] = [];

    if (selectedType === "checklist") {
      initialItems = [
        { id: "1", text: "Key priority task #1", completed: false },
        { id: "2", text: "Follow-up deliverable #2", completed: false }
      ];
    } else if (selectedType === "pipeline_flow") {
      config = { ...config, stages: stagesList };
      initialItems = [
        { id: "1", title: "First milestone item", stage: stagesList[0] },
        { id: "2", title: "Active work in progress", stage: stagesList[1] || stagesList[0] }
      ];
    } else if (selectedType === "counter_batch") {
      config = { ...config, count: 0, target: targetCount, unit: unitName };
    } else if (selectedType === "link_hub") {
      initialItems = [
        { id: "1", title: "Primary App Tool", url: "https://google.com" }
      ];
    }

    addBlock({
      title: finalTitle,
      type: selectedType,
      order_index: blocks.length,
      config,
      items: initialItems
    });

    onClose();
  };

  const handlePreviewUpdate = (_id: string, updates: any) => {
    setPreviewOverrides((prev) => ({
      ...prev,
      ...updates,
      config: { ...(prev.config || previewBlock.config), ...(updates.config || {}) },
      items: updates.items !== undefined ? updates.items : (prev.items || previewBlock.items)
    }));
  };

  // Build preview block
  const previewBlock = {
    id: "preview-temp",
    title: title || "Custom Block Preview",
    type: selectedType,
    order_index: 0,
    config: 
      selectedType === "counter_batch" 
        ? { count: 3, target: targetCount, unit: unitName }
        : selectedType === "pipeline_flow"
        ? { stages: stagesList }
        : {},
    items: 
      selectedType === "checklist"
        ? [{ id: "p1", text: "Preview task item", completed: false }]
        : selectedType === "pipeline_flow"
        ? [{ id: "p1", title: "Sample card", stage: stagesList[0] }]
        : selectedType === "link_hub"
        ? [{ id: "l1", title: "Key Workspace Link", url: "https://google.com" }]
        : ["Sample logged item detail"]
  };

  const activePreviewBlock = {
    ...previewBlock,
    config: { ...previewBlock.config, ...(previewOverrides.config || {}) },
    items: previewOverrides.items !== undefined ? previewOverrides.items : previewBlock.items
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-5xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Configuration Form */}
        <div className="w-full md:w-1/2 p-6 border-r border-slate-200 dark:border-zinc-800 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Sliders size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Custom Block Studio</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Design custom execution engines tailored to your exact workflow.
              </p>
            </div>
          </div>

          {/* ✨ AI Prompt Designer Bar */}
          <form 
            onSubmit={handleAIGenerate}
            className="p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 space-y-2 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Wand2 size={13} className="text-blue-600 dark:text-blue-400" />
                <span>AI Widget Designer</span>
              </span>
              <span className="text-[9px] font-mono uppercase bg-blue-200/60 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                Prompt to Widget
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. 'Build a 20-call cold outreach counter with target 20'"
                className="flex-1 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!aiPrompt.trim() || isGeneratingWithAI}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shadow-xs"
              >
                {isGeneratingWithAI ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                <span>Auto-Design</span>
              </button>
            </div>
          </form>

          {/* Quick Role Blueprints */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
              Quick Role Presets:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {ROLE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 hover:bg-blue-50 dark:hover:bg-blue-950 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5"
                >
                  <preset.icon size={13} className="text-slate-500 dark:text-zinc-400" />
                  <span>{preset.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Engine Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              Select Engine Architecture
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { type: "checklist", label: "Checklist", icon: CheckSquare },
                { type: "pipeline_flow", label: "Stage Flow", icon: GitCommit },
                { type: "counter_batch", label: "Batch Counter", icon: CheckCircle2 },
                { type: "link_hub", label: "Launch Links", icon: Globe },
                { type: "rich_doc", label: "Notes Doc", icon: FileText },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => {
                      setSelectedType(item.type as BlockType);
                      if (item.type === "checklist") setTitle("Daily Priority Checklist");
                      if (item.type === "pipeline_flow") setTitle("Development Stage Flow");
                      if (item.type === "counter_batch") setTitle("Outreach / Call Batch");
                      if (item.type === "link_hub") setTitle("Quick Launchpad Dock");
                      if (item.type === "rich_doc") setTitle("Work Notes & Specs");
                    }}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20 font-semibold"
                        : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400"
                    }`}
                  >
                    <Icon size={15} className="mb-1 text-blue-500" />
                    <div className="text-[11px] font-bold truncate">{item.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Block Name & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Block Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cold Email Batch"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                Tag / Category
              </label>
              <input
                type="text"
                value={categoryTag}
                onChange={(e) => setCategoryTag(e.target.value)}
                placeholder="e.g. Sales, Dev, Admin"
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Type-Specific Parameters */}
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
              Engine Parameters:
            </span>

            {selectedType === "counter_batch" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Target Goal</label>
                  <input
                    type="number"
                    min={1}
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value) || 5)}
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 font-mono outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Unit Name</label>
                  <input
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="e.g. Calls, PRs, Emails"
                    className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}



            {selectedType === "pipeline_flow" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Workflow Stages (Comma-separated)</label>
                <input
                  type="text"
                  value={stagesList.join(", ")}
                  onChange={(e) => setStagesList(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                  placeholder="e.g. Backlog, Active, Testing, Done"
                  className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}

            {selectedType === "link_hub" && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Launchpad dock for quick-access daily links (GitHub, Figma, Linear, Staging, Docs).
              </p>
            )}

            {selectedType === "checklist" && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Checklist supports single task entry and 1-click bulk multi-line pasting.
              </p>
            )}

            {selectedType === "rich_doc" && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Connects directly to the right-pane BlockNote scratchpad with slash command support.
              </p>
            )}
          </div>
        </div>

        {/* Right: Live Interactive Preview */}
        <div className="w-full md:w-1/2 p-6 bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Eye size={14} className="text-blue-500" />
                <span>Live Interactive Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestDrive(!isTestDrive)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                    isTestDrive 
                      ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-300 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-200 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-600 dark:text-zinc-400"
                  }`}
                  title="Toggle live interaction testing"
                >
                  <Play size={10} className={isTestDrive ? "text-emerald-500" : ""} />
                  <span>{isTestDrive ? "Interactive Mode" : "Preview Mode"}</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Rendered Block Card Preview */}
            <div className={`p-4 rounded-xl border border-slate-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm ${
              !isTestDrive ? "pointer-events-none opacity-95" : ""
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedType === "checklist" && <CheckSquare size={16} className="text-cyan-500" />}
                  {selectedType === "pipeline_flow" && <GitCommit size={16} className="text-orange-500" />}
                  {selectedType === "counter_batch" && <CheckCircle2 size={16} className="text-purple-500" />}
                  {selectedType === "link_hub" && <Globe size={16} className="text-indigo-500" />}
                  {selectedType === "rich_doc" && <FileText size={16} className="text-amber-500" />}

                  <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                    {activePreviewBlock.title}
                  </h4>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-semibold">
                  {categoryTag || "Custom"}
                </span>
              </div>

              {/* Body Preview */}
              <div className="mt-2">
                {selectedType === "checklist" && <ChecklistBlock block={activePreviewBlock as any} onUpdate={handlePreviewUpdate} />}
                {selectedType === "pipeline_flow" && <PipelineFlowBlock block={activePreviewBlock as any} onUpdate={handlePreviewUpdate} />}
                {selectedType === "counter_batch" && <CounterBlock block={activePreviewBlock as any} onUpdate={handlePreviewUpdate} />}
                {selectedType === "link_hub" && <LinkHubBlock block={activePreviewBlock as any} onUpdate={handlePreviewUpdate} />}
                {selectedType === "rich_doc" && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-slate-600 dark:text-zinc-400">
                    Document notes preview connected to right-pane Scratchpad.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Save Actions */}
          <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <span>Build & Add to Board</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
