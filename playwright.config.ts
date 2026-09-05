import { apiPort, mockPort, mockOrigin, webOrigin, webPort } from "./tests/e2e-endpoints";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  workers: 2,
  use: {
    baseURL: webOrigin,
    trace: "retain-on-failure"
  },
  webServer: [
    {
      command: `MOCK_CATALOG_PORT=${mockPort} MOCK_CATALOG_ORIGIN=${webOrigin} node scripts/testing/mock-catalog-api.mjs`,
      port: mockPort,
      reuseExistingServer: false,
      timeout: 30_000
    },
    {
      command: `pnpm --filter @tigerpingpong/api build && PORT=${apiPort} CORS_ORIGIN=${webOrigin} DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/not_used INTERNAL_ORDERS_API_TOKEN=local-test-token STRIPE_WEBHOOK_SECRET=whsec_local_test STRIPE_EXPECTED_LIVEMODE=false pnpm --filter @tigerpingpong/api start`,
      port: apiPort,
      reuseExistingServer: false,
      timeout: 120_000
    },
    {
      command: `NEXT_PUBLIC_API_BASE_URL=${mockOrigin} NEXT_PUBLIC_SITE_URL=https://tigerpingpong.ca INTERNAL_ORDERS_API_TOKEN=local-test-token INTERNAL_ORDERS_BASIC_AUTH_USER=local-admin INTERNAL_ORDERS_BASIC_AUTH_PASSWORD=local-password pnpm --filter @tigerpingpong/web exec next dev -p ${webPort}`,
      port: webPort,
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
