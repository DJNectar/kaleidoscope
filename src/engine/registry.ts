import type { Chapter } from './types';

const chapters: Record<string, Chapter> = {};
const order: string[] = [];

export function registerChapter(ch: Chapter): void {
  if (chapters[ch.id]) return;
  chapters[ch.id] = ch;
  order.push(ch.id);
}

export function getChapter(id: string): Chapter | undefined { return chapters[id]; }
export function allChapters(): Record<string, Chapter> { return chapters; }
export function chapterOrder(): readonly string[] { return order; }
export function nextChapter(id: string): Chapter | undefined {
  const i = order.indexOf(id);
  return i >= 0 ? chapters[order[i + 1] ?? ''] : undefined;
}
