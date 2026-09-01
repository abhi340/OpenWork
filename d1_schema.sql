-- OpenWork Cloudflare D1 Database Schema
-- Run with: npx wrangler d1 execute openwork-db --file=./d1_schema.sql

-- 1. Users & Worker Profile
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'worker',
    avatar_url TEXT DEFAULT '',
    job_title TEXT DEFAULT '',
    work_hours TEXT DEFAULT '9:00 AM – 6:00 PM',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Daily Execution Blocks
CREATE TABLE IF NOT EXISTS daily_blocks (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT DEFAULT '{}',      -- JSON stringified block config
    items TEXT DEFAULT '[]',       -- JSON stringified block items
    order_index INTEGER DEFAULT 0,
    date TEXT DEFAULT '',          -- Date-scoped execution (YYYY-MM-DD)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Routine Templates
CREATE TABLE IF NOT EXISTS routines (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    name TEXT NOT NULL,
    blocks TEXT NOT NULL,          -- JSON array of routine block templates
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Audit & Proof of Work Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default_user',
    action TEXT NOT NULL,
    metadata TEXT DEFAULT '{}',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries (< 5ms)
CREATE INDEX IF NOT EXISTS idx_blocks_user ON daily_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_blocks_date ON daily_blocks(date);
CREATE INDEX IF NOT EXISTS idx_routines_user ON routines(user_id);
