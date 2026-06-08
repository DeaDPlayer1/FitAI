-- ============================================================
-- FIX C14: SECURITY DEFINER function now uses auth.uid()
-- instead of accepting p_user_id (prevents data leak).
-- Run this in Supabase SQL editor.
-- ============================================================

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
