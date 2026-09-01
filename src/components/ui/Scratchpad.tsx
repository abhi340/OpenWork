"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Check, Cloud, FileEdit, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

// Dynamically load the BlockNote client-only component to prevent SSR window reference errors
const BlockNoteEditor = dynamic(() => import("./BlockNoteEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 text-slate-400 dark:text-zinc-600 text-xs">
      <Loader2 size={16} className="animate-spin mr-2" />
      <span>Loading rich scratchpad...</span>
    </div>
  )
});

export function Scratchpad({ activeBlockId }: { activeBlockId: string | null }) {
  const { theme } = useTheme();
  const [docId, setDocId] = useState<string | null>(null);
  const docIdRef = useRef<string | null>(null);
  docIdRef.current = docId;

  const [initialContent, setInitialContent] = useState<any[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorInstanceRef = useRef<any>(null);

  // Load document for active block or global scratchpad
  const loadDocument = useCallback(() => {
    try {
      const storageKey = activeBlockId ? `openwork_scratchpad_${activeBlockId}` : "openwork_scratchpad_global";
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setInitialContent(parsed);
          if (editorInstanceRef.current) {
            editorInstanceRef.current.replaceBlocks(editorInstanceRef.current.document, parsed);
          }
          return;
        }
      }
      setInitialContent([]);
    } catch (err: any) {
      console.error("Error loading scratchpad:", err);
    }
  }, [activeBlockId]);

  useEffect(() => {
    loadDocument();
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadDocument]);

  const handleEditorChange = (content: any[]) => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const storageKey = activeBlockId ? `openwork_scratchpad_${activeBlockId}` : "openwork_scratchpad_global";
        localStorage.setItem(storageKey, JSON.stringify(content));
        setSaveStatus("saved");
      } catch (err: any) {
        console.error("Error saving scratchpad:", err);
        setSaveStatus("saved");
      }
    }, 600);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 bg-slate-50/50 dark:bg-zinc-950">
      {/* Top Header */}
      <div className="mb-4 pb-3 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileEdit size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
            {activeBlockId ? "Block Scratchpad" : "Global Workspace Scratchpad"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-500 font-medium">
          {saveStatus === "saving" ? (
            <>
              <Cloud size={13} className="animate-pulse text-blue-500" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check size={13} className="text-emerald-500" />
              <span>Synced</span>
            </>
          )}
        </div>
      </div>

      {/* BlockNote Document Editor */}
      <div className="flex-1 -mx-2 sm:-mx-4 overflow-y-auto">
        <BlockNoteEditor
          key={activeBlockId || "global"}
          initialContent={initialContent || undefined}
          theme={theme === "dark" ? "dark" : "light"}
          onChange={handleEditorChange}
          onInit={(instance) => {
            editorInstanceRef.current = instance;
          }}
        />
      </div>
    </div>
  );
}
