-- 1. Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Update exercises table with categorization
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS target_muscle_group TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS equipment_type TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS movement_type TEXT; -- Compound, Isolation
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS synonyms TEXT[]; -- For better search matching

-- 3. Create a GIST index for fuzzy name search
CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx ON exercises USING gist (name gist_trgm_ops);

-- 4. Seed with a robust professional exercise library
-- We use ON CONFLICT to avoid duplicates if they exist
INSERT INTO exercises (name, target_muscle_group, equipment_type, movement_type, synonyms)
VALUES 
    -- CHEST
    ('Bench Press (Barbell)', 'Chest', 'Barbell', 'Compound', ARRAY['chest press', 'bb bench', 'flat bench']),
    ('Incline Bench Press (Barbell)', 'Chest', 'Barbell', 'Compound', ARRAY['upper chest', 'incline press']),
    ('Decline Bench Press (Barbell)', 'Chest', 'Barbell', 'Compound', ARRAY['lower chest']),
    ('Dumbbell Bench Press', 'Chest', 'Dumbbell', 'Compound', ARRAY['db bench', 'flat db press']),
    ('Incline Dumbbell Press', 'Chest', 'Dumbbell', 'Compound', ARRAY['upper chest db']),
    ('Pec Deck Fly', 'Chest', 'Machine', 'Isolation', ARRAY['pec deck', 'chest fly machine', 'pec dec']),
    ('Cable Chest Fly', 'Chest', 'Cable', 'Isolation', ARRAY['cable fly', 'chest fly crossovers']),
    ('Push-Ups', 'Chest', 'Bodyweight', 'Compound', ARRAY['pushups']),
    ('Chest Press (Machine)', 'Chest', 'Machine', 'Compound', ARRAY['hammer strength press']),
    
    -- BACK
    ('Deadlift (Barbell)', 'Back', 'Barbell', 'Compound', ARRAY['bb deadlift', 'conventional deadlift']),
    ('Pull-Ups', 'Back', 'Bodyweight', 'Compound', ARRAY['pullups', 'chin ups']),
    ('Lat Pulldown (Cable)', 'Back', 'Cable', 'Compound', ARRAY['lat pull']),
    ('Bent Over Row (Barbell)', 'Back', 'Barbell', 'Compound', ARRAY['bb row', 'bent row']),
    ('One Arm Dumbbell Row', 'Back', 'Dumbbell', 'Compound', ARRAY['db row', 'single arm row']),
    ('Seated Cable Row', 'Back', 'Cable', 'Compound', ARRAY['cable row']),
    ('T-Bar Row', 'Back', 'Barbell', 'Compound', ARRAY['tbar']),
    ('Face Pulls', 'Back', 'Cable', 'Isolation', ARRAY['rear delt fly']),
    
    -- SHOULDERS
    ('Overhead Press (Barbell)', 'Shoulders', 'Barbell', 'Compound', ARRAY['ohp', 'military press', 'shoulder press']),
    ('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 'Compound', ARRAY['db ohp', 'seated shoulder press']),
    ('Lateral Raise (Dumbbell)', 'Shoulders', 'Dumbbell', 'Isolation', ARRAY['side raises', 'lateral raises']),
    ('Lateral Raise (Cable)', 'Shoulders', 'Cable', 'Isolation', ARRAY['cable side raise']),
    ('Front Raise (Dumbbell)', 'Shoulders', 'Dumbbell', 'Isolation', ARRAY['front raises']),
    ('Rear Delt Fly (Machine)', 'Shoulders', 'Machine', 'Isolation', ARRAY['reverse pec deck']),
    
    -- LEGS
    ('Back Squat (Barbell)', 'Legs', 'Barbell', 'Compound', ARRAY['bb squat', 'high bar squat']),
    ('Leg Press', 'Legs', 'Machine', 'Compound', ARRAY['45 degree leg press']),
    ('Leg Extension', 'Legs', 'Machine', 'Isolation', ARRAY['quad extension']),
    ('Leg Curl (Seated)', 'Legs', 'Machine', 'Isolation', ARRAY['hamstring curl']),
    ('Leg Curl (Lying)', 'Legs', 'Machine', 'Isolation', ARRAY['lying ham curl']),
    ('Romanian Deadlift (Barbell)', 'Legs', 'Barbell', 'Compound', ARRAY['rdl', 'bb rdl']),
    ('Walking Lunges (Dumbbell)', 'Legs', 'Dumbbell', 'Compound', ARRAY['lunges']),
    ('Calf Raise (Standing)', 'Legs', 'Machine', 'Isolation', ARRAY['calf raises']),
    
    -- ARMS
    ('Bicep Curl (Dumbbell)', 'Arms', 'Dumbbell', 'Isolation', ARRAY['db curl', 'bicep curls']),
    ('Hammer Curl (Dumbbell)', 'Arms', 'Dumbbell', 'Isolation', ARRAY['hammer curls']),
    ('Preacher Curl (EZ Bar)', 'Arms', 'EZ Bar', 'Isolation', ARRAY['preacher curls']),
    ('Tricep Pushdown (Cable)', 'Arms', 'Cable', 'Isolation', ARRAY['tricep extensions']),
    ('Skull Crushers (EZ Bar)', 'Arms', 'EZ Bar', 'Isolation', ARRAY['french press']),
    ('Dips (Triceps Focus)', 'Arms', 'Bodyweight', 'Compound', ARRAY['tricep dips']),
    
    -- CORE
    ('Plank', 'Core', 'Bodyweight', 'Isolation', ARRAY['planks']),
    ('Hanging Leg Raise', 'Core', 'Bodyweight', 'Isolation', ARRAY['leg raises']),
    ('Ab Wheel Rollout', 'Core', 'Equipment', 'Compound', ARRAY['ab rollouts'])
ON CONFLICT (name) DO NOTHING;
