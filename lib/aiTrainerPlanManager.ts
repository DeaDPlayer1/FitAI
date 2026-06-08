import type { ActivePlan, WeeklyReview } from '@/store/aiTrainerStore';
import { getDb } from '@/lib/db';

export async function savePlan(plan: ActivePlan): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO ai_plans (id, user_id, version, week_number, phase, plan_json, applied_at, archived_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    plan.id,
    plan.userId,
    plan.version,
    plan.weekNumber,
    plan.phase,
    JSON.stringify(plan),
    plan.appliedAt,
    null,
    plan.createdAt
  );
}

export async function archivePlan(planId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE ai_plans SET phase = 'idle', archived_at = ? WHERE id = ?`,
    new Date().toISOString(),
    planId
  );
}

export async function getActivePlan(userId: string): Promise<ActivePlan | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ plan_json: string }>(
    `SELECT plan_json FROM ai_plans WHERE user_id = ? AND phase = 'plan_active' ORDER BY version DESC LIMIT 1`,
    userId
  );
  if (!row) return null;
  try {
    return JSON.parse(row.plan_json) as ActivePlan;
  } catch {
    return null;
  }
}

export async function getPlanHistory(userId: string, limit = 52): Promise<ActivePlan[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ plan_json: string }>(
    `SELECT plan_json FROM ai_plans WHERE user_id = ? ORDER BY week_number DESC, version DESC LIMIT ?`,
    userId,
    limit
  );
  return rows.map(r => {
    try { return JSON.parse(r.plan_json) as ActivePlan; } catch { return null; }
  }).filter((p): p is ActivePlan => p !== null);
}

export async function saveReview(review: WeeklyReview): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO ai_weekly_reviews (id, user_id, week_number, plan_version, review_json, user_feedback, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    review.id,
    review.userId,
    review.weekNumber,
    review.planVersion,
    JSON.stringify(review),
    review.userFeedback,
    review.createdAt
  );
}

export async function getLatestReview(userId: string): Promise<WeeklyReview | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ review_json: string }>(
    `SELECT review_json FROM ai_weekly_reviews WHERE user_id = ? ORDER BY week_number DESC LIMIT 1`,
    userId
  );
  if (!row) return null;
  try {
    return JSON.parse(row.review_json) as WeeklyReview;
  } catch {
    return null;
  }
}

export async function applyPlanToStores(
  plan: ActivePlan,
  splitBuilderStore: { saveSplit: (userId: string) => Promise<void>; loadSplit: (userId: string) => Promise<void>; days: any[] },
  nutritionStore: { setCalorieGoal: (cal: number) => void; setProteinGoal?: (p: number) => void },
  userId: string
): Promise<void> {
  await savePlan(plan);
  try {
    nutritionStore.setCalorieGoal(plan.calorieTarget);
    if (nutritionStore.setProteinGoal) {
      nutritionStore.setProteinGoal(plan.proteinTarget);
    }
  } catch {}
}

export async function generatePlanId(userId: string): Promise<string> {
  return `plan_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function generateReviewId(userId: string): Promise<string> {
  return `review_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
