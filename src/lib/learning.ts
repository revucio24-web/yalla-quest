import type { LessonTask } from '../types';

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

// Der Korb muss mehr Stücke zulassen als das Ziel, damit Überzählen
// wieder korrigiert werden kann. Das Limit folgt der Aufgabe, damit eine
// höhere Zahl in lessons.json nie unlösbar wird.
export function countCap(goal: number): number {
  return goal + 2;
}

export function reviewTasks(tasks: LessonTask[], difficultIds: string[]): LessonTask[] {
  return [...new Set(difficultIds)].map((id) => {
    const source = tasks.find((task) => task.wordId === id);
    const options = [...new Set([id, ...tasks.flatMap((task) => task.options ?? [task.wordId])])].slice(0, 4);
    return { type: 'image-choice', wordId: id, options: source?.options ?? options };
  });
}
