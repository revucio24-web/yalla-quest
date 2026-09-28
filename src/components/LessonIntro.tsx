import { useMemo, useState } from 'react';
import type { Lesson } from '../types';
import { maybeWord } from '../lib/content';
import { stopAudio } from '../lib/audio';
import { ArabicWord, AudioButton, Button, ProgressBar } from './ui';
import { WordIllustration } from './WordIllustration';

export function LessonIntro({ lesson, sound, onStart, onExit }: { lesson: Lesson; sound: boolean; onStart: () => void; onExit: () => void }) {
  const known = useMemo(() => lesson.wordIds.filter((id) => maybeWord(id)), [lesson.wordIds]);
  const [index, setIndex] = useState(0);
  const entry = maybeWord(known[index] ?? '');
  if (!entry) return <section className="lesson-screen page-enter"><div className="lesson-topbar"><button className="icon-close" onClick={onExit} aria-label="Lektion verlassen">×</button><div className="lesson-progress"><span>Entdecken</span><ProgressBar value={0} label="Wörter kennenlernen" /></div></div><div className="intro-stage"><div className="intro-title"><span className="eyebrow">{lesson.title}</span><h1>Diese Lektion braucht noch Inhalt</h1><p>Zu einem der Wörter fehlt der Eintrag. Dein Fortschritt bleibt erhalten.</p></div><div className="intro-actions"><Button onClick={() => { stopAudio(); onExit(); }}>Zurück zur Weltkarte</Button></div></div></section>;
  return <section className="lesson-screen page-enter"><div className="lesson-topbar"><button className="icon-close" onClick={onExit} aria-label="Lektion verlassen">×</button><div className="lesson-progress"><span>Entdecken · Wort {index + 1} von {known.length}</span><ProgressBar value={(index + 1) / known.length * 100} label="Wörter kennenlernen" /></div></div><div className="intro-stage"><div className="intro-title"><span className="eyebrow">{lesson.title}</span><h1>Erst entdecken, dann spielen</h1><p>Schau dir das Wort an. Höre es und sprich es nach.</p></div><div className="learning-card" key={entry.id}><WordIllustration entry={entry} /><ArabicWord arabic={entry.arabic} german={entry.german} reading={entry.transliteration} size="large" /><div className="learning-audio"><span><AudioButton arabic={entry.arabic} audio={entry.audio} enabled={sound} />Anhören</span><span><AudioButton arabic={entry.arabic} audio={entry.audio} enabled={sound} slow label="Langsam anhören" />Langsam</span></div>{!sound && <p className="muted">Der Ton ist ausgeschaltet. Du kannst auch ohne Ton lernen.</p>}</div><div className="intro-actions"><Button variant="secondary" disabled={index === 0} onClick={() => { stopAudio(); setIndex((value) => value - 1); }}>Zurück</Button><Button onClick={() => { stopAudio(); if (index + 1 === known.length) onStart(); else setIndex((value) => value + 1); }}>{index + 1 === known.length ? 'Jetzt spielen →' : 'Nächstes Wort →'}</Button></div></div></section>;
}

export function LessonWords({ lesson, sound }: { lesson: Lesson; sound: boolean }) {
  const entries = lesson.wordIds.flatMap((id) => { const entry = maybeWord(id); return entry ? [entry] : []; });
  return <section className="result-words"><h2>Deine Wörter aus dieser Lektion</h2><div>{entries.map((entry) => <div key={entry.id}><WordIllustration entry={entry} /><ArabicWord arabic={entry.arabic} german={entry.german} /><AudioButton arabic={entry.arabic} audio={entry.audio} enabled={sound} /></div>)}</div></section>;
}
