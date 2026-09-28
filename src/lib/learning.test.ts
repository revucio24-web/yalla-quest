import { describe, expect, it } from 'vitest';
import { shuffle, reviewTasks } from './learning';
import { completeLesson, createProgress } from './progress';
import { lessons } from './content';

describe('learning flow', () => {
  it('shuffles without changing the source or losing repeated letters', () => {
    const source = ['ب', 'ا', 'ب'];
    const mixed = shuffle(source, () => 0);
    expect(source).toEqual(['ب', 'ا', 'ب']);
    expect(mixed).not.toEqual(source);
    expect([...mixed].sort()).toEqual([...source].sort());
  });
  it('revisits a difficult word once and keeps it among the options', () => {
    const tasks = lessons[0].tasks;
    const reviews = reviewTasks(tasks, ['home-thanks', 'home-thanks']);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].options).toContain('home-thanks');
  });
  it('retains all introduced words and matching-pair progress', () => {
    const lesson = lessons[0];
    const result = completeLesson(createProgress(), lesson, [{ wordId: 'home-yes', wordIds: ['home-hello', 'home-thanks', 'home-yes'], attempts: 1 }]);
    expect(Object.keys(result.words)).toEqual(expect.arrayContaining(lesson.wordIds));
    expect(result.words['home-thanks'].correctCount).toBe(1);
  });
});
