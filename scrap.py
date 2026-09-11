import json
import re
from bs4 import BeautifulSoup

def parse_cards_html():
    """Parse le HTML brut pour extraire les informations des cartes"""
    
    # Lire le fichier HTML
    with open('page1_raw.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    cards = []
    card_number = 1
    
    # Trouver tous les éléments li avec la classe gall_li
    card_elements = soup.find_all('li', class_='gall_li')
    
    print(f"Nombre d'éléments trouvés: {len(card_elements)}")
    
    for card_el in card_elements:
        try:
            # Extraire l'attribut data-info
            data_info = card_el.get('data-info', '')
            
            # Extraire l'URL de l'image
            img_tag = card_el.find('img')
            if not img_tag:
                continue
                
            img_src = img_tag.get('src', '')
            if not img_src or '225x315' not in img_src:
                continue
            
            # Extraire le numéro de carte depuis data-info (après ♬)
            card_id_num = ""
            if '♬' in data_info:
                card_id_num = data_info.split('♬')[-1].strip()
            
            # Créer un ID unique basé sur le numéro ou la position
            if card_id_num:
                card_id = f"CARD_{card_id_num}"
            else:
                card_id = f"CARD_{card_number:04d}"
            
            # Extraire le nom de fichier pour l'ID
            filename = ""
            if '.' in data_info:
                filename = data_info.split('.')[0]
            
            card = {
                "id": card_id,
                "name": f"Carte {card_number}",  # Nom par défaut
                "type": "Unit",
                "color": "Red",
                "level": 1,
                "power": 1000,
                "text": "",
                "image": img_src,
                "data_info": data_info,
                "filename": filename
            }
            
            cards.append(card)
            card_number += 1
            
        except Exception as e:
            print(f"Erreur sur un élément: {e}")
            continue
    
    # Sauvegarder le JSON
    with open('cards.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ {len(cards)} cartes sauvegardées dans cards.json")
    
    # Afficher les 5 premières cartes
    print("\nAperçu des 5 premières cartes:")
    for i, card in enumerate(cards[:5], 1):
        print(f"{i}. {card['id']} - {card['name']}")
        print(f"   Image: {card['image']}")
        print(f"   Data-info: {card.get('data_info', 'N/A')}")
        print()

if __name__ == "__main__":
    parse_cards_html()