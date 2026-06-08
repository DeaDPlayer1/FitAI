-- Add app_mode column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS app_mode TEXT NOT NULL DEFAULT 'normal'
CHECK (app_mode IN ('normal', 'ai_trainer'));

-- Optionally create an index for queries filtering by mode
CREATE INDEX IF NOT EXISTS idx_profiles_app_mode ON profiles (app_mode);
