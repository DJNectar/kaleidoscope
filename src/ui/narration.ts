import { h } from './dom';
import { formatInto, plain } from './text';

export type LineKind = 'normal' | 'cmd' | 'warning' | 'system';
export interface Line { text: string; kind: LineKind }

const MAX_LINES = 30;
const SPEED: Record<string, number> = { slow: 22, normal: 9, fast: 3, instant: 0 }; // ms per char

/** Scrolling case report with a skippable typewriter effect. */
export class Narration {
  readonly el: HTMLElement;
  private list: HTMLElement;
  private lines: Line[] = [];
  private queue: Line[] = [];
  private typing: { line: Line; p: HTMLElement; i: number; timer: number } | null = null;
  private idleWaiters: (() => void)[] = [];
  speed = 'normal';

  constructor() {
    this.list = h('div', { class: 'lines', 'aria-live': 'polite', role: 'log' });
    this.el = h('section', { class: 'report', 'aria-label': 'Case report' },
      h('div', { class: 'head' }, h('b', {}, 'CASE REPORT'), h('span', {}, 'F. Tolliver, P.I.')),
      this.list,
    );
    this.el.addEventListener('click', () => this.skip());
  }

  get history(): string[] { return this.lines.map((l) => (l.kind === 'cmd' ? `› ${l.text}` : l.text)); }

  /** Replace everything (after a load or rewind) without typing. */
  reset(texts: string[]): void {
    this.cancel();
    this.lines = texts.map((t) => (t.startsWith('› ') ? { text: t.slice(2), kind: 'cmd' } : { text: t, kind: 'normal' }));
    this.list.replaceChildren(...this.lines.map((l) => this.render(l, true)));
  }

  push(text: string, kind: LineKind = 'normal'): void {
    this.queue.push({ text, kind });
    if (!this.typing) this.next();
  }

  /** Resolves when everything queued has finished typing. */
  idle(): Promise<void> {
    if (!this.typing && this.queue.length === 0) return Promise.resolve();
    return new Promise((r) => this.idleWaiters.push(r));
  }

  get busy(): boolean { return !!this.typing || this.queue.length > 0; }

  /** Finish the current line and everything queued instantly. */
  skip(): void {
    if (this.typing) { clearTimeout(this.typing.timer); this.finishTyping(); }
    while (this.queue.length) this.add(this.queue.shift()!, true);
    this.flushIdle();
  }

  private cancel(): void {
    if (this.typing) clearTimeout(this.typing.timer);
    this.typing = null;
    this.queue = [];
    this.flushIdle();
  }

  private next(): void {
    const line = this.queue.shift();
    if (!line) { this.flushIdle(); return; }
    const ms = SPEED[this.speed] ?? 9;
    if (ms === 0 || line.kind === 'cmd' || line.kind === 'system') { this.add(line, true); this.next(); return; }
    const p = this.add(line, false);
    const full = plain(line.text);
    const tick = () => {
      if (!this.typing) return;
      this.typing.i = Math.min(full.length, this.typing.i + 2);
      p.textContent = full.slice(0, this.typing.i);
      p.append(h('span', { class: 'caret' }));
      if (this.typing.i >= full.length) { this.finishTyping(); this.next(); return; }
      this.typing.timer = window.setTimeout(tick, ms * 2);
    };
    this.typing = { line, p, i: 0, timer: window.setTimeout(tick, ms) };
  }

  private finishTyping(): void {
    if (!this.typing) return;
    formatInto(this.typing.p, this.typing.line.text);
    this.typing = null;
  }

  private add(line: Line, complete: boolean): HTMLElement {
    this.lines.push(line);
    const p = this.render(line, complete);
    this.list.append(p);
    while (this.lines.length > MAX_LINES) { this.lines.shift(); this.list.firstElementChild?.remove(); }
    this.list.querySelectorAll('p').forEach((el, i, all) => el.classList.toggle('old', i < all.length - 6));
    return p;
  }

  private render(line: Line, complete: boolean): HTMLElement {
    const p = h('p', { class: line.kind });
    if (line.kind === 'cmd') p.textContent = `› ${line.text}`;
    else if (complete) formatInto(p, line.text);
    return p;
  }

  private flushIdle(): void {
    if (this.typing || this.queue.length) return;
    const w = this.idleWaiters; this.idleWaiters = [];
    w.forEach((f) => f());
  }
}
