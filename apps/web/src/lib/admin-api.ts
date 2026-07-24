import "server-only";

const DEFAULT_API_BASE_URL = "http://localhost:3001";
const ADMIN_API_TOKEN_HEADER = "x-internal-orders-token";

export type AdminSectionStatus = "not_configured" | "ok" | "unavailable" | string;

export interface AdminStripeReferences {
  amountTaxCents: number | null;
  amountTotalCents: number | null;
  automaticTaxStatus: string | null;
  checkoutSessionId: string | null;
  customerId: string | null;
  paymentIntentId: string | null;
}

export interface AdminOrderListItem {
  id: string;
  orderReference: string;
  customer: {
    email: string | null;
    name: string | null;
    phone: string | null;
  };
  currency: string;
  listSubtotalCents: number;
  discountCents: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  pricingRuleVersion: string | null;
  taxAmountCents: number | null;
  orderStatus: string;
  paymentStatus: string;
  itemCount: number;
  stripe: AdminStripeReferences;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdminOrdersResponse {
  count: number;
  items: AdminOrderListItem[];
  status: string;
}

export interface AdminProductListItem {
  id: string;
  key: string;
  slug: string;
  name: string;
  sku: string | null;
  category: {
    id: string;
    key: string;
    name: string;
    slug: string;
  };
  type: string;
  priceCents: number | null;
  currency: string;
  status: string;
  visible: boolean;
  v1CheckoutScope: boolean;
  purchaseMode: string;
  checkoutEligible: boolean;
  checkoutEligibilityReasons: string[];
  imageStatus: {
    primaryImageUrl: string | null;
    status: string;
  };
  primaryImageUrl: string | null;
  variantCount: number;
  mediaCount: number;
}

export interface AdminProductsResponse {
  count: number;
  items: AdminProductListItem[];
}

export interface AdminProductVariant {
  id: string;
  key: string;
  sku: string | null;
  name: string | null;
  priceCents: number | null;
  currency: string;
  purchaseModeOverride: string | null;
  isActive: boolean;
  options: Array<{
    optionName: string;
    optionDisplayName: string | null;
    value: string;
    label: string | null;
  }>;
}

export interface AdminProductDetail extends AdminProductListItem {
  updatedAt: string;
  brand: { key: string; name: string; slug: string };
  family: {
    id: string;
    key: string;
    slug: string;
    name: string;
    isPublic: boolean;
    isActive: boolean;
  };
  variants: AdminProductVariant[];
}

export interface AdminProductResponse {
  product: AdminProductDetail;
}

export interface AdminProductUpdateInput {
  availableForSale: boolean;
  expectedUpdatedAt: string;
  name: string;
  priceCents: number | null;
  variants: Array<{ id: string; isActive: boolean; priceCents: number | null }>;
}

export interface AdminProductMediaProduct {
  id: string;
  key: string;
  slug: string;
  name: string;
  sku: string | null;
}

export interface AdminProductMediaItem {
  id: string;
  mediaKey: string;
  productId: string;
  variantId: string | null;
  role: string;
  cloudinaryPublicId: string | null;
  cloudinarySecureUrl: string | null;
  cloudinaryResourceType: string | null;
  cloudinaryFormat: string | null;
  cloudinaryVersion: string | null;
  sourceUrl: string | null;
  sourceProvider: string;
  altText: string | null;
  title: string | null;
  caption: string | null;
  sortOrder: number;
  isPrimary: boolean;
  isPublic: boolean;
  isActive: boolean;
  reviewStatus: string;
  previewUrl: string | null;
  updatedAt: string | null;
}

export interface AdminProductMediaResponse {
  product: AdminProductMediaProduct;
  media: AdminProductMediaItem[];
}

export interface AdminProductMediaInput {
  altText?: string | null;
  caption?: string | null;
  cloudinaryPublicId?: string | null;
  cloudinarySecureUrl?: string | null;
  isPrimary?: boolean;
  role?: string;
  sortOrder?: number;
  title?: string | null;
}

export interface AdminCustomerSummary {
  currency: string;
  customerName: string | null;
  customerPhone: string | null;
  email: string;
  lastOrderDate: string | null;
  orderCount: number;
  paidOrderCount: number;
  totalSpentCents: number;
}

export interface AdminCustomersResponse {
  count: number;
  derivation: string;
  items: AdminCustomerSummary[];
}

export interface AdminWebhookEvent {
  createdAt: string | null;
  processedAt: string | null;
  stripeEventId: string;
  type: string;
}

export interface AdminWebhookHealth {
  eventStatus: string;
  items?: AdminWebhookEvent[];
  latestProcessedWebhookEvent: AdminWebhookEvent | null;
  message?: string;
  recentWebhookEvents: AdminWebhookEvent[];
  status: AdminSectionStatus;
  totalWebhookEventsCount: number;
  unprocessedWebhookEventsCount: number;
  webhookEventsTracked: boolean;
}

export interface AdminDashboardSummary {
  orders: {
    failedCheckoutCount: number;
    failedCount?: number;
    message?: string;
    paidCount: number;
    pendingCheckoutCount: number;
    pendingCount?: number;
    recent: AdminOrderListItem[];
    status: AdminSectionStatus;
  };
  products: {
    activeCount: number;
    checkoutScopeCount: number;
    count?: number;
    message?: string;
    status: AdminSectionStatus;
    totalCount: number;
    variantCount: number;
    warnings: {
      missingCheckoutPriceCount: number;
      missingPublicImageCount: number;
    };
  };
  inventory: AdminInventoryResponse;
  auditLog?: AdminAuditLogResponse;
  webhookHealth?: AdminWebhookHealth;
  payments: {
    latestProcessedWebhookEvent: AdminWebhookEvent | null;
    recentWebhookEvents: AdminWebhookEvent[];
    status: string;
    totalWebhookEventsCount: number;
    unprocessedWebhookEventsCount: number;
    webhookEventsTracked: boolean;
  };
}

export interface AdminSettings {
  checkoutEnabled: boolean;
  currency: string;
  flatRateShippingCents: number;
  freeShippingException?: {
    productSlug: string;
    requiresExclusiveCart: boolean;
    variantKey: string;
  };
  freeShippingThresholdCents: number;
  storeName: string;
  stripeMode: string;
  supportEmail: string;
  supportPhone: string;
}

export interface AdminSettingsResponse {
  secretsExposed: false;
  settings: AdminSettings;
}

export interface AdminInventoryResponse {
  futureSmallestNextStep?: string;
  items: unknown[];
  message: string;
  status: AdminSectionStatus;
  warnings?: string[];
}

export interface AdminAuditLogResponse {
  items: unknown[];
  message: string;
  status: AdminSectionStatus;
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly url: string,
    readonly responseMessage: string | null = null
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

interface AdminListOptions {
  limit?: number;
  status?: string;
}

export function getAdminApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  return fetchAdmin<AdminDashboardSummary>("/api/admin/dashboard/summary");
}

export function getAdminOrders(options: AdminListOptions = {}): Promise<AdminOrdersResponse> {
  const searchParams = new URLSearchParams();

  if (options.status) {
    searchParams.set("status", options.status);
  }

  searchParams.set("limit", String(options.limit ?? 100));

  return fetchAdmin<AdminOrdersResponse>(`/api/admin/orders?${searchParams}`);
}

export function getAdminProducts(options: AdminListOptions = {}): Promise<AdminProductsResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set("limit", String(options.limit ?? 100));

  return fetchAdmin<AdminProductsResponse>(`/api/admin/products?${searchParams}`);
}

export function getAdminProduct(productId: string): Promise<AdminProductResponse> {
  return fetchAdmin<AdminProductResponse>(`/api/admin/products/${encodeURIComponent(productId)}`);
}

export function updateAdminProduct(
  productId: string,
  input: AdminProductUpdateInput
): Promise<AdminProductResponse> {
  return fetchAdmin<AdminProductResponse>(`/api/admin/products/${encodeURIComponent(productId)}`, {
    body: input,
    method: "PATCH"
  });
}

export function getAdminProductMedia(productId: string): Promise<AdminProductMediaResponse> {
  return fetchAdmin<AdminProductMediaResponse>(`/api/admin/products/${productId}/media`);
}

export function addAdminProductMedia(
  productId: string,
  input: AdminProductMediaInput
): Promise<AdminProductMediaResponse> {
  return fetchAdmin<AdminProductMediaResponse>(`/api/admin/products/${productId}/media`, {
    body: input,
    method: "POST"
  });
}

export function updateAdminProductMedia(
  productId: string,
  mediaId: string,
  input: AdminProductMediaInput
): Promise<AdminProductMediaResponse> {
  return fetchAdmin<AdminProductMediaResponse>(
    `/api/admin/products/${productId}/media/${mediaId}`,
    {
      body: input,
      method: "PATCH"
    }
  );
}

export function unassignAdminProductMedia(
  productId: string,
  mediaId: string
): Promise<AdminProductMediaResponse> {
  return fetchAdmin<AdminProductMediaResponse>(
    `/api/admin/products/${productId}/media/${mediaId}`,
    {
      method: "DELETE"
    }
  );
}

export function getAdminCustomers(): Promise<AdminCustomersResponse> {
  return fetchAdmin<AdminCustomersResponse>("/api/admin/customers");
}

export function getAdminSettings(): Promise<AdminSettingsResponse> {
  return fetchAdmin<AdminSettingsResponse>("/api/admin/settings");
}

export function getAdminInventory(): Promise<AdminInventoryResponse> {
  return fetchAdmin<AdminInventoryResponse>("/api/admin/inventory");
}

export function getAdminAuditLog(): Promise<AdminAuditLogResponse> {
  return fetchAdmin<AdminAuditLogResponse>("/api/admin/audit-log");
}

interface FetchAdminOptions {
  body?: unknown;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
}

async function fetchAdmin<TResponse>(
  path: string,
  options: FetchAdminOptions = {}
): Promise<TResponse> {
  const url = `${getAdminApiBaseUrl()}${path}`;
  const apiToken = readAdminApiToken(url);
  const headers: Record<string, string> = {
    Accept: "application/json",
    [ADMIN_API_TOKEN_HEADER]: apiToken
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
    const message = error instanceof Error ? error.message : "Admin API request failed.";
    throw new AdminApiError(message, null, url);
  }

  if (!response.ok) {
    const responseMessage = await readAdminErrorMessage(response);

    throw new AdminApiError(
      responseMessage ?? `Admin API returned HTTP ${response.status}.`,
      response.status,
      url,
      responseMessage
    );
  }

  try {
    return (await response.json()) as TResponse;
  } catch {
    throw new AdminApiError("Admin API returned an invalid response.", response.status, url);
  }
}

async function readAdminErrorMessage(response: Response): Promise<string | null> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return null;
  }

  if (!isRecord(payload)) {
    return null;
  }

  const message = payload.message;

  if (typeof message === "string") {
    return normalizeSafeErrorMessage(message);
  }

  if (Array.isArray(message)) {
    return normalizeSafeErrorMessage(
      message.filter((entry) => typeof entry === "string").join(" ")
    );
  }

  return null;
}

function normalizeSafeErrorMessage(value: string): string | null {
  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized ? normalized.slice(0, 240) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAdminApiToken(url: string): string {
  const token = process.env.INTERNAL_ORDERS_API_TOKEN?.trim();

  if (!token) {
    throw new AdminApiError("Admin API token is not configured.", null, url);
  }

  return token;
}
