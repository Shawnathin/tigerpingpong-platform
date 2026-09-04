import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import tableProductGalleryManifest from "../../data/media/table-product-gallery-manifest-v1.json";
import {
  buildTigerTableComparisonRows,
  resolveTigerTableComparisonColumns
} from "../../apps/web/src/lib/tiger-table-comparison";
import { tigerTablePages, type TigerTableSlug } from "../../apps/web/src/lib/tiger-table-pages";
import type { CatalogProductDetail } from "../../apps/web/src/types/catalog";

const TABLE_NAMES: Readonly<Record<TigerTableSlug, string>> = {
  "tiger-expo-outdoor-table": "Tiger PingPong Expo Outdoor Table",
  "tiger-plaza-outdoor-table-grey": "Tiger PingPong Plaza Outdoor Table",
  "tiger-portland-indoor-table": "Tiger PingPong Portland Indoor Table",
  "tiger-portland-outdoor-table": "Tiger PingPong Portland Outdoor Table",
  "tiger-whistler-indoor-table": "Tiger PingPong Whistler Indoor Table"
};

function getTableVariantKey(slug: TigerTableSlug, colour: string): string {
  const normalizedColour = colour.toLowerCase();

  if (slug === "tiger-portland-outdoor-table") {
    return `${slug}-v2-${normalizedColour}`;
  }

  return `${slug}-color-${normalizedColour}`;
}

function createTableProduct(
  slug: TigerTableSlug,
  priceCents: number,
  colours: readonly string[] = ["Grey"]
): CatalogProductDetail {
  return {
    category: {
      key: "tables",
      name: "Tables",
      slug: "tables"
    },
    currency: "CAD",
    description: null,
    family: {
      key: "tiger-tables",
      name: "Tiger Tables",
      slug: "tiger-tables"
    },
    key: slug,
    media: [
      {
        altText: `${TABLE_NAMES[slug]} product image`,
        caption: null,
        cloudinarySecureUrl: `https://res.cloudinary.com/djfcisldm/image/upload/${slug}.jpg`,
        isPrimary: true,
        mediaKey: `${slug}-primary-test`,
        role: "primary",
        sortOrder: 1,
        title: null
      }
    ],
    name: TABLE_NAMES[slug],
    priceCents,
    productKind: "table",
    purchaseMode: "online_checkout",
    relationships: {},
    shippingReviewRequired: false,
    shortDescription: null,
    slug,
    variants: colours.map((colour, index) => ({
      currency: "CAD",
      isActive: true,
      key: getTableVariantKey(slug, colour),
      name: colour,
      options: [
        {
          displayName: "Top colour",
          label: colour,
          name: "Color",
          optionSortOrder: 1,
          sortOrder: index + 1,
          value: colour.toLowerCase()
        }
      ],
      priceCents,
      purchaseModeOverride: null
    })),
    v1CheckoutScope: true,
    v1PublicNavigation: true
  };
}

function resolvePortlandComparison(comparisonProducts: CatalogProductDetail[]) {
  const product = createTableProduct("tiger-portland-outdoor-table", 150_000, ["Grey", "Blue"]);
  const definition = tigerTablePages["tiger-portland-outdoor-table"];
  const columns = resolveTigerTableComparisonColumns(product, definition, comparisonProducts);

  return {
    columns,
    rows: buildTigerTableComparisonRows(columns)
  };
}

describe("TigerTableProductPage", () => {
  it("orders the current table first and emits only complete comparison rows", () => {
    const expo = createTableProduct("tiger-expo-outdoor-table", 109_900, ["Blue", "Grey"]);
    const portlandIndoor = createTableProduct("tiger-portland-indoor-table", 129_900, [
      "Grey",
      "Green"
    ]);
    const { columns, rows } = resolvePortlandComparison([portlandIndoor, expo]);

    expect(columns.map((column) => column.product.slug)).toEqual([
      "tiger-portland-outdoor-table",
      "tiger-expo-outdoor-table",
      "tiger-portland-indoor-table"
    ]);
    expect(rows.map((row) => row.label)).toEqual([
      "Price",
      "Environment",
      "Active colours",
      "Made for",
      "Playing surface",
      "Playing feel",
      "Weatherproof",
      "Frame",
      "Folding",
      "Mobility",
      "Net",
      "Installation",
      "Warranty"
    ]);
  });

  it("omits a live-data row when any displayed table lacks the value", () => {
    const expo = createTableProduct("tiger-expo-outdoor-table", 109_900, ["Grey"]);
    expo.variants![0].options = [];
    const portlandIndoor = createTableProduct("tiger-portland-indoor-table", 129_900, ["Grey"]);
    const { rows } = resolvePortlandComparison([expo, portlandIndoor]);

    expect(rows.map((row) => row.label)).not.toContain("Active colours");
    expect(rows.map((row) => row.label)).toContain("Environment");
  });

  it("matches checkout price inheritance and excludes disabled legacy variants", () => {
    const expo = createTableProduct("tiger-expo-outdoor-table", 109_900, ["Grey"]);
    expo.variants = [
      {
        ...expo.variants![0],
        priceCents: null
      },
      {
        ...expo.variants![0],
        isActive: true,
        key: "tiger-expo-outdoor-table-legacy-red",
        name: "Legacy Red",
        options: [
          {
            ...expo.variants![0].options[0],
            label: "Red",
            value: "red"
          }
        ],
        priceCents: 1,
        purchaseModeOverride: "deferred_from_v1"
      }
    ];
    const { rows } = resolvePortlandComparison([
      expo,
      createTableProduct("tiger-portland-indoor-table", 129_900, ["Grey"])
    ]);
    const priceRow = rows.find((row) => row.id === "live-price");
    const colourRow = rows.find((row) => row.id === "active-colours");

    expect(priceRow?.values[1]).toBe("$1,099.00");
    expect(colourRow?.values[1]).toBe("Grey");
  });

  it("uses reviewed current-model manifest media that matches an active variant", () => {
    const expo = createTableProduct("tiger-expo-outdoor-table", 109_900, ["Grey"]);
    expo.media[0] = {
      ...expo.media[0],
      altText: "Obsolete API primary",
      cloudinarySecureUrl:
        "https://res.cloudinary.com/djfcisldm/image/upload/obsolete-api-primary.jpg"
    };
    const portlandIndoor = createTableProduct("tiger-portland-indoor-table", 129_900, ["Grey"]);
    const { columns } = resolvePortlandComparison([expo, portlandIndoor]);
    const expoColumn = columns.find(({ product }) => product.slug === expo.slug);
    const expoManifest = tableProductGalleryManifest.products.find(
      ({ productSlug }) => productSlug === expo.slug
    );
    const reviewedGreyMedia = expoManifest?.assets.find(
      ({ variantKey }) => variantKey === expo.variants?.[0]?.key
    );

    expect(expoColumn?.image).toEqual({
      altText: reviewedGreyMedia?.altText,
      src: reviewedGreyMedia?.cloudinary.secureUrl
    });
    expect(expoColumn?.image.src).not.toContain("obsolete-api-primary");
  });

  it("does not fall back to raw API media when no reviewed image matches an active variant", () => {
    const expo = createTableProduct("tiger-expo-outdoor-table", 109_900, ["Red"]);
    const portlandIndoor = createTableProduct("tiger-portland-indoor-table", 129_900, ["Grey"]);
    const { columns } = resolvePortlandComparison([expo, portlandIndoor]);

    expect(columns).toEqual([]);
  });

  it("keeps mobile specifications in a default-closed disclosure", () => {
    const source = readFileSync(
      path.resolve("apps/web/src/app/catalog/products/[slug]/TigerTableProductPage.tsx"),
      "utf8"
    );
    const detailsTag = source.match(/<details className=\{styles\.mobileSpecs\}>/)?.[0];

    expect(detailsTag).toBeDefined();
    expect(detailsTag).not.toContain("open");
    expect(source).toContain("View specs and dimensions");
  });

  it("publishes only explicitly reviewed resource links", () => {
    const source = readFileSync(
      path.resolve("apps/web/src/app/catalog/products/[slug]/TigerTableProductPage.tsx"),
      "utf8"
    );

    expect(source).not.toContain("getTableSupportResource");
    expect(source).toContain("const reviewedResources = reviewedResourceBlock.links");
  });
});
