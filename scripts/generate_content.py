"""Generate the editable starter curriculum from a compact reviewed word list.

The generated JSON is checked in and read directly by the game. Edit the JSON
for ordinary content changes; run this script only to rebuild the starter set.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "data"
DATA.mkdir(parents=True, exist_ok=True)

WORLDS = [
    dict(id="home", title="Zuhause", subtitle="Deine Reise beginnt", icon="⌂", color="#ed7e5e", building="Haus"),
    dict(id="oasis", title="Oase", subtitle="Natur und Farben", icon="✿", color="#31a69b", building="Oase"),
    dict(id="market", title="Markt", subtitle="Essen und Zahlen", icon="◈", color="#eda74b", building="Markt"),
    dict(id="school", title="Schule", subtitle="Wörter entdecken", icon="✎", color="#6b91ce", building="Schule"),
    dict(id="desert", title="Wüste", subtitle="Ein großes Abenteuer", icon="✦", color="#bd8bcd", building="Wüstenzelt"),
]

# id | Arabic (Modern Standard Arabic) | German | simple reading aid | symbol
RAW = {
    "home": """
hello|مرحبا|Hallo|marhaban|👋
thanks|شكرا|Danke|schukran|🙏
yes|نعم|Ja|na'am|✅
no|لا|Nein|la|❌
name|اسم|Name|ism|🪪
your_name|ما اسمك؟|Wie heißt du?|ma ismuk|❔
my_name|اسمي ...|Ich heiße ...|ismi|🗣️
friend|صديق|Freund|sadiq|🤝
house|بيت|Haus|bait|🏠
door|باب|Tür|bab|🚪
window|نافذة|Fenster|nafidha|🪟
table|طاولة|Tisch|tawila|🍽️
bed|سرير|Bett|sarir|🛏️
water|ماء|Wasser|ma'|💧
mother|أم|Mutter|umm|👩
father|أب|Vater|ab|👨
brother|أخ|Bruder|ach|👦
sister|أخت|Schwester|ucht|👧
family|عائلة|Familie|a'ila|👨‍👩‍👧
room|غرفة|Zimmer|ghurfa|🚪
chair|كرسي|Stuhl|kursi|🪑
lamp|مصباح|Lampe|misbah|💡
kitchen|مطبخ|Küche|matbach|🍳
garden|حديقة|Garten|hadiqa|🌷
""",
    "oasis": """
sun|شمس|Sonne|schams|☀️
moon|قمر|Mond|qamar|🌙
tree|شجرة|Baum|schadschara|🌳
sky|سماء|Himmel|sama'|☁️
earth|أرض|Erde|ard|🌍
river|نهر|Fluss|nahr|🏞️
sea|بحر|Meer|bahr|🌊
flower|زهرة|Blume|zahra|🌸
leaf|ورقة|Blatt|waraqa|🍃
grass|عشب|Gras|uschb|🌱
green|أخضر|Grün|achdar|🟢
blue|أزرق|Blau|azraq|🔵
yellow|أصفر|Gelb|asfar|🟡
red|أحمر|Rot|ahmar|🔴
white|أبيض|Weiß|abjad|⚪
black|أسود|Schwarz|aswad|⚫
rain|مطر|Regen|matar|🌧️
cloud|سحابة|Wolke|sahaba|☁️
stone|حجر|Stein|hadschar|🪨
mountain|جبل|Berg|dschabal|⛰️
""",
    "market": """
apple|تفاحة|Apfel|tuffaha|🍎
banana|موزة|Banane|mawza|🍌
orange|برتقالة|Orange|burtuqala|🍊
date|تمرة|Dattel|tamra|🌴
bread|خبز|Brot|chubz|🍞
milk|حليب|Milch|halib|🥛
juice|عصير|Saft|asir|🧃
cheese|جبن|Käse|dschubn|🧀
egg|بيضة|Ei|baida|🥚
fish|سمك|Fisch|samak|🐟
rice|أرز|Reis|aruzz|🍚
salt|ملح|Salz|milh|🧂
sugar|سكر|Zucker|sukkar|🍬
one|واحد|Eins|wahid|1️⃣
two|اثنان|Zwei|ithnan|2️⃣
three|ثلاثة|Drei|thalatha|3️⃣
four|أربعة|Vier|arba'a|4️⃣
five|خمسة|Fünf|chamsa|5️⃣
market|سوق|Markt|suq|🛍️
basket|سلة|Korb|salla|🧺
""",
    "school": """
school|مدرسة|Schule|madrasa|🏫
book|كتاب|Buch|kitab|📚
pen|قلم|Stift|qalam|🖊️
notebook|دفتر|Heft|daftar|📓
bag|حقيبة|Tasche|haqiba|🎒
teacher_m|معلم|Lehrer|mu'allim|👨‍🏫
teacher_f|معلمة|Lehrerin|mu'allima|👩‍🏫
student_m|طالب|Schüler|talib|👦
student_f|طالبة|Schülerin|taliba|👧
lesson|درس|Unterricht|dars|📖
question|سؤال|Frage|su'al|❔
answer|جواب|Antwort|dschawab|💬
letter|حرف|Buchstabe|harf|🔤
word|كلمة|Wort|kalima|📝
number|عدد|Zahl|adad|🔢
page|صفحة|Seite|safha|📄
board|لوحة|Tafel|lawha|📋
ruler|مسطرة|Lineal|mistara|📏
eraser|ممحاة|Radiergummi|mimha|🧽
desk|مكتب|Schreibtisch|maktab|🪑
""",
    "desert": """
desert|صحراء|Wüste|sahra'|🏜️
sand|رمل|Sand|raml|🏖️
camel|جمل|Kamel|dschamal|🐪
fox|ثعلب|Fuchs|tha'lab|🦊
bird|طائر|Vogel|ta'ir|🐦
star|نجمة|Stern|nadschma|⭐
road|طريق|Weg|tariq|🛤️
tent|خيمة|Zelt|chaima|⛺
night|ليل|Nacht|lail|🌌
day|نهار|Tag|nahar|🌄
east|شرق|Osten|scharq|➡️
west|غرب|Westen|gharb|⬅️
north|شمال|Norden|schamal|⬆️
south|جنوب|Süden|dschanub|⬇️
big|كبير|Groß|kabir|🐘
small|صغير|Klein|saghir|🐜
fast|سريع|Schnell|sari'|⚡
slow|بطيء|Langsam|bati'|🐢
far|بعيد|Weit|ba'id|🔭
near|قريب|Nah|qarib|📍
""",
}

TITLES = {
    "home": ["Hallo!", "Mein Name", "Mein Zuhause", "Meine Familie", "Im Zimmer", "Zuhause gemeistert"],
    "oasis": ["Himmel und Sonne", "Am Wasser", "Pflanzenwelt", "Bunte Oase", "Wetter und Wolken", "Oasen-Abenteuer"],
    "market": ["Obststand", "Frühstück", "Leckere Sachen", "Zahlen bis drei", "Zahlen bis fünf", "Markt-Mission"],
    "school": ["In der Schule", "Meine Tasche", "Alle lernen", "Fragen und Antworten", "Wörter und Zahlen", "Schul-Mission"],
    "desert": ["Sand und Kamel", "Unter den Sternen", "Durch die Wüste", "Wohin geht's?", "Groß oder klein?", "Wüsten-Abenteuer"],
}

GROUP_SIZES = [4, 4, 3, 3, 3, 3]
COUNTABLE = {"house", "door", "window", "bed", "chair", "lamp", "tree", "flower", "stone", "apple", "banana", "orange", "bread", "egg", "fish", "book", "pen", "notebook", "bag", "ruler", "camel", "fox", "bird", "star", "tent"}

vocabulary = []
lessons = []
audio_manifest_path = DATA / 'audio-manifest.json'
audio_manifest = json.loads(audio_manifest_path.read_text(encoding='utf-8')) if audio_manifest_path.exists() else {}
MISSIONS = [
    ('home-hello', 'Faris wartet vor dem Haus. Begrüße ihn!', 'Faris winkt zurück. Willkommen!'),
    ('home-my_name', 'Faris möchte dich kennenlernen. Wie stellst du dich vor?', 'Jetzt kennt Faris dich. Euer Abenteuer beginnt!'),
    ('home-window', 'Lass die Sonne herein. Finde das Fenster!', 'Das Fenster öffnet sich und Sonnenlicht fällt ins Zimmer.'),
    ('home-water', 'Faris hat Durst. Bringe ihm Wasser!', 'Faris trinkt einen Schluck. Danke!'),
    ('home-family', 'Alle sind da! Finde das Wort für Familie.', 'Die Familie kommt zusammen. Schön, dass du da bist!'),
    ('home-lamp', 'Es wird dunkel. Finde die Lampe und schalte sie ein!', 'Das Licht geht an. Du hast die Zuhause-Welt geschafft!'),
]
for world in WORLDS:
    wid = world["id"]
    rows = [line.split("|") for line in RAW[wid].strip().splitlines()]
    assert len(rows) == (24 if wid == 'home' else 20), (wid, len(rows))
    ids = []
    for short_id, arabic, german, reading, icon in rows:
        word_id = f"{wid}-{short_id}"
        ids.append(word_id)
        entry = dict(id=word_id, world=wid, arabic=arabic, german=german, transliteration=reading, icon=icon)
        if arabic in audio_manifest:
            entry['audio'] = audio_manifest[arabic]
        vocabulary.append(entry)
    cursor = 0
    for n, size in enumerate([4] * 6 if wid == 'home' else GROUP_SIZES):
        group = ids[cursor:cursor + size]
        cursor += size
        short = [item.split("-", 1)[1] for item in group]
        count_word = next((item for item in group if item.split("-", 1)[1] in COUNTABLE), None)
        shortest = next((item for item in group if item == 'home-door'), None) or min(group, key=lambda item: len(next(v["arabic"] for v in vocabulary if v["id"] == item)))
        tasks = [
            dict(type="image-choice", wordId=group[0], options=group),
            dict(type="audio-choice", wordId=group[1], options=group),
            dict(type="matching", wordId=group[2], options=group[:3]),
            dict(type="letter-choice", wordId=group[0], options=group),
            dict(type="word-builder", wordId=shortest),
            dict(type="count", wordId=count_word, count=2 + n % 2) if count_word else dict(type="image-choice", wordId=group[-1], options=group),
        ]
        if wid == 'home':
            target, prompt, success = MISSIONS[n]
            tasks[-1] = dict(type='scene-choice', wordId=target, options=group, prompt=prompt, successText=success)
        lessons.append(dict(id=f"{wid}-{n + 1:02d}", world=wid, title=TITLES[wid][n], subtitle=f"{size} neue Wörter · 6 Aufgaben", wordIds=group, tasks=tasks))

assert len(vocabulary) == 104 and len(lessons) == 30
assert len({word["id"] for word in vocabulary}) == 104
# Ohne Eintrag im Manifest verliert ein Wort sein 'audio'-Feld und faellt zur
# Laufzeit auf die Browsersprache zurueck. Das wird hier sichtbar gemeldet.
without_audio = [word["id"] for word in vocabulary if "audio" not in word]
if without_audio:
    print("Hinweis: kein lokaler Ton fuer " + ", ".join(without_audio))
    print("Zuerst scripts/generate_audio.py ausfuehren, dann dieses Skript erneut.")
for filename, data in (("worlds.json", WORLDS), ("vocabulary.json", vocabulary), ("lessons.json", lessons)):
    (DATA / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
