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
  setActiveBlock: (id: string | null) => void;
  initRealtime: () => () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  blocks: [],
  activeBlockId: null,
  isLoading: false,

  fetchBlocks: async () => {
    try {
      set({ isLoading: true });
      const currentUserId = pb.authStore.record?.id;
      let filter = '';
      if (currentUserId) {
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
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error('Error fetching blocks from PocketBase:', err);
      }
      set({ isLoading: false });
    }
  },

  addBlock: async (block) => {
    try {
      const currentUserId = pb.authStore.record?.id;
      const enrichedConfig = {
        ...(block.config || {}),
        ...(currentUserId ? { userId: currentUserId } : {})
      };

      const record = await pb.collection('daily_blocks').create({
        title: block.title,
        block_type: block.type,
        config: enrichedConfig,
        items: block.items || [],
        order_index: block.order_index
      }, { requestKey: null });
      
      const newBlock: WorkBlock = {
        id: record.id,
        type: record.block_type as BlockType,
        title: record.title,
        config: record.config || {},
        items: record.items || [],
        order_index: record.order_index
      };
      set((state) => {
        if (state.blocks.some((b) => b.id === newBlock.id)) return state;
        return { blocks: [...state.blocks, newBlock] };
      });
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error('Error adding block:', err);
      }
      // Fallback local addition if offline
      set((state) => ({
        blocks: [...state.blocks, { ...block, id: crypto.randomUUID() }]
      }));
    }
  },

  removeBlock: async (id) => {
    try {
      await pb.collection('daily_blocks').delete(id, { requestKey: null });
      set((state) => ({
        blocks: state.blocks.filter((b) => b.id !== id),
        activeBlockId: state.activeBlockId === id ? null : state.activeBlockId
      }));
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error('Error deleting block:', err);
      }
      set((state) => ({
        blocks: state.blocks.filter((b) => b.id !== id),
        activeBlockId: state.activeBlockId === id ? null : state.activeBlockId
      }));
    }
  },

  updateBlock: async (id, updates) => {
    // Optimistic UI update
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
    }));

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
    } catch (err: any) {
      if (!err?.isAbort) {
        console.error('Error updating block in PocketBase:', err);
      }
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
            return { blocks: [...state.blocks, newBlock] };
          });
        } else if (e.action === 'delete') {
          set((state) => ({
            blocks: state.blocks.filter((b) => b.id !== e.record.id)
          }));
        } else if (e.action === 'update') {
          set((state) => ({
            blocks: state.blocks.map((b) =>
              b.id === e.record.id
                ? {
                    ...b,
                    title: e.record.title,
                    config: e.record.config || {},
                    items: e.record.items || [],
                    order_index: e.record.order_index
                  }
                : b
            )
          }));
        }
      });

      return () => {
        pb.collection('daily_blocks').unsubscribe('*');
      };
    } catch (err) {
      console.error('Realtime subscription error:', err);
      return () => {};
    }
  }
}));
