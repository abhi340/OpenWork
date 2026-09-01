"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Minimize2, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Target, 
  Volume2, 
  VolumeX,
  Sparkles
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { playGoalChime } from "@/lib/sound";

interface ZenFocusModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ZenFocusMode({ isOpen, onClose }: ZenFocusModeProps) {
  const { blocks, updateBlock } = useWorkspaceStore();
  const [activeTimerIndex, setActiveTimerIndex] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerBlocks = blocks.filter((b) => b.type === "timer_task");
  const batchBlocks = blocks.filter((b) => b.type === "counter_batch");

  const currentTimerBlock = timerBlocks[activeTimerIndex] || null;
  const initialDuration = currentTimerBlock?.config?.initialDuration ?? 25 * 60;
  const isRunning = currentTimerBlock?.config?.isRunning || false;

  const [secondsLeft, setSecondsLeft] = useState<number>(currentTimerBlock?.config?.timeRemaining ?? initialDuration);
  const secondsRef = useRef(secondsLeft);
  secondsRef.current = secondsLeft;

  // Sync when active timer block changes
  useEffect(() => {
    if (currentTimerBlock?.config?.timeRemaining !== undefined && !isRunning) {
      setSecondsLeft(currentTimerBlock.config.timeRemaining);
    }
  }, [currentTimerBlock?.config?.timeRemaining, isRunning]);

  // Interval ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && isOpen) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            if (soundEnabled) {
              playGoalChime();
            }
            if (currentTimerBlock) {
              updateBlock(currentTimerBlock.id, {
                config: { ...currentTimerBlock.config, timeRemaining: 0, isRunning: false }
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isOpen, currentTimerBlock?.id, soundEnabled, updateBlock]);

  // Key listener for ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleTimer = () => {
    if (!currentTimerBlock) return;
    const nextRunning = !isRunning;
    updateBlock(currentTimerBlock.id, {
      config: { 
        ...currentTimerBlock.config, 
        timeRemaining: secondsRef.current,
        isRunning: nextRunning 
      }
    });
  };

  const resetTimer = () => {
    if (!currentTimerBlock) return;
    setSecondsLeft(initialDuration);
    updateBlock(currentTimerBlock.id, {
      config: { 
        ...currentTimerBlock.config, 
        timeRemaining: initialDuration, 
        isRunning: false 
      }
    });
  };

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");
  const progressPercent = Math.round(((initialDuration - secondsLeft) / initialDuration) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white flex flex-col justify-between p-6 sm:p-10 md:p-14 animate-in fade-in duration-200 select-none overflow-y-auto">
      {/* Top HUD Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Zen Focus HUD Mode
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title={soundEnabled ? "Mute completion chime" : "Enable completion chime"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5 text-zinc-300 transition-colors"
          >
            <Minimize2 size={14} />
            <span>Exit Zen (ESC)</span>
          </button>
        </div>
      </div>

      {/* Central Giant Focus Display */}
      <div className="max-w-xl mx-auto w-full text-center space-y-6 sm:space-y-8 my-auto py-8">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-widest text-blue-400 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/80 inline-block mb-3">
            {currentTimerBlock?.title || "Deep Work Sprint"}
          </span>
          <div className="text-7xl sm:text-8xl md:text-9xl font-mono font-bold tracking-tighter text-zinc-50 drop-shadow-2xl">
            {mins}:{secs}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md mx-auto bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Big Action Stepper */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-2.5 shadow-xl transition-all hover:scale-105 active:scale-95 ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-zinc-950"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            }`}
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            <span>{isRunning ? "Pause Sprint" : "Resume Sprint"}</span>
          </button>
          <button
            onClick={resetTimer}
            className="p-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Reset Timer"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Bottom Mini Objectives */}
      <div className="max-w-2xl mx-auto w-full">
        {batchBlocks.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Target size={14} className="text-purple-400" />
                Active Batch Goal
              </span>
              <span className="font-mono text-zinc-200">
                {batchBlocks[0].config?.count || 0} / {batchBlocks[0].config?.target || 5} Completed
              </span>
            </div>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (((batchBlocks[0].config?.count || 0) / (batchBlocks[0].config?.target || 5)) * 100))}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
