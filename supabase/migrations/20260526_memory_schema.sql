-- Pulse AI Memory Layer Schema
-- Tracks recovery, biometrics, behavioral events, exercise progression, and insights.
-- Run this migration AFTER the base fitnessapp_schema.sql and workout_schema.sql.

BEGIN;

-- =============================================
-- 1. RECOVERY DAILY
-- Daily snapshot of recovery markers
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

-- =============================================
-- 2. BIOMETRIC RECORDS
-- Weight, body fat, blood pressure, labs, etc.
-- =============================================
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
    neck_cm NUMERIC(5,2),
    notes TEXT,
    source TEXT DEFAULT 'manual'
);

CREATE INDEX IF NOT EXISTS idx_biometric_user_date
    ON public.biometric_records(user_id, recorded_at DESC);

-- =============================================
-- 3. BEHAVIORAL EVENTS
-- Track motivation, adherence, emotional flags, context
-- =============================================
CREATE TABLE IF NOT EXISTS public.behavioral_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    context TEXT,
    location TEXT,
    preceding_event TEXT,
    adherence_flag BOOLEAN DEFAULT FALSE,
    emotional_flag TEXT,
    stress_context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavioral_user_date
    ON public.behavioral_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavioral_type
    ON public.behavioral_events(user_id, event_type);

-- =============================================
-- 4. EXERCISE PROGRESSION
-- Track exercise-specific load, reps, RPE over time
-- =============================================
CREATE TABLE IF NOT EXISTS public.exercise_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_exercise_prog_user_exercise
    ON public.exercise_progression(user_id, exercise_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_prog_user_name
    ON public.exercise_progression(user_id, exercise_name, session_date DESC);

-- =============================================
-- 5. INSIGHTS
-- Generated insights with user feedback
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_insights_type
    ON public.insights(user_id, insight_type);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE public.recovery_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Recovery daily
DROP POLICY IF EXISTS recovery_daily_select_own ON public.recovery_daily;
CREATE POLICY recovery_daily_select_own ON public.recovery_daily
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS recovery_daily_insert_own ON public.recovery_daily;
CREATE POLICY recovery_daily_insert_own ON public.recovery_daily
    FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS recovery_daily_update_own ON public.recovery_daily;
CREATE POLICY recovery_daily_update_own ON public.recovery_daily
    FOR UPDATE USING (user_id = auth.uid());

-- Biometric records
DROP POLICY IF EXISTS biometric_select_own ON public.biometric_records;
CREATE POLICY biometric_select_own ON public.biometric_records
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS biometric_insert_own ON public.biometric_records;
CREATE POLICY biometric_insert_own ON public.biometric_records
    FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS biometric_delete_own ON public.biometric_records;
CREATE POLICY biometric_delete_own ON public.biometric_records
    FOR DELETE USING (user_id = auth.uid());

-- Behavioral events
DROP POLICY IF EXISTS behavioral_select_own ON public.behavioral_events;
CREATE POLICY behavioral_select_own ON public.behavioral_events
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS behavioral_insert_own ON public.behavioral_events;
CREATE POLICY behavioral_insert_own ON public.behavioral_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Exercise progression
DROP POLICY IF EXISTS exercise_prog_select_own ON public.exercise_progression;
CREATE POLICY exercise_prog_select_own ON public.exercise_progression
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS exercise_prog_insert_own ON public.exercise_progression;
CREATE POLICY exercise_prog_insert_own ON public.exercise_progression
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Insights
DROP POLICY IF EXISTS insights_select_own ON public.insights;
CREATE POLICY insights_select_own ON public.insights
    FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS insights_insert_own ON public.insights;
CREATE POLICY insights_insert_own ON public.insights
    FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS insights_update_own ON public.insights;
CREATE POLICY insights_update_own ON public.insights
    FOR UPDATE USING (user_id = auth.uid());

COMMIT;
