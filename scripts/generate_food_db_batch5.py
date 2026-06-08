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

# ── Final batch to push past 1000 ──
FINAL = [
    {"food_name":"biryani chicken","aliases":["chicken biryani","hyderabadi chicken biryani","chicken dum biryani","biriyani"],"calories_per_100g":170,"protein_per_100g":8,"carbs_per_100g":20,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"biryani vegetable","aliases":["vegetable biryani","veg biryani","mixed veg biryani"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"biryani mutton","aliases":["mutton biryani","lamb biryani","goat biryani","meat biryani"],"calories_per_100g":190,"protein_per_100g":10,"carbs_per_100g":19,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"biryani egg","aliases":["egg biryani","anda biryani","egg dum biryani"],"calories_per_100g":160,"protein_per_100g":6,"carbs_per_100g":22,"fat_per_100g":6,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"pulao vegetable","aliases":["vegetable pulao","veg pulao","mixed veg rice","pilaf"],"calories_per_100g":130,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"jeera rice","aliases":["jeera rice","cumin rice","zeera rice","indian cumin rice"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":26,"fat_per_100g":3,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"coconut rice","aliases":["coconut rice","nariyal chawal","south indian coconut rice"],"calories_per_100g":180,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":9,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"khichdi","aliases":["khichdi","khichri","kitchari","rice lentil porridge","dal khichdi"],"calories_per_100g":100,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":1.5,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"poha","aliases":["poha","flattened rice","beaten rice","kanda poha","poha with peanuts"],"calories_per_100g":120,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":3,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"upma","aliases":["upma","sooji upma","semolina upma","rava upma","karnataka upma"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":4,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"roti","aliases":["roti","chapati","phulka","whole wheat roti","indian flatbread"],"calories_per_100g":210,"protein_per_100g":6,"carbs_per_100g":38,"fat_per_100g":4,"fiber_per_100g":4,"serving_size":"1 roti","serving_grams":30},
    {"food_name":"poori","aliases":["poori","puri","deep fried bread","indian puffy bread"],"calories_per_100g":280,"protein_per_100g":4,"carbs_per_100g":34,"fat_per_100g":15,"fiber_per_100g":1.5,"serving_size":"1 poori","serving_grams":20},
    {"food_name":"bhatura","aliases":["bhatura","bhature","fermented fried bread","chole bhature"],"calories_per_100g":250,"protein_per_100g":5,"carbs_per_100g":32,"fat_per_100g":12,"fiber_per_100g":1.5,"serving_size":"1 bhatura","serving_grams":60},
    {"food_name":"samosas (2 pieces)","aliases":["samosas","samosa","vegetable samosa","beef samosa"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"kebab seekh","aliases":["seekh kebab","minced meat kebab","seekh kabab","lamb seekh"],"calories_per_100g":230,"protein_per_100g":16,"carbs_per_100g":5,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":60},
    {"food_name":"tandoori chicken","aliases":["tandoori chicken","chicken tandoori","clay oven chicken","roasted spiced chicken"],"calories_per_100g":160,"protein_per_100g":22,"carbs_per_100g":2,"fat_per_100g":7,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":120},
    {"food_name":"naan","aliases":["naan","butter naan","garlic naan","plain naan","tandoori naan"],"calories_per_100g":260,"protein_per_100g":7,"carbs_per_100g":42,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 naan","serving_grams":50},
    {"food_name":"garlic naan","aliases":["garlic naan","naan garlic","garlic butter naan","stuffed garlic naan"],"calories_per_100g":270,"protein_per_100g":7,"carbs_per_100g":40,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 naan","serving_grams":60},
    {"food_name":"chicken 65","aliases":["chicken 65","spicy fried chicken","indian style fried chicken"],"calories_per_100g":210,"protein_per_100g":18,"carbs_per_100g":6,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"chilli chicken","aliases":["chilli chicken","indochinese chicken","chilli chicken dry","gravy chilli chicken"],"calories_per_100g":200,"protein_per_100g":16,"carbs_per_100g":8,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"gobi manchurian","aliases":["gobi manchurian","cauliflower manchurian","indochinese cauliflower","manchurian balls"],"calories_per_100g":130,"protein_per_100g":3,"carbs_per_100g":14,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"chicken manchurian","aliases":["chicken manchurian","indochinese chicken","manchurian gravy"],"calories_per_100g":180,"protein_per_100g":14,"carbs_per_100g":8,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"hakka noodles","aliases":["hakka noodles","indochinese noodles","veg hakka noodles","chicken hakka noodles"],"calories_per_100g":180,"protein_per_100g":5,"carbs_per_100g":26,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"schezwan rice","aliases":["schezwan rice","szechuan rice","indochinese spicy rice","fried rice schezwan"],"calories_per_100g":190,"protein_per_100g":5,"carbs_per_100g":28,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"manchow soup","aliases":["manchow soup","indochinese soup","hot and sour soup","spicy veg soup"],"calories_per_100g":40,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
]

NEW.extend(add(FINAL))

combined = existing + NEW
with open('D:\\FitnessApp\\assets\\food_database.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, indent=2, ensure_ascii=False)

print(f"Original: {len(existing)} items")
print(f"Added: {len(NEW)} new items")
print(f"Total: {len(combined)} items")
