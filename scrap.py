import requests
from bs4 import BeautifulSoup
import json
import time
import re

BASE_URL = "http://nivelarena.jp"
LIST_URL = f"{BASE_URL}/skin/board/card_list_new/get_more_list.php"
INFO_URL = f"{BASE_URL}/skin/board/card_list_new/get_info.php"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Referer': f'{BASE_URL}/bbs/board.php?bo_table=cardlists',
}

def get_all_card_ids():
    print("Étape 1: Récupération de la liste des cartes...")
    all_ids = []
    page = 1
    
    while True:
        data = {
            'bo_table': 'cardlists',
            'page': str(page)
        }
        
        try:
            response = requests.post(LIST_URL, data=data, headers=HEADERS, timeout=10)
            if response.status_code != 200:
                break
            
            html = response.text
            if '225x315' not in html:
                break
            
            soup = BeautifulSoup(html, 'html.parser')
            
            for li in soup.find_all('li', class_='gall_li'):
                data_info = li.get('data-info', '')
                img = li.find('img')
                
                if data_info and img and '♬' in data_info:
                    card_id = data_info.split('♬')[-1].strip()
                    img_url = img.get('src', '')
                    if not img_url.startswith('http'):
                        img_url = BASE_URL + img_url
                    
                    all_ids.append({
                        'id': card_id,
                        'image': img_url
                    })
            
            print(f"  Page {page}: {len(all_ids)} cartes trouvées")
            page += 1
            time.sleep(0.5)
            
        except Exception as e:
            print(f"Erreur: {e}")
            break
    
    return all_ids

def get_card_details(wr_id):
    try:
        data = {
            'bo_table': 'cardlists',
            'wr_id': str(wr_id)
        }
        
        response = requests.post(INFO_URL, data=data, headers=HEADERS, timeout=5)
        
        if response.status_code == 200:
            return parse_card_html(response.text)
        
        return None
    except Exception as e:
        return None

def parse_card_html(html):
    """Parse le HTML pour extraire les infos de la carte"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # Extraire tout le texte et le diviser en lignes
    text = soup.get_text(separator='\n')
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    card = {
        'name': '',
        'card_id': '',
        'type': '',
        'color': '',
        'cost': 0,
        'power': 0,
        'hit': 0,
        'rarity': '',
        'affiliation': '',
        'keyword': '',
        'effect': '',
        'product': ''
    }
    
    if not lines:
        return None
    
    # Première ligne = nom de la carte
    card['name'] = lines[0]
    
    # Parser les autres lignes
    i = 1
    while i < len(lines):
        line = lines[i]
        
        # Ligne avec ID / Type / Couleur (contient des slashs)
        if '/' in line and any(x in line for x in ['ユニット', 'スキル', 'リーダー', 'アイテム']):
            parts = [p.strip() for p in line.split('/')]
            if len(parts) >= 3:
                card['card_id'] = parts[0]
                card['type'] = parts[1]
                card['color'] = parts[2]
        
        # Coût
        elif 'コスト' in line:
            match = re.search(r'(\d+)', line)
            if match:
                card['cost'] = int(match.group(1))
        
        # Power
        elif 'パワー' in line:
            match = re.search(r'(\d+)', line)
            if match:
                card['power'] = int(match.group(1))
        
        # Hit
        elif 'ヒット' in line or 'ヒッ' in line:
            match = re.search(r'(\d+)', line)
            if match:
                card['hit'] = int(match.group(1))
        
        # Rareté
        elif 'レアリティ' in line:
            for part in line.split():
                if part in ['P', 'R', 'SR', 'SSR', 'N', 'C']:
                    card['rarity'] = part
                    break
        
        # Affiliation
        elif '所属' in line:
            card['affiliation'] = line.replace('所属', '').strip()
        
        # Keyword
        elif 'キーワード' in line:
            card['keyword'] = line.replace('キーワード', '').strip()
        
        # Effet (tout le texte après "効果" jusqu'à "製品名")
        elif '効果' in line:
            effect_lines = []
            i += 1
            while i < len(lines) and '製品名' not in lines[i]:
                effect_lines.append(lines[i])
                i += 1
            card['effect'] = ' '.join(effect_lines)
            continue  # Ne pas incrémenter i ici car on l'a déjà fait
        
        # Produit
        elif '製品名' in line:
            card['product'] = line.replace('製品名', '').strip()
        
        i += 1
    
    return card if card['name'] else None

def main():
    print("Démarrage du scraping...\n")
    
    cards_list = get_all_card_ids()
    print(f"\nTotal: {len(cards_list)} cartes\n")
    
    all_cards = []
    errors = 0
    
    for i, card_info in enumerate(cards_list, 1):
        print(f"[{i}/{len(cards_list)}] Carte {card_info['id']}...", end=' ')
        
        details = get_card_details(card_info['id'])
        
        if details and details['name'] and not details['name'].startswith('<'):
            card = {
                'id': details['card_id'] or f"JP_{card_info['id']}",
                'name': details['name'],
                'type': details['type'] or 'Unit',
                'color': details['color'] or 'Unknown',
                'cost': details['cost'],
                'power': details['power'],
                'hit': details['hit'],
                'rarity': details['rarity'] or 'R',
                'affiliation': details['affiliation'],
                'keyword': details['keyword'],
                'effect': details['effect'],
                'product': details['product'],
                'image': card_info['image']
            }
            all_cards.append(card)
            print(f"OK - {card['name'][:30]}")
        else:
            errors += 1
            print(f"ECHEC")
        
        time.sleep(0.3)
        
        if i % 50 == 0:
            with open('cards_progress.json', 'w', encoding='utf-8') as f:
                json.dump(all_cards, f, ensure_ascii=False, indent=2)
    
    with open('cards.json', 'w', encoding='utf-8') as f:
        json.dump(all_cards, f, ensure_ascii=False, indent=2)
    
    print(f"\nTerminé ! {len(all_cards)} cartes sauvegardées, {errors} erreurs")

if __name__ == "__main__":
    main()