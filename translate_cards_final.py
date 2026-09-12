#!/usr/bin/env python3
import json
import re

def clean_and_extract_effect(text):
    """Extrait uniquement le texte d'effet utile depuis le contenu scrapé"""
    if not text:
        return ""
    
    # Chercher la section "효과" (effet) et extraire le contenu après
    effet_patterns = [
        r'효과\s*\n?\s*(.+?)\s*제품 선택',
        r'효과\s*\n?\s*(.+?)\s*제품명',
        r'효과\s*\n?\s*(.+?)\s*IP\s*',
    ]
    
    effect_text = ""
    for pattern in effet_patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            effect_text = match.group(1).strip()
            break
    
    if not effect_text:
        return ""
    
    # Nettoyer le texte d'effet des résidus
    cleanup_patterns = [
        r'니벨아레나.*',
        r'플레이\s*-\s*카드.*',
        r'제품안내.*',
        r'공식정보.*',
        r'카드정보.*',
        r'페이지 정보.*',
        r'작성자.*',
        r'댓글.*',
        r'조회.*',
        r'작성일.*',
        r'제품 선택.*',
        r'제품명.*',
        r'IP.*',
        r'목\s*록.*',
        r'(이전글|다음글).*',
        r'\d+\.\d+\.\d+.*',
        r'댓글목록.*',
        r'등록된 댓글.*',
        r'주식회사.*',
        r'대표이사.*',
        r'사업자등록번호.*',
        r'경기도.*',
        r'CS문의.*',
        r'E-mail.*',
        r'Copyright.*',
        r'상단으로.*',
        r'KR\s*JP.*',
    ]
    
    cleaned = effect_text
    for pattern in cleanup_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    return cleaned

def translate_effect(text):
    """Traduit un texte d'effet coréen vers français"""
    if not text:
        return ""
    
    result = text
    
    # Dictionnaire de traduction complet - ordre important!
    translations = {
        # Expressions composées (à faire en premier)
        '상대의 이번 공격을 종료하고': "mettre fin à l'attaque adverse et",
        '이 유닛을 트래시한다': 'défausser cette unité',
        '카드를 1장 드로우한다': 'piocher 1 carte',
        '파워+2000': '+2000 puissance',
        '파워-2000': '-2000 puissance',
        '이 턴이 끝날 때까지': "jusqu'à la fin de ce tour",
        '필드에 있는': 'sur le terrain',
        '인접한 레인에 있는': 'sur une ligne adjacente',
        '다른 모든': 'toutes les autres',
        '원하는 수만큼': 'autant que vous le souhaitez',
        '같은 코스트': 'de même coût',
        '카드명이 같은': 'de même nom',
        '배치할 수 없다': 'ne peut pas être posé',
        '되돌릴 수 있다': 'peut être renvoyé',
        '반드시 공격해야 한다': 'doit attaquer si possible',
        '상대 유닛': 'unité adverse',
        '자신 유닛': 'votre unité',
        '조우 유닛': "l'unité Encounter",
        '가능하다면': 'si possible',
        
        # Termes individuels
        '디펜더': 'Defender',
        '패시브': 'Passif',
        '어태커': 'Attaquant',
        '가디언': 'Gardien',
        '엔트리': 'Entrée',
        '종결': 'Fin',
        '광전사': 'Guerrier Fou',
        '유닛': 'unité',
        '아이템': 'équipement',
        '폭풍': 'Tempête',
        '화염': 'Flamme',
        '대지': 'Terre',
        '번개': 'Foudre',
        '파동': 'Vague',
        '테트라 라인': 'Tetra Line',
        '필그림': 'Pilgrim',
        '엘리시온': 'Elysion',
        '미실리스': 'Missilis',
        '트래시': 'défausser',
        '드로우': 'piocher',
        '희생': 'sacrifice',
        '공격': 'attaque',
        '방어': 'défense',
        '선언': 'déclaration',
        '즉시': 'immédiatement',
        '골라': 'choisir',
        '하면': 'si vous le faites',
        '그러면': 'Ensuite',
        '을 가진': 'ayant',
        '장착한': 'équipé',
        '이': 'cette',
        '모든': 'toutes',
        '다른': 'autres',
    }
    
    # Appliquer les traductions par ordre de longueur décroissante
    sorted_translations = sorted(translations.items(), key=lambda x: len(x[0]), reverse=True)
    
    for ko, fr in sorted_translations:
        result = result.replace(ko, fr)
    
    # Traduire les nombres coréens en chiffres
    korean_numbers = {
        '일': '1', '이': '2', '삼': '3', '사': '4', '오': '5',
        '육': '6', '칠': '7', '팔': '8', '구': '9', '십': '10',
    }
    
    # Nettoyer espaces multiples
    result = re.sub(r'\s+', ' ', result).strip()
    
    # Capitaliser la première lettre
    if result:
        result = result[0].upper() + result[1:] if len(result) > 1 else result.upper()
    
    return result

def process_cards():
    with open('/workspace/cards.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    processed = 0
    empty = 0
    
    for card in cards:
        if 'effect' in card and card['effect']:
            cleaned = clean_and_extract_effect(card['effect'])
            
            if cleaned:
                translated = translate_effect(cleaned)
                card['effect_fr'] = translated
                processed += 1
            else:
                card['effect_fr'] = ""
                empty += 1
        else:
            card['effect_fr'] = ""
    
    with open('/workspace/cards_translated.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    
    print(f"Cartes avec effet traduit: {processed}")
    print(f"Cartes sans effet extrait: {empty}")
    print(f"Total: {len(cards)}")
    print("\nFichier sauvegardé: cards_translated.json")

if __name__ == '__main__':
    process_cards()
