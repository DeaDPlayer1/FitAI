import { supabase } from './supabase';

export interface ExerciseSetData {
  id: string;
  weight: number;
  reps: number;
  rir: number | null;
  is_completed: boolean;
  rest_time_taken: number | null;
}

export const WorkoutService = {
  /**
   * Silently ensures an exercise exists in the DB and returns its UUID.
   * This allows us to use a static internal library for speed, but preserve DB integrity.
   */
  async getOrCreateExercise(userId: string, exercise: any) {
    try {
      // 1. Check if it already exists by name
      const { data: existing, error: fetchError } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', exercise.name)
        .maybeSingle();

      if (existing) return existing.id;

      // 2. If not, create it silently for this user
      const { data: created, error: createError } = await supabase
        .from('exercises')
        .insert([{
          name: exercise.name,
          target_muscle_group: exercise.muscle || exercise.target_muscle_group || 'Other',
          equipment: exercise.equipment || exercise.equipment_type || 'None',
          created_by: userId,
          is_custom: true
        }])
        .select('id')
        .single();

      if (createError) throw createError;
      return created.id;
    } catch (err) {
      console.error('[WorkoutService] getOrCreateExercise error:', err);
      throw err;
    }
  },

  /**
   * Fetch custom exercises for the current user.
   */
  async fetchCustomExercises(userId: string) {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('created_by', userId)
      .eq('is_custom', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new custom exercise.
   */
  async createCustomExercise(userId: string, exerciseData: any) {
    const { data, error } = await supabase
      .from('exercises')
      .insert([{
        created_by: userId,
        name: exerciseData.name,
        target_muscle_group: exerciseData.muscle,
        equipment: exerciseData.equipment,
        is_custom: true
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Fetch previous performance for a user across a set of exercises.
   * This calls our custom RPC which uses the ROW_NUMBER() window function
   * to get the exact latest performance for each set number of each exercise.
   */
  async getPreviousPerformances(userId: string, exerciseIds: string[]) {
    try {
      const { data, error } = await supabase
        .rpc('get_previous_exercise_performance', {
          p_exercise_ids: exerciseIds,
        });

      if (error) {
        console.error('Error fetching previous performances:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('getPreviousPerformances exception:', err);
      return [];
    }
  },

  /**
   * Starts a blank workout session or one from a template.
   */
  async startSession(userId: string, name: string, templateId?: string) {
    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert([
        {
          user_id: userId,
          template_id: templateId || null,
          name: name,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return session;
  },

  /**
   * Completes a set, saving it to the database
   */
  async completeSet(setId: string, data: { weight: number; reps: number; rir: number; rest_taken: number }) {
    const { error } = await supabase
      .from('workout_session_sets')
      .update({
        weight: data.weight,
        reps: data.reps,
        rir: data.rir,
        is_completed: true,
        completed_at: new Date().toISOString(),
        rest_time_taken: data.rest_taken,
      })
      .eq('id', setId);

    if (error) throw error;
  },

  /**
   * Create a new set row
   */
  async addSet(sessionExerciseId: string, sessionId: string, userId: string, exerciseId: string, setNumber: number) {
    const { data, error } = await supabase
      .from('workout_session_sets')
      .insert([
        {
          session_exercise_id: sessionExerciseId,
          session_id: sessionId,
          user_id: userId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight: 0,
          reps: 0,
          is_completed: false,
        },
      ])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async completeSession(sessionId: string, data: { duration_seconds: number; exercises_completed: number }) {
    const { error } = await supabase
      .from('workout_sessions')
      .update({
        completed_at: new Date().toISOString(),
        duration_seconds: data.duration_seconds,
        exercises_completed: data.exercises_completed,
        status: 'completed',
      })
      .eq('id', sessionId);

    if (error) throw error;
  },
  /**
   * Load a full template with all its sections and exercises
   */
  async getTemplateDetails(templateId: string) {
    const { data, error } = await supabase
      .from('workout_templates')
      .select(`
        *,
        workout_sections (
          *,
          workout_template_exercises (
            *,
            exercises (*)
          )
        )
      `)
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Initialize a real session and create all the placeholder sets
   */
  async initializeSessionFromTemplate(userId: string, templateId: string) {
    // 1. Get template
    const template = await this.getTemplateDetails(templateId);
    
    // 2. Create session
    const { data: session, error: sError } = await supabase
      .from('workout_sessions')
      .insert([{ user_id: userId, template_id: templateId, name: template.name }])
      .select()
      .single();
    
    if (sError) throw sError;

    // 3. Create session exercises
    // We flatten the sections but keep the section name for UI grouping
    const exercisesToInsert: any[] = [];
    template.workout_sections.forEach((section: any) => {
      section.workout_template_exercises.forEach((te: any) => {
        exercisesToInsert.push({
          session_id: session.id,
          exercise_id: te.exercise_id,
          section_name: section.name,
          order_index: te.order_index
        });
      });
    });

    if (exercisesToInsert.length === 0) {
      throw new Error('This template has no exercises. Please add some exercises to your split in the builder first.');
    }

    const { data: dbSessionExercises, error: exError } = await supabase
      .from('workout_session_exercises')
      .insert(exercisesToInsert)
      .select(`
        *,
        exercises (*)
      `);
    
    if (exError) throw exError;

    // 4. Create empty sets for each exercise based on target_sets
    const setsToInsert: any[] = [];
    dbSessionExercises.forEach((se: any) => {
      // Find matching template exercise to get target_sets
      const te = template.workout_sections
        .flatMap((s: any) => s.workout_template_exercises)
        .find((t: any) => t.exercise_id === se.exercise_id);
      
      const setCount = te?.target_sets || 3;
      for (let i = 1; i <= setCount; i++) {
        setsToInsert.push({
          session_exercise_id: se.id,
          session_id: session.id,
          user_id: userId,
          exercise_id: se.exercise_id,
          set_number: i,
          is_completed: false
        });
      }
    });

    const { data: dbSets, error: setsError } = await supabase
      .from('workout_session_sets')
      .insert(setsToInsert)
      .select();
    
    if (setsError) throw setsError;

    // 5. Fetch previous performance for these exercises
    const exerciseIds = [...new Set(exercisesToInsert.map(e => e.exercise_id))];
    const previousPerformance = await this.getPreviousPerformances(userId, exerciseIds);

    return {
      session,
      exercises: dbSessionExercises,
      sets: dbSets,
      previousPerformance
    };
  },
};
