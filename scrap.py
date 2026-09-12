from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
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
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    # chrome_options.add_argument("--headless")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    wait = WebDriverWait(driver, 15)
    
    print("🌐 Ouverture du site...")
    driver.get("http://nivelarena.co.kr/bbs/board.php?bo_table=cardlists")
    time.sleep(5)
    
    # 🎯 FILTRER UNIQUEMENT LES CARTES NIKKE
    print("🎯 Filtrage des cartes NIKKE uniquement...")
    try:
        # Scroll vers le haut
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        # Trouver le dropdown "Select IP"
        ip_dropdown = None
        try:
            # Méthode 1: Chercher par label
            ip_dropdown = driver.find_element(By.XPATH, "//select[contains(@class, 'ip') or contains(@name, 'ip')]")
        except:
            # Méthode 2: Chercher tous les selects
            selects = driver.find_elements(By.TAG_NAME, "select")
            for sel in selects:
                if sel.is_displayed():
                    ip_dropdown = sel
                    break
        
        if ip_dropdown:
            print("✅ Dropdown IP trouvé")
            driver.execute_script("arguments[0].scrollIntoView(true);", ip_dropdown)
            time.sleep(1)
            
            # Utiliser Select pour choisir NIKKE
            select = Select(ip_dropdown)
            for option in select.options:
                if '니케' in option.text or 'NIKKE' in option.text or 'Goddess' in option.text:
                    print(f"✅ Sélection: {option.text}")
                    select.select_by_visible_text(option.text)
                    time.sleep(3)
                    print(" Filtre NIKKE appliqué!")
                    break
        else:
            print("️ Dropdown non trouvé, continuation...")
            
    except Exception as e:
        print(f"️ Erreur filtrage: {e}")
    
    cards_data = []
    processed_cards = set()
    processed_elements = set()  # ANTI-RESCAN
    max_iterations = 200
    iteration = 0
    no_more_cards_count = 0
    
    try:
        while iteration < max_iterations:
            iteration += 1
            print(f"\n=== Itération {iteration} ===")
            
            time.sleep(2)
            
            card_elements = driver.find_elements(By.CSS_SELECTOR, "li.gall_li, .gall_item, .card-item, .list-item")
            print(f"📦 {len(card_elements)} éléments trouvés")
            
            if len(card_elements) == 0:
                no_more_cards_count += 1
                if no_more_cards_count >= 3:
                    print("✅ Plus de cartes à charger")
                    break
                continue
            
            no_more_cards_count = 0
            new_cards = 0
            
            for index, card_elem in enumerate(card_elements):
                try:
                    # ID unique pour l'élément (ANTI-RESCAN)
                    element_id = card_elem.get_attribute('data-info') or f"elem_{index}_{iteration}_{len(card_elem.text)}"
                    
                    # Skip si déjà traité
                    if element_id in processed_elements:
                        continue
                    
                    driver.execute_script("arguments[0].scrollIntoView(true);", card_elem)
                    time.sleep(0.3)
                    card_elem.click()
                    time.sleep(1.5)
                    
                    try:
                        modal = wait.until(EC.presence_of_element_located((By.ID, "pop_content")))
                    except:
                        try:
                            modal = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".pop_content, .modal-content")))
                        except:
                            processed_elements.add(element_id)
                            continue
                    
                    card_info = extract_card_info_complete(modal)
                    
                    if card_info:
                        card_key = f"{card_info.get('id', '')}_{card_info.get('rarity', '')}_{card_info.get('name', '')}"
                        if card_key not in processed_cards and card_info.get('id'):
                            cards_data.append(card_info)
                            processed_cards.add(card_key)
                            new_cards += 1
                            print(f"✅ [{len(cards_data)}] {card_info.get('name')} - {card_info.get('id')} ({card_info.get('rarity')})")
                    
                    processed_elements.add(element_id)
                    
                    # Fermer la modale
                    try:
                        close_btn = driver.find_element(By.CSS_SELECTOR, ".close, .pop_close")
                        driver.execute_script("arguments[0].click();", close_btn)
                        time.sleep(0.5)
                    except:
                        pass
                        
                except Exception as e:
                    print(f" Erreur carte {index}: {e}")
                    continue
            
            print(f"🆕 Nouvelles cartes: {new_cards}")
            
            # Sauvegarde toutes les 50 cartes
            if len(cards_data) % 50 == 0 and len(cards_data) > 0:
                save_progress(cards_data, f'nikke_cards_backup_{len(cards_data)}.json')
            
            # Cliquer sur "더보기"
            try:
                more_btn = None
                all_buttons = driver.find_elements(By.TAG_NAME, "button")
                all_buttons.extend(driver.find_elements(By.TAG_NAME, "a"))
                
                for btn in all_buttons:
                    if btn.is_displayed():
                        btn_text = btn.text.strip()
                        if '더보기' in btn_text:
                            more_btn = btn
                            break
                
                if not more_btn:
                    more_selectors = [".more", ".load-more", ".list_more", "a[href*='spt']"]
                    for selector in more_selectors:
                        try:
                            elements = driver.find_elements(By.CSS_SELECTOR, selector)
                            for elem in elements:
                                if elem.is_displayed():
                                    more_btn = elem
                                    break
                            if more_btn:
                                break
                        except:
                            continue
                
                if more_btn and more_btn.is_displayed():
                    print("🔽 Chargement...")
                    driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                    time.sleep(1)
                    driver.execute_script("arguments[0].scrollIntoView(true);", more_btn)
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", more_btn)
                    time.sleep(3)
                else:
                    print("✅ Terminé!")
                    break
                    
            except Exception as e:
                print(f"❌ Erreur bouton: {e}")
                break
        
        print(f"\n🎉 {len(cards_data)} cartes NIKKE récupérées")
        
        with open('nikke_cards_complet.json', 'w', encoding='utf-8') as f:
            json.dump(cards_data, f, ensure_ascii=False, indent=2)
            
        print(" Sauvegardé dans nikke_cards_complet.json")
        
    finally:
        driver.quit()

def save_progress(cards_data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(cards_data, f, ensure_ascii=False, indent=2)
    print(f"💾 Sauvegarde: {filename}")

def extract_card_info_complete(modal):
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
    
    all_text = modal.text
    
    lines = all_text.split('\n')
    for line in lines:
        line = line.strip()
        if line and not re.match(r'^BT\d+-\d+', line) and not re.search(r'\d{4}', line):
            card['name'] = line
            break
    
    id_match = re.search(r'(BT\d+-\d+|ST\d+-\d+|SB\d+-\d+)', all_text)
    if id_match:
        card['id'] = id_match.group(1)
    
    cost_match = re.search(r'코스트.*?(\d+)', all_text)
    if cost_match:
        card['cost'] = int(cost_match.group(1))
    
    power_match = re.search(r'파워.*?(\d+)', all_text)
    if power_match:
        card['power'] = int(power_match.group(1))
    
    hit_match = re.search(r'히트.*?(\d+)', all_text)
    if hit_match:
        card['hit'] = int(hit_match.group(1))
    
    rarity_match = re.search(r'레어도.*?([A-Z]+)', all_text)
    if rarity_match:
        card['rarity'] = rarity_match.group(1)
    
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

    if '리더' in all_text:
        card['type'] = 'Leader'
    elif '스킬' in all_text:
        card['type'] = 'Skill'
    elif '아이템' in all_text:
        card['type'] = 'Item'
    
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
    
    try:
        img = modal.find_element(By.CSS_SELECTOR, "img")
        img_src = img.get_attribute('src')
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