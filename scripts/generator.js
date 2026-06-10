const fs = require('fs');
const path = require('path');

// Load cuisine data using vm (replace const with var so variables are accessible)
const vm = require('vm');
const code = fs.readFileSync(path.join(__dirname, 'global_food_data.js'), 'utf8');
const modifiedCode = code.replace(/\bconst\s+(?=[A-Z_][A-Z_0-9]*\s*=\s*\[)/g, 'var ');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(modifiedCode, ctx);

const allFoods = [];

const categories = [
  { name: 'Indian Breads', data: ctx.INDIAN_BREADS, cuisine: 'Indian' },
  { name: 'Indian Curries', data: ctx.INDIAN_CURRIES, cuisine: 'Indian' },
  { name: 'Indian Paneer', data: ctx.INDIAN_PANEER, cuisine: 'Indian' },
  { name: 'Indian Non-Veg', data: ctx.INDIAN_NONVEG, cuisine: 'Indian' },
  { name: 'Indian Biryani', data: ctx.INDIAN_BIRYANI, cuisine: 'Indian' },
  { name: 'South Indian', data: ctx.SOUTH_INDIAN, cuisine: 'Indian' },
  { name: 'Indian Street Food', data: ctx.INDIAN_STREET, cuisine: 'Indian' },
  { name: 'Indian Sweets', data: ctx.INDIAN_SWEETS, cuisine: 'Indian' },
  { name: 'Indian Snacks', data: ctx.INDIAN_SNACKS, cuisine: 'Indian' },
  { name: 'Italian Pasta', data: ctx.ITALIAN_PASTA, cuisine: 'Italian' },
  { name: 'Italian Pizza', data: ctx.ITALIAN_PIZZA, cuisine: 'Italian' },
  { name: 'Italian Mains', data: ctx.ITALIAN_MAINS, cuisine: 'Italian' },
  { name: 'Italian Desserts', data: ctx.ITALIAN_DESSERTS, cuisine: 'Italian' },
  { name: 'Chinese Rice Noodles', data: ctx.CHINESE_RICE_NOODLES, cuisine: 'Chinese' },
  { name: 'Chinese Mains', data: ctx.CHINESE_MAINS, cuisine: 'Chinese' },
  { name: 'Japanese Sushi', data: ctx.JAPANESE_SUSHI, cuisine: 'Japanese' },
  { name: 'Japanese Mains', data: ctx.JAPANESE_MAINS, cuisine: 'Japanese' },
  { name: 'Japanese Desserts', data: ctx.JAPANESE_DESSERTS, cuisine: 'Japanese' },
  { name: 'Korean Mains', data: ctx.KOREAN_MAINS, cuisine: 'Korean' },
  { name: 'Korean Desserts', data: ctx.KOREAN_DESSERTS, cuisine: 'Korean' },
  { name: 'Mexican Tortillas', data: ctx.MEXICAN_TACOS_TORTILLAS, cuisine: 'Mexican' },
  { name: 'Mexican Mains', data: ctx.MEXICAN_MAINS, cuisine: 'Mexican' },
  { name: 'Mexican Desserts', data: ctx.MEXICAN_DESSERTS, cuisine: 'Mexican' },
  { name: 'Thai Curries', data: ctx.THAI_CURRIES, cuisine: 'Thai' },
  { name: 'Thai Stir Fry', data: ctx.THAI_STIR_FRY, cuisine: 'Thai' },
  { name: 'Thai Soups', data: ctx.THAI_SOUPS, cuisine: 'Thai' },
  { name: 'Thai Salads', data: ctx.THAI_SALADS, cuisine: 'Thai' },
  { name: 'Thai Desserts', data: ctx.THAI_DESSERTS, cuisine: 'Thai' },
  { name: 'Vietnamese Pho', data: ctx.VIETNAMESE_PHO, cuisine: 'Vietnamese' },
  { name: 'Vietnamese Mains', data: ctx.VIETNAMESE_MAINS, cuisine: 'Vietnamese' },
  { name: 'Vietnamese Desserts', data: ctx.VIETNAMESE_DESSERTS, cuisine: 'Vietnamese' },
  { name: 'American Burgers', data: ctx.AMERICAN_BURGERS, cuisine: 'American' },
  { name: 'American Sandwiches', data: ctx.AMERICAN_SANDWICHES, cuisine: 'American' },
  { name: 'American Comfort', data: ctx.AMERICAN_COMFORT, cuisine: 'American' },
  { name: 'American Desserts', data: ctx.AMERICAN_DESSERTS, cuisine: 'American' },
  { name: 'American Salads', data: ctx.AMERICAN_SALADS, cuisine: 'American' },
  { name: 'Mediterranean Mains', data: ctx.MEDITERRANEAN_MAINS, cuisine: 'Mediterranean' },
  { name: 'Mediterranean Desserts', data: ctx.MEDITERRANEAN_DESSERTS, cuisine: 'Mediterranean' },
  { name: 'Middle Eastern Mains', data: ctx.MIDDLE_EASTERN_MAINS, cuisine: 'Middle Eastern' },
  { name: 'French Mains', data: ctx.FRENCH_MAINS, cuisine: 'French' },
  { name: 'French Desserts', data: ctx.FRENCH_DESSERTS, cuisine: 'French' },
  { name: 'French Snacks', data: ctx.FRENCH_SNACKS, cuisine: 'French' },
  { name: 'Latin American Mains', data: ctx.LATIN_MAINS, cuisine: 'Latin American' },
  { name: 'Caribbean Mains', data: ctx.CARIBBEAN_MAINS, cuisine: 'Caribbean' },
  { name: 'Caribbean Desserts', data: ctx.CARIBBEAN_DESSERTS, cuisine: 'Caribbean' },
  { name: 'African Mains', data: ctx.AFRICAN_MAINS, cuisine: 'African' },
  { name: 'Eastern European Soups', data: ctx.EASTERN_EUROPE_SOUPS, cuisine: 'Eastern European' },
  { name: 'Eastern European Mains', data: ctx.EASTERN_EUROPE_MAINS, cuisine: 'Eastern European' },
  { name: 'Eastern European Desserts', data: ctx.EASTERN_EUROPE_DESSERTS, cuisine: 'Eastern European' },
  { name: 'Southeast Asian', data: ctx.SOUTHEAST_ASIAN, cuisine: 'Southeast Asian' },
];

let sqlLines = [];
let foodId = 1;
let servingId = 1;

sqlLines.push('-- Generated global food database insert script');
sqlLines.push('BEGIN TRANSACTION;');
sqlLines.push('');

const createdFoodIds = new Set();
let skippedDuplicates = 0;

for (const cat of categories) {
  const arr = cat.data;
  if (!arr || !Array.isArray(arr)) {
    console.error(`WARNING: ${cat.name} data is not an array, skipping`);
    continue;
  }
  for (const row of arr) {
    if (typeof row === 'string') continue;
    if (!Array.isArray(row) || row.length < 10) {
      console.error(`WARNING: Invalid row in ${cat.name}: ${JSON.stringify(row).substring(0, 100)}`);
      continue;
    }

    const name = String(row[0]).replace(/'/g, "''");
    if (createdFoodIds.has(name.toLowerCase())) {
      skippedDuplicates++;
      continue;
    }
    createdFoodIds.add(name.toLowerCase());

    const cals = parseFloat(row[1]) || 0;
    const protein = parseFloat(row[2]) || 0;
    const carbs = parseFloat(row[3]) || 0;
    const fat = parseFloat(row[4]) || 0;
    const fiber = parseFloat(row[5]) || 0;
    const sugar = parseFloat(row[6]) || 0;
    const sodium = parseFloat(row[7]) || 0;
    const servingDesc = String(row[8]).replace(/'/g, "''");
    const servingGrams = parseFloat(row[9]) || 100;
    const aliases = row[10] && Array.isArray(row[10])
      ? row[10].map(a => String(a).replace(/'/g, "''")).join(',')
      : '';

    const searchTerms = [
      name.toLowerCase(),
      ...(row[10] && Array.isArray(row[10]) ? row[10].map(a => String(a).toLowerCase()) : []),
      cat.cuisine.toLowerCase(),
      cat.name.toLowerCase()
    ].join(' ').trim();

    const canonicalName = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const category = cat.name.replace(/'/g, "''");
    const cuisine = cat.cuisine.replace(/'/g, "''");

    const calsPer100 = parseFloat((cals / servingGrams * 100).toFixed(2));
    const proteinPer100 = parseFloat((protein / servingGrams * 100).toFixed(2));
    const carbsPer100 = parseFloat((carbs / servingGrams * 100).toFixed(2));
    const fatPer100 = parseFloat((fat / servingGrams * 100).toFixed(2));
    const fiberPer100 = parseFloat((fiber / servingGrams * 100).toFixed(2));
    const sugarPer100 = parseFloat((sugar / servingGrams * 100).toFixed(2));
    const sodiumPer100 = parseFloat((sodium / servingGrams * 100).toFixed(2));

    sqlLines.push(`INSERT INTO foods (id, canonical_name, display_name, category, cuisine, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, sugar_per_100g, sodium_mg_per_100g, base_serving_amount, base_serving_unit, base_serving_description, aliases, search_terms, verified) VALUES (${foodId}, '${canonicalName}', '${name}', '${category}', '${cuisine}', ${calsPer100}, ${proteinPer100}, ${carbsPer100}, ${fatPer100}, ${fiberPer100}, ${sugarPer100}, ${sodiumPer100}, ${servingGrams}, 'g', '${servingDesc}', '${aliases}', '${searchTerms}', 1);`);

    sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '${servingDesc}', ${servingGrams}, 1);`);
    servingId++;

    sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '100g', 100, 0);`);
    servingId++;

    const nameLower = name.toLowerCase();
    const isLiquid = ['milk', 'juice', 'soup', 'drink', 'tea', 'coffee', 'water', 'broth', 'soda'].some(k => nameLower.includes(k));
    const isSnack = ['snack', 'fries', 'chips', 'pakora', 'samosa', 'roll', 'spring roll', 'dumpling', 'bhaji', 'pakora'].some(k => nameLower.includes(k));
    const isVegetable = ['salad', 'sabzi', 'bhaji', 'stir fry', 'vegetable', 'greens', 'saag', 'palak'].some(k => nameLower.includes(k));

    if (servingGrams > 200) {
      const halfGrams = Math.round(servingGrams / 2);
      sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '1/2 serving', ${halfGrams}, 0);`);
      servingId++;
    }

    if (isLiquid) {
      sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '1 cup (240ml)', 240, 0);`);
      servingId++;
      sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '1 bowl (300ml)', 300, 0);`);
      servingId++;
    } else if (isSnack) {
      sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '1 cup', ${Math.round(servingGrams * 1.2)}, 0);`);
      servingId++;
    } else if (isVegetable) {
      sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '1/2 cup', ${Math.round(servingGrams * 0.6)}, 0);`);
      servingId++;
    }

    if (!isLiquid && servingGrams < 200) {
      sqlLines.push(`INSERT INTO food_servings (id, food_id, serving_description, amount_in_grams, is_default) VALUES (${servingId}, ${foodId}, '1 bowl (250g)', 250, 0);`);
      servingId++;
    }

    sqlLines.push('');
    foodId++;
  }
}

sqlLines.push('COMMIT;');
sqlLines.push('');

const output = sqlLines.join('\n');
const outputFile = path.join(__dirname, 'global_food_seed.sql');
fs.writeFileSync(outputFile, output, 'utf8');

const foodCount = foodId - 1;
const servingCount = servingId - 1;
console.log(`Results:`);
console.log(`  Food entries: ${foodCount}`);
console.log(`  Serving variations: ${servingCount}`);
console.log(`  Skipped duplicates: ${skippedDuplicates}`);
console.log(`  SQL file: ${outputFile}`);
console.log(`  File size: ${(output.length / 1024).toFixed(1)} KB`);
