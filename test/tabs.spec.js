const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');

async function state(page) {
  return page.locator('.cnx-tabs [role="tab"]').evaluateAll(function (tabs) {
    return tabs.map(function (tab) {
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      return {
        name: tab.textContent.trim(),
        selected: tab.getAttribute('aria-selected'),
        tabindex: tab.getAttribute('tabindex'),
        panelHidden: panel.hidden
      };
    });
  });
}

function selectedIndex(rows) {
  return rows.findIndex(function (row) { return row.selected === 'true'; });
}

test.describe('tabs', function () {
  test.beforeEach(async function ({ page }) {
    await open(page);
  });

  test('tablist, tabs and panels carry the APG roles and relationships', async function ({ page }) {
    const tablist = page.getByRole('tablist', { name: 'Same situation, three approaches' });
    await expect(tablist).toHaveCount(1);
    const tabs = tablist.getByRole('tab');
    await expect(tabs).toHaveText(['Vague', 'Harsh', 'Useful']);
    for (const tab of await tabs.all()) {
      const panel = page.locator('#' + (await tab.getAttribute('aria-controls')));
      await expect(panel).toHaveAttribute('role', 'tabpanel');
      await expect(panel).toHaveAttribute('aria-labelledby', await tab.getAttribute('id'));
      await expect(panel).toHaveAttribute('tabindex', '0');
    }
    // The static h3 headings are hidden once the tabs name the panels.
    await expect(page.locator('.cnx-tabs__title:visible')).toHaveCount(0);
  });

  test('roving tabindex: only the selected tab is in the Tab order', async function ({ page }) {
    const rows = await state(page);
    expect(rows.map(function (r) { return r.tabindex; })).toEqual(['0', '-1', '-1']);
    expect(rows.map(function (r) { return r.panelHidden; })).toEqual([false, true, true]);
  });

  test('Right and Left arrows move, wrap and activate automatically', async function ({ page }) {
    await page.getByRole('tab', { name: 'Vague' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Harsh' })).toBeFocused();
    expect(selectedIndex(await state(page))).toBe(1);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Vague' })).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'Useful' })).toBeFocused();
    const rows = await state(page);
    expect(selectedIndex(rows)).toBe(2);
    expect(rows.map(function (r) { return r.tabindex; })).toEqual(['-1', '-1', '0']);
    expect(rows.map(function (r) { return r.panelHidden; })).toEqual([true, true, false]);
  });

  test('Home and End jump to the first and last tab', async function ({ page }) {
    await page.getByRole('tab', { name: 'Vague' }).focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Useful' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.getByRole('tab', { name: 'Vague' })).toBeFocused();
    expect(selectedIndex(await state(page))).toBe(0);
  });

  test('rapid arrow presses end in a consistent state', async function ({ page }) {
    await page.getByRole('tab', { name: 'Vague' }).focus();
    for (let i = 0; i < 7; i += 1) {
      await page.keyboard.press('ArrowRight', { delay: 0 });
    }
    const rows = await state(page);
    expect(selectedIndex(rows)).toBe(1);
    expect(rows.filter(function (r) { return r.selected === 'true'; })).toHaveLength(1);
    expect(rows.filter(function (r) { return r.tabindex === '0'; })).toHaveLength(1);
    expect(rows.filter(function (r) { return !r.panelHidden; })).toHaveLength(1);
  });

  test('clicking a tab selects it and Tab moves from the tab into its panel', async function ({ page }) {
    await page.getByRole('tab', { name: 'Useful' }).click();
    expect(selectedIndex(await state(page))).toBe(2);
    await page.getByRole('tab', { name: 'Useful' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tabpanel', { name: 'Useful' })).toBeFocused();
  });
});
