// OpenWork High-Precision AI Intent & Block Parser Engine
// Designed for 99%+ accuracy across small local models (LLaMA 3.2 3B) and large cloud models (GPT-4o, Groq 70B, Gemini 2.0)

import { BlockType } from "@/store/workspaceStore";

export interface ParsedBlock {
  type: BlockType;
  title: string;
  config?: Record<string, any>;
  items?: any[];
}

export interface ParsedAIResponse {
  cleanContent: string;
  suggestedBlocks?: ParsedBlock[];
  action?: {
    type: "CLEAR_BOARD" | "REMOVE_BLOCK" | "REMOVE_DATE";
    target?: string;
  };
  suggestedTasks?: string[];
}

// Normalizes informal model block types to standard OpenWork BlockTypes
export function normalizeBlockType(rawType: string): BlockType {
  const t = (rawType || "").toLowerCase().trim();
  if (t === "checklist" || t === "todo" || t === "todos" || t === "task" || t === "tasks" || t === "task_list") {
    return "checklist";
  }
  if (t === "counter_batch" || t === "counter" || t === "batch" || t === "counter_task" || t === "tracker") {
    return "counter_batch";
  }
  if (t === "timer_task" || t === "timer" || t === "pomodoro" || t === "focus_timer" || t === "stopwatch") {
    return "timer_task";
  }
  if (t === "metric_kpi" || t === "metric" || t === "kpi" || t === "goal" || t === "revenue") {
    return "metric_kpi";
  }
  if (t === "table" || t === "data_table" || t === "grid" || t === "sheet") {
    return "table";
  }
  if (t === "pipeline_flow" || t === "pipeline" || t === "kanban" || t === "flow" || t === "funnel") {
    return "pipeline_flow";
  }
  if (t === "link_hub" || t === "links" || t === "bookmarks" || t === "dock" || t === "resources") {
    return "link_hub";
  }
  if (t === "date_milestones" || t === "date" || t === "schedule" || t === "milestones" || t === "calendar") {
    return "date_milestones";
  }
  return "checklist";
}

// Resilient JSON cleaner for LLM outputs (handles single quotes, trailing commas, unquoted keys)
export function sanitizeAndParseJSON<T = any>(rawJson: string): T | null {
  if (!rawJson) return null;
  const clean = rawJson.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(clean);
  } catch (e) {}

  // 2. Fix relaxed JSON syntax
  try {
    let fixed = clean
      // Replace single quotes around keys or values with double quotes
      .replace(/'(?=(?:[^"]*"[^"]*")*[^"]*$)/g, '"')
      // Remove trailing commas before closing braces or brackets
      .replace(/,\s*([\]}])/g, "$1")
      // Quote unquoted keys (e.g. { title: "Test" } -> { "title": "Test" })
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    return JSON.parse(fixed);
  } catch (e) {}

  return null;
}

// Check if a text item looks like raw schema / config pseudocode rather than a human task
function isJunkConfigItem(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase().trim();
  return (
    lower.startsWith("config:") ||
    lower.startsWith("initialduration") ||
    lower.startsWith("timeremaining") ||
    lower.startsWith("isrunning") ||
    lower.startsWith("target:") ||
    lower.startsWith("unit:") ||
    lower.startsWith("type:") ||
    lower.startsWith("stages:") ||
    lower.startsWith("columns:") ||
    lower.includes("timer_task") ||
    lower.includes("counter_batch") ||
    lower.includes("metric_kpi") ||
    lower.includes("pipeline_flow") ||
    lower.includes("link_hub") ||
    lower.includes("```") ||
    lower === "{" ||
    lower === "}" ||
    lower === "[" ||
    lower === "]"
  );
}

// Deterministic extractor that detects explicit widget creation requests from the user prompt or model text
export function extractDeterministicBlocks(userPrompt: string, modelOutput = ""): ParsedBlock[] | null {
  const combined = `${userPrompt} ${modelOutput}`.toLowerCase();
  const promptLower = userPrompt.toLowerCase();

  // Guard: Casual conversation / questions must NOT trigger deterministic block creation
  const isQuestionOrChat = /^(?:tell me|what is|how do|why |can you explain|explain|who is|joke|help\b|hi\b|hello\b|hey\b)/i.test(userPrompt.trim());
  const hasCreationKeyword = /(?:add|create|build|make|set up|setup|start|track|insert|generate|new)\b/i.test(promptLower);

  if (isQuestionOrChat && !hasCreationKeyword) {
    return null;
  }

  // 1. TIMER / POMODORO / STOPWATCH
  const isTimerRequest = /(?:timer|pomodoro|stopwatch|focus\s*sprint|focus\s*session)/i.test(promptLower) ||
    /\b\d+\s*(?:min|minute|m|hour|hr)s?\s*(?:timer|sprint|focus)\b/i.test(promptLower);

  if (isTimerRequest) {
    // Extract duration
    let durationSeconds = 25 * 60; // default 25 min
    const hourMatch = combined.match(/(\d+)\s*(?:hour|hours|hr|hrs|h\b)/i);
    const minMatch = combined.match(/(\d+)\s*(?:min|mins|minute|minutes|m\b)/i);
    const secMatch = combined.match(/(\d+)\s*(?:sec|secs|second|seconds|s\b)/i);

    if (hourMatch) {
      durationSeconds = parseInt(hourMatch[1], 10) * 3600;
    } else if (minMatch) {
      durationSeconds = parseInt(minMatch[1], 10) * 60;
    } else if (secMatch) {
      durationSeconds = parseInt(secMatch[1], 10);
    }

    // Extract title (e.g. "for bug fixing" -> "Bug Fixing", "deep work" -> "Deep Work")
    let title = "Focus Sprint Timer";
    const forMatch = userPrompt.match(/(?:for|on|named|called)\s+([^,.\n]+)/i);
    if (forMatch) {
      const candidate = forMatch[1].replace(/(?:timer|session|task)/gi, "").trim();
      if (candidate.length > 1) {
        title = candidate.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    } else {
      const cleanPrompt = userPrompt.replace(/(?:add|create|set up|setup|a|an|\d+|min|mins|minutes|minute|hour|hours|timer|pomodoro|stopwatch)/gi, "").trim();
      if (cleanPrompt.length >= 3) {
        title = cleanPrompt.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }

    return [{
      type: "timer_task",
      title: title.endsWith("Timer") ? title : `${title} Timer`,
      config: {
        initialDuration: durationSeconds,
        timeRemaining: durationSeconds,
        isRunning: false
      }
    }];
  }

  // 2. COUNTER / BATCH TRACKER
  const isCounterRequest = /(?:counter|tally|batch\s*tracker|call\s*tracker)/i.test(promptLower) ||
    /\b\d+\s*(?:calls|leads|tickets|prs|tasks|reps|outreach|emails)\b/i.test(promptLower);

  if (isCounterRequest && hasCreationKeyword) {
    let target = 20;
    let unit = "calls";
    const targetMatch = combined.match(/(\d+)\s*([a-zA-Z]+)?/);
    if (targetMatch) {
      target = parseInt(targetMatch[1], 10);
      if (targetMatch[2] && !["min", "mins", "minute", "minutes", "hour", "hours", "sec"].includes(targetMatch[2].toLowerCase())) {
        unit = targetMatch[2].toLowerCase();
      }
    }

    let title = `${unit.charAt(0).toUpperCase() + unit.slice(1)} Tracker`;
    const forMatch = userPrompt.match(/(?:for|on|named|called)\s+([^,.\n]+)/i);
    if (forMatch) {
      const candidate = forMatch[1].replace(/(?:counter|tracker|batch)/gi, "").trim();
      if (candidate.length > 1) {
        title = candidate.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }

    return [{
      type: "counter_batch",
      title: title.endsWith("Tracker") || title.endsWith("Counter") ? title : `${title} Tracker`,
      config: {
        target,
        unit,
        count: 0
      }
    }];
  }

  // 3. METRIC KPI GOAL
  const isKpiRequest = /(?:kpi|metric|revenue|mrr|arr|\$\s*\d+|\d+\s*k\s*(?:revenue|mrr|goal))/i.test(promptLower);
  if (isKpiRequest && hasCreationKeyword) {
    let target = 10000;
    let prefix = "";
    let unit = "USD";

    if (combined.includes("$") || combined.includes("revenue") || combined.includes("mrr") || combined.includes("arr")) {
      prefix = "$";
    }

    const moneyMatch = combined.match(/\$\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m|b)?/i) || combined.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(k|m|b)?\s*(?:revenue|mrr|arr|dollars)/i);
    if (moneyMatch) {
      let num = parseFloat(moneyMatch[1].replace(/,/g, ""));
      const mult = (moneyMatch[2] || "").toLowerCase();
      if (mult === "k") num *= 1000;
      if (mult === "m") num *= 1000000;
      if (mult === "b") num *= 1000000000;
      target = num;
    }

    return [{
      type: "metric_kpi",
      title: "Revenue Target",
      config: {
        target,
        current: 0,
        prefix,
        unit: prefix === "$" ? "" : unit,
        step: 1
      }
    }];
  }

  // 4. PIPELINE / KANBAN FLOW
  const isPipelineRequest = /(?:pipeline|kanban|funnel|workflow\s*stages)/i.test(promptLower);
  if (isPipelineRequest && hasCreationKeyword) {
    let stages = ["Lead", "Qualified", "Demo", "Proposal", "Closed Won"];
    if (promptLower.includes("dev") || promptLower.includes("bug") || promptLower.includes("feature")) {
      stages = ["Backlog", "In Progress", "Code Review", "QA", "Deployed"];
    }

    return [{
      type: "pipeline_flow",
      title: "Execution Pipeline",
      config: {
        stages
      }
    }];
  }

  // 5. DATA TABLE / GRID
  const isTableRequest = /(?:table|data\s*grid|spreadsheet|sheet)/i.test(promptLower);
  if (isTableRequest && hasCreationKeyword) {
    return [{
      type: "table",
      title: "Workspace Table",
      config: {
        columns: ["Item / Lead", "Owner", "Status", "Notes"]
      }
    }];
  }

  // 6. LINK HUB / BOOKMARKS DOCK
  const isLinkRequest = /(?:links\s*dock|bookmarks|quick\s*launch|link\s*hub)/i.test(promptLower);
  if (isLinkRequest && hasCreationKeyword) {
    return [{
      type: "link_hub",
      title: "Quick Launch Dock",
      items: [
        { id: "1", title: "GitHub", url: "https://github.com" },
        { id: "2", title: "Figma", url: "https://figma.com" },
        { id: "3", title: "Docs", url: "https://docs.google.com" }
      ]
    }];
  }

  return null;
}

// High-Precision Parser for OpenWork AI Copilot Responses
export function parseAICopilotResponse(rawReply: string, userPrompt = ""): ParsedAIResponse {
  if (!rawReply) {
    return { cleanContent: "" };
  }

  let text = rawReply;
  let action: ParsedAIResponse["action"] = undefined;
  let suggestedBlocks: ParsedBlock[] | undefined = undefined;

  // 1. Action Extraction
  if (text.includes("<<<ACTION: CLEAR_BOARD") || text.includes("<<<ACTION:CLEAR_BOARD") || text.includes("<<<BLOCKS: []")) {
    action = { type: "CLEAR_BOARD" };
  }

  const removeBlockMatch = text.match(/<<<ACTION:\s*REMOVE_BLOCK\s*,\s*["']?([^"'>]+)["']?\s*(?:>+)/i);
  if (removeBlockMatch) {
    action = { type: "REMOVE_BLOCK", target: removeBlockMatch[1].trim() };
  }

  const removeDateMatch = text.match(/<<<ACTION:\s*REMOVE_DATE\s*,\s*["']?([^"'>]+)["']?\s*(?:>+)/i);
  if (removeDateMatch) {
    action = { type: "REMOVE_DATE", target: removeDateMatch[1].trim() };
  }

  // 2. Block Payload Extraction (<<<BLOCKS: [...]>>>)
  const blocksMatch = text.match(/<<<BLOCKS:([\s\S]*?)(?:>>>|>>|>|$)/i);
  if (blocksMatch) {
    const rawBlockPayload = blocksMatch[1].trim();
    const parsed = sanitizeAndParseJSON<any>(rawBlockPayload);
    if (parsed) {
      const rawList = Array.isArray(parsed) ? parsed : [parsed];
      suggestedBlocks = rawList
        .map((item: any, idx: number) => {
          const type = normalizeBlockType(item.type || (item.config?.count !== undefined ? "counter_batch" : item.config?.timeRemaining !== undefined ? "timer_task" : item.config?.columns ? "table" : "checklist"));
          const title = item.title || `Task Block ${idx + 1}`;
          let config = { ...(item.config || {}) };
          let items = Array.isArray(item.items) ? item.items : [];

          // Normalize items for checklists and filter out junk config lines
          if (type === "checklist" && items.length > 0) {
            items = items
              .map((it: any, i: number) => {
                if (typeof it === "string") {
                  return { id: `item_${Date.now()}_${i}`, text: it, completed: false };
                }
                return {
                  id: it.id || `item_${Date.now()}_${i}`,
                  text: it.text || it.title || "Task item",
                  completed: Boolean(it.completed)
                };
              })
              .filter((it: any) => !isJunkConfigItem(it.text));
          }

          // Normalize counter config
          if (type === "counter_batch") {
            config = {
              target: typeof config.target === "number" ? config.target : 10,
              unit: config.unit || "tasks",
              count: 0
            };
          }

          // Normalize timer config
          if (type === "timer_task") {
            const duration = (config.minutes ? config.minutes * 60 : config.initialDuration || config.timeRemaining || 25 * 60);
            config = {
              initialDuration: duration,
              timeRemaining: duration,
              isRunning: false
            };
          }

          // Normalize KPI config
          if (type === "metric_kpi") {
            config = {
              target: typeof config.target === "number" ? config.target : 100,
              current: 0,
              prefix: config.prefix || "",
              unit: config.unit || "",
              step: config.step || 1
            };
          }

          // Normalize table config
          if (type === "table") {
            config = {
              columns: Array.isArray(config.columns) && config.columns.length > 0 ? config.columns : ["Task / Lead", "Owner", "Status"]
            };
          }

          // Normalize pipeline config
          if (type === "pipeline_flow") {
            config = {
              stages: Array.isArray(config.stages) && config.stages.length > 0 ? config.stages : ["To Do", "In Progress", "Done"]
            };
          }

          return {
            type,
            title,
            config,
            items
          };
        })
        // Filter out checklists that ended up empty or purely junk
        .filter((b) => b.type !== "checklist" || (b.items && b.items.length > 0) || !isJunkConfigItem(b.title));
    }
  }

  // 3. Fallback Code-Fence Extraction (```json [{ "type": ... }] ```)
  if (!suggestedBlocks || suggestedBlocks.length === 0) {
    const jsonFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (jsonFenceMatch) {
      const parsed = sanitizeAndParseJSON<any>(jsonFenceMatch[1]);
      if (parsed) {
        const rawList = Array.isArray(parsed) ? parsed : [parsed];
        const validBlocks = rawList.filter((b) => b && (b.type || b.title || b.items || b.config));
        if (validBlocks.length > 0) {
          suggestedBlocks = validBlocks.map((b, i) => ({
            type: normalizeBlockType(b.type || "checklist"),
            title: b.title || `Block ${i + 1}`,
            config: b.config || {},
            items: Array.isArray(b.items) ? b.items.filter((it: any) => !isJunkConfigItem(typeof it === "string" ? it : it.text)) : []
          }));
        }
      }
    }
  }

  // 4. Deterministic Intent Fallback (Catches local LLM pseudocode and ensures exact widget creation)
  if (!suggestedBlocks || suggestedBlocks.length === 0) {
    const deterministic = extractDeterministicBlocks(userPrompt, rawReply);
    if (deterministic && deterministic.length > 0) {
      suggestedBlocks = deterministic;
    }
  }

  // 5. Sanitize User-Facing Content (ALWAYS strip internal tag structures)
  let cleanContent = text
    .replace(/<<<BLOCKS:[\s\S]*?(?:>+|$)/gi, "")
    .replace(/<<<ACTION:[\s\S]*?(?:>+|$)/gi, "")
    .replace(/```(?:json)?\s*\[\s*\{[\s\S]*?\}\s*\]\s*```/gi, "")
    .trim();

  // If the model only output the blocks tag without text, give a helpful default message
  if (!cleanContent && suggestedBlocks && suggestedBlocks.length > 0) {
    cleanContent = `✨ Created ${suggestedBlocks.length} widget${suggestedBlocks.length > 1 ? "s" : ""} on your dashboard.`;
  }

  // 6. Intelligent Task Bullet Suggestion (ONLY when user explicitly asked for tasks/todo/checklist and NO other widget type was requested)
  let suggestedTasks: string[] | undefined = undefined;
  const isExplicitTaskRequest = /(?:checklist|todo|todos|task list|action items|steps to|plan for)/i.test(userPrompt);
  const isNonChecklistWidget = /(?:timer|pomodoro|counter|tally|kpi|pipeline|kanban|table|links dock|bookmarks)/i.test(userPrompt);
  
  if (!suggestedBlocks && isExplicitTaskRequest && !isNonChecklistWidget && cleanContent) {
    const rawLines = cleanContent.split("\n").map((l) => l.trim());
    const taskBulletLines = rawLines
      .filter((l) => /^[-*•\d+.]\s+/.test(l) || /^\[\s*\]\s+/.test(l))
      .map((l) => l.replace(/^[-*•\d+.]\s+/, "").replace(/^\[\s*\]\s+/, "").trim())
      .filter((l) =>
        l.length >= 4 &&
        l.length <= 100 &&
        !l.endsWith("?") &&
        !isJunkConfigItem(l) &&
        !/^(it sounds|to confirm|also|why not|would you|here is|i'd like|sorry|sure|note|tip)/i.test(l)
      );

    if (taskBulletLines.length >= 2 && taskBulletLines.length <= 8) {
      suggestedTasks = taskBulletLines;
    }
  }

  return {
    cleanContent,
    suggestedBlocks,
    action,
    suggestedTasks
  };
}

