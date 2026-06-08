-- ============================================================
-- FIX C2 + C3: Create water_logs and activity_logs tables.
-- RLS policies already exist in rls-policies.sql. 
-- Run this in Supabase SQL editor.
-- ============================================================

-- Water logs
CREATE TABLE IF NOT EXISTS public.water_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  glasses NUMERIC NOT NULL DEFAULT 1,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_date 
  ON public.water_logs(user_id, logged_at DESC);

ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  steps INT4 DEFAULT 0,
  bpm INT4 DEFAULT 0,
  workout_completed BOOLEAN NOT NULL DEFAULT false,
  minutes_active INT2 DEFAULT 0,
  calories_burned INT4 DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date 
  ON public.activity_logs(user_id, logged_at DESC);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
