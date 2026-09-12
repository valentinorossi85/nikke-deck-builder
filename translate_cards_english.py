#!/usr/bin/env python3
import json
import re

def clean_and_extract_effect(text):
    """Extract only the useful effect text from scraped content"""
    if not text:
        return ""
    
    # Look for "효과" (effect) section and extract content after
    effect_patterns = [
        r'효과\s*\n?\s*(.+?)\s*제품 선택',
        r'효과\s*\n?\s*(.+?)\s*제품명',
        r'효과\s*\n?\s*(.+?)\s*IP\s*',
    ]
    
    effect_text = ""
    for pattern in effect_patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            effect_text = match.group(1).strip()
            break
    
    if not effect_text:
        return ""
    
    # Clean effect text from residues
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
    """Translate Korean effect text to English"""
    if not text:
        return ""
    
    result = text
    
    # Translation dictionary - order matters!
    translations = {
        # Composite expressions (do these first)
        '상대의 이번 공격을 종료하고': "end the opponent's current attack and",
        '이 유닛을 트래시한다': 'trash this unit',
        '카드를 1 장 드로우한다': 'draw 1 card',
        '파워+2000': '+2000 power',
        '파워-2000': '-2000 power',
        '이 턴이 끝날 때까지': 'until the end of this turn',
        '필드에 있는': 'on the field',
        '인접한 레인에 있는': 'in an adjacent lane',
        '다른 모든': 'all other',
        '원하는 수만큼': 'any number',
        '같은 코스트': 'same cost',
        '카드명이 같은': 'same card name',
        '배치할 수 없다': 'cannot be placed',
        '되돌릴 수 있다': 'can be returned',
        '반드시 공격해야 한다': 'must attack if possible',
        '상대 유닛': 'opponent unit',
        '자신 유닛': 'your unit',
        '조우 유닛': "Encounter unit",
        '가능하다면': 'if possible',
        
        # Individual terms
        '디펜더': 'Defender',
        '패시브': 'Passive',
        '어태커': 'Attacker',
        '가디언': 'Guardian',
        '엔트리': 'Entry',
        '종결': 'End',
        '광전사': 'Berserker',
        '유닛': 'unit',
        '아이템': 'item',
        '폭풍': 'Storm',
        '화염': 'Flame',
        '대지': 'Earth',
        '번개': 'Lightning',
        '파동': 'Wave',
        '테트라 라인': 'Tetra Line',
        '필그림': 'Pilgrim',
        '엘리시온': 'Elysion',
        '미실리스': 'Missilis',
        '트래시': 'trash',
        '드로우': 'draw',
        '희생': 'Sacrifice',
        '공격': 'attack',
        '방어': 'defense',
        '선언': 'declaration',
        '즉시': 'immediately',
        '골라': 'choose',
        '하면': 'if you do',
        '그러면': 'Then',
        '을 가진': 'with',
        '장착한': 'equipped',
        '이': 'this',
        '모든': 'all',
        '다른': 'other',
    }
    
    # Apply translations in descending length order
    sorted_translations = sorted(translations.items(), key=lambda x: len(x[0]), reverse=True)
    
    for ko, en in sorted_translations:
        result = result.replace(ko, en)
    
    # Clean up multiple spaces
    result = re.sub(r'\s+', ' ', result).strip()
    
    # Capitalize first letter
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
                card['effect_en'] = translated
                processed += 1
            else:
                card['effect_en'] = ""
                empty += 1
        else:
            card['effect_en'] = ""
    
    with open('/workspace/cards_translated_en.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    
    print(f"Cards with translated effect: {processed}")
    print(f"Cards without extracted effect: {empty}")
    print(f"Total: {len(cards)}")
    print("\nFile saved: cards_translated_en.json")

if __name__ == '__main__':
    process_cards()
