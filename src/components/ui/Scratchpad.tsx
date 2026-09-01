"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { pb } from "@/lib/pocketbase";
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
  const loadDocument = useCallback(async () => {
    try {
      const filter = activeBlockId
        ? `block_id = "${activeBlockId}"`
        : `block_id = "" || block_id = null`;
      const docs = await pb.collection("documents").getList(1, 1, {
        filter,
        sort: "-updated",
        requestKey: null
      });

      if (docs.items.length > 0) {
        const item = docs.items[0];
        setDocId(item.id);
        if (item.content && Array.isArray(item.content) && item.content.length > 0) {
          setInitialContent(item.content);
          if (editorInstanceRef.current) {
            editorInstanceRef.current.replaceBlocks(editorInstanceRef.current.document, item.content);
          }
        } else {
          setInitialContent([]);
        }
      } else {
        setDocId(null);
        setInitialContent([]);
      }
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error("Error loading document:", err);
      }
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

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const blockIdVal = activeBlockId || "";
        const currentDocId = docIdRef.current;

        if (currentDocId) {
          await pb.collection("documents").update(currentDocId, {
            content,
            block_id: blockIdVal
          }, { requestKey: null });
        } else {
          const created = await pb.collection("documents").create({
            title: activeBlockId ? `Notes for Block ${activeBlockId}` : "Global Scratchpad",
            block_id: blockIdVal,
            content
          }, { requestKey: null });
          setDocId(created.id);
        }
        setSaveStatus("saved");
      } catch (err: any) {
        if (!err?.isAbort) {
          console.error("Error saving document:", err);
        }
        setSaveStatus("saved");
      }
    }, 800);
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
