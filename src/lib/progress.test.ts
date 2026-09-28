import { describe, expect, it } from 'vitest';
import { lessons, vocabulary, worlds } from './content';
import {
  LEVEL_THRESHOLDS,
  calculateReward,
  completeLesson,
  createProgress,
  levelForXp,
  levelProgress,
  lessonUnlocked,
  loadProgress,
  nextLesson,
  parseProgress,
  saveProgress,
  worldUnlocked,
  type ProgressStorage,
} from './progress';

const MAX_XP = lessons.length * 60;
const BELL = String.fromCharCode(7);

function memoryStorage(initial: Record<string, string> = {}): ProgressStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => { data[key] = value; },
  };
}

describe('progress', () => {
  it('handles broken or incompatible storage safely', () => {
    expect(parseProgress('{broken')).toEqual(createProgress());
    expect(parseProgress('{"version":2}')).toEqual(createProgress());
    expect(parseProgress('[]')).toEqual(createProgress());
    expect(parseProgress('null')).toEqual(createProgress());
  });

  it('awards stars and XP once for a completed lesson', () => {
    const lesson = lessons[0];
    const outcomes = lesson.tasks.map((task) => ({ wordId: task.wordId, attempts: 1 }));
    expect(calculateReward(outcomes)).toEqual({ xp: 60, stars: 3 });
    const first = completeLesson(createProgress(), lesson, outcomes);
    expect(first.xp).toBe(60);
    expect(first.stars[lesson.id]).toBe(3);
    expect(completeLesson(first, lesson, outcomes).xp).toBe(60);
  });

  it('unlocks the next world after all previous lessons', () => {
    const progress = createProgress();
    expect(worldUnlocked(progress, 'oasis')).toBe(false);
    progress.completedLessons = lessons.filter((lesson) => lesson.world === 'home').map((lesson) => lesson.id);
    expect(worldUnlocked(progress, 'oasis')).toBe(true);
  });

  it('calculates levels at thresholds', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(250)).toBe(3);
  });

  it('keeps every level reachable with the XP the curriculum can award', () => {
    const lastIndex = LEVEL_THRESHOLDS.length - 1;
    expect(LEVEL_THRESHOLDS[lastIndex]).toBeLessThanOrEqual(MAX_XP);
    expect(levelForXp(MAX_XP)).toBe(LEVEL_THRESHOLDS.length);
    for (let index = 0; index < lastIndex; index++) {
      const atThreshold = levelProgress(LEVEL_THRESHOLDS[index]);
      expect(atThreshold.current).toBe(LEVEL_THRESHOLDS[index]);
      expect(atThreshold.next).toBe(LEVEL_THRESHOLDS[index + 1]);
      expect(atThreshold.percent).toBe(0);
      expect(atThreshold.isMax).toBe(false);
      expect(levelForXp(LEVEL_THRESHOLDS[index])).toBe(index + 1);
    }
    const max = levelProgress(MAX_XP);
    expect(max.isMax).toBe(true);
    expect(max.percent).toBe(100);
  });

  it('rejects unknown worlds and lessons instead of unlocking them', () => {
    const progress = createProgress();
    expect(worldUnlocked(progress, 'atlantis' as never)).toBe(false);
    expect(lessonUnlocked(progress, { id: 'ghost-01', world: 'home', title: '', subtitle: '', wordIds: [], tasks: [] })).toBe(false);
  });

  it('repairs tampered storage values', () => {
    const parsed = parseProgress(JSON.stringify({
      version: 1,
      nickname: `  Sami${BELL}  `,
      avatar: '<script>',
      xp: -50,
      stars: ['x', 'y'],
      completedLessons: ['home-01', 'home-01', 'unbekannt', 7],
      words: { 'home-door': 'kaputt', 'nicht-da': { mastery: 99 } },
    }));
    expect(parsed.nickname).toBe('Sami');
    expect(parsed.avatar).toBe(createProgress().avatar);
    expect(parsed.xp).toBe(0);
    expect(parsed.stars).toEqual({});
    expect(parsed.completedLessons).toEqual(['home-01']);
    expect(parsed.words).toEqual({});
    const total = Object.values(parsed.stars).reduce((sum, value) => sum + value, 0);
    expect(Number.isFinite(total)).toBe(true);
  });

  it('clamps stars, words and XP into the valid range', () => {
    const parsed = parseProgress(JSON.stringify({
      version: 1,
      xp: 10 ** 9,
      stars: { 'home-01': 99, 'unbekannt': 2 },
      words: { 'home-door': { lastSeen: 1, correctCount: 5, wrongCount: 2, mastery: 99 } },
    }));
    expect(parsed.xp).toBeLessThanOrEqual(LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]);
    expect(parsed.stars).toEqual({ 'home-01': 3 });
    expect(parsed.words['home-door'].mastery).toBe(5);
  });

  it('trims the nickname and cuts it to the input length', () => {
    expect(parseProgress(JSON.stringify({ version: 1, nickname: 'x'.repeat(80) })).nickname).toHaveLength(20);
    expect(parseProgress(JSON.stringify({ version: 1, nickname: BELL })).nickname).toBe('');
  });

  it('survives a storage that throws', () => {
    const broken: ProgressStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    expect(loadProgress(broken)).toEqual(createProgress());
    expect(() => saveProgress(createProgress(), broken)).not.toThrow();
    expect(loadProgress(null)).toEqual(createProgress());
    expect(() => saveProgress(createProgress(), null)).not.toThrow();
  });

  it('never overwrites a progress saved by a newer version', () => {
    const storage = memoryStorage({ 'yalla-quest-progress-v1': JSON.stringify({ version: 2, nickname: 'Zukunft' }) });
    saveProgress(createProgress(), storage);
    expect(storage.data['yalla-quest-progress-v1']).toBe(JSON.stringify({ version: 2, nickname: 'Zukunft' }));
  });

  it('round-trips a real progress through storage', () => {
    const storage = memoryStorage();
    const played = completeLesson(createProgress(), lessons[0], lessons[0].tasks.map((task) => ({ wordId: task.wordId, attempts: 1 })));
    played.nickname = 'Sami';
    saveProgress(played, storage);
    expect(loadProgress(storage)).toEqual(played);
  });
});

describe('full playthrough', () => {
  const perfect = (lesson: (typeof lessons)[number]) => lesson.tasks.map((task) => ({ wordId: task.wordId, attempts: 1 }));

  it('reaches the final level and every world when all lessons are completed', () => {
    let progress = createProgress();

    for (const lesson of lessons) {
      expect(lessonUnlocked(progress, lesson)).toBe(true);
      progress = completeLesson(progress, lesson, perfect(lesson));
    }

    expect(progress.completedLessons).toHaveLength(lessons.length);
    expect(new Set(progress.completedLessons).size).toBe(lessons.length);
    expect(progress.xp).toBe(MAX_XP);
    expect(Object.values(progress.stars).every((value) => value === 3)).toBe(true);
    expect(Object.keys(progress.words)).toHaveLength(vocabulary.length);
    expect(levelForXp(progress.xp)).toBe(LEVEL_THRESHOLDS.length);
    expect(levelProgress(progress.xp).isMax).toBe(true);
    expect(worlds.every((world) => worldUnlocked(progress, world.id))).toBe(true);
    expect(nextLesson(progress)).toBeUndefined();
  });

  it('keeps XP and the best star result stable when a lesson is replayed', () => {
    const lesson = lessons[0];
    const sloppily = lesson.tasks.map((task) => ({ wordId: task.wordId, attempts: 3 }));
    const first = completeLesson(createProgress(), lesson, sloppily);
    const replay = completeLesson(first, lesson, perfect(lesson));
    expect(first.xp).toBe(0 + lesson.tasks.length * 5 + 20);
    expect(first.stars[lesson.id]).toBe(1);
    expect(replay.xp).toBe(first.xp);
    expect(replay.stars[lesson.id]).toBe(3);
    expect(replay.completedLessons).toEqual(first.completedLessons);
  });
});

describe('world order', () => {
  it('keeps the unlock chain consistent with the world list', () => {
    worlds.forEach((world, index) => {
      expect(worldUnlocked(createProgress(), world.id)).toBe(index === 0);
    });
  });
});
