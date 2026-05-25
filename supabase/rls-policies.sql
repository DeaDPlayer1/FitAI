-- ============================================================
-- FitAI / Pulse AI — Supabase Row Level Security Policies
-- Generated for production deployment
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================

-- Users can read their own profile only
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- MEAL LOGS
-- ============================================================

CREATE POLICY "Users can view own meal logs"
  ON meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal logs"
  ON meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON meal_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- WATER LOGS
-- ============================================================

CREATE POLICY "Users can view own water logs"
  ON water_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs"
  ON water_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water logs"
  ON water_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs"
  ON water_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================

CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity logs"
  ON activity_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activity logs"
  ON activity_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- WORKOUT TEMPLATES
-- ============================================================

CREATE POLICY "Users can view own templates"
  ON workout_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON workout_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON workout_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON workout_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- WORKOUT SECTIONS (via template ownership)
-- ============================================================

CREATE POLICY "Users can view own workout sections"
  ON workout_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_sections.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert workout sections"
  ON workout_sections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_sections.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own workout sections"
  ON workout_sections FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_sections.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own workout sections"
  ON workout_sections FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_sections.template_id
    AND workout_templates.user_id = auth.uid()
  ));

-- ============================================================
-- WORKOUT TEMPLATE EXERCISES (via template ownership)
-- ============================================================

CREATE POLICY "Users can view own template exercises"
  ON workout_template_exercises FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert template exercises"
  ON workout_template_exercises FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own template exercises"
  ON workout_template_exercises FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own template exercises"
  ON workout_template_exercises FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workout_templates
    WHERE workout_templates.id = workout_template_exercises.template_id
    AND workout_templates.user_id = auth.uid()
  ));

-- ============================================================
-- EXERCISES GLOBAL (shared exercise library)
-- ============================================================

-- Exercises are a shared library; visible to all authenticated users
CREATE POLICY "Authenticated users can view exercises"
  ON exercises FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only system or admin can insert/update/delete exercises
-- (To be implemented via triggers or admin functions)

-- ============================================================
-- WORKOUT LOGS
-- ============================================================

CREATE POLICY "Users can view own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- HEALTH DATA: Special privacy protection
-- ============================================================

-- Health conditions field in profiles is already protected by profile policies
-- Add a comment for auditing
COMMENT ON TABLE profiles IS 'Contains sensitive health data. All access is user-scoped via RLS.';
