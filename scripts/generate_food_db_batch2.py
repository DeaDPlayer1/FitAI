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

# ── More Indian Regional ──
MORE_INDIAN = [
    {"food_name":"chicken chettinad","aliases":["chicken chettinad","chettinad chicken","spicy chicken chettinad"],"calories_per_100g":180,"protein_per_100g":16,"carbs_per_100g":5,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"chettinad fish fry","aliases":["chettinad fish fry","fish fry chettinad","karimeen fry"],"calories_per_100g":150,"protein_per_100g":18,"carbs_per_100g":3,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"kerala fish curry","aliases":["kerala fish curry","meen curry","kerala meen curry"],"calories_per_100g":110,"protein_per_100g":13,"carbs_per_100g":3,"fat_per_100g":6,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kerala parotta","aliases":["kerala parotta","malabar parotta","layered parotta"],"calories_per_100g":320,"protein_per_100g":6,"carbs_per_100g":42,"fat_per_100g":14,"fiber_per_100g":1.5,"serving_size":"1 parotta","serving_grams":60},
    {"food_name":"pathiri","aliases":["pathiri","rice roti","malabar pathiri"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":32,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 pathiri","serving_grams":40},
    {"food_name":"kuzhi paniyaram","aliases":["kuzhi paniyaram","paniyaram","gundpongalu","kuzhi appam"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":28,"fat_per_100g":6,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"kaalan","aliases":["kaalan","kalan","kerala sour curry","yam curry"],"calories_per_100g":70,"protein_per_100g":2,"carbs_per_100g":7,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"pachadi","aliases":["pachadi","cucumber pachadi","kerala pachadi"],"calories_per_100g":40,"protein_per_100g":1,"carbs_per_100g":4,"fat_per_100g":2.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"kerala egg roast","aliases":["kerala egg roast","egg roast","mutta roast"],"calories_per_100g":130,"protein_per_100g":9,"carbs_per_100g":3,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kerala beef curry","aliases":["kerala beef curry","beef curry kerala","naadan beef curry"],"calories_per_100g":200,"protein_per_100g":18,"carbs_per_100g":5,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"andhra chicken curry","aliases":["andhra chicken curry","andhra style chicken","kodi kura"],"calories_per_100g":170,"protein_per_100g":15,"carbs_per_100g":5,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"andhra fish curry","aliases":["andhra fish curry","chepala pulusu","andhra style fish"],"calories_per_100g":110,"protein_per_100g":13,"carbs_per_100g":4,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"gongura chicken","aliases":["gongura chicken","gongura kodi","sorrel chicken"],"calories_per_100g":160,"protein_per_100g":14,"carbs_per_100g":5,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"gongura pachadi","aliases":["gongura pachadi","sorrel chutney","andhra gongura"],"calories_per_100g":30,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"pesarattu","aliases":["pesarattu","green gram dosa","moong dal dosa"],"calories_per_100g":140,"protein_per_100g":6,"carbs_per_100g":22,"fat_per_100g":3,"fiber_per_100g":3,"serving_size":"1 pesarattu","serving_grams":80},
    {"food_name":"punugulu","aliases":["punugulu","andhra fritters","rice fritters"],"calories_per_100g":200,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"bobbatlu","aliases":["bobbatlu","puran poli","holige","bobbattu"],"calories_per_100g":280,"protein_per_100g":5,"carbs_per_100g":45,"fat_per_100g":9,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"chiroti rava","aliases":["chiroti rava","chiroti","mysore chiroti"],"calories_per_100g":300,"protein_per_100g":4,"carbs_per_100g":38,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"bisi bele bath","aliases":["bisi bele bath","bisi bele huli anna","karnataka rice lentil"],"calories_per_100g":130,"protein_per_100g":5,"carbs_per_100g":22,"fat_per_100g":3,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"vangi bath","aliases":["vangi bath","brinjal rice","eggplant rice karnataka"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":26,"fat_per_100g":3,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"chitranna","aliases":["chitranna","lemon rice karnataka","south indian lemon rice"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":26,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kosambari","aliases":["kosambari","lentil salad","karnataka salad"],"calories_per_100g":80,"protein_per_100g":5,"carbs_per_100g":8,"fat_per_100g":3,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"hayagreeva","aliases":["hayagreeva","chana dal sweet","karnataka dessert"],"calories_per_100g":220,"protein_per_100g":6,"carbs_per_100g":38,"fat_per_100g":6,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"obattu","aliases":["obattu","karnataka holige","sweet stuffed bread"],"calories_per_100g":270,"protein_per_100g":5,"carbs_per_100g":42,"fat_per_100g":9,"fiber_per_100g":2.5,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"kadubu","aliases":["kadubu","steamed rice dumpling","karnataka modak"],"calories_per_100g":150,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"neer dosa","aliases":["neer dosa","thin rice dosa","water dosa"],"calories_per_100g":110,"protein_per_100g":2,"carbs_per_100g":20,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 dosa","serving_grams":60},
    {"food_name":"kori rotti","aliases":["kori rotti","chicken curry with crispy rotti","mangalore dish"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":18,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"neer majjige","aliases":["neer majjige","buttermilk karnataka","spiced buttermilk"],"calories_per_100g":20,"protein_per_100g":1,"carbs_per_100g":2,"fat_per_100g":1,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"rasam","aliases":["rasam","tomato rasam","pepper rasam","south indian soup"],"calories_per_100g":25,"protein_per_100g":1.2,"carbs_per_100g":4,"fat_per_100g":0.3,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"mor kuzhambu","aliases":["mor kuzhambu","buttermilk gravy","south indian moru"],"calories_per_100g":40,"protein_per_100g":2,"carbs_per_100g":4,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"vatha kuzhambu","aliases":["vatha kuzhambu","tamarind gravy","south indian kuzhambu"],"calories_per_100g":35,"protein_per_100g":1,"carbs_per_100g":5,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"paruppu usili","aliases":["paruppu usili","crumbled lentil","tamil usili"],"calories_per_100g":110,"protein_per_100g":7,"carbs_per_100g":12,"fat_per_100g":4,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"keerai kootu","aliases":["keerai kootu","spinach lentil","green kootu"],"calories_per_100g":60,"protein_per_100g":4,"carbs_per_100g":6,"fat_per_100g":2,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"vada curry","aliases":["vada curry","medu vada curry","south indian vada curry"],"calories_per_100g":130,"protein_per_100g":4,"carbs_per_100g":12,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"thayir sadam","aliases":["thayir sadam","curd rice tamil","yogurt rice"],"calories_per_100g":100,"protein_per_100g":3,"carbs_per_100g":16,"fat_per_100g":3,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"puliyodarai","aliases":["puliyodarai","tamarind rice tamil","puliyogare"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"bird eye chilli","aliases":["bird eye chilli","kanthari mulagu","naga chilli"],"calories_per_100g":40,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 tbsp","serving_grams":10},
    {"food_name":"curry leaves chutney","aliases":["curry leaves chutney","karivepaku chutney","karuveppilai chutney"],"calories_per_100g":40,"protein_per_100g":1,"carbs_per_100g":4,"fat_per_100g":2.5,"fiber_per_100g":1,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"coriander leaves chutney","aliases":["coriander chutney","kothamalli chutney","dhaniya chutney"],"calories_per_100g":25,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"mint chutney","aliases":["mint chutney","pudina chutney","green chutney"],"calories_per_100g":25,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"onion raita","aliases":["onion raita","pyaaz ka raita","raita onion"],"calories_per_100g":40,"protein_per_100g":1.5,"carbs_per_100g":4,"fat_per_100g":2,"fiber_per_100g":0.3,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"boondi raita","aliases":["boondi raita","boondi ka raita","crispy gram flour raita"],"calories_per_100g":80,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":4.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"mixed vegetable raita","aliases":["mixed vegetable raita","mix veg raita","raita"],"calories_per_100g":45,"protein_per_100g":1.5,"carbs_per_100g":5,"fat_per_100g":2.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"aloo methi","aliases":["aloo methi","potato fenugreek","aloo methi sabzi"],"calories_per_100g":70,"protein_per_100g":2,"carbs_per_100g":9,"fat_per_100g":3,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"aloo shimla mirch","aliases":["aloo shimla mirch","potato capsicum","aloo capsicum"],"calories_per_100g":65,"protein_per_100g":1.5,"carbs_per_100g":8,"fat_per_100g":3,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"paneer capsicum","aliases":["paneer capsicum","paneer shimla mirch","capsicum paneer"],"calories_per_100g":160,"protein_per_100g":9,"carbs_per_100g":6,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"mushroom matar","aliases":["mushroom matar","mushroom pea curry","mushroom mutter"],"calories_per_100g":70,"protein_per_100g":4,"carbs_per_100g":6,"fat_per_100g":4,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"paneer do pyaza","aliases":["paneer do pyaza","paneer do pyaaza","double onion paneer"],"calories_per_100g":160,"protein_per_100g":8,"carbs_per_100g":7,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"dal pancharatna","aliases":["dal pancharatna","five lentil dal","pancharatna dal"],"calories_per_100g":110,"protein_per_100g":7,"carbs_per_100g":17,"fat_per_100g":2.5,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"dal palak","aliases":["dal palak","spinach dal","palak dal"],"calories_per_100g":90,"protein_per_100g":6,"carbs_per_100g":14,"fat_per_100g":2,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"dal dhokli","aliases":["dal dhokli","gujarati dal with dumplings","dal dhokli gujarati"],"calories_per_100g":120,"protein_per_100g":5,"carbs_per_100g":18,"fat_per_100g":3,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"sev tameta","aliases":["sev tameta","crispy noodles tomato gravy","gujarati sev tamatar"],"calories_per_100g":100,"protein_per_100g":2,"carbs_per_100g":12,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"methi malai matar","aliases":["methi malai matar","fenugreek cream peas","methi mutter malai"],"calories_per_100g":100,"protein_per_100g":4,"carbs_per_100g":7,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"navratan korma","aliases":["navratan korma","nine jewel curry","mixed vegetable korma"],"calories_per_100g":130,"protein_per_100g":3,"carbs_per_100g":10,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"veg jalfrezi","aliases":["veg jalfrezi","vegetable stir fry","jalfrezi"],"calories_per_100g":70,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"bhindi do pyaza","aliases":["bhindi do pyaza","okra with onion","double onion okra"],"calories_per_100g":75,"protein_per_100g":2.5,"carbs_per_100g":7,"fat_per_100g":4.5,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"tindora sabzi","aliases":["tindora sabzi","ivy gourd curry","kundru sabzi"],"calories_per_100g":40,"protein_per_100g":1.5,"carbs_per_100g":5,"fat_per_100g":2,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"chawli sabzi","aliases":["chawli sabzi","black eyed peas curry","lobhiya sabzi"],"calories_per_100g":90,"protein_per_100g":5,"carbs_per_100g":12,"fat_per_100g":3,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"aduki beans curry","aliases":["aduki beans curry","aduki sabzi","red cowpea curry"],"calories_per_100g":100,"protein_per_100g":6,"carbs_per_100g":14,"fat_per_100g":2.5,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"drumstick curry","aliases":["drumstick curry","sahjan ki sabzi","moringa curry"],"calories_per_100g":50,"protein_per_100g":2.5,"carbs_per_100g":6,"fat_per_100g":2,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"karela sabzi","aliases":["karela sabzi","bitter gourd curry","karela recipe"],"calories_per_100g":40,"protein_per_100g":1.5,"carbs_per_100g":5,"fat_per_100g":2,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"chana dal","aliases":["chana dal","split chickpea dal","bengal gram dal"],"calories_per_100g":120,"protein_per_100g":7,"carbs_per_100g":20,"fat_per_100g":2,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"masoor dal","aliases":["masoor dal","red lentil dal","orange dal"],"calories_per_100g":110,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":1.5,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"masoor dal tadka","aliases":["masoor dal tadka","tempered red lentil","dal tadka masoor"],"calories_per_100g":115,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":2.5,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"green moong dal","aliases":["green moong dal","whole moong","sabut moong"],"calories_per_100g":105,"protein_per_100g":7,"carbs_per_100g":18,"fat_per_100g":1,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"sabut masoor","aliases":["sabut masoor","whole red lentils","brown lentils"],"calories_per_100g":110,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":1,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"rajma chawal","aliases":["rajma chawal","kidney beans rice","rice kidney beans"],"calories_per_100g":140,"protein_per_100g":6,"carbs_per_100g":22,"fat_per_100g":3,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":350},
    {"food_name":"chole bhature combo","aliases":["chole bhature combo","chole bhature plate","channa bhatura full"],"calories_per_100g":240,"protein_per_100g":7,"carbs_per_100g":33,"fat_per_100g":10,"fiber_per_100g":4,"serving_size":"1 plate","serving_grams":350},
    {"food_name":"puri sabzi","aliases":["puri sabzi","poori sabzi","puri aloo sabzi"],"calories_per_100g":200,"protein_per_100g":4,"carbs_per_100g":26,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"khaman","aliases":["khaman","khaman dhokla","gujarati khaman"],"calories_per_100g":150,"protein_per_100g":6,"carbs_per_100g":24,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"patra","aliases":["patra","colocasia leaf roll","aloo patra","arbi patta"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"chakli","aliases":["chakli","murukku","chakri","savory spiral snack"],"calories_per_100g":400,"protein_per_100g":8,"carbs_per_100g":50,"fat_per_100g":19,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":30},
    {"food_name":"chewda","aliases":["chewda","chivda","poha mixture","flattened rice snack"],"calories_per_100g":350,"protein_per_100g":6,"carbs_per_100g":48,"fat_per_100g":16,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":30},
    {"food_name":"mathri","aliases":["mathri","mathi","savory biscuit","rajasthani snack"],"calories_per_100g":380,"protein_per_100g":7,"carbs_per_100g":46,"fat_per_100g":19,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":15},
    {"food_name":"bhakarwadi","aliases":["bhakarwadi","bakharwadi","maharashtrian snack"],"calories_per_100g":380,"protein_per_100g":7,"carbs_per_100g":44,"fat_per_100g":20,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":15},
    {"food_name":"shankarpali","aliases":["shankarpali","shakkarpare","sweet diamond cuts"],"calories_per_100g":380,"protein_per_100g":6,"carbs_per_100g":52,"fat_per_100g":17,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":30},
    {"food_name":"namak para","aliases":["namak para","salted diamond cuts","namak pare"],"calories_per_100g":380,"protein_per_100g":6,"carbs_per_100g":48,"fat_per_100g":19,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":30},
    {"food_name":"karanji","aliases":["karanji","karjikayi","coconut dumpling","sweet gujiya"],"calories_per_100g":320,"protein_per_100g":5,"carbs_per_100g":42,"fat_per_100g":16,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":25},
    {"food_name":"gujiya","aliases":["gujiya","gujia","stuffed sweet dumpling","holi special"],"calories_per_100g":320,"protein_per_100g":5,"carbs_per_100g":42,"fat_per_100g":16,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":25},
    {"food_name":"shakarpara","aliases":["shakarpara","sweet crunchy snack","shakkarpare"],"calories_per_100g":370,"protein_per_100g":5,"carbs_per_100g":48,"fat_per_100g":18,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":30},
    {"food_name":"pindi chana","aliases":["pindi chana","rawalpindi chole","punjabi chana"],"calories_per_100g":130,"protein_per_100g":6,"carbs_per_100g":16,"fat_per_100g":5,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"bhindi","aliases":["bhindi","okra","lady finger","bhindi sabzi","bhindi masala"],"calories_per_100g":33,"protein_per_100g":1.9,"carbs_per_100g":7,"fat_per_100g":0.2,"fiber_per_100g":3.2,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"haldi doodh","aliases":["haldi doodh","turmeric milk","golden milk","haldi ka doodh"],"calories_per_100g":50,"protein_per_100g":2,"carbs_per_100g":6,"fat_per_100g":2,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":200},
]

# ── Global Breakfast Items ──
BREAKFAST = [
    {"food_name":"avocado toast","aliases":["avocado toast","avocado on toast","avo toast"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":11,"fiber_per_100g":3,"serving_size":"1 slice","serving_grams":80},
    {"food_name":"scrambled eggs","aliases":["scrambled eggs","scrambled egg","butter eggs"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":2,"fat_per_100g":14,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"omelette","aliases":["omelette","plain omelette","egg omelette","french omelette"],"calories_per_100g":180,"protein_per_100g":13,"carbs_per_100g":1,"fat_per_100g":14,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"cheese omelette","aliases":["cheese omelette","omelette with cheese","cheesy omelette"],"calories_per_100g":220,"protein_per_100g":14,"carbs_per_100g":1.5,"fat_per_100g":18,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":120},
    {"food_name":"vegetable omelette","aliases":["vegetable omelette","veg omelette","masala omelette"],"calories_per_100g":140,"protein_per_100g":10,"carbs_per_100g":3,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":120},
    {"food_name":"boiled eggs","aliases":["boiled egg","hard boiled egg","soft boiled egg","boiled eggs"],"calories_per_100g":155,"protein_per_100g":13,"carbs_per_100g":1.1,"fat_per_100g":11,"fiber_per_100g":0,"serving_size":"1 egg","serving_grams":50},
    {"food_name":"poached eggs","aliases":["poached egg","poached eggs","egg poached"],"calories_per_100g":155,"protein_per_100g":13,"carbs_per_100g":1.1,"fat_per_100g":11,"fiber_per_100g":0,"serving_size":"1 egg","serving_grams":50},
    {"food_name":"fried eggs","aliases":["fried egg","sunny side up","over easy egg","egg fry"],"calories_per_100g":180,"protein_per_100g":13,"carbs_per_100g":1,"fat_per_100g":14,"fiber_per_100g":0,"serving_size":"1 egg","serving_grams":50},
    {"food_name":"cereal with milk","aliases":["cereal with milk","breakfast cereal","milk and cereal"],"calories_per_100g":110,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":2.5,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"porridge","aliases":["porridge","oat porridge","oatmeal","dalia","broken wheat"],"calories_per_100g":100,"protein_per_100g":4,"carbs_per_100g":17,"fat_per_100g":2,"fiber_per_100g":2.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"muesli with milk","aliases":["muesli with milk","muesli bowl","swiss muesli"],"calories_per_100g":130,"protein_per_100g":4,"carbs_per_100g":20,"fat_per_100g":3,"fiber_per_100g":2.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"yogurt parfait","aliases":["yogurt parfait","granola parfait","fruit yogurt parfait"],"calories_per_100g":120,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":4,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"smoothie bowl","aliases":["smoothie bowl","acai bowl","berry bowl","fruit smoothie bowl"],"calories_per_100g":80,"protein_per_100g":2,"carbs_per_100g":16,"fat_per_100g":1.5,"fiber_per_100g":3,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"english breakfast","aliases":["english breakfast","full english","fry up","british breakfast"],"calories_per_100g":180,"protein_per_100g":10,"carbs_per_100g":15,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":400},
    {"food_name":"continental breakfast","aliases":["continental breakfast","bread butter jam","breakfast platter"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":30,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"bagel with cream cheese","aliases":["bagel cream cheese","bagel with cream cheese","smoked salmon bagel"],"calories_per_100g":260,"protein_per_100g":8,"carbs_per_100g":36,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 bagel","serving_grams":120},
    {"food_name":"toast with butter","aliases":["toast butter","butter toast","bread butter toast"],"calories_per_100g":280,"protein_per_100g":6,"carbs_per_100g":34,"fat_per_100g":14,"fiber_per_100g":2,"serving_size":"1 slice","serving_grams":30},
    {"food_name":"toast with jam","aliases":["toast jam","jam toast","bread jam"],"calories_per_100g":260,"protein_per_100g":5,"carbs_per_100g":42,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 slice","serving_grams":30},
    {"food_name":"peanut butter toast","aliases":["peanut butter toast","pb toast","peanut butter bread"],"calories_per_100g":300,"protein_per_100g":10,"carbs_per_100g":30,"fat_per_100g":16,"fiber_per_100g":3,"serving_size":"1 slice","serving_grams":35},
]

# ── Soups & Salads ──
SOUPS_SALADS = [
    {"food_name":"garden salad","aliases":["garden salad","green salad","simple salad","tossed salad"],"calories_per_100g":20,"protein_per_100g":1,"carbs_per_100g":3,"fat_per_100g":0.3,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"greek salad","aliases":["greek salad","horiatiki","traditional greek"],"calories_per_100g":100,"protein_per_100g":3,"carbs_per_100g":4,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"caesar salad","aliases":["caesar salad","classic caesar","caesar"],"calories_per_100g":160,"protein_per_100g":8,"carbs_per_100g":6,"fat_per_100g":12,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"waldorf salad","aliases":["waldorf salad","apple walnut salad","waldorf"],"calories_per_100g":120,"protein_per_100g":2,"carbs_per_100g":10,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"cobb salad","aliases":["cobb salad","chopped salad","american cobb"],"calories_per_100g":120,"protein_per_100g":10,"carbs_per_100g":5,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"noodle soup","aliases":["noodle soup","chicken noodle soup","veg noodle soup"],"calories_per_100g":50,"protein_per_100g":3,"carbs_per_100g":6,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"chicken soup","aliases":["chicken soup","chicken broth","clear chicken soup"],"calories_per_100g":25,"protein_per_100g":3,"carbs_per_100g":2,"fat_per_100g":0.5,"fiber_per_100g":0,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"vegetable soup","aliases":["vegetable soup","mixed vegetable soup","veg soup"],"calories_per_100g":30,"protein_per_100g":1,"carbs_per_100g":5,"fat_per_100g":0.5,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"pumpkin soup","aliases":["pumpkin soup","cream of pumpkin","butternut squash soup"],"calories_per_100g":40,"protein_per_100g":1,"carbs_per_100g":6,"fat_per_100g":1.5,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"broccoli soup","aliases":["broccoli soup","cream of broccoli","broccoli cheese soup"],"calories_per_100g":45,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":2,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"mushroom soup","aliases":["mushroom soup","cream of mushroom","wild mushroom soup"],"calories_per_100g":45,"protein_per_100g":1.5,"carbs_per_100g":4,"fat_per_100g":2.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"corn soup","aliases":["corn soup","sweet corn soup","american corn"],"calories_per_100g":55,"protein_per_100g":2,"carbs_per_100g":9,"fat_per_100g":1,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"chicken broth","aliases":["chicken broth","bone broth","clear broth"],"calories_per_100g":10,"protein_per_100g":2,"carbs_per_100g":0.5,"fat_per_100g":0.2,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"beef broth","aliases":["beef broth","beef bone broth","stock"],"calories_per_100g":12,"protein_per_100g":2,"carbs_per_100g":0.5,"fat_per_100g":0.3,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"vegetable broth","aliases":["vegetable broth","veg stock","vegetable stock"],"calories_per_100g":5,"protein_per_100g":0.5,"carbs_per_100g":1,"fat_per_100g":0.1,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"coleslaw","aliases":["coleslaw","cabbage slaw","creamy coleslaw"],"calories_per_100g":80,"protein_per_100g":1,"carbs_per_100g":8,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"potato salad","aliases":["potato salad","american potato salad","creamy potato"],"calories_per_100g":140,"protein_per_100g":2,"carbs_per_100g":14,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"macaroni salad","aliases":["macaroni salad","pasta salad","elbow macaroni salad"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":8,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"tuna salad","aliases":["tuna salad","tuna mayo","tuna sandwich filling"],"calories_per_100g":150,"protein_per_100g":14,"carbs_per_100g":2,"fat_per_100g":10,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"egg salad","aliases":["egg salad","egg mayo","egg sandwich filling"],"calories_per_100g":160,"protein_per_100g":8,"carbs_per_100g":2,"fat_per_100g":13,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"chicken salad","aliases":["chicken salad","chicken mayo","shredded chicken salad"],"calories_per_100g":140,"protein_per_100g":14,"carbs_per_100g":3,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"fruit salad","aliases":["fruit salad","mixed fruit","fresh fruit bowl"],"calories_per_100g":55,"protein_per_100g":0.5,"carbs_per_100g":14,"fat_per_100g":0.2,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
]

# ── Pasta & Noodles extended ──
PASTA_NOODLES = [
    {"food_name":"lasagna bolognese","aliases":["lasagna bolognese","meat lasagna","beef lasagna"],"calories_per_100g":185,"protein_per_100g":12,"carbs_per_100g":16,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 slice","serving_grams":200},
    {"food_name":"lasagna alfredo","aliases":["lasagna alfredo","white lasagna","chicken lasagna"],"calories_per_100g":200,"protein_per_100g":11,"carbs_per_100g":16,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 slice","serving_grams":200},
    {"food_name":"pasta primavera","aliases":["pasta primavera","spring vegetable pasta","primavera"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"pasta marinara","aliases":["pasta marinara","simple tomato pasta","marinara"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":3,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"pasta puttanesca","aliases":["pasta puttanesca","puttanesca","olive caper pasta"],"calories_per_100g":160,"protein_per_100g":5,"carbs_per_100g":22,"fat_per_100g":6,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"ramen noodles","aliases":["ramen noodles","instant ramen","cup noodles","instant noodles"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":20,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 pack","serving_grams":100},
    {"food_name":"pad kee mao","aliases":["pad kee mao","drunken noodles","spicy thai noodles"],"calories_per_100g":190,"protein_per_100g":7,"carbs_per_100g":24,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"rice noodles","aliases":["rice noodles","vermicelli rice","rice vermicelli"],"calories_per_100g":110,"protein_per_100g":1,"carbs_per_100g":24,"fat_per_100g":0.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"egg noodles","aliases":["egg noodles","chow mein noodles","lo mein"],"calories_per_100g":140,"protein_per_100g":5,"carbs_per_100g":24,"fat_per_100g":2.5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
]

# ── More European ──
EUROPEAN = [
    {"food_name":"goulash","aliases":["goulash","hungarian goulash","beef goulash","gulasz"],"calories_per_100g":150,"protein_per_100g":14,"carbs_per_100g":8,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"sauerbraten","aliases":["sauerbraten","german pot roast","marinated beef"],"calories_per_100g":200,"protein_per_100g":20,"carbs_per_100g":4,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"wiener schnitzel","aliases":["wiener schnitzel","veal schnitzel","breaded veal","schnitzel"],"calories_per_100g":240,"protein_per_100g":18,"carbs_per_100g":10,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"bratwurst","aliases":["bratwurst","german sausage","grilled bratwurst"],"calories_per_100g":280,"protein_per_100g":14,"carbs_per_100g":2,"fat_per_100g":25,"fiber_per_100g":0,"serving_size":"1 link","serving_grams":100},
    {"food_name":"kartoffelsalat","aliases":["kartoffelsalat","german potato salad","warm potato salad"],"calories_per_100g":120,"protein_per_100g":2,"carbs_per_100g":14,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"paella","aliases":["paella","spanish paella","seafood paella","valenciana"],"calories_per_100g":160,"protein_per_100g":10,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"paella valenciana","aliases":["paella valenciana","chicken paella","traditional paella"],"calories_per_100g":170,"protein_per_100g":11,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"gazpacho","aliases":["gazpacho","spanish cold soup","tomato cold soup"],"calories_per_100g":30,"protein_per_100g":1,"carbs_per_100g":5,"fat_per_100g":1,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"patatas bravas","aliases":["patatas bravas","spanish fried potatoes","bravas"],"calories_per_100g":140,"protein_per_100g":2,"carbs_per_100g":18,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"tortilla espanola","aliases":["tortilla espanola","spanish omelette","potato omelette","tortilla de patatas"],"calories_per_100g":160,"protein_per_100g":6,"carbs_per_100g":12,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"croquetas","aliases":["croquetas","spanish croquettes","ham croquettes"],"calories_per_100g":220,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":25},
    {"food_name":"churros con chocolate","aliases":["churros con chocolate","churros with chocolate","spanish churros"],"calories_per_100g":280,"protein_per_100g":4,"carbs_per_100g":34,"fat_per_100g":15,"fiber_per_100g":1.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"tortellini","aliases":["tortellini","ring pasta","stuffed ring pasta"],"calories_per_100g":200,"protein_per_100g":8,"carbs_per_100g":26,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"cannelloni","aliases":["cannelloni","stuffed pasta tubes","ricotta cannelloni"],"calories_per_100g":160,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":120},
    {"food_name":"pierogi","aliases":["pierogi","polish dumplings","pierogi ruskie","potato pierogi"],"calories_per_100g":190,"protein_per_100g":6,"carbs_per_100g":28,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"bigos","aliases":["bigos","polish stew","hunter stew","sauerkraut stew"],"calories_per_100g":120,"protein_per_100g":8,"carbs_per_100g":6,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"zapiekanka","aliases":["zapiekanka","polish open sandwich","mushroom toast"],"calories_per_100g":210,"protein_per_100g":8,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"borscht","aliases":["borscht","beet soup","ukrainian borscht","beetroot soup"],"calories_per_100g":35,"protein_per_100g":1.5,"carbs_per_100g":5,"fat_per_100g":1,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"pelmeni","aliases":["pelmeni","russian dumplings","meat dumplings","siberian pelmeni"],"calories_per_100g":200,"protein_per_100g":12,"carbs_per_100g":22,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"beef stroganoff","aliases":["beef stroganoff","stroganoff","russian beef","sour cream beef"],"calories_per_100g":170,"protein_per_100g":16,"carbs_per_100g":6,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"chicken kiev","aliases":["chicken kiev","ukrainian chicken","garlic butter chicken"],"calories_per_100g":240,"protein_per_100g":18,"carbs_per_100g":8,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"salmon en croute","aliases":["salmon en croute","salmon puff pastry","wrapped salmon"],"calories_per_100g":220,"protein_per_100g":16,"carbs_per_100g":12,"fat_per_100g":14,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":180},
    {"food_name":"shepherds pie","aliases":["shepherds pie","cottage pie","mince potato bake"],"calories_per_100g":150,"protein_per_100g":10,"carbs_per_100g":14,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"fish and chips","aliases":["fish and chips","battered fish with chips","english fish chips"],"calories_per_100g":200,"protein_per_100g":12,"carbs_per_100g":20,"fat_per_100g":9,"fiber_per_100g":1,"serving_size":"1 serving","serving_grams":300},
    {"food_name":"bangers and mash","aliases":["bangers and mash","sausage mashed potato","english sausages"],"calories_per_100g":180,"protein_per_100g":8,"carbs_per_100g":16,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":350},
    {"food_name":"yorkshire pudding","aliases":["yorkshire pudding","english roast side","popover"],"calories_per_100g":260,"protein_per_100g":7,"carbs_per_100g":24,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"roast chicken dinner","aliases":["roast chicken dinner","sunday roast","roast chicken meal"],"calories_per_100g":150,"protein_per_100g":14,"carbs_per_100g":12,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":400},
    {"food_name":"roast beef dinner","aliases":["roast beef dinner","roast beef sunday","beef roast dinner"],"calories_per_100g":170,"protein_per_100g":16,"carbs_per_100g":12,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":400},
    {"food_name":"cottage pie","aliases":["cottage pie","shepherds pie beef","mince beef potato"],"calories_per_100g":140,"protein_per_100g":10,"carbs_per_100g":13,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
]

# ── More Asian ──
MORE_ASIAN = [
    {"food_name":"sushi salmon","aliases":["salmon sushi","salmon nigiri","sake sushi"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":24,"fat_per_100g":4,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"sushi tuna","aliases":["tuna sushi","maguro sushi","tuna nigiri"],"calories_per_100g":160,"protein_per_100g":14,"carbs_per_100g":22,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"sushi avocado","aliases":["avocado sushi","avocado roll","california roll"],"calories_per_100g":175,"protein_per_100g":4,"carbs_per_100g":28,"fat_per_100g":6,"fiber_per_100g":2,"serving_size":"1 roll","serving_grams":40},
    {"food_name":"chirashi sushi","aliases":["chirashi","sushi bowl","scattered sushi"],"calories_per_100g":150,"protein_per_100g":10,"carbs_per_100g":22,"fat_per_100g":3,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"katsudon","aliases":["katsudon","pork cutlet rice bowl","tonkatsu rice"],"calories_per_100g":170,"protein_per_100g":10,"carbs_per_100g":20,"fat_per_100g":6,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"oyakodon","aliases":["oyakodon","chicken egg rice bowl","parent child bowl"],"calories_per_100g":150,"protein_per_100g":10,"carbs_per_100g":18,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"tendon","aliases":["tendon","tempura rice bowl","ten don"],"calories_per_100g":160,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":7,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"gyudon","aliases":["gyudon","beef rice bowl","japanese beef bowl"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":20,"fat_per_100g":7,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"zaru soba","aliases":["zaru soba","cold soba noodles","dipping soba"],"calories_per_100g":110,"protein_per_100g":5,"carbs_per_100g":22,"fat_per_100g":0.3,"fiber_per_100g":2,"serving_size":"1 serving","serving_grams":200},
    {"food_name":"kitsune udon","aliases":["kitsune udon","tofu udon","sweet tofu noodle soup"],"calories_per_100g":80,"protein_per_100g":3,"carbs_per_100g":14,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":350},
    {"food_name":"tempura udon","aliases":["tempura udon","shrimp tempura udon","noodle soup tempura"],"calories_per_100g":100,"protein_per_100g":4,"carbs_per_100g":14,"fat_per_100g":3.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":350},
    {"food_name":"takoyaki","aliases":["takoyaki","octopus balls","japanese octopus snack"],"calories_per_100g":170,"protein_per_100g":5,"carbs_per_100g":18,"fat_per_100g":9,"fiber_per_100g":1,"serving_size":"1 serving","serving_grams":80},
    {"food_name":"okonomiyaki","aliases":["okonomiyaki","savory pancake","japanese pancake"],"calories_per_100g":190,"protein_per_100g":6,"carbs_per_100g":22,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"onigiri tuna","aliases":["tuna onigiri","tuna rice ball","filled rice ball"],"calories_per_100g":150,"protein_per_100g":6,"carbs_per_100g":28,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"onigiri salmon","aliases":["salmon onigiri","salmon rice ball","shake onigiri"],"calories_per_100g":155,"protein_per_100g":6.5,"carbs_per_100g":27,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"chashu ramen","aliases":["chashu ramen","pork ramen","roasted pork ramen"],"calories_per_100g":120,"protein_per_100g":6,"carbs_per_100g":14,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"shio ramen","aliases":["shio ramen","salt ramen","clear broth ramen"],"calories_per_100g":80,"protein_per_100g":4,"carbs_per_100g":12,"fat_per_100g":2.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"bibimbap beef","aliases":["beef bibimbap","dolsot bibimbap","hot stone bibimbap"],"calories_per_100g":160,"protein_per_100g":8,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":350},
    {"food_name":"kimchi fried rice","aliases":["kimchi fried rice","kimchi bokkeumbap","korean kimchi rice"],"calories_per_100g":160,"protein_per_100g":5,"carbs_per_100g":26,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"yangnyeom chicken","aliases":["yangnyeom chicken","korean spicy chicken","sweet spicy fried chicken"],"calories_per_100g":250,"protein_per_100g":18,"carbs_per_100g":12,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"korean corn dog","aliases":["korean corn dog","corn dog korean","mozzarella corn dog"],"calories_per_100g":240,"protein_per_100g":8,"carbs_per_100g":24,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"pho tai","aliases":["pho tai","rare beef pho","pho with rare beef"],"calories_per_100g":70,"protein_per_100g":8,"carbs_per_100g":6,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"pho bo vien","aliases":["pho bo vien","meatball pho","beef ball pho"],"calories_per_100g":75,"protein_per_100g":8,"carbs_per_100g":7,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"bun thit nuong","aliases":["bun thit nuong","grilled pork vermicelli","vietnamese pork noodles"],"calories_per_100g":160,"protein_per_100g":8,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"goi cuon","aliases":["goi cuon","fresh spring roll","vietnamese summer roll"],"calories_per_100g":80,"protein_per_100g":4,"carbs_per_100g":10,"fat_per_100g":2.5,"fiber_per_100g":1.5,"serving_size":"1 roll","serving_grams":50},
    {"food_name":"cha gio","aliases":["cha gio","vietnamese fried spring roll","egg roll"],"calories_per_100g":200,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 roll","serving_grams":25},
    {"food_name":"laksa curry","aliases":["laksa curry","curry laksa","kari laksa"],"calories_per_100g":100,"protein_per_100g":5,"carbs_per_100g":8,"fat_per_100g":6,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":350},
    {"food_name":"asam laksa","aliases":["asam laksa","sour fish laksa","penang laksa"],"calories_per_100g":70,"protein_per_100g":5,"carbs_per_100g":8,"fat_per_100g":2.5,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":350},
    {"food_name":"satay padang","aliases":["satay padang","beef satay padang","minang satay"],"calories_per_100g":220,"protein_per_100g":18,"carbs_per_100g":5,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":40},
    {"food_name":"gulai","aliases":["gulai","indonesian curry","gulai ayam","gulai kambing"],"calories_per_100g":160,"protein_per_100g":10,"carbs_per_100g":5,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"sambal goreng","aliases":["sambal goreng","sambal fried","indonesian sambal stir fry"],"calories_per_100g":80,"protein_per_100g":3,"carbs_per_100g":6,"fat_per_100g":5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"sayur lodeh","aliases":["sayur lodeh","coconut vegetable stew","indonesian lodeh"],"calories_per_100g":45,"protein_per_100g":1.5,"carbs_per_100g":4,"fat_per_100g":3,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"ketoprak","aliases":["ketoprak","tofu noodle salad","indonesian ketoprak"],"calories_per_100g":120,"protein_per_100g":5,"carbs_per_100g":14,"fat_per_100g":5,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"siomay","aliases":["siomay","indonesian fish dumplings","steamed fish cake"],"calories_per_100g":120,"protein_per_100g":8,"carbs_per_100g":10,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 serving","serving_grams":100},
]

# ── More Middle Eastern ──
MORE_ME = [
    {"food_name":"hummus classic","aliases":["hummus","classic hummus","chickpea hummus"],"calories_per_100g":160,"protein_per_100g":6,"carbs_per_100g":14,"fat_per_100g":10,"fiber_per_100g":4,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"hummus beetroot","aliases":["beetroot hummus","pink hummus","beet hummus"],"calories_per_100g":140,"protein_per_100g":5,"carbs_per_100g":14,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"hummus pesto","aliases":["pesto hummus","basil hummus","green hummus"],"calories_per_100g":170,"protein_per_100g":5,"carbs_per_100g":12,"fat_per_100g":12,"fiber_per_100g":3,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"mutabbaq","aliases":["mutabbaq","meat pancake","stuffed bread middle eastern"],"calories_per_100g":240,"protein_per_100g":9,"carbs_per_100g":26,"fat_per_100g":12,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"sambusa","aliases":["sambusa","samosas middle eastern","sambosa","somosa"],"calories_per_100g":250,"protein_per_100g":7,"carbs_per_100g":28,"fat_per_100g":13,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"kofta curry","aliases":["kofta curry","meatball curry","kofta gravy"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":8,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kofta kebab","aliases":["kofta kebab","ground meat kebab","middle eastern kofta"],"calories_per_100g":220,"protein_per_100g":16,"carbs_per_100g":6,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":80},
    {"food_name":"joojeh kebab","aliases":["joojeh kebab","persian chicken kebab","saffron chicken"],"calories_per_100g":190,"protein_per_100g":22,"carbs_per_100g":2,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":80},
    {"food_name":"kebab koobideh","aliases":["kebab koobideh","persian meat kebab","ground meat skewer"],"calories_per_100g":220,"protein_per_100g":20,"carbs_per_100g":2,"fat_per_100g":15,"fiber_per_100g":0,"serving_size":"1 skewer","serving_grams":80},
    {"food_name":"tahdig","aliases":["tahdig","persian crispy rice","saffron crust rice"],"calories_per_100g":200,"protein_per_100g":3,"carbs_per_100g":32,"fat_per_100g":7,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"zereshk polo","aliases":["zereshk polo","barberry rice","persian rice barberry"],"calories_per_100g":180,"protein_per_100g":3,"carbs_per_100g":34,"fat_per_100g":4,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"sabzi polo","aliases":["sabzi polo","herb rice","persian herb rice"],"calories_per_100g":170,"protein_per_100g":3,"carbs_per_100g":32,"fat_per_100g":4,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"fesenjan","aliases":["fesenjan","persian pomegranate walnut stew","khoresht fesenjan"],"calories_per_100g":200,"protein_per_100g":12,"carbs_per_100g":12,"fat_per_100g":12,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"ghormeh sabzi","aliases":["ghormeh sabzi","persian herb stew","khoresht sabzi"],"calories_per_100g":160,"protein_per_100g":14,"carbs_per_100g":5,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"khoresht gheimeh","aliases":["khoresht gheimeh","persian split pea stew","yellow split pea stew"],"calories_per_100g":160,"protein_per_100g":12,"carbs_per_100g":12,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"shakshuka","aliases":["shakshuka","eggs in tomato sauce","middle eastern breakfast"],"calories_per_100g":80,"protein_per_100g":5,"carbs_per_100g":5,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"halloumi","aliases":["halloumi","grilled halloumi","cypriot cheese","halloumi cheese"],"calories_per_100g":310,"protein_per_100g":22,"carbs_per_100g":2,"fat_per_100g":24,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":80},
    {"food_name":"kanafeh","aliases":["kanafeh","knafeh","middle eastern cheese pastry"],"calories_per_100g":300,"protein_per_100g":6,"carbs_per_100g":35,"fat_per_100g":16,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"basbousa","aliases":["basbousa","semolina cake","middle eastern coconut cake","harissa"],"calories_per_100g":300,"protein_per_100g":4,"carbs_per_100g":44,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":50},
    {"food_name":"halva","aliases":["halva","sesame halva","tahini halva","middle eastern sweet"],"calories_per_100g":480,"protein_per_100g":10,"carbs_per_100g":55,"fat_per_100g":26,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"turkish delight","aliases":["turkish delight","lokum","rose delight","baklava delight"],"calories_per_100g":330,"protein_per_100g":1,"carbs_per_100g":80,"fat_per_100g":0.5,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"menemen","aliases":["menemen","turkish eggs","eggs with peppers","turkish breakfast"],"calories_per_100g":80,"protein_per_100g":5,"carbs_per_100g":4,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"burek","aliases":["burek","burek pastry","cheese burek","meat burek","spanakopita"],"calories_per_100g":280,"protein_per_100g":9,"carbs_per_100g":26,"fat_per_100g":16,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":80},
]

# ── Drinks & Beverages ──
DRINKS = [
    {"food_name":"coffee black","aliases":["black coffee","coffee","drip coffee","black brew"],"calories_per_100g":2,"protein_per_100g":0.1,"carbs_per_100g":0,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"latte","aliases":["latte","cafe latte","coffee latte","milk coffee"],"calories_per_100g":40,"protein_per_100g":2.5,"carbs_per_100g":4,"fat_per_100g":1.5,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"cappuccino","aliases":["cappuccino","coffee cappuccino","italian cappuccino"],"calories_per_100g":30,"protein_per_100g":2,"carbs_per_100g":3,"fat_per_100g":1.2,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"espresso","aliases":["espresso","shot of espresso","black espresso"],"calories_per_100g":10,"protein_per_100g":0.5,"carbs_per_100g":1.5,"fat_per_100g":0.2,"fiber_per_100g":0,"serving_size":"1 shot","serving_grams":30},
    {"food_name":"mocha","aliases":["mocha","cafe mocha","chocolate coffee","mocha latte"],"calories_per_100g":50,"protein_per_100g":2,"carbs_per_100g":6,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"flat white","aliases":["flat white","coffee flat white","aussie coffee"],"calories_per_100g":35,"protein_per_100g":2,"carbs_per_100g":3,"fat_per_100g":1.5,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"iced coffee","aliases":["iced coffee","cold coffee","iced latte","frappe"],"calories_per_100g":35,"protein_per_100g":1.5,"carbs_per_100g":4,"fat_per_100g":1.5,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":250},
    {"food_name":"chai tea","aliases":["chai tea","masala chai","indian tea","spiced tea"],"calories_per_100g":20,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":0.8,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"green tea","aliases":["green tea","matcha green tea","japanese green tea","sencha"],"calories_per_100g":1,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"black tea","aliases":["black tea","english tea","tea with milk","chai"],"calories_per_100g":5,"protein_per_100g":0.2,"carbs_per_100g":0.5,"fat_per_100g":0.1,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"herbal tea","aliases":["herbal tea","chamomile tea","peppermint tea","tulsi tea"],"calories_per_100g":1,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"matcha latte","aliases":["matcha latte","green tea latte","matcha milk"],"calories_per_100g":45,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":2,"fiber_per_100g":0.3,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"hot chocolate","aliases":["hot chocolate","hot cocoa","drinking chocolate","chocolate milk"],"calories_per_100g":60,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":2.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"milkshake chocolate","aliases":["chocolate milkshake","chocolate shake","thick shake"],"calories_per_100g":85,"protein_per_100g":2.5,"carbs_per_100g":12,"fat_per_100g":3,"fiber_per_100g":0.5,"serving_size":"1 glass","serving_grams":300},
    {"food_name":"milkshake vanilla","aliases":["vanilla milkshake","vanilla shake","cream shake"],"calories_per_100g":80,"protein_per_100g":2.5,"carbs_per_100g":11,"fat_per_100g":3,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":300},
    {"food_name":"milkshake strawberry","aliases":["strawberry milkshake","strawberry shake","berry shake"],"calories_per_100g":75,"protein_per_100g":2,"carbs_per_100g":12,"fat_per_100g":2.5,"fiber_per_100g":0.3,"serving_size":"1 glass","serving_grams":300},
    {"food_name":"smoothie mango","aliases":["mango smoothie","tropical smoothie","mango shake"],"calories_per_100g":55,"protein_per_100g":0.5,"carbs_per_100g":13,"fat_per_100g":0.3,"fiber_per_100g":1,"serving_size":"1 glass","serving_grams":300},
    {"food_name":"smoothie berry","aliases":["berry smoothie","mixed berry","fruit smoothie"],"calories_per_100g":45,"protein_per_100g":1,"carbs_per_100g":10,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 glass","serving_grams":300},
    {"food_name":"smoothie green","aliases":["green smoothie","spinach smoothie","kale smoothie"],"calories_per_100g":35,"protein_per_100g":1,"carbs_per_100g":6,"fat_per_100g":0.5,"fiber_per_100g":1.5,"serving_size":"1 glass","serving_grams":300},
    {"food_name":"protein shake","aliases":["protein shake","whey shake","post workout shake"],"calories_per_100g":50,"protein_per_100g":10,"carbs_per_100g":2,"fat_per_100g":0.5,"fiber_per_100g":0,"serving_size":"1 shake","serving_grams":300},
    {"food_name":"coconut water","aliases":["coconut water","nariyal pani","tender coconut"],"calories_per_100g":19,"protein_per_100g":0.2,"carbs_per_100g":3.7,"fat_per_100g":0.2,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"soda","aliases":["soda","sparkling water","club soda","seltzer"],"calories_per_100g":0,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 can","serving_grams":355},
    {"food_name":"cola","aliases":["cola","coca cola","coke","soft drink cola"],"calories_per_100g":42,"protein_per_100g":0,"carbs_per_100g":10.6,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 can","serving_grams":355},
    {"food_name":"diet cola","aliases":["diet cola","diet coke","zero cola","zero sugar cola"],"calories_per_100g":0.5,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 can","serving_grams":355},
    {"food_name":"lemonade","aliases":["lemonade","fresh lemonade","homemade lemonade","shikanji"],"calories_per_100g":30,"protein_per_100g":0.1,"carbs_per_100g":7,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":250},
    {"food_name":"iced tea","aliases":["iced tea","lemon iced tea","cold tea","ice tea"],"calories_per_100g":25,"protein_per_100g":0,"carbs_per_100g":6,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":250},
    {"food_name":"fruit juice","aliases":["fruit juice","mixed fruit juice","fresh juice","juice"],"calories_per_100g":45,"protein_per_100g":0.5,"carbs_per_100g":10,"fat_per_100g":0.1,"fiber_per_100g":0.2,"serving_size":"1 glass","serving_grams":250},
    {"food_name":"water","aliases":["water","drinking water","mineral water","plain water"],"calories_per_100g":0,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 glass","serving_grams":240},
]

all_groups = [
    MORE_INDIAN, BREAKFAST, SOUPS_SALADS, PASTA_NOODLES,
    EUROPEAN, MORE_ASIAN, MORE_ME, DRINKS
]

for group in all_groups:
    NEW.extend(add(group))

combined = existing + NEW
with open('D:\\FitnessApp\\assets\\food_database.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, indent=2, ensure_ascii=False)

print(f"Original: {len(existing)} items")
print(f"Added: {len(NEW)} new items")
print(f"Total: {len(combined)} items")
