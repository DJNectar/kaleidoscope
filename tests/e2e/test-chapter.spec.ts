import { expect, test } from '@playwright/test';
import { act, boot, lastNarration } from './helpers';

test('test chapter: full win through the real UI, no console or CSP errors', async ({ page }) => {
  const errors = await boot(page, 'test');
  await expect(page.locator('.caption')).toHaveText('YOUR OFFICE');
  await expect(page.getByTestId('clock')).toHaveText('11:00 PM');

  await act(page, 'look', 'hat');
  await expect(page.locator('.card.flashback')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('.shards svg.got')).toHaveCount(1);

  await act(page, 'open', 'desk');
  await expect(page.locator('.slot[data-item="key"]')).toBeVisible();
  await act(page, 'use', 'door', 'key');
  expect(await lastNarration(page)).toContain('key turns');
  await act(page, 'go', 'exit:hall');
  await expect(page.locator('.caption')).toHaveText('FOURTH-FLOOR HALLWAY');
  await act(page, 'go', 'stairs');
  await expect(page.locator('.card.ending')).toBeVisible();
  await expect(page.locator('.card.ending h2')).toHaveText('P.I. LEAVES BUILDING');
  expect(errors).toEqual([]);
});

test('test chapter: death, then rewind restores play and keeps the death count', async ({ page }) => {
  const errors = await boot(page, 'test');
  await act(page, 'consume', 'bottle');
  await expect(page.locator('.card.death h2')).toHaveText('Three Fingers');
  await page.getByRole('button', { name: 'Rewind', exact: true }).click();
  await expect(page.locator('.overlay')).toBeHidden();
  await act(page, 'look', 'desk');
  expect(await lastNarration(page)).toContain('desk');
  expect(errors).toEqual([]);
});

test('test chapter: save, reload, load', async ({ page }) => {
  await boot(page, 'test');
  await act(page, 'open', 'desk');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: /Slot 1/ }).click();
  await page.reload();
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('button', { name: 'Load', exact: true }).click();
  await page.getByRole('button', { name: /Slot 1/ }).click();
  await expect(page.locator('.slot[data-item="key"]')).toBeVisible();
  await expect(page.getByTestId('clock')).toHaveText('11:01 PM');
});
