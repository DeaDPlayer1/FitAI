export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  type: 'Compound' | 'Isolation';
  synonyms?: string[];
}

export const PROFESSIONAL_EXERCISES: Exercise[] = [
  // CHEST (15)
  { id: 'ex-1', name: 'Bench Press (Barbell)', muscle: 'Chest', equipment: 'Barbell', type: 'Compound', synonyms: ['bench', 'chest press', 'bb bench'] },
  { id: 'ex-2', name: 'Incline Bench Press (Barbell)', muscle: 'Chest', equipment: 'Barbell', type: 'Compound', synonyms: ['upper chest', 'incline press'] },
  { id: 'ex-3', name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'Dumbbell', type: 'Compound', synonyms: ['db bench', 'flat db press'] },
  { id: 'ex-4', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', type: 'Compound', synonyms: ['upper chest db'] },
  { id: 'ex-5', name: 'Pec Deck Fly', muscle: 'Chest', equipment: 'Machine', type: 'Isolation', synonyms: ['pec deck', 'chest fly', 'pec dec'] },
  { id: 'ex-6', name: 'Cable Chest Fly', muscle: 'Chest', equipment: 'Cable', type: 'Isolation', synonyms: ['cable fly', 'crossover'] },
  { id: 'ex-7', name: 'Push-Ups', muscle: 'Chest', equipment: 'Bodyweight', type: 'Compound', synonyms: ['pushups'] },
  { id: 'ex-8', name: 'Chest Press Machine', muscle: 'Chest', equipment: 'Machine', type: 'Compound', synonyms: ['hammer strength'] },
  { id: 'ex-9', name: 'Decline Bench Press (Barbell)', muscle: 'Chest', equipment: 'Barbell', type: 'Compound', synonyms: ['lower chest'] },
  { id: 'ex-47', name: 'Decline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', type: 'Compound', synonyms: ['lower chest db'] },
  { id: 'ex-48', name: 'Smith Machine Bench Press', muscle: 'Chest', equipment: 'Machine', type: 'Compound', synonyms: ['smith bench'] },
  { id: 'ex-49', name: 'Incline Cable Fly', muscle: 'Chest', equipment: 'Cable', type: 'Isolation', synonyms: ['upper cable fly'] },
  { id: 'ex-50', name: 'Dumbbell Pullover', muscle: 'Chest', equipment: 'Dumbbell', type: 'Compound', synonyms: ['pullover', 'db pullover'] },
  { id: 'ex-51', name: 'Low to High Cable Crossover', muscle: 'Chest', equipment: 'Cable', type: 'Isolation', synonyms: ['low cable fly', 'upper chest cable'] },
  { id: 'ex-52', name: 'Weighted Push-Ups', muscle: 'Chest', equipment: 'Barbell', type: 'Compound', synonyms: ['weighted pushup', 'plate pushup'] },

  // BACK (15)
  { id: 'ex-10', name: 'Deadlift (Barbell)', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['bb deadlift', 'conventional'] },
  { id: 'ex-11', name: 'Pull-Ups', muscle: 'Back', equipment: 'Bodyweight', type: 'Compound', synonyms: ['pullups', 'chin ups'] },
  { id: 'ex-12', name: 'Lat Pulldown (Cable)', muscle: 'Back', equipment: 'Cable', type: 'Compound', synonyms: ['lat pull'] },
  { id: 'ex-13', name: 'Bent Over Row (Barbell)', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['bb row'] },
  { id: 'ex-14', name: 'One Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell', type: 'Compound', synonyms: ['db row', 'single arm row'] },
  { id: 'ex-15', name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable', type: 'Compound', synonyms: ['cable row'] },
  { id: 'ex-16', name: 'T-Bar Row', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['tbar'] },
  { id: 'ex-17', name: 'Face Pulls', muscle: 'Back', equipment: 'Cable', type: 'Isolation', synonyms: ['rear delt fly'] },
  { id: 'ex-18', name: 'Chest Supported Row', muscle: 'Back', equipment: 'Machine', type: 'Compound', synonyms: ['iso row'] },
  { id: 'ex-53', name: 'Pendlay Row', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['pendlay'] },
  { id: 'ex-54', name: 'Dumbbell Pullover', muscle: 'Back', equipment: 'Dumbbell', type: 'Compound', synonyms: ['db pullover back'] },
  { id: 'ex-55', name: 'Meadows Row', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['meadows', 'landmine row'] },
  { id: 'ex-56', name: 'Inverted Row', muscle: 'Back', equipment: 'Bodyweight', type: 'Compound', synonyms: ['bodyweight row', 'australian pullup'] },
  { id: 'ex-57', name: 'Straight Arm Pulldown', muscle: 'Back', equipment: 'Cable', type: 'Isolation', synonyms: ['straight arm lat'] },
  { id: 'ex-58', name: 'Good Mornings', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['bb good morning'] },

  // SHOULDERS (13)
  { id: 'ex-19', name: 'Overhead Press (Barbell)', muscle: 'Shoulders', equipment: 'Barbell', type: 'Compound', synonyms: ['ohp', 'military press'] },
  { id: 'ex-20', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Compound', synonyms: ['db ohp', 'seated press'] },
  { id: 'ex-21', name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['side raises'] },
  { id: 'ex-22', name: 'Lateral Raise (Cable)', muscle: 'Shoulders', equipment: 'Cable', type: 'Isolation', synonyms: ['cable side raise'] },
  { id: 'ex-23', name: 'Front Raise (Dumbbell)', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['front raises'] },
  { id: 'ex-24', name: 'Rear Delt Fly (Machine)', muscle: 'Shoulders', equipment: 'Machine', type: 'Isolation', synonyms: ['reverse pec deck'] },
  { id: 'ex-25', name: 'Arnold Press', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Compound', synonyms: ['arnold'] },
  { id: 'ex-26', name: 'Smith Machine Shoulder Press', muscle: 'Shoulders', equipment: 'Machine', type: 'Compound', synonyms: ['smith press'] },
  { id: 'ex-59', name: 'Push Press', muscle: 'Shoulders', equipment: 'Barbell', type: 'Compound', synonyms: ['push press', 'dip drive'] },
  { id: 'ex-60', name: 'Reverse Fly (Cable)', muscle: 'Shoulders', equipment: 'Cable', type: 'Isolation', synonyms: ['cable reverse fly'] },
  { id: 'ex-61', name: 'Landmine Press', muscle: 'Shoulders', equipment: 'Barbell', type: 'Compound', synonyms: ['landmine shoulder'] },
  { id: 'ex-62', name: 'Face Pull (Rope)', muscle: 'Shoulders', equipment: 'Cable', type: 'Isolation', synonyms: ['rope face pull', 'external rotation'] },
  { id: 'ex-63', name: 'Plate Front Raise', muscle: 'Shoulders', equipment: 'Barbell', type: 'Isolation', synonyms: ['plate raise', 'barbell front raise'] },

  // LEGS (18)
  { id: 'ex-27', name: 'Back Squat (Barbell)', muscle: 'Legs', equipment: 'Barbell', type: 'Compound', synonyms: ['bb squat'] },
  { id: 'ex-28', name: 'Leg Press', muscle: 'Legs', equipment: 'Machine', type: 'Compound', synonyms: ['45 degree leg press'] },
  { id: 'ex-29', name: 'Leg Extension', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['quad extension'] },
  { id: 'ex-30', name: 'Leg Curl (Seated)', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['hamstring curl'] },
  { id: 'ex-31', name: 'Leg Curl (Lying)', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['lying ham curl'] },
  { id: 'ex-32', name: 'Romanian Deadlift (Barbell)', muscle: 'Legs', equipment: 'Barbell', type: 'Compound', synonyms: ['rdl', 'bb rdl'] },
  { id: 'ex-33', name: 'Walking Lunges (Dumbbell)', muscle: 'Legs', equipment: 'Dumbbell', type: 'Compound', synonyms: ['lunges'] },
  { id: 'ex-34', name: 'Calf Raise (Standing)', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['calf raises'] },
  { id: 'ex-35', name: 'Hack Squat', muscle: 'Legs', equipment: 'Machine', type: 'Compound', synonyms: ['hack'] },
  { id: 'ex-64', name: 'Front Squat (Barbell)', muscle: 'Legs', equipment: 'Barbell', type: 'Compound', synonyms: ['front squat'] },
  { id: 'ex-65', name: 'Goblet Squat', muscle: 'Legs', equipment: 'Dumbbell', type: 'Compound', synonyms: ['goblet', 'db squat'] },
  { id: 'ex-66', name: 'Bulgarian Split Squat', muscle: 'Legs', equipment: 'Dumbbell', type: 'Compound', synonyms: ['bulgarian', 'rear foot elevated'] },
  { id: 'ex-67', name: 'Sissy Squat', muscle: 'Legs', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['sissy'] },
  { id: 'ex-68', name: 'Pistol Squat', muscle: 'Legs', equipment: 'Bodyweight', type: 'Compound', synonyms: ['single leg squat'] },
  { id: 'ex-69', name: 'Leg Press (Single Leg)', muscle: 'Legs', equipment: 'Machine', type: 'Compound', synonyms: ['single leg press'] },
  { id: 'ex-70', name: 'Nordic Curl', muscle: 'Legs', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['nordic hamstring'] },
  { id: 'ex-71', name: 'Seated Calf Raise', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['seated calf'] },
  { id: 'ex-72', name: 'Donkey Calf Raise', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['donkey calf'] },

  // GLUTES & HIPS (8)
  { id: 'ex-73', name: 'Hip Thrust (Barbell)', muscle: 'Glutes', equipment: 'Barbell', type: 'Compound', synonyms: ['hip thrust', 'glute bridge'] },
  { id: 'ex-74', name: 'Glute Bridge (Bodyweight)', muscle: 'Glutes', equipment: 'Bodyweight', type: 'Compound', synonyms: ['glute bridge bw'] },
  { id: 'ex-75', name: 'Cable Pull-Through', muscle: 'Glutes', equipment: 'Cable', type: 'Compound', synonyms: ['pull through', 'glute cable'] },
  { id: 'ex-76', name: 'Hip Abduction (Machine)', muscle: 'Glutes', equipment: 'Machine', type: 'Isolation', synonyms: ['abduction', 'hip abductor'] },
  { id: 'ex-77', name: 'Hip Adduction (Machine)', muscle: 'Glutes', equipment: 'Machine', type: 'Isolation', synonyms: ['adduction', 'hip adductor'] },
  { id: 'ex-78', name: 'Step-Ups (Dumbbell)', muscle: 'Glutes', equipment: 'Dumbbell', type: 'Compound', synonyms: ['step ups'] },
  { id: 'ex-79', name: 'Reverse Hyperextension', muscle: 'Glutes', equipment: 'Machine', type: 'Isolation', synonyms: ['reverse hyper'] },
  { id: 'ex-80', name: 'Kettlebell Swing', muscle: 'Glutes', equipment: 'Kettlebell', type: 'Compound', synonyms: ['kb swing', 'kettle swing'] },

  // ARMS (16)
  { id: 'ex-36', name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['db curl', 'bicep curls'] },
  { id: 'ex-37', name: 'Hammer Curl (Dumbbell)', muscle: 'Arms', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['hammer curls'] },
  { id: 'ex-38', name: 'Preacher Curl (EZ Bar)', muscle: 'Arms', equipment: 'EZ Bar', type: 'Isolation', synonyms: ['preacher curls'] },
  { id: 'ex-39', name: 'Tricep Pushdown (Cable)', muscle: 'Arms', equipment: 'Cable', type: 'Isolation', synonyms: ['tricep extensions'] },
  { id: 'ex-40', name: 'Skull Crushers (EZ Bar)', muscle: 'Arms', equipment: 'EZ Bar', type: 'Isolation', synonyms: ['french press'] },
  { id: 'ex-41', name: 'Dips (Triceps Focus)', muscle: 'Arms', equipment: 'Bodyweight', type: 'Compound', synonyms: ['tricep dips'] },
  { id: 'ex-42', name: 'Overhead Tricep Extension (Cable)', muscle: 'Arms', equipment: 'Cable', type: 'Isolation', synonyms: ['overhead tricep'] },
  { id: 'ex-81', name: 'Concentration Curl', muscle: 'Arms', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['concentration'] },
  { id: 'ex-82', name: 'Incline Dumbbell Curl', muscle: 'Arms', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['incline curl', 'stretch curl'] },
  { id: 'ex-83', name: 'Spider Curl (EZ Bar)', muscle: 'Arms', equipment: 'EZ Bar', type: 'Isolation', synonyms: ['spider curl'] },
  { id: 'ex-84', name: 'Reverse Curl (EZ Bar)', muscle: 'Arms', equipment: 'EZ Bar', type: 'Isolation', synonyms: ['reverse curl', 'brachialis'] },
  { id: 'ex-85', name: 'Close Grip Bench Press', muscle: 'Arms', equipment: 'Barbell', type: 'Compound', synonyms: ['cgbp', 'cg bench'] },
  { id: 'ex-86', name: 'Tricep Kickback (Dumbbell)', muscle: 'Arms', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['kickback', 'db kickback'] },
  { id: 'ex-87', name: 'Cable Bicep Curl', muscle: 'Arms', equipment: 'Cable', type: 'Isolation', synonyms: ['cable curl'] },
  { id: 'ex-88', name: 'Bayesian Curl (Cable)', muscle: 'Arms', equipment: 'Cable', type: 'Isolation', synonyms: ['bayesian', 'cable bayesian'] },
  { id: 'ex-89', name: 'Wrist Curl (Barbell)', muscle: 'Arms', equipment: 'Barbell', type: 'Isolation', synonyms: ['wrist curl', 'forearm curl'] },

  // CORE (10)
  { id: 'ex-43', name: 'Plank', muscle: 'Core', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['planks'] },
  { id: 'ex-44', name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['leg raises'] },
  { id: 'ex-45', name: 'Ab Wheel Rollout', muscle: 'Core', equipment: 'Equipment', type: 'Compound', synonyms: ['ab rollouts'] },
  { id: 'ex-46', name: 'Cable Crunch', muscle: 'Core', equipment: 'Cable', type: 'Isolation', synonyms: ['ab crunch'] },
  { id: 'ex-90', name: 'Russian Twist', muscle: 'Core', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['russian twist'] },
  { id: 'ex-91', name: 'Dead Bug', muscle: 'Core', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['dead bug', 'deadbugs'] },
  { id: 'ex-92', name: 'Pallof Press', muscle: 'Core', equipment: 'Cable', type: 'Isolation', synonyms: ['pallof', 'anti-rotation'] },
  { id: 'ex-93', name: 'Dumbbell Side Bend', muscle: 'Core', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['side bend', 'oblique'] },
  { id: 'ex-94', name: 'L-Sit', muscle: 'Core', equipment: 'Bodyweight', type: 'Compound', synonyms: ['l sit', 'v sit'] },
  { id: 'ex-95', name: 'Toes to Bar', muscle: 'Core', equipment: 'Bodyweight', type: 'Compound', synonyms: ['ttb', 'toes to bar'] },

  // CARDIO (8)
  { id: 'ex-96', name: 'Treadmill Running', muscle: 'Cardio', equipment: 'Machine', type: 'Cardio', synonyms: ['treadmill', 'running'] },
  { id: 'ex-97', name: 'Stationary Bike', muscle: 'Cardio', equipment: 'Machine', type: 'Cardio', synonyms: ['bike', 'cycling', 'exercise bike'] },
  { id: 'ex-98', name: 'Rowing Machine', muscle: 'Cardio', equipment: 'Machine', type: 'Cardio', synonyms: ['rower', 'erg'] },
  { id: 'ex-99', name: 'Jump Rope', muscle: 'Cardio', equipment: 'Equipment', type: 'Cardio', synonyms: ['jump rope', 'skipping'] },
  { id: 'ex-100', name: 'Assault Bike', muscle: 'Cardio', equipment: 'Machine', type: 'Cardio', synonyms: ['air bike', 'fan bike'] },
  { id: 'ex-101', name: 'Stair Climber', muscle: 'Cardio', equipment: 'Machine', type: 'Cardio', synonyms: ['stairmaster', 'stairs'] },
  { id: 'ex-102', name: 'Burpees', muscle: 'Cardio', equipment: 'Bodyweight', type: 'Cardio', synonyms: ['burpee'] },
  { id: 'ex-103', name: 'Battle Ropes', muscle: 'Cardio', equipment: 'Equipment', type: 'Cardio', synonyms: ['ropes', 'battle ropes'] },
];
