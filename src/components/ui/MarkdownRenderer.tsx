"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  // Split lines
  const lines = content.split("\n");

  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      return <div key={index} className="h-2" />;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      return <hr key={index} className="my-3 border-slate-200 dark:border-zinc-800" />;
    }

    // Checkbox items (- [x] or - [ ])
    const checkboxMatch = line.match(/^(\s*)[-*•]\s+\[([ xX])\]\s+(.*)/);
    if (checkboxMatch) {
      const isNested = checkboxMatch[1].length > 0;
      const isChecked = checkboxMatch[2].toLowerCase() === "x";
      const itemText = checkboxMatch[3];
      return (
        <div key={index} className={`flex items-start gap-2 ${isNested ? "my-0.5 ml-5" : "my-1 ml-1"} text-slate-800 dark:text-zinc-200`}>
          <div className="mt-0.5 flex-shrink-0">
            {isChecked ? (
              <CheckCircle2 size={14} className="text-emerald-500" />
            ) : (
              <Circle size={14} className="text-slate-400 dark:text-zinc-600" />
            )}
          </div>
          <span className={`text-xs ${isChecked ? "text-slate-700 dark:text-zinc-300 font-medium" : "text-slate-600 dark:text-zinc-400"}`}>
            {formatInline(itemText)}
          </span>
        </div>
      );
    }

    // Headers ####, #####, ######
    if (/^#{4,6}\s+/.test(line)) {
      const text = line.replace(/^#{4,6}\s+/, "");
      return (
        <h5 key={index} className="font-bold text-xs text-slate-800 dark:text-zinc-200 mt-3 mb-1">
          {formatInline(text)}
        </h5>
      );
    }

    // Header ###
    if (line.startsWith("### ")) {
      return (
        <h4 key={index} className="font-bold text-sm text-slate-900 dark:text-zinc-100 mt-3 mb-1.5 flex items-center gap-1.5">
          {formatInline(line.replace(/^###\s+/, ""))}
        </h4>
      );
    }

    // Header ##
    if (line.startsWith("## ")) {
      return (
        <h3 key={index} className="font-extrabold text-sm text-slate-900 dark:text-zinc-50 mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-zinc-800/80">
          {formatInline(line.replace(/^##\s+/, ""))}
        </h3>
      );
    }

    // Header #
    if (line.startsWith("# ")) {
      return (
        <h2 key={index} className="font-black text-base text-slate-900 dark:text-zinc-50 mt-2 mb-2">
          {formatInline(line.replace(/^#\s+/, ""))}
        </h2>
      );
    }

    // Bullet item (* or -)
    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.*)/);
    if (bulletMatch) {
      const isNested = bulletMatch[1].length > 0;
      const text = bulletMatch[2];
      return (
        <div key={index} className={`flex items-start gap-2 ${isNested ? "ml-5 my-0.5" : "ml-1.5 my-1"} text-slate-700 dark:text-zinc-300`}>
          <span className={`rounded-full mt-1.5 flex-shrink-0 ${isNested ? "w-1 h-1 bg-slate-400 dark:bg-zinc-500" : "w-1.5 h-1.5 bg-blue-500"}`} />
          <span className={`flex-1 ${isNested ? "text-[11px] text-slate-600 dark:text-zinc-400" : "text-xs"} leading-relaxed`}>
            {formatInline(text)}
          </span>
        </div>
      );
    }

    // Numbered item (1. 2. etc)
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numMatch) {
      const isNested = numMatch[1].length > 0;
      return (
        <div key={index} className={`flex items-start gap-2 ${isNested ? "ml-5 my-0.5" : "ml-1 my-1"} text-slate-700 dark:text-zinc-300`}>
          <span className="font-mono text-slate-400 dark:text-zinc-500 font-bold text-xs min-w-[16px]">
            {numMatch[2]}.
          </span>
          <span className="flex-1 text-xs leading-relaxed">{formatInline(numMatch[3])}</span>
        </div>
      );
    }

    return (
      <p key={index} className="my-1 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed">
        {formatInline(line)}
      </p>
    );
  };

  // Helper to format bold, italic, code
  const formatInline = (text: string) => {
    const parts = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline Code `...`
      const codeMatch = remaining.match(/`([^`]+)`/);
      // Bold **...**
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      // Italic *...*
      const italicMatch = remaining.match(/\*([^*]+)\*/);

      // Find first occurrence
      let firstMatch: { type: "code" | "bold" | "italic"; index: number; length: number; content: string } | null = null;

      if (codeMatch && codeMatch.index !== undefined) {
        firstMatch = { type: "code", index: codeMatch.index, length: codeMatch[0].length, content: codeMatch[1] };
      }
      if (boldMatch && boldMatch.index !== undefined) {
        if (!firstMatch || boldMatch.index < firstMatch.index) {
          firstMatch = { type: "bold", index: boldMatch.index, length: boldMatch[0].length, content: boldMatch[1] };
        }
      }
      if (italicMatch && italicMatch.index !== undefined) {
        if (!firstMatch || italicMatch.index < firstMatch.index) {
          firstMatch = { type: "italic", index: italicMatch.index, length: italicMatch[0].length, content: italicMatch[1] };
        }
      }

      if (!firstMatch) {
        parts.push(<span key={keyIdx++}>{remaining}</span>);
        break;
      }

      if (firstMatch.index > 0) {
        parts.push(<span key={keyIdx++}>{remaining.slice(0, firstMatch.index)}</span>);
      }

      if (firstMatch.type === "code") {
        parts.push(
          <code key={keyIdx++} className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 font-semibold border border-slate-300/60 dark:border-zinc-700/60">
            {firstMatch.content}
          </code>
        );
      } else if (firstMatch.type === "bold") {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-900 dark:text-zinc-100">
            {firstMatch.content}
          </strong>
        );
      } else if (firstMatch.type === "italic") {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-600 dark:text-zinc-400">
            {firstMatch.content}
          </em>
        );
      }

      remaining = remaining.slice(firstMatch.index + firstMatch.length);
    }

    return parts;
  };

  return <div className="space-y-0.5">{lines.map(renderLine)}</div>;
}
