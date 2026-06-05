import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogApiError, getProductBySlug } from "../../../../lib/catalog-api";
import type {
  CatalogProductDetail,
  CatalogSummary,
  ProductMediaSummary
} from "../../../../types/catalog";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product Detail | Tiger Ping Pong Platform",
  description: "Minimal Tiger Ping Pong public product detail skeleton."
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
      error: formatError(error)
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

function formatError(error: unknown): string {
  if (error instanceof CatalogApiError) {
    return `${error.message} (${error.url})`;
  }

  return error instanceof Error ? error.message : "Catalog API request failed.";
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

function formatPrice(priceCents: number | null, currency: string): string {
  if (priceCents === null) {
    return "Price pending";
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
    return "Options pending";
  }

  const labels = optionValues
    .map((optionValue) => formatOptionValue(optionValue))
    .filter((label): label is string => Boolean(label));

  return labels.length > 0 ? labels.join(", ") : "Options returned";
}

function getVariantName(variant: unknown, index: number): string {
  if (!isPublicRecord(variant)) {
    return `Variant ${index + 1}`;
  }

  return getStringValue(variant, ["name", "sku", "key"]) ?? `Variant ${index + 1}`;
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

      if (Array.isArray(value)) {
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
  return (
    <div className={styles.mediaGrid}>
      {getMediaItems(product).map((media) => {
        const label = getMediaLabel(media, `${product.name} image pending`);

        return (
          <figure className={styles.mediaItem} key={media.mediaKey}>
            {media.cloudinarySecureUrl ? (
              <img src={media.cloudinarySecureUrl} alt={media.altText ?? product.name} />
            ) : (
              <div className={styles.mediaPlaceholder} aria-label={label}>
                <span>Image pending</span>
                <small>{label}</small>
              </div>
            )}
            <figcaption>
              <strong>{formatLabel(media.role)}</strong>
              <span>{label}</span>
              {media.isPrimary ? <small>Primary media</small> : null}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function ProductFacts({ product }: { product: CatalogProductDetail }) {
  return (
    <dl className={styles.factList}>
      <div>
        <dt>Slug</dt>
        <dd>{product.slug}</dd>
      </div>
      <div>
        <dt>Product kind</dt>
        <dd>{formatLabel(product.productKind)}</dd>
      </div>
      <div>
        <dt>Purchase mode</dt>
        <dd>{formatLabel(product.purchaseMode)}</dd>
      </div>
      <div>
        <dt>Category</dt>
        <dd>{product.category.name}</dd>
      </div>
      <div>
        <dt>Family</dt>
        <dd>{product.family.name}</dd>
      </div>
      <div>
        <dt>Freight details</dt>
        <dd>
          {product.shippingReviewRequired
            ? "Freight details confirmed before checkout"
            : "Standard product detail pending"}
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
    <section className={styles.section} aria-labelledby="product-variants-title">
      <div className={styles.sectionHeader}>
        <h2 id="product-variants-title">Variants</h2>
        <span>{variants.length} returned</span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.variantTable}>
          <thead>
            <tr>
              <th scope="col">Variant</th>
              <th scope="col">SKU</th>
              <th scope="col">Price</th>
              <th scope="col">Purchase mode</th>
              <th scope="col">Status</th>
              <th scope="col">Options</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant, index) => {
              const record = isPublicRecord(variant) ? variant : null;
              const priceCents = record ? getNumberValue(record, "priceCents") : null;
              const currency = record ? getStringValue(record, ["currency"]) : null;
              const purchaseMode = record
                ? getStringValue(record, ["purchaseModeOverride", "purchaseMode"])
                : null;
              const isActive = record ? getBooleanValue(record, "isActive") : null;

              return (
                <tr key={record ? (getStringValue(record, ["key", "sku"]) ?? index) : index}>
                  <td>{getVariantName(variant, index)}</td>
                  <td>
                    {record ? (getStringValue(record, ["sku"]) ?? "SKU pending") : "SKU pending"}
                  </td>
                  <td>
                    {priceCents === null
                      ? "Uses product price"
                      : formatPrice(priceCents, currency ?? product.currency)}
                  </td>
                  <td>{purchaseMode ? formatLabel(purchaseMode) : "Uses product purchase mode"}</td>
                  <td>{isActive === null ? "Status pending" : isActive ? "Active" : "Inactive"}</td>
                  <td>{record ? getVariantOptions(record) : "Options returned"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContentSections({ sections }: { sections: unknown[] | undefined }) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="product-content-title">
      <div className={styles.sectionHeader}>
        <h2 id="product-content-title">Content Sections</h2>
        <span>{sections.length} returned</span>
      </div>
      <div className={styles.simpleList}>
        {sections.map((section, index) => {
          const record = isPublicRecord(section) ? section : null;
          const heading = record
            ? getStringValue(record, ["heading", "title", "sectionType", "eyebrow"])
            : null;
          const body = record ? getStringValue(record, ["body", "description"]) : null;

          return (
            <article key={heading ?? index}>
              <h3>{heading ? formatLabel(heading) : `Section ${index + 1}`}</h3>
              {body ? <p>{body}</p> : <p>Content details returned by API.</p>}
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
        <h2 id="product-specs-title">Specs</h2>
        <span>{specGroups.length} groups returned</span>
      </div>
      <div className={styles.simpleList}>
        {specGroups.map((group, index) => {
          const record = isPublicRecord(group) ? group : null;
          const name = record ? getStringValue(record, ["name", "heading", "key"]) : null;
          const specs = record && Array.isArray(record.specs) ? record.specs : [];

          return (
            <article key={name ?? index}>
              <h3>{name ?? `Spec group ${index + 1}`}</h3>
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
                        <dt>{specName ?? `Spec ${specIndex + 1}`}</dt>
                        <dd>{[specValue ?? "Value returned", unit].filter(Boolean).join(" ")}</dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p>Spec group returned by API.</p>
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

  return (
    <section className={styles.section} aria-labelledby="product-relationships-title">
      <div className={styles.sectionHeader}>
        <h2 id="product-relationships-title">Relationships</h2>
      </div>
      <dl className={styles.fieldList}>
        {renderPublicFields(relationships).map((field) => (
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
    <main className={styles.page}>
      <div className={styles.backBar}>
        <a href="/catalog">Back to catalog</a>
      </div>
      <section className={styles.error} role="status">
        <strong>Product detail failed.</strong>
        <span>{error}</span>
      </section>
    </main>
  );
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { product, error } = await loadProduct(params.slug);

  if (error || !product) {
    return <ErrorState error={error ?? "Product was not returned by the catalog API."} />;
  }

  const variants = product.variants ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.backBar}>
        <a href="/catalog">Back to catalog</a>
      </div>

      <section className={styles.header} aria-labelledby="product-title">
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>TigerPingPong.ca product</p>
          <h1 className={styles.title} id="product-title">
            {product.name}
          </h1>
          <div className={styles.headerMeta}>
            <strong>{formatPrice(product.priceCents, product.currency)}</strong>
            <span>{product.category.name}</span>
            <span>{product.family.name}</span>
          </div>
          {product.shortDescription ? (
            <p className={styles.summary}>{product.shortDescription}</p>
          ) : null}
        </div>
        {product.shippingReviewRequired ? (
          <span className={styles.shippingBadge}>Freight details confirmed before checkout</span>
        ) : null}
      </section>

      <section className={styles.mediaSection} aria-labelledby="product-media-title">
        <div className={styles.sectionHeader}>
          <h2 id="product-media-title">Media</h2>
          <span>{product.media.length} records</span>
        </div>
        <ProductMediaGallery product={product} />
      </section>

      <section className={styles.detailGrid} aria-label="Product detail summary">
        <div className={styles.detailPanel}>
          <h2>Product Details</h2>
          <ProductFacts product={product} />
        </div>

        <div className={styles.detailPanel}>
          <h2>V1 Checkout</h2>
          <p>Checkout connection planned for V1.</p>
          <p>No cart, checkout, Stripe link, or payment flow is live on this page.</p>
        </div>
      </section>

      {product.description ? (
        <section className={styles.section} aria-labelledby="product-description-title">
          <div className={styles.sectionHeader}>
            <h2 id="product-description-title">Description</h2>
          </div>
          <p className={styles.description}>{product.description}</p>
        </section>
      ) : null}

      <VariantsSection product={product} variants={variants} />
      <SpecGroups specGroups={product.specGroups} />
      <ContentSections sections={product.contentSections} />
      <Relationships relationships={product.relationships} />
    </main>
  );
}
