export interface WeeklyData {
  weekNumber: number;
  userName?: string;
  sessionsPlanned: number;
  sessionsCompleted: number;
  performanceRating: 'Strong' | 'Stable' | 'Declining';
  notableWins: string[];
  flags: string[];
  avgCalories: number;
  targetCalories: number;
  avgProtein: number;
  targetProtein: number;
  adherencePct: number;
  weightChangeKg: number;
  totalWeightChangeKg: number;
  expectedWeightChangeKg: number;
  trendStatus: 'On Track' | 'Slightly Behind' | 'Ahead';
  sleepQuality: string;
  stressLevel: string;
  fatigueFlag: boolean;
}

export interface NextWeekStrategy {
  calories: number;
  caloriesChange: number;
  caloriesReason: string;
  protein: number;
  cardio: string;
  trainingFocus: string[];
  mentalFocus: string;
  volumeAdjustment: string;
}

export interface WeeklyReviewResult {
  summary: string;
  strategy: NextWeekStrategy;
  adjustments: { type: string; action: string; reasoning: string }[];
}

/** Determine weight change status based on goal */
function getTrendStatus(
  weightChange: number, goal: string, totalChange: number
): WeeklyData['trendStatus'] {
  if (goal === 'fat_loss') {
    if (weightChange < -0.5) return 'Ahead';
    if (weightChange < -0.2) return 'On Track';
    return 'Slightly Behind';
  }
  if (goal === 'muscle_gain') {
    if (weightChange > 0.5) return 'Ahead';
    if (weightChange > 0.2) return 'On Track';
    return 'Slightly Behind';
  }
  if (weightChange > -0.2 && weightChange < 0.2) return 'On Track';
  return 'Slightly Behind';
}

/** Full weekly check-in logic */
export function runWeeklyCheckin(data: WeeklyData): WeeklyReviewResult {
  const adjustments: { type: string; action: string; reasoning: string }[] = [];
  const { adherencePct, performanceRating, weightChangeKg, sleepQuality, stressLevel } = data;
  const goal = data.trendStatus; // rough proxy

  // Calorie adjustment logic
  let newCalories = data.targetCalories;
  let caloriesChange = 0;
  let caloriesReason = '';

  if (data.avgCalories > 0) {
    // Scenario 1: Stalled fat loss
    if (weightChangeKg > -0.2 && adherencePct >= 85 && sleepQuality !== 'poor' && stressLevel !== 'high') {
      newCalories = data.targetCalories - 200;
      caloriesChange = -200;
      caloriesReason = 'Fat loss stalled despite good adherence. Modest reduction to restart progress.';
      adjustments.push({
        type: 'calorie_adjustment',
        action: `Reduce calories by 200 kcal/day`,
        reasoning: 'Adherence was excellent but scale didn\'t move. Nudging deficit slightly.',
      });
    }
    // Scenario 2: Too fast weight loss
    else if (weightChangeKg < -1 && adherencePct >= 85) {
      newCalories = data.targetCalories + 150;
      caloriesChange = 150;
      caloriesReason = 'Losing faster than ideal — risk of muscle loss. Slight increase to protect gains.';
      adjustments.push({
        type: 'calorie_adjustment',
        action: `Increase calories by 150 kcal/day`,
        reasoning: 'Losing >1kg/week risks muscle loss. Bringing calories up to slow the rate.',
      });
    }
    // Scenario 3: Poor recovery
    else if ((sleepQuality === 'poor' || stressLevel === 'high') && performanceRating === 'Declining') {
      newCalories = data.targetCalories;
      caloriesReason = 'Recovery is compromised — keeping calories steady while reducing volume.';
      adjustments.push({
        type: 'recovery_intervention',
        action: 'Keep calories same, reduce training volume',
        reasoning: 'Performance dropped — likely recovery-related. Prioritizing quality over quantity.',
      });
    }
    // Scenario 4: Everything working
    else if (weightChangeKg < -0.2 && weightChangeKg > -0.5 && adherencePct >= 80 && performanceRating === 'Strong') {
      newCalories = data.targetCalories;
      caloriesReason = 'Everything is working — no changes needed. Focus on progressive overload.';
      adjustments.push({
        type: 'maintain',
        action: 'Keep everything the same',
        reasoning: 'On track, recovering well, performing strong. Don\'t change what isn\'t broken.',
      });
    }
    // Scenario 5: Low adherence
    else if (adherencePct < 70) {
      newCalories = data.targetCalories;
      caloriesReason = 'Adherence is low — adjusting calories won\'t help until we address the root cause.';
      adjustments.push({
        type: 'adherence_focus',
        action: 'No calorie change — diagnose adherence barriers first',
        reasoning: 'Let\'s understand what\'s making adherence hard before adjusting numbers.',
      });
    }
  }

  // Volume adjustment
  let volumeAdjustment = 'Keep current volume';
  if (performanceRating === 'Declining' && data.sessionsCompleted >= 2) {
    volumeAdjustment = 'Reduce 1 set per exercise next week (deload signal)';
    adjustments.push({
      type: 'volume_reduction',
      action: 'Reduce sets by 1 per exercise',
      reasoning: 'Performance declining for 2+ sessions — deload to prevent overreaching.',
    });
  }
  if (performanceRating === 'Strong' && data.sessionsCompleted >= 3) {
    volumeAdjustment = 'Add 1 set to lagging muscle groups';
    adjustments.push({
      type: 'volume_increase',
      action: 'Add 1 set to lagging muscle groups',
      reasoning: 'Performance excellent — ready for progressive overload.',
    });
  }

  // Generate strategy
  const strategy: NextWeekStrategy = {
    calories: newCalories,
    caloriesChange,
    caloriesReason,
    protein: data.targetProtein,
    cardio: `Keep at current level${data.fatigueFlag ? ' — reduce HIIT if fatigued' : ''}`,
    trainingFocus: generateTrainingFocus(data),
    mentalFocus: generateMentalFocus(data),
    volumeAdjustment,
  };

  const summary = formatWeeklySummary(data, strategy, adjustments);
  return { summary, strategy, adjustments };
}

function generateTrainingFocus(data: WeeklyData): string[] {
  const focus: string[] = [];
  if (data.performanceRating === 'Strong') {
    focus.push('Push progressive overload on main lifts');
  }
  if (data.performanceRating === 'Declining') {
    focus.push('Reduce intensity — focus on technique and recovery');
  }
  if (data.flags.some(f => f.includes('skipped'))) {
    focus.push('Prioritize consistency over intensity');
  }
  if (data.notableWins.length > 0) {
    focus.push(`Build on: ${data.notableWins[0]}`);
  }
  return focus;
}

function generateMentalFocus(data: WeeklyData): string {
  if (data.adherencePct >= 90) return 'You\'re building momentum — consistency is your superpower. Keep showing up.';
  if (data.adherencePct < 70) return 'Progress isn\'t linear. Focus on one habit this week — showing up is a win.';
  return 'Trust the process. Small daily wins compound into big results.';
}

function formatWeeklySummary(data: WeeklyData, strategy: NextWeekStrategy, adjustments: any[]): string {
  return [
    '📊 WEEK ' + data.weekNumber + ' CHECK-IN — ' + (data.userName || 'Athlete'),
    '',
    '🏋️ Training',
    `  Sessions completed:   ${data.sessionsCompleted} / ${data.sessionsPlanned} planned`,
    `  Performance rating:   ${data.performanceRating}`,
    data.notableWins.length ? `  Notable wins:         ${data.notableWins.join(', ')}` : '',
    data.flags.length ? `  Flags:                ${data.flags.join('; ')}` : '',
    '',
    '🥗 Nutrition',
    `  Avg daily calories:   ${data.avgCalories} / ${data.targetCalories} target (${data.adherencePct}% adherence)`,
    `  Avg protein:          ${data.avgProtein}g / ${data.targetProtein}g target`,
    `  Consistency score:    ${data.adherencePct >= 85 ? 'Strong' : data.adherencePct >= 70 ? 'Moderate' : 'Low'}`,
    '',
    '⚖️ Body Metrics',
    `  Weight change:        ${data.weightChangeKg >= 0 ? '+' : ''}${data.weightChangeKg.toFixed(1)} kg this week`,
    `  Total change:         ${data.totalWeightChangeKg >= 0 ? '+' : ''}${data.totalWeightChangeKg.toFixed(1)} kg since start`,
    `  Expected change:      ~${data.expectedWeightChangeKg} kg based on deficit/surplus`,
    `  Trend status:         ${data.trendStatus}`,
    '',
    '😴 Recovery',
    `  Sleep quality:        ${data.sleepQuality}`,
    `  Stress level:         ${data.stressLevel}`,
    `  Fatigue flag:         ${data.fatigueFlag ? '⚠️ Yes' : 'No'}`,
    '',
    '─────────────────────────────────────────────',
    '',
    '🎯 NEXT WEEK STRATEGY',
    '',
    `Calories:    ${strategy.calories} kcal${strategy.caloriesChange >= 0 ? '+' : ''}${strategy.caloriesChange ? ` (${strategy.caloriesChange} from last week)` : ' (unchanged)'}`,
    `Protein:     ${strategy.protein}g`,
    `Cardio:      ${strategy.cardio}`,
    '',
    'Training focus:',
    ...strategy.trainingFocus.map(f => `  → ${f}`),
    '',
    `Volume adjustment: ${strategy.volumeAdjustment}`,
    '',
    'Mental focus:',
    `  → ${strategy.mentalFocus}`,
    '',
    '─────────────────────────────────────────────',
    '',
    caloriesReasonMessage(strategy),
  ].filter(Boolean).join('\n');
}

function caloriesReasonMessage(strategy: NextWeekStrategy): string {
  if (!strategy.caloriesReason) return '';
  return `📝 Note: ${strategy.caloriesReason}`;
}
