import { useEffect, useMemo, useState } from 'react';
import { LessonView } from './components/LessonView';
import { LessonWords } from './components/LessonIntro';
import { WordIllustration } from './components/WordIllustration';
import { ArabicWord, AudioButton, Button, ProgressBar } from './components/ui';
import { AVATARS, alphabet, maybeWorld, vocabulary, worldLessons, worlds } from './lib/content';
import { stopAudio } from './lib/audio';
import { MASCOT_URL } from './lib/assets';
import { calculateReward, completeLesson, createProgress, lessonUnlocked, levelForXp, levelProgress, loadProgress, nextLesson, saveProgress, worldUnlocked } from './lib/progress';
import type { TaskOutcome } from './lib/progress';
import type { Lesson, PlayerProgress, WorldId } from './types';

type Screen = 'home' | 'map' | 'academy' | 'city' | 'collection' | 'profile' | 'settings' | 'onboarding' | 'lesson' | 'result';
const DEFAULT_AVATAR = AVATARS[0];

function getAchievements(progress: PlayerProgress) {
  const learned = Object.keys(progress.words).length;
  return [
    { icon: '🌟', title: 'Erste Schritte', text: 'Erste Lektion abgeschlossen', earned: progress.completedLessons.length >= 1 },
    { icon: '🔎', title: 'Wortentdecker', text: '10 Wörter gelernt', earned: learned >= 10 },
    { icon: '📚', title: 'Leseratte', text: '10 Lektionen abgeschlossen', earned: progress.completedLessons.length >= 10 },
    { icon: '🏠', title: 'Zuhause-Profi', text: 'Zuhause abgeschlossen', earned: worldLessons('home').every((lesson) => progress.completedLessons.includes(lesson.id)) },
    { icon: '💫', title: 'Sternensammler', text: '25 Sterne gesammelt', earned: Object.values(progress.stars).reduce((sum, count) => sum + count, 0) >= 25 },
  ];
}

function ProfileEditor({ progress, onSave }: { progress: PlayerProgress; onSave: (name: string, avatar: string) => void }) {
  const [name, setName] = useState(progress.nickname);
  const [chosenAvatar, setChosenAvatar] = useState(progress.avatar);
  return <section className="profile-editor page-enter"><div><span className="eyebrow">Dein Abenteuer, dein Stil</span><h2>Profil bearbeiten</h2></div><div className="profile-editor-fields"><label htmlFor="edit-nickname">Spitzname<input id="edit-nickname" className="text-input" value={name} maxLength={20} onChange={(event) => setName(event.target.value)} /></label><div><span className="field-label">Avatar wählen</span><div className="avatar-grid">{AVATARS.map((item) => <button key={item} type="button" className={`avatar-option ${chosenAvatar === item ? 'is-selected' : ''}`} aria-label={`Avatar ${item} auswählen`} aria-pressed={chosenAvatar === item} onClick={() => setChosenAvatar(item)}>{item}</button>)}</div></div></div><Button disabled={!name.trim()} onClick={() => onSave(name.trim(), chosenAvatar)}>Änderungen speichern</Button></section>;
}

function App() {
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress);
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedWorld, setSelectedWorld] = useState<WorldId>('home');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [result, setResult] = useState<{ lesson: Lesson; xp: number; stars: number; first: boolean } | null>(null);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string>(DEFAULT_AVATAR);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(0);
  const [letterAnswer, setLetterAnswer] = useState<string | null>(null);
  const [collectionTab, setCollectionTab] = useState<'words' | 'awards'>('words');

  useEffect(() => { saveProgress(progress); }, [progress]);
  useEffect(() => { document.documentElement.classList.toggle('reduce-motion', !progress.settings.motion); }, [progress.settings.motion]);
  const next = nextLesson(progress);
  const level = levelForXp(progress.xp);
  const levelBar = levelProgress(progress.xp);
  const totalStars = Object.values(progress.stars).reduce((sum, value) => sum + value, 0);
  const learnedWords = useMemo(() => vocabulary.filter((entry) => progress.words[entry.id]), [progress.words]);
  const achievements = getAchievements(progress);

  const navigate = (destination: Screen) => { stopAudio(); setScreen(destination); window.scrollTo(0, 0); };
  const startLesson = (lesson: Lesson) => {
    if (!lessonUnlocked(progress, lesson)) return;
    if (!progress.nickname) { setActiveLesson(lesson); navigate('onboarding'); return; }
    setActiveLesson(lesson);
    navigate('lesson');
  };
  const startNext = () => next ? startLesson(next) : navigate('map');
  const finishLesson = (outcomes: TaskOutcome[]) => {
    if (!activeLesson) return;
    const reward = calculateReward(outcomes);
    const first = !progress.completedLessons.includes(activeLesson.id);
    setProgress((current) => completeLesson(current, activeLesson, outcomes));
    setResult({ lesson: activeLesson, xp: first ? reward.xp : 0, stars: reward.stars, first });
    navigate('result');
  };

  const navItems: { id: Screen; icon: string; label: string }[] = [
    { id: 'home', icon: '⌂', label: 'Start' }, { id: 'map', icon: '◇', label: 'Karte' },
    { id: 'academy', icon: 'ب', label: 'ABC' }, { id: 'city', icon: '▣', label: 'Stadt' },
    { id: 'collection', icon: '✦', label: 'Sammlung' }, { id: 'profile', icon: '☺', label: 'Profil' },
  ];

  return <div className="app-shell">
    {screen !== 'lesson' && screen !== 'onboarding' && screen !== 'result' && <aside className="sidebar">
      <button className="brand" onClick={() => navigate('home')} aria-label="Yalla Quest Startseite"><span className="brand-mark">✦</span><span><strong>Yalla Quest</strong><small>Arabisch entdecken</small></span></button>
      <nav className="sidebar-nav" aria-label="Hauptnavigation">{navItems.map((item) => <button key={item.id} className={`nav-link ${screen === item.id || screen === 'settings' && item.id === 'profile' ? 'is-active' : ''}`} onClick={() => navigate(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="sidebar-mascot"><img src={MASCOT_URL} alt="" /><p>Jedes Wort ist ein neuer Schatz!</p></div>
      <div className="sidebar-foot">Spielen. Entdecken. Arabisch lernen.</div>
    </aside>}

    <main className={`main-content ${screen === 'lesson' || screen === 'onboarding' || screen === 'result' ? 'main-content--full' : ''}`}>
      {screen !== 'lesson' && screen !== 'onboarding' && screen !== 'result' && <header className="topbar"><div className="mobile-brand"><span>✦</span> Yalla Quest</div><div className="topbar-stats"><span className="stat-pill">✦ <strong>{totalStars}</strong></span><span className="stat-pill">⚡ <strong>{progress.xp} XP</strong></span><span className="profile-pill">{progress.avatar} <span>{progress.nickname || 'Entdecker'}</span></span></div></header>}

      {screen === 'home' && <div className="page page-enter">
        <section className="hero"><div className="hero-decor hero-decor--one" /><div className="hero-decor hero-decor--two" /><div className="hero-copy"><span className="hero-kicker">✦ Dein Arabisch-Abenteuer</span><h1>Marhaban!<br /><em>{progress.nickname ? `Hallo, ${progress.nickname}!` : 'Die Reise beginnt.'}</em></h1><p>Entdecke neue Welten, sammle Sterne und lerne jeden Tag ein bisschen Arabisch.</p><Button className="hero-cta" onClick={startNext}>{next ? progress.completedLessons.length ? 'Weiterlernen' : 'Abenteuer starten' : 'Weltkarte ansehen'} <span aria-hidden="true">→</span></Button></div><div className="hero-art"><div className="hero-sun" /><div className="hero-hill hero-hill--back" /><div className="hero-hill hero-hill--front" /><img src={MASCOT_URL} alt="Faris der Wüstenfuchs winkt" /><span className="hero-spark hero-spark--one">✦</span><span className="hero-spark hero-spark--two">✧</span></div></section>
        <div className="section-heading"><div><span className="eyebrow">Dein Abenteuer</span><h2>Hier geht's weiter</h2></div><button className="text-link" onClick={() => navigate('map')}>Alle Welten ansehen →</button></div>
        <div className="dashboard-grid"><section className="feature-card continue-card"><div className="feature-icon">{worlds.find((entry) => entry.id === next?.world)?.icon ?? '✦'}</div><span className="eyebrow">Nächste Lektion</span><h3>{next?.title ?? 'Alle Lektionen geschafft!'}</h3><p>{next ? `${worlds.find((entry) => entry.id === next.world)?.title} · 6 kurze Aufgaben` : 'Du bist ein echter Wortentdecker. Spiele deine Lieblingslektionen noch einmal.'}</p><Button onClick={startNext}>{next ? 'Lektion starten' : 'Zur Weltkarte'} →</Button></section>
          <section className="feature-card level-card"><div className="level-card-head"><span className="eyebrow">Dein Fortschritt</span><span className="level-bubble">{level}</span></div><h3>Level {level}</h3><p>Jedes neue Wort bringt dich weiter!</p><ProgressBar value={levelBar.percent} label={levelBar.isMax ? 'Höchste Stufe erreicht' : 'Fortschritt zum nächsten Level'} /><div className="progress-caption"><span>{progress.xp} XP</span><span>{levelBar.isMax ? 'Höchstes Level' : `${levelBar.next} XP`}</span></div><div className="level-stats"><span><strong>{progress.completedLessons.length}</strong> Lektionen</span><span><strong>{learnedWords.length}</strong> Wörter</span></div></section></div>
        <div className="section-heading"><div><span className="eyebrow">Weltenreise</span><h2>Wohin geht es heute?</h2></div></div><div className="world-preview-grid">{worlds.slice(0, 3).map((worldItem, index) => <button key={worldItem.id} className={`world-preview ${!worldUnlocked(progress, worldItem.id) ? 'is-locked' : ''}`} style={{ '--world-color': worldItem.color } as React.CSSProperties} onClick={() => { setSelectedWorld(worldItem.id); navigate('map'); }}><span className="world-preview-icon">{worldItem.icon}</span><span className="world-preview-copy"><strong>{worldItem.title}</strong><small>{worldItem.subtitle}</small></span><span className="world-preview-number">0{index + 1}</span></button>)}</div>
      </div>}

      {screen === 'onboarding' && <div className="onboarding page-enter"><div className="onboarding-card"><div className="onboarding-mascot"><img src={MASCOT_URL} alt="Faris der Wüstenfuchs" /></div><span className="eyebrow">Willkommen bei Yalla Quest</span><h1>Wie darf Faris dich nennen?</h1><p>Such dir einen Namen und einen Begleiter aus. Du kannst beides später ändern.</p><label className="field-label" htmlFor="nickname">Dein Spitzname</label><input id="nickname" className="text-input" value={nickname} onChange={(event) => setNickname(event.target.value.slice(0, 20))} placeholder="Zum Beispiel: Sami" maxLength={20} autoComplete="off" /><span className="field-label">Dein Avatar</span><div className="avatar-grid">{AVATARS.map((item) => <button key={item} type="button" className={`avatar-option ${avatar === item ? 'is-selected' : ''}`} aria-label={`Avatar ${item} auswählen`} aria-pressed={avatar === item} onClick={() => setAvatar(item)}>{item}</button>)}</div><Button className="onboarding-submit" disabled={!nickname.trim()} onClick={() => { setProgress((current) => ({ ...current, nickname: nickname.trim(), avatar })); navigate('lesson'); }}>Los geht's →</Button><button className="quiet-link" onClick={() => navigate('home')}>Zurück zur Startseite</button></div></div>}

      {screen === 'lesson' && activeLesson && <LessonView key={activeLesson.id} lesson={activeLesson} sound={progress.settings.sound} onExit={() => navigate('map')} onFinish={finishLesson} />}

      {screen === 'result' && result && <div className="result-screen page-enter"><div className="result-card"><div className="result-confetti" aria-hidden="true">✦ ✧ ✦</div><img src={MASCOT_URL} alt="Faris freut sich" /><span className="eyebrow">Lektion geschafft!</span><h1>Mumtaz, {progress.nickname}!</h1><p>Du hast „{result.lesson.title}“ gemeistert.</p><div className="result-stars" aria-label={`${result.stars} von 3 Sternen`}>{[1, 2, 3].map((index) => <span key={index} className={index <= result.stars ? 'earned' : ''}>★</span>)}</div><div className="result-reward"><span>⚡ {result.xp ? `+${result.xp} XP` : 'Wiederholt!'}</span><span>✦ {result.stars} Sterne</span></div><LessonWords lesson={result.lesson} sound={progress.settings.sound} /><Button onClick={() => { const upcoming = nextLesson(progress); if (upcoming) startLesson(upcoming); else navigate('map'); }}>{next ? 'Nächste Lektion' : 'Zur Weltkarte'} →</Button><Button variant="secondary" onClick={() => navigate('map')}>Zur Weltkarte</Button></div></div>}

      {screen === 'map' && <div className="page page-enter"><div className="page-heading"><span className="eyebrow">Die Reise</span><h1>Deine Weltkarte</h1><p>Jede Welt steckt voller neuer Wörter und kleiner Abenteuer.</p></div><div className="map-layout"><div className="map-canvas"><div className="map-sun">☀</div><div className="map-path" aria-hidden="true" />{worlds.map((worldItem, index) => { const unlocked = worldUnlocked(progress, worldItem.id); const finished = worldLessons(worldItem.id).filter((lesson) => progress.completedLessons.includes(lesson.id)).length; return <button key={worldItem.id} type="button" className={`map-node map-node--${index} ${selectedWorld === worldItem.id ? 'is-selected' : ''} ${unlocked ? '' : 'is-locked'}`} style={{ '--world-color': worldItem.color } as React.CSSProperties} onClick={() => setSelectedWorld(worldItem.id)} aria-label={`${worldItem.title}, ${unlocked ? `${finished} von 6 Lektionen` : 'gesperrt'}`}><span className="map-node-icon">{worldItem.icon}</span><strong>{worldItem.title}</strong><small>{unlocked ? `${finished}/6` : '🔒'}</small></button>; })}<div className="map-dune map-dune--one" /><div className="map-dune map-dune--two" /></div><div className="map-detail">{(() => { const item = maybeWorld(selectedWorld); if (!item) return <div className="locked-message"><span>🔒</span><h3>Diese Welt gibt es nicht (mehr)</h3><p>Wähle links eine Welt aus.</p></div>; const previous = worlds[worlds.indexOf(item) - 1]; const unlocked = worldUnlocked(progress, item.id); const entries = worldLessons(item.id); const completed = entries.filter((lesson) => progress.completedLessons.includes(lesson.id)).length; return <><div className="map-detail-header" style={{ '--world-color': item.color } as React.CSSProperties}><span className="map-detail-icon">{item.icon}</span><div><span className="eyebrow">Welt {worlds.indexOf(item) + 1} von 5</span><h2>{item.title}</h2><p>{item.subtitle}</p></div></div>{unlocked ? <><div className="map-progress"><span>{completed} von 6 Lektionen geschafft</span><ProgressBar value={completed / 6 * 100} label={`${item.title} Fortschritt`} /></div><div className="lesson-list">{entries.map((lesson, index) => { const available = lessonUnlocked(progress, lesson); const done = progress.completedLessons.includes(lesson.id); return <button key={lesson.id} className={`lesson-row ${!available ? 'is-locked' : ''}`} disabled={!available} onClick={() => startLesson(lesson)}><span className="lesson-row-number">{done ? '✓' : index + 1}</span><span><strong>{lesson.title}</strong><small>{lesson.subtitle}</small></span><span className="lesson-row-right">{done ? `${'★'.repeat(progress.stars[lesson.id] ?? 0)}` : available ? '→' : '🔒'}</span></button>; })}</div></> : <div className="locked-message"><span>🔒</span><h3>Diese Welt wartet auf dich!</h3><p>Schließe zuerst alle Lektionen in „{previous?.title ?? 'der vorherigen Welt'}“ ab.</p>{previous && <Button onClick={() => setSelectedWorld(previous.id)}>Zur vorherigen Welt</Button>}</div>}</>; })()}</div></div></div>}

      {screen === 'academy' && <div className="page page-enter"><div className="page-heading"><span className="eyebrow">Buchstaben-Akademie</span><h1>Das arabische Alphabet</h1><p>28 Buchstaben, viele spannende Wörter. Tippe einen Buchstaben an und höre ihn.</p></div><div className="academy-layout"><div className="alphabet-grid">{alphabet.map(([letter, name], index) => <button key={letter} className={`alphabet-tile ${selectedLetter === index ? 'is-selected' : ''}`} onClick={() => { setSelectedLetter(index); setLetterAnswer(null); }} aria-label={`${name} auswählen`}><span lang="ar" dir="rtl" className="arabic-script">{letter}</span><small>{name}</small></button>)}</div><div className="letter-detail"><span className="eyebrow">Buchstabe {selectedLetter + 1} von 28</span><div className="letter-large arabic-script" lang="ar" dir="rtl">{alphabet[selectedLetter][0]}</div><h2>{alphabet[selectedLetter][1]}</h2><p>So sieht dieser Buchstabe aus. Entdecke ihn im Wort:</p><div className="letter-example"><ArabicWord arabic={alphabet[selectedLetter][2]} size="large" /><AudioButton arabic={alphabet[selectedLetter][2]} enabled={progress.settings.sound} /></div><div className="letter-mini-game"><strong>Mini-Aufgabe</strong><p>Finde {alphabet[selectedLetter][0]} noch einmal:</p><div className="letter-mini-options">{[alphabet[selectedLetter][0], alphabet[(selectedLetter + 3) % alphabet.length][0], alphabet[(selectedLetter + 7) % alphabet.length][0]].reverse().map((letter) => <button key={letter} className="arabic-script" lang="ar" onClick={() => setLetterAnswer(letter)}>{letter}</button>)}</div><span role="status">{letterAnswer ? letterAnswer === alphabet[selectedLetter][0] ? 'Mumtaz! Richtig gefunden.' : 'Versuch es noch einmal.' : ' '}</span></div></div></div></div>}

      {screen === 'city' && <div className="page page-enter"><div className="page-heading"><span className="eyebrow">Dein Ort wächst mit dir</span><h1>Meine arabische Stadt</h1><p>Wenn du eine Welt abschließt, entsteht hier ein neuer Ort.</p></div><div className="city-scene"><div className="city-sun">☀</div><div className="city-ground" />{worlds.map((item, index) => { const built = worldLessons(item.id).every((lesson) => progress.completedLessons.includes(lesson.id)); return <div key={item.id} className={`city-building city-building--${index} ${built ? '' : 'is-locked'}`}><span>{built ? ['🏠', '🌴', '🏪', '🏫', '⛺'][index] : '◇'}</span><strong>{item.building}</strong><small>{built ? 'Gebaut!' : `${worldLessons(item.id).filter((lesson) => progress.completedLessons.includes(lesson.id)).length}/6 Lektionen`}</small></div>; })}</div><div className="city-note"><span>✦</span><div><strong>Deine Stadt wächst mit jedem Abenteuer.</strong><p>Schließe alle sechs Lektionen einer Welt ab, um ihr Gebäude freizuschalten.</p></div><Button onClick={() => navigate('map')}>Welten erkunden →</Button></div></div>}

      {screen === 'collection' && <div className="page page-enter"><div className="page-heading"><span className="eyebrow">Deine Schätze</span><h1>Sammlung</h1><p>Alle Wörter und Auszeichnungen, die du unterwegs gefunden hast.</p></div><div className="tabs"><button className={collectionTab === 'words' ? 'is-active' : ''} onClick={() => setCollectionTab('words')}>Wörter <span>{learnedWords.length}</span></button><button className={collectionTab === 'awards' ? 'is-active' : ''} onClick={() => setCollectionTab('awards')}>Abzeichen <span>{achievements.filter((item) => item.earned).length}</span></button></div>{collectionTab === 'words' ? learnedWords.length ? <div className="word-grid">{learnedWords.map((entry) => <div className="word-card" key={entry.id}><WordIllustration entry={entry} /><ArabicWord arabic={entry.arabic} german={entry.german} /><AudioButton arabic={entry.arabic} audio={entry.audio} enabled={progress.settings.sound} label={`${entry.arabic} anhören`} /></div>)}</div> : <div className="empty-state"><span>📚</span><h2>Hier ist noch Platz für Wörter</h2><p>Spiele deine erste Lektion und fülle deine Sammlung.</p><Button onClick={startNext}>Erste Lektion starten →</Button></div> : <div className="awards-grid">{achievements.map((item) => <div className={`award-card ${item.earned ? '' : 'is-locked'}`} key={item.title}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.text}</small>{item.earned && <em>Freigeschaltet</em>}</div>)}</div>}</div>}

      {screen === 'profile' && <div className="page page-enter"><div className="page-heading"><span className="eyebrow">Deine Reise</span><h1>Mein Profil</h1><p>Schau, wie weit du schon gekommen bist.</p></div><div className="profile-card"><span className="profile-avatar">{progress.avatar}</span><div><span className="eyebrow">Wortentdecker</span><h2>{progress.nickname || 'Noch kein Name'}</h2><p>Level {level} · {progress.xp} XP · {totalStars} Sterne</p></div><Button variant="secondary" onClick={() => navigate('settings')}>Einstellungen ⚙</Button></div><div className="profile-stats"><div><strong>{progress.completedLessons.length}</strong><span>Lektionen</span></div><div><strong>{learnedWords.length}</strong><span>Wörter</span></div><div><strong>{totalStars}</strong><span>Sterne</span></div><div><strong>{worlds.filter((item) => worldLessons(item.id).every((lesson) => progress.completedLessons.includes(lesson.id))).length}</strong><span>Welten</span></div></div><div className="section-heading"><div><span className="eyebrow">Deine Erfolge</span><h2>Abzeichen</h2></div></div><div className="awards-grid">{achievements.map((item) => <div className={`award-card ${item.earned ? '' : 'is-locked'}`} key={item.title}><span>{item.icon}</span><strong>{item.title}</strong><small>{item.text}</small></div>)}</div></div>}

      {screen === 'profile' && <ProfileEditor progress={progress} onSave={(name, chosenAvatar) => setProgress((current) => ({ ...current, nickname: name, avatar: chosenAvatar }))} />}

      {screen === 'settings' && <div className="page page-enter"><button className="text-link back-link" onClick={() => navigate('profile')}>← Zurück zum Profil</button><div className="page-heading"><span className="eyebrow">So spielst du</span><h1>Einstellungen</h1><p>Mach dein Abenteuer so angenehm, wie du es magst.</p></div><div className="settings-panel"><label className="setting-row"><span><strong>Ton & Aussprache</strong><small>Lokale arabische Sprachaufnahmen anhören.</small></span><input type="checkbox" checked={progress.settings.sound} onChange={(event) => setProgress((current) => ({ ...current, settings: { ...current.settings, sound: event.target.checked } }))} /></label><label className="setting-row"><span><strong>Animationen</strong><small>Bewegungen und Übergänge anzeigen.</small></span><input type="checkbox" checked={progress.settings.motion} onChange={(event) => setProgress((current) => ({ ...current, settings: { ...current.settings, motion: event.target.checked } }))} /></label><div className="setting-row"><span><strong>Sprache</strong><small>Die Erklärungen sind auf Deutsch.</small></span><strong>Deutsch</strong></div></div><div className="danger-zone"><h2>Fortschritt zurücksetzen</h2><p>Alle Lektionen, Sterne und gesammelten Wörter werden entfernt.</p>{resetConfirm ? <div className="confirm-actions"><Button variant="secondary" onClick={() => setResetConfirm(false)}>Abbrechen</Button><Button onClick={() => { setProgress(createProgress()); setResetConfirm(false); navigate('home'); }}>Ja, alles zurücksetzen</Button></div> : <Button variant="secondary" onClick={() => setResetConfirm(true)}>Fortschritt zurücksetzen</Button>}</div></div>}
    </main>

    {screen !== 'lesson' && screen !== 'onboarding' && screen !== 'result' && <nav className="bottom-nav" aria-label="Schnellnavigation">{navItems.map((item) => <button key={item.id} className={screen === item.id || screen === 'settings' && item.id === 'profile' ? 'is-active' : ''} onClick={() => navigate(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}</nav>}
  </div>;
}

export default App;
