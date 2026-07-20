import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface ManifestAsset {
  cloudinary: {
    assetId: string;
    publicId: string;
    secureUrl: string;
  };
  mediaKey: string;
  qualityStatus: string;
  sortOrder: number;
  source: { height: number; width: number };
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

  it("records unique, verified Cloudinary identities and ordered media", () => {
    const assets = manifest.products.flatMap(({ assets: productAssets }) => productAssets);
    expect(new Set(assets.map(({ mediaKey }) => mediaKey)).size).toBe(assets.length);
    expect(new Set(assets.map(({ cloudinary }) => cloudinary.assetId)).size).toBe(assets.length);
    expect(new Set(assets.map(({ cloudinary }) => cloudinary.publicId)).size).toBe(assets.length);

    for (const product of manifest.products) {
      expect(product.assets.map(({ sortOrder }) => sortOrder)).toEqual(
        [...product.assets.map(({ sortOrder }) => sortOrder)].sort((left, right) => left - right)
      );
      for (const asset of product.assets) {
        expect(asset.cloudinary.secureUrl).toMatch(/^https:\/\/res\.cloudinary\.com\//);
        expect(asset.cloudinary.assetId).not.toBe("");
      }
    }
  });

  it("requires 1600px sources unless an exact current-model exception is documented", () => {
    for (const asset of manifest.products.flatMap(({ assets }) => assets)) {
      const longestEdge = Math.max(asset.source.width, asset.source.height);
      if (longestEdge < manifest.delivery.minimumUsefulSourceEdge) {
        expect(asset.qualityStatus).toBe("best_available_current_model");
        expect(asset.mediaKey).toContain("tiger-portland-outdoor-table");
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
