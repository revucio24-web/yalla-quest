import rawManifest from '../data/audio-manifest.json';
import { assetUrl } from './assets';

const manifest: Record<string, string> = rawManifest;
let currentAudio: HTMLAudioElement | null = null;
let playbackId = 0;

export function stopAudio(): void {
  playbackId++;
  const audio = currentAudio;
  currentAudio = null;
  audio?.pause();
  audio?.removeAttribute('src');
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function arabicVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null;
  return window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ar')) ?? null;
}

// Browser liefern die Stimmenliste erst nach dem Event 'voiceschanged'.
// Ohne dieses Warten schlägt der erste Klick auf ein Wort ohne lokale Datei fehl.
function waitForArabicVoice(timeoutMs = 1500): Promise<SpeechSynthesisVoice | null> {
  const immediate = arabicVoice();
  if (immediate) return Promise.resolve(immediate);
  if (!('speechSynthesis' in window) || typeof window.addEventListener !== 'function') return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener('voiceschanged', finish);
      window.clearTimeout(timer);
      resolve(arabicVoice());
    };
    const timer = window.setTimeout(finish, timeoutMs);
    window.addEventListener('voiceschanged', finish);
  });
}

export async function playArabic(arabic: string, enabled: boolean, audioPath?: string, slow = false): Promise<boolean> {
  if (!enabled) return false;
  stopAudio();
  const request = playbackId;
  const path = audioPath ?? manifest[arabic];
  if (path) {
    const audio = new Audio(assetUrl(path));
    audio.playbackRate = slow ? 0.75 : 1;
    audio.preservesPitch = true;
    currentAudio = audio;
    try {
      await audio.play();
      if (request !== playbackId) { audio.pause(); return false; }
      return true;
    } catch {
      if (currentAudio === audio) currentAudio = null;
      if (request !== playbackId) return false;
    }
  }
  const voice = await waitForArabicVoice();
  if (request !== playbackId) return false;
  if (!voice) return false;
  const utterance = new SpeechSynthesisUtterance(arabic);
  utterance.lang = voice.lang;
  utterance.rate = slow ? 0.6 : 0.85;
  utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
  return true;
}
