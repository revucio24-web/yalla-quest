import type { Lesson, PlayerProgress, WordMastery, WorldId } from '../types';
import { AVATARS, lessons, maybeWord, worldLessons, worlds } from './content';

const STORAGE_KEY = 'yalla-quest-progress-v1';
const PROGRESS_VERSION = 1;
const NICKNAME_MAX = 20;
const MAX_STARS = 3;
const MAX_MASTERY = 5;

// Die höchste Stufe muss innerhalb der erreichbaren XP liegen:
// 30 Lektionen mit je 60 XP ergeben als Maximum 1800 XP.
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 950, 1200, 1450, 1700];
export const MAX_REACHABLE_XP = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];

export interface ProgressStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

function defaultStorage(): ProgressStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function createProgress(): PlayerProgress {
  return {
    version: 1,
    nickname: '',
    avatar: AVATARS[0],
    xp: 0,
    stars: {},
    completedLessons: [],
    words: {},
    settings: { sound: true, motion: true },
  };
}

function safeCount(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(max, Math.trunc(value)));
}

function safeStars(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const stars: Record<string, number> = {};
  for (const [lessonId, count] of Object.entries(value)) {
    if (!lessons.some((lesson) => lesson.id === lessonId)) continue;
    stars[lessonId] = safeCount(count, MAX_STARS);
  }
  return stars;
}

function safeWords(value: unknown): Record<string, WordMastery> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const words: Record<string, WordMastery> = {};
  for (const [wordId, raw] of Object.entries(value)) {
    if (!maybeWord(wordId) || !raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const entry = raw as Partial<WordMastery>;
    words[wordId] = {
      lastSeen: safeCount(entry.lastSeen, Number.MAX_SAFE_INTEGER),
      correctCount: safeCount(entry.correctCount, Number.MAX_SAFE_INTEGER),
      wrongCount: safeCount(entry.wrongCount, Number.MAX_SAFE_INTEGER),
      mastery: safeCount(entry.mastery, MAX_MASTERY),
    };
  }
  return words;
}

function safeLessons(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(lessons.map((lesson) => lesson.id));
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && known.has(id)))];
}

function safeNickname(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\p{C}]/gu, '').trim().slice(0, NICKNAME_MAX);
}

export function parseProgress(raw: string | null): PlayerProgress {
  if (!raw) return createProgress();
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return createProgress();
    const value = data as Partial<PlayerProgress>;
    if (value.version !== PROGRESS_VERSION) return createProgress();
    const avatar = typeof value.avatar === 'string' && (AVATARS as readonly string[]).includes(value.avatar) ? value.avatar : AVATARS[0];
    return {
      version: 1,
      nickname: safeNickname(value.nickname),
      avatar,
      xp: safeCount(value.xp, MAX_REACHABLE_XP),
      stars: safeStars(value.stars),
      completedLessons: safeLessons(value.completedLessons),
      words: safeWords(value.words),
      settings: {
        sound: value.settings?.sound !== false,
        motion: value.settings?.motion !== false,
      },
    };
  } catch {
    return createProgress();
  }
}

function storedVersion(storage: ProgressStorage): number | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const version = (data as { version?: unknown }).version;
    return typeof version === 'number' && Number.isFinite(version) ? version : null;
  } catch {
    return null;
  }
}

export function loadProgress(storage: ProgressStorage | null = defaultStorage()): PlayerProgress {
  if (!storage) return createProgress();
  try {
    return parseProgress(storage.getItem(STORAGE_KEY));
  } catch {
    return createProgress();
  }
}

export function saveProgress(progress: PlayerProgress, storage: ProgressStorage | null = defaultStorage()): void {
  if (!storage) return;
  try {
    // Ein Spielstand aus einer neueren Fassung wird nie überschrieben,
    // sonst ginge er beim ersten Laden der alten Fassung verloren.
    const existing = storedVersion(storage);
    if (existing !== null && existing > progress.version) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // The game stays playable when private browsing blocks storage.
  }
}

export function levelForXp(xp: number): number {
  const next = LEVEL_THRESHOLDS.findIndex((threshold) => threshold > xp);
  return next === -1 ? LEVEL_THRESHOLDS.length : Math.max(1, next);
}

export function levelProgress(xp: number): { current: number; next: number; percent: number; isMax: boolean } {
  const level = levelForXp(xp);
  const isMax = level >= LEVEL_THRESHOLDS.length;
  const current = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level] ?? current + 500;
  const percent = isMax ? 100 : Math.max(0, Math.min(100, ((xp - current) / (next - current)) * 100));
  return { current, next, percent, isMax };
}

export function worldUnlocked(progress: PlayerProgress, id: WorldId): boolean {
  const index = worlds.findIndex((world) => world.id === id);
  if (index < 0) return false;
  if (index === 0) return true;
  return worldLessons(worlds[index - 1].id).every((lesson) => progress.completedLessons.includes(lesson.id));
}

export function lessonUnlocked(progress: PlayerProgress, lesson: Lesson): boolean {
  if (!worldUnlocked(progress, lesson.world)) return false;
  const entries = worldLessons(lesson.world);
  const index = entries.findIndex((entry) => entry.id === lesson.id);
  if (index < 0) return false;
  return index === 0 || progress.completedLessons.includes(entries[index - 1].id);
}

export function nextLesson(progress: PlayerProgress): Lesson | undefined {
  return lessons.find((lesson) => lessonUnlocked(progress, lesson) && !progress.completedLessons.includes(lesson.id));
}

export interface TaskOutcome {
  wordId: string;
  wordIds?: string[];
  attempts: number;
}

export function calculateReward(outcomes: TaskOutcome[]): { xp: number; stars: number } {
  const mistakes = outcomes.reduce((sum, item) => sum + Math.max(0, item.attempts - 1), 0);
  return {
    xp: outcomes.length * 5 + 20 + (mistakes === 0 ? 10 : 0),
    stars: mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1,
  };
}

export function completeLesson(progress: PlayerProgress, lesson: Lesson, outcomes: TaskOutcome[]): PlayerProgress {
  const reward = calculateReward(outcomes);
  const firstCompletion = !progress.completedLessons.includes(lesson.id);
  const words = { ...progress.words };
  for (const id of lesson.wordIds) {
    words[id] = words[id] ?? { lastSeen: Date.now(), correctCount: 0, wrongCount: 0, mastery: 0 };
  }
  for (const outcome of outcomes) {
    for (const id of outcome.wordIds ?? [outcome.wordId]) {
    const previous = words[id] ?? { lastSeen: 0, correctCount: 0, wrongCount: 0, mastery: 0 };
    words[id] = {
      lastSeen: Date.now(),
      correctCount: previous.correctCount + 1,
      wrongCount: previous.wrongCount + Math.max(0, outcome.attempts - 1),
      mastery: Math.min(5, previous.mastery + (outcome.attempts === 1 ? 1 : 0)),
    };
    }
  }
  return {
    ...progress,
    xp: progress.xp + (firstCompletion ? reward.xp : 0),
    completedLessons: firstCompletion ? [...progress.completedLessons, lesson.id] : progress.completedLessons,
    stars: { ...progress.stars, [lesson.id]: Math.max(progress.stars[lesson.id] ?? 0, Math.min(MAX_STARS, reward.stars)) },
    words,
  };
}
