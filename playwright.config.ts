import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: "node scripts/testing/mock-catalog-api.mjs",
      port: 3101,
      reuseExistingServer: false,
      timeout: 30_000
    },
    {
      command:
        "pnpm --filter @tigerpingpong/api build && PORT=3102 CORS_ORIGIN=http://127.0.0.1:3100 DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/not_used INTERNAL_ORDERS_API_TOKEN=local-test-token STRIPE_WEBHOOK_SECRET=whsec_local_test STRIPE_EXPECTED_LIVEMODE=false pnpm --filter @tigerpingpong/api start",
      port: 3102,
      reuseExistingServer: false,
      timeout: 30_000
    },
    {
      command:
        "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3101 NEXT_PUBLIC_SITE_URL=https://tigerpingpong.ca INTERNAL_ORDERS_API_TOKEN=local-test-token INTERNAL_ORDERS_BASIC_AUTH_USER=local-admin INTERNAL_ORDERS_BASIC_AUTH_PASSWORD=local-password pnpm --filter @tigerpingpong/web exec next dev -p 3100",
      port: 3100,
      reuseExistingServer: false,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
