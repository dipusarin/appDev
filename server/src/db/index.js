const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data.sqlite');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS families (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    family_id TEXT NOT NULL REFERENCES families(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS babies (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES families(id),
    name TEXT NOT NULL,
    birth_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS feedings (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL REFERENCES babies(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('breast', 'bottle', 'formula')),
    amount_ml REAL,
    duration_min REAL,
    started_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS diapers (
    id TEXT PRIMARY KEY,
    baby_id TEXT NOT NULL REFERENCES babies(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL CHECK (type IN ('wet', 'dirty', 'both')),
    logged_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_feedings_baby ON feedings(baby_id, started_at DESC);
  CREATE INDEX IF NOT EXISTS idx_diapers_baby ON diapers(baby_id, logged_at DESC);
  CREATE INDEX IF NOT EXISTS idx_babies_family ON babies(family_id);
  CREATE INDEX IF NOT EXISTS idx_users_family ON users(family_id);
`);

module.exports = db;
