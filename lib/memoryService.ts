import * as SQLite from 'expo-sqlite';
import { supabase } from './supabase';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('pulse_ai.db');
    await initMemoryTables();
  }
  return db;
}

async function initMemoryTables() {
  if (!db) return;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS memory_workout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_date TEXT NOT NULL,
      session_start TEXT,
      session_end TEXT,
      duration_minutes INTEGER,
      focus TEXT,
      plan_name TEXT,
      methodology TEXT,
      rpe_avg REAL,
      subjective_rating INTEGER,
      exercises TEXT NOT NULL DEFAULT '[]',
      total_volume_kg REAL,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memory_nutrition_days (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      log_date TEXT NOT NULL,
      total_calories REAL,
      total_protein_g REAL,
      total_carbs_g REAL,
      total_fat_g REAL,
      total_fiber_g REAL,
      total_sodium_mg REAL,
      total_potassium_mg REAL,
      total_phosphorus_mg REAL,
      total_water_ml REAL,
      meal_count INTEGER,
      adherence_score REAL,
      meal_quality_score REAL,
      anti_inflammatory_score REAL,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, log_date)
    );
    CREATE TABLE IF NOT EXISTS memory_injuries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      body_part TEXT NOT NULL,
      injury_type TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('mild','moderate','severe')),
      onset_date TEXT NOT NULL,
      resolved_date TEXT,
      is_recurring INTEGER DEFAULT 0,
      description TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memory_conditions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      condition_name TEXT NOT NULL,
      stage TEXT,
      severity TEXT CHECK(severity IN ('mild','moderate','severe','remission','active')),
      diagnosed_date TEXT,
      is_active INTEGER DEFAULT 1,
      medications TEXT DEFAULT '[]',
      recent_labs TEXT DEFAULT '{}',
      notes TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, condition_name)
    );
    CREATE TABLE IF NOT EXISTS memory_user_context (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      snapshot_date TEXT NOT NULL,
      current_stress_level INTEGER,
      current_motivation_level INTEGER,
      sleep_quality INTEGER,
      energy_level INTEGER,
      adherence_trend TEXT CHECK(adherence_trend IN ('improving','declining','stable')),
      streak_days INTEGER DEFAULT 0,
      emotional_state TEXT,
      notes TEXT,
      synced INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, snapshot_date)
    );
    CREATE TABLE IF NOT EXISTS memory_exercise_feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      feedback TEXT NOT NULL,
      feedback_type TEXT CHECK(feedback_type IN ('swap','dislike','injury','preference','other')) DEFAULT 'preference',
      source TEXT,
      resolved INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

// ─── Workout Sessions ───

export interface MemoryWorkoutSession {
  id: string;
  user_id: string;
  session_date: string;
  session_start?: string;
  session_end?: string;
  duration_minutes?: number;
  focus?: string;
  plan_name?: string;
  methodology?: string;
  rpe_avg?: number;
  subjective_rating?: number;
  exercises: any[];
  total_volume_kg?: number;
  notes?: string;
  synced: number;
  created_at: string;
}

export async function saveWorkoutSession(session: MemoryWorkoutSession): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO memory_workout_sessions
     (id, user_id, session_date, session_start, session_end, duration_minutes, focus,
      plan_name, methodology, rpe_avg, subjective_rating, exercises, total_volume_kg,
      notes, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id, session.user_id, session.session_date, session.session_start || null,
    session.session_end || null, session.duration_minutes || null, session.focus || null,
    session.plan_name || null, session.methodology || null, session.rpe_avg || null,
    session.subjective_rating || null, JSON.stringify(session.exercises),
    session.total_volume_kg || null, session.notes || null, session.synced, session.created_at
  );
}

export async function getRecentWorkoutSessions(userId: string, limit: number = 10): Promise<MemoryWorkoutSession[]> {
  const database = await getDb();
  return database.getAllAsync<MemoryWorkoutSession>(
    'SELECT * FROM memory_workout_sessions WHERE user_id = ? ORDER BY session_date DESC LIMIT ?',
    userId, limit
  );
}

// ─── Nutrition Days ───

export interface MemoryNutritionDay {
  id: string;
  user_id: string;
  log_date: string;
  total_calories?: number;
  total_protein_g?: number;
  total_carbs_g?: number;
  total_fat_g?: number;
  total_fiber_g?: number;
  total_sodium_mg?: number;
  total_potassium_mg?: number;
  total_phosphorus_mg?: number;
  total_water_ml?: number;
  meal_count?: number;
  adherence_score?: number;
  meal_quality_score?: number;
  anti_inflammatory_score?: number;
  notes?: string;
  synced: number;
  created_at: string;
}

export async function saveNutritionDay(nutrition: MemoryNutritionDay): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO memory_nutrition_days
     (id, user_id, log_date, total_calories, total_protein_g, total_carbs_g, total_fat_g,
      total_fiber_g, total_sodium_mg, total_potassium_mg, total_phosphorus_mg, total_water_ml,
      meal_count, adherence_score, meal_quality_score, anti_inflammatory_score, notes, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    nutrition.id, nutrition.user_id, nutrition.log_date, nutrition.total_calories || null,
    nutrition.total_protein_g || null, nutrition.total_carbs_g || null, nutrition.total_fat_g || null,
    nutrition.total_fiber_g || null, nutrition.total_sodium_mg || null, nutrition.total_potassium_mg || null,
    nutrition.total_phosphorus_mg || null, nutrition.total_water_ml || null, nutrition.meal_count || null,
    nutrition.adherence_score || null, nutrition.meal_quality_score || null,
    nutrition.anti_inflammatory_score || null, nutrition.notes || null, nutrition.synced, nutrition.created_at
  );
}

export async function getRecentNutritionDays(userId: string, limit: number = 7): Promise<MemoryNutritionDay[]> {
  const database = await getDb();
  return database.getAllAsync<MemoryNutritionDay>(
    'SELECT * FROM memory_nutrition_days WHERE user_id = ? ORDER BY log_date DESC LIMIT ?',
    userId, limit
  );
}

// ─── Injuries ───

export interface MemoryInjury {
  id: string;
  user_id: string;
  body_part: string;
  injury_type: string;
  severity: 'mild' | 'moderate' | 'severe';
  onset_date: string;
  resolved_date?: string;
  is_recurring: number;
  description?: string;
  synced: number;
  created_at: string;
}

export async function saveInjury(injury: MemoryInjury): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO memory_injuries
     (id, user_id, body_part, injury_type, severity, onset_date, resolved_date, is_recurring, description, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    injury.id, injury.user_id, injury.body_part, injury.injury_type, injury.severity,
    injury.onset_date, injury.resolved_date || null, injury.is_recurring ? 1 : 0,
    injury.description || null, injury.synced, injury.created_at
  );
}

export async function getActiveInjuries(userId: string): Promise<MemoryInjury[]> {
  const database = await getDb();
  return database.getAllAsync<MemoryInjury>(
    'SELECT * FROM memory_injuries WHERE user_id = ? AND resolved_date IS NULL ORDER BY onset_date DESC',
    userId
  );
}

// ─── Conditions ───

export interface MemoryCondition {
  id: string;
  user_id: string;
  condition_name: string;
  stage?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'remission' | 'active';
  diagnosed_date?: string;
  is_active: number;
  medications: any[];
  recent_labs: Record<string, any>;
  notes?: string;
  synced: number;
  created_at: string;
  updated_at: string;
}

export async function saveCondition(condition: MemoryCondition): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO memory_conditions
     (id, user_id, condition_name, stage, severity, diagnosed_date, is_active, medications, recent_labs, notes, synced, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    condition.id, condition.user_id, condition.condition_name, condition.stage || null,
    condition.severity || null, condition.diagnosed_date || null, condition.is_active ? 1 : 0,
    JSON.stringify(condition.medications), JSON.stringify(condition.recent_labs),
    condition.notes || null, condition.synced, condition.created_at, condition.updated_at
  );
}

export async function getActiveConditions(userId: string): Promise<MemoryCondition[]> {
  const database = await getDb();
  return database.getAllAsync<MemoryCondition>(
    'SELECT * FROM memory_conditions WHERE user_id = ? AND is_active = 1 ORDER BY condition_name',
    userId
  );
}

// ─── User Context ───

export interface MemoryUserContext {
  id: string;
  user_id: string;
  snapshot_date: string;
  current_stress_level?: number;
  current_motivation_level?: number;
  sleep_quality?: number;
  energy_level?: number;
  adherence_trend?: 'improving' | 'declining' | 'stable';
  streak_days?: number;
  emotional_state?: string;
  notes?: string;
  synced: number;
  created_at: string;
}

export async function saveUserContext(ctx: MemoryUserContext): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO memory_user_context
     (id, user_id, snapshot_date, current_stress_level, current_motivation_level, sleep_quality,
      energy_level, adherence_trend, streak_days, emotional_state, notes, synced, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ctx.id, ctx.user_id, ctx.snapshot_date, ctx.current_stress_level || null,
    ctx.current_motivation_level || null, ctx.sleep_quality || null, ctx.energy_level || null,
    ctx.adherence_trend || null, ctx.streak_days || 0, ctx.emotional_state || null,
    ctx.notes || null, ctx.synced, ctx.created_at
  );
}

export async function getLatestUserContext(userId: string): Promise<MemoryUserContext | null> {
  const database = await getDb();
  return database.getFirstAsync<MemoryUserContext>(
    'SELECT * FROM memory_user_context WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT 1',
    userId
  );
}

export async function getUserContextHistory(userId: string, days: number = 7): Promise<MemoryUserContext[]> {
  const database = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return database.getAllAsync<MemoryUserContext>(
    'SELECT * FROM memory_user_context WHERE user_id = ? AND snapshot_date >= ? ORDER BY snapshot_date DESC',
    userId, cutoff.toISOString().split('T')[0]
  );
}

// ─── Context Building ───

export interface AggregatedMemoryContext {
  recentWorkouts: string;
  recentNutrition: string;
  activeInjuries: string;
  activeConditions: string;
  latestContext: string;
  contextHistory: string;
}

export async function buildMemoryContext(userId: string): Promise<AggregatedMemoryContext> {
  const [workouts, nutrition, injuries, conditions, latestCtx, ctxHistory] = await Promise.all([
    getRecentWorkoutSessions(userId, 5),
    getRecentNutritionDays(userId, 7),
    getActiveInjuries(userId),
    getActiveConditions(userId),
    getLatestUserContext(userId),
    getUserContextHistory(userId, 7),
  ]);

  const recentWorkouts = workouts.length > 0
    ? workouts.map(w =>
        `${w.session_date}: ${w.focus || 'workout'}, RPE ${w.rpe_avg ?? 'N/A'}, ${w.duration_minutes ?? '?'}min`
      ).join('\n')
    : 'No recent workouts logged.';

  const recentNutrition = nutrition.length > 0
    ? nutrition.map(n =>
        `${n.log_date}: ${n.total_calories ?? '?'} kcal, P${n.total_protein_g ?? '?'}g C${n.total_carbs_g ?? '?'}g F${n.total_fat_g ?? '?'}g`
      ).join('\n')
    : 'No recent nutrition data logged.';

  const activeInjuries = injuries.length > 0
    ? injuries.map(i => `${i.body_part}: ${i.injury_type} (${i.severity}) — onset ${i.onset_date}`).join('\n')
    : 'None reported.';

  const activeConditions = conditions.length > 0
    ? conditions.map(c =>
        `${c.condition_name}${c.stage ? ` (${c.stage})` : ''}${c.severity ? ` — ${c.severity}` : ''}`
      ).join('\n')
    : 'None reported.';

  const latestContext = latestCtx
    ? `Stress: ${latestCtx.current_stress_level ?? '?'}/10, Motivation: ${latestCtx.current_motivation_level ?? '?'}/10, Sleep: ${latestCtx.sleep_quality ?? '?'}/10, Energy: ${latestCtx.energy_level ?? '?'}/10`
    : 'No daily check-in data yet.';

  const contextHistory = ctxHistory.length > 0
    ? ctxHistory.map(c =>
        `${c.snapshot_date}: Stress ${c.current_stress_level ?? '?'}, Motivation ${c.current_motivation_level ?? '?'}, Sleep ${c.sleep_quality ?? '?'}, Energy ${c.energy_level ?? '?'}`
      ).join('\n')
    : 'No history available.';

  return {
    recentWorkouts,
    recentNutrition,
    activeInjuries,
    activeConditions,
    latestContext,
    contextHistory,
  };
}

// ─── Supabase Sync Functions ───

async function trySyncTable<T>(
  tableName: string,
  userId: string,
  filterColumn: string,
  cutoffDate: string,
): Promise<T[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .gte(filterColumn, cutoffDate)
      .order(filterColumn, { ascending: false });
    if (error) return [];
    return (data || []) as T[];
  } catch {
    return [];
  }
}

export async function syncRecoveryDays(userId: string, days: number = 14): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const data = await trySyncTable<any>('recovery_daily', userId, 'log_date', cutoffStr);
    if (data.length === 0) return;

    const database = await getDb();
    for (const row of data) {
      try {
        await database.runAsync(
          `INSERT OR REPLACE INTO memory_user_context
           (id, user_id, snapshot_date, current_stress_level, current_motivation_level,
            sleep_quality, energy_level, adherence_trend, streak_days, notes, synced, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          row.id, row.user_id, row.log_date,
          row.stress_level ?? null, row.motivation_level ?? null,
          row.sleep_quality ?? null, row.energy_level ?? null,
          row.adherence_trend ?? null, row.streak_days ?? 0,
          row.notes ?? null, row.created_at ?? new Date().toISOString()
        );
      } catch {
        // skip bad row
      }
    }
  } catch {
    // table may not exist yet — silent
  }
}

export async function syncExerciseProgress(userId: string, days: number = 90): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const data = await trySyncTable<any>('exercise_progression', userId, 'session_date', cutoffStr);
    if (data.length === 0) return;

    const database = await getDb();
    for (const row of data) {
      try {
        const exercises = row.exercises
          ? (typeof row.exercises === 'string' ? row.exercises : JSON.stringify(row.exercises))
          : '[]';
        await database.runAsync(
          `INSERT OR REPLACE INTO memory_workout_sessions
           (id, user_id, session_date, focus, plan_name, exercises, total_volume_kg, notes, synced, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
          row.id, row.user_id, row.session_date,
          row.exercise_name ?? null, row.workout_name ?? null,
          exercises, row.volume_load ?? null,
          row.notes ?? null, row.created_at ?? new Date().toISOString()
        );
      } catch {
        // skip bad row
      }
    }
  } catch {
    // table may not exist yet — silent
  }
}

// ─── Exercise Feedback ───

export interface ExerciseFeedback {
  id: string;
  user_id: string;
  exercise_name: string;
  feedback: string;
  feedback_type: 'swap' | 'dislike' | 'injury' | 'preference' | 'other';
  source: string | null;
  resolved: number;
  created_at: string;
}

export async function saveExerciseFeedback(
  userId: string,
  exerciseName: string,
  feedback: string,
  feedbackType: ExerciseFeedback['feedback_type'] = 'preference',
  source: string = 'workout_swap_modal'
): Promise<string> {
  const database = await getDb();
  const id = `fb_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT INTO memory_exercise_feedback (id, user_id, exercise_name, feedback, feedback_type, source, resolved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    id,
    userId,
    exerciseName,
    feedback,
    feedbackType,
    source,
    now
  );
  return id;
}

export async function getActiveExerciseFeedback(userId: string, limit = 20): Promise<ExerciseFeedback[]> {
  try {
    const database = await getDb();
    const rows = await database.getAllAsync<ExerciseFeedback>(
      `SELECT * FROM memory_exercise_feedback WHERE user_id = ? AND resolved = 0 ORDER BY created_at DESC LIMIT ?`,
      userId,
      limit
    );
    return rows;
  } catch {
    return [];
  }
}
