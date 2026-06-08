import json

with open('D:\\FitnessApp\\assets\\food_database.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)

existing_names = {e['food_name'].lower() for e in existing}

def add(data):
    valid = []
    for e in data:
        key = e['food_name'].lower()
        if key not in existing_names:
            existing_names.add(key)
            valid.append(e)
    return valid

NEW = []

# ── Fruits (individually) ──
FRUITS = [
    {"food_name":"grapes","aliases":["grape","red grapes","green grapes","seedless grapes"],"calories_per_100g":69,"protein_per_100g":0.7,"carbs_per_100g":18,"fat_per_100g":0.2,"fiber_per_100g":0.9,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"muskmelon","aliases":["muskmelon","cantaloupe","sweet melon","kharbuja"],"calories_per_100g":34,"protein_per_100g":0.8,"carbs_per_100g":8,"fat_per_100g":0.2,"fiber_per_100g":0.9,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"honeydew melon","aliases":["honeydew melon","honeydew","green melon"],"calories_per_100g":36,"protein_per_100g":0.5,"carbs_per_100g":9,"fat_per_100g":0.1,"fiber_per_100g":0.8,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"lychee","aliases":["lychee","litchi","lychee fruit","fresh lychee"],"calories_per_100g":66,"protein_per_100g":0.8,"carbs_per_100g":16.5,"fat_per_100g":0.4,"fiber_per_100g":1.3,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"dragon fruit","aliases":["dragon fruit","pitaya","red dragon fruit","white dragon fruit"],"calories_per_100g":60,"protein_per_100g":1.2,"carbs_per_100g":13,"fat_per_100g":0,"fiber_per_100g":3,"serving_size":"1 fruit","serving_grams":200},
    {"food_name":"jackfruit","aliases":["jackfruit","kathal","raw jackfruit","ripe jackfruit"],"calories_per_100g":95,"protein_per_100g":1.7,"carbs_per_100g":24,"fat_per_100g":0.6,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"sapodilla","aliases":["sapodilla","chikoo","chiku","sapota"],"calories_per_100g":83,"protein_per_100g":0.4,"carbs_per_100g":20,"fat_per_100g":0.4,"fiber_per_100g":2.5,"serving_size":"1 fruit","serving_grams":100},
    {"food_name":"custard apple","aliases":["custard apple","sitaphal","sugar apple","sharifa"],"calories_per_100g":94,"protein_per_100g":1.7,"carbs_per_100g":23,"fat_per_100g":0.6,"fiber_per_100g":2.4,"serving_size":"1 fruit","serving_grams":150},
    {"food_name":"jamun","aliases":["jamun","java plum","black plum","jambul"],"calories_per_100g":60,"protein_per_100g":0.7,"carbs_per_100g":15,"fat_per_100g":0.2,"fiber_per_100g":0.6,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"wood apple","aliases":["wood apple","bael fruit","bel patra","stone apple"],"calories_per_100g":87,"protein_per_100g":1.8,"carbs_per_100g":20,"fat_per_100g":0.2,"fiber_per_100g":5,"serving_size":"1 fruit","serving_grams":100},
    {"food_name":"rambutan","aliases":["rambutan","hairy fruit","sea coconut"],"calories_per_100g":84,"protein_per_100g":0.6,"carbs_per_100g":21,"fat_per_100g":0.2,"fiber_per_100g":0.9,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"passion fruit","aliases":["passion fruit","purple passion fruit","yellow passion fruit"],"calories_per_100g":97,"protein_per_100g":2.2,"carbs_per_100g":23,"fat_per_100g":0.7,"fiber_per_100g":10,"serving_size":"1 fruit","serving_grams":20},
    {"food_name":"pomelo","aliases":["pomelo","chinese grapefruit","pummelo"],"calories_per_100g":38,"protein_per_100g":0.8,"carbs_per_100g":10,"fat_per_100g":0,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"star fruit","aliases":["star fruit","carambola","five corner fruit"],"calories_per_100g":31,"protein_per_100g":1,"carbs_per_100g":7,"fat_per_100g":0.3,"fiber_per_100g":2.8,"serving_size":"1 fruit","serving_grams":100},
]

# ── Vegetables (individually) ──
VEGETABLES = [
    {"food_name":"peas","aliases":["peas","green peas","garden peas","mutter","matar"],"calories_per_100g":81,"protein_per_100g":5.4,"carbs_per_100g":14,"fat_per_100g":0.4,"fiber_per_100g":5.5,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"capsicum","aliases":["capsicum","bell pepper","green capsicum","red capsicum","yellow pepper"],"calories_per_100g":26,"protein_per_100g":1,"carbs_per_100g":5,"fat_per_100g":0.3,"fiber_per_100g":1.7,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"eggplant","aliases":["eggplant","aubergine","brinjal","baingan"],"calories_per_100g":25,"protein_per_100g":1,"carbs_per_100g":6,"fat_per_100g":0.2,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"zucchini","aliases":["zucchini","courgette","summer squash","baby marrow"],"calories_per_100g":17,"protein_per_100g":1.2,"carbs_per_100g":3.1,"fat_per_100g":0.3,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"sweet potato","aliases":["sweet potato","shakarkandi","orange sweet potato"],"calories_per_100g":86,"protein_per_100g":1.6,"carbs_per_100g":20,"fat_per_100g":0.1,"fiber_per_100g":3,"serving_size":"1 medium","serving_grams":150},
    {"food_name":"yam","aliases":["yam","suran","elephant foot yam","jimikand","cush cush"],"calories_per_100g":118,"protein_per_100g":1.5,"carbs_per_100g":28,"fat_per_100g":0.2,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"turnip","aliases":["turnip","shalgam","white turnip","purple top turnip"],"calories_per_100g":28,"protein_per_100g":0.9,"carbs_per_100g":6.4,"fat_per_100g":0.1,"fiber_per_100g":1.8,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"beetroot","aliases":["beetroot","beet","red beet","beet vegetable","chukandar"],"calories_per_100g":43,"protein_per_100g":1.6,"carbs_per_100g":10,"fat_per_100g":0.2,"fiber_per_100g":2.8,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"asparagus","aliases":["asparagus","green asparagus","white asparagus","asparagus spears"],"calories_per_100g":20,"protein_per_100g":2.2,"carbs_per_100g":4,"fat_per_100g":0.1,"fiber_per_100g":2.1,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"artichoke","aliases":["artichoke","globe artichoke","french artichoke","artichoke heart"],"calories_per_100g":50,"protein_per_100g":3.3,"carbs_per_100g":11,"fat_per_100g":0.2,"fiber_per_100g":5,"serving_size":"1 artichoke","serving_grams":120},
    {"food_name":"leek","aliases":["leek","leeks","spring leek","french leek"],"calories_per_100g":61,"protein_per_100g":1.5,"carbs_per_100g":14,"fat_per_100g":0.3,"fiber_per_100g":1.8,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"fennel","aliases":["fennel","fennel bulb","saunf","sweet fennel","finocchio"],"calories_per_100g":31,"protein_per_100g":1.2,"carbs_per_100g":7,"fat_per_100g":0.2,"fiber_per_100g":3.1,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"celery","aliases":["celery","celery stalk","celery stick","celery ribs"],"calories_per_100g":16,"protein_per_100g":0.7,"carbs_per_100g":3,"fat_per_100g":0.2,"fiber_per_100g":1.5,"serving_size":"1 stalk","serving_grams":40},
]

# ── Dairy & Alternatives ──
DAIRY = [
    {"food_name":"milk whole","aliases":["milk","whole milk","full cream milk","doodh","toned milk"],"calories_per_100g":61,"protein_per_100g":3.2,"carbs_per_100g":4.8,"fat_per_100g":3.3,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"milk skimmed","aliases":["skim milk","skimmed milk","fat free milk","non fat milk"],"calories_per_100g":34,"protein_per_100g":3.4,"carbs_per_100g":5,"fat_per_100g":0.2,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"toned milk","aliases":["toned milk","buffalo milk","double toned milk","standard milk"],"calories_per_100g":55,"protein_per_100g":3.5,"carbs_per_100g":4.5,"fat_per_100g":2.5,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"yogurt plain","aliases":["yogurt","plain yogurt","dahi","curd","natural yogurt"],"calories_per_100g":61,"protein_per_100g":3.5,"carbs_per_100g":4.7,"fat_per_100g":3.3,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"greek yogurt","aliases":["greek yogurt","strained yogurt","hung curd","thick yogurt"],"calories_per_100g":100,"protein_per_100g":10,"carbs_per_100g":3.5,"fat_per_100g":5,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"buttermilk","aliases":["buttermilk","chaach","chaas","mohi","spiced buttermilk"],"calories_per_100g":40,"protein_per_100g":3,"carbs_per_100g":4,"fat_per_100g":1,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"paneer fresh","aliases":["paneer","fresh paneer","cottage cheese indian","malai paneer"],"calories_per_100g":280,"protein_per_100g":18,"carbs_per_100g":3,"fat_per_100g":22,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"mozzarella","aliases":["mozzarella cheese","mozzarella","fresh mozzarella","buffalo mozzarella"],"calories_per_100g":280,"protein_per_100g":22,"carbs_per_100g":2,"fat_per_100g":20,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":50},
    {"food_name":"cheddar cheese","aliases":["cheddar cheese","cheddar","sharp cheddar","mature cheddar"],"calories_per_100g":400,"protein_per_100g":25,"carbs_per_100g":1.3,"fat_per_100g":33,"fiber_per_100g":0,"serving_size":"1 slice","serving_grams":20},
    {"food_name":"parmesan cheese","aliases":["parmesan cheese","parmesan","parmigiano","grated cheese"],"calories_per_100g":420,"protein_per_100g":28,"carbs_per_100g":3,"fat_per_100g":28,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":10},
    {"food_name":"feta cheese","aliases":["feta cheese","feta","greek feta","crumbled feta"],"calories_per_100g":260,"protein_per_100g":14,"carbs_per_100g":4,"fat_per_100g":21,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":30},
    {"food_name":"ricotta cheese","aliases":["ricotta cheese","ricotta","italian whey cheese"],"calories_per_100g":160,"protein_per_100g":11,"carbs_per_100g":5,"fat_per_100g":10,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"tofu firm","aliases":["tofu","firm tofu","soy tofu","bean curd","tofu paneer"],"calories_per_100g":76,"protein_per_100g":8,"carbs_per_100g":2,"fat_per_100g":4.8,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"tempeh","aliases":["tempeh","fermented soy","tempe","soybean cake"],"calories_per_100g":190,"protein_per_100g":20,"carbs_per_100g":9,"fat_per_100g":10,"fiber_per_100g":5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"seitan","aliases":["seitan","wheat gluten","mock meat","vital wheat gluten"],"calories_per_100g":110,"protein_per_100g":23,"carbs_per_100g":4,"fat_per_100g":1,"fiber_per_100g":1,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"soy milk","aliases":["soy milk","soyamilk","soya milk","plant milk soy"],"calories_per_100g":34,"protein_per_100g":3.3,"carbs_per_100g":2.5,"fat_per_100g":1.8,"fiber_per_100g":0.5,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"almond milk","aliases":["almond milk","unsweetened almond milk","almond beverage"],"calories_per_100g":17,"protein_per_100g":0.5,"carbs_per_100g":0.7,"fat_per_100g":1.3,"fiber_per_100g":0.3,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"oat milk","aliases":["oat milk","oat beverage","plant oat milk"],"calories_per_100g":47,"protein_per_100g":1,"carbs_per_100g":7,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 glass","serving_grams":200},
]

# ── Grains & Cereals ──
GRAINS = [
    {"food_name":"rice white","aliases":["rice","white rice","steamed rice","plain rice","chawal"],"calories_per_100g":130,"protein_per_100g":2.7,"carbs_per_100g":28,"fat_per_100g":0.3,"fiber_per_100g":0.4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"rice brown","aliases":["brown rice","unpolished rice","whole grain rice"],"calories_per_100g":111,"protein_per_100g":2.6,"carbs_per_100g":23,"fat_per_100g":0.9,"fiber_per_100g":1.8,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"quinoa","aliases":["quinoa","white quinoa","tri color quinoa","quinoa grain"],"calories_per_100g":120,"protein_per_100g":4.4,"carbs_per_100g":21,"fat_per_100g":1.9,"fiber_per_100g":2.8,"serving_size":"1 cup","serving_grams":185},
    {"food_name":"oats","aliases":["oats","rolled oats","steel cut oats","jowar flakes","oatmeal dry"],"calories_per_100g":71,"protein_per_100g":2.5,"carbs_per_100g":12,"fat_per_100g":1.5,"fiber_per_100g":1.7,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"millet","aliases":["millet","bajra","pearl millet","jowar","sorghum","ragi","finger millet"],"calories_per_100g":120,"protein_per_100g":3.5,"carbs_per_100g":25,"fat_per_100g":1.2,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"barley","aliases":["barley","pearl barley","jau","barley grain"],"calories_per_100g":123,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":0.5,"fiber_per_100g":3.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"buckwheat","aliases":["buckwheat","kuttu ka atta","soba flour","buckwheat groats"],"calories_per_100g":110,"protein_per_100g":4,"carbs_per_100g":23,"fat_per_100g":1,"fiber_per_100g":2.7,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"couscous","aliases":["couscous","moroccan couscous","israeli couscous","whole wheat couscous"],"calories_per_100g":112,"protein_per_100g":3.8,"carbs_per_100g":21,"fat_per_100g":0.2,"fiber_per_100g":1.4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"corn on the cob","aliases":["corn on the cob","sweet corn","bhutta","corn cob","makai"],"calories_per_100g":96,"protein_per_100g":3.4,"carbs_per_100g":21,"fat_per_100g":1.5,"fiber_per_100g":2.4,"serving_size":"1 ear","serving_grams":150},
    {"food_name":"popcorn","aliases":["popcorn","plain popcorn","air popped popcorn","makhana"],"calories_per_100g":380,"protein_per_100g":12,"carbs_per_100g":60,"fat_per_100g":4,"fiber_per_100g":10,"serving_size":"1 cup","serving_grams":30},
    {"food_name":"rice cakes","aliases":["rice cakes","puffed rice cakes","murmura cake","plain rice cake"],"calories_per_100g":350,"protein_per_100g":6,"carbs_per_100g":80,"fat_per_100g":0.5,"fiber_per_100g":1.5,"serving_size":"1 cake","serving_grams":10},
    {"food_name":"coconut fresh","aliases":["coconut","fresh coconut","nariyal","young coconut","dry coconut"],"calories_per_100g":350,"protein_per_100g":3.3,"carbs_per_100g":15,"fat_per_100g":33,"fiber_per_100g":9,"serving_size":"1 cup","serving_grams":80},
]

# ── Chaat & Street Food ──
CHAAT = [
    {"food_name":"papdi chaat","aliases":["papdi chaat","papri chaat","dahi papdi chat","crispy chaat"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"dahi puri","aliases":["dahi puri","yogurt puri","dahi batata puri","puri chaat"],"calories_per_100g":160,"protein_per_100g":4,"carbs_per_100g":20,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":120},
    {"food_name":"samosa chaat","aliases":["samosa chaat","samosa beaten","samosa yogurt"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"aloo tikki chaat","aliases":["aloo tikki chaat","aloo tikki","potato cutlet chaat","tikki"],"calories_per_100g":150,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"sev puri","aliases":["sev puri","puri with sev","flat puri chaat"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":100},
    {"food_name":"ragda pattice","aliases":["ragda pattice","ragda patties","pea gravy cutlet"],"calories_per_100g":140,"protein_per_100g":5,"carbs_per_100g":18,"fat_per_100g":6,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"dahi vada","aliases":["dahi vada","dahi bhalla","yogurt fritters","dahi bada"],"calories_per_100g":130,"protein_per_100g":4,"carbs_per_100g":14,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"fruit chaat","aliases":["fruit chaat","mixed fruit chaat","fresh fruit with spices"],"calories_per_100g":60,"protein_per_100g":0.5,"carbs_per_100g":14,"fat_per_100g":0.3,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"sprouts chaat","aliases":["sprouts chaat","moong sprouts chaat","healthy chaat","sprouts salad"],"calories_per_100g":80,"protein_per_100g":5,"carbs_per_100g":10,"fat_per_100g":2,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"kolkata roll","aliases":["kolkata roll","egg roll","chicken roll","kathi roll","kabab roll"],"calories_per_100g":200,"protein_per_100g":8,"carbs_per_100g":22,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 roll","serving_grams":150},
    {"food_name":"seekh kebab roll","aliases":["seekh kebab roll","kebab wrap","seekh paratha roll"],"calories_per_100g":220,"protein_per_100g":10,"carbs_per_100g":22,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 roll","serving_grams":180},
]

# ── South Indian staples ──
SOUTH_INDIAN = [
    {"food_name":"sambar","aliases":["sambar","sambhar","mixed lentil stew","south indian dal"],"calories_per_100g":40,"protein_per_100g":2.5,"carbs_per_100g":6,"fat_per_100g":1,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"uttapam","aliases":["uttapam","uthappam","rice pancake","onion uttapam","tomato uttapam"],"calories_per_100g":130,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":4,"fiber_per_100g":1,"serving_size":"1 uttapam","serving_grams":80},
    {"food_name":"rasam vada","aliases":["rasam vada","vada in soup","medu vada rasam"],"calories_per_100g":120,"protein_per_100g":4,"carbs_per_100g":14,"fat_per_100g":6,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":200},
    {"food_name":"idli sambar","aliases":["idli sambar","idli with sambar","rice cake sambar","sambar idli"],"calories_per_100g":80,"protein_per_100g":3,"carbs_per_100g":14,"fat_per_100g":1.5,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"dosa plain","aliases":["dosa","plain dosa","south indian crepe","sada dosa"],"calories_per_100g":120,"protein_per_100g":3,"carbs_per_100g":20,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 dosa","serving_grams":80},
    {"food_name":"masala dosa","aliases":["masala dosa","spiced potato dosa","mumbai masala dosa"],"calories_per_100g":125,"protein_per_100g":3,"carbs_per_100g":19,"fat_per_100g":4,"fiber_per_100g":1.5,"serving_size":"1 dosa","serving_grams":150},
    {"food_name":"mushroom dosa","aliases":["mushroom dosa","spiced mushroom dosa","mushroom masala"],"calories_per_100g":120,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":4,"fiber_per_100g":1.5,"serving_size":"1 dosa","serving_grams":150},
    {"food_name":"rava dosa","aliases":["rava dosa","semolina dosa","crispy rava dosa"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 dosa","serving_grams":60},
]

# ── More Paneer Delights ──
PANEER = [
    {"food_name":"paneer butter masala","aliases":["paneer butter masala","paneer makhani","butter paneer","creamy paneer"],"calories_per_100g":210,"protein_per_100g":9,"carbs_per_100g":6,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kadai paneer","aliases":["kadai paneer","kadhai paneer","paneer kadai","paneer capsicum"],"calories_per_100g":170,"protein_per_100g":8,"carbs_per_100g":7,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"shahi paneer","aliases":["shahi paneer","royal paneer","rich creamy paneer","paneer shahi"],"calories_per_100g":220,"protein_per_100g":8,"carbs_per_100g":7,"fat_per_100g":18,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"paneer bhurji","aliases":["paneer bhurji","scrambled paneer","grated paneer curry"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":5,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
]

all_groups = [
    FRUITS, VEGETABLES, DAIRY, GRAINS, CHAAT, SOUTH_INDIAN, PANEER
]

for group in all_groups:
    NEW.extend(add(group))

combined = existing + NEW
with open('D:\\FitnessApp\\assets\\food_database.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, indent=2, ensure_ascii=False)

print(f"Original: {len(existing)} items")
print(f"Added: {len(NEW)} new items")
print(f"Total: {len(combined)} items")
