# Security & privacy — Kaleidoscope

A fully static browser game: no backend, no accounts, no database, no runtime network calls.
Scoped from Chris's secure-build protocol; items that don't apply to a static site are marked N/A.

## Decisions
| Area | Decision |
|---|---|
| Secrets | None needed. No env vars. If any ever appear they never go in client code. |
| Network | No runtime network calls. Fonts, icons and art are bundled and served from our own origin. |
| Saves | `localStorage`, every access wrapped in try/catch (`src/engine/storage.ts`); falls back to in-memory so the game works with storage blocked. |
| Save validation | Every save is parsed with `JSON.parse` (never `eval`) and validated with a strict Zod schema (`src/engine/saveSchema.ts`): ids are `[A-Za-z0-9_:-]`, numbers bounded, unknown keys rejected. Chapter/scene/item ids must exist in the registry or the save is refused. |
| Rendering | No `innerHTML` with data. Narration goes through a tiny formatter (`src/ui/text.ts`) that builds nodes with `textContent` and supports only `*italic*` / `**bold**`. Item/verb SVG icons are code-authored strings parsed with `DOMParser` as XML (`src/ui/dom.ts`), with `script`/`foreignObject` stripped. |
| Headers | `vercel.json`: strict CSP (`default-src 'self'`, no inline script, no inline style blocks, `frame-ancestors 'none'`), HSTS, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, Permissions-Policy. `vite preview` sends the same CSP, so the Playwright suite fails on any CSP violation. |
| URL input | `?chapter=` is only accepted if it matches a registered chapter id. |
| Analytics / personal data | None collected. Quebec Law 25: nothing to disclose; no privacy policy or deletion path needed. If analytics is ever added it must be anonymous and disclosed. |
| Dependencies | Runtime: `zod` only. Dev: `vite`, `typescript`, `vitest`, `@playwright/test`. Lockfile committed; Dependabot enabled. `sharp` 0.35.5 (dev-only, build-time image processing for `scripts/palette-lock.ts`; upgraded from 0.34 to clear a high-severity libvips advisory). It never ships to players. |

## N/A for this project
Auth, sessions, cookies, rate limiting, database access, uploads, payments, server-side AI keys, backups (no server data).

## Deferred / to do
- Repo must be created **private** on GitHub with secret scanning + push protection on.
- Run the pre-deploy checklist (below) before milestone 5 deploy.

## Pre-deploy checklist
- [ ] Secret scan of repo (none expected)
- [ ] `npm audit --audit-level=high` clean
- [ ] Security headers verified on the deployed URL
- [ ] No runtime network calls (DevTools network tab after load: only same-origin)
- [ ] Auth / rate limits / backups / privacy policy: N/A (static, no personal data)
