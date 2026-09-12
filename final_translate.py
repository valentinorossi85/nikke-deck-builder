#!/usr/bin/env python3
import json
import re

# Dictionnaire de traduction des noms de cartes (extrait des leaders et cartes principales)
CARD_NAME_TRANSLATIONS = {
    "목단 - 화중지왕": "Peony - King of Flowers",
    "크라운 - 영화": "Crown - Movie",
    "프리바티 - 샤프 레슨": "Privaty - Sharp Lesson",
    "홍련 : 흑영 - 연화": "Crimson Lotus: Black Shadow - Lotus Flower",
    "신데렐라": "Cinderella",
    "레드 후드": "Red Hood",
    "라피": "Rapi",
    "아니스": "Anis",
    "니언": "Nian",
    "노이즈": "Noise",
    "도라": "Dora",
    "루피": "Rupee",
    "티아": "Tia",
    "라푼젤": "Rapunzel",
    "길티": "Guilty",
    "디젤": "Diesel",
    "스노우 화이트": "Snow White",
    "백조": "Swan",
    "로산나": "Rosanna",
    "모더니아": "Modernia",
    "그레이브": "Grave",
    "헬름": "Helm",
    "크라운": "Crown",
    "나가": "Naga",
    "신": "Shin",
    "마스트": "Mast",
    "리틀 머메이드": "Little Mermaid",
    "도로시": "Dorothy",
    "루드밀라": "Ludmilla",
    "소다": "Soda",
    "일레그": "iLeg",
    "슈가": "Sugar",
    "맥스웰": "Maxwell",
    "비스킷": "Biscuit",
    "코코아": "Cocoa",
    "밀크": "Milk",
    "프림": "Prim",
    "레오나": "Leona",
    "네로": "Nero",
    "페퍼": "Pepper",
    "루마니": "Rumani",
    "아인": "Ein",
    "메어리": "Mary",
    "츠바이": "Zwei",
    "폴리": "Poly",
    "이사벨": "Isabel",
    "에피넬": "Epinel",
    "키리": "Kiri",
    "네베": "Neve",
    "팬텀": "Phantom",
    "볼륨": "Volume",
    "엠마": "Emma",
    "글레링 아이즈": "Glaring Eyes",
    "마르차나": "Marchana",
    "메이든": "Maiden",
    "클레이": "Clay",
    "베이": "Bay",
    "아리아": "Aria",
    "자칼": "Jackal",
    "누아르": "Noir",
    "블랑": "Blanc",
    "와일드 투스": "Wild Tooth",
    "벨로타": "Belorta",
    "미카": "Mica",
    "앤": "Anne",
    "솔린": "Soline",
    "퀀시": "Quency",
    "얀": "Yan",
    "브리드": "Brid",
    "에테르": "Ether",
    "미하라": "Miho",
    "시그널": "Signal",
    "애드미": "Admi",
    "사쿠라": "Sakura",
    "유니": "Uni",
    "엑시아": "Exia",
    "율하": "Yulha",
    "노벨": "Novel",
    "목단": "Peony",
    "길로틴": "Guillotine",
    "니힐리스타": "Nihilista",
    "트리나": "Trina",
    "플로라": "Flora",
    "율리아": "Yulia",
    "베스티": "Besty",
    "크러스트": "Crust",
    "브래디": "Brady",
    "하란": "Harran",
    "앵커": "Anchor",
    "폴크방": "Folkvang",
    "트라토리아": "Trattoria",
    "마틸다": "Matilda",
    "마리드": "Marid",
    "에셀": "Ethel",
    "아마릴리스": "Amaryllis",
    "디아블로": "Diablo",
    "페로로": "Peroro",
    "아야": "Aya",
    "메리": "Merri",
    "미스터": "Mr.",
    "엘브": "Elve",
    "아일랜드": "Island",
    "브레이드": "Blade",
    "에이프": "Ape",
    "카메오": "Cameo",
    "클로버": "Clover",
    "마리": "Mari",
    "비트": "Bit",
    "오로라": "Aurora",
    "레이디": "Lady",
    "앨리스": "Alice",
    "린네": "Linne",
    "에이다": "Ada",
    "미리카": "Mirika",
    "클레오": "Cleo",
    "파우더": "Powder",
    "마카롱": "Macaron",
    "쇼콜라": "Chocolat",
    "크림": "Cream",
    "젤리": "Jelly",
    "푸딩": "Pudding",
    "쿠키": "Cookie",
    "캔디": "Candy",
    "도넛": "Donut",
    "케이크": "Cake",
    "홍련": "Crimson Lotus",
    "흑영": "Black Shadow",
    "화중지왕": "King of Flowers",
    "영화": "Movie",
    "샤프 레슨": "Sharp Lesson",
    "연화": "Lotus Flower",
    "네이키드 킹": "Naked King",
    "라스트 걸후드": "Last Girlhood",
    "어비스 플라워": "Abyss Flower",
    "유리 공주": "Glass Princess",
    "백스트리트 드림": "Backstreet Dream",
    "허니문 파티": "Honeymoon Party",
    "노스텔지어": "Nostalgia",
    "이스케이프 퀸": "Escape Queen",
    "윈터 오너": "Winter Owner",
    "트윙클링 바니": "Twinkling Bunny",
    "콜 미 하드보일드": "Call Me Hardboiled",
    "퍼스트 어펙션": "First Affection",
    "세컨드 어펙션": "Second Affection",
    "샤인 오브 러브": "Shine of Love",
    "톡신 래빗": "Toxin Rabbit",
    "럭셔리 래빗": "Luxury Rabbit",
    "블룸 인 서머": "Bloom in Summer",
    "스파클링 서머": "Sparkling Summer",
    "블루 오션": "Blue Ocean",
    "화이트 나이트": "White Knight",
    "이노센트 데이즈": "Innocent Days",
    "다크 로즈": "Dark Rose",
    "미드나잇 스트로베리": "Midnight Strawberry",
    "윈터 쇼퍼": "Winter Shopper",
    "선라이즈 마켓": "Sunrise Market",
    "퓨어 그레이스": "Pure Grace",
    "스쿨 데이즈": "School Days",
    "시크릿 너스": "Secret Nurse",
    "러블리 핑크": "Lovely Pink",
    "연회의 공주": "Banquet Princess",
    "펭귄 홈즈": "Penguin Holmes",
    "킬러 와이프": "Killer Wife",
    "시크 오션": "Chic Ocean",
    "비트 더 건": "Beat the Gun",
    "오피스 테라피": "Office Therapy",
    "넌센스 레드": "Nonsense Red",
    "러블리 데이트": "Lovely Date",
    "베이 갓데스": "Bay Goddess",
    "아이스 로즈": "Ice Rose",
    "윈터 슬레이어": "Winter Slayer",
    "거버먼트 노멀": "Government Normal",
    "라이터즈 스포일러": "Writer's Spoiler",
    "파이레츠 하트": "Pirate's Heart",
    "원더랜드 바니": "Wonderland Bunny",
    "피쉬 가드": "Fish Guard",
    "빌런 레이서": "Villain Racer",
    "마이티 홀리데이": "Mighty Holiday",
    "메카닉 화이트": "Mechanic White",
    "씨 오브 슬로스": "Sea of Sloth",
    "본딩 체인": "Bonding Chain",
    "흑야암행": "Black Night Secret Mission",
    "모이스트 래빗": "Moist Rabbit",
    "오션 비타민": "Ocean Vitamin",
    "이노센트 메이드": "Innocent Maid",
    "로망틱 메이드": "Romantic Maid",
    "연회의 마녀": "Banquet Witch",
    "시크릿 파티 클리너": "Secret Party Cleaner",
    "화이트 프로미스": "White Promise",
    "체리블로섬 스테이지": "Cherry Blossom Stage",
    "아크 메이지": "Arch Mage",
    "클래식 워커": "Classic Worker",
    "스트로베리 플라워": "Strawberry Flower",
    "마일드 녹턴": "Mild Nocturne",
    "언더 더 썬": "Under the Sun",
    "클래식 디바": "Classic Diva",
    "클래식 바캉스": "Classic Vacances",
    "달링 레드": "Darling Red",
    "흑묘": "Black Cat",
    "백묘": "White Cat",
}

def translate_card_name(korean_name):
    """Traduit un nom de carte du coréen vers l'anglais"""
    if not korean_name:
        return korean_name
    
    # Vérifier d'abord dans le dictionnaire exact
    if korean_name in CARD_NAME_TRANSLATIONS:
        return CARD_NAME_TRANSLATIONS[korean_name]
    
    # Traduire composant par composant
    result = korean_name
    # Trier les clés par longueur décroissante pour traduire les plus longs termes en premier
    sorted_keys = sorted(CARD_NAME_TRANSLATIONS.keys(), key=len, reverse=True)
    
    for ko in sorted_keys:
        en = CARD_NAME_TRANSLATIONS[ko]
        if ko in result:
            result = result.replace(ko, en)
    
    return result

def format_effect_text(effect):
    """Formate et améliore le texte des effets de carte"""
    if not effect:
        return effect
    
    original = effect
    
    # 1. Remplacer trash par discard
    effect = re.sub(r'\btrash\b', 'discard', effect, flags=re.IGNORECASE)
    
    # 2. Corriger les espaces manquants autour des chiffres
    effect = re.sub(r'(\d)([a-zA-Z])', r'\1 \2', effect)  # "0cost" -> "0 cost"
    effect = re.sub(r'([a-zA-Z])(\d)', r'\1 \2', effect)  # "cost0" -> "cost 0"
    
    # 3. Corriger les mots collés (camelCase involontaire)
    effect = re.sub(r'([a-z])([A-Z])', r'\1 \2', effect)  # "discardIf" -> "discard If"
    
    # 4. Améliorer la formulation spécifique
    # "choose any number of discard it" -> "choose any number and discard them"
    effect = re.sub(r'choose any number of\s+(discard it|discard them)', 
                   r'choose any number and \1', effect, flags=re.IGNORECASE)
    
    # 5. Nettoyer la ponctuation (virgules multiples)
    effect = re.sub(r',+', ',', effect)
    effect = re.sub(r',\s*,', ',', effect)
    effect = re.sub(r'\s+,', ',', effect)
    
    # 6. Ajouter des espaces après la ponctuation
    effect = re.sub(r'([,.])([A-Z])', r'\1 \2', effect)
    
    # 7. Formater les termes de jeu spécifiques
    effect = re.sub(r'\bunit Equip\b', 'Unit - Equip:', effect, flags=re.IGNORECASE)
    effect = re.sub(r'\bEncounter unit\b', 'when this unit encounters another unit', effect, flags=re.IGNORECASE)
    effect = re.sub(r'\bpower[-+]?=\s*(\d+)\b', r'power \1', effect, flags=re.IGNORECASE)
    
    # 8. Nettoyer les espaces multiples
    effect = re.sub(r'\s+', ' ', effect).strip()
    
    return effect if effect != original else effect

def main():
    # Charger le fichier JSON
    print("Chargement de cards.json...")
    with open('cards.json', 'r', encoding='utf-8') as f:
        cards = json.load(f)
    
    print(f"{len(cards)} cartes chargées.")
    
    # Traduire les cartes
    name_translated_count = 0
    effect_modified_count = 0
    
    for card in cards:
        # Traduire le nom
        old_name = card.get('name', '')
        new_name = translate_card_name(old_name)
        
        if old_name != new_name:
            card['name'] = new_name
            name_translated_count += 1
        
        # Formater l'effet
        if 'effect' in card and card['effect']:
            old_effect = card['effect']
            new_effect = format_effect_text(old_effect)
            if old_effect != new_effect:
                card['effect'] = new_effect
                effect_modified_count += 1
    
    print(f"\nStatistiques:")
    print(f"- Noms traduits: {name_translated_count}")
    print(f"- Effets améliorés: {effect_modified_count}")
    
    # Sauvegarder le fichier traduit
    with open('cards_english.json', 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
    
    print("\nFichier sauvegardé: cards_english.json")
    
    # Vérifications
    with open('cards_english.json', 'r', encoding='utf-8') as f:
        check_cards = json.load(f)
    
    trash_count = sum(1 for card in check_cards if 'trash' in card.get('effect', '').lower())
    discard_count = sum(1 for card in check_cards if 'discard' in card.get('effect', '').lower())
    
    print(f"\nVérification finale:")
    print(f"- Occurrences de 'trash': {trash_count}")
    print(f"- Occurrences de 'discard': {discard_count}")
    
    # Afficher quelques exemples
    print("\nExemples de cartes traduites:")
    for i, card in enumerate(check_cards[:3]):
        print(f"\n{card['id']} - {card['name']}")
        if card.get('effect'):
            print(f"  Effet: {card['effect'][:100]}...")

if __name__ == '__main__':
    main()
