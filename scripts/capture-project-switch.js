const { chromium } = require("playwright");
const path = require("path");

const BASE = "http://localhost:52001";
const OUT = path.join(__dirname, "..", "screenshots", "v1");

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.addStyleTag({
    content: `
      * { outline: none !important; }
      *, *::before, *::after { transition: none !important; animation: none !important; }
    `,
  });

  // Go to projects and switch to ledgerful-frontend
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.getByText("ledgerful-frontend").first().click();
  await page.waitForTimeout(800);

  // Navigate to dashboard to verify project context updated
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(OUT, "dashboard-switch.png"),
    fullPage: true,
  });

  // Also capture projects page after switch
  await page.goto(`${BASE}/projects`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(OUT, "projects-switch.png"),
    fullPage: true,
  });

  await browser.close();
  console.log("captured switch screenshots");
})();
