export type HealthStatus = "ok" | "unreachable";
export type ApiServiceName = "tigerpingpong-api";

export const AQUA_FOUR_PACK_PRODUCT_SLUG = "tiger-aqua-outdoor-indoor-paddle";
export const AQUA_FOUR_PACK_VARIANT_KEY = "tiger-aqua-package-4-pack-3-balls";
export const COMPONENT_DERIVED_PRICING_SOURCE = "component_derived";
export const VICE_PADDLE_PRODUCT_KEY = "tiger-vice-paddle";
export const VICE_SINGLE_VARIANT_KEY = "tiger-vice-package-single";
export const VICE_BUNDLE_VARIANT_KEY = "tiger-vice-package-4-pack-6-white-balls";
export const VICE_PACKAGE_OPTION_NAME = "Package Options";
export const VICE_SINGLE_PUBLIC_LABEL = "Single Vice Paddle";
export const VICE_BUNDLE_PUBLIC_LABEL = "4 Vice paddles + 6 white balls";
export const VICE_SINGLE_OPTION_VALUE = "single-vice-paddle";
export const VICE_BUNDLE_OPTION_VALUE = "4-vice-paddles-6-white-balls";
export const VICE_BUNDLE_PADDLE_QUANTITY = 4;
export const PREMIUM_WHITE_BALLS_SIX_PACK_PRODUCT_KEY = "tiger-premium-balls-6-white";
export const CANADA_FLAT_RATE_SHIPPING_CENTS = 1500;
export const CANADA_FREE_SHIPPING_THRESHOLD_CENTS = 10000;
export const LEGACY_CANADA_SHIPPING_RULE = "canada_free_over_100_flat_15";
export const CURRENT_CANADA_SHIPPING_RULE = "canada_free_over_100_flat_15_aqua_4_pack_free";
export const CURRENT_CANADA_SHIPPING_RULE_VERSION = "v2";

export type CatalogVariantPricingSource = typeof COMPONENT_DERIVED_PRICING_SOURCE;

export interface CatalogComponentPrice {
  currency: string;
  priceCents: number | null | undefined;
}

export interface ComponentDerivedCatalogPrice {
  currency: string;
  priceCents: number;
  pricingSource: CatalogVariantPricingSource;
}

export interface ViceBundlePricingComponents {
  legacyViceBase: CatalogComponentPrice;
  viceSingle?: CatalogComponentPrice | null;
  whiteBallsSixPack?: CatalogComponentPrice | null;
}

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

export function calculateViceBundleRegularPrice(
  components: ViceBundlePricingComponents
): ComponentDerivedCatalogPrice | null {
  const vicePrice =
    components.viceSingle === null || components.viceSingle === undefined
      ? components.legacyViceBase
      : components.viceSingle;
  const whiteBallsPrice = components.whiteBallsSixPack;

  if (
    !isValidCatalogComponentPrice(vicePrice) ||
    !isValidCatalogComponentPrice(whiteBallsPrice) ||
    vicePrice.currency !== whiteBallsPrice.currency
  ) {
    return null;
  }

  const priceCents =
    vicePrice.priceCents * VICE_BUNDLE_PADDLE_QUANTITY + whiteBallsPrice.priceCents;

  if (!Number.isSafeInteger(priceCents)) {
    return null;
  }

  return {
    priceCents,
    currency: vicePrice.currency,
    pricingSource: COMPONENT_DERIVED_PRICING_SOURCE
  };
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

function isValidCatalogComponentPrice(
  component: CatalogComponentPrice | null | undefined
): component is CatalogComponentPrice & { priceCents: number } {
  return (
    typeof component?.priceCents === "number" &&
    Number.isSafeInteger(component.priceCents) &&
    component.priceCents > 0 &&
    component.currency.length > 0
  );
}
