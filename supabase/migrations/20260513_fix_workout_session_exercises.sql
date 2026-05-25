-- Fix missing section_name in workout_session_exercises
ALTER TABLE workout_session_exercises ADD COLUMN IF NOT EXISTS section_name TEXT;
