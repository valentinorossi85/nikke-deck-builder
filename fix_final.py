import json
import re

with open('/workspace/cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

def fix_effect(effect):
    if not effect:
        return effect
    
    # Remove double periods
    effect = re.sub(r'\.\.', '.', effect)
    
    # Fix "Unit - Berserker Until" -> "Unit - Berserker. Until"
    effect = re.sub(r'Unit - Berserker Until', 'Unit - Berserker. Until', effect)
    
    # Fix other similar patterns
    effect = re.sub(r'Unit - (\w+) Until', r'Unit - \1. Until', effect)
    
    return effect

count = 0
for i, card in enumerate(cards):
    if 'effect' in card:
        original = card['effect']
        fixed = fix_effect(original)
        if original != fixed:
            cards[i]['effect'] = fixed
            count += 1
            print(f"Fixed card {i}:")
            print(f"  Before: {original}")
            print(f"  After:  {fixed}")
            print()

with open('/workspace/cards.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, ensure_ascii=False, indent=4)

print(f"\nTotal additional fixes: {count}")
