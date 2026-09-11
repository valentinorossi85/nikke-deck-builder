import requests
from bs4 import BeautifulSoup
import json
import time
import re

URL = "http://nivelarena.co.kr/skin/board/card_list_new/get_more_list.php"
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'http://nivelarena.co.kr/bbs/board.php?bo_table=cardlists'
}

def get_page(page_num):
    """Récupère le HTML d'une page"""
    data = {
        'bo_table': 'cardlists',
        'sca': '',
        'sop': 'and',
        'wr_1': '', 'wr_2': '', 'wr_3': '', 'wr_5': '', 'wr_8': '', 'wr_10': '',
        'wk': 'card',
        'sfl': 'wr_subject||wr_content||ca_name||wr_1||wr_2||wr_3||wr_4||wr_5||wr_6||wr_7||wr_8||wr_11',
        'stx': '',
        'page': str(page_num)
    }
    response = requests.post(URL, data=data, headers=HEADERS)
    return response.text

def parse_cards(html):
    """Extrait les informations des cartes depuis le HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    cards = []
    
    # Trouve tous les éléments de carte (le site utilise une structure spécifique)
    card_elements = soup.find_all('div', class_=re.compile('list-item|item|card'))
    
    if not card_elements:
        # Fallback: cherche les images et essaie de trouver les infos autour
        images = soup.find_all('img', src=re.compile('225x315'))
        for idx, img in enumerate(images):
            img_url = img.get('src', '')
            if not img_url.startswith('http'):
                img_url = 'http://nivelarena.co.kr' + img_url
            
            # Essaie de trouver le nom dans l'alt ou le titre
            name = img.get('alt', f'Carte {idx+1}')
            if not name or name == '':
                name = f'Carte {idx+1}'
            
            cards.append({
                "id": f"CARD_{len(cards)+1:04d}",
                "name": name,
                "type": "Unit",
                "color": "Red",
                "level": 1,
                "power": 1000,
                "text": "",
                "image": img_url
            })
    else:
        for card_el in card_elements:
            # Extraire l'image
            img = card_el.find('img', src=re.compile('225x315'))
            img_url = img.get('src', '') if img else ''
            if img_url and not img_url.startswith('http'):
                img_url = 'http://nivelarena.co.kr' + img_url
            
            # Extraire le nom (souvent dans un h3, h4, ou div avec class title/subject)
            name_el = card_el.find(['h3', 'h4', 'div', 'span'], class_=re.compile('title|subject|name'))
            name = name_el.get_text(strip=True) if name_el else 'Carte inconnue'
            
            # Extraire la couleur/type (souvent dans des spans ou divs)
            color_el = card_el.find(['span', 'div'], class_=re.compile('color|attribute|type'))
            color = color_el.get_text(strip=True) if color_el else 'Red'
            
            # Mapper les couleurs coréennes vers anglais/français
            color_map = {
                '빨강': 'Red', 'red': 'Red', 'Red': 'Red',
                '파랑': 'Blue', 'blue': 'Blue', 'Blue': 'Blue',
                '초록': 'Green', 'green': 'Green', 'Green': 'Green',
                '노랑': 'Yellow', 'yellow': 'Yellow', 'Yellow': 'Yellow',
                '보라': 'Purple', 'purple': 'Purple', 'Purple': 'Purple'
            }
            color = color_map.get(color, 'Red')
            
            # Extraire le niveau
            level_el = card_el.find(['span', 'div'], class_=re.compile('level|lvl'))
            level = int(level_el.get_text(strip=True)) if level_el else 1
            
            # Extraire la puissance
            power_el = card_el.find(['span', 'div'], class_=re.compile('power|atk'))
            power = int(power_el.get_text(strip=True).replace(',', '')) if power_el else 1000
            
            # Extraire le texte d'effet
            text_el = card_el.find(['div', 'p'], class_=re.compile('effect|text|description'))
            text = text_el.get_text(strip=True) if text_el else ''
            
            cards.append({
                "id": f"CARD_{len(cards)+1:04d}",
                "name": name,
                "type": "Unit",
                "color": color,
                "level": level,
                "power": power,
                "text": text,
                "image": img_url
            })
    
    return cards

def main():
    print(" Début du scraping des cartes Nivel Arena...")
    all_cards = []
    
    for page in range(1, 50):  # Le site a environ 30-40 pages
        print(f"📄 Page {page}...")
        html = get_page(page)
        
        if not html or '225x315' not in html:
            print("✅ Fin des pages atteinte.")
            break
        
        cards = parse_cards(html)
        if cards:
            all_cards.extend(cards)
            print(f"   → {len(cards)} cartes trouvées (Total: {len(all_cards)})")
        else:
            print("   → Aucune carte trouvée sur cette page")
        
        time.sleep(0.5)  # Pause pour ne pas surcharger le serveur
    
    # Sauvegarder
    with open('cards.json', 'w', encoding='utf-8') as f:
        json.dump(all_cards, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 Succès ! {len(all_cards)} cartes sauvegardées dans 'cards.json'")
    print("💡 N'oublie pas de rafraîchir la page (Ctrl+F5) dans ton navigateur !")

if __name__ == "__main__":
    main()