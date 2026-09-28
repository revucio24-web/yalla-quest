export type WorldId = 'home' | 'oasis' | 'market' | 'school' | 'desert';
export type TaskType = 'image-choice' | 'audio-choice' | 'matching' | 'word-builder' | 'letter-choice' | 'count' | 'scene-choice';

export interface Vocabulary {
  id: string;
  world: WorldId;
  arabic: string;
  german: string;
  transliteration: string;
  icon: string;
  audio?: string;
}

export interface World {
  id: WorldId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  building: string;
}

export interface LessonTask {
  type: TaskType;
  wordId: string;
  options?: string[];
  count?: number;
  prompt?: string;
  successText?: string;
}

export interface Lesson {
  id: string;
  world: WorldId;
  title: string;
  subtitle: string;
  wordIds: string[];
  tasks: LessonTask[];
}

export interface WordMastery {
  lastSeen: number;
  correctCount: number;
  wrongCount: number;
  mastery: number;
}

export interface PlayerProgress {
  version: 1;
  nickname: string;
  avatar: string;
  xp: number;
  stars: Record<string, number>;
  completedLessons: string[];
  words: Record<string, WordMastery>;
  settings: { sound: boolean; motion: boolean };
}
