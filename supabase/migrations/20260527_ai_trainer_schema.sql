-- ============================
-- AI TRAINER MODE — Complete Migration (Phase 4 + Phase 5)
-- Run this entire block in the Supabase SQL editor.
-- ============================

BEGIN;

-- =============================================
-- PHASE 4: PULSE AI MEMORY LAYER (if not yet created)
-- =============================================

CREATE TABLE IF NOT EXISTS public.recovery_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep_hours NUMERIC(4,1),
    sleep_quality INT2 CHECK (sleep_quality BETWEEN 1 AND 10),
    sleep_efficiency NUMERIC(5,2),
    resting_hr INT2,
    hrv NUMERIC(6,2),
    soreness_score INT2 CHECK (soreness_score BETWEEN 0 AND 10),
    fatigue_score INT2 CHECK (fatigue_score BETWEEN 0 AND 10),
    stress_score INT2 CHECK (stress_score BETWEEN 0 AND 10),
    subjective_readiness INT2 CHECK (subjective_readiness BETWEEN 1 AND 10),
    recovery_score NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_recovery_daily_user_date
    ON public.recovery_daily(user_id, log_date DESC);

CREATE TABLE IF NOT EXISTS public.biometric_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weight_kg NUMERIC(5,2),
    body_fat_pct NUMERIC(4,1),
    systolic_bp INT2,
    diastolic_bp INT2,
    waist_cm NUMERIC(5,2),
    hip_cm NUMERIC(5,2),
    notes TEXT,
    source TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_biometric_user_date
    ON public.biometric_records(user_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS public.behavioral_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    context TEXT,
    location TEXT,
    adherence_flag BOOLEAN DEFAULT FALSE,
    emotional_flag TEXT,
    stress_context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_user_date
    ON public.behavioral_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.exercise_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID,
    exercise_name TEXT NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    set_number INT2 NOT NULL,
    weight NUMERIC(6,2) DEFAULT 0,
    reps INT2 DEFAULT 0,
    rpe NUMERIC(3,1),
    rir INT2,
    volume_load NUMERIC(8,2) GENERATED ALWAYS AS (COALESCE(weight, 0) * COALESCE(reps, 0)) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_prog_user_name
    ON public.exercise_progression(user_id, exercise_name, session_date DESC);

CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    supporting_data JSONB,
    user_feedback TEXT,
    dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_user_date
    ON public.insights(user_id, created_at DESC);

-- =============================================
-- PHASE 4 EXT: user_context, nutrition_days, injuries, conditions
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_stress_level INT2 CHECK (current_stress_level BETWEEN 1 AND 10),
    current_motivation_level INT2 CHECK (current_motivation_level BETWEEN 1 AND 10),
    sleep_quality INT2 CHECK (sleep_quality BETWEEN 1 AND 10),
    energy_level INT2 CHECK (energy_level BETWEEN 1 AND 10),
    adherence_trend TEXT CHECK (adherence_trend IN ('improving', 'declining', 'stable')),
    streak_days INT2 DEFAULT 0,
    emotional_state TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_user_context_user_date
    ON public.user_context(user_id, snapshot_date DESC);

CREATE TABLE IF NOT EXISTS public.nutrition_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_calories NUMERIC(7,2),
    total_protein_g NUMERIC(7,2),
    total_carbs_g NUMERIC(7,2),
    total_fat_g NUMERIC(7,2),
    total_fiber_g NUMERIC(7,2),
    total_sodium_mg NUMERIC(7,2),
    total_potassium_mg NUMERIC(7,2),
    total_phosphorus_mg NUMERIC(7,2),
    total_water_ml NUMERIC(7,2),
    meal_count INT2,
    adherence_score NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_days_user_date
    ON public.nutrition_days(user_id, log_date DESC);

CREATE TABLE IF NOT EXISTS public.injuries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body_part TEXT NOT NULL,
    injury_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    onset_date DATE NOT NULL,
    resolved_date DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_injuries_user
    ON public.injuries(user_id);

CREATE TABLE IF NOT EXISTS public.conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    stage TEXT,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'remission', 'active')),
    diagnosed_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    medications JSONB DEFAULT '[]',
    recent_labs JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, condition_name)
);

CREATE INDEX IF NOT EXISTS idx_conditions_user
    ON public.conditions(user_id);

-- =============================================
-- PHASE 5: AI TRAINER TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.ai_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  week_number INTEGER NOT NULL DEFAULT 1,
  phase TEXT NOT NULL DEFAULT 'idle' CHECK (phase IN (
    'idle', 'consultation', 'plan_generated', 'plan_active',
    'weekly_review', 'plan_updated', 'paused'
  )),
  plan_json JSONB NOT NULL,
  applied_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_plans_user ON ai_plans(user_id, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_ai_plans_active ON ai_plans(user_id) WHERE phase = 'plan_active';

CREATE TABLE IF NOT EXISTS public.ai_weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  plan_version INTEGER NOT NULL,
  review_json JSONB NOT NULL,
  user_feedback TEXT CHECK (user_feedback IN ('approved', 'edited', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_reviews_user ON ai_weekly_reviews(user_id, week_number DESC);

CREATE TABLE IF NOT EXISTS public.daily_wellness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('morning', 'post_workout')),
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  soreness INTEGER CHECK (soreness BETWEEN 1 AND 10),
  fatigue INTEGER CHECK (fatigue BETWEEN 1 AND 10),
  joint_pain INTEGER CHECK (joint_pain BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  symptom_notes TEXT,
  medication_adhered BOOLEAN DEFAULT NULL,
  mood TEXT CHECK (mood IN ('great', 'good', 'okay', 'low', 'poor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_date, check_type)
);

CREATE INDEX IF NOT EXISTS idx_wellness_user_date ON daily_wellness(user_id, check_date DESC);

-- =============================================
-- EXTEND workout_sessions (for RPE logging)
-- =============================================

ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS
  rpe_fatigue INTEGER CHECK (rpe_fatigue BETWEEN 1 AND 10);
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS
  rpe_soreness INTEGER CHECK (rpe_soreness BETWEEN 1 AND 10);
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS
  session_rpe INTEGER CHECK (session_rpe BETWEEN 1 AND 10);

-- =============================================
-- EXTEND user_context (for AI Trainer flare tracking)
-- =============================================

ALTER TABLE user_context ADD COLUMN IF NOT EXISTS
  medication_adhered BOOLEAN;
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS
  symptom_flare BOOLEAN DEFAULT FALSE;
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS
  flare_notes TEXT;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Phase 4 RLS
ALTER TABLE public.recovery_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recovery_daily_select_own ON public.recovery_daily;
CREATE POLICY recovery_daily_select_own ON public.recovery_daily FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS recovery_daily_insert_own ON public.recovery_daily;
CREATE POLICY recovery_daily_insert_own ON public.recovery_daily FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS recovery_daily_update_own ON public.recovery_daily;
CREATE POLICY recovery_daily_update_own ON public.recovery_daily FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS biometric_select_own ON public.biometric_records;
CREATE POLICY biometric_select_own ON public.biometric_records FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS biometric_insert_own ON public.biometric_records;
CREATE POLICY biometric_insert_own ON public.biometric_records FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS biometric_delete_own ON public.biometric_records;
CREATE POLICY biometric_delete_own ON public.biometric_records FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS behavioral_select_own ON public.behavioral_events;
CREATE POLICY behavioral_select_own ON public.behavioral_events FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS behavioral_insert_own ON public.behavioral_events;
CREATE POLICY behavioral_insert_own ON public.behavioral_events FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS exercise_prog_select_own ON public.exercise_progression;
CREATE POLICY exercise_prog_select_own ON public.exercise_progression FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS exercise_prog_insert_own ON public.exercise_progression;
CREATE POLICY exercise_prog_insert_own ON public.exercise_progression FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS insights_select_own ON public.insights;
CREATE POLICY insights_select_own ON public.insights FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS insights_insert_own ON public.insights;
CREATE POLICY insights_insert_own ON public.insights FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS insights_update_own ON public.insights;
CREATE POLICY insights_update_own ON public.insights FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_context_select_own ON public.user_context;
CREATE POLICY user_context_select_own ON public.user_context FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS user_context_insert_own ON public.user_context;
CREATE POLICY user_context_insert_own ON public.user_context FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS user_context_update_own ON public.user_context;
CREATE POLICY user_context_update_own ON public.user_context FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS nutrition_days_select_own ON public.nutrition_days;
CREATE POLICY nutrition_days_select_own ON public.nutrition_days FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS nutrition_days_insert_own ON public.nutrition_days;
CREATE POLICY nutrition_days_insert_own ON public.nutrition_days FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS nutrition_days_update_own ON public.nutrition_days;
CREATE POLICY nutrition_days_update_own ON public.nutrition_days FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS injuries_select_own ON public.injuries;
CREATE POLICY injuries_select_own ON public.injuries FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS injuries_insert_own ON public.injuries;
CREATE POLICY injuries_insert_own ON public.injuries FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS injuries_update_own ON public.injuries;
CREATE POLICY injuries_update_own ON public.injuries FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS conditions_select_own ON public.conditions;
CREATE POLICY conditions_select_own ON public.conditions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS conditions_insert_own ON public.conditions;
CREATE POLICY conditions_insert_own ON public.conditions FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS conditions_update_own ON public.conditions;
CREATE POLICY conditions_update_own ON public.conditions FOR UPDATE USING (user_id = auth.uid());

-- Phase 5 RLS
ALTER TABLE public.ai_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_wellness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own their plans" ON public.ai_plans;
CREATE POLICY "Users own their plans" ON public.ai_plans
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own their reviews" ON public.ai_weekly_reviews;
CREATE POLICY "Users own their reviews" ON public.ai_weekly_reviews
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users own their wellness logs" ON public.daily_wellness;
CREATE POLICY "Users own their wellness logs" ON public.daily_wellness
  FOR ALL USING (auth.uid() = user_id);

COMMIT;
