import json
import re

with open('/workspace/cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

def fix_effect(effect):
    if not effect:
        return effect
    
    # Fix pattern with brackets「」
    pattern = r'Until the end of this turn「Encounter unit (\d+) cost card 1 discard it\. Then unit」(\+\d+ power)'
    match = re.search(pattern, effect)
    if match:
        cost = match.group(1)
        power = match.group(2)
        replacement = f'Until the end of this turn, when this unit encounters another unit, you may discard a {cost}-cost card. If you do, this unit gets {power}.'
        effect = re.sub(pattern, replacement, effect)
    
    # Alternative pattern without proper spacing
    pattern2 = r'Until the end of this turn 「 Encounter unit (\d+) cost card 1 discard it\. Then unit 」 (\+\d+ power)'
    match2 = re.search(pattern2, effect)
    if match2:
        cost = match2.group(1)
        power = match2.group(2)
        replacement = f'Until the end of this turn, when this unit encounters another unit, you may discard a {cost}-cost card. If you do, this unit gets {power}.'
        effect = re.sub(pattern2, replacement, effect)
    
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

print(f"\nTotal fixes: {count}")
