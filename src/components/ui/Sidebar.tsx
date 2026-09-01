"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutGrid, 
  Layers, 
  Settings, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  LogIn,
  LogOut,
  Cloud,
  CloudOff
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { calculateBoardProgress } from "@/lib/progress";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { blocks, fetchBlocks } = useWorkspaceStore();

  const progress = calculateBoardProgress(blocks);

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  return (
    <aside className="w-60 flex-shrink-0 border-r border-slate-200 dark:border-zinc-800/80 bg-slate-50/80 dark:bg-zinc-900/50 h-full flex flex-col justify-between select-none">
      {/* Top Header */}
      <div>
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              OW
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>OpenWork</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                Personal Cockpit
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Date / Status Banner */}
        <div className="px-4 py-2.5 border-b border-slate-200/60 dark:border-zinc-800/40 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar size={13} className="text-blue-500" />
            <span>{todayStr}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-zinc-800 text-[10px] font-semibold text-slate-700 dark:text-zinc-300 font-mono">
            {blocks.length} {blocks.length === 1 ? "Block" : "Blocks"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          <NavItem 
            href="/" 
            icon={<LayoutGrid size={16} />} 
            label="Today's Board" 
            active={pathname === "/"} 
          />
          <NavItem 
            href="/routines" 
            icon={<Layers size={16} />} 
            label="My Routines" 
            active={pathname === "/routines"} 
          />
          <NavItem 
            href="/settings" 
            icon={<Settings size={16} />} 
            label="Preferences & Profile" 
            active={pathname === "/settings"} 
          />
        </nav>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-200 dark:border-zinc-800/80 space-y-2.5">
        {/* Universal Workspace Progress */}
        <div className="px-3 py-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 font-semibold">
              <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
              <span>Completed</span>
            </span>
            <span className="text-slate-900 dark:text-zinc-100 font-bold font-mono text-xs">
              {progress.completedUnits}/{progress.totalUnits}
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal ml-1">
                ({progress.percentage}%)
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 shadow-2xs"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Worker Profile & Auth Section */}
        <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <Link
              href="/settings"
              className="flex items-center gap-2 min-w-0 flex-1 group"
              title="View settings & profile"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 dark:border-zinc-700 flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex-shrink-0"
                title="Sign Out of PocketBase"
              >
                <LogOut size={13} />
              </button>
            ) : (
              <Link
                href="/login"
                className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors flex-shrink-0"
                title="Sign In to Sync"
              >
                <LogIn size={13} />
              </Link>
            )}
          </div>

          {/* Cloud Sync Status Chip */}
          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/50 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5">
              {isAuthenticated ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Active</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Local Demo</span>
                </>
              )}
            </div>

            {!isAuthenticated && (
              <Link
                href="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-[10px]"
              >
                Connect Cloud →
              </Link>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ 
  href, 
  icon, 
  label, 
  active 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
}) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        active 
          ? "bg-blue-600 text-white shadow-xs font-semibold" 
          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
