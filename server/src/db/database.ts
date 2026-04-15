import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/dashboard.db');

// 确保 data 目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// 开启 WAL 模式，提升并发读性能
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// 初始化表结构
db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- AI 模型表
  CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    input_price REAL NOT NULL DEFAULT 0,
    cached_price REAL DEFAULT 0,
    output_price REAL NOT NULL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Token 使用记录表
  CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    requests INTEGER DEFAULT 0,
    input_tokens INTEGER DEFAULT 0,
    cached_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    actual_cost REAL DEFAULT 0,
    standard_cost REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_id, date),
    FOREIGN KEY(model_id) REFERENCES models(id)
  );
`);

// ─── 辅助函数（封装成 better-sqlite3 风格，方便迁移）──────────────
export function prepare(sql: string) {
  const stmt = db.prepare(sql);
  return {
    run: (...params: unknown[]) => stmt.run(...params as Parameters<typeof stmt.run>),
    get: (...params: unknown[]) => stmt.get(...params as Parameters<typeof stmt.get>),
    all: (...params: unknown[]) => stmt.all(...params as Parameters<typeof stmt.all>),
  };
}

export function exec(sql: string) {
  db.exec(sql);
}

export default { prepare, exec };
