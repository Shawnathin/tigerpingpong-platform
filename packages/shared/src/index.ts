export type HealthStatus = "ok" | "unreachable";
export type ApiServiceName = "tigerpingpong-api";

export const AQUA_FOUR_PACK_PRODUCT_SLUG = "tiger-aqua-outdoor-indoor-paddle";
export const AQUA_FOUR_PACK_VARIANT_KEY = "tiger-aqua-package-4-pack-3-balls";
export const CANADA_FLAT_RATE_SHIPPING_CENTS = 1500;
export const CANADA_FREE_SHIPPING_THRESHOLD_CENTS = 10000;
export const LEGACY_CANADA_SHIPPING_RULE = "canada_free_over_100_flat_15";
export const CURRENT_CANADA_SHIPPING_RULE = "canada_free_over_100_flat_15_aqua_4_pack_free";
export const CURRENT_CANADA_SHIPPING_RULE_VERSION = "v2";

export type CanadaShippingRule =
  | typeof CURRENT_CANADA_SHIPPING_RULE
  | typeof LEGACY_CANADA_SHIPPING_RULE;

export interface CanadaShippingItem {
  productSlug?: string | null;
  variantKey?: string | null;
}

export interface ApiHealthResponse {
  status: HealthStatus;
  service: ApiServiceName;
  timestamp: string;
}

export function createApiHealthResponse(): ApiHealthResponse {
  return {
    status: "ok",
    service: "tigerpingpong-api",
    timestamp: new Date().toISOString()
  };
}

export function isAquaFourPackShippingItem(item: CanadaShippingItem): boolean {
  return (
    item.productSlug === AQUA_FOUR_PACK_PRODUCT_SLUG &&
    item.variantKey === AQUA_FOUR_PACK_VARIANT_KEY
  );
}

export function isCanadaShippingRule(value: string): value is CanadaShippingRule {
  return value === CURRENT_CANADA_SHIPPING_RULE || value === LEGACY_CANADA_SHIPPING_RULE;
}

export function calculateCanadaShippingCents(
  subtotalCents: number,
  items: readonly CanadaShippingItem[],
  rule: CanadaShippingRule = CURRENT_CANADA_SHIPPING_RULE
): number {
  if (subtotalCents > CANADA_FREE_SHIPPING_THRESHOLD_CENTS) {
    return 0;
  }

  const isAquaFourPackOnlyOrder =
    rule === CURRENT_CANADA_SHIPPING_RULE &&
    items.length > 0 &&
    items.every(isAquaFourPackShippingItem);

  return isAquaFourPackOnlyOrder ? 0 : CANADA_FLAT_RATE_SHIPPING_CENTS;
}
