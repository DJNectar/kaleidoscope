import { SaveFileSchema, type SaveFile } from './saveSchema';
import { storage, type KV } from './storage';
import type { Chapter, GameState } from './types';

export const SLOTS = ['auto', '1', '2', '3'] as const;
export type Slot = (typeof SLOTS)[number];
const KEY = (slot: Slot) => `kaleidoscope.save.${slot}`;

/** Upgrades older save files. Add a step per version bump. */
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {};

export function writeSave(slot: Slot, state: GameState, label: string, narration: string[], kv: KV = storage): boolean {
  const file: SaveFile = {
    version: 1, savedAt: new Date().toISOString(), label,
    state, narration: narration.slice(-30),
  };
  return kv.set(KEY(slot), JSON.stringify(file));
}

export type LoadResult = { ok: true; save: SaveFile } | { ok: false; reason: 'empty' | 'corrupt' | 'unknown-content' };

/** Parse + validate a save. Never evals; unknown chapters/scenes/items are rejected. */
export function parseSave(json: string, chapters: Record<string, Chapter>): LoadResult {
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return { ok: false, reason: 'corrupt' }; }
  if (raw && typeof raw === 'object' && 'version' in raw) {
    let v = Number((raw as { version: unknown }).version);
    while (MIGRATIONS[v]) { raw = MIGRATIONS[v]!(raw as Record<string, unknown>); v++; }
  }
  const parsed = SaveFileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, reason: 'corrupt' };
  const s = parsed.data.state;
  const ch = chapters[s.chapter];
  if (!ch || !ch.scenes[s.scene] || s.inventory.some((i) => !ch.items[i])) {
    return { ok: false, reason: 'unknown-content' };
  }
  return { ok: true, save: parsed.data };
}

export function readSave(slot: Slot, chapters: Record<string, Chapter>, kv: KV = storage): LoadResult {
  const json = kv.get(KEY(slot));
  if (json == null) return { ok: false, reason: 'empty' };
  return parseSave(json, chapters);
}

export function deleteSave(slot: Slot, kv: KV = storage): void { kv.remove(KEY(slot)); }
