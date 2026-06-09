import * as ImageManipulator from 'expo-image-manipulator';
import { groqChatRaw } from './groq';
import { validateResponse } from './safetyEngine';
import type { ValidationInput } from './safetyEngine';
import { getDb } from './db';
import Fuse from 'fuse.js';
import foodDatabaseJson from '@/assets/food_database.json';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export type FoodDataSource = 'bundled' | 'open_food_facts' | 'usda' | 'cache' | 'ai_vision' | 'user';

export interface FoodAnalysisItem {
  name: string;
  grams: number;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  source?: FoodDataSource;
  confidence?: number;
}

export interface AnalysisResult {
  items: FoodAnalysisItem[];
  ai_description: string;
  imageQuality?: ImageQualityResult;
}

export interface ImageQualityResult {
  valid: boolean;
  qualityWarnings: string[];
  qualityScore: number;
}

export interface NutritionResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving: string;
  servingGrams?: number;
}

export interface VisionItem {
  name: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  per100gCalories: number;
}

export interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MealLog {
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: string;
}

interface FoodResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string;
  serving_grams: number;
  source: string;
}

const IMAGE_QUALITY_PROMPT = `Analyze this food image. Return ONLY a JSON object with these fields:
{
  "has_food": true/false,
  "blurry": true/false,
  "too_dark": true/false,
  "glare": true/false,
  "too_far": true/false,
  "multiple_items": true/false,
  "quality_score": 0-100
}
Quality score: 100=perfect, 0=unusable. Deduct for blur, darkness, glare, distance.
If no food visible, set has_food=false.`;

// ══════════════════════════════════════════════════════════
//  PHASE 1 & 7: IMAGE VALIDATION + QUALITY ANALYSIS
// ══════════════════════════════════════════════════════════

export async function analyzeImageQuality(base64: string): Promise<ImageQualityResult> {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 100,
        temperature: 0,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: IMAGE_QUALITY_PROMPT },
          ],
        }],
      }),
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '{}';
    const json = JSON.parse(extractJSON(text));
    const warnings: string[] = [];
    if (json.blurry) warnings.push('Image may be blurry');
    if (json.too_dark) warnings.push('Image may be too dark');
    if (json.glare) warnings.push('Glare detected on image');
    if (json.too_far) warnings.push('Food appears too far away');

    return {
      valid: json.has_food === true,
      qualityWarnings: warnings,
      qualityScore: json.quality_score ?? 50,
    };
  } catch {
    return { valid: true, qualityWarnings: [], qualityScore: 50 };
  }
}

export async function validateFoodImage(base64: string): Promise<boolean> {
  try {
    const quality = await analyzeImageQuality(base64);
    return quality.valid;
  } catch {
    return true;
  }
}

// ══════════════════════════════════════════════════════════
//  PHASE 3: FOOD CANONICALIZATION MAP
// ══════════════════════════════════════════════════════════

const NAME_CANONICAL_MAP: Record<string, string> = {
  // Indian dish names
  'paneer': 'Paneer',
  'daal': 'Dal',
  'dal': 'Dal',
  'roti': 'Chapati',
  'phulka': 'Chapati',
  'chawal': 'Cooked Rice',
  'bhaat': 'Cooked Rice',
  'dahi': 'Curd',
  'ghee': 'Ghee',
  'aloo': 'Potato',
  'bhindi': 'Okra',
  'baingan': 'Eggplant',
  'bharta': 'Baingan Bharta',
  'biryani': 'Chicken Biryani',
  'pulao': 'Vegetable Pulao',
  'pulav': 'Vegetable Pulao',
  'kheer': 'Rice Pudding',
  'raita': 'Raita',
  'chai': 'Tea',
  'masala chai': 'Tea',
  'lassi': 'Lassi',
  'makhani': 'Butter Chicken',
  'korma': 'Chicken Korma',
  'tandoori': 'Chicken Tandoori',
  'seekh': 'Seekh Kebab',
  'kofta': 'Malai Kofta',
  'palak': 'Palak Paneer',
  'saag': 'Palak Paneer',
  'idli': 'Idli',
  'dosa': 'Dosa',
  'vada': 'Vada',
  'uttapam': 'Uttapam',
  'sambar': 'Sambar',
  'rasam': 'Rasam',
  'chutney': 'Coconut Chutney',
  'puri': 'Puri',
  'bhaji': 'Pav Bhaji',
  'bhel': 'Bhel Puri',
  'sev': 'Sev Puri',
  'dabeli': 'Dabeli',
  'vada pav': 'Vada Pav',
  'samosa': 'Samosa',
  'pakora': 'Pakora',
  'pakode': 'Pakora',
  'kachori': 'Kachori',
  'dhokla': 'Dhokla',
  'thepla': 'Thepla',
  'paratha': 'Paratha',
  'naan': 'Naan',
  'kulcha': 'Naan',
  'poori': 'Puri',
  'upma': 'Upma',
  'poha': 'Poha',
  'sheera': 'Sheera',
  'halwa': 'Halwa',
  'gulab': 'Gulab Jamun',
  'rasgulla': 'Rasgulla',
  'jalebi': 'Jalebi',
  'barfi': 'Barfi',
  'ladoo': 'Ladoo',
  'kesari': 'Kesari Bath',

  // Common typos / misspellings
  'wheate flour': 'Wheat Flour',
  'wheate': 'Wheat',
  'chiken': 'Chicken Breast',
  'chiken breast': 'Chicken Breast',
  'chicken breast': 'Chicken Breast',
  'chkn': 'Chicken Breast',
  'veggies': 'Mixed Vegetables',
  'veg': 'Mixed Vegetables',
  'vege': 'Mixed Vegetables',
  'curd': 'Curd',
  'yogurt': 'Curd',
  'yoghurt': 'Curd',
  'briyani': 'Chicken Biryani',
  'biriyani': 'Chicken Biryani',
  'nan': 'Naan',
  'roti canai': 'Chapati',

  // Western food common names
  'coke': 'Coca-Cola',
  'coca cola': 'Coca-Cola',
  'pepsi': 'Pepsi',
  'sprite': 'Sprite',
  'fanta': 'Fanta',
  'oreo': 'Oreo Cookies',
  'oreos': 'Oreo Cookies',
  'maggie': 'Maggi Noodles',
  'maggi': 'Maggi Noodles',
  'noodle': 'Instant Noodles',
  'noodles': 'Instant Noodles',
  'ramen': 'Instant Noodles',
  'oat': 'Oats',
  'oats': 'Oats',
  'avo': 'Avocado',
  'avacado': 'Avocado',
  'adacado': 'Avocado',
  'broccli': 'Broccoli',
  'brocolli': 'Broccoli',
  'cauli': 'Cauliflower',
  'cauliflwr': 'Cauliflower',
  'capsicum': 'Bell Pepper',
  'bell pepper': 'Bell Pepper',
  'sweet potato': 'Sweet Potato',
  'sweet potatoe': 'Sweet Potato',
  'zuchini': 'Zucchini',
  'zucchini': 'Zucchini',
  'courgette': 'Zucchini',
  'aubergine': 'Eggplant',
  'egg plant': 'Eggplant',
  'brinjal': 'Eggplant',
  'mushroom': 'Mushrooms',
  'mushrom': 'Mushrooms',
  'tomato': 'Tomato',
  'tomatos': 'Tomatoes',
  'potato': 'Potato',
  'potatos': 'Potatoes',
  'french fry': 'French Fries',
  'french fries': 'French Fries',
  'fries': 'French Fries',
  'chips': 'French Fries',
  'burger': 'Hamburger',
  'ham burger': 'Hamburger',
  'cheeseburger': 'Cheeseburger',
  'pizza': 'Pizza',
  'pasta': 'Pasta',
  'spagetti': 'Spaghetti',
  'spaghetti': 'Spaghetti',
  'mac n cheese': 'Mac and Cheese',
  'mac and cheese': 'Mac and Cheese',
  'sandwhich': 'Sandwich',
  'sandwich': 'Sandwich',
  'toast': 'Toast',
  'omlette': 'Omelette',
  'omlet': 'Omelette',
  'scrambled': 'Scrambled Eggs',
  'fried egg': 'Fried Egg',
  'boiled egg': 'Boiled Egg',
  'egg': 'Egg',
  'eggs': 'Eggs',
  'whey': 'Whey Protein',
  'whey protein': 'Whey Protein',
  'protein shake': 'Whey Protein',
  'protein powder': 'Whey Protein',
  'smoothie': 'Fruit Smoothie',
  'salmon': 'Salmon',
  'tuna': 'Tuna',
  'sardine': 'Sardines',
  'mackarel': 'Mackerel',
  'prawn': 'Prawns',
  'shrimp': 'Prawns',
  'fish': 'Fish Fillet',
  'steak': 'Beef Steak',
  'beef': 'Beef',
  'chicken': 'Chicken',
  'pork': 'Pork',
  'mutton': 'Mutton',
  'lamb': 'Lamb',
  'bacon': 'Bacon',
  'sausage': 'Sausage',
  'ham': 'Ham',
  'salami': 'Salami',
  'butter': 'Butter',
  'cheese': 'Cheese',
  'mayo': 'Mayonnaise',
  'mayonnaise': 'Mayonnaise',
  'ketchup': 'Ketchup',
  'mustard': 'Mustard',
  'bbq sauce': 'BBQ Sauce',
  'hot sauce': 'Hot Sauce',
  'soy sauce': 'Soy Sauce',
  'vinegar': 'Vinegar',
  'olive oil': 'Olive Oil',
  'coconut oil': 'Coconut Oil',
  'vege oil': 'Vegetable Oil',
  'vegetable oil': 'Vegetable Oil',
  'canola oil': 'Canola Oil',
  'sunflower oil': 'Sunflower Oil',
  'honey': 'Honey',
  'maple syrup': 'Maple Syrup',
  'sugar': 'White Sugar',
  'brown sugar': 'Brown Sugar',
  'salt': 'Salt',
  'pepper': 'Black Pepper',
  'black pepper': 'Black Pepper',

  // Fruits
  'apple': 'Apple',
  'orange': 'Orange',
  'banana': 'Banana',
  'bananna': 'Banana',
  'mango': 'Mango',
  'grapes': 'Grapes',
  'strawberry': 'Strawberries',
  'strawberries': 'Strawberries',
  'blueberry': 'Blueberries',
  'blueberries': 'Blueberries',
  'raspberry': 'Raspberries',
  'watermelon': 'Watermelon',
  'muskmelon': 'Muskmelon',
  'pineapple': 'Pineapple',
  'papaya': 'Papaya',
  'pomegranate': 'Pomegranate',
  'guava': 'Guava',
  'kiwi': 'Kiwi',
  'lemon': 'Lemon',
  'lime': 'Lime',
  'coconut': 'Coconut',
  'dates': 'Dates',
  'fig': 'Figs',
  'prunes': 'Prunes',
  'raisins': 'Raisins',
  'almond': 'Almonds',
  'almonds': 'Almonds',
  'badam': 'Almonds',
  'walnut': 'Walnuts',
  'walnuts': 'Walnuts',
  'cashew': 'Cashews',
  'cashews': 'Cashews',
  'kaju': 'Cashews',
  'pista': 'Pistachios',
  'pistachio': 'Pistachios',
  'peanut': 'Peanuts',
  'peanuts': 'Peanuts',
  'mungfali': 'Peanuts',
  'raisins': 'Raisins',
  'kishmish': 'Raisins',

  // Grains
  'rice': 'Cooked Rice',
  'white rice': 'Cooked Rice',
  'basmati rice': 'Cooked Rice',
  'brown rice': 'Brown Rice',
  'quinoa': 'Quinoa',
  'wheat': 'Wheat',
  'whole wheat': 'Whole Wheat',
  'flour': 'Wheat Flour',
  'maida': 'White Flour',
  'atta': 'Whole Wheat Flour',
  'sooji': 'Semolina',
  'rava': 'Semolina',
  'semolina': 'Semolina',
  'corn': 'Corn',
  'maize': 'Corn',
  'makki': 'Corn',
  'popcorn': 'Popcorn',
  'bajra': 'Bajra',
  'jowar': 'Jowar',
  'ragi': 'Ragi',
  'nachni': 'Ragi',
};

export function canonicalizeFoodName(rawName: string): string {
  const lower = rawName.toLowerCase().trim();
  for (const [misspelling, canonical] of Object.entries(NAME_CANONICAL_MAP)) {
    if (lower === misspelling || lower.includes(misspelling + ' ') || lower.startsWith(misspelling + ' ')) {
      return canonical;
    }
  }
  return rawName.replace(/\b\w/g, c => c.toUpperCase());
}

export function cleanAIDescription(text: string): string {
  return text
    .replace(/wheate/gi, 'wheat')
    .replace(/\s+/g, ' ')
    .trim();
}

// ══════════════════════════════════════════════════════════
//  VERIFY & CROSS-CHECK: Prefer DB values over AI guesses
// ══════════════════════════════════════════════════════════

export async function verifyAndCrossCheck(item: FoodAnalysisItem): Promise<FoodAnalysisItem> {
  try {
    const db = await getDb();
    await seedFoodCache();
    const key = item.name.toLowerCase().trim();
    const canonical = canonicalizeFoodName(key).toLowerCase();
    const searchKey = canonical !== key ? canonical : key;
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM food_cache WHERE LOWER(food_name) = ? OR LOWER(food_name) LIKE ? OR aliases LIKE ?`,
      searchKey, `%${searchKey}%`, `%${searchKey}%`
    );
    if (row && row.calories_per_100g > 0) {
      return {
        ...item,
        name: row.food_name || item.name,
        calories_per_100g: row.calories_per_100g,
        protein_per_100g: row.protein_per_100g || 0,
        carbs_per_100g: row.carbs_per_100g || 0,
        fat_per_100g: row.fat_per_100g || 0,
        fiber_per_100g: row.fiber_per_100g || 0,
        source: 'bundled',
        confidence: 0.95,
      };
    }
  } catch {}
  return { ...item, confidence: (item.confidence ?? 0.5) };
}

// ══════════════════════════════════════════════════════════
//  PHASE 4: DETERMINISTIC CATEGORY AVERAGE FALLBACK
//  (NO AI MACRO CALCULATION)
// ══════════════════════════════════════════════════════════

const FOOD_CATEGORY_AVERAGES: Record<string, Per100g> = {
  // Grains & Cereals
  'rice': { cal: 130, prot: 2.7, carb: 28, fat: 0.3, fbr: 0.4 },
  'wheat': { cal: 340, prot: 13, carb: 72, fat: 2.5, fbr: 12 },
  'oats': { cal: 389, prot: 17, carb: 66, fat: 6.9, fbr: 10.6 },
  'bread': { cal: 265, prot: 9, carb: 49, fat: 3.2, fbr: 2.7 },
  'pasta': { cal: 131, prot: 5, carb: 25, fat: 1.1, fbr: 1.8 },

  // Proteins
  'chicken': { cal: 165, prot: 31, carb: 0, fat: 3.6, fbr: 0 },
  'egg': { cal: 155, prot: 13, carb: 1.1, fat: 11, fbr: 0 },
  'fish': { cal: 130, prot: 24, carb: 0, fat: 3, fbr: 0 },
  'beef': { cal: 250, prot: 26, carb: 0, fat: 15, fbr: 0 },
  'pork': { cal: 242, prot: 27, carb: 0, fat: 14, fbr: 0 },
  'lamb': { cal: 258, prot: 25, carb: 0, fat: 16, fbr: 0 },
  'paneer': { cal: 265, prot: 18, carb: 1.2, fat: 21, fbr: 0 },
  'tofu': { cal: 76, prot: 8, carb: 1.9, fat: 4.8, fbr: 0.3 },
  'lentil': { cal: 116, prot: 9, carb: 20, fat: 0.4, fbr: 8 },
  'dal': { cal: 116, prot: 9, carb: 20, fat: 0.4, fbr: 8 },
  'beans': { cal: 132, prot: 8.7, carb: 24, fat: 0.5, fbr: 6.4 },

  // Dairy
  'milk': { cal: 66, prot: 3.3, carb: 5, fat: 3.5, fbr: 0 },
  'curd': { cal: 61, prot: 3.5, carb: 4.7, fat: 3.3, fbr: 0 },
  'yogurt': { cal: 61, prot: 3.5, carb: 4.7, fat: 3.3, fbr: 0 },
  'cheese': { cal: 402, prot: 25, carb: 1.3, fat: 33, fbr: 0 },
  'butter': { cal: 717, prot: 0.9, carb: 0, fat: 81, fbr: 0 },
  'ghee': { cal: 900, prot: 0, carb: 0, fat: 100, fbr: 0 },

  // Indian dishes
  'chapati': { cal: 297, prot: 8, carb: 48, fat: 8, fbr: 4.5 },
  'roti': { cal: 297, prot: 8, carb: 48, fat: 8, fbr: 4.5 },
  'naan': { cal: 262, prot: 8, carb: 45, fat: 5.5, fbr: 2 },
  'paratha': { cal: 310, prot: 7, carb: 42, fat: 12, fbr: 3 },
  'idli': { cal: 58, prot: 2, carb: 12, fat: 0.1, fbr: 0.5 },
  'dosa': { cal: 168, prot: 4, carb: 30, fat: 3.5, fbr: 1 },
  'vada': { cal: 170, prot: 5, carb: 22, fat: 7, fbr: 1 },
  'samosa': { cal: 260, prot: 5, carb: 31, fat: 13, fbr: 2 },
  'pakora': { cal: 200, prot: 5, carb: 18, fat: 12, fbr: 1.5 },
  'puri': { cal: 280, prot: 5, carb: 40, fat: 11, fbr: 1 },
  'biryani': { cal: 180, prot: 10, carb: 22, fat: 6, fbr: 1 },
  'pulao': { cal: 160, prot: 4, carb: 28, fat: 4, fbr: 1 },
  'korma': { cal: 200, prot: 15, carb: 8, fat: 12, fbr: 1 },
  'tandoori': { cal: 190, prot: 25, carb: 3, fat: 8, fbr: 0.5 },
  'keema': { cal: 220, prot: 18, carb: 6, fat: 14, fbr: 0.5 },

  // Vegetables
  'potato': { cal: 77, prot: 2, carb: 17, fat: 0.1, fbr: 2.2 },
  'tomato': { cal: 18, prot: 0.9, carb: 3.9, fat: 0.2, fbr: 1.2 },
  'onion': { cal: 40, prot: 1.1, carb: 9.3, fat: 0.1, fbr: 1.7 },
  'carrot': { cal: 41, prot: 0.9, carb: 10, fat: 0.2, fbr: 2.8 },
  'broccoli': { cal: 34, prot: 2.8, carb: 7, fat: 0.4, fbr: 2.6 },
  'cauliflower': { cal: 25, prot: 1.9, carb: 5, fat: 0.3, fbr: 2 },
  'spinach': { cal: 23, prot: 2.9, carb: 3.6, fat: 0.4, fbr: 2.2 },
  'okra': { cal: 33, prot: 2, carb: 7, fat: 0.2, fbr: 3.2 },
  'eggplant': { cal: 25, prot: 1, carb: 6, fat: 0.2, fbr: 3 },
  'cabbage': { cal: 25, prot: 1.3, carb: 6, fat: 0.1, fbr: 2.5 },
  'peas': { cal: 81, prot: 5.4, carb: 14, fat: 0.4, fbr: 5.7 },
  'corn': { cal: 96, prot: 3.4, carb: 21, fat: 1.5, fbr: 2.4 },
  'mushroom': { cal: 22, prot: 3.1, carb: 3.3, fat: 0.3, fbr: 1 },

  // Fruits
  'banana': { cal: 89, prot: 1.1, carb: 23, fat: 0.3, fbr: 2.6 },
  'apple': { cal: 52, prot: 0.3, carb: 14, fat: 0.2, fbr: 2.4 },
  'orange': { cal: 47, prot: 0.9, carb: 12, fat: 0.1, fbr: 2.4 },
  'mango': { cal: 60, prot: 0.8, carb: 15, fat: 0.4, fbr: 1.6 },
  'grapes': { cal: 69, prot: 0.7, carb: 18, fat: 0.2, fbr: 0.9 },
  'watermelon': { cal: 30, prot: 0.6, carb: 7.6, fat: 0.2, fbr: 0.4 },

  // Beverages
  'tea': { cal: 1, prot: 0, carb: 0, fat: 0, fbr: 0 },
  'coffee': { cal: 2, prot: 0.3, carb: 0, fat: 0, fbr: 0 },
  'juice': { cal: 45, prot: 0.5, carb: 11, fat: 0.1, fbr: 0.2 },
  'soda': { cal: 41, prot: 0, carb: 10.6, fat: 0, fbr: 0 },
  'beer': { cal: 43, prot: 0.5, carb: 3.6, fat: 0, fbr: 0 },
  'wine': { cal: 83, prot: 0.1, carb: 2.6, fat: 0, fbr: 0 },

  // Oils & Fats
  'oil': { cal: 884, prot: 0, carb: 0, fat: 100, fbr: 0 },
  'olive oil': { cal: 884, prot: 0, carb: 0, fat: 100, fbr: 0 },

  // Nuts & Seeds
  'almond': { cal: 579, prot: 21, carb: 22, fat: 50, fbr: 12.5 },
  'walnut': { cal: 654, prot: 15, carb: 14, fat: 65, fbr: 6.7 },
  'cashew': { cal: 553, prot: 18, carb: 30, fat: 44, fbr: 3.3 },
  'peanut': { cal: 567, prot: 26, carb: 16, fat: 49, fbr: 8.5 },

  // Generic fallbacks
  'vegetable': { cal: 30, prot: 1.5, carb: 5, fat: 0.3, fbr: 2 },
  'fruit': { cal: 55, prot: 0.5, carb: 13, fat: 0.2, fbr: 2 },
  'meat': { cal: 200, prot: 25, carb: 0, fat: 10, fbr: 0 },
  'seafood': { cal: 120, prot: 22, carb: 0.5, fat: 3, fbr: 0 },
  'soup': { cal: 40, prot: 2, carb: 5, fat: 1.5, fbr: 0.5 },
  'salad': { cal: 25, prot: 1.5, carb: 4, fat: 0.5, fbr: 1.5 },
  'curry': { cal: 120, prot: 8, carb: 8, fat: 6, fbr: 2 },
  'stir fry': { cal: 100, prot: 6, carb: 8, fat: 4, fbr: 2 },
  'fried': { cal: 250, prot: 10, carb: 20, fat: 15, fbr: 1 },
  'dessert': { cal: 300, prot: 4, carb: 45, fat: 12, fbr: 0.5 },
  'snack': { cal: 200, prot: 5, carb: 25, fat: 9, fbr: 1 },
  'sauce': { cal: 80, prot: 1, carb: 6, fat: 5, fbr: 0.5 },
  'dip': { cal: 150, prot: 2, carb: 5, fat: 14, fbr: 0.5 },
  'beverage': { cal: 35, prot: 0.5, carb: 8, fat: 0.1, fbr: 0 },
  'grain': { cal: 200, prot: 6, carb: 40, fat: 1.5, fbr: 3 },
  'legume': { cal: 120, prot: 8, carb: 20, fat: 0.5, fbr: 6 },
  'dairy': { cal: 100, prot: 5, carb: 5, fat: 6, fbr: 0 },
};

function findCategoryAverage(foodName: string): Per100g | null {
  const lower = foodName.toLowerCase();
  for (const [category, avg] of Object.entries(FOOD_CATEGORY_AVERAGES)) {
    if (lower.includes(category)) return avg;
  }
  return null;
}

// ══════════════════════════════════════════════════════════
//  IMAGE QUALITY SYSTEM PROMPT
// ══════════════════════════════════════════════════════════

// (IMAGE_QUALITY_PROMPT is defined at top of file)

// ══════════════════════════════════════════════════════════
//  LAYER 5: DETERMINISTIC FALLBACK — NO AI MACROS
// ══════════════════════════════════════════════════════════

async function categoryAverageFallback(foodName: string): Promise<Per100g | null> {
  const avg = findCategoryAverage(foodName);
  if (avg) return avg;

  const canonical = canonicalizeFoodName(foodName).toLowerCase();
  if (canonical !== foodName.toLowerCase()) {
    const avg2 = findCategoryAverage(canonical);
    if (avg2) return avg2;
  }

  return null;
}

// ── FoodEntity: AI extracts ONLY this (no nutrition) ──

interface FoodEntity {
  food: string;
  quantity: number;
  unit: string;
  confidence?: number;
}

// ── Per-food average weights for piece-based units ──

const PIECE_WEIGHTS: Record<string, number> = {
  egg: 60, eggs: 60, 'egg white': 30, 'egg yolk': 17,
  chapati: 35, chapatis: 35, roti: 35, rotis: 35, paratha: 60, parathas: 60, naan: 80,
  idli: 40, idlis: 40, vada: 30, dosa: 80, dosas: 80, uttapam: 80,
  samosa: 60, samosas: 60, pakora: 30, pakoras: 30,
  slice: 25, slices: 25, 'bread slice': 25, 'bread slices': 25,
  biscuit: 10, biscuits: 10, cookie: 15, cookies: 15,
  'chicken breast': 200, 'chicken thigh': 120, 'chicken drumstick': 80,
  'paneer slice': 25, kebab: 50, kebabs: 50, tikki: 40, tikkis: 40,
  scoop: 30, scoops: 30,
  apple: 180, banana: 120, orange: 150, mango: 200,
  pizza: 250, 'pizza slice': 100,
};

const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1, gram: 1, grams: 1, ml: 1, oz: 28.35, ounce: 28.35, ounces: 28.35,
  kg: 1000, lb: 453.6, pound: 453.6, pounds: 453.6,
  cup: 240, cups: 240, tbsp: 15, tablespoon: 15, tablespoons: 15,
  tsp: 5, teaspoon: 5, teaspoons: 5, bowl: 250, bowls: 250,
  plate: 300, plates: 300, glass: 200, glasses: 200,
  bottle: 500, bottles: 500, can: 330, cans: 330,
};

// ── Helpers ──

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const start = text.indexOf('[');
  const altStart = text.indexOf('{');
  const useStart = start !== -1 && (altStart === -1 || start < altStart) ? start : altStart;
  const end = text.lastIndexOf(']');
  const altEnd = text.lastIndexOf('}');
  const useEnd = end !== -1 && (altEnd === -1 || end > altEnd) ? end : altEnd;
  if (useStart !== -1 && useEnd !== -1 && useEnd > useStart) {
    return text.substring(useStart, useEnd + 1);
  }
  return text;
}

function autoMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours();
  return hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour < 19 ? 'snack' : 'dinner';
}

function nowISO(): string {
  return new Date().toISOString();
}

// ── Image Preprocessing ──

export async function preprocessImage(uri: string): Promise<string> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 512 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (!manipulated.base64) throw new Error('Image preprocessing failed');
  return manipulated.base64;
}

// ══════════════════════════════════════════════════════════
//  STEP 1: AI Entity Extraction — NO NUTRITION COMPUTATION
// ══════════════════════════════════════════════════════════

const ENTITY_EXTRACT_SYSTEM_PROMPT = `You extract ONLY food entities from user input.
CRITICAL: Do NOT calculate calories, protein, carbs, or any nutrition.
Return ONLY valid JSON array — no markdown, no other text.
Each object: {"food":"string","quantity":number,"unit":"string"}
Valid units: g, ml, kg, cup, tbsp, tsp, piece, slice, bowl, glass, oz, lb, can, bottle
Extract quantities exactly as written. If no quantity given, use 1.

Examples:
Input: "100g oats" → [{"food":"oats","quantity":100,"unit":"g"}]
Input: "5 eggs and 100g rice" → [{"food":"eggs","quantity":5,"unit":"piece"},{"food":"rice","quantity":100,"unit":"g"}]
Input: "2 slices bread with peanut butter" → [{"food":"bread","quantity":2,"unit":"slice"},{"food":"peanut butter","quantity":1,"unit":"tbsp"}]
Input: "1 cup dal and 2 roti" → [{"food":"dal","quantity":1,"unit":"cup"},{"food":"roti","quantity":2,"unit":"piece"}]`;

const IMAGE_ENTITY_EXTRACT_SYSTEM_PROMPT = `You identify every distinct food item in the image.
CRITICAL: Do NOT calculate calories, protein, carbs, or any nutrition.
For each item, estimate the food name and portion size in grams.
Reply ONLY with a JSON array, no markdown, no other text:
[{"food":"Cooked White Rice","grams":200},{"food":"Grilled Chicken Breast","grams":150}]
Be specific about food type and cooking method.
Estimate grams based on visual portion size using:
- A standard dinner plate = 20-25cm diameter
- A bowl of rice ≈ 200g
- A chicken breast ≈ 150-200g
- A can of Coca-Cola = 330ml = 330g
- A slice of pizza = 100g
- A glass of water = 200ml`;

async function extractEntitiesFromText(input: string): Promise<FoodEntity[]> {
  const raw = await groqChatRaw(
    [
      { role: 'system', content: ENTITY_EXTRACT_SYSTEM_PROMPT },
      { role: 'user', content: `Extract food entities from: "${input}"` },
    ],
    'llama-3.3-70b-versatile',
    300
  );
  const jsonStr = extractJSON(raw);
  const parsed = JSON.parse(jsonStr);
  const arr = Array.isArray(parsed) ? parsed : (parsed.items || [parsed]);
  return arr.map((e: any) => ({
    food: String(e.food || e.name || '').trim(),
    quantity: Number(e.quantity) || 1,
    unit: String(e.unit || 'g').toLowerCase(),
  })).filter((e: { food: string }) => e.food.length > 0);
}

async function extractEntitiesFromImage(base64: string): Promise<{ name: string; portionGrams: number; confidence: number }[]> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 600,
      temperature: 0,
      messages: [
        { role: 'system', content: IMAGE_ENTITY_EXTRACT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: 'Identify all food items and estimate portion grams. No nutrition values.' },
          ],
        },
      ],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(`Groq vision error: ${data.error.message}`);
  const rawText = data.choices?.[0]?.message?.content?.trim() || '';
  if (!rawText) throw new Error('No food detected in the image.');

  const jsonStr = extractJSON(rawText);
  const parsed = JSON.parse(jsonStr);
  const items = Array.isArray(parsed) ? parsed : (parsed.items || [parsed]);
  return items.map((i: any) => ({
    name: String(i.food || i.name || 'food').trim(),
    portionGrams: Number(i.grams || i.portionGrams) || 100,
    confidence: Number(i.confidence ?? i.confidence_score ?? 0.7),
  })).filter((i: { name: string }) => i.name.length > 0);
}

// ══════════════════════════════════════════════════════════
//  STEP 2: Unit Normalization → grams
// ══════════════════════════════════════════════════════════

function entityToGrams(entity: FoodEntity): number {
  const unit = entity.unit;
  const qty = entity.quantity;

  if (unit === 'piece' || unit === 'pieces' || unit === 'slice' || unit === 'slices') {
    const foodKey = entity.food.toLowerCase();
    for (const [key, weight] of Object.entries(PIECE_WEIGHTS)) {
      if (foodKey.includes(key)) return qty * weight;
    }
    return qty * 50;
  }

  if (unit === 'can' || unit === 'cans') return qty * 330;
  if (unit === 'bottle' || unit === 'bottles') return qty * 500;
  if (unit === 'bowl' || unit === 'bowls') return qty * 250;
  if (unit === 'plate' || unit === 'plates') return qty * 300;
  if (unit === 'glass' || unit === 'glasses') return qty * 200;
  if (unit === 'cup' || unit === 'cups') return qty * 240;
  if (unit === 'tbsp' || unit === 'tablespoon' || unit === 'tablespoons') return qty * 15;
  if (unit === 'tsp' || unit === 'teaspoon' || unit === 'teaspoons') return qty * 5;
  if (unit === 'kg') return qty * 1000;
  if (unit === 'oz' || unit === 'ounce' || unit === 'ounces') return qty * 28.35;
  if (unit === 'lb' || unit === 'pound' || unit === 'pounds') return qty * 453.6;
  if (unit === 'ml') return qty;
  return qty;
}

// ══════════════════════════════════════════════════════════
//  STEP 3: Deterministic Nutrition DB Lookup
// ══════════════════════════════════════════════════════════

interface Per100g {
  cal: number;
  prot: number;
  carb: number;
  fat: number;
  fbr: number;
}

async function lookupPer100g(foodName: string): Promise<Per100g | null> {
  const key = foodName.toLowerCase().trim();
  const normalizedKey = key.replace(/[-–—]/g, ' ');
  const canonicalKey = canonicalizeFoodName(key).toLowerCase();
  try {
    const db = await getDb();
    await seedFoodCache();
    let row = await db.getFirstAsync<any>(
      'SELECT * FROM food_cache WHERE LOWER(food_name) = ?', key
    );
    if (!row && canonicalKey !== key) {
      row = await db.getFirstAsync<any>(
        'SELECT * FROM food_cache WHERE LOWER(food_name) = ?', canonicalKey
      );
    }
    if (!row) {
      row = await db.getFirstAsync<any>(
        'SELECT * FROM food_cache WHERE LOWER(food_name) LIKE ? OR aliases LIKE ?',
        `%${normalizedKey}%`, `%${normalizedKey}%`
      );
    }
    if (!row) {
      const fuzzy = await fuzzyLookup(key);
      if (fuzzy) {
        row = await db.getFirstAsync<any>('SELECT * FROM food_cache WHERE food_name = ?', fuzzy.food_name);
      }
    }
    if (!row) return null;
    return {
      cal: row.calories_per_100g || 0,
      prot: row.protein_per_100g || 0,
      carb: row.carbs_per_100g || 0,
      fat: row.fat_per_100g || 0,
      fbr: row.fiber_per_100g || 0,
    };
  } catch { return null; }
}

// ══════════════════════════════════════════════════════════
//  STEP 4: Deterministic Scaling (NO AI MATH)
// ══════════════════════════════════════════════════════════

function scalePer100g(per100g: Per100g, grams: number): { calories: number; protein: number; carbs: number; fat: number; fiber: number } {
  const ratio = grams / 100;
  return {
    calories: Math.round(per100g.cal * ratio),
    protein: Math.round(per100g.prot * ratio * 10) / 10,
    carbs: Math.round(per100g.carb * ratio * 10) / 10,
    fat: Math.round(per100g.fat * ratio * 10) / 10,
    fiber: Math.round(per100g.fbr * ratio * 10) / 10,
  };
}

// ══════════════════════════════════════════════════════════
//  STEP 5: Strict Validation Layer
// ══════════════════════════════════════════════════════════

const KNOWN_DENSITY_RANGES: Record<string, { maxKcalPer100g: number; maxProteinPer100g: number; maxCarbsPer100g: number; maxFatPer100g: number }> = {
  oats: { maxKcalPer100g: 420, maxProteinPer100g: 18, maxCarbsPer100g: 70, maxFatPer100g: 10 },
  rice: { maxKcalPer100g: 370, maxProteinPer100g: 8, maxCarbsPer100g: 80, maxFatPer100g: 2 },
  'rice (cooked)': { maxKcalPer100g: 150, maxProteinPer100g: 4, maxCarbsPer100g: 35, maxFatPer100g: 1 },
  egg: { maxKcalPer100g: 160, maxProteinPer100g: 14, maxCarbsPer100g: 2, maxFatPer100g: 12 },
  eggs: { maxKcalPer100g: 160, maxProteinPer100g: 14, maxCarbsPer100g: 2, maxFatPer100g: 12 },
  'chicken breast': { maxKcalPer100g: 180, maxProteinPer100g: 32, maxCarbsPer100g: 1, maxFatPer100g: 5 },
  dal: { maxKcalPer100g: 120, maxProteinPer100g: 9, maxCarbsPer100g: 20, maxFatPer100g: 4 },
  roti: { maxKcalPer100g: 300, maxProteinPer100g: 10, maxCarbsPer100g: 50, maxFatPer100g: 5 },
  chapati: { maxKcalPer100g: 300, maxProteinPer100g: 10, maxCarbsPer100g: 50, maxFatPer100g: 5 },
  milk: { maxKcalPer100g: 80, maxProteinPer100g: 4, maxCarbsPer100g: 5, maxFatPer100g: 5 },
  banana: { maxKcalPer100g: 100, maxProteinPer100g: 1.5, maxCarbsPer100g: 25, maxFatPer100g: 0.5 },
  apple: { maxKcalPer100g: 60, maxProteinPer100g: 0.5, maxCarbsPer100g: 15, maxFatPer100g: 0.5 },
  bread: { maxKcalPer100g: 280, maxProteinPer100g: 10, maxCarbsPer100g: 55, maxFatPer100g: 5 },
  paneer: { maxKcalPer100g: 300, maxProteinPer100g: 20, maxCarbsPer100g: 5, maxFatPer100g: 25 },
  butter: { maxKcalPer100g: 750, maxProteinPer100g: 1, maxCarbsPer100g: 1, maxFatPer100g: 85 },
  ghee: { maxKcalPer100g: 900, maxProteinPer100g: 0, maxCarbsPer100g: 0, maxFatPer100g: 100 },
};

function validateMacros(per100g: Per100g, grams: number, foodName: string): Per100g {
  const totalGrams = grams;
  const key = foodName.toLowerCase().trim();
  let range = KNOWN_DENSITY_RANGES[key];

  if (!range) {
    for (const [knownKey, knownRange] of Object.entries(KNOWN_DENSITY_RANGES)) {
      if (key.includes(knownKey)) { range = knownRange; break; }
    }
  }

  if (range) {
    const clamped: Per100g = { ...per100g };
    if (clamped.cal > 0 && clamped.cal > range.maxKcalPer100g) {
      console.warn(`[validate] ${foodName}: calories ${clamped.cal} capped to ${range.maxKcalPer100g}`);
      clamped.cal = range.maxKcalPer100g;
    }
    if (clamped.prot > 0 && clamped.prot > range.maxProteinPer100g) {
      console.warn(`[validate] ${foodName}: protein ${clamped.prot} capped to ${range.maxProteinPer100g}`);
      clamped.prot = range.maxProteinPer100g;
    }
    if (clamped.carb > 0 && clamped.carb > range.maxCarbsPer100g) {
      console.warn(`[validate] ${foodName}: carbs ${clamped.carb} capped to ${range.maxCarbsPer100g}`);
      clamped.carb = range.maxCarbsPer100g;
    }
    if (clamped.fat > 0 && clamped.fat > range.maxFatPer100g) {
      console.warn(`[validate] ${foodName}: fat ${clamped.fat} capped to ${range.maxFatPer100g}`);
      clamped.fat = range.maxFatPer100g;
    }
    return clamped;
  }

  const clamped: Per100g = { ...per100g };
  if (clamped.cal > 900) { clamped.cal = 900; }
  if (clamped.prot > 100) { clamped.prot = 100; }
  if (clamped.carb > 100) { clamped.carb = 100; }
  if (clamped.fat > 100) { clamped.fat = 100; }
  return clamped;
}

function validateTotal(calories: number, protein: number, carbs: number, fat: number, grams: number): { ok: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (calories > 5000) warnings.push(`Total ${calories} kcal exceeds 5000 limit`);
  if (protein > grams) warnings.push(`Protein ${protein}g > food weight ${grams}g`);
  if (carbs > grams * 1.2) warnings.push(`Carbs ${carbs}g > weight×1.2 (${grams * 1.2}g)`);
  if (fat > grams) warnings.push(`Fat ${fat}g > food weight ${grams}g`);
  if (calories <= 0) warnings.push('Zero calories');
  return { ok: warnings.length === 0, warnings };
}

// ══════════════════════════════════════════════════════════
//  STEP 6: Assemble pipeline from entity → logged food
// ══════════════════════════════════════════════════════════

function toFoodItem(name: string, scaled: { calories: number; protein: number; carbs: number; fat: number; fiber: number }, grams: number): FoodItem {
  return {
    name,
    quantity: grams < 1 ? `${Math.round(grams * 100)}ml` : `${Math.round(grams)}g`,
    calories: Math.round(scaled.calories),
    protein: scaled.protein,
    carbs: scaled.carbs,
    fat: scaled.fat,
    fiber: scaled.fiber,
  };
}

function toMealLog(items: FoodItem[]): MealLog {
  return {
    items,
    totalCalories: items.reduce((s, i) => s + i.calories, 0),
    totalProtein: Math.round(items.reduce((s, i) => s + i.protein, 0) * 10) / 10,
    totalCarbs: Math.round(items.reduce((s, i) => s + i.carbs, 0) * 10) / 10,
    totalFat: Math.round(items.reduce((s, i) => s + i.fat, 0) * 10) / 10,
    mealType: autoMealType(),
    timestamp: nowISO(),
  };
}

async function processEntity(entity: FoodEntity, userId: string, debug: any[]): Promise<FoodItem | null> {
  const foodName = entity.food;
  const grams = entityToGrams(entity);

  console.log('[nutritionAI] Processing:', { food: foodName, qty: entity.quantity, unit: entity.unit, grams });

  const per100g = await lookupPer100g(foodName);
  if (per100g && per100g.cal > 0) {
    const validated = validateMacros(per100g, grams, foodName);
    const scaled = scalePer100g(validated, grams);
    const validation = validateTotal(scaled.calories, scaled.protein, scaled.carbs, scaled.fat, grams);
    debug.push({ food: foodName, grams, db: per100g, validated, scaled, validation });
    if (!validation.ok) {
      console.warn('[nutritionAI] Validation warnings:', validation.warnings);
    }
    return toFoodItem(foodName, scaled, grams);
  }

  const db = await getDb();
  await seedFoodCache();
  const like = await db.getFirstAsync<any>(
    'SELECT * FROM food_cache WHERE LOWER(food_name) LIKE ? LIMIT 1',
    `%${foodName.toLowerCase()}%`
  );
  if (like) {
    const p100: Per100g = {
      cal: like.calories_per_100g || 0,
      prot: like.protein_per_100g || 0,
      carb: like.carbs_per_100g || 0,
      fat: like.fat_per_100g || 0,
      fbr: like.fiber_per_100g || 0,
    };
    const validated = validateMacros(p100, grams, foodName);
    const scaled = scalePer100g(validated, grams);
    debug.push({ food: foodName, grams, db: p100, validated, scaled, source: 'like_fallback' });
    return toFoodItem(foodName, scaled, grams);
  }

  // Layer 5: Deterministic category average fallback — NO AI MACROS
  const categoryAvg = await categoryAverageFallback(foodName);
  if (categoryAvg && categoryAvg.cal > 0) {
    const validated = validateMacros(categoryAvg, grams, foodName);
    const scaled = scalePer100g(validated, grams);
    debug.push({ food: foodName, grams, category: categoryAvg, validated, scaled, source: 'category_fallback' });
    return toFoodItem(foodName, scaled, grams);
  }

  // Last resort: generic estimate
  const estimated: Per100g = { cal: 200, prot: 10, carb: 20, fat: 8, fbr: 2 };
  const validated = validateMacros(estimated, grams, foodName);
  const scaled = scalePer100g(validated, grams);
  debug.push({ food: foodName, grams, estimated: true, scaled });
  return toFoodItem(foodName, scaled, grams);
}

// ══════════════════════════════════════════════════════════
//  EXPORTED: analyzeFood — deterministic pipeline
// ══════════════════════════════════════════════════════════

export async function analyzeFood(input: {
  text?: string;
  voiceTranscript?: string;
  imageBase64?: string;
  userId: string;
}): Promise<MealLog> {
  const debug: any[] = [];

  if (input.imageBase64) {
    try {
      const entities = await extractEntitiesFromImage(input.imageBase64);
      const items: FoodItem[] = [];
      for (const e of entities) {
        const item = await processEntity({ food: e.name, quantity: e.portionGrams, unit: 'g', confidence: e.confidence }, input.userId, debug);
        if (item) items.push(item);
      }
      console.log('[nutritionAI] debug:', JSON.stringify(debug));
      if (items.length === 0) throw new Error('No food detected');
      return toMealLog(items);
    } catch (err: any) {
      console.error('[nutritionAI] Image pipeline failed:', err);
      throw err;
    }
  }

  const rawText = input.text || input.voiceTranscript || '';
  if (!rawText.trim()) {
    return { items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealType: autoMealType(), timestamp: nowISO() };
  }

  const safetyInput: ValidationInput = { response: rawText, userConditions: [] };
  const safetyResult = validateResponse(safetyInput);
  if (safetyResult.action === 'refuse' || safetyResult.action === 'fallback') {
    throw new Error(safetyResult.fallbackMessage || 'Input could not be processed safely.');
  }

  let entities: FoodEntity[] = [];
  try {
    entities = await extractEntitiesFromText(rawText);
    console.log('[nutritionAI] AI extracted entities:', JSON.stringify(entities));
  } catch {
    console.warn('[nutritionAI] AI entity extraction failed, using regex parser');
  }

  if (!entities || entities.length === 0) {
    entities = parseInput(rawText).map(p => ({
      food: p.food_key,
      quantity: p.quantity,
      unit: p.unit || 'g',
    }));
    console.log('[nutritionAI] Regex parsed entities:', JSON.stringify(entities));
  }

  const items: FoodItem[] = [];
  for (const entity of entities) {
    if (!entity.food.trim()) continue;
    try {
      const item = await processEntity(entity, input.userId, debug);
      if (item) items.push(item);
    } catch (err) {
      console.error(`[nutritionAI] Failed to process '${entity.food}':`, err);
    }
  }

  console.log('[nutritionAI] debug:', JSON.stringify(debug));

  if (items.length === 0) {
    return { items: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealType: autoMealType(), timestamp: nowISO() };
  }
  return toMealLog(items);
}

// ══════════════════════════════════════════════════════════
//  EXPORTED: analyzeImageWithAI — reuses same pipeline
// ══════════════════════════════════════════════════════════

export async function analyzeImageWithAI(uri: string, userId?: string): Promise<AnalysisResult> {
  const base64 = await preprocessImage(uri);

  const quality = await analyzeImageQuality(base64);
  if (!quality.valid) {
    throw new Error('No food detected. Please take a photo of actual food or use barcode scan.');
  }

  const entities = await extractEntitiesFromImage(base64);
  if (!entities || entities.length === 0) {
    throw new Error('No food detected in the image. Try a clearer photo with better lighting.');
  }

  const items: FoodAnalysisItem[] = [];
  const descriptions: string[] = [];

  for (const e of entities) {
    let foodItem: FoodItem | null = null;
    try {
      const entity: FoodEntity = { food: e.name, quantity: e.portionGrams, unit: 'g', confidence: e.confidence };
      const debug: any[] = [];
      foodItem = await processEntity(entity, userId || '', debug);
    } catch (err) {
      console.warn(`[nutritionAI] processEntity failed for '${e.name}':`, err);
    }
    if (foodItem) {
      const grams = parseInt(foodItem.quantity) || e.portionGrams;
      const ratio = grams > 0 ? 100 / grams : 1;
      items.push({
        name: foodItem.name,
        grams,
        calories_per_100g: Math.round(foodItem.calories * ratio),
        protein_per_100g: Math.round(foodItem.protein * ratio * 10) / 10,
        carbs_per_100g: Math.round(foodItem.carbs * ratio * 10) / 10,
        fat_per_100g: Math.round(foodItem.fat * ratio * 10) / 10,
        fiber_per_100g: Math.round(foodItem.fiber * ratio * 10) / 10,
        source: 'bundled',
        confidence: e.confidence,
      });
    } else {
      items.push({
        name: e.name,
        grams: e.portionGrams,
        calories_per_100g: 200,
        protein_per_100g: 10,
        carbs_per_100g: 20,
        fat_per_100g: 8,
        fiber_per_100g: 2,
        source: 'ai_vision',
        confidence: e.confidence,
      });
    }
    descriptions.push(`${e.name} (${e.portionGrams}g)`);
  }

  const aiDescription = descriptions.join(', ');

  const totalGrams = items.reduce((s, i) => s + i.grams, 0);
  const totalCal = items.reduce((s, i) => s + Math.round(i.calories_per_100g * i.grams / 100), 0);
  const totalProt = Math.round(items.reduce((s, i) => s + i.protein_per_100g * i.grams / 100, 0) * 10) / 10;
  const totalCarb = Math.round(items.reduce((s, i) => s + i.carbs_per_100g * i.grams / 100, 0) * 10) / 10;
  const totalFat = Math.round(items.reduce((s, i) => s + i.fat_per_100g * i.grams / 100, 0) * 10) / 10;
  const validation = validateTotal(totalCal, totalProt, totalCarb, totalFat, totalGrams);
  if (!validation.ok) {
    console.warn('[nutritionAI] Image validation warnings:', validation.warnings);
  }

  if (userId) {
    for (const item of items) {
      try {
        await insertIntoFoodCache({
          food_name: item.name.toLowerCase(),
          calories: item.calories_per_100g,
          protein: item.protein_per_100g,
          carbs: item.carbs_per_100g,
          fat: item.fat_per_100g,
          fiber: item.fiber_per_100g,
          serving_size: `${item.grams}g`,
          serving_grams: item.grams,
          source: 'ai_vision',
        });
      } catch {}
    }
    await saveScanToCache(uri, userId, aiDescription, totalCal);
  }

  for (let i = 0; i < items.length; i++) {
    items[i] = await verifyAndCrossCheck(items[i]);
    items[i] = { ...items[i], name: canonicalizeFoodName(items[i].name) };
  }

  return { items, ai_description: cleanAIDescription(aiDescription), imageQuality: quality };
}

// ══════════════════════════════════════════════════════════
//  Legacy regex parser (fallback for AI extraction)
// ══════════════════════════════════════════════════════════

const WORD_QUANTITIES: Record<string, number> = {
  half: 0.5, quarter: 0.25, '0.5': 0.5,
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

const IGNORE_WORDS = new Set([
  'of', 'the', 'large', 'small', 'medium', 'bowl', 'plate', 'glass',
  'slice', 'slices', 'piece', 'pieces', 'handful', 'cup', 'cups',
  'some', 'with', 'and', 'for', 'fresh', 'cooked', 'roasted', 'grilled',
  'fried', 'baked', 'sauteed', 'steamed', 'boiled', 'diced', 'chopped',
  'minced', 'sliced',
]);

const UNIT_WORDS = new Set([
  'cup', 'cups', 'tbsp', 'tablespoon', 'tablespoons', 'tsp', 'teaspoon',
  'teaspoons', 'g', 'gram', 'grams', 'kg', 'ml', 'oz', 'ounce', 'ounces',
  'lb', 'pound', 'pounds', 'piece', 'pieces', 'slice', 'slices', 'can', 'cans', 'bottle', 'bottles',
]);

export interface ParsedFoodItem {
  quantity: number;
  unit: string | null;
  food_key: string;
}

function parseSingleFood(text: string): ParsedFoodItem {
  let cleaned = text.toLowerCase().trim();
  cleaned = cleaned.replace(/^(a |an )/, '');
  const tokens = cleaned.split(/\s+/).filter(t => t.length > 0);
  let quantity = 1;
  let unit: string | null = null;
  let wordIdx = 0;
  const numMatch = cleaned.match(/^(\d+\.?\d*)\s*/);
  if (numMatch) {
    quantity = parseFloat(numMatch[1]);
    wordIdx = numMatch[0].trim().split(/\s+/).length;
  } else if (tokens.length > 0 && WORD_QUANTITIES[tokens[0]] !== undefined) {
    quantity = WORD_QUANTITIES[tokens[0]];
    wordIdx = 1;
  }
  if (wordIdx < tokens.length && UNIT_WORDS.has(tokens[wordIdx])) {
    unit = tokens[wordIdx];
    wordIdx++;
  }
  let foodName = tokens.slice(wordIdx)
    .filter(t => !IGNORE_WORDS.has(t))
    .join(' ');
  foodName = foodName.replace(/[.,!?;:]+$/, '').trim();
  if (!foodName) foodName = cleaned;
  return { quantity, unit, food_key: foodName };
}

function parseInput(input: string): ParsedFoodItem[] {
  const raw = input.toLowerCase().trim();
  if (!raw) return [{ quantity: 1, unit: null, food_key: '' }];
  const parts = raw.split(/\s*,\s*|\s+and\s+/).filter(Boolean);
  if (parts.length === 0) return [{ quantity: 1, unit: null, food_key: raw }];
  return parts.map(part => parseSingleFood(part.trim()));
}

// ══════════════════════════════════════════════════════════
//  DB helpers
// ══════════════════════════════════════════════════════════

let seedPromise: Promise<void> | null = null;

async function seedFoodCache(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    try {
      const db = await getDb();
      const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM food_cache');
      if (count && count.c > 0) return;
      const foods = foodDatabaseJson as any[];
      for (const f of foods) {
        await db.runAsync(
          `INSERT OR IGNORE INTO food_cache
           (food_name, aliases, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          f.food_name,
          JSON.stringify(f.aliases || []),
          f.calories_per_100g,
          f.protein_per_100g,
          f.carbs_per_100g,
          f.fat_per_100g,
          f.fiber_per_100g || 0,
          f.serving_size || '100g',
          f.serving_grams || 100,
          'bundled'
        );
      }
      console.log('[nutritionAI] Seeded food_cache with', foods.length, 'items');
    } catch (err) {
      console.error('[nutritionAI] seedFoodCache error:', err);
    }
  })();
  return seedPromise;
}

async function fuzzyLookup(food_key: string): Promise<FoodResult | null> {
  try {
    const db = await getDb();
    await seedFoodCache();
    const cacheEntries = await db.getAllAsync<any>('SELECT food_name, aliases FROM food_cache');
    if (cacheEntries.length === 0) return null;
    const allEntries = cacheEntries.map((e: any) => ({
      food_name: e.food_name,
      aliases: (() => { try { return JSON.parse(e.aliases || '[]'); } catch { return []; } })(),
    }));
    const fuse = new Fuse(allEntries, {
      keys: ['food_name', 'aliases'],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 2,
    });
    const results = fuse.search(food_key);
    if (results.length > 0 && results[0].score !== undefined && results[0].score! < 0.4) {
      const matchedName = results[0].item.food_name;
      const fullData = await db.getFirstAsync<any>('SELECT * FROM food_cache WHERE food_name = ?', matchedName);
      if (fullData) {
        return {
          food_name: fullData.food_name,
          calories: fullData.calories_per_100g,
          protein: fullData.protein_per_100g,
          carbs: fullData.carbs_per_100g,
          fat: fullData.fat_per_100g,
          fiber: fullData.fiber_per_100g || 0,
          serving_size: '100g',
          serving_grams: 100,
          source: fullData.source || 'bundled',
        };
      }
    }
    return null;
  } catch { return null; }
}

async function insertIntoFoodCache(fd: FoodResult): Promise<void> {
  try {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(`SELECT id FROM food_cache WHERE LOWER(food_name) = ?`, fd.food_name.toLowerCase());
    if (existing) return;
    await db.runAsync(
      `INSERT OR IGNORE INTO food_cache
       (food_name, aliases, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, serving_size, serving_grams, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      fd.food_name.toLowerCase(), '[]', fd.calories, fd.protein, fd.carbs, fd.fat, fd.fiber, fd.serving_size, fd.serving_grams, fd.source
    );
  } catch {}
}

async function saveToUserHistory(userId: string, fd: FoodResult): Promise<void> {
  try {
    const db = await getDb();
    const existing = await db.getFirstAsync<any>(
      `SELECT * FROM user_food_history WHERE user_id = ? AND LOWER(food_name) = ?`,
      userId, fd.food_name.toLowerCase()
    );
    if (existing) {
      await db.runAsync(`UPDATE user_food_history SET log_count = log_count + 1, last_logged = ? WHERE id = ?`, nowISO(), existing.id);
    } else {
      await db.runAsync(
        `INSERT INTO user_food_history (user_id, food_name, aliases, calories, protein, carbs, fat, fiber, serving_size, serving_grams, log_count, last_logged, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        userId, fd.food_name.toLowerCase(), '[]', fd.calories, fd.protein, fd.carbs, fd.fat, fd.fiber, fd.serving_size, fd.serving_grams, nowISO(), fd.source
      );
    }
  } catch {}
}

export async function saveScanToCache(uri: string, userId: string | undefined, foodName: string, calories: number) {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO food_scans (user_id, image_uri, food_name, calories, scanned_at) VALUES (?, ?, ?, ?, ?)`,
      userId || '', uri, foodName, calories, new Date().toISOString()
    );
  } catch {}
}

export async function getRecentScans(userId: string, limit = 10) {
  try {
    const db = await getDb();
    return await db.getAllAsync<any>(
      `SELECT * FROM food_scans WHERE user_id = ? ORDER BY scanned_at DESC LIMIT ?`,
      userId, limit
    );
  } catch { return []; }
}

export async function parseFoodInput(description: string): Promise<MealLog> {
  const userId = '';
  return analyzeFood({ text: description, userId });
}

export async function analyzeFoodImage(imageUrl: string): Promise<MealLog> {
  return analyzeFood({ imageBase64: imageUrl, userId: '' });
}

export async function getMealSuggestion(
  remainingCalories: number,
  remainingProtein: number,
  conditions: string[],
  mealType: string
): Promise<string> {
  try {
    const conditionNote = conditions.length > 0
      ? `User has: ${conditions.join(', ')}. Adapt suggestions accordingly (e.g., low sodium for hypertension, low GI for diabetes).`
      : '';
    const prompt = `Suggest a ${mealType} meal that fits these remaining macros:
- Calories: ~${remainingCalories} kcal
- Protein: ~${remainingProtein}g needed
${conditionNote}
Give 2-3 quick meal ideas with approximate macros. Keep it brief and practical.
Prefer Indian food options but include variety.`;

    const { groqChat } = await import('./groq');
    return await groqChat(
      'You are FitAI Nutritionist. Give brief, practical meal suggestions. Use bullet points.',
      prompt
    );
  } catch (error) {
    console.error('[nutritionAI] getMealSuggestion error:', error);
    return 'Try a balanced meal with lean protein, complex carbs, and healthy fats. For example: grilled chicken with quinoa and roasted vegetables.';
  }
}

export { analyzeImageQuality };
