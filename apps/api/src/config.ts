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
  expectedLivemode?: boolean;
  stripeWebhookSecret: string;
}

export interface InternalOrdersApiConfig {
  apiToken: string;
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

function readOptionalBoolean(value: string | undefined, name: string): boolean | undefined {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (normalized === "true" || normalized === "1") {
    return true;
  }

  if (normalized === "false" || normalized === "0") {
    return false;
  }

  throw new Error(`${name} must be true or false when set.`);
}

export function getCheckoutConfig(env: NodeJS.ProcessEnv = process.env): CheckoutConfig {
  return {
    appEnv: env.APP_ENV?.trim() || env.NODE_ENV?.trim() || "development",
    cancelUrl: readRequiredString(env.CHECKOUT_CANCEL_URL, "CHECKOUT_CANCEL_URL"),
    stripeSecretKey: readRequiredString(env.STRIPE_SECRET_KEY, "STRIPE_SECRET_KEY"),
    successUrl: readRequiredString(env.CHECKOUT_SUCCESS_URL, "CHECKOUT_SUCCESS_URL")
  };
}

export function getStripeWebhookConfig(env: NodeJS.ProcessEnv = process.env): StripeWebhookConfig {
  return {
    expectedLivemode: readOptionalBoolean(env.STRIPE_EXPECTED_LIVEMODE, "STRIPE_EXPECTED_LIVEMODE"),
    stripeWebhookSecret: readRequiredString(env.STRIPE_WEBHOOK_SECRET, "STRIPE_WEBHOOK_SECRET")
  };
}

export function getInternalOrdersApiConfig(
  env: NodeJS.ProcessEnv = process.env
): InternalOrdersApiConfig {
  return {
    apiToken: readRequiredString(env.INTERNAL_ORDERS_API_TOKEN, "INTERNAL_ORDERS_API_TOKEN")
  };
}
