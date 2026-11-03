import { nameOf, visibleHotspots } from '../engine/engine';
import type { Chapter, GameState, Hotspot, Shape } from '../engine/types';
import { SPACE_H, SPACE_W } from '../engine/types';
import { h, s } from './dom';

export interface SceneHandlers {
  click(id: string): void;
  dblclick(id: string): void;
  drop(itemId: string, id: string): void;
  hover(id: string | null): void;
}

function shapePoints(shape: Shape): [number, number][] {
  if ('rect' in shape) {
    const [x, y, w, hh] = shape.rect;
    return [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]];
  }
  return shape.poly;
}

function centroid(pts: [number, number][]): [number, number] {
  const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, Math.min(...ys)];
}

/** The scene window: art (or labelled placeholder) plus hotspot polygons. */
export class SceneView {
  readonly el: HTMLElement;
  private view: HTMLElement;
  private label: HTMLElement;
  private caption: HTMLElement;
  private art: HTMLElement;
  private svg: SVGSVGElement;
  private sceneId = '';
  private names = new Map<string, string>();

  constructor(private ch: Chapter, private on: SceneHandlers) {
    this.art = h('div', { class: 'art' });
    this.svg = s('svg', { class: 'hot', viewBox: `0 0 ${SPACE_W} ${SPACE_H}`, preserveAspectRatio: 'none' });
    this.caption = h('div', { class: 'caption' });
    this.label = h('div', { class: 'label', hidden: true });
    this.view = h('div', { class: 'view' }, this.art, this.svg, this.caption, this.label);
    this.el = h('div', { class: 'frame' }, this.view);
    this.view.addEventListener('pointerleave', () => this.showLabel(null));
  }

  setChapter(ch: Chapter): void { this.ch = ch; this.sceneId = ''; }

  get viewEl(): HTMLElement { return this.view; }

  render(state: GameState): void {
    const scene = this.ch.scenes[state.scene]!;
    if (scene.id !== this.sceneId) {
      this.sceneId = scene.id;
      this.renderArt(scene.art.image, scene.art.placeholder, scene.art.inks);
      this.caption.replaceChildren(scene.name.toUpperCase());
      this.el.style.setProperty('--ink1', scene.art.inks[0]);
      this.el.style.setProperty('--ink2', scene.art.inks[1]);
    }
    this.renderHotspots(visibleHotspots(this.ch, state), state);
  }

  private renderArt(image: string | undefined, placeholder: string, inks: [string, string]): void {
    this.view.classList.toggle('placeholder', !image);
    if (image) {
      this.art.replaceChildren(h('img', { src: image, alt: '', draggable: 'false' }));
    } else {
      const ph = h('div', { class: 'ph' }, h('span', {}, placeholder), h('small', {}, 'placeholder art'));
      ph.style.setProperty('--a', inks[0]);
      ph.style.setProperty('--b', inks[1]);
      this.art.replaceChildren(ph);
    }
  }

  private renderHotspots(list: Hotspot[], state: GameState): void {
    this.names.clear();
    const nodes: SVGElement[] = [];
    for (const hs of list) {
      const name = nameOf(hs.name, state);
      this.names.set(hs.id, name);
      const pts = shapePoints(hs.shape);
      const poly = s('polygon', { points: pts.map((p) => p.join(',')).join(' ') });
      const [cx, cy] = centroid(pts);
      const tag = s('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', class: 'phname' }, name.toUpperCase());
      const g = s('g', {
        class: `hs ${hs.kind ?? 'object'}`, tabindex: 0, role: 'button',
        'aria-label': name, 'data-id': hs.id,
      }, poly, tag);
      g.addEventListener('click', (e) => { e.stopPropagation(); if ((e as MouseEvent).detail <= 1) this.on.click(hs.id); });
      g.addEventListener('dblclick', (e) => { e.stopPropagation(); this.on.dblclick(hs.id); });
      g.addEventListener('keydown', (e) => {
        const k = (e as KeyboardEvent).key;
        if (k === 'Enter' || k === ' ') { e.preventDefault(); e.stopPropagation(); this.on.click(hs.id); }
      });
      g.addEventListener('pointerenter', () => this.showLabel(hs.id, pts));
      g.addEventListener('focus', () => this.showLabel(hs.id, pts));
      g.addEventListener('blur', () => this.showLabel(null));
      g.addEventListener('dragover', (e) => { e.preventDefault(); g.classList.add('drop'); this.showLabel(hs.id, pts); });
      g.addEventListener('dragleave', () => g.classList.remove('drop'));
      g.addEventListener('drop', (e) => {
        e.preventDefault(); g.classList.remove('drop');
        const item = (e as DragEvent).dataTransfer?.getData('text/x-kaleido-item');
        if (item) this.on.drop(item, hs.id);
      });
      nodes.push(g);
    }
    this.svg.replaceChildren(...nodes);
  }

  private showLabel(id: string | null, pts?: [number, number][]): void {
    this.on.hover(id);
    if (!id || !pts) { this.label.hidden = true; return; }
    const ys = pts.map((p) => p[1]); const xs = pts.map((p) => p[0]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const bottom = Math.max(...ys);
    const above = bottom > SPACE_H * 0.86;
    this.label.textContent = (this.names.get(id) ?? id).toUpperCase();
    this.label.style.left = `${Math.min(92, Math.max(8, (cx / SPACE_W) * 100))}%`;
    this.label.style.top = `${((above ? Math.min(...ys) : bottom) / SPACE_H) * 100}%`;
    this.label.classList.toggle('above', above);
    this.label.hidden = false;
  }
}
