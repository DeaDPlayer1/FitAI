import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { getDb } from './db';
import Fuse from 'fuse.js';
import foodDatabaseJson from '@/assets/food_database.json';
import indianBarcodes from '@/assets/indian_barcodes.json';

let model: tf.GraphModel | null = null;
let modelLoading = false;

const IMAGENET_FOOD_INDICES: Record<number, string> = {
  920: 'hot dog', 925: 'pizza', 930: 'burrito', 931: 'taco',
  937: 'chocolate sauce', 940: 'spaghetti', 941: 'lasagna',
  942: 'ravioli', 943: 'cannelloni', 944: 'gnocchi',
  945: 'pasta', 946: 'risotto', 947: 'sushi',
  948: 'ramen', 949: 'dumpling', 950: 'dim sum',
  951: 'pancake', 952: 'waffle', 953: 'french toast',
  954: 'omelette', 955: 'scrambled eggs', 956: 'fried eggs',
  957: 'boiled eggs', 958: 'poached eggs',
  959: 'bread', 960: 'toast', 961: 'bagel',
  962: 'croissant', 963: 'brioche', 964: 'roll',
  965: 'donut', 966: 'cake', 967: 'cupcake',
  968: 'cookie', 969: 'brownie', 970: 'pie',
  971: 'cheesecake', 972: 'ice cream', 973: 'frozen yogurt',
  974: 'popsicle', 975: 'lollipop', 976: 'candy',
  977: 'chocolate', 978: 'marshmallow', 979: 'gummy bear',
  980: 'popcorn', 981: 'pretzel', 982: 'chips',
  983: 'nachos', 984: 'french fries', 985: 'onion ring',
  986: 'chicken wing', 987: 'chicken nugget', 988: 'fried chicken',
  989: 'roast chicken', 990: 'turkey', 991: 'duck',
  992: 'goose', 993: 'pork chop', 994: 'ham',
  995: 'bacon', 996: 'sausage', 997: 'meatball',
  998: 'steak', 999: 'roast beef', 1000: 'lamb chop',
  1001: 'lamb', 1002: 'veal', 1003: 'game meat',
  1004: 'salmon', 1005: 'tuna', 1006: 'trout',
  1007: 'mackerel', 1008: 'sardine', 1009: 'anchovy',
  1010: 'cod', 1011: 'haddock', 1012: 'halibut',
  1013: 'flounder', 1014: 'sole', 1015: 'catfish',
  1016: 'bass', 1017: 'snapper', 1018: 'sea bass',
  1019: 'shrimp', 1020: 'lobster', 1021: 'crab',
  1022: 'crayfish', 1023: 'clam', 1024: 'mussel',
  1025: 'oyster', 1026: 'scallop', 1027: 'squid',
  1028: 'octopus', 1029: 'calamari',
  1030: 'apple', 1031: 'banana', 1032: 'orange',
  1033: 'grapefruit', 1034: 'lemon', 1035: 'lime',
  1036: 'grape', 1037: 'strawberry', 1038: 'blueberry',
  1039: 'raspberry', 1040: 'blackberry', 1041: 'cherry',
  1042: 'peach', 1043: 'nectarine', 1044: 'apricot',
  1045: 'plum', 1046: 'pear', 1047: 'quince',
  1048: 'fig', 1049: 'date', 1050: 'mango',
  1051: 'papaya', 1052: 'pineapple', 1053: 'coconut',
  1054: 'avocado', 1055: 'tomato', 1056: 'cucumber',
  1057: 'pumpkin', 1058: 'zucchini', 1059: 'eggplant',
  1060: 'bell pepper', 1061: 'chili pepper', 1062: 'jalapeno',
  1063: 'broccoli', 1064: 'cauliflower', 1065: 'cabbage',
  1066: 'brussels sprout', 1067: 'kale', 1068: 'spinach',
  1069: 'lettuce', 1070: 'arugula', 1071: 'celery',
  1072: 'asparagus', 1073: 'green bean', 1074: 'pea',
  1075: 'corn', 1076: 'carrot', 1077: 'radish',
  1078: 'beet', 1079: 'potato', 1080: 'sweet potato',
  1081: 'yam', 1082: 'turnip', 1083: 'parsnip',
  1084: 'ginger', 1085: 'turmeric', 1086: 'garlic',
  1087: 'onion', 1088: 'shallot', 1089: 'leek',
  1090: 'scallion', 1091: 'mushroom', 1092: 'truffle',
  1093: 'rice', 1094: 'quinoa', 1095: 'oatmeal',
  1096: 'cereal', 1097: 'granola', 1098: 'muesli',
  1099: 'pasta salad', 1100: 'potato salad', 1101: 'coleslaw',
  1102: 'mixed salad', 1103: 'caesar salad', 1104: 'greek salad',
  1105: 'bean salad', 1106: 'fruit salad',
  1107: 'soup', 1108: 'chowder', 1109: 'bisque',
  1110: 'stew', 1111: 'chili', 1112: 'curry',
  1113: 'dal', 1114: 'biryani', 1115: 'pulao',
  1116: 'rice bowl', 1117: 'stir fry', 1118: 'frittata',
  1119: 'quiche', 1120: 'sandwich', 1121: 'wrap',
  1122: 'burger', 1123: 'sub', 1124: 'panini',
  1125: 'grilled cheese', 1126: 'quesadilla', 1127: 'tortilla',
  1128: 'naan', 1129: 'roti', 1130: 'pita',
  1131: 'baguette', 1132: 'sourdough', 1133: 'rye bread',
  1134: 'whole wheat bread', 1135: 'white bread',
  1136: 'butter', 1137: 'cheese', 1138: 'yogurt',
  1139: 'milk', 1140: 'cream', 1141: 'ice cream',
  1142: 'frozen yogurt', 1143: 'sorbet', 1144: 'gelato',
  1145: 'pudding', 1146: 'custard', 1147: 'mousse',
  1148: 'jelly', 1149: 'jam', 1150: 'honey',
  1151: 'maple syrup', 1152: 'peanut butter', 1153: 'almond butter',
  1154: 'nutella', 1155: 'hummus', 1156: 'guacamole',
  1157: 'salsa', 1158: 'pesto', 1159: 'mayonnaise',
  1160: 'ketchup', 1161: 'mustard', 1162: 'soy sauce',
  1163: 'vinegar', 1164: 'olive oil', 1165: 'vegetable oil',
  1166: 'coconut oil', 1167: 'ghee',
};

const MODEL_URL = 'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json';

export interface ClassifierResult {
  foodName: string;
  confidence: number;
  source: 'image_tf' | 'text_keyword';
}

export async function loadClassifierModel(): Promise<tf.GraphModel | null> {
  if (model) return model;
  if (modelLoading) {
    while (modelLoading) await new Promise(r => setTimeout(r, 200));
    return model;
  }
  modelLoading = true;
  try {
    await tf.ready();
    model = await tf.loadGraphModel(MODEL_URL, { fromTFHub: false });
    return model;
  } catch (err) {
    console.error('[onDeviceClassifier] Model load failed:', err);
    return null;
  } finally {
    modelLoading = false;
  }
}

export async function classifyImage(imageUri: string): Promise<ClassifierResult | null> {
  try {
    const loadedModel = await loadClassifierModel();
    if (!loadedModel) return null;

    const imageB64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const imageBuffer = Uint8Array.from(atob(imageB64), c => c.charCodeAt(0));
    let imageTensor = decodeJpeg(imageBuffer, 3);
    imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalized = tf.div(tf.sub(imageTensor as tf.Tensor3D, tf.scalar(127.5)), tf.scalar(127.5));
    const batched = tf.expandDims(normalized, 0);
    const predictions = loadedModel.predict(batched) as tf.Tensor;
    const values = await predictions.data();
    tf.dispose([imageTensor, normalized, batched, predictions]);

    let maxIndex = 0;
    let maxProb = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i] > maxProb) { maxProb = values[i]; maxIndex = i; }
    }
    if (maxProb < 0.1) return null;
    const foodName = IMAGENET_FOOD_INDICES[maxIndex];
    if (!foodName) return null;

    return { foodName, confidence: maxProb, source: 'image_tf' };
  } catch (err) {
    console.error('[onDeviceClassifier] Classification failed:', err);
    return null;
  }
}

let fuseInstance: Fuse<any> | null = null;

function getFuse(): Fuse<any> {
  if (fuseInstance) return fuseInstance;
  const allFoods = [
    ...(foodDatabaseJson as any[]),
    ...(indianBarcodes as any[]),
  ];
  fuseInstance = new Fuse(allFoods, {
    keys: ['food_name', 'name', 'brand', 'aliases'],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
  });
  return fuseInstance;
}

export async function classifyByText(query: string): Promise<ClassifierResult | null> {
  const fuse = getFuse();
  const results = fuse.search(query);
  if (results.length > 0 && results[0].score !== undefined && results[0].score! < 0.35) {
    const item = results[0].item;
    const name = item.food_name || item.name || '';
    if (!name) return null;
    return {
      foodName: name,
      confidence: 1 - (results[0].score || 0),
      source: 'text_keyword',
    };
  }
  try {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      `SELECT food_name FROM food_cache WHERE LOWER(food_name) LIKE ? LIMIT 5`,
      `%${query.toLowerCase()}%`
    );
    if (rows.length > 0) {
      return { foodName: rows[0].food_name, confidence: 0.7, source: 'text_keyword' };
    }
  } catch {}
  return null;
}

export async function getNutritionForClassified(foodName: string): Promise<{
  calories: number; protein: number; carbs: number; fat: number;
} | null> {
  try {
    const db = await getDb();
    const cached = await db.getFirstAsync<any>(
      `SELECT calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
       FROM food_cache WHERE LOWER(food_name) = ? LIMIT 1`,
      foodName.toLowerCase()
    );
    if (cached) {
      return {
        calories: cached.calories_per_100g || 0,
        protein: cached.protein_per_100g || 0,
        carbs: cached.carbs_per_100g || 0,
        fat: cached.fat_per_100g || 0,
      };
    }
  } catch {}
  return null;
}

export function isClassifierReady(): boolean {
  return model !== null;
}
