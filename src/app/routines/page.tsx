"use client";

import React, { useEffect, useState } from "react";
import { pb } from "@/lib/pocketbase";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRouter } from "next/navigation";
import { 
  Layers, 
  Play, 
  Trash2, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Table as TableIcon,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface RoutineTemplate {
  id: string;
  title: string;
  structure: any[];
  created: string;
}

export default function RoutinesPage() {
  const router = useRouter();
  const { addBlock, blocks } = useWorkspaceStore();
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoutines = async () => {
    try {
      setIsLoading(true);
      const records = await pb.collection("routine_templates").getFullList<RoutineTemplate>({
        sort: "-created",
        requestKey: null
      });
      setRoutines(records);
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error("Error fetching routines:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const loadRoutine = async (routine: RoutineTemplate) => {
    if (!routine.structure || !Array.isArray(routine.structure)) return;

    for (const b of routine.structure) {
      await addBlock({
        title: b.title,
        type: b.type,
        config: b.config || {},
        items: b.items || [],
        order_index: blocks.length
      });
    }

    router.push("/");
  };

  const deleteRoutine = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await pb.collection("routine_templates").delete(id);
      setRoutines(routines.filter((r) => r.id !== id));
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error("Error deleting routine:", err);
      }
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={22} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              Routine Templates
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Save and 1-click launch your pre-configured daily work blocks.
          </p>
        </div>
      </div>

      {/* Routine Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500 animate-pulse">
          Loading your templates...
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/30">
          <Layers size={32} className="mx-auto text-slate-400 dark:text-zinc-600 mb-2" />
          <h3 className="font-semibold text-sm text-slate-800 dark:text-zinc-200 mb-1">
            No Routine Templates Saved Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm mx-auto mb-4">
            Build your day on the Today Board, then click "Save as Routine" in the top bar to save it for quick reuse.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className="p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-base text-slate-900 dark:text-zinc-100">
                    {routine.title}
                  </h3>
                  <button
                    onClick={(e) => deleteRoutine(routine.id, e)}
                    className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete Routine"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Sub-block summary */}
                <div className="space-y-1.5 mb-4">
                  {routine.structure?.map((b, bIdx) => (
                    <div
                      key={bIdx}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1.5 rounded-md"
                    >
                      {b.type === "counter_batch" && <CheckCircle2 size={13} className="text-purple-500" />}
                      {b.type === "timer_task" && <Clock size={13} className="text-blue-500" />}
                      {b.type === "table" && <TableIcon size={13} className="text-emerald-500" />}
                      <span className="font-medium truncate">{b.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch Button */}
              <button
                onClick={() => loadRoutine(routine)}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Play size={13} />
                <span>Load into Today's Board</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
