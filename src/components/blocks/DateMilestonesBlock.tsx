"use client";

import React, { useState } from "react";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  Flag,
  ChevronRight,
  Filter
} from "lucide-react";
import { useWorkspaceStore, WorkBlock } from "@/store/workspaceStore";

export interface ScheduledTaskItem {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  priority?: "high" | "medium" | "normal";
}

interface DateMilestonesBlockProps {
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}

export function DateMilestonesBlock({ block, onUpdate }: DateMilestonesBlockProps) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "normal">("normal");
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "upcoming" | "completed">("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const items: ScheduledTaskItem[] = block.items || [
    {
      id: "1",
      title: "Deliver Q3 Financial Forecast to Board",
      dueDate: new Date().toISOString().split("T")[0],
      completed: false,
      priority: "high"
    },
    {
      id: "2",
      title: "Client Contract Milestone Review",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      completed: false,
      priority: "medium"
    }
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  const getDaysDiff = (dateStr: string) => {
    const target = new Date(dateStr + "T00:00:00");
    const today = new Date(todayStr + "T00:00:00");
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDateStatusBadge = (dateStr: string, completed: boolean) => {
    if (completed) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
          Completed
        </span>
      );
    }

    const diff = getDaysDiff(dateStr);
    if (diff < 0) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1">
          <AlertCircle size={10} />
          <span>Overdue ({Math.abs(diff)}d)</span>
        </span>
      );
    } else if (diff === 0) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 flex items-center gap-1 animate-pulse">
          <Clock size={10} />
          <span>Due Today</span>
        </span>
      );
    } else if (diff === 1) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
          Tomorrow
        </span>
      );
    } else {
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
          In {diff} days
        </span>
      );
    }
  };

  const toggleTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateBlock(block.id, { items: updated });
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter((item) => item.id !== id);
    updateBlock(block.id, { items: updated });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newItem: ScheduledTaskItem = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      dueDate: newTaskDate || todayStr,
      completed: false,
      priority: newTaskPriority
    };

    updateBlock(block.id, { items: [...items, newItem] });
    setNewTaskTitle("");
    setShowAddForm(false);
  };

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setNewTaskDate(d.toISOString().split("T")[0]);
  };

  // Filtered lists
  const filteredItems = items.filter((item) => {
    if (activeFilter === "completed") return item.completed;
    if (item.completed) return activeFilter === "all";

    const diff = getDaysDiff(item.dueDate);
    if (activeFilter === "today") return diff <= 0;
    if (activeFilter === "upcoming") return diff > 0;
    return true;
  });

  const dueTodayCount = items.filter((i) => !i.completed && getDaysDiff(i.dueDate) <= 0).length;
  const upcomingCount = items.filter((i) => !i.completed && getDaysDiff(i.dueDate) > 0).length;
  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
      {/* Sub-header Filter Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-2 py-1 rounded-md font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-2xs"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            All ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("today")}
            className={`px-2 py-1 rounded-md font-semibold transition-all ${
              activeFilter === "today"
                ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-2xs"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            Due Today ({dueTodayCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("upcoming")}
            className={`px-2 py-1 rounded-md font-semibold transition-all ${
              activeFilter === "upcoming"
                ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("completed")}
            className={`px-2 py-1 rounded-md font-semibold transition-all ${
              activeFilter === "completed"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            Done ({completedCount})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
        >
          <Plus size={13} />
          <span>Schedule Task</span>
        </button>
      </div>

      {/* Add Task Form Popover */}
      {showAddForm && (
        <form onSubmit={handleAddTask} className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 block mb-1">
              Task or Scheduled Deliverable
            </label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Submit Board Deck Review, Pay Vendor Invoice..."
              autoFocus
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                Target Scheduled Date
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 block mb-1">
                Priority Level
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-zinc-200 outline-none focus:border-blue-500"
              >
                <option value="normal">Normal Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">Quick Set:</span>
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-[11px] font-medium border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-blue-500"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-[11px] font-medium border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-blue-500"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(3)}
              className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-[11px] font-medium border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-blue-500"
            >
              In 3 Days
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(7)}
              className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 text-[11px] font-medium border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-blue-500"
            >
              Next Week
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Save Milestone
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-1.5">
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              onClick={(e) => toggleTask(item.id, e)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                item.completed
                  ? "bg-slate-50 dark:bg-zinc-950/60 border-slate-200 dark:border-zinc-800/80 text-slate-400 dark:text-zinc-500"
                  : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={(e) => toggleTask(item.id, e)}
                  className="flex-shrink-0 text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  {item.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Circle size={16} />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium truncate ${item.completed ? "line-through text-slate-400 dark:text-zinc-500" : "text-slate-800 dark:text-zinc-100"}`}>
                      {item.title}
                    </span>

                    {item.priority === "high" && !item.completed && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                        High
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono mt-0.5">
                    Target: {item.dueDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {getDateStatusBadge(item.dueDate, item.completed)}

                <button
                  type="button"
                  onClick={(e) => deleteTask(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                  title="Delete Milestone"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="py-8 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-950/40 text-slate-400 dark:text-zinc-500 text-xs">
            {activeFilter === "today"
              ? "No scheduled milestones due today."
              : activeFilter === "upcoming"
              ? "No upcoming milestones scheduled."
              : activeFilter === "completed"
              ? "No completed milestones yet."
              : "No scheduled milestones found. Click Schedule Task to plan ahead."}
          </div>
        )}
      </div>
    </div>
  );
}
