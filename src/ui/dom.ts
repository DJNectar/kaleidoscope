// Tiny DOM helpers. No innerHTML anywhere except parseSvg, which only ever
// receives code-authored SVG strings and parses them as XML (scripts inert).
type Attrs = Record<string, string | number | boolean | undefined | null | EventListener>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c != null && c !== false) el.append(c);
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...children: (Node | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) el.append(c);
  return el;
}

/** Parse a trusted, code-authored SVG string into a node. */
export function parseSvg(markup: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName !== 'svg') return s('svg');
  root.querySelectorAll('script, foreignObject').forEach((n) => n.remove());
  return document.importNode(root, true) as unknown as SVGSVGElement;
}

export function clear(el: Element): void { el.replaceChildren(); }
