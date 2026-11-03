// Palette lock (brief §11.2b). For each scene in art-source/ch1:
//   1. trim the paper border the generator adds,
//   2. fit into 16:10 at 1920×1200 (letterbox in ink-black; or crop with fit "cover"),
//   3. light edge-preserving smoothing (median),
//   4. quantize every pixel to the scene's two inks + off-white + black (+ optional extras),
//   5. remove isolated specks (majority filter),
//   6. write public/art/ch1/<scene>.webp.
// Re-runnable. Usage: node scripts/palette-lock.ts [scene ...]   (no args = every source image)
// Per-scene settings live in scripts/palette-lock.config.json; `"lock": false` skips steps 4–5.
import sharp from 'sharp';
import { readFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, parse } from 'node:path';

type Hex = string;
interface SceneCfg {
  inks: [Hex, Hex];
  extra?: Hex[];          // colours to keep besides the inks (e.g. a turquoise chair)
  lock?: boolean;         // false = trim + fit only
  fit?: 'contain' | 'cover';
  smooth?: number;        // median window (odd, 1 = off)
  speck?: number;         // majority-filter passes
  trim?: number;          // extra pixels shaved off each edge after border detection
}

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'art-source/ch1');
const OUT = join(ROOT, 'public/art/ch1');
const W = 1920, H = 1200;
const PAPER: Hex = '#f1e7cf';
const BLACK: Hex = '#120e12';

const cfgAll = JSON.parse(readFileSync(join(ROOT, 'scripts/palette-lock.config.json'), 'utf8')) as Record<string, SceneCfg>;
const rgb = (h: Hex) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];

async function borderBox(file: string): Promise<{ left: number; top: number; width: number; height: number }> {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info; const paper = [238, 232, 214];
  const isArt = (x: number, y: number) => {
    const i = (y * width + x) * 3;
    return Math.abs(data[i]! - paper[0]!) + Math.abs(data[i + 1]! - paper[1]!) + Math.abs(data[i + 2]! - paper[2]!) > 60;
  };
  const rowArt = (y: number) => { let n = 0; for (let x = 0; x < width; x++) n += +isArt(x, y); return n / width > 0.5; };
  const colArt = (x: number) => { let n = 0; for (let y = 0; y < height; y++) n += +isArt(x, y); return n / height > 0.5; };
  let t = 0, b = height - 1, l = 0, r = width - 1;
  while (t < b && !rowArt(t)) t++; while (b > t && !rowArt(b)) b--;
  while (l < r && !colArt(l)) l++; while (r > l && !colArt(r)) r--;
  return { left: l, top: t, width: r - l + 1, height: b - t + 1 };
}

async function lockScene(id: string, file: string): Promise<void> {
  const cfg = cfgAll[id];
  if (!cfg) { console.warn(`skip ${id}: no entry in palette-lock.config.json`); return; }
  const box = await borderBox(file);
  const trim = cfg.trim ?? 6;
  const region = { left: box.left + trim, top: box.top + trim, width: box.width - trim * 2, height: box.height - trim * 2 };
  let img = sharp(file).removeAlpha().extract(region);
  if ((cfg.smooth ?? 3) > 1) img = img.median(cfg.smooth ?? 3);
  img = img.resize(W, H, { fit: cfg.fit ?? 'contain', background: BLACK, kernel: 'lanczos3' });

  if (cfg.lock === false) {
    await img.webp({ quality: 88 }).toFile(join(OUT, `${id}.webp`));
    console.log(`${id}: fitted (no lock)`);
    return;
  }

  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  const palette = [...cfg.inks, PAPER, BLACK, ...(cfg.extra ?? [])].map(rgb);
  const n = W * H; const label = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const r = data[p * 3]!, g = data[p * 3 + 1]!, b = data[p * 3 + 2]!;
    let best = 0, bd = Infinity;
    for (let k = 0; k < palette.length; k++) {
      const c = palette[k]!;
      // weighted RGB distance (closer to perceived difference than plain RGB)
      const dr = r - c[0], dg = g - c[1], db = b - c[2];
      const d = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
      if (d < bd) { bd = d; best = k; }
    }
    label[p] = best;
  }
  for (let pass = 0; pass < (cfg.speck ?? 1); pass++) {
    const next = label.slice();
    const counts = new Uint8Array(palette.length);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const p = y * W + x; counts.fill(0);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) counts[label[p + dy * W + dx]!]!++;
      if (counts[label[p]!]! <= 1) { let m = 0; for (let k = 1; k < counts.length; k++) if (counts[k]! > counts[m]!) m = k; next[p] = m; }
    }
    label.set(next);
  }
  const out = Buffer.alloc(n * 3);
  for (let p = 0; p < n; p++) { const c = palette[label[p]!]!; out[p * 3] = c[0]; out[p * 3 + 1] = c[1]; out[p * 3 + 2] = c[2]; }
  await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 90 }).toFile(join(OUT, `${id}.webp`));
  console.log(`${id}: locked to ${palette.length} colours`);
}

const wanted = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
for (const f of files) {
  const id = parse(f).name;
  if (wanted.length && !wanted.includes(id)) continue;
  await lockScene(id, join(SRC, f));
}
