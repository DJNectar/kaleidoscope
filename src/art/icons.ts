// Small item icons as SVG strings (40×40). Code-authored only; never built
// from save data. Inked in a screenprint style: ink outline + flat fills.
const K = '#120e12';     // ink
const P = '#f4ead1';     // paper
const wrap = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" stroke-linejoin="round">${body}</svg>`;

const ICONS: Record<string, string> = {
  key: `<circle cx="13" cy="20" r="7" fill="#d9a63a" stroke="${K}" stroke-width="1.6"/><circle cx="13" cy="20" r="2.5" fill="${K}"/><path d="M20 18h16v4h-3v4h-3v-4h-3v3h-3v-3h-4z" fill="#d9a63a" stroke="${K}" stroke-width="1.4"/>`,
  brassKey: `<circle cx="12" cy="20" r="8" fill="#c8962a" stroke="${K}" stroke-width="1.6"/><circle cx="12" cy="20" r="3" fill="${K}"/><path d="M20 18h16v4h-2v5h-3v-5h-2v4h-3v-4h-6z" fill="#c8962a" stroke="${K}" stroke-width="1.4"/>`,
  matchbook: `<rect x="8" y="8" width="24" height="26" rx="1.5" fill="#c8361f" stroke="${K}" stroke-width="1.5"/><rect x="8" y="8" width="24" height="8" fill="${K}"/><circle cx="20" cy="24" r="5" fill="none" stroke="${P}" stroke-width="1.6"/><circle cx="18.2" cy="23.3" r="1" fill="${P}"/><circle cx="21.8" cy="23.3" r="1" fill="${P}"/>`,
  cigarette: `<rect x="5" y="17" width="28" height="6" fill="${P}" stroke="${K}" stroke-width="1.4"/><rect x="5" y="17" width="8" height="6" fill="#d98b3a" stroke="${K}" stroke-width="1.4"/><path d="M34 15c2-2 0-4 2-6" fill="none" stroke="#9d8f78" stroke-width="1.4"/>`,
  photo: `<g transform="rotate(-6 20 21)"><rect x="7" y="6" width="26" height="30" fill="${P}" stroke="${K}" stroke-width="1.5"/><rect x="10" y="9" width="20" height="19" fill="#2aa3a0"/><circle cx="20" cy="16" r="4" fill="#e8604a"/><path d="M12 28q8-9 16 0" fill="#e8604a"/></g>`,
  money: `<rect x="5" y="12" width="28" height="15" rx="1.5" fill="#86a865" stroke="${K}" stroke-width="1.5" transform="rotate(-8 20 20)"/><rect x="8" y="15" width="28" height="15" rx="1.5" fill="#9cbf78" stroke="${K}" stroke-width="1.5"/><circle cx="22" cy="22.5" r="4" fill="none" stroke="#2c4a1f" stroke-width="1.4"/>`,
  knife: `<path d="M9 31L29 9q4-2 4 2L14 34z" fill="#d9d9d9" stroke="${K}" stroke-width="1.5"/><rect x="3" y="28" width="12" height="7" rx="2.5" transform="rotate(-48 9 31.5)" fill="#e2aa2b" stroke="${K}" stroke-width="1.5"/>`,
  page: `<path d="M9 6h17l6 6v22H9z" fill="${P}" stroke="${K}" stroke-width="1.5"/><g stroke="#5c3b8e" stroke-width="1.5"><line x1="13" y1="16" x2="28" y2="16"/><line x1="13" y1="21" x2="26" y2="21"/><line x1="13" y1="26" x2="28" y2="26"/></g><path d="M9 34l3-3 3 3 3-3 3 3 3-3 3 3 3-3 2 3" fill="none" stroke="${K}" stroke-width="1.2"/>`,
  notebook: `<rect x="9" y="5" width="23" height="30" rx="2" fill="#3b2a20" stroke="${K}" stroke-width="1.5"/><rect x="12" y="5" width="3" height="30" fill="#5a4030"/><rect x="18" y="11" width="11" height="6" fill="${P}" stroke="${K}" stroke-width="1"/><path d="M27 35v4l2-1.5 2 1.5v-4" fill="#c8361f"/>`,
  envelope: `<rect x="5" y="11" width="30" height="20" fill="${P}" stroke="${K}" stroke-width="1.5"/><path d="M5 11l15 11 15-11" fill="none" stroke="${K}" stroke-width="1.5"/><circle cx="20" cy="22" r="3" fill="#c8361f"/>`,
  tab: `<rect x="8" y="10" width="24" height="20" rx="3" fill="#c9c9c9" stroke="${K}" stroke-width="1.5"/><rect x="14" y="15" width="12" height="10" rx="1" fill="#3a6fd8" stroke="${K}" stroke-width="1.2"/><path d="M18 17l-2 4h3l-2 3" fill="none" stroke="#fff" stroke-width="1.2"/>`,
  note: `<path d="M8 8h24v24H8z" fill="#f6e7a8" stroke="${K}" stroke-width="1.5" transform="rotate(4 20 20)"/><g stroke="#3a3a8c" stroke-width="1.3" fill="none"><path d="M12 15q4-2 8 0t8 0"/><path d="M12 20q4-2 8 0t6 0"/><path d="M12 25q4-2 6 0"/></g>`,
  slip: `<path d="M10 5h20v30l-3-2-3 2-3-2-3 2-3-2-3 2z" fill="#fff" stroke="${K}" stroke-width="1.5"/><g stroke="${K}" stroke-width="1.2"><line x1="13" y1="11" x2="27" y2="11"/><line x1="13" y1="15" x2="24" y2="15"/></g><path d="M13 22h14v5H13z" fill="#c8361f"/>`,
  salts: `<path d="M15 6h10v5l4 4v19H11V15l4-4z" fill="#a8d0e6" stroke="${K}" stroke-width="1.5"/><rect x="14" y="3" width="12" height="5" fill="${K}"/><rect x="11" y="20" width="18" height="8" fill="${P}" stroke="${K}" stroke-width="1"/>`,
  sunglasses: `<circle cx="12" cy="21" r="7" fill="#2a1f3a" stroke="${K}" stroke-width="1.8"/><circle cx="28" cy="21" r="7" fill="#2a1f3a" stroke="${K}" stroke-width="1.8"/><path d="M19 20q1-2 2 0" fill="none" stroke="${K}" stroke-width="1.8"/><path d="M9 18q2-2 4-1" stroke="#fff" stroke-width="1.2" fill="none"/><g fill="#e8604a" stroke="${K}" stroke-width=".8"><circle cx="8" cy="32" r="2"/><circle cx="13" cy="34" r="2"/><circle cx="19" cy="35" r="2" fill="#7fd13b"/><circle cx="25" cy="34" r="2" fill="#e2aa2b"/><circle cx="31" cy="32" r="2" fill="#b44ad6"/></g>`,
  card: `<rect x="5" y="10" width="30" height="20" rx="2" fill="${P}" stroke="${K}" stroke-width="1.5"/><path d="M20 14c-3 4-3 8 0 12 3-4 3-8 0-12z" fill="#b44ad6" stroke="${K}" stroke-width="1"/><path d="M20 26c-4-1-7-4-8-7 4 0 7 3 8 7zM20 26c4-1 7-4 8-7-4 0-7 3-8 7z" fill="#e2aa2b" stroke="${K}" stroke-width="1"/>`,
  ledger: `<rect x="7" y="6" width="26" height="29" rx="1.5" fill="#6b2a3a" stroke="${K}" stroke-width="1.5"/><rect x="7" y="6" width="5" height="29" fill="#4a1d29"/><rect x="16" y="12" width="13" height="5" fill="#d9b25a" stroke="${K}" stroke-width=".8"/><path d="M33 9v24" stroke="${P}" stroke-width="1.5"/>`,
  self: `<circle cx="20" cy="15" r="7" fill="${P}" stroke="${K}" stroke-width="1.5"/><path d="M11 12q9-9 18 0l3 1H8z" fill="${K}"/><path d="M8 36q2-12 12-12t12 12z" fill="#5a4a3c" stroke="${K}" stroke-width="1.5"/>`,
};

export function svgIcon(name: string): string {
  return wrap(ICONS[name] ?? `<rect x="8" y="8" width="24" height="24" fill="${P}" stroke="${K}" stroke-width="1.5"/><text x="20" y="25" font-size="12" text-anchor="middle" fill="${K}">?</text>`);
}
