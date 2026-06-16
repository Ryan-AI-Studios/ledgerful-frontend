import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const clearFocusAndModal = async () => {
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    const el = document.createElement('div');
    el.tabIndex = -1;
    document.body.appendChild(el);
    el.focus();
    el.blur();
    el.remove();
  });
  await page.waitForTimeout(100);
};

await page.goto('http://localhost:52001', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await clearFocusAndModal();
await page.screenshot({ path: 'dashboard-1440.png', fullPage: false });

await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(300);
await clearFocusAndModal();
await page.screenshot({ path: 'dashboard-768.png', fullPage: false });

await browser.close();
console.log('screenshots saved');
