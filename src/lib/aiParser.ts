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

// High-Precision Parser for OpenWork AI Copilot Responses
export function parseAICopilotResponse(rawReply: string, userPrompt = ""): ParsedAIResponse {
  if (!rawReply) {
    return { cleanContent: "" };
  }

  let text = rawReply;
  let action: ParsedAIResponse["action"] = undefined;
  let suggestedBlocks: ParsedBlock[] | undefined = undefined;

  // 1. Action Extraction
  if (text.includes("<<<ACTION: CLEAR_BOARD>>>") || text.includes("<<<ACTION:CLEAR_BOARD>>>") || text.includes("<<<BLOCKS: []>>>")) {
    action = { type: "CLEAR_BOARD" };
  }

  const removeBlockMatch = text.match(/<<<ACTION:\s*REMOVE_BLOCK\s*,\s*["']?([^"'>]+)["']?\s*>>>/i);
  if (removeBlockMatch) {
    action = { type: "REMOVE_BLOCK", target: removeBlockMatch[1].trim() };
  }

  const removeDateMatch = text.match(/<<<ACTION:\s*REMOVE_DATE\s*,\s*["']?([^"'>]+)["']?\s*>>>/i);
  if (removeDateMatch) {
    action = { type: "REMOVE_DATE", target: removeDateMatch[1].trim() };
  }

  // 2. Block Payload Extraction (<<<BLOCKS: [...]>>>)
  const blocksMatch = text.match(/<<<BLOCKS:([\s\S]*?)>>>/i);
  if (blocksMatch) {
    const rawBlockPayload = blocksMatch[1].trim();
    const parsed = sanitizeAndParseJSON<any>(rawBlockPayload);
    if (parsed) {
      const rawList = Array.isArray(parsed) ? parsed : [parsed];
      suggestedBlocks = rawList.map((item: any, idx: number) => {
        const type = normalizeBlockType(item.type || (item.config?.count !== undefined ? "counter_batch" : item.config?.timeRemaining !== undefined ? "timer_task" : item.config?.columns ? "table" : "checklist"));
        const title = item.title || `Task Block ${idx + 1}`;
        let config = { ...(item.config || {}) };
        let items = Array.isArray(item.items) ? item.items : [];

        // Normalize items for checklists
        if (type === "checklist" && items.length > 0) {
          items = items.map((it: any, i: number) => {
            if (typeof it === "string") {
              return { id: `item_${Date.now()}_${i}`, text: it, completed: false };
            }
            return {
              id: it.id || `item_${Date.now()}_${i}`,
              text: it.text || it.title || "Task item",
              completed: Boolean(it.completed)
            };
          });
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
      });
    }
  }

  // 3. Fallback Code-Fence Extraction (```json [{ "type": ... }] ```)
  if (!suggestedBlocks) {
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
            items: Array.isArray(b.items) ? b.items : []
          }));
        }
      }
    }
  }

  // 4. Sanitize User-Facing Content (ALWAYS strip internal tag structures)
  let cleanContent = text
    .replace(/<<<BLOCKS:[\s\S]*?>>>/gi, "")
    .replace(/<<<ACTION:[\s\S]*?>>>/gi, "")
    .replace(/```(?:json)?\s*\[\s*\{[\s\S]*?\}\s*\]\s*```/gi, "")
    .trim();

  // If the model only output the blocks tag without text, give a helpful default message
  if (!cleanContent && suggestedBlocks && suggestedBlocks.length > 0) {
    cleanContent = `✨ Created ${suggestedBlocks.length} widget${suggestedBlocks.length > 1 ? "s" : ""} on your dashboard.`;
  }

  // 5. Intelligent Task Bullet Suggestion (ONLY when user explicitly asked for tasks/todo/plan)
  let suggestedTasks: string[] | undefined = undefined;
  const isCreationIntent = /(?:create|add|build|make|organize|schedule|todo|tasks|sprint|plan|set up|prepare)/i.test(userPrompt);
  
  if (!suggestedBlocks && isCreationIntent && cleanContent) {
    const rawLines = cleanContent.split("\n").map((l) => l.trim());
    const taskBulletLines = rawLines
      .filter((l) => /^[-*•\d+.]\s+/.test(l) || /^\[\s*\]\s+/.test(l))
      .map((l) => l.replace(/^[-*•\d+.]\s+/, "").replace(/^\[\s*\]\s+/, "").trim())
      .filter((l) =>
        l.length >= 4 &&
        l.length <= 100 &&
        !l.endsWith("?") &&
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
