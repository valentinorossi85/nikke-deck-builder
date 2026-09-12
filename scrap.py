import requests
from bs4 import BeautifulSoup
import json
import re
import time

def scrape_all_nikke_cards():
    """Scrape toutes les cartes NIKKE du site"""
    
    base_url = "http://nivelarena.co.kr/bbs/board.php"
    cards_data = []
    
    print("🎯 Démarrage du scraping NIKKE...\n")
    
    # Paramètres pour filtrer uniquement NIKKE
    params = {
        'bo_table': 'cardlists',
        'sfl': 'wr_subject',  # Search field: subject
        'stx': '니케',  # Search term: NIKKE
        'page': '1'
    }
    
    page = 1
    max_pages = 100  # Sécurité
    
    while page <= max_pages:
        params['page'] = str(page)
        
        try:
            response = requests.get(base_url, params=params, timeout=15)
            
            if response.status_code != 200:
                print(f"❌ Erreur HTTP {response.status_code} à la page {page}")
                break
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Trouver toutes les cartes dans la liste
            card_rows = soup.select('tbody tr')
            
            if not card_rows:
                print("✅ Plus de cartes à récupérer")
                break
            
            nikke_cards_in_page = 0
            
            for row in card_rows:
                try:
                    # Extraire les infos de base depuis la ligne
                    link_elem = row.find('a', class_='subject')
                    if not link_elem:
                        continue
                    
                    card_name = link_elem.get_text(strip=True)
                    card_href = link_elem.get('href', '')
                    
                    # Vérifier si c'est une carte NIKKE
                    if '니케' not in card_name and 'NIKKE' not in card_name.upper():
                        continue
                    
                    # Extraire l'ID depuis le lien ou le texte
                    id_match = re.search(r'(BT\d+-\d+|ST\d+-\d+|SB\d+-\d+)', card_name)
                    if not id_match:
                        continue
                    
                    card_id = id_match.group(1)
                    
                    # Construire l'URL complète pour les détails
                    if card_href.startswith('./'):
                        card_href = 'http://nivelarena.co.kr/bbs/' + card_href[2:]
                    elif not card_href.startswith('http'):
                        card_href = 'http://nivelarena.co.kr/bbs/' + card_href
                    
                    # Récupérer les détails de la carte
                    card_info = get_card_details(card_href, card_id)
                    
                    if card_info and card_info.get('id'):
                        # Vérifier que c'est bien NIKKE
                        if card_info.get('ip') == 'Goddess of Victory: NIKKE':
                            cards_data.append(card_info)
                            nikke_cards_in_page += 1
                            print(f"[{len(cards_data):3d}] {card_info['id']} - {card_info['name']}")
                
                except Exception as e:
                    print(f"  ❌ Erreur carte: {e}")
                    continue
            
            if nikke_cards_in_page == 0:
                print(f"Page {page}: Aucune carte NIKKE trouvée")
            
            page += 1
            time.sleep(0.2)
            
        except Exception as e:
            print(f"❌ Erreur page {page}: {e}")
            page += 1
            continue
    
    print(f"\n🎉 Total: {len(cards_data)} cartes NIKKE récupérées!")
    
    # Sauvegarde
    with open('nikke_cards.json', 'w', encoding='utf-8') as f:
        json.dump(cards_data, f, ensure_ascii=False, indent=2)
    
    print("💾 Sauvegardé dans nikke_cards.json")
    return cards_data


def get_card_details(card_url, card_id):
    """Récupère les détails complets d'une carte"""
    
    try:
        response = requests.get(card_url, timeout=10)
        
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Trouver le conteneur principal de la carte
        card_container = soup.find('div', class_='popup_content') or soup.find('div', id='popup')
        
        if not card_container:
            card_container = soup.find('body')
        
        all_text = card_container.get_text(separator='\n', strip=True)
        
        # Extraire l'image
        img_elem = soup.find('img')
        image_url = ''
        if img_elem:
            img_src = img_elem.get('src', '') or img_elem.get('data-src', '')
            if img_src:
                if not img_src.startswith('http'):
                    img_src = 'http://nivelarena.co.kr' + img_src
                # Enlever thumb si présent
                image_url = img_src.replace('thumb-', '').replace('_225x315', '')
        
        # Parser les informations
        card = parse_card_info(all_text, card_id, image_url)
        
        return card
        
    except Exception as e:
        print(f"  ⚠️  Erreur détails: {e}")
        return None


def parse_card_info(text, card_id, image_url):
    """Parse le texte pour extraire toutes les infos de la carte"""
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    card = {
        'id': card_id,
        'name': '',
        'type': 'Unit',
        'attribute': '',
        'cost': 0,
        'power': 0,
        'hit': 0,
        'rarity': '',
        'affiliation': '',
        'keyword': '',
        'effect': text,
        'ip': 'Goddess of Victory: NIKKE',
        'image': image_url
    }
    
    # Extraire le nom (première ligne qui n'est pas un ID ou IP)
    for line in lines:
        if re.match(r'^BT\d+-\d+', line) or re.match(r'^ST\d+-\d+', line):
            continue
        if '제품명' in line or 'IP' in line or '승리의 여신' in line:
            continue
        if line and not card['name']:
            card['name'] = line
            break
    
    # Extraire l'attribut
    attr_patterns = {
        'Flame': ['화염'],
        'Earth': ['대지'],
        'Storm': ['폭풍'],
        'Wave': ['파도'],
        'Iron': ['철강']
    }
    
    for attr_en, attr_ko_list in attr_patterns.items():
        for attr_ko in attr_ko_list:
            if attr_ko in text:
                card['attribute'] = attr_en
                break
        if card['attribute']:
            break
    
    # Extraire la rareté
    rarity_match = re.search(r'레어도\s*([URSRRC]+)', text)
    if rarity_match:
        card['rarity'] = rarity_match.group(1)
    
    # Extraire le coût
    cost_match = re.search(r'코스트\s*(\d+)', text)
    if cost_match:
        card['cost'] = int(cost_match.group(1))
    
    # Extraire power
    power_match = re.search(r'파워\s*(-?\d+)', text)
    if power_match:
        val = power_match.group(1)
        if val != '-':
            card['power'] = int(val)
    
    # Extraire hit
    hit_match = re.search(r'히트\s*(-?\d+)', text)
    if hit_match:
        val = hit_match.group(1)
        if val != '-':
            card['hit'] = int(val)
    
    # Extraire le type
    if '아이템' in text:
        card['type'] = 'Item'
    elif '리더' in text:
        card['type'] = 'Leader'
    elif '스킬' in text:
        card['type'] = 'Skill'
    else:
        card['type'] = 'Unit'
    
    # Extraire affiliation
    affil_patterns = {
        'Tetra Line': ['테트라'],
        'Missilis': ['미실리스'],
        'Pilgrim': ['필그림'],
        'Elysion': ['엘리시온'],
        'Rebel': ['리벨']
    }
    
    for affil_en, affil_ko_list in affil_patterns.items():
        for affil_ko in affil_ko_list:
            if affil_ko in text:
                card['affiliation'] = affil_en
                break
        if card['affiliation']:
            break
    
    # Extraire keywords
    keywords = []
    keyword_map = {
        'Attacker': ['어태커'],
        'Defender': ['디펜더'],
        'Guardian': ['가디언'],
        'Passive': ['패시브'],
        'Active': ['액티브'],
        'Entry': ['엔트리'],
        'Exit': ['엑시트']
    }
    
    for kw_en, kw_ko_list in keyword_map.items():
        for kw_ko in kw_ko_list:
            if kw_ko in text:
                keywords.append(kw_en)
                break
    
    card['keyword'] = ', '.join(keywords) if keywords else ''
    
    return card


if __name__ == "__main__":
    scrape_all_nikke_cards()