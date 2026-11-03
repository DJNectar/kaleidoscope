import { act, startChapter } from './engine';
import { cloneState } from './state';
import type { ActionInput, Chapter, Effect, FlagValue, GameState } from './types';

export const REWIND_DEPTH = 20;

/** A playthrough: current state plus the rewind history. DOM-free. */
export class Session {
  state: GameState;
  private history: GameState[] = [];

  constructor(public chapter: Chapter, state?: GameState) {
    this.state = state ?? startChapter(chapter).state;
  }

  static start(chapter: Chapter, carry?: Record<string, FlagValue>): { session: Session; effects: Effect[] } {
    const { state, effects } = startChapter(chapter, carry);
    return { session: new Session(chapter, state), effects };
  }

  act(input: ActionInput): Effect[] {
    const res = act(this.chapter, this.state, input);
    if (!res.accepted) return res.effects;
    this.history.push(this.state);
    if (this.history.length > REWIND_DEPTH) this.history.shift();
    this.state = res.state;
    return res.effects;
  }

  get canRewind(): boolean { return this.history.length > 0; }
  get rewindDepth(): number { return this.history.length; }

  /** Undo the last action. Deaths and hints used stay on the record. */
  rewind(): boolean {
    const prev = this.history.pop();
    if (!prev) return false;
    const keep = { deaths: this.state.deaths, hintsUsed: this.state.hintsUsed };
    this.state = { ...cloneState(prev), ...keep };
    return true;
  }

  /** Replace the state (after a load); history starts fresh. */
  load(state: GameState): void {
    this.state = cloneState(state);
    this.history = [];
  }
}
