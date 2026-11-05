import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
let currentPage;
try {
  for (const [width, height] of [
    [1280, 720],
    [390, 844],
    [320, 568],
    [844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    currentPage = page;
    await page.goto(process.env.OVERLAP_URL || 'http://127.0.0.1:5176/');
    await expect(page.getByRole('heading', { name: 'Lisbon', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (width >= 1100) {
      for (const city of ['Lisbon', 'New York', 'London'])
        await expect(page.getByRole('heading', { name: city, exact: true })).toBeInViewport({
          ratio: 1,
        });
      const calendar = async () => {
        const pending = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Calendar file', exact: true }).click();
        return readFile(await (await pending).path(), 'utf8');
      };
      const original = (await calendar()).match(/DTSTART:(.*)/)[1];
      await page.getByRole('button', { name: 'Working hours for Lisbon', exact: true }).click();
      await page.getByRole('button', { name: 'Remove city', exact: true }).click();
      expect((await calendar()).match(/DTSTART:(.*)/)[1]).toBe(original);
      await expect(page.locator('.city-name').first()).toContainText('New York');
      await expect(page.locator('.city-name').first()).toContainText('Reference');
    } else if (width <= 760) {
      await page.getByRole('button', { name: 'Meeting options', exact: true }).click();
      await expect(
        page.getByRole('button', { name: 'Copy meeting times', exact: true }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Timeline', exact: true }).click();
    }
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    console.log(
      `PASS Overlap ${width}×${height}: timeline visibility, reference continuity, calendar and accessibility.`,
    );
    await context.close();
  }
} catch (error) {
  await mkdir('test-results', { recursive: true });
  await currentPage?.screenshot({ path: 'test-results/workspace.png' });
  throw error;
} finally {
  await browser.close();
}
