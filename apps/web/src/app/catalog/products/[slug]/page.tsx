import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicStorefrontNav } from "../../../PublicStorefrontNav";
import { CatalogApiError, getProductBySlug, getProducts } from "../../../../lib/catalog-api";
import type { CartProductInput } from "../../../../lib/cart";
import {
  getProductDescriptionCopy,
  getProductMediaFallbacks,
  getPrimaryProductMediaFallback,
  getProductShortCopy
} from "../../../../lib/public-storefront-demo";
import {
  getV1ShippingMessage,
  V1_FLAT_RATE_SHIPPING_COPY,
  V1_FREE_SHIPPING_COPY,
  V1_IN_STOCK_HANDLING_COPY
} from "../../../../lib/shipping";
import {
  getProductContentBySlug,
  type NormalizedProductContent
} from "../../../../lib/product-content";
import type {
  CatalogProductDetail,
  CatalogProductSummary,
  CatalogProductVariantSummary,
  CatalogSummary
} from "../../../../types/catalog";

import { CheckoutButton } from "./CheckoutButton";
import { ProductMediaGallery, type ProductMediaGalleryItem } from "./ProductMediaGallery";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

interface ProductResource {
  product: CatalogProductDetail | null;
  error: string | null;
}

type PublicRecord = Record<string, unknown>;

type ProductJsonLd = {
  "@context": "https://schema.org";
  "@type": "Product";
  brand?: {
    "@type": "Brand";
    name: string;
  };
  category?: string;
  description?: string;
  image?: string[];
  name: string;
  offers?: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
};

const HIDDEN_PUBLIC_KEYS = [
  "source",
  "url",
  "notes",
  "internal",
  "bigcommerce",
  "cloudinaryAsset",
  "cloudinaryPublic",
  "cloudinaryVersion",
  "cloudinaryResource",
  "cloudinaryOriginal"
];
const CHECKOUT_PURCHASE_MODES = new Set(["online_checkout", "online_checkout_candidate"]);
const TABLE_RECOMMENDATION_SLUGS = [
  "tiger-vice-paddle",
  "tiger-premium-balls-6-white",
  "tiger-premium-balls-6-orange",
  "tiger-premium-balls-140",
  "tiger-table-cover-black-polyester",
  "tiger-net-post-set"
];
const PADDLE_RECOMMENDATION_SLUGS = [
  "tiger-premium-balls-6-white",
  "tiger-premium-balls-6-orange",
  "tiger-premium-balls-140"
];
const BALL_RECOMMENDATION_SLUGS = [
  "tiger-vice-paddle",
  "tiger-net-post-set",
  "tiger-table-cover-black-polyester"
];
const COVER_RECOMMENDATION_SLUGS = [
  "tiger-portland-outdoor-table",
  "tiger-expo-outdoor-table",
  "tiger-portland-indoor-table"
];
const NET_RECOMMENDATION_SLUGS = [
  "tiger-vice-paddle",
  "tiger-premium-balls-6-white",
  "tiger-premium-balls-6-orange"
];

async function loadProduct(slug: string): Promise<ProductResource> {
  let product: CatalogProductDetail;

  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    if (error instanceof CatalogApiError && error.status === 404) {
      notFound();
    }

    return {
      product: null,
      error: "Product details are temporarily unavailable."
    };
  }

  if (isReplacementPartsProduct(product)) {
    notFound();
  }

  return {
    product,
    error: null
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await loadProductForMetadata(params.slug);

  if (!product) {
    return {
      title: "Product Detail | Tiger Ping Pong",
      description: "Tiger Ping Pong public product detail and checkout page."
    };
  }

  const normalizedContent = getProductContentBySlug(product.slug);

  return {
    title: `${product.name} | Tiger Ping Pong`,
    description: getProductMetadataDescription(product, normalizedContent)
  };
}

async function loadProductForMetadata(slug: string): Promise<CatalogProductDetail | null> {
  try {
    const product = await getProductBySlug(slug);
    return isReplacementPartsProduct(product) ? null : product;
  } catch {
    return null;
  }
}

function hasReplacementPartsMarker(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => {
    if (!value) {
      return false;
    }

    const normalized = value.toLowerCase().replace(/[_\s]+/g, "-");
    return normalized === "replacement-parts" || normalized.includes("replacement-part");
  });
}

function isReplacementPartsSummary(summary: CatalogSummary): boolean {
  return hasReplacementPartsMarker(summary.key, summary.slug, summary.name);
}

function isReplacementPartsProduct(product: CatalogProductDetail): boolean {
  return (
    hasReplacementPartsMarker(product.productKind, product.key, product.slug, product.name) ||
    isReplacementPartsSummary(product.category) ||
    isReplacementPartsSummary(product.family)
  );
}

function isProductCheckoutEligible(product: CatalogProductDetail): boolean {
  return (
    product.v1PublicNavigation &&
    product.v1CheckoutScope &&
    CHECKOUT_PURCHASE_MODES.has(product.purchaseMode) &&
    product.priceCents !== null &&
    product.priceCents > 0 &&
    product.currency.trim().toLowerCase() === "cad"
  );
}

function isSummaryCheckoutEligible(product: CatalogProductSummary): boolean {
  return (
    product.v1PublicNavigation &&
    product.v1CheckoutScope &&
    CHECKOUT_PURCHASE_MODES.has(product.purchaseMode) &&
    product.priceCents !== null &&
    product.priceCents > 0 &&
    product.currency.trim().toLowerCase() === "cad"
  );
}

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents === null) {
    return "Price coming soon";
  }

  return new Intl.NumberFormat("en-CA", {
    currency,
    style: "currency"
  }).format(priceCents / 100);
}

function formatLabel(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getMediaItems(product: CatalogProductDetail): ProductMediaGalleryItem[] {
  const sortedCatalogMedia = [...product.media].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );
  const cloudinaryMediaItems: ProductMediaGalleryItem[] = [];

  for (const media of sortedCatalogMedia) {
    const src = normalizeMediaSrc(media.cloudinarySecureUrl);

    if (!src) {
      continue;
    }

    cloudinaryMediaItems.push({
      altText: media.altText,
      caption: media.caption,
      isPrimary: media.isPrimary,
      mediaKey: media.mediaKey,
      role: media.role,
      sortOrder: media.sortOrder,
      src,
      title: media.title
    });
  }

  const uniqueCloudinaryMediaItems = getUniqueMediaItems(cloudinaryMediaItems);
  const fallbackMediaItems = getUniqueMediaItems(getFallbackMediaItems(product));

  if (uniqueCloudinaryMediaItems.length >= 2) {
    return uniqueCloudinaryMediaItems;
  }

  if (uniqueCloudinaryMediaItems.length === 1) {
    return appendUniqueMediaItems(uniqueCloudinaryMediaItems, fallbackMediaItems);
  }

  if (fallbackMediaItems.length > 0) {
    return fallbackMediaItems;
  }

  return [
    {
      mediaKey: `${product.key}-pending`,
      role: "primary",
      src: null,
      altText: `${product.name} image pending`,
      title: product.name,
      caption: null,
      sortOrder: 0,
      isPrimary: true
    }
  ];
}

function normalizeMediaSrc(src: string | null): string | null {
  const normalizedSrc = src?.trim();
  return normalizedSrc ? normalizedSrc : null;
}

function getFallbackMediaItems(product: CatalogProductDetail): ProductMediaGalleryItem[] {
  const fallbackMediaItems: ProductMediaGalleryItem[] = [];

  for (const [index, media] of getProductMediaFallbacks(product.slug).entries()) {
    const src = normalizeMediaSrc(media.src);

    if (!src) {
      continue;
    }

    fallbackMediaItems.push({
      altText: media.alt,
      caption: media.caption,
      isPrimary: index === 0,
      mediaKey: `${product.key}-fallback-${index + 1}`,
      role: media.role,
      sortOrder: index,
      src,
      title: media.title
    });
  }

  return fallbackMediaItems;
}

function appendUniqueMediaItems(
  preferredMediaItems: ProductMediaGalleryItem[],
  fallbackMediaItems: ProductMediaGalleryItem[]
): ProductMediaGalleryItem[] {
  const mediaItems = getUniqueMediaItems(preferredMediaItems);
  const seenSrcs = new Set(mediaItems.map((media) => media.src).filter(isPresentMediaSrc));

  for (const fallbackMedia of fallbackMediaItems) {
    if (!fallbackMedia.src || seenSrcs.has(fallbackMedia.src)) {
      continue;
    }

    seenSrcs.add(fallbackMedia.src);
    mediaItems.push({
      ...fallbackMedia,
      isPrimary: false,
      sortOrder: mediaItems.length
    });
  }

  return mediaItems;
}

function getUniqueMediaItems(mediaItems: ProductMediaGalleryItem[]): ProductMediaGalleryItem[] {
  const seenSrcs = new Set<string>();
  const uniqueMediaItems: ProductMediaGalleryItem[] = [];

  for (const media of mediaItems) {
    if (!media.src || seenSrcs.has(media.src)) {
      continue;
    }

    seenSrcs.add(media.src);
    uniqueMediaItems.push(media);
  }

  return uniqueMediaItems;
}

function isPresentMediaSrc(src: string | null): src is string {
  return src !== null;
}

interface CheckoutOptionValue {
  label: string;
  value: string;
}

interface CheckoutOptionGroup {
  displayName: string;
  name: string;
  required: boolean;
  values: CheckoutOptionValue[];
}

function normalizeOptionKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function isCheckoutVariantActive(variant: CatalogProductVariantSummary): boolean {
  return (
    variant.isActive &&
    variant.purchaseModeOverride !== "deferred_from_v1" &&
    variant.purchaseModeOverride !== "disabled"
  );
}

function getCheckoutOptionGroups(product: CatalogProductDetail): CheckoutOptionGroup[] {
  if (normalizeOptionKey(product.productKind) !== "table") {
    return [];
  }

  const valuesByNormalizedValue = new Map<
    string,
    {
      label: string;
      sortOrder: number;
      value: string;
    }
  >();

  for (const variant of product.variants ?? []) {
    if (!isCheckoutVariantActive(variant)) {
      continue;
    }

    const colorOption = variant.options.find(
      (option) => normalizeOptionKey(option.name) === "color"
    );

    if (!colorOption) {
      continue;
    }

    const normalizedValue = normalizeOptionKey(colorOption.value);

    if (!normalizedValue || valuesByNormalizedValue.has(normalizedValue)) {
      continue;
    }

    valuesByNormalizedValue.set(normalizedValue, {
      label: colorOption.label ?? colorOption.value,
      sortOrder: colorOption.sortOrder,
      value: colorOption.value
    });
  }

  const values = [...valuesByNormalizedValue.values()].sort(
    (left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label)
  );

  if (values.length <= 1) {
    return [];
  }

  return [
    {
      displayName: "Top colour",
      name: "Color",
      required: true,
      values: values.map(({ label, value }) => ({
        label,
        value
      }))
    }
  ];
}

function getCartImage(product: CatalogProductDetail): string | null {
  return getMediaItems(product)[0]?.src ?? null;
}

function getSummaryCartImage(product: CatalogProductSummary): string | null {
  if (product.primaryMedia?.cloudinarySecureUrl) {
    return product.primaryMedia.cloudinarySecureUrl;
  }

  return getPrimaryProductMediaFallback(product.slug)?.src ?? null;
}

function toCartProductInput(
  product: CatalogProductDetail | CatalogProductSummary
): CartProductInput {
  return {
    categoryName: product.category.name,
    currency: product.currency,
    imageUrl: "media" in product ? getCartImage(product) : getSummaryCartImage(product),
    name: product.name,
    productKind: product.productKind,
    productSlug: product.slug,
    unitPriceCents: product.priceCents ?? 0
  };
}

function getRecommendationSlugs(product: CatalogProductDetail): string[] {
  const productKind = product.productKind.trim().toLowerCase();

  if (productKind === "table") {
    return TABLE_RECOMMENDATION_SLUGS;
  }

  if (productKind === "paddle") {
    return PADDLE_RECOMMENDATION_SLUGS;
  }

  if (productKind === "ball") {
    return BALL_RECOMMENDATION_SLUGS;
  }

  if (productKind === "cover") {
    return COVER_RECOMMENDATION_SLUGS;
  }

  if (productKind === "net") {
    return NET_RECOMMENDATION_SLUGS;
  }

  return PADDLE_RECOMMENDATION_SLUGS;
}

async function loadRecommendedAddOns(product: CatalogProductDetail): Promise<CartProductInput[]> {
  let products: CatalogProductSummary[];

  try {
    products = await getProducts();
  } catch {
    return [];
  }

  const productsBySlug = new Map(
    products.map((catalogProduct) => [catalogProduct.slug, catalogProduct])
  );

  return getRecommendationSlugs(product)
    .filter((slug) => slug !== product.slug)
    .map((slug) => productsBySlug.get(slug))
    .filter((catalogProduct): catalogProduct is CatalogProductSummary =>
      Boolean(catalogProduct && isSummaryCheckoutEligible(catalogProduct))
    )
    .map(toCartProductInput)
    .slice(0, 4);
}

function ShippingTermsCopy({ priceCents }: { priceCents: number | null }) {
  return (
    <>
      {getV1ShippingMessage(priceCents)} <a href="/shipping">Shipping details</a>
    </>
  );
}

function getProductMetadataDescription(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string {
  const sourcedDescription = getCleanSourcedCopy(normalizedContent?.shortDescription);

  if (sourcedDescription) {
    return truncateMetaDescription(sourcedDescription);
  }

  const priceCopy =
    product.priceCents === null ? null : `${formatPrice(product.priceCents, product.currency)} CAD`;
  const fallbackDescription = [
    product.name,
    product.category.name,
    priceCopy,
    getV1ShippingMessage(product.priceCents)
  ]
    .filter(Boolean)
    .join(". ");

  return truncateMetaDescription(fallbackDescription);
}

function getCleanSourcedCopy(value: string | null | undefined): string | null {
  const copy = value?.replace(/\s+/g, " ").trim();

  if (!copy) {
    return null;
  }

  const normalizedCopy = copy.toLowerCase();
  const unsafeMarkers = [
    "candidate",
    "confirm",
    "missing/not visible",
    "review needed",
    "source-page",
    "verify whether"
  ];

  if (unsafeMarkers.some((marker) => normalizedCopy.includes(marker))) {
    return null;
  }

  return copy;
}

function truncateMetaDescription(description: string): string {
  if (description.length <= 155) {
    return description;
  }

  const truncated = description.slice(0, 152);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  return `${truncated.slice(0, lastSpaceIndex > 80 ? lastSpaceIndex : 152).trimEnd()}...`;
}

function getProductJsonLd(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null,
  mediaItems: ProductMediaGalleryItem[]
): ProductJsonLd {
  const jsonLd: ProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name
  };

  const brand = getCleanSourcedCopy(normalizedContent?.brand);
  const description = getCleanSourcedCopy(normalizedContent?.shortDescription);
  const image = mediaItems.map((mediaItem) => mediaItem.src).filter(isAbsoluteImageUrl);

  if (brand) {
    jsonLd.brand = {
      "@type": "Brand",
      name: brand
    };
  }

  if (product.category.name.trim()) {
    jsonLd.category = product.category.name.trim();
  }

  if (image.length > 0) {
    jsonLd.image = image;
  }

  if (description) {
    jsonLd.description = description;
  }

  if (product.priceCents !== null && product.priceCents > 0 && product.currency.trim()) {
    jsonLd.offers = {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: product.currency.trim().toUpperCase()
    };
  }

  return jsonLd;
}

function isAbsoluteImageUrl(src: string | null): src is string {
  return Boolean(src && /^https?:\/\//i.test(src));
}

function serializeJsonLd(jsonLd: ProductJsonLd): string {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}

function isPublicRecord(value: unknown): value is PublicRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getStringValue(record: PublicRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return null;
}

function getNumberValue(record: PublicRecord, key: string): number | null {
  const value = record[key];
  return typeof value === "number" ? value : null;
}

function getBooleanValue(record: PublicRecord, key: string): boolean | null {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function isPublicKey(key: string): boolean {
  const normalizedKey = key.toLowerCase();
  return !HIDDEN_PUBLIC_KEYS.some((hiddenKey) => normalizedKey.includes(hiddenKey.toLowerCase()));
}

function formatPublicPrimitive(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-CA").format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return null;
}

function formatOptionValue(value: unknown): string | null {
  const primitive = formatPublicPrimitive(value);

  if (primitive) {
    return primitive;
  }

  if (!isPublicRecord(value)) {
    return null;
  }

  const directLabel = getStringValue(value, ["label", "value", "name", "displayName"]);

  if (directLabel) {
    return directLabel;
  }

  const optionValue = value.productOptionValue;

  if (isPublicRecord(optionValue)) {
    return getStringValue(optionValue, ["label", "value", "name", "displayName"]);
  }

  return null;
}

function getVariantOptions(variant: PublicRecord): string {
  const optionValues = Array.isArray(variant.options)
    ? variant.options
    : Array.isArray(variant.optionValues)
      ? variant.optionValues
      : [];

  if (optionValues.length === 0) {
    return "Standard option";
  }

  const labels = optionValues
    .map((optionValue) => formatOptionValue(optionValue))
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(", ") : "Standard option";
}

function getVariantName(variant: unknown, index: number): string {
  if (!isPublicRecord(variant)) {
    return `Option ${index + 1}`;
  }

  return getStringValue(variant, ["name", "sku", "key"]) ?? `Option ${index + 1}`;
}

function renderPublicFields(record: PublicRecord): Array<{ key: string; value: string }> {
  return Object.entries(record)
    .filter(([key]) => isPublicKey(key))
    .map(([key, value]) => {
      const primitive = formatPublicPrimitive(value);

      if (primitive) {
        return {
          key,
          value: primitive
        };
      }

      return null;
    })
    .filter((field): field is { key: string; value: string } => Boolean(field));
}

function ProductFacts({ product }: { product: CatalogProductDetail }) {
  return (
    <dl className={styles.factList}>
      <div>
        <dt>Category</dt>
        <dd>{product.category.name}</dd>
      </div>
      <div>
        <dt>Lineup</dt>
        <dd>{product.family.name}</dd>
      </div>
      <div>
        <dt>Product type</dt>
        <dd>{formatLabel(product.productKind)}</dd>
      </div>
      <div>
        <dt>Shipping</dt>
        <dd className={styles.shippingFact}>
          <ShippingTermsCopy priceCents={product.priceCents} />
        </dd>
      </div>
    </dl>
  );
}

function VariantsSection({
  product,
  variants
}: {
  product: CatalogProductDetail;
  variants: unknown[];
}) {
  if (variants.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="product-options-title">
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Choices</p>
        <h2 id="product-options-title">Available options.</h2>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.variantTable}>
          <thead>
            <tr>
              <th scope="col">Option</th>
              <th scope="col">SKU</th>
              <th scope="col">Price</th>
              <th scope="col">Availability</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => {
              const record = isPublicRecord(variant) ? variant : null;
              const priceCents = record ? getNumberValue(record, "priceCents") : null;
              const currency = record ? getStringValue(record, ["currency"]) : null;
              const isActive = record ? getBooleanValue(record, "isActive") : null;

              return (
                <tr key={record ? (getStringValue(record, ["key", "sku"]) ?? index) : index}>
                  <td>{getVariantName(variant, index)}</td>
                  <td>
                    {record
                      ? (getStringValue(record, ["sku"]) ?? "SKU coming soon")
                      : "SKU coming soon"}
                  </td>
                  <td>
                    {priceCents === null
                      ? formatPrice(product.priceCents, product.currency)
                      : formatPrice(priceCents, currency ?? product.currency)}
                  </td>
                  <td>{isActive === false ? "Unavailable" : "Available"}</td>
                  <td>{record ? getVariantOptions(record) : "Standard option"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HighlightsSection({ sections }: { sections: unknown[] | undefined }) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="product-highlights-title">
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Highlights</p>
        <h2 id="product-highlights-title">Why it stands out.</h2>
      </div>
      <div className={styles.storyGrid}>
        {sections.map((section, index) => {
          const record = isPublicRecord(section) ? section : null;
          const heading = record
            ? getStringValue(record, ["heading", "title", "sectionType", "eyebrow"])
            : null;
          const body = record ? getStringValue(record, ["body", "description"]) : null;

          return (
            <article key={heading ?? index}>
              <h3>{heading ? formatLabel(heading) : `Highlight ${index + 1}`}</h3>
              {body ? <p>{body}</p> : <p>More detail is being prepared for this highlight.</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SpecGroups({ specGroups }: { specGroups: unknown[] | undefined }) {
  if (!specGroups || specGroups.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="product-specs-title">
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>Specifications</p>
        <h2 id="product-specs-title">Details for comparison.</h2>
      </div>
      <div className={styles.storyGrid}>
        {specGroups.map((group, index) => {
          const record = isPublicRecord(group) ? group : null;
          const name = record ? getStringValue(record, ["name", "heading", "key"]) : null;
          const specs = record && Array.isArray(record.specs) ? record.specs : [];

          return (
            <article key={name ?? index}>
              <h3>{name ? formatLabel(name) : `Specification group ${index + 1}`}</h3>
              {specs.length > 0 ? (
                <dl className={styles.fieldList}>
                  {specs.map((spec, specIndex) => {
                    const specRecord = isPublicRecord(spec) ? spec : null;
                    const specName = specRecord
                      ? getStringValue(specRecord, ["name", "label", "key"])
                      : null;
                    const specValue = specRecord
                      ? (getStringValue(specRecord, ["value"]) ??
                        formatPublicPrimitive(specRecord.value))
                      : null;
                    const unit = specRecord ? getStringValue(specRecord, ["unit"]) : null;

                    return (
                      <div key={specName ?? specIndex}>
                        <dt>{specName ? formatLabel(specName) : `Detail ${specIndex + 1}`}</dt>
                        <dd>{[specValue ?? "Coming soon", unit].filter(Boolean).join(" ")}</dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p>More specifications are being prepared.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Relationships({ relationships }: { relationships: Record<string, unknown> | undefined }) {
  if (!relationships || Object.keys(relationships).length === 0) {
    return null;
  }

  const fields = renderPublicFields(relationships);

  if (fields.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="product-details-title">
      <div className={styles.sectionHeader}>
        <p className={styles.eyebrow}>More details</p>
        <h2 id="product-details-title">Useful product notes.</h2>
      </div>
      <dl className={styles.fieldList}>
        {fields.map((field) => (
          <div key={field.key}>
            <dt>{formatLabel(field.key)}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <>
      <PublicStorefrontNav activeItem="catalog" />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/catalog">Back to catalog</a>
        </div>
        <section className={styles.error} role="status">
          <strong>We could not load this product.</strong>
          <span>{error}</span>
        </section>
      </main>
    </>
  );
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { product, error } = await loadProduct(params.slug);

  if (error || !product) {
    return <ErrorState error={error ?? "Product details are temporarily unavailable."} />;
  }

  const variants = product.variants ?? [];
  const isCheckoutEligible = isProductCheckoutEligible(product);
  const descriptionCopy = getProductDescriptionCopy(product);
  const shortDescription = getProductShortCopy(product);
  const recommendedProducts = await loadRecommendedAddOns(product);
  const checkoutOptionGroups = getCheckoutOptionGroups(product);
  const mediaItems = getMediaItems(product);
  const normalizedContent = getProductContentBySlug(product.slug);
  const productJsonLd = getProductJsonLd(product, normalizedContent, mediaItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productJsonLd)
        }}
      />
      <PublicStorefrontNav activeItem="catalog" />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/catalog">Back to catalog</a>
        </div>

        <section className={styles.productHero} aria-labelledby="product-title">
          <ProductMediaGallery
            categoryName={product.category.name}
            mediaItems={mediaItems}
            productName={product.name}
          />

          <aside className={styles.purchasePanel} aria-label={`${product.name} purchase panel`}>
            <p className={styles.eyebrow}>{product.category.name}</p>
            <h1 className={styles.title} id="product-title">
              {product.name}
            </h1>

            <div className={styles.priceRow}>
              <strong>{formatPrice(product.priceCents, product.currency)}</strong>
              <span>{shortDescription}</span>
            </div>

            <div className={styles.shippingNote}>
              <strong>{V1_FREE_SHIPPING_COPY}</strong>
              <span>
                {V1_FLAT_RATE_SHIPPING_COPY} {V1_IN_STOCK_HANDLING_COPY}
              </span>
            </div>

            <div className={styles.checkoutPanel}>
              <h2>Add to cart</h2>
              <CheckoutButton
                isCheckoutEligible={isCheckoutEligible}
                product={toCartProductInput(product)}
                productOptions={checkoutOptionGroups}
                recommendedProducts={recommendedProducts}
              />
            </div>

            <ProductFacts product={product} />

            <div className={styles.supportNote}>
              <strong>Questions before checkout?</strong>
              <span>Contact us with the product name for product, shipping, or setup help.</span>
              <a href="/contact">Contact support</a>
            </div>
          </aside>
        </section>

        <section className={styles.descriptionBand} aria-labelledby="product-description-title">
          <p className={styles.eyebrow}>Product story</p>
          <h2 id="product-description-title">Built for the next match.</h2>
          <p>{descriptionCopy}</p>
        </section>

        <VariantsSection product={product} variants={variants} />
        <SpecGroups specGroups={product.specGroups} />
        <HighlightsSection sections={product.contentSections} />
        <Relationships relationships={product.relationships} />
      </main>
    </>
  );
}
