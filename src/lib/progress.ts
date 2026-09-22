import { WorkBlock } from "@/store/workspaceStore";

export interface ProgressSummary {
  completedUnits: number;
  totalUnits: number;
  completedBlocks: number;
  totalBlocks: number;
  percentage: number;
}

export function calculateBoardProgress(blocks: WorkBlock[], currentDateStr?: string): ProgressSummary {
  if (!blocks || blocks.length === 0) {
    return {
      completedUnits: 0,
      totalUnits: 0,
      completedBlocks: 0,
      totalBlocks: 0,
      percentage: 0
    };
  }

  const todayDateStr = currentDateStr || (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  let completedUnits = 0;
  let totalUnits = 0;
  let completedBlocks = 0;
  let actionableBlocks = 0;

  for (const block of blocks) {
    if (block.type === "checklist") {
      const items = block.items || [];
      if (items.length > 0) {
        actionableBlocks++;
        const isRecurring =
          block.config?.schedule === "weekdays" ||
          block.config?.schedule === "mon-fri" ||
          block.config?.schedule === "daily" ||
          block.config?.schedule === "everyday" ||
          block.config?.date === "all" ||
          block.config?.date === "daily";

        let done = 0;
        if (isRecurring && block.config?.dailyCompletedItemIds?.[todayDateStr] !== undefined) {
          const completedIds: string[] = block.config.dailyCompletedItemIds[todayDateStr];
          done = items.filter((i: any) => completedIds.includes(i.id)).length;
        } else if (isRecurring && block.config?.lastActiveDate && block.config.lastActiveDate !== todayDateStr) {
          done = 0;
        } else {
          done = items.filter((i: any) => i.completed).length;
        }

        completedUnits += done;
        totalUnits += items.length;
        if (done === items.length) {
          completedBlocks++;
        }
      }
    } else if (block.type === "counter_batch") {
      actionableBlocks++;
      const target = Number(block.config?.target) || 5;
      let count = 0;
      if (block.config?.dailyCounts?.[todayDateStr] !== undefined) {
        count = Number(block.config.dailyCounts[todayDateStr]);
      } else if (block.config?.lastActiveDate === todayDateStr || block.config?.createdDate === todayDateStr) {
        count = Number(block.config?.count) || 0;
      } else if (!block.config?.lastActiveDate && !block.config?.createdDate && (!block.config?.dailyCounts || Object.keys(block.config.dailyCounts).length === 0)) {
        if (block.config?.date && block.config.date !== "all" && block.config.date !== "daily" && block.config.date === todayDateStr) {
          count = Number(block.config?.count) || 0;
        } else {
          count = 0;
        }
      } else {
        count = 0;
      }

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
      let current = 0;
      if (block.config?.dailyValues?.[todayDateStr] !== undefined) {
        current = Number(block.config.dailyValues[todayDateStr]);
      } else if (block.config?.lastActiveDate === todayDateStr || block.config?.createdDate === todayDateStr) {
        current = Number(block.config?.current) || 0;
      } else if (!block.config?.lastActiveDate && !block.config?.createdDate) {
        current = Number(block.config?.current) || 0;
      } else {
        current = 0;
      }
      totalUnits += 1;
      if (current >= target) {
        completedUnits += 1;
        completedBlocks++;
      }
    } else if (block.type === "timer_task") {
      actionableBlocks++;
      const isPreviousDay = block.config?.lastActiveDate && block.config.lastActiveDate !== todayDateStr;
      const timeRemaining = isPreviousDay 
        ? (Number(block.config?.initialDuration) || 1500) 
        : (Number(block.config?.timeRemaining) ?? 1500);
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
