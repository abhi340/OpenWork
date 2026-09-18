import { create } from 'zustand';
import { db, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';

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

export type NewWorkBlock = Omit<WorkBlock, 'id' | 'order_index'> & { order_index?: number };

interface WorkspaceState {
  blocks: WorkBlock[];
  activeBlockId: string | null;
  isLoading: boolean;
  fetchBlocks: () => Promise<void>;
  addBlock: (block: NewWorkBlock) => Promise<void>;
  addBlocks: (blocks: NewWorkBlock[]) => Promise<void>;
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
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
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

      // 1. Cloud Firestore query
      try {
        const blocksQuery = query(
          collection(db, "daily_blocks"),
          where("userId", "==", currentUserId)
        );
        const querySnap = await getDocs(blocksQuery);
        
        if (!querySnap.empty) {
          const fetchedBlocks: WorkBlock[] = [];
          querySnap.forEach((docSnap) => {
            const data = docSnap.data();
            fetchedBlocks.push({
              id: docSnap.id,
              type: data.type || "checklist",
              title: data.title || "Untitled Block",
              config: data.config || {},
              items: data.items || [],
              order_index: data.order_index ?? 0
            });
          });

          // Sort by order_index
          fetchedBlocks.sort((a, b) => a.order_index - b.order_index);
          set({ blocks: fetchedBlocks, isLoading: false });
          saveCachedBlocks(fetchedBlocks);
          return;
        }
      } catch (firestoreErr) {
        console.warn("Firestore fetch fallback to D1/cache:", firestoreErr);
      }

      // 2. Cloudflare D1 fallback
      try {
        const d1Res = await fetch(`/api/blocks?userId=${encodeURIComponent(currentUserId)}`);
        if (d1Res.ok) {
          const d1Data = await d1Res.json();
          if (Array.isArray(d1Data.blocks) && d1Data.blocks.length > 0) {
            set({ blocks: d1Data.blocks, isLoading: false });
            saveCachedBlocks(d1Data.blocks);
            return;
          }
        }
      } catch (d1Err) {
        // Continue to local storage
      }

      // 3. Fallback to local cached blocks
      const cached = getCachedBlocks();
      set({ blocks: cached, isLoading: false });
    } catch (err) {
      console.warn("Failed to fetch blocks:", err);
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

    // 2. Sync to Cloudflare D1
    try {
      fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: block.id,
          userId: currentUserId,
          date: targetDate,
          title: block.title,
          type: block.type,
          config: block.config || {},
          items: block.items || [],
          order_index: block.order_index
        })
      }).catch(() => {});
    } catch (e) {}

    // 3. Sync with Cloud Firestore
    try {
      const blockRef = doc(db, "daily_blocks", id);
      await setDoc(blockRef, {
        id: block.id,
        userId: currentUserId,
        date: targetDate,
        title: block.title,
        type: block.type,
        config: block.config || {},
        items: block.items || [],
        order_index: block.order_index,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not sync block creation to Cloud Firestore (saved locally):", err);
    }
  },

  addBlocks: async (newBlocks) => {
    if (!newBlocks || newBlocks.length === 0) return;
    const currentUserId = getCurrentUserId();
    const currentBlocks = get().blocks;
    const startIndex = currentBlocks.length;

    const createdBlocks: WorkBlock[] = newBlocks.map((nb, i) => {
      const id = "block_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36) + "_" + i;
      const targetDate = nb.config?.date || new Date().toISOString().split("T")[0];
      return {
        id,
        ...nb,
        order_index: startIndex + i,
        config: {
          ...nb.config,
          userId: currentUserId,
          date: targetDate
        }
      };
    });

    // 1. Single atomic optimistic update
    const nextBlocks = [...currentBlocks, ...createdBlocks];
    set({ blocks: nextBlocks });
    saveCachedBlocks(nextBlocks);

    // 2. Sync to Cloudflare D1
    for (const b of createdBlocks) {
      try {
        fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: b.id,
            userId: currentUserId,
            date: b.config.date,
            title: b.title,
            type: b.type,
            config: b.config || {},
            items: b.items || [],
            order_index: b.order_index
          })
        }).catch(() => {});
      } catch (e) {}
    }

    // 3. Sync to Cloud Firestore
    for (const b of createdBlocks) {
      try {
        const blockRef = doc(db, "daily_blocks", b.id);
        await setDoc(blockRef, {
          id: b.id,
          userId: currentUserId,
          date: b.config.date,
          title: b.title,
          type: b.type,
          config: b.config || {},
          items: b.items || [],
          order_index: b.order_index,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } catch (err) {
        console.warn("Could not sync batch block creation to Cloud Firestore:", err);
      }
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

    // 2. Sync to Cloudflare D1
    try {
      fetch(`/api/blocks?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
    } catch (e) {}

    // 3. Sync with Cloud Firestore
    try {
      const blockRef = doc(db, "daily_blocks", id);
      await deleteDoc(blockRef);
    } catch (err) {
      console.warn("Could not sync block deletion to Cloud Firestore:", err);
    }
  },

  updateBlock: async (id, updates) => {
    // 1. Optimistic local update
    const nextBlocks = get().blocks.map((b) => (b.id === id ? { ...b, ...updates } : b));
    set({ blocks: nextBlocks });
    saveCachedBlocks(nextBlocks);

    // 2. Sync to Cloudflare D1
    try {
      fetch("/api/blocks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      }).catch(() => {});
    } catch (e) {}

    // 3. Sync with Cloud Firestore
    try {
      const blockRef = doc(db, "daily_blocks", id);
      await updateDoc(blockRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (err) {
      console.warn("Could not sync block update to Cloud Firestore:", err);
    }
  },

  clearAllBlocks: async () => {
    const currentBlocks = get().blocks;
    set({ blocks: [], activeBlockId: null });
    saveCachedBlocks([]);

    for (const block of currentBlocks) {
      try {
        fetch(`/api/blocks?id=${encodeURIComponent(block.id)}`, { method: "DELETE" }).catch(() => {});
      } catch (e) {}
    }

    try {
      for (const block of currentBlocks) {
        await deleteDoc(doc(db, "daily_blocks", block.id));
      }
    } catch (err) {
      console.warn("Could not clear blocks in Firestore:", err);
    }
  },

  setActiveBlock: (id) => set({ activeBlockId: id }),

  initRealtime: () => {
    let unsubscribeFirestore: Unsubscribe | null = null;
    const currentUserId = getCurrentUserId();

    try {
      const blocksQuery = query(
        collection(db, "daily_blocks"),
        where("userId", "==", currentUserId)
      );

      unsubscribeFirestore = onSnapshot(blocksQuery, (snapshot) => {
        if (!snapshot.empty) {
          const syncedBlocks: WorkBlock[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            syncedBlocks.push({
              id: docSnap.id,
              type: data.type || "checklist",
              title: data.title || "Untitled Block",
              config: data.config || {},
              items: data.items || [],
              order_index: data.order_index ?? 0
            });
          });

          // Safe local merge: preserve any local blocks not yet reflected in Firestore
          const currentLocal = get().blocks;
          const merged = [...syncedBlocks];
          for (const localBlock of currentLocal) {
            if (!merged.some((b) => b.id === localBlock.id)) {
              merged.push(localBlock);
            }
          }
          merged.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
          set({ blocks: merged });
          saveCachedBlocks(merged);
        }
      }, (err) => {
        console.warn("Firestore realtime listener error:", err);
      });
    } catch (e) {
      console.warn("Could not initialize Firestore listener:", e);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          set({ blocks: JSON.parse(e.newValue) });
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      window.removeEventListener("storage", handleStorage);
    };
  }
}));
