from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import json
import time
import re

def scrape_nikke_cards():
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    # chrome_options.add_argument("--headless")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    wait = WebDriverWait(driver, 15)
    
    print("🌐 Ouverture du site...")
    driver.get("http://nivelarena.co.kr/bbs/board.php?bo_table=cardlists")
    time.sleep(5)
    
    cards_data = []
    processed_cards = set()  # Pour tracker les cartes déjà traitées (ID + rareté)
    max_iterations = 100
    iteration = 0
    
    try:
        while iteration < max_iterations:
            iteration += 1
            print(f"\n=== Itération {iteration} ===")
            
            # Trouver toutes les cartes visibles
            card_elements = driver.find_elements(By.CSS_SELECTOR, "li.gall_li, .gall_item, .card-item")
            print(f" {len(card_elements)} éléments trouvés sur cette page")
            
            # Traiter les cartes
            for index, card_elem in enumerate(card_elements):
                try:
                    card_elem.click()
                    time.sleep(1)
                    
                    try:
                        modal = wait.until(EC.presence_of_element_located((By.ID, "pop_content")))
                    except:
                        continue
                    
                    card_info = extract_card_info_complete(modal)
                    
                    # Vérifier les doublons avec ID + rareté
                    if card_info:
                        card_key = f"{card_info.get('id', '')}_{card_info.get('rarity', '')}"
                        
                        if card_key not in processed_cards and card_info.get('id'):
                            cards_data.append(card_info)
                            processed_cards.add(card_key)
                            print(f"✅ {card_info.get('name', 'N/A')} - {card_info.get('id')} ({card_info.get('rarity', 'N/A')})")
                        else:
                            print(f"️ Doublon ignoré: {card_info.get('id')} ({card_info.get('rarity', 'N/A')})")
                    
                    # Fermer la modale
                    try:
                        close_btn = driver.find_element(By.CSS_SELECTOR, ".close, .modal-close, button.close, a.close, .pop_close")
                        close_btn.click()
                        time.sleep(0.5)
                    except:
                        driver.execute_script("document.querySelector('.pop_content')?.style.display='none'")
                        
                except Exception as e:
                    print(f"❌ Erreur carte: {e}")
                    continue
            
            # Chercher et cliquer sur le bouton "voir plus"
            try:
                more_selectors = [
                    ".more", ".load-more", ".btn-more", 
                    ".list_more", "a.more", "button.more",
                    "[class*='more']", "[onclick*='more']"
                ]
                
                more_btn = None
                for selector in more_selectors:
                    try:
                        elements = driver.find_elements(By.CSS_SELECTOR, selector)
                        for elem in elements:
                            if elem.is_displayed() and elem.text.strip():
                                more_btn = elem
                                break
                        if more_btn:
                            break
                    except:
                        continue
                
                if more_btn and more_btn.is_displayed():
                    print("🔽 Clique sur 'voir plus'...")
                    driver.execute_script("arguments[0].scrollIntoView();", more_btn)
                    time.sleep(1)
                    more_btn.click()
                    time.sleep(3)
                else:
                    print("✅ Plus de bouton 'voir plus' trouvé - Terminé!")
                    break
                    
            except Exception as e:
                print(f"✅ Fin du scraping: {e}")
                break
    
    finally:
        driver.quit()
    
    print(f"\n🎉 {len(cards_data)} cartes récupérées au total")
    
    # Sauvegarder
    with open('nikke_cards_complet.json', 'w', encoding='utf-8') as f:
        json.dump(cards_data, f, ensure_ascii=False, indent=2)

def extract_card_info_complete(modal):
    """Extraction complète avec attribut et mots-clés corrigés"""
    card = {
        'id': '',
        'name': '',
        'type': 'Unit',
        'attribute': '',  # Remplace color par attribute
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
    
    all_text = modal.text
    
    # Nom - première ligne non vide
    lines = all_text.split('\n')
    for line in lines:
        line = line.strip()
        if line and not re.match(r'^BT\d+-\d+', line) and not re.search(r'\d{4}', line):
            card['name'] = line
            break
    
    # ID
    id_match = re.search(r'(BT\d+-\d+)', all_text)
    if id_match:
        card['id'] = id_match.group(1)
    
    # Stats
    cost_match = re.search(r'코스트.*?(\d+)', all_text)
    if cost_match:
        card['cost'] = int(cost_match.group(1))
    
    power_match = re.search(r'파워.*?(\d+)', all_text)
    if power_match:
        card['power'] = int(power_match.group(1))
    
    hit_match = re.search(r'히트.*?(\d+)', all_text)
    if hit_match:
        card['hit'] = int(hit_match.group(1))
    
    # Rareté
    rarity_match = re.search(r'레어도.*?([A-Z]+)', all_text)
    if rarity_match:
        card['rarity'] = rarity_match.group(1)
    
    # ATTRIBUT - Chercher les couleurs/attributs
    # Mapping coréen -> anglais
    attribute_keywords = {
        'flame': ['red', 'rouge', '화염', '불', 'flame'],
        'earth': ['green', 'vert', 'verde', '대지', '땅', 'earth'],
        'storm': ['blue', 'bleu', 'blue', '폭풍', '바람', 'storm'],
        'wave': ['blue', 'bleu', 'wave', '물결', '파도', 'water'],
        'lightning': ['yellow', 'jaune', 'lightning', '번개', '전기', 'thunder']
    }
    
    # Chercher dans le texte
    for attr_en, attr_variants in attribute_keywords.items():
        for variant in attr_variants:
            if variant.lower() in all_text.lower():
                card['attribute'] = attr_en.capitalize()
                break
    
    # Chercher dans les classes CSS
    if not card['attribute']:
        modal_classes = modal.get_attribute('class') or ''
        for attr_en in attribute_keywords.keys():
            if attr_en in modal_classes.lower():
                card['attribute'] = attr_en.capitalize()
                break
    
    # Type
    if '리더' in all_text or 'leader' in all_text.lower():
        card['type'] = 'Leader'
    elif '스킬' in all_text or 'skill' in all_text.lower():
        card['type'] = 'Skill'
    elif '이벤트' in all_text or 'event' in all_text.lower():
        card['type'] = 'Event'
    
    # Keywords - Nettoyer et corriger
    keywords = []
    
    # Chercher les mots-clés connus
    keyword_patterns = {
        'Attacker': ['어태커', 'attacker'],
        'Defender': ['디펜더', 'defender'],
        'Guardian': ['가디언', 'guardian'],
        'Passive': ['패시브', 'passive'],
        'Active': ['액티브', 'active'],
        'Entry': ['엔트리', 'entry'],
        'Trigger': ['트리거', 'trigger']
    }
    
    for keyword_en, keyword_variants in keyword_patterns.items():
        for variant in keyword_variants:
            if variant.lower() in all_text.lower():
                if keyword_en not in keywords:
                    keywords.append(keyword_en)
                break
    
    # Filtrer les valeurs non pertinentes comme "1", "-", etc.
    card['keyword'] = ', '.join(keywords) if keywords else ''
    
    # Effet complet
    card['effect'] = all_text
    
    # Image
    try:
        img = modal.find_element(By.CSS_SELECTOR, "img")
        img_src = img.get_attribute('src')
        if img_src and 'thumb' not in img_src:
            card['image'] = img_src
        else:
            card['image'] = img_src.replace('thumb-', '').replace('_225x315', '') if img_src else ''
    except:
        pass
    
    return card

if __name__ == "__main__":
    scrape_nikke_cards()