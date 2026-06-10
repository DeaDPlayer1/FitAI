export const RESTAURANT_FOOD_SOURCE = 'restaurant';

export const RESTAURANT_BRAND_FOOD_MAP: Record<string, string> = {
  // McDonald's India
  'mcaloo tikki': "McDonald's McAloo Tikki Burger",
  'mcallo tikki': "McDonald's McAloo Tikki Burger",
  'mc aloo tikki': "McDonald's McAloo Tikki Burger",
  'mcspicy chicken': "McDonald's McSpicy Chicken Burger",
  'mcspicy paneer': "McDonald's McSpicy Paneer Burger",
  'mcveggie': "McDonald's McVeggie Burger",
  'mcchicken': "McDonald's McChicken Burger",
  'big mac': "McDonald's Big Mac",
  'mcnuggets': "McDonald's Chicken McNuggets 6-piece",
  'mcd fries': "McDonald's French Fries (Medium)",
  'mcflurry oreo': "McDonald's McFlurry with Oreo",
  'oreo mcflurry': "McDonald's McFlurry with Oreo",

  // Burger King
  'whopper': "Burger King Whopper",
  'whopper cheese': "Burger King Whopper with Cheese",
  'impossible whopper': "Burger King Impossible Whopper",
  'bk chicken fries': "Burger King Chicken Fries 9-piece",
  'onion rings': "Burger King Onion Rings (Medium)",

  // KFC India
  'zinger': "KFC Zinger Burger",
  'zinger burger': "KFC Zinger Burger",
  'kfc zinger': "KFC Zinger Burger",
  'zinger meal': "KFC Zinger Meal (burger + fries + coke)",
  'kfc popcorn': "KFC Popcorn Chicken (Large)",
  'hot wings': "KFC Chicken Wings 6-piece (Hot & Crispy)",
  'kfc wings': "KFC Chicken Wings 6-piece (Hot & Crispy)",

  // Subway
  'subway club': "Subway Club 6-inch",
  'subway turkey': "Subway Turkey Breast 6-inch",
  'subway bmt': "Subway Italian B.M.T. 6-inch",
  'chicken teriyaki sub': "Subway Chicken Teriyaki 6-inch",
  'veggie delite': "Subway Veggie Delite 6-inch",
  'paneer tikka sub': "Subway Paneer Tikka Sub 6-inch",
  'subway paneer': "Subway Paneer Tikka Sub 6-inch",

  // Domino's India
  "domino's margherita": "Domino's Margherita Pizza (Medium)",
  "domino's pepperoni": "Domino's Pepperoni Pizza (Medium)",
  'peppy paneer pizza': "Domino's Peppy Paneer Pizza (Medium)",
  'chicken dominator': "Domino's Chicken Dominator Pizza (Medium)",
  'cheese burst': "Domino's Cheese Burst Pizza (Medium)",
  "domino's lava cake": "Domino's Chocolate Lava Cake",

  // Starbucks
  'caffe latte': "Starbucks Caffè Latte (Grande - 2% Milk)",
  'caramel macchiato': "Starbucks Caramel Macchiato (Grande - 2%)",
  'vanilla latte': "Starbucks Vanilla Latte (Grande - 2%)",
  'java chip frap': "Starbucks Java Chip Frappuccino (Grande)",
  'strawberry frappuccino': "Starbucks Strawberry Frappuccino (Grande)",
  'starbucks cold brew': "Starbucks Cold Brew (Grande)",
  'starbucks americano': "Starbucks Americano (Grande)",

  // Indian chains
  'chole bhature': "Haldiram's Chole Bhature",
  'channa kulcha': "Haldiram's Channa Kulcha",
  'pani puri': "Haldiram's Pani Puri (8 pieces)",
  'bhel puri': "Haldiram's Bhel Puri",
  'aloo tikki chaat': "Bikanervala Aloo Tikki Chaat",
  'dahi bhalla': "Bikanervala Dahi Bhalla",
  'raj kachori': "Bikanervala Raj Kachori",
  'steamed chicken momo': "Wow Momo Steamed Chicken Momo (8 pcs)",
  'chicken biryani': "Behrouz Biryani Chicken Biryani (Regular)",
  'mutton biryani': "Behrouz Biryani Mutton Biryani (Regular)",
  'veg biryani': "Behrouz Biryani Veg Biryani (Regular)",
  'magnum': "Behrouz Biryani Chicken Biryani (Regular)",
  'chicken wrap': "Faasos Chicken Tikka Wrap",
  'paneer wrap': "Faasos Paneer Tikka Wrap",
  'cutting chai': "Chaayos Cutting Chai",
  'ginger chai': "Chaayos Ginger Chai",
  'cold coffee': "Cafe Coffee Day Cold Coffee (Regular)",
};

export function restaurantLookup(input: string): { canonical: string; brand: string } | null {
  const lower = input.toLowerCase().trim();
  for (const [key, value] of Object.entries(RESTAURANT_BRAND_FOOD_MAP)) {
    if (lower === key || lower.includes(key)) {
      const parts = value.split(' ');
      return { canonical: value, brand: parts[0] };
    }
  }
  return null;
}
