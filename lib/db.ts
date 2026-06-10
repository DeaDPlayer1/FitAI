import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const d = await SQLite.openDatabaseAsync('pulse_ai.db');
        db = d;
        try { await d.execAsync('PRAGMA journal_mode = WAL'); } catch {}
        try { await d.execAsync('PRAGMA synchronous = NORMAL'); } catch {}
        try { await d.execAsync('PRAGMA cache_size = -8000'); } catch {}
        try { await d.execAsync('PRAGMA temp_store = MEMORY'); } catch {}
        try { await d.execAsync('PRAGMA foreign_keys = ON'); } catch {}
        await initTables();
        dbInitPromise = null;
        return d;
      } catch (e: any) {
        lastErr = e;
        console.error(`[db] open/init attempt ${attempt + 1} failed:`, e?.message);
        try { db?.closeSync(); } catch {}
        try { db?.closeAsync(); } catch {}
        db = null;
        // Delete the corrupted database file and retry
        try {
          await SQLite.deleteDatabaseAsync('pulse_ai.db');
        } catch {}
      }
    }
    dbInitPromise = null;
    throw lastErr || new Error('[db] failed to initialize after 3 attempts');
  })();

  return dbInitPromise;
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
  try { await db.execAsync(`ALTER TABLE food_cache ADD COLUMN barcode TEXT`); } catch {}
  try { await db.execAsync(`ALTER TABLE food_cache ADD COLUMN brand TEXT DEFAULT ''`); } catch {}
  try { await db.execAsync(`ALTER TABLE food_cache ADD COLUMN image_url TEXT`); } catch {}
  try { await db.execAsync(`ALTER TABLE food_cache ADD COLUMN sugar_per_100g REAL DEFAULT 0`); } catch {}
  try { await db.execAsync(`ALTER TABLE food_cache ADD COLUMN sodium_per_100g REAL DEFAULT 0`); } catch {}
  // ── Migration v2: purge stale AI cache entries ──
  try {
    const meta2 = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'cache_schema_version'"
    );
    if (!meta2 || parseInt(meta2.value) < 2) {
      await db.runAsync("DELETE FROM food_cache WHERE source NOT IN ('bundled')");
      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('cache_schema_version', '2')"
      );
    }
  } catch {}
  // ── Migration v3: add last_grams_used and last_meal_type to user_food_history ──
  try { await db.execAsync(`ALTER TABLE user_food_history ADD COLUMN last_grams_used REAL DEFAULT 100`); } catch {}
  try { await db.execAsync(`ALTER TABLE user_food_history ADD COLUMN last_meal_type TEXT DEFAULT 'snack'`); } catch {}
  // ── Migration v4: food database system ──
  try {
    const meta4 = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    );
    const ver4 = meta4 ? parseInt(meta4.value) : 1;
    if (ver4 < 4) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          canonical_name TEXT NOT NULL UNIQUE,
          brand_name TEXT DEFAULT '',
          barcode TEXT,
          category TEXT DEFAULT '',
          cuisine TEXT DEFAULT '',
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
          popularity_score REAL DEFAULT 0,
          image_url TEXT DEFAULT '',
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
      try {
        await db.execAsync(`
          CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
            canonical_name, brand_name, aliases, search_terms, category, cuisine,
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

  // ── Migration v5: Global food database expansion ──
  try {
    const meta5 = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    );
    const ver5 = meta5 ? parseInt(meta5.value) : 4;
    if (ver5 < 5) {
      await db.execAsync(`
        -- Food aliases with language support
        CREATE TABLE IF NOT EXISTS food_aliases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL,
          alias TEXT NOT NULL COLLATE NOCASE,
          language TEXT DEFAULT 'en',
          is_regional INTEGER DEFAULT 0,
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Food brands
        CREATE TABLE IF NOT EXISTS food_brands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          logo_url TEXT DEFAULT '',
          website TEXT DEFAULT '',
          country TEXT DEFAULT '',
          is_verified INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Restaurant menus
        CREATE TABLE IF NOT EXISTS restaurant_menus (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL,
          restaurant_name TEXT NOT NULL COLLATE NOCASE,
          cuisine TEXT DEFAULT '',
          country TEXT DEFAULT '',
          menu_category TEXT DEFAULT '',
          price REAL DEFAULT 0,
          currency TEXT DEFAULT 'USD',
          is_verified INTEGER DEFAULT 0,
          serving_size TEXT DEFAULT '',
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Food categories hierarchy
        CREATE TABLE IF NOT EXISTS food_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          parent_id INTEGER,
          description TEXT DEFAULT '',
          icon TEXT DEFAULT '',
          sort_order INTEGER DEFAULT 0,
          FOREIGN KEY (parent_id) REFERENCES food_categories(id)
        );

        -- Food images
        CREATE TABLE IF NOT EXISTS food_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL,
          url TEXT NOT NULL,
          thumbnail_url TEXT DEFAULT '',
          source TEXT DEFAULT 'web',
          is_primary INTEGER DEFAULT 0,
          width INTEGER DEFAULT 0,
          height INTEGER DEFAULT 0,
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Food barcodes (1:N mapping for multi-packs)
        CREATE TABLE IF NOT EXISTS food_barcodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT NOT NULL UNIQUE,
          food_id INTEGER NOT NULL,
          package_size TEXT DEFAULT '',
          package_grams REAL DEFAULT 0,
          country TEXT DEFAULT '',
          is_active INTEGER DEFAULT 1,
          last_scanned TEXT,
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Food verification tracking
        CREATE TABLE IF NOT EXISTS verified_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL UNIQUE,
          verified_by TEXT DEFAULT 'system',
          verification_method TEXT DEFAULT 'database',
          verified_at TEXT NOT NULL DEFAULT (datetime('now')),
          confidence_score REAL DEFAULT 1.0,
          source_url TEXT DEFAULT '',
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Nutrition change history
        CREATE TABLE IF NOT EXISTS food_nutrition_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL,
          field_name TEXT NOT NULL,
          old_value REAL,
          new_value REAL NOT NULL,
          changed_by TEXT DEFAULT 'system',
          changed_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- User food ratings
        CREATE TABLE IF NOT EXISTS user_food_ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          food_id INTEGER NOT NULL,
          rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
          review TEXT DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(user_id, food_id),
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- User food favorites
        CREATE TABLE IF NOT EXISTS user_food_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          food_id INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(user_id, food_id),
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Trending foods
        CREATE TABLE IF NOT EXISTS food_trending (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          food_id INTEGER NOT NULL UNIQUE,
          trend_score REAL DEFAULT 0,
          daily_log_count INTEGER DEFAULT 0,
          weekly_log_count INTEGER DEFAULT 0,
          monthly_log_count INTEGER DEFAULT 0,
          last_trending_date TEXT,
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- User search history
        CREATE TABLE IF NOT EXISTS user_search_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          query TEXT NOT NULL,
          selected_food_id INTEGER,
          is_voice INTEGER DEFAULT 0,
          searched_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (selected_food_id) REFERENCES foods(id) ON DELETE SET NULL
        );

        -- Meal templates
        CREATE TABLE IF NOT EXISTS meal_templates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          meal_type TEXT DEFAULT 'snack',
          goal_type TEXT DEFAULT 'general',
          total_calories REAL DEFAULT 0,
          total_protein REAL DEFAULT 0,
          total_carbs REAL DEFAULT 0,
          total_fat REAL DEFAULT 0,
          is_public INTEGER DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS meal_template_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id INTEGER NOT NULL,
          food_id INTEGER,
          food_name TEXT NOT NULL,
          quantity REAL NOT NULL DEFAULT 100,
          unit TEXT DEFAULT 'g',
          calories REAL NOT NULL DEFAULT 0,
          protein REAL NOT NULL DEFAULT 0,
          carbs REAL NOT NULL DEFAULT 0,
          fat REAL NOT NULL DEFAULT 0,
          FOREIGN KEY (template_id) REFERENCES meal_templates(id) ON DELETE CASCADE
        );

        -- Food substitution pairs (AI-powered)
        CREATE TABLE IF NOT EXISTS food_substitutions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          original_food_id INTEGER NOT NULL,
          substitute_food_id INTEGER NOT NULL,
          reason TEXT DEFAULT '',
          similarity_score REAL DEFAULT 0,
          is_healthier INTEGER DEFAULT 0,
          FOREIGN KEY (original_food_id) REFERENCES foods(id) ON DELETE CASCADE,
          FOREIGN KEY (substitute_food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Food intake recommendations
        CREATE TABLE IF NOT EXISTS food_recommendations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          goal_type TEXT NOT NULL,
          food_id INTEGER NOT NULL,
          priority INTEGER DEFAULT 0,
          reason TEXT DEFAULT '',
          FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
        );

        -- Admin audit log
        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_id TEXT NOT NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id INTEGER,
          details TEXT DEFAULT '',
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      // Create indexes for performance
      try {
        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_food_aliases_alias ON food_aliases(alias);
          CREATE INDEX IF NOT EXISTS idx_food_aliases_food_id ON food_aliases(food_id);
          CREATE INDEX IF NOT EXISTS idx_food_brands_name ON food_brands(name);
          CREATE INDEX IF NOT EXISTS idx_restaurant_menus_restaurant ON restaurant_menus(restaurant_name);
          CREATE INDEX IF NOT EXISTS idx_restaurant_menus_cuisine ON restaurant_menus(cuisine);
          CREATE INDEX IF NOT EXISTS idx_food_barcodes_code ON food_barcodes(barcode);
          CREATE INDEX IF NOT EXISTS idx_food_images_food_id ON food_images(food_id);
          CREATE INDEX IF NOT EXISTS idx_user_food_favorites_user ON user_food_favorites(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_food_ratings_food ON user_food_ratings(food_id);
          CREATE INDEX IF NOT EXISTS idx_food_trending_score ON food_trending(trend_score DESC);
          CREATE INDEX IF NOT EXISTS idx_user_search_history_user ON user_search_history(user_id);
          CREATE INDEX IF NOT EXISTS idx_user_search_history_query ON user_search_history(query);
          CREATE INDEX IF NOT EXISTS idx_meal_templates_user ON meal_templates(user_id);
          CREATE INDEX IF NOT EXISTS idx_food_substitutions_original ON food_substitutions(original_food_id);
          CREATE INDEX IF NOT EXISTS idx_food_recommendations_goal ON food_recommendations(goal_type);
          CREATE INDEX IF NOT EXISTS idx_admin_audit_log_action ON admin_audit_log(action);
        `);
      } catch {}

      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '5')"
      );
    }
  } catch {}

  // ── Migration v6: Global food database columns ──
  try {
    const meta6 = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    );
    const ver6 = meta6 ? parseInt(meta6.value) : 5;
    if (ver6 < 6) {
      // Add display_name for better search display
      try { await db.execAsync(`ALTER TABLE foods ADD COLUMN display_name TEXT DEFAULT ''`); } catch {}
      try { await db.execAsync(`ALTER TABLE foods ADD COLUMN base_serving_amount REAL DEFAULT 100`); } catch {}
      try { await db.execAsync(`ALTER TABLE foods ADD COLUMN base_serving_unit TEXT DEFAULT 'g'`); } catch {}
      try { await db.execAsync(`ALTER TABLE foods ADD COLUMN base_serving_description TEXT DEFAULT ''`); } catch {}

      // Add is_default to food_servings for serving priority
      try { await db.execAsync(`ALTER TABLE food_servings ADD COLUMN is_default INTEGER DEFAULT 0`); } catch {}
      try { await db.execAsync(`ALTER TABLE food_servings ADD COLUMN serving_description TEXT DEFAULT ''`); } catch {}
      try { await db.execAsync(`ALTER TABLE food_servings ADD COLUMN amount_in_grams REAL DEFAULT 100`); } catch {}

      // Rebuild FTS index with display_name included
      try {
        await db.execAsync(`DROP TABLE IF EXISTS foods_fts`);
      } catch {}
      try {
        await db.execAsync(`
          CREATE VIRTUAL TABLE IF NOT EXISTS foods_fts USING fts5(
            canonical_name, display_name, brand_name, aliases, search_terms, category, cuisine,
            content='foods',
            content_rowid='id'
          )
        `);
        await db.execAsync(`INSERT INTO foods_fts(foods_fts) VALUES('rebuild')`);
      } catch {}

      // Copy canonical_name to display_name where display_name is empty
      try {
        await db.execAsync(
          `UPDATE foods SET display_name = canonical_name WHERE display_name = '' OR display_name IS NULL`
        );
      } catch {}

      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '6')"
      );
    }
  } catch {}

  // ── Migration v7: Saved meals enhancement ──
  try {
    const meta7 = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    );
    const ver7 = meta7 ? parseInt(meta7.value) : 6;
    if (ver7 < 7) {
      try { await db.execAsync(`ALTER TABLE saved_meals ADD COLUMN log_count INTEGER DEFAULT 0`); } catch {}
      try { await db.execAsync(`ALTER TABLE saved_meals ADD COLUMN last_logged TEXT`); } catch {}
      try { await db.execAsync(`ALTER TABLE saved_meals ADD COLUMN meal_thumbnail TEXT DEFAULT ''`); } catch {}
      try { await db.execAsync(`ALTER TABLE saved_meals ADD COLUMN updated_at TEXT`); } catch {}
      try { await db.execAsync(`ALTER TABLE saved_meals ADD COLUMN total_weight REAL DEFAULT 0`); } catch {}
      try { await db.execAsync(`ALTER TABLE saved_meals ADD COLUMN position_order INTEGER DEFAULT 0`); } catch {}
      try { await db.execAsync(`ALTER TABLE saved_meal_foods ADD COLUMN position_order INTEGER DEFAULT 0`); } catch {}
      // Indexes
      try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_saved_meals_user ON saved_meals(user_id)`); } catch {}
      try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_saved_meals_fav ON saved_meals(user_id, is_favorite)`); } catch {}
      try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_saved_meals_logged ON saved_meals(user_id, log_count DESC)`); } catch {}
      try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_saved_meals_type ON saved_meals(user_id, meal_type)`); } catch {}
      try { await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_saved_meal_foods_meal ON saved_meal_foods(meal_id)`); } catch {}
      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '7')"
      );
    }
  } catch {}

  // ── Migration v8: Restaurant food ecosystem ──
  try {
    const meta8 = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    );
    const ver8 = meta8 ? parseInt(meta8.value) : 7;
    if (ver8 < 8) {
      await db.execAsync(`
        -- Restaurant brands table (expanded from food_brands)
        CREATE TABLE IF NOT EXISTS restaurant_brands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          aliases TEXT DEFAULT '[]',
          cuisine TEXT DEFAULT '',
          country TEXT DEFAULT '',
          logo_url TEXT DEFAULT '',
          menu_updated_at TEXT,
          is_verified INTEGER DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Restaurant food items (standalone, not dependent on foods table)
        CREATE TABLE IF NOT EXISTS restaurant_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand_id INTEGER NOT NULL,
          item_name TEXT NOT NULL,
          canonical_name TEXT NOT NULL UNIQUE,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fat REAL NOT NULL,
          fiber REAL DEFAULT 0,
          sugar REAL DEFAULT 0,
          sodium REAL DEFAULT 0,
          serving_size TEXT DEFAULT '1 serving',
          serving_weight REAL DEFAULT 100,
          aliases TEXT DEFAULT '[]',
          search_terms TEXT DEFAULT '',
          category TEXT DEFAULT '',
          country TEXT DEFAULT '',
          is_verified INTEGER DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (brand_id) REFERENCES restaurant_brands(id) ON DELETE CASCADE
        );

        -- FTS for restaurant foods
        CREATE VIRTUAL TABLE IF NOT EXISTS restaurant_foods_fts USING fts5(
          item_name, canonical_name, brand_name, aliases, search_terms, category, country,
          content='',
          content_rowid='id'
        );

        -- User restaurant favorites
        CREATE TABLE IF NOT EXISTS user_restaurant_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          brand_id INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(user_id, brand_id),
          FOREIGN KEY (brand_id) REFERENCES restaurant_brands(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_restaurant_brands_name ON restaurant_brands(brand_name);
        CREATE INDEX IF NOT EXISTS idx_restaurant_foods_brand ON restaurant_foods(brand_id);
        CREATE INDEX IF NOT EXISTS idx_restaurant_foods_canonical ON restaurant_foods(canonical_name);
        CREATE INDEX IF NOT EXISTS idx_restaurant_foods_category ON restaurant_foods(category);
      `);

      // Seed restaurant brands and foods from JSON
      try {
        const resData = require('@/assets/restaurant_food_database.json');
        if (Array.isArray(resData)) {
          for (const brand of resData) {
            const { lastInsertRowId: brandId } = await db.runAsync(
              `INSERT OR IGNORE INTO restaurant_brands (brand_name, aliases, cuisine, country, is_verified)
               VALUES (?, ?, ?, ?, 1)`,
              brand.brand, JSON.stringify(brand.aliases || []), brand.cuisine || '', brand.country || ''
            );
            if (brandId && brand.items) {
              for (const item of brand.items) {
                const searchTerms = [
                  item.name.toLowerCase(), item.canonical.toLowerCase(),
                  ...(item.aliases || []).map((a: string) => a.toLowerCase()),
                  item.cat?.toLowerCase() || '', brand.brand.toLowerCase()
                ].join(' ').trim();
                await db.runAsync(
                  `INSERT OR IGNORE INTO restaurant_foods
                   (brand_id, item_name, canonical_name, calories, protein, carbs, fat, fiber, sugar, sodium,
                    serving_size, serving_weight, aliases, search_terms, category, country, is_verified)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                  brandId, item.name, item.canonical, item.cal, item.p, item.c, item.f,
                  item.fb || 0, item.sg || 0, item.na || 0,
                  item.sv || '1 serving', item.g || 100,
                  JSON.stringify(item.aliases || []), searchTerms,
                  item.cat || '', item.ctry || brand.country || ''
                );
              }
            }
          }
        }
      } catch (seedErr) {
        console.warn('[db] restaurant seed error:', seedErr);
      }

      // Populate FTS index (contentless table requires manual INSERT)
      try {
        await db.execAsync(`DELETE FROM restaurant_foods_fts`);
        await db.execAsync(`
          INSERT INTO restaurant_foods_fts(rowid, item_name, canonical_name, brand_name, aliases, search_terms, category, country)
          SELECT rf.rowid, rf.item_name, rf.canonical_name, rb.brand_name, rf.aliases, rf.search_terms, rf.category, rf.country
          FROM restaurant_foods rf
          JOIN restaurant_brands rb ON rb.id = rf.brand_id
        `);
      } catch (ftsErr) { console.warn('[db] restaurant FTS populate error:', ftsErr); }

      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '8')"
      );
    }
  } catch {}

  // ── Migration v9: Safe column additions + PRAGMA user_version ──
  const d9 = db!;
  try {
    const pragma = await d9.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVer = pragma ? (Number(pragma.user_version) || 0) : 0;
    if (currentVer < 9) {
      const addCol = async (table: string, col: string, def: string) => {
        try {
          await d9.execAsync(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
        } catch (e: any) {
          if (!e?.message?.includes('duplicate column name')) {
            console.warn(`[db] v9: ${table}.${col} -> ${e?.message}`);
          }
        }
      };

      // foods table
      await addCol('foods', 'cuisine', 'TEXT DEFAULT \'\'');
      await addCol('foods', 'verified', 'INTEGER DEFAULT 0');
      await addCol('foods', 'image_url', 'TEXT DEFAULT \'\'');
      await addCol('foods', 'aliases', 'TEXT DEFAULT \'[]\'');
      await addCol('foods', 'popularity_score', 'REAL DEFAULT 0');
      await addCol('foods', 'display_name', 'TEXT DEFAULT \'\'');
      await addCol('foods', 'base_serving_amount', 'REAL DEFAULT 100');
      await addCol('foods', 'base_serving_unit', 'TEXT DEFAULT \'g\'');
      await addCol('foods', 'base_serving_description', 'TEXT DEFAULT \'\'');

      // food_servings table
      await addCol('food_servings', 'is_default', 'INTEGER DEFAULT 0');
      await addCol('food_servings', 'serving_description', 'TEXT DEFAULT \'\'');
      await addCol('food_servings', 'amount_in_grams', 'REAL DEFAULT 100');

      // saved_meals table
      await addCol('saved_meals', 'log_count', 'INTEGER DEFAULT 0');
      await addCol('saved_meals', 'last_logged', 'TEXT');
      await addCol('saved_meals', 'meal_thumbnail', 'TEXT DEFAULT \'\'');
      await addCol('saved_meals', 'updated_at', 'TEXT');
      await addCol('saved_meals', 'total_weight', 'REAL DEFAULT 0');
      await addCol('saved_meals', 'position_order', 'INTEGER DEFAULT 0');

      // saved_meal_foods table
      await addCol('saved_meal_foods', 'position_order', 'INTEGER DEFAULT 0');

      // restaurant tables (create if not exist, add missing cols)
      try {
        await d9.execAsync(`CREATE TABLE IF NOT EXISTS restaurant_brands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
          aliases TEXT DEFAULT '[]',
          cuisine TEXT DEFAULT '',
          country TEXT DEFAULT '',
          logo_url TEXT DEFAULT '',
          menu_updated_at TEXT,
          is_verified INTEGER DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);
      } catch {}
      await addCol('restaurant_brands', 'aliases', 'TEXT DEFAULT \'[]\'');
      await addCol('restaurant_brands', 'cuisine', 'TEXT DEFAULT \'\'');
      await addCol('restaurant_brands', 'country', 'TEXT DEFAULT \'\'');
      await addCol('restaurant_brands', 'logo_url', 'TEXT DEFAULT \'\'');
      await addCol('restaurant_brands', 'is_verified', 'INTEGER DEFAULT 1');

      try {
        await d9.execAsync(`CREATE TABLE IF NOT EXISTS restaurant_foods (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand_id INTEGER NOT NULL,
          item_name TEXT NOT NULL,
          canonical_name TEXT NOT NULL UNIQUE,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fat REAL NOT NULL,
          fiber REAL DEFAULT 0,
          sugar REAL DEFAULT 0,
          sodium REAL DEFAULT 0,
          serving_size TEXT DEFAULT '1 serving',
          serving_weight REAL DEFAULT 100,
          aliases TEXT DEFAULT '[]',
          search_terms TEXT DEFAULT '',
          category TEXT DEFAULT '',
          country TEXT DEFAULT '',
          is_verified INTEGER DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`);
      } catch {}

      // Indexes
      const idxList = [
        'CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(canonical_name)',
        'CREATE INDEX IF NOT EXISTS idx_foods_cuisine ON foods(cuisine)',
        'CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category)',
        'CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode)',
        'CREATE INDEX IF NOT EXISTS idx_foods_verified ON foods(verified)',
        'CREATE INDEX IF NOT EXISTS idx_food_servings_food ON food_servings(food_id)',
        'CREATE INDEX IF NOT EXISTS idx_recent_foods_user_logged ON recent_foods(user_id, last_logged DESC)',
        'CREATE INDEX IF NOT EXISTS idx_recent_foods_user_count ON recent_foods(user_id, log_count DESC)',
        'CREATE INDEX IF NOT EXISTS idx_foods_search_name ON foods(canonical_name, display_name)',
        'CREATE INDEX IF NOT EXISTS idx_food_servings_default ON food_servings(food_id, is_default)',
        'CREATE INDEX IF NOT EXISTS idx_custom_foods_user ON user_custom_foods(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_food_history_user_logged ON user_food_history(user_id, last_logged DESC)',
        'CREATE INDEX IF NOT EXISTS idx_restaurant_brands_name ON restaurant_brands(brand_name)',
        'CREATE INDEX IF NOT EXISTS idx_restaurant_foods_brand ON restaurant_foods(brand_id)',
        'CREATE INDEX IF NOT EXISTS idx_restaurant_foods_canonical ON restaurant_foods(canonical_name)',
      ];
      for (const sql of idxList) {
        try { await db.execAsync(sql); } catch {}
      }

      await db.execAsync('PRAGMA user_version = 9');
    }
  } catch (e) {
    console.warn('[db] migration v9 error:', e);
  }

  // ── Migration v10: Performance indexes ──
  try {
    const pragma = await d9.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const currentVer = pragma ? (Number(pragma.user_version) || 0) : 0;
    if (currentVer < 10) {
      const idxListV10 = [
        // Composite index for recent_foods meal-type filtered queries
        'CREATE INDEX IF NOT EXISTS idx_recent_foods_meal ON recent_foods(user_id, last_meal_type, log_count DESC, last_logged DESC)',
        // Index for logFoodToRecent lookup (LOWER removed in query)
        'CREATE INDEX IF NOT EXISTS idx_recent_foods_user_food ON recent_foods(user_id, food_name)',
        // Composite index for saved_meals sort query
        'CREATE INDEX IF NOT EXISTS idx_saved_meals_user_sort ON saved_meals(user_id, is_favorite DESC, log_count DESC, created_at DESC)',
        // Index for food_servings FK lookups
        'CREATE INDEX IF NOT EXISTS idx_food_servings_food_id ON food_servings(food_id)',
        // Index for foods full-text fallback LIKE queries
        'CREATE INDEX IF NOT EXISTS idx_foods_canonical_lower ON foods(canonical_name)',
        // Index for IFNULL(display_name, '') LIKE queries
        'CREATE INDEX IF NOT EXISTS idx_foods_display ON foods(display_name)',
        // Index for meal_logs if they exist as a local table
        'CREATE INDEX IF NOT EXISTS idx_user_food_history_user_meal ON user_food_history(user_id, last_meal_type)',
        // Composite index for saveMeal N+1 (food_id lookup)
        'CREATE INDEX IF NOT EXISTS idx_foods_name_search ON foods(canonical_name, display_name, id)',
      ];
      for (const sql of idxListV10) {
        try { await d9.execAsync(sql); } catch {}
      }
      await db.execAsync('PRAGMA user_version = 10');
    }
  } catch (e) {
    console.warn('[db] migration v10 error:', e);
  }

  // ── Migration v11: Restaurant menu (exact macros per item, not per-100g) ──
  try {
    const meta11 = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM _meta WHERE key = 'schema_version'"
    );
    const ver11 = meta11 ? parseInt(meta11.value) : 10;
    if (ver11 < 11) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS restaurant_menu (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chain TEXT NOT NULL,
          chain_region TEXT DEFAULT 'India',
          item_name TEXT NOT NULL,
          category TEXT DEFAULT '',
          serving_label TEXT NOT NULL,
          serving_grams REAL DEFAULT 0,
          calories REAL NOT NULL,
          protein REAL NOT NULL,
          carbs REAL NOT NULL,
          fat REAL NOT NULL,
          fiber REAL DEFAULT 0,
          sugar REAL DEFAULT 0,
          sodium REAL DEFAULT 0,
          is_veg INTEGER DEFAULT 0,
          aliases TEXT DEFAULT '[]',
          source_url TEXT DEFAULT '',
          last_updated TEXT DEFAULT ''
        );

        CREATE INDEX IF NOT EXISTS idx_restaurant_menu_chain ON restaurant_menu(chain);
        CREATE INDEX IF NOT EXISTS idx_restaurant_menu_item ON restaurant_menu(item_name);
        CREATE INDEX IF NOT EXISTS idx_restaurant_menu_cat ON restaurant_menu(category);
      `);

      // Seed from restaurant_database.json
      try {
        const restMenuData = require('@/assets/restaurant_database.json');
        if (Array.isArray(restMenuData)) {
          for (const brand of restMenuData) {
            if (!Array.isArray(brand.items)) continue;
            for (const item of brand.items) {
              await db.runAsync(
                `INSERT OR IGNORE INTO restaurant_menu
                 (chain, chain_region, item_name, category, serving_label, serving_grams,
                  calories, protein, carbs, fat, fiber, sugar, sodium, is_veg, aliases,
                  source_url, last_updated)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                brand.chain, brand.chain_region || 'India',
                item.item_name, item.category || '', item.serving_label, item.serving_grams || 0,
                item.calories, item.protein, item.carbs, item.fat,
                item.fiber || 0, item.sugar || 0, item.sodium || 0,
                item.is_veg || 0, JSON.stringify(item.aliases || []),
                item.source_url || '', item.last_updated || ''
              );
            }
          }
        }
      } catch (seedErr) {
        console.warn('[db] restaurant_menu seed error:', seedErr);
      }

      await db.runAsync(
        "INSERT OR REPLACE INTO _meta (key, value) VALUES ('schema_version', '11')"
      );
    }
  } catch (e) {
    console.warn('[db] migration v11 error:', e);
  }
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

// ── New types for global food database ──

export interface FoodAlias {
  id: number;
  food_id: number;
  alias: string;
  language: string;
  is_regional: number;
}

export interface FoodBrand {
  id: number;
  name: string;
  logo_url: string;
  website: string;
  country: string;
  is_verified: number;
}

export interface RestaurantMenuItem {
  id: number;
  food_id: number;
  restaurant_name: string;
  cuisine: string;
  country: string;
  menu_category: string;
  price: number;
  currency: string;
  is_verified: number;
  serving_size: string;
}

export interface FoodCategory {
  id: number;
  name: string;
  parent_id: number | null;
  description: string;
  icon: string;
  sort_order: number;
}

export interface FoodBarcode {
  id: number;
  barcode: string;
  food_id: number;
  package_size: string;
  package_grams: number;
  country: string;
  is_active: number;
  last_scanned: string | null;
}

export interface VerifiedFood {
  id: number;
  food_id: number;
  verified_by: string;
  verification_method: string;
  verified_at: string;
  confidence_score: number;
  source_url: string;
}

export interface TrendingFood {
  id: number;
  food_id: number;
  trend_score: number;
  daily_log_count: number;
  weekly_log_count: number;
  monthly_log_count: number;
}

export interface MealTemplate {
  id: number;
  user_id: string;
  name: string;
  meal_type: string;
  goal_type: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  is_public: number;
  foods: MealTemplateFood[];
  created_at: string;
}

export interface MealTemplateFood {
  id: number;
  template_id: number;
  food_id: number | null;
  food_name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodSubstitution {
  id: number;
  original_food_id: number;
  substitute_food_id: number;
  reason: string;
  similarity_score: number;
  is_healthier: number;
}

export interface FoodRecommendation {
  id: number;
  goal_type: string;
  food_id: number;
  priority: number;
  reason: string;
}

export interface AdminAuditLog {
  id: number;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string;
  created_at: string;
}

export interface UserSearchHistory {
  id: number;
  user_id: string;
  query: string;
  selected_food_id: number | null;
  is_voice: number;
  searched_at: string;
}

export interface UserFoodFavorite {
  id: number;
  user_id: string;
  food_id: number;
  created_at: string;
}

export interface UserFoodRating {
  id: number;
  user_id: string;
  food_id: number;
  rating: number;
  review: string;
  created_at: string;
}

// ── Existing conversation helpers ──

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
