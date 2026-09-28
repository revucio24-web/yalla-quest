// Laufzeitpfade auf Dateien aus public/.
//
// Vite schreibt den base-Wert nur in statische Importpfade. Die Pfade in
// vocabulary.json und audio-manifest.json stehen aber als Zeichenketten im
// Quelltext, zum Beispiel "/audio/vocabulary/x.mp3". Ohne diesen Helfer
// liefe der Ton auf GitHub Pages unter /yalla-quest/ ins Leere, weil der
// Browser "/audio/..." an der Domainwurzel sucht.
//
// BASE_URL wird von Vite aus base gesetzt und endet immer auf "/".
const BASE_URL = (import.meta.env?.BASE_URL ?? '/').replace(/\/*$/, '/');

// Erkennt echte externe Quellen: "https://host", "http://host" oder
// "//host". Eine Pfad mit drei oder mehr Schraegstriche ist dagegen kein
// Protokoll, sondern ein kaputter relativer Pfad und wird normalisiert.
const ABSOLUTE = /^(?:[a-z][a-z\d+.-]*:)?\/\/[^/]/i;

/** Setzt einen Pfad aus public/ unter den angegebenen Basispfad. */
export function joinBase(base: string, path: string): string {
  if (!path) return '';
  if (ABSOLUTE.test(path) || path.startsWith('data:')) return path;
  return base.replace(/\/*$/, '/') + path.replace(/^\/+/, '');
}

/** Haengt den konfigurierten Basispfad an einen Pfad aus public/ an. */
export function assetUrl(path: string | null | undefined): string {
  return joinBase(BASE_URL, path ?? '');
}

/** Faris liegt in public/characters und wird an mehreren Stellen geladen. */
export const MASCOT_URL = assetUrl('/characters/faris.svg');
