import { create } from 'zustand';

export type BlockType = 
  | 'counter_batch' 
  | 'timer_task' 
  | 'table' 
  | 'checklist' 
  | 'pipeline_flow' 
  | 'rich_doc'
  | 'metric_kpi'
  | 'link_hub'
  | 'date_milestones';

export interface WorkBlock {
  id: string;
  type: BlockType;
  title: string;
  config?: any;
  items?: any[];
  order_index: number;
}

interface WorkspaceState {
  blocks: WorkBlock[];
  activeBlockId: string | null;
  isLoading: boolean;
  fetchBlocks: () => Promise<void>;
  addBlock: (block: Omit<WorkBlock, 'id'>) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  updateBlock: (id: string, updates: Partial<WorkBlock>) => Promise<void>;
  clearAllBlocks: () => Promise<void>;
  setActiveBlock: (id: string | null) => void;
  initRealtime: () => () => void;
}

// Local cache helper
const CACHE_KEY = "openwork_blocks_cache";

const getCachedBlocks = (): WorkBlock[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveCachedBlocks = (blocks: WorkBlock[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(blocks));
  } catch (e) {}
};

const getCurrentUserId = (): string => {
  if (typeof window === "undefined") return "default_user";
  try {
    const profile = localStorage.getItem("openwork_user_profile");
    if (profile) {
      const parsed = JSON.parse(profile);
      return parsed.id || parsed.email || "default_user";
    }
  } catch (e) {}
  return "default_user";
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  blocks: getCachedBlocks(),
  activeBlockId: null,
  isLoading: false,

  fetchBlocks: async () => {
    try {
      set({ isLoading: true });
      const currentUserId = getCurrentUserId();

      // Cloudflare D1 Serverless Edge API
      try {
        const res = await fetch(`/api/blocks?userId=${encodeURIComponent(currentUserId)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.blocks)) {
            set({ blocks: data.blocks, isLoading: false });
            saveCachedBlocks(data.blocks);
            return;
          }
        }
      } catch (d1Err) {}

      // Fallback to local cached blocks
      const cached = getCachedBlocks();
      set({ blocks: cached, isLoading: false });
    } catch (err) {
      console.warn("Failed to fetch blocks from Cloudflare D1:", err);
      set({ isLoading: false });
    }
  },

  addBlock: async (newBlock) => {
    const id = "block_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const order_index = get().blocks.length;
    const currentUserId = getCurrentUserId();
    const targetDate = newBlock.config?.date || new Date().toISOString().split("T")[0];

    const block: WorkBlock = {
      id,
      ...newBlock,
      order_index,
      config: {
        ...newBlock.config,
        userId: currentUserId,
        date: targetDate
      }
    };

    // 1. Optimistic local state update
    const nextBlocks = [...get().blocks, block];
    set({ blocks: nextBlocks });
    saveCachedBlocks(nextBlocks);

    // 2. Sync with Cloudflare D1
    try {
      await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: block.id,
          userId: currentUserId,
          title: block.title,
          type: block.type,
          config: block.config,
          items: block.items || [],
          order_index: block.order_index,
          date: targetDate
        })
      });
    } catch (err) {
      console.warn("Could not sync block creation to Cloudflare D1 (saved locally):", err);
    }
  },

  removeBlock: async (id) => {
    // 1. Optimistic local update
    const nextBlocks = get().blocks.filter((b) => b.id !== id);
    set({
      blocks: nextBlocks,
      activeBlockId: get().activeBlockId === id ? null : get().activeBlockId
    });
    saveCachedBlocks(nextBlocks);

    // 2. Sync with Cloudflare D1
    try {
      await fetch(`/api/blocks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn("Could not sync block deletion to Cloudflare D1:", err);
    }
  },

  updateBlock: async (id, updates) => {
    // 1. Optimistic local update
    const nextBlocks = get().blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    set({ blocks: nextBlocks });
    saveCachedBlocks(nextBlocks);

    // 2. Sync with Cloudflare D1
    try {
      await fetch('/api/blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
    } catch (err) {
      console.warn("Could not sync block update to Cloudflare D1:", err);
    }
  },

  clearAllBlocks: async () => {
    const currentUserId = getCurrentUserId();
    set({ blocks: [], activeBlockId: null });
    saveCachedBlocks([]);

    try {
      await fetch(`/api/blocks?clearAll=true&userId=${encodeURIComponent(currentUserId)}`, { method: 'DELETE' });
    } catch (err) {
      console.warn("Could not clear blocks on Cloudflare D1:", err);
    }
  },

  setActiveBlock: (id) => set({ activeBlockId: id }),

  initRealtime: () => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          set({ blocks: JSON.parse(e.newValue) });
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }
}));
