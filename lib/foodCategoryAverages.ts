export interface Per100g {
  cal: number;
  prot: number;
  carb: number;
  fat: number;
  fbr: number;
}

export const FOOD_CATEGORY_AVERAGES: Record<string, Per100g> = {
  'rice': { cal: 130, prot: 2.7, carb: 28, fat: 0.3, fbr: 0.4 },
  'wheat': { cal: 340, prot: 13, carb: 72, fat: 2.5, fbr: 12 },
  'oats': { cal: 389, prot: 17, carb: 66, fat: 6.9, fbr: 10.6 },
  'bread': { cal: 265, prot: 9, carb: 49, fat: 3.2, fbr: 2.7 },
  'pasta': { cal: 131, prot: 5, carb: 25, fat: 1.1, fbr: 1.8 },

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

  'milk': { cal: 66, prot: 3.3, carb: 5, fat: 3.5, fbr: 0 },
  'curd': { cal: 61, prot: 3.5, carb: 4.7, fat: 3.3, fbr: 0 },
  'yogurt': { cal: 61, prot: 3.5, carb: 4.7, fat: 3.3, fbr: 0 },
  'cheese': { cal: 402, prot: 25, carb: 1.3, fat: 33, fbr: 0 },
  'butter': { cal: 717, prot: 0.9, carb: 0, fat: 81, fbr: 0 },
  'ghee': { cal: 900, prot: 0, carb: 0, fat: 100, fbr: 0 },

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

  'banana': { cal: 89, prot: 1.1, carb: 23, fat: 0.3, fbr: 2.6 },
  'apple': { cal: 52, prot: 0.3, carb: 14, fat: 0.2, fbr: 2.4 },
  'orange': { cal: 47, prot: 0.9, carb: 12, fat: 0.1, fbr: 2.4 },
  'mango': { cal: 60, prot: 0.8, carb: 15, fat: 0.4, fbr: 1.6 },
  'grapes': { cal: 69, prot: 0.7, carb: 18, fat: 0.2, fbr: 0.9 },
  'watermelon': { cal: 30, prot: 0.6, carb: 7.6, fat: 0.2, fbr: 0.4 },

  'tea': { cal: 1, prot: 0, carb: 0, fat: 0, fbr: 0 },
  'coffee': { cal: 2, prot: 0.3, carb: 0, fat: 0, fbr: 0 },
  'juice': { cal: 45, prot: 0.5, carb: 11, fat: 0.1, fbr: 0.2 },
  'soda': { cal: 41, prot: 0, carb: 10.6, fat: 0, fbr: 0 },
  'beer': { cal: 43, prot: 0.5, carb: 3.6, fat: 0, fbr: 0 },
  'wine': { cal: 83, prot: 0.1, carb: 2.6, fat: 0, fbr: 0 },

  'oil': { cal: 884, prot: 0, carb: 0, fat: 100, fbr: 0 },
  'olive oil': { cal: 884, prot: 0, carb: 0, fat: 100, fbr: 0 },

  'almond': { cal: 579, prot: 21, carb: 22, fat: 50, fbr: 12.5 },
  'walnut': { cal: 654, prot: 15, carb: 14, fat: 65, fbr: 6.7 },
  'cashew': { cal: 553, prot: 18, carb: 30, fat: 44, fbr: 3.3 },
  'peanut': { cal: 567, prot: 26, carb: 16, fat: 49, fbr: 8.5 },

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

export function findCategoryAverage(foodName: string): Per100g | null {
  const lower = foodName.toLowerCase();
  for (const [category, avg] of Object.entries(FOOD_CATEGORY_AVERAGES)) {
    if (lower.includes(category)) return avg;
  }
  return null;
}
