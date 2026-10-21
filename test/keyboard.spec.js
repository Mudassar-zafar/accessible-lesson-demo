const { test, expect } = require('@playwright/test');
const { open, settle } = require('./helpers');

// Walks the page with Tab and records every stop with its box and focus ring.
async function walk(page, maxStops = 80) {
  const stops = [];
  for (let i = 0; i < maxStops; i += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(function () {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) {
        return null;
      }
      if (!el.hasAttribute('data-cnx-stop')) {
        el.setAttribute('data-cnx-stop', String(document.querySelectorAll('[data-cnx-stop]').length));
      }

      function rgb(value) {
        const m = value.match(/[\d.]+/g);
        return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] } : null;
      }
      function lum(c) {
        const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
      }
      function backgroundOf(node) {
        while (node && node.nodeType === 1) {
          const c = rgb(getComputedStyle(node).backgroundColor);
          if (c && c.a > 0.5) {
            return c;
          }
          node = node.parentElement;
        }
        return { r: 255, g: 255, b: 255, a: 1 };
      }
      const cs = getComputedStyle(el);
      const ring = rgb(cs.outlineColor);
      const offset = parseFloat(cs.outlineOffset) || 0;
      // A ring drawn inside the box sits on the element's own background.
      const bg = backgroundOf(offset < 0 ? el : el.parentElement);
      const l1 = lum(ring);
      const l2 = lum(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const r = el.getBoundingClientRect();
      return {
        stop: el.getAttribute('data-cnx-stop'),
        tag: el.tagName.toLowerCase(),
        text: (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 50),
        top: r.top + window.scrollY,
        bottom: r.bottom + window.scrollY,
        left: r.left,
        outlineStyle: cs.outlineStyle,
        outlineWidth: parseFloat(cs.outlineWidth),
        ringContrast: Math.round(ratio * 100) / 100
      };
    });
    if (!info) {
      if (stops.length) {
        break;
      }
      continue;
    }
    if (stops.some(function (s) { return s.stop === info.stop; })) {
      break;
    }
    stops.push(info);
  }
  return stops;
}

// The focusable elements in DOM order, with one stop per radio group.
async function expectedOrder(page) {
  return page.evaluate(function () {
    const selector = 'a[href], button, input, summary, [tabindex]';
    const seenRadio = {};
    return Array.prototype.filter.call(document.querySelectorAll(selector), function (el) {
      if (el.tabIndex < 0 || el.disabled) {
        return false;
      }
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') {
        return false;
      }
      if (el.type === 'radio') {
        const key = (el.form ? Array.prototype.indexOf.call(document.forms, el.form) : 'x') + el.name;
        if (seenRadio[key]) {
          return false;
        }
        seenRadio[key] = true;
      }
      return true;
    }).map(function (el) {
      return el.tagName.toLowerCase() + ' ' + (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 50);
    });
  });
}

test.describe('keyboard', function () {
  test('Tab order follows DOM order and visual order, and returns to the start (no trap)', async function ({ page, browserName }) {
    await open(page);
    const stops = await walk(page);
    const expected = await expectedOrder(page);

    if (browserName === 'webkit' && stops.every(function (s) { return s.tag !== 'a'; })) {
      // WebKit leaves links out of the Tab order unless "Press Tab to highlight
      // each item" is on. This is a platform setting, not a page defect.
      const noLinks = expected.filter(function (e) { return e.indexOf('a ') !== 0; });
      expect(stops.map(function (s) { return s.tag + ' ' + s.text; })).toEqual(noLinks);
    } else {
      expect(stops.map(function (s) { return s.tag + ' ' + s.text; })).toEqual(expected);
    }

    for (let i = 1; i < stops.length; i += 1) {
      const a = stops[i - 1];
      const b = stops[i];
      const sameRow = b.top < a.bottom && b.bottom > a.top;
      const ok = sameRow ? b.left > a.left : b.top >= a.bottom - 1;
      expect(ok, 'visual order from "' + a.text + '" to "' + b.text + '"').toBe(true);
    }
  });

  test('every focus stop shows a solid ring of at least 2px with at least 3:1 contrast', async function ({ page }) {
    await open(page);
    const stops = await walk(page);
    expect(stops.length).toBeGreaterThan(15);
    for (const s of stops) {
      expect(s.outlineStyle, 'outline style on ' + s.text).not.toBe('none');
      expect(s.outlineWidth, 'outline width on ' + s.text).toBeGreaterThanOrEqual(2);
      expect(s.ringContrast, 'ring contrast on ' + s.text).toBeGreaterThanOrEqual(3);
    }
  });

  test('skip link is the first stop, becomes visible and moves focus to main', async function ({ page, browserName }) {
    await open(page);
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    if (browserName === 'webkit') {
      // WebKit skips links on Tab by default (platform setting), so focus it directly.
      await skip.focus();
    } else {
      await page.keyboard.press('Tab');
    }
    await expect(skip).toBeFocused();
    await settle(page);
    const box = await skip.boundingBox();
    expect(box.y).toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('every component works with the keyboard alone and focus is never dropped to the page', async function ({ page }) {
    await open(page);
    async function focusIsKept(label) {
      const tag = await page.evaluate(function () { return document.activeElement === document.body ? 'BODY' : document.activeElement.tagName; });
      expect(tag, 'focus after ' + label).not.toBe('BODY');
    }

    await page.locator('.cnx-accordion__trigger').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.cnx-accordion__trigger').first()).toHaveAttribute('aria-expanded', 'true');
    await focusIsKept('accordion Enter');

    await page.getByRole('tab', { name: 'Vague' }).focus();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Useful' })).toHaveAttribute('aria-selected', 'true');
    await focusIsKept('tabs End');

    const flip = page.locator('.cnx-flip__toggle').first();
    await flip.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.cnx-flip').first()).toHaveAttribute('data-side', 'back');
    await focusIsKept('flip Space');

    await page.getByRole('button', { name: 'Next slide' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.cnx-carousel__position')).toHaveText('Slide 2 of 4');
    await focusIsKept('carousel Next');

    const q1 = page.locator('form.cnx-check').first();
    await q1.getByRole('radio').first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(q1.getByRole('radio').nth(1)).toBeChecked();
    await page.keyboard.press('Enter');
    await expect(q1.getByRole('status')).toContainText('Correct.');
    await focusIsKept('checkpoint Enter');

    await q1.getByRole('button', { name: 'Try again' }).focus();
    await page.keyboard.press('Enter');
    await focusIsKept('Try again');

    const q2 = page.locator('form.cnx-check').nth(1);
    await q2.getByRole('checkbox').first().focus();
    await page.keyboard.press('Space');
    await expect(q2.getByRole('checkbox').first()).toBeChecked();
  });
});
