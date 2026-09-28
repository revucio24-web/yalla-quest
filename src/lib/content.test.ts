import { describe, expect, it } from 'vitest';
import { lessons, vocabulary, worlds, wordById } from './content';
import { countCap } from './learning';

describe('starter curriculum', () => {
  it('has complete worlds, lessons and vocabulary references', () => {
    expect(worlds).toHaveLength(5);
    expect(lessons).toHaveLength(30);
    expect(vocabulary.length).toBeGreaterThanOrEqual(100);
    expect(new Set(vocabulary.map((entry) => entry.id)).size).toBe(vocabulary.length);
    for (const world of worlds) expect(lessons.filter((lesson) => lesson.world === world.id)).toHaveLength(6);
    for (const lesson of lessons) {
      expect(lesson.tasks).toHaveLength(6);
      for (const task of lesson.tasks) {
        expect(wordById.has(task.wordId)).toBe(true);
        for (const option of task.options ?? []) expect(wordById.has(option)).toBe(true);
        if (task.type === 'matching') expect(task.options?.length).toBeGreaterThanOrEqual(3);
        if (task.type === 'count') expect(task.count).toBeGreaterThan(0);
      }
    }
  });

  it('covers each of the six game types', () => {
    const types = new Set(lessons.flatMap((lesson) => lesson.tasks.map((task) => task.type)));
    expect(types).toEqual(new Set(['image-choice', 'audio-choice', 'matching', 'letter-choice', 'word-builder', 'count', 'scene-choice']));
  });

  it('keeps every answer option task solvable and every count reachable', () => {
    for (const lesson of lessons) {
      for (const task of lesson.tasks) {
        if (task.type === 'matching') {
          expect(task.options).toContain(task.wordId);
          continue;
        }
        if (task.type === 'count') {
          expect(task.count).toBeLessThanOrEqual(countCap(task.count ?? 2));
          continue;
        }
        if (task.type === 'word-builder') continue;
        expect(task.options).toContain(task.wordId);
        expect((task.options ?? []).length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('gives every word a local audio file reference', () => {
    for (const entry of vocabulary) expect(entry.audio).toMatch(/^\/audio\/vocabulary\/[0-9a-f]{16}\.mp3$/);
  });
});
