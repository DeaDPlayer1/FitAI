import type { ProfileInput, CalorieResult, WorkoutDayDetail } from './phaseCalculations';
import {
  calculateFullPlan, selectSplit, calculateVolume, recommendCardio,
  getInjuryReplacements, formatNutritionOutput, calculateRecoveryFlag,
} from './phaseCalculations';

export interface GeneratedPlan {
  calories: CalorieResult;
  splitType: string;
  days: WorkoutDayDetail[];
  nutrition: string;
  coachingNote: string;
  recoveryFlag: 'good' | 'fair' | 'poor';
  weeklyVolumeLevel: string;
}

/** Generate a complete plan from profile input */
export function generatePlan(input: ProfileInput): GeneratedPlan {
  const calories = calculateFullPlan(input);
  const splitType = selectSplit(input);
  const volume = calculateVolume(input.experience_level, input.sleep_hours, input.stress_level, input.goal);
  const cardio = recommendCardio(input.goal, input.cardio_preference);
  const recoveryFlag = calculateRecoveryFlag(input.sleep_hours, input.stress_level);
  const nutrition = formatNutritionOutput(
    calories.targetCalories, calories.targetProteinG,
    calories.targetCarbsG, calories.targetFatG, input.diet_type,
  );
  const injuryReplacements = input.injuries ? getInjuryReplacements(input.injuries) : [];

  const weeklyVolumeLevel = volume.volumeReduction > 0
    ? `Reduced (${volume.volumeReduction}% cut due to recovery concerns)`
    : 'Standard';

  const days = buildTrainingDays(input, splitType, volume, cardio, injuryReplacements);

  const coachingNote = buildCoachingNote(input, calories, recoveryFlag, volume, splitType);

  return { calories, splitType, days, nutrition, coachingNote, recoveryFlag, weeklyVolumeLevel };
}

function buildTrainingDays(
  input: ProfileInput, splitType: string,
  volume: { setsPerExercise: string; repRange: string; rirTarget: string; volumeReduction: number },
  cardio: string, injuryReplacements: string[],
): WorkoutDayDetail[] {
  const days: WorkoutDayDetail[] = [];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const parseSplit = (split: string): string[] => {
    if (split.includes('Full Body')) return Array(input.available_days < 4 ? input.available_days : 3).fill('Full Body');
    if (split.includes('Upper / Lower')) return ['Upper', 'Lower', 'Upper', 'Lower'];
    if (split.includes('PPL + Upper')) return ['Push', 'Pull', 'Legs', 'Upper'];
    if (split.includes('Arms+Shoulders')) return ['Push', 'Pull', 'Legs', 'Arms+Shoulders'];
    if (split.includes('PPL / Upper / Lower')) return ['Push', 'Pull', 'Legs', 'Upper', 'Lower'];
    if (split.includes('Specialization')) return ['Push', 'Pull', 'Legs', 'Upper', 'Shoulders+Arms'];
    if (split.includes('PPL × 2')) return ['Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B'];
    return ['Push', 'Pull', 'Legs'];
  };

  const foci = parseSplit(splitType);
  const muscleGroups: Record<string, string[]> = {
    'Push': ['Chest', 'Front Delts', 'Triceps'],
    'Pull': ['Back', 'Rear Delts', 'Biceps'],
    'Legs': ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
    'Upper': ['Chest', 'Back', 'Shoulders', 'Arms'],
    'Lower': ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
    'Full Body': ['Upper Body', 'Lower Body', 'Core'],
    'Arms+Shoulders': ['Biceps', 'Triceps', 'Delts'],
    'Shoulders+Arms': ['Delts', 'Biceps', 'Triceps'],
  };

  const exercisePools: Record<string, string[]> = {
    'Chest': ['Barbell Bench Press', 'Dumbbell Press', 'Incline Press', 'Cable Fly', 'Machine Chest Press'],
    'Back': ['Lat Pulldown', 'Barbell Row', 'Cable Row', 'Pull-Up', 'Seated Row'],
    'Shoulders': ['DB Shoulder Press', 'Lateral Raise', 'Face Pull', 'Cable Lateral Raise'],
    'Quads': ['Barbell Squat', 'Leg Press', 'Bulgarian Split Squat', 'Goblet Squat', 'Leg Extension'],
    'Glutes': ['Hip Thrust', 'Romanian Deadlift', 'Step-Up', 'Cable Pull-Through'],
    'Hamstrings': ['Leg Curl', 'RDL', 'Nordic Curl', 'Good Morning'],
    'Biceps': ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Cable Curl'],
    'Triceps': ['Tricep Pushdown', 'Overhead Extension', 'Skull Crusher', 'Close Grip Press'],
    'Calves': ['Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise'],
    'Core': ['Plank', 'Hanging Leg Raise', 'Cable Crunch', 'Pallof Press'],
    'Front Delts': ['DB Shoulder Press', 'Front Raise', 'Arnold Press'],
    'Rear Delts': ['Face Pull', 'Reverse Fly', 'Bent-Over Lateral Raise'],
  };

  const injuryFilter = (exercises: string[]): string[] => {
    if (!input.injuries || !injuryReplacements.length) return exercises;
    const avoid: Record<string, RegExp[]> = {
      knee: [/squat/i, /leg press/i, /lunge/i],
      shoulder: [/overhead press/i, /upright row/i],
      back: [/deadlift/i, /bent.?over row/i],
      wrist: [/barbell curl/i, /pushup/i],
    };
    for (const [key, patterns] of Object.entries(avoid)) {
      if (input.injuries.toLowerCase().includes(key)) {
        return exercises.filter(e => !patterns.some(p => p.test(e)));
      }
    }
    return exercises;
  };

  for (let i = 0; i < foci.length; i++) {
    const focus = foci[i];
    const groups = muscleGroups[focus] || [focus];
    const exercises: { name: string; sets: string; reps: string; rir: string; notes?: string }[] = [];

    for (const group of groups) {
      const pool = injuryFilter(exercisePools[group] || [group]);
      if (pool.length === 0) continue;
      const chosen = pool.slice(0, 2);
      for (const ex of chosen) {
        exercises.push({
          name: ex,
          sets: volume.setsPerExercise,
          reps: volume.repRange,
          rir: volume.rirTarget,
          notes: input.experience_level === 'beginner' ? 'Focus on form over weight' : undefined,
        });
      }
    }

    const estimatedMinutes = exercises.length * (input.goal === 'strength' ? 5 : 4) + 10;

    const focusCues: Record<string, string> = {
      'Push': 'Control the eccentric — don\'t bounce',
      'Pull': 'Squeeze your shoulder blades together',
      'Legs': 'Depth over weight — protect your knees',
      'Upper': 'Mind-muscle connection in every rep',
      'Lower': 'Drive through your heels',
      'Full Body': 'Stay tight on every set',
    };

    days.push({
      dayName: dayNames[i] || `Day ${i + 1}`,
      focus,
      muscleGroup: groups.join(', '),
      sets: exercises,
      cardio: cardio || undefined,
      estimatedMinutes,
      recoveryLoad: calculateRecoveryFlag(input.sleep_hours, input.stress_level) === 'poor' ? 'Low' : 'Moderate',
      focusCue: focusCues[focus] || 'Control each rep',
    });
  }

  return days;
}

function buildCoachingNote(
  input: ProfileInput, calories: CalorieResult,
  recoveryFlag: string, volume: { volumeReduction: number },
  splitType: string,
): string {
  const notes: string[] = [];

  if (volume.volumeReduction > 0) {
    notes.push(
      `Since your recovery markers (sleep: ${input.sleep_hours}h, stress: ${input.stress_level}) suggest you're not fully recovered, I've reduced volume by ~${volume.volumeReduction}%. This protects your joints and nervous system while you still make progress.`,
    );
  }

  if (input.experience_level === 'beginner') {
    notes.push(
      `Since you're newer to training, I've kept volume on the lower side — 1–2 working sets per exercise rather than the full 3–4. This protects your joints and tendons while your connective tissue catches up to your muscle memory.`,
    );
  }

  notes.push(
    `The ${input.goal === 'fat_loss' ? 'calorie target' : 'nutrition plan'} is designed to ${calories.explanation.split('.')[0].toLowerCase()}.`,
  );

  if (input.goal === 'fat_loss') {
    notes.push(
      `The ${splitType} split keeps frequency high so even in a deficit, you're stimulating each muscle group enough to preserve muscle.`,
    );
  }

  if (input.goal === 'muscle_gain') {
    notes.push(
      `The ${splitType} split gives each muscle group enough volume and recovery for hypertrophy. We'll progress overload week over week.`,
    );
  }

  if (input.injuries) {
    notes.push(
      `I've avoided exercises that could aggravate your ${input.injuries}. Listen to your body — if something doesn't feel right, stop and we'll swap it.`,
    );
  }

  return notes.join('\n\n');
}

/** Format the full plan output for display */
export function formatPlan(plan: GeneratedPlan, userName?: string): string {
  const lines: string[] = [
    `# 🎯 Your Personalized Plan — ${userName || 'Athlete'}`,
    '',
    '---',
    '## 🧮 NUTRITION',
    '---',
    '',
    plan.nutrition,
    '',
    '---',
    '## 🏋️ TRAINING SPLIT',
    '---',
    `**Split:** ${plan.splitType}`,
    `**Weekly Volume:** ${plan.weeklyVolumeLevel}`,
    `**Recovery Status:** ${plan.recoveryFlag === 'poor' ? '⚠️ Reduced volume due to recovery' : '✅ Optimal'}`,
    '',
  ];

  for (const day of plan.days) {
    lines.push('─────────────────────────────────');
    lines.push(`📅 ${day.dayName} — ${day.focus}`);
    lines.push('─────────────────────────────────');
    lines.push('');

    const groups = new Map<string, { name: string; sets: string; reps: string; rir: string; notes?: string }[]>();
    for (const ex of day.sets) {
      const group = day.muscleGroup;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(ex);
    }

    for (const [group, exercises] of groups) {
      lines.push(`💪 **${group}**`);
      for (const ex of exercises) {
        const note = ex.notes ? ` — ${ex.notes}` : '';
        lines.push(`- ${ex.name} — ${ex.sets} sets × ${ex.reps} reps — ${ex.rir}${note}`);
      }
      lines.push('');
    }

    if (day.cardio) {
      lines.push('🏃 **Cardio**');
      lines.push(`- ${day.cardio}`);
      lines.push('');
    }

    lines.push('📊 **Session Stats**');
    lines.push(`Recovery Load: ${day.recoveryLoad}`);
    lines.push(`Estimated Time: ~${day.estimatedMinutes} mins`);
    lines.push(`Focus Cue: ${day.focusCue}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('## 📋 COACHING NOTE');
  lines.push('---');
  lines.push('');
  lines.push(plan.coachingNote);
  lines.push('');
  lines.push('---');
  lines.push('Looks good? This plan is fully personalized for your goal, recovery, and schedule.');
  lines.push('Tap below to activate it.');
  lines.push('');
  lines.push('[ ✅ I want to use this plan ]');
  lines.push('---');

  return lines.join('\n');
}
