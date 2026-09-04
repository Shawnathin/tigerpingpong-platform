import tableProductGalleryManifestData from "../../../../data/media/table-product-gallery-manifest-v1.json";
import {
  getApprovedSectionContent,
  getTigerTablePageDefinition,
  TIGER_TABLE_COMPARISON_FACT_KEYS,
  type TigerTableComparisonFactKey,
  type TigerTablePageDefinition
} from "./tiger-table-pages";
import type { CatalogProductDetail, CatalogProductVariantSummary } from "../types/catalog";

export interface TigerTableComparisonColumn {
  definition: TigerTablePageDefinition;
  image: {
    altText: string;
    src: string;
  };
  label: string;
  product: CatalogProductDetail;
}

export interface TigerTableComparisonRow {
  id: string;
  label: string;
  values: readonly string[];
}

const TABLE_DISPLAY_LABELS: Readonly<Record<string, string>> = {
  "tiger-expo-outdoor-table": "Expo Outdoor",
  "tiger-plaza-outdoor-table-grey": "Plaza Outdoor",
  "tiger-portland-indoor-table": "Portland Indoor",
  "tiger-portland-outdoor-table": "Portland Outdoor",
  "tiger-whistler-indoor-table": "Whistler Indoor"
};

const OPTIONAL_COMPARISON_FACT_KEYS = TIGER_TABLE_COMPARISON_FACT_KEYS.filter(
  (key): key is Exclude<TigerTableComparisonFactKey, "environment" | "use-context"> =>
    key !== "environment" && key !== "use-context"
);
const NON_CHECKOUT_VARIANT_PURCHASE_MODES = new Set(["deferred_from_v1", "disabled"]);
const COMPARISON_MEDIA_ROLES = new Set(["primary", "variant"]);

interface TableGalleryManifest {
  readonly products: readonly {
    readonly assets: readonly {
      readonly altText: string;
      readonly cloudinary?: {
        readonly secureUrl?: string | null;
      };
      readonly isPrimary: boolean;
      readonly localPublicPath?: string | null;
      readonly mediaKey: string;
      readonly modelVerification: string;
      readonly rightsStatus: string;
      readonly role: string;
      readonly sortOrder: number;
      readonly variantKey: string | null;
    }[];
    readonly productSlug: string;
  }[];
}

const tableGalleryManifest = tableProductGalleryManifestData as TableGalleryManifest;
const reviewedComparisonMediaByProductSlug = new Map(
  tableGalleryManifest.products.map((product) => [product.productSlug, product.assets] as const)
);

export function resolveTigerTableComparisonColumns(
  currentProduct: CatalogProductDetail,
  currentDefinition: TigerTablePageDefinition,
  products: CatalogProductDetail[]
): TigerTableComparisonColumn[] {
  const productBySlug = new Map(
    [currentProduct, ...products].map((candidate) => [candidate.slug, candidate] as const)
  );
  const orderedSlugs = [currentDefinition.slug, ...currentDefinition.comparisonPeerSlugs];

  const columns = orderedSlugs.map((slug) => {
    const candidate = productBySlug.get(slug);
    const candidateDefinition = getTigerTablePageDefinition(slug);
    const image = candidate ? resolveComparisonImage(candidate) : null;

    if (!candidate || !candidateDefinition || !image) {
      return null;
    }

    return {
      definition: candidateDefinition,
      image,
      label: getTigerTableProductDisplayLabel(candidate),
      product: candidate
    } satisfies TigerTableComparisonColumn;
  });

  return columns.every((column): column is TigerTableComparisonColumn => column !== null)
    ? columns
    : [];
}

export function buildTigerTableComparisonRows(
  columns: readonly TigerTableComparisonColumn[]
): TigerTableComparisonRow[] {
  if (columns.length === 0) {
    return [];
  }

  const rows: TigerTableComparisonRow[] = [];
  const livePrices = columns.map(({ product }) => getLivePriceLabel(product));

  if (livePrices.every((value): value is string => Boolean(value))) {
    rows.push({
      id: "live-price",
      label: "Price",
      values: livePrices
    });
  }

  addReviewedComparisonRow(rows, columns, "environment");

  const activeColours = columns.map(({ product }) => getActiveColourLabel(product));

  if (activeColours.every((value): value is string => Boolean(value))) {
    rows.push({
      id: "active-colours",
      label: "Active colours",
      values: activeColours
    });
  }

  addReviewedComparisonRow(rows, columns, "use-context");

  OPTIONAL_COMPARISON_FACT_KEYS.forEach((key) => {
    addReviewedComparisonRow(rows, columns, key);
  });

  return rows;
}

export function getTigerTableProductDisplayLabel(product: { name: string; slug: string }): string {
  return (
    TABLE_DISPLAY_LABELS[product.slug] ??
    product.name
      .replace(/^Tiger\s+PingPong\s+/i, "")
      .replace(/\s+Ping\s*Pong\s+Table\b/i, "")
      .replace(/\s+Table\b/i, "")
      .trim()
  );
}

function addReviewedComparisonRow(
  rows: TigerTableComparisonRow[],
  columns: readonly TigerTableComparisonColumn[],
  key: TigerTableComparisonFactKey
): void {
  const facts = columns.map(({ definition }) =>
    getApprovedSectionContent(definition.comparisonFacts[key])
  );

  if (!facts.every((fact): fact is NonNullable<typeof fact> => Boolean(fact))) {
    return;
  }

  const label = facts[0].label;

  if (!facts.every((fact) => fact.label === label)) {
    return;
  }

  rows.push({
    id: key,
    label,
    values: facts.map((fact) => fact.value)
  });
}

function resolveComparisonImage(product: CatalogProductDetail): {
  altText: string;
  src: string;
} | null {
  const activeVariantKeys = new Set(
    (product.variants ?? []).filter(isCheckoutVariantActive).map((variant) => variant.key)
  );
  const media = (reviewedComparisonMediaByProductSlug.get(product.slug) ?? [])
    .slice()
    .filter(
      (candidate) =>
        COMPARISON_MEDIA_ROLES.has(candidate.role) &&
        candidate.rightsStatus === "owner_cleared" &&
        candidate.modelVerification.startsWith("verified_current") &&
        (!candidate.variantKey || activeVariantKeys.has(candidate.variantKey)) &&
        Boolean(candidate.localPublicPath?.trim() || candidate.cloudinary?.secureUrl?.trim())
    )
    .sort((left, right) => {
      if (left.isPrimary !== right.isPrimary) {
        return left.isPrimary ? -1 : 1;
      }

      if (left.role !== right.role) {
        if (left.role === "primary") {
          return -1;
        }

        if (right.role === "primary") {
          return 1;
        }
      }

      return left.sortOrder - right.sortOrder;
    })[0];
  const src = media?.localPublicPath?.trim() || media?.cloudinary?.secureUrl?.trim();

  return media && src
    ? {
        altText: media.altText,
        src
      }
    : null;
}

function getLivePriceLabel(product: CatalogProductDetail): string | null {
  const activeVariantPrices = (product.variants ?? [])
    .filter(isCheckoutVariantActive)
    .map((variant) => getVariantPrice(variant, product))
    .filter(
      (
        price
      ): price is {
        currency: string;
        priceCents: number;
      } => price !== null
    );
  const availablePrices =
    activeVariantPrices.length > 0
      ? activeVariantPrices
      : product.priceCents !== null && product.priceCents > 0
        ? [{ currency: product.currency, priceCents: product.priceCents }]
        : [];

  if (availablePrices.length === 0) {
    return null;
  }

  const currencies = new Set(
    availablePrices.map((price) => price.currency.trim().toUpperCase()).filter(Boolean)
  );

  if (currencies.size !== 1) {
    return null;
  }

  const uniquePrices = Array.from(new Set(availablePrices.map((price) => price.priceCents))).sort(
    (left, right) => left - right
  );
  const currency = currencies.values().next().value;

  if (!currency || uniquePrices.length === 0) {
    return null;
  }

  const formattedPrice = new Intl.NumberFormat("en-CA", {
    currency,
    maximumFractionDigits: 2,
    style: "currency"
  }).format(uniquePrices[0] / 100);

  return uniquePrices.length > 1 ? `From ${formattedPrice}` : formattedPrice;
}

function getVariantPrice(
  variant: CatalogProductVariantSummary,
  product: CatalogProductDetail
): {
  currency: string;
  priceCents: number;
} | null {
  const priceCents =
    variant.priceCents !== null && variant.priceCents > 0
      ? variant.priceCents
      : product.productKind === "table"
        ? product.priceCents
        : null;

  return priceCents !== null && priceCents > 0 && variant.currency.trim()
    ? {
        currency: variant.currency,
        priceCents
      }
    : null;
}

function getActiveColourLabel(product: CatalogProductDetail): string | null {
  const values = (product.variants ?? [])
    .filter(isCheckoutVariantActive)
    .flatMap((variant) => variant.options)
    .filter((option) => /\bcolou?r\b/i.test(`${option.name} ${option.displayName ?? ""}`))
    .sort(
      (left, right) =>
        left.optionSortOrder - right.optionSortOrder || left.sortOrder - right.sortOrder
    )
    .map((option) => option.label?.trim() || option.value.trim())
    .filter(Boolean);
  const uniqueValues = Array.from(new Set(values));

  return uniqueValues.length > 0 ? uniqueValues.join(", ") : null;
}

function isCheckoutVariantActive(variant: CatalogProductVariantSummary): boolean {
  return (
    variant.isActive &&
    (variant.purchaseModeOverride === null ||
      !NON_CHECKOUT_VARIANT_PURCHASE_MODES.has(variant.purchaseModeOverride))
  );
}
