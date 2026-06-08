import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('pulse_ai.db');
    await initTables();
  }
  return db;
}

async function initTables() {
  if (!db) return;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS ai_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      week_number INTEGER NOT NULL DEFAULT 1,
      phase TEXT NOT NULL DEFAULT 'idle',
      plan_json TEXT NOT NULL,
      applied_at TEXT,
      archived_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_weekly_reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      week_number INTEGER NOT NULL,
      plan_version INTEGER NOT NULL,
      review_json TEXT NOT NULL,
      user_feedback TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_food_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      aliases TEXT DEFAULT '[]',
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      fiber REAL DEFAULT 0,
      serving_size TEXT DEFAULT '1 serving',
      serving_grams REAL DEFAULT 100,
      log_count INTEGER DEFAULT 1,
      last_logged TEXT,
      source TEXT DEFAULT 'ai'
    );
    CREATE TABLE IF NOT EXISTS food_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_name TEXT UNIQUE NOT NULL,
      aliases TEXT DEFAULT '[]',
      barcode TEXT,
      brand TEXT DEFAULT '',
      image_url TEXT,
      sugar_per_100g REAL DEFAULT 0,
      sodium_per_100g REAL DEFAULT 0,
      calories_per_100g REAL NOT NULL,
      protein_per_100g REAL NOT NULL,
      carbs_per_100g REAL NOT NULL,
      fat_per_100g REAL NOT NULL,
      fiber_per_100g REAL DEFAULT 0,
      serving_size TEXT DEFAULT '100g',
      serving_grams REAL DEFAULT 100,
      source TEXT DEFAULT 'bundled'
    );
    `);
  // ── Migrate existing food_cache table to add barcode columns ──
  try {
    await db.execAsync(`ALTER TABLE food_cache ADD COLUMN barcode TEXT`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE food_cache ADD COLUMN brand TEXT DEFAULT ''`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE food_cache ADD COLUMN image_url TEXT`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE food_cache ADD COLUMN sugar_per_100g REAL DEFAULT 0`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE food_cache ADD COLUMN sodium_per_100g REAL DEFAULT 0`);
  } catch {}
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export async function createConversation(title: string = 'New Chat'): Promise<number> {
  const database = await getDb();
  const now = new Date().toISOString();
  const result = await database.runAsync(
    'INSERT INTO conversations (title, created_at, updated_at) VALUES (?, ?, ?)',
    title, now, now
  );
  return result.lastInsertRowId;
}

export async function updateConversationTitle(id: number, title: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?',
    title, new Date().toISOString(), id
  );
}

export async function saveMessage(conversationId: number, role: 'user' | 'assistant', content: string): Promise<number> {
  const database = await getDb();
  const now = new Date().toISOString();
  const result = await database.runAsync(
    'INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)',
    conversationId, role, content, now
  );
  await database.runAsync(
    'UPDATE conversations SET updated_at = ? WHERE id = ?',
    now, conversationId
  );
  return result.lastInsertRowId;
}

export async function getConversations(): Promise<Conversation[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<Conversation>(
    'SELECT * FROM conversations ORDER BY updated_at DESC'
  );
  return rows;
}

export async function getMessagesByConversationId(conversationId: number): Promise<Message[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<Message>(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    conversationId
  );
  return rows;
}

export async function deleteConversation(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM messages WHERE conversation_id = ?', id);
  await database.runAsync('DELETE FROM conversations WHERE id = ?', id);
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export async function getCurrentConversationId(): Promise<number | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM conversations ORDER BY updated_at DESC LIMIT 1'
  );
  return row?.id ?? null;
}

export async function clearAllLocalData(): Promise<void> {
  const database = await getDb();
  await database.execAsync(`
    DELETE FROM messages;
    DELETE FROM conversations;
    DELETE FROM ai_plans;
    DELETE FROM ai_weekly_reviews;
    DELETE FROM user_food_history;
    DELETE FROM food_cache;
  `);
}
