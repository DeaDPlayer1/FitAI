/**
 * Verified Restaurant Data Expansion
 * Adds new chains and items using verified nutrition data from official sources.
 * Run: node scripts/add_verified_restaurant_data.js
 */
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assets', 'restaurant_food_database.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

function findBrand(name) {
  return db.find(b => b.brand === name);
}

function hasItem(brand, canonical) {
  return brand.items.some(i => i.canonical === canonical);
}

// ── SHAKE SHACK (verified from official 2025 PDF) ──
const shakeShack = {
  brand: "Shake Shack",
  country: "Global",
  aliases: ["shake shack", "shack shack", "shakeshack"],
  cuisine: "American Premium Burgers",
  items: [
    { name: "ShackBurger (Single)", canonical: "shake shack shackburger single", cal: 500, p: 29, c: 26, f: 30, fb: 0, sg: 6, na: 1250, sv: "1 burger", g: 250, aliases: ["shackburger", "shack burger single"], cat: "Burgers", ctry: "USA" },
    { name: "ShackBurger (Double)", canonical: "shake shack shackburger double", cal: 760, p: 48, c: 27, f: 48, fb: 0, sg: 6, na: 2280, sv: "1 burger", g: 350, aliases: ["double shackburger", "shackburger double"], cat: "Burgers", ctry: "USA" },
    { name: "Hamburger (Single)", canonical: "shake shack hamburger single", cal: 370, p: 21, c: 24, f: 18, fb: 0, sg: 5, na: 850, sv: "1 burger", g: 220, aliases: ["hamburger single"], cat: "Burgers", ctry: "USA" },
    { name: "Cheeseburger (Single)", canonical: "shake shack cheeseburger single", cal: 440, p: 24, c: 25, f: 24, fb: 0, sg: 5, na: 1200, sv: "1 burger", g: 240, aliases: ["cheeseburger single"], cat: "Burgers", ctry: "USA" },
    { name: "SmokeShack (Single)", canonical: "shake shack smokeshack single", cal: 570, p: 35, c: 28, f: 35, fb: 0, sg: 7, na: 2010, sv: "1 burger", g: 280, aliases: ["smokeshack", "smoke shack"], cat: "Burgers", ctry: "USA" },
    { name: "Shack Stack", canonical: "shake shack shack stack", cal: 770, p: 45, c: 50, f: 45, fb: 0, sg: 7, na: 1700, sv: "1 burger", g: 350, aliases: ["shackstack", "shack stack"], cat: "Burgers", ctry: "USA" },
    { name: "'Shroom Burger", canonical: "shake shack shroom burger", cal: 510, p: 27, c: 49, f: 27, fb: 0, sg: 7, na: 670, sv: "1 burger", g: 280, aliases: ["shroom burger", "mushroom burger"], cat: "Burgers", ctry: "USA" },
    { name: "Chicken Shack", canonical: "shake shack chicken shack", cal: 600, p: 42, c: 31, f: 34, fb: 0, sg: 7, na: 1300, sv: "1 sandwich", g: 280, aliases: ["chicken shack sandwich"], cat: "Chicken", ctry: "USA" },
    { name: "Chicken Bites (6 pc)", canonical: "shake shack chicken bites 6", cal: 300, p: 20, c: 16, f: 17, fb: 0, sg: 1, na: 750, sv: "6 pieces", g: 140, aliases: ["chicken bites", "chicken tenders 6"], cat: "Chicken", ctry: "USA" },
    { name: "Crinkle Cut Fries (Regular)", canonical: "shake shack fries regular", cal: 470, p: 6, c: 56, f: 25, fb: 4, sg: 1, na: 680, sv: "1 regular", g: 170, aliases: ["fries regular", "crinkle fries"], cat: "Sides", ctry: "USA" },
    { name: "Cheese Fries", canonical: "shake shack cheese fries", cal: 580, p: 11, c: 57, f: 34, fb: 4, sg: 2, na: 900, sv: "1 order", g: 200, aliases: ["cheese fries"], cat: "Sides", ctry: "USA" },
    { name: "Bacon Cheese Fries", canonical: "shake shack bacon cheese fries", cal: 740, p: 17, c: 59, f: 47, fb: 4, sg: 2, na: 1200, sv: "1 order", g: 220, aliases: ["bacon cheese fries"], cat: "Sides", ctry: "USA" },
    { name: "Vanilla Shake", canonical: "shake shack vanilla shake", cal: 680, p: 18, c: 72, f: 36, fb: 0, sg: 71, na: 430, sv: "1 shake", g: 400, aliases: ["vanilla shake", "vanilla milkshake"], cat: "Beverages", ctry: "USA" },
    { name: "Chocolate Shake", canonical: "shake shack chocolate shake", cal: 750, p: 16, c: 76, f: 45, fb: 0, sg: 69, na: 310, sv: "1 shake", g: 400, aliases: ["chocolate shake", "chocolate milkshake"], cat: "Beverages", ctry: "USA" },
    { name: "Strawberry Shake", canonical: "shake shack strawberry shake", cal: 690, p: 17, c: 77, f: 35, fb: 0, sg: 75, na: 430, sv: "1 shake", g: 400, aliases: ["strawberry shake"], cat: "Beverages", ctry: "USA" },
    { name: "Shack-cago Dog", canonical: "shake shack shackcago dog", cal: 490, p: 16, c: 38, f: 30, fb: 0, sg: 8, na: 1300, sv: "1 hot dog", g: 200, aliases: ["shackcago dog", "chicago dog"], cat: "Hot Dogs", ctry: "USA" },
    { name: "Flat-Top Dog", canonical: "shake shack flat top dog", cal: 390, p: 14, c: 26, f: 26, fb: 0, sg: 6, na: 1100, sv: "1 hot dog", g: 180, aliases: ["flat top dog", "shack dog"], cat: "Hot Dogs", ctry: "USA" },
  ]
};

// ── JOLLIBEE (verified from multiple sources) ──
const jollibee = {
  brand: "Jollibee",
  country: "Philippines",
  aliases: ["jollibee", "jolli bee", "jolli bee ph"],
  cuisine: "Filipino Fast Food",
  items: [
    { name: "Chickenjoy (1 pc Drumstick)", canonical: "jollibee chickenjoy drumstick", cal: 220, p: 20, c: 3, f: 14, fb: 0, sg: 0, na: 270, sv: "1 piece", g: 100, aliases: ["chickenjoy drumstick", "fried chicken drumstick jollibee"], cat: "Chicken", ctry: "Philippines" },
    { name: "Chickenjoy (1 pc Thigh)", canonical: "jollibee chickenjoy thigh", cal: 380, p: 27, c: 5, f: 28, fb: 0, sg: 0, na: 400, sv: "1 piece", g: 130, aliases: ["chickenjoy thigh", "fried chicken thigh jollibee"], cat: "Chicken", ctry: "Philippines" },
    { name: "Spicy Chickenjoy Drumstick", canonical: "jollibee spicy chickenjoy drumstick", cal: 200, p: 17, c: 10, f: 10, fb: 0, sg: 0, na: 480, sv: "1 piece", g: 100, aliases: ["spicy chickenjoy drumstick", "spicy fried chicken jollibee"], cat: "Chicken", ctry: "Philippines" },
    { name: "Spicy Chickenjoy Thigh", canonical: "jollibee spicy chickenjoy thigh", cal: 370, p: 23, c: 18, f: 21, fb: 0, sg: 0, na: 720, sv: "1 piece", g: 130, aliases: ["spicy chickenjoy thigh"], cat: "Chicken", ctry: "Philippines" },
    { name: "Jolly Spaghetti", canonical: "jollibee jolly spaghetti", cal: 610, p: 23, c: 76, f: 23, fb: 3, sg: 18, na: 1340, sv: "1 serving", g: 350, aliases: ["jolly spaghetti", "jollibee spaghetti", "spaghetti jollibee"], cat: "Pasta", ctry: "Philippines" },
    { name: "Yumburger", canonical: "jollibee yumburger", cal: 360, p: 13, c: 30, f: 21, fb: 1, sg: 6, na: 630, sv: "1 burger", g: 180, aliases: ["yumburger", "yum burger", "jollibee burger"], cat: "Burgers", ctry: "Philippines" },
    { name: "Yumburger with Cheese", canonical: "jollibee yumburger cheese", cal: 410, p: 16, c: 30, f: 25, fb: 1, sg: 6, na: 880, sv: "1 burger", g: 200, aliases: ["yumburger cheese", "cheeseburger jollibee"], cat: "Burgers", ctry: "Philippines" },
    { name: "Burger Steak (2 pc)", canonical: "jollibee burger steak 2pc", cal: 570, p: 24, c: 56, f: 28, fb: 2, sg: 4, na: 1010, sv: "2 patties with rice", g: 350, aliases: ["burger steak", "burger steak jollibee"], cat: "Burgers", ctry: "Philippines" },
    { name: "Jolly Hotdog", canonical: "jollibee jolly hotdog", cal: 260, p: 10, c: 28, f: 12, fb: 1, sg: 6, na: 700, sv: "1 hotdog", g: 150, aliases: ["jolly hotdog", "jollibee hotdog"], cat: "Hot Dogs", ctry: "Philippines" },
    { name: "Palabok Fiesta", canonical: "jollibee palabok fiesta", cal: 660, p: 41, c: 57, f: 28, fb: 3, sg: 8, na: 1600, sv: "1 serving", g: 350, aliases: ["palabok fiesta", "palabok jollibee"], cat: "Pasta", ctry: "Philippines" },
    { name: "Chicken Sandwich Original", canonical: "jollibee chicken sandwich original", cal: 620, p: 31, c: 43, f: 34, fb: 1, sg: 5, na: 1100, sv: "1 sandwich", g: 240, aliases: ["chicken sandwich jollibee", "jollibee chicken sandwich"], cat: "Chicken", ctry: "Philippines" },
    { name: "Peach Mango Pie", canonical: "jollibee peach mango pie", cal: 270, p: 3, c: 40, f: 11, fb: 1, sg: 11, na: 200, sv: "1 pie", g: 85, aliases: ["peach mango pie", "jollibee pie peach mango"], cat: "Desserts", ctry: "Philippines" },
    { name: "Ube Pie", canonical: "jollibee ube pie", cal: 310, p: 4, c: 44, f: 14, fb: 1, sg: 16, na: 180, sv: "1 pie", g: 90, aliases: ["ube pie", "jollibee ube pie"], cat: "Desserts", ctry: "Philippines" },
    { name: "Jolly Crispy Fries (Regular)", canonical: "jollibee fries regular", cal: 340, p: 4, c: 41, f: 18, fb: 3, sg: 1, na: 560, sv: "1 regular", g: 140, aliases: ["jolly fries", "fries jollibee"], cat: "Sides", ctry: "Philippines" },
    { name: "Halo-Halo", canonical: "jollibee halo halo", cal: 490, p: 10, c: 93, f: 9, fb: 3, sg: 48, na: 100, sv: "1 serving", g: 350, aliases: ["halo halo jollibee", "jollibee halo-halo"], cat: "Desserts", ctry: "Philippines" },
    { name: "Steamed Rice", canonical: "jollibee steamed rice", cal: 190, p: 4, c: 44, f: 0, fb: 0, sg: 0, na: 0, sv: "1 serving", g: 150, aliases: ["rice jollibee", "steamed rice jollibee"], cat: "Sides", ctry: "Philippines" },
  ]
};

// ── IN-N-OUT BURGER (verified from official In-N-Out) ──
const innout = {
  brand: "In-N-Out Burger",
  country: "USA",
  aliases: ["in-n-out", "innout", "in and out", "in n out"],
  cuisine: "American Fast Food",
  items: [
    { name: "Hamburger", canonical: "in-n-out hamburger", cal: 390, p: 16, c: 39, f: 19, fb: 0, sg: 4, na: 650, sv: "1 burger", g: 210, aliases: ["hamburger in n out"], cat: "Burgers", ctry: "USA" },
    { name: "Cheeseburger", canonical: "in-n-out cheeseburger", cal: 480, p: 22, c: 39, f: 27, fb: 0, sg: 5, na: 1000, sv: "1 burger", g: 230, aliases: ["cheeseburger in n out"], cat: "Burgers", ctry: "USA" },
    { name: "Double-Double", canonical: "in-n-out double double", cal: 670, p: 37, c: 39, f: 41, fb: 0, sg: 5, na: 1440, sv: "1 burger", g: 300, aliases: ["double double", "double-double in n out"], cat: "Burgers", ctry: "USA" },
    { name: "Protein Style Hamburger", canonical: "in-n-out protein hamburger", cal: 240, p: 16, c: 11, f: 15, fb: 0, sg: 3, na: 650, sv: "1 burger", g: 180, aliases: ["protein style hamburger", "lettuce wrap hamburger in n out"], cat: "Burgers", ctry: "USA" },
    { name: "Protein Style Cheeseburger", canonical: "in-n-out protein cheeseburger", cal: 330, p: 22, c: 11, f: 23, fb: 0, sg: 4, na: 1000, sv: "1 burger", g: 200, aliases: ["protein style cheeseburger"], cat: "Burgers", ctry: "USA" },
    { name: "Protein Style Double-Double", canonical: "in-n-out protein double double", cal: 520, p: 37, c: 11, f: 37, fb: 0, sg: 4, na: 1440, sv: "1 burger", g: 270, aliases: ["protein style double double"], cat: "Burgers", ctry: "USA" },
    { name: "French Fries", canonical: "in-n-out french fries", cal: 370, p: 7, c: 52, f: 16, fb: 3, sg: 0, na: 245, sv: "1 order", g: 170, aliases: ["fries in n out", "in n out fries"], cat: "Sides", ctry: "USA" },
    { name: "Vanilla Shake", canonical: "in-n-out vanilla shake", cal: 580, p: 12, c: 68, f: 30, fb: 0, sg: 52, na: 350, sv: "1 shake", g: 350, aliases: ["vanilla shake in n out"], cat: "Beverages", ctry: "USA" },
    { name: "Chocolate Shake", canonical: "in-n-out chocolate shake", cal: 590, p: 14, c: 68, f: 31, fb: 0, sg: 52, na: 380, sv: "1 shake", g: 350, aliases: ["chocolate shake in n out"], cat: "Beverages", ctry: "USA" },
    { name: "Strawberry Shake", canonical: "in-n-out strawberry shake", cal: 590, p: 12, c: 70, f: 30, fb: 0, sg: 54, na: 330, sv: "1 shake", g: 350, aliases: ["strawberry shake in n out"], cat: "Beverages", ctry: "USA" },
    { name: "Neapolitan Shake", canonical: "in-n-out neapolitan shake", cal: 590, p: 12, c: 70, f: 30, fb: 0, sg: 54, na: 350, sv: "1 shake", g: 350, aliases: ["neapolitan shake in n out"], cat: "Beverages", ctry: "USA" },
  ]
};

// ── EXPANDED McDonald's India items (from official 2025 nutritional booklet) ──
const mcdonaldsExpanded = [
  { name: "McAloo Tikki Burger (Value)", canonical: "mcdonald's mcaloo tikki value", cal: 353, p: 8, c: 44, f: 17, fb: 2, sg: 4, na: 790, sv: "1 burger", g: 170, aliases: ["mcaloo tikki value", "mc aloo tikki value"], cat: "Burgers", ctry: "India" },
  { name: "McAloo Wrap with Chipotle", canonical: "mcdonald's mcaloo wrap chipotle", cal: 357, p: 5, c: 39, f: 20, fb: 2, sg: 4, na: 820, sv: "1 wrap", g: 160, aliases: ["mcaloo wrap", "mc aloo wrap chipotle"], cat: "Wraps", ctry: "India" },
  { name: "Mexican McAloo Tikki", canonical: "mcdonald's mexican mcaloo tikki", cal: 397, p: 6, c: 44, f: 22, fb: 2, sg: 5, na: 820, sv: "1 burger", g: 180, aliases: ["mexican mcaloo", "mexican mc aloo"], cat: "Burgers", ctry: "India" },
  { name: "Big Spicy Chicken", canonical: "mcdonald's big spicy chicken", cal: 638, p: 28, c: 49, f: 37, fb: 2, sg: 6, na: 1330, sv: "1 burger", g: 250, aliases: ["big spicy chicken", "bigspicy chicken mcd"], cat: "Burgers", ctry: "India" },
  { name: "Big Spicy Paneer", canonical: "mcdonald's big spicy paneer", cal: 808, p: 28, c: 58, f: 52, fb: 3, sg: 8, na: 1460, sv: "1 burger", g: 280, aliases: ["big spicy paneer", "bigspicy paneer"], cat: "Burgers", ctry: "India" },
  { name: "McSpicy Paneer Burger", canonical: "mcdonald's mcspicy paneer burger", cal: 705, p: 24, c: 50, f: 46, fb: 3, sg: 6, na: 1260, sv: "1 burger", g: 260, aliases: ["mcspicy paneer", "spicy paneer burger"], cat: "Burgers", ctry: "India" },
  { name: "Spicy Paneer Wrap", canonical: "mcdonald's spicy paneer wrap", cal: 476, p: 16, c: 44, f: 27, fb: 3, sg: 5, na: 940, sv: "1 wrap", g: 200, aliases: ["spicy paneer wrap mcd"], cat: "Wraps", ctry: "India" },
  { name: "Butter Paneer Grilled Burger", canonical: "mcdonald's butter paneer grilled burger", cal: 542, p: 20, c: 46, f: 32, fb: 3, sg: 6, na: 1020, sv: "1 burger", g: 230, aliases: ["butter paneer burger", "butter paneer grilled"], cat: "Burgers", ctry: "India" },
  { name: "Butter Chicken Grilled Burger", canonical: "mcdonald's butter chicken grilled burger", cal: 528, p: 24, c: 44, f: 30, fb: 2, sg: 5, na: 1080, sv: "1 burger", g: 230, aliases: ["butter chicken burger", "butter chicken grilled"], cat: "Burgers", ctry: "India" },
  { name: "Chicken Wings (2 pc)", canonical: "mcdonald's chicken wings 2", cal: 168, p: 12, c: 6, f: 11, fb: 0, sg: 0, na: 560, sv: "2 pieces", g: 80, aliases: ["chicken wings mcd", "mcd chicken wings 2pc"], cat: "Chicken", ctry: "India" },
  { name: "Chicken McNuggets (4 pc)", canonical: "mcdonald's chicken nuggets 4", cal: 180, p: 10, c: 10, f: 11, fb: 0, sg: 0, na: 480, sv: "4 pieces", g: 80, aliases: ["chicken nuggets 4pc", "mcnuggets 4"], cat: "Chicken", ctry: "India" },
  { name: "Chicken McNuggets (6 pc)", canonical: "mcdonald's chicken nuggets 6", cal: 270, p: 15, c: 15, f: 17, fb: 0, sg: 0, na: 720, sv: "6 pieces", g: 120, aliases: ["chicken nuggets 6pc", "mcnuggets 6"], cat: "Chicken", ctry: "India" },
  { name: "Chicken McNuggets (9 pc)", canonical: "mcdonald's chicken nuggets 9", cal: 405, p: 23, c: 23, f: 26, fb: 0, sg: 0, na: 1080, sv: "9 pieces", g: 180, aliases: ["chicken nuggets 9pc", "mcnuggets 9"], cat: "Chicken", ctry: "India" },
  { name: "Regular Fries", canonical: "mcdonald's regular fries", cal: 283, p: 4, c: 36, f: 14, fb: 2, sg: 1, na: 180, sv: "1 regular", g: 100, aliases: ["regular fries mcd", "mcd fries regular"], cat: "Sides", ctry: "India" },
  { name: "Medium Fries", canonical: "mcdonald's medium fries", cal: 383, p: 5, c: 48, f: 19, fb: 3, sg: 1, na: 240, sv: "1 medium", g: 135, aliases: ["medium fries mcd"], cat: "Sides", ctry: "India" },
  { name: "Large Fries", canonical: "mcdonald's large fries", cal: 514, p: 7, c: 65, f: 26, fb: 4, sg: 2, na: 350, sv: "1 large", g: 180, aliases: ["large fries mcd"], cat: "Sides", ctry: "India" },
  { name: "Hot Cake with Maple Syrup", canonical: "mcdonald's hot cake maple syrup", cal: 478, p: 8, c: 64, f: 22, fb: 1, sg: 28, na: 560, sv: "1 order", g: 200, aliases: ["hot cake mcd", "hotcake maple syrup"], cat: "Breakfast", ctry: "India" },
  { name: "Hash Brown", canonical: "mcdonald's hash brown", cal: 140, p: 2, c: 14, f: 9, fb: 1, sg: 1, na: 310, sv: "1 piece", g: 50, aliases: ["hash brown mcd"], cat: "Breakfast", ctry: "India" },
  { name: "Veg Supreme McMuffin", canonical: "mcdonald's veg supreme mcmuffin", cal: 329, p: 10, c: 34, f: 18, fb: 3, sg: 3, na: 680, sv: "1 sandwich", g: 150, aliases: ["veg supreme mcmuffin", "veg mcmuffin"], cat: "Breakfast", ctry: "India" },
  { name: "McSwirl Butter", canonical: "mcdonald's mcswirl butter", cal: 212, p: 4, c: 26, f: 11, fb: 0, sg: 18, na: 100, sv: "1 swirl", g: 100, aliases: ["mcswirl butter", "mc swirl butter"], cat: "Desserts", ctry: "India" },
  { name: "Soft Serve Cone", canonical: "mcdonald's soft serve cone", cal: 150, p: 4, c: 22, f: 5, fb: 0, sg: 18, na: 80, sv: "1 cone", g: 100, aliases: ["soft serve cone mcd", "ice cream cone mcd"], cat: "Desserts", ctry: "India" },
  { name: "Brownie with Hot Fudge", canonical: "mcdonald's brownie hot fudge", cal: 410, p: 6, c: 52, f: 20, fb: 2, sg: 32, na: 200, sv: "1 serving", g: 150, aliases: ["brownie hot fudge mcd", "mcd brownie fudge"], cat: "Desserts", ctry: "India" },
];

// ── EATFIT (Indian healthy chain) ──
const eatfit = {
  brand: "EatFit",
  country: "India",
  aliases: ["eatfit", "eat fit", "eat.fit"],
  cuisine: "Indian Healthy Food",
  items: [
    { name: "Grilled Chicken Bowl", canonical: "eatfit grilled chicken bowl", cal: 380, p: 35, c: 32, f: 12, fb: 5, sg: 3, na: 680, sv: "1 bowl", g: 300, aliases: ["grilled chicken bowl eatfit", "chicken bowl eatfit"], cat: "Bowls", ctry: "India" },
    { name: "Paneer Tikka Bowl", canonical: "eatfit paneer tikka bowl", cal: 420, p: 28, c: 34, f: 18, fb: 4, sg: 4, na: 720, sv: "1 bowl", g: 300, aliases: ["paneer tikka bowl eatfit", "paneer bowl eatfit"], cat: "Bowls", ctry: "India" },
    { name: "Egg White Omelette", canonical: "eatfit egg white omelette", cal: 180, p: 24, c: 4, f: 8, fb: 1, sg: 1, na: 450, sv: "1 serving", g: 200, aliases: ["egg white omelette eatfit"], cat: "Breakfast", ctry: "India" },
    { name: "Multigrain Wrap", canonical: "eatfit multigrain wrap", cal: 340, p: 22, c: 38, f: 12, fb: 6, sg: 3, na: 580, sv: "1 wrap", g: 220, aliases: ["multigrain wrap eatfit", "healthy wrap eatfit"], cat: "Wraps", ctry: "India" },
    { name: "Grilled Fish with Rice", canonical: "eatfit grilled fish rice", cal: 410, p: 36, c: 40, f: 12, fb: 3, sg: 2, na: 620, sv: "1 plate", g: 320, aliases: ["grilled fish rice eatfit"], cat: "Meals", ctry: "India" },
    { name: "Quinoa Salad Bowl", canonical: "eatfit quinoa salad bowl", cal: 290, p: 14, c: 38, f: 10, fb: 8, sg: 4, na: 480, sv: "1 bowl", g: 280, aliases: ["quinoa salad eatfit", "quinoa bowl eatfit"], cat: "Bowls", ctry: "India" },
    { name: "Moong Dal Chilla", canonical: "eatfit moong dal chilla", cal: 220, p: 16, c: 24, f: 8, fb: 6, sg: 2, na: 380, sv: "2 pieces", g: 180, aliases: ["moong dal chilla eatfit", "chilla eatfit"], cat: "Breakfast", ctry: "India" },
    { name: "Chicken Salad", canonical: "eatfit chicken salad", cal: 260, p: 30, c: 12, f: 10, fb: 5, sg: 3, na: 520, sv: "1 bowl", g: 250, aliases: ["chicken salad eatfit"], cat: "Bowls", ctry: "India" },
    { name: "Smoothie Bowl", canonical: "eatfit smoothie bowl", cal: 310, p: 12, c: 48, f: 8, fb: 6, sg: 22, na: 120, sv: "1 bowl", g: 280, aliases: ["smoothie bowl eatfit"], cat: "Bowls", ctry: "India" },
    { name: "Grilled Chicken Sandwich", canonical: "eatfit grilled chicken sandwich", cal: 340, p: 28, c: 32, f: 10, fb: 4, sg: 3, na: 600, sv: "1 sandwich", g: 220, aliases: ["grilled chicken sandwich eatfit"], cat: "Sandwiches", ctry: "India" },
    { name: "Paneer Sandwich", canonical: "eatfit paneer sandwich", cal: 360, p: 22, c: 34, f: 14, fb: 4, sg: 4, na: 580, sv: "1 sandwich", g: 220, aliases: ["paneer sandwich eatfit"], cat: "Sandwiches", ctry: "India" },
    { name: "Protein Lassi", canonical: "eatfit protein lassi", cal: 160, p: 12, c: 20, f: 4, fb: 1, sg: 14, na: 60, sv: "1 glass", g: 250, aliases: ["protein lassi eatfit"], cat: "Beverages", ctry: "India" },
  ]
};

// ── MAINLAND CHINA (Indian Chinese chain) ──
const mainlandChina = {
  brand: "Mainland China",
  country: "India",
  aliases: ["mainland china", "main land china"],
  cuisine: "Indian Chinese",
  items: [
    { name: "Veg Manchow Soup", canonical: "mainland china veg manchow soup", cal: 120, p: 4, c: 18, f: 4, fb: 2, sg: 2, na: 680, sv: "1 bowl", g: 200, aliases: ["manchow soup mainland china"], cat: "Soups", ctry: "India" },
    { name: "Chicken Wanton Soup", canonical: "mainland china chicken wanton soup", cal: 180, p: 14, c: 16, f: 6, fb: 1, sg: 2, na: 720, sv: "1 bowl", g: 220, aliases: ["wanton soup mainland china"], cat: "Soups", ctry: "India" },
    { name: "Veg Spring Rolls (4 pc)", canonical: "mainland china veg spring rolls", cal: 280, p: 6, c: 34, f: 14, fb: 3, sg: 2, na: 480, sv: "4 pieces", g: 160, aliases: ["spring rolls mainland china", "veg spring roll mainland china"], cat: "Starters", ctry: "India" },
    { name: "Chicken Spring Rolls (4 pc)", canonical: "mainland china chicken spring rolls", cal: 320, p: 18, c: 28, f: 16, fb: 2, sg: 2, na: 560, sv: "4 pieces", g: 170, aliases: ["chicken spring roll mainland china"], cat: "Starters", ctry: "India" },
    { name: "Hakka Noodles (Veg)", canonical: "mainland china hakka noodles veg", cal: 380, p: 10, c: 56, f: 14, fb: 3, sg: 3, na: 680, sv: "1 plate", g: 300, aliases: ["veg hakka noodles mainland china"], cat: "Noodles", ctry: "India" },
    { name: "Hakka Noodles (Chicken)", canonical: "mainland china hakka noodles chicken", cal: 440, p: 22, c: 52, f: 16, fb: 2, sg: 3, na: 760, sv: "1 plate", g: 310, aliases: ["chicken hakka noodles mainland china"], cat: "Noodles", ctry: "India" },
    { name: "Veg Fried Rice", canonical: "mainland china veg fried rice", cal: 360, p: 8, c: 58, f: 12, fb: 2, sg: 2, na: 620, sv: "1 plate", g: 300, aliases: ["veg fried rice mainland china"], cat: "Rice", ctry: "India" },
    { name: "Chicken Fried Rice", canonical: "mainland china chicken fried rice", cal: 420, p: 20, c: 52, f: 14, fb: 1, sg: 2, na: 720, sv: "1 plate", g: 310, aliases: ["chicken fried rice mainland china"], cat: "Rice", ctry: "India" },
    { name: "Chilli Chicken (Dry)", canonical: "mainland china chilli chicken dry", cal: 340, p: 28, c: 18, f: 18, fb: 1, sg: 4, na: 820, sv: "1 plate", g: 220, aliases: ["chilli chicken mainland china", "dry chilli chicken mainland china"], cat: "Starters", ctry: "India" },
    { name: "Chilli Paneer (Dry)", canonical: "mainland china chilli paneer dry", cal: 310, p: 16, c: 22, f: 18, fb: 2, sg: 4, na: 720, sv: "1 plate", g: 210, aliases: ["chilli paneer mainland china"], cat: "Starters", ctry: "India" },
    { name: "Manchurian (Veg)", canonical: "mainland china veg manchurian", cal: 300, p: 6, c: 36, f: 16, fb: 3, sg: 5, na: 780, sv: "6 pieces", g: 200, aliases: ["veg manchurian mainland china", "manchurian mainland china"], cat: "Starters", ctry: "India" },
    { name: "Manchurian (Chicken)", canonical: "mainland china chicken manchurian", cal: 360, p: 22, c: 28, f: 18, fb: 1, sg: 4, na: 860, sv: "6 pieces", g: 210, aliases: ["chicken manchurian mainland china"], cat: "Starters", ctry: "India" },
    { name: "Schezwan Noodles", canonical: "mainland china schezwan noodles", cal: 420, p: 12, c: 54, f: 18, fb: 3, sg: 4, na: 780, sv: "1 plate", g: 300, aliases: ["schezwan noodles mainland china"], cat: "Noodles", ctry: "India" },
    { name: "Dim Sum (Chicken, 6 pc)", canonical: "mainland china dim sum chicken", cal: 240, p: 20, c: 20, f: 8, fb: 1, sg: 1, na: 520, sv: "6 pieces", g: 180, aliases: ["chicken dim sum mainland china", "dim sum mainland china"], cat: "Starters", ctry: "India" },
    { name: "Dim Sum (Veg, 6 pc)", canonical: "mainland china dim sum veg", cal: 200, p: 8, c: 28, f: 6, fb: 3, sg: 2, na: 480, sv: "6 pieces", g: 180, aliases: ["veg dim sum mainland china"], cat: "Starters", ctry: "India" },
  ]
};

// ── ADD NEW ITEMS TO EXISTING BRANDS ──
function addItemsToBrand(brandName, items) {
  const brand = findBrand(brandName);
  if (!brand) { console.warn(`  ⚠ Brand "${brandName}" not found`); return 0; }
  let count = 0;
  for (const item of items) {
    if (!hasItem(brand, item.canonical)) {
      brand.items.push(item);
      count++;
    }
  }
  return count;
}

// ── ADD NEW BRAND ──
function addNewBrand(brand) {
  if (findBrand(brand.brand)) {
    console.warn(`  ⚠ Brand "${brand.brand}" already exists — skipping`);
    return 0;
  }
  db.push(brand);
  return brand.items.length;
}

// ── Execute ──
console.log('--- Adding verified nutrition data ---\n');

// Add new chains
console.log('New chains:');
for (const brand of [shakeShack, jollibee, innout, eatfit, mainlandChina]) {
  const added = addNewBrand(brand);
  console.log(`  ✓ ${brand.brand}: ${added} items`);
}

// Expand existing brands
console.log('\nExpanding existing brands:');
const mcdAdded = addItemsToBrand("McDonald's", mcdonaldsExpanded);
console.log(`  ✓ McDonald's: +${mcdAdded} items (India-specific)`);

// ── Write back ──
fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
console.log(`\n✅ Done! Total brands: ${db.length}`);

// Print summary
let totalItems = 0;
for (const b of db) totalItems += b.items.length;
console.log(`Total items: ${totalItems}`);
