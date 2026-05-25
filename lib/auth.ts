import { supabase } from './supabase';

export interface HealthProfile {
  goal: 'fat_loss' | 'muscle_gain' | 'stamina' | null;
  conditions: string[];
  age: number | null;
  gender: 'male' | 'female' | 'other' | null;
  height: number | null;
  heightUnit: 'cm' | 'ft';
  weight: number | null;
  weightUnit: 'kg' | 'lbs';
  targetWeight: number | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  onboarding_complete: boolean;
  health_profile: HealthProfile;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
    steps: number;
  };
}

export const defaultHealthProfile: HealthProfile = {
  goal: null,
  conditions: [],
  age: null,
  gender: null,
  height: null,
  heightUnit: 'cm',
  weight: null,
  weightUnit: 'kg',
  targetWeight: null,
};

/**
 * Sign up a new user with email/password.
 * Creates a Supabase auth account + a row in the `profiles` table.
 */
export async function signUpUser(
  email: string,
  password: string,
  name: string
): Promise<UserProfile> {
  // 1. Create auth account
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('Signup failed.');

  // FIX[2]: Ensure profiles row exists (do not rely on DB triggers in production).
  const { error: profileUpsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: data.user.id,
        full_name: name,
        onboarding_complete: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
  if (profileUpsertError) {
    console.error('[signUpUser] profiles upsert error:', profileUpsertError);
  }
  
  try {
    const profile = await getCurrentUserProfile(data.user.id);
    return { ...profile, email };
  } catch (e) {
    // Fallback if trigger hasn't finished or failed
    return {
      id: data.user.id,
      name,
      email,
      avatar_url: null,
      onboarding_complete: false,
      created_at: new Date().toISOString(),
      health_profile: defaultHealthProfile,
      goals: {
        calories: 1800,
        protein: 150,
        carbs: 200,
        fat: 60,
        water: 8,
        steps: 10000,
      },
    };
  }
}

/**
 * Sign in with email + password. Fetches profile from DB.
 */
export async function signInUser(
  email: string,
  password: string
): Promise<UserProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign in failed.');

  // FIX[2]: Attach auth email; profiles schema doesn't store it.
  const profile = await getCurrentUserProfile(data.user.id);
  return { ...profile, email: data.user.email || email };
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Fetch the profile row for a given uid.
 */
export async function getCurrentUserProfile(uid: string): Promise<UserProfile> {
  // FIX[2]: DB schema is flat (profiles.* columns). Map to app's nested health_profile shape.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Profile not found.');

  return {
    id: data.id,
    name: data.full_name || 'User',
    email: '', // FIX[2]: email is auth-side; UI generally uses auth email from session/userStore.
    avatar_url: null,
    created_at: data.updated_at || new Date().toISOString(),
    onboarding_complete: !!data.onboarding_complete,
    health_profile: {
      ...defaultHealthProfile,
      age: data.age ?? null,
      weight: data.weight_kg ?? null,
      weightUnit: 'kg',
      height: data.height_cm ?? null,
      heightUnit: 'cm',
      goal: (data.goal as any) ?? null,
      conditions: data.health_conditions || [],
    },
    goals: {
      calories: data.calorie_goal ?? 1800,
      protein: data.protein_goal_g ?? 150,
      carbs: data.carbs_goal_g ?? 200,
      fat: data.fat_goal_g ?? 60,
      water: data.water_goal_glasses ?? 8,
      steps: data.steps_goal ?? 10000,
    },
  };
}

/**
 * Update fields on the profile row.
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> {
  // FIX[2]: Upsert the onboarding fields into the flat schema and set onboarding_complete correctly.
  const hp = updates.health_profile;
  const payload: any = {
    id: uid,
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.full_name = updates.name;
  if (updates.onboarding_complete !== undefined) payload.onboarding_complete = updates.onboarding_complete;

  if (hp) {
    let finalWeight = hp.weight;
    if (hp.weight && hp.weightUnit === 'lbs') {
      finalWeight = Math.round(hp.weight / 2.20462 * 10) / 10;
    }

    let finalHeight = hp.height;
    if (hp.height && hp.heightUnit === 'ft') {
      // Assuming decimal feet e.g., 5.7 ft
      finalHeight = Math.round(hp.height * 30.48);
    }

    payload.age = hp.age ?? null;
    payload.weight_kg = finalWeight ?? null;
    payload.height_cm = finalHeight ?? null;
    payload.goal = hp.goal ?? null;
    payload.health_conditions = hp.conditions ?? [];
  }

  if (updates.goals) {
    payload.calorie_goal = updates.goals.calories;
    payload.protein_goal_g = updates.goals.protein;
    payload.carbs_goal_g = updates.goals.carbs;
    payload.fat_goal_g = updates.goals.fat;
    payload.water_goal_glasses = updates.goals.water;
    payload.steps_goal = updates.goals.steps;
  }

  // FIX[1]: Wrap DB write and log errors (no silent failures).
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();

  if (error) {
    console.error('[updateUserProfile] upsert error:', error);
    throw new Error(error.message);
  }

  console.log('[updateUserProfile] upsert ok:', data);
}
