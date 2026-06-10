const DEFAULT_API_BASE_URL = "http://localhost:3001";

export type CheckoutSessionPublicStatus =
  | "canceled"
  | "checkout_failed"
  | "checkout_pending"
  | "expired"
  | "manual_review"
  | "not_found"
  | "paid";

export interface CheckoutSessionStatus {
  found: boolean;
  status: CheckoutSessionPublicStatus;
  publicReference?: string;
  currency?: string;
  subtotalCents?: number;
  shippingCents?: number;
  totalCents?: number;
  customerEmail?: string;
  paidAt?: string;
  createdAt?: string;
  message?: string;
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

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.trim();
  } catch {
    return "";
  }
}

async function fetchCheckout<TResponse>(path: string): Promise<TResponse> {
  const url = `${getCheckoutApiBaseUrl()}${path}`;

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout API request failed.";
    throw new CheckoutApiError(message, null, url);
  }

  if (!response.ok) {
    const body = await readErrorBody(response);
    const detail = body ? `: ${body}` : "";

    throw new CheckoutApiError(
      `Checkout API returned HTTP ${response.status}${detail}`,
      response.status,
      url
    );
  }

  return response.json() as Promise<TResponse>;
}

export function getCheckoutSessionStatus(sessionId: string): Promise<CheckoutSessionStatus> {
  return fetchCheckout<CheckoutSessionStatus>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}/status`
  );
}
