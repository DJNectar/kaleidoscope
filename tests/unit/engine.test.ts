import { describe, expect, it } from 'vitest';
import { testChapter as ch } from '../../src/chapters/test';
import { act, startChapter } from '../../src/engine/engine';
import { Session } from '../../src/engine/session';
import { parseSave, readSave, writeSave } from '../../src/engine/save';
import type { KV } from '../../src/engine/storage';
import type { ActionInput, Effect } from '../../src/engine/types';
import { clockTime } from '../../src/engine/clock';

const narr = (fx: Effect[]) => fx.filter((e) => e.type === 'narrate').map((e) => (e as { text: string }).text).join('\n');
const play = (s: Session, ...inputs: ActionInput[]) => inputs.map((i) => s.act(i)).flat();

function memKV(): KV {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, set: (k, v) => (m.set(k, v), true), remove: (k) => void m.delete(k) };
}

describe('engine basics', () => {
  it('starts in the start scene with intro narration', () => {
    const { state, effects } = startChapter(ch);
    expect(state.scene).toBe('office');
    expect(state.minutes).toBe(0);
    expect(state.inventory).toEqual(['matches']);
    expect(state.visited).toEqual(['office']);
    expect(narr(effects)).toMatch(/VACANCY/);
  });

  it('never returns an empty response for any verb on any visible target', () => {
    const { state } = startChapter(ch);
    const targets = [...ch.scenes.office!.hotspots.map((h) => h.id), 'matches', 'exit:hall', 'self'];
    for (const t of targets) {
      for (const v of ['look', 'take', 'open', 'close', 'talk', 'use', 'give', 'hit', 'consume', 'go'] as const) {
        const r = act(ch, state, { verb: v, target: t });
        expect(r.effects.length, `${v} ${t}`).toBeGreaterThan(0);
      }
    }
  });

  it('rejects targets that are not present', () => {
    const { state } = startChapter(ch);
    const r = act(ch, state, { verb: 'look', target: 'super' });
    expect(r.accepted).toBe(false);
    expect(r.state).toBe(state);
  });

  it('charges time per the clock rules', () => {
    const s = new Session(ch);
    s.act({ verb: 'look', target: 'desk' });
    expect(s.state.minutes).toBe(1);
    s.act({ verb: 'look', target: 'matches' }); // inventory look is free
    expect(s.state.minutes).toBe(1);
    s.act({ verb: 'go', target: 'exit:hall' }); // blocked GO costs 1, not 4
    expect(s.state.minutes).toBe(2);
    expect(s.state.scene).toBe('office');
  });

  it('formats the clock', () => {
    expect(clockTime(ch, 0)).toBe('11:00 PM');
    expect(clockTime(ch, 75)).toBe('12:15 AM');
  });
});

describe('two-target verbs', () => {
  it('USE item on hotspot uses the hotspot table', () => {
    const s = new Session(ch);
    play(s, { verb: 'open', target: 'desk' });
    expect(s.state.inventory).toContain('key');
    const fx = s.act({ verb: 'use', target: 'door', with: 'key' });
    expect(narr(fx)).toMatch(/key turns/);
    expect(s.state.flags.unlocked).toBe(true);
    expect(s.state.inventory).not.toContain('key');
  });

  it('USE item on item works in either order', () => {
    for (const [target, w] of [['cigarette', 'matches'], ['matches', 'cigarette']] as const) {
      const s = new Session(ch);
      s.act({ verb: 'take', target: 'cigarette' });
      const fx = s.act({ verb: 'use', target, with: w });
      expect(narr(fx), `${w} on ${target}`).toMatch(/light up/);
      expect(s.state.flags.smoked).toBe(true);
    }
  });

  it('GIVE item to person', () => {
    const s = new Session(ch);
    play(s, { verb: 'take', target: 'cigarette' }, { verb: 'open', target: 'desk' },
      { verb: 'use', target: 'door', with: 'key' }, { verb: 'go', target: 'exit:hall' });
    expect(s.state.scene).toBe('hall');
    const fx = s.act({ verb: 'give', target: 'super', with: 'cigarette' });
    expect(narr(fx)).toMatch(/behind his ear/);
    expect(s.state.flags.superHappy).toBe(true);
  });

  it('falls back to a generic line with both names', () => {
    const s = new Session(ch);
    const fx = s.act({ verb: 'use', target: 'desk', with: 'matches' });
    expect(narr(fx)).toMatch(/matches/);
    expect(narr(fx)).toMatch(/desk/);
  });

  it('refuses a held item you do not have', () => {
    const s = new Session(ch);
    const fx = s.act({ verb: 'use', target: 'door', with: 'key' });
    expect(narr(fx)).toMatch(/don't have/);
  });
});

describe('deaths, shards, endings, events', () => {
  it('a death ends the run and blocks further actions', () => {
    const s = new Session(ch);
    const fx = s.act({ verb: 'consume', target: 'bottle' });
    expect(fx.some((e) => e.type === 'death' && e.id === 'rye')).toBe(true);
    expect(s.state.over).toEqual({ kind: 'death', id: 'rye' });
    expect(s.state.deaths).toBe(1);
    const after = s.act({ verb: 'look', target: 'desk' });
    expect(narr(after)).toMatch(/case is closed/i);
  });

  it('rewind undoes the death but keeps the death count', () => {
    const s = new Session(ch);
    s.act({ verb: 'look', target: 'desk' });
    s.act({ verb: 'go', target: 'window' });
    expect(s.state.over?.id).toBe('window');
    expect(s.rewind()).toBe(true);
    expect(s.state.over).toBeUndefined();
    expect(s.state.minutes).toBe(1);
    expect(s.state.deaths).toBe(1);
  });

  it('rewind is capped at 20 steps', () => {
    const s = new Session(ch);
    for (let i = 0; i < 25; i++) s.act({ verb: 'look', target: 'matches' });
    let n = 0;
    while (s.rewind()) n++;
    expect(n).toBe(20);
  });

  it('a shard is collected once with a flashback', () => {
    const s = new Session(ch);
    const fx = s.act({ verb: 'look', target: 'hat' });
    expect(fx.some((e) => e.type === 'flashback')).toBe(true);
    expect(s.state.shards).toEqual([1]);
    expect(s.state.notebook).toEqual(['client']);
    const again = s.act({ verb: 'look', target: 'hat' });
    expect(again.some((e) => e.type === 'flashback')).toBe(false);
  });

  it('timed events fire once, in order, and the deadline kills', () => {
    const s = new Session(ch);
    let warned = 0;
    let died = false;
    for (let i = 0; i < 40 && !s.state.over; i++) {
      const fx = s.act({ verb: 'look', target: 'desk' });
      if (narr(fx).includes('ten minutes left')) warned++;
      if (fx.some((e) => e.type === 'death' && e.id === 'late')) died = true;
    }
    expect(warned).toBe(1);
    expect(died).toBe(true);
    expect(s.state.minutes).toBe(30);
  });

  it('winning sets over=ending', () => {
    const s = new Session(ch);
    play(s, { verb: 'open', target: 'desk' }, { verb: 'use', target: 'door', with: 'key' },
      { verb: 'go', target: 'door' }, { verb: 'go', target: 'stairs' });
    expect(s.state.over).toEqual({ kind: 'ending', id: 'test-out' });
  });

  it('onEnter sees first visits', () => {
    const s = new Session(ch);
    play(s, { verb: 'open', target: 'desk' }, { verb: 'use', target: 'door', with: 'key' });
    const first = s.act({ verb: 'go', target: 'exit:hall' });
    expect(narr(first)).toMatch(/floor wax/);
    s.act({ verb: 'go', target: 'exit:office' });
    const second = s.act({ verb: 'go', target: 'exit:hall' });
    expect(narr(second)).not.toMatch(/floor wax/);
  });
});

describe('saves', () => {
  const chapters = { test: ch };

  it('round-trips through storage', () => {
    const kv = memKV();
    const s = new Session(ch);
    s.act({ verb: 'open', target: 'desk' });
    expect(writeSave('1', s.state, 'Office', ['line'], kv)).toBe(true);
    const r = readSave('1', chapters, kv);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.save.state).toEqual(s.state);
  });

  it('rejects malformed, hostile or unknown-content saves', () => {
    expect(parseSave('not json', chapters)).toEqual({ ok: false, reason: 'corrupt' });
    expect(parseSave('{"version":1}', chapters)).toEqual({ ok: false, reason: 'corrupt' });
    const s = new Session(ch).state;
    const base = { version: 1, savedAt: 'x', label: 'x', narration: [] };
    const bad = (state: unknown) => JSON.stringify({ ...base, state });
    expect(parseSave(bad({ ...s, scene: 'nowhere' }), chapters).ok).toBe(false);
    expect(parseSave(bad({ ...s, inventory: ['bazooka'] }), chapters).ok).toBe(false);
    expect(parseSave(bad({ ...s, scene: '<img onerror=alert(1)>' }), chapters).ok).toBe(false);
    expect(parseSave(bad({ ...s, extra: 1 }), chapters).ok).toBe(false);
    expect(parseSave(bad({ ...s, minutes: -5 }), chapters).ok).toBe(false);
    expect(parseSave(JSON.stringify({ ...base, state: s, __proto__: { x: 1 } }), chapters).ok).toBe(true);
  });

  it('empty slot reports empty', () => {
    expect(readSave('2', chapters, memKV())).toEqual({ ok: false, reason: 'empty' });
  });
});
