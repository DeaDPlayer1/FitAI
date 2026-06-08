import { supabase } from './supabase';
import type {
  HealthProfile, FitnessGoal, ExperienceLevel, ActivityLevel,
  DietType, StressLevel, CardioPreference, EquipmentAccess,
} from './auth';
import { defaultHealthProfile } from './auth';
import type { AiTrainerPhase } from '@/constants/aiTrainerStates';

/**
 * Types for the Phase 0 system boot result.
 */

export type EntryPhase =
  | 'phase_1_onboarding'
  | 'phase_1_resume_onboarding'
  | 'phase_4_weekly_checkin'
  | 'phase_3_active_coaching'
  | 'phase_1_new_goal';

export interface Phase0Result {
  /** Full hydrated profile with all Phase 0 fields */
  hydratedProfile: Phase0Profile;
  /** Which conversation phase to enter */
  entryPhase: EntryPhase;
  /** List of field names that are null/missing */
  gaps: (keyof Phase0Profile)[];
  /** Whether this is a first-ever conversation */
  isNewConversation: boolean;
  /** Whether the user has an active plan applied */
  hasActivePlan: boolean;
  /** Active plan ID if one exists */
  activePlanId: string | null;
  /** Days since last wellness check-in */
  daysSinceLastCheckin: number | null;
}

export interface Phase0Profile {
  name: string | null;
  age: number | null;
  gender: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  goal: FitnessGoal | null;
  experience_level: ExperienceLevel | null;
  activity_level: ActivityLevel | null;
  available_days: number | null;
  equipment: EquipmentAccess | null;
  diet_type: DietType | null;
  injuries: string | null;
  sleep_hours: number | null;
  stress_level: StressLevel | null;
  cardio_preference: CardioPreference | null;
  has_active_plan: boolean;
  active_plan_id: string | null;
  last_checkin_date: string | null;
  onboarding_complete: boolean;
}

const PHASE0_FIELDS: (keyof Phase0Profile)[] = [
  'name', 'age', 'gender', 'weight_kg', 'height_cm', 'goal',
  'experience_level', 'activity_level', 'available_days', 'equipment',
  'diet_type', 'injuries', 'sleep_hours', 'stress_level', 'cardio_preference',
];

/**
 * Load the full Phase 0 profile from Supabase.
 * Falls back gracefully if columns don't exist yet.
 */
async function loadProfileFromDB(userId: string): Promise<Phase0Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.warn('[phase0] Profile load failed:', error?.message);
    return {
      name: null, age: null, gender: null, weight_kg: null, height_cm: null,
      goal: null, experience_level: null, activity_level: null,
      available_days: null, equipment: null, diet_type: null,
      injuries: null, sleep_hours: null, stress_level: null,
      cardio_preference: null, has_active_plan: false, active_plan_id: null,
      last_checkin_date: null, onboarding_complete: false,
    };
  }

  return {
    name: data.full_name || null,
    age: data.age ?? null,
    gender: data.gender ?? null,
    weight_kg: data.weight_kg ?? null,
    height_cm: data.height_cm ?? null,
    goal: (data.goal as FitnessGoal) ?? null,
    experience_level: (data.experience_level as ExperienceLevel) ?? null,
    activity_level: (data.activity_level as ActivityLevel) ?? null,
    available_days: data.available_days ?? null,
    equipment: (data.equipment as EquipmentAccess) ?? null,
    diet_type: (data.diet_type as DietType) ?? null,
    injuries: data.injuries ?? null,
    sleep_hours: data.sleep_hours ?? null,
    stress_level: (data.stress_level as StressLevel) ?? null,
    cardio_preference: (data.cardio_preference as CardioPreference) ?? null,
    has_active_plan: !!data.active_plan_id,
    active_plan_id: data.active_plan_id ?? null,
    last_checkin_date: data.last_checkin_date ?? null,
    onboarding_complete: !!data.onboarding_complete,
  };
}

function parseDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function detectEntryPhase(
  profile: Phase0Profile,
  daysSinceCheckin: number | null,
  coachChatHistory: { role: string; content: string }[],
): EntryPhase {
  const hasPriorConversation = coachChatHistory.length > 0;

  if (profile.has_active_plan && daysSinceCheckin !== null && daysSinceCheckin > 7) {
    return 'phase_4_weekly_checkin';
  }

  if (profile.has_active_plan) {
    return 'phase_3_active_coaching';
  }

  if (hasPriorConversation) {
    return 'phase_1_resume_onboarding';
  }

  return 'phase_1_onboarding';
}

function detectGaps(profile: Phase0Profile): (keyof Phase0Profile)[] {
  const gaps: (keyof Phase0Profile)[] = [];
  for (const field of PHASE0_FIELDS) {
    if (profile[field] === null || profile[field] === undefined) {
      gaps.push(field);
    }
    if (field === 'injuries' && profile.injuries === '') gaps.push(field);
  }
  return gaps;
}

function hasProfileGoalChange(chatHistory: { role: string; content: string }[]): boolean {
  const goalKeywords = [
    'new goal', 'change goal', 'switch to', 'want to', 'reset', 'start over',
    'different goal', 'change my plan', 'new program', 'rebuild',
  ];
  const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
  if (!lastUserMsg) return false;
  const lower = lastUserMsg.content.toLowerCase();
  return goalKeywords.some(k => lower.includes(k));
}

/**
 * Phase 0 — System Boot & Profile Hydration.
 *
 * Called silently before the first AI response in a conversation.
 * Loads the full user profile, determines the entry phase,
 * and reports which fields are missing.
 */
export async function phase0SystemBoot(
  userId: string | undefined,
  coachChatHistory: { role: string; content: string }[],
): Promise<Phase0Result> {
  const profile = userId
    ? await loadProfileFromDB(userId)
    : {
        name: null, age: null, gender: null, weight_kg: null, height_cm: null,
        goal: null, experience_level: null, activity_level: null,
        available_days: null, equipment: null, diet_type: null,
        injuries: null, sleep_hours: null, stress_level: null,
        cardio_preference: null, has_active_plan: false, active_plan_id: null,
        last_checkin_date: null, onboarding_complete: false,
      };

  const daysSinceCheckin = parseDaysSince(profile.last_checkin_date);
  const isNewConversation = coachChatHistory.length === 0;

  let entryPhase = detectEntryPhase(profile, daysSinceCheckin, coachChatHistory);

  if (entryPhase === 'phase_1_resume_onboarding' && hasProfileGoalChange(coachChatHistory)) {
    entryPhase = 'phase_1_new_goal';
  }

  const gaps = detectGaps(profile);

  console.log('[phase0] Boot complete:', {
    entryPhase,
    gaps,
    isNewConversation,
    hasActivePlan: profile.has_active_plan,
  });

  return {
    hydratedProfile: profile,
    entryPhase,
    gaps,
    isNewConversation,
    hasActivePlan: profile.has_active_plan,
    activePlanId: profile.active_plan_id,
    daysSinceLastCheckin: daysSinceCheckin,
  };
}

/**
 * Build a human-readable profile summary for the system prompt,
 * marking missing fields so the AI knows not to ask about them again.
 */
export function buildPhase0Summary(result: Phase0Result): string {
  const p = result.hydratedProfile;
  const lines: string[] = [
    '## PHASE 0 — SYSTEM BOOT',
    `Entry Phase: ${result.entryPhase}`,
    `Is New Conversation: ${result.isNewConversation}`,
    `Has Active Plan: ${result.hasActivePlan}`,
    `Days Since Last Check-In: ${result.daysSinceLastCheckin ?? 'N/A'}`,
    '',
    '### User Profile',
  ];

  const addField = (label: string, value: unknown) => {
    lines.push(`- ${label}: ${value ?? '⚠️ MISSING — Ask user'}`);
  };

  addField('Name', p.name);
  addField('Age', p.age);
  addField('Gender', p.gender);
  addField('Weight (kg)', p.weight_kg);
  addField('Height (cm)', p.height_cm);
  addField('Goal', p.goal);
  addField('Experience Level', p.experience_level);
  addField('Activity Level', p.activity_level);
  addField('Available Days/Week', p.available_days);
  addField('Equipment', p.equipment);
  addField('Diet Type', p.diet_type);
  addField('Injuries', p.injuries ? `Yes: ${p.injuries}` : null);
  addField('Sleep Hours', p.sleep_hours);
  addField('Stress Level', p.stress_level);
  addField('Cardio Preference', p.cardio_preference);

  if (result.gaps.length > 0) {
    lines.push('', '### Missing Profile Fields');
    lines.push(`The following fields are missing: ${result.gaps.join(', ')}.`);
    lines.push('Ask about these fields naturally during the conversation — do NOT ask all at once.');
    lines.push('Only collect missing information when it is relevant to the current topic.');
  }

  return lines.join('\n');
}

/**
 * Build an onboarding directive for the system prompt based on the entry phase.
 */
export function buildPhase0Directives(phase: EntryPhase): string {
  switch (phase) {
    case 'phase_1_onboarding':
      return `You are in ONBOARDING mode. The user is new and has no active plan.
Your goal is to:
1. Welcome them warmly
2. Collect any missing profile information naturally as you converse
3. Discover their fitness goals, experience level, and preferences
4. Ask about injuries, sleep, stress, and diet only when relevant
5. Do NOT generate a workout plan until all required fields are collected`;

    case 'phase_1_resume_onboarding':
      return `You are RESUMING ONBOARDING. The user started onboarding previously but didn't finish.
Your goal is to:
1. Pick up where you left off — ask about remaining missing fields
2. Do NOT re-ask for info they already provided
3. Complete their profile so a plan can be generated`;

    case 'phase_4_weekly_checkin':
      return `You are in WEEKLY CHECK-IN mode. The user has an active plan but hasn't checked in for over 7 days.
Your goal is to:
1. Greet them and ask how their week went
2. Review their adherence to the current plan
3. Adjust the plan if needed based on their feedback
4. Ask about any new injuries, stress, or schedule changes`;

    case 'phase_3_active_coaching':
      return `You are in ACTIVE COACHING mode. The user has an active plan and is mid-week.
Your goal is to:
1. Reference their current plan
2. Provide daily coaching — form tips, motivation, recovery advice
3. Answer questions about their workouts, nutrition, or progress
4. Do NOT suggest a new plan unless they explicitly ask for changes`;

    case 'phase_1_new_goal':
      return `The user wants to CHANGE their goal or reset their plan.
Your goal is to:
1. Acknowledge their new direction
2. Ask what they want to achieve
3. Collect any new information needed
4. Prepare to generate a fresh plan aligned with their new goal`;

    default:
      return '';
  }
}
