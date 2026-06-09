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
    CREATE TABLE IF NOT EXISTS food_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      image_uri TEXT NOT NULL,
      food_name TEXT,
      calories REAL,
      meal_type TEXT,
      scanned_at TEXT NOT NULL
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
    CREATE TABLE IF NOT EXISTS barcode_scan_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT NOT NULL,
      food_name TEXT NOT NULL,
      brand TEXT DEFAULT '',
      image_url TEXT,
      calories_100g REAL NOT NULL DEFAULT 0,
      protein_100g REAL NOT NULL DEFAULT 0,
      carbs_100g REAL NOT NULL DEFAULT 0,
      fat_100g REAL NOT NULL DEFAULT 0,
      fiber_100g REAL DEFAULT 0,
      sugar_100g REAL DEFAULT 0,
      sodium_100g REAL DEFAULT 0,
      serving_size TEXT DEFAULT '100g',
      scanned_at TEXT NOT NULL,
      source TEXT DEFAULT 'open_food_facts'
    );
    CREATE TABLE IF NOT EXISTS _meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
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
  // ── Migration v2: purge stale AI cache entries with wrong per-100g values ──
  try {
    const meta = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'cache_schema_version'"
    );
    if (!meta || parseInt(meta.value) < 2) {
      await db.runAsync("DELETE FROM food_cache WHERE source NOT IN ('bundled')");
      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('cache_schema_version', '2')"
      );
    }
  } catch {}
  // ── Migration v3: add last_grams_used and last_meal_type to user_food_history ──
  try {
    await db.execAsync(`ALTER TABLE user_food_history ADD COLUMN last_grams_used REAL DEFAULT 100`);
  } catch {}
  try {
    await db.execAsync(`ALTER TABLE user_food_history ADD COLUMN last_meal_type TEXT DEFAULT 'snack'`);
  } catch {}
  // ── Migration v4: food database system (foods, food_servings, user_custom_foods, saved_meals, recent_foods, FTS5) ──
  try {
    const meta = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    );
    const ver = meta ? parseInt(meta.value) : 1;
    if (ver < 4) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          canonical_name TEXT NOT NULL UNIQUE,
          brand_name TEXT DEFAULT '',
          barcode TEXT,
          category TEXT DEFAULT '',
          verified INTEGER DEFAULT 0,
          source TEXT DEFAULT 'bundled',
          calories_per_100g REAL NOT NULL,
          protein_per_100g REAL NOT NULL,
          carbs_per_100g REAL NOT NULL,
          fat_per_100g REAL NOT NULL,
          fiber_per_100g REAL DEFAULT 0,
          sugar_per_100g REAL DEFAULT 0,
          sodium_per_100g REAL DEFAULT 0,
          serving_size TEXT DEFAULT '100g',
          serving_grams REAL DEFAULT 100,
          aliases TEXT DEFAULT '[]',
          search_terms TEXT DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS food_servings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL,
          serving_name TEXT NOT NULL,
          grams REAL,
          ml REAL,
          household_measure INTEGER DEFAULT 0,
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS user_custom_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          brand TEXT DEFAULT '',
          calories_per_100g REAL NOT NULL DEFAULT 0,
          protein_per_100g REAL NOT NULL DEFAULT 0,
          carbs_per_100g REAL NOT NULL DEFAULT 0,
          fat_per_100g REAL NOT NULL DEFAULT 0,
          fiber_per_100g REAL DEFAULT 0,
          sugar_per_100g REAL DEFAULT 0,
          sodium_per_100g REAL DEFAULT 0,
          serving_size TEXT DEFAULT '1 serving',
          serving_grams REAL DEFAULT 100,
          is_recipe INTEGER DEFAULT 0,
          recipe_json TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS saved_meals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          meal_name TEXT NOT NULL,
          meal_type TEXT DEFAULT 'snack',
          total_calories REAL DEFAULT 0,
          total_protein REAL DEFAULT 0,
          total_carbs REAL DEFAULT 0,
          total_fat REAL DEFAULT 0,
          is_favorite INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE TABLE IF NOT EXISTS saved_meal_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          meal_id INTEGER NOT NULL,
          food_id INTEGER,
          custom_food_id INTEGER,
          food_name TEXT NOT NULL,
          quantity REAL NOT NULL DEFAULT 100,
          unit TEXT DEFAULT 'g',
          calories REAL NOT NULL DEFAULT 0,
          protein REAL NOT NULL DEFAULT 0,
          carbs REAL NOT NULL DEFAULT 0,
          fat REAL NOT NULL DEFAULT 0,
          fiber REAL DEFAULT 0,
          FOREIGN KEY (meal_id) REFERENCES saved_meals(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS recent_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          food_id INTEGER,
          food_name TEXT NOT NULL,
          calories_per_100g REAL NOT NULL,
          protein_per_100g REAL NOT NULL,
          carbs_per_100g REAL NOT NULL,
          fat_per_100g REAL NOT NULL,
          fiber_per_100g REAL DEFAULT 0,
          serving_size TEXT DEFAULT '100g',
          serving_grams REAL DEFAULT 100,
          last_quantity REAL DEFAULT 100,
          last_unit TEXT DEFAULT 'g',
          last_meal_type TEXT DEFAULT 'snack',
          log_count INTEGER DEFAULT 1,
          last_logged TEXT NOT NULL DEFAULT (datetime('now')),
          source TEXT DEFAULT 'bundled',
          UNIQUE(user_id, food_name)
        );
      `);
      // Create FTS5 index (may fail if FTS5 not available, catch gracefully)
      try {
        await db.execAsync(`
          CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
            canonical_name, brand_name, aliases, search_terms, category,
            content='foods',
            content_rowid='id'
          );
        `);
      } catch (e) {
        console.warn('[db] FTS5 not available, using LIKE-based search fallback');
      }
      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '4')"
      );
    }
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
