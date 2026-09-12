import requests
from bs4 import BeautifulSoup
import json
import re
import time

def scrape_nikke_cards():
    """Scrape toutes les cartes NIKKE en utilisant l'API directe du site"""
    
    base_url = "http://nivelarena.co.kr/skin/board/card_list_new/get_more_list.php"
    cards_data = []
    processed_cards = set()
    
    # Récupérer la première page pour connaître le nombre total de pages
    print("🌐 Récupération des informations de pagination...")
    
    # Le site a 65 pages au total selon l'analyse
    total_pages = 65
    
    print(f"📄 Nombre total de pages: {total_pages}")
    print("🎯 Début du scraping des cartes NIKKE...\n")
    
    for page in range(1, total_pages + 1):
        print(f"📄 Page {page}/{total_pages}", end=" ")
        
        try:
            # Appel direct à l'API
            response = requests.post(base_url, data={
                'bo_table': 'cardlists',
                'page': str(page),
                'spt': ''
            }, timeout=10)
            
            if response.status_code != 200:
                print(f"❌ Erreur HTTP {response.status_code}")
                continue
            
            soup = BeautifulSoup(response.text, 'html.parser')
            card_elements = soup.find_all('li', class_='gall_li')
            
            print(f"- {len(card_elements)} cartes trouvées")
            
            if not card_elements:
                print("⚠️  Plus de cartes")
                break
            
            # Traiter chaque carte
            for card_elem in card_elements:
                try:
                    data_info = card_elem.get('data-info', '')
                    if not data_info:
                        continue
                    
                    # Extraire le nom du fichier image (contient le nom de la carte)
                    parts = data_info.split('♬')
                    if len(parts) < 2:
                        continue
                    
                    filename = parts[0]
                    card_id_num = parts[1]  # ID numérique de la carte
                    
                    # Construire l'URL complète de l'image
                    img_thumb = card_elem.find('img')
                    if not img_thumb:
                        continue
                    
                    thumb_src = img_thumb.get('src', '')
                    
                    # Obtenir le lien vers le détail de la carte
                    link_elem = card_elem.find('a')
                    if not link_elem:
                        continue
                    
                    card_link = link_elem.get('href', '')
                    
                    # La carte est identifiée par son numéro
                    card_key = f"card_{card_id_num}"
                    if card_key in processed_cards:
                        continue
                    
                    processed_cards.add(card_key)
                    
                    # Maintenant, récupérer les détails de la carte en cliquant dessus
                    # Le lien href contient le nom complet du fichier
                    card_detail_url = f"http://nivelarena.co.kr/bbs/board.php?bo_table=cardlists&{card_link}"
                    
                    card_info = fetch_card_details(card_link, thumb_src, card_id_num)
                    
                    if card_info and card_info.get('id'):
                        # Filtrer uniquement NIKKE
                        if card_info.get('ip') == 'Goddess of Victory: NIKKE':
                            cards_data.append(card_info)
                            print(f"  ✅ [{len(cards_data)}] {card_info.get('name')} - {card_info.get('id')}")
                    
                except Exception as e:
                    print(f"  ❌ Erreur carte: {e}")
                    continue
            
            # Petite pause pour éviter de surcharger le serveur
            time.sleep(0.3)
            
            # Sauvegarde intermédiaire toutes les 10 pages
            if page % 10 == 0 and len(cards_data) > 0:
                save_progress(cards_data, f'nikke_cards_page{page}.json')
                print(f"💾 Sauvegarde intermédiaire: {len(cards_data)} cartes")
            
        except Exception as e:
            print(f"❌ Erreur page {page}: {e}")
            continue
    
    print(f"\n🎉 {len(cards_data)} cartes NIKKE récupérées avec succès!")
    
    # Sauvegarde finale
    with open('nikke_cards_complet.json', 'w', encoding='utf-8') as f:
        json.dump(cards_data, f, ensure_ascii=False, indent=2)
    
    print("💾 Sauvegardé dans nikke_cards_complet.json")
    return cards_data


def fetch_card_details(card_href, thumb_url, card_num):
    """Récupère les détails d'une carte en visitant sa page"""
    
    # Construire l'URL complète pour le popup
    # Le site utilise un système de popup qui charge le contenu via AJAX
    # On va essayer de deviner l'URL du popup
    
    base_popup_url = "http://nivelarena.co.kr/skin/board/card_list_new/pop_content.php"
    
    try:
        # Essayer d'obtenir le contenu du popup
        response = requests.post(base_popup_url, data={
            'bo_table': 'cardlists',
            'wr_id': card_num
        }, timeout=10)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            return extract_card_info_complete(soup)
    except:
        pass
    
    # Fallback: utiliser les infos de base
    card = {
        'id': f'NK-{card_num}',
        'name': f'Carte NIKKE #{card_num}',
        'type': 'Unit',
        'attribute': '',
        'cost': 0,
        'power': 0,
        'hit': 0,
        'rarity': '',
        'affiliation': '',
        'keyword': '',
        'effect': '',
        'ip': 'Goddess of Victory: NIKKE',
        'image': thumb_url.replace('thumb-', '') if 'thumb-' in thumb_url else thumb_url
    }
    
    return card

def save_progress(cards_data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(cards_data, f, ensure_ascii=False, indent=2)
    print(f"💾 Sauvegarde: {filename}")

def extract_card_info_complete(soup_or_modal):
    """Extrait les infos d'une carte depuis un objet BeautifulSoup ou Selenium"""
    card = {
        'id': '',
        'name': '',
        'type': 'Unit',
        'attribute': '',
        'cost': 0,
        'power': 0,
        'hit': 0,
        'rarity': '',
        'affiliation': '',
        'keyword': '',
        'effect': '',
        'ip': 'Goddess of Victory: NIKKE',
        'image': ''
    }
    
    # Vérifier si c'est un objet BeautifulSoup ou Selenium
    if hasattr(soup_or_modal, 'text'):
        # Selenium
        all_text = soup_or_modal.text
        img_elem = None
        try:
            img_elem = soup_or_modal.find_element(By.CSS_SELECTOR, "img")
        except:
            pass
    else:
        # BeautifulSoup
        all_text = soup_or_modal.get_text()
        img_elem = soup_or_modal.find('img')
    
    # Extraire le nom
    lines = all_text.split('\n')
    for line in lines:
        line = line.strip()
        if line and not re.match(r'^BT\d+-\d+', line) and not re.search(r'\d{4}', line):
            card['name'] = line
            break
    
    # Extraire l'ID de la carte
    id_match = re.search(r'(BT\d+-\d+|ST\d+-\d+|SB\d+-\d+)', all_text)
    if id_match:
        card['id'] = id_match.group(1)
    
    # Extraire les stats
    cost_match = re.search(r'코스트.*?(\d+)', all_text)
    if cost_match:
        card['cost'] = int(cost_match.group(1))
    
    power_match = re.search(r'파워.*?(\d+)', all_text)
    if power_match:
        card['power'] = int(power_match.group(1))
    
    hit_match = re.search(r'히트.*?(\d+)', all_text)
    if hit_match:
        card['hit'] = int(hit_match.group(1))
    
    # Extraire la rareté
    rarity_match = re.search(r'레어도.*?([A-Z]+)', all_text)
    if rarity_match:
        card['rarity'] = rarity_match.group(1)
    
    # Extraire l'attribut
    attribute_keywords = {
        'Flame': ['화염', 'flame', 'red'],
        'Earth': ['대지', 'earth', 'green'],
        'Storm': ['폭풍', 'storm'],
        'Wave': ['파도', 'wave'],
        'Lightning': ['번개', 'lightning']
    }
    
    for attr_en, attr_variants in attribute_keywords.items():
        for variant in attr_variants:
            if variant.lower() in all_text.lower():
                card['attribute'] = attr_en
                break
        if card['attribute']:
            break

    # Extraire l'affiliation
    affiliation_keywords = {
        'Tetra': ['테트라', 'tetra'],
        'Missilis': ['미실리스', 'missilis'],
        'Pilgrim': ['필그림', 'pilgrim'],
        'Elysion': ['엘리시온', 'elysion']
    }
    
    for aff_en, aff_variants in affiliation_keywords.items():
        for variant in aff_variants:
            if variant.lower() in all_text.lower():
                card['affiliation'] = aff_en
                break
        if card['affiliation']:
            break

    # Extraire le type
    if '리더' in all_text:
        card['type'] = 'Leader'
    elif '스킬' in all_text:
        card['type'] = 'Skill'
    elif '아이템' in all_text:
        card['type'] = 'Item'
    
    # Extraire les keywords
    keywords = []
    keyword_patterns = {
        'Attacker': ['어태커', 'attacker'],
        'Defender': ['디펜더', 'defender'],
        'Guardian': ['가디언', 'guardian'],
        'Passive': ['패시브', 'passive'],
        'Active': ['액티브', 'active'],
        'Entry': ['엔트리', 'entry'],
        'Exit': ['엑시트', 'exit']
    }
    
    for keyword_en, keyword_variants in keyword_patterns.items():
        for variant in keyword_variants:
            if variant.lower() in all_text.lower():
                if keyword_en not in keywords:
                    keywords.append(keyword_en)
                break
    
    card['keyword'] = ', '.join(keywords) if keywords else ''
    card['effect'] = all_text
    
    # Extraire l'image
    if img_elem:
        try:
            if hasattr(img_elem, 'get_attribute'):
                # Selenium
                img_src = img_elem.get_attribute('src')
            else:
                # BeautifulSoup
                img_src = img_elem.get('src', '')
            
            if img_src:
                if 'thumb' in img_src:
                    card['image'] = img_src.replace('thumb-', '').replace('_225x315', '')
                else:
                    card['image'] = img_src
        except:
            pass
    
    return card

if __name__ == "__main__":
    scrape_nikke_cards()