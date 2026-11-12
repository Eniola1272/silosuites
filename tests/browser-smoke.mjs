// Optional development verification. Requires Playwright and a local Chrome/Chromium.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { todayInUtah, addDays } from '../prototype/booking.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.SILO_PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.SILO_CHROME_EXECUTABLE ? { executablePath: process.env.SILO_CHROME_EXECUTABLE } : {}) });
const base = process.env.SILO_PREVIEW_URL || 'http://127.0.0.1:4173';
const issues = [];
await mkdir('test-results', { recursive: true });
const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
desktop.on('pageerror', error => issues.push(error.message));
desktop.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) issues.push(`${response.status()}: ${response.url()}`); });
try {
  await desktop.goto(base, { waitUntil: 'networkidle' });
  await desktop.locator('.suite-card').first().waitFor();
  assert.equal(await desktop.locator('h1').count(), 1);
  assert.equal(await desktop.locator('.suite-card').count(), 6);
  await desktop.locator('img[loading="lazy"]').evaluateAll(images => images.forEach(i => { i.loading = 'eager'; }));
  await desktop.waitForFunction(() => [...document.images].filter(i => i.hasAttribute('src')).every(i => i.complete && i.naturalWidth > 0));
  assert.equal(await desktop.locator('img[src]').evaluateAll(images => images.every(i => !i.complete || i.naturalWidth > 0)), true);
  await desktop.screenshot({ path: 'test-results/home-desktop.png', fullPage: true });
  await desktop.screenshot({ path: 'test-results/home-desktop-viewport.png' });
  const checkIn = addDays(todayInUtah(), 2), checkOut = addDays(checkIn, 3);
  await desktop.locator('[data-date-open="in"]').click();
  const dialog = desktop.locator('#date-dialog');
  for (const day of [checkIn, checkOut]) {
    for (let n = 0; n < 2 && !(await dialog.locator(`[data-day="${day}"]`).isVisible()); n++) await dialog.locator('[data-month="1"]').click();
    await dialog.locator(`[data-day="${day}"]`).click();
  }
  await desktop.screenshot({ path: 'test-results/calendar-desktop.png' });
  await desktop.locator('#apply-dates').click();
  await desktop.locator('[data-search] button[type="submit"]').click();
  await desktop.waitForURL(/stays\.html/);
  assert.equal(new URL(desktop.url()).searchParams.get('check_in'), checkIn);
  assert.equal(await desktop.locator('.suite-card').count(), 6);
  await desktop.locator('[data-filter="group"]').click();
  assert.equal(await desktop.locator('.suite-card').count(), 1);
  await desktop.locator('.suite-card h3 a').click();
  await desktop.waitForURL(/suite\.html/);
  assert.equal(await desktop.locator('h1').innerText(), 'All Four Silos');
  await desktop.locator('[data-guests]').selectOption('18');
  await desktop.locator('[data-property-search] button[type="submit"]').click();
  assert.equal(await desktop.locator('#review-dialog').isVisible(), true);
  assert.match(await desktop.locator('#review-content').innerText(), /18 guests/);
  await desktop.locator('#close-review').click();
  await desktop.locator('[data-gallery="0"]').first().click();
  assert.equal(await desktop.locator('#lightbox-dialog').isVisible(), true);
  await desktop.keyboard.press('Escape');
  await desktop.screenshot({ path: 'test-results/property-desktop.png', fullPage: true });
  await desktop.goto(`${base}/stays.html?check_in=2027-02-30&check_out=2027-03-03&guests=2`);
  assert.equal(await desktop.locator('.suite-card').count(), 0);
  assert.match(await desktop.locator('[data-search-error]').innerText(), /Choose/);
  assert.equal((await desktop.request.get(`${base}/../.secrets/hostaway.json`)).status(), 404);
  assert.equal((await desktop.request.get(`${base}/.secrets/hostaway.json`)).status(), 404);

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  mobile.on('pageerror', error => issues.push(error.message));
  await mobile.goto(base, { waitUntil: 'networkidle' });
  await mobile.locator('img[loading="lazy"]').evaluateAll(images => images.forEach(i => { i.loading = 'eager'; }));
  await mobile.waitForFunction(() => [...document.images].filter(i => i.hasAttribute('src')).every(i => i.complete && i.naturalWidth > 0));
  await mobile.screenshot({ path: 'test-results/home-mobile.png', fullPage: true });
  await mobile.screenshot({ path: 'test-results/home-mobile-viewport.png' });
  await mobile.locator('.menu-toggle').click();
  assert.equal(await mobile.locator('#mobile-menu').isVisible(), true);
  await mobile.keyboard.press('Escape');
  assert.equal(await mobile.locator('#mobile-menu').isVisible(), false);
  await mobile.locator('[data-date-open="in"]').click();
  assert.equal(await mobile.locator('#date-dialog').isVisible(), true);
  await mobile.screenshot({ path: 'test-results/calendar-mobile.png' });
  await mobile.keyboard.press('Escape');
  for (const width of [1440, 768, 390, 320]) {
    await desktop.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/stays.html', '/suite.html?id=dairy', '/local-guide.html', '/hot-springs.html']) {
      await desktop.goto(base + path, { waitUntil: 'networkidle' });
      const overflow = await desktop.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${path} overflows ${overflow}px at ${width}px`);
    }
  }
  assert.deepEqual(issues, []);
  console.log('PASS: homepage, date search, date carry, filters, group stay, 18 guests, review, gallery, invalid dates, private-file isolation, mobile menu/calendar, and responsive overflow checks.');
} finally { await browser.close(); }
