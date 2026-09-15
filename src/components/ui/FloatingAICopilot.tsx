"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Settings, 
  CheckSquare, 
  CheckCircle2, 
  Loader2, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  ArrowRight, 
  Plus, 
  AlertCircle,
  Table as TableIcon,
  Clock,
  GitCommit,
  Layers,
  Wand2,
  Check,
  TrendingUp,
  Globe
} from "lucide-react";
import { useAuth, AIConfig } from "@/context/AuthContext";
import { useWorkspaceStore, BlockType } from "@/store/workspaceStore";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { sendAIChatRequest } from "@/lib/ai";
import { parseAICopilotResponse } from "@/lib/aiParser";
import Link from "next/link";

interface GeneratedBlock {
  type: BlockType;
  title: string;
  config?: any;
  items?: any[];
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  suggestedBlocks?: GeneratedBlock[];
  suggestedTasks?: string[];
  isError?: boolean;
}

export function FloatingAICopilot() {
  const { aiConfig } = useAuth();
  const { blocks, addBlock, removeBlock, clearAllBlocks } = useWorkspaceStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appliedProposalId, setAppliedProposalId] = useState<string | null>(null);

  const defaultWelcomeMessage: Message = {
    id: "welcome",
    role: "assistant",
    content: "👋 Hi! I'm your private OpenWork Copilot.\n\nI have **full authority** to build, configure, customize, and remove widgets directly on your dashboard. Tell me what workflow you want (*e.g. 'Build a cold call tracker', 'Add a daily revenue KPI', 'Remove Execution Stages', 'Delete all blocks on Sep 2'*) and I'll execute it for you in 1 click."
  };

  const [messages, setMessages] = useState<Message[]>([defaultWelcomeMessage]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Restore Chat History across page refreshes
  useEffect(() => {
    try {
      const saved = localStorage.getItem("openwork_copilot_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (e) {}
  }, []);

  // 2. Persist Chat History on change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("openwork_copilot_chat_history", JSON.stringify(messages));
      } catch (e) {}
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  const clearChat = () => {
    setMessages([defaultWelcomeMessage]);
    try {
      localStorage.removeItem("openwork_copilot_chat_history");
    } catch (e) {}
  };

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const cleanLower = textToSend.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim();

    // 1. Instant Action: Casual Greetings & Check-in
    if (["hi", "hgi", "hello", "hey", "hey there", "hola", "yo", "good morning", "good afternoon", "good evening", "what can you do", "help"].includes(cleanLower)) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "👋 Hey! I'm ready to help you organize and drive today's work.\n\nTell me what you're working on (*e.g., 'Draft founder story at 6pm', 'Add 50 cold calls goal', 'Bug triage sprint'*) or ask me to modify your board, and I'll construct it immediately."
        }
      ]);
      setIsLoading(false);
      return;
    }

    // 2. Direct Clear Board command
    if (
      cleanLower === "clear the dashboard" ||
      cleanLower === "clear dashboard" ||
      cleanLower === "clear the board" ||
      cleanLower === "clear board" ||
      cleanLower === "reset the board" ||
      cleanLower === "reset board" ||
      cleanLower === "delete all blocks" ||
      cleanLower === "delete all widgets"
    ) {
      await clearAllBlocks();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "✨ Your execution board has been completely cleared."
        }
      ]);
      setIsLoading(false);
      return;
    }

    // 3. Direct Specific Widget Removal command
    const removeKeywords = ["remove ", "delete ", "drop ", "destroy "];
    const matchKeyword = removeKeywords.find((kw) => cleanLower.startsWith(kw));
    if (matchKeyword) {
      const targetQuery = cleanLower.slice(matchKeyword.length).trim();
      const found = blocks.find((b) => 
        b.id.toLowerCase() === targetQuery || 
        b.title.toLowerCase().includes(targetQuery) ||
        b.type.toLowerCase().includes(targetQuery)
      );

      if (found) {
        await removeBlock(found.id);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `🗑️ Removed "${found.title}" from your board.`
          }
        ]);
        setIsLoading(false);
        return;
      }
    }

    // Read latest config from store or localStorage fallback
    let activeConfig: AIConfig = aiConfig;
    try {
      const saved = localStorage.getItem("openwork_ai_config");
      if (saved) {
        activeConfig = { ...aiConfig, ...JSON.parse(saved) };
      }
    } catch (e) {}

    // Build context from active board blocks
    const boardContext = blocks.length > 0 
      ? blocks.map((b) => {
          const dateTag = b.config?.date ? ` | Date: "${b.config.date}"` : " | Date: All";
          return `- ID: "${b.id}" | Title: "${b.title}" | Type: "${b.type}"${dateTag}`;
        }).join("\n")
      : "Board is currently empty.";

    const systemPrompt = `You are OpenWork Copilot — an intelligent AI productivity assistant and workspace dashboard architect.

Current Board State:
${boardContext}

COMMUNICATION RULES:
1. GENERAL CONVERSATION & QUESTIONS: If the user asks a general question, joke, explanation, advice, or casual chat (e.g. "tell me a joke", "what is this", "how to prioritize"), answer naturally, helpfully, and concisely in markdown. DO NOT output any <<<BLOCKS>>> or <<<ACTION>>> tags for normal conversation.
2. WIDGET & TASK CREATION: ONLY output <<<BLOCKS: [...]>>> when the user asks to create, add, organize, or structure tasks, goals, widgets, or workflows on their board.
3. Keep conversational replies punchy, professional, and directly useful.

DASHBOARD WIDGET ENGINES (Use ONLY when creating widgets):
- "checklist" (items: [{ id: "1", text: "Imperative task description", completed: false }])
- "counter_batch" (config: { target: number, unit: string, count: 0 })
- "timer_task" (config: { initialDuration: seconds, timeRemaining: seconds, isRunning: false })
- "metric_kpi" (config: { target: number, current: 0, prefix: "$", unit: "USD", step: 1 })
- "table" (config: { columns: ["Col1", "Col2", "Col3"] })
- "pipeline_flow" (config: { stages: ["Stage 1", "Stage 2", "Stage 3"] })
- "link_hub" (items: [{ id: "1", title: "Tool Name", url: "https://..." }])

ACTIONS (Use ONLY when modifying board):
- Clear entire board: <<<ACTION: CLEAR_BOARD>>>
- Remove widget: <<<ACTION: REMOVE_BLOCK, "block id or title">>>
- Remove date: <<<ACTION: REMOVE_DATE, "YYYY-MM-DD">>>`;

    try {
      const data = await sendAIChatRequest({
        provider: activeConfig.provider,
        apiKey: activeConfig.apiKey,
        baseUrl: activeConfig.baseUrl,
        model: activeConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          ...updatedMessages.filter((m) => m.id !== "welcome").map((m) => ({ role: m.role, content: m.content }))
        ]
      });

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `AI Error: ${data.error || "Failed to generate response."}`,
            isError: true
          }
        ]);
      } else {
        const rawReply = data.reply || "";
        const parsed = parseAICopilotResponse(rawReply, textToSend);

        // 1. Execute Actions if detected
        if (parsed.action?.type === "CLEAR_BOARD") {
          await clearAllBlocks();
        } else if (parsed.action?.type === "REMOVE_BLOCK" && parsed.action.target) {
          const target = parsed.action.target.toLowerCase();
          const found = blocks.find((b) => b.id.toLowerCase() === target || b.title.toLowerCase().includes(target) || b.type.toLowerCase().includes(target));
          if (found) {
            await removeBlock(found.id);
          }
        } else if (parsed.action?.type === "REMOVE_DATE" && parsed.action.target) {
          const targetDate = parsed.action.target;
          const matching = blocks.filter((b) => b.config?.date === targetDate);
          for (const b of matching) {
            await removeBlock(b.id);
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: parsed.cleanContent || "✨ Workspace updated successfully.",
            suggestedBlocks: parsed.suggestedBlocks,
            suggestedTasks: parsed.suggestedTasks
          }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Network error: Could not reach the AI service (${err.message}). Check your provider settings.`,
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enforce fresh state on all created blocks
  const sanitizeBlockForCreation = (b: GeneratedBlock) => {
    let config = { ...(b.config || {}) };
    let items = Array.isArray(b.items) ? [...b.items] : [];

    if (b.type === "counter_batch") {
      config = {
        ...config,
        count: 0,
        target: config.target || 10,
        unit: config.unit || "Tasks"
      };
    } else if (b.type === "timer_task") {
      const duration = config.initialDuration || config.timeRemaining || 25 * 60;
      config = {
        ...config,
        initialDuration: duration,
        timeRemaining: duration,
        isRunning: false
      };
    } else if (b.type === "metric_kpi") {
      config = {
        ...config,
        current: 0,
        target: config.target || 100,
        prefix: config.prefix || "",
        unit: config.unit || "pts",
        step: config.step || 1
      };
    } else if (b.type === "checklist") {
      items = items.map((item: any) => {
        if (typeof item === "string") {
          return { id: crypto.randomUUID(), text: item, completed: false };
        }
        return { ...item, id: item.id || crypto.randomUUID(), completed: false };
      });
    } else if (b.type === "link_hub" && items.length === 0) {
      items = [
        { id: crypto.randomUUID(), title: "Primary App Tool", url: "https://google.com" }
      ];
    }

    // Ensure daily scoped widgets receive active date stamping if not specified
    if (!config.date && ["checklist", "counter_batch", "timer_task"].includes(b.type)) {
      config.date = new Date().toISOString().split("T")[0];
    }

    return {
      title: b.title || "Custom Block",
      type: b.type || "checklist",
      config,
      items
    };
  };

  const handleApplyAllBlocks = (blocksToApply: GeneratedBlock[], msgId: string) => {
    blocksToApply.forEach((b, idx) => {
      const clean = sanitizeBlockForCreation(b);
      addBlock({
        ...clean,
        order_index: blocks.length + idx
      });
    });
    setAppliedProposalId(msgId);
    setTimeout(() => setAppliedProposalId(null), 3000);
  };

  const handleAddSingleBlock = (block: GeneratedBlock) => {
    const clean = sanitizeBlockForCreation(block);
    addBlock({
      ...clean,
      order_index: blocks.length
    });
  };

  const handleAddTasksToBoard = (tasks: string[]) => {
    addBlock({
      title: "AI Action Checklist",
      type: "checklist",
      order_index: blocks.length,
      config: { tag: "AI Generated" },
      items: tasks.map((t) => ({
        id: crypto.randomUUID(),
        text: t,
        completed: false
      }))
    });
  };


  return (
    <aside aria-label="AI Copilot Assistant">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group ring-4 ring-blue-500/10"
          title="Open AI Execution Copilot"
        >
          <Sparkles size={20} className="group-hover:rotate-12 transition-transform text-amber-300" />
          <span className="text-xs font-bold pr-1 hidden sm:inline">AI Copilot</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`fixed bottom-5 right-5 z-50 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95 ${
            isExpanded
              ? "w-[94vw] sm:w-[580px] h-[85vh]"
              : "w-[94vw] sm:w-[420px] h-[560px]"
          }`}
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/90 dark:bg-zinc-950/90 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Bot size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                    OpenWork AI Copilot
                  </h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold uppercase">
                    {aiConfig.provider}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate max-w-[190px]">
                  {aiConfig.model || (aiConfig.provider === "ollama" ? "llama3.2" : "Active Model")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="Clear Chat History"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors hidden sm:block"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
                title="AI Settings & API Keys"
              >
                <Settings size={14} />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 border-b border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/40 dark:bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => handleSend("Build a complete sales outreach dashboard with a 20-call counter, 30m sprint timer, and lead table.")}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 whitespace-nowrap transition-colors flex items-center gap-1 font-bold"
            >
              <Wand2 size={12} className="text-blue-500" />
              <span>Build Dashboard</span>
            </button>
            <button
              onClick={() => handleSend("Create a KPI goal widget for tracking $5,000 monthly revenue target.")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-rose-500 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <TrendingUp size={12} className="text-rose-500" />
              <span>+ KPI Widget</span>
            </button>
            <button
              onClick={() => handleSend("Create a quick launchpad bookmarks dock with GitHub, Figma, and Docs.")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-indigo-500 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <Globe size={12} className="text-indigo-500" />
              <span>+ Links Dock</span>
            </button>
            <button
              onClick={() => handleSend("Break down my next major goal into 5 clear actionable checklist tasks.")}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-blue-500 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <CheckSquare size={12} className="text-cyan-500" />
              <span>Checklist</span>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Message Bubble (Only render if there is text content or error) */}
                {(msg.content?.trim() || msg.isError) && (
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-xs font-medium shadow-xs"
                        : msg.isError
                        ? "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 rounded-bl-xs border border-red-200 dark:border-red-900/60"
                        : "bg-slate-100 dark:bg-zinc-800/80 text-slate-800 dark:text-zinc-200 rounded-bl-xs border border-slate-200/60 dark:border-zinc-700/60"
                    }`}
                  >
                    <MarkdownRenderer content={msg.content} isUser={msg.role === "user"} />

                    {msg.isError && (
                      <div className="mt-2 pt-2 border-t border-red-200/60 dark:border-red-900/60">
                        <Link
                          href="/settings"
                          onClick={() => setIsOpen(false)}
                          className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                        >
                          <Settings size={12} />
                          <span>Select Installed Model in Settings →</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* ⚡ Interactive Dashboard Proposal Cards */}
                {msg.suggestedBlocks && msg.suggestedBlocks.length > 0 && (
                  <div className="mt-2.5 w-full max-w-[92%] p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <Wand2 size={13} className="text-blue-500" />
                        <span>AI Generated Widgets ({msg.suggestedBlocks.length})</span>
                      </span>
                    </div>

                    {/* Widget List Preview */}
                    <div className="space-y-1.5">
                      {msg.suggestedBlocks.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {b.type === "counter_batch" && <CheckCircle2 size={14} className="text-purple-500 flex-shrink-0" />}
                            {b.type === "timer_task" && <Clock size={14} className="text-blue-500 flex-shrink-0" />}
                            {b.type === "table" && <TableIcon size={14} className="text-emerald-500 flex-shrink-0" />}
                            {b.type === "checklist" && <CheckSquare size={14} className="text-cyan-500 flex-shrink-0" />}
                            {b.type === "pipeline_flow" && <GitCommit size={14} className="text-orange-500 flex-shrink-0" />}
                            {b.type === "metric_kpi" && <TrendingUp size={14} className="text-rose-500 flex-shrink-0" />}
                            {b.type === "link_hub" && <Globe size={14} className="text-indigo-500 flex-shrink-0" />}

                            <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate text-[11px]">
                              {b.title}
                            </span>
                          </div>

                          <button
                            onClick={() => handleAddSingleBlock(b)}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white text-[10px] font-semibold text-slate-600 dark:text-zinc-400 transition-colors ml-2 flex-shrink-0"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Apply All Button */}
                    <button
                      onClick={() => handleApplyAllBlocks(msg.suggestedBlocks!, msg.id)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      {appliedProposalId === msg.id ? (
                        <>
                          <Check size={14} />
                          <span>Added to Your Board!</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>Apply & Add All {msg.suggestedBlocks.length} Widgets to Board</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Simple Checklist Tasks fallback */}
                {msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                  <div className="mt-2 pl-1">
                    <button
                      onClick={() => handleAddTasksToBoard(msg.suggestedTasks!)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Plus size={13} />
                      <span>Insert {msg.suggestedTasks.length} Tasks to My Board</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-zinc-500 p-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span>Crafting widgets and execution plan...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 'Create a KPI goal for $5k' or 'Build cold call board'..."
              className="flex-1 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-colors shadow-xs"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
