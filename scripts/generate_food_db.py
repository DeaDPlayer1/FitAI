import json, sys

with open('D:\\FitnessApp\\assets\\food_database.json', 'r', encoding='utf-8') as f:
    existing = json.load(f)

# First batch already merged, now adding second batch
# Re-read after first batch was saved
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

# ── Indian Regional Dishes ──

NORTH_INDIAN = [
    {"food_name":"chole bhature","aliases":["chole bhature","chholay bhature","channa bhatura"],"calories_per_100g":250,"protein_per_100g":7,"carbs_per_100g":35,"fat_per_100g":10,"fiber_per_100g":4,"serving_size":"1 plate","serving_grams":350},
    {"food_name":"chicken korma","aliases":["chicken korma","murgh korma","chicken kurma"],"calories_per_100g":175,"protein_per_100g":14,"carbs_per_100g":6,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"mutton curry","aliases":["mutton curry","goat curry","bakri ka gosht","mutton gravy"],"calories_per_100g":190,"protein_per_100g":16,"carbs_per_100g":4,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"fish curry","aliases":["fish curry","machli curry","fish gravy","meen curry"],"calories_per_100g":120,"protein_per_100g":14,"carbs_per_100g":3,"fat_per_100g":6,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"shahi paneer","aliases":["shahi paneer","royal paneer","rich paneer gravy"],"calories_per_100g":190,"protein_per_100g":8,"carbs_per_100g":8,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kadai paneer","aliases":["kadai paneer","karahi paneer","paneer kadai"],"calories_per_100g":155,"protein_per_100g":7,"carbs_per_100g":9,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kadai chicken","aliases":["kadai chicken","karahi chicken","chicken kadai"],"calories_per_100g":170,"protein_per_100g":14,"carbs_per_100g":6,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"malai kofta","aliases":["malai kofta","paneer kofta","vegetable kofta"],"calories_per_100g":185,"protein_per_100g":5,"carbs_per_100g":12,"fat_per_100g":14,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"dal bukhara","aliases":["dal bukhara","bukhara dal","black dal"],"calories_per_100g":160,"protein_per_100g":7,"carbs_per_100g":16,"fat_per_100g":7,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"dum aloo","aliases":["dum aloo","kashmiri dum aloo","dum aloo kashmiri"],"calories_per_100g":130,"protein_per_100g":2,"carbs_per_100g":14,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"aloo matar","aliases":["aloo matar","aloo mutter","potato pea curry"],"calories_per_100g":90,"protein_per_100g":3,"carbs_per_100g":12,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"paneer bhurji","aliases":["paneer bhurji","scrambled paneer","paneer scramble"],"calories_per_100g":210,"protein_per_100g":12,"carbs_per_100g":3,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":180},
    {"food_name":"soya chaap","aliases":["soya chaap","soy chaap","malai soya chaap","achaari soya chaap"],"calories_per_100g":160,"protein_per_100g":14,"carbs_per_100g":8,"fat_per_100g":9,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"stuffed paratha","aliases":["stuffed paratha","aloo paratha","gobi paratha","paneer paratha","mooli paratha"],"calories_per_100g":260,"protein_per_100g":6,"carbs_per_100g":35,"fat_per_100g":11,"fiber_per_100g":3,"serving_size":"1 paratha","serving_grams":80},
    {"food_name":"lachha paratha","aliases":["lachha paratha","layered paratha","laccha paratha"],"calories_per_100g":320,"protein_per_100g":6,"carbs_per_100g":42,"fat_per_100g":14,"fiber_per_100g":2.5,"serving_size":"1 paratha","serving_grams":60},
    {"food_name":"missi roti","aliases":["missi roti","gram flour roti","besan roti"],"calories_per_100g":290,"protein_per_100g":9,"carbs_per_100g":48,"fat_per_100g":7,"fiber_per_100g":5,"serving_size":"1 roti","serving_grams":50},
    {"food_name":"makki di roti","aliases":["makki di roti","makki roti","corn roti","makki ki roti"],"calories_per_100g":220,"protein_per_100g":5,"carbs_per_100g":38,"fat_per_100g":4,"fiber_per_100g":3,"serving_size":"1 roti","serving_grams":50},
    {"food_name":"sarson ka saag","aliases":["sarson ka saag","mustard greens","sarson saag"],"calories_per_100g":65,"protein_per_100g":3,"carbs_per_100g":6,"fat_per_100g":3.5,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"chicken changezi","aliases":["chicken changezi","changezi chicken","murgh changezi"],"calories_per_100g":190,"protein_per_100g":15,"carbs_per_100g":6,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"murg mussallam","aliases":["murg mussallam","chicken mussallam","whole chicken curry"],"calories_per_100g":185,"protein_per_100g":16,"carbs_per_100g":5,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"bhuna gosht","aliases":["bhuna gosht","bhuna meat","slow cooked mutton"],"calories_per_100g":210,"protein_per_100g":17,"carbs_per_100g":4,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"raan","aliases":["raan","raan gosht","leg of lamb","mutton raan"],"calories_per_100g":220,"protein_per_100g":18,"carbs_per_100g":3,"fat_per_100g":16,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":150},
]

SOUTH_INDIAN = [
    {"food_name":"masala dosa","aliases":["masala dosa","masala dosai","stuffed dosa"],"calories_per_100g":165,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":6,"fiber_per_100g":2,"serving_size":"1 dosa","serving_grams":150},
    {"food_name":"rava dosa","aliases":["rava dosa","semolina dosa","crispy rava dosa"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":20,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 dosa","serving_grams":80},
    {"food_name":"paper dosa","aliases":["paper dosa","paper roast","crispy dosa"],"calories_per_100g":150,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":4.5,"fiber_per_100g":0.8,"serving_size":"1 dosa","serving_grams":120},
    {"food_name":"ghee roast dosa","aliases":["ghee roast","ghee dosa","nei roast"],"calories_per_100g":190,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":8,"fiber_per_100g":0.8,"serving_size":"1 dosa","serving_grams":100},
    {"food_name":"podi dosa","aliases":["podi dosa","gunpowder dosa","milagai podi dosa"],"calories_per_100g":160,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":6,"fiber_per_100g":1,"serving_size":"1 dosa","serving_grams":100},
    {"food_name":"set dosa","aliases":["set dosa","soft dosa","spongy dosa"],"calories_per_100g":120,"protein_per_100g":3.5,"carbs_per_100g":20,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 set","serving_grams":120},
    {"food_name":"neer dosa","aliases":["neer dosa","thin rice dosa","water dosa"],"calories_per_100g":110,"protein_per_100g":2,"carbs_per_100g":20,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 dosa","serving_grams":60},
    {"food_name":"kali dosa","aliases":["kali dosa","black dosa","ragi dosa"],"calories_per_100g":120,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":2,"fiber_per_100g":2,"serving_size":"1 dosa","serving_grams":80},
    {"food_name":"pongal","aliases":["pongal","ven pongal","khara pongal","ghee pongal"],"calories_per_100g":150,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"sweet pongal","aliases":["sweet pongal","sakkarai pongal","chakkara pongal"],"calories_per_100g":220,"protein_per_100g":4,"carbs_per_100g":38,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"rava idli","aliases":["rava idli","sooji idli","semolina idli"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":3.5,"fiber_per_100g":0.5,"serving_size":"1 idli","serving_grams":40},
    {"food_name":"kanchipuram idli","aliases":["kanchipuram idli","masala idli","kanchi idli"],"calories_per_100g":110,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 idli","serving_grams":50},
    {"food_name":"medu vada","aliases":["medu vada","uzhunnu vada","urad dal vada","sambar vada"],"calories_per_100g":215,"protein_per_100g":8,"carbs_per_100g":22,"fat_per_100g":11,"fiber_per_100g":1.5,"serving_size":"1 vada","serving_grams":40},
    {"food_name":"masala vada","aliases":["masala vada","paruppu vadai","dal vada","chana dal vada"],"calories_per_100g":210,"protein_per_100g":9,"carbs_per_100g":20,"fat_per_100g":11,"fiber_per_100g":3,"serving_size":"1 vada","serving_grams":35},
    {"food_name":"moru kuzhambu","aliases":["moru kuzhambu","buttermilk curry","moru curry"],"calories_per_100g":45,"protein_per_100g":2,"carbs_per_100g":4,"fat_per_100g":2.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kootu","aliases":["kootu","mixed vegetable kootu","coconut lentil stew"],"calories_per_100g":70,"protein_per_100g":3,"carbs_per_100g":8,"fat_per_100g":3,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"poriyal","aliases":["poriyal","stir fried vegetables","coconut poriyal"],"calories_per_100g":65,"protein_per_100g":2,"carbs_per_100g":6,"fat_per_100g":3.5,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"thoran","aliases":["thoran","stir fry with coconut","kerala thoran"],"calories_per_100g":60,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":3.5,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"olan","aliases":["olan","ash gourd coconut curry","kerala olan"],"calories_per_100g":55,"protein_per_100g":1.5,"carbs_per_100g":4,"fat_per_100g":3.5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"erissery","aliases":["erissery","pumpkin coconut curry","mathan erissery"],"calories_per_100g":75,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"parippu curry","aliases":["parippu curry","dal kerala style","kerala parippu"],"calories_per_100g":110,"protein_per_100g":6,"carbs_per_100g":16,"fat_per_100g":3,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kerala beef fry","aliases":["kerala beef fry","beef ullarthiyathu","kerala beef roast"],"calories_per_100g":220,"protein_per_100g":20,"carbs_per_100g":4,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"kozhukatta","aliases":["kozhukatta","rice dumplings","modak kerala","kudumu"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":30,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"unniyappam","aliases":["unniyappam","banana fritter kerala","unni appam"],"calories_per_100g":200,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":9,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"ada pradhaman","aliases":["ada pradhaman","rice ada payasam","kheer ada"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"palada pradhaman","aliases":["palada pradhaman","milk ada payasam","pala payasam"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":30,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"idiyappam","aliases":["idiyappam","string hoppers","nool puttu","idiappam"],"calories_per_100g":140,"protein_per_100g":2,"carbs_per_100g":30,"fat_per_100g":1,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"puttu kadala","aliases":["puttu kadala","puttu and chickpea curry","kadala curry"],"calories_per_100g":160,"protein_per_100g":5,"carbs_per_100g":25,"fat_per_100g":4,"fiber_per_100g":3,"serving_size":"1 serving","serving_grams":250},
    {"food_name":"ulli theeyal","aliases":["ulli theeyal","onion theeyal","shallot roasted curry"],"calories_per_100g":90,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
]

WEST_INDIAN = [
    {"food_name":"gujarati kadhi","aliases":["gujarati kadhi","kadhi","sweet kadhi","gujarati dal kadhi"],"calories_per_100g":55,"protein_per_100g":2,"carbs_per_100g":6,"fat_per_100g":2.5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"undhiyu","aliases":["undhiyu","gujarati mixed vegetable","undhiyu gujarat"],"calories_per_100g":90,"protein_per_100g":3,"carbs_per_100g":10,"fat_per_100g":4.5,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"handvo","aliases":["handvo","gujarati rice lentil cake","handvo snack"],"calories_per_100g":180,"protein_per_100g":5,"carbs_per_100g":26,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 slice","serving_grams":80},
    {"food_name":"khandvi","aliases":["khandvi","gram flour rolls","khandvi snack"],"calories_per_100g":140,"protein_per_100g":5,"carbs_per_100g":15,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"muthia","aliases":["muthia","methi muthia","vegetable muthia","steamed muthia"],"calories_per_100g":170,"protein_per_100g":5,"carbs_per_100g":26,"fat_per_100g":5,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"fafda","aliases":["fafda","crispy gram flour strips","fafda snack"],"calories_per_100g":350,"protein_per_100g":10,"carbs_per_100g":48,"fat_per_100g":14,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"dal baati churma","aliases":["dal baati churma","dal bati","baati churma"],"calories_per_100g":280,"protein_per_100g":7,"carbs_per_100g":40,"fat_per_100g":10,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":350},
    {"food_name":"gatte ki sabzi","aliases":["gatte ki sabzi","gram flour dumpling curry","gatta curry"],"calories_per_100g":120,"protein_per_100g":5,"carbs_per_100g":12,"fat_per_100g":6,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"laal maas","aliases":["laal maas","red mutton curry","rajasthani laal maas"],"calories_per_100g":200,"protein_per_100g":18,"carbs_per_100g":5,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"ker sangri","aliases":["ker sangri","rajasthani ker sangri","desert beans"],"calories_per_100g":60,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":2,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"mohan maas","aliases":["mohan maas","royal mutton curry","rajasthani mohan maas"],"calories_per_100g":210,"protein_per_100g":18,"carbs_per_100g":4,"fat_per_100g":14,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"bhutte ka kees","aliases":["bhutte ka kees","grated corn bhurji","bhutta kees"],"calories_per_100g":100,"protein_per_100g":3,"carbs_per_100g":14,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"misal pav","aliases":["misal pav","misal","mumbai misal","spicy sprout curry"],"calories_per_100g":140,"protein_per_100g":6,"carbs_per_100g":16,"fat_per_100g":6,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"vada pav","aliases":["vada pav","mumbai burger","batata vada pav"],"calories_per_100g":220,"protein_per_100g":5,"carbs_per_100g":30,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 vada pav","serving_grams":100},
    {"food_name":"ragda pattice","aliases":["ragda pattice","ragda patties","ragda tikki"],"calories_per_100g":180,"protein_per_100g":5,"carbs_per_100g":24,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"sev puri","aliases":["sev puri","mumbai sev puri","chaat sev puri"],"calories_per_100g":170,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"dahi puri","aliases":["dahi puri","curd puri","dahi batata puri"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"batata vada","aliases":["batata vada","aloo vada","potato fritter","bombay vada"],"calories_per_100g":190,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 vada","serving_grams":40},
    {"food_name":"modak","aliases":["modak","ukadiche modak","rice dumpling sweet"],"calories_per_100g":180,"protein_per_100g":3,"carbs_per_100g":30,"fat_per_100g":6,"fiber_per_100g":1,"serving_size":"1 modak","serving_grams":30},
    {"food_name":"zunka bhakar","aliases":["zunka bhakar","zunka","jhunka bhakar","gram flour stir fry"],"calories_per_100g":200,"protein_per_100g":7,"carbs_per_100g":25,"fat_per_100g":8,"fiber_per_100g":4,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"pithla bhakri","aliases":["pithla bhakri","pithla","besan curry bhakri"],"calories_per_100g":180,"protein_per_100g":6,"carbs_per_100g":22,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"sol kadhi","aliases":["sol kadhi","sol kadhi drink","kokum kadhi"],"calories_per_100g":30,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":2,"fiber_per_100g":0.2,"serving_size":"1 glass","serving_grams":200},
]

EAST_INDIAN = [
    {"food_name":"macher jhol","aliases":["macher jhol","bengali fish curry","mach jhol","maach jhol"],"calories_per_100g":100,"protein_per_100g":12,"carbs_per_100g":3,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"shorshe ilish","aliases":["shorshe ilish","hilsa mustard curry","sorshe ilish"],"calories_per_100g":220,"protein_per_100g":18,"carbs_per_100g":2,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"chingri malai curry","aliases":["chingri malai curry","prawn malai curry","prawn coconut curry"],"calories_per_100g":160,"protein_per_100g":13,"carbs_per_100g":5,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"doi maach","aliases":["doi maach","yogurt fish curry","doi mach"],"calories_per_100g":150,"protein_per_100g":14,"carbs_per_100g":5,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kalia","aliases":["kalia","bengali fish kalia","macher kalia"],"calories_per_100g":140,"protein_per_100g":13,"carbs_per_100g":5,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"cholar dal","aliases":["cholar dal","bengali chana dal","chhola dal"],"calories_per_100g":130,"protein_per_100g":7,"carbs_per_100g":20,"fat_per_100g":3,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"shukto","aliases":["shukto","bengali mixed veg","shukto curry"],"calories_per_100g":60,"protein_per_100g":2,"carbs_per_100g":6,"fat_per_100g":3,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"aloo postho","aliases":["aloo posto","poppy seed potato","aloo posto bengali"],"calories_per_100g":100,"protein_per_100g":2,"carbs_per_100g":10,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"kasha mangsho","aliases":["kasha mangsho","bengali mutton curry","kosha mangsho"],"calories_per_100g":220,"protein_per_100g":18,"carbs_per_100g":5,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"doi begun","aliases":["doi begun","yogurt eggplant","doi baingan"],"calories_per_100g":80,"protein_per_100g":2,"carbs_per_100g":7,"fat_per_100g":5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"mochar chop","aliases":["mochar chop","banana blossom cutlet","mocha chop"],"calories_per_100g":160,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":8,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"patishapta","aliases":["patishapta","bengali sweet crepe","patali pithe"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":28,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"sandesh","aliases":["sandesh","bengali sweet","sondesh","mishti"],"calories_per_100g":250,"protein_per_100g":8,"carbs_per_100g":40,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"mishti doi","aliases":["mishti doi","sweet yogurt","bengali sweet curd"],"calories_per_100g":130,"protein_per_100g":4,"carbs_per_100g":20,"fat_per_100g":4,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"cham cham","aliases":["cham cham","chomchom","bengali sweet"],"calories_per_100g":260,"protein_per_100g":5,"carbs_per_100g":45,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":35},
    {"food_name":"chhena poda","aliases":["chhena poda","baked cottage cheese","odia chhena poda"],"calories_per_100g":220,"protein_per_100g":8,"carbs_per_100g":28,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"dalma","aliases":["dalma","odia dal","dalma odisha"],"calories_per_100g":90,"protein_per_100g":4,"carbs_per_100g":14,"fat_per_100g":2,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"dahi baigana","aliases":["dahi baigana","odia dahi baingan","yogurt eggplant"],"calories_per_100g":70,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"macha ghanta","aliases":["macha ghanta","fish head curry","odia fish head"],"calories_per_100g":120,"protein_per_100g":12,"carbs_per_100g":3,"fat_per_100g":7,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
]

NORTHEAST_INDIAN = [
    {"food_name":"thukpa","aliases":["thukpa","tibetan noodle soup","sikkim thukpa"],"calories_per_100g":110,"protein_per_100g":5,"carbs_per_100g":16,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"momo chicken","aliases":["momo chicken","chicken momo","steamed momo"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":20,"fat_per_100g":6,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"momo veg","aliases":["momo veg","vegetable momo","veg momos"],"calories_per_100g":140,"protein_per_100g":5,"carbs_per_100g":22,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"momo pork","aliases":["pork momo","pork momos","pork dumpling"],"calories_per_100g":210,"protein_per_100g":13,"carbs_per_100g":18,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"pan fried momo","aliases":["pan fried momo","kothey momo","pan fried dumpling"],"calories_per_100g":220,"protein_per_100g":12,"carbs_per_100g":20,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"thenthuk","aliases":["thenthuk","tibetan hand pulled noodle soup"],"calories_per_100g":100,"protein_per_100g":4,"carbs_per_100g":16,"fat_per_100g":2.5,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"shyaphalay","aliases":["shyaphalay","tibetan stuffed bread","tibetan meat pie"],"calories_per_100g":250,"protein_per_100g":8,"carbs_per_100g":28,"fat_per_100g":12,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":80},
    {"food_name":"kinema curry","aliases":["kinema curry","fermented soybean curry","sikkim kinema"],"calories_per_100g":110,"protein_per_100g":7,"carbs_per_100g":7,"fat_per_100g":6,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"axone pork","aliases":["axone pork","fermented soybean pork","nagaland pork axone"],"calories_per_100g":240,"protein_per_100g":15,"carbs_per_100g":5,"fat_per_100g":18,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"naga chicken","aliases":["naga chicken","naga style chicken","ghost pepper chicken"],"calories_per_100g":170,"protein_per_100g":14,"carbs_per_100g":4,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"smoked pork","aliases":["smoked pork","naga smoked pork","burnt pork"],"calories_per_100g":280,"protein_per_100g":16,"carbs_per_100g":2,"fat_per_100g":23,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"masor tenga","aliases":["masor tenga","assam fish curry","sour fish curry"],"calories_per_100g":100,"protein_per_100g":12,"carbs_per_100g":3,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"khar","aliases":["khar","assam traditional curry","alkaline curry assam"],"calories_per_100g":35,"protein_per_100g":1,"carbs_per_100g":4,"fat_per_100g":1.5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"ou tenga","aliases":["ou tenga","elephant apple curry","assam sour curry"],"calories_per_100g":40,"protein_per_100g":1,"carbs_per_100g":6,"fat_per_100g":1.5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"chak hao kheer","aliases":["chak hao kheer","black rice kheer","manipuri black rice"],"calories_per_100g":150,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"singju","aliases":["singju","manipuri salad","herb salad"],"calories_per_100g":30,"protein_per_100g":1,"carbs_per_100g":4,"fat_per_100g":1,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":100},
]

# Indian Street Food & Chaat
STREET_FOOD = [
    {"food_name":"aloo tikki","aliases":["aloo tikki","potato cutlet","aloo patty"],"calories_per_100g":160,"protein_per_100g":2,"carbs_per_100g":20,"fat_per_100g":8,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":50},
    {"food_name":"dahi bhalla","aliases":["dahi bhalla","dahi vada","curd vada","dahi bada"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"mango pickle","aliases":["mango pickle","aam ka achaar","indian mango pickle"],"calories_per_100g":30,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"lemon pickle","aliases":["lemon pickle","nimbu achaar","salt lemon pickle"],"calories_per_100g":25,"protein_per_100g":0.3,"carbs_per_100g":3,"fat_per_100g":1,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"green chutney","aliases":["green chutney","coriander chutney","hari chutney","mint chutney"],"calories_per_100g":25,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"tamarind chutney","aliases":["tamarind chutney","imli chutney","sweet chutney"],"calories_per_100g":80,"protein_per_100g":0.3,"carbs_per_100g":20,"fat_per_100g":0.2,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"coconut chutney","aliases":["coconut chutney","nariyal chutney","white chutney"],"calories_per_100g":60,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"tomato chutney","aliases":["tomato chutney","tamatar chutney","tomato onion chutney"],"calories_per_100g":25,"protein_per_100g":0.5,"carbs_per_100g":4,"fat_per_100g":1,"fiber_per_100g":0.5,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"peanut chutney","aliases":["peanut chutney","moongphali chutney","kadalai chutney"],"calories_per_100g":80,"protein_per_100g":3,"carbs_per_100g":4,"fat_per_100g":6,"fiber_per_100g":1,"serving_size":"1 tbsp","serving_grams":15},
    {"food_name":"kachumber salad","aliases":["kachumber","indian salad","cucumber tomato onion salad"],"calories_per_100g":20,"protein_per_100g":0.5,"carbs_per_100g":4,"fat_per_100g":0.2,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":100},
]

# Biryani varieties
BIRYANI = [
    {"food_name":"hyderabadi biryani","aliases":["hyderabadi biryani","dum biryani","kacchi biryani"],"calories_per_100g":250,"protein_per_100g":12,"carbs_per_100g":30,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"lucknowi biryani","aliases":["lucknowi biryani","awadhi biryani","pukki biryani"],"calories_per_100g":240,"protein_per_100g":12,"carbs_per_100g":30,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"kolkata biryani","aliases":["kolkata biryani","calcutta biryani","bengali biryani"],"calories_per_100g":230,"protein_per_100g":11,"carbs_per_100g":30,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"malabar biryani","aliases":["malabar biryani","thalassery biryani","kerala biryani"],"calories_per_100g":240,"protein_per_100g":12,"carbs_per_100g":28,"fat_per_100g":10,"fiber_per_100g":0.8,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"chettinad biryani","aliases":["chettinad biryani","dindigul biryani","tamilnadu biryani"],"calories_per_100g":260,"protein_per_100g":13,"carbs_per_100g":30,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"veg biryani","aliases":["veg biryani","vegetable biryani","mixed veg biryani"],"calories_per_100g":190,"protein_per_100g":5,"carbs_per_100g":32,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"egg biryani","aliases":["egg biryani","anda biryani","boiled egg biryani"],"calories_per_100g":210,"protein_per_100g":7,"carbs_per_100g":32,"fat_per_100g":6,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"chicken biryani","aliases":["chicken biryani","chicken dum biryani"],"calories_per_100g":240,"protein_per_100g":12,"carbs_per_100g":30,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"mutton biryani","aliases":["mutton biryani","goat biryani"],"calories_per_100g":260,"protein_per_100g":14,"carbs_per_100g":30,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"prawn biryani","aliases":["prawn biryani","shrimp biryani","jinga biryani"],"calories_per_100g":220,"protein_per_100g":13,"carbs_per_100g":30,"fat_per_100g":7,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"fish biryani","aliases":["fish biryani","meen biryani","machli biryani"],"calories_per_100g":200,"protein_per_100g":12,"carbs_per_100g":30,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"paneer tikka","aliases":["paneer tikka","grilled paneer","paneer tikka dry"],"calories_per_100g":220,"protein_per_100g":12,"carbs_per_100g":6,"fat_per_100g":17,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"paneer tikka masala","aliases":["paneer tikka masala","paneer tikka gravy"],"calories_per_100g":180,"protein_per_100g":8,"carbs_per_100g":10,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"chicken tikka","aliases":["chicken tikka","tandoori chicken tikka","grilled chicken tikka"],"calories_per_100g":180,"protein_per_100g":22,"carbs_per_100g":2,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"tandoori chicken","aliases":["tandoori chicken","chicken tandoori","roasted chicken"],"calories_per_100g":190,"protein_per_100g":24,"carbs_per_100g":2,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"chicken 65","aliases":["chicken 65","chicken 65 spicy","south indian chicken starter"],"calories_per_100g":230,"protein_per_100g":18,"carbs_per_100g":8,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"chilli chicken","aliases":["chilli chicken","indo chinese chilli chicken","chilli chicken dry"],"calories_per_100g":220,"protein_per_100g":16,"carbs_per_100g":10,"fat_per_100g":14,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"gobi manchurian","aliases":["gobi manchurian","cauliflower manchurian","gobi 65"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"paneer manchurian","aliases":["paneer manchurian","paneer 65","chilli paneer"],"calories_per_100g":190,"protein_per_100g":7,"carbs_per_100g":12,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"mushroom manchurian","aliases":["mushroom manchurian","mushroom 65","chilli mushroom"],"calories_per_100g":110,"protein_per_100g":4,"carbs_per_100g":10,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"veg manchow soup","aliases":["veg manchow soup","manchow soup","hot and sour soup"],"calories_per_100g":50,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":1,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"sweet corn soup","aliases":["sweet corn soup","corn soup","american corn soup"],"calories_per_100g":60,"protein_per_100g":2,"carbs_per_100g":10,"fat_per_100g":1,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"tomato soup","aliases":["tomato soup","cream of tomato","tomato shorba"],"calories_per_100g":40,"protein_per_100g":1,"carbs_per_100g":6,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"dal shorba","aliases":["dal shorba","lentil soup","indian lentil soup"],"calories_per_100g":80,"protein_per_100g":5,"carbs_per_100g":12,"fat_per_100g":2,"fiber_per_100g":3,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"mulligatawny soup","aliases":["mulligatawny soup","rasam soup","pepper water"],"calories_per_100g":35,"protein_per_100g":1.5,"carbs_per_100g":5,"fat_per_100g":0.5,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
]

# Indian Sweets Extended
INDIAN_SWEETS = [
    {"food_name":"gajar ka halwa","aliases":["gajar ka halwa","carrot halwa","gajrela"],"calories_per_100g":240,"protein_per_100g":4,"carbs_per_100g":30,"fat_per_100g":12,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"atta halwa","aliases":["atta halwa","wheat flour halwa","gehu ka halwa"],"calories_per_100g":280,"protein_per_100g":4,"carbs_per_100g":40,"fat_per_100g":12,"fiber_per_100g":2,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"rabri","aliases":["rabri","rabdi","sweetened thickened milk"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":25,"fat_per_100g":9,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"malpua","aliases":["malpua","sweet pancake","indian pancake"],"calories_per_100g":250,"protein_per_100g":4,"carbs_per_100g":32,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"imarti","aliases":["imarti","urad dal jalebi","sweet pretzel"],"calories_per_100g":280,"protein_per_100g":4,"carbs_per_100g":55,"fat_per_100g":5,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"balushahi","aliases":["balushahi","badushah","north indian donut"],"calories_per_100g":350,"protein_per_100g":5,"carbs_per_100g":48,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":35},
    {"food_name":"mohan thaal","aliases":["mohan thaal","gujarati gram flour fudge"],"calories_per_100g":320,"protein_per_100g":7,"carbs_per_100g":45,"fat_per_100g":14,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"besan laddu","aliases":["besan laddu","gram flour laddu","besan laddoo"],"calories_per_100g":320,"protein_per_100g":8,"carbs_per_100g":35,"fat_per_100g":17,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":35},
    {"food_name":"rava laddu","aliases":["rava laddu","sooji laddu","semolina laddu"],"calories_per_100g":280,"protein_per_100g":4,"carbs_per_100g":35,"fat_per_100g":14,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"coconut laddu","aliases":["coconut laddu","nariyal laddu","coconut laddoo"],"calories_per_100g":280,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":18,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":25},
    {"food_name":"puran poli","aliases":["puran poli","holige","bobbhatlu","sweet flatbread"],"calories_per_100g":280,"protein_per_100g":5,"carbs_per_100g":45,"fat_per_100g":9,"fiber_per_100g":3,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"mysore pak","aliases":["mysore pak","mysore paak","gram flour fudge"],"calories_per_100g":380,"protein_per_100g":5,"carbs_per_100g":45,"fat_per_100g":21,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"kaju katli","aliases":["kaju katli","cashew fudge","kaju barfi"],"calories_per_100g":400,"protein_per_100g":7,"carbs_per_100g":45,"fat_per_100g":23,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"pista barfi","aliases":["pista barfi","pistachio fudge","pista burfi"],"calories_per_100g":370,"protein_per_100g":6,"carbs_per_100g":40,"fat_per_100g":21,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":20},
    {"food_name":"soan halwa","aliases":["soan halwa","dry fruit halwa"],"calories_per_100g":350,"protein_per_100g":6,"carbs_per_100g":50,"fat_per_100g":15,"fiber_per_100g":2,"serving_size":"1 serving","serving_grams":50},
    {"food_name":"semolina kesari","aliases":["semolina kesari","sooji kesari","rava kesari","kerala kesari"],"calories_per_100g":250,"protein_per_100g":3,"carbs_per_100g":40,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
]

# ── Global Cuisines ──

# Chinese
CHINESE = [
    {"food_name":"kung pao chicken","aliases":["kung pao chicken","gong bao chicken","chinese crispy chicken"],"calories_per_100g":190,"protein_per_100g":16,"carbs_per_100g":10,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"sweet and sour chicken","aliases":["sweet and sour chicken","sweet sour chicken"],"calories_per_100g":210,"protein_per_100g":14,"carbs_per_100g":18,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"szechuan chicken","aliases":["szechuan chicken","sichuan chicken","spicy chicken sichuan"],"calories_per_100g":190,"protein_per_100g":15,"carbs_per_100g":8,"fat_per_100g":11,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"mapo tofu","aliases":["mapo tofu","tofu szechuan style","spicy tofu"],"calories_per_100g":85,"protein_per_100g":6,"carbs_per_100g":4,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"wonton soup","aliases":["wonton soup","chinese wonton","wonton"],"calories_per_100g":60,"protein_per_100g":4,"carbs_per_100g":6,"fat_per_100g":2,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"hot and sour soup","aliases":["hot and sour soup","hot and sour chinese soup"],"calories_per_100g":40,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":1,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"chicken fried rice","aliases":["chicken fried rice","chinese chicken rice"],"calories_per_100g":210,"protein_per_100g":9,"carbs_per_100g":28,"fat_per_100g":7,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"egg fried rice","aliases":["egg fried rice","chinese egg rice"],"calories_per_100g":190,"protein_per_100g":6,"carbs_per_100g":30,"fat_per_100g":6,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"vegetable fried rice","aliases":["vegetable fried rice","veg fried rice","mixed vegetable rice"],"calories_per_100g":170,"protein_per_100g":4,"carbs_per_100g":30,"fat_per_100g":4,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"shrimp fried rice","aliases":["shrimp fried rice","prawn fried rice"],"calories_per_100g":200,"protein_per_100g":8,"carbs_per_100g":28,"fat_per_100g":6,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"chicken chow mein","aliases":["chicken chow mein","chicken noodles"],"calories_per_100g":200,"protein_per_100g":10,"carbs_per_100g":24,"fat_per_100g":8,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"veg chow mein","aliases":["veg chow mein","vegetable chow mein","stir fried noodles"],"calories_per_100g":170,"protein_per_100g":4,"carbs_per_100g":26,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"hakka noodles","aliases":["hakka noodles","stir fried noodles indo chinese"],"calories_per_100g":180,"protein_per_100g":5,"carbs_per_100g":26,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"spring roll veg","aliases":["spring roll veg","vegetable spring roll","spring roll indian"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"dim sum","aliases":["dim sum","chinese dumplings","dimsum"],"calories_per_100g":160,"protein_per_100g":7,"carbs_per_100g":18,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"char siu","aliases":["char siu","chinese bbq pork","honey glazed pork"],"calories_per_100g":260,"protein_per_100g":16,"carbs_per_100g":15,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"szechuan eggplant","aliases":["szechuan eggplant","sichuan eggplant","spicy eggplant"],"calories_per_100g":70,"protein_per_100g":2,"carbs_per_100g":7,"fat_per_100g":4,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":150},
]

# Italian
ITALIAN = [
    {"food_name":"spaghetti carbonara","aliases":["spaghetti carbonara","carbonara","pasta carbonara"],"calories_per_100g":220,"protein_per_100g":10,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"spaghetti bolognese","aliases":["spaghetti bolognese","bolognese","pasta bolognese"],"calories_per_100g":180,"protein_per_100g":10,"carbs_per_100g":24,"fat_per_100g":5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"fettuccine alfredo","aliases":["fettuccine alfredo","alfredo pasta","white sauce pasta"],"calories_per_100g":250,"protein_per_100g":8,"carbs_per_100g":26,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"lasagna","aliases":["lasagna","lasagne","italian baked pasta","meat lasagna"],"calories_per_100g":200,"protein_per_100g":12,"carbs_per_100g":18,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":200},
    {"food_name":"pizza margherita","aliases":["pizza margherita","margherita pizza","cheese tomato pizza"],"calories_per_100g":240,"protein_per_100g":10,"carbs_per_100g":30,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"pizza pepperoni","aliases":["pepperoni pizza","pizza pepporoni"],"calories_per_100g":280,"protein_per_100g":12,"carbs_per_100g":28,"fat_per_100g":14,"fiber_per_100g":1,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"risotto mushroom","aliases":["mushroom risotto","risotto ai funghi","italian rice"],"calories_per_100g":160,"protein_per_100g":4,"carbs_per_100g":26,"fat_per_100g":5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"minestrone soup","aliases":["minestrone soup","italian vegetable soup","minestrone"],"calories_per_100g":45,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"gnocchi","aliases":["gnocchi","potato dumplings","italian gnocchi"],"calories_per_100g":180,"protein_per_100g":4,"carbs_per_100g":30,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"bruschetta","aliases":["bruschetta","toasted bread with tomato","italian bruschetta"],"calories_per_100g":150,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":7,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"caprese salad","aliases":["caprese salad","tomato mozzarella basil","insalata caprese"],"calories_per_100g":160,"protein_per_100g":8,"carbs_per_100g":3,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"eggplant parmesan","aliases":["eggplant parmesan","melanzane alla parmigiana","parmigiana"],"calories_per_100g":140,"protein_per_100g":5,"carbs_per_100g":10,"fat_per_100g":9,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"chicken parmesan","aliases":["chicken parmesan","chicken parm","parmigiana chicken"],"calories_per_100g":220,"protein_per_100g":22,"carbs_per_100g":8,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":200},
    {"food_name":"calzone","aliases":["calzone","folded pizza","stuffed calzone"],"calories_per_100g":250,"protein_per_100g":11,"carbs_per_100g":28,"fat_per_100g":11,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":200},
    {"food_name":"focaccia","aliases":["focaccia","italian flatbread","olive herb bread"],"calories_per_100g":250,"protein_per_100g":6,"carbs_per_100g":38,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"pasta pesto","aliases":["pesto pasta","pasta al pesto","basil pesto pasta"],"calories_per_100g":230,"protein_per_100g":6,"carbs_per_100g":26,"fat_per_100g":12,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"pasta arrabbiata","aliases":["arrabbiata pasta","pasta arrabbiata","spicy tomato pasta"],"calories_per_100g":160,"protein_per_100g":5,"carbs_per_100g":26,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"pasta aglio olio","aliases":["aglio olio","garlic oil pasta","spaghetti aglio e olio"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":28,"fat_per_100g":8,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"tiramisu","aliases":["tiramisu","italian dessert","coffee tiramisu"],"calories_per_100g":280,"protein_per_100g":5,"carbs_per_100g":32,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"panna cotta","aliases":["panna cotta","italian cream dessert","vanilla panna cotta"],"calories_per_100g":220,"protein_per_100g":4,"carbs_per_100g":22,"fat_per_100g":14,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"gelato","aliases":["gelato","italian ice cream","creamy gelato"],"calories_per_100g":180,"protein_per_100g":3,"carbs_per_100g":22,"fat_per_100g":10,"fiber_per_100g":0,"serving_size":"1 scoop","serving_grams":60},
]

# Mexican
MEXICAN = [
    {"food_name":"chicken taco","aliases":["chicken taco","taco de pollo","chicken soft taco"],"calories_per_100g":180,"protein_per_100g":14,"carbs_per_100g":14,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 taco","serving_grams":100},
    {"food_name":"beef taco","aliases":["beef taco","taco de res","beef taco hard shell"],"calories_per_100g":190,"protein_per_100g":13,"carbs_per_100g":14,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 taco","serving_grams":100},
    {"food_name":"chicken burrito","aliases":["chicken burrito","burrito de pollo"],"calories_per_100g":250,"protein_per_100g":14,"carbs_per_100g":28,"fat_per_100g":10,"fiber_per_100g":3,"serving_size":"1 burrito","serving_grams":250},
    {"food_name":"beef burrito","aliases":["beef burrito","burrito de res"],"calories_per_100g":270,"protein_per_100g":15,"carbs_per_100g":28,"fat_per_100g":12,"fiber_per_100g":2.5,"serving_size":"1 burrito","serving_grams":250},
    {"food_name":"quesadilla","aliases":["quesadilla","cheese quesadilla","chicken quesadilla"],"calories_per_100g":280,"protein_per_100g":12,"carbs_per_100g":24,"fat_per_100g":16,"fiber_per_100g":2,"serving_size":"1 quesadilla","serving_grams":150},
    {"food_name":"nachos","aliases":["nachos","tortilla chips nachos","loaded nachos"],"calories_per_100g":280,"protein_per_100g":8,"carbs_per_100g":30,"fat_per_100g":15,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":200},
    {"food_name":"enchilada chicken","aliases":["chicken enchilada","enchilada de pollo"],"calories_per_100g":210,"protein_per_100g":14,"carbs_per_100g":18,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 enchilada","serving_grams":150},
    {"food_name":"tamale","aliases":["tamale","corn tamale","mexican tamale"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":2,"serving_size":"1 tamale","serving_grams":100},
    {"food_name":"mexican rice","aliases":["mexican rice","spanish rice","arroz mexicano"],"calories_per_100g":160,"protein_per_100g":3,"carbs_per_100g":30,"fat_per_100g":4,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"refried beans","aliases":["refried beans","frijoles refritos","mexican beans"],"calories_per_100g":120,"protein_per_100g":6,"carbs_per_100g":16,"fat_per_100g":4,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"elote","aliases":["elote","mexican street corn","corn on the cob mexican"],"calories_per_100g":150,"protein_per_100g":4,"carbs_per_100g":18,"fat_per_100g":8,"fiber_per_100g":2.5,"serving_size":"1 ear","serving_grams":150},
    {"food_name":"churros","aliases":["churros","mexican donut","fried dough"],"calories_per_100g":310,"protein_per_100g":3,"carbs_per_100g":38,"fat_per_100g":17,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"flan","aliases":["flan","mexican caramel custard","flan napolitano"],"calories_per_100g":210,"protein_per_100g":6,"carbs_per_100g":28,"fat_per_100g":9,"fiber_per_100g":0,"serving_size":"1 slice","serving_grams":100},
]

# Japanese
JAPANESE = [
    {"food_name":"sushi roll","aliases":["sushi roll","maki roll","california roll"],"calories_per_100g":180,"protein_per_100g":6,"carbs_per_100g":28,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 roll","serving_grams":50},
    {"food_name":"sashimi","aliases":["sashimi","raw fish","sashimi platter"],"calories_per_100g":120,"protein_per_100g":20,"carbs_per_100g":2,"fat_per_100g":3,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"tempura shrimp","aliases":["shrimp tempura","ebi tempura","japanese fried shrimp"],"calories_per_100g":200,"protein_per_100g":10,"carbs_per_100g":16,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"tempura vegetable","aliases":["vegetable tempura","yasai tempura","mixed tempura"],"calories_per_100g":160,"protein_per_100g":4,"carbs_per_100g":16,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"teriyaki chicken","aliases":["teriyaki chicken","chicken teriyaki","japanese chicken"],"calories_per_100g":180,"protein_per_100g":18,"carbs_per_100g":10,"fat_per_100g":8,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"teriyaki salmon","aliases":["teriyaki salmon","salmon teriyaki"],"calories_per_100g":200,"protein_per_100g":20,"carbs_per_100g":8,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"miso soup","aliases":["miso soup","japanese soup","miso shiru"],"calories_per_100g":25,"protein_per_100g":1.5,"carbs_per_100g":3,"fat_per_100g":0.8,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":200},
    {"food_name":"miso ramen","aliases":["miso ramen","ramen miso","japanese noodle soup"],"calories_per_100g":320,"protein_per_100g":14,"carbs_per_100g":38,"fat_per_100g":12,"fiber_per_100g":2,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"tonkotsu ramen","aliases":["tonkotsu ramen","pork broth ramen","rich ramen"],"calories_per_100g":350,"protein_per_100g":16,"carbs_per_100g":36,"fat_per_100g":15,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"yakitori chicken","aliases":["yakitori","chicken skewer","grilled chicken japanese"],"calories_per_100g":180,"protein_per_100g":18,"carbs_per_100g":4,"fat_per_100g":10,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":50},
    {"food_name":"chicken katsu","aliases":["chicken katsu","panko chicken","japanese fried chicken"],"calories_per_100g":260,"protein_per_100g":18,"carbs_per_100g":14,"fat_per_100g":15,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"gyoza","aliases":["gyoza","japanese dumplings","pan fried gyoza"],"calories_per_100g":160,"protein_per_100g":7,"carbs_per_100g":18,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 serving","serving_grams":80},
    {"food_name":"edamame","aliases":["edamame","soybeans in pods","japanese soybeans"],"calories_per_100g":120,"protein_per_100g":11,"carbs_per_100g":8,"fat_per_100g":5,"fiber_per_100g":5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"okonomiyaki","aliases":["okonomiyaki","japanese pancake","savory pancake"],"calories_per_100g":190,"protein_per_100g":6,"carbs_per_100g":22,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":150},
    {"food_name":"soba noodles","aliases":["soba noodles","buckwheat noodles","cold soba"],"calories_per_100g":120,"protein_per_100g":5,"carbs_per_100g":24,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"udon noodles","aliases":["udon noodles","thick wheat noodles","kitsune udon"],"calories_per_100g":130,"protein_per_100g":4,"carbs_per_100g":26,"fat_per_100g":0.5,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"onigiri","aliases":["onigiri","rice ball","japanese rice ball","omusubi"],"calories_per_100g":140,"protein_per_100g":3,"carbs_per_100g":28,"fat_per_100g":1,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":80},
]

# Korean
KOREAN = [
    {"food_name":"kimchi","aliases":["kimchi","fermented cabbage","baechu kimchi","korean kimchi"],"calories_per_100g":20,"protein_per_100g":1,"carbs_per_100g":3,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"bibimbap","aliases":["bibimbap","mixed rice bowl","korean rice bowl"],"calories_per_100g":210,"protein_per_100g":8,"carbs_per_100g":30,"fat_per_100g":7,"fiber_per_100g":2,"serving_size":"1 bowl","serving_grams":350},
    {"food_name":"bulgogi","aliases":["bulgogi","korean bbq beef","marinated beef"],"calories_per_100g":200,"protein_per_100g":20,"carbs_per_100g":6,"fat_per_100g":11,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"japchae","aliases":["japchae","glass noodles","stir fried glass noodles"],"calories_per_100g":180,"protein_per_100g":5,"carbs_per_100g":28,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kimchi jjigae","aliases":["kimchi jjigae","kimchi stew","kimchi soup"],"calories_per_100g":60,"protein_per_100g":4,"carbs_per_100g":5,"fat_per_100g":3,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":300},
    {"food_name":"kimbap","aliases":["kimbap","korean rice roll","seaweed rice roll"],"calories_per_100g":180,"protein_per_100g":5,"carbs_per_100g":30,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 roll","serving_grams":100},
    {"food_name":"korean fried chicken","aliases":["korean fried chicken","yangnyeom chicken","sweet spicy chicken"],"calories_per_100g":260,"protein_per_100g":18,"carbs_per_100g":12,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"samgyeopsal","aliases":["samgyeopsal","korean pork belly","grilled pork belly"],"calories_per_100g":280,"protein_per_100g":14,"carbs_per_100g":2,"fat_per_100g":24,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"tteokbokki","aliases":["tteokbokki","spicy rice cakes","korean rice cake"],"calories_per_100g":180,"protein_per_100g":3,"carbs_per_100g":36,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"naengmyeon","aliases":["naengmyeon","cold buckwheat noodles","mul naengmyeon"],"calories_per_100g":140,"protein_per_100g":4,"carbs_per_100g":28,"fat_per_100g":2,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":300},
]

# Thai
THAI = [
    {"food_name":"pad thai","aliases":["pad thai","thai fried noodles","stir fried noodles thai"],"calories_per_100g":220,"protein_per_100g":8,"carbs_per_100g":30,"fat_per_100g":8,"fiber_per_100g":2,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"green curry chicken","aliases":["green curry","thai green curry","gaeng keow wan"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":6,"fat_per_100g":13,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"red curry chicken","aliases":["red curry","thai red curry","gaeng phed"],"calories_per_100g":190,"protein_per_100g":12,"carbs_per_100g":6,"fat_per_100g":14,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"massaman curry","aliases":["massaman curry","thai massaman","massaman beef"],"calories_per_100g":220,"protein_per_100g":12,"carbs_per_100g":12,"fat_per_100g":14,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"tom yum goong","aliases":["tom yum goong","spicy shrimp soup","thai sour soup"],"calories_per_100g":60,"protein_per_100g":6,"carbs_per_100g":3,"fat_per_100g":3,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"tom kha gai","aliases":["tom kha gai","coconut chicken soup","thai coconut soup"],"calories_per_100g":120,"protein_per_100g":6,"carbs_per_100g":5,"fat_per_100g":9,"fiber_per_100g":0.5,"serving_size":"1 bowl","serving_grams":250},
    {"food_name":"thai papaya salad","aliases":["som tam","papaya salad","green papaya salad"],"calories_per_100g":40,"protein_per_100g":1,"carbs_per_100g":8,"fat_per_100g":0.5,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":150},
    {"food_name":"mango sticky rice","aliases":["mango sticky rice","khao niao mamuang","thai dessert"],"calories_per_100g":250,"protein_per_100g":3,"carbs_per_100g":48,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 serving","serving_grams":200},
    {"food_name":"thai fried rice","aliases":["thai fried rice","khao pad","pineapple fried rice"],"calories_per_100g":200,"protein_per_100g":7,"carbs_per_100g":28,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":250},
]

# Middle Eastern
MIDDLE_EASTERN = [
    {"food_name":"falafel","aliases":["falafel","chickpea fritters","felafel","middle eastern falafel"],"calories_per_100g":200,"protein_per_100g":8,"carbs_per_100g":18,"fat_per_100g":12,"fiber_per_100g":4,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"shawarma chicken","aliases":["chicken shawarma","arabic chicken wrap","middle eastern wrap"],"calories_per_100g":220,"protein_per_100g":16,"carbs_per_100g":20,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 wrap","serving_grams":250},
    {"food_name":"shawarma beef","aliases":["beef shawarma","lamb shawarma","meat shawarma"],"calories_per_100g":240,"protein_per_100g":18,"carbs_per_100g":18,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 wrap","serving_grams":250},
    {"food_name":"chicken kebab","aliases":["chicken kebab","seekh kebab","chicken tikka kebab"],"calories_per_100g":200,"protein_per_100g":20,"carbs_per_100g":4,"fat_per_100g":12,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":80},
    {"food_name":"lamb kebab","aliases":["lamb kebab","sheekh kebab","mutton kebab"],"calories_per_100g":230,"protein_per_100g":18,"carbs_per_100g":4,"fat_per_100g":16,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":80},
    {"food_name":"dolma","aliases":["dolma","stuffed grape leaves","rice stuffed vine leaves"],"calories_per_100g":80,"protein_per_100g":2,"carbs_per_100g":10,"fat_per_100g":3,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":30},
    {"food_name":"baklava","aliases":["baklava","middle eastern pastry","nut pastry"],"calories_per_100g":350,"protein_per_100g":5,"carbs_per_100g":30,"fat_per_100g":24,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"knafeh","aliases":["knafeh","kunafa","middle eastern cheese dessert"],"calories_per_100g":300,"protein_per_100g":6,"carbs_per_100g":35,"fat_per_100g":16,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"tabbouleh","aliases":["tabbouleh","bulgur parsley salad","middle eastern salad"],"calories_per_100g":60,"protein_per_100g":2,"carbs_per_100g":10,"fat_per_100g":1,"fiber_per_100g":2.5,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"fattoush","aliases":["fattoush","bread salad","arabic salad"],"calories_per_100g":80,"protein_per_100g":2,"carbs_per_100g":8,"fat_per_100g":4,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"baba ganoush","aliases":["baba ganoush","roasted eggplant dip","baba ghanouj"],"calories_per_100g":60,"protein_per_100g":1.5,"carbs_per_100g":5,"fat_per_100g":4,"fiber_per_100g":2.5,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"labneh","aliases":["labneh","strained yogurt","cream cheese middle eastern"],"calories_per_100g":120,"protein_per_100g":6,"carbs_per_100g":4,"fat_per_100g":10,"fiber_per_100g":0,"serving_size":"1 serving","serving_grams":100},
    {"food_name":"pita bread","aliases":["pita","pita bread","arabic bread","khubz"],"calories_per_100g":260,"protein_per_100g":7,"carbs_per_100g":52,"fat_per_100g":2,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"manakeesh","aliases":["manakeesh","zaatar manakeesh","lebanese pizza"],"calories_per_100g":240,"protein_per_100g":7,"carbs_per_100g":34,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":100},
]

# American / Continental
AMERICAN = [
    {"food_name":"cheeseburger","aliases":["cheeseburger","burger with cheese","beef cheeseburger"],"calories_per_100g":280,"protein_per_100g":16,"carbs_per_100g":26,"fat_per_100g":13,"fiber_per_100g":1,"serving_size":"1 burger","serving_grams":200},
    {"food_name":"chicken burger","aliases":["chicken burger","grilled chicken burger","crispy chicken burger"],"calories_per_100g":250,"protein_per_100g":15,"carbs_per_100g":26,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 burger","serving_grams":200},
    {"food_name":"club sandwich","aliases":["club sandwich","toasted sandwich","chicken club"],"calories_per_100g":280,"protein_per_100g":16,"carbs_per_100g":26,"fat_per_100g":12,"fiber_per_100g":1.5,"serving_size":"1 sandwich","serving_grams":200},
    {"food_name":"mac and cheese","aliases":["mac and cheese","macaroni cheese","macaroni and cheese"],"calories_per_100g":220,"protein_per_100g":8,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"mashed potatoes","aliases":["mashed potatoes","mash potato","butter mashed potatoes"],"calories_per_100g":120,"protein_per_100g":2,"carbs_per_100g":16,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"french fries","aliases":["french fries","fries","chips","hot chips"],"calories_per_100g":310,"protein_per_100g":3,"carbs_per_100g":38,"fat_per_100g":16,"fiber_per_100g":2,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"sweet potato fries","aliases":["sweet potato fries","sweet potato chips"],"calories_per_100g":200,"protein_per_100g":2,"carbs_per_100g":28,"fat_per_100g":10,"fiber_per_100g":3,"serving_size":"1 serving","serving_grams":150},
    {"food_name":"coleslaw","aliases":["coleslaw","cabbage salad","creamy coleslaw"],"calories_per_100g":80,"protein_per_100g":1,"carbs_per_100g":8,"fat_per_100g":5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"caesar salad","aliases":["caesar salad","chicken caesar","classic caesar"],"calories_per_100g":180,"protein_per_100g":12,"carbs_per_100g":8,"fat_per_100g":12,"fiber_per_100g":2.5,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"pancakes","aliases":["pancakes","american pancakes","buttermilk pancakes"],"calories_per_100g":210,"protein_per_100g":5,"carbs_per_100g":28,"fat_per_100g":9,"fiber_per_100g":1,"serving_size":"1 stack","serving_grams":150},
    {"food_name":"french toast","aliases":["french toast","eggy bread","spanish toast"],"calories_per_100g":220,"protein_per_100g":7,"carbs_per_100g":24,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 slice","serving_grams":70},
    {"food_name":"waffles","aliases":["waffles","belgian waffles","brioche waffle"],"calories_per_100g":260,"protein_per_100g":5,"carbs_per_100g":32,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 waffle","serving_grams":80},
    {"food_name":"doughnut","aliases":["doughnut","donut","glazed donut","sugar donut"],"calories_per_100g":320,"protein_per_100g":4,"carbs_per_100g":38,"fat_per_100g":17,"fiber_per_100g":0.5,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"brownie","aliases":["brownie","chocolate brownie","fudge brownie"],"calories_per_100g":380,"protein_per_100g":4,"carbs_per_100g":48,"fat_per_100g":20,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"cheesecake","aliases":["cheesecake","new york cheesecake","baked cheesecake"],"calories_per_100g":300,"protein_per_100g":6,"carbs_per_100g":26,"fat_per_100g":20,"fiber_per_100g":0.5,"serving_size":"1 slice","serving_grams":100},
    {"food_name":"apple pie","aliases":["apple pie","fruit pie","american apple pie"],"calories_per_100g":250,"protein_per_100g":2,"carbs_per_100g":36,"fat_per_100g":12,"fiber_per_100g":2,"serving_size":"1 slice","serving_grams":120},
    {"food_name":"bagel","aliases":["bagel","plain bagel","sesame bagel","everything bagel"],"calories_per_100g":260,"protein_per_100g":9,"carbs_per_100g":50,"fat_per_100g":1.5,"fiber_per_100g":2,"serving_size":"1 bagel","serving_grams":90},
    {"food_name":"croissant","aliases":["croissant","butter croissant","french croissant"],"calories_per_100g":310,"protein_per_100g":6,"carbs_per_100g":34,"fat_per_100g":17,"fiber_per_100g":1.5,"serving_size":"1 piece","serving_grams":60},
    {"food_name":"bbq ribs","aliases":["bbq ribs","barbecue ribs","pork ribs bbq"],"calories_per_100g":280,"protein_per_100g":18,"carbs_per_100g":12,"fat_per_100g":18,"fiber_per_100g":0.5,"serving_size":"1 serving","serving_grams":200},
    {"food_name":"buffalo wings","aliases":["buffalo wings","chicken wings","hot wings"],"calories_per_100g":240,"protein_per_100g":20,"carbs_per_100g":4,"fat_per_100g":16,"fiber_per_100g":0.3,"serving_size":"1 serving","serving_grams":150},
]

# Southeast Asian
SE_ASIAN = [
    {"food_name":"pho bo","aliases":["pho bo","beef pho","vietnamese noodle soup"],"calories_per_100g":120,"protein_per_100g":10,"carbs_per_100g":14,"fat_per_100g":3,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"pho ga","aliases":["pho ga","chicken pho","vietnamese chicken soup"],"calories_per_100g":110,"protein_per_100g":9,"carbs_per_100g":14,"fat_per_100g":2.5,"fiber_per_100g":1,"serving_size":"1 bowl","serving_grams":400},
    {"food_name":"banh mi","aliases":["banh mi","vietnamese sandwich","banh mi thit"],"calories_per_100g":240,"protein_per_100g":12,"carbs_per_100g":30,"fat_per_100g":9,"fiber_per_100g":1.5,"serving_size":"1 sandwich","serving_grams":200},
    {"food_name":"nasi goreng","aliases":["nasi goreng","indonesian fried rice","indonesian rice"],"calories_per_100g":240,"protein_per_100g":8,"carbs_per_100g":30,"fat_per_100g":10,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"mie goreng","aliases":["mie goreng","indonesian fried noodles","indonesian noodles"],"calories_per_100g":220,"protein_per_100g":7,"carbs_per_100g":28,"fat_per_100g":10,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"gado gado","aliases":["gado gado","indonesian salad","peanut sauce salad"],"calories_per_100g":130,"protein_per_100g":5,"carbs_per_100g":12,"fat_per_100g":7,"fiber_per_100g":3,"serving_size":"1 plate","serving_grams":250},
    {"food_name":"chicken satay","aliases":["satay chicken","chicken satay","ayam satay"],"calories_per_100g":200,"protein_per_100g":18,"carbs_per_100g":6,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 skewer","serving_grams":40},
    {"food_name":"rendang","aliases":["rendang","beef rendang","indonesian coconut beef"],"calories_per_100g":280,"protein_per_100g":18,"carbs_per_100g":6,"fat_per_100g":21,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"nasi lemak","aliases":["nasi lemak","malaysian coconut rice","fragrant rice"],"calories_per_100g":300,"protein_per_100g":6,"carbs_per_100g":30,"fat_per_100g":18,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"laksa","aliases":["laksa","spicy coconut noodle soup","malaysian laksa"],"calories_per_100g":180,"protein_per_100g":8,"carbs_per_100g":14,"fat_per_100g":11,"fiber_per_100g":1.5,"serving_size":"1 bowl","serving_grams":350},
]

# African
AFRICAN = [
    {"food_name":"jollof rice","aliases":["jollof rice","west african rice","nigerian jollof"],"calories_per_100g":200,"protein_per_100g":5,"carbs_per_100g":34,"fat_per_100g":6,"fiber_per_100g":1.5,"serving_size":"1 plate","serving_grams":300},
    {"food_name":"egusi soup","aliases":["egusi soup","melon seed soup","nigerian egusi"],"calories_per_100g":190,"protein_per_100g":10,"carbs_per_100g":8,"fat_per_100g":14,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"fufu","aliases":["fufu","cassava dough","african swallow","ugali"],"calories_per_100g":140,"protein_per_100g":0.5,"carbs_per_100g":34,"fat_per_100g":0.3,"fiber_per_100g":1,"serving_size":"1 serving","serving_grams":200},
    {"food_name":"jollof rice chicken","aliases":["jollof with chicken","chicken jollof"],"calories_per_100g":230,"protein_per_100g":12,"carbs_per_100g":32,"fat_per_100g":7,"fiber_per_100g":1,"serving_size":"1 plate","serving_grams":350},
    {"food_name":"puff puff","aliases":["puff puff","nigerian doughnut","sweet fried bread"],"calories_per_100g":280,"protein_per_100g":4,"carbs_per_100g":40,"fat_per_100g":12,"fiber_per_100g":1,"serving_size":"1 piece","serving_grams":40},
    {"food_name":"suya beef","aliases":["suya","beef suya","nigerian grilled beef","spiced skewer"],"calories_per_100g":210,"protein_per_100g":20,"carbs_per_100g":5,"fat_per_100g":13,"fiber_per_100g":0.5,"serving_size":"1 skewer","serving_grams":60},
    {"food_name":"doro wat","aliases":["doro wat","ethiopian chicken stew","spicy chicken stew"],"calories_per_100g":160,"protein_per_100g":14,"carbs_per_100g":6,"fat_per_100g":9,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"injera","aliases":["injera","ethiopian flatbread","sourdough flatbread"],"calories_per_100g":120,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 piece","serving_grams":100},
]

# Seafood extended
SEAFOOD = [
    {"food_name":"bangda","aliases":["bangda","mackerel indian","indian mackerel"],"calories_per_100g":160,"protein_per_100g":19,"carbs_per_100g":0,"fat_per_100g":9,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"surmai","aliases":["surmai","kingfish","king mackerel","seer fish"],"calories_per_100g":170,"protein_per_100g":20,"carbs_per_100g":0,"fat_per_100g":10,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"rawas","aliases":["rawas","indian salmon","silver pomfret"],"calories_per_100g":150,"protein_per_100g":18,"carbs_per_100g":0,"fat_per_100g":8,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"pomfret black","aliases":["black pomfret","halwa fish","pomfret"],"calories_per_100g":130,"protein_per_100g":17,"carbs_per_100g":0,"fat_per_100g":7,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"pomfret silver","aliases":["silver pomfret","white pomfret","paplet"],"calories_per_100g":120,"protein_per_100g":16,"carbs_per_100g":0,"fat_per_100g":6,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"basa fish","aliases":["basa fish","swai fish","pangasius"],"calories_per_100g":90,"protein_per_100g":15,"carbs_per_100g":0,"fat_per_100g":3,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"hilsa","aliases":["hilsa","ilish fish","river shad"],"calories_per_100g":220,"protein_per_100g":18,"carbs_per_100g":0,"fat_per_100g":16,"fiber_per_100g":0,"serving_size":"1 piece","serving_grams":100},
    {"food_name":"crab meat","aliases":["crab meat","kekda","nandu","blue crab"],"calories_per_100g":85,"protein_per_100g":16,"carbs_per_100g":0,"fat_per_100g":1.5,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"squid rings","aliases":["squid rings","calamari","kolambi","squid"],"calories_per_100g":75,"protein_per_100g":14,"carbs_per_100g":3,"fat_per_100g":1,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":100},
]

# Meat extended
MEATS = [
    {"food_name":"chicken liver","aliases":["chicken liver","kaleji","chicken giblets"],"calories_per_100g":120,"protein_per_100g":17,"carbs_per_100g":1,"fat_per_100g":5,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"mutton chops","aliases":["mutton chops","lamb chops","goat chops"],"calories_per_100g":260,"protein_per_100g":18,"carbs_per_100g":0,"fat_per_100g":20,"fiber_per_100g":0,"serving_size":"1 chop","serving_grams":80},
    {"food_name":"sausage","aliases":["sausage","pork sausage","beef sausage","breakfast sausage"],"calories_per_100g":300,"protein_per_100g":12,"carbs_per_100g":3,"fat_per_100g":27,"fiber_per_100g":0,"serving_size":"1 link","serving_grams":50},
    {"food_name":"bacon strips","aliases":["bacon","bacon strips","crispy bacon","bacon rashers"],"calories_per_100g":500,"protein_per_100g":30,"carbs_per_100g":2,"fat_per_100g":42,"fiber_per_100g":0,"serving_size":"1 slice","serving_grams":10},
    {"food_name":"ham slice","aliases":["ham slice","deli ham","cooked ham"],"calories_per_100g":120,"protein_per_100g":16,"carbs_per_100g":2,"fat_per_100g":5,"fiber_per_100g":0,"serving_size":"1 slice","serving_grams":30},
    {"food_name":"chorizo","aliases":["chorizo","spanish sausage","mexican chorizo"],"calories_per_100g":340,"protein_per_100g":18,"carbs_per_100g":3,"fat_per_100g":28,"fiber_per_100g":0,"serving_size":"1 link","serving_grams":60},
    {"food_name":"prosciutto","aliases":["prosciutto","italian ham","parma ham"],"calories_per_100g":220,"protein_per_100g":22,"carbs_per_100g":1,"fat_per_100g":14,"fiber_per_100g":0,"serving_size":"1 slice","serving_grams":15},
]

# Dairy extended
DAIRY = [
    {"food_name":"soy milk","aliases":["soy milk","soya milk","soy beverage"],"calories_per_100g":45,"protein_per_100g":3,"carbs_per_100g":4,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"almond milk","aliases":["almond milk","nut milk","almond beverage"],"calories_per_100g":25,"protein_per_100g":0.5,"carbs_per_100g":3,"fat_per_100g":1.5,"fiber_per_100g":0.5,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"coconut milk","aliases":["coconut milk","nariyal doodh","coconut cream milk"],"calories_per_100g":180,"protein_per_100g":2,"carbs_per_100g":3,"fat_per_100g":18,"fiber_per_100g":0.5,"serving_size":"1 cup","serving_grams":240},
    {"food_name":"oat milk","aliases":["oat milk","oat beverage","plant milk oat"],"calories_per_100g":45,"protein_per_100g":1,"carbs_per_100g":6,"fat_per_100g":1,"fiber_per_100g":0.5,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"mango lassi","aliases":["mango lassi","mango yogurt drink"],"calories_per_100g":100,"protein_per_100g":2,"carbs_per_100g":16,"fat_per_100g":2.5,"fiber_per_100g":0.3,"serving_size":"1 glass","serving_grams":200},
    {"food_name":"ricotta cheese","aliases":["ricotta","italian whey cheese"],"calories_per_100g":150,"protein_per_100g":10,"carbs_per_100g":5,"fat_per_100g":10,"fiber_per_100g":0,"serving_size":"1 cup","serving_grams":100},
]

# Fruits & veg extended
PRODUCE = [
    {"food_name":"soursop","aliases":["soursop","graviola","mullatha"],"calories_per_100g":66,"protein_per_100g":1,"carbs_per_100g":16,"fat_per_100g":0.3,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"mangosteen","aliases":["mangosteen","queen of fruits","mangustan"],"calories_per_100g":73,"protein_per_100g":0.7,"carbs_per_100g":18,"fat_per_100g":0.6,"fiber_per_100g":2,"serving_size":"1 fruit","serving_grams":100},
    {"food_name":"durian","aliases":["durian","king of fruits","durian fruit"],"calories_per_100g":147,"protein_per_100g":1.5,"carbs_per_100g":27,"fat_per_100g":5,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"tapioca","aliases":["tapioca","cassava","sabudana","kuchi kizhangu"],"calories_per_100g":160,"protein_per_100g":0.5,"carbs_per_100g":38,"fat_per_100g":0.2,"fiber_per_100g":1,"serving_size":"1 cup","serving_grams":150},
    {"food_name":"drumstick","aliases":["drumstick","sahjan","moringa","moringa pods"],"calories_per_100g":35,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":0.5,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"fenugreek leaves","aliases":["fenugreek leaves","methi","methi saag"],"calories_per_100g":30,"protein_per_100g":3,"carbs_per_100g":4,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"amaranth leaves","aliases":["amaranth leaves","chauraiya","tanduliya","red spinach"],"calories_per_100g":25,"protein_per_100g":2,"carbs_per_100g":3,"fat_per_100g":0.3,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"ivy gourd","aliases":["ivy gourd","tindora","kundru","dondakaya"],"calories_per_100g":20,"protein_per_100g":0.8,"carbs_per_100g":3,"fat_per_100g":0.2,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"cluster beans","aliases":["cluster beans","gawar","guar phali"],"calories_per_100g":30,"protein_per_100g":2,"carbs_per_100g":5,"fat_per_100g":0.3,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":100},
    {"food_name":"lotus stem","aliases":["lotus stem","kamal kakdi","bhein","lotus root"],"calories_per_100g":60,"protein_per_100g":1.5,"carbs_per_100g":12,"fat_per_100g":0.2,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":100},
]

# Grains extended
GRAINS = [
    {"food_name":"bulgur wheat","aliases":["bulgur","cracked wheat","dalia","burghul"],"calories_per_100g":80,"protein_per_100g":3,"carbs_per_100g":18,"fat_per_100g":0.5,"fiber_per_100g":4,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"foxtail millet","aliases":["foxtail millet","kangni","thinai","navane"],"calories_per_100g":120,"protein_per_100g":4,"carbs_per_100g":24,"fat_per_100g":1,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"kodo millet","aliases":["kodo millet","kodra","varagu","kodumai"],"calories_per_100g":110,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":1,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"barnyard millet","aliases":["barnyard millet","sanwa","bhagar","kuthiravali"],"calories_per_100g":110,"protein_per_100g":3,"carbs_per_100g":23,"fat_per_100g":1,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"little millet","aliases":["little millet","samai","kutki","saama"],"calories_per_100g":110,"protein_per_100g":3,"carbs_per_100g":23,"fat_per_100g":1,"fiber_per_100g":3,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"black rice","aliases":["black rice","forbidden rice","chak hao","black sticky"],"calories_per_100g":110,"protein_per_100g":3,"carbs_per_100g":24,"fat_per_100g":0.8,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"red rice","aliases":["red rice","kerala red rice","matta rice","parboiled red"],"calories_per_100g":120,"protein_per_100g":3,"carbs_per_100g":26,"fat_per_100g":0.5,"fiber_per_100g":1.5,"serving_size":"1 cup","serving_grams":200},
    {"food_name":"wild rice","aliases":["wild rice","canoe grass","manoomin"],"calories_per_100g":100,"protein_per_100g":4,"carbs_per_100g":20,"fat_per_100g":0.5,"fiber_per_100g":2,"serving_size":"1 cup","serving_grams":200},
]

all_groups = [
    NORTH_INDIAN, SOUTH_INDIAN, WEST_INDIAN, EAST_INDIAN, NORTHEAST_INDIAN,
    STREET_FOOD, BIRYANI, INDIAN_SWEETS,
    CHINESE, ITALIAN, MEXICAN, JAPANESE, KOREAN, THAI, MIDDLE_EASTERN,
    AMERICAN, SE_ASIAN, AFRICAN, SEAFOOD, MEATS, DAIRY, PRODUCE, GRAINS
]

for group in all_groups:
    NEW.extend(add(group))

# Merge
combined = existing + NEW
with open('D:\\FitnessApp\\assets\\food_database.json', 'w', encoding='utf-8') as f:
    json.dump(combined, f, indent=2, ensure_ascii=False)

print(f"Original: {len(existing)} items")
print(f"Added: {len(NEW)} new items")
print(f"Total: {len(combined)} items")
