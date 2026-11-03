import { expect, type Page } from '@playwright/test';

export const VERB_KEYS: Record<string, string> = {
  look: '1', take: '2', open: '3', close: '4', talk: '5', use: '6', give: '7', hit: '8', consume: '9', go: '0',
};

/** Open the game fresh with instant text and no saved state; fail on console/CSP errors. */
export async function boot(page: Page, chapter: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    if (sessionStorage.getItem('booted')) return;
    sessionStorage.setItem('booted', '1');
    localStorage.clear();
    localStorage.setItem('kaleidoscope.profile', JSON.stringify({
      version: 1, deathsSeen: [], endingsSeen: [], chapterFlags: {},
      settings: { textSpeed: 'instant', sound: false, reducedMotion: true, textSize: 'normal', mode1985: false },
    }));
  });
  await page.goto(`/?chapter=${chapter}`);
  await page.getByRole('button', { name: 'New Game' }).click();
  await expect(page.locator('.overlay')).toBeHidden();
  return errors;
}

/** Perform a verb on a target. Target = hotspot id, item id, 'exit:<scene>' or 'self'. */
export async function act(page: Page, verb: string, target: string, withItem?: string): Promise<void> {
  const before = await page.evaluate(() => Number(document.body.dataset.acts ?? 0));
  await page.keyboard.press(VERB_KEYS[verb]!);
  if (withItem) await page.locator(`.slot[data-item="${withItem}"]`).click();
  await clickTarget(page, target);
  await page.waitForFunction((n) => Number(document.body.dataset.acts ?? 0) > n || !document.querySelector(".overlay")?.hasAttribute("hidden"), before);
}

async function clickTarget(page: Page, target: string): Promise<void> {
  if (target.startsWith('exit:')) {
    await page.locator(`.map .exit[data-to="${target.slice(5)}"]`).click();
    return;
  }
  const slot = page.locator(`.slot[data-item="${target}"]`);
  if (await slot.count()) { await slot.click(); return; }
  await page.locator(`.hs[data-id="${target}"]`).click({ force: true });
}

export async function lastNarration(page: Page): Promise<string> {
  return (await page.locator('.lines p:not(.cmd)').last().textContent()) ?? '';
}
