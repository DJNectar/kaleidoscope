import { clockTime, minutesLeft } from '../engine/clock';
import { EXIT_PREFIX, SELF, currentScene, nameOf, targetName, visibleExits } from '../engine/engine';
import { defaultProfile, loadProfile, recordDeath, recordEnding, saveProfile } from '../engine/profile';
import { getChapter, allChapters, nextChapter } from '../engine/registry';
import { SLOTS, readSave, writeSave, type Slot } from '../engine/save';
import type { Profile } from '../engine/saveSchema';
import { Session } from '../engine/session';
import type { Chapter, Effect, Verb } from '../engine/types';
import { TWO_TARGET_VERBS, VERBS } from '../engine/types';
import { svgIcon } from '../art/icons';
import { h, parseSvg, s } from './dom';
import { Narration } from './narration';
import { SceneView } from './scene';
import { formatInto } from './text';
import { VERB_ICONS } from './verbIcons';

const VERB_LABEL: Record<Verb, string> = {
  look: 'Look', take: 'Take', open: 'Open', close: 'Close', talk: 'Talk',
  use: 'Use', give: 'Give', hit: 'Hit', consume: 'Consume', go: 'Go',
};
const VERB_PHRASE: Record<Verb, string> = {
  look: 'Look at', take: 'Take', open: 'Open', close: 'Close', talk: 'Talk to',
  use: 'Use', give: 'Give', hit: 'Hit', consume: 'Consume', go: 'Go to',
};
const CLICK_DELAY = 230;

export class App {
  private session!: Session;
  private ch!: Chapter;
  private profile: Profile;
  private verb: Verb | null = null;
  private held: string | null = null;
  private hover: string | null = null;
  private busy = false;
  private clickTimer = 0;

  private root: HTMLElement;
  private narration = new Narration();
  private sceneView!: SceneView;
  private sentence = h('div', { class: 's', 'aria-live': 'polite' });
  private verbsEl = h('div', { class: 'verbs', role: 'toolbar', 'aria-label': 'Verbs' });
  private pocketsEl = h('div', { class: 'pockets', role: 'listbox', 'aria-label': 'Pockets' });
  private mapEl = h('div', { class: 'map' });
  private clockEl = h('div', { class: 'watch' });
  private shardsEl = h('div', { class: 'shards' });
  private titleEl = h('div', { class: 'case' });
  private overlay = h('div', { class: 'overlay', hidden: true });

  constructor(mount: HTMLElement, chapterId: string) {
    this.profile = loadProfile();
    this.applySettings();
    this.root = mount;
    this.ch = getChapter(chapterId)!;
    this.sceneView = new SceneView(this.ch, {
      click: (id) => this.onSceneClick(id),
      dblclick: (id) => this.onSceneDouble(id),
      drop: (item, id) => this.perform({ verb: 'use', target: id, with: item }),
      hover: (id) => { this.hover = id; this.renderSentence(); },
    });
    this.buildLayout();
    this.bindKeys();
    this.showTitle();
  }

  // ───────────────────────── layout ─────────────────────────

  private buildLayout(): void {
    const iconBtn = (label: string, icon: string, fn: () => void, extra = '') =>
      h('button', { class: `iconbtn ${extra}`, title: label, 'aria-label': label, onclick: fn }, parseSvg(icon));
    const header = h('header', {},
      h('div', { class: 'logo' }, 'Kaleidoscope'),
      this.titleEl,
      h('div', { class: 'grow' }),
      this.shardsEl,
      this.clockEl,
      iconBtn('Rewind (Ctrl+Z)', ICON_REWIND, () => this.rewind(), 'rewind'),
      iconBtn('Menu', ICON_MENU, () => this.showMenu(), 'menu'),
    );
    for (const [i, v] of VERBS.entries()) {
      const key = h('button', {
        class: 'key', 'data-verb': v, 'aria-pressed': 'false',
        title: `${VERB_LABEL[v]} (${(i + 1) % 10})`,
        onclick: () => this.selectVerb(v),
      }, h('small', {}, String((i + 1) % 10)), parseSvg(VERB_ICONS[v]), h('span', {}, VERB_LABEL[v].toUpperCase()));
      this.verbsEl.append(key);
    }
    const stage = h('main', { class: 'stage' },
      this.sceneView.el,
      h('div', { class: 'sentence' }, this.sentence,
        h('div', { class: 'hint' }, h('kbd', {}, 'DBL-CLICK'), ' look / go ', h('kbd', {}, 'ESC'), ' clear ', h('kbd', {}, 'SPACE'), ' show all')),
      h('div', { class: 'console' },
        h('section', { class: 'box verbsbox' }, h('h3', {}, 'VERBS'), this.verbsEl),
        h('section', { class: 'box pocketsbox' }, h('h3', {}, 'POCKETS'), this.pocketsEl)),
    );
    const aside = h('aside', {},
      this.narration.el,
      h('section', { class: 'box mapcard' }, h('h3', {}, 'EXITS'), this.mapEl));
    this.root.replaceChildren(h('div', { class: 'app' }, header, stage, aside), this.overlay);
    this.sceneView.el.addEventListener('click', () => this.clearSentence());
  }

  // ───────────────────────── game lifecycle ─────────────────────────

  private newGame(chapter = this.ch): void {
    this.ch = chapter;
    this.sceneView.setChapter(chapter);
    const carryFrom = Object.values(this.profile.chapterFlags).reduce((a, f) => ({ ...a, ...f }), {});
    const { session, effects } = Session.start(chapter, carryFrom);
    this.session = session;
    this.narration.reset([]);
    this.closeOverlay();
    this.clearSentence();
    this.renderAll();
    void this.play(effects);
  }

  private loadSlot(slot: Slot): boolean {
    const r = readSave(slot, allChapters());
    if (!r.ok) {
      this.toast(r.reason === 'empty' ? 'That slot is empty.' : 'That save is damaged or from another version. It was not loaded.');
      return false;
    }
    const ch = getChapter(r.save.state.chapter)!;
    this.ch = ch;
    this.sceneView.setChapter(ch);
    this.session = new Session(ch, r.save.state);
    this.narration.reset(r.save.narration);
    this.narration.push(`Loaded: ${r.save.label}.`, 'system');
    this.closeOverlay();
    this.clearSentence();
    this.renderAll();
    if (r.save.state.over) this.showOver();
    return true;
  }

  private save(slot: Slot): void {
    const st = this.session.state;
    const label = `${currentScene(this.ch, st).name}, ${clockTime(this.ch, st.minutes)}`;
    const ok = writeSave(slot, st, label, this.narration.history);
    if (slot !== 'auto') this.toast(ok ? `Saved to slot ${slot}.` : 'Saved for this session only: your browser is blocking storage.');
  }

  private rewind(): void {
    if (this.busy && !this.session.state.over) return;
    if (!this.session.rewind()) { this.toast('Nothing to rewind.'); return; }
    this.narration.skip();
    this.narration.push(`Rewound to ${clockTime(this.ch, this.session.state.minutes)}.`, 'system');
    this.busy = false;
    this.closeOverlay();
    this.sceneView.el.classList.remove('dead');
    this.clearSentence();
    this.renderAll();
  }

  // ───────────────────────── input ─────────────────────────

  private selectVerb(v: Verb): void {
    if (this.session.state.over) return;
    this.verb = this.verb === v ? null : v;
    this.held = null;
    this.renderVerbs(); this.renderPockets(); this.renderSentence();
  }

  private clearSentence(): void {
    this.verb = null; this.held = null;
    if (this.session) { this.renderVerbs(); this.renderPockets(); this.renderSentence(); }
  }

  private onSceneClick(id: string): void {
    window.clearTimeout(this.clickTimer);
    if (!this.verb) { this.defaultAction(id); return; }
    // wait a beat in case this is the first half of a double-click
    this.clickTimer = window.setTimeout(() => this.onTarget(id), CLICK_DELAY);
  }

  private onSceneDouble(id: string): void {
    window.clearTimeout(this.clickTimer);
    if (!this.verb) return; // single click already did the default
    this.verb = null; this.held = null;
    this.defaultAction(id);
  }

  private defaultAction(id: string): void {
    const isExit = id.startsWith(EXIT_PREFIX) || visibleExits(this.ch, this.session.state).some((e) => e.hotspot === id);
    void this.perform({ verb: isExit ? 'go' : 'look', target: id });
  }

  /** A target (hotspot, item, exit, self) was chosen with a verb active. */
  private onTarget(id: string): void {
    const v = this.verb;
    if (!v) { this.defaultAction(id); return; }
    const isItem = this.session.state.inventory.includes(id);
    if (TWO_TARGET_VERBS.includes(v)) {
      if (!this.held) {
        if (isItem) { this.held = id; this.renderPockets(); this.renderSentence(); return; }
        void this.perform({ verb: v, target: id });
        return;
      }
      const w = this.held;
      void this.perform(id === w ? { verb: v, target: id } : { verb: v, target: id, with: w });
      return;
    }
    void this.perform({ verb: v, target: id });
  }

  private onPocketClick(id: string): void {
    if (this.session.state.over) return;
    if (!this.verb) { void this.perform({ verb: 'look', target: id }); return; }
    this.onTarget(id);
  }

  private bindKeys(): void {
    window.addEventListener('keydown', (e) => {
      if (!this.session || (e.target as HTMLElement)?.closest?.('input, select, textarea')) return;
      if (!this.overlay.hidden && e.key !== 'Escape') {
        if (e.key === 'Enter' || e.key === ' ') {
          const btn = this.overlay.querySelector<HTMLButtonElement>('button.primary');
          if (btn && document.activeElement === document.body) { e.preventDefault(); btn.click(); }
        }
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); this.rewind(); return; }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[0-9]$/.test(e.key)) {
        const i = e.key === '0' ? 9 : Number(e.key) - 1;
        this.selectVerb(VERBS[i]!);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        if (!this.overlay.hidden && !this.session.state.over) this.closeOverlay();
        else this.clearSentence();
      } else if (e.key.toLowerCase() === 'i') {
        this.pocketsEl.querySelector<HTMLElement>('.slot')?.focus();
      } else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement) && !(e.target instanceof SVGElement)) {
        e.preventDefault();
        this.sceneView.viewEl.classList.add('reveal');
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === ' ') this.sceneView.viewEl.classList.remove('reveal');
    });
  }

  // ───────────────────────── acting ─────────────────────────

  private async perform(input: { verb: Verb; target: string; with?: string }): Promise<void> {
    if (this.busy || this.session.state.over) return;
    const st = this.session.state;
    const tName = targetName(this.ch, st, input.target);
    const cmd = input.with
      ? `${VERB_LABEL[input.verb]} ${targetName(this.ch, st, input.with)} ${input.verb === 'give' ? 'to' : 'on'} ${tName}`
      : `${VERB_PHRASE[input.verb]} ${tName}`;
    this.narration.skip();
    this.narration.push(cmd, 'cmd');
    const effects = this.session.act(input);
    this.verb = null; this.held = null;
    this.renderAll();
    await this.play(effects);
    // completion counter: lets automated tests wait for an action to finish
    document.body.dataset.acts = String(Number(document.body.dataset.acts ?? 0) + 1);
  }

  private async play(effects: Effect[]): Promise<void> {
    this.busy = true;
    for (const fx of effects) {
      switch (fx.type) {
        case 'narrate':
          this.narration.push(fx.text, fx.style === 'warning' ? 'warning' : fx.style === 'system' ? 'system' : 'normal');
          break;
        case 'scene':
          this.save('auto');
          break;
        case 'item':
          if (fx.gained) this.flashPocket(fx.item);
          break;
        case 'notebook':
          break;
        case 'flashback':
          await this.narration.idle();
          await this.showFlashback(fx.shard, fx.text);
          break;
        case 'death':
          await this.narration.idle();
          this.profile = recordDeath(this.profile, fx.id); saveProfile(this.profile);
          this.showDeath(fx.title, fx.text);
          break;
        case 'ending': {
          await this.narration.idle();
          const flags = this.ch.exportFlags?.(this.session.state) ?? {};
          this.profile = recordEnding(this.profile, fx.id, this.ch.id, flags); saveProfile(this.profile);
          this.showEnding(fx.id);
          break;
        }
        case 'sound':
          break;
      }
    }
    await this.narration.idle();
    if (!this.session.state.over) this.busy = false;
  }

  // ───────────────────────── rendering ─────────────────────────

  private renderAll(): void {
    const st = this.session.state;
    this.titleEl.replaceChildren(h('b', {}, this.ch.id === 'test' ? 'TEST CHAPTER' : `CASE No. ${this.ch.id.replace(/\D/g, '') || '1'}`), h('span', {}, this.ch.title.replace(/^.*?:\s*/, '')));
    this.sceneView.render(st);
    this.sceneView.el.classList.toggle('dead', st.over?.kind === 'death');
    const scene = currentScene(this.ch, st);
    document.documentElement.style.setProperty('--ink1', scene.art.inks[0]);
    document.documentElement.style.setProperty('--ink2', scene.art.inks[1]);
    this.renderClock(); this.renderShards(); this.renderVerbs(); this.renderPockets(); this.renderMap(); this.renderSentence();
  }

  private renderSentence(): void {
    if (!this.session) return;
    const st = this.session.state;
    const parts: (Node | string)[] = [];
    const hoverName = this.hover ? targetName(this.ch, st, this.hover) : '';
    if (!this.verb) {
      if (hoverName) parts.push(h('u', {}, hoverName));
      else parts.push(h('span', { class: 'dim' }, 'Pick a verb, or click something.'));
    } else {
      parts.push(h('span', { class: 'v' }, this.held ? VERB_LABEL[this.verb] : VERB_PHRASE[this.verb]), ' ');
      if (this.held) {
        parts.push(h('u', {}, targetName(this.ch, st, this.held)), ' ', h('span', { class: 'v' }, this.verb === 'give' ? 'to' : 'on'), ' ');
      }
      if (hoverName && this.hover !== this.held) parts.push(h('u', {}, hoverName));
      else if (TWO_TARGET_VERBS.includes(this.verb) && !this.held) parts.push(h('span', { class: 'dim' }, 'what?'));
    }
    parts.push(h('span', { class: 'caret' }));
    this.sentence.replaceChildren(...parts);
  }

  private renderVerbs(): void {
    this.verbsEl.querySelectorAll<HTMLElement>('.key').forEach((k) => {
      const on = k.dataset.verb === this.verb;
      k.classList.toggle('on', on);
      k.setAttribute('aria-pressed', String(on));
    });
  }

  private renderPockets(): void {
    const st = this.session.state;
    const slots: HTMLElement[] = st.inventory.map((id) => {
      const item = this.ch.items[id]!;
      const name = nameOf(item.name, st);
      const el = h('button', {
        class: `slot${this.held === id ? ' sel' : ''}`, 'data-item': id, title: name, 'aria-label': name,
        draggable: 'true', role: 'option',
        onclick: () => this.onPocketClick(id),
        onmouseenter: () => { this.hover = id; this.renderSentence(); },
        onmouseleave: () => { this.hover = null; this.renderSentence(); },
        ondragstart: ((e: DragEvent) => { e.dataTransfer?.setData('text/x-kaleido-item', id); }) as EventListener,
      }, parseSvg(item.icon()), h('span', { class: 'tip' }, name.toUpperCase()));
      return el;
    });
    const self = h('button', {
      class: 'slot self', 'data-item': SELF, title: 'Yourself', 'aria-label': 'Yourself',
      onclick: () => this.onPocketClick(SELF),
      onmouseenter: () => { this.hover = SELF; this.renderSentence(); },
      onmouseleave: () => { this.hover = null; this.renderSentence(); },
    }, parseSvg(svgIcon('self')), h('span', { class: 'tip' }, 'YOURSELF'));
    const min = 7;
    while (slots.length < min) slots.push(h('div', { class: 'slot empty', 'aria-hidden': 'true' }));
    this.pocketsEl.replaceChildren(self, ...slots);
  }

  private flashPocket(id: string): void {
    const el = this.pocketsEl.querySelector(`[data-item="${CSS.escape(id)}"]`);
    el?.classList.add('new');
    window.setTimeout(() => el?.classList.remove('new'), 1400);
  }

  private renderMap(): void {
    const st = this.session.state;
    const svg = s('svg', { viewBox: '0 0 340 150', role: 'group', 'aria-label': 'Exits' });
    const cx = 170, cy = 75;
    const exits = visibleExits(this.ch, st);
    // exits sit on an ellipse around "here", in the direction their map position points
    const pos = (m: [number, number]): [number, number] => {
      const a = Math.atan2(m[1] - 50, m[0] - 50);
      return [cx + Math.cos(a) * 112, cy + Math.sin(a) * 50];
    };
    for (const ex of exits) {
      const [x, y] = pos(ex.map);
      svg.append(s('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'road' }));
    }
    svg.append(
      s('rect', { x: cx - 50, y: cy - 16, width: 100, height: 32, class: 'here' }),
      s('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'heretxt' }, 'YOU ARE HERE'),
    );
    for (const ex of exits) {
      const [x, y] = pos(ex.map);
      const label = ex.label.toUpperCase().slice(0, 16);
      const w = Math.max(60, label.length * 7.6 + 14);
      const g = s('g', { class: 'exit', tabindex: 0, role: 'button', 'aria-label': `Go to ${ex.label}`, 'data-to': ex.to },
        s('rect', { x: x - w / 2, y: y - 14, width: w, height: 28 }),
        s('text', { x, y: y + 5, 'text-anchor': 'middle' }, label));
      const go = () => {
        if (this.verb) this.onTarget(EXIT_PREFIX + ex.to);
        else void this.perform({ verb: 'go', target: EXIT_PREFIX + ex.to });
      };
      g.addEventListener('click', go);
      g.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter') go(); });
      g.addEventListener('mouseenter', () => { this.hover = EXIT_PREFIX + ex.to; this.renderSentence(); });
      g.addEventListener('mouseleave', () => { this.hover = null; this.renderSentence(); });
      svg.append(g);
    }
    this.mapEl.replaceChildren(svg);
  }

  private renderClock(): void {
    const st = this.session.state;
    const wall = this.ch.clockStart + st.minutes;
    const left = minutesLeft(this.ch, st.minutes);
    const mAng = ((wall % 60) / 60) * 360;
    const hAng = (((wall / 60) % 12) / 12) * 360;
    const face = s('svg', { viewBox: '0 0 54 54', class: 'face', 'aria-hidden': 'true' },
      s('circle', { cx: 27, cy: 27, r: 23, class: 'bezel' }),
      s('circle', { cx: 27, cy: 27, r: 19, class: 'dial' }),
      ...[0, 90, 180, 270].map((a) => s('line', { x1: 27, y1: 9, x2: 27, y2: 13, class: 'tick', transform: `rotate(${a} 27 27)` })),
      s('line', { x1: 27, y1: 27, x2: 27, y2: 16, class: 'hour', transform: `rotate(${hAng} 27 27)` }),
      s('line', { x1: 27, y1: 27, x2: 27, y2: 11, class: 'min', transform: `rotate(${mAng} 27 27)` }),
      s('circle', { cx: 27, cy: 27, r: 2.2, class: 'pin' }));
    const hrs = Math.floor(left / 60), mins = left % 60;
    const leftTxt = left <= 0 ? 'TIME’S UP' : `${hrs ? `${hrs} HR${hrs > 1 ? 'S' : ''} ` : ''}${mins} MIN LEFT`;
    this.clockEl.replaceChildren(face, h('div', {},
      h('div', { class: 't', 'data-testid': 'clock' }, clockTime(this.ch, st.minutes)),
      h('div', { class: 'd' }, this.ch.dateLine),
      h('div', { class: 'left' }, leftTxt)));
    this.clockEl.classList.toggle('warn', left <= 30);
    this.clockEl.classList.toggle('urgent', left <= 15);
  }

  private renderShards(): void {
    const st = this.session.state;
    const gems = Array.from({ length: this.ch.shardCount }, (_, i) => {
      const got = st.shards.includes(i + 1);
      return s('svg', { viewBox: '0 0 24 28', class: got ? 'got' : '' },
        s('polygon', { points: '12,1 23,9 19,27 5,27 1,9' }),
        ...(got ? [s('polyline', { points: '1,9 12,13 23,9', class: 'facet' }), s('polyline', { points: '12,1 12,13 5,27', class: 'facet' }), s('polyline', { points: '12,13 19,27', class: 'facet' })] : []));
    });
    this.shardsEl.replaceChildren(...gems, h('small', {}, `${st.shards.length} / ${this.ch.shardCount}`));
    this.shardsEl.setAttribute('title', 'Memory shards');
  }

  // ───────────────────────── overlays ─────────────────────────

  private openOverlay(cls: string, ...children: (Node | string | null)[]): HTMLElement {
    const card = h('div', { class: `card ${cls}`, role: 'dialog', 'aria-modal': 'true' }, ...children);
    this.overlay.className = `overlay ${cls}-overlay`;
    this.overlay.replaceChildren(card);
    this.overlay.hidden = false;
    card.querySelector<HTMLElement>('button')?.focus();
    return card;
  }

  private closeOverlay(): void { this.overlay.hidden = true; this.overlay.replaceChildren(); }

  private showTitle(): void {
    const hasAuto = readSave('auto', allChapters()).ok;
    this.openOverlay('title',
      h('div', { class: 'logo big' }, 'Kaleidoscope'),
      h('p', { class: 'tag' }, 'A Haight-Ashbury Noir'),
      h('div', { class: 'buttons' },
        hasAuto ? h('button', { class: 'primary', onclick: () => { if (!this.loadSlot('auto')) this.newGame(); } }, 'Continue') : null,
        h('button', { class: hasAuto ? '' : 'primary', onclick: () => this.newGame() }, 'New Game'),
      ),
      h('p', { class: 'fine' }, this.ch.title));
  }

  private showFlashback(n: number, text: string): Promise<void> {
    return new Promise((resolve) => {
      this.renderShards();
      this.sceneView.el.classList.add('memory');
      const p = h('p', {}); formatInto(p, text.replace(/^\*|\*$/g, ''));
      const done = () => { this.sceneView.el.classList.remove('memory'); this.closeOverlay(); resolve(); };
      this.openOverlay('flashback',
        h('div', { class: 'burst', 'aria-hidden': 'true' }),
        h('b', {}, `MEMORY SHARD ${n} OF ${this.ch.shardCount}`),
        p,
        h('button', { class: 'primary', onclick: done }, 'Continue'));
    });
  }

  private showDeath(title: string, text: string): void {
    this.sceneView.el.classList.add('dead');
    const p = h('p', {}); formatInto(p, text);
    const found = this.profile.deathsSeen.length, total = Object.keys(this.ch.deaths).length;
    this.openOverlay('death',
      h('b', { class: 'kicker' }, 'YOU ARE DEAD'),
      h('h2', {}, title),
      p,
      h('div', { class: 'buttons' },
        h('button', { class: 'primary', onclick: () => this.rewind() }, 'Rewind'),
        h('button', { onclick: () => this.showLoad(true) }, 'Load'),
        h('button', { onclick: () => this.newGame() }, 'Restart')),
      h('small', {}, `Deaths found: ${found} / ${total}`));
    this.overlay.prepend(h('div', { class: 'crack', 'aria-hidden': 'true' }, parseSvg(CRACK_SVG)));
  }

  private showEnding(id: string): void {
    const st = this.session.state;
    const end = this.ch.endings[id]!;
    const body = typeof end.body === 'function' ? end.body(st) : end.body;
    const p = h('p', {}); formatInto(p, body);
    const next = nextChapter(this.ch.id);
    this.openOverlay('ending',
      h('div', { class: 'masthead' }, h('span', {}, 'S.F. EVENING CLARION'), h('span', {}, 'FINAL EDITION')),
      h('h2', {}, end.headline),
      p,
      h('dl', {},
        h('dt', {}, 'Time'), h('dd', {}, clockTime(this.ch, st.minutes)),
        h('dt', {}, 'Deaths'), h('dd', {}, String(st.deaths)),
        h('dt', {}, 'Hints'), h('dd', {}, String(st.hintsUsed)),
        h('dt', {}, 'Shards'), h('dd', {}, `${st.shards.length} / ${this.ch.shardCount}`)),
      h('div', { class: 'buttons' },
        next && end.win ? h('button', { class: 'primary', onclick: () => this.newGame(next) }, `Continue: ${next.title}`) : null,
        h('button', { class: next && end.win ? '' : 'primary', onclick: () => this.newGame() }, 'Play Again'),
        !end.win ? h('button', { onclick: () => this.rewind() }, 'Rewind') : null));
  }

  private showOver(): void {
    const o = this.session.state.over;
    if (!o) return;
    this.busy = true;
    if (o.kind === 'death') { const d = this.ch.deaths[o.id]!; this.showDeath(d.title, d.text); }
    else this.showEnding(o.id);
  }

  private showMenu(): void {
    const st = this.profile.settings;
    const speeds = ['slow', 'normal', 'fast', 'instant'] as const;
    this.openOverlay('menu',
      h('h2', {}, 'Menu'),
      h('div', { class: 'menu-grid' },
        h('button', { class: 'primary', onclick: () => this.closeOverlay() }, 'Resume'),
        h('button', { onclick: () => this.newGame() }, 'New Game'),
        h('button', { onclick: () => this.showSave() }, 'Save'),
        h('button', { onclick: () => this.showLoad(false) }, 'Load'),
        h('button', { onclick: () => { this.closeOverlay(); this.rewind(); }, disabled: !this.session?.canRewind }, `Rewind (${this.session?.rewindDepth ?? 0})`),
        h('button', { onclick: () => this.showNotebook() }, 'Case Notebook'),
        h('button', {
          onclick: () => {
            const i = (speeds.indexOf(st.textSpeed) + 1) % speeds.length;
            this.updateSettings({ textSpeed: speeds[i]! }); this.showMenu();
          },
        }, `Text speed: ${st.textSpeed}`),
        h('button', { onclick: () => { this.updateSettings({ textSize: st.textSize === 'normal' ? 'large' : st.textSize === 'large' ? 'small' : 'normal' }); this.showMenu(); } }, `Text size: ${st.textSize}`),
        h('button', { onclick: () => { this.updateSettings({ reducedMotion: !st.reducedMotion }); this.showMenu(); } }, `Reduced motion: ${st.reducedMotion ? 'on' : 'off'}`),
        h('button', { disabled: true, title: 'Audio arrives in milestone 5' }, 'Sound: off'),
        h('button', { onclick: () => this.showGallery() }, `Deaths found: ${this.profile.deathsSeen.filter((d) => this.ch.deaths[d]).length} / ${Object.keys(this.ch.deaths).length}`),
        h('button', { onclick: () => this.showCredits() }, 'Credits')));
  }

  private showSave(): void {
    this.openOverlay('menu', h('h2', {}, 'Save'),
      h('div', { class: 'slots' }, ...(['1', '2', '3'] as Slot[]).map((slot) => {
        const r = readSave(slot, allChapters());
        return h('button', { onclick: () => { this.save(slot); this.closeOverlay(); } },
          h('b', {}, `Slot ${slot}`), h('span', {}, r.ok ? r.save.label : 'empty'));
      })),
      h('button', { onclick: () => this.showMenu() }, 'Back'));
  }

  private showLoad(fromDeath: boolean): void {
    this.openOverlay('menu', h('h2', {}, 'Load'),
      h('div', { class: 'slots' }, ...SLOTS.map((slot) => {
        const r = readSave(slot, allChapters());
        return h('button', { disabled: !r.ok, onclick: () => { if (this.loadSlot(slot)) this.busy = !!this.session.state.over; } },
          h('b', {}, slot === 'auto' ? 'Autosave' : `Slot ${slot}`), h('span', {}, r.ok ? r.save.label : r.reason === 'empty' ? 'empty' : 'unreadable'));
      })),
      h('button', { onclick: () => (fromDeath ? this.showOver() : this.showMenu()) }, 'Back'));
  }

  private showNotebook(): void {
    const entries = this.session.state.notebook.map((id) => this.ch.notebook?.[id]).filter(Boolean);
    this.openOverlay('menu notebook', h('h2', {}, 'Case Notebook'),
      entries.length
        ? h('ul', {}, ...entries.map((e) => { const p = h('span', {}); formatInto(p, e!.text); return h('li', {}, h('b', {}, e!.title), p); }))
        : h('p', {}, 'Blank pages. Your memory, in paper form.'),
      h('button', { class: 'primary', onclick: () => this.showMenu() }, 'Back'));
  }

  private showGallery(): void {
    const all = Object.values(this.ch.deaths);
    this.openOverlay('menu gallery', h('h2', {}, 'Death Gallery'),
      h('ul', {}, ...all.map((d) => this.profile.deathsSeen.includes(d.id)
        ? h('li', { class: 'seen' }, h('b', {}, d.title), h('span', {}, d.text))
        : h('li', {}, h('b', {}, '? ? ?'), h('span', {}, 'Not yet.')))),
      h('button', { class: 'primary', onclick: () => this.showMenu() }, 'Back'));
  }

  private showCredits(): void {
    this.openOverlay('menu', h('h2', {}, 'Credits'),
      h('p', {}, 'Kaleidoscope: an original noir adventure. Story, characters and code are original works. All characters, bands and organizations are fictional.'),
      h('p', {}, 'Fonts: Shrikhand, Oswald, Courier Prime and Special Elite, all under the SIL Open Font License.'),
      h('p', {}, 'No analytics. No tracking. Saves stay in your browser.'),
      h('button', { class: 'primary', onclick: () => this.showMenu() }, 'Back'));
  }

  private toast(text: string): void {
    const t = h('div', { class: 'toast', role: 'status' }, text);
    document.body.append(t);
    window.setTimeout(() => t.remove(), 2600);
  }

  private updateSettings(patch: Partial<Profile['settings']>): void {
    this.profile = { ...this.profile, settings: { ...this.profile.settings, ...patch } };
    saveProfile(this.profile);
    this.applySettings();
  }

  private applySettings(): void {
    const st = (this.profile ?? defaultProfile()).settings;
    this.narration.speed = st.textSpeed;
    const root = document.documentElement;
    root.dataset.textSize = st.textSize;
    root.classList.toggle('reduced-motion', st.reducedMotion);
  }
}

const ICON_REWIND = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 9 9 9"/></svg>';
const ICON_MENU = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>';
const CRACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 625" preserveAspectRatio="none" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M520 300 L470 0 M520 300 L700 0 M520 300 L1000 140 M520 300 L1000 470 M520 300 L760 625 M520 300 L380 625 M520 300 L0 560 M520 300 L0 210 M520 300 L230 0"/><path d="M470 250 L560 240 L600 330 L500 370 L440 320 Z M400 190 L640 170 L720 360 L560 460 L360 400 Z" stroke-width="1.6"/><path d="M300 120 L780 90 L900 420 L640 560 L250 520 L170 300 Z" stroke-width="1.1" opacity=".8"/></svg>';
