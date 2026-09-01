// Cloudflare D1 Database Helper & Universal Driver
// Works seamlessly on Cloudflare Pages (via D1 binding) and locally with offline fallback

export interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
  dump?: () => Promise<ArrayBuffer>;
  batch?: <T = unknown>(statements: D1PreparedStatement[]) => Promise<D1Result<T>[]>;
  exec?: (query: string) => Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind: (...values: any[]) => D1PreparedStatement;
  first: <T = unknown>(colName?: string) => Promise<T | null>;
  run: <T = unknown>() => Promise<D1Result<T>>;
  all: <T = unknown>() => Promise<D1Result<T>>;
  raw: <T = unknown>() => Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: any;
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// In-Memory storage fallback for local development when not running inside Cloudflare runtime
let localBlocksMemory: any[] = [];
let localRoutinesMemory: any[] = [];

export function getD1Database(): D1Database | null {
  try {
    // 1. Cloudflare Pages / Workers environment binding
    if (typeof (globalThis as any).DB !== "undefined") {
      return (globalThis as any).DB as D1Database;
    }
    if (typeof process !== "undefined" && (process.env as any).DB) {
      return (process.env as any).DB as D1Database;
    }
  } catch (e) {}

  return null;
}

export const localStore = {
  getBlocks: () => localBlocksMemory,
  setBlocks: (blocks: any[]) => { localBlocksMemory = blocks; },
  getRoutines: () => localRoutinesMemory,
  setRoutines: (routines: any[]) => { localRoutinesMemory = routines; }
};
