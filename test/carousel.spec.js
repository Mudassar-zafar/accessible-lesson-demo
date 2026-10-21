const { test, expect } = require('@playwright/test');
const { open } = require('./helpers');

async function currentSlide(page) {
  return page.locator('.cnx-carousel__slide').evaluateAll(function (slides) {
    const visible = slides.filter(function (s) { return !s.hidden; });
    return visible.length === 1 ? slides.indexOf(visible[0]) + 1 : -visible.length;
  });
}

test.describe('carousel', function () {
  test.beforeEach(async function ({ page }) {
    await page.clock.install();
    await open(page);
  });

  test('container and slides carry the APG carousel semantics', async function ({ page }) {
    const carousel = page.locator('.cnx-carousel');
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    await expect(carousel).toHaveAccessibleName('Real-world scenarios');
    const slides = page.locator('.cnx-carousel__slide');
    await expect(slides).toHaveCount(4);
    for (let i = 0; i < 4; i += 1) {
      await expect(slides.nth(i)).toHaveAttribute('role', 'group');
      await expect(slides.nth(i)).toHaveAttribute('aria-roledescription', 'slide');
      await expect(slides.nth(i)).toHaveAttribute('aria-label', (i + 1) + ' of 4');
    }
    await expect(page.locator('.cnx-carousel__slides')).toHaveAttribute('role', 'none');
    for (const img of await page.locator('.cnx-carousel__art').all()) {
      await expect(img).toHaveAttribute('alt', '');
    }
  });

  test('only the current slide is rendered, so hidden slides are out of the Tab order', async function ({ page }) {
    expect(await currentSlide(page)).toBe(1);
    await expect(page.locator('.cnx-carousel__slide').nth(1)).toBeHidden();
    await expect(page.locator('.cnx-carousel__position')).toHaveText('Slide 1 of 4');
  });

  test('previous and next move and wrap, and the visible position text follows', async function ({ page }) {
    const next = page.getByRole('button', { name: 'Next slide' });
    const prev = page.getByRole('button', { name: 'Previous slide' });
    await next.click();
    expect(await currentSlide(page)).toBe(2);
    await expect(page.locator('.cnx-carousel__position')).toHaveText('Slide 2 of 4');
    await prev.click();
    await prev.click();
    expect(await currentSlide(page)).toBe(4);
    await next.focus();
    await page.keyboard.press('Enter');
    expect(await currentSlide(page)).toBe(1);
    await expect(next).toBeFocused();
  });

  test('double click on Next moves two slides and leaves one slide shown', async function ({ page }) {
    await page.getByRole('button', { name: 'Next slide' }).dblclick();
    expect(await currentSlide(page)).toBe(3);
  });

  test('rotation is off by default and the slides wrapper is polite', async function ({ page }) {
    const rotate = page.locator('.cnx-carousel__rotate');
    await expect(rotate).toHaveAccessibleName('Start slide rotation');
    await expect(rotate).not.toHaveAttribute('aria-pressed', /.*/);
    await expect(page.locator('.cnx-carousel__viewport')).toHaveAttribute('aria-live', 'polite');
    await page.clock.runFor(30000);
    expect(await currentSlide(page)).toBe(1);
  });

  test('Start rotates every 6 seconds with aria-live off, Stop restores polite', async function ({ page }) {
    const rotate = page.locator('.cnx-carousel__rotate');
    await rotate.focus();
    await page.keyboard.press('Enter');
    await expect(rotate).toHaveAccessibleName('Stop slide rotation');
    await expect(page.locator('.cnx-carousel__viewport')).toHaveAttribute('aria-live', 'off');
    await page.clock.runFor(4999);
    expect(await currentSlide(page)).toBe(1);
    await page.clock.runFor(1100);
    expect(await currentSlide(page)).toBe(2);
    await page.clock.runFor(6000);
    expect(await currentSlide(page)).toBe(3);
    await page.keyboard.press('Enter');
    await expect(rotate).toHaveAccessibleName('Start slide rotation');
    await expect(page.locator('.cnx-carousel__viewport')).toHaveAttribute('aria-live', 'polite');
    await page.clock.runFor(20000);
    expect(await currentSlide(page)).toBe(3);
  });

  test('keyboard focus moving inside the carousel stops rotation for good', async function ({ page }) {
    const rotate = page.locator('.cnx-carousel__rotate');
    await rotate.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Previous slide' })).toBeFocused();
    await expect(rotate).toHaveAccessibleName('Start slide rotation');
    await expect(page.locator('.cnx-carousel__viewport')).toHaveAttribute('aria-live', 'polite');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.clock.runFor(20000);
    expect(await currentSlide(page)).toBe(1);
  });

  test('keyboard focus entering from outside stops rotation that a pointer started', async function ({ page }) {
    const rotate = page.locator('.cnx-carousel__rotate');
    await rotate.click();
    await expect(rotate).toHaveAccessibleName('Stop slide rotation');
    await page.mouse.move(0, 0);
    await page.locator('#scenarios-title').evaluate(function (h) { h.setAttribute('tabindex', '-1'); h.focus(); });
    await page.keyboard.press('Tab');
    await expect(rotate).toBeFocused();
    await expect(rotate).toHaveAccessibleName('Start slide rotation');
  });

  test('pointer hover over the slides stops rotation, and it stays stopped after the pointer leaves', async function ({ page }) {
    const rotate = page.locator('.cnx-carousel__rotate');
    await rotate.click();
    await expect(rotate).toHaveAccessibleName('Stop slide rotation');
    await page.locator('.cnx-carousel__viewport').hover();
    await expect(rotate).toHaveAccessibleName('Start slide rotation');
    await page.mouse.move(0, 0);
    await page.clock.runFor(20000);
    expect(await currentSlide(page)).toBe(1);
  });

  test('a pointer user can press Stop on the rotation button', async function ({ page }) {
    const rotate = page.locator('.cnx-carousel__rotate');
    await rotate.click();
    await page.mouse.move(0, 0);
    await page.clock.runFor(6100);
    expect(await currentSlide(page)).toBe(2);
    await rotate.click();
    await expect(rotate).toHaveAccessibleName('Start slide rotation');
    await page.clock.runFor(20000);
    expect(await currentSlide(page)).toBe(2);
  });
});
