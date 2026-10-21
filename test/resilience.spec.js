const fs = require('fs');
const os = require('os');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { ROOT, fileUrl, open, trackErrors, hasHorizontalScroll } = require('./helpers');

// Copies the shipped files into a nested folder, as an LMS course copy would.
// The copy goes to the OS temp folder: Windows browsers fail on paths over 260
// characters, and test-results inside this repo is already deep.
function tempDir(name) {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cnx-')), name);
}

function copyCourse(target, options = {}) {
  const skip = options.skip || [];
  fs.mkdirSync(target, { recursive: true });
  function copy(rel) {
    const from = path.join(ROOT, rel);
    const to = path.join(target, rel);
    if (skip.some(function (s) { return rel.replace(/\\/g, '/').indexOf(s) === 0; })) {
      return;
    }
    if (fs.statSync(from).isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      fs.readdirSync(from).forEach(function (child) { copy(path.join(rel, child)); });
    } else {
      fs.copyFileSync(from, to);
    }
  }
  ['index.html', 'page-1.html', 'page-3.html', 'css', 'js', 'assets'].forEach(copy);
}

test.describe('no JavaScript', function () {
  test.use({ javaScriptEnabled: false });

  test('all content is visible, there are no buttons, and answer keys are available', async function ({ page }) {
    await open(page);
    await expect(page.locator('.cnx-lesson button')).toHaveCount(0);
    await expect(page.locator('[role="tab"], [role="tablist"], [role="tabpanel"], [aria-roledescription]')).toHaveCount(0);
    await expect(page.locator('.cnx-accordion__panel:visible')).toHaveCount(4);
    await expect(page.locator('.cnx-tabs__panel:visible')).toHaveCount(3);
    await expect(page.locator('.cnx-tabs__title:visible')).toHaveCount(3);
    await expect(page.locator('.cnx-flip__face:visible')).toHaveCount(6);
    await expect(page.locator('.cnx-flip__label:visible')).toHaveText(['Statement', 'Answer', 'Statement', 'Answer', 'Statement', 'Answer']);
    await expect(page.locator('.cnx-carousel__slide:visible')).toHaveCount(4);
    await expect(page.locator('.cnx-check__nojs:visible')).toHaveText(['Answers appear when JavaScript is enabled.', 'Answers appear when JavaScript is enabled.']);
    const keys = page.locator('details.cnx-check__key');
    await expect(keys).toHaveCount(2);
    await keys.first().locator('summary').click();
    await expect(keys.first().getByText('It names the moment')).toBeVisible();
  });
});

test.describe('failure isolation', function () {
  test('one component that throws leaves the others working and its own content readable', async function ({ page }) {
    const errors = trackErrors(page);
    await page.addInitScript(function () {
      const ns = {};
      Object.defineProperty(ns, 'Tabs', {
        get: function () { return function () { document.querySelector('.cnx-tabs').appendChild(document.createElement('span')); throw new Error('simulated failure'); }; },
        set: function () {}
      });
      window.CnxLesson = ns;
    });
    await open(page);
    expect(errors.some(function (e) { return /\[cnx\] tabs did not start/.test(e); })).toBe(true);
    await expect(page.locator('[role="tab"]')).toHaveCount(0);
    await expect(page.locator('.cnx-tabs span')).toHaveCount(0);
    await expect(page.locator('.cnx-tabs__panel:visible')).toHaveCount(3);
    await expect(page.locator('.cnx-tabs button')).toHaveCount(0);
    await page.locator('.cnx-accordion__trigger').first().click();
    await expect(page.locator('.cnx-accordion__trigger').first()).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.cnx-carousel')).toHaveAttribute('data-cnx-ready', '');
    await expect(page.locator('.cnx-flips')).toHaveAttribute('data-cnx-ready', '');
    await expect(page.locator('form.cnx-check[data-cnx-ready]')).toHaveCount(2);
  });

  test('a missing component script logs the component name and keeps static content', async function ({ page }) {
    const errors = trackErrors(page);
    await page.addInitScript(function () {
      const ns = {};
      Object.defineProperty(ns, 'Carousel', { get: function () { return undefined; }, set: function () {} });
      window.CnxLesson = ns;
    });
    await open(page);
    expect(errors.some(function (e) { return /\[cnx\] carousel did not start/.test(e); })).toBe(true);
    await expect(page.locator('.cnx-carousel__slide:visible')).toHaveCount(4);
    await expect(page.locator('.cnx-carousel button')).toHaveCount(0);
  });

  test('a normal load has no console errors', async function ({ page }) {
    const errors = trackErrors(page);
    await open(page);
    expect(errors).toEqual([]);
  });
});

test.describe('duplicate instances (stress.html)', function () {
  test('IDs are unique and every instance starts', async function ({ page }) {
    const errors = trackErrors(page);
    await open(page, 'test/fixtures/stress.html');
    expect(errors).toEqual([]);
    const dupes = await page.evaluate(function () {
      const seen = {};
      const out = [];
      document.querySelectorAll('[id]').forEach(function (el) {
        if (seen[el.id]) { out.push(el.id); }
        seen[el.id] = true;
      });
      return out;
    });
    expect(dupes).toEqual([]);
    await expect(page.locator('[data-cnx]:not([data-cnx-ready])')).toHaveCount(0);
    await expect(page.locator('[data-cnx]')).toHaveCount(12);
    // Every aria-controls and aria-labelledby points at exactly one element.
    const broken = await page.evaluate(function () {
      const out = [];
      document.querySelectorAll('[aria-controls], [aria-labelledby], [aria-describedby]').forEach(function (el) {
        ['aria-controls', 'aria-labelledby', 'aria-describedby'].forEach(function (attr) {
          const v = el.getAttribute(attr);
          if (v && v.split(' ').some(function (id) { return document.querySelectorAll('#' + CSS.escape(id)).length !== 1; })) {
            out.push(attr + '=' + v);
          }
        });
      });
      return out;
    });
    expect(broken).toEqual([]);
  });

  test('instances work independently', async function ({ page }) {
    await open(page, 'test/fixtures/stress.html');
    const accordions = page.locator('.cnx-accordion');
    await accordions.nth(1).locator('.cnx-accordion__trigger').first().click();
    await expect(accordions.nth(1).locator('.cnx-accordion__trigger').first()).toHaveAttribute('aria-expanded', 'true');
    await expect(accordions.nth(0).locator('.cnx-accordion__trigger').first()).toHaveAttribute('aria-expanded', 'false');

    const lists = page.getByRole('tablist');
    await lists.nth(1).getByRole('tab').first().focus();
    await page.keyboard.press('End');
    await expect(lists.nth(1).getByRole('tab').last()).toHaveAttribute('aria-selected', 'true');
    await expect(lists.nth(0).getByRole('tab').first()).toHaveAttribute('aria-selected', 'true');

    const carousels = page.locator('.cnx-carousel');
    await carousels.nth(1).getByRole('button', { name: 'Next slide' }).click();
    await expect(carousels.nth(1).locator('.cnx-carousel__position')).toHaveText('Slide 2 of 4');
    await expect(carousels.nth(0).locator('.cnx-carousel__position')).toHaveText('Slide 1 of 4');

    const forms = page.locator('form.cnx-check');
    await forms.nth(2).getByRole('button', { name: 'Check answer' }).click();
    await expect(forms.nth(2).getByRole('status')).toContainText('No answer selected.');
    await expect(forms.nth(0).getByRole('status')).toHaveText('');
  });

  test('very long labels do not overflow at 320px', async function ({ page }) {
    await page.setViewportSize({ width: 320, height: 640 });
    await open(page, 'test/fixtures/stress.html');
    for (const button of await page.locator('.cnx-accordion__trigger, .cnx-flip__toggle').all()) {
      await button.click();
    }
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});

test.describe('LMS constraints', function () {
  test('our components keep their styles when an LMS stylesheet loads after ours', async function ({ page }) {
    await open(page);
    await page.addStyleTag({ path: path.join(ROOT, 'test/fixtures/lms-hostile.css') });
    const s = await page.evaluate(function () {
      function cs(sel) { return getComputedStyle(document.querySelector(sel)); }
      return {
        h1Font: cs('.cnx-lesson h1').fontFamily,
        h1Transform: cs('.cnx-lesson h1').textTransform,
        h2Size: cs('.cnx-lesson h2').fontSize,
        pSize: cs('.cnx-lesson p').fontSize,
        pLine: parseFloat(cs('.cnx-section p').lineHeight) / parseFloat(cs('.cnx-section p').fontSize),
        linkDecoration: cs('.cnx-footer a').textDecorationLine,
        buttonFont: cs('.cnx-accordion__trigger').fontFamily,
        buttonSize: cs('.cnx-accordion__trigger').fontSize,
        buttonBorder: cs('.cnx-accordion__trigger').borderTopStyle,
        boxSizing: cs('.cnx-check__option').boxSizing,
        liFloat: cs('.cnx-objectives li').cssFloat,
        listStyle: cs('.cnx-objectives').listStyleType,
        imgBorder: cs('.cnx-hero__art').borderTopStyle,
        inputWidth: cs('.cnx-check__option input').width,
        legendSize: cs('.cnx-check legend').fontSize,
        fieldsetBorder: cs('.cnx-check fieldset').borderTopStyle,
        hiddenPanel: cs('.cnx-accordion__panel').display
      };
    });
    expect(s.h1Font).toContain('Atkinson Hyperlegible');
    expect(s.h1Transform).toBe('none');
    expect(s.h2Size).toBe('28px');
    expect(s.pSize).toBe('18px');
    expect(s.pLine).toBeGreaterThan(1.5);
    expect(s.linkDecoration).toBe('underline');
    expect(s.buttonFont).toContain('Atkinson Hyperlegible');
    expect(s.buttonSize).toBe('22px');
    expect(s.buttonBorder).toBe('none');
    expect(s.boxSizing).toBe('border-box');
    expect(s.liFloat).toBe('none');
    expect(s.listStyle).toBe('decimal');
    expect(s.imgBorder).toBe('none');
    expect(s.inputWidth).toBe('24px');
    expect(s.legendSize).toBe('22px');
    expect(s.fieldsetBorder).toBe('none');
    expect(s.hiddenPanel).toBe('none');

    // Focus ring survives "a:focus, button:focus { outline: none }".
    await page.locator('.cnx-accordion__trigger').first().focus();
    await page.keyboard.press('Tab');
    const ring = await page.evaluate(function () { return getComputedStyle(document.activeElement).outlineStyle; });
    expect(ring).toBe('solid');
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test('works when the course is copied into a nested subfolder', async function ({ page }) {
    const target = tempDir(path.join('course-copy', 'module-3', 'lesson'));
    copyCourse(target);
    const errors = trackErrors(page);
    await page.goto(require('url').pathToFileURL(path.join(target, 'index.html')).href);
    expect(errors).toEqual([]);
    await expect(page.locator('[data-cnx]:not([data-cnx-ready])')).toHaveCount(0);
    const images = await page.locator('img').evaluateAll(function (imgs) {
      return imgs.map(function (i) { return i.complete && i.naturalWidth > 0; });
    });
    expect(images.every(Boolean)).toBe(true);
    await page.evaluate(function () { return document.fonts.ready; });
    expect(await page.evaluate(function () { return document.fonts.check('700 18px "Atkinson Hyperlegible"'); })).toBe(true);
    await page.getByRole('link', { name: /Next page/ }).click();
    await expect(page.locator('h1')).toHaveText('Planning the conversation');
  });

  test('a missing font file falls back to a readable system stack', async function ({ page }) {
    const target = tempDir('no-fonts');
    copyCourse(target, { skip: ['assets/fonts'] });
    await page.goto(require('url').pathToFileURL(path.join(target, 'index.html')).href);
    await page.evaluate(function () { return document.fonts.ready; });
    const result = await page.evaluate(function () {
      const loaded = Array.from(document.fonts).filter(function (f) { return f.status === 'loaded' && f.family.indexOf('Atkinson') > -1; }).length;
      const p = document.querySelector('.cnx-section p');
      return { loaded: loaded, family: getComputedStyle(p).fontFamily, size: getComputedStyle(p).fontSize, height: p.getBoundingClientRect().height };
    });
    expect(result.loaded).toBe(0);
    expect(result.family).toMatch(/system-ui|Segoe UI|Arial|sans-serif/);
    expect(result.size).toBe('18px');
    expect(result.height).toBeGreaterThan(20);
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test('previous and next are real links to pages that exist', async function ({ page }) {
    await open(page);
    expect(await page.locator('a[href="#"], a:not([href])').count()).toBe(0);
    await page.getByRole('link', { name: /Previous page/ }).click();
    await expect(page.locator('h1')).toHaveText('Why feedback matters');
    await expect(page.getByText('This sample includes only page 2')).toBeVisible();
    await page.getByRole('link', { name: /Go back to page 2/ }).click();
    await expect(page.locator('h1')).toHaveText('How to give feedback people can use');
    expect(fs.existsSync(path.join(ROOT, 'page-3.html'))).toBe(true);
    await page.goto(fileUrl('page-3.html'));
    await expect(page.getByText('This sample includes only page 2')).toBeVisible();
  });
});
