from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import requests
import os
import time
import re
from urllib.parse import urljoin

def download_nikke_card_images():
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    # chrome_options.add_argument("--headless")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    wait = WebDriverWait(driver, 15)
    
    # Créer le dossier pour les images
    image_folder = "nikke_card_images"
    if not os.path.exists(image_folder):
        os.makedirs(image_folder)
    
    print("🌐 Ouverture du site...")
    driver.get("http://nivelarena.co.kr/bbs/board.php?bo_table=cardlists")
    time.sleep(5)
    
    downloaded_images = set()
    processed_elements = set()  # Pour tracker les éléments déjà traités
    max_iterations = 200
    iteration = 0
    total_downloaded = 0
    total_duplicates = 0
    total_skipped = 0  # Cartes non-NIKKE ignorées
    
    try:
        while iteration < max_iterations:
            iteration += 1
            print(f"\n=== Itération {iteration} ===")
            time.sleep(2)
            
            # Trouver toutes les cartes
            card_elements = driver.find_elements(By.CSS_SELECTOR, "li.gall_li, .gall_item, .card-item")
            print(f"📦 {len(card_elements)} cartes sur cette page")
            
            new_cards_count = 0
            
            for index, card_elem in enumerate(card_elements):
                try:
                    # Créer un identifiant unique pour l'élément
                    element_id = card_elem.get_attribute('data-info') or f"elem_{index}_{iteration}"
                    
                    # Skip si déjà traité
                    if element_id in processed_elements:
                        continue
                    
                    # Scroll vers l'élément
                    driver.execute_script("arguments[0].scrollIntoView(true);", card_elem)
                    time.sleep(0.3)
                    
                    # Cliquer sur la carte
                    card_elem.click()
                    time.sleep(1.5)
                    
                    # Attendre la modale
                    try:
                        modal = wait.until(EC.presence_of_element_located((By.ID, "pop_content")))
                    except:
                        try:
                            modal = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".pop_content, .modal-content")))
                        except:
                            processed_elements.add(element_id)
                            continue
                    
                    # Extraire les infos de la carte
                    card_name = ""
                    card_id = ""
                    card_rarity = ""
                    card_ip = ""
                    
                    all_text = modal.text
                    
                    # Nom - première ligne non vide
                    lines = all_text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if line and not re.match(r'^BT\d+-\d+', line) and not re.search(r'\d{4}', line):
                            card_name = line
                            break
                    
                    # ID
                    id_match = re.search(r'(BT\d+-\d+|ST\d+-\d+|SB\d+-\d+)', all_text)
                    if id_match:
                        card_id = id_match.group(1)
                    
                    # Rareté
                    rarity_match = re.search(r'레어도.*?([A-Z]+)', all_text)
                    if rarity_match:
                        card_rarity = rarity_match.group(1)
                    
                    # IP - Vérifier si c'est NIKKE
                    # Chercher "승리의 여신: 니케" (Goddess of Victory: NIKKE en coréen)
                    if '승리의 여신' in all_text or '니케' in all_text or 'NIKKE' in all_text.upper():
                        card_ip = 'NIKKE'
                    elif '브라운더스트' in all_text or 'Brown Dust' in all_text:
                        card_ip = 'Brown Dust 2'
                    elif '에픽세븐' in all_text or 'Epic Seven' in all_text:
                        card_ip = 'Epic Seven'
                    elif '이터널 리턴' in all_text or 'Eternal Return' in all_text:
                        card_ip = 'Eternal Return'
                    elif '스텔라 블레이드' in all_text or 'Stella Blade' in all_text:
                        card_ip = 'Stella Blade'
                    
                    # MARKER pour identifier les cartes non-NIKKE
                    if card_ip != 'NIKKE':
                        total_skipped += 1
                        processed_elements.add(element_id)
                        if total_skipped % 20 == 0:
                            print(f"⏭️  Non-NIKKE ignoré: {card_ip} - {card_name}")
                        # Fermer la modale
                        try:
                            close_btn = driver.find_element(By.CSS_SELECTOR, ".close, .modal-close, button.close, .pop_close")
                            driver.execute_script("arguments[0].click();", close_btn)
                            time.sleep(0.5)
                        except:
                            pass
                        continue
                    
                    # Créer un identifiant UNIQUE basé sur ID + Rareté + Nom
                    unique_key = f"{card_id}_{card_rarity}_{sanitize_filename(card_name)}"
                    
                    # Trouver l'image
                    try:
                        img = modal.find_element(By.CSS_SELECTOR, "img")
                        img_src = img.get_attribute('src')
                        
                        if img_src:
                            # Nettoyer l'URL
                            if 'thumb' in img_src:
                                img_src = img_src.replace('thumb-', '').replace('_225x315', '')
                            
                            # Créer un nom de fichier UNIQUE avec la rareté
                            if card_id:
                                if card_rarity:
                                    filename = f"{card_id}_{card_rarity}_{sanitize_filename(card_name)}.jpg"
                                else:
                                    filename = f"{card_id}_{sanitize_filename(card_name)}.jpg"
                            else:
                                filename = f"card_{total_downloaded + 1}_{sanitize_filename(card_name)}.jpg"
                            
                            filepath = os.path.join(image_folder, filename)
                            
                            # Vérifier si déjà téléchargée
                            if unique_key not in downloaded_images:
                                # Télécharger l'image
                                if img_src.startswith('http'):
                                    img_url = img_src
                                else:
                                    img_url = urljoin(driver.current_url, img_src)
                                
                                try:
                                    response = requests.get(img_url, timeout=10)
                                    if response.status_code == 200:
                                        with open(filepath, 'wb') as f:
                                            f.write(response.content)
                                        
                                        downloaded_images.add(unique_key)
                                        total_downloaded += 1
                                        new_cards_count += 1
                                        
                                        # Afficher les infos complètes
                                        rarity_display = f" [{card_rarity}]" if card_rarity else ""
                                        print(f"✅ [{total_downloaded}] {card_id}{rarity_display} - {card_name}")
                                    else:
                                        print(f"️ Erreur téléchargement: {img_url}")
                                except Exception as e:
                                    print(f"❌ Erreur: {e}")
                            else:
                                total_duplicates += 1
                                if total_duplicates % 10 == 0:
                                    print(f"⏭️  Doublon ignoré: {card_id} [{card_rarity}] - {card_name}")
                        else:
                            print(f"⚠️ Pas de source d'image")
                            
                    except Exception as e:
                        print(f"❌ Pas d'image trouvée: {e}")
                    
                    # Marquer l'élément comme traité
                    processed_elements.add(element_id)
                    
                    # Fermer la modale
                    try:
                        close_btn = driver.find_element(By.CSS_SELECTOR, ".close, .modal-close, button.close, .pop_close")
                        driver.execute_script("arguments[0].click();", close_btn)
                        time.sleep(0.5)
                    except:
                        pass
                        
                except Exception as e:
                    print(f"❌ Erreur carte {index}: {e}")
                    continue
            
            print(f" Nouvelles cartes traitées: {new_cards_count}")
            
            # Cliquer sur "더보기"
            try:
                more_btn = None
                all_buttons = driver.find_elements(By.TAG_NAME, "button")
                all_buttons.extend(driver.find_elements(By.TAG_NAME, "a"))
                
                for btn in all_buttons:
                    if btn.is_displayed():
                        btn_text = btn.text.strip()
                        if '더보기' in btn_text or 'more' in btn_text.lower():
                            more_btn = btn
                            break
                
                if more_btn and more_btn.is_displayed():
                    print(" Chargement de plus de cartes...")
                    driver.execute_script("arguments[0].scrollIntoView(true);", more_btn)
                    time.sleep(1)
                    driver.execute_script("arguments[0].click();", more_btn)
                    time.sleep(3)
                else:
                    print("✅ Plus de cartes à charger")
                    break
                    
            except Exception as e:
                print(f"✅ Fin: {e}")
                break
        
        print(f"\n {total_downloaded} images NIKKE téléchargées")
        print(f"⏭️  {total_skipped} cartes non-NIKKE ignorées")
        print(f"⏭️  {total_duplicates} doublons ignorés")
        print(f"📁 Dossier: '{image_folder}'")
        
    finally:
        driver.quit()

def sanitize_filename(filename):
    """Nettoyer le nom de fichier"""
    # Supprimer les caractères invalides
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    # Remplacer les espaces par des underscores
    filename = filename.replace(' ', '_')
    # Limiter la longueur
    return filename[:100]


if __name__ == "__main__":
    download_nikke_card_images()