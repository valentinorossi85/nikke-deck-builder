import requests

url = "http://nivelarena.co.kr/skin/board/card_list_new/get_more_list.php"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'http://nivelarena.co.kr/bbs/board.php?bo_table=cardlists'
}

data = {
    'bo_table': 'cardlists',
    'sca': '',
    'sop': 'and',
    'wr_1': '',
    'wr_2': '',
    'wr_3': '',
    'wr_5': '',
    'wr_8': '',
    'wr_10': '',
    'wk': 'card',
    'sfl': 'wr_subject||wr_content||ca_name||wr_1||wr_2||wr_3||wr_4||wr_5||wr_6||wr_7||wr_8||wr_11',
    'stx': '',
    'page': '1'
}

response = requests.post(url, data=data, headers=headers)

# Sauvegarder le HTML brut
with open('page1_raw.html', 'w', encoding='utf-8') as f:
    f.write(response.text)

print(f"HTML sauvegarde dans page1_raw.html ({len(response.text)} caracteres)")
print(f"Contient '225x315': {'225x315' in response.text}")
print(f"Premiers 2000 caracteres:")
print(response.text[:2000])