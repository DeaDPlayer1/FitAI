import { supabase } from './supabase';
import { useNutritionStore } from '@/store/nutritionStore';
import { useUserStore } from '@/store/userStore';
import { useWorkoutStore } from '@/store/workoutStore';

/**
 * Fetches all user data from Supabase and populates the local stores.
 */
export async function syncUserData(userId: string) {
  try {
    // 1. Sync Health Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // FIX[1]: Never allow silent failures in sync (log the root cause).
    if (profileError) {
      console.error('[syncUserData] profiles select error:', profileError);
    }

    if (profile) {
      // FIX[2]: Map DB schema to app's nested health_profile shape.
      useUserStore.getState().setUser({
        id: profile.id,
        email: '', // FIX[2]: email lives in auth.users; not stored in profiles schema
        name: profile.full_name || 'User',
        onboarding_complete: !!profile.onboarding_complete,
        created_at: profile.updated_at || new Date().toISOString(),
        avatar_url: null,
        health_profile: {
          age: profile.age ?? null,
          gender: null,
          weight: profile.weight_kg ?? null,
          height: profile.height_cm ?? null,
          goal: profile.goal ?? null,
          conditions: profile.health_conditions || [],
          weightUnit: 'kg',
          heightUnit: 'cm',
          targetWeight: null,
        },
        goals: {
          calories: profile.calorie_goal ?? 1800,
          protein: profile.protein_goal_g ?? 150,
          carbs: profile.carbs_goal_g ?? 200,
          fat: profile.fat_goal_g ?? 60,
          water: profile.water_goal_glasses ?? 8,
          steps: profile.steps_goal ?? 10000,
        },
      });

      // Sync calorieGoal to nutrition store
      useNutritionStore.getState().setCalorieGoal(profile.calorie_goal ?? 1800);
    }

    // 2. Sync Today's Food Logs
    // FIX[3]: Filter by user_id AND logged_at within current day window (UTC-safe using ISO).
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const { data: meals, error: mealsError } = await supabase
      .from('meal_logs')
      .select('id, user_id, food_name, calories, protein_g, carbs_g, fat_g, meal_type, logged_at')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay.toISOString())
      .lt('logged_at', endOfDay.toISOString())
      .order('logged_at', { ascending: false });

    // FIX[3]: Log raw Supabase result when debugging "saved but not visible".
    if (mealsError) {
      console.error('[syncUserData] meal_logs select error:', mealsError);
    } else {
      console.log('[syncUserData] meal_logs raw rows:', meals);
    }

    if (meals) {
      const formattedMeals = meals.map(m => ({
        id: m.id,
        mealType: m.meal_type,
        foodName: m.food_name,
        calories: Number(m.calories ?? 0),
        protein_g: Number(m.protein_g ?? 0),
        carbs_g: Number(m.carbs_g ?? 0),
        fat_g: Number(m.fat_g ?? 0),
        loggedAt: m.logged_at,
      }));
      useNutritionStore.getState().setFoodLogs(formattedMeals as any);
    }

    // 3. Sync Weight History
    const { data: weights, error: weightsError } = await supabase
      .from('weight_logs')
      .select('weight_kg, logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(10);

    // FIX[1]: Log weight fetch errors (helps diagnose RLS/policy issues).
    if (weightsError) {
      console.error('[syncUserData] weight_logs select error:', weightsError);
    }

    // Note: Dashboard chart fetches its own data, but we could store this in a weightStore if needed.

    // 4. Sync Workout Logs (for Stats + My Workout tab)
    const { data: workouts, error: workoutsError } = await supabase
      .from('workout_logs')
      .select('id, user_id, plan_name, exercises, source, duration_minutes, logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(50);

    if (workoutsError) {
      console.error('[syncUserData] workout_logs select error:', workoutsError);
    } else {
      useWorkoutStore.getState().setWorkoutLogs(workouts as any);
    }

    console.log('Sync complete for user:', userId);
  } catch (error) {
    console.error('Sync Error:', error);
  }
}
