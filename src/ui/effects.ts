// Living effects layered over the scene art (brief §11.5): ambient particles
// and light on a canvas, plus time-of-day grading on a tint layer.
// Everything here is decorative: pointer-events none, off under reduced motion.
import type { EffectId, GameState, Scene } from '../engine/types';

interface Particle { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number }

const reducedMotion = () =>
  document.documentElement.classList.contains('reduced-motion') ||
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Game minutes since 4:00 PM → grading for outdoor scenes. */
export function gradeFor(minutes: number, outdoor: boolean): { tint: string; opacity: number; darken: number } {
  const t = Math.max(0, Math.min(1, minutes / 210));
  // 4:00 bright → 6:00 orange/red → 7:15+ violet/indigo
  const stops: [number, [number, number, number], number, number][] = [
    [0.0, [255, 200, 120], 0.0, 0.0],
    [0.55, [240, 110, 40], 0.22, 0.05],
    [0.85, [90, 40, 150], 0.34, 0.22],
    [1.0, [40, 25, 110], 0.42, 0.34],
  ];
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1]![0]) i++;
  const [t0, c0, o0, d0] = stops[i]!; const [t1, c1, o1, d1] = stops[i + 1]!;
  const k = (t - t0) / (t1 - t0 || 1);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * k);
  const scale = outdoor ? 1 : 0.35; // interiors with windows get a subtler version
  return {
    tint: `rgb(${mix(c0[0], c1[0])},${mix(c0[1], c1[1])},${mix(c0[2], c1[2])})`,
    opacity: (o0 + (o1 - o0) * k) * scale,
    darken: (d0 + (d1 - d0) * k) * scale,
  };
}

export class SceneEffects {
  readonly canvas: HTMLCanvasElement;
  readonly tint: HTMLDivElement;
  readonly shade: HTMLDivElement;
  private ctx: CanvasRenderingContext2D | null;
  private effects: EffectId[] = [];
  private particles: Particle[] = [];
  private raf = 0;
  private t = 0;
  private w = 0;
  private h = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'fx';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    this.tint = document.createElement('div');
    this.tint.className = 'fx-tint';
    this.shade = document.createElement('div');
    this.shade.className = 'fx-shade';
  }

  /** Called on every render; cheap when nothing changed. */
  update(scene: Scene, state: GameState): void {
    const g = gradeFor(state.minutes, !!scene.art.outdoor);
    const windowed = scene.art.outdoor || ['attic', 'landing', 'studio', 'clinic', 'parlor'].includes(scene.id);
    this.tint.style.background = g.tint;
    this.tint.style.opacity = String(windowed ? g.opacity : 0);
    this.shade.style.opacity = String(windowed ? g.darken : 0);

    const want = [...(scene.art.effects ?? [])];
    if (scene.id === 'owl' && state.flags.lightShow) want.push('oilwheel');
    const key = want.join(',');
    if (key !== this.effects.join(',')) {
      this.effects = want;
      this.particles = [];
      this.start();
    }
  }

  private start(): void {
    cancelAnimationFrame(this.raf);
    if (!this.ctx || this.effects.length === 0 || reducedMotion()) {
      this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    const loop = () => { this.frame(); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void { cancelAnimationFrame(this.raf); }

  private resize(): boolean {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (!w || !h) return false;
    if (w !== this.canvas.width || h !== this.canvas.height) { this.canvas.width = w; this.canvas.height = h; }
    this.w = w; this.h = h;
    return true;
  }

  private frame(): void {
    const c = this.ctx!;
    if (!this.resize()) return;
    this.t += 1;
    c.clearRect(0, 0, this.w, this.h);
    for (const e of this.effects) this.draw(e, c);
  }

  private spawn(n: number, make: () => Particle): void {
    while (this.particles.length < n) this.particles.push(make());
  }

  private draw(e: EffectId, c: CanvasRenderingContext2D): void {
    const { w, h, t } = this;
    const rnd = Math.random;
    switch (e) {
      case 'dust': {
        this.spawn(70, () => ({ x: rnd() * w, y: rnd() * h, vx: (rnd() - 0.5) * 0.15, vy: (rnd() - 0.3) * 0.12, r: 0.6 + rnd() * 1.6, a: 0.2 + rnd() * 0.5, life: rnd() * 6 }));
        c.fillStyle = '#fff6d8';
        for (const p of this.particles) {
          p.x += p.vx + Math.sin((t + p.life * 100) / 90) * 0.12; p.y += p.vy; p.life += 0.004;
          if (p.y < 0) p.y = h; if (p.y > h) p.y = 0; if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
          c.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.life * 3));
          c.beginPath(); c.arc(p.x, p.y, p.r * (w / 1000), 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
        break;
      }
      case 'smoke': {
        this.spawn(26, () => ({ x: w * (0.5 + rnd() * 0.12), y: h * (0.5 + rnd() * 0.2), vx: (rnd() - 0.5) * 0.3, vy: -0.25 - rnd() * 0.35, r: 14 + rnd() * 26, a: 0, life: rnd() }));
        for (const p of this.particles) {
          p.x += p.vx + Math.sin((t + p.r * 10) / 60) * 0.35; p.y += p.vy; p.life += 0.003; p.r += 0.05;
          if (p.y < -60 || p.life > 1) { p.x = w * (0.5 + rnd() * 0.12); p.y = h * (0.55 + rnd() * 0.15); p.life = 0; p.r = 14 + rnd() * 20; }
          const a = Math.sin(p.life * Math.PI) * 0.12;
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (w / 1000) * 2);
          g.addColorStop(0, `rgba(240,235,255,${a})`); g.addColorStop(1, 'rgba(240,235,255,0)');
          c.fillStyle = g; c.fillRect(p.x - p.r * 4, p.y - p.r * 4, p.r * 8, p.r * 8);
        }
        break;
      }
      case 'fog': {
        for (let i = 0; i < 4; i++) {
          const x = ((t * (0.15 + i * 0.05) + i * w * 0.3) % (w * 1.4)) - w * 0.2;
          const y = h * (0.42 + i * 0.05);
          const g = c.createRadialGradient(x, y, 0, x, y, w * 0.25);
          g.addColorStop(0, 'rgba(220,235,235,0.10)'); g.addColorStop(1, 'rgba(220,235,235,0)');
          c.fillStyle = g; c.fillRect(0, 0, w, h);
        }
        break;
      }
      case 'flicker': {
        const off = Math.sin(t * 0.7) > 0.96 || (t % 240 < 6 && Math.sin(t) > 0);
        c.fillStyle = off ? 'rgba(0,0,0,0.22)' : 'rgba(255,240,200,0.03)';
        c.fillRect(0, 0, w, h);
        break;
      }
      case 'oilwheel': {
        c.save();
        c.globalCompositeOperation = 'screen';
        for (let i = 0; i < 5; i++) {
          const a = t / (200 + i * 40) + i * 1.3;
          const x = w * (0.62 + Math.cos(a) * 0.12), y = h * (0.32 + Math.sin(a * 1.3) * 0.12);
          const r = w * (0.06 + 0.02 * Math.sin(a * 2));
          const g = c.createRadialGradient(x, y, 0, x, y, r);
          const col = i % 2 ? '214,36,159' : '42,92,255';
          g.addColorStop(0, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`);
          c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        }
        c.restore();
        break;
      }
      case 'drapes': {
        const sway = Math.sin(t / 120) * 0.5 + 0.5;
        const g = c.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, `rgba(0,0,0,${0.05 + sway * 0.05})`); g.addColorStop(0.15, 'rgba(0,0,0,0)');
        g.addColorStop(0.85, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.1 - sway * 0.05})`);
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        break;
      }
    }
  }
}
