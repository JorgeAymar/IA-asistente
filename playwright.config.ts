import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./__tests__/e2e",
  fullyParallel: false,
  retries: 1,
  reporter: [["html", { open: "always" }], ["list"]],
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    locale: "es-ES",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
