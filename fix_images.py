import json
import os

# Configuration
JSON_FILE = 'cards.json'
IMAGE_FOLDER = 'nikke_card_images'

def fix_image_links():
    # Vérifier si le dossier existe
    if not os.path.exists(IMAGE_FOLDER):
        print(f"❌ Erreur: Le dossier '{IMAGE_FOLDER}' n'existe pas.")
        return

    # Lister toutes les images disponibles
    available_images = os.listdir(IMAGE_FOLDER)
    print(f"📂 {len(available_images)} images trouvées dans le dossier local.")

    # Charger le JSON
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            cards = json.load(f)
        print(f"📄 {len(cards)} cartes chargées depuis {JSON_FILE}.")
    except FileNotFoundError:
        print(f"❌ Erreur: Le fichier '{JSON_FILE}' est introuvable.")
        return

    updated_count = 0
    missing_count = 0

    for card in cards:
        card_id = card.get('id', '')
        if not card_id:
            continue

        # Chercher l'image correspondante
        matched_image = None
        for img_name in available_images:
            if img_name.startswith(card_id):
                matched_image = img_name
                break
        
        # Si trouvé, on met à jour le lien
        if matched_image:
            old_link = card.get('image', '')
            new_link = f"{IMAGE_FOLDER}/{matched_image}"
            
            if old_link != new_link:
                card['image'] = new_link
                updated_count += 1
        else:
            missing_count += 1

    # Sauvegarder le fichier mis à jour
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)

    print(f"✅ Terminé !")
    print(f"   - Images mises à jour : {updated_count}")
    print(f"   - Cartes sans image locale trouvée : {missing_count}")
    print(f"   - Fichier '{JSON_FILE}' sauvegardé.")

if __name__ == "__main__":
    fix_image_links()