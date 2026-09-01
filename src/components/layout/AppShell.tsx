"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/ui/Sidebar";
import { MobileNavbar } from "@/components/ui/MobileNavbar";
import { FloatingAICopilot } from "@/components/ui/FloatingAICopilot";
import { Loader2 } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // 1. If on login page, render purely the login view without sidebar or copilot
  if (isLoginPage) {
    return <main className="flex-1 min-h-screen overflow-y-auto bg-slate-50 dark:bg-zinc-950">{children}</main>;
  }

  // 2. Loading state: sleek splash screen while checking session
  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-lg animate-pulse">
          OW
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
          <Loader2 size={14} className="animate-spin text-blue-500" />
          <span>Verifying Secure Session...</span>
        </div>
      </div>
    );
  }

  // 3. If not authenticated and not on login, hold until redirect finishes
  if (!isAuthenticated) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 4. Authenticated state: Render complete workspace
  return (
    <>
      {/* Desktop Sidebar (visible on screens >= 1024px) */}
      <div className="hidden lg:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Header (< 1024px) */}
      <MobileNavbar />

      {/* Main scrollable content area */}
      <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 min-w-0 relative">
        {children}

        {/* Floating AI Execution Copilot */}
        <FloatingAICopilot />
      </main>
    </>
  );
}
