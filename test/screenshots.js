/*
  Captures the review screenshots into screenshots/. Chromium only.
  Run: node test/screenshots.js
*/
'use strict';

const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('@playwright/test');

const root = path.resolve(__dirname, '..');
const out = function (name) { return path.join(root, 'screenshots', name + '.png'); };
const url = function (rel) { return pathToFileURL(path.join(root, rel)).href; };

async function sectionShot(page, headingText, name) {
  const section = page.locator('section.cnx-section').filter({ has: page.getByRole('heading', { name: headingText, exact: true }) });
  await page.evaluate(function () { document.getAnimations().forEach(function (a) { a.finish(); }); });
  await section.screenshot({ path: out(name), animations: 'disabled' });
}

(async function () {
  const browser = await chromium.launch();

  for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ viewport: { width: width, height: 900 } });
    await page.goto(url('index.html'));
    await page.screenshot({ path: out('page-' + width), fullPage: true, animations: 'disabled' });
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url('index.html'));

  await page.getByRole('button', { name: 'Observation: describe what you saw or heard' }).click();
  await page.getByRole('button', { name: 'Impact: explain the effect' }).click();
  await sectionShot(page, 'Four parts of useful feedback', 'accordion-open');

  await page.getByRole('tab', { name: 'Useful' }).click();
  await sectionShot(page, 'Same situation, three approaches', 'tabs-tab-3');

  await page.locator('.cnx-flip__toggle').nth(1).click();
  await page.mouse.move(0, 0);
  await sectionShot(page, 'Myth or fact?', 'flipcard-flipped');

  await page.getByRole('button', { name: 'Next slide' }).click();
  await page.mouse.move(0, 0);
  await sectionShot(page, 'Real-world scenarios', 'carousel-slide-2');

  const q1 = page.locator('form.cnx-check').nth(0);
  const q2 = page.locator('form.cnx-check').nth(1);
  await q1.getByRole('button', { name: 'Check answer' }).click();
  await q2.getByRole('button', { name: 'Check answer' }).click();
  await page.mouse.move(0, 0);
  await sectionShot(page, 'Check your understanding', 'checkpoint-error');

  await q1.getByRole('radio', { name: /three slides/ }).check();
  await q1.getByRole('button', { name: 'Check answer' }).click();
  await q2.getByRole('checkbox', { name: /Describing/ }).check();
  await q2.getByRole('checkbox', { name: /Comparing/ }).check();
  await q2.getByRole('button', { name: 'Check answer' }).click();
  await page.mouse.move(0, 0);
  await sectionShot(page, 'Check your understanding', 'checkpoint-correct-and-incorrect');

  // Focus ring, reached with the keyboard so :focus-visible applies.
  await page.getByRole('tab', { name: 'Useful' }).focus();
  await page.keyboard.press('ArrowLeft');
  await sectionShot(page, 'Same situation, three approaches', 'focus-ring-tab');
  await page.locator('.cnx-flip__toggle').first().focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await sectionShot(page, 'Myth or fact?', 'focus-ring-card-button');
  await page.close();

  const forced = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await forced.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' });
  await forced.goto(url('index.html'));
  await forced.locator('.cnx-accordion__trigger').first().click();
  await forced.getByRole('tab', { name: 'Vague' }).focus();
  await forced.keyboard.press('ArrowRight');
  await forced.screenshot({ path: out('forced-colors'), fullPage: true, animations: 'disabled' });
  await forced.close();

  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const nojs = await context.newPage();
  await nojs.goto(url('index.html'));
  await nojs.screenshot({ path: out('no-javascript'), fullPage: true });
  await context.close();

  const hostile = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await hostile.goto(url('index.html'));
  await hostile.addStyleTag({ path: path.join(root, 'test/fixtures/lms-hostile.css') });
  await hostile.screenshot({ path: out('lms-hostile-stylesheet'), fullPage: true, animations: 'disabled' });
  await hostile.close();

  await browser.close();
  console.log('screenshots written to screenshots/');
})();
