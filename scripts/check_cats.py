import json, codecs
with codecs.open(r'D:\FitnessApp\assets\restaurant_food_database.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

cats = {}
brand_cats = {}
for b in data:
    for it in b['items']:
        cat = it.get('cat', '')
        cats[cat] = cats.get(cat, 0) + 1
        brand_cats.setdefault(b['brand'], set()).add(cat)

print('All categories:')
for c, n in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  "{c}": {n}')

print()
print('Brands with categories that need normalization:')
for b, bc in sorted(brand_cats.items()):
    for cat in sorted(bc):
        if 'MainCourse' in cat or ' ' not in cat:
            print(f'  {b}: "{cat}"')
