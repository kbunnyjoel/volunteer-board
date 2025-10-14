import { defineConfig, devices } from "@playwright/test";

const baseURL =
  process.env.E2E_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [
        ["github"],
        [
          "html",
          {
            outputFolder: "artifacts/playwright-report",
            open: "never"
          }
        ]
      ]
    : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: process.env.CI ? "retain-on-failure" : "off",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
