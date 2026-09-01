"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export function MarkdownRenderer({ 
  content, 
  isUser = false 
}: { 
  content: string; 
  isUser?: boolean; 
}) {
  if (!content || !content.trim()) return null;

  // Split lines
  const lines = content.split("\n");

  const renderLine = (line: string, index: number) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      return <div key={index} className="h-1.5" />;
    }

    // Horizontal Rule (---, ***, ___)
    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      return <hr key={index} className={`my-2.5 ${isUser ? "border-blue-400/40" : "border-slate-200 dark:border-zinc-800"}`} />;
    }

    // Checkbox items (- [x] or - [ ])
    const checkboxMatch = line.match(/^(\s*)[-*•]\s+\[([ xX])\]\s+(.*)/);
    if (checkboxMatch) {
      const isNested = checkboxMatch[1].length > 0;
      const isChecked = checkboxMatch[2].toLowerCase() === "x";
      const itemText = checkboxMatch[3];
      return (
        <div key={index} className={`flex items-start gap-2 ${isNested ? "my-0.5 ml-4" : "my-1 ml-1"} ${isUser ? "text-white" : "text-slate-800 dark:text-zinc-200"}`}>
          <div className="mt-0.5 flex-shrink-0">
            {isChecked ? (
              <CheckCircle2 size={14} className={isUser ? "text-white" : "text-emerald-500"} />
            ) : (
              <Circle size={14} className={isUser ? "text-blue-200" : "text-slate-400 dark:text-zinc-600"} />
            )}
          </div>
          <span className={`text-xs ${isChecked ? (isUser ? "text-white/90 font-medium" : "text-slate-700 dark:text-zinc-300 font-medium") : (isUser ? "text-white/80" : "text-slate-600 dark:text-zinc-400")}`}>
            {formatInline(itemText, isUser)}
          </span>
        </div>
      );
    }

    // Headers ####, #####, ######
    if (/^#{4,6}\s+/.test(line)) {
      const text = line.replace(/^#{4,6}\s+/, "");
      return (
        <h5 key={index} className={`font-bold text-xs ${isUser ? "text-white" : "text-slate-800 dark:text-zinc-200"} mt-2.5 mb-1`}>
          {formatInline(text, isUser)}
        </h5>
      );
    }

    // Header ###
    if (line.startsWith("### ")) {
      return (
        <h4 key={index} className={`font-bold text-sm ${isUser ? "text-white" : "text-slate-900 dark:text-zinc-100"} mt-2.5 mb-1 flex items-center gap-1.5`}>
          {formatInline(line.replace(/^###\s+/, ""), isUser)}
        </h4>
      );
    }

    // Header ##
    if (line.startsWith("## ")) {
      return (
        <h3 key={index} className={`font-bold text-sm ${isUser ? "text-white" : "text-slate-900 dark:text-zinc-100"} mt-2 mb-1`}>
          {formatInline(line.replace(/^##\s+/, ""), isUser)}
        </h3>
      );
    }

    // Header #
    if (line.startsWith("# ")) {
      return (
        <h2 key={index} className={`font-black text-base ${isUser ? "text-white" : "text-slate-900 dark:text-zinc-50"} mt-1.5 mb-1.5`}>
          {formatInline(line.replace(/^#\s+/, ""), isUser)}
        </h2>
      );
    }

    // Bullet item (* or -)
    const bulletMatch = line.match(/^(\s*)[-*•]\s+(.*)/);
    if (bulletMatch) {
      const isNested = bulletMatch[1].length > 0;
      const text = bulletMatch[2];
      return (
        <div key={index} className={`flex items-start gap-2 ${isNested ? "ml-4 my-0.5" : "ml-1 my-1"} ${isUser ? "text-white" : "text-slate-700 dark:text-zinc-300"}`}>
          <span className={`rounded-full mt-1.5 flex-shrink-0 ${isNested ? (isUser ? "w-1 h-1 bg-white/70" : "w-1 h-1 bg-slate-400 dark:bg-zinc-500") : (isUser ? "w-1.5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-blue-500")}`} />
          <span className={`flex-1 ${isNested ? (isUser ? "text-[11px] text-white/90" : "text-[11px] text-slate-600 dark:text-zinc-400") : "text-xs"} leading-relaxed`}>
            {formatInline(text, isUser)}
          </span>
        </div>
      );
    }

    // Numbered item (1. 2. etc)
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (numMatch) {
      const isNested = numMatch[1].length > 0;
      return (
        <div key={index} className={`flex items-start gap-2 ${isNested ? "ml-4 my-0.5" : "ml-1 my-1"} ${isUser ? "text-white" : "text-slate-700 dark:text-zinc-300"}`}>
          <span className={`font-mono font-bold text-xs min-w-[16px] ${isUser ? "text-white/80" : "text-slate-400 dark:text-zinc-500"}`}>
            {numMatch[2]}.
          </span>
          <span className="flex-1 text-xs leading-relaxed">{formatInline(numMatch[3], isUser)}</span>
        </div>
      );
    }

    return (
      <p key={index} className={`my-0.5 text-xs leading-relaxed ${isUser ? "text-white font-medium" : "text-slate-700 dark:text-zinc-300"}`}>
        {formatInline(line, isUser)}
      </p>
    );
  };

  // Helper to format bold, italic, code
  const formatInline = (text: string, isUserMessage: boolean = false) => {
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
          <code key={keyIdx++} className={`px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold border ${
            isUserMessage 
              ? "bg-blue-700 text-white border-blue-500/60" 
              : "bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-300/60 dark:border-zinc-700/60"
          }`}>
            {firstMatch.content}
          </code>
        );
      } else if (firstMatch.type === "bold") {
        parts.push(
          <strong key={keyIdx++} className={`font-bold ${isUserMessage ? "text-white" : "text-slate-900 dark:text-zinc-100"}`}>
            {firstMatch.content}
          </strong>
        );
      } else if (firstMatch.type === "italic") {
        parts.push(
          <em key={keyIdx++} className={`italic ${isUserMessage ? "text-white/90" : "text-slate-600 dark:text-zinc-400"}`}>
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
