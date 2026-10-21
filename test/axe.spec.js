const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, open, expectNoAxeViolations } = require('./helpers');

test.describe('axe-core, WCAG 2.1 A and AA, every state', function () {
  test('initial state and each accordion panel open', async function ({ page }) {
    await open(page);
    await expectNoAxeViolations(page, 'initial');
    const buttons = page.locator('.cnx-accordion__trigger');
    for (let i = 0; i < 4; i += 1) {
      await buttons.nth(i).click();
      await expectNoAxeViolations(page, 'accordion panel ' + (i + 1) + ' open');
    }
  });

  test('each tab selected', async function ({ page }) {
    await open(page);
    for (const name of ['Harsh', 'Useful', 'Vague']) {
      await page.getByRole('tab', { name: name }).click();
      await expectNoAxeViolations(page, 'tab ' + name);
    }
  });

  test('each card flipped', async function ({ page }) {
    await open(page);
    const buttons = page.locator('.cnx-flip__toggle');
    for (let i = 0; i < 3; i += 1) {
      await buttons.nth(i).click();
      await expectNoAxeViolations(page, 'card ' + (i + 1) + ' flipped');
    }
  });

  test('each carousel slide and rotation on', async function ({ page }) {
    await page.clock.install();
    await open(page);
    for (let i = 2; i <= 4; i += 1) {
      await page.getByRole('button', { name: 'Next slide' }).click();
      await expectNoAxeViolations(page, 'slide ' + i);
    }
    await page.getByRole('button', { name: 'Next slide' }).click();
    await page.locator('.cnx-carousel__rotate').click();
    await page.mouse.move(0, 0);
    await expect(page.locator('.cnx-carousel__viewport')).toHaveAttribute('aria-live', 'off');
    await expectNoAxeViolations(page, 'rotation on');
  });

  test('each checkpoint feedback state', async function ({ page }) {
    await open(page);
    const q1 = page.locator('form.cnx-check').nth(0);
    const q2 = page.locator('form.cnx-check').nth(1);
    await q1.getByRole('button', { name: 'Check answer' }).click();
    await q2.getByRole('button', { name: 'Check answer' }).click();
    await expectNoAxeViolations(page, 'error state');
    await q1.getByRole('radio', { name: /sloppy/ }).check();
    await q1.getByRole('button', { name: 'Check answer' }).click();
    await q2.getByRole('checkbox', { name: /Describing/ }).check();
    await q2.getByRole('checkbox', { name: /Comparing/ }).check();
    await q2.getByRole('button', { name: 'Check answer' }).click();
    await expectNoAxeViolations(page, 'incorrect feedback');
    await q1.getByRole('radio', { name: /three slides/ }).check();
    await q1.getByRole('button', { name: 'Check answer' }).click();
    await expectNoAxeViolations(page, 'correct feedback');
  });

  test('stress.html, with every component open', async function ({ page }) {
    await open(page, 'test/fixtures/stress.html');
    await expectNoAxeViolations(page, 'stress initial');
    for (const button of await page.locator('.cnx-accordion__trigger, .cnx-flip__toggle').all()) {
      await button.click();
    }
    await expectNoAxeViolations(page, 'stress opened');
  });

  test('with the LMS stylesheet loaded last', async function ({ page }) {
    await open(page);
    await page.addStyleTag({ path: path.join(ROOT, 'test/fixtures/lms-hostile.css') });
    await expectNoAxeViolations(page, 'lms-hostile');
  });

  test('stub pages', async function ({ page }) {
    await open(page, 'page-1.html');
    await expectNoAxeViolations(page, 'page-1');
    await open(page, 'page-3.html');
    await expectNoAxeViolations(page, 'page-3');
  });
});

test.describe('axe-core on the static markup', function () {
  // axe needs JavaScript to run, so the no-JS state is reproduced by keeping
  // every component script from starting. The DOM is then the static markup.
  test('static state (component scripts blocked)', async function ({ page }) {
    await page.addInitScript(function () {
      const ns = {};
      ['Accordion', 'Tabs', 'FlipCards', 'Carousel', 'Checkpoint'].forEach(function (name) {
        Object.defineProperty(ns, name, { get: function () { return undefined; }, set: function () {} });
      });
      window.CnxLesson = ns;
    });
    await open(page);
    await expect(page.locator('[data-cnx-ready]')).toHaveCount(0);
    await expect(page.locator('.cnx-lesson button')).toHaveCount(0);
    await expectNoAxeViolations(page, 'static markup');
  });
});
