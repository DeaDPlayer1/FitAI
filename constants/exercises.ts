export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  type: 'Compound' | 'Isolation';
  synonyms?: string[];
}

export const PROFESSIONAL_EXERCISES: Exercise[] = [
  // CHEST
  { id: 'ex-1', name: 'Bench Press (Barbell)', muscle: 'Chest', equipment: 'Barbell', type: 'Compound', synonyms: ['bench', 'chest press', 'bb bench'] },
  { id: 'ex-2', name: 'Incline Bench Press (Barbell)', muscle: 'Chest', equipment: 'Barbell', type: 'Compound', synonyms: ['upper chest', 'incline press'] },
  { id: 'ex-3', name: 'Dumbbell Bench Press', muscle: 'Chest', equipment: 'Dumbbell', type: 'Compound', synonyms: ['db bench', 'flat db press'] },
  { id: 'ex-4', name: 'Incline Dumbbell Press', muscle: 'Chest', equipment: 'Dumbbell', type: 'Compound', synonyms: ['upper chest db'] },
  { id: 'ex-5', name: 'Pec Deck Fly', muscle: 'Chest', equipment: 'Machine', type: 'Isolation', synonyms: ['pec deck', 'chest fly', 'pec dec'] },
  { id: 'ex-6', name: 'Cable Chest Fly', muscle: 'Chest', equipment: 'Cable', type: 'Isolation', synonyms: ['cable fly', 'crossover'] },
  { id: 'ex-7', name: 'Push-Ups', muscle: 'Chest', equipment: 'Bodyweight', type: 'Compound', synonyms: ['pushups'] },
  { id: 'ex-8', name: 'Chest Press Machine', muscle: 'Chest', equipment: 'Machine', type: 'Compound', synonyms: ['hammer strength'] },
  { id: 'ex-9', name: 'Decline Bench Press', muscle: 'Chest', equipment: 'Barbell', type: 'Compound', synonyms: ['lower chest'] },

  // BACK
  { id: 'ex-10', name: 'Deadlift (Barbell)', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['bb deadlift', 'conventional'] },
  { id: 'ex-11', name: 'Pull-Ups', muscle: 'Back', equipment: 'Bodyweight', type: 'Compound', synonyms: ['pullups', 'chin ups'] },
  { id: 'ex-12', name: 'Lat Pulldown (Cable)', muscle: 'Back', equipment: 'Cable', type: 'Compound', synonyms: ['lat pull'] },
  { id: 'ex-13', name: 'Bent Over Row (Barbell)', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['bb row'] },
  { id: 'ex-14', name: 'One Arm Dumbbell Row', muscle: 'Back', equipment: 'Dumbbell', type: 'Compound', synonyms: ['db row', 'single arm row'] },
  { id: 'ex-15', name: 'Seated Cable Row', muscle: 'Back', equipment: 'Cable', type: 'Compound', synonyms: ['cable row'] },
  { id: 'ex-16', name: 'T-Bar Row', muscle: 'Back', equipment: 'Barbell', type: 'Compound', synonyms: ['tbar'] },
  { id: 'ex-17', name: 'Face Pulls', muscle: 'Back', equipment: 'Cable', type: 'Isolation', synonyms: ['rear delt fly'] },
  { id: 'ex-18', name: 'Chest Supported Row', muscle: 'Back', equipment: 'Machine', type: 'Compound', synonyms: ['iso row'] },

  // SHOULDERS
  { id: 'ex-19', name: 'Overhead Press (Barbell)', muscle: 'Shoulders', equipment: 'Barbell', type: 'Compound', synonyms: ['ohp', 'military press'] },
  { id: 'ex-20', name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Compound', synonyms: ['db ohp', 'seated press'] },
  { id: 'ex-21', name: 'Lateral Raise (Dumbbell)', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['side raises'] },
  { id: 'ex-22', name: 'Lateral Raise (Cable)', muscle: 'Shoulders', equipment: 'Cable', type: 'Isolation', synonyms: ['cable side raise'] },
  { id: 'ex-23', name: 'Front Raise (Dumbbell)', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['front raises'] },
  { id: 'ex-24', name: 'Rear Delt Fly (Machine)', muscle: 'Shoulders', equipment: 'Machine', type: 'Isolation', synonyms: ['reverse pec deck'] },
  { id: 'ex-25', name: 'Arnold Press', muscle: 'Shoulders', equipment: 'Dumbbell', type: 'Compound', synonyms: ['arnold'] },
  { id: 'ex-26', name: 'Smith Machine Shoulder Press', muscle: 'Shoulders', equipment: 'Machine', type: 'Compound', synonyms: ['smith press'] },

  // LEGS
  { id: 'ex-27', name: 'Back Squat (Barbell)', muscle: 'Legs', equipment: 'Barbell', type: 'Compound', synonyms: ['bb squat'] },
  { id: 'ex-28', name: 'Leg Press', muscle: 'Legs', equipment: 'Machine', type: 'Compound', synonyms: ['45 degree leg press'] },
  { id: 'ex-29', name: 'Leg Extension', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['quad extension'] },
  { id: 'ex-30', name: 'Leg Curl (Seated)', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['hamstring curl'] },
  { id: 'ex-31', name: 'Leg Curl (Lying)', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['lying ham curl'] },
  { id: 'ex-32', name: 'Romanian Deadlift (Barbell)', muscle: 'Legs', equipment: 'Barbell', type: 'Compound', synonyms: ['rdl', 'bb rdl'] },
  { id: 'ex-33', name: 'Walking Lunges (Dumbbell)', muscle: 'Legs', equipment: 'Dumbbell', type: 'Compound', synonyms: ['lunges'] },
  { id: 'ex-34', name: 'Calf Raise (Standing)', muscle: 'Legs', equipment: 'Machine', type: 'Isolation', synonyms: ['calf raises'] },
  { id: 'ex-35', name: 'Hack Squat', muscle: 'Legs', equipment: 'Machine', type: 'Compound', synonyms: ['hack'] },

  // ARMS
  { id: 'ex-36', name: 'Bicep Curl (Dumbbell)', muscle: 'Arms', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['db curl', 'bicep curls'] },
  { id: 'ex-37', name: 'Hammer Curl (Dumbbell)', muscle: 'Arms', equipment: 'Dumbbell', type: 'Isolation', synonyms: ['hammer curls'] },
  { id: 'ex-38', name: 'Preacher Curl (EZ Bar)', muscle: 'Arms', equipment: 'EZ Bar', type: 'Isolation', synonyms: ['preacher curls'] },
  { id: 'ex-39', name: 'Tricep Pushdown (Cable)', muscle: 'Arms', equipment: 'Cable', type: 'Isolation', synonyms: ['tricep extensions'] },
  { id: 'ex-40', name: 'Skull Crushers (EZ Bar)', muscle: 'Arms', equipment: 'EZ Bar', type: 'Isolation', synonyms: ['french press'] },
  { id: 'ex-41', name: 'Dips (Triceps Focus)', muscle: 'Arms', equipment: 'Bodyweight', type: 'Compound', synonyms: ['tricep dips'] },
  { id: 'ex-42', name: 'Overhead Tricep Extension (Cable)', muscle: 'Arms', equipment: 'Cable', type: 'Isolation', synonyms: ['overhead tricep'] },

  // CORE
  { id: 'ex-43', name: 'Plank', muscle: 'Core', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['planks'] },
  { id: 'ex-44', name: 'Hanging Leg Raise', muscle: 'Core', equipment: 'Bodyweight', type: 'Isolation', synonyms: ['leg raises'] },
  { id: 'ex-45', name: 'Ab Wheel Rollout', muscle: 'Core', equipment: 'Equipment', type: 'Compound', synonyms: ['ab rollouts'] },
  { id: 'ex-46', name: 'Cable Crunch', muscle: 'Core', equipment: 'Cable', type: 'Isolation', synonyms: ['ab crunch'] },
];
