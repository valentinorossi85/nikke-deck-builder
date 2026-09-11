import json

# Lire le fichier cards.txt
with open('cards.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

cards = []
card_number = 1

for line in lines:
    line = line.strip()
    # Ne garder que les lignes qui sont des URLs d'images de cartes
    if line.startswith('http://nivelarena.co.kr/data/file/cardlists/') and '225x315.jpg' in line:
        # Extraire un ID unique depuis l'URL
        card_id = f"CARD_{card_number:04d}"
        
        cards.append({
            "id": card_id,
            "name": f"Carte {card_number}",
            "type": "Unit",
            "color": "Red",
            "level": 1,
            "power": 1000,
            "text": "",
            "image": line
        })
        card_number += 1

# Sauvegarder en JSON propre
with open('cards.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)

print(f"Succes ! {len(cards)} cartes generees dans cards.json")