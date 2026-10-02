import { describe, expect, it } from "vitest";
import mapping from "../../data/media/cloudinary-account-migration-v1.json";
import {
  remapCatalogMedia,
  remapTigerMediaUrl
} from "../../apps/web/src/lib/cloudinary-account-migration";

describe("Tiger Cloudinary account migration", () => {
  it("maps only the 160 copied originals", () => {
    expect(mapping.assets).toHaveLength(160);
    expect(mapping.assets.filter((asset) => asset.resourceType === "raw")).toHaveLength(5);
    const image = mapping.assets.find((asset) => asset.resourceType === "image")!;
    const legacy = `https://res.cloudinary.com/djfcisldm/image/upload/f_auto,q_auto,c_limit,w_800/v123/${image.publicId}.jpg`;
    expect(remapTigerMediaUrl(legacy)).toBe(
      `https://res.cloudinary.com/scp4c76g/image/upload/f_auto,q_auto,c_limit,w_800/v${image.version}/${image.publicId}.jpg`
    );
  });

  it("preserves raw PDF IDs, attachment names, queries and fragments", () => {
    const manual = mapping.assets.find((asset) => asset.resourceType === "raw")!;
    const source = `https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Guide/v123/${manual.publicId}?download=1#page=2`;
    expect(remapTigerMediaUrl(source)).toBe(
      `https://res.cloudinary.com/scp4c76g/raw/upload/fl_attachment:Tiger-Guide/v${manual.version}/${manual.publicId}?download=1#page=2`
    );
  });

  it("resolves dynamic unversioned detail media using the uploaded version", () => {
    const detail = mapping.assets.find((asset) => asset.publicId.includes("/details/"))!;
    const source = `https://res.cloudinary.com/djfcisldm/image/upload/f_auto,q_auto/${detail.publicId}`;
    expect(remapTigerMediaUrl(source)).toContain(
      `/scp4c76g/image/upload/f_auto,q_auto/v${detail.version}/`
    );
  });

  it("leaves PaddleBuddy, unapproved IDs, local paths and alternate hosts unchanged", () => {
    for (const source of [
      "https://res.cloudinary.com/svl1myo8/video/upload/q_auto/paddlebuddy/landing/v1/connection-loop.mp4",
      "https://res.cloudinary.com/djfcisldm/image/upload/unrelated/private-product.jpg",
      "https://res.cloudinary.com/djfcisldm/image/upload/tigerpingpong/products/not-copied.jpg",
      "https://example.com/djfcisldm/image/upload/tigerpingpong/products/not-copied.jpg",
      "/storefront/products/aqua/image.png"
    ]) {
      expect(remapTigerMediaUrl(source)).toBe(source);
    }
  });

  it("bridges stored API media without mutating source catalog data or provenance", () => {
    const image = mapping.assets.find((asset) => asset.resourceType === "image")!;
    const legacy = `https://res.cloudinary.com/djfcisldm/image/upload/v123/${image.publicId}.jpg`;
    const original = {
      media: [{ cloudinarySecureUrl: legacy, sourceUrl: legacy }],
      priceCents: 800
    };
    const migrated = remapCatalogMedia(original);
    expect(migrated.media[0].cloudinarySecureUrl).toContain("/scp4c76g/");
    expect(migrated.media[0].sourceUrl).toBe(legacy);
    expect(original.media[0].cloudinarySecureUrl).toBe(legacy);
    expect(migrated.priceCents).toBe(800);
  });
});
