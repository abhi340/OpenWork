"use client";

import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useRouter } from "next/navigation";
import { 
  Layers, 
  Play, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Table as TableIcon,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface RoutineTemplate {
  id: string;
  name: string;
  blocks: any[];
  created_at?: string;
}

export default function RoutinesPage() {
  const router = useRouter();
  const { addBlock, blocks } = useWorkspaceStore();
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRoutines = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/routines");
      if (res.ok) {
        const data = await res.json();
        setRoutines(data.routines || []);
      } else {
        // Fallback to local storage
        const saved = localStorage.getItem("openwork_saved_routines");
        if (saved) setRoutines(JSON.parse(saved));
      }
    } catch (err: any) {
      console.error("Error fetching routines:", err);
      const saved = localStorage.getItem("openwork_saved_routines");
      if (saved) setRoutines(JSON.parse(saved));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const loadRoutine = async (routine: RoutineTemplate) => {
    if (!routine.blocks || !Array.isArray(routine.blocks)) return;

    for (const b of routine.blocks) {
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
      await fetch(`/api/routines?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const updated = routines.filter((r) => r.id !== id);
      setRoutines(updated);
      localStorage.setItem("openwork_saved_routines", JSON.stringify(updated));
    } catch (err: any) {
      console.error("Error deleting routine:", err);
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
            Save and 1-click launch your pre-configured daily work blocks powered by Cloudflare D1.
          </p>
        </div>
      </div>

      {/* Routine Cards Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-xs text-slate-500 animate-pulse">
          Loading routines from Cloudflare Edge...
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl p-8 bg-slate-50/50 dark:bg-zinc-900/20">
          <Sparkles size={32} className="mx-auto text-slate-400 mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1">
            No routines saved yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            Build your ideal daily board on the main dashboard, then click &quot;Save Routine&quot; in the top bar to save it as a reusable blueprint.
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-blue-500/20"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              onClick={() => loadRoutine(routine)}
              className="group cursor-pointer p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all hover:shadow-md hover:shadow-blue-500/5 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {routine.name}
                  </h3>
                  <button
                    onClick={(e) => deleteRoutine(routine.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                    title="Delete Routine"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="space-y-1.5 mb-4">
                  {routine.blocks?.map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 py-0.5"
                    >
                      {b.type === "timer_task" && <Clock size={12} className="text-purple-500" />}
                      {b.type === "checklist" && <CheckCircle2 size={12} className="text-emerald-500" />}
                      {b.type === "table" && <TableIcon size={12} className="text-blue-500" />}
                      <span className="truncate">{b.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                  {routine.blocks?.length || 0} blocks
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <Play size={11} fill="currentColor" />
                  <span>Launch</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
