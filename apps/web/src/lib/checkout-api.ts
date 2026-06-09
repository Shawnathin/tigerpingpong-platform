const DEFAULT_API_BASE_URL = "http://localhost:3001";

export interface CheckoutSessionItemInput {
  productSlug: string;
  quantity: number;
}

export interface CreateCheckoutSessionInput {
  items: CheckoutSessionItemInput[];
}

export interface CheckoutSessionSummary {
  checkoutSessionId: string;
  checkoutUrl: string;
  currency: string;
  orderId: string;
  publicReference: string;
  shippingCents: number;
  shippingLabel: string;
  subtotalCents: number;
  totalCents: number;
}

export class CheckoutApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string
  ) {
    super(message);
    this.name = "CheckoutApiError";
  }
}

export function getCheckoutApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CheckoutSessionSummary> {
  const url = `${getCheckoutApiBaseUrl()}/checkout/sessions`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout API request failed.";
    throw new CheckoutApiError(message, null, url);
  }

  if (!response.ok) {
    throw new CheckoutApiError(`Checkout API returned HTTP ${response.status}.`, response.status, url);
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new CheckoutApiError("Checkout API returned an invalid response.", response.status, url);
  }

  return parseCheckoutSessionSummary(body, url);
}

function parseCheckoutSessionSummary(value: unknown, url: string): CheckoutSessionSummary {
  if (!isRecord(value)) {
    throw new CheckoutApiError("Checkout API returned an invalid response.", null, url);
  }

  const summary = {
    checkoutSessionId: getString(value, "checkoutSessionId"),
    checkoutUrl: getString(value, "checkoutUrl"),
    currency: getString(value, "currency"),
    orderId: getString(value, "orderId"),
    publicReference: getString(value, "publicReference"),
    shippingCents: getNumber(value, "shippingCents"),
    shippingLabel: getString(value, "shippingLabel"),
    subtotalCents: getNumber(value, "subtotalCents"),
    totalCents: getNumber(value, "totalCents")
  };

  if (
    !summary.checkoutSessionId ||
    !summary.checkoutUrl ||
    !summary.currency ||
    !summary.orderId ||
    !summary.publicReference ||
    !summary.shippingLabel ||
    summary.shippingCents === null ||
    summary.subtotalCents === null ||
    summary.totalCents === null
  ) {
    throw new CheckoutApiError("Checkout API returned an invalid response.", null, url);
  }

  return {
    checkoutSessionId: summary.checkoutSessionId,
    checkoutUrl: summary.checkoutUrl,
    currency: summary.currency,
    orderId: summary.orderId,
    publicReference: summary.publicReference,
    shippingCents: summary.shippingCents,
    shippingLabel: summary.shippingLabel,
    subtotalCents: summary.subtotalCents,
    totalCents: summary.totalCents
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function getNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
