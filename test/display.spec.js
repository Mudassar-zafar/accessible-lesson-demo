const { test, expect } = require('@playwright/test');
const { open, settle, hasHorizontalScroll } = require('./helpers');

async function openEverything(page) {
  for (const button of await page.locator('.cnx-accordion__trigger').all()) {
    await button.click();
  }
  for (const button of await page.locator('.cnx-flip__toggle').all()) {
    await button.click();
  }
  const forms = page.locator('form.cnx-check');
  await forms.nth(0).getByRole('radio').first().check();
  await forms.nth(0).getByRole('button', { name: 'Check answer' }).click();
  await forms.nth(1).getByRole('button', { name: 'Check answer' }).click();
}

const TEXT_SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

async function clippedElements(page) {
  return page.evaluate(function () {
    const out = [];
    document.querySelectorAll('.cnx-lesson *').forEach(function (el) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || el.classList.contains('cnx-vh') || el.closest('.cnx-vh, svg')) {
        return;
      }
      const clipsX = cs.overflowX !== 'visible';
      const clipsY = cs.overflowY !== 'visible';
      if ((clipsX && el.scrollWidth > el.clientWidth + 1) || (clipsY && el.scrollHeight > el.clientHeight + 1)) {
        out.push(el.className || el.tagName);
      }
    });
    return out;
  });
}

test.describe('motion', function () {
  test('reduced motion: no transitions or animations run after any interaction', async function ({ page }) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await openEverything(page);
    await page.getByRole('tab', { name: 'Useful' }).click();
    await page.getByRole('button', { name: 'Next slide' }).click();
    const result = await page.evaluate(function () {
      const moving = [];
      document.querySelectorAll('*').forEach(function (el) {
        const cs = getComputedStyle(el);
        const durations = (cs.transitionDuration + ',' + cs.animationDuration).split(',').map(parseFloat);
        if (cs.animationName !== 'none' || durations.some(function (d) { return d > 0; })) {
          moving.push(el.className || el.tagName);
        }
      });
      return { moving: moving, running: document.getAnimations().length };
    });
    expect(result.moving).toEqual([]);
    expect(result.running).toBe(0);
  });

  test('control: with no motion preference the card turn does animate', async function ({ page }) {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await open(page);
    await page.locator('.cnx-flip__toggle').first().click();
    const name = await page.locator('.cnx-flip__face--back').first().evaluate(function (el) { return getComputedStyle(el).animationName; });
    expect(name).toBe('cnx-flip-in');
  });
});

test.describe('forced colors', function () {
  test.skip(function ({ browserName }) { return browserName !== 'chromium'; }, 'forced-colors emulation is Chromium only');

  test('focus rings stay visible and controls keep visible boundaries', async function ({ page }) {
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    const tab = page.getByRole('tab', { name: 'Vague' });
    await tab.focus();
    await page.keyboard.press('ArrowRight');
    await settle(page);
    const ring = await page.evaluate(function () {
      const cs = getComputedStyle(document.activeElement);
      return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
    });
    expect(ring.style).toBe('solid');
    expect(ring.width).toBeGreaterThanOrEqual(2);

    const borders = await page.locator('.cnx-btn, .cnx-check__option').evaluateAll(function (els) {
      return els.filter(function (el) {
        const cs = getComputedStyle(el);
        return el.offsetParent && (cs.borderTopStyle === 'none' || parseFloat(cs.borderTopWidth) < 1);
      }).length;
    });
    expect(borders).toBe(0);

    // The selected tab keeps a bar that unselected tabs do not have.
    const bars = await page.getByRole('tab').evaluateAll(function (tabs) {
      return tabs.map(function (t) { return getComputedStyle(t).borderBottomColor; });
    });
    expect(bars[1]).not.toBe(bars[0]);
    expect(bars[0]).toBe(bars[2]);
  });
});

test.describe('reflow and text spacing', function () {
  for (const size of [{ width: 320, height: 640 }, { width: 320, height: 256 }]) {
    test('no horizontal scroll at ' + size.width + 'x' + size.height + ' (400% zoom of 1280 wide)', async function ({ page }) {
      await page.setViewportSize(size);
      await open(page);
      expect(await hasHorizontalScroll(page)).toBe(false);
      await openEverything(page);
      expect(await hasHorizontalScroll(page)).toBe(false);
      for (let i = 0; i < 4; i += 1) {
        await page.getByRole('button', { name: 'Next slide' }).click();
        expect(await hasHorizontalScroll(page)).toBe(false);
      }
      expect(await clippedElements(page)).toEqual([]);
    });
  }

  test('WCAG 1.4.12 text spacing override: nothing clipped, no horizontal scroll', async function ({ page }) {
    await open(page);
    await page.addStyleTag({ content: TEXT_SPACING });
    await openEverything(page);
    expect(await clippedElements(page)).toEqual([]);
    expect(await hasHorizontalScroll(page)).toBe(false);
    await page.setViewportSize({ width: 320, height: 640 });
    expect(await clippedElements(page)).toEqual([]);
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test('no text smaller than 16px and every control at least 24 by 24', async function ({ page }) {
    await open(page);
    await openEverything(page);
    const report = await page.evaluate(function () {
      const small = [];
      document.querySelectorAll('.cnx-lesson *').forEach(function (el) {
        const hasText = Array.prototype.some.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
        if (hasText && el.offsetParent && !el.closest('.cnx-vh') && parseFloat(getComputedStyle(el).fontSize) < 16) {
          small.push(el.className || el.tagName);
        }
      });
      const tiny = [];
      document.querySelectorAll('.cnx-lesson button, .cnx-lesson input, .cnx-lesson summary').forEach(function (el) {
        const r = el.getBoundingClientRect();
        if (r.width && (r.width < 24 || r.height < 24)) {
          tiny.push(el.className || el.tagName);
        }
      });
      return { small: small, tiny: tiny };
    });
    expect(report.small).toEqual([]);
    expect(report.tiny).toEqual([]);
  });
});
