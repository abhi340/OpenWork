import { create } from 'zustand';
import { pb } from '@/lib/pocketbase';

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

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  blocks: getCachedBlocks(),
  activeBlockId: null,
  isLoading: false,

  fetchBlocks: async () => {
    try {
      set({ isLoading: true });
      const currentUserId = pb.authStore.record?.id || "default_user";

      // 1. Try Cloudflare D1 Serverless API
      try {
        const res = await fetch(`/api/blocks?userId=${encodeURIComponent(currentUserId)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.blocks) && data.blocks.length > 0) {
            set({ blocks: data.blocks, isLoading: false });
            saveCachedBlocks(data.blocks);
            return;
          }
        }
      } catch (d1Err) {}

      // 2. Fallback to PocketBase if available
      let filter = '';
      if (currentUserId && currentUserId !== "default_user") {
        filter = `config.userId = "${currentUserId}" || config.userId = null || config.userId = ""`;
      }

      const records = await pb.collection('daily_blocks').getFullList({
        sort: 'order_index',
        filter: filter || undefined,
        requestKey: null
      });

      const formatted: WorkBlock[] = records.map((r: any) => ({
        id: r.id,
        type: r.block_type as BlockType,
        title: r.title,
        config: r.config || {},
        items: r.items || [],
        order_index: r.order_index || 0
      }));

      set({ blocks: formatted, isLoading: false });
      saveCachedBlocks(formatted);
    } catch (err: any) {
      // 3. Fallback to LocalStorage cache
      const cached = getCachedBlocks();
      set({ blocks: cached, isLoading: false });
    }
  },

  addBlock: async (block) => {
    const newId = crypto.randomUUID();
    const currentUserId = pb.authStore.record?.id || "default_user";
    const enrichedConfig = {
      ...(block.config || {}),
      userId: currentUserId
    };

    const newBlock: WorkBlock = {
      id: newId,
      type: block.type,
      title: block.title,
      config: enrichedConfig,
      items: block.items || [],
      order_index: block.order_index
    };

    // Optimistic UI Update
    const updated = [...get().blocks, newBlock];
    set({ blocks: updated });
    saveCachedBlocks(updated);

    // 1. Sync with Cloudflare D1 API
    try {
      await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBlock,
          userId: currentUserId
        })
      });
    } catch (e) {}

    // 2. Sync with PocketBase if connected
    try {
      await pb.collection('daily_blocks').create({
        id: newId,
        title: block.title,
        block_type: block.type,
        config: enrichedConfig,
        items: block.items || [],
        order_index: block.order_index
      }, { requestKey: null });
    } catch (err: any) {}
  },

  removeBlock: async (id) => {
    // Optimistic UI Update
    const updated = get().blocks.filter((b) => b.id !== id);
    set({
      blocks: updated,
      activeBlockId: get().activeBlockId === id ? null : get().activeBlockId
    });
    saveCachedBlocks(updated);

    // 1. Sync with Cloudflare D1 API
    try {
      await fetch(`/api/blocks?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}

    // 2. Sync with PocketBase
    try {
      await pb.collection('daily_blocks').delete(id, { requestKey: null });
    } catch (err: any) {}
  },

  updateBlock: async (id, updates) => {
    // Optimistic UI update
    const updated = get().blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    set({ blocks: updated });
    saveCachedBlocks(updated);

    // 1. Sync with Cloudflare D1 API
    try {
      await fetch('/api/blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
    } catch (e) {}

    // 2. Sync with PocketBase
    try {
      const current = get().blocks.find((b) => b.id === id);
      if (current) {
        await pb.collection('daily_blocks').update(id, {
          title: updates.title ?? current.title,
          config: updates.config ?? current.config,
          items: updates.items ?? current.items,
          order_index: updates.order_index ?? current.order_index
        }, { requestKey: null });
      }
    } catch (err: any) {}
  },

  clearAllBlocks: async () => {
    const currentBlocks = get().blocks;
    set({ blocks: [], activeBlockId: null });
    saveCachedBlocks([]);

    // 1. Sync with Cloudflare D1 API
    try {
      await fetch('/api/blocks?clearAll=true', { method: 'DELETE' });
    } catch (e) {}

    // 2. Sync with PocketBase
    for (const b of currentBlocks) {
      try {
        await pb.collection('daily_blocks').delete(b.id, { requestKey: null });
      } catch (e) {}
    }
  },

  setActiveBlock: (id) => set({ activeBlockId: id }),

  initRealtime: () => {
    try {
      pb.collection('daily_blocks').subscribe('*', (e) => {
        if (e.action === 'create') {
          const newBlock: WorkBlock = {
            id: e.record.id,
            type: e.record.block_type as BlockType,
            title: e.record.title,
            config: e.record.config || {},
            items: e.record.items || [],
            order_index: e.record.order_index || 0
          };
          set((state) => {
            if (state.blocks.some((b) => b.id === newBlock.id)) return state;
            const next = [...state.blocks, newBlock];
            saveCachedBlocks(next);
            return { blocks: next };
          });
        } else if (e.action === 'delete') {
          set((state) => {
            const next = state.blocks.filter((b) => b.id !== e.record.id);
            saveCachedBlocks(next);
            return { blocks: next };
          });
        } else if (e.action === 'update') {
          set((state) => {
            const next = state.blocks.map((b) =>
              b.id === e.record.id
                ? {
                    ...b,
                    title: e.record.title,
                    config: e.record.config || {},
                    items: e.record.items || [],
                    order_index: e.record.order_index
                  }
                : b
            );
            saveCachedBlocks(next);
            return { blocks: next };
          });
        }
      });

      return () => {
        pb.collection('daily_blocks').unsubscribe('*');
      };
    } catch (err) {
      return () => {};
    }
  }
}));

