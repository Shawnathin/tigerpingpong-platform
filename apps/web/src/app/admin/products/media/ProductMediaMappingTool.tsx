"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  AdminProductListItem,
  AdminProductMediaItem,
  AdminProductMediaResponse
} from "../../../../lib/admin-api";
import { formatBoolean, formatNullable, formatStatus } from "../../admin-format";
import styles from "../../admin.module.css";

import { addMediaMapping, unassignMediaMapping, updateMediaMapping } from "./actions";

const MEDIA_ROLES = ["primary", "gallery", "detail", "lifestyle", "variant", "source_reference"];

interface ProductMediaResource {
  data: AdminProductMediaResponse | null;
  error: {
    message: string;
    selectedProductId: string;
    status: number | null;
  } | null;
}

interface ProductMediaMappingToolProps {
  mediaResource: ProductMediaResource;
  products: AdminProductListItem[];
  selectedProductId: string | null;
}

export function ProductMediaMappingTool({
  mediaResource,
  products,
  selectedProductId
}: ProductMediaMappingToolProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) =>
      [product.name, product.slug, product.key, product.sku ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery, products]);
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null;
  const mediaData = mediaResource.data;

  return (
    <>
      <section className={styles.panel} aria-labelledby="admin-product-media-select-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 id="admin-product-media-select-title">Select product</h2>
          </div>
        </div>

        <form className={styles.controlGrid} method="get">
          <label className={styles.field}>
            <span>Search</span>
            <input
              name="productSearch"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, slug, SKU"
              type="search"
              value={query}
            />
          </label>
          <label className={styles.field}>
            <span>Product</span>
            <select defaultValue={selectedProductId ?? ""} name="productId">
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} / {product.slug}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.fieldAction}>
            <button className={styles.primaryButton} type="submit">
              Load
            </button>
          </div>
        </form>
      </section>

      {mediaResource.error ? (
        <section className={styles.panel} aria-labelledby="admin-product-media-load-error-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="admin-product-media-load-error-title">Current media</h2>
              <p>{mediaResource.error.message}</p>
            </div>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>Unavailable</span>
          </div>
          <div className={styles.alert}>
            <p>
              {mediaResource.error.status === 404
                ? "The selected product may be stale or no longer available in this catalog."
                : "Confirm the API service is reachable and the selected product can be loaded."}
            </p>
            <p className={styles.muted}>
              Selected product ID:{" "}
              <span className={styles.mono}>{mediaResource.error.selectedProductId}</span>
            </p>
          </div>
        </section>
      ) : null}

      {mediaData ? (
        <>
          <section className={styles.panel} aria-labelledby="admin-product-media-current-title">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="admin-product-media-current-title">Current media rows</h2>
                <p>
                  {mediaData.product.name} / {mediaData.product.slug}
                </p>
              </div>
              <span className={styles.badge}>{mediaData.media.length} rows</span>
            </div>

            {mediaData.media.length > 0 ? (
              <div className={styles.mediaRows}>
                {mediaData.media.map((media) => (
                  <MediaMappingForm key={media.id} media={media} productId={mediaData.product.id} />
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No media rows are assigned to this product.</p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="admin-product-media-add-title">
            <div className={styles.panelHeader}>
              <div>
                <h2 id="admin-product-media-add-title">Add media mapping</h2>
                <p>Use a Cloudinary public ID when available, or paste a secure delivery URL.</p>
              </div>
              <span className={styles.badge}>Existing assets only</span>
            </div>
            <MediaMappingForm productId={mediaData.product.id} />
          </section>
        </>
      ) : !mediaResource.error && selectedProduct ? (
        <section className={styles.panel} aria-labelledby="admin-product-media-empty-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="admin-product-media-empty-title">Current media rows</h2>
              <p>{selectedProduct.name}</p>
            </div>
            <span className={styles.badge}>No selection</span>
          </div>
        </section>
      ) : !mediaResource.error && selectedProductId ? (
        <section className={styles.panel} aria-labelledby="admin-product-media-stale-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="admin-product-media-stale-title">Current media rows</h2>
              <p>The selected product is not in the current product list.</p>
            </div>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>Stale selection</span>
          </div>
          <div className={styles.alert}>
            <p>Choose a product from the list above to load media mappings.</p>
          </div>
        </section>
      ) : null}
    </>
  );
}

function MediaMappingForm({
  media,
  productId
}: {
  media?: AdminProductMediaItem;
  productId: string;
}) {
  const action = media ? updateMediaMapping : addMediaMapping;

  return (
    <div className={styles.mediaRow}>
      <MediaPreview media={media} />

      <form action={action} className={styles.mediaForm}>
        <input name="productId" type="hidden" value={productId} />
        {media ? <input name="mediaId" type="hidden" value={media.id} /> : null}

        {media ? (
          <div className={styles.mediaMeta}>
            <div>
              <span>Media key</span>
              <strong className={styles.mono}>{media.mediaKey}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>
                {formatStatus(media.reviewStatus)} / active {formatBoolean(media.isActive)}
              </strong>
            </div>
          </div>
        ) : null}

        <div className={styles.controlGrid}>
          <label className={styles.field}>
            <span>Cloudinary public ID</span>
            <input
              defaultValue={media?.cloudinaryPublicId ?? ""}
              name="cloudinaryPublicId"
              placeholder="tigerpingpong/products/product-slug/01-main"
            />
          </label>
          <label className={styles.field}>
            <span>Cloudinary secure URL</span>
            <input
              defaultValue={media?.cloudinarySecureUrl ?? ""}
              name="cloudinarySecureUrl"
              placeholder="https://res.cloudinary.com/..."
              type="url"
            />
          </label>
          <label className={styles.field}>
            <span>Role</span>
            <select defaultValue={media?.role ?? "gallery"} name="role">
              {MEDIA_ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatStatus(role)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>Order</span>
            <input
              defaultValue={media?.sortOrder ?? 0}
              max={999}
              min={0}
              name="sortOrder"
              type="number"
            />
          </label>
          <label className={styles.field}>
            <span>Title</span>
            <input defaultValue={media?.title ?? ""} name="title" />
          </label>
          <label className={styles.field}>
            <span>Alt text</span>
            <input defaultValue={media?.altText ?? ""} name="altText" />
          </label>
        </div>

        <label className={styles.textAreaField}>
          <span>Caption</span>
          <textarea defaultValue={media?.caption ?? ""} name="caption" rows={2} />
        </label>

        {media ? (
          <dl className={styles.compactDefinitionList}>
            <div>
              <dt>Public ID</dt>
              <dd className={styles.mono}>{formatNullable(media.cloudinaryPublicId)}</dd>
            </div>
            <div>
              <dt>Secure URL</dt>
              <dd className={styles.mono}>{formatNullable(media.cloudinarySecureUrl)}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{formatStatus(media.sourceProvider)}</dd>
            </div>
            <div>
              <dt>Primary</dt>
              <dd>{formatBoolean(media.isPrimary)}</dd>
            </div>
          </dl>
        ) : null}

        <div className={styles.formActions}>
          <label className={styles.checkboxField}>
            <input defaultChecked={media?.isPrimary ?? false} name="isPrimary" type="checkbox" />
            <span>Primary image</span>
          </label>
          <button className={styles.primaryButton} type="submit">
            {media ? "Save row" : "Add row"}
          </button>
        </div>
      </form>

      {media ? (
        <form action={unassignMediaMapping} className={styles.unassignForm}>
          <input name="productId" type="hidden" value={productId} />
          <input name="mediaId" type="hidden" value={media.id} />
          <button className={styles.secondaryButton} type="submit">
            Unassign
          </button>
        </form>
      ) : null}
    </div>
  );
}

function MediaPreview({ media }: { media?: AdminProductMediaItem }) {
  const [failed, setFailed] = useState(false);
  const previewUrl = failed ? null : media?.previewUrl;

  useEffect(() => {
    if (!media?.previewUrl) {
      return;
    }

    setFailed(false);

    const probe = new Image();

    probe.onload = () => {
      if (probe.naturalWidth === 0) {
        setFailed(true);
      }
    };
    probe.onerror = () => setFailed(true);
    probe.src = media.previewUrl;
  }, [media?.previewUrl]);

  return (
    <div className={styles.mediaPreview}>
      {previewUrl ? (
        <img
          alt={media?.altText ?? media?.title ?? media?.mediaKey ?? "Product media preview"}
          onError={() => setFailed(true)}
          src={previewUrl}
        />
      ) : (
        <div className={styles.mediaPreviewPlaceholder}>No preview</div>
      )}
    </div>
  );
}
