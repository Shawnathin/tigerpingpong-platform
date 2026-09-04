import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, expect, it } from "vitest";

const validatorPath = path.resolve("scripts/launch/validate-production-env.mjs");
const safeApiEnv = {
  ...process.env,
  APP_ENV: "production",
  CHECKOUT_CANCEL_URL: "https://tigerpingpong.ca/checkout/cancel",
  CHECKOUT_SUCCESS_URL:
    "https://tigerpingpong.ca/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  CORS_ORIGIN: "https://tigerpingpong.ca,https://tigerpingpong-web.onrender.com",
  DATABASE_URL: "postgresql://example.invalid/tigerpingpong",
  INTERNAL_ORDERS_API_TOKEN: "redacted-internal-token",
  EMAIL_FROM: "Tiger PingPong <orders@example.invalid>",
  PORT: "3001",
  RESEND_API_KEY: "re_redacted",
  ORDER_NOTIFICATION_EMAIL: "orders@example.invalid",
  STRIPE_EXPECTED_LIVEMODE: "false",
  STRIPE_SECRET_KEY: "sk_test_redacted",
  STRIPE_TAX_ENABLED: "true",
  STRIPE_WEBHOOK_SECRET: "whsec_redacted"
};

function runValidator(env: NodeJS.ProcessEnv, args: string[]) {
  return spawnSync(process.execPath, [validatorPath, ...args], {
    encoding: "utf8",
    env
  });
}

describe("production environment validator", () => {
  it("passes matching test mode and final origin without printing values", () => {
    const result = runValidator(safeApiEnv, [
      "--surface",
      "api",
      "--expected-mode",
      "test",
      "--expected-origin",
      "https://tigerpingpong.ca"
    ]);

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain("sk_test_redacted");
    expect(result.stdout).not.toContain("redacted-internal-token");
    expect(result.stdout).not.toContain("re_redacted");
  });

  it("fails invalid database URLs and mode mismatches", () => {
    const badDatabase = runValidator({ ...safeApiEnv, DATABASE_URL: "https://example.com/db" }, [
      "--surface",
      "api"
    ]);
    const badMode = runValidator(safeApiEnv, ["--surface", "api", "--expected-mode", "live"]);

    expect(badDatabase.status).toBe(1);
    expect(badDatabase.stdout).toContain("must be a valid PostgreSQL URL");
    expect(badMode.status).toBe(1);
    expect(badMode.stdout).toContain("does not start with expected prefix sk_live_");
  });

  it("fails when an expected origin is absent", () => {
    const result = runValidator(safeApiEnv, [
      "--surface",
      "api",
      "--expected-origin",
      "https://www.tigerpingpong.ca"
    ]);

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("does not include --expected-origin");
  });

  it("requires a valid staff order notification recipient", () => {
    const missing = runValidator({ ...safeApiEnv, ORDER_NOTIFICATION_EMAIL: "" }, [
      "--surface",
      "api"
    ]);
    const invalid = runValidator({ ...safeApiEnv, ORDER_NOTIFICATION_EMAIL: "not-an-email" }, [
      "--surface",
      "api"
    ]);

    expect(missing.status).toBe(1);
    expect(missing.stdout).toContain("ORDER_NOTIFICATION_EMAIL");
    expect(invalid.status).toBe(1);
    expect(invalid.stdout).toContain("must be a valid email address");
  });

  it("requires both checkout return URLs to use the expected origin", () => {
    const result = runValidator(
      {
        ...safeApiEnv,
        CHECKOUT_CANCEL_URL: "https://staging.example.invalid/checkout/cancel"
      },
      ["--surface", "api", "--expected-origin", "https://tigerpingpong.ca"]
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("origin does not match --expected-origin");
  });
});
