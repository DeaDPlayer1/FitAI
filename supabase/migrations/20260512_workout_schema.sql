-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. EXERCISES TABLE
-- Stores global and user-custom exercises
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_muscle_group TEXT NOT NULL,
    equipment TEXT,
    instructions TEXT,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKOUT TEMPLATES (DAYS/PLANS)
-- The top-level container for a specific workout day (e.g., "Monday - Upper Body")
CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Upper Body", "Legs", "Push Day"
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKOUT SECTIONS
-- Dynamic sections within a template (e.g., "Main Lifts", "Accessories", or "Chest", "Back")
CREATE TABLE workout_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- The user-defined label
    order_index INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WORKOUT TEMPLATE EXERCISES
-- The exercises that belong to a specific section within a template
CREATE TABLE workout_template_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    section_id UUID REFERENCES workout_sections(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    target_sets INT NOT NULL DEFAULT 3,
    target_reps_min INT DEFAULT 8,
    target_reps_max INT DEFAULT 12,
    rest_time_seconds INT DEFAULT 90,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORKOUT SESSIONS
-- Tracks an actual instance of a user working out
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL, 
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_progress', 
    volume_load NUMERIC DEFAULT 0, 
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. WORKOUT SESSION EXERCISES
CREATE TABLE workout_session_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    section_name TEXT, -- Captures the section label at the time of workout
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    notes TEXT
);

-- 7. WORKOUT SESSION SETS
CREATE TABLE workout_session_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_exercise_id UUID NOT NULL REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    
    set_number INT NOT NULL,
    weight NUMERIC NOT NULL DEFAULT 0,
    reps INT NOT NULL DEFAULT 0,
    rir NUMERIC, 
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    rest_time_taken INT, 
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR HIGH PERFORMANCE
-- ==========================================

CREATE INDEX idx_wss_history_global 
ON workout_session_sets(user_id, exercise_id, set_number, completed_at DESC);

CREATE INDEX idx_wt_user_rel ON workout_templates(user_id);
CREATE INDEX idx_ws_user_rel ON workout_sessions(user_id);
CREATE INDEX idx_wss_session_rel ON workout_session_sets(session_id);

-- ==========================================
-- SMART FEATURES RPC: GET PREVIOUS PERFORMANCE
-- ==========================================

CREATE OR REPLACE FUNCTION get_previous_exercise_performance(
    p_exercise_ids UUID[]
)
RETURNS TABLE (
    exercise_id UUID,
    set_number INT,
    weight NUMERIC,
    reps INT,
    rir NUMERIC,
    completed_at TIMESTAMPTZ
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        exercise_id, 
        set_number, 
        weight, 
        reps, 
        rir, 
        completed_at
    FROM (
        SELECT 
            wss.exercise_id, 
            wss.set_number, 
            wss.weight, 
            wss.reps, 
            wss.rir, 
            wss.completed_at,
            ROW_NUMBER() OVER(PARTITION BY wss.exercise_id, wss.set_number ORDER BY wss.completed_at DESC) as rn
        FROM workout_session_sets wss
        WHERE wss.user_id = auth.uid()
          AND wss.exercise_id = ANY(p_exercise_ids)
          AND wss.is_completed = true
    ) sub
    WHERE sub.rn = 1;
$$;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read exercises" ON exercises FOR SELECT USING (created_by IS NULL OR created_by = auth.uid());
CREATE POLICY "Manage own templates" ON workout_templates FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Manage own sections" ON workout_sections FOR ALL USING (template_id IN (SELECT id FROM workout_templates WHERE user_id = auth.uid()));
CREATE POLICY "Manage own template exercises" ON workout_template_exercises FOR ALL USING (template_id IN (SELECT id FROM workout_templates WHERE user_id = auth.uid()));
CREATE POLICY "Manage own sessions" ON workout_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Manage own session exercises" ON workout_session_exercises FOR ALL USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = auth.uid()));
CREATE POLICY "Manage own session sets" ON workout_session_sets FOR ALL USING (user_id = auth.uid());
