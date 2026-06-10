import {
  scaleNutrition,
  estimateBaseNutrition,
  parseServingString,
  getServingPresets,
  getAvailableUnits,
  scaleFromPer100g,
  BaseNutrition,
} from '../lib/nutritionScale';

const chickenBase: BaseNutrition = {
  baseServingValue: 100,
  baseServingUnit: 'g',
  baseServingLabel: '100g',
  calories: 165,
  protein_g: 31,
  carbs_g: 0,
  fats_g: 3.6,
  fiber_g: 0,
  sugar_g: 0,
  sodium_g: 0.074,
};

const riceBase: BaseNutrition = {
  baseServingValue: 100,
  baseServingUnit: 'g',
  baseServingLabel: '100g',
  calories: 130,
  protein_g: 2.7,
  carbs_g: 28,
  fats_g: 0.3,
  fiber_g: 0.4,
  sugar_g: 0.1,
  sodium_g: 0.001,
};

describe('scaleNutrition', () => {
  test('same unit — double grams => double cals', () => {
    const r = scaleNutrition({ base: chickenBase, quantity: 200, unit: 'g' });
    expect(r.calories).toBe(330);
    expect(r.protein_g).toBe(62);
  });

  test('same unit — half grams => half cals', () => {
    const r = scaleNutrition({ base: chickenBase, quantity: 50, unit: 'g' });
    expect(r.calories).toBe(83);
    expect(r.fats_g).toBe(1.8);
  });

  test('count-based target — 2 servings', () => {
    const base: BaseNutrition = { ...chickenBase, baseServingUnit: 'serving', baseServingValue: 1 };
    const r = scaleNutrition({ base, quantity: 2, unit: 'serving' });
    expect(r.calories).toBe(330);
  });

  test('count-based base — 1 piece via gramsPerUnit', () => {
    const r = scaleNutrition({ base: chickenBase, quantity: 250, unit: 'g' });
    expect(r.calories).toBe(413);
  });

  test('zero quantity returns zeros', () => {
    const r = scaleNutrition({ base: chickenBase, quantity: 0, unit: 'g' });
    expect(r.calories).toBe(0);
    expect(r.protein_g).toBe(0);
  });

  test('negative quantity treated as 0', () => {
    const r = scaleNutrition({ base: chickenBase, quantity: -100, unit: 'g' });
    expect(r.calories).toBe(0);
  });

  test('volume conversion — ml to cup', () => {
    const base: BaseNutrition = {
      baseServingValue: 250, baseServingUnit: 'ml', baseServingLabel: '250ml',
      calories: 122, protein_g: 1, carbs_g: 28, fats_g: 0.1, fiber_g: 0, sugar_g: 24, sodium_g: 0,
    };
    const r = scaleNutrition({ base, quantity: 1, unit: 'cup' });
    expect(r.calories).toBe(117);
  });
});

describe('estimateBaseNutrition', () => {
  test('"1 roti (40g)" bases on 40g', () => {
    const n = estimateBaseNutrition(
      { calories: 120, protein: 3, carbs: 22, fat: 1.5, fiber: 0.5, sugar: 0.1, sodium: 0.1 },
      '1 roti (40g)',
    );
    expect(n.baseServingValue).toBe(40);
    expect(n.calories).toBe(48);
  });

  test('"1 glass (250ml)" extracts ml', () => {
    const per100 = { calories: 42, protein: 0.4, carbs: 10, fat: 0.1, fiber: 0, sugar: 9, sodium: 0.01 };
    const n = estimateBaseNutrition(per100, '1 glass (250ml)');
    expect(n.baseServingUnit).toBe('ml');
    expect(n.baseServingValue).toBe(250);
    expect(n.calories).toBe(105);
  });

  test('"1 can (330ml)" count-based with embedded unit', () => {
    const per100 = { calories: 42, protein: 0.4, carbs: 10, fat: 0.1, fiber: 0, sugar: 9, sodium: 0.01 };
    const n = estimateBaseNutrition(per100, '1 can (330ml)');
    expect(n.baseServingUnit).toBe('can');
    expect(n.baseServingValue).toBe(1);
    expect(n.calories).toBe(139);
  });

  test('empty desc → 100g fallback', () => {
    const n = estimateBaseNutrition(
      { calories: 100, protein: 10, carbs: 10, fat: 2, fiber: 1, sugar: 0, sodium: 0.1 },
      '',
    );
    expect(n.baseServingValue).toBe(100);
    expect(n.calories).toBe(100);
  });

  test('servingGrams override', () => {
    const n = estimateBaseNutrition(
      { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 0.074 },
      '1 piece',
      250,
    );
    expect(n.baseServingValue).toBe(1); // count-based → stored as 1 piece = 250g
    expect(n.calories).toBe(413);
  });
});

describe('parseServingString', () => {
  test('"2 cups" → {2, cup}', () => {
    const r = parseServingString('2 cups');
    expect(r).toEqual({ value: 2, unit: 'cup' });
  });

  test('"330ml" → {330, ml}', () => {
    const r = parseServingString('330ml');
    expect(r).toEqual({ value: 330, unit: 'ml' });
  });

  test('"half bowl" → {0.5, bowl}', () => {
    const r = parseServingString('half bowl');
    expect(r).toEqual({ value: 0.5, unit: 'bowl' });
  });

  test('"" → null', () => {
    expect(parseServingString('')).toBeNull();
  });
});

describe('getServingPresets', () => {
  test('g base → 50/100/200g presets', () => {
    const p = getServingPresets(chickenBase);
    expect(p).toHaveLength(3);
    expect(p[0]).toMatchObject({ value: 50, unit: 'g' });
    expect(p[1]).toMatchObject({ value: 100, unit: 'g' });
    expect(p[2]).toMatchObject({ value: 200, unit: 'g' });
  });

  test('can base → ½/1/2 presets', () => {
    const base: BaseNutrition = { ...chickenBase, baseServingUnit: 'can', baseServingValue: 1 };
    const p = getServingPresets(base);
    expect(p[0]).toMatchObject({ value: 0.5, unit: 'can' });
    expect(p[1]).toMatchObject({ value: 1, unit: 'can' });
    expect(p[2]).toMatchObject({ value: 2, unit: 'can' });
  });
});

describe('getAvailableUnits', () => {
  test('packaged includes ml/g/serving/can/bottle/piece/scoop', () => {
    const u = getAvailableUnits('g', true);
    expect(u).toContain('ml');
    expect(u).toContain('g');
    expect(u).toContain('can');
    expect(u).toContain('bottle');
    expect(u).toContain('piece');
    expect(u).toContain('scoop');
    expect(u).toContain('serving');
  });

  test('unpackaged includes g/cup/bowl/piece/serving', () => {
    const u = getAvailableUnits('g', false);
    expect(u).toContain('g');
    expect(u).toContain('cup');
    expect(u).toContain('bowl');
    expect(u).toContain('piece');
    expect(u).toContain('serving');
  });
});

describe('scaleFromPer100g', () => {
  test('200g of chicken', () => {
    const r = scaleFromPer100g(
      { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      200,
    );
    expect(r.calories).toBe(330);
    expect(r.protein_g).toBe(62);
  });

  test('0g returns 0', () => {
    const r = scaleFromPer100g(
      { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      0,
    );
    expect(r.calories).toBe(0);
  });
});

describe('regression — previously fixed bugs', () => {
  test('serving inflation: 2 servings = 330 kcal (not 455)', () => {
    const r = scaleNutrition({ base: chickenBase, quantity: 2, unit: 'serving' });
    expect(r.calories).toBe(330);
    expect(r.carbs_g).toBe(0);
  });

  test('parseServingGrams word boundary: "1 glass" does NOT match as 1g', () => {
    const p = parseServingString('1 glass');
    expect(p).toBeNull();
  });

  test('parseServingString "100g" still works', () => {
    const r = parseServingString('100g');
    expect(r).toEqual({ value: 100, unit: 'g' });
  });
});
