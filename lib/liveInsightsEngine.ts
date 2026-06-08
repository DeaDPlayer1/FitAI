import type { InsightCard } from '@/store/liveContextStore';

export interface InsightInput {
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
  water: number;
  waterGoal: number;
  steps: number;
  stepsGoal: number;
  streakDays: number;
  mealsLogged: number;
  todayExerciseMin: number;
  latestWeight: number | null;
  previousWeight: number | null;
  sleepHours: number | null;
  previousSleep: number | null;
  adherenceTrend: 'improving' | 'declining' | 'stable' | null;
  completedWorkoutsThisWeek: number;
  plannedWorkoutsThisWeek: number;
  weeklyWorkoutsLastWeek: number;
  readinessScore: number;
  fatigueLevel: number;
  stressLevel: number | null;
  motivationLevel: number | null;
}

function trendWord(trend: 'up' | 'down' | 'stable'): string {
  const adjectives: Record<string, string[]> = {
    up: ['climbing', 'improving', 'rising', 'trending upward', 'on the rise', 'strengthening', 'gaining momentum'],
    down: ['declining', 'dropping', 'trending downward', 'softening', 'dipping', 'cooling off'],
    stable: ['steady', 'consistent', 'stable', 'holding', 'maintaining', 'balanced'],
  };
  const pool = adjectives[trend] || adjectives.stable;
  return pool[Math.floor(Math.random() * pool.length)];
}

function insightPrefix(trend: 'up' | 'down' | 'stable'): string {
  const prefixes: Record<string, string[]> = {
    up: ['Solid progress —', 'Good trend —', 'Nice —', 'Promising sign —', 'Momentum building —'],
    down: ['Heads up —', 'Worth watching —', 'Noticing a dip —', 'Slight concern —', 'Flagging this —'],
    stable: ['Right on track —', 'Looking good —', 'Consistent —', 'No complaints —', 'Steady as always —'],
  };
  const pool = prefixes[trend] || prefixes.stable;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateAdherenceInsight(input: InsightInput): InsightCard | null {
  const pct = input.calorieGoal > 0 ? (input.calories / input.calorieGoal) * 100 : 0;
  if (pct === 0 && input.mealsLogged === 0) return null;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  let headline: string;
  let body: string;

  if (pct > 110) {
    trend = 'up';
    headline = 'Calories tracking above target today';
    body = input.protein >= input.proteinGoal * 0.8
      ? `${insightPrefix(trend)} Calories ran a bit hot today, but protein stayed solid which softens the impact on body composition.`
      : `${insightPrefix(trend)} Calories came in above target. Might be worth tightening up portions tomorrow if this becomes a pattern.`;
  } else if (pct >= 80) {
    trend = 'stable';
    headline = `${Math.round(pct)}% of calorie target hit`;
    body = input.protein >= input.proteinGoal
      ? `${insightPrefix(trend)} Hit your calorie target with protein right on goal — that's textbook fat loss setup.`
      : `${insightPrefix(trend)} Calorie adherence is solid. Protein is a bit behind target — a shake or lean meat serving could close the gap.`;
  } else if (pct >= 50) {
    trend = 'down';
    headline = `${Math.round(pct)}% of calorie target hit`;
    body = input.mealsLogged >= 2
      ? `${insightPrefix(trend)} You're at ${Math.round(pct)}% of calories with ${input.mealsLogged} meals logged. A solid dinner could bring this into a good range.`
      : `${insightPrefix(trend)} Sitting at ${Math.round(pct)}% of your calorie target. If appetite is low, focus on protein-dense foods to protect recovery.`;
  } else {
    trend = 'down';
    headline = 'Low intake day';
    body = `${insightPrefix(trend)} Significantly below calorie target today. If this is intentional (fasting or diet break), all good. If not, consider adding a nutrient-dense meal to support recovery.`;
  }

  return { id: 'adherence', type: 'adherence', headline, body, trend, urgency: pct < 50 ? 'high' : pct > 110 ? 'medium' : 'low' };
}

function generateProteinInsight(input: InsightInput): InsightCard | null {
  if (input.proteinGoal === 0) return null;
  const pct = input.protein / input.proteinGoal;

  if (pct >= 1) {
    return {
      id: 'protein', type: 'nutrition', headline: 'Protein target crushed today',
      body: `${insightPrefix('up')} Hit protein goal with room to spare. Muscle protein synthesis is well supported tonight.`,
      trend: 'up', urgency: 'low',
    };
  }
  if (pct >= 0.7) {
    return {
      id: 'protein', type: 'nutrition', headline: `Protein at ${Math.round(pct * 100)}% of goal`,
      body: `Close enough that a single serving (chicken, tofu, shake) would close the gap. Recovery depends on hitting this consistently.`,
      trend: 'stable', urgency: 'low',
    };
  }
  return {
    id: 'protein', type: 'nutrition', headline: 'Protein intake well below target',
    body: `${insightPrefix('down')} Protein is significantly behind today. Low protein directly impacts recovery and muscle retention — prioritize it if possible.`,
    trend: 'down', urgency: 'high',
  };
}

function generateWeightInsight(input: InsightInput): InsightCard | null {
  if (!input.latestWeight || !input.previousWeight) return null;
  const diff = input.latestWeight - input.previousWeight;
  const absDiff = Math.abs(diff);

  if (diff < -0.3) {
    return {
      id: 'weight', type: 'weight', headline: `${absDiff} kg drop since last weigh-in`,
      body: diff > -1
        ? `${insightPrefix('up')} Losing at a rate that's aggressive enough for progress but controlled enough to protect muscle. Ideal fat loss pace.`
        : `${insightPrefix('up')} Weight is dropping quickly. If this continues, energy and recovery may take a hit — consider a slight calorie bump if performance drops.`,
      trend: 'down', urgency: absDiff > 1 ? 'medium' : 'low',
    };
  }
  if (diff > 0.3) {
    return {
      id: 'weight', type: 'weight', headline: `${absDiff} kg increase from last weigh-in`,
      body: `${insightPrefix('up')} Weight is moving up. If you're in a surplus, this is expected and productive. If maintenance or deficit, it's likely just water fluctuation — watch the trend, not the day.`,
      trend: 'up', urgency: 'low',
    };
  }
  return {
    id: 'weight', type: 'weight', headline: 'Weight stable',
    body: `${insightPrefix('stable')} Weight holding steady. If that's the goal, perfect. If you're trying to cut or bulk, you may need a calorie adjustment to break the plateau.`,
    trend: 'stable', urgency: 'low',
  };
}

function generateRecoveryInsight(input: InsightInput): InsightCard | null {
  if (!input.sleepHours) return null;

  const sleepDiff = input.previousSleep ? input.sleepHours - input.previousSleep : 0;

  if (input.sleepHours >= 7.5) {
    return {
      id: 'recovery', type: 'recovery', headline: `${input.sleepHours.toFixed(1)}h sleep — solid recovery`,
      body: sleepDiff > 0.5
        ? `${insightPrefix('up')} Sleep improved significantly from last night. Recovery quality should be noticeably better today.`
        : `${insightPrefix('up')} Sleep in the optimal range. Consistency here is the real game-changer for performance and body composition.`,
      trend: 'up', urgency: 'low',
    };
  }
  if (input.sleepHours >= 6) {
    return {
      id: 'recovery', type: 'recovery', headline: `${input.sleepHours.toFixed(1)}h sleep — functional but suboptimal`,
      body: sleepDiff < -0.5
        ? `${insightPrefix('down')} Sleep dropped compared to your recent average. Today might not be the best day for PR attempts — maintenance volume is fine.`
        : `${insightPrefix('stable')} Sleep is adequate but not optimal. If this is a pattern, even 30 more minutes would meaningfully improve recovery.`,
      trend: sleepDiff < -0.5 ? 'down' : 'stable', urgency: input.fatigueLevel > 6 ? 'medium' : 'low',
    };
  }
  return {
    id: 'recovery', type: 'recovery', headline: `${input.sleepHours.toFixed(1)}h sleep — low recovery`,
    body: `${insightPrefix('down')} Sleep is below optimal range. Recovery will be compromised today. Consider adjusting training intensity — maintenance work over pushing hard.`,
    trend: 'down', urgency: 'high',
  };
}

function generateMotivationInsight(input: InsightInput): InsightCard | null {
  if (input.streakDays === 0) return null;

  if (input.streakDays >= 14) {
    return {
      id: 'streak', type: 'streak', headline: `${input.streakDays}-day streak — locked in`,
      body: `${insightPrefix('up')} Two full weeks of consistency. The habit is forming — this is where results start compounding noticeably.`,
      trend: 'up', urgency: 'low',
    };
  }
  if (input.streakDays >= 7) {
    return {
      id: 'streak', type: 'streak', headline: `${input.streakDays}-day streak going`,
      body: `A full week of consistency. The hardest part is behind you — momentum makes it easier to keep going.`,
      trend: 'up', urgency: 'low',
    };
  }
  if (input.streakDays >= 3) {
    return {
      id: 'streak', type: 'streak', headline: `${input.streakDays} days in a row`,
      body: `Building consistency. Each consecutive day reinforces the habit loop — keep the chain alive.`,
      trend: 'stable', urgency: 'low',
    };
  }
  return null;
}

function generateFatigueInsight(input: InsightInput): InsightCard | null {
  if (input.fatigueLevel < 4) return null;

  if (input.fatigueLevel >= 7) {
    return {
      id: 'fatigue', type: 'fatigue', headline: 'Fatigue is high today',
      body: `${insightPrefix('down')} Your reported fatigue is elevated. This is a genuine recovery signal — consider lighter training or an extra rest day rather than pushing through.`,
      trend: 'down', urgency: 'high',
    };
  }
  if (input.fatigueLevel >= 5) {
    return {
      id: 'fatigue', type: 'fatigue', headline: 'Moderate fatigue detected',
      body: `${insightPrefix('down')} Fatigue is sitting above baseline. Manageable for today, but worth monitoring — if it persists 2+ days, a deload week may be due.`,
      trend: 'down', urgency: 'medium',
    };
  }
  return null;
}

function generateWorkoutAdherenceInsight(input: InsightInput): InsightCard | null {
  if (input.plannedWorkoutsThisWeek === 0) return null;
  const pct = input.completedWorkoutsThisWeek / input.plannedWorkoutsThisWeek;

  if (pct >= 1) {
    return {
      id: 'workout_adherence', type: 'adherence', headline: 'All sessions completed this week',
      body: input.completedWorkoutsThisWeek > input.weeklyWorkoutsLastWeek
        ? `${insightPrefix('up')} You've completed every planned session AND done more than last week. Progression trend is strong.`
        : `${insightPrefix('up')} Full week of training in the books. Consistency at this level drives real adaptation.`,
      trend: 'up', urgency: 'low',
    };
  }
  if (pct >= 0.7) {
    return {
      id: 'workout_adherence', type: 'adherence', headline: `${Math.round(pct * 100)}% weekly workout completion`,
      body: `${insightPrefix('stable')} Most sessions completed. One miss won't derail progress — consistency over the long term is what matters.`,
      trend: 'stable', urgency: 'low',
    };
  }
  return {
    id: 'workout_adherence', type: 'adherence', headline: `${Math.round(input.completedWorkoutsThisWeek)} of ${input.plannedWorkoutsThisWeek} sessions done`,
    body: `${insightPrefix('down')} Missed more than a couple sessions this week. No judgment — but if this is a trend, it's worth exploring what's blocking consistency.`,
    trend: 'down', urgency: 'medium',
  };
}

function generateStepsInsight(input: InsightInput): InsightCard | null {
  if (input.steps === 0) return null;
  const pct = input.stepsGoal > 0 ? input.steps / input.stepsGoal : 0;

  if (pct >= 1) {
    return {
      id: 'steps', type: 'adherence', headline: `${input.steps.toLocaleString()} steps — goal hit`,
      body: `${insightPrefix('up')} Step goal achieved. NEAT (non-exercise activity) at this level meaningfully contributes to daily energy expenditure.`,
      trend: 'up', urgency: 'low',
    };
  }
  if (pct >= 0.7) {
    return {
      id: 'steps', type: 'adherence', headline: `${input.steps.toLocaleString()} steps today`,
      body: `${insightPrefix('stable')} Decent step count. A short evening walk would close the gap to your goal and add recovery-promoting light activity.`,
      trend: 'stable', urgency: 'low',
    };
  }
  return {
    id: 'steps', type: 'adherence', headline: `${input.steps.toLocaleString()} steps — below target`,
    body: `${insightPrefix('down')} Steps are low today. Not a major concern on rest days, but consistently low NEAT can slow fat loss progress over time.`,
    trend: 'down', urgency: 'low',
  };
}

function generateWaterInsight(input: InsightInput): InsightCard | null {
  if (input.water === 0) return null;
  const pct = input.waterGoal > 0 ? input.water / input.waterGoal : 0;

  if (pct >= 1) {
    return {
      id: 'water', type: 'nutrition', headline: 'Hydration goal met',
      body: `${insightPrefix('up')} Water intake is on point. Proper hydration directly supports recovery, performance, and metabolic function.`,
      trend: 'up', urgency: 'low',
    };
  }
  return {
    id: 'water', type: 'nutrition', headline: `${input.water} / ${input.waterGoal} glasses of water`,
    body: `${insightPrefix('down')} Hydration is behind today. Even mild dehydration can impair strength performance and recovery. Try keeping a bottle nearby.`,
    trend: 'down', urgency: 'low',
  };
}

function generateReadinessInsight(input: InsightInput): InsightCard | null {
  if (input.readinessScore === 0) return null;

  if (input.readinessScore >= 8) {
    return {
      id: 'readiness', type: 'recovery', headline: `Readiness: ${input.readinessScore}/10 — green light`,
      body: `${insightPrefix('up')} All signals point to a productive training day. Good sleep, low fatigue, solid recovery. Push intensity with confidence.`,
      trend: 'up', urgency: 'low',
    };
  }
  if (input.readinessScore >= 5) {
    return {
      id: 'readiness', type: 'recovery', headline: `Readiness: ${input.readinessScore}/10 — moderate`,
      body: `${insightPrefix('stable')} Decent readiness. You can train effectively but might want to avoid failure on compound lifts. Quality over max effort today.`,
      trend: 'stable', urgency: 'low',
    };
  }
  return {
    id: 'readiness', type: 'recovery', headline: `Readiness: ${input.readinessScore}/10 — low`,
    body: `${insightPrefix('down')} Readiness is below optimal. Recovery signals suggest a lighter session or active recovery would serve you better than high intensity.`,
    trend: 'down', urgency: 'medium',
  };
}

const generators: ((input: InsightInput) => InsightCard | null)[] = [
  generateAdherenceInsight,
  generateProteinInsight,
  generateWeightInsight,
  generateRecoveryInsight,
  generateMotivationInsight,
  generateFatigueInsight,
  generateWorkoutAdherenceInsight,
  generateStepsInsight,
  generateWaterInsight,
  generateReadinessInsight,
];

export function generateInsights(input: InsightInput): InsightCard[] {
  const cards: InsightCard[] = [];
  for (const gen of generators) {
    const card = gen(input);
    if (card) cards.push(card);
  }
  return cards;
}

export function generateCoachOpeningMessage(input: InsightInput): string {
  const parts: string[] = [];

  if (input.completedWorkoutsThisWeek > 0) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    if (input.plannedWorkoutsThisWeek > 0) {
      const pct = Math.round((input.completedWorkoutsThisWeek / input.plannedWorkoutsThisWeek) * 100);
      if (pct >= 100) parts.push(`You've completed every planned session this week — ${pct}% consistency.`);
      else if (pct >= 70) parts.push(`You're at ${pct}% on weekly sessions. Good momentum.`);
      else parts.push(`You've logged ${input.completedWorkoutsThisWeek} sessions this week so far.`);
    }
  }

  if (input.sleepHours && input.readinessScore > 0) {
    if (input.sleepHours >= 7.5 && input.readinessScore >= 7) {
      parts.push('Sleep and readiness both look solid today — good setup for a productive session.');
    } else if (input.sleepHours < 6) {
      parts.push('Sleep was low last night — recovery is the priority today.');
    }
  }

  if (input.latestWeight && input.previousWeight) {
    const diff = input.latestWeight - input.previousWeight;
    if (diff < -0.5 && diff > -1) parts.push('Weight trend is moving in the right direction at a controlled pace.');
    else if (diff < -1) parts.push('Weight is dropping quickly — keep an eye on energy and recovery.');
    else if (diff > 0.5) parts.push('Weight is trending up — right on track if that\'s the goal.');
  }

  if (input.adherenceTrend === 'improving') {
    parts.push('Your consistency is improving — nice work.');
  } else if (input.adherenceTrend === 'declining') {
    parts.push('Consistency has dipped a bit — no judgment, let\'s talk about what\'s going on.');
  }

  if (parts.length === 0) {
    const openers = [
      "How are you feeling today — physically and mentally ready to train?",
      "What's on your mind today? Any training, recovery, or nutrition questions?",
      "How's everything going? Any wins or struggles since we last checked in?",
    ];
    return openers[Math.floor(Math.random() * openers.length)];
  }

  return parts.join(' ') + ' How are you feeling heading into today?';
}
