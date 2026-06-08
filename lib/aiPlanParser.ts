import type { ActivePlan, WorkoutDay, WorkoutExercise } from '@/store/aiTrainerStore';

const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = DAY_NAMES.map(d => d.slice(0, 3));
const DAY_ABBR: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

function extractMatch(pattern: RegExp, text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  let m: RegExpExecArray | null = null;
  try {
    m = pattern.exec(text);
  } catch {
    return null;
  }
  if (!m) return null;
  const captured = m[1] !== undefined ? m[1] : m[0];
  if (captured == null) return null;
  return String(captured).trim();
}

function extractNumber(pattern: RegExp, text: string): number | null {
  const m = pattern.exec(text);
  return m ? parseInt(m[1], 10) : null;
}

function extractGoal(text: string): string {
  return extractMatch(/(?:goal|aim(?:ing)?\s*(?:is|for|to)?)\s*[:\*]?\s*(?:a\s+)?(?:body\s+)?(?:recomposition|recomp|cut(?:ting)?|bulk(?:ing|er)?|build|maintain|lean\s*(?:gain|build)|fat\s*loss|muscle\s*gain|hypertrophy|strength|endurance)/i, text)
    || (text.toLowerCase().includes('hypertrophy') ? 'Build' : '')
    || (text.toLowerCase().includes('cut') ? 'Cut' : '')
    || (text.toLowerCase().includes('bulk') || text.toLowerCase().includes('build') ? 'Build' : '')
    || (text.toLowerCase().includes('maintain') ? 'Maintain' : '')
    || 'General';
}

function extractSplitType(text: string): string {
  if (text.toLowerCase().includes('upper/lower')) return 'Upper / Lower';
  if (text.toLowerCase().includes('push/pull/legs') || text.toLowerCase().includes('ppl')) return 'Push / Pull / Legs';
  if (text.toLowerCase().includes('full body')) return 'Full Body';
  if (text.toLowerCase().includes('bro split') || text.toLowerCase().includes('bodybuilding')) return 'Bro Split';

  return extractMatch(/(?:split|routine|program|schedule)[:\*]?\s*(.+?)(?:\.|\n|with|and|focus|\*\*)/i, text)
    || (text.toLowerCase().includes('upper') && text.toLowerCase().includes('lower') ? 'Upper / Lower' : '')
    || 'Custom';
}

function extractCalories(text: string): number {
  return extractNumber(/(\d{3,4})\s*(?:kcal|calories|cal)\b/i, text)
    || extractNumber(/calories?[:\s*\*]*(\d{3,4})/i, text)
    || 1800;
}

function extractProtein(text: string): number {
  return extractNumber(/(\d{2,3})\s*g\s*(?:protein|prot)/i, text)
    || extractNumber(/protein[:\s*\*]*(\d{2,3})\s*g/i, text)
    || 150;
}

function extractCarbs(text: string): number {
  return extractNumber(/(\d{2,3})\s*g\s*(?:carbs|carbohydrate)/i, text)
    || extractNumber(/carbs?[:\s*\*]*(\d{2,3})\s*g/i, text)
    || 200;
}

function extractFat(text: string): number {
  return extractNumber(/(\d{2,3})\s*g\s*(?:fat)\b/i, text)
    || extractNumber(/fat[:\s*\*]*(\d{2,3})\s*g/i, text)
    || 60;
}

function extractCardioStrategy(text: string): string {
  const m = extractMatch(/(?:cardio|conditioning)[:\*]?\s*[\s\S]{0,60}?(?:moderate|low\s*intensity|LISS|HIIT|steady\s*state|walk|cycling|swim|bike)/i, text);
  if (!m) return 'Moderate cardio';
  return m.replace(/cardio[:\*]?\s*/i, '').replace(/[*_]/g, '').trim().slice(0, 60) || 'Moderate cardio';
}

function extractRecoveryStrategy(text: string): string {
  const m = extractMatch(/(?:recovery|deload|rest)[:\*]?\s*[\s\S]{0,80}?(?:focus|priority|emphasis|strategy|sleep|mobility|active|prioritize|hydrate|7-9)/i, text);
  if (!m) return 'Sleep & mobility focus';
  return m.replace(/recovery[:\*]?\s*/i, '').replace(/[*_]/g, '').trim().slice(0, 80) || 'Sleep & mobility focus';
}

function extractProgressionStrategy(text: string): string {
  const m = extractMatch(/(?:progression|progress|overload|double\s*progression)[:\*]?\s*[\s\S]{0,80}?(?:linear|double|RIR|RPE|sets?\s*across|weight|reps|form)/i, text);
  if (!m) return 'Double progression (reps first, then weight)';
  return m.replace(/progression[:\*]?\s*/i, '').replace(/[*_]/g, '').trim().slice(0, 80) || 'Double progression (reps first, then weight)';
}

function extractExerciseLines(text: string): { day: string; focus: string; exercises: WorkoutExercise[] }[] {
  const results: { day: string; focus: string; exercises: WorkoutExercise[] }[] = [];
  const shortLookahead = DAY_SHORT.join('|');

  for (const dayName of DAY_NAMES) {
    const dayPattern = new RegExp(
      `(?:${dayName.slice(0, 3)}|${dayName})\\s*[:\\-–—]\\s*([^]*?)(?=(?:${shortLookahead}|\\n\\n|$))`,
      'gi'
    );
    let match;
    while ((match = dayPattern.exec(text)) !== null) {
      const block = match[1].trim();
      const lines = block.split('\n');
      let focus = '';
      const exercises: WorkoutExercise[] = [];
      for (const line of lines) {
        const trimmed = line.replace(/^[-–—*•\s]+/, '').replace(/\*\*/g, '').trim();
        if (!trimmed) continue;
        const exMatch = trimmed.match(/^(.+?)\s*[:\-–]?\s*(?:(\d+)\s*[×xX*]\s*(\d+(?:[–-]\d+)?)(?:\s*@\s*(\d+)(?:\s*RIR)?)?)/);
        if (exMatch) {
          exercises.push({
            name: exMatch[1].trim(),
            sets: parseInt(exMatch[2], 10),
            reps: exMatch[3],
            rir: exMatch[4] ? parseInt(exMatch[4], 10) : undefined,
          });
        } else if (!focus) {
          focus = trimmed.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
      if (exercises.length > 0) {
        results.push({
          day: DAY_ABBR[dayName] || dayName.slice(0, 3),
          focus: focus || 'Training',
          exercises,
        });
      }
    }
  }

  return results;
}

function inferDefaultFocus(splitType: string, ref: string, allRefs: string[]): string {
  const st = (splitType || '').toLowerCase();
  const trainingRefs = allRefs.filter(r => r !== 'sat' && r !== 'sun');

  if (st.includes('upper / lower') || st.includes('upper/lower')) {
    const trainingIndex = trainingRefs.indexOf(ref);
    return trainingIndex % 2 === 0 ? 'Upper' : 'Lower';
  }
  if (st.includes('push / pull / legs') || st.includes('ppl')) {
    const trainingIndex = trainingRefs.indexOf(ref);
    if (trainingIndex === 0) return 'Push';
    if (trainingIndex === 1) return 'Pull';
    if (trainingIndex === 2) return 'Legs';
    return 'Push';
  }
  if (st.includes('bro split') || st.includes('bodybuilding')) {
    const cycle = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms'];
    const trainingIndex = trainingRefs.indexOf(ref);
    return cycle[trainingIndex % cycle.length] || 'Training';
  }
  if (st.includes('full body')) return 'Full Body';

  return ref === 'mon' ? 'Push' : ref === 'tue' ? 'Pull' : ref === 'thu' ? 'Upper' : ref === 'fri' ? 'Lower' : 'Training';
}

function extractWorkoutDays(text: string, splitType: string = ''): WorkoutDay[] {
  const days: WorkoutDay[] = [];
  const dayRefs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const restDays = new Set<string>();
  const restPattern = /\b(sun|sunday|sat|saturday|wed|wednesday|fri|friday|mon|monday|tue|tuesday|thu|thursday)\b[\s:–—\-]*(?:.*?)\b(rest|off|recovery)\b/gi;
  let restMatch;
  while ((restMatch = restPattern.exec(text)) !== null) {
    const dayName = restMatch[1].toLowerCase();
    for (const ref of dayRefs) {
      if (dayName.startsWith(ref)) restDays.add(ref);
    }
  }

  const extracted = extractExerciseLines(text);
  const extractedDayNames = new Set(extracted.map(e => e.day.toLowerCase().slice(0, 3)));

  const usedNames = new Set<string>();
  for (const ref of dayRefs) {
    const match = extracted.find(e => e.day.toLowerCase().startsWith(ref));
    if (match && !usedNames.has(match.day)) {
      usedNames.add(match.day);
      const isRest = restDays.has(ref);
      const focus = isRest
        ? 'Rest'
        : (match.focus && match.focus !== 'Training' ? match.focus : inferDefaultFocus(splitType, ref, dayRefs));
      days.push({
        dayName: match.day,
        focus,
        isRest,
        exercises: isRest ? [] : match.exercises,
        aiNote: isRest ? 'Recovery day — focus on sleep and nutrition' : undefined,
      });
    } else if (!extractedDayNames.has(ref) && days.length < 7) {
      const isRest = restDays.has(ref);
      const focus = isRest ? 'Rest' : inferDefaultFocus(splitType, ref, dayRefs);
      days.push({
        dayName: DAY_ABBR[ref] || ref.charAt(0).toUpperCase() + ref.slice(1),
        focus,
        isRest,
        exercises: [],
        aiNote: isRest ? 'Recovery day' : undefined,
      });
    }
  }

  return days;
}

function detectPlanMention(text: string): boolean {
  const keywords = [
    /(?:here['']s|here is|i['']d\s*suggest|i\s*recommend|let['']s\s*start|we['']ll\s*run|i\s*think|my\s*suggestion|proposed)\s*(?:your|a|the)?\s*(?:plan|split|program|routine|schedule)/i,
    /upper\s*\/\s*lower|push\s*\/\s*pull\s*\/\s*legs|full\s*body/i,
    /(?:day\s*1|day\s*2|day\s*3|day\s*4|day\s*5|day\s*6).*?(?:sets?\s*(?:of\s*)?\d|reps?\s*(?:of\s*)?\d)/i,
    /workout\s*(?:a|b|split|routine).*?(?:sets?|reps?)/i,
  ];
  return keywords.some(k => k.test(text));
}

function inferMaxDuration(goal: string, text: string): number {
  if (/12\s*week/i.test(text)) return 12;
  if (/8\s*week/i.test(text)) return 8;
  if (/16\s*week/i.test(text)) return 16;
  if (goal.toLowerCase() === 'cut') return 12;
  if (goal.toLowerCase() === 'build') return 12;
  return 8;
}

export function parsePlanFromResponse(responseText: string, userId: string): ActivePlan | null {
  try {
    if (!responseText || typeof responseText !== 'string') return null;
    if (!detectPlanMention(responseText)) return null;

    const goal = extractGoal(responseText);
    const splitType = extractSplitType(responseText);
    const cardioCal = extractCalories(responseText);

    const plan: ActivePlan = {
      id: `plan_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: userId || 'unknown',
      version: 1,
      weekNumber: 1,
      phase: 'plan_active',
      calorieTarget: cardioCal,
      proteinTarget: extractProtein(responseText),
      carbTarget: extractCarbs(responseText),
      fatTarget: extractFat(responseText),
      sodiumLimit: 2300,
      weeklyVolumeTarget: 0,
      conditionAdaptations: [],
      trainingSplitSummary: `${goal} · ${splitType}`,
      aiSummary: responseText.slice(0, 300).replace(/\n+/g, ' ').trim(),
      createdAt: new Date().toISOString(),
      appliedAt: null,
      safetyValidated: true,
      safetyNotes: [],
      workoutDays: extractWorkoutDays(responseText, splitType),
      goal,
      splitType,
      cardioStrategy: extractCardioStrategy(responseText),
      recoveryStrategy: extractRecoveryStrategy(responseText),
      progressionStrategy: extractProgressionStrategy(responseText),
      currentWeek: 1,
      maxDurationWeeks: inferMaxDuration(goal, responseText),
    };

    return plan;
  } catch (e) {
    console.warn('parsePlanFromResponse failed:', e);
    return null;
  }
}
