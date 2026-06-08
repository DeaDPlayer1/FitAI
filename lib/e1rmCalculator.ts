export interface E1rmInput {
  exerciseName: string;
  weight: number;
  reps: number;
  rpe?: number;
  sessionDate: string;
}

export interface E1rmResult {
  exerciseName: string;
  e1rm: number;
  brzycki: number;
  epley: number;
  weight: number;
  reps: number;
  rpe?: number;
  sessionDate: string;
}

function epleyFormula(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

function brzyckiFormula(weight: number, reps: number): number {
  if (reps >= 36) return weight;
  return weight * (36 / (37 - reps));
}

export function estimate1RM(weight: number, reps: number, rpe?: number): number {
  const adjustedReps = rpe ? reps + (10 - rpe) : reps;
  if (adjustedReps <= 0) return weight;
  if (adjustedReps === 1) return weight;
  const brzycki = brzyckiFormula(weight, adjustedReps);
  const epley = epleyFormula(weight, adjustedReps);
  return (brzycki + epley) / 2;
}

export function calculateE1rm(input: E1rmInput): E1rmResult {
  const adjustedReps = input.rpe ? input.reps + (10 - input.rpe) : input.reps;
  const brzycki = brzyckiFormula(input.weight, adjustedReps);
  const epley = epleyFormula(input.weight, adjustedReps);
  const e1rm = (brzycki + epley) / 2;

  return {
    exerciseName: input.exerciseName,
    e1rm: Math.round(e1rm * 10) / 10,
    brzycki: Math.round(brzycki * 10) / 10,
    epley: Math.round(epley * 10) / 10,
    weight: input.weight,
    reps: input.reps,
    rpe: input.rpe,
    sessionDate: input.sessionDate,
  };
}

export function getE1rmTrend(
  results: E1rmResult[]
): { exerciseName: string; trend: 'up' | 'down' | 'stable'; changePct: number; recentAvg: number; previousAvg: number }[] {
  const grouped = new Map<string, E1rmResult[]>();
  for (const r of results) {
    if (!grouped.has(r.exerciseName)) grouped.set(r.exerciseName, []);
    grouped.get(r.exerciseName)!.push(r);
  }

  const trends: ReturnType<typeof getE1rmTrend> = [];
  for (const [name, vals] of grouped) {
    const sorted = vals.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
    if (sorted.length < 2) continue;

    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const firstAvg = firstHalf.reduce((s, v) => s + v.e1rm, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, v) => s + v.e1rm, 0) / secondHalf.length;
    const changePct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    trends.push({
      exerciseName: name,
      trend: changePct > 3 ? 'up' : changePct < -3 ? 'down' : 'stable',
      changePct: Math.round(changePct * 10) / 10,
      recentAvg: Math.round(secondAvg * 10) / 10,
      previousAvg: Math.round(firstAvg * 10) / 10,
    });
  }

  return trends;
}
