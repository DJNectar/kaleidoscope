import { ProfileSchema, type Profile } from './saveSchema';
import { storage, type KV } from './storage';
import type { FlagValue } from './types';

const KEY = 'kaleidoscope.profile';

export function defaultProfile(): Profile {
  return {
    version: 1, deathsSeen: [], endingsSeen: [], chapterFlags: {},
    settings: { textSpeed: 'normal', sound: false, reducedMotion: false, textSize: 'normal', mode1985: false },
  };
}

export function loadProfile(kv: KV = storage): Profile {
  const json = kv.get(KEY);
  if (!json) return defaultProfile();
  try {
    const p = ProfileSchema.safeParse(JSON.parse(json));
    return p.success ? p.data : defaultProfile();
  } catch { return defaultProfile(); }
}

export function saveProfile(p: Profile, kv: KV = storage): void { kv.set(KEY, JSON.stringify(p)); }

export function recordDeath(p: Profile, id: string): Profile {
  return p.deathsSeen.includes(id) ? p : { ...p, deathsSeen: [...p.deathsSeen, id] };
}
export function recordEnding(p: Profile, id: string, chapter: string, flags: Record<string, FlagValue>): Profile {
  return {
    ...p,
    endingsSeen: p.endingsSeen.includes(id) ? p.endingsSeen : [...p.endingsSeen, id],
    chapterFlags: { ...p.chapterFlags, [chapter]: flags },
  };
}
