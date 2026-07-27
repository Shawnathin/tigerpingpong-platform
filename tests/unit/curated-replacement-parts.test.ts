import { describe, expect, it } from "vitest";

import {
  curatedReplacementParts,
  resolveLiveCuratedReplacementParts
} from "../../apps/web/src/lib/curated-replacement-parts";
import type { CatalogProductSummary, ProductMediaSummary } from "../../apps/web/src/types/catalog";

const STANDARD_NET_URL =
  "https://res.cloudinary.com/djfcisldm/image/upload/v1785178768/tiger-pingpong/products/replacement-parts/replacement-nets/tiger-replacement-net-primary-01.jpg";
const EXPO_PORTLAND_SYSTEM_URL =
  "https://res.cloudinary.com/djfcisldm/image/upload/v1785178770/tiger-pingpong/products/replacement-parts/replacement-nets/tiger-table-net-replacement-set-primary-01.jpg";

function primaryMedia(mediaKey: string, cloudinarySecureUrl: string): ProductMediaSummary {
  return {
    altText: `${mediaKey} alt text`,
    caption: null,
    cloudinaryPublicId: mediaKey,
    cloudinarySecureUrl,
    isPrimary: true,
    mediaKey,
    role: "primary",
    sortOrder: 1,
    title: mediaKey,
    variantKey: null
  };
}

function replacementPart(
  slug: string,
  priceCents: number,
  imageUrl: string,
  overrides: Partial<CatalogProductSummary> = {}
): CatalogProductSummary {
  return {
    category: {
      key: "replacement-parts",
      name: "Replacement Parts",
      slug: "replacement-parts"
    },
    currency: "CAD",
    family: {
      key: "replacement-nets",
      name: "Replacement Nets",
      slug: "replacement-nets"
    },
    key: slug,
    name: slug,
    priceCents,
    primaryMedia: primaryMedia(`${slug}-primary-01`, imageUrl),
    productKind: "replacement_part",
    purchaseMode: "online_checkout",
    shippingReviewRequired: false,
    slug,
    v1CheckoutScope: true,
    v1PublicNavigation: true,
    ...overrides
  };
}

describe("curated replacement parts", () => {
  it("locks all three entries to their ranked order and exact anchors", () => {
    expect(
      curatedReplacementParts.map(({ anchorId, rank, section, slug, supportEmailKey }) => ({
        anchorId,
        rank,
        section,
        slug,
        supportEmailKey
      }))
    ).toEqual([
      {
        anchorId: "part-40",
        rank: 1,
        section: "featured-part",
        slug: "tiger-pingpong-replacement-part-40",
        supportEmailKey: "part40"
      },
      {
        anchorId: "standard-replacement-net",
        rank: 2,
        section: "replacement-nets",
        slug: "tiger-replacement-net",
        supportEmailKey: "standardReplacementNet"
      },
      {
        anchorId: "expo-portland-net-upgrade",
        rank: 3,
        section: "replacement-nets",
        slug: "tiger-table-net-replacement-set",
        supportEmailKey: "expoPortlandNetUpgrade"
      }
    ]);
  });

  it("resolves both approved net summaries in curated order from checkout-ready catalog data", () => {
    const standardNet = replacementPart("tiger-replacement-net", 2_000, STANDARD_NET_URL);
    const expoPortlandSystem = replacementPart(
      "tiger-table-net-replacement-set",
      14_999,
      EXPO_PORTLAND_SYSTEM_URL
    );

    const resolved = resolveLiveCuratedReplacementParts([expoPortlandSystem, standardNet]);

    expect(
      resolved.map(({ configuration, imageUrl, product }) => ({
        anchorId: configuration.anchorId,
        heading: configuration.heading,
        imageUrl,
        priceCents: product.priceCents,
        slug: product.slug
      }))
    ).toEqual([
      {
        anchorId: "standard-replacement-net",
        heading: "Standard PingPong Replacement Net",
        imageUrl: STANDARD_NET_URL,
        priceCents: 2_000,
        slug: "tiger-replacement-net"
      },
      {
        anchorId: "expo-portland-net-upgrade",
        heading: "Expo & Portland Net Upgrade System",
        imageUrl: EXPO_PORTLAND_SYSTEM_URL,
        priceCents: 14_999,
        slug: "tiger-table-net-replacement-set"
      }
    ]);
    expect(resolved[0]?.configuration).toMatchObject({
      body: "A standard replacement net for any standard PingPong table—Tiger or otherwise.",
      compatibility: "Use this when your existing posts and mounting hardware are still in place.",
      included: ["One replacement net"],
      notIncluded: "Posts and mounting hardware are not included."
    });
    expect(resolved[1]?.configuration).toMatchObject({
      compatibility:
        "Fits every Tiger PingPong Expo and Portland table, indoor or outdoor. It does not fit Whistler or Plaza.",
      included: [
        "Replacement net",
        "Two triangular support pieces",
        "Net-support assembly",
        "All installation hardware",
        "Two new side panels"
      ]
    });
  });

  it.each([
    {
      label: "private navigation",
      overrides: { v1PublicNavigation: false }
    },
    {
      label: "private checkout scope",
      overrides: { v1CheckoutScope: false }
    },
    {
      label: "deferred purchase mode",
      overrides: { purchaseMode: "deferred_from_v1" }
    }
  ])("rejects a $label replacement net", ({ overrides }) => {
    const deferredNet = replacementPart(
      "tiger-replacement-net",
      2_000,
      STANDARD_NET_URL,
      overrides
    );

    expect(resolveLiveCuratedReplacementParts([deferredNet])).toEqual([]);
  });
});
