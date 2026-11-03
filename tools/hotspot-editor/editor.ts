// Dev-only hotspot editor (not part of the production build).
// Run: npm run hotspots   →   http://localhost:5173/tools/hotspot-editor/
import { ch1 } from '../../src/chapters/ch1';
import type { Point, Shape } from '../../src/engine/types';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sceneSel = $<HTMLSelectElement>('scene'), art = $<HTMLImageElement>('art');
const svg = document.getElementById('svg') as unknown as SVGSVGElement;
const list = $<HTMLUListElement>('list'), out = $<HTMLTextAreaElement>('out'), compare = $<HTMLInputElement>('compare');
const NS = 'http://www.w3.org/2000/svg';

let sceneId = 'attic';
let shapes: Record<string, Point[]> = {};
let selected: string | null = null;
let drawing: Point[] | null = null;

const toPts = (s: Shape): Point[] => ('rect' in s
  ? [[s.rect[0], s.rect[1]], [s.rect[0] + s.rect[2], s.rect[1]], [s.rect[0] + s.rect[2], s.rect[1] + s.rect[3]], [s.rect[0], s.rect[1] + s.rect[3]]]
  : s.poly.map((p) => [p[0], p[1]] as Point));

function load(id: string): void {
  sceneId = id; selected = null; drawing = null;
  const sc = ch1.scenes[id]!;
  shapes = Object.fromEntries(sc.hotspots.map((h) => [h.id, toPts(h.shape)]));
  setArt();
  render();
}

function setArt(): void {
  const sc = ch1.scenes[sceneId]!;
  art.src = compare.checked ? `/art-source/ch1/${sceneId}.webp` : sc.art.image ?? `/art/ch1/${sceneId}.webp`;
}

function render(): void {
  svg.replaceChildren();
  for (const [id, pts] of Object.entries(shapes)) {
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
    if (id === selected) poly.classList.add('sel');
    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', String(pts[0]![0] + 4)); label.setAttribute('y', String(pts[0]![1] + 16));
    label.textContent = id;
    svg.append(poly, label);
  }
  if (drawing?.length) {
    const pl = document.createElementNS(NS, 'polyline');
    pl.setAttribute('points', drawing.map((p) => p.join(',')).join(' '));
    svg.append(pl);
  }
  list.replaceChildren(...Object.keys(shapes).map((id) => {
    const li = document.createElement('li'); const b = document.createElement('button');
    b.textContent = id; if (id === selected) b.className = 'sel';
    b.onclick = () => { selected = id; drawing = []; render(); };
    li.append(b); return li;
  }));
  out.value = Object.entries(shapes).map(([id, pts]) =>
    `${id}: shape: { poly: [${pts.map((p) => `[${p[0]}, ${p[1]}]`).join(', ')}] },`).join('\n');
}

svg.addEventListener('click', (e) => {
  if (!selected || !drawing) return;
  const r = svg.getBoundingClientRect();
  drawing.push([Math.round(((e.clientX - r.left) / r.width) * 1000), Math.round(((e.clientY - r.top) / r.height) * 625)]);
  render();
});
window.addEventListener('keydown', (e) => {
  if (!drawing) return;
  if (e.key === 'Enter' && selected && drawing.length >= 3) { shapes[selected] = drawing; drawing = null; render(); }
  else if (e.key === 'Backspace') { e.preventDefault(); drawing.pop(); render(); }
  else if (e.key === 'Escape') { drawing = null; render(); }
});
compare.addEventListener('change', setArt);
$<HTMLButtonElement>('copy').onclick = () => navigator.clipboard.writeText(out.value).catch(() => out.select());
sceneSel.append(...Object.values(ch1.scenes).map((s) => new Option(`${s.name} (${s.id})`, s.id)));
sceneSel.onchange = () => load(sceneSel.value);
load(sceneId);
