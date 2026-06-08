import { supabase } from './supabase';

export interface SetEntry {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface SessionSetGroup {
  date: string;
  sets: SetEntry[];
}

export interface WeightHistoryEntry {
  date: string;
  sets: number;
  reps: number;
  weight: number;
  volume: number;
}

export interface ExercisePerformanceData {
  lastWeight: number | null;
  bestWeight: number | null;
  lastReps: number | null;
  lastSessionDate: string | null;
  totalCompletedSets: number;
  weightProgress: 'up' | 'down' | 'same' | null;
  history: WeightHistoryEntry[];
  sessionHistory: SessionSetGroup[];
}

interface SetRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  completed_at: string | null;
  workout_sessions: Record<string, any> | Record<string, any>[] | null;
}

async function fetchUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id ?? null;
}

async function getExerciseIdsByNames(names: string[]): Promise<Map<string, string>> {
  if (names.length === 0) return new Map();
  const { data } = await supabase
    .from('exercises')
    .select('id, name')
    .in('name', names);
  const map = new Map<string, string>();
  if (data) {
    for (const ex of data) {
      map.set(ex.name, ex.id);
    }
  }
  return map;
}

async function fetchAllCompletedSets(
  userId: string,
  exerciseIds: string[]
): Promise<SetRow[]> {
  if (exerciseIds.length === 0) return [];
  const { data } = await supabase
    .from('workout_session_sets')
    .select(`
      id, session_id, exercise_id, set_number, weight, reps, completed_at,
      workout_sessions!inner(id, session_date, name)
    `)
    .eq('user_id', userId)
    .in('exercise_id', exerciseIds)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false });
  return ((data as unknown) as SetRow[]) || [];
}

function getSessionDate(s: SetRow): string {
  if (Array.isArray(s.workout_sessions)) {
    return s.workout_sessions[0]?.session_date || s.completed_at?.split('T')[0] || '';
  }
  return s.workout_sessions?.session_date || s.completed_at?.split('T')[0] || '';
}

function getSessionId(s: SetRow): string {
  if (s.session_id) return s.session_id;
  const ws = s.workout_sessions;
  if (Array.isArray(ws) && ws[0]?.id) return ws[0].id;
  if (ws && !Array.isArray(ws) && (ws as Record<string, any>).id) return (ws as Record<string, any>).id;
  return getSessionDate(s) || 'unknown';
}

function computePerformanceData(
  sets: SetRow[],
  exerciseId: string
): ExercisePerformanceData {
  const exerciseSets = sets.filter(s => s.exercise_id === exerciseId);
  if (exerciseSets.length === 0) {
    return {
      lastWeight: null, bestWeight: null, lastReps: null,
      lastSessionDate: null, totalCompletedSets: 0,
      weightProgress: null, history: [],
      sessionHistory: [],
    };
  }

  const bestWeight = Math.max(...exerciseSets.map(s => Number(s.weight)));
  const sortedByDate = [...exerciseSets].sort((a, b) => {
    const da = a.completed_at || getSessionDate(a) || '';
    const db = b.completed_at || getSessionDate(b) || '';
    return db.localeCompare(da);
  });
  const last = sortedByDate[0];
  const lastWeight = Number(last.weight);
  const lastReps = Number(last.reps);
  const lastSessionDate = getSessionDate(last);

  let weightProgress: 'up' | 'down' | 'same' | null = null;
  if (sortedByDate.length >= 2) {
    const second = sortedByDate[1];
    if (Number(last.weight) > Number(second.weight)) weightProgress = 'up';
    else if (Number(last.weight) < Number(second.weight)) weightProgress = 'down';
    else weightProgress = 'same';
  }

  const sessionMap = new Map<string, { sets: number; totalReps: number; maxWeight: number; totalVolume: number }>();
  for (const s of sortedByDate) {
    const dateKey = getSessionDate(s) || 'unknown';
    if (!sessionMap.has(dateKey)) {
      sessionMap.set(dateKey, { sets: 0, totalReps: 0, maxWeight: 0, totalVolume: 0 });
    }
    const entry = sessionMap.get(dateKey)!;
    entry.sets += 1;
    entry.totalReps += Number(s.reps);
    entry.maxWeight = Math.max(entry.maxWeight, Number(s.weight));
    entry.totalVolume += Number(s.weight) * Number(s.reps);
  }

  const history: WeightHistoryEntry[] = [];
  for (const [date, d] of sessionMap) {
    history.push({
      date,
      sets: d.sets,
      reps: d.totalReps,
      weight: d.maxWeight,
      volume: d.totalVolume,
    });
  }
  history.sort((a, b) => b.date.localeCompare(a.date));

  // Group raw sets into sessions preserving individual set data
  // Use session_id (or workout_sessions.id via join) as key to prevent cross-session merging on the same day
  const rawSessionMap = new Map<string, { date: string; rows: SetRow[] }>();
  for (const s of exerciseSets) {
    const sessionKey = getSessionId(s);
    if (!rawSessionMap.has(sessionKey)) {
      rawSessionMap.set(sessionKey, { date: getSessionDate(s) || 'unknown', rows: [] });
    }
    rawSessionMap.get(sessionKey)!.rows.push(s);
  }
  const sessionHistory: SessionSetGroup[] = [];
  for (const [, { date, rows }] of rawSessionMap) {
    const sortedRows = [...rows].sort((a, b) => a.set_number - b.set_number);
    sessionHistory.push({
      date,
      sets: sortedRows.map(r => ({
        setNumber: r.set_number,
        weight: Number(r.weight),
        reps: Number(r.reps),
      })),
    });
  }
  sessionHistory.sort((a, b) => b.date.localeCompare(a.date));

  return {
    lastWeight,
    bestWeight,
    lastReps,
    lastSessionDate,
    totalCompletedSets: exerciseSets.length,
    weightProgress,
    history: history.slice(0, 5),
    sessionHistory,
  };
}

export interface DayVolumeData {
  totalExercises: number;
  totalCompletedSets: number;
  totalVolume: number;
  completionPercent: number;
}

export interface WorkoutDataMap {
  byExercise: Map<string, ExercisePerformanceData>;
  aggregated: DayVolumeData | null;
}

export async function fetchWorkoutDataForDay(exerciseNames: string[]): Promise<WorkoutDataMap> {
  const userId = await fetchUserId();
  if (!userId || exerciseNames.length === 0) {
    return {
      byExercise: new Map(),
      aggregated: null,
    };
  }

  const nameToId = await getExerciseIdsByNames(exerciseNames);
  const exerciseIds = Array.from(nameToId.values());
  const sets = await fetchAllCompletedSets(userId, exerciseIds);

  const byExercise = new Map<string, ExercisePerformanceData>();
  for (const [name, id] of nameToId) {
    byExercise.set(name, computePerformanceData(sets, id));
  }

  const totalCompletedSets = Array.from(byExercise.values()).reduce((sum, d) => sum + d.totalCompletedSets, 0);
  const totalVolume = Array.from(byExercise.values()).reduce((sum, d) => {
    return sum + d.history.reduce((v, h) => v + h.volume, 0);
  }, 0);

  return {
    byExercise,
    aggregated: {
      totalExercises: exerciseNames.length,
      totalCompletedSets,
      totalVolume,
      completionPercent: 0,
    },
  };
}

export async function fetchAllWorkoutData(
  allExerciseNames: string[]
): Promise<Map<string, ExercisePerformanceData>> {
  const userId = await fetchUserId();
  if (!userId || allExerciseNames.length === 0) return new Map();

  const nameToId = await getExerciseIdsByNames(allExerciseNames);
  const exerciseIds = Array.from(nameToId.values());
  const sets = await fetchAllCompletedSets(userId, exerciseIds);

  const result = new Map<string, ExercisePerformanceData>();
  for (const [name, id] of nameToId) {
    result.set(name, computePerformanceData(sets, id));
  }
  return result;
}

export async function logSet(
  exerciseName: string,
  weight: string,
  reps: string
): Promise<boolean> {
  const userId = await fetchUserId();
  if (!userId) return false;

  const nameToId = await getExerciseIdsByNames([exerciseName]);
  const exerciseId = nameToId.get(exerciseName);
  if (!exerciseId) return false;

  let { data: activeSession } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!activeSession) {
    const { data: newSession, error: createError } = await supabase
      .from('workout_sessions')
      .insert([{ user_id: userId, name: 'Quick Log', status: 'in_progress' }])
      .select('id')
      .single();
    if (createError || !newSession) return false;
    activeSession = newSession;
  }

  let { data: sessionExercise } = await supabase
    .from('workout_session_exercises')
    .select('id')
    .eq('session_id', activeSession.id)
    .eq('exercise_id', exerciseId)
    .maybeSingle();

  if (!sessionExercise) {
    const { data: newSe, error: seError } = await supabase
      .from('workout_session_exercises')
      .insert([{
        session_id: activeSession.id,
        exercise_id: exerciseId,
        order_index: 0,
      }])
      .select('id')
      .single();
    if (seError || !newSe) return false;
    sessionExercise = newSe;
  }

  const { data: maxSet } = await supabase
    .from('workout_session_sets')
    .select('set_number')
    .eq('session_exercise_id', sessionExercise.id)
    .order('set_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSetNumber = (maxSet?.set_number || 0) + 1;

  const { error } = await supabase
    .from('workout_session_sets')
    .insert([{
      session_exercise_id: sessionExercise.id,
      session_id: activeSession.id,
      user_id: userId,
      exercise_id: exerciseId,
      set_number: nextSetNumber,
      weight: parseFloat(weight) || 0,
      reps: parseInt(reps) || 0,
      is_completed: true,
      completed_at: new Date().toISOString(),
    }]);

  return !error;
}

export async function hasActiveSession(): Promise<string | null> {
  const userId = await fetchUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

export async function startQuickSession(name: string): Promise<string | null> {
  const userId = await fetchUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert([{ user_id: userId, name, status: 'in_progress' }])
    .select('id')
    .single();
  if (error) return null;
  return data.id;
}
