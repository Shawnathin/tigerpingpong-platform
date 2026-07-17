import { describe, expect, it } from "vitest";

import { getCheckoutConfig, getStripeWebhookConfig } from "../../apps/api/src/config";
import { assertAdminApiAuthorized } from "../../apps/api/src/admin/admin-auth";

describe("server configuration", () => {
  it("requires checkout secrets and return URLs", () => {
    expect(() => getCheckoutConfig({})).toThrow("CHECKOUT_CANCEL_URL is required");
  });

  it("parses explicit Stripe safety flags", () => {
    expect(
      getCheckoutConfig({
        CHECKOUT_CANCEL_URL: "https://example.com/checkout/cancel",
        CHECKOUT_SUCCESS_URL:
          "https://example.com/checkout/success?session_id={CHECKOUT_SESSION_ID}",
        STRIPE_SECRET_KEY: "sk_test_redacted",
        STRIPE_TAX_ENABLED: "true"
      }).stripeTaxEnabled
    ).toBe(true);

    expect(
      getStripeWebhookConfig({
        STRIPE_EXPECTED_LIVEMODE: "false",
        STRIPE_TAX_ENABLED: "true",
        STRIPE_WEBHOOK_SECRET: "whsec_redacted"
      })
    ).toMatchObject({ expectedLivemode: false, stripeTaxEnabled: true });
  });

  it("fails staff API authorization closed", () => {
    const previousToken = process.env.INTERNAL_ORDERS_API_TOKEN;
    process.env.INTERNAL_ORDERS_API_TOKEN = "expected-token";

    try {
      expect(() => assertAdminApiAuthorized(undefined)).toThrow("Unauthorized");
      expect(() => assertAdminApiAuthorized("wrong-token")).toThrow("Unauthorized");
      expect(() => assertAdminApiAuthorized("expected-token")).not.toThrow();
    } finally {
      if (previousToken === undefined) {
        delete process.env.INTERNAL_ORDERS_API_TOKEN;
      } else {
        process.env.INTERNAL_ORDERS_API_TOKEN = previousToken;
      }
    }
  });
});
