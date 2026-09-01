"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  LayoutGrid, 
  Layers, 
  Settings, 
  Sun, 
  Moon, 
  FileText, 
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  LogIn,
  LogOut
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { calculateBoardProgress } from "@/lib/progress";
import { Scratchpad } from "./Scratchpad";

export function MobileNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { blocks, activeBlockId, fetchBlocks } = useWorkspaceStore();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(false);

  const progress = calculateBoardProgress(blocks);

  return (
    <>
      {/* Mobile Top Header Bar (< 1024px) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Open Navigation Drawer"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              OW
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
              OpenWork
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mobile Notes Drawer Toggle */}
          <button
            onClick={() => setIsNotesSheetOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors relative"
            title="Open Scratchpad Notes"
          >
            <FileText size={18} />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Slide-in Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 h-full flex flex-col justify-between p-4 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    OW
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                      OpenWork PRO
                    </h3>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                      Personal Execution Cockpit
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="py-4 space-y-1.5">
                {[
                  { href: "/", label: "Today's Board", icon: LayoutGrid },
                  { href: "/routines", label: "My Routines", icon: Layers },
                  { href: "/settings", label: "Preferences & Profile", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icon size={17} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-3">
              {/* Completed Gauge */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Completed Today</span>
                  </span>
                  <span className="font-mono font-bold text-xs">
                    {progress.completedUnits}/{progress.totalUnits}
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal ml-1">
                      ({progress.percentage}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-2xs"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>

              {/* Profile & Auth */}
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Link
                    href="/settings"
                    onClick={() => setIsDrawerOpen(false)}
                    className="flex items-center gap-2 min-w-0 flex-1"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </Link>

                  {isAuthenticated ? (
                    <button
                      onClick={() => {
                        logout();
                        fetchBlocks();
                        setIsDrawerOpen(false);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"
                      title="Log Out"
                    >
                      <LogOut size={14} />
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400"
                      title="Sign In"
                    >
                      <LogIn size={14} />
                    </Link>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? "bg-emerald-500" : "bg-amber-400"}`} />
                    {isAuthenticated ? "Cloud Sync Active" : "Local Demo Mode"}
                  </span>
                  {!isAuthenticated && (
                    <Link
                      href="/login"
                      onClick={() => setIsDrawerOpen(false)}
                      className="text-blue-600 dark:text-blue-400 font-bold"
                    >
                      Sign In →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Notes Bottom / Side Sheet */}
      {isNotesSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsNotesSheetOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-zinc-100">
                <FileText size={16} className="text-blue-500" />
                <span>Scratchpad Notes</span>
              </div>
              <button
                onClick={() => setIsNotesSheetOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <Scratchpad activeBlockId={activeBlockId} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
