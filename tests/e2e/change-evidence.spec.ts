import { expect, test, type Page, type Response } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { parse, type DefaultTreeAdapterTypes } from "parse5";

const origin = "http://127.0.0.1:52001";
const mode = process.env.LEDGERFUL_E2E_MODE;
if (mode !== "current" && mode !== "legacy" && mode !== "embedded" && mode !== "incomparable") {
  throw new Error("Set LEDGERFUL_E2E_MODE to current, legacy, embedded or incomparable.");
}

function readFixture(variable: string): string {
  const filename = process.env[variable];
  if (!filename || !isAbsolute(filename)) throw new Error(variable + " must name an absolute fixture file");
  return readFileSync(filename, "utf8");
}

type Edge = { source: string; target: string };
type Fixture = {
  repoName: string;
  head: string;
  base: string;
  baselineName: string;
  baselineDigest: string;
  edge: Edge & { before: number; after: number };
  addedEdge: Edge;
  removedEdge: Edge;
  commands: Array<{
    attemptId: string;
    attemptKind: "executed" | "dry-run" | "refused";
    runId?: number;
    txId?: string;
    display?: string;
    scopeRequested: string;
    scopeExecuted: string;
    outcomes: Array<{ index: number; exitCode: number; timedOut: boolean }>;
  }>;
  gitPaths: string[];
};
const fixture = mode === "legacy"
  ? undefined
  : JSON.parse(readFixture("LEDGERFUL_E2E_EXPECTED")) as Fixture;
const token = readFixture("LEDGERFUL_E2E_TOKEN_FILE").trim();
if (!token) throw new Error("Fixture token file is empty");

function saveReceipt(name: string, value: unknown) {
  const path = test.info().outputPath(name + ".json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

async function authenticate(page: Page) {
  await expect(page.getByRole("heading", { name: "Sign in", exact: true })).toBeVisible();
  const input = page.getByPlaceholder("Auth token");
  await expect(input).toBeVisible();
  // FormData reads the native field. Pass the secret only as an in-memory
  // argument so Playwright action diagnostics never print the filled text.
  await input.evaluate((element, secret) => {
    (element as HTMLInputElement).value = secret;
  }, token);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

async function documentPolicy(response: Response | null, checkpoint: string) {
  if (!response) throw new Error("Expected daemon document response");
  expect(response.ok()).toBe(true);
  const policy = response.headers()["content-security-policy"];
  expect(policy).toBeTruthy();
  const directives = policy.split(";").map((part) => part.trim().split(/\s+/));
  const scripts = directives.filter(([name]) => name === "script-src");
  expect(scripts).toHaveLength(1);
  const scriptTokens = scripts[0].slice(1);
  expect(scriptTokens.some((token) => token.startsWith("'sha256-"))).toBe(true);
  expect(scriptTokens).not.toContain("'unsafe-inline'");

  const stack: DefaultTreeAdapterTypes.Node[] = [parse(await response.text())];
  let inlineCount = 0;
  while (stack.length > 0) {
    const node = stack.pop()!;
    if ("childNodes" in node) stack.push(...node.childNodes);
    if (!("tagName" in node) || node.tagName !== "script" || node.attrs.some(({ name }) => name === "src")) continue;
    const text = node.childNodes.map((child) => "value" in child ? child.value : "").join("");
    if (!text) continue;
    inlineCount++;
    const digest = createHash("sha256").update(text).digest("base64");
    expect(scriptTokens).toContain("'sha256-" + digest + "'");
  }
  expect(inlineCount).toBeGreaterThan(0);
  const path = new URL(response.url()).pathname;
  saveReceipt(checkpoint + "-csp", { path, policy, inlineCount });
}

async function fixtureSummary() {
  const result = await fetch(origin + "/api/changes?days=7", {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
  });
  expect(result.status).toBe(200);
  const rows = await result.json() as Array<{ summary: string; evidenceKey?: {head: string; base: string} }>;
  const entry = rows.find((row) => row.evidenceKey?.head === fixture?.head && row.evidenceKey?.base === fixture?.base);
  expect(entry?.summary).toBeTruthy();
  return entry!.summary;
}

function watchBrowser(page: Page) {
  const errors: string[] = [];
  const remote: string[] = [];
  const evidence: URL[] = [];
  const requests: Array<Promise<{ method: string; path: string; signedIn: boolean }>> = [];
  let watching = false;
  page.on("pageerror", () => errors.push("page error"));
  page.on("console", (event) => {
    if (event.type() === "error" && /hydrati|content security policy|refused to (?:load|execute)/i.test(event.text())) {
      errors.push("hydration or CSP error");
    }
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if ((url.protocol === "http:" || url.protocol === "https:") && url.origin !== origin) {
      remote.push(url.origin);
    }
    if (url.pathname === "/api/change-evidence") {
      if (request.method() !== "GET") errors.push("non-GET evidence request");
      evidence.push(url);
    }
    if (watching && url.origin === origin && url.pathname.startsWith("/api/")) {
      requests.push(request.headerValue("authorization").then((header) => ({
        method: request.method(), path: url.pathname, signedIn: header === "Bearer " + token,
      })));
    }
  });
  return { errors, remote, evidence, requests, watchEvidence: (active: boolean) => { watching = active; } };
}

async function assertPair(page: Page, summary: string, expected: Fixture) {
  const row = page.getByRole("row").filter({ hasText: summary });
  const trigger = row.getByRole("button", { name: /^(View|Hide) evidence$/ });
  await trigger.focus();
  await trigger.press("Enter");
  const panel = page.getByRole("region", { name: "Change evidence" });
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel.getByText(expected.repoName, { exact: true })).toBeVisible();
  await expect(panel.getByText(expected.head, { exact: true })).toBeVisible();
  await expect(panel.getByText(expected.base, { exact: true })).toBeVisible();
  const baseline = panel.getByRole("combobox", { name: "Baseline" });
  await expect(baseline.getByRole("option", { name: expected.baselineName, exact: true })).toBeAttached();
  await baseline.selectOption(expected.baselineName);
  await expect(panel.getByText(expected.baselineDigest, { exact: true })).toBeVisible();
  const files = panel.getByRole("list", { name: "Exact changed files" });
  for (const path of expected.gitPaths) await expect(files.getByText(path, { exact: true })).toBeVisible();
  const relationships = panel.getByRole("list", { name: "Resolved call relationships" });
  const edgeRow = (edge: Edge) => relationships.getByRole("listitem").filter({ hasText: edge.source }).filter({ hasText: edge.target });
  await expect(edgeRow(expected.edge).getByText("More resolved calls", { exact: true })).toBeVisible();
  await expect(edgeRow(expected.edge).getByText(String(expected.edge.before), { exact: true })).toBeVisible();
  await expect(edgeRow(expected.edge).getByText(String(expected.edge.after), { exact: true })).toBeVisible();
  await expect(edgeRow(expected.addedEdge).getByText("Added", { exact: true })).toBeVisible();
  await expect(edgeRow(expected.removedEdge).getByText("Removed", { exact: true })).toBeVisible();
  await expect(panel.getByRole("heading", { name: "Verification", exact: true })).toBeVisible();
  for (const command of expected.commands) {
    const attempt = panel.getByRole("article").filter({ hasText: command.attemptId });
    await expect(attempt).toBeVisible();
    if (command.display) {
      await expect(attempt.getByRole("list", { name: "Recorded exits" })
        .getByText(command.display, { exact: true })).toBeVisible();
    }
    if (command.runId != null) await expect(attempt.getByText(String(command.runId), { exact: true })).toBeVisible();
    const requested = attempt.getByText("Scope requested", { exact: true }).locator("..").locator("dd");
    const executedLabel = command.attemptKind === "dry-run" ? "Dry-run scope" : "Scope executed";
    const executed = attempt.getByText(executedLabel, { exact: true }).locator("..").locator("dd");
    await expect(requested).toHaveText(command.scopeRequested);
    await expect(executed).toHaveText(command.scopeExecuted);
    const exits = attempt.getByRole("list", { name: "Recorded exits" }).getByRole("listitem");
    expect(Array.isArray(command.outcomes)).toBe(true);
    await expect(exits).toHaveCount(command.outcomes.length);
    for (const [position, outcome] of command.outcomes.entries()) {
      const result = exits.nth(position);
      await expect(result).toContainText(new RegExp("^Position " + outcome.index + " · "));
      await expect(result).toContainText(new RegExp(" · exit " + outcome.exitCode + " · "));
      if (outcome.timedOut) await expect(result).toContainText("Timed out");
    }
    if (command.attemptKind !== "executed") await expect(attempt.getByText("Zero observed commands.")).toBeVisible();
  }
  await expect(panel.getByText(/test cases run|all tests passed/i)).toHaveCount(0);
  return { panel, trigger };
}

test("qualifies the authenticated static Changes experience", async ({ page }) => {
  // This flow starts after the dashboard's unrelated first-run tour.
  await page.addInitScript(() => window.localStorage.setItem("ledgerful:onboarding-completed", "true"));
  const observed = watchBrowser(page);
  const direct = await page.goto("/changes");
  await documentPolicy(direct, "changes-direct");
  await authenticate(page);
  await expect(page.getByRole("heading", { name: "Changes", exact: true })).toBeVisible();

  if (!fixture) {
    const triggers = page.getByRole("button", { name: "View evidence", exact: true });
    await expect(triggers.first()).toBeVisible();
    await triggers.first().click();
    await expect(page.getByText("This daemon does not provide change evidence.")).toBeVisible();
    expect(observed.evidence).toHaveLength(0);
    expect(observed.errors).toEqual([]);
    expect(observed.remote).toEqual([]);
    await page.screenshot({ path: test.info().outputPath("legacy-changes.png") });
    return;
  }

  const summary = await fixtureSummary();
  if (mode === "incomparable") {
    const row = page.getByRole("row").filter({ hasText: summary });
    await row.getByRole("button", { name: "View evidence", exact: true }).click();
    const panel = page.getByRole("region", { name: "Change evidence" });
    await panel.getByRole("combobox", { name: "Baseline" }).selectOption(fixture.baselineName);
    await expect(panel.getByText(fixture.baselineDigest, { exact: true })).toBeVisible();
    await expect(panel.getByText("Baseline and current inputs cannot be compared.")).toBeVisible();
    await expect(panel.getByText("The current index input is incomplete.")).toBeVisible();
    await expect(panel.getByRole("list", { name: "Resolved call relationships" })).toHaveCount(0);
    await expect(panel.getByText("Unchanged resolved relationships")).toHaveCount(0);
    expect(observed.evidence.some((url) => url.searchParams.get("baselineDigest") === fixture.baselineDigest)).toBe(true);
    expect(observed.errors).toEqual([]);
    expect(observed.remote).toEqual([]);
    await panel.getByRole("heading", { name: "Dependency changes" }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: test.info().outputPath("incomparable-changes.png") });
    return;
  }

  observed.watchEvidence(true);
  const checks = await assertPair(page, summary, fixture);
  await expect(checks.panel.getByText("Zero observed commands.")).toBeVisible();
  await expect(checks.panel.getByText("Evidence is partial.", { exact: true })).toBeVisible();
  await expect(checks.panel.getByText(/Recorded failure · exit \d+/).first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath(mode + "-desktop.png") });

  const linked = fixture.commands.find((command) => command.txId);
  expect(linked?.txId).toBeTruthy();
  const attempt = checks.panel.getByRole("article").filter({ hasText: linked!.attemptId });
  const url = "/ledger/detail?txId=" + linked!.txId;
  const ledgerLink = attempt.getByRole("link", { name: "Ledger transaction", exact: true });
  await expect(ledgerLink).toHaveAttribute("href", url);
  await ledgerLink.click();
  await expect(page.getByRole("heading", { name: "Transaction " + linked!.txId, exact: true })).toBeVisible();
  expect(new URL(page.url()).searchParams.get("txId")).toBe(linked!.txId);
  observed.watchEvidence(false);

  const dashboard = await page.goto("/dashboard");
  await documentPolicy(dashboard, "dashboard-entry");
  await authenticate(page);
  await page.getByRole("link", { name: "Changes", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Changes", exact: true })).toBeVisible();
  const reload = await page.reload();
  await documentPolicy(reload, "changes-reload");
  await authenticate(page);
  await page.setViewportSize({ width: 375, height: 820 });
  await expect(page.getByRole("button", { name: "View evidence", exact: true }).first()).toBeVisible();
  observed.watchEvidence(true);
  const mobile = await assertPair(page, summary, fixture);
  const box = await mobile.panel.boundingBox();
  expect(box).toBeTruthy();
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  await mobile.panel.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath(mode + "-mobile.png") });
  await mobile.panel.getByRole("button", { name: "Close evidence" }).click();
  await expect(mobile.trigger).toBeFocused();
  await expect(mobile.trigger).toHaveAttribute("aria-expanded", "false");
  await expect(mobile.panel).toHaveCount(0);
  observed.watchEvidence(false);

  expect(observed.errors).toEqual([]);
  expect(observed.remote).toEqual([]);
  expect(observed.evidence.length).toBeGreaterThan(0);
  for (const url of observed.evidence) {
    expect(url.origin).toBe(origin);
    expect([...url.searchParams.keys()].every((key) => [
      "repoScope", "head", "base", "baselineName", "baselineDigest",
    ].includes(key))).toBe(true);
    expect(url.searchParams.get("head")).toBe(fixture.head);
    expect(url.searchParams.get("base")).toBe(fixture.base);
  }
  const requests = await Promise.all(observed.requests);
  const allowed = new Set(["/api/projects", "/api/changes", "/api/events", "/api/status", "/api/session",
    "/api/change-evidence", "/api/ledger/" + linked!.txId]);
  expect(requests.some((request) => request.path === "/api/change-evidence")).toBe(true);
  expect(requests.some((request) => request.path === "/api/ledger/" + linked!.txId)).toBe(true);
  for (const request of requests) {
    expect(allowed.has(request.path), request.path).toBe(true);
    expect(request.method).toBe("GET");
    expect(request.signedIn).toBe(true);
  }
  saveReceipt("authenticated-interaction-paths", requests);
  const unauthenticated = await fetch(observed.evidence[0]);
  expect([401, 403]).toContain(unauthenticated.status);
});
