/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://localhost:52001";
const OUT = path.join(__dirname, "..", "screenshots", "v1");
const pages = [
  { name: "dashboard", route: "/" },
  { name: "changes", route: "/changes" },
  { name: "ledger", route: "/ledger" },
  { name: "ledger-detail", route: "/ledger/dbce9fe7" },
  { name: "hotspots", route: "/hotspots" },
  { name: "graph", route: "/graph" },
  { name: "settings", route: "/settings" },
  { name: "projects", route: "/projects" },
  { name: "status", route: "/status" },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Disable focus rings and transitions for clean screenshots.
  await page.addStyleTag({
    content: `
      * { outline: none !important; }
      *, *::before, *::after { transition: none !important; animation: none !important; }
    `,
  });

  for (const { name, route } of pages) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    // Mock data resolves via setTimeout; wait for client rendering to finish.
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(OUT, `${name}.png`),
      fullPage: true,
    });
    console.log("captured", name);
  }

  await browser.close();
})();
