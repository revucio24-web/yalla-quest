# Yalla Quest

**Spielen. Entdecken. Arabisch lernen.** Ein lokales Web-Lernspiel für deutschsprachige Kinder von etwa 7 bis 12 Jahren.

Jetzt kostenlos online: **<https://revucio24-web.github.io/yalla-quest/>**

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

Node.js 20 oder neuer und pnpm werden empfohlen. pnpm ist nicht bei Node.js dabei; einmalig holen:

```bash
corepack enable pnpm
```

```bash
pnpm install
pnpm dev
```

Alternativ funktioniert auch `npm install` und `npm run dev`, dann greift allerdings `package-lock.json` statt `pnpm-lock.yaml`.

Anschließend die angezeigte lokale Adresse öffnen. Für die Produktionsprüfung:

```bash
pnpm build
pnpm test
pnpm lint
```

`dev` und `preview` binden bewusst nur an `127.0.0.1`. Mit `--host 0.0.0.0` wäre der Dev-Server im ganzen Netzwerk erreichbar; das ist für eine lokale Entwicklung nicht nötig.

Der fertige statische Build liegt in `dist/`.

## Veröffentlichen

Das Spiel ist kostenlos veröffentlicht unter:

**<https://revucio24-web.github.io/yalla-quest/>**

### GitHub Pages (aktuell genutzt)

Das Repository <https://github.com/revucio24-web/yalla-quest> ist öffentlich. Jeder Push auf `main` baut die App in GitHub Actions, prüft Typen und Tests und veröffentlicht das Ergebnis. Die Einrichtung steckt vollständig in `.github/workflows/deploy.yml`; manuell starten lässt sich der Lauf über den Reiter „Actions“.

GitHub Pages liefert das Spiel unter `/yalla-quest/` aus, also nicht an der Domainwurzel. Deshalb setzt der Workflow `BASE_PATH=/yalla-quest/`, und `vite.config.ts` leitet den Wert an Vites `base` weiter. Wichtig dabei: Vite ergänzt `base` nur bei statischen Importen. Die Laufzeitpfade aus `public/` (Maskottchen und alle Audiodateien) stehen als Zeichenketten in den JSON-Daten, deshalb löst `src/lib/assets.ts` sie zur Laufzeit über `import.meta.env.BASE_URL` auf. Ohne diesen Helfer liefe auf GitHub Pages jedes Audio ins Leere, während der Build auf der lokalen Vorschau noch fehlerfrei wirkt.

### Andere kostenlose Hoster

Bei Hoster, die an der Domainwurzel ausliefern, bleibt `BASE_PATH` leer:

- **Vercel:** Repository importieren, Framework „Vite“ wählen, Build-Befehl `pnpm build`, Ausgabeverzeichnis `dist`. Die Header liegen in `vercel.json`.
- **Cloudflare Pages:** Repository verbinden, Build-Befehl `pnpm build`, Build-Ausgabeverzeichnis `dist`. Die Header liegen in `public/_headers` und werden mit nach `dist/` kopiert.
- **Netlify:** Repository verbinden, Build-Befehl `pnpm build`, Verzeichnis `dist`, `public/_headers` wird ausgewertet.

Es sind keine Umgebungsvariablen und keine Geheimnisse nötig. Aktions-Minuten sind für öffentliche Repositories unbegrenzt kostenlos.

Die Sicherheits-Header liegen bereits bei: `vercel.json` und `public/_headers` (wird nach `dist/` kopiert). Zusätzlich trägt `index.html` eine `Content-Security-Policy` als `<meta>`. Das ist auf GitHub Pages der einzige wirksame Weg, weil Pages keine eigenen Header auswertet. Beim Dev-Server entfernt ein kleines Plugin aus `vite.config.ts` diese Meta-Angabe, weil Vite dort Inline-Skripte und eine WebSocket-Verbindung für Hot Reload lädt, die eine strenge CSP blockieren würde.

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
