import json

# 1. Charger et corriger le fichier cards.json existant
with open('cards.json', 'r', encoding='utf-8') as f:
    old_cards = json.load(f)

# Corriger les espaces dans les clés
corrected_cards = []
for card in old_cards:
    corrected_card = {
        'id': card.get('id ', '').strip(),
        'name': card.get('name ', '').strip(),
        'type': card.get('type ', 'Unit').strip(),
        'color': card.get('color ', 'Red').strip(),
        'level': card.get('level ', 1),
        'power': card.get('power ', 1000),
        'text': card.get('text ', '').strip(),
        'image': card.get('image ', '').strip()
    }
    corrected_cards.append(corrected_card)

print(f"✅ {len(corrected_cards)} cartes corrigées depuis l'ancien fichier")

# 2. Ajouter les nouvelles cartes depuis cards.txt
with open('cards.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_cards = []
for line in lines:
    line = line.strip()
    if line.startswith('http://nivelarena.co.kr/data/file/cardlists/') and '225x315.jpg' in line:
        # Éviter les doublons avec les cartes existantes
        if not any(card['image'] == line for card in corrected_cards):
            new_cards.append({
                'id': f"CARD_{len(corrected_cards) + len(new_cards) + 1:04d}",
                'name': f"Carte {len(corrected_cards) + len(new_cards) + 1}",
                'type': 'Unit',
                'color': 'Red',
                'level': 1,
                'power': 1000,
                'text': '',
                'image': line
            })

print(f"✅ {len(new_cards)} nouvelles cartes ajoutées")

# 3. Sauvegarder le fichier final
all_cards = corrected_cards + new_cards

with open('cards.json', 'w', encoding='utf-8') as f:
    json.dump(all_cards, f, ensure_ascii=False, indent=2)

print(f"\n🎉 Total: {len(all_cards)} cartes dans cards.json")
print("💡 Les 5 premières cartes ont les vrais noms (Rapi, Anis, etc.)")
print("💡 Les autres ont des noms génériques (Carte 6, Carte 7, etc.)")