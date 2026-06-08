-- Pulse AI v2 Memory Layer — Extended Schema
-- Adds columns to existing workout_sessions, creates nutrition_days, injuries, conditions, user_context
-- Run AFTER 20260526_memory_schema.sql and 20260512_workout_schema.sql
--
-- NOTE: workout_sessions already exists from 20260512_workout_schema.sql
-- so we ALTER TABLE ADD COLUMN instead of CREATE TABLE.

BEGIN;

-- =============================================
-- 1. EXTEND EXISTING WORKOUT SESSIONS
-- =============================================
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS session_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS focus TEXT,
  ADD COLUMN IF NOT EXISTS plan_name TEXT,
  ADD COLUMN IF NOT EXISTS methodology TEXT,
  ADD COLUMN IF NOT EXISTS rpe_avg NUMERIC(3,1),
  ADD COLUMN IF NOT EXISTS subjective_rating INT2 CHECK (subjective_rating BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS total_volume_kg NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date
    ON public.workout_sessions(user_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_focus
    ON public.workout_sessions(user_id, focus);

-- =============================================
-- 2. NUTRITION DAYS
-- =============================================
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
    meal_quality_score NUMERIC(4,2),
    anti_inflammatory_score NUMERIC(4,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_days_user_date
    ON public.nutrition_days(user_id, log_date DESC);

-- =============================================
-- 3. INJURIES
-- =============================================
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

-- =============================================
-- 4. CONDITIONS
-- =============================================
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
-- 5. USER CONTEXT SNAPSHOT
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

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.nutrition_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context ENABLE ROW LEVEL SECURITY;

-- nutrition_days
DROP POLICY IF EXISTS nutrition_days_select_own ON public.nutrition_days;
CREATE POLICY nutrition_days_select_own ON public.nutrition_days
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS nutrition_days_insert_own ON public.nutrition_days;
CREATE POLICY nutrition_days_insert_own ON public.nutrition_days
    FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS nutrition_days_update_own ON public.nutrition_days;
CREATE POLICY nutrition_days_update_own ON public.nutrition_days
    FOR UPDATE USING (user_id = auth.uid());

-- injuries
DROP POLICY IF EXISTS injuries_select_own ON public.injuries;
CREATE POLICY injuries_select_own ON public.injuries
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS injuries_insert_own ON public.injuries;
CREATE POLICY injuries_insert_own ON public.injuries
    FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS injuries_update_own ON public.injuries
    FOR UPDATE USING (user_id = auth.uid());

-- conditions
DROP POLICY IF EXISTS conditions_select_own ON public.conditions;
CREATE POLICY conditions_select_own ON public.conditions
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS conditions_insert_own ON public.conditions
    FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS conditions_update_own ON public.conditions
    FOR UPDATE USING (user_id = auth.uid());

-- user_context
DROP POLICY IF EXISTS user_context_select_own ON public.user_context;
CREATE POLICY user_context_select_own ON public.user_context
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS user_context_insert_own ON public.user_context
    FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS user_context_update_own ON public.user_context
    FOR UPDATE USING (user_id = auth.uid());

COMMIT;
