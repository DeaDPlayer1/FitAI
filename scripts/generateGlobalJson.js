const fs = require('fs');
const path = require('path');

const vm = require('vm');
const code = fs.readFileSync(path.join(__dirname, 'global_food_data.js'), 'utf8');
const modifiedCode = code.replace(/\bconst\s+(?=[A-Z_][A-Z_0-9]*\s*=\s*\[)/g, 'var ');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(modifiedCode, ctx);

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

// Compact array format: [canonical_name, display_name, category, cuisine, cals_100, protein_100, carbs_100, fat_100, fiber_100, sugar_100, sodium_100, serving_desc, serving_grams, aliases(optional)]
const output = [];
const seen = new Set();
let skipped = 0;

for (const cat of categories) {
  const arr = cat.data;
  if (!arr || !Array.isArray(arr)) continue;
  for (const row of arr) {
    if (typeof row === 'string' || !Array.isArray(row) || row.length < 10) continue;

    const name = String(row[0]);
    const key = name.toLowerCase().trim();
    if (seen.has(key)) { skipped++; continue; }
    seen.add(key);

    const cals = parseFloat(row[1]) || 0;
    const protein = parseFloat(row[2]) || 0;
    const carbs = parseFloat(row[3]) || 0;
    const fat = parseFloat(row[4]) || 0;
    const fiber = parseFloat(row[5]) || 0;
    const sugar = parseFloat(row[6]) || 0;
    const sodium = parseFloat(row[7]) || 0;
    const servingDesc = String(row[8]);
    const servingGrams = parseFloat(row[9]) || 100;
    const aliases = row[10] && Array.isArray(row[10]) ? row[10].map(a => String(a)) : [];

    const canonical = key.replace(/[^a-z0-9 ]/g, '').trim();

    // Pre-calculate per-100g values
    const ratio = 100 / servingGrams;
    const entry = [
      canonical,
      name,
      cat.name,
      cat.cuisine,
      parseFloat((cals * ratio).toFixed(2)),
      parseFloat((protein * ratio).toFixed(2)),
      parseFloat((carbs * ratio).toFixed(2)),
      parseFloat((fat * ratio).toFixed(2)),
      parseFloat((fiber * ratio).toFixed(2)),
      parseFloat((sugar * ratio).toFixed(2)),
      parseFloat((sodium * ratio).toFixed(2)),
      servingDesc,
      servingGrams
    ];
    if (aliases.length > 0) entry.push(aliases);
    output.push(entry);
  }
}

const outputFile = path.join(__dirname, '..', 'assets', 'global_food_database.json');
fs.writeFileSync(outputFile, JSON.stringify(output), 'utf8');

const stats = fs.statSync(outputFile);
console.log(`Results:`);
console.log(`  Food entries: ${output.length}`);
console.log(`  Skipped dups: ${skipped}`);
console.log(`  JSON file: ${outputFile}`);
console.log(`  File size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`  Format: compact array (${JSON.stringify(output[0]).length} bytes/first item)`);
