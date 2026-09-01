import { WorkBlock } from "@/store/workspaceStore";

export interface ProgressSummary {
  completedUnits: number;
  totalUnits: number;
  completedBlocks: number;
  totalBlocks: number;
  percentage: number;
}

export function calculateBoardProgress(blocks: WorkBlock[]): ProgressSummary {
  if (!blocks || blocks.length === 0) {
    return {
      completedUnits: 0,
      totalUnits: 0,
      completedBlocks: 0,
      totalBlocks: 0,
      percentage: 0
    };
  }

  let completedUnits = 0;
  let totalUnits = 0;
  let completedBlocks = 0;
  let actionableBlocks = 0;

  for (const block of blocks) {
    if (block.type === "checklist") {
      const items = block.items || [];
      if (items.length > 0) {
        actionableBlocks++;
        const done = items.filter((i: any) => i.completed).length;
        completedUnits += done;
        totalUnits += items.length;
        if (done === items.length) {
          completedBlocks++;
        }
      }
    } else if (block.type === "counter_batch") {
      actionableBlocks++;
      const target = Number(block.config?.target) || 5;
      const count = Number(block.config?.count) || 0;
      totalUnits += target;
      completedUnits += Math.min(count, target);
      if (count >= target) {
        completedBlocks++;
      }
    } else if (block.type === "date_milestones") {
      const items = block.items || [];
      if (items.length > 0) {
        actionableBlocks++;
        const done = items.filter((i: any) => i.completed).length;
        completedUnits += done;
        totalUnits += items.length;
        if (done === items.length) {
          completedBlocks++;
        }
      }
    } else if (block.type === "pipeline_flow") {
      const items = block.items || [];
      if (items.length > 0) {
        actionableBlocks++;
        const done = items.filter((i: any) => 
          (i.stage || "").toLowerCase() === "done" || 
          (i.stage || "").toLowerCase() === "completed"
        ).length;
        completedUnits += done;
        totalUnits += items.length;
        if (done === items.length) {
          completedBlocks++;
        }
      }
    } else if (block.type === "metric_kpi") {
      actionableBlocks++;
      const target = Number(block.config?.target) || 100;
      const current = Number(block.config?.current) || 0;
      totalUnits += 1;
      if (current >= target) {
        completedUnits += 1;
        completedBlocks++;
      }
    } else if (block.type === "timer_task") {
      actionableBlocks++;
      const timeRemaining = Number(block.config?.timeRemaining) ?? 1500;
      totalUnits += 1;
      if (timeRemaining === 0) {
        completedUnits += 1;
        completedBlocks++;
      }
    }
  }

  // If there are no sub-units, fallback to completedBlocks / actionableBlocks
  const finalTotal = totalUnits > 0 ? totalUnits : actionableBlocks;
  const finalCompleted = totalUnits > 0 ? completedUnits : completedBlocks;
  const percentage = finalTotal > 0 ? Math.round((finalCompleted / finalTotal) * 100) : 0;

  return {
    completedUnits: finalCompleted,
    totalUnits: finalTotal,
    completedBlocks,
    totalBlocks: actionableBlocks,
    percentage: Math.min(100, Math.max(0, percentage))
  };
}
