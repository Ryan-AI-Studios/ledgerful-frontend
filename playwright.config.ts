import { defineConfig } from "@playwright/test";

const mode = process.env.LEDGERFUL_E2E_MODE;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./output/paired-evidence/" + (
    mode === "current" || mode === "legacy" || mode === "embedded" || mode === "incomparable"
      ? mode : "unconfigured"
  ),
  reporter: "line",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:52001",
    browserName: "chromium",
    actionTimeout: 10_000,
    trace: "off",
    video: "off",
    screenshot: "off",
  },
});
