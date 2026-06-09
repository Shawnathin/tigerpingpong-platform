export interface ApiConfig {
  corsOrigins: string[];
  port: number;
}

export interface CheckoutConfig {
  appEnv: string;
  cancelUrl: string;
  stripeSecretKey: string;
  successUrl: string;
}

export interface StripeWebhookConfig {
  stripeWebhookSecret: string;
}

function readCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const values = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.length > 0 ? values : fallback;
}

function readPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    corsOrigins: readCsv(env.CORS_ORIGIN, ["http://localhost:3000"]),
    port: readPort(env.PORT, 3001)
  };
}

function readRequiredString(value: string | undefined, name: string): string {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(`${name} is required.`);
  }

  return normalized;
}

export function getCheckoutConfig(env: NodeJS.ProcessEnv = process.env): CheckoutConfig {
  return {
    appEnv: env.APP_ENV?.trim() || env.NODE_ENV?.trim() || "development",
    cancelUrl: readRequiredString(env.CHECKOUT_CANCEL_URL, "CHECKOUT_CANCEL_URL"),
    stripeSecretKey: readRequiredString(env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY"),
    successUrl: readRequiredString(env.CHECKOUT_SUCCESS_URL, "CHECKOUT_SUCCESS_URL")
  };
}

export function getStripeWebhookConfig(
  env: NodeJS.ProcessEnv = process.env
): StripeWebhookConfig {
  return {
    stripeWebhookSecret: readRequiredString(
      env.STRIPE_WEBHOOK_SECRET,
      "STRIPE_WEBHOOK_SECRET"
    )
  };
}
