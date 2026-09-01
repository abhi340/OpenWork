"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Table as TableIcon, 
  FileText, 
  Sun, 
  Moon, 
  FileCheck2, 
  Sparkles, 
  Maximize2, 
  Award, 
  Layers, 
  Settings, 
  Command,
  CheckSquare,
  GitCommit,
  Sliders,
  TrendingUp,
  Globe,
  Calendar
} from "lucide-react";
import { useWorkspaceStore, BlockType } from "@/store/workspaceStore";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

interface CommandPaletteProps {
  onOpenStandup: () => void;
  onOpenPersona: () => void;
  onOpenZen: () => void;
  onOpenPortfolio: () => void;
  onOpenCustomStudio?: () => void;
}

export function CommandPalette({
  onOpenStandup,
  onOpenPersona,
  onOpenZen,
  onOpenPortfolio,
  onOpenCustomStudio
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { addBlock, blocks } = useWorkspaceStore();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global key listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const handleAdd = (type: BlockType, title: string, config: any = {}, items: any[] = []) => {
    addBlock({
      title,
      type,
      config,
      order_index: blocks.length,
      items
    });
    setIsOpen(false);
  };

  const commands = [
    {
      id: "add_batch",
      title: "Add Batch Counter (+5 Target)",
      category: "Work Blocks",
      icon: CheckCircle2,
      color: "text-purple-500",
      action: () => handleAdd("counter_batch", "Daily Outreach Batch", { count: 0, target: 5, unit: "Tasks" })
    },
    {
      id: "add_timer",
      title: "Add 25m Focus Sprint Timer",
      category: "Work Blocks",
      icon: Clock,
      color: "text-blue-500",
      action: () => handleAdd("timer_task", "Focus Sprint (25m)", { timeRemaining: 25 * 60, initialDuration: 25 * 60, isRunning: false })
    },
    {
      id: "add_checklist",
      title: "Add Dynamic Task Checklist",
      category: "Work Blocks",
      icon: CheckSquare,
      color: "text-cyan-500",
      action: () => handleAdd("checklist", "Release Checklist", {}, [{ id: "1", text: "First priority task", completed: false }])
    },
    {
      id: "add_pipeline",
      title: "Add Stage Flow Pipeline (Mini-Kanban)",
      category: "Work Blocks",
      icon: GitCommit,
      color: "text-orange-500",
      action: () => handleAdd("pipeline_flow", "Development Pipeline", { stages: ["Backlog", "In Progress", "Review", "Done"] })
    },
    {
      id: "add_kpi",
      title: "Add Metric / KPI Goal Target",
      category: "Work Blocks",
      icon: TrendingUp,
      color: "text-rose-500",
      action: () => handleAdd("metric_kpi", "Daily Revenue Target", { current: 0, target: 2500, prefix: "$", unit: "", step: 50 })
    },
    {
      id: "add_links",
      title: "Add Launchpad Bookmark Dock",
      category: "Work Blocks",
      icon: Globe,
      color: "text-indigo-500",
      action: () => handleAdd("link_hub", "Essential Work Links", {}, [
        { id: "1", title: "GitHub Repo", url: "https://github.com" },
        { id: "2", title: "Documentation", url: "https://google.com" }
      ])
    },
    {
      id: "add_table",
      title: "Add Lead & Pipeline Data Table",
      category: "Work Blocks",
      icon: TableIcon,
      color: "text-emerald-500",
      action: () => handleAdd("table", "Lead Pipeline Grid", { columns: ["Company", "Contact", "Stage", "Next Step"] })
    },
    {
      id: "add_scheduled",
      title: "Add Scheduled Milestones & Deadlines",
      category: "Work Blocks",
      icon: Calendar,
      color: "text-amber-500",
      action: () => handleAdd("date_milestones", "Scheduled Milestones & Deadlines", {}, [
        { id: "1", title: "Target Deliverable Review", dueDate: new Date().toISOString().split("T")[0], completed: false, priority: "high" },
        { id: "2", title: "Contract Milestone Sign-off", dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], completed: false, priority: "medium" }
      ])
    },
    {
      id: "custom_studio",
      title: "Open Custom Block Studio (AI Architect)",
      category: "Work Blocks",
      icon: Sliders,
      color: "text-blue-500",
      action: () => {
        setIsOpen(false);
        if (onOpenCustomStudio) onOpenCustomStudio();
      }
    },
    {
      id: "zen_focus",
      title: "Enter Zen Focus HUD Mode (Distraction-Free)",
      category: "Productivity",
      icon: Maximize2,
      color: "text-indigo-500",
      action: () => { setIsOpen(false); onOpenZen(); }
    },
    {
      id: "daily_standup",
      title: "Generate 1-Click Daily Standup Log",
      category: "Productivity",
      icon: FileCheck2,
      color: "text-emerald-500",
      action: () => { setIsOpen(false); onOpenStandup(); }
    },
    {
      id: "portfolio_export",
      title: "Export Proof-of-Work Accomplishment Portfolio",
      category: "Productivity",
      icon: Award,
      color: "text-amber-500",
      action: () => { setIsOpen(false); onOpenPortfolio(); }
    },
    {
      id: "role_blueprints",
      title: "Browse Role Blueprints (CEO, Engineer, Sales, Intern)",
      category: "Navigation",
      icon: Sparkles,
      color: "text-blue-500",
      action: () => { setIsOpen(false); onOpenPersona(); }
    },
    {
      id: "settings_page",
      title: "Open Preferences, Profile & Backup Hub",
      category: "Navigation",
      icon: Settings,
      color: "text-slate-500",
      action: () => { setIsOpen(false); router.push("/settings"); }
    },
    {
      id: "routines_page",
      title: "Manage Routine Templates",
      category: "Navigation",
      icon: Layers,
      color: "text-blue-500",
      action: () => { setIsOpen(false); router.push("/routines"); }
    },
    {
      id: "toggle_theme",
      title: `Switch Theme to ${theme === "dark" ? "Light" : "Dark"} Mode`,
      category: "Preferences",
      icon: theme === "dark" ? Sun : Moon,
      color: "text-amber-500",
      action: () => { toggleTheme(); setIsOpen(false); }
    }
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-24 p-4">
      <div 
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-3">
          <Search size={18} className="text-slate-400 dark:text-zinc-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action (e.g. 'batch', 'timer', 'standup', 'kpi')..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-zinc-800/40">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-zinc-500">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 ${cmd.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cmd.title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500">
                        {cmd.category}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    ↵ Return
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
          <span>Tip: Press <kbd className="font-mono font-semibold">Ctrl + K</kbd> anytime from anywhere</span>
          <div className="flex items-center gap-1">
            <Command size={12} />
            <span>OpenWork Command Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
}
