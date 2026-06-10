#!/usr/bin/env node
// Global Food Database Generator v2
// Generates 100,000+ food entries covering all world cuisines.
// Usage: node scripts/generate_global_food_db.js
const fs = require("fs"), path = require("path");

// Helper: dish entry factory
function dish(name, cal, pro, car, fat, fib, sug, sod, sv, g, category, cuisine, aliases=[], brand="") {
  return {
    food_name: name.toLowerCase(),
    aliases: [...new Set([name, ...aliases])],
    calories_per_100g: cal, protein_per_100g: pro, carbs_per_100g: car,
    fat_per_100g: fat, fiber_per_100g: fib,
    serving_size: sv, serving_grams: g,
    category, cuisine, brand,
  };
}

function applyAlias(name) {
  return [name, name.replace(/'/g,""), name.replace(/"/g,""), name.toLowerCase()];
}

const all = [];

// Import all dish data from separate data module
const DATA = require("./global_food_data.js");

// Generate foods from base ingredients
for (const [cat, foods] of Object.entries(DATA.BASE_INGREDIENTS)) {
  for (const f of foods) {
    all.push(dish(f.name, f.cal, f.pro, f.car, f.fat, f.fib, f.sug, f.sod, f.sv, f.g, cat, "Global", f.aliases||[]));
  }
}

// Generate dishes from cuisine data
for (const [cuisine, category, dishes] of [
  ["Indian","Indian Breads",DATA.INDIAN_BREADS],
  ["Indian","Indian Curry",DATA.INDIAN_CURRIES],
  ["Indian","Indian Paneer",DATA.INDIAN_PANEER],
  ["Indian","Indian Non-Veg",DATA.INDIAN_NONVEG],
  ["Indian","Indian Rice",DATA.INDIAN_BIRYANI],
  ["Indian","South Indian",DATA.SOUTH_INDIAN],
  ["Indian","Indian Street Food",DATA.INDIAN_STREET],
  ["Indian","Indian Sweets",DATA.INDIAN_SWEETS],
  ["Indian","Indian Snacks",DATA.INDIAN_SNACKS],
  ["Chinese","Chinese",DATA.CHINESE],
  ["Japanese","Japanese",DATA.JAPANESE],
  ["Korean","Korean",DATA.KOREAN],
  ["Mexican","Mexican",DATA.MEXICAN],
  ["Italian","Italian",DATA.ITALIAN],
  ["Thai","Thai",DATA.THAI],
  ["Middle Eastern","Middle Eastern",DATA.MIDDLE_EASTERN],
  ["American","American",DATA.AMERICAN],
  ["","Fast Food",DATA.FAST_FOOD],
  ["Vietnamese","Vietnamese",DATA.VIETNAMESE],
  ["Indonesian","Indonesian",DATA.INDONESIAN],
  ["African","African",DATA.AFRICAN],
  ["Caribbean","Caribbean",DATA.CARIBBEAN],
  ["Pakistani","Pakistani",DATA.PAKISTANI],
  ["","Beverages",DATA.BEVERAGES],
  ["","Packaged Foods",DATA.PACKAGED],
  ["","Healthy",DATA.HEALTHY],
  ["","Soups & Salads",DATA.SOUPS_SALADS],
  ["","Desserts",DATA.DESSERTS],
]) {
  for (const r of dishes) {
    all.push(dish(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], category, cuisine, r[10]||[], r[11]||""));
  }
}

console.log("Generated", all.length, "food entries");
console.log("Sample:", JSON.stringify(all[0], null, 2));

// Save
const outPath = path.join(__dirname, "..", "assets", "food_database.json");
fs.writeFileSync(outPath, JSON.stringify(all, null, 2));
console.log("Saved to", outPath);
