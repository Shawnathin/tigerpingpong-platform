import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicStorefrontFooter } from "../../../PublicStorefrontFooter";
import { PublicStorefrontNav, type PublicStorefrontNavItem } from "../../../PublicStorefrontNav";
import { CatalogApiError, getProductBySlug, getProducts } from "../../../../lib/catalog-api";
import type { CartProductInput } from "../../../../lib/cart";
import {
  normalizeMediaSrc,
  resolveProductMediaUrl
} from "../../../../lib/product-media";
import {
  getProductMediaFallbacks,
  getPrimaryProductMediaFallback
} from "../../../../lib/public-storefront-demo";
import {
  getV1ShippingMessage,
  V1_FLAT_RATE_SHIPPING_COPY,
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
import {
  EverydayDetailsSection,
  FeatureHighlightsSection,
  ProductFamilySwitcher,
  ProductStorySection,
  QuickFactsSection,
  SpecsGridSection,
  TABLE_COMPARISON_PRODUCT_SLUGS,
  TableComparisonSection
} from "./ProductDetailSections";
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

function isSummaryPublicProduct(product: CatalogProductSummary): boolean {
  return (
    product.v1PublicNavigation &&
    !hasReplacementPartsMarker(product.productKind, product.key, product.slug, product.name) &&
    !isReplacementPartsSummary(product.category) &&
    !isReplacementPartsSummary(product.family)
  );
}

function isDetailPublicProduct(product: CatalogProductDetail): boolean {
  return product.v1PublicNavigation && !isReplacementPartsProduct(product);
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

function getProductNavItem(product: CatalogProductDetail): PublicStorefrontNavItem {
  const kind = product.productKind.toLowerCase().replace(/[_\s]+/g, "-");

  if (kind === "paddle") {
    return "paddles";
  }

  if (kind === "ball") {
    return "balls";
  }

  if (kind === "cover" || kind === "net") {
    return "accessories";
  }

  return "tables";
}

function getMediaItems(product: CatalogProductDetail): ProductMediaGalleryItem[] {
  const sortedCatalogMedia = [...product.media].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );
  const cloudinaryMediaItems: ProductMediaGalleryItem[] = [];

  for (const media of sortedCatalogMedia) {
    const src = resolveProductMediaUrl(media, product.slug);

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

  if (uniqueCloudinaryMediaItems.length > 0) {
    return uniqueCloudinaryMediaItems;
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
  if (product.primaryMedia) {
    const mediaUrl = resolveProductMediaUrl(product.primaryMedia, product.slug);

    if (mediaUrl) {
      return mediaUrl;
    }
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
  const productKind = normalizeOptionKey(product.productKind);

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

function getPurchaseShippingLines(product: CatalogProductDetail): string[] {
  const qualifiesForFreeShipping = product.priceCents !== null && product.priceCents > 10000;
  const isTable = normalizeOptionKey(product.productKind) === "table";

  if (qualifiesForFreeShipping) {
    return [
      isTable
        ? "Tables typically leave the warehouse in about 24 business hours."
        : V1_IN_STOCK_HANDLING_COPY,
      "Free Canada-wide shipping included."
    ];
  }

  return [V1_IN_STOCK_HANDLING_COPY, V1_FLAT_RATE_SHIPPING_COPY];
}

async function loadCatalogProductSummaries(): Promise<CatalogProductSummary[]> {
  try {
    return getProducts();
  } catch {
    return [];
  }
}

function getRecommendedAddOns(
  product: CatalogProductDetail,
  products: CatalogProductSummary[]
): CartProductInput[] {
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

async function loadTableComparisonProducts(
  product: CatalogProductDetail,
  publicProducts: CatalogProductSummary[]
): Promise<CatalogProductDetail[]> {
  if (normalizeOptionKey(product.productKind) !== "table") {
    return [];
  }

  const publicProductSlugs = new Set(publicProducts.map((catalogProduct) => catalogProduct.slug));
  const tableSlugs = TABLE_COMPARISON_PRODUCT_SLUGS.filter(
    (slug) => slug === product.slug || publicProductSlugs.has(slug)
  );
  const products = await Promise.all(
    tableSlugs.map(async (slug) => {
      if (slug === product.slug) {
        return product;
      }

      try {
        return await getProductBySlug(slug);
      } catch {
        return null;
      }
    })
  );

  return products.filter((tableProduct): tableProduct is CatalogProductDetail =>
    Boolean(
      tableProduct &&
      normalizeOptionKey(tableProduct.productKind) === "table" &&
      isDetailPublicProduct(tableProduct)
    )
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

function getHeroSummary(
  product: CatalogProductDetail,
  normalizedContent: NormalizedProductContent | null
): string {
  return (
    getCleanSourcedCopy(normalizedContent?.shortDescription) ??
    getCleanSourcedCopy(product.shortDescription) ??
    [formatLabel(product.productKind), product.family.name].filter(Boolean).join(" · ")
  );
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

function ErrorState({ error }: { error: string }) {
  return (
    <>
      <PublicStorefrontNav activeItem="tables" />
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

  const isCheckoutEligible = isProductCheckoutEligible(product);
  const checkoutOptionGroups = getCheckoutOptionGroups(product);
  const mediaItems = getMediaItems(product);
  const normalizedContent = getProductContentBySlug(product.slug);
  const catalogProducts = await loadCatalogProductSummaries();
  const publicProducts = catalogProducts.filter(isSummaryPublicProduct);
  const recommendedProducts = getRecommendedAddOns(product, publicProducts);
  const tableComparisonProducts = await loadTableComparisonProducts(product, publicProducts);
  const heroSummary = getHeroSummary(product, normalizedContent);
  const productJsonLd = getProductJsonLd(product, normalizedContent, mediaItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productJsonLd)
        }}
      />
      <PublicStorefrontNav activeItem={getProductNavItem(product)} />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/catalog">Back to catalog</a>
        </div>

        <ProductFamilySwitcher product={product} products={publicProducts} />

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
              <span>{heroSummary}</span>
            </div>

            <div className={styles.shippingNote}>
              <strong>In stock and ready to ship.</strong>
              {getPurchaseShippingLines(product).map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>

            <div className={styles.checkoutPanel}>
              <CheckoutButton
                isCheckoutEligible={isCheckoutEligible}
                product={toCartProductInput(product)}
                productOptions={checkoutOptionGroups}
                recommendedProducts={recommendedProducts}
              />
            </div>
          </aside>
        </section>

        <QuickFactsSection normalizedContent={normalizedContent} product={product} />
        <ProductStorySection normalizedContent={normalizedContent} product={product} />
        <FeatureHighlightsSection normalizedContent={normalizedContent} product={product} />
        <EverydayDetailsSection normalizedContent={normalizedContent} product={product} />
        <SpecsGridSection normalizedContent={normalizedContent} product={product} />
        <TableComparisonSection currentSlug={product.slug} products={tableComparisonProducts} />
      </main>
      <PublicStorefrontFooter />
    </>
  );
}
