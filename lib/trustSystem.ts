export interface ConsistencyCheckResult {
  consistent: boolean;
  contradictions: Contradiction[];
  overallScore: number;
  uncertainty: number;
}

export interface Contradiction {
  type: 'direct' | 'semantic' | 'numerical' | 'temporal';
  statementA: string;
  statementB: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface UncertaintyPropagation {
  baseConfidence: number;
  dataQualityPenalty: number;
  sampleSizePenalty: number;
  recencyPenalty: number;
  finalConfidence: number;
  sources: string[];
}

const CONTRADICTION_PAIRS: [RegExp, RegExp, string][] = [
  [/rest\s*(is\s*)?important|take\s*a\s*break/i, /push\s*through|no\s*pain\s*no\s*gain/i, 'rest_vs_push'],
  [/eat\s*(less|fewer)|reduce\s*calories|deficit/i, /eat\s*more|surplus|bulk/i, 'deficit_vs_surplus'],
  [/protein\s*(over|above|high)/i, /protein\s*(under|below|low|limit)/i, 'protein_conflict'],
  [/cardio\s*(every|daily)/i, /cardio\s*(skip|avoid|limit)/i, 'cardio_conflict'],
  [/train\s*(hard|heavy|intense)/i, /rest\s*(day|week|period)|deload/i, 'train_vs_deload'],
];

const CONTRADICTION_THRESHOLD = 0.6;

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

function extractNumericalClaims(text: string): { value: number; unit: string; phrase: string }[] {
  const claims: { value: number; unit: string; phrase: string }[] = [];
  const patterns = [
    /(\d+[.,]?\d*)\s*(kg|km|min|hour|day|week|kcal|g|mg|ml|reps?|sets?|sessions?)/gi,
    /(\d+[.,]?\d*)\s*percent/gi,
    /(?:weight|volume|intensity|rpe)\s*(?:of|at|:)?\s*(\d+[.,]?\d*)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(value)) {
        claims.push({ value, unit: match[2] || 'generic', phrase: match[0] });
      }
    }
  }
  return claims;
}

export function checkConsistency(statementA: string, statementB: string): ConsistencyCheckResult {
  const contradictions: Contradiction[] = [];
  let score = 100;

  // Direct contradiction pairs
  for (const [patternA, patternB, type] of CONTRADICTION_PAIRS) {
    const matchesA = patternA.test(statementA);
    const matchesB = patternB.test(statementB);
    if (matchesA && matchesB) {
      const overlap = wordOverlap(statementA, statementB);
      if (overlap > 0.1) {
        contradictions.push({
          type: 'direct',
          statementA: statementA.substring(0, 100),
          statementB: statementB.substring(0, 100),
          severity: 'high',
          confidence: Math.min(1, overlap * 1.5),
        });
        score -= 40;
      }
    }
  }

  // Numerical inconsistency
  const numsA = extractNumericalClaims(statementA);
  const numsB = extractNumericalClaims(statementB);
  for (const nA of numsA) {
    for (const nB of numsB) {
      if (nA.unit === nB.unit && Math.abs(nA.value - nB.value) / Math.max(nA.value, nB.value) > 0.5) {
        contradictions.push({
          type: 'numerical',
          statementA: nA.phrase,
          statementB: nB.phrase,
          severity: 'medium',
          confidence: 0.8,
        });
        score -= 25;
      }
    }
  }

  return {
    consistent: contradictions.length === 0,
    contradictions,
    overallScore: Math.max(0, score),
    uncertainty: contradictions.length > 0 ? Math.min(1, contradictions.length * 0.15) : 0,
  };
}

export function propagateUncertainty(
  baseConfidence: number,
  dataPointsCount: number,
  dataAgeDays: number,
  dataQualityScore: number,
  sampleSizeSufficient: boolean,
): UncertaintyPropagation {
  let dataQualityPenalty = 0;
  if (dataQualityScore < 0.5) dataQualityPenalty = 0.2;
  else if (dataQualityScore < 0.7) dataQualityPenalty = 0.1;

  let sampleSizePenalty = 0;
  if (!sampleSizeSufficient) sampleSizePenalty = 0.3;
  else if (dataPointsCount < 5) sampleSizePenalty = 0.2;
  else if (dataPointsCount < 10) sampleSizePenalty = 0.1;

  let recencyPenalty = 0;
  if (dataAgeDays > 60) recencyPenalty = 0.3;
  else if (dataAgeDays > 30) recencyPenalty = 0.15;
  else if (dataAgeDays > 14) recencyPenalty = 0.05;

  const totalPenalty = dataQualityPenalty + sampleSizePenalty + recencyPenalty;
  const finalConfidence = Math.max(0, Math.min(1, baseConfidence - totalPenalty));

  return {
    baseConfidence,
    dataQualityPenalty,
    sampleSizePenalty,
    recencyPenalty,
    finalConfidence,
    sources: [
      dataQualityPenalty > 0 ? `Data quality reduces confidence by ${Math.round(dataQualityPenalty * 100)}%` : '',
      sampleSizePenalty > 0 ? `Sample size reduces confidence by ${Math.round(sampleSizePenalty * 100)}%` : '',
      recencyPenalty > 0 ? `Data age (${dataAgeDays}d) reduces confidence by ${Math.round(recencyPenalty * 100)}%` : '',
    ].filter(Boolean),
  };
}

export function validateAgainstHistory(
  newStatement: string,
  historyStatements: string[],
): { pass: boolean; issues: ConsistencyCheckResult[] } {
  const results: ConsistencyCheckResult[] = [];
  for (const hist of historyStatements) {
    if (hist.trim()) {
      results.push(checkConsistency(hist, newStatement));
    }
  }
  const failures = results.filter(r => !r.consistent);
  return {
    pass: failures.length === 0,
    issues: results,
  };
}
