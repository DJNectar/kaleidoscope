// Core engine types. The engine is DOM-free: it takes a state and an action
// and returns a new state plus a list of effects for the UI to play.

export const SAVE_VERSION = 1 as const;

export type Verb =
  | 'look' | 'take' | 'open' | 'close' | 'talk'
  | 'use' | 'give' | 'hit' | 'consume' | 'go';

export const VERBS: readonly Verb[] = [
  'look', 'take', 'open', 'close', 'talk', 'use', 'give', 'hit', 'consume', 'go',
];

/** Verbs that take a second target ("Use knife on door"). */
export const TWO_TARGET_VERBS: readonly Verb[] = ['use', 'give'];

export type FlagValue = boolean | number | string;

export interface GameState {
  version: typeof SAVE_VERSION;
  chapter: string;
  scene: string;
  /** Minutes elapsed since the chapter's start time. */
  minutes: number;
  inventory: string[];
  flags: Record<string, FlagValue>;
  /** Shard ids (1–5) found, in any order. */
  shards: number[];
  visited: string[];
  /** Survives rewind. */
  deaths: number;
  /** Survives rewind. */
  hintsUsed: number;
  firedEvents: string[];
  notebook: string[];
  /** Set when the run is over (death or ending); blocks further actions. */
  over?: { kind: 'death' | 'ending'; id: string };
  /** Flags handed over from the previous chapter. */
  carry?: Record<string, FlagValue>;
}

// ── Geometry: normalized to the art, 0–1000 × 0–625 ──
export const SPACE_W = 1000;
export const SPACE_H = 625;
export type Point = [number, number];
export type Shape = { rect: [number, number, number, number] } | { poly: Point[] };

// ── Handlers ──
export type HandlerResult = string | string[] | void;
export type Handler = (ctx: Ctx) => HandlerResult;
/** Second-target table keyed by item id; `default` = any other item, `none` = no item. */
export type WithTable = { [itemId: string]: Handler | undefined; default?: Handler; none?: Handler };
export type VerbHandlers = Partial<Record<Exclude<Verb, 'use' | 'give'>, Handler>> & {
  use?: Handler | WithTable;
  give?: Handler | WithTable;
};

export type TargetKind = 'object' | 'person' | 'exit' | 'item' | 'self';

export interface Hotspot {
  id: string;
  name: string | ((s: GameState) => string);
  shape: Shape;
  kind?: Exclude<TargetKind, 'item' | 'self'>;
  visible?: (s: GameState) => boolean;
  verbs: VerbHandlers;
}

export interface Exit {
  to: string;
  label: string;
  /** Hotspot id in the scene that also acts as this exit, if any. */
  hotspot?: string;
  /** Overrides the default GO cost. */
  minutes?: number;
  visible?: (s: GameState) => boolean;
  /** Return text to block the exit; call ctx.die() inside to kill. */
  guard?: (ctx: Ctx) => HandlerResult;
  /** Position on the mini-map, 0–100 in each axis. */
  map: [number, number];
}

export type EffectId = 'dust' | 'smoke' | 'flicker' | 'fog' | 'oilwheel' | 'drapes';

export interface SceneArt {
  /** Path to the final image under /public. Leave unset for a placeholder. */
  image?: string;
  /** Text drawn on the placeholder box. */
  placeholder: string;
  /** The scene's two screenprint inks. */
  inks: [string, string];
  outdoor?: boolean;
  effects?: EffectId[];
}

export interface Scene {
  id: string;
  name: string;
  art: SceneArt;
  onEnter?: Handler;
  hotspots: Hotspot[];
  exits: Exit[];
  /** Scene-level fallback before the global generic lines. */
  fallback?: Partial<Record<Verb, Handler>>;
}

export interface Item {
  id: string;
  name: string | ((s: GameState) => string);
  /** Returns an SVG string. */
  icon: () => string;
  verbs: VerbHandlers;
}

export interface Death { id: string; title: string; text: string }

export interface Ending {
  id: string;
  headline: string;
  body: string | ((s: GameState) => string);
  win: boolean;
}

export interface TimedEvent {
  id: string;
  /** Fires once when state.minutes reaches this value. */
  at: number;
  when?: (s: GameState) => boolean;
  run: Handler;
}

export interface NotebookEntry { id: string; title: string; text: string }

export interface Chapter {
  id: string;
  title: string;
  /** Wall-clock start of minute 0, as minutes after midnight. */
  clockStart: number;
  /** Minutes after start at which the chapter is lost. */
  deadline: number;
  dateLine: string;
  startScene: string;
  startInventory?: string[];
  startFlags?: Record<string, FlagValue>;
  intro?: string[];
  scenes: Record<string, Scene>;
  items: Record<string, Item>;
  deaths: Record<string, Death>;
  endings: Record<string, Ending>;
  events: TimedEvent[];
  notebook?: Record<string, NotebookEntry>;
  /** Text for each shard's flashback, keyed by shard number. */
  shardCount: number;
  /** Optional per-verb time costs (defaults in engine). */
  costs?: Partial<Record<Verb, number>>;
  /** Flags exported for the next chapter. */
  exportFlags?: (s: GameState) => Record<string, FlagValue>;
}

// ── Effects: what the UI plays after an action ──
export type Effect =
  | { type: 'narrate'; text: string; style?: 'normal' | 'warning' | 'system' }
  | { type: 'flashback'; shard: number; text: string }
  | { type: 'scene'; scene: string }
  | { type: 'item'; item: string; gained: boolean }
  | { type: 'death'; id: string; title: string; text: string }
  | { type: 'ending'; id: string }
  | { type: 'notebook'; id: string }
  | { type: 'sound'; id: string };

export interface ActionInput {
  verb: Verb;
  /** Hotspot id, item id, exit target ('exit:<scene>') or 'self'. */
  target: string;
  /** Second target for USE / GIVE (an item id). */
  with?: string;
}

export interface ActionResult {
  state: GameState;
  effects: Effect[];
  /** False if the action was rejected (e.g. game over) and nothing changed. */
  accepted: boolean;
}

/** Helpers handed to every handler. */
export interface Ctx {
  readonly state: Readonly<GameState>;
  readonly verb: Verb;
  readonly target: string;
  readonly with?: string;
  has(item: string): boolean;
  flag(name: string): FlagValue | undefined;
  visited(scene: string): boolean;
  give(item: string): void;
  remove(item: string): void;
  set(flag: string, value?: FlagValue): void;
  unset(flag: string): void;
  go(scene: string): void;
  die(deathId: string): void;
  shard(n: number, flashback: string): void;
  win(endingId: string): void;
  advance(minutes: number): void;
  /** Override the default time cost of this action. */
  cost(minutes: number): void;
  note(entryId: string): void;
  say(text: string, style?: 'normal' | 'warning' | 'system'): void;
  sound(id: string): void;
}
