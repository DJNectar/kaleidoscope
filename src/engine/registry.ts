import type { Chapter } from './types';

const chapters: Record<string, Chapter> = {};
const order: string[] = [];

/** Register a chapter. Unlisted chapters (dev/test) load by id but never appear as "next". */
export function registerChapter(ch: Chapter, opts: { listed?: boolean } = {}): void {
  if (chapters[ch.id]) return;
  chapters[ch.id] = ch;
  if (opts.listed !== false) order.push(ch.id);
}

export function getChapter(id: string): Chapter | undefined { return chapters[id]; }
export function allChapters(): Record<string, Chapter> { return chapters; }
export function chapterOrder(): readonly string[] { return order; }
export function nextChapter(id: string): Chapter | undefined {
  const i = order.indexOf(id);
  return i >= 0 ? chapters[order[i + 1] ?? ''] : undefined;
}
