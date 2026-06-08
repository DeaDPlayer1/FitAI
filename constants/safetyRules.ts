export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type Domain = 'nutrition' | 'exercise' | 'supplement' | 'medical' | 'general';

export type SafetyAction = 'flag' | 'block' | 'modify';

export interface SafetyRule {
  id: string;
  domain: Domain;
  /** Empty array = applies to all users regardless of conditions */
  relevantConditions: string[];
  /** Pattern to detect in AI response */
  pattern: RegExp;
  severity: Severity;
  message: string;
  action: SafetyAction;
  /** Custom explanation for the user if triggered */
  userExplanation?: string;
  /** Safe alternative suggestion if applicable */
  safeAlternative?: string;
}

export interface SafetyThreshold {
  id: string;
  domain: Domain;
  relevantConditions: string[];
  metric: string;
  min?: number;
  max?: number;
  unit: string;
  severity: Severity;
  message: string;
  action: SafetyAction;
}

export interface ContraindicatedFood {
  id: string;
  food: string;
  relevantConditions: string[];
  reason: string;
  severity: Severity;
  safeAlternative: string;
}

export const SAFETY_RULES: SafetyRule[] = [
  // ─── CRITICAL: Never override medical advice ───
  {
    id: 'food_drug_interaction',
    domain: 'nutrition',
    relevantConditions: [],
    pattern: /(grapefruit|maoi|warfarin|blood.thinner|anticoagulant|coumadin).*(diet|eat|food|meal|nutrition)/i,
    severity: 'high',
    message: 'Food-drug interactions can be dangerous. Consult a pharmacist or doctor before making dietary changes.',
    action: 'flag',
    userExplanation: 'Certain foods can interact with medications. I can provide general guidance, but please consult your pharmacist or doctor for medication-specific advice.',
    safeAlternative: 'Always check medication labels for food interactions and discuss dietary changes with your healthcare provider.',
  },
  {
    id: 'grapefruit_interaction',
    domain: 'nutrition',
    relevantConditions: [],
    pattern: /grapefruit.*(statins?|atorvastatin|simvastatin|lovastatin|ccb|nifedipine|amlodipine|felodipine)/i,
    severity: 'critical',
    message: 'Grapefruit can dangerously increase the potency of statins and calcium channel blockers.',
    action: 'flag',
    userExplanation: 'Grapefruit inhibits CYP3A4 enzymes, causing statins and CCBs to reach up to 3x normal blood levels. This increases risk of rhabdomyolysis (statins) or hypotension (CCBs).',
    safeAlternative: 'Switch to other citrus fruits like oranges or tangerines which do not affect these medications.',
  },
  {
    id: 'maoi_tyramine',
    domain: 'nutrition',
    relevantConditions: [],
    pattern: /(maoi|monoamine oxidase).*(aged|fermented|cured|smoked|pickled)/i,
    severity: 'critical',
    message: 'MAOIs require strict avoidance of tyramine-rich foods to prevent hypertensive crisis.',
    action: 'flag',
    userExplanation: 'Aged cheeses, cured meats, fermented foods, and certain alcoholic beverages contain tyramine which can trigger severe hypertension when combined with MAOIs.',
    safeAlternative: 'Fresh, unprocessed proteins and dairy; avoid aged/cured/fermented items entirely while on MAOI therapy.',
  },
  {
    id: 'warfarin_vitamin_k',
    domain: 'nutrition',
    relevantConditions: [],
    pattern: /(warfarin|coumadin).*(kale|spinach|collard|turnip.green|brussel|broccoli|vitamin.k)/i,
    severity: 'high',
    message: 'Warfarin requires consistent vitamin K intake — sudden increases in leafy greens can alter INR.',
    action: 'flag',
    userExplanation: 'Vitamin K antagonizes warfarin. Consistency is key: maintain steady intake of leafy greens rather than eliminating them.',
    safeAlternative: 'Continue eating leafy greens but keep portion sizes consistent day-to-day. Monitor INR as directed by your physician.',
  },
  {
    id: 'pregnancy_exercise_supine',
    domain: 'exercise',
    relevantConditions: ['pregnant', 'pregnancy'],
    pattern: /(bench\s*press|flat\s*bench|supine|lying\s*flat|back\s*exercise).*(pregnant|pregnancy|trimester)/i,
    severity: 'high',
    message: 'Supine (lying flat) exercise is contraindicated after the first trimester due to vena cava compression.',
    action: 'flag',
    userExplanation: 'After week 13, lying flat on your back can compress the vena cava, reducing blood flow to the fetus. Use incline positions (15-30°) instead.',
    safeAlternative: 'Perform pressing movements on an incline bench (15-30°) or seated. Use seated or standing variations for other exercises.',
  },
  {
    id: 'pregnancy_heavy_lifting',
    domain: 'exercise',
    relevantConditions: ['pregnant', 'pregnancy'],
    pattern: /(1\s*rep\s*max|1rm|max\s*effort|to\s*failure|heavy\s*deadlift|heavy\s*squat).*(pregnant|pregnancy)/i,
    severity: 'high',
    message: 'Maximal or near-maximal lifting is not recommended during pregnancy.',
    action: 'flag',
    userExplanation: 'Heavy Valsalva and maximal loads increase intra-abdominal pressure and risk of injury. Maintain moderate intensity at RPE 5-7/10.',
    safeAlternative: 'Train at RPE 5-7/10 with higher reps (10-15) and focus on controlled tempo rather than heavy loads.',
  },
  {
    id: 'pregnancy_valsalva',
    domain: 'exercise',
    relevantConditions: ['pregnant', 'pregnancy'],
    pattern: /hold\s*(your\s*)?breath.*(pregnant|pregnancy|trimester)/i,
    severity: 'high',
    message: 'The Valsalva maneuver (holding breath during lifting) should be avoided during pregnancy.',
    action: 'flag',
    userExplanation: 'Holding your breath increases intra-abdominal and blood pressure, which is not recommended during pregnancy. Always exhale on exertion.',
    safeAlternative: 'Use rhythmic breathing: inhale during eccentric, exhale during concentric phase (the "hiss" technique).',
  },
  {
    id: 'pregnancy_high_impact',
    domain: 'exercise',
    relevantConditions: ['pregnant', 'pregnancy'],
    pattern: /(running|jumping|plyometric|box\s*jump|sprint).*(pregnant|pregnancy|trimester)/i,
    severity: 'medium',
    message: 'High-impact exercise may need modification during pregnancy, especially in later trimesters.',
    action: 'flag',
    safeAlternative: 'Switch to low-impact alternatives: walking, swimming, stationary cycling, or elliptical training.',
  },
  {
    id: 'pregnancy_caloric_deficit',
    domain: 'nutrition',
    relevantConditions: ['pregnant', 'pregnancy'],
    pattern: /(calorie\s*deficit|diet|weight\s*loss|fat\s*loss|cut).*(pregnant|pregnancy)/i,
    severity: 'critical',
    message: 'Caloric restriction and weight loss are not recommended during pregnancy.',
    action: 'block',
    userExplanation: 'Adequate nutrition is essential for fetal development. Weight loss during pregnancy is not recommended — focus on nutrient-dense foods at maintenance or slight surplus calories.',
    safeAlternative: 'Maintain a nutrient-dense diet at or slightly above maintenance calories. Postpartum weight loss can be addressed after delivery with medical guidance.',
  },
  {
    id: 'pregnancy_caffeine_limit',
    domain: 'nutrition',
    relevantConditions: ['pregnant', 'pregnancy'],
    pattern: /(caffeine|coffee|energy\s*drink|pre.workout).*(200|300|400).*(mg|milligram).*(pregnant|pregnancy)/i,
    severity: 'medium',
    message: 'Caffeine intake during pregnancy should be limited to under 200mg per day.',
    action: 'flag',
    userExplanation: 'The American College of Obstetricians recommends limiting caffeine to under 200mg/day during pregnancy.',
    safeAlternative: 'Opt for decaf coffee, herbal teas (consult your provider), or caffeine-free pre-workout options.',
  },
  {
    id: 'pregnancy_listeria_foods',
    domain: 'nutrition',
    relevantConditions: ['pregnant', 'pregnancy'],
    pattern: /(raw\s*fish|sushi|unpasteurized|soft\s*cheese|deli\s*meat|raw\s*egg).*(pregnant|pregnancy)/i,
    severity: 'high',
    message: 'Certain foods with listeria risk should be avoided during pregnancy.',
    action: 'flag',
    userExplanation: 'Pregnant women are 10x more susceptible to listeriosis. Avoid unpasteurized dairy, raw/undercooked meats, raw fish, and deli meats unless heated to steaming.',
    safeAlternative: 'Choose pasteurized dairy, fully cooked proteins, and thoroughly washed produce. Heat deli meats until steaming.',
  },
  {
    id: 'postpartum_gradual_return',
    domain: 'exercise',
    relevantConditions: ['postpartum', 'post.partum', 'after\s*birth', 'postnatal'],
    pattern: /(postpartum|post.partum|after\s*birth).*(hiit|sprint|heavy|max|intense|full\s*effort)/i,
    severity: 'high',
    message: 'Return to exercise after childbirth should be gradual and guided by medical clearance.',
    action: 'flag',
    userExplanation: 'The pelvic floor and abdominal wall need time to heal after childbirth. Jumping back into high-intensity exercise too soon can worsen pelvic floor dysfunction and diastasis recti.',
    safeAlternative: 'Start with pelvic floor rehabilitation, deep core activation, and gentle walking. Progress to resistance training at 6-8 weeks (vaginal) or 10-12 weeks (C-section) after medical clearance.',
  },
  {
    id: 'postpartum_diastasis_recti',
    domain: 'exercise',
    relevantConditions: ['postpartum', 'post.partum', 'diastasis', 'postnatal'],
    pattern: /(crunch|sit.up|curl.up|toe.touch|leg.raise|hundred).*(postpartum|diastasis|post.partum)/i,
    severity: 'high',
    message: 'Traditional ab exercises can worsen diastasis recti (abdominal separation) postpartum.',
    action: 'flag',
    userExplanation: 'Crunches and sit-ups increase intra-abdominal pressure and can worsen abdominal separation. Diastasis rehabilitation requires deep core engagement and avoiding spinal flexion under load.',
    safeAlternative: 'Perform deep core activation (transverse abdominis breathing), pelvic tilts, and modified planks. Avoid spinal flexion exercises until the diastasis is healed.',
  },
  {
    id: 'ignore_doctor',
    domain: 'medical',
    relevantConditions: [],
    pattern: /ignore\s*(your|the)\s*doctor/i,
    severity: 'critical',
    message: 'Pulse AI must never encourage ignoring medical advice.',
    action: 'block',
    userExplanation: 'I cannot recommend ignoring your healthcare provider. Please discuss any concerns with your doctor.',
  },
  {
    id: 'stop_medication',
    domain: 'medical',
    relevantConditions: [],
    pattern: /stop\s*(taking|your)\s*medication/i,
    severity: 'critical',
    message: 'Pulse AI must never recommend stopping prescribed medication.',
    action: 'block',
    userExplanation: 'I cannot recommend stopping prescribed medication. Please consult your prescribing physician before making any changes.',
  },

  // ─── HIGH: Dangerous diet advice ───
  {
    id: 'extreme_fasting',
    domain: 'nutrition',
    relevantConditions: [],
    pattern: /fasting\s*(for|over|more\s*than)\s*(24|48|72)\s*hours/i,
    severity: 'high',
    message: 'Extended fasting can be dangerous, especially with health conditions.',
    action: 'flag',
    userExplanation: 'Extended fasts beyond 24 hours should only be done under medical supervision, especially with your health profile.',
    safeAlternative: 'Consider a 12-16 hour overnight fast or consult your doctor about longer protocols.',
  },
  {
    id: 'very_low_calorie',
    domain: 'nutrition',
    relevantConditions: [],
    pattern: /eat\s*(less\s*than|under|below)\s*800\s*calories/i,
    severity: 'high',
    message: 'Very low calorie diets should only be done under medical supervision.',
    action: 'flag',
    userExplanation: 'Diets under 800 calories require medical supervision. Let me help you find a safer, sustainable approach.',
    safeAlternative: 'A modest deficit of 300-500 calories below maintenance is effective and sustainable.',
  },
  {
    id: 'water_only_fasting',
    domain: 'nutrition',
    relevantConditions: [],
    pattern: /drink\s*(only|just)\s*water\s*(for|over|more\s*than)/i,
    severity: 'high',
    message: 'Water-only fasting is not recommended without medical supervision.',
    action: 'flag',
  },

  // ─── HIGH: Dangerous exercise advice ───
  {
    id: 'train_through_pain',
    domain: 'exercise',
    relevantConditions: [],
    pattern: /lift\s*(despite|through|with)\s*.*(pain|injury)/i,
    severity: 'high',
    message: 'Exercising through pain or injury can cause further damage.',
    action: 'flag',
    userExplanation: 'Training through pain can worsen injuries. Let me suggest modifications that work around your discomfort.',
    safeAlternative: 'Try reducing load, range of motion, or switching to a different movement pattern.',
  },
  {
    id: 'max_effort_daily',
    domain: 'exercise',
    relevantConditions: [],
    pattern: /max\s*(weight|effort|intensity)\s*(every|each|daily)/i,
    severity: 'medium',
    message: 'Max effort every day leads to overtraining and injury.',
    action: 'flag',
    safeAlternative: 'Periodize your training: heavy days, light days, and deload weeks for optimal progress.',
  },

  // ─── CKD-Specific Rules ───
  {
    id: 'ckd_high_protein',
    domain: 'nutrition',
    relevantConditions: ['ckd', 'chronic kidney disease', 'chronic kidney'],
    pattern: /protein\s*(intake|target|goal|diet)\s*(of|>|above|over|>)\s*0\.8\s*g\/kg/i,
    severity: 'high',
    message: 'High protein intake (>0.8 g/kg) may be contraindicated for kidney conditions.',
    action: 'flag',
    userExplanation: 'For CKD management, protein intake is typically limited to 0.55-0.8 g/kg bodyweight. I recommend confirming specific targets with your nephrologist.',
    safeAlternative: 'For non-dialysis CKD, aim for 0.6-0.8 g/kg of primarily plant-based protein sources.',
  },
  {
    id: 'ckd_creatine',
    domain: 'supplement',
    relevantConditions: ['ckd', 'chronic kidney disease', 'chronic kidney'],
    pattern: /creatine/i,
    severity: 'high',
    message: 'Creatine supplementation is contraindicated for CKD without medical approval.',
    action: 'flag',
    userExplanation: 'Creatine is typically not recommended for CKD as it increases the kidneys\' workload. Please consult your nephrologist.',
  },
  {
    id: 'ckd_high_intensity',
    domain: 'exercise',
    relevantConditions: ['ckd', 'chronic kidney disease', 'chronic kidney'],
    pattern: /(fst-7|heavy\s*duty|hit|high.intensity|max\s*effort|to\s*failure).*(ckd|kidney)/i,
    severity: 'high',
    message: 'High-intensity training to failure is not appropriate for CKD.',
    action: 'flag',
    userExplanation: 'High-intensity training places extreme physiological stress that can be problematic with CKD. Let me design a safer program.',
    safeAlternative: 'Moderate resistance training (RPE 5-7/10) with adequate rest intervals is safe and beneficial.',
  },
  {
    id: 'ckd_high_sodium',
    domain: 'nutrition',
    relevantConditions: ['ckd', 'chronic kidney disease', 'chronic kidney'],
    pattern: /sodium\s*(intake|target)\s*(of|>|above|over)\s*2000/i,
    severity: 'medium',
    message: 'High sodium intake is contraindicated for CKD.',
    action: 'flag',
  },
  {
    id: 'ckd_high_potassium',
    domain: 'nutrition',
    relevantConditions: ['ckd', 'chronic kidney disease', 'chronic kidney'],
    pattern: /(banana|potato|spinach|avocado|orange|tomato)\s*(daily|every\s*day|multiple)/i,
    severity: 'low',
    message: 'Potassium-rich foods may need moderation in CKD. Confirm with your nephrologist.',
    action: 'flag',
  },

  // ─── Lupus-Specific Rules ───
  {
    id: 'lupus_high_intensity_flare',
    domain: 'exercise',
    relevantConditions: ['lupus', 'sle', 'systemic lupus'],
    pattern: /(hiit|high.intensity|sprint|burpee|box\s*jump|heavy\s*compound)/i,
    severity: 'high',
    message: 'High-intensity exercise is not appropriate during lupus flares.',
    action: 'flag',
    userExplanation: 'During a lupus flare, high-impact or high-intensity exercise can exacerbate symptoms. Let me suggest gentle alternatives.',
    safeAlternative: 'Low-impact activities like walking, swimming, gentle yoga, or light resistance work are appropriate during flares.',
  },
  {
    id: 'lupus_train_through_joint_pain',
    domain: 'exercise',
    relevantConditions: ['lupus', 'sle', 'systemic lupus'],
    pattern: /train\s*(through|despite).*(joint\s*pain|swelling|inflammation)/i,
    severity: 'high',
    message: 'Never train through joint pain or swelling with lupus — this can trigger a flare.',
    action: 'flag',
  },
  {
    id: 'lupus_excessive_volume',
    domain: 'exercise',
    relevantConditions: ['lupus', 'sle', 'systemic lupus'],
    pattern: /(5|6|7)\s*(days?\s*per\s*week|sessions?\s*weekly)/i,
    severity: 'medium',
    message: 'Excessive training frequency (>4 days/week) may increase fatigue in lupus.',
    action: 'flag',
    safeAlternative: '3-4 well-structured sessions per week with adequate recovery is optimal for lupus management.',
  },
  {
    id: 'lupus_pro_inflammatory_foods',
    domain: 'nutrition',
    relevantConditions: ['lupus', 'sle', 'systemic lupus'],
    pattern: /(processed\s*meat|sugar|fried.*food|trans\s*fat|soda)\s*(daily|every\s*day|regularly)/i,
    severity: 'low',
    message: 'Pro-inflammatory foods may exacerbate lupus symptoms.',
    action: 'flag',
    safeAlternative: 'An anti-inflammatory dietary pattern rich in omega-3s, leafy greens, and berries may help manage symptoms.',
  },

  // ─── Hypertension-Specific Rules ───
  {
    id: 'htn_valsalva',
    domain: 'exercise',
    relevantConditions: ['hypertension', 'high blood pressure'],
    pattern: /hold\s*(your\s*)?breath/i,
    severity: 'high',
    message: 'Valsalva maneuver (holding breath during lifting) spikes blood pressure dangerously.',
    action: 'flag',
    userExplanation: 'Holding your breath during lifting (Valsalva) can cause dangerous blood pressure spikes. Always exhale on exertion.',
    safeAlternative: 'Use the "hiss" technique: exhale through pursed lips during the concentric phase.',
  },
  {
    id: 'htn_heavy_isometric',
    domain: 'exercise',
    relevantConditions: ['hypertension', 'high blood pressure'],
    pattern: /(wall\s*sit|plank|isometric|static\s*hold)\s*(over|more\s*than|for)\s*(60|90|120)\s*seconds/i,
    severity: 'medium',
    message: 'Prolonged isometric holds can spike blood pressure.',
    action: 'flag',
    safeAlternative: 'Keep isometric holds under 30 seconds or use dynamic exercises instead.',
  },
  {
    id: 'htn_max_effort',
    domain: 'exercise',
    relevantConditions: ['hypertension', 'high blood pressure'],
    pattern: /(1\s*rep\s*max|1rm|max\s*effort|to\s*failure)/i,
    severity: 'high',
    message: 'Max effort lifting is not safe for uncontrolled hypertension.',
    action: 'flag',
    safeAlternative: 'Keep RPE at 5-7/10 and use reps in reserve (RIR 3-4) to avoid dangerous blood pressure spikes.',
  },

  // ─── Diabetes-Specific Rules ───
  {
    id: 'diabetes_fasted_cardio',
    domain: 'exercise',
    relevantConditions: ['diabetes', 'type 1 diabetes', 'type 2 diabetes'],
    pattern: /fasted\s*(cardio|training|workout|exercise)/i,
    severity: 'medium',
    message: 'Fasted exercise can cause hypoglycemia in diabetes.',
    action: 'flag',
    userExplanation: 'Exercising without fuel can cause dangerous blood sugar drops. Have a small pre-workout snack.',
    safeAlternative: 'A pre-workout snack with 15-30g carbs if blood sugar is below 130 mg/dL.',
  },
  {
    id: 'diabetes_skip_meals',
    domain: 'nutrition',
    relevantConditions: ['diabetes', 'type 1 diabetes', 'type 2 diabetes'],
    pattern: /(skip|avoid|don'?t\s*eat)\s*(breakfast|meals?|carbs)/i,
    severity: 'medium',
    message: 'Skipping meals can cause dangerous blood sugar fluctuations in diabetes.',
    action: 'flag',
  },
  {
    id: 'diabetes_high_sugar',
    domain: 'nutrition',
    relevantConditions: ['diabetes', 'type 1 diabetes', 'type 2 diabetes'],
    pattern: /(sugar|candy|soda|juice)\s*(daily|every\s*day|liberally)/i,
    severity: 'low',
    message: 'High sugar intake is problematic for diabetes management.',
    action: 'flag',
  },
];

export const SAFETY_THRESHOLDS: SafetyThreshold[] = [
  {
    id: 'calorie_below_bmr',
    domain: 'nutrition',
    relevantConditions: [],
    metric: 'calories_vs_bmr',
    unit: 'kcal',
    severity: 'high',
    message: 'Calorie intake below BMR for extended periods can cause metabolic adaptation and health risks.',
    action: 'flag',
  },
  {
    id: 'weekly_volume_excess',
    domain: 'exercise',
    relevantConditions: [],
    metric: 'weekly_sets_per_muscle',
    max: 20,
    unit: 'sets',
    severity: 'medium',
    message: 'Exceeding 20 working sets per muscle group per week increases injury risk without additional benefit.',
    action: 'flag',
  },
  {
    id: 'ckd_protein_limit',
    domain: 'nutrition',
    relevantConditions: ['ckd', 'chronic kidney disease'],
    metric: 'protein_g_per_kg',
    max: 0.8,
    unit: 'g/kg',
    severity: 'high',
    message: 'Protein intake above 0.8 g/kg/day is not recommended for non-dialysis CKD.',
    action: 'flag',
  },
  {
    id: 'ckd_protein_min',
    domain: 'nutrition',
    relevantConditions: ['ckd', 'chronic kidney disease'],
    metric: 'protein_g_per_kg',
    min: 0.55,
    unit: 'g/kg',
    severity: 'medium',
    message: 'Protein intake below 0.55 g/kg/day may lead to muscle wasting in CKD.',
    action: 'flag',
  },
];

export const PREGNANCY_SAFETY_THRESHOLDS: SafetyThreshold[] = [
  {
    id: 'pregnancy_caffeine_max',
    domain: 'nutrition',
    relevantConditions: ['pregnant', 'pregnancy'],
    metric: 'caffeine_mg_per_day',
    max: 200,
    unit: 'mg',
    severity: 'high',
    message: 'Caffeine intake should not exceed 200 mg/day during pregnancy.',
    action: 'flag',
  },
  {
    id: 'pregnancy_calorie_min',
    domain: 'nutrition',
    relevantConditions: ['pregnant', 'pregnancy'],
    metric: 'calories_vs_bmr',
    min: 1800,
    unit: 'kcal',
    severity: 'critical',
    message: 'Caloric intake below 1800 kcal/day is not recommended during pregnancy without medical supervision.',
    action: 'block',
  },
];

export const CONTRAINDICATED_FOODS: ContraindicatedFood[] = [
  {
    id: 'ckd_high_potassium_foods',
    food: 'high-potassium foods',
    relevantConditions: ['ckd', 'chronic kidney disease'],
    reason: 'Potassium accumulation can cause cardiac arrhythmias in advanced CKD.',
    severity: 'high',
    safeAlternative: 'Lower-potassium choices: apples, berries, cabbage, cauliflower, cucumber, grapes, green beans.',
  },
  {
    id: 'ckd_high_phosphorus_foods',
    food: 'high-phosphorus foods (dairy, nuts, cola)',
    relevantConditions: ['ckd', 'chronic kidney disease'],
    reason: 'Phosphorus accumulation accelerates kidney disease progression.',
    severity: 'high',
    safeAlternative: 'Fresh vegetables, rice milk, clear sodas, and limit processed foods with phosphate additives.',
  },
  {
    id: 'lupus_alfalfa',
    food: 'alfalfa sprouts',
    relevantConditions: ['lupus', 'sle'],
    reason: 'Alfalfa sprouts contain L-canavanine which can stimulate immune activity and trigger flares.',
    severity: 'medium',
    safeAlternative: 'Other sprouts like broccoli or bean sprouts are generally safe.',
  },
  {
    id: 'grapefruit_medications',
    food: 'grapefruit and grapefruit juice',
    relevantConditions: [],
    reason: 'Grapefruit inhibits CYP3A4 enzymes, increasing blood levels of statins, CCBs, and some SSRIs by up to 3x.',
    severity: 'high',
    safeAlternative: 'Oranges, tangerines, and other citrus fruits that do not affect CYP3A4.',
  },
  {
    id: 'maoi_tyramine_foods',
    food: 'tyramine-rich foods (aged cheese, cured meats, fermented foods, soy sauce, tap beer)',
    relevantConditions: [],
    reason: 'Tyramine can trigger hypertensive crisis in patients taking MAOIs.',
    severity: 'high',
    safeAlternative: 'Fresh cheese (cottage, cream cheese), fresh meats, non-fermented plant proteins.',
  },
  {
    id: 'pregnancy_high_mercury_fish',
    food: 'high-mercury fish (shark, swordfish, king mackerel, tilefish)',
    relevantConditions: ['pregnant', 'pregnancy'],
    reason: 'Methylmercury can damage fetal nervous system development.',
    severity: 'high',
    safeAlternative: 'Low-mercury options: salmon, sardines, trout, shrimp, canned light tuna (limit to 12 oz/week).',
  },
  {
    id: 'pregnancy_unpasteurized',
    food: 'unpasteurized dairy and soft cheeses (brie, camembert, feta, blue cheese)',
    relevantConditions: ['pregnant', 'pregnancy'],
    reason: 'Risk of listeriosis, which can cause miscarriage, stillbirth, or severe fetal infection.',
    severity: 'high',
    safeAlternative: 'Pasteurized dairy products, hard cheeses, and processed cheese spreads.',
  },
  {
    id: 'pregnancy_raw_fish',
    food: 'raw or undercooked fish and shellfish (sushi, sashimi, ceviche, oysters)',
    relevantConditions: ['pregnant', 'pregnancy'],
    reason: 'Risk of foodborne illness including listeria, toxoplasma, and salmonella.',
    severity: 'high',
    safeAlternative: 'Fully cooked seafood, canned fish, or cooked sushi rolls (e.g., tempura).',
  },
];

export function getRulesForConditions(conditions: string[]): SafetyRule[] {
  const lower = conditions.map(c => c.toLowerCase());
  return SAFETY_RULES.filter(rule =>
    rule.relevantConditions.length === 0 ||
    rule.relevantConditions.some(rc => lower.some(lc => lc.includes(rc)))
  );
}

export function getThresholdsForConditions(conditions: string[]): SafetyThreshold[] {
  const lower = conditions.map(c => c.toLowerCase());
  return SAFETY_THRESHOLDS.filter(t =>
    t.relevantConditions.length === 0 ||
    t.relevantConditions.some(rc => lower.some(lc => lc.includes(rc)))
  );
}
