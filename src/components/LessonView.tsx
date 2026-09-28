import { useEffect, useRef, useState } from 'react';
import type { Lesson, LessonTask } from '../types';
import type { TaskOutcome } from '../lib/progress';
import { maybeWord, word } from '../lib/content';
import { playArabic, stopAudio } from '../lib/audio';
import { MASCOT_URL } from '../lib/assets';
import { ArabicWord, AudioButton, Button, ProgressBar } from './ui';
import { countCap, shuffle, reviewTasks } from '../lib/learning';
import { LessonIntro } from './LessonIntro';
import { WordIllustration } from './WordIllustration';

interface Props {
  lesson: Lesson;
  sound: boolean;
  onExit: () => void;
  onFinish: (outcomes: TaskOutcome[]) => void;
}

function firstLetter(arabic: string) {
  return Array.from(arabic)[0];
}

function TaskCard({ task, sound, onSolved }: { task: LessonTask; sound: boolean; onSolved: (attempts: number) => void }) {
  const target = word(task.wordId);
  const [options] = useState(() => shuffle((task.options ?? []).map(word)));
  const [germanPairs] = useState(() => shuffle(options.slice(0, 3).map((entry) => entry.id)));
  const [letterOrder] = useState(() => shuffle(Array.from(target.arabic).map((_, index) => index)));
  const [letterCandidates] = useState(() => shuffle([...new Set([firstLetter(target.arabic), ...(task.options ?? []).map((id) => firstLetter(word(id).arabic)), 'ب', 'م', 'س', 'ك'])].slice(0, 4)));
  const solvedRef = useRef(false);
  const [attempts, setAttempts] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [selectedArabic, setSelectedArabic] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [built, setBuilt] = useState<number[]>([]);
  const [basket, setBasket] = useState(0);
  const [dragging, setDragging] = useState(false);

  const mistake = () => {
    setAttempts((value) => value + 1);
    setFeedback('Fast! Versuch es noch einmal.');
  };
  const success = () => {
    if (solvedRef.current) return;
    solvedRef.current = true;
    setFeedback('Mumtaz! ممتاز · Sehr gut!');
    onSolved(attempts);
  };
  const choose = (id: string) => id === target.id ? success() : mistake();

  useEffect(() => {
    if (task.type === 'audio-choice' && sound) {
      const timer = window.setTimeout(() => playArabic(target.arabic, true, target.audio), 450);
      return () => { window.clearTimeout(timer); stopAudio(); };
    }
  }, [task.type, target.arabic, target.audio, sound]);

  if (task.type === 'matching') {
    const pairIds = options.slice(0, 3).map((entry) => entry.id);
    const shuffledGerman = germanPairs;
    return <div className="task-content">
      <div className="task-heading"><span className="eyebrow">Wörter verbinden</span><h2>Was gehört zusammen?</h2><p>Tippe zuerst auf ein arabisches Wort und dann auf die Bedeutung.</p></div>
      <div className="matching-grid">
        <div className="matching-column">{pairIds.map((id) => <button key={id} type="button" className={`match-tile arabic-script ${selectedArabic === id ? 'is-selected' : ''} ${matched.includes(id) ? 'is-matched' : ''}`} disabled={matched.includes(id)} onClick={() => setSelectedArabic(id)} lang="ar" dir="rtl">{word(id).arabic}</button>)}</div>
        <div className="matching-column">{shuffledGerman.map((id) => <button key={id} type="button" className={`match-tile ${matched.includes(id) ? 'is-matched' : ''}`} disabled={matched.includes(id)} onClick={() => {
          if (!selectedArabic) { setFeedback('Wähle zuerst ein arabisches Wort.'); return; }
          if (selectedArabic !== id) { mistake(); return; }
          const next = [...matched, id];
          setMatched(next);
          setSelectedArabic(null);
          setFeedback('Richtig verbunden!');
          if (next.length === pairIds.length) success();
        }}>{word(id).german}</button>)}</div>
      </div>
      <p className="task-feedback" role="status">{feedback}</p>
    </div>;
  }

  if (task.type === 'word-builder') {
    const letters = Array.from(target.arabic);
    const order = letterOrder;
    return <div className="task-content">
      <div className="task-heading"><span className="eyebrow">Wort bauen</span><h2>Baue das Wort für „{target.german}“</h2><p>Tippe die Buchstaben in der richtigen Reihenfolge an.</p></div>
      <div className="word-builder-answer arabic-script" lang="ar" dir="rtl" aria-label="Deine Antwort">{built.length ? built.map((index) => letters[index]).join('') : <span className="answer-placeholder">_ _ _</span>}</div>
      <div className="letter-tiles" dir="rtl">{order.map((index) => <button key={index} type="button" className="letter-tile arabic-script" lang="ar" aria-label={`Buchstabe ${letters[index]} wählen`} disabled={built.includes(index)} onClick={() => setBuilt((current) => [...current, index])}>{letters[index]}</button>)}</div>
      {target.id === 'home-door' && <div className={`door-scene ${feedback.startsWith('Mumtaz') ? 'is-open' : ''}`} aria-label={feedback.startsWith('Mumtaz') ? 'Die Tür öffnet sich' : 'Die Tür ist geschlossen'}><div className="door-frame"><div className="door-panel"><span /></div></div></div>}
      <div className="task-actions"><Button variant="secondary" onClick={() => setBuilt([])}>Zurücksetzen</Button><Button disabled={built.length !== letters.length} onClick={() => {
        if (built.map((index) => letters[index]).join('') === target.arabic) success();
        else { mistake(); setBuilt([]); }
      }}>Prüfen</Button></div>
      <p className="task-feedback" role="status">{feedback}</p>
    </div>;
  }

  if (task.type === 'count') {
    const goal = task.count ?? 2;
    const cap = countCap(goal);
    const arabicCount = goal === 2 ? 'اثنان' : 'ثلاثة';
    return <div className="task-content">
      <div className="task-heading"><span className="eyebrow">Sammel-Mission</span><h2>Lege „{target.german}“ {goal}-mal in den Korb</h2><p><span lang="ar" dir="rtl" className="arabic-script">{arabicCount}</span> bedeutet {goal}. Ziehe das Symbol oder tippe darauf.</p></div>
      <button className="collect-item" type="button" draggable onDragStart={(event) => { event.dataTransfer.setData('text/plain', target.id); setDragging(true); }} onDragEnd={() => setDragging(false)} onClick={() => setBasket((current) => Math.min(cap, current + 1))} aria-label={`${target.german} in den Korb legen`}>{target.icon}<span>Antippen oder ziehen</span></button>
      <div className={`basket ${dragging ? 'basket--ready' : ''}`} role="group" aria-label={`Korb mit ${basket} von ${goal} Symbolen`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setDragging(false); if (event.dataTransfer.getData('text/plain') === target.id) setBasket((current) => Math.min(cap, current + 1)); }}>
        <span className="basket-visual" aria-hidden="true">🧺</span><span className="basket-items" aria-hidden="true">{Array.from({ length: basket }, (_, index) => <span key={index}>{target.icon}</span>)}</span><span className="basket-count" role="status">{basket} / {goal}</span>
      </div>
      <div className="task-actions"><Button variant="secondary" onClick={() => setBasket((current) => Math.max(0, current - 1))} disabled={basket === 0}>Eins herausnehmen</Button><Button onClick={() => basket === goal ? success() : mistake()}>Prüfen</Button></div>
      <p className="task-feedback" role="status">{feedback}</p>
    </div>;
  }

  if (task.type === 'letter-choice') {
    const correctLetter = firstLetter(target.arabic);
    const candidates = letterCandidates;
    return <div className="task-content">
      <div className="task-heading"><span className="eyebrow">Buchstaben-Spürnase</span><h2>Welcher Buchstabe steht am Anfang?</h2><div className="prompt-word"><ArabicWord arabic={target.arabic} german={target.german} size="large" /><AudioButton arabic={target.arabic} audio={target.audio} enabled={sound} /></div></div>
      <div className="answer-grid answer-grid--letters">{candidates.map((letter) => <button key={letter} type="button" className="answer-card answer-card--letter arabic-script" lang="ar" dir="rtl" onClick={() => letter === correctLetter ? success() : mistake()}>{letter}</button>)}</div>
      <p className="task-feedback" role="status">{feedback}</p>
    </div>;
  }

  if (task.type === 'scene-choice') return <div className="task-content"><div className="task-heading"><span className="eyebrow">Faris' Zuhause-Mission</span><h2>{task.prompt}</h2><p>Tippe auf das passende Bild oder Wort.</p></div><div className={`room-scene ${solvedRef.current ? 'mission-done' : ''} room-scene--${target.id}`}><div className="room-window" /><img className="room-faris" src={MASCOT_URL} alt="Faris im Zimmer" /><div className="room-options">{options.map((entry) => <button key={entry.id} className="scene-item" onClick={() => choose(entry.id)}><WordIllustration entry={entry} /><span className="arabic-script" lang="ar" dir="rtl">{entry.arabic}</span><small>{entry.german}</small></button>)}</div></div><p className="task-feedback" role="status">{solvedRef.current ? task.successText : feedback}</p></div>;

  const isAudio = task.type === 'audio-choice';
  return <div className="task-content">
    <div className="task-heading"><span className="eyebrow">{isAudio ? 'Hör genau hin' : 'Bild auswählen'}</span><h2>{isAudio ? 'Was bedeutet dieses Wort?' : 'Welches Symbol passt?'}</h2><div className="prompt-word"><ArabicWord arabic={target.arabic} size="large" /><AudioButton arabic={target.arabic} audio={target.audio} enabled={sound} label="Wort erneut anhören" /></div><p>{isAudio ? 'Höre zu oder lies das Wort und wähle die Bedeutung.' : 'Wähle das passende Symbol zum arabischen Wort.'}</p></div>
    <div className="answer-grid">{options.map((entry) => <button key={entry.id} type="button" className="answer-card" onClick={() => choose(entry.id)}><WordIllustration entry={entry} /><span>{entry.german}</span></button>)}</div>
    <p className="task-feedback" role="status">{feedback}</p>
  </div>;
}

export function LessonView({ lesson, sound, onExit, onFinish }: Props) {
  const [phase, setPhase] = useState<'intro' | 'play' | 'review'>('intro');
  const [index, setIndex] = useState(0);
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([]);
  const [ready, setReady] = useState(false);
  const [reviews, setReviews] = useState<LessonTask[]>([]);
  const tasks = phase === 'review' ? reviews : lesson.tasks;
  const task = tasks[index];
  const current = task ? maybeWord(task.wordId) : undefined;
  useEffect(() => () => stopAudio(), []);

  const solved = (attempts: number) => {
    if (ready) return;
    if (phase === 'play' && task) setOutcomes((currentOutcomes) => [...currentOutcomes, { wordId: task.wordId, wordIds: task.type === 'matching' ? task.options : undefined, attempts }]);
    setReady(true);
  };

  if (phase === 'intro') return <LessonIntro lesson={lesson} sound={sound} onStart={() => setPhase('play')} onExit={() => { stopAudio(); onExit(); }} />;

  const advance = () => {
    stopAudio();
    if (index + 1 < tasks.length) { setIndex((value) => value + 1); setReady(false); return; }
    if (phase === 'play') {
      const difficult = outcomes.filter((outcome) => outcome.attempts > 1).flatMap((outcome) => outcome.wordIds ?? [outcome.wordId]);
      const practice = reviewTasks(lesson.tasks, difficult);
      if (practice.length) { setReviews(practice); setIndex(0); setReady(false); setPhase('review'); return; }
    }
    onFinish(outcomes);
  };

  return <section className="lesson-screen page-enter">
    <div className="lesson-topbar"><button className="icon-close" onClick={() => { stopAudio(); onExit(); }} aria-label="Lektion verlassen">×</button><div className="lesson-progress"><span>{phase === 'review' ? 'Noch einmal üben' : 'Aufgabe'} {index + 1} von {tasks.length}</span><ProgressBar value={((index + (ready ? 1 : 0)) / tasks.length) * 100} label="Lektionsfortschritt" /></div><span className="lesson-star">✦ {lesson.title}</span></div>
    {lesson.world === 'home' && <div className="home-journey" aria-label="Faris kommt dem Haus näher"><span>Start</span><div><img src={MASCOT_URL} alt="" style={{ left: `${(index + (ready ? 1 : 0)) / tasks.length * 85}%` }} /></div><span>⌂</span></div>}
    <div className="lesson-stage"><div className="lesson-faris"><img src={MASCOT_URL} alt="Faris, dein Wüstenfuchs" /><span>{phase === 'review' ? 'Diese Wörter schauen wir uns noch einmal an. Ganz in Ruhe!' : 'Yalla! Hilf mir bei meinem Abenteuer!'}</span></div><div className="task-panel">{!current ? <div className="task-content"><div className="task-heading"><span className="eyebrow">Inhalt fehlt</span><h2>Diese Aufgabe ist gerade nicht da</h2><p>Im Lerninhalt fehlt ein Wort zu Aufgabe {index + 1}. Der bisherige Fortschritt bleibt erhalten.</p></div><div className="task-actions"><Button onClick={() => { stopAudio(); onExit(); }}>Zurück zur Weltkarte</Button></div></div> : <><fieldset className="task-lock" disabled={ready}><legend className="visually-hidden">Aufgabe {index + 1} von {tasks.length}</legend><TaskCard key={`${lesson.id}-${phase}-${index}`} task={task} sound={sound} onSolved={solved} /></fieldset><details className="word-help"><summary>Wort noch einmal ansehen</summary><ArabicWord arabic={current.arabic} german={current.german} reading={current.transliteration} /><AudioButton arabic={current.arabic} audio={current.audio} enabled={sound} /></details>{ready && <Button className="advance-button" onClick={advance}>{index === tasks.length - 1 ? phase === 'review' ? 'Ergebnis ansehen' : 'Lektion abschließen' : 'Weiter zur nächsten Aufgabe'} <span aria-hidden="true">→</span></Button>}</>}</div></div>
  </section>;
}
