# Yalla Quest

**Spielen. Entdecken. Arabisch lernen.** Ein lokales Web-Lernspiel für deutschsprachige Kinder von etwa 7 bis 12 Jahren.

## Was schon spielbar ist

- Profilstart mit Spitzname und Avatar
- fünf Welten mit 30 kurzen Lektionen und 104 Einträgen auf Modernem Hocharabisch
- sechs Aufgabenarten: Symbol wählen, Hören/Lesen, Zuordnen, Buchstaben erkennen, Wörter bauen und Gegenstände per Ziehen oder Tippen sammeln
- Weltkarte mit nacheinander freigeschalteten Lektionen
- XP, Level, Sterne, Wortfortschritt und Abzeichen
- Buchstaben-Akademie, Sammlung, Stadt und Einstellungen
- lokale Speicherung ohne Konto, Werbung oder Tracking
- Layout für Smartphone, Tablet und Desktop; arabische Schrift wird mit RTL-Markierung angezeigt

Die ersten beiden Lektionen heißen **Hallo!** und **Mein Name**. In „Mein Zuhause“ öffnet sich beim Bau von **باب** eine Tür.

## Technik

React, TypeScript und Vite. Die statische App benötigt im Betrieb keinen Server und keine kostenpflichtige API. Vite hält den Build für ein reines Browser-Spiel einfach und eignet sich direkt für statisches Hosting.

## Lokal starten

Node.js 20 oder neuer und pnpm werden empfohlen.

```bash
pnpm install
pnpm dev
```

Anschließend die angezeigte lokale Adresse öffnen. Für die Produktionsprüfung:

```bash
pnpm build
pnpm test
pnpm lint
```

`dev` und `preview` binden bewusst nur an `127.0.0.1`. Mit `--host 0.0.0.0` wäre der Dev-Server im ganzen Netzwerk erreichbar; das ist für eine lokale Entwicklung nicht nötig.

Der fertige statische Build liegt in `dist/`.

## Veröffentlichen

- **Vercel:** Repository importieren, Framework „Vite“ wählen, Build-Befehl `pnpm build`, Ausgabeverzeichnis `dist`.
- **Cloudflare Pages:** Repository verbinden, Build-Befehl `pnpm build`, Build-Ausgabeverzeichnis `dist`.

Es sind keine Umgebungsvariablen nötig. Die App wurde lokal gebaut und geprüft; eine Veröffentlichung ist noch nicht erfolgt.

Die Sicherheits-Header liegen bereits bei: `vercel.json` und `public/_headers` (wird nach `dist/` kopiert). Zusätzlich trägt `index.html` eine `Content-Security-Policy` als `<meta>`, falls ein Hoster keine Header-Konfiguration auswertet. Beim Dev-Server entfernt ein kleines Plugin aus `vite.config.ts` diese Meta-Angabe, weil Vite dort Inline-Skripte und eine WebSocket-Verbindung für Hot Reload lädt, die eine strenge CSP blockieren würde.

## Inhalte erweitern

Die editierbaren Daten liegen in `src/data/`:

- `vocabulary.json`: ID, Welt, arabische und deutsche Schreibweise, Lesehilfe, Symbol und optionaler Audio-Pfad
- `lessons.json`: Reihenfolge, Titel und Aufgaben pro Lektion
- `worlds.json`: Weltkarte und Gebäude

Die Dateistruktur und die TypeScript-Typen stehen in `src/types.ts`. Eine neue Welt braucht einen Eintrag in `worlds.json`, zugehörige Wörter in `vocabulary.json` und Lektionen in `lessons.json`. Die Lektion-Engine liest die Aufgabenliste und zeigt die passende Spielart. `scripts/generate_content.py` erzeugte die ersten Daten und kann sie erneut aufbauen; es überschreibt dabei die drei JSON-Dateien. Für normale redaktionelle Änderungen die JSON-Dateien direkt bearbeiten.

Beide Skripte überschreiben beim Neubau die eingecheckten Daten. Wird nur `vocabulary.json` neu aufgebaut, gehen die `audio`-Felder verloren, weil sie aus `audio-manifest.json` stammen. Deshalb gilt feste Reihenfolge:

```bash
python scripts/generate_content.py   # baut die drei JSON-Dateien neu auf
python scripts/generate_audio.py     # ergänzt audio-manifest.json, vocabulary.json und die mp3-Dateien
```

`generate_content.py` meldet am Ende, für welche Wörter kein Ton hinterlegt ist. Danach `generate_audio.py` laufen lassen und `generate_content.py` erneut, damit die Felder wieder gefüllt sind.

## Audio

Für ein Wort kann im JSON ein Pfad wie `/audio/vocabulary/kitab.mp3` ergänzt werden; die Datei gehört dann nach `public/audio/vocabulary/`. `generate_audio.py` erzeugt die Dateien mit `edge-tts` und legt sie zusätzlich für alle 28 Beispielwörter der Buchstaben-Akademie an.

Ohne lokale Datei versucht die App die arabische Browser-Sprachausgabe. Browser liefern die Stimmenliste erst nach dem Ereignis `voiceschanged`; die App wartet darauf, damit der erste Klick auf ein Wort nicht fälschlich als „Ton nicht verfügbar" endet. Falls auf dem Gerät keine arabische Stimme vorhanden ist oder der Ton ausgeschaltet wurde, bleibt das Wort sichtbar und jede Aufgabe lösbar. Für eine öffentliche Fassung sollten geprüfte lokale Aufnahmen ergänzt werden.

## Datenschutz und Spielstände

Der Spielstand liegt versioniert im `localStorage` des Browsers. Es gibt keine Anmeldung und keine Übertragung persönlicher Daten. Unter Einstellungen lässt sich der Spielstand nach Bestätigung zurücksetzen. Wenn ein Browser das Speichern blockiert, bleibt die aktuelle Sitzung spielbar.

## Redaktioneller Stand

Die arabischen Wörter sind als erster Lerninhalt angelegt. Vor Veröffentlichung sollten arabische Schreibweise, Aussprache, Lesehilfen und didaktische Reihenfolge von einer sprachkundigen Person geprüft werden. Emojis sind austauschbare Symbole; für die endgültige Veröffentlichung können sie durch ein einheitliches illustriertes Asset-Set ersetzt werden.
