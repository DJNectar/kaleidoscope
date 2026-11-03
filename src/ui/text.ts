// Safe-markup formatter: *italic* and **bold** only. Builds nodes with
// textContent, so narration (and anything from a save) can never inject HTML.
export function formatInto(el: HTMLElement, text: string): void {
  el.replaceChildren(...formatNodes(text));
}

export function formatNodes(text: string): Node[] {
  const out: Node[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(document.createTextNode(text.slice(last, m.index)));
    const tok = m[0];
    const bold = tok.startsWith('**');
    const el = document.createElement(bold ? 'strong' : 'em');
    el.textContent = tok.slice(bold ? 2 : 1, bold ? -2 : -1);
    out.push(el);
    last = m.index! + tok.length;
  }
  if (last < text.length) out.push(document.createTextNode(text.slice(last)));
  return out;
}

/** Plain text with markup removed (for typing effects and aria). */
export function plain(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
}
