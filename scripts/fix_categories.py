import json, codecs

path = r'D:\FitnessApp\assets\restaurant_food_database.json'
with codecs.open(path, 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

fixes = {'MainCourse': 'Main Course', 'IceCream': 'Ice Cream'}
changed = 0
for brand in data:
    for item in brand.get('items', []):
        old = item.get('cat', '')
        if old in fixes:
            item['cat'] = fixes[old]
            changed += 1
            print(f'  {brand["brand"]}: "{old}" → "{fixes[old]}" for "{item.get("name")}"')

with codecs.open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'\nTotal fixes: {changed}')
