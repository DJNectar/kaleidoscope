import { SAVE_VERSION, type Chapter, type FlagValue, type GameState } from './types';

export function newState(ch: Chapter, carry?: Record<string, FlagValue>): GameState {
  return {
    version: SAVE_VERSION,
    chapter: ch.id,
    scene: ch.startScene,
    minutes: 0,
    inventory: [...(ch.startInventory ?? [])],
    flags: { ...(ch.startFlags ?? {}) },
    shards: [],
    visited: [],
    deaths: 0,
    hintsUsed: 0,
    firedEvents: [],
    notebook: [],
    ...(carry ? { carry: { ...carry } } : {}),
  };
}

export function cloneState(s: GameState): GameState {
  return structuredClone(s);
}
