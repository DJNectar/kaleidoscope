import { expect, test, type Page } from '@playwright/test';
import { act, boot } from './helpers';
import { ATTIC, BEST_ROUTE, DISGUISE, OWL_ALLEY, PANHANDLE, PARLOR_LAB, TO_CLINIC } from '../unit/ch1.route';
import type { ActionInput } from '../../src/engine/types';

async function play(page: Page, steps: ActionInput[]): Promise<void> {
  for (const st of steps) {
    await act(page, st.verb, st.target, st.with);
    const flash = page.locator('.card.flashback');
    if (await flash.isVisible()) await flash.getByRole('button', { name: 'Continue' }).click();
  }
}

test.describe.configure({ mode: 'parallel' });

test('walkthrough: the optimal route reaches the best ending', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = await boot(page, 'ch1');
  await expect(page.getByTestId('clock')).toHaveText('4:00 PM');
  await play(page, BEST_ROUTE);
  const card = page.locator('.card.ending');
  await expect(card).toBeVisible();
  await expect(card.locator('h2')).toHaveText('PSYCHIATRIST INDICTED IN PANHANDLE POISON PLOT');
  await expect(card).toContainText('Fellowship');
  await expect(card.locator('dd').nth(0)).toHaveText('5:57 PM');
  await expect(card.locator('dd').nth(1)).toHaveText('0');
  await expect(card.locator('dd').nth(3)).toHaveText('5 / 5');
  await page.screenshot({ path: 'screenshots/e2e-best-ending.png' });
  expect(errors).toEqual([]);
});

const endingCases: [string, ActionInput[], string][] = [
  ['good', [...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY, ...PANHANDLE.filter((x) => x.target !== 'scaffold'), ...PARLOR_LAB], 'PSYCHIATRIST, NARCOTICS LIEUTENANT CHARGED'],
  ['bittersweet', [...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY, ...PANHANDLE, ...PARLOR_LAB.filter((x) => x.target !== 'ledger')], 'DOCTOR HELD AFTER BASEMENT FIRE ON MASONIC'],
  ['lonely', [...ATTIC, ...TO_CLINIC, ...DISGUISE, ...OWL_ALLEY, { verb: 'go', target: 'exit:lotus' }, { verb: 'use', target: 'cellar', with: 'brasskey' }, { verb: 'go', target: 'exit:lab' }, { verb: 'open', target: 'crates' }, { verb: 'open', target: 'furnace' }, { verb: 'use', target: 'crates' }, { verb: 'go', target: 'exit:lotus' }], 'FIRE IN FOUNDATION BASEMENT; NO INJURIES REPORTED'],
];
for (const [id, steps, headline] of endingCases) {
  test(`ending: ${id}`, async ({ page }) => {
    test.setTimeout(180_000);
    await boot(page, 'ch1');
    await play(page, steps);
    await expect(page.locator('.card.ending h2')).toHaveText(headline);
  });
}

const toHaight = [...ATTIC, ...TO_CLINIC];
const disguised = [...toHaight, ...DISGUISE];
const deathCases: [string, ActionInput[]][] = [
  ['Decorative Fire Escape', [{ verb: 'go', target: 'window' }]],
  ['Blue Lightning', [...ATTIC, ...TO_CLINIC.slice(0, 3), { verb: 'consume', target: 'tab' }]],
  ['Ginger Ale', [...ATTIC, { verb: 'hit', target: 'eyedoor' }, { verb: 'consume', target: 'gingerale' }]],
  ['Flower Power', [...toHaight, { verb: 'go', target: 'street' }]],
  ['Tuesday', [...toHaight, { verb: 'go', target: 'exit:thirdeye' }, { verb: 'consume', target: 'brownies' }]],
  ['Held for Questioning', [...toHaight, { verb: 'go', target: 'exit:panhandle' }, { verb: 'talk', target: 'volunteer' }]],
  ['Remember Me?', [...toHaight, { verb: 'go', target: 'exit:owl' }, { verb: 'go', target: 'exit:alley' }, { verb: 'open', target: 'dumpster' }]],
  ['Hit Parade', [...disguised, { verb: 'go', target: 'exit:owl' }, { verb: 'go', target: 'exit:alley' }, { verb: 'hit', target: 'tiny' }]],
  ['Another Fire Escape', [...disguised, { verb: 'go', target: 'exit:owl' }, { verb: 'go', target: 'exit:alley' }, { verb: 'go', target: 'fireescape' }]],
  ['Herbal Tea', [...disguised, ...OWL_ALLEY, ...PANHANDLE, { verb: 'give', target: 'frontdoor', with: 'card' }, { verb: 'consume', target: 'teapot' }]],
  ['Spectacular', [...disguised, ...OWL_ALLEY, { verb: 'go', target: 'exit:lotus' }, { verb: 'use', target: 'cellar', with: 'brasskey' }, { verb: 'go', target: 'exit:lab' }, { verb: 'open', target: 'valve' }]],
  ['Your Own Gun', [...disguised, ...OWL_ALLEY, ...PANHANDLE, PARLOR_LAB[0]!, ...PARLOR_LAB.slice(3, 8)]],
];
for (const [title, steps] of deathCases) {
  test(`death: ${title}`, async ({ page }) => {
    test.setTimeout(180_000);
    await boot(page, 'ch1');
    await play(page, steps);
    await expect(page.locator('.card.death h2')).toHaveText(title);
  });
}

test('death: Sundown (the clock runs out)', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page, 'ch1');
  // Fast-forward through the engine-facing test hook isn't allowed; burn time with the payphone instead.
  await play(page, [...toHaight, { verb: 'go', target: 'exit:thirdeye' }]);
  for (let i = 0; i < 20; i++) {
    if (await page.locator('.card.death').isVisible()) break;
    await act(page, 'use', 'payphone');
  }
  await expect(page.locator('.card.death h2')).toHaveText('Sundown');
});
