// End-to-end tests of the built site (`pnpm build` first), in Chromium only.
// Install the browser with `pnpm exec playwright install chromium`.
import { defineConfig, devices } from "@playwright/test";

const port = 4321;

export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${port}/nif-dni-nie-cif-validation/`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // --ignore-lock keeps the server in the foreground: Astro moves it to
    // the background when it detects a coding agent, and Playwright would
    // then see it exit.
    command: `pnpm exec astro preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}/nif-dni-nie-cif-validation/`,
    reuseExistingServer: !process.env.CI,
  },
});
