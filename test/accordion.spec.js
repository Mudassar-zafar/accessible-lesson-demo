const { test, expect } = require('@playwright/test');
const { open, trackErrors } = require('./helpers');

test.describe('accordion', function () {
  test.beforeEach(async function ({ page }) {
    await open(page);
  });

  test('each header is an h3 containing a native button with aria-expanded and aria-controls', async function ({ page }) {
    const buttons = page.locator('.cnx-accordion h3 > button');
    await expect(buttons).toHaveCount(4);
    for (const button of await buttons.all()) {
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      const controls = await button.getAttribute('aria-controls');
      const panel = page.locator('#' + controls);
      await expect(panel).toHaveCount(1);
      await expect(panel).toBeHidden();
      await expect(panel).not.toHaveAttribute('role', /.*/);
    }
  });

  test('panels have no role=region and the accordion has no extra roles', async function ({ page }) {
    await expect(page.locator('.cnx-accordion [role]')).toHaveCount(0);
  });

  test('click toggles aria-expanded and panel visibility', async function ({ page }) {
    const button = page.getByRole('button', { name: 'Impact: explain the effect' });
    const panel = page.locator('#' + (await button.getAttribute('aria-controls')));
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
  });

  test('Enter and Space toggle exactly once each (no double toggle)', async function ({ page }) {
    const button = page.getByRole('button', { name: 'Context: name the moment' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(button).toBeFocused();
  });

  test('several panels can be open at once', async function ({ page }) {
    const buttons = page.locator('.cnx-accordion__trigger');
    for (const button of await buttons.all()) {
      await button.click();
    }
    for (const button of await buttons.all()) {
      await expect(button).toHaveAttribute('aria-expanded', 'true');
    }
    await expect(page.locator('.cnx-accordion__panel:visible')).toHaveCount(4);
  });

  test('arrow keys do not move focus between headers (optional APG keys not added)', async function ({ page }) {
    const first = page.locator('.cnx-accordion__trigger').first();
    await first.focus();
    await page.keyboard.press('ArrowDown');
    await expect(first).toBeFocused();
  });

  test('starts without console errors', async function ({ page }) {
    const errors = trackErrors(page);
    await page.reload();
    expect(errors).toEqual([]);
  });
});
