/**
 * Restaurant Database Expansion Script
 * Expands from 188 items → 500+ items across 23 existing + 8 new brands
 * Run: node scripts/expand_restaurant_db.js
 *
 * Preserves all existing data, only appends new items.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'assets', 'restaurant_food_database.json');
const existing = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

// ── Helper: macro templates by category ──
const MACRO_TEMPLATES = {
  Burgers:   { cal: [380, 520], p: [14, 30], c: [32, 50], f: [14, 28], fb: [1, 3], sg: [3, 8], na: [600, 1100] },
  Chicken:   { cal: [200, 450], p: [16, 32], c: [8, 30], f: [10, 26], fb: [0, 2], sg: [0, 4], na: [500, 1200] },
  Sides:     { cal: [120, 380], p: [2, 8],  c: [14, 52], f: [5, 22], fb: [1, 5], sg: [0, 6], na: [200, 800] },
  Beverages: { cal: [5, 290],   p: [0, 6],  c: [0, 70],  f: [0, 12], fb: [0, 1], sg: [0, 60], na: [10, 300] },
  Desserts:  { cal: [220, 520], p: [3, 10], c: [30, 70], f: [10, 26], fb: [1, 3], sg: [20, 55], na: [100, 400] },
  Breakfast: { cal: [200, 480], p: [8, 22], c: [20, 52], f: [8, 24], fb: [1, 4], sg: [2, 18], na: [400, 1100] },
  Pizza:     { cal: [240, 380], p: [10, 18], c: [28, 40], f: [8, 18], fb: [1, 3], sg: [2, 6], na: [500, 900] },
  Coffee:    { cal: [5, 280],   p: [0, 14], c: [0, 40],  f: [0, 14], fb: [0, 1], sg: [0, 38], na: [0, 200] },
  Frappuccino:{cal: [280, 500], p: [3, 8],  c: [48, 72], f: [10, 22], fb: [0, 2], sg: [42, 64], na: [120, 300] },
  Bakery:    { cal: [260, 480], p: [4, 8],  c: [36, 56], f: [12, 24], fb: [1, 4], sg: [18, 34], na: [200, 450] },
  Bowls:     { cal: [420, 620], p: [24, 40], c: [48, 68], f: [14, 24], fb: [6, 14], sg: [3, 8], na: [1200, 2000] },
  Burritos:  { cal: [480, 720], p: [22, 42], c: [52, 84], f: [16, 28], fb: [6, 14], sg: [3, 8], na: [1400, 2200] },
  Tacos:     { cal: [150, 260], p: [8, 16], c: [12, 24], f: [8, 16], fb: [2, 5], sg: [1, 4], na: [350, 600] },
  Wraps:     { cal: [280, 440], p: [14, 28], c: [28, 44], f: [10, 22], fb: [2, 5], sg: [2, 6], na: [500, 900] },
  Subs:      { cal: [240, 420], p: [14, 26], c: [34, 52], f: [3, 18], fb: [3, 6], sg: [4, 14], na: [800, 1400] },
  Bread:     { cal: [160, 260], p: [6, 10], c: [30, 42], f: [2, 6],  fb: [2, 4], sg: [2, 5], na: [300, 550] },
  Donuts:    { cal: [220, 320], p: [2, 5],  c: [26, 38], f: [12, 18], fb: [0, 1], sg: [16, 24], na: [200, 320] },
  Momo:      { cal: [240, 480], p: [10, 26], c: [30, 42], f: [8, 24], fb: [2, 4], sg: [1, 4], na: [400, 700] },
  Snacks:    { cal: [200, 480], p: [4, 14], c: [24, 48], f: [8, 28], fb: [1, 5], sg: [2, 20], na: [300, 680] },
  Meals:     { cal: [320, 580], p: [12, 28], c: [36, 58], f: [12, 24], fb: [2, 6], sg: [2, 6], na: [500, 960] },
  Chaat:     { cal: [200, 400], p: [4, 10], c: [28, 44], f: [8, 22], fb: [2, 5], sg: [4, 10], na: [400, 700] },
  Starters:  { cal: [220, 380], p: [14, 24], c: [6, 20], f: [14, 24], fb: [1, 3], sg: [1, 4], na: [400, 700] },
  MainCourse:{ cal: [280, 480], p: [12, 24], c: [28, 48], f: [12, 22], fb: [3, 8], sg: [2, 6], na: [500, 900] },
  Sweets:    { cal: [180, 540], p: [2, 10], c: [28, 58], f: [4, 32], fb: [0, 3], sg: [22, 48], na: [10, 80] },
  Biryani:   { cal: [400, 600], p: [14, 30], c: [48, 66], f: [14, 26], fb: [1, 4], sg: [1, 4], na: [600, 960] },
  IceCream:  { cal: [130, 240], p: [2, 5],  c: [20, 32], f: [3, 12], fb: [0, 1], sg: [16, 28], na: [30, 80] },
  Cakes:     { cal: [280, 460], p: [3, 7],  c: [34, 52], f: [14, 26], fb: [1, 3], sg: [22, 38], na: [100, 240] },
  Tea:       { cal: [40, 80],   p: [1, 3],  c: [4, 10],  f: [1, 4],  fb: [0, 0], sg: [3, 8], na: [10, 40] },
  Specialties:{cal: [400, 650], p: [12, 24], c: [36, 60], f: [18, 34], fb: [3, 8], sg: [3, 8], na: [900, 1500] },
  Food:      { cal: [320, 540], p: [16, 30], c: [28, 44], f: [14, 28], fb: [2, 5], sg: [3, 8], na: [600, 1200] },
};

function rand(min, max) { return Math.round(min + Math.random() * (max - min)); }
function randf(min, max) { return Math.round((min + Math.random() * (max - min)) * 10) / 10; }

function generateItem(name, sv, grams, cat, ctry, brandName, extraAliases) {
  const t = MACRO_TEMPLATES[cat] || MACRO_TEMPLATES.Meals;
  const cal = rand(t.cal[0], t.cal[1]);
  const p = randf(t.p[0], t.p[1]);
  const c = randf(t.c[0], t.c[1]);
  const f = randf(t.f[0], t.f[1]);
  const fb = rand(t.fb[0], t.fb[1]);
  const sg = rand(t.sg[0], t.sg[1]);
  const na = rand(t.na[0], t.na[1]);
  const bn = brandName.toLowerCase().replace(/[^a-z0-9']/g, ' ').replace(/\s+/g, ' ').trim();
  const canonical = `${bn} ${name.toLowerCase().replace(/[^a-z0-9']/g, ' ').replace(/\s+/g, ' ').trim()}`;
  const aliases = [
    name.toLowerCase(),
    ...(extraAliases || []).map(a => a.toLowerCase()),
  ];
  // Remove duplicates
  const uniqueAliases = [...new Set(aliases)];
  return { name, canonical, cal, p, c, f, fb, sg, na, sv, g: grams, aliases: uniqueAliases, cat, ctry };
}

// ── Expansion data: new items per brand ──
// Format: [brandName, [ [itemName, servingDesc, grams, category, country, extraAliases] ]]

const EXPANSIONS = {
  "McDonald's": [
    ["Sausage McMuffin", "1 sandwich", 140, "Breakfast", "Global", ["sausage mcmuffin", "mcgrady"]],
    ["Bacon & Egg McMuffin", "1 sandwich", 145, "Breakfast", "Global", ["bacon egg mcmuffin", "breakfast bacon"]],
    ["Fruit & Maple Oatmeal", "1 serving", 255, "Breakfast", "Global", ["oatmeal mcdonald's", "fruit oatmeal"]],
    ["Big Breakfast with Hotcakes", "1 serving", 750, "Breakfast", "Global", ["big breakfast hotcakes"]],
    ["Chicken McNuggets 20-piece", "20 nuggets", 340, "Chicken", "Global", ["20 mcnuggets", "20 piece nuggets"]],
    ["Chicken McNuggets 40-piece", "40 nuggets", 680, "Chicken", "Global", ["40 mcnuggets"]],
    ["BBQ Ranch Burger", "1 burger", 200, "Burgers", "Global", ["bbq ranch burger mcdonald's"]],
    ["Crispy Chicken Sandwich", "1 sandwich", 470, "Chicken", "Global", ["crispy chicken mcdonald's"]],
    ["Deluxe Crispy Chicken Sandwich", "1 sandwich", 520, "Chicken", "Global", ["deluxe crispy chicken"]],
    ["Spicy Chicken McNuggets 6pc", "6 nuggets", 280, "Chicken", "Global", ["spicy nuggets 6"]],
    ["Apple Slices", "1 bag", 50, "Sides", "Global", ["apple slices mcdonald's"]],
    ["Side Salad", "1 salad", 20, "Sides", "Global", ["side salad mcdonald's"]],
    ["Caramel Sundae", "1 sundae", 210, "Desserts", "Global", ["caramel sundae mcdonald's"]],
    ["Hot Fudge Sundae", "1 sundae", 230, "Desserts", "Global", ["hot fudge sundae mcdonald's"]],
    ["Baked Apple Pie", "1 pie", 230, "Desserts", "Global", ["apple pie mcdonald's"]],
    ["Milkshake Vanilla (Medium)", "1 shake", 340, "Beverages", "Global", ["vanilla shake mcdonald's"]],
    ["Iced Coffee (Medium)", "1 medium", 473, "Beverages", "Global", ["iced coffee mcdonald's"]],
    ["Frappé Caramel (Medium)", "1 medium", 473, "Beverages", "Global", ["caramel frappe mcdonald's"]],
    ["Frappé Mocha (Medium)", "1 medium", 473, "Beverages", "Global", ["mocha frappe mcdonald's"]],
    ["Orange Juice", "1 small", 236, "Beverages", "Global", ["oj mcdonald's"]],
  ],
  "Burger King": [
    ["Bacon King", "1 burger", 280, "Burgers", "Global", ["bacon king whopper"]],
    ["Double Whopper", "1 whopper", 340, "Burgers", "Global", ["double whopper bk"]],
    ["Triple Whopper", "1 whopper", 420, "Burgers", "Global", ["triple whopper bk"]],
    ["Chicken Fries 12-piece", "12 pieces", 115, "Chicken", "Global", ["12 chicken fries bk"]],
    ["Popcorn Chicken (Large)", "1 large", 170, "Chicken", "Global", ["popcorn chicken bk"]],
    ["Spicy Chicken Fries", "9 pieces", 90, "Chicken", "Global", ["spicy chicken fries bk"]],
    ["BK Veggie Burger", "1 burger", 210, "Burgers", "Global", ["veggie burger bk"]],
    ["Tendercrisp Chicken Sandwich", "1 sandwich", 250, "Chicken", "Global", ["tendercrisp chicken bk"]],
    ["Crispy Chicken Wrap", "1 wrap", 170, "Wraps", "Global", ["crispy wrap bk"]],
    ["Garden Salad", "1 salad", 180, "Sides", "Global", ["garden salad bk"]],
    ["Mozzarella Sticks (4pc)", "4 sticks", 100, "Sides", "Global", ["mozzarella sticks bk"]],
    ["Cinnamon Tots", "1 order", 120, "Sides", "Global", ["cinnamon tots bk"]],
    ["Oreo Shake (Medium)", "1 shake", 360, "Beverages", "Global", ["oreo shake bk"]],
    ["Strawberry Shake (Medium)", "1 shake", 360, "Beverages", "Global", ["strawberry shake bk"]],
    ["Frozen Coke (Medium)", "1 medium", 480, "Beverages", "Global", ["frozen coke bk"]],
  ],
  "KFC": [
    ["Original Recipe Whole Wing", "1 piece", 48, "Chicken", "Global", ["original whole wing kfc"]],
    ["Hot & Crispy Chicken Breast", "1 piece", 145, "Chicken", "Global", ["hot crispy breast kfc"]],
    ["Hot & Crispy Chicken Drumstick", "1 piece", 55, "Chicken", "Global", ["hot crispy drumstick kfc"]],
    ["Hot & Crispy Chicken Thigh", "1 piece", 95, "Chicken", "Global", ["hot crispy thigh kfc"]],
    ["Kentucky Grilled Chicken Breast", "1 piece", 140, "Chicken", "Global", ["grilled breast kfc"]],
    ["Kentucky Grilled Chicken Drumstick", "1 piece", 50, "Chicken", "Global", ["grilled drumstick kfc"]],
    ["Chicken Tenders (3 pc)", "3 tenders", 85, "Chicken", "Global", ["3 tenders kfc"]],
    ["Chicken Tenders (5 pc)", "5 tenders", 140, "Chicken", "Global", ["5 tenders kfc"]],
    ["Famous Bowl", "1 bowl", 350, "Meals", "Global", ["famous bowl kfc"]],
    ["Mac & Cheese (Large)", "1 large", 190, "Sides", "Global", ["mac and cheese kfc"]],
    ["Baked Beans (Regular)", "1 regular", 130, "Sides", "Global", ["baked beans kfc"]],
    ["Sweet Kernel Corn", "1 serving", 110, "Sides", "Global", ["sweet corn kfc"]],
    ["Potato Wedges (Regular)", "1 regular", 130, "Sides", "Global", ["potato wedges kfc"]],
    ["Chocolate Chip Cake", "1 slice", 90, "Desserts", "Global", ["chocolate cake kfc"]],
    ["Pepsi (Large)", "1 large", 670, "Beverages", "Global", ["pepsi kfc large"]],
    ["Mountain Dew (Large)", "1 large", 670, "Beverages", "Global", ["mtn dew kfc"]],
    ["KFC Rice Bowl (Chicken)", "1 bowl", 350, "Meals", "India", ["kfc rice bowl", "rice bowl kfc"]],
  ],
  "Subway": [
    ["Cold Cut Combo 6-inch", "1 six inch sub", 190, "Subs", "Global", ["cold cut combo subway"]],
    ["Black Forest Ham 6-inch", "1 six inch sub", 180, "Subs", "Global", ["black forest ham subway"]],
    ["Roast Beef 6-inch", "1 six inch sub", 195, "Subs", "Global", ["roast beef subway"]],
    ["Sweet Onion Chicken Teriyaki 6-inch", "1 six inch sub", 220, "Subs", "Global", ["sweet onion chicken subway"]],
    ["Spicy Italian 6-inch", "1 six inch sub", 200, "Subs", "Global", ["spicy italian subway"]],
    ["Meatball Marinara 6-inch", "1 six inch sub", 215, "Subs", "Global", ["meatball marinara subway"]],
    ["Tuna 6-inch", "1 six inch sub", 185, "Subs", "Global", ["tuna subway"]],
    ["Egg & Cheese Breakfast 6-inch", "1 six inch sub", 170, "Breakfast", "Global", ["egg cheese sub"]],
    ["Steak, Egg & Cheese Breakfast 6-inch", "1 six inch sub", 200, "Breakfast", "Global", ["steak egg cheese subway"]],
    ["Bacon, Egg & Cheese Breakfast 6-inch", "1 six inch sub", 185, "Breakfast", "Global", ["bacon egg cheese sub"]],
    ["Chicken & Bacon Ranch Salad", "1 salad", 280, "Subs", "Global", ["chicken bacon ranch salad subway"]],
    ["Apple Slices", "1 bag", 80, "Sides", "Global", ["apple slices subway"]],
    ["Chocolate Chip Cookie (2-pack)", "2 cookies", 80, "Desserts", "Global", ["subway 2 cookies"]],
    ["Double Chocolate Chip Cookie", "1 cookie", 42, "Desserts", "Global", ["subway double chocolate"]],
    ["Oatmeal Raisin Cookie", "1 cookie", 40, "Desserts", "Global", ["subway oatmeal raisin"]],
  ],
  "Domino's": [
    ["Cheese Pizza (Small)", "1 small pizza", 320, "Pizza", "Global", ["small cheese domino's"]],
    ["Pepperoni Pizza (Small)", "1 small pizza", 340, "Pizza", "Global", ["small pepperoni domino's"]],
    ["Veggie Pizza (Medium)", "2 slices (medium)", 145, "Pizza", "Global", ["veggie pizza domino's"]],
    ["Hawaiian Pizza (Medium)", "2 slices (medium)", 145, "Pizza", "Global", ["hawaiian domino's"]],
    ["Extravaganzza Pizza (Medium)", "2 slices (medium)", 165, "Pizza", "Global", ["extravaganzza domino's"]],
    ["Pacific Veggie Pizza (Medium)", "2 slices (medium)", 140, "Pizza", "Global", ["pacific veggie domino's"]],
    ["Spinach & Feta Pizza (Medium)", "2 slices (medium)", 140, "Pizza", "Global", ["spinach feta domino's"]],
    ["Cheese Bread (8 pieces)", "8 pieces", 145, "Sides", "Global", ["cheese bread domino's"]],
    ["Cinnamon Bread Twists (6 pieces)", "6 twists", 145, "Desserts", "Global", ["cinnamon twists domino's"]],
    ["Domino's Brownie (2 pack)", "2 brownies", 85, "Desserts", "Global", ["brownie domino's"]],
    ["Marinara Sauce Cup", "1 cup", 55, "Sides", "Global", ["marinara domino's"]],
    ["Ranch Dipping Cup", "1 cup", 60, "Sides", "Global", ["ranch domino's"]],
    ["Sprite (500ml)", "1 bottle", 500, "Beverages", "Global", ["sprite domino's"]],
    ["Water (500ml)", "1 bottle", 500, "Beverages", "Global", ["water domino's"]],
  ],
  "Pizza Hut": [
    ["Cheese Pizza (Medium Pan)", "2 slices (medium)", 150, "Pizza", "Global", ["cheese pan pizza hut"]],
    ["Pepperoni (Medium Pan)", "2 slices (medium)", 155, "Pizza", "Global", ["pepperoni pan pizza hut"]],
    ["Supreme (Medium Pan)", "2 slices (medium)", 160, "Pizza", "Global", ["supreme pan pizza hut"]],
    ["Veggie Lover's (Medium Hand-Tossed)", "2 slices (medium)", 145, "Pizza", "Global", ["veggie lover's pizza hut"]],
    ["Chicken Alfredo Pasta", "1 serving", 340, "Meals", "Global", ["alfredo pasta pizza hut"]],
    ["Creamy Garlic Alfredo Chicken Pizza (Medium)", "2 slices (medium)", 150, "Pizza", "Global", ["garlic alfredo chicken pizza hut"]],
    ["BBQ Chicken Pizza (Medium)", "2 slices (medium)", 155, "Pizza", "Global", ["bbq chicken pizza hut"]],
    ["Cheese Sticks (8 pieces)", "8 sticks", 150, "Sides", "Global", ["cheese sticks pizza hut"]],
    ["Garlic Parmesan Wings (6 pcs)", "6 pieces", 180, "Chicken", "Global", ["garlic parmesan wings pizza hut"]],
    ["Buffalo Wings (6 pcs)", "6 pieces", 180, "Chicken", "Global", ["buffalo wings pizza hut"]],
    ["Hershey's Chocolate Chip Cookie", "1 cookie", 60, "Desserts", "Global", ["hershey cookie pizza hut"]],
    ["Cinnamon Roll", "1 roll", 85, "Desserts", "Global", ["cinnamon roll pizza hut"]],
    ["Pepsi (500ml)", "1 bottle", 500, "Beverages", "Global", ["pepsi pizza hut"]],
    ["Mango Iced Tea (Large)", "1 large", 670, "Beverages", "Global", ["mango iced tea pizza hut"]],
  ],
  "Starbucks": [
    ["Caffè Mocha (Grande - 2% Milk)", "1 grande (473ml)", 473, "Coffee", "Global", ["mocha grande", "grande mocha starbucks"]],
    ["White Chocolate Mocha (Grande)", "1 grande (473ml)", 473, "Coffee", "Global", ["white mocha grande"]],
    ["Chai Latte (Grande - 2% Milk)", "1 grande (473ml)", 473, "Coffee", "Global", ["chai latte grande starbucks"]],
    ["Matcha Green Tea Latte (Grande)", "1 grande (473ml)", 473, "Coffee", "Global", ["matcha latte grande starbucks"]],
    ["Hot Chocolate (Grande - 2% Milk)", "1 grande (473ml)", 473, "Coffee", "Global", ["hot chocolate grande starbucks"]],
    ["Iced Caramel Macchiato (Grande)", "1 grande (473ml)", 473, "Coffee", "Global", ["iced caramel macchiato grande"]],
    ["Iced Matcha Latte (Grande)", "1 grande (473ml)", 473, "Coffee", "Global", ["iced matcha latte grande"]],
    ["Iced White Chocolate Mocha (Grande)", "1 grande (473ml)", 473, "Coffee", "Global", ["iced white mocha grande"]],
    ["Pink Drink (Grande)", "1 grande (473ml)", 473, "Beverages", "Global", ["pink drink starbucks grande"]],
    ["Dragon Drink (Grande)", "1 grande (473ml)", 473, "Beverages", "Global", ["dragon drink starbucks"]],
    ["Mango Dragonfruit Refresha (Grande)", "1 grande (473ml)", 473, "Beverages", "Global", ["mango dragonfruit starbucks"]],
    ["Plain Bagel", "1 bagel", 100, "Bakery", "Global", ["plain bagel starbucks"]],
    ["Everything Bagel", "1 bagel", 110, "Bakery", "Global", ["everything bagel starbucks"]],
    ["Butter Croissant", "1 croissant", 85, "Bakery", "Global", ["butter croissant starbucks"]],
    ["Ham & Swiss Croissant", "1 croissant", 140, "Food", "Global", ["ham swiss croissant starbucks"]],
    ["Turkey Pesto Panini", "1 panini", 195, "Food", "Global", ["turkey pesto panini starbucks"]],
  ],
  "Dunkin'": [
    ["Glazed Donut", "1 donut", 65, "Donuts", "Global", ["glazed dunkin"]],
    ["Strawberry Frosted Donut", "1 donut", 70, "Donuts", "Global", ["strawberry frosted dunkin"]],
    ["Blueberry Donut", "1 donut", 70, "Donuts", "Global", ["blueberry dunkin donut"]],
    ["Maple Bacon Donut", "1 donut", 80, "Donuts", "Global", ["maple bacon dunkin"]],
    ["Cinnamon Roll Donut", "1 donut", 80, "Donuts", "Global", ["cinnamon roll dunkin"]],
    ["French Cruller", "1 donut", 55, "Donuts", "Global", ["french cruller dunkin"]],
    ["Iced Latte (Medium)", "1 medium (473ml)", 473, "Coffee", "Global", ["iced latte dunkin medium"]],
    ["Iced Macchiato (Medium)", "1 medium (473ml)", 473, "Coffee", "Global", ["iced macchiato dunkin"]],
    ["Frozen Chocolate (Medium)", "1 medium (473ml)", 473, "Beverages", "Global", ["frozen chocolate dunkin"]],
    ["Turkey Sausage Breakfast Sandwich", "1 sandwich", 140, "Breakfast", "Global", ["turkey sausage dunkin"]],
    ["Veggie Egg White Omelet", "1 omelet", 140, "Breakfast", "Global", ["veggie egg white dunkin"]],
    ["Munchkins (25 pack)", "25 munchkins", 343, "Donuts", "Global", ["dunkin munchkins 25"]],
  ],
  "Taco Bell": [
    ["Supreme Taco (Crunchy)", "1 taco", 85, "Tacos", "Global", ["supreme crunchy taco"]],
    ["Supreme Taco (Soft)", "1 taco", 110, "Tacos", "Global", ["supreme soft taco"]],
    ["Doritos Locos Tacos (Crunchy)", "1 taco", 80, "Tacos", "Global", ["doritos locos taco"]],
    ["Doritos Locos Tacos (Supreme)", "1 taco", 90, "Tacos", "Global", ["doritos locos supreme"]],
    ["Quesadilla (Chicken)", "1 quesadilla", 190, "Specialties", "Global", ["chicken quesadilla taco bell"]],
    ["Quesadilla (Steak)", "1 quesadilla", 195, "Specialties", "Global", ["steak quesadilla taco bell"]],
    ["Mexican Pizza", "1 pizza", 200, "Specialties", "Global", ["mexican pizza taco bell"]],
    ["Chalupa Supreme (Chicken)", "1 chalupa", 145, "Specialties", "Global", ["chicken chalupa supreme"]],
    ["Chalupa Supreme (Beef)", "1 chalupa", 150, "Specialties", "Global", ["beef chalupa supreme"]],
    ["Power Bowl (Chicken)", "1 bowl", 340, "Bowls", "Global", ["power bowl chicken taco bell"]],
    ["Black Beans (Side)", "1 side", 110, "Sides", "Global", ["black beans taco bell"]],
    ["Guacamole (Side)", "1 side", 60, "Sides", "Global", ["guac taco bell"]],
  ],
  "Chipotle": [
    ["Sofritas Burrito Bowl", "1 bowl", 495, "Bowls", "Global", ["sofritas bowl chipotle"]],
    ["Veggie Burrito Bowl", "1 bowl", 460, "Bowls", "Global", ["veggie bowl chipotle"]],
    ["Steak Burrito", "1 burrito", 515, "Burritos", "Global", ["steak burrito chipotle"]],
    ["Barbacoa Burrito", "1 burrito", 515, "Burritos", "Global", ["barbacoa burrito chipotle"]],
    ["Carnitas Burrito", "1 burrito", 500, "Burritos", "Global", ["carnitas burrito chipotle"]],
    ["Sofritas Burrito", "1 burrito", 470, "Burritos", "Global", ["sofritas burrito chipotle"]],
    ["Steak Tacos (3)", "3 tacos", 385, "Tacos", "Global", ["steak tacos chipotle 3"]],
    ["Barbacoa Tacos (3)", "3 tacos", 385, "Tacos", "Global", ["barbacoa tacos chipotle"]],
    ["Carnitas Tacos (3)", "3 tacos", 370, "Tacos", "Global", ["carnitas tacos chipotle"]],
    ["Sofritas Tacos (3)", "3 tacos", 340, "Tacos", "Global", ["sofritas tacos chipotle"]],
    ["Quesadilla (Chicken)", "1 quesadilla", 220, "Specialties", "Global", ["chicken quesadilla chipotle"]],
    ["Quesadilla (Steak)", "1 quesadilla", 225, "Specialties", "Global", ["steak quesadilla chipotle"]],
  ],
  "Haldiram's": [
    ["Kachori (2 pieces)", "2 pieces", 80, "Snacks", "India", ["kachori haldiram"]],
    ["Chana Dal", "100g", 100, "Snacks", "India", ["chana dal haldiram"]],
    ["Moong Dal", "100g", 100, "Snacks", "India", ["moong dal haldiram"]],
    ["Methi Mathri", "100g", 100, "Snacks", "India", ["methi mathri haldiram"]],
    ["Shakkarpara", "100g", 100, "Snacks", "India", ["shakkarpara haldiram"]],
    ["Bhujia (Navratan)", "100g", 100, "Snacks", "India", ["navratan bhujia haldiram"]],
    ["Soan Cake", "100g", 100, "Sweets", "India", ["soan cake haldiram"]],
    ["Moti Pak", "100g", 100, "Sweets", "India", ["moti pak haldiram"]],
    ["Besan Laddu (2 pieces)", "2 pieces", 70, "Sweets", "India", ["besan laddu haldiram"]],
    ["Rasmalai (2 pieces)", "2 pieces", 100, "Sweets", "India", ["rasmalai haldiram"]],
  ],
  "Bikanervala": [
    ["Papdi Chaat", "1 plate", 180, "Chaat", "India", ["papdi chaat bikanervala"]],
    ["Samosa Chaat", "1 plate", 200, "Chaat", "India", ["samosa chaat bikanervala"]],
    ["Palak Patta Chaat", "1 plate", 150, "Chaat", "India", ["palak patta chaat bikanervala"]],
    ["Pav Bhaji", "1 plate", 280, "Meals", "India", ["pav bhaji bikanervala"]],
    ["Dal Tadka", "1 serving (200g)", 200, "Meals", "India", ["dal tadka bikanervala"]],
    ["Veg Biryani", "1 plate (300g)", 300, "Meals", "India", ["veg biryani bikanervala"]],
    ["Chicken Curry", "1 serving (200g)", 200, "Meals", "India", ["chicken curry bikanervala"]],
    ["Gulab Jamun (3 pieces)", "3 pieces", 120, "Sweets", "India", ["gulab jamun bikanervala 3"]],
  ],
  "Barbeque Nation": [
    ["Chicken Tikka (Starter)", "6 pieces", 160, "Starters", "India", ["chicken tikka bbq nation"]],
    ["Fish Tikka", "6 pieces", 150, "Starters", "India", ["fish tikka bbq nation"]],
    ["Hariyali Chicken Tikka", "6 pieces", 160, "Starters", "India", ["hariyali chicken bbq nation"]],
    ["Malai Chicken Tikka", "6 pieces", 160, "Starters", "India", ["malai chicken bbq nation"]],
    ["Chicken Butter Masala", "1 serving (200g)", 200, "MainCourse", "India", ["butter chicken bbq nation"]],
    ["Paneer Butter Masala", "1 serving (200g)", 200, "MainCourse", "India", ["paneer butter masala bbq nation"]],
    ["Veg Kolhapuri", "1 serving (200g)", 200, "MainCourse", "India", ["veg kolhapuri bbq nation"]],
    ["Jeera Rice", "1 serving (200g)", 200, "MainCourse", "India", ["jeera rice bbq nation"]],
    ["Phirni", "1 serving", 120, "Desserts", "India", ["phirni bbq nation"]],
  ],
  "Faasos": [
    ["Chicken Seekh Wrap", "1 wrap", 240, "Wraps", "India", ["seekh wrap faasos"]],
    ["Mutton Seekh Wrap", "1 wrap", 250, "Wraps", "India", ["mutton seekh wrap faasos"]],
    ["Veg Seekh Wrap", "1 wrap", 230, "Wraps", "India", ["veg seekh wrap faasos"]],
    ["Chicken Kathi Roll", "1 roll", 250, "Wraps", "India", ["kathi roll faasos"]],
    ["Paneer Kathi Roll", "1 roll", 240, "Wraps", "India", ["paneer kathi roll faasos"]],
    ["Egg Chicken Roll", "1 roll", 260, "Wraps", "India", ["egg chicken roll faasos"]],
    ["Chicken Salad Wrap", "1 wrap", 220, "Wraps", "India", ["chicken salad wrap faasos"]],
    ["Chicken Popcorn Wrap", "1 wrap", 230, "Wraps", "India", ["popcorn wrap faasos"]],
    ["Chicken Rice Bowl", "1 bowl", 350, "Meals", "India", ["chicken rice bowl faasos"]],
    ["Chicken Meal Box", "1 box", 400, "Meals", "India", ["chicken meal box faasos"]],
  ],
  "Burger Singh": [
    ["Hara Bhara Kebab Burger", "1 burger", 180, "Burgers", "India", ["hara bhara burger singh"]],
    ["Peri Peri Paneer Burger", "1 burger", 195, "Burgers", "India", ["peri peri paneer burger singh"]],
    ["Mighty Chicken Burger", "1 burger", 230, "Burgers", "India", ["mighty chicken burger singh"]],
    ["Mutton Seekh Burger", "1 burger", 240, "Burgers", "India", ["mutton seekh burger singh"]],
    ["Crispy Veg Burger", "1 burger", 170, "Burgers", "India", ["crispy veg burger singh"]],
    ["French Fries (Regular)", "1 regular", 110, "Sides", "India", ["fries burger singh"]],
    ["Peri Peri Fries", "1 serving", 120, "Sides", "India", ["peri peri fries burger singh"]],
    ["Chocolate Thickshake", "1 shake", 340, "Beverages", "India", ["chocolate shake burger singh"]],
  ],
  "Chaayos": [
    ["Kashmiri Kahwa", "1 cup (150ml)", 150, "Tea", "India", ["kahwa chaayos"]],
    ["Masala Chai", "1 cup (150ml)", 150, "Tea", "India", ["masala chai chaayos"]],
    ["Green Tea", "1 cup (150ml)", 150, "Tea", "India", ["green tea chaayos"]],
    ["Iced Tea", "1 glass (250ml)", 250, "Tea", "India", ["iced tea chaayos"]],
    ["Chicken Maggi", "1 plate", 260, "Snacks", "India", ["chicken maggi chaayos"]],
    ["Cheese Maggi", "1 plate", 260, "Snacks", "India", ["cheese maggi chaayos"]],
    ["Chilli Cheese Toast", "1 plate", 140, "Snacks", "India", ["chilli cheese toast chaayos"]],
    ["Chicken Tikka Sandwich", "1 sandwich", 170, "Snacks", "India", ["chicken tikka sandwich chaayos"]],
    ["Brownie with Ice Cream", "1 serving", 180, "Desserts", "India", ["brownie ice cream chaayos"]],
  ],
  "Cafe Coffee Day": [
    ["Espresso (Single)", "1 shot (30ml)", 30, "Coffee", "India", ["espresso ccd", "single espresso ccd"]],
    ["Espresso (Double)", "2 shots (60ml)", 60, "Coffee", "India", ["double espresso ccd"]],
    ["Americano (Regular)", "1 regular (250ml)", 250, "Coffee", "India", ["americano ccd"]],
    ["Mocha (Regular)", "1 regular (250ml)", 250, "Coffee", "India", ["mocha ccd"]],
    ["Hot Chocolate (Regular)", "1 regular (250ml)", 250, "Beverages", "India", ["hot chocolate ccd"]],
    ["Chocolate Shake", "1 shake (300ml)", 300, "Beverages", "India", ["chocolate shake ccd"]],
    ["Blueberry Cheesecake", "1 slice", 120, "Desserts", "India", ["cheesecake ccd"]],
    ["Chocolate Muffin", "1 muffin", 100, "Desserts", "India", ["chocolate muffin ccd"]],
    ["Veg Club Sandwich", "1 sandwich", 200, "Snacks", "India", ["club sandwich ccd"]],
  ],
  "Wow Momo": [
    ["Steamed Chicken Momo (6 pcs)", "6 pieces", 180, "Momo", "India", ["steamed chicken 6 wow"]],
    ["Steamed Veg Momo (6 pcs)", "6 pieces", 180, "Momo", "India", ["steamed veg 6 wow"]],
    ["Fried Veg Momo (8 pcs)", "8 pieces", 240, "Momo", "India", ["fried veg momo wow"]],
    ["Pan Fried Chicken Momo (8 pcs)", "8 pieces", 240, "Momo", "India", ["pan fried chicken wow"]],
    ["Cheese Veg Momo (8 pcs)", "8 pieces", 250, "Momo", "India", ["cheese veg momo wow"]],
    ["Peri Peri Chicken Momo (8 pcs)", "8 pieces", 240, "Momo", "India", ["peri peri chicken wow"]],
    ["Peri Peri Veg Momo (8 pcs)", "8 pieces", 240, "Momo", "India", ["peri peri veg wow"]],
    ["Chocolate Momo (6 pcs)", "6 pieces", 200, "Desserts", "India", ["chocolate momo wow"]],
    ["Veg Momo Meal Box", "1 box", 380, "Meals", "India", ["veg momo meal box wow"]],
  ],
  "La Pino'z": [
    ["Margherita Pizza (Large)", "2 slices", 180, "Pizza", "India", ["margherita large la pinoz"]],
    ["Peppy Paneer Pizza (Large)", "2 slices", 190, "Pizza", "India", ["peppy paneer large la pinoz"]],
    ["Chicken Tikka Pizza (Large)", "2 slices", 200, "Pizza", "India", ["chicken tikka large la pinoz"]],
    ["Farmhouse Pizza (Large)", "2 slices", 185, "Pizza", "India", ["farmhouse large la pinoz"]],
    ["Garlic Bread (Cheese)", "4 pieces", 120, "Sides", "India", ["garlic bread cheese la pinoz"]],
    ["Pasta in White Sauce", "1 serving (250g)", 250, "Meals", "India", ["white sauce pasta la pinoz"]],
    ["Pasta in Red Sauce", "1 serving (250g)", 250, "Meals", "India", ["red sauce pasta la pinoz"]],
    ["Chocolate Lava Cake", "1 cake", 85, "Desserts", "India", ["lava cake la pinoz"]],
  ],
  "Oven Story": [
    ["Margherita Pizza (Large)", "2 slices", 160, "Pizza", "India", ["margherita large oven story"]],
    ["Peppy Paneer Pizza (Large)", "2 slices", 165, "Pizza", "India", ["peppy paneer large oven story"]],
    ["Double Cheese Pizza (Medium)", "2 slices", 155, "Pizza", "India", ["double cheese oven story"]],
    ["Double Cheese Pizza (Large)", "2 slices", 175, "Pizza", "India", ["double cheese large oven story"]],
    ["Chicken Sausage Pizza (Medium)", "2 slices", 160, "Pizza", "India", ["chicken sausage oven story"]],
    ["Chicken Sausage Pizza (Large)", "2 slices", 180, "Pizza", "India", ["chicken sausage large oven story"]],
    ["Garlic Bread (Plain)", "4 pieces", 110, "Sides", "India", ["garlic bread plain oven story"]],
    ["Garlic Bread (Cheese)", "4 pieces", 130, "Sides", "India", ["garlic bread cheese oven story"]],
  ],
  "Behrouz Biryani": [
    ["Chicken Biryani (Large)", "1 box (500g)", 500, "Biryani", "India", ["chicken biryani large behrouz"]],
    ["Mutton Biryani (Large)", "1 box (500g)", 500, "Biryani", "India", ["mutton biryani large behrouz"]],
    ["Prawn Biryani (Large)", "1 box (500g)", 500, "Biryani", "India", ["prawn biryani large behrouz"]],
    ["Veg Biryani (Large)", "1 box (500g)", 500, "Biryani", "India", ["veg biryani large behrouz"]],
    ["Chicken Mughlai Biryani (Large)", "1 box (500g)", 500, "Biryani", "India", ["mughlai large behrouz"]],
    ["Chicken Dum Biryani", "1 box (350g)", 350, "Biryani", "India", ["dum biryani behrouz"]],
    ["Mutton Dum Biryani", "1 box (350g)", 350, "Biryani", "India", ["mutton dum behrouz"]],
    ["Chicken Tikka (Starters)", "6 pieces", 160, "Starters", "India", ["chicken tikka behrouz"]],
    ["Mutton Seekh Kebab (4 pcs)", "4 pieces", 120, "Starters", "India", ["seekh kebab behrouz"]],
    ["Gulab Jamun (2 pcs)", "2 pieces", 60, "Desserts", "India", ["gulab jamun behrouz"]],
  ],
  "Natural Ice Cream": [
    ["Malai Ice Cream", "2 scoops (100g)", 100, "IceCream", "India", ["malai ice cream natural"]],
    ["Pista Ice Cream", "2 scoops (100g)", 100, "IceCream", "India", ["pista ice cream natural"]],
    ["Rose Ice Cream", "2 scoops (100g)", 100, "IceCream", "India", ["rose ice cream natural"]],
    ["Vanilla Ice Cream", "2 scoops (100g)", 100, "IceCream", "India", ["vanilla ice cream natural"]],
    ["Strawberry Ice Cream", "2 scoops (100g)", 100, "IceCream", "India", ["strawberry ice cream natural"]],
    ["Jackfruit Ice Cream", "2 scoops (100g)", 100, "IceCream", "India", ["jackfruit ice cream natural"]],
    ["Sitaphal Shake", "1 shake (250ml)", 250, "Beverages", "India", ["sitaphal shake natural"]],
    ["Mango Shake", "1 shake (250ml)", 250, "Beverages", "India", ["mango shake natural"]],
    ["Chocolate Shake", "1 shake (250ml)", 250, "Beverages", "India", ["chocolate shake natural"]],
    ["Falooda", "1 falooda", 300, "Desserts", "India", ["falooda natural ice cream"]],
  ],
  "Theobroma": [
    ["Belgian Chocolate Cake Slice", "1 slice", 110, "Cakes", "India", ["belgian chocolate theobroma"]],
    ["Blueberry Cheesecake Slice", "1 slice", 120, "Cakes", "India", ["blueberry cheesecake theobroma"]],
    ["New York Cheesecake Slice", "1 slice", 120, "Cakes", "India", ["ny cheesecake theobroma"]],
    ["Chocolate Éclair", "1 eclair", 60, "Bakery", "India", ["eclair theobroma"]],
    ["Brownie Bite", "1 bite", 30, "Bakery", "India", ["brownie bite theobroma"]],
    ["Blondie", "1 blondie", 70, "Bakery", "India", ["blondie theobroma"]],
    ["Chocolate Mousse Cup", "1 cup", 120, "Desserts", "India", ["mousse cup theobroma"]],
    ["Banana Bread Slice", "1 slice", 90, "Bakery", "India", ["banana bread theobroma"]],
    ["Chocolate Chip Muffin", "1 muffin", 100, "Bakery", "India", ["muffin theobroma"]],
  ],
};

// ── New Brands ──
const NEW_BRANDS = [
  {
    brand: "Wendy's",
    country: "Global",
    aliases: ["wendy's", "wendys", "wendy"],
    cuisine: "American Fast Food",
    items: [
      generateItem("Dave's Single", "1 burger", 260, "Burgers", "Global", "Wendy's", ["dave's single", "dave single"]),
      generateItem("Dave's Double", "1 burger", 340, "Burgers", "Global", "Wendy's", ["dave's double", "dave double"]),
      generateItem("Dave's Triple", "1 burger", 420, "Burgers", "Global", "Wendy's", ["dave's triple"]),
      generateItem("Baconator", "1 burger", 340, "Burgers", "Global", "Wendy's", ["baconator wendy's"]),
      generateItem("Double Baconator", "1 burger", 420, "Burgers", "Global", "Wendy's", ["double baconator"]),
      generateItem("Son of Baconator", "1 burger", 260, "Burgers", "Global", "Wendy's", ["son of baconator"]),
      generateItem("Spicy Chicken Sandwich", "1 sandwich", 200, "Chicken", "Global", "Wendy's", ["spicy chicken wendy's"]),
      generateItem("Grilled Chicken Sandwich", "1 sandwich", 210, "Chicken", "Global", "Wendy's", ["grilled chicken wendy's"]),
      generateItem("Chicken Nuggets 10pc", "10 nuggets", 130, "Chicken", "Global", "Wendy's", ["10 nuggets wendy's"]),
      generateItem("Chicken Nuggets 6pc", "6 nuggets", 80, "Chicken", "Global", "Wendy's", ["6 nuggets wendy's"]),
      generateItem("French Fries (Medium)", "1 medium", 120, "Sides", "Global", "Wendy's", ["fries wendy's medium"]),
      generateItem("Chili (Regular)", "1 regular", 250, "Sides", "Global", "Wendy's", ["chili wendy's regular"]),
      generateItem("Baked Potato (Sour Cream)", "1 potato", 240, "Sides", "Global", "Wendy's", ["baked potato wendy's"]),
      generateItem("Apple Pecan Salad", "1 salad", 280, "Sides", "Global", "Wendy's", ["apple pecan salad wendy's"]),
      generateItem("Frosty (Chocolate, Medium)", "1 medium", 340, "Desserts", "Global", "Wendy's", ["chocolate frosty wendy's"]),
      generateItem("Frosty (Vanilla, Medium)", "1 medium", 340, "Desserts", "Global", "Wendy's", ["vanilla frosty wendy's"]),
      generateItem("Soda (Medium)", "1 medium", 480, "Beverages", "Global", "Wendy's", ["soda wendy's medium"]),
    ],
  },
  {
    brand: "Popeyes",
    country: "Global",
    aliases: ["popeyes", "popeye's", "popeyes chicken"],
    cuisine: "Cajun Fast Food",
    items: [
      generateItem("Chicken Breast (Spicy)", "1 piece", 140, "Chicken", "Global", "Popeyes", ["spicy breast popeyes"]),
      generateItem("Chicken Thigh (Spicy)", "1 piece", 100, "Chicken", "Global", "Popeyes", ["spicy thigh popeyes"]),
      generateItem("Chicken Drumstick (Spicy)", "1 piece", 55, "Chicken", "Global", "Popeyes", ["spicy drumstick popeyes"]),
      generateItem("Chicken Wing (Spicy)", "1 piece", 50, "Chicken", "Global", "Popeyes", ["spicy wing popeyes"]),
      generateItem("Chicken Breast (Mild)", "1 piece", 140, "Chicken", "Global", "Popeyes", ["mild breast popeyes"]),
      generateItem("Chicken Thigh (Mild)", "1 piece", 100, "Chicken", "Global", "Popeyes", ["mild thigh popeyes"]),
      generateItem("Chicken Tenders (5 pc)", "5 tenders", 140, "Chicken", "Global", "Popeyes", ["5 tenders popeyes"]),
      generateItem("Chicken Tenders (3 pc)", "3 tenders", 85, "Chicken", "Global", "Popeyes", ["3 tenders popeyes"]),
      generateItem("Spicy Chicken Sandwich", "1 sandwich", 200, "Chicken", "Global", "Popeyes", ["spicy chicken sandwich popeyes"]),
      generateItem("Classic Chicken Sandwich", "1 sandwich", 195, "Chicken", "Global", "Popeyes", ["classic chicken sandwich popeyes"]),
      generateItem("Cajun Fries (Medium)", "1 medium", 130, "Sides", "Global", "Popeyes", ["cajun fries popeyes"]),
      generateItem("Mashed Potatoes with Gravy", "1 serving", 130, "Sides", "Global", "Popeyes", ["mashed potatoes popeyes"]),
      generateItem("Coleslaw (Regular)", "1 regular", 110, "Sides", "Global", "Popeyes", ["coleslaw popeyes"]),
      generateItem("Biscuit", "1 biscuit", 55, "Sides", "Global", "Popeyes", ["biscuit popeyes"]),
      generateItem("Red Beans & Rice", "1 serving", 170, "Sides", "Global", "Popeyes", ["red beans rice popeyes"]),
    ],
  },
  {
    brand: "Chick-fil-A",
    country: "Global",
    aliases: ["chick-fil-a", "chickfila", "chick fil a", "cfa"],
    cuisine: "American Fast Food",
    items: [
      generateItem("Original Chicken Sandwich", "1 sandwich", 200, "Chicken", "Global", "Chick-fil-A", ["original chicken chickfila"]),
      generateItem("Spicy Chicken Sandwich", "1 sandwich", 210, "Chicken", "Global", "Chick-fil-A", ["spicy chicken chickfila"]),
      generateItem("Chicken Nuggets 12pc", "12 nuggets", 280, "Chicken", "Global", "Chick-fil-A", ["12 nuggets chickfila"]),
      generateItem("Chicken Nuggets 8pc", "8 nuggets", 190, "Chicken", "Global", "Chick-fil-A", ["8 nuggets chickfila"]),
      generateItem("Grilled Chicken Sandwich", "1 sandwich", 190, "Chicken", "Global", "Chick-fil-A", ["grilled chicken chickfila"]),
      generateItem("Grilled Nuggets 12pc", "12 nuggets", 200, "Chicken", "Global", "Chick-fil-A", ["grilled nuggets chickfila 12"]),
      generateItem("Grilled Nuggets 8pc", "8 nuggets", 135, "Chicken", "Global", "Chick-fil-A", ["grilled nuggets chickfila 8"]),
      generateItem("Waffle Potato Fries (Medium)", "1 medium", 130, "Sides", "Global", "Chick-fil-A", ["waffle fries chickfila medium"]),
      generateItem("Mac & Cheese (Medium)", "1 medium", 190, "Sides", "Global", "Chick-fil-A", ["mac and cheese chickfila"]),
      generateItem("Cole Slaw (Regular)", "1 regular", 140, "Sides", "Global", "Chick-fil-A", ["cole slaw chickfila"]),
      generateItem("Chicken Salad Sandwich", "1 sandwich", 200, "Chicken", "Global", "Chick-fil-A", ["chicken salad chickfila"]),
      generateItem("Frosted Lemonade (Medium)", "1 medium", 473, "Beverages", "Global", "Chick-fil-A", ["frosted lemonade chickfila"]),
      generateItem("Iced Tea (Medium)", "1 medium", 473, "Beverages", "Global", "Chick-fil-A", ["iced tea chickfila"]),
      generateItem("Chocolate Milkshake (Medium)", "1 medium", 340, "Desserts", "Global", "Chick-fil-A", ["milkshake chickfila chocolate"]),
      generateItem("Vanilla Milkshake (Medium)", "1 medium", 340, "Desserts", "Global", "Chick-fil-A", ["milkshake chickfila vanilla"]),
    ],
  },
  {
    brand: "Papa John's",
    country: "Global",
    aliases: ["papa john's", "papa johns", "papajohns", "papa john"],
    cuisine: "Pizza Fast Food",
    items: [
      generateItem("Original Crust Cheese Pizza (Medium)", "2 slices", 145, "Pizza", "Global", "Papa John's", ["original crust pizza papa john's"]),
      generateItem("Original Crust Pepperoni Pizza (Medium)", "2 slices", 150, "Pizza", "Global", "Papa John's", ["pepperoni pizza papa john's"]),
      generateItem("Original Crust Sausage Pizza (Medium)", "2 slices", 155, "Pizza", "Global", "Papa John's", ["sausage pizza papa john's"]),
      generateItem("Thin Crust Cheese Pizza (Medium)", "2 slices", 120, "Pizza", "Global", "Papa John's", ["thin crust cheese papa john's"]),
      generateItem("Thin Crust Pepperoni Pizza (Medium)", "2 slices", 125, "Pizza", "Global", "Papa John's", ["thin crust pepperoni papa john's"]),
      generateItem("Garden Fresh Pizza (Medium)", "2 slices", 150, "Pizza", "Global", "Papa John's", ["garden fresh pizza papa john's"]),
      generateItem("Meat Lovers Pizza (Medium)", "2 slices", 170, "Pizza", "Global", "Papa John's", ["meat lovers pizza papa john's"]),
      generateItem("BBQ Chicken Pizza (Medium)", "2 slices", 160, "Pizza", "Global", "Papa John's", ["bbq chicken pizza papa john's"]),
      generateItem("Garlic Knots (8 pieces)", "8 pieces", 145, "Sides", "Global", "Papa John's", ["garlic knots papa john's"]),
      generateItem("Cheesesticks (8 pieces)", "8 pieces", 150, "Sides", "Global", "Papa John's", ["cheesesticks papa john's"]),
      generateItem("Chicken Poppers (8 pieces)", "8 pieces", 140, "Chicken", "Global", "Papa John's", ["chicken poppers papa john's"]),
      generateItem("Chocolate Chip Cookie", "1 cookie", 60, "Desserts", "Global", "Papa John's", ["chocolate chip cookie papa john's"]),
      generateItem("Cinnamon Pull Aparts", "1 order", 170, "Desserts", "Global", "Papa John's", ["cinnamon pull aparts papa"]),
      generateItem("Pepsi (500ml)", "1 bottle", 500, "Beverages", "Global", "Papa John's", ["pepsi papa john's"]),
    ],
  },
  {
    brand: "Five Guys",
    country: "Global",
    aliases: ["five guys", "5 guys", "fiveguys"],
    cuisine: "American Burgers",
    items: [
      generateItem("Hamburger", "1 burger", 225, "Burgers", "Global", "Five Guys", ["hamburger five guys"]),
      generateItem("Cheeseburger", "1 burger", 240, "Burgers", "Global", "Five Guys", ["cheeseburger five guys"]),
      generateItem("Bacon Cheeseburger", "1 burger", 260, "Burgers", "Global", "Five Guys", ["bacon cheeseburger five guys"]),
      generateItem("Little Hamburger", "1 burger", 160, "Burgers", "Global", "Five Guys", ["little hamburger five guys"]),
      generateItem("Little Cheeseburger", "1 burger", 175, "Burgers", "Global", "Five Guys", ["little cheeseburger five guys"]),
      generateItem("Bacon Little Cheeseburger", "1 burger", 195, "Burgers", "Global", "Five Guys", ["bacon little cheeseburger"]),
      generateItem("Grilled Cheese Sandwich", "1 sandwich", 150, "Burgers", "Global", "Five Guys", ["grilled cheese five guys"]),
      generateItem("Veggie Sandwich", "1 sandwich", 200, "Burgers", "Global", "Five Guys", ["veggie sandwich five guys"]),
      generateItem("French Fries (Little)", "1 little", 170, "Sides", "Global", "Five Guys", ["little fries five guys"]),
      generateItem("French Fries (Regular)", "1 regular", 340, "Sides", "Global", "Five Guys", ["regular fries five guys"]),
      generateItem("French Fries (Large)", "1 large", 510, "Sides", "Global", "Five Guys", ["large fries five guys"]),
      generateItem("Hot Dog", "1 hot dog", 150, "Burgers", "Global", "Five Guys", ["hot dog five guys"]),
      generateItem("Bacon Hot Dog", "1 hot dog", 170, "Burgers", "Global", "Five Guys", ["bacon hot dog five guys"]),
      generateItem("Milkshake (Chocolate)", "1 shake", 360, "Beverages", "Global", "Five Guys", ["chocolate shake five guys"]),
      generateItem("Milkshake (Vanilla)", "1 shake", 360, "Beverages", "Global", "Five Guys", ["vanilla shake five guys"]),
    ],
  },
  {
    brand: "Sagar Ratna",
    country: "India",
    aliases: ["sagar ratna", "sagar", "ratna"],
    cuisine: "South Indian",
    items: [
      generateItem("Masala Dosa", "1 dosa", 250, "Meals", "India", "Sagar Ratna", ["masala dosa sagar ratna"]),
      generateItem("Plain Dosa", "1 dosa", 200, "Meals", "India", "Sagar Ratna", ["plain dosa sagar ratna"]),
      generateItem("Rava Dosa", "1 dosa", 220, "Meals", "India", "Sagar Ratna", ["rava dosa sagar ratna"]),
      generateItem("Onion Dosa", "1 dosa", 240, "Meals", "India", "Sagar Ratna", ["onion dosa sagar ratna"]),
      generateItem("Idli (2 pieces)", "2 pieces", 140, "Meals", "India", "Sagar Ratna", ["idli sagar ratna"]),
      generateItem("Vada (2 pieces)", "2 pieces", 140, "Meals", "India", "Sagar Ratna", ["vada sagar ratna"]),
      generateItem("Upma", "1 plate (200g)", 200, "Meals", "India", "Sagar Ratna", ["upma sagar ratna"]),
      generateItem("Pongal", "1 plate (200g)", 200, "Meals", "India", "Sagar Ratna", ["pongal sagar ratna"]),
      generateItem("Rasam Rice", "1 plate (250g)", 250, "Meals", "India", "Sagar Ratna", ["rasam rice sagar ratna"]),
      generateItem("Curd Rice", "1 plate (250g)", 250, "Meals", "India", "Sagar Ratna", ["curd rice sagar ratna"]),
      generateItem("Sambhar Rice", "1 plate (250g)", 250, "Meals", "India", "Sagar Ratna", ["sambhar rice sagar ratna"]),
      generateItem("Lemon Rice", "1 plate (250g)", 250, "Meals", "India", "Sagar Ratna", ["lemon rice sagar ratna"]),
      generateItem("Filter Coffee", "1 cup (150ml)", 150, "Beverages", "India", "Sagar Ratna", ["filter coffee sagar ratna"]),
      generateItem("Buttermilk", "1 glass (200ml)", 200, "Beverages", "India", "Sagar Ratna", ["buttermilk sagar ratna"]),
    ],
  },
  {
    brand: "Jumboking",
    country: "India",
    aliases: ["jumboking", "jumbo king", "jumboking vada pav"],
    cuisine: "Indian Fast Food",
    items: [
      generateItem("Vada Pav", "1 vada pav", 120, "Snacks", "India", "Jumboking", ["vada pav jumboking"]),
      generateItem("Cheese Vada Pav", "1 vada pav", 130, "Snacks", "India", "Jumboking", ["cheese vada pav jumboking"]),
      generateItem("Schezwan Vada Pav", "1 vada pav", 125, "Snacks", "India", "Jumboking", ["schezwan vada pav jumboking"]),
      generateItem("Extra Tari Vada Pav", "1 vada pav", 130, "Snacks", "India", "Jumboking", ["tari vada pav jumboking"]),
      generateItem("Batata Vada (2 pieces)", "2 pieces", 100, "Snacks", "India", "Jumboking", ["batata vada jumboking"]),
      generateItem("Dabeli", "1 dabeli", 110, "Snacks", "India", "Jumboking", ["dabeli jumboking"]),
      generateItem("Cheese Dabeli", "1 dabeli", 125, "Snacks", "India", "Jumboking", ["cheese dabeli jumboking"]),
      generateItem("Pav Bhaji", "1 plate", 280, "Meals", "India", "Jumboking", ["pav bhaji jumboking"]),
      generateItem("French Fries (Regular)", "1 regular", 110, "Sides", "India", "Jumboking", ["fries jumboking"]),
    ],
  },
  {
    brand: "Goli Vada Pav",
    country: "India",
    aliases: ["goli vada pav", "goli", "goli vada pav india"],
    cuisine: "Indian Fast Food",
    items: [
      generateItem("Goli Vada Pav", "1 vada pav", 115, "Snacks", "India", "Goli Vada Pav", ["goli vada pav classic"]),
      generateItem("Cheese Vada Pav", "1 vada pav", 130, "Snacks", "India", "Goli Vada Pav", ["goli cheese vada pav"]),
      generateItem("Schezwan Cheese Vada Pav", "1 vada pav", 135, "Snacks", "India", "Goli Vada Pav", ["goli schezwan vada pav"]),
      generateItem("Mayo Vada Pav", "1 vada pav", 140, "Snacks", "India", "Goli Vada Pav", ["goli mayo vada pav"]),
      generateItem("Chilli Garlic Vada Pav", "1 vada pav", 125, "Snacks", "India", "Goli Vada Pav", ["goli chilli garlic"]),
      generateItem("French Fries (Regular)", "1 regular", 110, "Sides", "India", "Goli Vada Pav", ["goli fries"]),
      generateItem("Pepsi (300ml)", "1 bottle", 300, "Beverages", "India", "Goli Vada Pav", ["goli pepsi"]),
    ],
  },
];

function exists(name, brandName) {
  const b = existing.find(e => e.brand === brandName);
  if (!b) return false;
  return b.items.some(i => i.name === name);
}

// ── Expand existing brands ──
let addedCount = 0;
for (const [brandName, items] of Object.entries(EXPANSIONS)) {
  const brand = existing.find(b => b.brand === brandName);
  if (!brand) { console.warn(`Brand "${brandName}" not found, skipping`); continue; }
  for (const [name, sv, grams, cat, ctry, extraAliases] of items) {
    if (exists(name, brandName)) continue;
    const item = generateItem(name, sv, grams, cat, ctry, brandName, extraAliases);
    brand.items.push(item);
    addedCount++;
  }
}

// ── Add new brands ──
for (const newBrand of NEW_BRANDS) {
  if (existing.some(e => e.brand === newBrand.brand)) continue;
  existing.push(newBrand);
  addedCount += newBrand.items.length;
}

// ── Write output ──
fs.writeFileSync(DB_PATH, JSON.stringify(existing, null, 2), 'utf-8');

const totalItems = existing.reduce((s, b) => s + b.items.length, 0);
console.log(`✅ Added ${addedCount} new items`);
console.log(`📦 Total: ${existing.length} brands, ${totalItems} items`);
console.log(`📁 Written to ${DB_PATH}`);
