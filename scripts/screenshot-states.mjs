import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Suppress Playwright-only focus/caret artifacts in screenshots
const cleanScreenshot = async (path) => {
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const style = document.createElement('style');
    style.id = 'screenshot-clean';
    style.textContent = '* { outline: none !important; caret-color: transparent !important; }';
    document.head.appendChild(style);
  });
  await page.waitForTimeout(50);
  await page.screenshot({ path, fullPage: false });
  await page.evaluate(() => document.getElementById('screenshot-clean')?.remove());
};

// 1. Default risky state
await page.goto('http://localhost:52001', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await cleanScreenshot('dashboard-risky.png');

// 2. Open modal
await page.waitForSelector('button:has-text("Explain score")', { state: 'visible' });
await page.click('button:has-text("Explain score")');
await page.waitForSelector('dialog[open]', { state: 'visible' });
await page.waitForTimeout(300);
await page.screenshot({ path: 'dashboard-modal.png', fullPage: false });

// 3. Healthy state
await page.goto('http://localhost:52001/?healthy=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await cleanScreenshot('dashboard-healthy.png');

// 4. Empty state
await page.goto('http://localhost:52001/?empty=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await cleanScreenshot('dashboard-empty.png');

// 5. Error state
await page.goto('http://localhost:52001/?error=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await cleanScreenshot('dashboard-error.png');

await browser.close();
console.log('state screenshots saved');
