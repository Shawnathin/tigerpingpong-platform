import type { CatalogProductSummary } from "../types/catalog";

const TABLE_PRODUCT_ORDER = [
  "tiger-expo-outdoor-table",
  "tiger-portland-indoor-table",
  "tiger-portland-outdoor-table",
  "tiger-whistler-indoor-table",
  "tiger-plaza-outdoor-table-grey"
];
const ACCESSORY_PARENT_ORDER = [
  "tiger-net-post-set",
  "tiger-table-cover-black-polyester",
  "tiger-premium-balls-140",
  "tiger-premium-balls-6-orange",
  "tiger-premium-balls-6-white",
  "tiger-vice-paddle"
];

const TABLE_PRODUCT_META: Record<
  string,
  {
    chips: string[];
    ctaLabel: string;
    displayName: string;
    pitch: string;
  }
> = {
  "tiger-expo-outdoor-table": {
    chips: ["Outdoor", "Entry outdoor option", "Grey or Blue"],
    ctaLabel: "View Expo table",
    displayName: "Expo Outdoor",
    pitch: "A straightforward outdoor table option for everyday rallies and fresh-air play."
  },
  "tiger-portland-indoor-table": {
    chips: ["Indoor", "Practice-ready", "Grey or Green"],
    ctaLabel: "View Portland table",
    displayName: "Portland Indoor",
    pitch: "A polished indoor table for home practice, family play, and game rooms."
  },
  "tiger-portland-outdoor-table": {
    chips: ["Outdoor", "Grey or Blue"],
    ctaLabel: "View Portland table",
    displayName: "Portland Outdoor",
    pitch: "A flexible outdoor table for patios, backyards, and regular open-air play."
  },
  "tiger-whistler-indoor-table": {
    chips: ["Indoor", "Tournament top", "Green or Blue"],
    ctaLabel: "View Whistler table",
    displayName: "Whistler Indoor",
    pitch: "A serious indoor table with a tournament-spec playing surface."
  },
  "tiger-plaza-outdoor-table-grey": {
    chips: ["Outdoor", "Premium outdoor option", "Grey"],
    ctaLabel: "View Plaza table",
    displayName: "Plaza Outdoor",
    pitch: "A fixed outdoor table option for shared spaces and long-term setups."
  }
};

const PRODUCT_DISPLAY_NAMES: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(TABLE_PRODUCT_META).map(([slug, meta]) => [slug, meta.displayName])
  ),
  "tiger-net-post-set": "Net & Post Set",
  "tiger-premium-balls-140": "140-Pack Balls",
  "tiger-premium-balls-6-orange": "6-Pack Orange Balls",
  "tiger-premium-balls-6-white": "6-Pack White Balls",
  "tiger-table-cover-black-polyester": "Table Cover",
  "tiger-vice-paddle": "Vice Paddle"
};

const ACCESSORY_CTA_LABELS: Record<string, string> = {
  "tiger-net-post-set": "View net set",
  "tiger-premium-balls-140": "View balls",
  "tiger-premium-balls-6-orange": "View balls",
  "tiger-premium-balls-6-white": "View balls",
  "tiger-table-cover-black-polyester": "View cover",
  "tiger-vice-paddle": "View paddle"
};

export const TABLE_SHIPPING_MESSAGE = "All Tables Ship Free — Canada-Wide!";
export const ACCESSORY_SHIPPING_MESSAGE = "Free Canada-wide shipping over $100.";

export function getProductAnchorId(product: CatalogProductSummary): string {
  return `product-${product.slug}`;
}

export function getProductDisplayName(product: CatalogProductSummary): string {
  return PRODUCT_DISPLAY_NAMES[product.slug] ?? simplifyProductName(product.name);
}

export function getProductCtaLabel(product: CatalogProductSummary, fallback: string): string {
  return (
    TABLE_PRODUCT_META[product.slug]?.ctaLabel ?? ACCESSORY_CTA_LABELS[product.slug] ?? fallback
  );
}

export function getProductPitch(product: CatalogProductSummary, fallback: string): string {
  return TABLE_PRODUCT_META[product.slug]?.pitch ?? fallback;
}

export function getProductChips(
  product: CatalogProductSummary,
  layout: "editorial" | "compact"
): string[] {
  const tableChips = TABLE_PRODUCT_META[product.slug]?.chips;

  if (tableChips) {
    return tableChips;
  }

  const chips = [product.family.name];
  const productMode = getProductMode(product);

  if (productMode && !chips.includes(productMode)) {
    chips.push(productMode);
  }

  return chips.slice(0, layout === "compact" ? 2 : 3);
}

export function sortProductsForBrowsing(
  products: CatalogProductSummary[],
  productOrder?: string[]
): CatalogProductSummary[] {
  if (!productOrder) {
    return products;
  }

  const order = new Map(productOrder.map((slug, index) => [slug, index]));

  return products
    .filter((product) => order.has(product.slug))
    .sort((left, right) => {
      const leftOrder = order.get(left.slug) ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = order.get(right.slug) ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.name.localeCompare(right.name);
    });
}

export function getTableProductOrder(kind: "all" | "indoor" | "outdoor"): string[] {
  if (kind === "indoor") {
    return ["tiger-portland-indoor-table", "tiger-whistler-indoor-table"];
  }

  if (kind === "outdoor") {
    return [
      "tiger-expo-outdoor-table",
      "tiger-portland-outdoor-table",
      "tiger-plaza-outdoor-table-grey"
    ];
  }

  return TABLE_PRODUCT_ORDER;
}

export function getAccessoryParentProductOrder(): string[] {
  return ACCESSORY_PARENT_ORDER;
}

function getProductMode(product: CatalogProductSummary): string | null {
  const normalized = `${product.name} ${product.slug} ${product.key}`.toLowerCase();

  if (normalized.includes("indoor")) {
    return "Indoor";
  }

  if (normalized.includes("outdoor")) {
    return "Outdoor";
  }

  return null;
}

function simplifyProductName(name: string): string {
  return name
    .replace(/^Tiger\s*PingPong\s*/i, "")
    .replace(/\s*Ping Pong\s*/gi, " ")
    .replace(/\s*Table Tennis\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
