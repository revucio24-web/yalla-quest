"""Prepare local Arabic speech assets. Requires edge-tts only during authoring."""
import asyncio
import hashlib
import json
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICE = 'ar-SA-HamedNeural'
# Zusaetzlich zu den Vokabeln die Beispielwoerter der Buchstaben-Akademie
# (zweiter Eintrag in content.ts), damit dort jedes Wort lokalen Ton hat.
ALPHABET_EXAMPLES = ['أب', 'باب', 'تمر', 'ثعلب', 'جمل', 'حليب', 'خبز', 'دفتر',
                     'ذهب', 'رمل', 'زهرة', 'سماء', 'شمس', 'صحراء', 'ضوء', 'طائر',
                     'ظل', 'عائلة', 'غرفة', 'فم', 'قلم', 'كتاب', 'ليل', 'ماء',
                     'نهر', 'هلال', 'ورقة', 'يد']

async def main():
    data_path = ROOT / 'src/data/vocabulary.json'
    words = json.loads(data_path.read_text(encoding='utf-8'))
    missing_examples = [example for example in ALPHABET_EXAMPLES if example not in {word['arabic'] for word in words}]
    if missing_examples:
        print('Warnung: Alphabet-Beispiele fehlen in vocabulary.json und haben daher keinen Ton: '
              + ', '.join(missing_examples))
    texts = list(dict.fromkeys([word['arabic'] for word in words] + ALPHABET_EXAMPLES))
    folder = ROOT / 'public/audio/vocabulary'
    folder.mkdir(parents=True, exist_ok=True)
    semaphore = asyncio.Semaphore(3)
    manifest = {}

    async def generate(text):
        filename = hashlib.sha256(text.encode()).hexdigest()[:16] + '.mp3'
        path = folder / filename
        async with semaphore:
            if not path.exists() or path.stat().st_size < 1000:
                for attempt in range(3):
                    try:
                        await edge_tts.Communicate(text.replace('...', ''), VOICE, rate='-15%').save(str(path))
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2)
            manifest[text] = '/audio/vocabulary/' + filename
            print(f'{len(manifest)}/{len(texts)} ready', flush=True)

    await asyncio.gather(*(generate(text) for text in texts))
    for word in words:
        word['audio'] = manifest[word['arabic']]
    data_path.write_text(json.dumps(words, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'src/data/audio-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (ROOT / 'public/audio/README.txt').write_text('Arabic synthetic speech, generated with edge-tts. Voice: ' + VOICE + '\nNo runtime speech service is required for these assets. Native-speaker editorial review is still recommended.\n', encoding='utf-8')
    unused = sorted(set(manifest) - {word['arabic'] for word in words})
    print(f'{len(manifest)} Dateien erzeugt, davon {len(unused)} nur fuer die Buchstaben-Akademie.')

asyncio.run(main())
