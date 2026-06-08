import type { ActivePlan, WorkoutDay, WorkoutExercise } from '@/store/aiTrainerStore';
import type { ExerciseRecord } from '@/store/workoutTrackingStore';

const OPENINGS = [
  'Alright, today is {workout}. {recovery_note}',
  "Let's get into it — {workout} today. {recovery_note}",
  'Ready for {workout}? {recovery_note}',
  "{workout} on deck. Let's see what you've got today. {recovery_note}",
];

const RECOVERY_GREEN = [
  'Your recovery is looking solid, so we can push the intensity today.',
  'Sleep and energy look good — let\'s make every set count.',
  'Readiness is high. Good opportunity to push your numbers.',
  'Recovery is on your side today. Time to work.',
];

const RECOVERY_MODERATE = [
  'Recovery is decent — keep quality high but don\'t chase failure.',
  "You're in a good spot. Stay disciplined, don't overreach.",
  'Energy is moderate. Focus on clean reps over maximal weight.',
  'Steady state today — good form, controlled reps.',
];

const RECOVERY_LOW = [
  'Recovery is slightly below normal today. Keep volume moderate and listen to your body.',
  "Fatigue is a bit elevated. We'll keep intensity in check today.",
  'Recovery is down today — prioritize form over load. RPE around 7-8.',
  'Low readiness today. Focus on technique and don\'t push to failure.',
];

const SET_GOOD = [
  'That moved well. Keep it consistent.',
  'Clean execution. Stay at that weight.',
  'Good set. Form looks solid.',
  'Nice pace. Keep the tension throughout.',
  'Solid work. Same weight next set.',
];

const SET_GREAT = [
  'That looked even better than last week.',
  'Strong set — you\'re trending up on that movement.',
  'Much smoother than last session. Keep pushing.',
  'Big improvement. That weight is feeling more controlled.',
  'That moved fast. Consider a small jump next week.',
];

const SET_HEAVY = [
  'Speed slowed there. Keep that weight — don\'t rush progression.',
  'That was a grind. Good fight but stay at this load.',
  "Slower rep speed — don't add weight. Master this first.",
  "That's near your limit today. Stay here for the remaining sets.",
];

const SET_LOW_ENERGY = [
  "Energy seems a bit low there. That's fine — just get the volume in.",
  'Struggled a bit. No problem — consistency matters more than intensity today.',
  "That's okay. Recovery day approach — just complete the reps.",
  "Lower output than usual. Don't force it — trust the process.",
];

const CARDIO_PROMPTS = [
  "Don't forget your cardio today — {minutes} minutes {type}.",
  'Cardio on the schedule: {minutes} min {type}. Keep it steady.',
  'Wrap up with {minutes} minutes of {type} cardio — nothing crazy.',
];

const MOTIVATIONAL_QUOTES = [
  "You're building something real. Every rep counts.",
  "This is where the work gets done. One set at a time.",
  "Trust the process. Results follow consistency.",
  "You're showing up — that's what matters most.",
];

const POST_WORKOUT_OPENERS = [
  'Solid session. How did that feel overall?',
  "Good work today. Give me your honest take — how'd it feel?",
  "Session done. I'd love your feedback — how was the energy?",
  "That's a wrap. Walk me through how that felt.",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateWorkoutOpening(plan: ActivePlan, dayIndex: number): string {
  const day = plan.workoutDays[dayIndex];
  if (!day || day.isRest) return 'Rest day today — focus on recovery.';

  const recoveryNote = getRandom(
    plan.fatigueState?.toLowerCase().includes('high')
      ? RECOVERY_LOW
      : plan.adherenceState?.toLowerCase().includes('good') || plan.fatigueState?.toLowerCase().includes('low')
        ? RECOVERY_GREEN
        : RECOVERY_MODERATE
  );

  const opening = getRandom(OPENINGS)
    .replace('{workout}', day.focus || 'your workout')
    .replace('{recovery_note}', recoveryNote);

  return opening;
}

export function generateSetCoaching(
  exercise: WorkoutExercise,
  setNumber: number,
  totalSets: number,
  isLastSet: boolean,
): string | null {
  const rir = exercise.rir ?? 2;

  if (setNumber === 1 && totalSets > 1) {
    return 'First set — find your working weight. Good warm-up pace.';
  }

  if (isLastSet) {
    if (rir <= 1) return pick(['Last set — leave it all out there.', 'Final set. Push hard.', 'Last one — make it count.']);
    return pick(['Last set — controlled finish.', 'Final set. Stay tight.', 'Wrap it up clean.']);
  }

  if (rir <= 2) {
    return getRandom(SET_GOOD);
  }

  return null;
}

export function generateExerciseIntro(exercise: WorkoutExercise, index: number, total: number): string {
  if (index === 0) {
    return `First movement: ${exercise.name}. ${exercise.sets} × ${exercise.reps}.${exercise.rir ? ` Target ${exercise.rir} RIR.` : ''}`;
  }
  return `Next: ${exercise.name}. ${exercise.sets} × ${exercise.reps}.${exercise.rir ? ` Keep ${exercise.rir} RIR.` : ''}`;
}

export function generateCardioReminder(day: WorkoutDay): string {
  if (!day.cardioMinutes) return '';
  return getRandom(CARDIO_PROMPTS)
    .replace('{minutes}', String(day.cardioMinutes))
    .replace('{type}', 'steady state');
}

export function generateMidWorkoutMessage(completedSets: number, totalSets: number): string {
  const pct = completedSets / totalSets;
  if (pct >= 0.75) return getRandom(MOTIVATIONAL_QUOTES);
  if (pct >= 0.5) return 'Halfway there. Keep pushing through.';
  if (pct >= 0.25) return 'Good pace so far. Stay in the rhythm.';
  return 'Warming up nicely. Build into it.';
}

export function generatePostWorkoutOpening(): string {
  return getRandom(POST_WORKOUT_OPENERS);
}

export function generatePostWorkoutAnalysis(
  exercises: ExerciseRecord[],
  plan: ActivePlan,
  elapsedMinutes: number,
): { summary: string; highlights: string[]; analysis: string } {
  const completedSets = exercises.flatMap(e => e.sets).filter(s => s.isCompleted);
  const totalSets = exercises.flatMap(e => e.sets).length;
  const adherence = totalSets > 0 ? Math.round((completedSets.length / totalSets) * 100) : 0;

  const highlights: string[] = [];
  for (const ex of exercises) {
    const completed = ex.sets.filter(s => s.isCompleted);
    if (completed.length === 0) continue;
    const bestWeight = Math.max(...completed.map(s => parseFloat(s.weight) || 0));
    const bestReps = Math.max(...completed.map(s => parseInt(s.reps) || 0));
    if (bestWeight > 0) {
      highlights.push(`${ex.name}: best set ${bestWeight}kg × ${bestReps}`);
    }
  }

  const summary = `${plan.workoutDays.find(d => !d.isRest)?.focus || 'Workout'} Completed · ${elapsedMinutes}min · ${adherence}% sets done`;

  const performance = adherence >= 90 ? 'Strong' : adherence >= 70 ? 'Moderate' : 'Light';
  const analysis = [
    `Performance: ${performance}`,
    `Volume: ${completedSets.length}/${totalSets} sets completed`,
    ...(highlights.length > 0 ? [`Best lifts: ${highlights.slice(0, 2).join(', ')}`] : []),
  ].join('\n');

  return { summary, highlights, analysis };
}
