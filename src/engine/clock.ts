import type { Chapter } from './types';

/** Minutes after midnight → "4:05 PM". */
export function formatTime(totalMinutes: number): string {
  const m = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

export function clockTime(ch: Chapter, minutes: number): string {
  return formatTime(ch.clockStart + minutes);
}

/** Wall-clock minutes after midnight for a game minute. */
export function wallMinutes(ch: Chapter, minutes: number): number {
  return ch.clockStart + minutes;
}

/** Minutes left before the deadline (never negative). */
export function minutesLeft(ch: Chapter, minutes: number): number {
  return Math.max(0, ch.deadline - minutes);
}

/** Game minutes from a wall-clock "h:mm" in 24h, e.g. at(ch, 18, 30). */
export function at(ch: Pick<Chapter, 'clockStart'>, hour24: number, minute = 0): number {
  return hour24 * 60 + minute - ch.clockStart;
}
