"use client";

import React, { useState } from "react";
import { 
  X, 
  Crown, 
  Code2, 
  TrendingUp, 
  Layout, 
  PenTool, 
  UserCheck, 
  GraduationCap, 
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Table as TableIcon,
  FileText
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PersonaBlueprint {
  id: string;
  roleTitle: string;
  level: "Executive" | "Technical" | "Growth" | "Product" | "Creative" | "Operations" | "Entry";
  description: string;
  icon: any;
  accentColor: string;
  blocks: {
    title: string;
    type: "counter_batch" | "timer_task" | "table" | "rich_doc";
    config: any;
    items?: any[];
  }[];
}

const PERSONA_BLUEPRINTS: PersonaBlueprint[] = [
  {
    id: "ceo_executive",
    roleTitle: "CEO & Executive Leadership",
    level: "Executive",
    description: "High-level strategic decisions, key investor calls, revenue metrics, and board memos.",
    icon: Crown,
    accentColor: "from-amber-500 to-yellow-600",
    blocks: [
      {
        title: "Key Decisions & Approvals",
        type: "counter_batch",
        config: { count: 0, target: 5 },
        items: ["Hire: Head of Sales offer letter", "Approve: Q3 Infrastructure Budget"]
      },
      {
        title: "Strategic Blitz Sprint (15 min)",
        type: "timer_task",
        config: { timeRemaining: 15 * 60, initialDuration: 15 * 60, isRunning: false }
      },
      {
        title: "Company KPI & Investor Pipeline",
        type: "table",
        config: { columns: ["Metric / Stakeholder", "Target", "Current", "Status"] },
        items: [
          { "Metric / Stakeholder": "Monthly Recurring Revenue", Target: "$100k", Current: "$84k", Status: "On Track" },
          { "Metric / Stakeholder": "Sequoia Partner Meeting", Target: "Series A", Current: "Pitch Ready", Status: "Scheduled" }
        ]
      }
    ]
  },
  {
    id: "software_engineer",
    roleTitle: "Software Engineer / Tech Lead",
    level: "Technical",
    description: "PR reviews, uninterrupted deep-code focus blocks, bug incident tables, and architecture notes.",
    icon: Code2,
    accentColor: "from-blue-500 to-indigo-600",
    blocks: [
      {
        title: "Pull Requests & Code Reviews",
        type: "counter_batch",
        config: { count: 0, target: 6 },
        items: ["PR #242 - Auth middleware fix", "PR #245 - SQLite migration"]
      },
      {
        title: "Deep Coding Sprint (50 min)",
        type: "timer_task",
        config: { timeRemaining: 50 * 60, initialDuration: 50 * 60, isRunning: false }
      },
      {
        title: "Active Bug & Task Triage",
        type: "table",
        config: { columns: ["Ticket ID", "Component", "Severity", "PR Link"] },
        items: [
          { "Ticket ID": "ENG-104", Component: "Websocket Sync", Severity: "High", "PR Link": "pr/104-sync" },
          { "Ticket ID": "ENG-112", Component: "Dark Mode CSS", Severity: "Low", "PR Link": "pr/112-theme" }
        ]
      }
    ]
  },
  {
    id: "sales_rep",
    roleTitle: "Sales Rep / Account Exec (AE / SDR)",
    level: "Growth",
    description: "High-volume outreach batches, fast +5 stepper, lead stage tracking, and call scripts.",
    icon: TrendingUp,
    accentColor: "from-emerald-500 to-teal-600",
    blocks: [
      {
        title: "Cold Calls & LinkedIn DMs",
        type: "counter_batch",
        config: { count: 0, target: 20 },
        items: ["Acme Corp - VP Engineering", "Stripe - Ops Manager"]
      },
      {
        title: "Live Lead Pipeline",
        type: "table",
        config: { columns: ["Company", "Contact", "Deal Size", "Stage", "Next Step"] },
        items: [
          { Company: "TechFlow Inc", Contact: "David K.", "Deal Size": "$24k/yr", Stage: "Demo Scheduled", "Next Step": "Send deck" },
          { Company: "Apex Media", Contact: "Rachel S.", "Deal Size": "$12k/yr", Stage: "Contract Sent", "Next Step": "Legal review" }
        ]
      },
      {
        title: "Demo Prep & Follow-up (15 min)",
        type: "timer_task",
        config: { timeRemaining: 15 * 60, initialDuration: 15 * 60, isRunning: false }
      }
    ]
  },
  {
    id: "product_manager",
    roleTitle: "Product Manager & Designer",
    level: "Product",
    description: "User interview tracking, feature impact matrices, sprint planning, and PRD scratchpads.",
    icon: Layout,
    accentColor: "from-purple-500 to-pink-600",
    blocks: [
      {
        title: "User Feedback Sessions",
        type: "counter_batch",
        config: { count: 0, target: 3 },
        items: ["Customer #41 onboarding interview", "Beta tester friction points review"]
      },
      {
        title: "Feature Roadmap & Backlog Matrix",
        type: "table",
        config: { columns: ["Feature", "Impact", "Effort", "Sprint Target"] },
        items: [
          { Feature: "1-Click CSV Export", Impact: "High", Effort: "Low", "Sprint Target": "v1.2" },
          { Feature: "Offline PWA Sync", Impact: "Critical", Effort: "Medium", "Sprint Target": "v1.3" }
        ]
      },
      {
        title: "Spec Writing Session (45 min)",
        type: "timer_task",
        config: { timeRemaining: 45 * 60, initialDuration: 45 * 60, isRunning: false }
      }
    ]
  },
  {
    id: "content_creator",
    roleTitle: "Content Writer & Growth Marketer",
    level: "Creative",
    description: "Publishing sprints, social media threads, SEO content calendars, and drafting notes.",
    icon: PenTool,
    accentColor: "from-rose-500 to-orange-500",
    blocks: [
      {
        title: "Daily Content Posts & Tweets",
        type: "counter_batch",
        config: { count: 0, target: 4 },
        items: ["LinkedIn Product Launch Post", "Twitter technical teardown thread"]
      },
      {
        title: "Focus Writing Sprint (35 min)",
        type: "timer_task",
        config: { timeRemaining: 35 * 60, initialDuration: 35 * 60, isRunning: false }
      },
      {
        title: "Editorial & Campaign Calendar",
        type: "table",
        config: { columns: ["Content Title", "Channel", "Keyword / Hook", "Status"] },
        items: [
          { "Content Title": "Why Notion Is Too Slow For Execution", Channel: "Blog", "Keyword / Hook": "Productivity", Status: "Drafting" }
        ]
      }
    ]
  },
  {
    id: "intern_newhire",
    roleTitle: "Intern & Junior Associate",
    level: "Entry",
    description: "Daily task checkoffs, learning sprint sessions, onboarding checklists, and mentor log.",
    icon: GraduationCap,
    accentColor: "from-cyan-500 to-blue-500",
    blocks: [
      {
        title: "Assigned Daily Tickets",
        type: "counter_batch",
        config: { count: 0, target: 4 },
        items: ["Setup local Cloudflare D1 dev environment", "Complete onboarding documentation"]
      },
      {
        title: "Learning & Code Study (30 min)",
        type: "timer_task",
        config: { timeRemaining: 30 * 60, initialDuration: 30 * 60, isRunning: false }
      },
      {
        title: "Mentor 1:1 Questions & Log",
        type: "table",
        config: { columns: ["Topic / Question", "Mentor", "Answer / Notes", "Resolved"] },
        items: [
          { "Topic / Question": "Database schema migration flow", Mentor: "Abhi", "Answer / Notes": "Run pb_setup.mjs", Resolved: "Yes" }
        ]
      }
    ]
  }
];

export function PersonaSelectorModal({ isOpen, onClose }: PersonaSelectorModalProps) {
  const { addBlock, blocks } = useWorkspaceStore();
  const [selectedPersona, setSelectedPersona] = useState<PersonaBlueprint>(PERSONA_BLUEPRINTS[0]);

  if (!isOpen) return null;

  const applyBlueprint = async (blueprint: PersonaBlueprint) => {
    for (const b of blueprint.blocks) {
      await addBlock({
        title: b.title,
        type: b.type,
        config: b.config,
        items: b.items || [],
        order_index: blocks.length
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Persona List */}
        <div className="w-full md:w-80 border-r border-slate-200 dark:border-zinc-800 p-4 bg-slate-50 dark:bg-zinc-950 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                Workflow Blueprints
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3">
              From CEO to Intern, load a workflow designed specifically for your role.
            </p>

            <div className="space-y-1.5">
              {PERSONA_BLUEPRINTS.map((persona) => {
                const Icon = persona.icon;
                const isSelected = selectedPersona.id === persona.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-white dark:bg-zinc-900 border-blue-600 dark:border-blue-500 shadow-xs ring-1 ring-blue-500/20"
                        : "border-transparent hover:border-slate-200 dark:hover:border-zinc-800 hover:bg-slate-200/50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${persona.accentColor} text-white shadow-xs`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">
                        {persona.roleTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                        {persona.level}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Persona Preview & Apply */}
        <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto bg-white dark:bg-zinc-900">
          <div>
            {/* Top Close Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${selectedPersona.accentColor} text-white shadow-sm`}>
                  {React.createElement(selectedPersona.icon, { size: 18 })}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-zinc-100">
                    {selectedPersona.roleTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {selectedPersona.description}
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

            {/* Blocks Included Preview */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                Blocks Injected Into Your Daily Board:
              </span>

              <div className="space-y-2">
                {selectedPersona.blocks.map((b, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {b.type === "counter_batch" && <CheckCircle2 size={15} className="text-purple-500" />}
                      {b.type === "timer_task" && <Clock size={15} className="text-blue-500" />}
                      {b.type === "table" && <TableIcon size={15} className="text-emerald-500" />}
                      {b.type === "rich_doc" && <FileText size={15} className="text-amber-500" />}

                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{b.title}</span>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      {b.type === "counter_batch" && `Target: ${b.config.target} units`}
                      {b.type === "timer_task" && `Duration: ${Math.floor(b.config.initialDuration / 60)} mins`}
                      {b.type === "table" && `${b.config.columns.length} columns`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => applyBlueprint(selectedPersona)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Load {selectedPersona.roleTitle} Blueprint</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
