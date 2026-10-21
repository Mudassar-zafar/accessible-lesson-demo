const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');

function forms(page) {
  return page.locator('form.cnx-check');
}

test.describe('checkpoints', function () {
  test.beforeEach(async function ({ page }) {
    await open(page);
  });

  test('native form, fieldset and legend with labelled radios and checkboxes', async function ({ page }) {
    const q1 = forms(page).nth(0);
    const q2 = forms(page).nth(1);
    await expect(q1.locator('fieldset > legend')).toHaveCount(1);
    await expect(q1.getByRole('radio')).toHaveCount(4);
    await expect(q2.getByRole('checkbox')).toHaveCount(5);
    await expect(page.getByRole('group', { name: /Which opening is most useful/ })).toHaveCount(1);
    await expect(q1.locator('.cnx-check__key')).toBeHidden();
    await expect(q1.locator('.cnx-check__nojs')).toBeHidden();
    // One persistent status region per question, placed right after the buttons.
    for (const form of await forms(page).all()) {
      await expect(form.getByRole('status')).toHaveCount(1);
      const after = await form.locator('.cnx-check__actions').evaluate(function (el) {
        return el.nextElementSibling && el.nextElementSibling.getAttribute('role');
      });
      expect(after).toBe('status');
    }
  });

  test('checking with nothing selected shows the error in the status region, linked to the fieldset, focus stays', async function ({ page }) {
    let dialogs = 0;
    page.on('dialog', function (d) { dialogs += 1; d.dismiss(); });
    const q1 = forms(page).nth(0);
    const check = q1.getByRole('button', { name: 'Check answer' });
    await check.focus();
    await page.keyboard.press('Enter');
    const status = q1.getByRole('status');
    await expect(status).toContainText('No answer selected.');
    await expect(status).toHaveAttribute('data-state', 'error');
    const statusId = await status.getAttribute('id');
    await expect(q1.locator('fieldset')).toHaveAttribute('aria-describedby', statusId);
    await expect(check).toBeFocused();
    expect(dialogs).toBe(0);
    // Choosing an option clears the error and the reference.
    await q1.getByRole('radio').first().check();
    await expect(q1.locator('fieldset')).not.toHaveAttribute('aria-describedby', /.*/);
    await expect(status).toHaveText('');
  });

  test('correct answer: icon plus words in the status region, option marked in words, focus not moved', async function ({ page }) {
    const q1 = forms(page).nth(0);
    await q1.getByRole('radio', { name: /three slides showed/ }).check();
    const check = q1.getByRole('button', { name: 'Check answer' });
    // Keyboard activation: WebKit does not focus a button on mouse click.
    await check.focus();
    await page.keyboard.press('Enter');
    const status = q1.getByRole('status');
    await expect(status).toContainText('Correct.');
    await expect(status).toContainText('It names the moment');
    await expect(status.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    await expect(q1.getByRole('radio', { name: /three slides showed.*Correct choice/ })).toHaveCount(1);
    await expect(check).toBeFocused();
    await expect(q1.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('incorrect answer: words, not colour alone, on the status and on the option', async function ({ page }) {
    const q1 = forms(page).nth(0);
    await q1.getByRole('radio', { name: /sloppy/ }).check();
    await q1.getByRole('button', { name: 'Check answer' }).click();
    await expect(q1.getByRole('status')).toContainText('Not quite.');
    await expect(q1.getByRole('status')).toContainText('camera');
    await expect(q1.locator('.cnx-check__mark')).toHaveText('Incorrect choice');
  });

  test('multiple select: partial answer reports counts and marks each chosen option', async function ({ page }) {
    const q2 = forms(page).nth(1);
    await q2.getByRole('checkbox', { name: /Describing/ }).check();
    await q2.getByRole('checkbox', { name: /Comparing/ }).check();
    await q2.getByRole('button', { name: 'Check answer' }).click();
    await expect(q2.getByRole('status')).toContainText('You found 1 of 3 helpful options and chose 1 that does not help.');
    await expect(q2.locator('.cnx-check__mark')).toHaveText(['Correct choice', 'Incorrect choice']);
  });

  test('multiple select: all correct options', async function ({ page }) {
    const q2 = forms(page).nth(1);
    for (const name of [/Describing/, /Explaining/, /Agreeing/]) {
      await q2.getByRole('checkbox', { name: name }).check();
    }
    await q2.getByRole('button', { name: 'Check answer' }).click();
    await expect(q2.getByRole('status')).toContainText('Correct.');
  });

  test('double click on Check answer does not duplicate markup or re-announce', async function ({ page }) {
    const q1 = forms(page).nth(0);
    await q1.getByRole('radio', { name: /sloppy/ }).check();
    const check = q1.getByRole('button', { name: 'Check answer' });
    await check.click();
    // Watch the status region and the options for any change caused by more presses.
    await q1.evaluate(function (form) {
      window.cnxMutations = 0;
      new MutationObserver(function (records) { window.cnxMutations += records.length; })
        .observe(form, { subtree: true, childList: true, characterData: true, attributes: true });
    });
    await check.dblclick();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(function () { return window.cnxMutations; })).toBe(0);
    await expect(q1.getByRole('status').locator('p')).toHaveCount(1);
    await expect(q1.locator('.cnx-check__mark')).toHaveCount(1);
  });

  test('double click on Check answer with nothing selected shows one error', async function ({ page }) {
    const q2 = forms(page).nth(1);
    await q2.getByRole('button', { name: 'Check answer' }).dblclick();
    await expect(q2.getByRole('status').locator('p')).toHaveCount(1);
  });

  test('Try again resets selections and feedback and moves focus to the first option, not the page', async function ({ page }) {
    const q2 = forms(page).nth(1);
    await q2.getByRole('checkbox', { name: /Comparing/ }).check();
    await q2.getByRole('button', { name: 'Check answer' }).click();
    const retry = q2.getByRole('button', { name: 'Try again' });
    await retry.focus();
    await page.keyboard.press('Enter');
    await expect(q2.getByRole('status')).toHaveText('');
    await expect(q2.locator('.cnx-check__mark')).toHaveCount(0);
    expect(await q2.getByRole('checkbox').evaluateAll(function (b) { return b.filter(function (x) { return x.checked; }).length; })).toBe(0);
    await expect(q2.getByRole('checkbox').first()).toBeFocused();
    await expect(retry).toBeHidden();
  });

  test('no scores or answers are stored', async function ({ page }) {
    const q1 = forms(page).nth(0);
    await q1.getByRole('radio').first().check();
    await q1.getByRole('button', { name: 'Check answer' }).click();
    const stored = await page.evaluate(function () {
      try {
        return window.localStorage.length + window.sessionStorage.length + document.cookie.length;
      } catch (e) {
        return 0;
      }
    });
    expect(stored).toBe(0);
  });
});
