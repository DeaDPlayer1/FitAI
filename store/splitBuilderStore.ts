import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { WorkoutService } from '../lib/workoutService';

const SPLIT_BUILDER_KEY = '@split_builder_state';

export interface BuilderExercise {
  id: string;
  exercise_id: string;
  name: string;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_time_seconds: number;
}

export interface BuilderSection {
  id: string;
  name: string;
  exercises: BuilderExercise[];
}

export interface BuilderDay {
  id: string;
  dayName: string;
  workoutName: string;
  isRest: boolean;
  sections: BuilderSection[];
  templateId?: string; // DB id if this day was loaded from DB
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const makeInitialDays = (): BuilderDay[] => DAY_NAMES.map((dayName, i) => ({
  id: String(i + 1),
  dayName,
  workoutName: '',
  isRest: dayName === 'Wednesday' || dayName === 'Sunday',
  sections: [],
}));

interface SplitBuilderState {
  days: BuilderDay[];
  isLoading: boolean;
  hasLoadedFromDB: boolean;

  toggleRestDay: (dayId: string) => void;
  updateWorkoutName: (dayId: string, name: string) => void;

  addSection: (dayId: string, name: string) => void;
  removeSection: (dayId: string, sectionId: string) => void;
  updateSectionName: (dayId: string, sectionId: string, name: string) => void;

  addExercise: (dayId: string, sectionId: string, exercise: any) => void;
  removeExercise: (dayId: string, sectionId: string, exerciseId: string) => void;
  updateExerciseTargets: (dayId: string, sectionId: string, exerciseId: string, updates: Partial<BuilderExercise>) => void;

  duplicateWorkout: (fromDayId: string, toDayId: string) => void;
  loadSplit: (userId: string) => Promise<void>;
  saveSplit: (userId: string) => Promise<void>;
  reset: () => void;
}

export const useSplitBuilderStore = create<SplitBuilderState>((set, get) => ({
  days: makeInitialDays(),
  isLoading: false,
  hasLoadedFromDB: false,

  toggleRestDay: (dayId) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? { ...d, isRest: !d.isRest, sections: [], workoutName: '' } : d)
  })),

  updateWorkoutName: (dayId, name) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? { ...d, workoutName: name } : d)
  })),

  addSection: (dayId, name) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? {
      ...d,
      sections: [...d.sections, { id: `local_${Date.now()}_${Math.random()}`, name, exercises: [] }]
    } : d)
  })),

  removeSection: (dayId, sectionId) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? {
      ...d,
      sections: d.sections.filter(s => s.id !== sectionId)
    } : d)
  })),

  updateSectionName: (dayId, sectionId, name) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? {
      ...d,
      sections: d.sections.map(s => s.id === sectionId ? { ...s, name } : s)
    } : d)
  })),

  addExercise: (dayId, sectionId, exercise) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? {
      ...d,
      sections: d.sections.map(s => s.id === sectionId ? {
        ...s,
        exercises: [...s.exercises, {
          id: `local_${Date.now()}_${Math.random()}`,
          exercise_id: exercise.id || '',
          name: exercise.name,
          target_sets: 3,
          target_reps_min: 8,
          target_reps_max: 12,
          rest_time_seconds: 90
        }]
      } : s)
    } : d)
  })),

  removeExercise: (dayId, sectionId, exerciseId) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? {
      ...d,
      sections: d.sections.map(s => s.id === sectionId ? {
        ...s,
        exercises: s.exercises.filter(e => e.id !== exerciseId)
      } : s)
    } : d)
  })),

  updateExerciseTargets: (dayId, sectionId, exerciseId, updates) => set((state) => ({
    days: state.days.map(d => d.id === dayId ? {
      ...d,
      sections: d.sections.map(s => s.id === sectionId ? {
        ...s,
        exercises: s.exercises.map(e => e.id === exerciseId ? { ...e, ...updates } : e)
      } : s)
    } : d)
  })),

  duplicateWorkout: (fromDayId, toDayId) => set((state) => {
    const fromDay = state.days.find(d => d.id === fromDayId);
    if (!fromDay) return state;
    return {
      days: state.days.map(d => d.id === toDayId ? {
        ...d,
        isRest: false,
        workoutName: fromDay.workoutName,
        sections: JSON.parse(JSON.stringify(fromDay.sections))
      } : d)
    };
  }),

  /**
   * Loads the user's existing weekly split from Supabase into the builder.
   * Uses the JSON `notes` field (source: "weekly_split") to identify the split templates.
   * Falls back to parsing the template name prefix (e.g., "Monday: Push Day").
   */
  loadSplit: async (userId) => {
    set({ isLoading: true });
    try {
      // Fetch all templates for user that belong to the weekly split
      const { data: templates, error } = await supabase
        .from('workout_templates')
        .select(`
          id, name, notes,
          workout_sections (
            id, name, order_index,
            workout_template_exercises (
              id, exercise_id, order_index,
              target_sets, target_reps_min, target_reps_max, rest_time_seconds,
              exercises ( id, name )
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!templates || templates.length === 0) {
        set({ isLoading: false, hasLoadedFromDB: true });
        return;
      }

      // Filter to only weekly split templates
      const splitTemplates = templates.filter(t => {
        try {
          if (t.notes) {
            const parsed = JSON.parse(t.notes);
            return parsed.source === 'weekly_split';
          }
        } catch {}
        return false;
      });

      if (splitTemplates.length === 0) {
        // If DB has no split, try restoring from local cache
        const cached = await AsyncStorage.getItem(SPLIT_BUILDER_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.days) {
              set({ days: parsed.days, hasLoadedFromDB: true });
              return;
            }
          } catch {}
        }
        set({ isLoading: false, hasLoadedFromDB: true });
        return;
      }

      // Reconstruct days
      const newDays = makeInitialDays();

      for (const template of splitTemplates) {
        let dayName: string | null = null;
        let workoutName = template.name;

        // Try to get day from notes JSON
        try {
          if (template.notes) {
            const parsed = JSON.parse(template.notes);
            if (parsed.day) {
              dayName = parsed.day;
              workoutName = parsed.workoutName || template.name;
            }
          }
        } catch {}

        // Fallback: parse from name prefix "Monday: Push Day"
        if (!dayName) {
          for (const dn of DAY_NAMES) {
            if (template.name.startsWith(`${dn}:`)) {
              dayName = dn;
              workoutName = template.name.replace(`${dn}: `, '').trim();
              break;
            }
          }
        }

        if (!dayName) continue;

        const dayIdx = newDays.findIndex(d => d.dayName === dayName);
        if (dayIdx === -1) continue;

        const sections: BuilderSection[] = (template.workout_sections || [])
          .sort((a: any, b: any) => a.order_index - b.order_index)
          .map((section: any) => ({
            id: section.id,
            name: section.name,
            exercises: (section.workout_template_exercises || [])
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((te: any) => ({
                id: te.id,
                exercise_id: te.exercise_id,
                name: te.exercises?.name || 'Unknown Exercise',
                target_sets: te.target_sets || 3,
                target_reps_min: te.target_reps_min || 8,
                target_reps_max: te.target_reps_max || 12,
                rest_time_seconds: te.rest_time_seconds || 90,
              }))
          }));

        let isRest = false;
        try {
          if (template.notes) {
            const parsed = JSON.parse(template.notes);
            if (parsed.isRest) isRest = true;
          }
        } catch {}

        newDays[dayIdx] = {
          ...newDays[dayIdx],
          workoutName,
          isRest,
          templateId: template.id,
          sections,
        };
      }

      set({ days: newDays, hasLoadedFromDB: true });
    } catch (error) {
      console.error('Error loading split:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Saves the weekly split to Supabase with crash-safe rollback.
   * Backs up existing templates + exercises before deletion,
   * and restores them if the save fails partway through.
   */
  saveSplit: async (userId) => {
    set({ isLoading: true });
    let backup: any[] = [];
    try {
      const { days } = get();

      // Step 1: Fetch existing weekly split templates with ALL related data
      const { data: existingTemplates } = await supabase
        .from('workout_templates')
        .select('id, name, notes')
        .eq('user_id', userId);

      const toDelete = (existingTemplates || []).filter(t => {
        try {
          if (t.notes) {
            const parsed = JSON.parse(t.notes);
            return parsed.source === 'weekly_split';
          }
        } catch {}
        return false;
      });

      // Backup old templates + related data before deletion
      if (toDelete.length > 0) {
        const deleteIds = toDelete.map(t => t.id);
        const { data: oldSections } = await supabase
          .from('workout_sections')
          .select('*')
          .in('template_id', deleteIds);

        const oldSectionIds = (oldSections || []).map(s => s.id);
        const { data: oldExercises } = oldSectionIds.length > 0
          ? await supabase.from('workout_template_exercises').select('*').in('section_id', oldSectionIds)
          : { data: [] };

        backup = toDelete.map(t => ({
          template: t,
          sections: (oldSections || []).filter(s => s.template_id === t.id),
          exercises: (oldExercises || []).filter(e => oldSectionIds.includes(e.section_id)),
        }));

        await supabase.from('workout_templates').delete().in('id', deleteIds);
      }

      // Step 2: Save each day as a template
      for (const day of days) {
        const notesJson = day.isRest
          ? JSON.stringify({ source: 'weekly_split', day: day.dayName, isRest: true })
          : JSON.stringify({
              source: 'weekly_split',
              day: day.dayName,
              workoutName: day.workoutName,
              isRest: false,
            });

        const templateName = day.isRest
          ? `${day.dayName}: Rest`
          : `${day.dayName}: ${day.workoutName}`;

        const { data: template, error: tError } = await supabase
          .from('workout_templates')
          .insert([{
            user_id: userId,
            name: templateName,
            notes: notesJson,
          }])
          .select()
          .single();

        if (tError) throw tError;

        if (day.isRest) continue;
        if (!day.workoutName.trim()) continue;

        for (let sIdx = 0; sIdx < day.sections.length; sIdx++) {
          const section = day.sections[sIdx];
          const { data: dbSection, error: sError } = await supabase
            .from('workout_sections')
            .insert([{
              template_id: template.id,
              name: section.name,
              order_index: sIdx
            }])
            .select()
            .single();

          if (sError) throw sError;

          const exerciseInserts = await Promise.all(section.exercises.map(async (ex, eIdx) => {
            const dbExerciseId = await WorkoutService.getOrCreateExercise(userId, ex);
            return {
              template_id: template.id,
              section_id: dbSection.id,
              exercise_id: dbExerciseId,
              order_index: eIdx,
              target_sets: ex.target_sets,
              target_reps_min: ex.target_reps_min,
              target_reps_max: ex.target_reps_max,
              rest_time_seconds: ex.rest_time_seconds,
            };
          }));

          if (exerciseInserts.length > 0) {
            const { error: exError } = await supabase
              .from('workout_template_exercises')
              .insert(exerciseInserts);
            if (exError) throw exError;
          }
        }
      }
    } catch (error) {
      console.error('Error saving split:', error);
      // CRASH-SAFE ROLLBACK: restore backed-up templates
      if (backup.length > 0) {
        for (const item of backup) {
          const { data: restored } = await supabase
            .from('workout_templates')
            .insert([{ user_id: userId, name: item.template.name, notes: item.template.notes }])
            .select()
            .single();
          if (restored) {
            for (const section of item.sections) {
              const { data: restoredSection } = await supabase
                .from('workout_sections')
                .insert([{ template_id: restored.id, name: section.name, order_index: section.order_index }])
                .select()
                .single();
              if (restoredSection && item.exercises.length > 0) {
                const restoredExercises = item.exercises.map((e: any) => ({
                  template_id: restored.id,
                  section_id: restoredSection.id,
                  exercise_id: e.exercise_id,
                  order_index: e.order_index,
                  target_sets: e.target_sets,
                  target_reps_min: e.target_reps_min,
                  target_reps_max: e.target_reps_max,
                  rest_time_seconds: e.rest_time_seconds,
                }));
                await supabase.from('workout_template_exercises').insert(restoredExercises);
              }
            }
          }
        }
      }
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  reset: () => { 
    set({ days: makeInitialDays(), hasLoadedFromDB: false });
    AsyncStorage.removeItem(SPLIT_BUILDER_KEY).catch(() => {});
  },
}));

// Persist builder state to AsyncStorage with debounce
let persistTimer: ReturnType<typeof setTimeout> | null = null;
useSplitBuilderStore.subscribe((state) => {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    AsyncStorage.setItem(SPLIT_BUILDER_KEY, JSON.stringify({ days: state.days })).catch(() => {});
  }, 500);
});
