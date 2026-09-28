import { defineConfig, type Plugin } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const CSP_META = /<meta http-equiv="Content-Security-Policy"[^>]*>/i;

// Die Content-Security-Policy aus index.html gilt auch im Dev-Server. Dort
// injectt Vite Inline-Skripte und eine WebSocket-Verbindung fuer Hot Reload,
// die eine strenge CSP blockieren wuerde. Im Dev wird sie deshalb entfernt,
// im Produktionsbuild bleibt sie zusammen mit _headers und vercel.json aktiv.
function dropCspInDev(): Plugin {
  return {
    name: 'yalla-quest-csp-drop-in-dev',
    apply: 'serve',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(CSP_META, ''),
    },
  };
}

export default defineConfig(({ mode }) => {
  // GitHub Pages liefert das Spiel unter /yalla-quest/ aus, die anderen
  // kostenlosen Hoster unter der Wurzel. BASE_PATH steuert das ohne Aenderung
  // am Code, standardmaessig gilt die Wurzel. loadEnv mit leerem Praefix
  // liefert auch Variablen ohne VITE_-Vorspann und braucht kein process.
  const env = loadEnv(mode, '.', '');
  const base = (env.BASE_PATH ?? '/').replace(/\/*$/, '/');

  return {
    base,
    plugins: [react(), dropCspInDev()],
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  };
});
