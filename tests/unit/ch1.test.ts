import { describe, expect, it } from 'vitest';
import { ch1 } from '../../src/chapters/ch1';
import { act, startChapter, visibleHotspots, visibleExits } from '../../src/engine/engine';
import { Session } from '../../src/engine/session';
import { VERBS, type ActionInput, type Effect, type Verb } from '../../src/engine/types';
import { clockTime } from '../../src/engine/clock';
import { ATTIC, BEST_ROUTE, DISGUISE, OWL_ALLEY, PANHANDLE, PARLOR_LAB, TO_CLINIC } from './ch1.route';

const text = (fx: Effect[]) => fx.filter((e) => e.type === 'narrate').map((e) => (e as { text: string }).text).join('\n');
const run = (steps: ActionInput[], s = new Session(ch1)) => {
  for (const st of steps) {
    expect(s.state.over, `game over before ${st.verb} ${st.target}`).toBeUndefined();
    const before = JSON.stringify(s.state);
    const fx = s.act(st);
    expect(JSON.stringify(s.state) !== before || fx.length > 0, `${st.verb} ${st.target} did nothing`).toBe(true);
    const rejected = fx.some((e) => e.type === 'narrate' && e.style === 'system');
    expect(rejected, `${st.verb} ${st.target}${st.with ? ' with ' + st.with : ''} rejected: ${text(fx)}`).toBe(false);
  }
  return s;
};
const deathOf = (s: Session) => (s.state.over?.kind === 'death' ? s.state.over.id : undefined);

describe('chapter 1: content integrity', () => {
  it('every exit, item, death and ending reference resolves', () => {
    for (const sc of Object.values(ch1.scenes)) {
      for (const ex of sc.exits) expect(ch1.scenes[ex.to], `${sc.id} → ${ex.to}`).toBeDefined();
      for (const ex of sc.exits) if (ex.hotspot) expect(sc.hotspots.some((h) => h.id === ex.hotspot), `${sc.id} exit hotspot ${ex.hotspot}`).toBe(true);
      const ids = sc.hotspots.map((h) => h.id);
      expect(new Set(ids).size, `duplicate hotspot ids in ${sc.id}`).toBe(ids.length);
    }
    expect(Object.keys(ch1.scenes)).toHaveLength(12);
    expect(Object.keys(ch1.deaths)).toHaveLength(13);
  });

  it('every verb on every hotspot and held item answers with something (no silent clicks)', () => {
    // Walk to each scene via the route, checking every verb on everything visible.
    const s = new Session(ch1);
    const seen = new Set<string>();
    const check = () => {
      if (seen.has(s.state.scene)) return;
      seen.add(s.state.scene);
      const targets = [
        ...visibleHotspots(ch1, s.state).map((h) => h.id),
        ...visibleExits(ch1, s.state).map((e) => `exit:${e.to}`),
        ...s.state.inventory, 'self',
      ];
      for (const t of targets) for (const v of VERBS as Verb[]) {
        const r = act(ch1, s.state, { verb: v, target: t });
        expect(text(r.effects).length + r.effects.length, `${s.state.scene}: ${v} ${t}`).toBeGreaterThan(0);
        for (const w of s.state.inventory) {
          if (v !== 'use' && v !== 'give') continue;
          const r2 = act(ch1, s.state, { verb: v, target: t, with: w });
          expect(r2.effects.length, `${s.state.scene}: ${v} ${w} on ${t}`).toBeGreaterThan(0);
        }
      }
    };
    check();
    for (const st of BEST_ROUTE) { s.act(st); if (!s.state.over) check(); }
    expect(seen.size).toBe(12);
  });
});

describe('chapter 1: the optimal route', () => {
  it('reaches the best ending with all 5 shards, inside the time budget', () => {
    const s = run(BEST_ROUTE);
    expect(s.state.over).toEqual({ kind: 'ending', id: 'best' });
    expect(s.state.shards).toEqual([1, 2, 3, 4, 5]);
    expect(s.state.deaths).toBe(0);
    const used = s.state.minutes / ch1.deadline;
    // Report for tuning (brief §5 target: ~55–60% of the 210 minutes).
    console.log(`[ch1] optimal route: ${s.state.minutes} of ${ch1.deadline} min (${Math.round(used * 100)}%), ends at ${clockTime(ch1, s.state.minutes)}, ${BEST_ROUTE.length} actions`);
    expect(used).toBeGreaterThan(0.5);
    expect(used).toBeLessThan(0.65);
  });

  it('exports the flags Chapter 2 reads', () => {
    const s = run(BEST_ROUTE);
    expect(ch1.exportFlags!(s.state)).toEqual({ ch1Ending: 'best', ch1RainSafe: true, ch1Ledger: true, ch1CalderAlly: false, ch1AllShards: true });
  });
});

describe('chapter 1: endings', () => {
  it('good: ledger but a shard missed (skip the scaffold)', () => {
    const s = run([...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY, ...PANHANDLE.filter((x) => x.target !== 'scaffold'), ...PARLOR_LAB]);
    expect(s.state.over?.id).toBe('good');
  });

  it('bittersweet: no ledger', () => {
    const s = run([...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY, ...PANHANDLE, ...PARLOR_LAB.filter((x) => x.target !== 'ledger')]);
    expect(s.state.over?.id).toBe('bittersweet');
  });

  it('lonely: cellar route, never wake Rain, escape out the cellar door', () => {
    const s = run([...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY,
      { verb: 'go', target: 'exit:lotus' },
      { verb: 'use', target: 'cellar', with: 'brasskey' },
      { verb: 'go', target: 'exit:lab' },
      { verb: 'open', target: 'crates' }, { verb: 'open', target: 'furnace' }, { verb: 'use', target: 'crates' },
      { verb: 'go', target: 'exit:lotus' }]);
    expect(s.state.over?.id).toBe('lonely');
  });

  it('calder ally changes the exported flags', () => {
    const s = run([...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY, { verb: 'go', target: 'exit:panhandle' }, { verb: 'give', target: 'calder', with: 'slip' }]);
    expect(s.state.flags.calderAlly).toBe(true);
  });
});

describe('chapter 1: every death', () => {
  const dies = (id: string, steps: ActionInput[]) => it(id, () => {
    const s = new Session(ch1);
    for (const st of steps) { if (s.state.over) break; s.act(st); }
    expect(deathOf(s)).toBe(id);
  });
  const toHaight = [...ATTIC, ...TO_CLINIC];
  const disguised = [...toHaight, ...DISGUISE];

  dies('attic-window', [{ verb: 'go', target: 'window' }]);
  dies('blue-tab', [...ATTIC, ...TO_CLINIC.slice(0, 3), { verb: 'consume', target: 'tab' }]);
  dies('fixer', [...ATTIC, { verb: 'hit', target: 'eyedoor' }, { verb: 'consume', target: 'gingerale' }]);
  dies('bus', [...toHaight, { verb: 'go', target: 'street' }]);
  dies('brownie', [...toHaight, { verb: 'go', target: 'exit:thirdeye' }, { verb: 'consume', target: 'brownies' }]);
  dies('bruno-panhandle', [...toHaight, { verb: 'go', target: 'exit:panhandle' }, { verb: 'talk', target: 'volunteer' }]);
  dies('tiny-recognize', [...toHaight, { verb: 'go', target: 'exit:owl' }, { verb: 'go', target: 'exit:alley' }, { verb: 'open', target: 'dumpster' }]);
  dies('tiny-hit', [...disguised, { verb: 'go', target: 'exit:owl' }, { verb: 'go', target: 'exit:alley' }, { verb: 'hit', target: 'tiny' }]);
  dies('alley-fire-escape', [...disguised, { verb: 'go', target: 'exit:owl' }, { verb: 'go', target: 'exit:alley' }, { verb: 'go', target: 'fireescape' }]);
  dies('tea', [...disguised, ...OWL_ALLEY, ...PANHANDLE, { verb: 'give', target: 'frontdoor', with: 'card' }, { verb: 'consume', target: 'teapot' }]);
  dies('gas-valve', [...disguised, ...OWL_ALLEY, { verb: 'go', target: 'exit:lotus' }, { verb: 'use', target: 'cellar', with: 'brasskey' }, { verb: 'go', target: 'exit:lab' }, { verb: 'open', target: 'valve' }]);
  dies('kell-shot', [...disguised, ...OWL_ALLEY, ...PANHANDLE, ...PARLOR_LAB.slice(0, 1), ...PARLOR_LAB.slice(3, 8)]); // parlor route, Rain never woken
  dies('clock', Array.from({ length: 220 }, () => ({ verb: 'look' as const, target: 'chair' })));

  it('kell-shot: HIT Kell at the climax even with Rain awake', () => {
    const s = run(BEST_ROUTE.slice(0, -1));
    s.act({ verb: 'hit', target: 'kell' });
    expect(deathOf(s)).toBe('kell-shot');
  });

  it('safe in the alley and panhandle while LOOKing or leaving, undisguised', () => {
    const s = run([...toHaight, { verb: 'go', target: 'exit:owl' }, { verb: 'go', target: 'exit:alley' }, { verb: 'look', target: 'tiny' }, { verb: 'go', target: 'exit:owl' }]);
    expect(s.state.over).toBeUndefined();
  });

  it('every death is covered by a test above', () => {
    expect(Object.keys(ch1.deaths).sort()).toEqual(['alley-fire-escape', 'attic-window', 'blue-tab', 'brownie', 'bruno-panhandle', 'bus', 'clock', 'fixer', 'gas-valve', 'kell-shot', 'tea', 'tiny-hit', 'tiny-recognize']);
  });
});

describe('chapter 1: clock and hints', () => {
  it('warnings only after reading the stakes, and the payphone costs 10 minutes and counts a hint', () => {
    const s = run([...ATTIC, ...TO_CLINIC, { verb: 'go', target: 'exit:thirdeye' }]);
    const t = s.state.minutes;
    const fx = s.act({ verb: 'use', target: 'payphone' });
    expect(s.state.minutes - t).toBe(10);
    expect(s.state.hintsUsed).toBe(1);
    expect(text(fx)).toMatch(/Dress the part/);
  });

  it('starts at 4:00 PM with intro text', () => {
    const { state, effects } = startChapter(ch1);
    expect(clockTime(ch1, state.minutes)).toBe('4:00 PM');
    expect(text(effects)).toMatch(/warrant/);
  });
});
