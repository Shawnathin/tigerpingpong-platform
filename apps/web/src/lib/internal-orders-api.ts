const DEFAULT_API_BASE_URL = "http://localhost:3001";

export interface InternalOrderListItem {
  publicReference: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  itemCount: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

export interface InternalOrdersListResponse {
  orders: InternalOrderListItem[];
  status: string;
  limit: number;
}

export interface InternalShippingAddress {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  postalCode?: string;
  state?: string;
}

export interface InternalOrderItem {
  productKey: string;
  productSlug: string;
  variantKey: string | null;
  sku: string | null;
  name: string;
  currency: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  createdAt: string | null;
}

export interface InternalOrderDetail {
  publicReference: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: InternalShippingAddress | null;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingRule: string;
  checkoutSource: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  items: InternalOrderItem[];
}

export class InternalOrdersApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string
  ) {
    super(message);
    this.name = "InternalOrdersApiError";
  }
}

interface InternalOrdersListOptions {
  limit?: number;
  status?: string;
}

export function getInternalOrdersApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export async function getInternalOrders(
  options: InternalOrdersListOptions = {}
): Promise<InternalOrdersListResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("status", options.status ?? "paid");
  searchParams.set("limit", String(options.limit ?? 50));

  const response = await fetchInternalOrders<InternalOrdersListResponse>(
    `/internal/orders?${searchParams}`
  );

  if (!response) {
    throw new InternalOrdersApiError("Internal orders API returned no response.", null, "");
  }

  return response;
}

export async function getInternalOrder(
  publicReference: string
): Promise<InternalOrderDetail | null> {
  const response = await fetchInternalOrders<{ order: InternalOrderDetail }>(
    `/internal/orders/${encodeURIComponent(publicReference)}`,
    {
      allowNotFound: true
    }
  );

  return response?.order ?? null;
}

async function fetchInternalOrders<TResponse>(
  path: string,
  options: { allowNotFound?: boolean } = {}
): Promise<TResponse | null> {
  const url = `${getInternalOrdersApiBaseUrl()}${path}`;
  const apiToken = readInternalOrdersApiToken(url);

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "x-internal-orders-token": apiToken
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal orders API request failed.";
    throw new InternalOrdersApiError(message, null, url);
  }

  if (response.status === 404 && options.allowNotFound) {
    return null;
  }

  if (!response.ok) {
    throw new InternalOrdersApiError(
      `Internal orders API returned HTTP ${response.status}.`,
      response.status,
      url
    );
  }

  try {
    return (await response.json()) as TResponse;
  } catch {
    throw new InternalOrdersApiError(
      "Internal orders API returned an invalid response.",
      response.status,
      url
    );
  }
}

function readInternalOrdersApiToken(url: string): string {
  const token = process.env.INTERNAL_ORDERS_API_TOKEN?.trim();

  if (!token) {
    throw new InternalOrdersApiError("Internal orders API token is not configured.", null, url);
  }

  return token;
}
