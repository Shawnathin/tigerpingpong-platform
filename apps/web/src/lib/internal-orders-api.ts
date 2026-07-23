import "server-only";

const DEFAULT_API_BASE_URL = "http://localhost:3001";

export interface InternalOrderListItem {
  publicReference: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  currency: string;
  listSubtotalCents: number;
  discountCents: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  pricingRuleVersion: string | null;
  taxAmountCents: number | null;
  itemCount: number;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  stripeAmountTotalCents: number | null;
  stripeAmountTaxCents: number | null;
  stripeAutomaticTaxStatus: string | null;
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
  listUnitPriceCents: number;
  discountUnitCents: number;
  unitPriceCents: number;
  quantity: number;
  listLineTotalCents: number;
  discountCents: number;
  lineTotalCents: number;
  promotionKey: string | null;
  createdAt: string | null;
}

export interface InternalOrderShipment {
  carrier: string | null;
  internalNote: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
}

export interface InternalOrderShipmentInput {
  carrier: string;
  internalNote: string;
  shippedDate: string;
  trackingNumber: string;
  trackingUrl: string;
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
  listSubtotalCents: number;
  discountCents: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  pricingRuleVersion: string | null;
  taxAmountCents: number | null;
  shippingRule: string;
  checkoutSource: string;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  stripeCustomerId: string | null;
  stripeAmountTotalCents: number | null;
  stripeAmountTaxCents: number | null;
  stripeAutomaticTaxStatus: string | null;
  shipment: InternalOrderShipment;
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

export async function updateInternalOrderShipment(
  publicReference: string,
  input: InternalOrderShipmentInput
): Promise<InternalOrderDetail> {
  const response = await fetchInternalOrders<{ order: InternalOrderDetail }>(
    `/internal/orders/${encodeURIComponent(publicReference)}/shipment`,
    {
      body: input,
      method: "PATCH"
    }
  );

  if (!response) {
    throw new InternalOrdersApiError("Internal orders API returned no response.", null, "");
  }

  return response.order;
}

async function fetchInternalOrders<TResponse>(
  path: string,
  options: {
    allowNotFound?: boolean;
    body?: unknown;
    method?: "GET" | "PATCH" | "POST";
  } = {}
): Promise<TResponse | null> {
  const url = `${getInternalOrdersApiBaseUrl()}${path}`;
  const apiToken = readInternalOrdersApiToken(url);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-internal-orders-token": apiToken
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal orders API request failed.";
    throw new InternalOrdersApiError(message, null, url);
  }

  if (response.status === 404 && options.allowNotFound) {
    return null;
  }

  if (!response.ok) {
    const message = await readInternalOrdersErrorMessage(response);

    throw new InternalOrdersApiError(
      message ?? `Internal orders API returned HTTP ${response.status}.`,
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

async function readInternalOrdersErrorMessage(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { message?: unknown };

    if (typeof body.message === "string" && body.message.trim()) {
      return body.message.trim();
    }
  } catch {
    return null;
  }

  return null;
}

function readInternalOrdersApiToken(url: string): string {
  const token = process.env.INTERNAL_ORDERS_API_TOKEN?.trim();

  if (!token) {
    throw new InternalOrdersApiError("Internal orders API token is not configured.", null, url);
  }

  return token;
}
