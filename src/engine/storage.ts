// localStorage that never throws: the game must work with storage blocked.
export interface KV {
  get(key: string): string | null;
  set(key: string, value: string): boolean;
  remove(key: string): void;
}

const memory = new Map<string, string>();

export const storage: KV = {
  get(key) {
    try { return globalThis.localStorage?.getItem(key) ?? memory.get(key) ?? null; }
    catch { return memory.get(key) ?? null; }
  },
  set(key, value) {
    memory.set(key, value);
    try { globalThis.localStorage?.setItem(key, value); return true; }
    catch { return false; }
  },
  remove(key) {
    memory.delete(key);
    try { globalThis.localStorage?.removeItem(key); } catch { /* ignore */ }
  },
};
