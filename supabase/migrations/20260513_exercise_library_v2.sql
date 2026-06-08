-- 1. Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Update exercises table with categorization
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS movement_type TEXT; -- Compound, Isolation, Cardio
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS synonyms TEXT[]; -- For better search matching

-- 3. Create a GIST index for fuzzy name search
CREATE INDEX IF NOT EXISTS exercises_name_trgm_idx ON exercises USING gist (name gist_trgm_ops);

-- 4. Seed with a robust professional exercise library (~103 exercises)
-- We use ON CONFLICT to avoid duplicates if they exist
INSERT INTO exercises (name, target_muscle_group, equipment, movement_type, synonyms)
VALUES 
    -- CHEST (15)
    ('Bench Press (Barbell)', 'Chest', 'Barbell', 'Compound', ARRAY['chest press', 'bb bench', 'flat bench']),
    ('Incline Bench Press (Barbell)', 'Chest', 'Barbell', 'Compound', ARRAY['upper chest', 'incline press']),
    ('Decline Bench Press (Barbell)', 'Chest', 'Barbell', 'Compound', ARRAY['lower chest']),
    ('Dumbbell Bench Press', 'Chest', 'Dumbbell', 'Compound', ARRAY['db bench', 'flat db press']),
    ('Incline Dumbbell Press', 'Chest', 'Dumbbell', 'Compound', ARRAY['upper chest db']),
    ('Pec Deck Fly', 'Chest', 'Machine', 'Isolation', ARRAY['pec deck', 'chest fly machine', 'pec dec']),
    ('Cable Chest Fly', 'Chest', 'Cable', 'Isolation', ARRAY['cable fly', 'chest fly crossovers']),
    ('Push-Ups', 'Chest', 'Bodyweight', 'Compound', ARRAY['pushups']),
    ('Chest Press (Machine)', 'Chest', 'Machine', 'Compound', ARRAY['hammer strength press']),
    ('Decline Dumbbell Press', 'Chest', 'Dumbbell', 'Compound', ARRAY['lower chest db']),
    ('Smith Machine Bench Press', 'Chest', 'Machine', 'Compound', ARRAY['smith bench']),
    ('Incline Cable Fly', 'Chest', 'Cable', 'Isolation', ARRAY['upper cable fly']),
    ('Dumbbell Pullover', 'Chest', 'Dumbbell', 'Compound', ARRAY['pullover', 'db pullover']),
    ('Low to High Cable Crossover', 'Chest', 'Cable', 'Isolation', ARRAY['low cable fly', 'upper chest cable']),
    ('Weighted Push-Ups', 'Chest', 'Barbell', 'Compound', ARRAY['weighted pushup', 'plate pushup']),
    
    -- BACK (15)
    ('Deadlift (Barbell)', 'Back', 'Barbell', 'Compound', ARRAY['bb deadlift', 'conventional deadlift']),
    ('Pull-Ups', 'Back', 'Bodyweight', 'Compound', ARRAY['pullups', 'chin ups']),
    ('Lat Pulldown (Cable)', 'Back', 'Cable', 'Compound', ARRAY['lat pull']),
    ('Bent Over Row (Barbell)', 'Back', 'Barbell', 'Compound', ARRAY['bb row', 'bent row']),
    ('One Arm Dumbbell Row', 'Back', 'Dumbbell', 'Compound', ARRAY['db row', 'single arm row']),
    ('Seated Cable Row', 'Back', 'Cable', 'Compound', ARRAY['cable row']),
    ('T-Bar Row', 'Back', 'Barbell', 'Compound', ARRAY['tbar']),
    ('Face Pulls', 'Back', 'Cable', 'Isolation', ARRAY['rear delt fly']),
    ('Chest Supported Row', 'Back', 'Machine', 'Compound', ARRAY['iso row']),
    ('Pendlay Row', 'Back', 'Barbell', 'Compound', ARRAY['pendlay row']),
    ('Meadows Row', 'Back', 'Barbell', 'Compound', ARRAY['meadows', 'landmine row']),
    ('Inverted Row', 'Back', 'Bodyweight', 'Compound', ARRAY['bodyweight row', 'australian pullup']),
    ('Straight Arm Pulldown', 'Back', 'Cable', 'Isolation', ARRAY['straight arm lat']),
    ('Good Mornings', 'Back', 'Barbell', 'Compound', ARRAY['bb good morning']),
    ('Rack Pull', 'Back', 'Barbell', 'Compound', ARRAY['rack pull', 'block pull']),
    
    -- SHOULDERS (13)
    ('Overhead Press (Barbell)', 'Shoulders', 'Barbell', 'Compound', ARRAY['ohp', 'military press', 'shoulder press']),
    ('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 'Compound', ARRAY['db ohp', 'seated shoulder press']),
    ('Lateral Raise (Dumbbell)', 'Shoulders', 'Dumbbell', 'Isolation', ARRAY['side raises', 'lateral raises']),
    ('Lateral Raise (Cable)', 'Shoulders', 'Cable', 'Isolation', ARRAY['cable side raise']),
    ('Front Raise (Dumbbell)', 'Shoulders', 'Dumbbell', 'Isolation', ARRAY['front raises']),
    ('Rear Delt Fly (Machine)', 'Shoulders', 'Machine', 'Isolation', ARRAY['reverse pec deck']),
    ('Arnold Press', 'Shoulders', 'Dumbbell', 'Compound', ARRAY['arnold press']),
    ('Smith Machine Shoulder Press', 'Shoulders', 'Machine', 'Compound', ARRAY['smith press']),
    ('Push Press', 'Shoulders', 'Barbell', 'Compound', ARRAY['push press', 'dip drive']),
    ('Reverse Fly (Cable)', 'Shoulders', 'Cable', 'Isolation', ARRAY['cable reverse fly']),
    ('Landmine Press', 'Shoulders', 'Barbell', 'Compound', ARRAY['landmine press']),
    ('Face Pull (Rope)', 'Shoulders', 'Cable', 'Isolation', ARRAY['rope face pull', 'external rotation']),
    ('Plate Front Raise', 'Shoulders', 'Barbell', 'Isolation', ARRAY['plate raise', 'barbell front raise']),
    
    -- LEGS (18)
    ('Back Squat (Barbell)', 'Legs', 'Barbell', 'Compound', ARRAY['bb squat', 'high bar squat']),
    ('Leg Press', 'Legs', 'Machine', 'Compound', ARRAY['45 degree leg press']),
    ('Leg Extension', 'Legs', 'Machine', 'Isolation', ARRAY['quad extension']),
    ('Leg Curl (Seated)', 'Legs', 'Machine', 'Isolation', ARRAY['hamstring curl']),
    ('Leg Curl (Lying)', 'Legs', 'Machine', 'Isolation', ARRAY['lying ham curl']),
    ('Romanian Deadlift (Barbell)', 'Legs', 'Barbell', 'Compound', ARRAY['rdl', 'bb rdl']),
    ('Walking Lunges (Dumbbell)', 'Legs', 'Dumbbell', 'Compound', ARRAY['lunges']),
    ('Calf Raise (Standing)', 'Legs', 'Machine', 'Isolation', ARRAY['calf raises']),
    ('Hack Squat', 'Legs', 'Machine', 'Compound', ARRAY['hack squat']),
    ('Front Squat (Barbell)', 'Legs', 'Barbell', 'Compound', ARRAY['front squat']),
    ('Goblet Squat', 'Legs', 'Dumbbell', 'Compound', ARRAY['goblet', 'db squat']),
    ('Bulgarian Split Squat', 'Legs', 'Dumbbell', 'Compound', ARRAY['bulgarian', 'rear foot elevated']),
    ('Sissy Squat', 'Legs', 'Bodyweight', 'Isolation', ARRAY['sissy squat']),
    ('Pistol Squat', 'Legs', 'Bodyweight', 'Compound', ARRAY['single leg squat']),
    ('Leg Press (Single Leg)', 'Legs', 'Machine', 'Compound', ARRAY['single leg press']),
    ('Nordic Curl', 'Legs', 'Bodyweight', 'Isolation', ARRAY['nordic hamstring', 'nordic curl']),
    ('Seated Calf Raise', 'Legs', 'Machine', 'Isolation', ARRAY['seated calf']),
    ('Donkey Calf Raise', 'Legs', 'Machine', 'Isolation', ARRAY['donkey calf']),
    
    -- GLUTES & HIPS (8)
    ('Hip Thrust (Barbell)', 'Glutes', 'Barbell', 'Compound', ARRAY['hip thrust', 'glute bridge']),
    ('Glute Bridge (Bodyweight)', 'Glutes', 'Bodyweight', 'Compound', ARRAY['glute bridge bw']),
    ('Cable Pull-Through', 'Glutes', 'Cable', 'Compound', ARRAY['pull through', 'glute cable']),
    ('Hip Abduction (Machine)', 'Glutes', 'Machine', 'Isolation', ARRAY['abduction', 'hip abductor']),
    ('Hip Adduction (Machine)', 'Glutes', 'Machine', 'Isolation', ARRAY['adduction', 'hip adductor']),
    ('Step-Ups (Dumbbell)', 'Glutes', 'Dumbbell', 'Compound', ARRAY['step ups']),
    ('Reverse Hyperextension', 'Glutes', 'Machine', 'Isolation', ARRAY['reverse hyper']),
    ('Kettlebell Swing', 'Glutes', 'Kettlebell', 'Compound', ARRAY['kb swing', 'kettle swing']),
    
    -- ARMS (16)
    ('Bicep Curl (Dumbbell)', 'Arms', 'Dumbbell', 'Isolation', ARRAY['db curl', 'bicep curls']),
    ('Hammer Curl (Dumbbell)', 'Arms', 'Dumbbell', 'Isolation', ARRAY['hammer curls']),
    ('Preacher Curl (EZ Bar)', 'Arms', 'EZ Bar', 'Isolation', ARRAY['preacher curls']),
    ('Tricep Pushdown (Cable)', 'Arms', 'Cable', 'Isolation', ARRAY['tricep extensions']),
    ('Skull Crushers (EZ Bar)', 'Arms', 'EZ Bar', 'Isolation', ARRAY['french press']),
    ('Dips (Triceps Focus)', 'Arms', 'Bodyweight', 'Compound', ARRAY['tricep dips']),
    ('Overhead Tricep Extension (Cable)', 'Arms', 'Cable', 'Isolation', ARRAY['overhead tricep']),
    ('Concentration Curl', 'Arms', 'Dumbbell', 'Isolation', ARRAY['concentration curl']),
    ('Incline Dumbbell Curl', 'Arms', 'Dumbbell', 'Isolation', ARRAY['incline curl', 'stretch curl']),
    ('Spider Curl (EZ Bar)', 'Arms', 'EZ Bar', 'Isolation', ARRAY['spider curl']),
    ('Reverse Curl (EZ Bar)', 'Arms', 'EZ Bar', 'Isolation', ARRAY['reverse curl', 'brachialis']),
    ('Close Grip Bench Press', 'Arms', 'Barbell', 'Compound', ARRAY['cgbp', 'cg bench']),
    ('Tricep Kickback (Dumbbell)', 'Arms', 'Dumbbell', 'Isolation', ARRAY['kickback', 'db kickback']),
    ('Cable Bicep Curl', 'Arms', 'Cable', 'Isolation', ARRAY['cable curl']),
    ('Bayesian Curl (Cable)', 'Arms', 'Cable', 'Isolation', ARRAY['bayesian curl']),
    ('Wrist Curl (Barbell)', 'Arms', 'Barbell', 'Isolation', ARRAY['wrist curl', 'forearm curl']),
    
    -- CORE (10)
    ('Plank', 'Core', 'Bodyweight', 'Isolation', ARRAY['planks']),
    ('Hanging Leg Raise', 'Core', 'Bodyweight', 'Isolation', ARRAY['leg raises']),
    ('Ab Wheel Rollout', 'Core', 'Equipment', 'Compound', ARRAY['ab rollouts']),
    ('Cable Crunch', 'Core', 'Cable', 'Isolation', ARRAY['ab crunch cable']),
    ('Russian Twist', 'Core', 'Bodyweight', 'Isolation', ARRAY['russian twist']),
    ('Dead Bug', 'Core', 'Bodyweight', 'Isolation', ARRAY['dead bug', 'deadbugs']),
    ('Pallof Press', 'Core', 'Cable', 'Isolation', ARRAY['pallof press', 'anti-rotation']),
    ('Dumbbell Side Bend', 'Core', 'Dumbbell', 'Isolation', ARRAY['side bend', 'oblique']),
    ('L-Sit', 'Core', 'Bodyweight', 'Compound', ARRAY['l sit', 'v sit']),
    ('Toes to Bar', 'Core', 'Bodyweight', 'Compound', ARRAY['ttb', 'toes to bar']),
    
    -- CARDIO (8)
    ('Treadmill Running', 'Cardio', 'Machine', 'Cardio', ARRAY['treadmill', 'running']),
    ('Stationary Bike', 'Cardio', 'Machine', 'Cardio', ARRAY['bike', 'cycling', 'exercise bike']),
    ('Rowing Machine', 'Cardio', 'Machine', 'Cardio', ARRAY['rower', 'erg']),
    ('Jump Rope', 'Cardio', 'Equipment', 'Cardio', ARRAY['jump rope', 'skipping']),
    ('Assault Bike', 'Cardio', 'Machine', 'Cardio', ARRAY['air bike', 'fan bike']),
    ('Stair Climber', 'Cardio', 'Machine', 'Cardio', ARRAY['stairmaster', 'stairs']),
    ('Burpees', 'Cardio', 'Bodyweight', 'Cardio', ARRAY['burpee']),
    ('Battle Ropes', 'Cardio', 'Equipment', 'Cardio', ARRAY['ropes', 'battle ropes'])
ON CONFLICT (name) DO NOTHING;
