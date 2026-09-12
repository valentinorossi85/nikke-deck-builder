#!/usr/bin/env python3
import json
import re

# Dictionnaire de traduction pour les termes récurrents du jeu
KEYWORD_TRANSLATIONS = {
    # Keywords
    "디펜더": "Defender",
    "패시브": "Passif",
    "어태커": "Attaquant",
    "가디언": "Gardien",
    "엔트리": "Entrée",
    "종결": "Fin",
    "광전사": "Guerrier Fou",
    
    # Types et attributs
    "유닛": "Unité",
    "아이템": "Équipement",
    "폭풍": "Tempête",
    "화염": "Flamme",
    "대지": "Terre",
    "번개": "Foudre",
    "파동": "Vague",
    
    # Affiliations
    "테트라 라인": "Tetra Line",
    "필그림": "Pèlerin",
    "엘리시온": "Elysion",
    "미실리스": "Missilis",
    
    # Termes de jeu
    "코스트": "Coût",
    "파워": "Puissance",
    "히트": "Hit",
    "레어도": "Rareté",
    "소속": "Affiliation",
    "이펙트": "Effet",
    "키워드": "Mot-clé",
    "효과": "Effet",
    "트래시": "Défausser",
    "드로우": "Piocher",
    "희생": "Sacrifice",
    "인접한 레인": "ligne adjacente",
    "상대 유닛": "unité adverse",
    "자신 유닛": "votre unité",
    "공격": "attaque",
    "방어": "défense",
    "선언": "déclaration",
    "즉시": "immédiatement",
    "상대의 이번 공격을 종료": "mettre fin à l'attaque adverse",
    "필드": "terrain",
    "카드": "carte",
    "장": "",
    "골라": "choisir",
    "원하는 수만큼": "autant que vous le souhaitez",
    "원하는 장": "autant de cartes que vous le souhaitez",
    "이 턴이 끝날 때까지": "jusqu'à la fin de ce tour",
    "같은 코스트": "même coût",
    "카드명이 같은": "même nom de carte",
    "배치할 수 없다": "ne peut pas être joué",
    "되돌릴 수 있다": "peut être renvoyé",
    "하면": "si vous faites",
    "그러면": "Ensuite",
    "카드를 1장 드로우한다": "piochez 1 carte",
    "파워+2000": "+2000 Puissance",
    "파워-2000": "-2000 Puissance",
    "모든": "toutes",
    "다른": "autres",
    "있는": "présent sur",
    "장착한": "équipé",
    "조우 유닛": "unité Encounter",
    "반드시 공격해야 한다": "doit attaquer si possible",
    "가능하다면": "si possible",
}

def clean_effect_text(text):
    """Nettoie le texte d'effet en retirant le bruit du scraping"""
    if not text:
        return ""
    
    # Retirer les éléments de navigation répétitifs
    patterns_to_remove = [
        r'니벨아레나 NivelArena',
        r'플레이\s*-\s*카드 레이아웃',
        r'-\s*종류 및 유형',
        r'-\s*플레이 영역',
        r'-\s*게임 플레이',
        r'제품안내',
        r'-\s*스타터 덱',
        r'-\s*부스터 팩',
        r'-\s*기타 제품',
        r'-\s*취급 점포',
        r'공식정보',
        r'-\s*공지사항',
        r'-\s*규칙',
        r'-\s*Q&A',
        r'카드정보',
        r'-\s*입상자 덱 리스트',
        r'-\s*추천 덱 리스트',
        r'-\s*카드 검색',
        r'KR\s*JP',
        r'페이지 정보',
        r'작성자\s*니벨아레나',
        r'댓글\s*댓글 \d+건',
        r'조회\s*Hit \d+회',
        r'작성일\s*Date [\d\-]+\s+\d+:\d+',
        r'제품 선택\s*니벨아레나 프로모션',
        r'제품명\s*[^\n]+',
        r'IP\s*[^\n]+',
        r'목\s*록',
        r'(이전글|다음글)[^\n]+',
        r'\d+\.\d+\.\d+',
        r'댓글\s*\d+\s*댓글목록',
        r'등록된 댓글이 없습니다\.',
        r'주식회사 젬블로컴퍼니.*',
        r'대표이사 오준원',
        r'사업자등록번호 [\d\-]+',
        r'경기도 하남시.*',
        r'CS문의\s*[\d\-]+',
        r'E-mail\s*develop@gemblo\.com',
        r'Copyright ⓒ GEMBLO COMPANY Inc\. All Rights Reserved\.',
        r'상단으로',
        r'카드 검색',
    ]
    
    cleaned = text
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # Nettoyer les espaces multiples
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Extraire seulement la partie effet utile
    # Chercher après "효과" (effet) jusqu'à la fin du texte utile
    effet_match = re.search(r'효과(.+?)(?:제품 선택|$)', cleaned, re.DOTALL)
    if effet_match:
        cleaned = effet_match.group(1).strip()
    
    return cleaned

def translate_korean_to_french(text):
    """Traduit le texte coréen vers le français"""
    if not text:
        return ""
    
    result = text
    
    # Appliquer les traductions connues
    for ko, fr in KEYWORD_TRANSLATIONS.items():
        result = result.replace(ko, fr)
    
    # Traduction des nombres coréens courants
    number_map = {
        '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
        '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
    }
    
    # Nettoyage final
    result = re.sub(r'\s+', ' ', result).strip()
    result = result.replace(' .', '.').replace(' ,', ',')
    
    return result

def process_cards():
    # Charger les cartes
    with open('/workspace/cards.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    processed_count = 0
    for card in cards:
        if 'effect' in card and card['effect']:
            # Nettoyer l'effet
            cleaned = clean_effect_text(card['effect'])
            
            # Traduire
            if cleaned:
                translated = translate_korean_to_french(cleaned)
                card['effect_fr'] = translated
                processed_count += 1
    
    # Sauvegarder
    with open('/workspace/cards_translated.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    
    print(f"Cartes traitées: {processed_count}/{len(cards)}")
    print("Fichier sauvegardé: cards_translated.json")

if __name__ == '__main__':
    process_cards()
