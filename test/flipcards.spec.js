const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');

test.describe('flip cards', function () {
  test.beforeEach(async function ({ page }) {
    await open(page);
  });

  test('one real button per card, named for its action, without aria-pressed or aria-expanded', async function ({ page }) {
    const buttons = page.locator('.cnx-flip__toggle');
    await expect(buttons).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Show answer: feedback works best soon after the event' })).toHaveCount(1);
    for (const button of await buttons.all()) {
      await expect(button).not.toHaveAttribute('aria-pressed', /.*/);
      await expect(button).not.toHaveAttribute('aria-expanded', /.*/);
      // Label in name (WCAG 2.5.3): the visible text starts the accessible name.
      expect(await button.innerText()).toBe('Show answer');
      expect(await button.getAttribute('aria-label')).toMatch(/^Show answer: /);
    }
  });

  test('only one face is rendered at a time and focus stays on the button', async function ({ page }) {
    const card = page.locator('.cnx-flip').nth(1);
    const front = card.locator('.cnx-flip__face--front');
    const back = card.locator('.cnx-flip__face--back');
    await expect(front).toBeVisible();
    await expect(back).toBeHidden();
    expect(await back.evaluate(function (el) { return getComputedStyle(el).display; })).toBe('none');

    const button = card.locator('.cnx-flip__toggle');
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(front).toBeHidden();
    await expect(back).toBeVisible();
    await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleName('Show statement: feedback works best soon after the event');

    await page.keyboard.press('Space');
    await expect(front).toBeVisible();
    await expect(back).toBeHidden();
    await expect(button).toHaveAccessibleName('Show answer: feedback works best soon after the event');
  });

  test('double click leaves one face shown, one button, and a name that matches the face', async function ({ page }) {
    const card = page.locator('.cnx-flip').first();
    const button = card.locator('.cnx-flip__toggle');
    await button.evaluate(function (b) { window.cnxClicks = 0; b.addEventListener('click', function () { window.cnxClicks += 1; }); });
    await button.dblclick();
    const clicks = await page.evaluate(function () { return window.cnxClicks; });
    expect(clicks).toBeGreaterThan(0);
    await expect(card.locator('.cnx-flip__face:visible')).toHaveCount(1);
    await expect(card.locator('.cnx-flip__toggle')).toHaveCount(1);
    const side = clicks % 2 ? 'back' : 'front';
    await expect(card).toHaveAttribute('data-side', side);
    await expect(card.locator('.cnx-flip__face--' + side)).toBeVisible();
    await expect(button).toHaveAccessibleName(new RegExp('^Show ' + (side === 'back' ? 'statement' : 'answer') + ': '));
  });

  test('each card turns independently', async function ({ page }) {
    await page.locator('.cnx-flip__toggle').first().click();
    await expect(page.locator('.cnx-flip').nth(0)).toHaveAttribute('data-side', 'back');
    await expect(page.locator('.cnx-flip').nth(1)).toHaveAttribute('data-side', 'front');
    await expect(page.locator('.cnx-flip').nth(2)).toHaveAttribute('data-side', 'front');
  });

  test('card height follows its content (no fixed height clipping at 200% text)', async function ({ page }) {
    await page.addStyleTag({ content: '.cnx-lesson { font-size: 2.25rem !important; }' });
    for (const button of await page.locator('.cnx-flip__toggle').all()) {
      await button.click();
    }
    const clipped = await page.locator('.cnx-flip').evaluateAll(function (cards) {
      return cards.filter(function (c) { return c.scrollHeight > c.clientHeight + 1; }).length;
    });
    expect(clipped).toBe(0);
  });
});
