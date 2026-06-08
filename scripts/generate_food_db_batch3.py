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

# ── Indian Breads ──
INDIAN_BREADS = [
    {"food_name":"tandoori roti","aliases":["tandoori roti","clay oven roti","tandoori bread"],"calories_per_100g":250,"protein_per_100g":7,"carbs_per_100g":44,"fat_per_100g":4,"fiber_per_100g":3,"serving_size":"1 roti","serving_grams":40},
    {"food_name":"missi roti","aliases":["missi roti","gram flour roti","spiced roti"],"calories_per_100g":240,"protein_per_100g":10,"carbs_per_100g":38,"fat_per_100g":6,"fiber_per_100g":5,"serving_size":"1 roti","serving_grams":40},
    {"food_name":"makki ki roti","aliases":["makki ki roti","cornmeal roti","corn roti"],"calories_per_100g":230,"protein_per_100g":5,"carbs_per_100g":42,"fat_per_100g":5,"fiber_per_100g":4,"serving_size":"1 roti","serving_grams":40},
    {"food_name":"rumali roti","aliases":["rumali roti","handkerchief bread","thin roti"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":38,"fat_per_100g":3,"fiber_per_100g":2,"serving_size":"1 roti","serving_grams":30},
    {"food_name":"lachha paratha","aliases":["lachha paratha","layered paratha","flaky paratha"],"calories_per_100g":290,"protein_per_100g":5,"carbs_per_100g":36,"fat_per_100g":14,"fiber_per_100g":2,"serving_size":"1 paratha","serving_grams":60},
    {"food_name":"stuffed paratha","aliases":["stuffed paratha","aloo paratha","gobhi paratha","paneer paratha"],"calories_per_100g":210,"protein_per_100g":5,"carbs_per_100g":28,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 paratha","serving_grams":80},
    {"food_name":"paneer paratha","aliases":["paneer paratha","cottage cheese paratha","paneer stuffed paratha"],"calories_per_100g":220,"protein_per_100g":8,"carbs_per_100g":26,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 paratha","serving_grams":80},
    {"food_name":"kerala appam","aliases":["kerala appam","appam","hoppers","lacy rice pancake"],"calories_per_100g":110,"protein_per_100g":2,"carbs_per_100g":18,"fat_per_100g":3,"fiber_per_100g":0.5,"serving_size":"1 appam","serving_grams":50},
    {"food_name":"mooli paratha","aliases":["mooli paratha","radish paratha","white radish stuffed"],"calories_per_100g":170,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 paratha","serving_grams":80},
]

# ── More Indian Sweets ──
INDIAN_SWEETS = [
    {"food_name":"gulab jamun","aliases":["gulab jamun","gulab jamun 2 pieces","milk dumplings"],"calories_per_100g":320,"protein_per_100g":5,"carbs_per_100g":42,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"kaju katli","aliases":["kaju katli","cashew fudge","kaju barfi"],"calories_per_100g":400,"protein_per_100g":6,"carbs_per_100g":50,"fat_per_100g":20,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":15},
    {"food_name":"soan papdi","aliases":["soan papdi","sohan papdi","flaky sweet","patisa"],"calories_per_100g":400,"protein_per_100g":5,"carbs_per_100g":60,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"jalebi","aliases":["jalebi","jalebi hot","sugar syrup pretzel","orange coil"],"calories_per_100g":350,"protein_per_100g":3,"carbs_per_100g":60,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"peda","aliases":["peda","milk peda","doodh peda","khoya peda"],"calories_per_100g":340,"protein_per_100g":8,"carbs_per_100g":50,"fat_per_100g":12,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"moti choor laddu","aliases":["moti choor laddu","motichoor laddu","tiny boondi laddu"],"calories_per_100g":360,"protein_per_100g":6,"carbs_per_100g":48,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"besan laddu","aliases":["besan laddu","chickpea flour laddu","gram flour sweet"],"calories_per_100g":380,"protein_per_100g":8,"carbs_per_100g":44,"fat_per_100g":20,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":25},
    {"food_name":"coconut laddu","aliases":["coconut laddu","nariyal laddu","coconut ball"],"calories_per_100g":320,"protein_per_100g":3,"carbs_per_100g":40,"fat_per_100g":17,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"kheer","aliases":["kheer","rice pudding indian","payasam","rice kheer"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":4,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"seviyan","aliases":["seviyan","vermicelli kheer","sweet vermicelli","sheer khurma"],"calories_per_100g":150,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":200},
    {"food_name":"gajar halwa","aliases":["gajar halwa","carrot halwa","carrot pudding"],"calories_per_100g":200,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"moong dal halwa","aliases":["moong dal halwa","lentil halwa","moong halwa"],"calories_per_100g":280,"protein_per_100g":6,"carbs_per_100g":35,"fat_per_100g":14,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"malpua","aliases":["malpua","indian pancake sweet","malpua hot"],"calories_per_100g":250,"protein_per_100g":4,"carbs_per_100g":34,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"rasmalai","aliases":["rasmalai","cream cheese dumplings","malai rasgulla"],"calories_per_100g":200,"protein_per_100g":7,"carbs_per_100g":26,"fat_per_100g":9,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":40},
]

# ── Fast Food / American Classics ──
FAST_FOOD = [
    {"food_name":"hamburger","aliases":["hamburger","burger","beef burger","classic burger"],"calories_per_100g":250,"protein_per_100g":14,"carbs_per_100g":26,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 burger","serving_grams":150},
    {"food_name":"cheeseburger","aliases":["cheeseburger","cheese burger","american cheese burger"],"calories_per_100g":260,"protein_per_100g":15,"carbs_per_100g":26,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 burger","serving_grams":160},
    {"food_name":"double cheeseburger","aliases":["double cheeseburger","double burger","two patty burger"],"calories_per_100g":270,"protein_per_100g":17,"carbs_per_100g":24,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 burger","serving_grams":200},
    {"food_name":"chicken burger","aliases":["chicken burger","crispy chicken burger","fried chicken burger"],"calories_per_100g":240,"protein_per_100g":14,"carbs_per_100g":26,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 burger","serving_grams":160},
    {"food_name":"chicken nuggets","aliases":["chicken nuggets","nuggets","chicken bites","popcorn chicken"],"calories_per_100g":280,"protein_per_100g":16,"carbs_per_100g":16,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"french fries","aliases":["french fries","fries","chips","hot chips"],"calories_per_100g":310,"protein_per_100g":3.5,"carbs_per_100g":40,"fat_per_100g":15,"fiber_per_100g":3,"serving_size":"1 medium","serving_grams":120},
    {"food_name":"curly fries","aliases":["curly fries","spiral fries","seasoned fries"],"calories_per_100g":310,"protein_per_100g":3,"carbs_per_100g":38,"fat_per_100g":16,"fiber_per_100g":3,"serving_size":"1 serving","serving_grams":120},
    {"food_name":"onion rings","aliases":["onion rings","battered onion rings","american onion rings"],"calories_per_100g":320,"protein_per_100g":4,"carbs_per_100g":32,"fat_per_100g":19,"fiber_per_100g":1.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"hot dog","aliases":["hot dog","frankfurter","hot dog bun","american hot dog"],"calories_per_100g":240,"protein_per_100g":10,"carbs_per_100g":22,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 hot dog","serving_grams":100},
    {"food_name":"corn dog","aliases":["corn dog","battered hot dog","american corn dog"],"calories_per_100g":250,"protein_per_100g":8,"carbs_per_100g":26,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"chicken wings","aliases":["chicken wings","buffalo wings","hot wings","spicy wings"],"calories_per_100g":280,"protein_per_100g":20,"carbs_per_100g":6,"fat_per_100g":20,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"buffalo wings","aliases":["buffalo wings","buffalo chicken wings","spicy buffalo"],"calories_per_100g":290,"protein_per_100g":20,"carbs_per_100g":5,"fat_per_100g":22,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"bbq ribs","aliases":["bbq ribs","barbecue ribs","pork ribs","smoked ribs"],"calories_per_100g":260,"protein_per_100g":20,"carbs_per_100g":8,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":200},
    {"food_name":"mac and cheese","aliases":["mac and cheese","macaroni cheese","baked mac cheese","cheesy pasta"],"calories_per_100g":170,"protein_per_100g":6,"carbs_per_100g":20,"fat_per_100g":8,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"grilled cheese sandwich","aliases":["grilled cheese","grilled cheese sandwich","toasted cheese"],"calories_per_100g":300,"protein_per_100g":10,"carbs_per_100g":28,"fat_per_100g":17,"fiber_per_100g":1,"serving_size":"1 sandwich","serving_grams":80},
    {"food_name":"philly cheesesteak","aliases":["philly cheesesteak","cheesesteak","philly steak sandwich"],"calories_per_100g":250,"protein_per_100g":16,"carbs_per_100g":22,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 sandwich","serving_grams":200},
    {"food_name":"reuben sandwich","aliases":["reuben sandwich","reuben","corned beef sandwich"],"calories_per_100g":250,"protein_per_100g":14,"carbs_per_100g":22,"fat_per_100g":13,"fiber_per_100g":1.5,"serving_size":"1 sandwich","serving_grams":200},
    {"food_name":"club sandwich","aliases":["club sandwich","turkey club","triple decker","chicken club"],"calories_per_100g":220,"protein_per_100g":12,"carbs_per_100g":20,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 sandwich","serving_grams":200},
    {"food_name":"pulled pork sandwich","aliases":["pulled pork sandwich","pulled pork","bbq pulled pork"],"calories_per_100g":240,"protein_per_100g":14,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 sandwich","serving_grams":200},
    {"food_name":"meatball sub","aliases":["meatball sub","meatball sandwich","italian meatball"],"calories_per_100g":220,"protein_per_100g":10,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 sub","serving_grams":200},
    {"food_name":"subway sandwich","aliases":["subway sandwich","footlong","submarine sandwich","hoagie"],"calories_per_100g":180,"protein_per_100g":9,"carbs_per_100g":22,"fat_per_100g":6,"fiber_per_100g":2,"serving_size":"1 sub","serving_grams":250},
    {"food_name":"taco","aliases":["taco","beef taco","chicken taco","mexican taco","street taco"],"calories_per_100g":200,"protein_per_100g":10,"carbs_per_100g":20,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 taco","serving_grams":80},
    {"food_name":"burrito","aliases":["burrito","bean burrito","beef burrito","chicken burrito","mexican burrito"],"calories_per_100g":200,"protein_per_100g":8,"carbs_per_100g":26,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 burrito","serving_grams":250},
    {"food_name":"quesadilla","aliases":["quesadilla","cheese quesadilla","chicken quesadilla"],"calories_per_100g":280,"protein_per_100g":12,"carbs_per_100g":24,"fat_per_100g":16,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"nachos","aliases":["nachos","loaded nachos","nacho platter","cheese nachos"],"calories_per_100g":280,"protein_per_100g":6,"carbs_per_100g":30,"fat_per_100g":15,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"enchilada","aliases":["enchilada","chicken enchilada","bean enchilada","mexican enchilada"],"calories_per_100g":180,"protein_per_100g":8,"carbs_per_100g":20,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"tamale","aliases":["tamale","mexican tamale","corn husk tamale","pork tamale"],"calories_per_100g":230,"protein_per_100g":6,"carbs_per_100g":30,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 tamale","serving_grams":100},
    {"food_name":"chilaquiles","aliases":["chilaquiles","mexican breakfast","tortilla casserole","chilaquiles verdes"],"calories_per_100g":160,"protein_per_100g":5,"carbs_per_100g":18,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"elote","aliases":["elote","mexican street corn","corn on cob mexican"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 ear","serving_grams":150},
    {"food_name":"pizza margherita","aliases":["pizza margherita","margherita pizza","classic cheese pizza"],"calories_per_100g":250,"protein_per_100g":10,"carbs_per_100g":30,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"pizza pepperoni","aliases":["pizza pepperoni","pepperoni pizza","spicy pizza"],"calories_per_100g":270,"protein_per_100g":11,"carbs_per_100g":28,"fat_per_100g":13,"fiber_per_100g":1.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"pizza veggie","aliases":["pizza veggie","vegetable pizza","garden pizza"],"calories_per_100g":220,"protein_per_100g":8,"carbs_per_100g":28,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"pizza hawaiian","aliases":["pizza hawaiian","hawaiian pizza","pineapple ham pizza"],"calories_per_100g":240,"protein_per_100g":10,"carbs_per_100g":28,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"pasta carbonara","aliases":["pasta carbonara","spaghetti carbonara","carbonara"],"calories_per_100g":220,"protein_per_100g":9,"carbs_per_100g":22,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"spaghetti aglio e olio","aliases":["spaghetti aglio e olio","garlic olive oil pasta","aglio olio"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":26,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
]

# ── Desserts & Baked Goods ──
DESSERTS = [
    {"food_name":"chocolate cake","aliases":["chocolate cake","chocolate layer cake","rich chocolate cake"],"calories_per_100g":340,"protein_per_100g":4,"carbs_per_100g":42,"fat_per_100g":18,"fiber_per_100g":1.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"vanilla cake","aliases":["vanilla cake","white cake","butter cake"],"calories_per_100g":320,"protein_per_100g":4,"carbs_per_100g":44,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"red velvet cake","aliases":["red velvet cake","red velvet","cream cheese cake"],"calories_per_100g":350,"protein_per_100g":4,"carbs_per_100g":42,"fat_per_100g":19,"fiber_per_100g":0.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"cheesecake","aliases":["cheesecake","new york cheesecake","baked cheesecake"],"calories_per_100g":320,"protein_per_100g":6,"carbs_per_100g":28,"fat_per_100g":21,"fiber_per_100g":0.5,"serving_size":"1 slice","serving_grams":120},
    {"food_name":"brownie","aliases":["brownie","chocolate brownie","fudgy brownie","walnut brownie"],"calories_per_100g":380,"protein_per_100g":5,"carbs_per_100g":46,"fat_per_100g":20,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":50},
    {"food_name":"blondie","aliases":["blondie","butterscotch brownie","vanilla brownie","white chocolate blondie"],"calories_per_100g":370,"protein_per_100g":4,"carbs_per_100g":48,"fat_per_100g":18,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":50},
    {"food_name":"chocolate chip cookie","aliases":["chocolate chip cookie","cookie","choc chip cookie","american cookie"],"calories_per_100g":450,"protein_per_100g":5,"carbs_per_100g":60,"fat_per_100g":22,"fiber_per_100g":2,"serving_size":"1 cookie","serving_grams":20},
    {"food_name":"oatmeal raisin cookie","aliases":["oatmeal raisin cookie","oatmeal cookie","raisin cookie"],"calories_per_100g":400,"protein_per_100g":6,"carbs_per_100g":58,"fat_per_100g":16,"fiber_per_100g":3,"serving_size":"1 cookie","serving_grams":20},
    {"food_name":"sugar cookie","aliases":["sugar cookie","butter cookie","shortbread cookie"],"calories_per_100g":420,"protein_per_100g":4,"carbs_per_100g":56,"fat_per_100g":20,"fiber_per_100g":0.5,"serving_size":"1 cookie","serving_grams":15},
    {"food_name":"biscotti","aliases":["biscotti","italian biscotti","almond biscotti","twice baked cookie"],"calories_per_100g":380,"protein_per_100g":6,"carbs_per_100g":58,"fat_per_100g":14,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"macaron","aliases":["macaron","french macaron","macaroon","almond cookie"],"calories_per_100g":350,"protein_per_100g":5,"carbs_per_100g":44,"fat_per_100g":18,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":15},
    {"food_name":"croissant","aliases":["croissant","butter croissant","french croissant","plain croissant"],"calories_per_100g":380,"protein_per_100g":7,"carbs_per_100g":42,"fat_per_100g":21,"fiber_per_100g":1.5,"serving_size":"1 croissant","serving_grams":60},
    {"food_name":"chocolate croissant","aliases":["chocolate croissant","pain au chocolat","chocolate pastry"],"calories_per_100g":380,"protein_per_100g":7,"carbs_per_100g":40,"fat_per_100g":22,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":70},
    {"food_name":"almond croissant","aliases":["almond croissant","french almond","croissant aux amandes"],"calories_per_100g":370,"protein_per_100g":8,"carbs_per_100g":38,"fat_per_100g":21,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"cinnamon roll","aliases":["cinnamon roll","cinnamon bun","sticky bun","cinnamon swirl"],"calories_per_100g":320,"protein_per_100g":5,"carbs_per_100g":44,"fat_per_100g":14,"fiber_per_100g":1.5,"serving_size":"1 roll","serving_grams":80},
    {"food_name":"doughnut","aliases":["doughnut","donut","glazed donut","sugar donut"],"calories_per_100g":350,"protein_per_100g":5,"carbs_per_100g":44,"fat_per_100g":18,"fiber_per_100g":0.5,"serving_size":"1 donut","serving_grams":60},
    {"food_name":"jelly donut","aliases":["jelly donut","jam donut","filled donut","berry donut"],"calories_per_100g":330,"protein_per_100g":5,"carbs_per_100g":46,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 donut","serving_grams":70},
    {"food_name":"muffin blueberry","aliases":["blueberry muffin","blueberry muffin top","muffin blueberry"],"calories_per_100g":320,"protein_per_100g":5,"carbs_per_100g":44,"fat_per_100g":14,"fiber_per_100g":1.5,"serving_size":"1 muffin","serving_grams":70},
    {"food_name":"muffin chocolate","aliases":["chocolate muffin","double choc muffin","muffin chocolate chip"],"calories_per_100g":350,"protein_per_100g":5,"carbs_per_100g":44,"fat_per_100g":18,"fiber_per_100g":1.5,"serving_size":"1 muffin","serving_grams":70},
    {"food_name":"banana bread","aliases":["banana bread","banana loaf","moist banana bread"],"calories_per_100g":280,"protein_per_100g":5,"carbs_per_100g":40,"fat_per_100g":12,"fiber_per_100g":2,"serving_size":"1 slice","serving_grams":60},
    {"food_name":"zucchini bread","aliases":["zucchini bread","courgette bread","zucchini loaf"],"calories_per_100g":250,"protein_per_100g":4,"carbs_per_100g":36,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 slice","serving_grams":60},
    {"food_name":"pancakes","aliases":["pancakes","american pancakes","fluffy pancakes","breakfast pancakes"],"calories_per_100g":220,"protein_per_100g":6,"carbs_per_100g":30,"fat_per_100g":9,"fiber_per_100g":1,"serving_size":"1 stack","serving_grams":150},
    {"food_name":"french toast","aliases":["french toast","eggy bread","pain perdu","cinnamon french toast"],"calories_per_100g":220,"protein_per_100g":7,"carbs_per_100g":26,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 slice","serving_grams":80},
    {"food_name":"waffles","aliases":["waffles","belgian waffles","liege waffles","crispy waffles"],"calories_per_100g":260,"protein_per_100g":6,"carbs_per_100g":34,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 waffle","serving_grams":80},
    {"food_name":"crepe","aliases":["crepe","french crepe","sweet crepe","nutella crepe","plain crepe"],"calories_per_100g":200,"protein_per_100g":6,"carbs_per_100g":28,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 crepe","serving_grams":80},
    {"food_name":"tres leches cake","aliases":["tres leches","three milk cake","latin cake","soaked cake"],"calories_per_100g":280,"protein_per_100g":5,"carbs_per_100g":38,"fat_per_100g":12,"fiber_per_100g":0,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"tiramisu","aliases":["tiramisu","italian dessert","coffee dessert","mascarpone cake"],"calories_per_100g":260,"protein_per_100g":5,"carbs_per_100g":30,"fat_per_100g":14,"fiber_per_100g":0.5,"serving_size":"1 slice","serving_grams":120},
    {"food_name":"panna cotta","aliases":["panna cotta","italian cream dessert","vanilla panna cotta"],"calories_per_100g":200,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":14,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"crème brûlée","aliases":["crème brûlée","creme brulee","burnt cream","french custard"],"calories_per_100g":280,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":19,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"ice cream vanilla","aliases":["vanilla ice cream","vanilla scoop","classic vanilla"],"calories_per_100g":200,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":12,"fiber_per_100g":0,"serving_size":"1 scoop","serving_grams":50},
    {"food_name":"ice cream chocolate","aliases":["chocolate ice cream","chocolate scoop","rich chocolate"],"calories_per_100g":210,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 scoop","serving_grams":50},
    {"food_name":"ice cream strawberry","aliases":["strawberry ice cream","strawberry scoop","berry ice cream"],"calories_per_100g":190,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":10,"fiber_per_100g":0.3,"serving_size":"1 scoop","serving_grams":50},
    {"food_name":"frozen yogurt","aliases":["frozen yogurt","froyo","soft serve yogurt"],"calories_per_100g":130,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":3,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"gelato","aliases":["gelato","italian ice cream","authentic gelato","pistachio gelato"],"calories_per_100g":200,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":11,"fiber_per_100g":0,"serving_size":"1 scoop","serving_grams":50},
    {"food_name":"sorbet","aliases":["sorbet","fruit sorbet","mango sorbet","lemon sorbet"],"calories_per_100g":130,"protein_per_100g":0.3,"carbs_per_100g":32,"fat_per_100g":0,"fiber_per_100g":0.5,"serving_size":"1 scoop","serving_grams":50},
]

# ── African & Caribbean ──
AFRICAN_CARIBBEAN = [
    {"food_name":"jollof rice","aliases":["jollof rice","west african rice","party rice","nigerian jollof"],"calories_per_100g":160,"protein_per_100g":4,"carbs_per_100g":28,"fat_per_100g":4,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"jollof rice with chicken","aliases":["jollof rice with chicken","chicken jollof","jollof chicken meal"],"calories_per_100g":180,"protein_per_100g":10,"carbs_per_100g":26,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":350},
    {"food_name":"ewa agoyin","aliases":["ewa agoyin","beans agoyin","nigerian beans","mashed beans"],"calories_per_100g":140,"protein_per_100g":8,"carbs_per_100g":20,"fat_per_100g":3,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"fufu","aliases":["fufu","west african fufu","swallow","pounded yam"],"calories_per_100g":120,"protein_per_100g":1,"carbs_per_100g":28,"fat_per_100g":0.3,"fiber_per_100g":2,"serving_size":"1 ball","serving_grams":150},
    {"food_name":"egusi soup","aliases":["egusi soup","melon seed soup","nigerian egusi"],"calories_per_100g":180,"protein_per_100g":8,"carbs_per_100g":8,"fat_per_100g":14,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"ogbono soup","aliases":["ogbono soup","wild mango soup","draw soup"],"calories_per_100g":170,"protein_per_100g":7,"carbs_per_100g":6,"fat_per_100g":14,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"okra soup","aliases":["okra soup","nigerian okra","draw soup okra"],"calories_per_100g":60,"protein_per_100g":3,"carbs_per_100g":6,"fat_per_100g":3,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"eggs and plantain","aliases":["eggs and plantain","plantain with eggs","nigerian breakfast","eggs dodo"],"calories_per_100g":140,"protein_per_100g":5,"carbs_per_100g":20,"fat_per_100g":5,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"suya","aliases":["suya","nigerian suya","spicy beef skewer","west african kebab"],"calories_per_100g":220,"protein_per_100g":18,"carbs_per_100g":4,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":50},
    {"food_name":"puff puff","aliases":["puff puff","nigerian doughnut","fried dough","west african puff"],"calories_per_100g":300,"protein_per_100g":6,"carbs_per_100g":46,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"moin moin","aliases":["moin moin","bean pudding","nigerian moi moi","steamed bean cake"],"calories_per_100g":150,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":5,"fiber_per_100g":4,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"injera","aliases":["injera","ethiopian flatbread","sourdough flatbread","teff bread"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":28,"fat_per_100g":1,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"doro wat","aliases":["doro wat","ethiopian chicken stew","spicy chicken stew"],"calories_per_100g":170,"protein_per_100g":15,"carbs_per_100g":5,"fat_per_100g":11,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kitfo","aliases":["kitfo","ethiopian minced beef","tartare ethiopian"],"calories_per_100g":220,"protein_per_100g":18,"carbs_per_100g":1,"fat_per_100g":16,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"shiro","aliases":["shiro","ethiopian chickpea stew","shiro wat"],"calories_per_100g":120,"protein_per_100g":6,"carbs_per_100g":16,"fat_per_100g":5,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"jerk chicken","aliases":["jerk chicken","jamaican jerk chicken","caribbean jerk","grilled jerk"],"calories_per_100g":190,"protein_per_100g":20,"carbs_per_100g":3,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"jerk pork","aliases":["jerk pork","jamaican jerk pork","caribbean pork"],"calories_per_100g":240,"protein_per_100g":20,"carbs_per_100g":2,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"rice and peas","aliases":["rice and peas","jamaican rice peas","coconut rice beans"],"calories_per_100g":170,"protein_per_100g":4,"carbs_per_100g":30,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"ackee and saltfish","aliases":["ackee and saltfish","jamaican ackee","national dish jamaica","ackee codfish"],"calories_per_100g":130,"protein_per_100g":10,"carbs_per_100g":6,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"curry goat","aliases":["curry goat","caribbean goat curry","jamaican goat"],"calories_per_100g":170,"protein_per_100g":18,"carbs_per_100g":5,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"rotli","aliases":["rotli","roti canai","caribbean roti","dhalpuri roti","buss up shut"],"calories_per_100g":260,"protein_per_100g":5,"carbs_per_100g":34,"fat_per_100g":12,"fiber_per_100g":1.5,"serving_size":"1 roti","serving_grams":80},
    {"food_name":"doubles","aliases":["doubles","trinidad doubles","channa bara","trinidad snack"],"calories_per_100g":180,"protein_per_100g":5,"carbs_per_100g":26,"fat_per_100g":7,"fiber_per_100g":3,"serving_size":"1 serving","serving_grams":120},
    {"food_name":"feijoada","aliases":["feijoada","brazilian black bean stew","pork bean stew"],"calories_per_100g":160,"protein_per_100g":12,"carbs_per_100g":12,"fat_per_100g":8,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"pão de queijo","aliases":["pão de queijo","brazilian cheese bread","cheese puff"],"calories_per_100g":280,"protein_per_100g":6,"carbs_per_100g":28,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"acarajé","aliases":["acarajé","brazilian black eyed pea fritter","fried bean cake"],"calories_per_100g":250,"protein_per_100g":7,"carbs_per_100g":22,"fat_per_100g":15,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"coxinha","aliases":["coxinha","brazilian chicken croquette","chicken drumstick snack"],"calories_per_100g":250,"protein_per_100g":8,"carbs_per_100g":22,"fat_per_100g":15,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"arepa","aliases":["arepa","venezuelan corn cake","colombian arepa","corn patty"],"calories_per_100g":220,"protein_per_100g":4,"carbs_per_100g":36,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 arepa","serving_grams":80},
    {"food_name":"ceviche","aliases":["ceviche","peruvian ceviche","raw fish citrus","citrus cured fish"],"calories_per_100g":80,"protein_per_100g":12,"carbs_per_100g":5,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"lomo saltado","aliases":["lomo saltado","peruvian beef stir fry","beef onion tomato"],"calories_per_100g":170,"protein_per_100g":14,"carbs_per_100g":10,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"empanada","aliases":["empanada","beef empanada","chicken empanada","argentinian pastry"],"calories_per_100g":280,"protein_per_100g":8,"carbs_per_100g":30,"fat_per_100g":15,"fiber_per_100g":1.5,"serving_size":"1 empanada","serving_grams":60},
    {"food_name":"churrasco","aliases":["churrasco","brazilian grilled meat","argentinian steak","grilled beef"],"calories_per_100g":240,"protein_per_100g":26,"carbs_per_100g":1,"fat_per_100g":15,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":150},
]

# ── More Seafood ──
SEAFOOD = [
    {"food_name":"lobster","aliases":["lobster","lobster tail","steamed lobster","grilled lobster"],"calories_per_100g":85,"protein_per_100g":18,"carbs_per_100g":0.5,"fat_per_100g":1,"fiber_per_100g":0,"serving_size":"1 tail","serving_grams":150},
    {"food_name":"lobster bisque","aliases":["lobster bisque","lobster soup","cream lobster"],"calories_per_100g":70,"protein_per_100g":3,"carbs_per_100g":5,"fat_per_100g":4,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"crab legs","aliases":["crab legs","steamed crab legs","snow crab","king crab"],"calories_per_100g":85,"protein_per_100g":18,"carbs_per_100g":0,"fat_per_100g":1,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"crab cakes","aliases":["crab cakes","maryland crab cakes","crab patties"],"calories_per_100g":200,"protein_per_100g":14,"carbs_per_100g":12,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"scallops","aliases":["scallops","seared scallops","pan seared scallops","butter scallops"],"calories_per_100g":110,"protein_per_100g":20,"carbs_per_100g":5,"fat_per_100g":1.5,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"mussels","aliases":["mussels","steamed mussels","mussels in wine","garlic mussels"],"calories_per_100g":100,"protein_per_100g":14,"carbs_per_100g":4,"fat_per_100g":2.5,"fiber_per_100g":0,"serving_size":"1 bowl","serving_grams":200},
    {"food_name":"clams","aliases":["clams","steamed clams","littleneck clams","clam bake"],"calories_per_100g":75,"protein_per_100g":12,"carbs_per_100g":3,"fat_per_100g":1,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"oysters","aliases":["oysters","raw oysters","grilled oysters","rockefeller"],"calories_per_100g":70,"protein_per_100g":7,"carbs_per_100g":4,"fat_per_100g":2.5,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"calamari","aliases":["calamari","fried calamari","squid rings","grilled calamari"],"calories_per_100g":170,"protein_per_100g":15,"carbs_per_100g":8,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"fish fillet grilled","aliases":["grilled fish","grilled fish fillet","white fish fillet","pan seared fish"],"calories_per_100g":120,"protein_per_100g":22,"carbs_per_100g":0.5,"fat_per_100g":3,"fiber_per_100g":0,"serving_size":"1 fillet","serving_grams":150},
    {"food_name":"fish fingers","aliases":["fish fingers","fish sticks","battered fish fingers","kids fish"],"calories_per_100g":240,"protein_per_100g":12,"carbs_per_100g":20,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"salmon sashimi","aliases":["salmon sashimi","raw salmon","fresh salmon slices"],"calories_per_100g":200,"protein_per_100g":20,"carbs_per_100g":0,"fat_per_100g":13,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":80},
    {"food_name":"tuna sashimi","aliases":["tuna sashimi","raw tuna","maguro sashimi"],"calories_per_100g":140,"protein_per_100g":24,"carbs_per_100g":0,"fat_per_100g":4,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":80},
]

# ── Condiments & Sauces ──
CONDIMENTS = [
    {"food_name":"mayonnaise","aliases":["mayonnaise","mayo","egg mayo","american mayo"],"calories_per_100g":700,"protein_per_100g":1,"carbs_per_100g":2,"fat_per_100g":77,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"ketchup","aliases":["ketchup","tomato ketchup","tomato sauce","red sauce"],"calories_per_100g":100,"protein_per_100g":1,"carbs_per_100g":26,"fat_per_100g":0.2,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"mustard","aliases":["mustard","yellow mustard","dijon mustard","whole grain mustard"],"calories_per_100g":60,"protein_per_100g":3,"carbs_per_100g":5,"fat_per_100g":3,"fiber_per_100g":1.5,"serving_size":"1 tbsp","serving_grams":10},
    {"food_name":"bbq sauce","aliases":["bbq sauce","barbecue sauce","hickory bbq","smokey bbq"],"calories_per_100g":140,"protein_per_100g":0.5,"carbs_per_100g":32,"fat_per_100g":0.5,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"hot sauce","aliases":["hot sauce","chilli sauce","tabasco","sriracha"],"calories_per_100g":30,"protein_per_100g":1,"carbs_per_100g":6,"fat_per_100g":0.3,"fiber_per_100g":0.5,"serving_size":"1 tsp","serving_grams":5},
    {"food_name":"soy sauce","aliases":["soy sauce","light soy sauce","dark soy sauce","shoyu"],"calories_per_100g":50,"protein_per_100g":5,"carbs_per_100g":6,"fat_per_100g":0.3,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"olive oil","aliases":["olive oil","extra virgin olive oil","evoo","cooking olive oil"],"calories_per_100g":884,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":100,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"butter","aliases":["butter","salted butter","unsalted butter","creamy butter"],"calories_per_100g":720,"protein_per_100g":0.5,"carbs_per_100g":0.5,"fat_per_100g":81,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":14},
    {"food_name":"ghee","aliases":["ghee","clarified butter","desi ghee","pure ghee"],"calories_per_100g":900,"protein_per_100g":0,"carbs_per_100g":0,"fat_per_100g":100,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"cream cheese","aliases":["cream cheese","philadelphia cream cheese","soft cheese"],"calories_per_100g":340,"protein_per_100g":6,"carbs_per_100g":4,"fat_per_100g":34,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"sour cream","aliases":["sour cream","crema","cultured cream","mexican cream"],"calories_per_100g":190,"protein_per_100g":2.5,"carbs_per_100g":4,"fat_per_100g":19,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"hummus","aliases":["hummus","chickpea hummus","traditional hummus","hummus dip"],"calories_per_100g":160,"protein_per_100g":6,"carbs_per_100g":14,"fat_per_100g":10,"fiber_per_100g":4,"serving_size":"1 serving","serving_grams":60},
    {"food_name":"tahini","aliases":["tahini","sesame paste","tahina","sesame butter"],"calories_per_100g":600,"protein_per_100g":18,"carbs_per_100g":20,"fat_per_100g":54,"fiber_per_100g":5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"pesto","aliases":["pesto","pesto genovese","basil pesto","green pesto"],"calories_per_100g":400,"protein_per_100g":5,"carbs_per_100g":5,"fat_per_100g":38,"fiber_per_100g":1.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"peanut butter","aliases":["peanut butter","creamy peanut butter","crunchy peanut butter","groundnut paste"],"calories_per_100g":588,"protein_per_100g":25,"carbs_per_100g":20,"fat_per_100g":50,"fiber_per_100g":6,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"almond butter","aliases":["almond butter","almond paste","roasted almond butter"],"calories_per_100g":600,"protein_per_100g":15,"carbs_per_100g":18,"fat_per_100g":55,"fiber_per_100g":5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"jam","aliases":["jam","fruit jam","strawberry jam","marmalade","preserve"],"calories_per_100g":240,"protein_per_100g":0.5,"carbs_per_100g":60,"fat_per_100g":0.2,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":20},
    {"food_name":"honey","aliases":["honey","pure honey","raw honey","organic honey"],"calories_per_100g":300,"protein_per_100g":0.2,"carbs_per_100g":82,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":20},
    {"food_name":"maple syrup","aliases":["maple syrup","pure maple syrup","pancake syrup"],"calories_per_100g":260,"protein_per_100g":0.2,"carbs_per_100g":67,"fat_per_100g":0.2,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":20},
    {"food_name":"ranch dressing","aliases":["ranch dressing","ranch dip","buttermilk ranch","creamy dressing"],"calories_per_100g":450,"protein_per_100g":1,"carbs_per_100g":4,"fat_per_100g":48,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"italian dressing","aliases":["italian dressing","vinaigrette","oil vinegar dressing","balsamic dressing"],"calories_per_100g":250,"protein_per_100g":0.5,"carbs_per_100g":6,"fat_per_100g":25,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"balsamic vinegar","aliases":["balsamic vinegar","balsamic","aged balsamic","balsamic glaze"],"calories_per_100g":90,"protein_per_100g":0.5,"carbs_per_100g":18,"fat_per_100g":0,"fiber_per_100g":0,"serving_size":"1 tbsp","serving_grams":15},
]

all_groups = [
    INDIAN_BREADS, INDIAN_SWEETS, FAST_FOOD, DESSERTS,
    AFRICAN_CARIBBEAN, SEAFOOD, CONDIMENTS
]

for group in all_groups:
    NEW.extend(add(group))

combined = existing + NEW
with open('D:\\FitnessApp\\assets\\food_database.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, indent=2, ensure_ascii=False)

print(f"Original: {len(existing)} items")
print(f"Added: {len(NEW)} new items")
print(f"Total: {len(combined)} items")
