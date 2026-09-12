import requests
from bs4 import BeautifulSoup
import json
import re
import time

def scrape_all_nikke_cards():
    base_url = "http://nivelarena.co.kr/bbs/board.php"
    cards_data = []
    
    print("🎯 Démarrage du scraping NIKKE...\n")
    
    all_wr_ids = set()
    
    # Parcourir toutes les pages pour collecter tous les wr_id
    page = 1
    while True:
        params = {'bo_table': 'cardlists', 'page': str(page)}
        
        try:
            response = requests.get(base_url, params=params, timeout=30)
            html = response.text
            matches = re.findall(r'data-info="[^"]*♬(\d+)"', html)
            
            if not matches:
                print(f"✅ Fin de la collecte à la page {page}")
                break
            
            for wr_id in matches:
                all_wr_ids.add(wr_id)
            
            print(f"Page {page}: {len(matches)} cartes (total unique: {len(all_wr_ids)})")
            page += 1
            
            # Limite de sécurité pour éviter de boucler indéfiniment
            if page > 100:
                print("⚠️ Limite de 100 pages atteinte")
                break
                
        except Exception as e:
            print(f"❌ Erreur page {page}: {e}")
            break
    
    print(f"\n📋 {len(all_wr_ids)} cartes uniques trouvées à scraper\n")
    
    count = 0
    nikke_count = 0
    for wr_id in sorted(all_wr_ids, key=int, reverse=True):
        card_url = f"{base_url}?bo_table=cardlists&wr_id={wr_id}"
        count += 1
        
        try:
            card_info = get_card_details(card_url, wr_id)
            
            if card_info:
                cards_data.append(card_info)
                nikke_count += 1
                print(f"[{nikke_count:3d}] {card_info['id']} - {card_info['name']}")
            
            if count % 10 == 0:
                time.sleep(0.5)
            
        except Exception as e:
            print(f"  ❌ Erreur carte {wr_id}: {e}")
            continue
    
    print(f"\n🎉 Total: {len(cards_data)} cartes NIKKE récupérées!")
    
    with open('nikke_cards.json', 'w', encoding='utf-8') as f:
        json.dump(cards_data, f, ensure_ascii=False, indent=2)
    
    print("💾 Sauvegardé dans nikke_cards.json")
    return cards_data


def get_card_details(card_url, wr_id):
    try:
        response = requests.get(card_url, timeout=15)
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extraire le nom depuis h2#subject (texte direct avant h2 imbriqué)
        subject_h2 = soup.find('h2', id='subject')
        if not subject_h2:
            return None
        
        card_name = ''
        for child in subject_h2.children:
            if isinstance(child, str):
                text = child.strip()
                if text:
                    card_name = text
                    break
        
        if not card_name:
            return None
        
        # Extraire l'image avant de parser tout le texte
        img_elem = soup.find('img')
        image_url = ''
        if img_elem:
            img_src = img_elem.get('src', '') or img_elem.get('data-src', '')
            if img_src:
                if not img_src.startswith('http'):
                    img_src = 'http://nivelarena.co.kr' + img_src
                image_url = img_src.replace('thumb-', '').replace('_225x315', '')
        
        # Récupérer tout le texte pour parser
        all_text = soup.get_text(separator='\n', strip=True)
        
        # Parser les informations pour obtenir l'IP
        type_h2 = soup.find('h2', id='type')
        type_text = type_h2.get_text(strip=True) if type_h2 else ""
        
        # Parser d'abord pour extraire l'IP
        ip = ''
        ip_match = re.search(r'IP\s*\n?\s*([^\n]+)', all_text)
        if ip_match:
            ip = ip_match.group(1).strip()
        
        # Vérifier si c'est une carte NIKKE via le champ IP (et non le nom)
        is_nikke = '승리의 여신' in ip or 'NIKKE' in ip.upper()
        if not is_nikke:
            return None
        
        # Extraire l'ID de la carte (BTxx-xxx)
        id_match = re.search(r'(BT\d+-\d+|ST\d+-\d+|SB\d+-\d+)', all_text)
        if not id_match:
            return None
        
        card_id = id_match.group(1)
        
        # Parser les informations complètes
        card = parse_card_info(all_text, type_text, card_id, card_name, image_url)
        
        return card
        
    except Exception as e:
        print(f"  ❌ Erreur détail carte {wr_id}: {e}")
        return None


def parse_card_info(text, type_text, card_id, card_name, image_url):
    parts = [p.strip() for p in type_text.split('/')]
    
    card_type_ko = parts[1].lower() if len(parts) > 1 else '유닛'
    attribute_ko = parts[2].lower() if len(parts) > 2 else ''
    
    type_map = {'유닛': 'Unit', '아이템': 'Item', '리더': 'Leader', '스킬': 'Skill'}
    card_type = type_map.get(card_type_ko, 'Unit')
    
    attr_map = {'화염': 'Flame', '대지': 'Earth', '폭풍': 'Storm', '파도': 'Wave', '철강': 'Iron'}
    attribute = attr_map.get(attribute_ko, '')
    
    rarity = ''
    rarity_match = re.search(r'레어도\s*([URSRRC]+)', text)
    if rarity_match:
        rarity = rarity_match.group(1)
    
    cost = 0
    cost_match = re.search(r'코스트\s*(\d+)', text)
    if cost_match:
        cost = int(cost_match.group(1))
    
    power = 0
    power_match = re.search(r'파워\s*(-?\d+)', text)
    if power_match:
        val = power_match.group(1)
        if val != '-':
            power = int(val)
    
    hit = 0
    hit_match = re.search(r'히트\s*(-?\d+)', text)
    if hit_match:
        val = hit_match.group(1)
        if val != '-':
            hit = int(val)
    
    affiliation = ''
    affil_patterns = {
        'Tetra Line': ['테트라'],
        'Missilis': ['미실리스'],
        'Pilgrim': ['필그림'],
        'Elysion': ['엘리시온'],
        'Rebel': ['리벨'],
        'Effect': ['이펙트']
    }
    
    for affil_en, affil_ko_list in affil_patterns.items():
        for affil_ko in affil_ko_list:
            if affil_ko in text:
                affiliation = affil_en
                break
        if affiliation:
            break
    
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
    
    keyword = ', '.join(keywords) if keywords else ''
    effect = text
    
    ip = ''
    ip_match = re.search(r'IP\s*\n?\s*([^\n]+)', text)
    if ip_match:
        ip = ip_match.group(1).strip()
        if 'NIKKE' in ip.upper() or '승리의 여신' in ip:
            ip = 'Goddess of Victory: NIKKE'
    
    # Extraire l'ID de la carte depuis le texte complet si pas trouvé avant
    if not card_id:
        id_match = re.search(r'(BT\d+-\d+|ST\d+-\d+|SB\d+-\d+)', text)
        if id_match:
            card_id = id_match.group(1)
    
    card = {
        'id': card_id,
        'name': card_name,
        'type': card_type,
        'attribute': attribute,
        'cost': cost,
        'power': power,
        'hit': hit,
        'rarity': rarity,
        'affiliation': affiliation,
        'keyword': keyword,
        'effect': effect,
        'ip': ip if ip else 'Goddess of Victory: NIKKE',
        'image': image_url
    }
    
    return card


if __name__ == "__main__":
    scrape_all_nikke_cards()
