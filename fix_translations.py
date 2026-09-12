import json
import re

with open('/workspace/cards.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

def fix_effect(effect):
    if not effect:
        return effect
    
    # Fix "deck card . 5 card . unit . unit . Berserker unit 1" pattern
    effect = re.sub(r'deck card \. 5 card \. Unit \. Unit \. Berserker unit 1', 
                    'Unit - Berserker', effect)
    
    # Fix "Until the end of this turn「Encounter unit X cost card 1 discard it. Then unit」power+XXXX"
    pattern = r'Until the end of this turn「Encounter unit (\d+) cost card 1 discard it\. Then unit」power\+(\d+)'
    match = re.search(pattern, effect)
    if match:
        cost = match.group(1)
        power = match.group(2)
        replacement = f'Until the end of this turn, when this unit encounters another unit, you may discard a {cost}-cost card. If you do, this unit gets +{power} power.'
        effect = re.sub(pattern, replacement, effect)
    
    # Clean up redundant "Unit . Unit ." patterns
    effect = re.sub(r'Unit \. Unit \. ', 'Unit - ', effect)
    effect = re.sub(r'Unit \. ', '', effect)
    
    # Fix spacing issues
    effect = re.sub(r'(\d)cost', r'\1 cost', effect)
    effect = re.sub(r'card(\d+)', r'card \1', effect)
    effect = re.sub(r'discardIf', r'discard. If', effect)
    effect = re.sub(r'power-(\d+)', r'-\1 power', effect)
    effect = re.sub(r'power\+(\d+)', r'+\1 power', effect)
    
    # Fix "choose any number of discard it"
    effect = re.sub(r'choose any number of ([^ ]+) discard it', 
                    r'choose any number of \1s and discard them', effect)
    
    return effect

for i, card in enumerate(cards):
    if 'effect' in card:
        original = card['effect']
        fixed = fix_effect(original)
        if original != fixed:
            cards[i]['effect'] = fixed
            print(f"Fixed card {i}: {original[:50]}... -> {fixed[:50]}...")

with open('/workspace/cards.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, ensure_ascii=False, indent=4)

print("\nTranslation fixes complete!")
