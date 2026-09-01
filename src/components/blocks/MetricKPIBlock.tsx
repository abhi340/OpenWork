"use client";

import React, { useState } from "react";
import { WorkBlock, useWorkspaceStore } from "@/store/workspaceStore";
import { Plus, Minus, Target, TrendingUp, Check, Award } from "lucide-react";

import { playGoalChime } from "@/lib/sound";

export function MetricKPIBlock({ 
  block,
  onUpdate
}: { 
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;

  const currentVal = block.config?.current ?? 0;
  const targetVal = block.config?.target ?? 100;
  const unit = block.config?.unit || "";
  const prefix = block.config?.prefix || ""; // e.g. "$"
  const step = block.config?.step || 1;

  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState(currentVal.toString());

  const progressPercent = Math.min(100, Math.round((currentVal / (targetVal || 1)) * 100));
  const isGoalMet = currentVal >= targetVal;

  const handleIncrement = (amount: number) => {
    const next = Math.max(0, currentVal + amount);
    if (next >= targetVal && currentVal < targetVal) {
      playGoalChime();
    }
    updateBlock(block.id, {
      config: { ...block.config, current: next }
    });
  };

  const handleSaveDirect = () => {
    const parsed = parseFloat(tempVal);
    if (!isNaN(parsed)) {
      if (parsed >= targetVal && currentVal < targetVal) {
        playGoalChime();
      }
      updateBlock(block.id, {
        config: { ...block.config, current: parsed }
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Metric Display & Target Status */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold font-mono text-slate-700 dark:text-zinc-300">{prefix}</span>
              <input
                type="number"
                value={tempVal}
                autoFocus
                onChange={(e) => setTempVal(e.target.value)}
                onBlur={handleSaveDirect}
                onKeyDown={(e) => e.key === "Enter" && handleSaveDirect()}
                className="w-28 bg-slate-100 dark:bg-zinc-800 border border-blue-500 rounded px-2 py-0.5 text-2xl font-bold font-mono text-slate-900 dark:text-zinc-100 outline-none"
              />
              <span className="text-xs font-semibold text-slate-500">{unit}</span>
            </div>
          ) : (
            <div 
              onClick={() => {
                setTempVal(currentVal.toString());
                setIsEditing(true);
              }}
              className="cursor-pointer group flex items-baseline gap-1"
              title="Click to edit value directly"
            >
              <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-zinc-50 group-hover:text-blue-500 transition-colors">
                {prefix}{currentVal.toLocaleString()}{unit ? ` ${unit}` : ""}
              </span>
            </div>
          )}

          <span className="text-xs font-mono text-slate-400 dark:text-zinc-500">
            / {prefix}{targetVal.toLocaleString()}{unit ? ` ${unit}` : ""} target
          </span>
        </div>

        {/* Goal Met Badge */}
        {isGoalMet ? (
          <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-in fade-in">
            <Award size={13} />
            <span>Target Achieved!</span>
          </div>
        ) : (
          <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <TrendingUp size={13} />
            <span>{progressPercent}% Met</span>
          </div>
        )}
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            isGoalMet 
              ? "bg-emerald-500 shadow-sm" 
              : "bg-blue-600 dark:bg-blue-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Quick Increments */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleIncrement(-step)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
            title={`Decrease by ${step}`}
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleIncrement(step)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold font-mono transition-colors"
          >
            +{step}
          </button>
          {step * 5 > 1 && (
            <button
              type="button"
              onClick={() => handleIncrement(step * 5)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold font-mono transition-colors hidden sm:block"
            >
              +{step * 5}
            </button>
          )}
        </div>

        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
          Click number to type direct amount
        </span>
      </div>
    </div>
  );
}
