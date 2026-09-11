import requests
from bs4 import BeautifulSoup
import json
import time

def scrape_cards():
    url = "http://nivelarena.co.kr/skin/board/card_list_new/get_more_list.php"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://nivelarena.co.kr/bbs/board.php?bo_table=cardlists'
    }
    
    all_cards = []
    page = 1
    
    print("Demarrage du scraping...")
    
    while page <= 50:
        print(f"Page {page}...")
        
        data = {
            'bo_table': 'cardlists',
            'sca': '',
            'sop': 'and',
            'wr_1': '',
            'wr_2': '',
            'wr_3': '',
            'wr_5': '',
            'wr_8': '',
            'wr_10': '',
            'wk': 'card',
            'sfl': 'wr_subject||wr_content||ca_name||wr_1||wr_2||wr_3||wr_4||wr_5||wr_6||wr_7||wr_8||wr_11',
            'stx': '',
            'page': str(page)
        }
        
        try:
            response = requests.post(url, data=data, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"Erreur HTTP {response.status_code}")
                break
            
            html = response.text
            
            if '225x315' not in html:
                print("Plus de cartes trouvees")
                break
            
            soup = BeautifulSoup(html, 'html.parser')
            images = soup.find_all('img', src=lambda x: x and '225x315' in x)
            
            if not images:
                print("Aucune image trouvee")
                break
            
            print(f"  -> {len(images)} images trouvees")
            
            for img in images:
                img_url = img.get('src', '')
                if not img_url:
                    continue
                
                if not img_url.startswith('http'):
                    img_url = 'http://nivelarena.co.kr' + img_url
                
                # Essayer de trouver le nom
                name = "Carte inconnue"
                parent = img.parent
                for _ in range(5):
                    if parent:
                        link = parent.find('a')
                        if link and link.text.strip():
                            name = link.text.strip()
                            break
                        title = parent.find(['h3', 'h4', 'h5', 'div', 'span'])
                        if title and title.text.strip() and len(title.text.strip()) > 2:
                            name = title.text.strip()
                            break
                        parent = parent.parent
                
                # Extraire un ID unique
                filename = img_url.split('/')[-1]
                card_id = filename.split('_225x315')[0] if '_225x315' in filename else f"card_{len(all_cards)+1}"
                
                all_cards.append({
                    "id": card_id,
                    "name": name,
                    "type": "Unit",
                    "color": "Red",
                    "level": 1,
                    "power": 1000,
                    "text": "",
                    "image": img_url
                })
        
        except Exception as e:
            print(f"Erreur: {e}")
            break
        
        time.sleep(1)
        page += 1
    
    # Sauvegarder
    with open('cards.json', 'w', encoding='utf-8') as f:
        json.dump(all_cards, f, ensure_ascii=False, indent=2)
    
    print(f"\nTermine! {len(all_cards)} cartes sauvegardees dans cards.json")
    
    if all_cards:
        print("\nApercu des 5 premieres cartes:")
        for card in all_cards[:5]:
            print(f"  - {card['name']}: {card['image']}")

if __name__ == "__main__":
    scrape_cards()