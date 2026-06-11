import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicStorefrontNav } from "../../../PublicStorefrontNav";
import { CatalogApiError, getProductBySlug } from "../../../../lib/catalog-api";
import { getV1ShippingMessage } from "../../../../lib/shipping";
import type {
  CatalogProductDetail,
  CatalogSummary,
  ProductMediaSummary
} from "../../../../types/catalog";

import { CheckoutButton } from "./CheckoutButton";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product Detail | Tiger Ping Pong",
  description: "Tiger Ping Pong public product detail and checkout page."
};

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

function getMediaLabel(media: ProductMediaSummary, fallback: string): string {
  const mediaText = [media.altText, media.title].filter(Boolean).join(" / ");
  return mediaText || media.caption || fallback;
}

function getMediaItems(product: CatalogProductDetail): ProductMediaSummary[] {
  return product.media.length > 0
    ? [...product.media].sort((left, right) => left.sortOrder - right.sortOrder)
    : [
        {
          mediaKey: `${product.key}-pending`,
          role: "primary",
          cloudinarySecureUrl: null,
          altText: `${product.name} image pending`,
          title: product.name,
          caption: null,
          sortOrder: 0,
          isPrimary: true
        }
      ];
}

function ShippingTermsCopy({ priceCents }: { priceCents: number | null }) {
  return (
    <>
      {getV1ShippingMessage(priceCents)} <a href="/shipping">Shipping details</a>
    </>
  );
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
  const optionValues = variant.optionValues;

  if (!Array.isArray(optionValues) || optionValues.length === 0) {
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

      if (Array.isArray(value) && value.length > 0) {
        return {
          key,
          value: `${value.length} item${value.length === 1 ? "" : "s"}`
        };
      }

      return null;
    })
    .filter((field): field is { key: string; value: string } => Boolean(field));
}

function ProductMediaGallery({ product }: { product: CatalogProductDetail }) {
  const mediaItems = getMediaItems(product);
  const heroMedia = mediaItems[0];
  const label = getMediaLabel(heroMedia, `${product.name} image pending`);
  const thumbnails = mediaItems.slice(1, 5);

  return (
    <div className={styles.gallery}>
      <figure className={styles.mainMedia}>
        {heroMedia.cloudinarySecureUrl ? (
          <img src={heroMedia.cloudinarySecureUrl} alt={heroMedia.altText ?? product.name} />
        ) : (
          <div className={styles.mediaPlaceholder} aria-label={label}>
            <span>{product.category.name}</span>
            <strong>{product.name}</strong>
          </div>
        )}
        <figcaption>{label}</figcaption>
      </figure>

      {thumbnails.length > 0 ? (
        <div className={styles.thumbnailGrid} aria-label="More product images">
          {thumbnails.map((media) => {
            const thumbnailLabel = getMediaLabel(media, product.name);

            return (
              <figure className={styles.thumbnail} key={media.mediaKey}>
                {media.cloudinarySecureUrl ? (
                  <img src={media.cloudinarySecureUrl} alt={media.altText ?? product.name} />
                ) : (
                  <div className={styles.thumbnailPlaceholder} aria-label={thumbnailLabel} />
                )}
                <figcaption>{formatLabel(media.role)}</figcaption>
              </figure>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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

  return (
    <>
      <PublicStorefrontNav activeItem="catalog" />
      <main className={styles.page}>
        <div className={styles.backBar}>
          <a href="/catalog">Back to catalog</a>
        </div>

        <section className={styles.productHero} aria-labelledby="product-title">
          <ProductMediaGallery product={product} />

          <aside className={styles.purchasePanel} aria-label={`${product.name} purchase panel`}>
            <p className={styles.eyebrow}>{product.category.name}</p>
            <h1 className={styles.title} id="product-title">
              {product.name}
            </h1>

            <div className={styles.priceRow}>
              <strong>{formatPrice(product.priceCents, product.currency)}</strong>
              <span>
                {product.shortDescription ?? `Part of the ${product.family.name} lineup.`}
              </span>
            </div>

            <div className={styles.shippingNote}>
              <strong>
                {product.priceCents !== null && product.priceCents > 10000
                  ? "Free shipping across Canada."
                  : "Free shipping on orders over $100."}
              </strong>
              <span>Canada only. Orders $100 CAD or under use $15 flat-rate shipping.</span>
            </div>

            <div className={styles.checkoutPanel}>
              <h2>Checkout</h2>
              <CheckoutButton isCheckoutEligible={isCheckoutEligible} productSlug={product.slug} />
            </div>

            <ProductFacts product={product} />
          </aside>
        </section>

        {product.description ? (
          <section className={styles.descriptionBand} aria-labelledby="product-description-title">
            <p className={styles.eyebrow}>Product story</p>
            <h2 id="product-description-title">Built for the next match.</h2>
            <p>{product.description}</p>
          </section>
        ) : null}

        <VariantsSection product={product} variants={variants} />
        <SpecGroups specGroups={product.specGroups} />
        <HighlightsSection sections={product.contentSections} />
        <Relationships relationships={product.relationships} />
      </main>
    </>
  );
}
