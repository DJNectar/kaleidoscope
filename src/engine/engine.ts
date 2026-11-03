import { cloneState, newState } from './state';
import { fallbackLine } from './fallbacks';
import type {
  ActionInput, ActionResult, Chapter, Ctx, Effect, FlagValue, GameState,
  Handler, HandlerResult, Hotspot, Item, Scene, TargetKind, Verb, WithTable,
} from './types';

export const DEFAULT_COSTS: Record<Verb, number> = {
  look: 1, take: 1, open: 1, close: 1, talk: 2, use: 1, give: 1, hit: 1, consume: 1, go: 4,
};

export const SELF = 'self';
export const EXIT_PREFIX = 'exit:';

// ───────────────────────── lookup helpers ─────────────────────────

export function currentScene(ch: Chapter, s: GameState): Scene {
  const sc = ch.scenes[s.scene];
  if (!sc) throw new Error(`Unknown scene: ${s.scene}`);
  return sc;
}

export function nameOf(n: string | ((s: GameState) => string), s: GameState): string {
  return typeof n === 'function' ? n(s) : n;
}

export function visibleHotspots(ch: Chapter, s: GameState): Hotspot[] {
  return currentScene(ch, s).hotspots.filter((h) => !h.visible || h.visible(s));
}

export function visibleExits(ch: Chapter, s: GameState) {
  return currentScene(ch, s).exits.filter((e) => !e.visible || e.visible(s));
}

export function targetName(ch: Chapter, s: GameState, id: string): string {
  if (id === SELF) return 'yourself';
  if (id.startsWith(EXIT_PREFIX)) {
    const to = id.slice(EXIT_PREFIX.length);
    const ex = currentScene(ch, s).exits.find((e) => e.to === to);
    return ex?.label ?? ch.scenes[to]?.name ?? to;
  }
  const item = ch.items[id];
  if (item && s.inventory.includes(id)) return nameOf(item.name, s);
  const hs = currentScene(ch, s).hotspots.find((h) => h.id === id);
  if (hs) return nameOf(hs.name, s);
  if (item) return nameOf(item.name, s);
  return id;
}

type Resolved =
  | { kind: 'hotspot'; hs: Hotspot }
  | { kind: 'item'; item: Item }
  | { kind: 'exit'; to: string }
  | { kind: 'self' };

function resolveTarget(ch: Chapter, s: GameState, id: string): Resolved | null {
  if (id === SELF) return { kind: 'self' };
  if (id.startsWith(EXIT_PREFIX)) {
    const to = id.slice(EXIT_PREFIX.length);
    return visibleExits(ch, s).some((e) => e.to === to) ? { kind: 'exit', to } : null;
  }
  if (s.inventory.includes(id) && ch.items[id]) return { kind: 'item', item: ch.items[id]! };
  const hs = visibleHotspots(ch, s).find((h) => h.id === id);
  return hs ? { kind: 'hotspot', hs } : null;
}

function asText(r: HandlerResult): string[] {
  if (r == null) return [];
  return Array.isArray(r) ? r.filter(Boolean) : [r];
}

// ───────────────────────── chapter start ─────────────────────────

export function startChapter(
  ch: Chapter,
  carry?: Record<string, FlagValue>,
): { state: GameState; effects: Effect[] } {
  const state = newState(ch, carry);
  const b = makeCtx(ch, state, { verb: 'go', target: state.scene });
  const effects: Effect[] = (ch.intro ?? []).map((text) => ({ type: 'narrate' as const, text }));
  b.pendingScene = state.scene;
  flushScene(ch, state, b, effects);
  effects.push(...b.effects);
  return { state, effects };
}

// ───────────────────────── ctx ─────────────────────────

interface CtxBundle {
  ctx: Ctx;
  effects: Effect[];
  costOverride: number | null;
  pendingScene: string | null;
  extraMinutes: number;
}

function makeCtx(ch: Chapter, d: GameState, input: ActionInput): CtxBundle {
  const b: CtxBundle = {
    effects: [], costOverride: null, pendingScene: null, extraMinutes: 0,
    ctx: undefined as unknown as Ctx,
  };
  const over = () => !!d.over;
  b.ctx = {
    get state() { return d; },
    verb: input.verb,
    target: input.target,
    ...(input.with !== undefined ? { with: input.with } : {}),
    has: (item) => d.inventory.includes(item),
    flag: (name) => d.flags[name],
    visited: (scene) => d.visited.includes(scene),
    give(item) {
      if (!ch.items[item]) throw new Error(`Unknown item: ${item}`);
      if (d.inventory.includes(item)) return;
      d.inventory.push(item);
      b.effects.push({ type: 'item', item, gained: true });
    },
    remove(item) {
      const i = d.inventory.indexOf(item);
      if (i < 0) return;
      d.inventory.splice(i, 1);
      b.effects.push({ type: 'item', item, gained: false });
    },
    set(flag, value = true) { d.flags[flag] = value; },
    unset(flag) { delete d.flags[flag]; },
    go(scene) {
      if (!ch.scenes[scene]) throw new Error(`Unknown scene: ${scene}`);
      b.pendingScene = scene;
    },
    die(deathId) {
      if (over()) return;
      const death = ch.deaths[deathId];
      if (!death) throw new Error(`Unknown death: ${deathId}`);
      d.deaths += 1;
      d.over = { kind: 'death', id: deathId };
      b.pendingScene = null;
      b.effects.push({ type: 'death', id: deathId, title: death.title, text: death.text });
    },
    shard(n, flashback) {
      if (d.shards.includes(n)) return;
      d.shards.push(n);
      d.shards.sort((x, y) => x - y);
      b.effects.push({ type: 'flashback', shard: n, text: flashback });
    },
    win(endingId) {
      if (over()) return;
      if (!ch.endings[endingId]) throw new Error(`Unknown ending: ${endingId}`);
      d.over = { kind: 'ending', id: endingId };
      b.pendingScene = null;
      b.effects.push({ type: 'ending', id: endingId });
    },
    advance(minutes) { b.extraMinutes += minutes; },
    cost(minutes) { b.costOverride = minutes; },
    note(entryId) {
      if (d.notebook.includes(entryId)) return;
      if (ch.notebook && !ch.notebook[entryId]) throw new Error(`Unknown notebook entry: ${entryId}`);
      d.notebook.push(entryId);
      b.effects.push({ type: 'notebook', id: entryId });
    },
    say(text, style = 'normal') { b.effects.push({ type: 'narrate', text, style }); },
    sound(id) { b.effects.push({ type: 'sound', id }); },
  };
  return b;
}

/** Apply a pending scene change and run the new scene's onEnter. */
function flushScene(ch: Chapter, d: GameState, b: CtxBundle, effects: Effect[]): void {
  let guard = 0;
  while (b.pendingScene && !d.over && guard++ < 5) {
    const to = b.pendingScene;
    b.pendingScene = null;
    d.scene = to;
    effects.push({ type: 'scene', scene: to });
    const enter = ch.scenes[to]!.onEnter;
    if (enter) {
      // onEnter sees visited() as false on the first visit
      const before = b.effects.length;
      const text = asText(enter(b.ctx));
      const added = b.effects.splice(before);
      effects.push(...text.map((t) => ({ type: 'narrate' as const, text: t })), ...added);
    }
    if (!d.visited.includes(to)) d.visited.push(to);
  }
}

// ───────────────────────── the action ─────────────────────────

export function act(ch: Chapter, state: GameState, input: ActionInput): ActionResult {
  const reject = (why: string): ActionResult => ({
    state, accepted: false, effects: [{ type: 'narrate', text: why, style: 'system' }],
  });
  if (state.over) return reject('The case is closed. Rewind, load or start again.');

  const target = resolveTarget(ch, state, input.target);
  if (!target) return reject("That isn't here.");
  if (input.with !== undefined) {
    if (!state.inventory.includes(input.with) || !ch.items[input.with]) return reject("You don't have that.");
    if (input.with === input.target) input = { verb: input.verb, target: input.target };
  }

  const d = cloneState(state);
  const b = makeCtx(ch, d, input);
  const { verb } = input;
  const sceneBefore = d.scene;

  const handler = findHandler(ch, d, target, input);
  let text: string[];
  if (handler) {
    text = asText(handler(b.ctx));
  } else {
    text = [genericLine(ch, d, target, input)];
  }

  // narration first, then side effects in the order they happened
  const effects: Effect[] = [...text.map((t) => ({ type: 'narrate' as const, text: t })), ...b.effects];
  b.effects.length = 0;
  flushScene(ch, d, b, effects);
  effects.push(...b.effects);
  b.effects.length = 0;

  // time
  if (!d.over) {
    let cost: number;
    if (b.costOverride !== null) cost = b.costOverride;
    else if (verb === 'look' && target.kind === 'item') cost = 0;
    else if (verb === 'go') {
      const moved = d.scene !== sceneBefore;
      const exit = target.kind === 'exit'
        ? ch.scenes[sceneBefore]!.exits.find((e) => e.to === target.to) : undefined;
      cost = moved ? exit?.minutes ?? ch.costs?.go ?? DEFAULT_COSTS.go : 1;
    } else cost = ch.costs?.[verb] ?? DEFAULT_COSTS[verb];
    d.minutes += cost + b.extraMinutes;
    runScheduler(ch, d, b, effects);
  }

  return { state: d, effects, accepted: true };
}

function findHandler(ch: Chapter, s: GameState, t: Resolved, input: ActionInput): Handler | undefined {
  const { verb } = input;
  const w = input.with;
  const scene = currentScene(ch, s);
  const twoTarget = verb === 'use' || verb === 'give';

  switch (t.kind) {
    case 'exit': {
      const exit = scene.exits.find((e) => e.to === t.to)!;
      if (verb === 'go') return exitHandler(exit.to, exit.guard);
      if (exit.hotspot) {
        const hs = scene.hotspots.find((h) => h.id === exit.hotspot);
        if (hs) return pairHandler(hs.verbs, hs.id, verb, w, ch) ?? scene.fallback?.[verb];
      }
      return scene.fallback?.[verb];
    }
    case 'hotspot': {
      const h = twoTarget ? pairHandler(t.hs.verbs, t.hs.id, verb, w, ch) : t.hs.verbs[verb as Exclude<Verb, 'use' | 'give'>];
      if (h) return h;
      if (verb === 'go') {
        const exit = scene.exits.find((e) => e.hotspot === t.hs.id && (!e.visible || e.visible(s)));
        if (exit) return exitHandler(exit.to, exit.guard);
      }
      return scene.fallback?.[verb];
    }
    case 'item': {
      if (twoTarget) return pairHandler(t.item.verbs, t.item.id, verb, w, ch);
      return t.item.verbs[verb as Exclude<Verb, 'use' | 'give'>];
    }
    case 'self': {
      if (twoTarget && w) {
        const tbl = ch.items[w]?.verbs[verb];
        if (typeof tbl === 'function') return tbl;
        if (tbl) return tbl[SELF] ?? tbl.none;
      }
      return scene.fallback?.[verb];
    }
  }
}

/**
 * USE / GIVE precedence, for target T and held item W:
 *   T's function handler → T[W] → W[T] → T.default → W.default.
 * With no held item: T's function handler → T.none.
 */
function pairHandler(
  v: Hotspot['verbs'], targetId: string, verb: Verb, w: string | undefined, ch: Chapter,
): Handler | undefined {
  const entry = v[verb as 'use' | 'give'] as Handler | WithTable | undefined;
  if (typeof entry === 'function') return entry;
  if (!w) return entry?.none;
  const exact = entry?.[w];
  if (exact) return exact;
  const wEntry = ch.items[w]?.verbs[verb as 'use' | 'give'] as Handler | WithTable | undefined;
  if (wEntry && typeof wEntry !== 'function') {
    const rev = wEntry[targetId];
    if (rev) return rev;
  }
  if (entry?.default) return entry.default;
  if (wEntry && typeof wEntry !== 'function') return wEntry.default;
  return undefined;
}

function exitHandler(to: string, guard?: (ctx: Ctx) => HandlerResult): Handler {
  return (ctx) => {
    if (guard) {
      const r = guard(ctx);
      if (ctx.state.over) return r;
      if (r) return r; // blocked
    }
    ctx.go(to);
  };
}

function kindOf(t: Resolved): TargetKind {
  switch (t.kind) {
    case 'exit': return 'exit';
    case 'item': return 'item';
    case 'self': return 'self';
    case 'hotspot': return t.hs.kind ?? 'object';
  }
}

function genericLine(ch: Chapter, s: GameState, t: Resolved, input: ActionInput): string {
  const name = targetName(ch, s, input.target);
  const withName = input.with ? targetName(ch, s, input.with) : undefined;
  if ((input.verb === 'use' || input.verb === 'give') && !withName && t.kind === 'item') {
    return input.verb === 'use' ? `Use the ${name} on what?` : `Give the ${name} to whom?`;
  }
  if (input.verb === 'give' && !withName) return `Give what to ${t.kind === 'hotspot' && t.hs.kind === 'person' ? name : 'the ' + name}? Pick something from your pockets first.`;
  return fallbackLine(input.verb, kindOf(t), name, `${input.verb}|${input.target}|${input.with ?? ''}|${s.minutes}`, withName);
}

// ───────────────────────── scheduler ─────────────────────────

function runScheduler(ch: Chapter, d: GameState, b: CtxBundle, effects: Effect[]): void {
  const due = ch.events
    .filter((e) => d.minutes >= e.at && !d.firedEvents.includes(e.id))
    .sort((a, z) => a.at - z.at);
  for (const ev of due) {
    if (d.over) break;
    if (ev.when && !ev.when(d)) continue;
    d.firedEvents.push(ev.id);
    const text = asText(ev.run(b.ctx));
    effects.push(...text.map((t) => ({ type: 'narrate' as const, text: t, style: 'warning' as const })), ...b.effects);
    b.effects.length = 0;
    flushScene(ch, d, b, effects);
    effects.push(...b.effects);
    b.effects.length = 0;
  }
}
