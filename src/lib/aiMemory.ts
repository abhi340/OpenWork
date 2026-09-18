// OpenWork Lightweight AI Copilot Auto-Learning & Preference Memory
// Automatically adapts to user habits, repeated workflows, preferred targets, and schedules
// Zero DB overhead - stores learned patterns locally in browser localStorage

const MEMORY_KEY = "openwork_ai_memory";

export interface WidgetPattern {
  count: number;
  lastUsed: string;
  type?: string;
  defaultTarget?: number;
  defaultUnit?: string;
  schedule?: string;
}

export interface AIMemoryState {
  frequentWidgets: Record<string, WidgetPattern>;
  preferredTimerDuration?: number; // in seconds
  preferredSchedule?: "weekdays" | "daily";
  learnedRules: string[];
}

const defaultMemory: AIMemoryState = {
  frequentWidgets: {
    "WildlifeBuzz Jobs": { count: 3, lastUsed: new Date().toISOString(), type: "counter_batch", defaultTarget: 10, defaultUnit: "Jobs", schedule: "weekdays" },
    "ProptechBuzz Jobs": { count: 3, lastUsed: new Date().toISOString(), type: "counter_batch", defaultTarget: 10, defaultUnit: "Jobs", schedule: "weekdays" }
  },
  preferredTimerDuration: 1500, // 25 min default
  preferredSchedule: "weekdays",
  learnedRules: [
    "User frequently works with WildlifeBuzz Jobs and ProptechBuzz Jobs (target 10)",
    "User prefers Mon-Fri weekday scheduling for operational batch counters"
  ]
};

export function getAIMemory(): AIMemoryState {
  if (typeof window === "undefined") return defaultMemory;
  try {
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultMemory,
        ...parsed,
        frequentWidgets: { ...defaultMemory.frequentWidgets, ...(parsed.frequentWidgets || {}) },
        learnedRules: Array.from(new Set([...(defaultMemory.learnedRules || []), ...(parsed.learnedRules || [])]))
      };
    }
  } catch (e) {}
  return defaultMemory;
}

export function saveAIMemory(memory: AIMemoryState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (e) {}
}

export function recordWidgetCreation(widget: { title: string; type: string; config?: any }) {
  try {
    const memory = getAIMemory();
    const title = widget.title.trim();
    const existing = memory.frequentWidgets[title] || { count: 0, lastUsed: new Date().toISOString() };

    existing.count = (existing.count || 0) + 1;
    existing.lastUsed = new Date().toISOString();
    existing.type = widget.type;
    if (widget.config?.target !== undefined) existing.defaultTarget = widget.config.target;
    if (widget.config?.unit) existing.defaultUnit = widget.config.unit;
    if (widget.config?.schedule) existing.schedule = widget.config.schedule;

    memory.frequentWidgets[title] = existing;

    // Check if user has recurring habit
    if (widget.config?.schedule === "weekdays" || widget.config?.days === "mon-fri") {
      memory.preferredSchedule = "weekdays";
      const rule = `User scheduled "${title}" for Monday to Friday (weekdays)`;
      if (!memory.learnedRules.includes(rule)) {
        memory.learnedRules.push(rule);
      }
    }

    if (widget.type === "timer_task" && widget.config?.initialDuration) {
      memory.preferredTimerDuration = widget.config.initialDuration;
    }

    saveAIMemory(memory);
  } catch (e) {}
}

export function recordWidgetUpdate(title: string, updates: any) {
  try {
    const memory = getAIMemory();
    const existing = memory.frequentWidgets[title];
    if (existing) {
      if (updates.config?.target !== undefined) existing.defaultTarget = updates.config.target;
      if (updates.config?.unit) existing.defaultUnit = updates.config.unit;
      if (updates.config?.schedule) existing.schedule = updates.config.schedule;
      existing.lastUsed = new Date().toISOString();
      memory.frequentWidgets[title] = existing;
      saveAIMemory(memory);
    }
  } catch (e) {}
}

export function recordLearnedInstruction(instruction: string) {
  try {
    const memory = getAIMemory();
    if (instruction && !memory.learnedRules.includes(instruction)) {
      memory.learnedRules.push(instruction);
      if (memory.learnedRules.length > 20) {
        memory.learnedRules.shift();
      }
      saveAIMemory(memory);
    }
  } catch (e) {}
}

export function getAIMemoryPromptSummary(): string {
  const memory = getAIMemory();
  const topWidgets = Object.entries(memory.frequentWidgets)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data]) => {
      const details = [];
      if (data.defaultTarget) details.push(`target: ${data.defaultTarget} ${data.defaultUnit || ""}`.trim());
      if (data.schedule) details.push(`schedule: ${data.schedule}`);
      return `- "${name}" (${data.type || "widget"}${details.length ? `, ${details.join(", ")}` : ""})`;
    });

  const parts = [];
  if (topWidgets.length > 0) {
    parts.push(`Frequent User Widgets:\n${topWidgets.join("\n")}`);
  }
  if (memory.learnedRules && memory.learnedRules.length > 0) {
    parts.push(`Learned Habits & Preferences:\n${memory.learnedRules.slice(-4).map(r => `- ${r}`).join("\n")}`);
  }
  if (memory.preferredSchedule) {
    parts.push(`Default Recurrence Preference: ${memory.preferredSchedule} (Monday to Friday)`);
  }

  return parts.length > 0 ? parts.join("\n\n") : "No previous patterns recorded.";
}
