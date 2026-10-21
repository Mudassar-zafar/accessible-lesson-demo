// Shared helpers for the lesson specs.
const path = require('path');
const { pathToFileURL } = require('url');
const { expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const ROOT = path.resolve(__dirname, '..');
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function fileUrl(relative) {
  return pathToFileURL(path.join(ROOT, relative)).href;
}

async function open(page, relative = 'index.html') {
  await page.goto(fileUrl(relative));
  await page.waitForLoadState('load');
}

// Jumps running transitions and animations to their end so checks see the
// settled state. finish() does not depend on timers, so it also works while
// the Playwright clock is paused.
async function settle(page) {
  await page.evaluate(function () {
    document.getAnimations().forEach(function (a) { a.finish(); });
  });
}

async function expectNoAxeViolations(page, label) {
  await settle(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map(function (v) {
    return v.id + ': ' + v.nodes.map(function (n) { return n.target.join(' '); }).join(' | ');
  });
  expect(summary, 'axe violations in state: ' + label).toEqual([]);
}

// Collects console errors and page errors so a test can assert there are none.
function trackErrors(page) {
  const errors = [];
  page.on('console', function (msg) {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', function (err) {
    errors.push(err.message);
  });
  return errors;
}

async function activeDescription(page) {
  return page.evaluate(function () {
    const el = document.activeElement;
    if (!el || el === document.body) {
      return 'BODY';
    }
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' ' + (el.textContent || '').trim().slice(0, 40);
  });
}

async function hasHorizontalScroll(page) {
  return page.evaluate(function () {
    const s = document.scrollingElement;
    return s.scrollWidth > s.clientWidth;
  });
}

module.exports = { settle, ROOT, WCAG_TAGS, fileUrl, open, expectNoAxeViolations, trackErrors, activeDescription, hasHorizontalScroll };
