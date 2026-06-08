export interface RecoveryInput {
  sleepHours: number;
  sleepQuality: number;
  hrv?: number;
  restingHr?: number;
  soreness: number;
  fatigue: number;
  stress: number;
  readiness?: number;
  previousScores?: number[];
  recentTrainingLoad?: number;
  chronicTrainingLoad?: number;
}

export interface RecoveryScore {
  overall: number;
  components: {
    sleep: number;
    hrv: number;
    soreness: number;
    fatigue: number;
    stress: number;
    readiness: number;
  };
  label: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  recommendation: string;
}

export interface FatiguePrediction {
  acuteChronicRatio: number;
  fatigueRisk: 'low' | 'moderate' | 'high' | 'critical';
  daysToFullRecovery: number;
  suggestion: string;
}

export interface DeloadDecision {
  shouldDeload: boolean;
  reason: string;
  deloadType: 'full_rest' | 'active_recovery' | 'reduced_volume' | 'reduced_intensity';
  durationDays: number;
}

function norm(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function invert(value: number, min: number, max: number): number {
  return 1 - norm(value, min, max);
}

export function calculateRecoveryScore(input: RecoveryInput): RecoveryScore {
  const sleepScore = (norm(input.sleepHours, 4, 9) * 0.5 + norm(input.sleepQuality, 1, 10) * 0.5);
  const hrvScore = input.hrv ? norm(input.hrv, 20, 80) : 0.5;
  const sorenessScore = invert(input.soreness, 0, 10);
  const fatigueScore = invert(input.fatigue, 0, 10);
  const stressScore = invert(input.stress, 0, 10);
  const readinessScore = input.readiness ? norm(input.readiness, 1, 10) : 0.5;

  const weights = {
    sleep: 0.25,
    hrv: 0.15,
    soreness: 0.15,
    fatigue: 0.2,
    stress: 0.15,
    readiness: 0.1,
  };

  const overall =
    sleepScore * weights.sleep +
    hrvScore * weights.hrv +
    sorenessScore * weights.soreness +
    fatigueScore * weights.fatigue +
    stressScore * weights.stress +
    readinessScore * weights.readiness;

  const score = Math.round(overall * 100);

  let label: RecoveryScore['label'];
  let recommendation: string;

  if (score >= 80) {
    label = 'excellent';
    recommendation = 'Full training intensity. Great recovery. Push hard today.';
  } else if (score >= 60) {
    label = 'good';
    recommendation = 'Good recovery. Train as planned but monitor intensity.';
  } else if (score >= 40) {
    label = 'fair';
    recommendation = 'Moderate recovery. Reduce volume by 20-30%. Focus on technique.';
  } else if (score >= 20) {
    label = 'poor';
    recommendation = 'Poor recovery. Reduce intensity and volume by 40-50%. Consider active recovery instead.';
  } else {
    label = 'critical';
    recommendation = 'Critical recovery. Take a full rest day. Focus on sleep, hydration, and nutrition.';
  }

  return {
    overall: score,
    components: {
      sleep: Math.round(sleepScore * 100),
      hrv: Math.round(hrvScore * 100),
      soreness: Math.round(sorenessScore * 100),
      fatigue: Math.round(fatigueScore * 100),
      stress: Math.round(stressScore * 100),
      readiness: Math.round(readinessScore * 100),
    },
    label,
    recommendation,
  };
}

export function predictFatigue(
  recentTrainingLoad: number,
  chronicTrainingLoad: number,
  recoveryScores: number[],
): FatiguePrediction {
  const acwr = chronicTrainingLoad > 0 ? recentTrainingLoad / chronicTrainingLoad : 1;

  let fatigueRisk: FatiguePrediction['fatigueRisk'];
  if (acwr > 1.5) fatigueRisk = 'critical';
  else if (acwr > 1.3) fatigueRisk = 'high';
  else if (acwr > 1.1) fatigueRisk = 'moderate';
  else fatigueRisk = 'low';

  const avgRecovery = recoveryScores.length > 0
    ? recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length
    : 50;

  const daysToFullRecovery = fatigueRisk === 'critical' ? 5 :
    fatigueRisk === 'high' ? 3 :
    fatigueRisk === 'moderate' ? 2 : 0;

  let suggestion: string;
  switch (fatigueRisk) {
    case 'critical':
      suggestion = `ACWR of ${acwr.toFixed(2)}: High injury risk zone. Take 2-3 days complete rest. Reduce weekly volume by 50% next week.`;
      break;
    case 'high':
      suggestion = `ACWR of ${acwr.toFixed(2)}: Elevated injury risk. Deload this week. Reduce volume by 30-40%.`;
      break;
    case 'moderate':
      suggestion = `ACWR of ${acwr.toFixed(2)}: Moderate load. Consider a light day or active recovery.`;
      break;
    default:
      suggestion = `ACWR of ${acwr.toFixed(2)}: Healthy range. Continue as planned.`;
  }

  return { acuteChronicRatio: Math.round(acwr * 100) / 100, fatigueRisk, daysToFullRecovery, suggestion };
}

export function determineDeload(
  recoveryScores: number[],
  weeksSinceLastDeload: number,
  performanceDecline: boolean,
  sorenessTrend: 'rising' | 'stable' | 'falling',
): DeloadDecision {
  const avgRecovery = recoveryScores.length > 0
    ? recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length
    : 50;

  const recentScores = recoveryScores.slice(-3);
  const recentAvg = recentScores.length > 0
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 50;

  const decliningTrend = recentAvg < avgRecovery - 10;
  const veryLow = recentAvg < 30;
  const timeForDeload = weeksSinceLastDeload >= 4;

  if (veryLow && decliningTrend) {
    return {
      shouldDeload: true,
      reason: 'Recovery critically low and declining. Mandatory deload.',
      deloadType: 'full_rest',
      durationDays: 7,
    };
  }

  if (decliningTrend && performanceDecline) {
    return {
      shouldDeload: true,
      reason: 'Recovery declining with performance drop. Deload needed.',
      deloadType: 'reduced_volume',
      durationDays: 7,
    };
  }

  if (timeForDeload && (recentAvg < 50 || sorenessTrend === 'rising')) {
    return {
      shouldDeload: true,
      reason: `${weeksSinceLastDeload} weeks since last deload with elevated soreness or moderate fatigue.`,
      deloadType: 'reduced_volume',
      durationDays: 7,
    };
  }

  if (timeForDeload && recentAvg < 65) {
    return {
      shouldDeload: true,
      reason: `Scheduled deload after ${weeksSinceLastDeload} weeks.`,
      deloadType: 'active_recovery',
      durationDays: 5,
    };
  }

  return {
    shouldDeload: false,
    reason: 'Recovery scores adequate. No deload needed.',
    deloadType: 'active_recovery',
    durationDays: 0,
  };
}

export function recoveryStatus(input: RecoveryInput): {
  score: RecoveryScore;
  fatigue: FatiguePrediction;
  deload: DeloadDecision;
} {
  const score = calculateRecoveryScore(input);
  const fatigue = predictFatigue(
    input.recentTrainingLoad ?? 50,
    input.chronicTrainingLoad ?? 40,
    input.previousScores ?? [],
  );
  const deload = determineDeload(
    [...(input.previousScores ?? []), score.overall],
    4,
    score.overall < 40,
    score.overall < 50 ? 'rising' : 'stable',
  );

  return { score, fatigue, deload };
}

export function readinessForTraining(recoveryScore: number, fatigueRisk: string): { canTrain: boolean; maxRPE: number; maxDuration: number } {
  if (recoveryScore < 20 || fatigueRisk === 'critical') return { canTrain: false, maxRPE: 3, maxDuration: 20 };
  if (recoveryScore < 40 || fatigueRisk === 'high') return { canTrain: true, maxRPE: 5, maxDuration: 30 };
  if (recoveryScore < 60 || fatigueRisk === 'moderate') return { canTrain: true, maxRPE: 7, maxDuration: 45 };
  return { canTrain: true, maxRPE: 9, maxDuration: 60 };
}
