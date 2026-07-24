import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.CAPTURE_BASE_URL ?? "http://localhost:52001";
const out = "screenshots/0076-after";
const CAPTURE_TOKEN = "playwright-0076-capture";

await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  colorScheme: "dark",
});
// Suppress first-run onboarding so health card is visible in screenshots
await context.addInitScript(() => {
  try {
    localStorage.setItem("ledgerful:onboarding-completed", "true");
    sessionStorage.setItem("ledgerful:onboarding-dismissed", "true");
  } catch {
    /* ignore */
  }
});
const page = await context.newPage();

/**
 * Full page loads reset module memory — drive the real TokenPrompt form on
 * each navigation rather than a URL-token bypass.
 */
async function gotoAuthed(path) {
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const signIn = page.getByRole("heading", { name: "Sign in" });
  if ((await signIn.count()) > 0) {
    await page.getByPlaceholder("Auth token").fill(CAPTURE_TOKEN);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForTimeout(400);
  }
}

async function dismissOnboardingIfPresent(p) {
  // Onboarding can cover the dashboard health card; dismiss if present.
  const close = p.getByRole("button", { name: /close|dismiss/i });
  const skip = p.getByRole("button", { name: /skip|not now|done/i });
  if ((await p.getByText("LEDGERFUL ONBOARDING").count()) > 0) {
    // Prefer Escape, then Next through, then explicit close/skip
    await p.keyboard.press("Escape");
    await p.waitForTimeout(300);
    if ((await p.getByText("LEDGERFUL ONBOARDING").count()) > 0) {
      for (let i = 0; i < 6; i++) {
        if ((await p.getByText("LEDGERFUL ONBOARDING").count()) === 0) break;
        const next = p.getByRole("button", { name: /next|done|finish|get started/i });
        if ((await next.count()) > 0) {
          await next.first().click();
          await p.waitForTimeout(350);
        } else {
          break;
        }
      }
    }
    if ((await close.count()) > 0) await close.first().click().catch(() => {});
    if ((await skip.count()) > 0) await skip.first().click().catch(() => {});
    await p.waitForTimeout(400);
  }
}

async function capture(name, path, interact) {
  await gotoAuthed(path);
  await page.waitForTimeout(1400);
  await dismissOnboardingIfPresent(page);
  if (interact) await interact(page);
  // Prefer waiting for app chrome, not the sign-in gate
  const signInOnly = (await page.getByRole("heading", { name: "Sign in" }).count()) > 0;
  if (signInOnly) {
    throw new Error(`Still on auth gate for ${name}`);
  }
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log("captured", name);
}

const routes = [
  ["dashboard", "/dashboard"],
  ["profile", "/profile"],
  ["compliance", "/compliance"],
  ["status", "/status"],
  ["settings", "/settings"],
  ["ledger", "/ledger"],
  ["hotspots", "/hotspots"],
];

for (const [name, path] of routes) {
  await capture(name, path);
}

await capture("settings-privacy", "/settings", async (p) => {
  const privacy = p.getByRole("button", { name: /privacy/i });
  if ((await privacy.count()) > 0) {
    await privacy.first().click();
    await p.waitForTimeout(600);
  }
});

await capture("settings-integrations", "/settings", async (p) => {
  const integrations = p.getByRole("button", { name: /integration/i });
  if ((await integrations.count()) > 0) {
    await integrations.first().click();
    await p.waitForTimeout(600);
  }
});

await page.setViewportSize({ width: 375, height: 812 });
for (const [name, path] of [
  ["dashboard-mobile", "/dashboard"],
  ["profile-mobile", "/profile"],
  ["status-mobile", "/status"],
]) {
  await capture(name, path);
}

await browser.close();
console.log("done ->", out);
