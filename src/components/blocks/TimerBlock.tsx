"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { useWorkspaceStore, WorkBlock } from "@/store/workspaceStore";
import { playGoalChime } from "@/lib/sound";

export function TimerBlock({ 
  block,
  onUpdate
}: { 
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;
  
  const initialDuration = block.config?.initialDuration ?? 25 * 60;
  const isRunning = block.config?.isRunning || false;
  
  // Local state for smooth 1-second ticks without flooding the database
  const [secondsLeft, setSecondsLeft] = useState<number>(block.config?.timeRemaining ?? initialDuration);
  const secondsRef = useRef(secondsLeft);
  secondsRef.current = secondsLeft;

  // Sync with remote block changes if changed outside
  useEffect(() => {
    if (block.config?.timeRemaining !== undefined && !isRunning) {
      setSecondsLeft(block.config.timeRemaining);
    }
  }, [block.config?.timeRemaining, isRunning]);

  // Interval timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            playGoalChime();
            updateBlock(block.id, {
              config: { ...block.config, timeRemaining: 0, isRunning: false }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, block.id, block.config, updateBlock]);

  // Save current progress on unmount or pause
  const toggleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRunning = !isRunning;
    updateBlock(block.id, { 
      config: { 
        ...block.config, 
        timeRemaining: secondsRef.current,
        isRunning: nextRunning 
      } 
    });
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSecondsLeft(initialDuration);
    updateBlock(block.id, { 
      config: { 
        ...block.config, 
        timeRemaining: initialDuration, 
        isRunning: false 
      } 
    });
  };

  const setPreset = (minutes: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSeconds = minutes * 60;
    setSecondsLeft(newSeconds);
    updateBlock(block.id, { 
      config: { 
        ...block.config, 
        timeRemaining: newSeconds, 
        initialDuration: newSeconds,
        isRunning: false 
      } 
    });
  };

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800">
        {/* Digital Clock Display */}
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-amber-500 animate-pulse" : "bg-slate-300 dark:bg-zinc-700"}`} />
          <span className="text-3xl font-mono font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            {mins}:{secs}
          </span>
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            {isRunning ? "Sprint in progress" : secondsLeft === 0 ? "Completed" : "Ready"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTimer}
            className={`px-3.5 h-8 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} />}
            <span>{isRunning ? "Pause" : "Start"}</span>
          </button>
          <button
            onClick={resetTimer}
            className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors shadow-2xs"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Preset Sprint Chips */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-400 dark:text-zinc-500 text-[11px] font-medium mr-1">Presets:</span>
        {[10, 25, 45].map((m) => (
          <button
            key={m}
            onClick={(e) => setPreset(m, e)}
            className={`px-2 py-0.5 rounded-md text-xs font-mono font-medium transition-colors ${
              initialDuration === m * 60
                ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold"
                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}
