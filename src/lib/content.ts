import rawWorlds from '../data/worlds.json';
import rawLessons from '../data/lessons.json';
import rawVocabulary from '../data/vocabulary.json';
import type { Lesson, Vocabulary, World, WorldId } from '../types';

export const worlds = rawWorlds as World[];
export const lessons = rawLessons as Lesson[];
export const vocabulary = rawVocabulary as Vocabulary[];

export const wordById = new Map(vocabulary.map((word) => [word.id, word]));
export const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

export const AVATARS = ['🦊', '🐱', '🐼', '🦁', '🐧', '🐻'] as const;

export function word(id: string): Vocabulary {
  const entry = wordById.get(id);
  if (!entry) throw new Error(`Unbekanntes Wort: ${id}`);
  return entry;
}

export function maybeWord(id: string): Vocabulary | undefined {
  return wordById.get(id);
}

export function maybeLesson(id: string): Lesson | undefined {
  return lessonById.get(id);
}

export function maybeWorld(id: WorldId): World | undefined {
  return worlds.find((world) => world.id === id);
}

export function worldLessons(id: WorldId): Lesson[] {
  return lessons.filter((lesson) => lesson.world === id);
}

export const alphabet = [
  ['ا', 'Alif', 'أب'], ['ب', 'Bā', 'باب'], ['ت', 'Tā', 'تمر'], ['ث', 'Thā', 'ثعلب'],
  ['ج', 'Dschīm', 'جمل'], ['ح', 'Ḥā', 'حليب'], ['خ', 'Chā', 'خبز'], ['د', 'Dāl', 'دفتر'],
  ['ذ', 'Dhāl', 'ذهب'], ['ر', 'Rā', 'رمل'], ['ز', 'Zā', 'زهرة'], ['س', 'Sīn', 'سماء'],
  ['ش', 'Schīn', 'شمس'], ['ص', 'Ṣād', 'صحراء'], ['ض', 'Ḍād', 'ضوء'], ['ط', 'Ṭā', 'طائر'],
  ['ظ', 'Ẓā', 'ظل'], ['ع', 'ʿAin', 'عائلة'], ['غ', 'Ghain', 'غرفة'], ['ف', 'Fā', 'فم'],
  ['ق', 'Qāf', 'قلم'], ['ك', 'Kāf', 'كتاب'], ['ل', 'Lām', 'ليل'], ['م', 'Mīm', 'ماء'],
  ['ن', 'Nūn', 'نهر'], ['ه', 'Hā', 'هلال'], ['و', 'Wāw', 'ورقة'], ['ي', 'Yā', 'يد'],
] as const;
