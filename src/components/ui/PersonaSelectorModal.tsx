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
  CheckSquare,
  GitCommit,
  Globe,
  FileText
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface PersonaSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface PersonaBlueprint {
  id: string;
  roleTitle: string;
  level: "Executive" | "Technical" | "Growth" | "Product" | "Creative" | "Operations" | "Entry";
  description: string;
  icon: any;
  accentColor: string;
  blocks: {
    title: string;
    type: "counter_batch" | "checklist" | "pipeline_flow" | "link_hub" | "rich_doc";
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
        config: { count: 0, target: 5, unit: "Decisions" },
        items: ["Hire: Head of Sales offer letter", "Approve: Q3 Infrastructure Budget"]
      },
      {
        title: "Executive Action Checklist",
        type: "checklist",
        config: {},
        items: [
          { id: "1", text: "Sign Sequoia term sheet", completed: false },
          { id: "2", text: "Review weekly ARR growth report", completed: false }
        ]
      },
      {
        title: "Strategic Deal Stages",
        type: "pipeline_flow",
        config: { stages: ["Intro", "Partner Meeting", "Term Sheet", "Closed"] },
        items: [
          { id: "1", title: "Series A Financing", stage: "Partner Meeting" },
          { id: "2", title: "Enterprise Pilot Partner", stage: "Term Sheet" }
        ]
      }
    ]
  },
  {
    id: "software_engineer",
    roleTitle: "Software Engineer / Tech Lead",
    level: "Technical",
    description: "PR reviews, feature branch stages, bug fixes, and technical documentation notes.",
    icon: Code2,
    accentColor: "from-blue-500 to-indigo-600",
    blocks: [
      {
        title: "Pull Requests & Code Reviews",
        type: "counter_batch",
        config: { count: 0, target: 6, unit: "PRs" },
        items: ["PR #242 - Auth middleware fix", "PR #245 - SQLite migration"]
      },
      {
        title: "Sprint Feature Stages",
        type: "pipeline_flow",
        config: { stages: ["Backlog", "In Dev", "Code Review", "QA", "Shipped"] },
        items: [
          { id: "1", title: "ENG-104: Websocket Sync", stage: "In Dev" },
          { id: "2", title: "ENG-112: Dark Mode CSS", stage: "Code Review" }
        ]
      },
      {
        title: "Daily Engineering Priorities",
        type: "checklist",
        config: {},
        items: [
          { id: "1", text: "Verify database migration on local branch", completed: false },
          { id: "2", text: "Deploy staging build & run automated tests", completed: false }
        ]
      }
    ]
  },
  {
    id: "sales_rep",
    roleTitle: "Sales Rep / Account Exec (AE / SDR)",
    level: "Growth",
    description: "High-volume outreach batches, fast +5 stepper, lead stage tracking, and CRM launchpad.",
    icon: TrendingUp,
    accentColor: "from-emerald-500 to-teal-600",
    blocks: [
      {
        title: "Cold Calls & LinkedIn DMs",
        type: "counter_batch",
        config: { count: 0, target: 20, unit: "Calls" },
        items: ["Acme Corp - VP Engineering", "Stripe - Ops Manager"]
      },
      {
        title: "Deal Pipeline Stages",
        type: "pipeline_flow",
        config: { stages: ["Lead", "Qualified", "Demo", "Contract", "Closed Won"] },
        items: [
          { id: "1", title: "TechFlow Inc ($24k)", stage: "Demo" },
          { id: "2", title: "Apex Media ($12k)", stage: "Contract" }
        ]
      },
      {
        title: "Sales Launchpad & Tools",
        type: "link_hub",
        config: {},
        items: [
          { id: "1", title: "Salesforce CRM", url: "https://salesforce.com" },
          { id: "2", title: "LinkedIn Sales Navigator", url: "https://linkedin.com" }
        ]
      }
    ]
  },
  {
    id: "product_manager",
    roleTitle: "Product Manager & Designer",
    level: "Product",
    description: "User interview tracking, feature roadmap stages, sprint planning, and PRD scratchpads.",
    icon: Layout,
    accentColor: "from-purple-500 to-pink-600",
    blocks: [
      {
        title: "User Feedback Sessions",
        type: "counter_batch",
        config: { count: 0, target: 3, unit: "Interviews" },
        items: ["Customer #41 onboarding interview", "Beta tester friction points review"]
      },
      {
        title: "Roadmap Release Stages",
        type: "pipeline_flow",
        config: { stages: ["Discovery", "Spec Drafting", "In Dev", "Ready for QA", "Shipped"] },
        items: [
          { id: "1", title: "1-Click CSV Export", stage: "Ready for QA" },
          { id: "2", title: "Offline PWA Sync", stage: "In Dev" }
        ]
      },
      {
        title: "Product Specs & PRD Scratchpad",
        type: "rich_doc",
        config: {}
      }
    ]
  },
  {
    id: "content_creator",
    roleTitle: "Content Writer & Growth Marketer",
    level: "Creative",
    description: "Publishing sprints, social media threads, editorial stage pipeline, and drafting checklist.",
    icon: PenTool,
    accentColor: "from-rose-500 to-orange-500",
    blocks: [
      {
        title: "Daily Content Posts & Tweets",
        type: "counter_batch",
        config: { count: 0, target: 4, unit: "Posts" },
        items: ["LinkedIn Product Launch Post", "Twitter technical teardown thread"]
      },
      {
        title: "Editorial Pipeline Stages",
        type: "pipeline_flow",
        config: { stages: ["Ideation", "Drafting", "Review", "Scheduled", "Published"] },
        items: [
          { id: "1", title: "Why Notion Is Too Slow For Execution", stage: "Drafting" }
        ]
      },
      {
        title: "Publishing & SEO Checklist",
        type: "checklist",
        config: {},
        items: [
          { id: "1", text: "Create high-res header image and thumbnail", completed: false },
          { id: "2", text: "Check OpenGraph tags and Twitter card preview", completed: false }
        ]
      }
    ]
  },
  {
    id: "intern_newhire",
    roleTitle: "Intern & Junior Associate",
    level: "Entry",
    description: "Daily task checkoffs, onboarding checklist, team workflow stages, and quick launch resources.",
    icon: GraduationCap,
    accentColor: "from-cyan-500 to-blue-500",
    blocks: [
      {
        title: "Assigned Daily Tickets",
        type: "counter_batch",
        config: { count: 0, target: 4, unit: "Tickets" },
        items: ["Setup local Cloudflare D1 dev environment", "Complete onboarding documentation"]
      },
      {
        title: "Onboarding Task Checklist",
        type: "checklist",
        config: {},
        items: [
          { id: "1", text: "Clone repository and run npm install", completed: true },
          { id: "2", text: "Schedule 1:1 onboarding sync with team mentor", completed: false }
        ]
      },
      {
        title: "Quick Launch Knowledge Base",
        type: "link_hub",
        config: {},
        items: [
          { id: "1", title: "Team Notion Docs", url: "https://notion.so" },
          { id: "2", title: "GitHub Organization", url: "https://github.com" }
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
                      {b.type === "checklist" && <CheckSquare size={15} className="text-cyan-500" />}
                      {b.type === "pipeline_flow" && <GitCommit size={15} className="text-orange-500" />}
                      {b.type === "counter_batch" && <CheckCircle2 size={15} className="text-purple-500" />}
                      {b.type === "link_hub" && <Globe size={15} className="text-indigo-500" />}
                      {b.type === "rich_doc" && <FileText size={15} className="text-amber-500" />}

                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{b.title}</span>
                    </div>

                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
                      {b.type === "counter_batch" && `Target: ${b.config.target} ${b.config.unit || 'units'}`}
                      {b.type === "pipeline_flow" && `${b.config.stages?.length || 4} stages`}
                      {b.type === "checklist" && `${b.items?.length || 0} tasks`}
                      {b.type === "link_hub" && `${b.items?.length || 0} bookmarks`}
                      {b.type === "rich_doc" && `Scratchpad notes`}
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
