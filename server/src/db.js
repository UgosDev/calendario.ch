import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'calendario.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Configurazione ad alte prestazioni e integrità ACID (Infomaniak dc4-a Ginevra)
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Schema Tabelle Sovrane
db.exec(`
CREATE TABLE IF NOT EXISTS owners (
  handle TEXT PRIMARY KEY,
  unhub_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  canton TEXT DEFAULT 'TI',
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS slot_types (
  id TEXT PRIMARY KEY,
  owner_handle TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  duration INTEGER NOT NULL,
  days_json TEXT NOT NULL,
  from_time TEXT NOT NULL,
  to_time TEXT NOT NULL,
  buffer_min INTEGER DEFAULT 15,
  horizon_days INTEGER DEFAULT 30,
  notice_hours INTEGER DEFAULT 24,
  confirm_mode TEXT DEFAULT 'auto',
  place TEXT DEFAULT 'video',
  price_chf REAL DEFAULT 0,
  active INTEGER DEFAULT 1,
  FOREIGN KEY (owner_handle) REFERENCES owners(handle) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS busy_intervals (
  id TEXT PRIMARY KEY,
  owner_handle TEXT NOT NULL,
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  FOREIGN KEY (owner_handle) REFERENCES owners(handle) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_busy_owner_date ON busy_intervals(owner_handle, date);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  owner_handle TEXT NOT NULL,
  type_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_min INTEGER NOT NULL,
  end_min INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  client_note TEXT,
  status TEXT DEFAULT 'confirmed',
  price_chf REAL DEFAULT 0,
  is_paid INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_handle) REFERENCES owners(handle) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookings_owner_date ON bookings(owner_handle, date);
`);
