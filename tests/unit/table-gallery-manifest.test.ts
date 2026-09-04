import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { getTigerTableVariantSelectorMedia } from "../../apps/web/src/lib/tiger-story";

interface ManifestAsset {
  catalogApplyEligible?: boolean;
  cloudinary: {
    assetId: string;
    publicId: string;
    secureUrl: string;
  };
  localPublicPath?: string;
  mediaKey: string;
  modelVerification: string;
  qualityStatus: string;
  rightsStatus: string;
  role: string;
  sortOrder: number;
  source: { height: number; type: string; width: number };
  uploadAction: string;
  variantKey: string | null;
}

interface ManifestProduct {
  approvedVariantKeys: string[];
  assets: ManifestAsset[];
  catalogLeadVariantKey: string;
  productSlug: string;
}

const manifest = JSON.parse(
  readFileSync(path.resolve("data/media/table-product-gallery-manifest-v1.json"), "utf8")
) as {
  delivery: { minimumUsefulSourceEdge: number; widths: number[] };
  products: ManifestProduct[];
  safety: { productionCatalogWritten: boolean };
};

describe("table gallery media manifest", () => {
  it("locks the five approved tables and responsive widths", () => {
    expect(manifest.products.map(({ productSlug }) => productSlug)).toEqual([
      "tiger-expo-outdoor-table",
      "tiger-portland-indoor-table",
      "tiger-portland-outdoor-table",
      "tiger-whistler-indoor-table",
      "tiger-plaza-outdoor-table-grey"
    ]);
    expect(manifest.delivery.widths).toEqual([480, 800, 1200, 1600]);
    expect(manifest.safety.productionCatalogWritten).toBe(false);
  });

  it("starts each full gallery with its approved catalogue colour", () => {
    for (const product of manifest.products) {
      expect(product.assets[0]?.variantKey).toBe(product.catalogLeadVariantKey);
      expect(product.approvedVariantKeys).toContain(product.catalogLeadVariantKey);
    }
  });

  it("maps every approved table colour to its first Cloudinary gallery image", () => {
    for (const product of manifest.products) {
      for (const variantKey of product.approvedVariantKeys) {
        const expectedAsset = product.assets.find((asset) => asset.variantKey === variantKey);
        const selectorMedia = getTigerTableVariantSelectorMedia(product.productSlug, variantKey);

        expect(selectorMedia).toEqual({
          altText: expectedAsset?.altText,
          src:
            product.productSlug === "tiger-portland-outdoor-table"
              ? expectedAsset?.cloudinary.secureUrl.replace(
                  "/image/upload/",
                  "/image/upload/c_crop,w_1280,h_853,x_160,y_373/c_limit,w_800/f_auto,q_auto/"
                )
              : expectedAsset?.cloudinary.secureUrl
        });
      }
    }
  });

  it("records unique, verified Cloudinary identities and ordered media", () => {
    const assets = manifest.products.flatMap(({ assets: productAssets }) => productAssets);
    const catalogAssets = assets.filter(
      ({ catalogApplyEligible }) => catalogApplyEligible !== false
    );
    expect(new Set(assets.map(({ mediaKey }) => mediaKey)).size).toBe(assets.length);
    expect(new Set(catalogAssets.map(({ cloudinary }) => cloudinary.assetId)).size).toBe(
      catalogAssets.length
    );
    expect(new Set(catalogAssets.map(({ cloudinary }) => cloudinary.publicId)).size).toBe(
      catalogAssets.length
    );

    for (const product of manifest.products) {
      expect(product.assets.map(({ sortOrder }) => sortOrder)).toEqual(
        [...product.assets.map(({ sortOrder }) => sortOrder)].sort((left, right) => left - right)
      );
      for (const asset of product.assets.filter(
        ({ catalogApplyEligible }) => catalogApplyEligible !== false
      )) {
        expect(asset.cloudinary.secureUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
        expect(asset.cloudinary.assetId).not.toBe("");
      }
    }
  });

  it("registers current-model detail media as presentation-only evidence", () => {
    const expectedDetailMedia = {
      "tiger-expo-outdoor-table": [
        "tiger-expo-outdoor-table-detail-playing-surface-01",
        "tiger-expo-outdoor-table-detail-frame-01",
        "tiger-expo-outdoor-table-detail-folding-system-01",
        "tiger-expo-outdoor-table-detail-net-01",
        "tiger-expo-outdoor-table-detail-wheels-01",
        "tiger-expo-outdoor-table-detail-rollaway-01",
        "tiger-expo-outdoor-table-detail-storage-01"
      ],
      "tiger-plaza-outdoor-table-grey": [
        "tiger-plaza-outdoor-table-grey-detail-playing-surface-01",
        "tiger-plaza-outdoor-table-grey-detail-frame-01",
        "tiger-plaza-outdoor-table-grey-detail-anchoring-01",
        "tiger-plaza-outdoor-table-grey-detail-net-01"
      ],
      "tiger-portland-indoor-table": [
        "tiger-portland-indoor-table-detail-playing-surface-01",
        "tiger-portland-indoor-table-detail-frame-01",
        "tiger-portland-indoor-table-detail-folding-system-01",
        "tiger-portland-indoor-table-detail-net-01",
        "tiger-portland-indoor-table-detail-wheels-01",
        "tiger-portland-indoor-table-detail-indoor-top-01",
        "tiger-portland-indoor-table-detail-storage-01"
      ],
      "tiger-whistler-indoor-table": [
        "tiger-whistler-indoor-table-detail-playing-surface-01",
        "tiger-whistler-indoor-table-detail-frame-01",
        "tiger-whistler-indoor-table-detail-folding-system-01",
        "tiger-whistler-indoor-table-detail-net-01",
        "tiger-whistler-indoor-table-detail-wheels-01"
      ]
    } as const;

    for (const [productSlug, expectedKeys] of Object.entries(expectedDetailMedia)) {
      const product = manifest.products.find((candidate) => candidate.productSlug === productSlug);
      const details = product?.assets.filter(({ role }) => role === "detail") ?? [];

      expect(details.map(({ mediaKey }) => mediaKey)).toEqual(expectedKeys);
      for (const detail of details) {
        expect(detail).toMatchObject({
          catalogApplyEligible: false,
          modelVerification: "verified_current_model",
          rightsStatus: "owner_cleared",
          uploadAction: "presentation_only"
        });
        expect(detail.cloudinary.secureUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
        expect(detail.cloudinary.publicId).toContain(`/products/${productSlug}/details/`);
        expect(detail.cloudinary.assetId).toBe("");
      }
    }
  });

  it("keeps the owner-approved Portland V2 patio reskin local until upload", () => {
    const portland = manifest.products.find(
      ({ productSlug }) => productSlug === "tiger-portland-outdoor-table"
    );
    const patio = portland?.assets.find(
      ({ mediaKey }) => mediaKey === "tiger-portland-outdoor-table-lifestyle-patio-v2-01"
    );

    expect(patio).toMatchObject({
      catalogApplyEligible: false,
      cloudinary: {
        secureUrl: ""
      },
      localPublicPath: "/storefront/prototype/table-pages/portland-outdoor-v2-grey-patio.jpg",
      modelVerification: "verified_current_v2",
      rightsStatus: "owner_cleared",
      role: "lifestyle",
      uploadAction: "local_preview_only",
      variantKey: "tiger-portland-outdoor-table-v2-grey"
    });
  });

  it("requires 1600px sources unless an exact current-model exception is documented", () => {
    for (const asset of manifest.products.flatMap(({ assets }) => assets)) {
      const longestEdge = Math.max(asset.source.width, asset.source.height);
      if (longestEdge < manifest.delivery.minimumUsefulSourceEdge) {
        expect(asset.qualityStatus).toBe("best_available_current_model");
        expect(["verified_current_model", "verified_current_v2"]).toContain(
          asset.modelVerification
        );
      }
    }
  });

  it("keeps Expo obsolete colours and Portland V1 media out", () => {
    const expo = manifest.products.find(
      ({ productSlug }) => productSlug === "tiger-expo-outdoor-table"
    );
    expect(expo?.approvedVariantKeys.join(" ").toLowerCase()).not.toMatch(/green|black/);
    const assetEvidence = manifest.products.flatMap(({ assets }) => assets);
    expect(JSON.stringify(assetEvidence).toLowerCase()).not.toContain("portland outdoor v1");
  });
});
