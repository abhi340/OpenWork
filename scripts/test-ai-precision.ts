// Comprehensive Stress Test Suite for OpenWork AI Intent & Parser Precision (Target: 99%+ Accuracy)

import { parseAICopilotResponse, normalizeBlockType, sanitizeAndParseJSON } from "../src/lib/aiParser";

interface TestCase {
  name: string;
  userPrompt: string;
  modelOutput: string;
  expected: {
    hasBlocks: boolean;
    blockType?: string;
    expectedBlockCount?: number;
    hasAction?: boolean;
    actionType?: string;
    expectedSchedule?: string;
    cleanContentShouldNotContain: string[];
    minCleanContentLength?: number;
  };
}

const testCases: TestCase[] = [
  // Category 1: Casual & Conversational (Must NOT create blocks or leak tags)
  {
    name: "Casual Joke Request",
    userPrompt: "tell me a joke",
    modelOutput: "Why don't scientists trust atoms? Because they make up everything! 😂",
    expected: {
      hasBlocks: false,
      hasAction: false,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION", "undefined"]
    }
  },
  {
    name: "Confused Model Joke with Hallucinated Blocks Tag",
    userPrompt: "tell me a joke",
    modelOutput: "Here's one: Why was the math book sad? Because it had too many problems! <<<BLOCKS: [{ id: '1', text: 'Laugh at joke' }]>>>",
    expected: {
      hasBlocks: true,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION", "id: '1'"]
    }
  },
  {
    name: "General Advice Query",
    userPrompt: "how can I improve my deep focus during coding sprints?",
    modelOutput: "Here are 3 key strategies for deep focus:\n1. Use 25-minute Pomodoro sprints\n2. Turn off notifications\n3. Keep a dedicated blocker log.",
    expected: {
      hasBlocks: false,
      hasAction: false,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Workspace State Inspection Query",
    userPrompt: "what tasks do I currently have on my board?",
    modelOutput: "You currently have 2 active checklists: 'Morning Sprint' (3 tasks remaining) and 'Product Launch' (1 task done).",
    expected: {
      hasBlocks: false,
      hasAction: false,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Conversational Question Containing Action Words",
    userPrompt: "what is the best way to organize a software team without creating too much overhead?",
    modelOutput: "A high-leverage approach is using lightweight sprint checklists paired with asynchronous blocker triage rather than long status meetings.",
    expected: {
      hasBlocks: false,
      hasAction: false,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "General Technical Explanation",
    userPrompt: "explain the difference between kanban and scrum",
    modelOutput: "Scrum operates in fixed-length iterations (sprints), while Kanban is continuous flow with Work-In-Progress (WIP) limits.",
    expected: {
      hasBlocks: false,
      hasAction: false,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },

  // Category 2: Explicit Single Widget Creation
  {
    name: "Checklist Creation with multiple tasks",
    userPrompt: "add 3 tasks: Review design specs, Write unit tests, Deploy to staging",
    modelOutput: `Got it! I've created your sprint checklist.
<<<BLOCKS: [
  {
    "type": "checklist",
    "title": "Engineering Sprint",
    "items": [
      { "id": "1", "text": "Review design specs", "completed": false },
      { "id": "2", "text": "Write unit tests", "completed": false },
      { "id": "3", "text": "Deploy to staging", "completed": false }
    ]
  }
]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "checklist",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Counter Batch Widget Creation",
    userPrompt: "create a counter for 50 customer discovery calls",
    modelOutput: `Target counter created for 50 discovery calls.
<<<BLOCKS: [
  {
    "type": "counter_batch",
    "title": "Customer Discovery Calls",
    "config": { "target": 50, "unit": "Calls" }
  }
]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Focus Sprint Timer Creation",
    userPrompt: "set up a 30 minute deep work timer",
    modelOutput: `Deep work timer initialized for 30 minutes.
<<<BLOCKS: [
  {
    "type": "timer_task",
    "title": "Deep Work Sprint",
    "config": { "minutes": 30 }
  }
]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "timer_task",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Sales Pipeline Kanban Creation",
    userPrompt: "create a lead pipeline with Lead, Qualified, Demo, Proposal, Closed Won",
    modelOutput: `Sales pipeline added to your board.
<<<BLOCKS: [
  {
    "type": "pipeline_flow",
    "title": "Enterprise Sales Pipeline",
    "config": { "stages": ["Lead", "Qualified", "Demo", "Proposal", "Closed Won"] }
  }
]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "pipeline_flow",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Metric KPI Widget Creation",
    userPrompt: "add a KPI for $25,000 monthly recurring revenue",
    modelOutput: `Revenue KPI target configured.
<<<BLOCKS: [
  {
    "type": "metric_kpi",
    "title": "Monthly Recurring Revenue",
    "config": { "target": 25000, "prefix": "$", "unit": "MRR" }
  }
]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "metric_kpi",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Data Table Grid Creation",
    userPrompt: "create a table for tracking candidates with Name, Role, Status, Notes",
    modelOutput: `Candidate evaluation table created.
<<<BLOCKS: [
  {
    "type": "table",
    "title": "Hiring Pipeline Tracker",
    "config": { "columns": ["Name", "Role", "Status", "Notes"] }
  }
]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "table",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Daily Links Dock Creation",
    userPrompt: "add a quick links dock for GitHub, Figma, and Jira",
    modelOutput: `Quick launch dock configured.
<<<BLOCKS: [
  {
    "type": "link_hub",
    "title": "Daily Developer Tools",
    "items": [
      { "id": "1", "title": "GitHub", "url": "https://github.com" },
      { "id": "2", "title": "Figma", "url": "https://figma.com" },
      { "id": "3", "title": "Jira", "url": "https://jira.atlassian.com" }
    ]
  }
]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "link_hub",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },

  // Category 3: Multi-Widget Full Cockpit Generation
  {
    name: "Multi-Widget Workspace Setup in Single Prompt",
    userPrompt: "set up my daily cockpit: 25 min timer, 50 calls counter, and morning checklist",
    modelOutput: `Your full daily execution cockpit is ready!
<<<BLOCKS: [
  { "type": "timer_task", "title": "Focus Sprint", "config": { "minutes": 25 } },
  { "type": "counter_batch", "title": "Outreach Calls", "config": { "target": 50, "unit": "calls" } },
  { "type": "checklist", "title": "Morning Routine", "items": ["Check inbox", "Review KPIs", "Team Standup"] }
]>>>`,
    expected: {
      hasBlocks: true,
      expectedBlockCount: 3,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },

  // Category 4: Edge Case LLM Outputs (Relaxed/Malformed JSON recovery)
  {
    name: "Relaxed JSON with unquoted keys and single quotes",
    userPrompt: "create a task list for bug fixes",
    modelOutput: `Done! <<<BLOCKS: [{ type: 'checklist', title: 'Bug Triage', items: ['Fix auth redirect', 'Patch CSS glitch'] }]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "checklist",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Trailing Commas in LLM JSON",
    userPrompt: "create a counter for 10 pull requests",
    modelOutput: `Counter created. <<<BLOCKS: [{"type": "counter_batch", "title": "PR Reviews", "config": {"target": 10, "unit": "PRs",},}]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "LLM Outputs Raw JSON Code Fence instead of tag",
    userPrompt: "build me a table for tracking candidates",
    modelOutput: `Here is your candidate tracker table:
\`\`\`json
[
  {
    "type": "table",
    "title": "Candidate Pipeline",
    "config": { "columns": ["Candidate Name", "Role", "Interview Stage", "Rating"] }
  }
]
\`\`\``,
    expected: {
      hasBlocks: true,
      blockType: "table",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["```json", "```"]
    }
  },
  {
    name: "Informal Block Type Alias Normalization (todo -> checklist)",
    userPrompt: "make a todo list for release",
    modelOutput: `<<<BLOCKS: [{"type": "todo", "title": "Release Prep", "items": ["Tag v1.0", "Release Notes"]}]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "checklist",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Informal Block Type Alias Normalization (kanban -> pipeline_flow)",
    userPrompt: "create a kanban board",
    modelOutput: `<<<BLOCKS: [{"type": "kanban", "title": "Sprint Flow", "config": {"stages": ["Backlog", "Active", "Done"]}}]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "pipeline_flow",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Informal Block Type Alias Normalization (pomodoro -> timer_task)",
    userPrompt: "set up a pomodoro",
    modelOutput: `<<<BLOCKS: [{"type": "pomodoro", "title": "Pomodoro Focus", "config": {"minutes": 25}}]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "timer_task",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },

  // Category 5: Board Actions & Modifications
  {
    name: "Clear Entire Board Action",
    userPrompt: "clear the board",
    modelOutput: "Board wiped clean. <<<ACTION: CLEAR_BOARD>>>",
    expected: {
      hasBlocks: false,
      hasAction: true,
      actionType: "CLEAR_BOARD",
      cleanContentShouldNotContain: ["<<<ACTION", "<<<BLOCKS"]
    }
  },
  {
    name: "Remove Specific Block Action",
    userPrompt: "delete the cold calls counter",
    modelOutput: "Removed the counter block. <<<ACTION: REMOVE_BLOCK, 'Customer Discovery Calls'>>>",
    expected: {
      hasBlocks: false,
      hasAction: true,
      actionType: "REMOVE_BLOCK",
      cleanContentShouldNotContain: ["<<<ACTION", "<<<BLOCKS"]
    }
  },
  {
    name: "Remove Date Specific Widgets Action",
    userPrompt: "remove all tasks for 2026-09-15",
    modelOutput: "Cleared all items scheduled for 2026-09-15. <<<ACTION: REMOVE_DATE, '2026-09-15'>>>",
    expected: {
      hasBlocks: false,
      hasAction: true,
      actionType: "REMOVE_DATE",
      cleanContentShouldNotContain: ["<<<ACTION", "<<<BLOCKS"]
    }
  },

  // Category 7: Local Model Pseudocode Resilience & Deterministic Fallback
  {
    name: "User Prompt Timer with Model Markdown Pseudocode (The Exact User Issue)",
    userPrompt: "add a 25 min timer for bug fixing",
    modelOutput: `Timer: Bug Fixing Session

Config:
\`\`\`markdown
timer_task
* config:
  * initialDuration: 25m
  * timeRemaining: 25m
  * isRunning: false
\`\`\`

Start Timer
To start the timer, simply say "Start bug fixing timer". Once you've completed the task, you can stop the timer by saying "Stop bug fixing timer".`,
    expected: {
      hasBlocks: true,
      blockType: "timer_task",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Model Outputs Conversational Confirmation for Counter without Tags",
    userPrompt: "add a counter for 50 outreach calls",
    modelOutput: "I have created an outreach calls tracker targeting 50 calls for your sprint today.",
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Model Outputs Conversational Confirmation for KPI without Tags",
    userPrompt: "create a KPI goal for $10,000 monthly revenue",
    modelOutput: "Configured your monthly revenue target goal for $10,000.",
    expected: {
      hasBlocks: true,
      blockType: "metric_kpi",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Model Hallucinates Config Keys Inside Checklist Items",
    userPrompt: "create sprint checklist",
    modelOutput: `<<<BLOCKS: [
      {
        "type": "checklist",
        "title": "Engineering Sprint",
        "items": [
          "config:",
          "initialDuration: 25m",
          "Deploy hotfix to production",
          "Verify telemetry charts"
        ]
      }
    ]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "checklist",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["config:", "initialDuration"]
    }
  },
  {
    name: "Unbracketed Multiple BLOCKS Payload Recovery",
    userPrompt: "add 2 counters",
    modelOutput: `Here are your two counters:
<<<BLOCKS: {"type": "counter_batch", "title": "ProptechBuzz Jobs", "config": {"target": 10}}, {"type": "counter_batch", "title": "WildlifeBuzz Jobs", "config": {"target": 10}}>>>`,
    expected: {
      hasBlocks: true,
      expectedBlockCount: 2,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Multiple Separate BLOCKS Tags in Single Output",
    userPrompt: "add a timer and a counter",
    modelOutput: `Added both tools for you:
<<<BLOCKS: [{"type": "timer_task", "title": "Sprint Timer"}]>>>
<<<BLOCKS: [{"type": "counter_batch", "title": "Review Counter"}]>>>`,
    expected: {
      hasBlocks: true,
      expectedBlockCount: 2,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Deterministic Multi-Counter Request with 2 Entities",
    userPrompt: "add 2 counters: WildlifeBuzz and ProptechBuzz",
    modelOutput: "Sure! I have prepared the counters for WildlifeBuzz and ProptechBuzz.",
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 2,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Deterministic Comparative Widget Request (the same for ProptechBuzz)",
    userPrompt: "i am unable to add the same for ProptechBuzz",
    modelOutput: "I'll add the same counter for ProptechBuzz now.",
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Weekday Mon-Fri Recurring Widget Creation Request",
    userPrompt: "create a widget for WildlifeBuzz that should be displayed every mon to fri",
    modelOutput: `Created your WildlifeBuzz counter for Monday to Friday.
<<<BLOCKS: [{"type": "counter_batch", "title": "WildlifeBuzz Jobs", "config": {"target": 10, "unit": "Jobs", "schedule": "weekdays", "date": "all"}}]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 1,
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "Widget Target Modification Action (UPDATE_BLOCK)",
    userPrompt: "change target of ProptechBuzz to 25",
    modelOutput: `Updated ProptechBuzz target to 25. <<<ACTION: UPDATE_BLOCK, "ProptechBuzz", {"config": {"target": 25}}>>>`,
    expected: {
      hasBlocks: false,
      hasAction: true,
      actionType: "UPDATE_BLOCK",
      cleanContentShouldNotContain: ["<<<ACTION", "<<<BLOCKS"]
    }
  },
  {
    name: "Widget Renaming Action (UPDATE_BLOCK)",
    userPrompt: "rename WildlifeBuzz Jobs to WildlifeBuzz Outreach",
    modelOutput: `Renamed block to WildlifeBuzz Outreach. <<<ACTION: UPDATE_BLOCK, "WildlifeBuzz Jobs", {"title": "WildlifeBuzz Outreach"}>>>`,
    expected: {
      hasBlocks: false,
      hasAction: true,
      actionType: "UPDATE_BLOCK",
      cleanContentShouldNotContain: ["<<<ACTION", "<<<BLOCKS"]
    }
  },
  {
    name: "Deterministic Fallback for Updating Widget Schedule to Mon to Fri",
    userPrompt: "set WildlifeBuzz to repeat every mon to fri",
    modelOutput: "WildlifeBuzz has been configured to repeat Monday to Friday.",
    expected: {
      hasBlocks: false,
      hasAction: true,
      actionType: "UPDATE_BLOCK",
      cleanContentShouldNotContain: ["<<<ACTION", "<<<BLOCKS"]
    }
  },
  {
    name: "User Exact Prompt: 10 jobs on proptechbuzz everyday Monday to Friday (LLM Payload)",
    userPrompt: "i need to post 10 jobs on proptechbuzz everyday from everyday Monday to Friday",
    modelOutput: `Created your ProptechBuzz counter to post 10 jobs every day, Monday to Friday.
<<<BLOCKS: [{"type": "counter_batch", "title": "ProptechBuzz Jobs", "config": {"target": 10, "unit": "jobs"}}]>>>`,
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 1,
      expectedSchedule: "weekdays",
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  },
  {
    name: "User Exact Prompt: 10 jobs on proptechbuzz everyday Monday to Friday (Deterministic Fallback)",
    userPrompt: "i need to post 10 jobs on proptechbuzz everyday from everyday Monday to Friday",
    modelOutput: "Sure! I'll help you track posting 10 jobs every Monday to Friday on Proptechbuzz.",
    expected: {
      hasBlocks: true,
      blockType: "counter_batch",
      expectedBlockCount: 1,
      expectedSchedule: "weekdays",
      cleanContentShouldNotContain: ["<<<BLOCKS", "<<<ACTION"]
    }
  }
];

// Run the comprehensive stress suite
async function runSuite() {
  console.log("==========================================================");
  console.log("🧪 OPENWORK AI PARSER & INTENT STRESS TEST SUITE");
  console.log("==========================================================\n");

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const res = parseAICopilotResponse(tc.modelOutput, tc.userPrompt);
    let testPassed = true;
    const errors: string[] = [];

    // Check blocks presence
    if (tc.expected.hasBlocks && (!res.suggestedBlocks || res.suggestedBlocks.length === 0)) {
      testPassed = false;
      errors.push(`Expected blocks but found none.`);
    }
    if (!tc.expected.hasBlocks && res.suggestedBlocks && res.suggestedBlocks.length > 0) {
      testPassed = false;
      errors.push(`Expected NO blocks but found ${res.suggestedBlocks.length}.`);
    }

    // Check block count
    if (tc.expected.expectedBlockCount && res.suggestedBlocks?.length !== tc.expected.expectedBlockCount) {
      testPassed = false;
      errors.push(`Expected ${tc.expected.expectedBlockCount} blocks but got ${res.suggestedBlocks?.length}.`);
    }

    // Check block type
    if (tc.expected.blockType && res.suggestedBlocks?.[0]?.type !== tc.expected.blockType) {
      testPassed = false;
      errors.push(`Expected block type "${tc.expected.blockType}" but got "${res.suggestedBlocks?.[0]?.type}".`);
    }

    // Check schedule
    if (tc.expected.expectedSchedule && res.suggestedBlocks?.[0]?.config?.schedule !== tc.expected.expectedSchedule) {
      testPassed = false;
      errors.push(`Expected schedule "${tc.expected.expectedSchedule}" but got "${res.suggestedBlocks?.[0]?.config?.schedule}".`);
    }

    // Check action
    if (tc.expected.hasAction && !res.action) {
      testPassed = false;
      errors.push(`Expected action "${tc.expected.actionType}" but found none.`);
    }
    if (tc.expected.actionType && res.action?.type !== tc.expected.actionType) {
      testPassed = false;
      errors.push(`Expected action type "${tc.expected.actionType}" but got "${res.action?.type}".`);
    }

    // Check clean content sanitization
    for (const forbidden of tc.expected.cleanContentShouldNotContain) {
      if (res.cleanContent.includes(forbidden)) {
        testPassed = false;
        errors.push(`Clean content leaked forbidden string "${forbidden}": "${res.cleanContent}"`);
      }
    }

    if (testPassed) {
      passed++;
      console.log(`✅ [PASS] #${String(i + 1).padStart(2, "0")}: ${tc.name}`);
    } else {
      failed++;
      console.log(`❌ [FAIL] #${String(i + 1).padStart(2, "0")}: ${tc.name}`);
      errors.forEach((e) => console.log(`   ↳ Error: ${e}`));
    }
  }

  const accuracy = ((passed / testCases.length) * 100).toFixed(1);
  console.log("\n==========================================================");
  console.log(`📊 STRESS RESULTS: ${passed}/${testCases.length} Passed (${accuracy}% Accuracy)`);
  console.log("==========================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite();
