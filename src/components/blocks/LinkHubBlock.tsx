"use client";

import React, { useState } from "react";
import { WorkBlock, useWorkspaceStore } from "@/store/workspaceStore";
import { ExternalLink, Plus, Trash2, Globe, Bookmark } from "lucide-react";
import { sanitizeUrl } from "@/lib/security";

export function LinkHubBlock({ 
  block,
  onUpdate
}: { 
  block: WorkBlock;
  onUpdate?: (id: string, updates: Partial<WorkBlock>) => void;
}) {
  const { updateBlock: storeUpdateBlock } = useWorkspaceStore();
  const updateBlock = onUpdate || storeUpdateBlock;
  const items = block.items || [];

  const [titleInput, setTitleInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || !urlInput.trim()) return;

    let formattedUrl = sanitizeUrl(urlInput.trim());
    if (formattedUrl === "#") return;

    const newItem = {
      id: crypto.randomUUID(),
      title: titleInput.trim(),
      url: formattedUrl
    };

    updateBlock(block.id, {
      items: [...items, newItem]
    });

    setTitleInput("");
    setUrlInput("");
    setIsAdding(false);
  };

  const handleRemoveLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateBlock(block.id, {
      items: items.filter((i: any) => i.id !== id)
    });
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {items.map((link: any) => (
          <a
            key={link.id}
            href={sanitizeUrl(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="group p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-500/60 dark:hover:border-blue-500/60 bg-slate-50/60 dark:bg-zinc-950/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-blue-500 group-hover:scale-105 transition-transform">
                <Globe size={13} />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {link.title}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink size={12} className="text-slate-400 dark:text-zinc-500" />
              <button
                type="button"
                onClick={(e) => handleRemoveLink(link.id, e)}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors ml-1"
                title="Remove link"
              >
                <Trash2 size={11} />
              </button>
            </div>
          </a>
        ))}

        {/* Add Link Trigger */}
        {!isAdding ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
            }}
            className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-zinc-800 hover:border-blue-500 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
          >
            <Plus size={13} />
            <span>+ Add Bookmark</span>
          </button>
        ) : (
          <form
            onSubmit={handleAddLink}
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 rounded-xl border border-blue-500 bg-white dark:bg-zinc-900 space-y-2 col-span-1 sm:col-span-2 shadow-sm"
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={titleInput}
                autoFocus
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Title (e.g. GitHub Repo)"
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500"
              />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="URL (e.g. github.com/...)"
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold shadow-xs"
              >
                Add Link
              </button>
            </div>
          </form>
        )}
      </div>

      {items.length === 0 && !isAdding && (
        <p className="text-xs text-slate-400 dark:text-zinc-500 italic">
          No bookmarks saved yet. Add key links for quick 1-click access.
        </p>
      )}
    </div>
  );
}
