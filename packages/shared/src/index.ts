export type HealthStatus = "ok" | "unreachable";
export type ApiServiceName = "tigerpingpong-api";

export const AQUA_PADDLE_PRODUCT_KEY = "tiger-aqua-outdoor-indoor-paddle";
export const AQUA_FOUR_PACK_PRODUCT_SLUG = AQUA_PADDLE_PRODUCT_KEY;
export const AQUA_TWO_PACK_VARIANT_KEY = "tiger-aqua-package-2-pack-3-balls";
export const AQUA_FOUR_PACK_VARIANT_KEY = "tiger-aqua-package-4-pack-3-balls";
export const PART_40_PRODUCT_SLUG = "tiger-pingpong-replacement-part-40";
export const PART_40_FULL_SET_QUANTITY = 8;
export const COMPONENT_DERIVED_PRICING_SOURCE = "component_derived";
export const TABLE_COVER_PRODUCT_KEY = "tiger-table-cover-black-polyester";
export const PLAZA_OUTDOOR_TABLE_PRODUCT_KEY = "tiger-plaza-outdoor-table-grey";
export const TABLE_ACCESSORY_ELIGIBLE_TABLE_PRODUCT_KEYS = [
  "tiger-expo-outdoor-table",
  "tiger-portland-indoor-table",
  "tiger-portland-outdoor-table",
  "tiger-whistler-indoor-table",
  PLAZA_OUTDOOR_TABLE_PRODUCT_KEY
] as const;
export const TABLE_ACCESSORIES_DISCOUNT_PERCENT = 30;
export const TABLE_ACCESSORIES_PRICING_RULE_VERSION = "table_accessories_30_v1";
export const TABLE_ACCESSORIES_PROMOTION_KEY = TABLE_ACCESSORIES_PRICING_RULE_VERSION;
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
export const AQUA_FOUR_PACK_CANADA_SHIPPING_RULE = "canada_free_over_100_flat_15_aqua_4_pack_free";
export const CURRENT_CANADA_SHIPPING_RULE =
  "canada_free_over_100_flat_15_aqua_4_pack_part_40_set_free";
export const CURRENT_CANADA_SHIPPING_RULE_VERSION = "v3";

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

export const SHIPPING_CARRIERS = [
  { code: "canada_post", label: "Canada Post" },
  { code: "purolator", label: "Purolator" },
  { code: "ups", label: "UPS" },
  { code: "fedex", label: "FedEx" },
  { code: "dhl_express", label: "DHL Express" },
  { code: "other", label: "Other carrier" }
] as const;

export type ShippingCarrierCode = (typeof SHIPPING_CARRIERS)[number]["code"];

export type CanadaShippingRule =
  | typeof CURRENT_CANADA_SHIPPING_RULE
  | typeof AQUA_FOUR_PACK_CANADA_SHIPPING_RULE
  | typeof LEGACY_CANADA_SHIPPING_RULE;

export interface CanadaShippingItem {
  productSlug?: string | null;
  quantity?: number | null;
  variantKey?: string | null;
}

export interface TableAccessoryPricingItem {
  existingPromotionKey?: string | null;
  lineId: string;
  listUnitPriceCents: number;
  productKey: string;
  productKind?: string | null;
  quantity: number;
  variantKey?: string | null;
}

export interface TableAccessoryPricingAllocation {
  discountCents: number;
  discountedQuantity: number;
  discountedUnitPriceCents: number;
  discountUnitCents: number;
  fullPriceQuantity: number;
  lineId: string;
  listLineTotalCents: number;
  listUnitPriceCents: number;
  netLineTotalCents: number;
  promotionKey: typeof TABLE_ACCESSORIES_PROMOTION_KEY | null;
}

export interface TableAccessoryPricingResult {
  allocations: TableAccessoryPricingAllocation[];
  discountCents: number;
  listSubtotalCents: number;
  netSubtotalCents: number;
  pricingRuleVersion: typeof TABLE_ACCESSORIES_PRICING_RULE_VERSION;
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

export function isPart40FullSetShippingItem(item: CanadaShippingItem): boolean {
  return (
    item.productSlug === PART_40_PRODUCT_SLUG &&
    typeof item.quantity === "number" &&
    Number.isInteger(item.quantity) &&
    item.quantity >= PART_40_FULL_SET_QUANTITY
  );
}

export function isCanadaShippingRule(value: string): value is CanadaShippingRule {
  return (
    value === CURRENT_CANADA_SHIPPING_RULE ||
    value === AQUA_FOUR_PACK_CANADA_SHIPPING_RULE ||
    value === LEGACY_CANADA_SHIPPING_RULE
  );
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

  const supportsAquaFourPackException = rule !== LEGACY_CANADA_SHIPPING_RULE;
  const isAquaFourPackOnlyOrder =
    supportsAquaFourPackException && items.length > 0 && items.every(isAquaFourPackShippingItem);
  const hasPart40FullSet =
    rule === CURRENT_CANADA_SHIPPING_RULE && items.some(isPart40FullSetShippingItem);

  return isAquaFourPackOnlyOrder || hasPart40FullSet ? 0 : CANADA_FLAT_RATE_SHIPPING_CENTS;
}

export function calculateTableAccessoryPricing(
  items: readonly TableAccessoryPricingItem[]
): TableAccessoryPricingResult {
  const allocations = items.map((item) => ({
    discountedQuantity: 0,
    item
  }));
  const tableItems = items.filter(isEligibleQualifyingTable);
  const playSetCapacity = tableItems.reduce((total, item) => total + item.quantity, 0);
  const coverCapacity = tableItems
    .filter((item) => item.productKey !== PLAZA_OUTDOOR_TABLE_PRODUCT_KEY)
    .reduce((total, item) => total + item.quantity, 0);

  allocateDiscountedQuantity(allocations, playSetCapacity, isEligiblePlaySet);
  allocateDiscountedQuantity(allocations, coverCapacity, isEligibleTableCover);

  const pricedAllocations = allocations.map(({ discountedQuantity, item }) => {
    const roundedDiscountedUnitPriceCents = Math.round(
      item.listUnitPriceCents * ((100 - TABLE_ACCESSORIES_DISCOUNT_PERCENT) / 100)
    );
    const roundedDiscountUnitCents = item.listUnitPriceCents - roundedDiscountedUnitPriceCents;
    const effectiveDiscountedQuantity = roundedDiscountUnitCents > 0 ? discountedQuantity : 0;
    const fullPriceQuantity = item.quantity - effectiveDiscountedQuantity;
    const discountUnitCents = effectiveDiscountedQuantity > 0 ? roundedDiscountUnitCents : 0;
    const listLineTotalCents = item.listUnitPriceCents * item.quantity;
    const discountCents = discountUnitCents * effectiveDiscountedQuantity;

    return {
      discountCents,
      discountedQuantity: effectiveDiscountedQuantity,
      discountedUnitPriceCents:
        effectiveDiscountedQuantity > 0 ? roundedDiscountedUnitPriceCents : item.listUnitPriceCents,
      discountUnitCents,
      fullPriceQuantity,
      lineId: item.lineId,
      listLineTotalCents,
      listUnitPriceCents: item.listUnitPriceCents,
      netLineTotalCents: listLineTotalCents - discountCents,
      promotionKey: effectiveDiscountedQuantity > 0 ? TABLE_ACCESSORIES_PROMOTION_KEY : null
    } satisfies TableAccessoryPricingAllocation;
  });
  const listSubtotalCents = pricedAllocations.reduce(
    (total, allocation) => total + allocation.listLineTotalCents,
    0
  );
  const discountCents = pricedAllocations.reduce(
    (total, allocation) => total + allocation.discountCents,
    0
  );

  return {
    allocations: pricedAllocations,
    discountCents,
    listSubtotalCents,
    netSubtotalCents: listSubtotalCents - discountCents,
    pricingRuleVersion: TABLE_ACCESSORIES_PRICING_RULE_VERSION
  };
}

function allocateDiscountedQuantity(
  allocations: Array<{ discountedQuantity: number; item: TableAccessoryPricingItem }>,
  capacity: number,
  isEligible: (item: TableAccessoryPricingItem) => boolean
): void {
  let remainingCapacity = capacity;
  const candidates = allocations
    .map((allocation, index) => ({ allocation, index }))
    .filter(
      ({ allocation }) =>
        !allocation.item.existingPromotionKey?.trim() && isEligible(allocation.item)
    )
    .sort(
      (left, right) =>
        right.allocation.item.listUnitPriceCents - left.allocation.item.listUnitPriceCents ||
        left.allocation.item.productKey.localeCompare(right.allocation.item.productKey) ||
        (left.allocation.item.variantKey ?? "").localeCompare(
          right.allocation.item.variantKey ?? ""
        ) ||
        left.allocation.item.lineId.localeCompare(right.allocation.item.lineId) ||
        left.index - right.index
    );

  for (const { allocation } of candidates) {
    if (remainingCapacity <= 0) {
      return;
    }

    const discountedQuantity = Math.min(allocation.item.quantity, remainingCapacity);
    allocation.discountedQuantity = discountedQuantity;
    remainingCapacity -= discountedQuantity;
  }
}

function isEligiblePlaySet(item: TableAccessoryPricingItem): boolean {
  return (
    (item.productKey === AQUA_PADDLE_PRODUCT_KEY &&
      (item.variantKey === AQUA_TWO_PACK_VARIANT_KEY ||
        item.variantKey === AQUA_FOUR_PACK_VARIANT_KEY)) ||
    (item.productKey === VICE_PADDLE_PRODUCT_KEY && item.variantKey === VICE_BUNDLE_VARIANT_KEY)
  );
}

function isEligibleTableCover(item: TableAccessoryPricingItem): boolean {
  return item.productKey === TABLE_COVER_PRODUCT_KEY;
}

function isEligibleQualifyingTable(item: TableAccessoryPricingItem): boolean {
  return (TABLE_ACCESSORY_ELIGIBLE_TABLE_PRODUCT_KEYS as readonly string[]).includes(
    item.productKey
  );
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

export function isShippingCarrierCode(value: string): value is ShippingCarrierCode {
  return SHIPPING_CARRIERS.some((carrier) => carrier.code === value);
}

export function getShippingCarrierLabel(code: ShippingCarrierCode): string {
  return SHIPPING_CARRIERS.find((carrier) => carrier.code === code)?.label ?? "Other carrier";
}

export function inferShippingCarrierCode(carrierName: string | null): ShippingCarrierCode {
  const normalized = carrierName?.trim().toLowerCase();
  const carrier = SHIPPING_CARRIERS.find(
    (candidate) => candidate.code !== "other" && candidate.label.toLowerCase() === normalized
  );

  return carrier?.code ?? "other";
}

export function buildCarrierTrackingUrl(
  code: Exclude<ShippingCarrierCode, "other">,
  trackingNumber: string
): string {
  const normalizedTrackingNumber = trackingNumber.trim();

  if (!normalizedTrackingNumber) {
    throw new Error("tracking number is required.");
  }

  const encoded = encodeURIComponent(normalizedTrackingNumber);

  switch (code) {
    case "canada_post":
      return `https://www.canadapost-postescanada.ca/track-reperage/en#/details/${encoded}`;
    case "purolator":
      return `https://www.purolator.com/en/shipping/tracker?pin=${encoded}`;
    case "ups":
      return `https://www.ups.com/track?loc=en_CA&tracknum=${encoded}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${encoded}`;
    case "dhl_express":
      return `https://www.dhl.com/ca-en/home/tracking.html?tracking-id=${encoded}`;
  }
}
