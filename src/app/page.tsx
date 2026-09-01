"use client";

import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { BlockEngine } from "@/components/blocks/BlockEngine";
import { Scratchpad } from "@/components/ui/Scratchpad";
import { TopThreePriorities } from "@/components/ui/TopThreePriorities";
import { DailySummaryModal } from "@/components/ui/DailySummaryModal";
import { PersonaSelectorModal } from "@/components/ui/PersonaSelectorModal";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ZenFocusMode } from "@/components/ui/ZenFocusMode";
import { AccomplishmentPortfolioModal } from "@/components/ui/AccomplishmentPortfolioModal";
import { MorningTriageModal } from "@/components/ui/MorningTriageModal";
import { pb } from "@/lib/pocketbase";
import { 
  BookmarkPlus, 
  Check,
  FileCheck2,
  Sparkles,
  Maximize2,
  Award,
  Sunrise,
  Command,
  Plus,
  PanelRight,
  ChevronLeft,
  ChevronRight,
  Calendar
} from "lucide-react";

export default function Dashboard() {
  const { activeBlockId, blocks, fetchBlocks, initRealtime, isLoading } = useWorkspaceStore();
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  const [routineSavedName, setRoutineSavedName] = useState<string | null>(null);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateFormatted = selectedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const changeDay = (offset: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offset);
    setSelectedDate(next);
  };

  // Modals state
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [isZenModeOpen, setIsZenModeOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);

  useEffect(() => {
    fetchBlocks();
    const unsubscribe = initRealtime();

    const handleAuthChange = () => {
      fetchBlocks();
    };
    window.addEventListener("openwork_auth_changed", handleAuthChange);

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      window.removeEventListener("openwork_auth_changed", handleAuthChange);
    };
  }, [fetchBlocks, initRealtime]);

  // Load scratchpad preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("openwork_scratchpad_open");
      if (saved !== null) {
        setIsScratchpadOpen(saved === "true");
      }
    } catch {}
  }, []);

  const toggleScratchpad = () => {
    setIsScratchpadOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("openwork_scratchpad_open", String(next));
      } catch {}
      return next;
    });
  };

  // Global Power-User Hotkeys (E, S, Z, P, B, T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" || 
        target.tagName === "TEXTAREA" || 
        target.isContentEditable ||
        (target as any).role === "textbox"
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === "e" && blocks.length > 0) {
        e.preventDefault();
        setIsSummaryModalOpen((prev) => !prev);
      } else if (key === "z") {
        e.preventDefault();
        setIsZenModeOpen((prev) => !prev);
      } else if (key === "s") {
        e.preventDefault();
        toggleScratchpad();
      } else if (key === "p" && blocks.length > 0) {
        e.preventDefault();
        setIsPortfolioModalOpen((prev) => !prev);
      } else if (key === "b") {
        e.preventDefault();
        setIsPersonaModalOpen((prev) => !prev);
      } else if (key === "t") {
        e.preventDefault();
        setIsTriageModalOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [blocks.length]);

  const saveAsRoutine = async () => {
    if (blocks.length === 0) return;
    const name = prompt("Enter a name for this Routine Template:", "Daily Execution Routine");
    if (!name) return;

    try {
      setIsSavingRoutine(true);
      await pb.collection("routine_templates").create({
        title: name,
        structure: blocks.map((b) => ({
          title: b.title,
          type: b.type,
          config: b.config,
          items: b.items,
          order_index: b.order_index
        }))
      }, { requestKey: null });
      setRoutineSavedName(name);
      setTimeout(() => setRoutineSavedName(null), 3000);
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error("Error saving routine:", err);
      }
    } finally {
      setIsSavingRoutine(false);
    }
  };

  return (
    <div className="flex h-full bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Left/Center Workspace */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto border-r border-slate-200 dark:border-zinc-800/80 min-w-0">
        {/* Top Header Bar */}
        <div className="mb-6 pb-4 border-b border-slate-200/80 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
                Execution Board
              </h2>
              {isLoading && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Syncing
                </span>
              )}
            </div>

            {/* Date Navigator Bar */}
            <div className="flex items-center gap-1.5 mt-1.5 bg-slate-100 dark:bg-zinc-900/90 p-1 rounded-lg w-fit border border-slate-200 dark:border-zinc-800 shadow-2xs">
              <button
                onClick={() => changeDay(-1)}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                title="Previous Day"
              >
                <ChevronLeft size={13} />
              </button>

              <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                <Calendar size={13} className="text-blue-500" />
                <span>{isToday ? `Today · ${dateFormatted}` : dateFormatted}</span>
              </div>

              <button
                onClick={() => changeDay(1)}
                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                title="Next Day"
              >
                <ChevronRight size={13} />
              </button>

              {!isToday && (
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-nowrap md:flex-wrap">
            {/* Morning Triage button */}
            <button
              onClick={() => setIsTriageModalOpen(true)}
              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs flex-shrink-0"
              title="Clean morning rollover and backlog resolver (T)"
            >
              <Sunrise size={13} />
              <span>Triage</span>
            </button>

            {/* Zen Mode button */}
            <button
              onClick={() => setIsZenModeOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs flex-shrink-0"
              title="Enter full-screen Zen Focus HUD mode (Z)"
            >
              <Maximize2 size={13} />
              <span>Zen HUD</span>
            </button>

            {/* Role Blueprints */}
            <button
              onClick={() => setIsPersonaModalOpen(true)}
              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs flex-shrink-0"
              title="Load role workflow blueprint (B)"
            >
              <Sparkles size={13} className="text-blue-500" />
              <span>Blueprints</span>
            </button>

            {/* Daily Standup & EOD Synthesis */}
            <button
              onClick={() => setIsSummaryModalOpen(true)}
              disabled={blocks.length === 0}
              className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-2xs flex-shrink-0"
              title="Generate 1-click EOD executive report (E)"
            >
              <FileCheck2 size={13} />
              <span>EOD Report</span>
              <kbd className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-200/60 dark:bg-emerald-900/80 font-bold">E</kbd>
            </button>

            {/* Proof of Work Portfolio */}
            <button
              onClick={() => setIsPortfolioModalOpen(true)}
              disabled={blocks.length === 0}
              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-2xs flex-shrink-0"
              title="Export Proof of Work Portfolio (P)"
            >
              <Award size={13} />
              <span>Portfolio</span>
            </button>

            {/* Save Routine */}
            <button
              onClick={saveAsRoutine}
              disabled={blocks.length === 0 || isSavingRoutine}
              className="px-3 py-1.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 shadow-2xs flex-shrink-0"
            >
              {routineSavedName ? (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={13} className="text-slate-500" />
                  <span>Save Routine</span>
                </>
              )}
            </button>

            {/* Scratchpad Split-Pane Toggle */}
            <button
              onClick={toggleScratchpad}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs flex-shrink-0 ${
                isScratchpadOpen
                  ? "bg-slate-200/80 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-300 dark:border-zinc-700"
                  : "bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100"
              }`}
              title="Toggle right-hand document scratchpad (Hot-key: N)"
            >
              <PanelRight size={13} />
              <span>{isScratchpadOpen ? "Hide Notes" : "Show Notes"}</span>
            </button>
          </div>
        </div>

        {/* Strategic Priorities */}
        <TopThreePriorities />

        {/* Dynamic Block Engine */}
        <BlockEngine />
      </div>

      {/* Right Pane: Context-Rich Scratchpad (Desktop >= 1024px) */}
      {isScratchpadOpen && (
        <div className="w-[420px] max-w-[45vw] flex-shrink-0 bg-slate-50/50 dark:bg-zinc-950/80 overflow-y-auto hidden lg:block border-l border-slate-200 dark:border-zinc-800/80 animate-in slide-in-from-right-4 duration-200">
          <Scratchpad activeBlockId={activeBlockId} />
        </div>
      )}

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        onOpenStandup={() => setIsSummaryModalOpen(true)}
        onOpenPersona={() => setIsPersonaModalOpen(true)}
        onOpenZen={() => setIsZenModeOpen(true)}
        onOpenPortfolio={() => setIsPortfolioModalOpen(true)}
        onOpenCustomStudio={() => window.dispatchEvent(new CustomEvent("open-custom-studio"))}
      />

      {/* Zen Focus HUD Mode */}
      <ZenFocusMode
        isOpen={isZenModeOpen}
        onClose={() => setIsZenModeOpen(false)}
      />

      {/* Daily Standup Summary Modal */}
      <DailySummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
      />

      {/* Role / Persona Selector Modal */}
      <PersonaSelectorModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
      />

      {/* Proof of Work Accomplishment Portfolio Modal */}
      <AccomplishmentPortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
      />

      {/* Morning Triage & Rollover Modal */}
      <MorningTriageModal
        isOpen={isTriageModalOpen}
        onClose={() => setIsTriageModalOpen(false)}
      />
    </div>
  );
}
