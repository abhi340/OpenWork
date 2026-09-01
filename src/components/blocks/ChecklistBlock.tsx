"use client";

import React, { useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2, Clipboard, AlertCircle, Calendar } from "lucide-react";
import { useWorkspaceStore, WorkBlock } from "@/store/workspaceStore";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  isBlocker?: boolean;
  dueDate?: string; // YYYY-MM-DD
}

export function ChecklistBlock({ 
  block,
  onUpdate
}: { 
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;
  const [newItemText, setNewItemText] = useState("");
  const [newItemDate, setNewItemDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isBlocker, setIsBlocker] = useState(false);

  const items: ChecklistItem[] = block.items || [
    { id: "1", text: "Sample actionable task item", completed: false }
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  const toggleItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateBlock(block.id, { items: updated });
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newItemText.trim(),
      completed: false,
      isBlocker,
      dueDate: newItemDate || undefined
    };

    updateBlock(block.id, { items: [...items, newItem] });
    setNewItemText("");
    setNewItemDate("");
    setShowDatePicker(false);
    setIsBlocker(false);
  };

  const handleBulkPaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split("\n")
      .map((line) => line.trim().replace(/^[-*•]\s*/, "").replace(/^\[\s*\]\s*/, ""))
      .filter(Boolean);

    const newItems: ChecklistItem[] = lines.map((text) => ({
      id: crypto.randomUUID(),
      text,
      completed: false,
      isBlocker: text.toLowerCase().includes("#blocker")
    }));

    updateBlock(block.id, { items: [...items, ...newItems] });
    setBulkText("");
    setShowBulkPaste(false);
  };

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter((item) => item.id !== id);
    updateBlock(block.id, { items: updated });
  };

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const renderDueDateBadge = (dueDate?: string) => {
    if (!dueDate) return null;
    const diff = Math.round(
      (new Date(dueDate + "T00:00:00").getTime() - new Date(todayStr + "T00:00:00").getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (diff < 0) {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
          Overdue
        </span>
      );
    } else if (diff === 0) {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
          Today
        </span>
      );
    } else if (diff === 1) {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          Tmrw
        </span>
      );
    } else {
      return (
        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
          {dueDate.slice(5)}
        </span>
      );
    }
  };

  return (
    <div className="mt-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pb-1">
        <span className="font-semibold text-[11px] uppercase tracking-wider">
          {completedCount} / {items.length} Completed
        </span>
        <span className="font-bold text-slate-700 dark:text-zinc-300">{progressPercent}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Items list */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={(e) => toggleItem(item.id, e)}
            className={`p-2 rounded-lg border flex items-center justify-between text-xs cursor-pointer group transition-all ${
              item.completed
                ? "bg-slate-50/60 dark:bg-zinc-950/40 border-slate-200/60 dark:border-zinc-800/40 text-slate-400 dark:text-zinc-500 line-through"
                : item.isBlocker
                ? "bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 font-medium"
                : "bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center gap-2 truncate flex-1 min-w-0">
              <button
                type="button"
                onClick={(e) => toggleItem(item.id, e)}
                className="text-slate-400 hover:text-emerald-500 flex-shrink-0"
              >
                {item.completed ? (
                  <CheckCircle2 size={15} className="text-emerald-500" />
                ) : (
                  <Circle size={15} />
                )}
              </button>

              {item.isBlocker && (
                <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                  Blocker
                </span>
              )}

              <span className="truncate">{item.text}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {renderDueDateBadge(item.dueDate)}

              <button
                type="button"
                onClick={(e) => removeItem(item.id, e)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity p-0.5"
                title="Remove item"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form / Bulk paste toggle */}
      {showBulkPaste ? (
        <form onSubmit={handleBulkPaste} className="space-y-2 pt-1">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={3}
            autoFocus
            placeholder="Paste multiple lines of text to create checkboxes in bulk..."
            className="w-full bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg p-2 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkPaste(false)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-zinc-400 px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              Add Lines
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={addItem} className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add task or paste bulk items..."
              className="flex-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
            />

            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                newItemDate || showDatePicker
                  ? "bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                  : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-blue-500"
              }`}
              title="Set Due Date"
            >
              <Calendar size={14} />
            </button>

            <button
              type="button"
              onClick={() => setIsBlocker(!isBlocker)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isBlocker
                  ? "bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400"
                  : "bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-400 hover:text-red-500"
              }`}
              title="Tag as #Blocker"
            >
              <AlertCircle size={14} />
            </button>

            <button
              type="button"
              onClick={() => setShowBulkPaste(true)}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
              title="Bulk Paste Lines"
            >
              <Clipboard size={14} />
            </button>

            <button
              type="submit"
              disabled={!newItemText.trim()}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Add
            </button>
          </div>

          {/* Optional inline date picker drawer */}
          {showDatePicker && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-zinc-900/60 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Due Date:</span>
              <input
                type="date"
                value={newItemDate}
                onChange={(e) => setNewItemDate(e.target.value)}
                className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-zinc-200"
              />
              <button
                type="button"
                onClick={() => setNewItemDate(todayStr)}
                className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-[10px] text-slate-700 dark:text-zinc-300"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  setNewItemDate(d.toISOString().split("T")[0]);
                }}
                className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-zinc-800 text-[10px] text-slate-700 dark:text-zinc-300"
              >
                Tomorrow
              </button>
              {newItemDate && (
                <button
                  type="button"
                  onClick={() => setNewItemDate("")}
                  className="text-[10px] text-slate-400 hover:text-red-500 ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
