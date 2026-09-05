#!/usr/bin/env node

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const tableGalleryManifest = JSON.parse(
  readFileSync(path.join(repoRoot, "data/media/table-product-gallery-manifest-v1.json"), "utf8")
);
const replacementNetsMediaManifest = JSON.parse(
  readFileSync(path.join(repoRoot, "data/media/replacement-nets-commerce-media-v1.json"), "utf8")
);

function getReplacementNetPrimaryMedia(assetId) {
  const asset = replacementNetsMediaManifest.entries.find((entry) => entry.assetId === assetId);

  if (
    !asset ||
    asset.deliveryStatus !== "implemented" ||
    !asset.cloudinaryPublicId ||
    !asset.finalUrl ||
    !asset.altText
  ) {
    throw new Error(`Missing implemented replacement-net media fixture: ${assetId}`);
  }

  return {
    mediaKey: asset.assetId,
    role: "primary",
    cloudinaryPublicId: asset.cloudinaryPublicId,
    cloudinarySecureUrl: asset.finalUrl,
    altText: asset.altText,
    title: asset.title,
    caption: null,
    sortOrder: 1,
    isPrimary: true
  };
}

const port = Number(process.env.MOCK_CATALOG_PORT ?? 3101);
const product = {
  key: "tiger-premium-balls-6-orange",
  slug: "tiger-premium-balls-6-orange",
  name: "Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange",
  productKind: "ball",
  purchaseMode: "online_checkout",
  priceCents: 800,
  currency: "CAD",
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  shippingReviewRequired: false,
  family: { key: "premium-balls", slug: "premium-balls", name: "Premium Balls" },
  category: {
    key: "ping-pong-balls",
    slug: "ping-pong-balls",
    name: "Ping Pong Balls"
  },
  primaryMedia: null,
  shortDescription: "Six orange table tennis balls for practice and play.",
  description: "A locally mocked product used only by browser release tests.",
  media: [
    {
      mediaKey: "local-single-pack-image",
      role: "primary",
      cloudinarySecureUrl: "/storefront/prototype/aqua-paddle/red-paddle-single-cutout.png",
      cloudinaryPublicId: null,
      altText: "Local single-pack fixture",
      title: "Single pack",
      caption: null,
      sortOrder: 1,
      isPrimary: true,
      variantKey: "single-pack"
    },
    {
      mediaKey: "local-family-pack-image",
      role: "alternate",
      cloudinarySecureUrl: "/storefront/prototype/aqua-paddle/aqua-4count-box-angle.jpg",
      cloudinaryPublicId: null,
      altText: "Local family-pack fixture",
      title: "Family pack",
      caption: null,
      sortOrder: 2,
      isPrimary: false,
      variantKey: "family-pack"
    }
  ],
  variants: [
    {
      id: "variant-single-pack",
      key: "single-pack",
      name: "Single pack",
      priceCents: 800,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package",
          displayName: "Package",
          value: "single-pack",
          label: "Single pack",
          sortOrder: 1,
          optionSortOrder: 1
        }
      ]
    },
    {
      id: "variant-family-pack",
      key: "family-pack",
      name: "Family pack",
      priceCents: 12000,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package",
          displayName: "Package",
          value: "family-pack",
          label: "Family pack",
          sortOrder: 2,
          optionSortOrder: 1
        }
      ]
    }
  ]
};
const aquaProduct = {
  key: "tiger-aqua-outdoor-indoor-paddle",
  slug: "tiger-aqua-outdoor-indoor-paddle",
  name: "Aqua Outdoor / Indoor Paddle",
  productKind: "paddle",
  purchaseMode: "online_checkout",
  priceCents: 2500,
  currency: "CAD",
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  shippingReviewRequired: false,
  family: { key: "aqua-paddles", slug: "aqua-paddles", name: "Aqua Paddles" },
  category: { key: "paddles", slug: "paddles", name: "Paddles" },
  primaryMedia: null,
  shortDescription: "Weather-resistant Aqua paddle for shared spaces and real life.",
  description: "Local Aqua fixture for browser tests.",
  media: [],
  variants: [
    {
      id: "aqua-single-coral",
      key: "tiger-aqua-package-single-coral",
      name: "Single - Coral Red",
      priceCents: 2500,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package",
          displayName: "Package",
          value: "single-coral-red",
          label: "Single - Coral Red",
          sortOrder: 1,
          optionSortOrder: 1
        }
      ]
    },
    {
      id: "aqua-single-ocean-blue",
      key: "tiger-aqua-package-single-ocean-blue",
      name: "Single - Ocean Blue",
      priceCents: 2500,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package",
          displayName: "Package",
          value: "single-ocean-blue",
          label: "Single - Ocean Blue",
          sortOrder: 2,
          optionSortOrder: 1
        }
      ]
    },
    {
      id: "aqua-two-pack",
      key: "tiger-aqua-package-2-pack-3-balls",
      name: "2 Pack + 3 Balls",
      priceCents: 4500,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package",
          displayName: "Package",
          value: "2-pack-3-balls",
          label: "2 Pack + 3 Balls",
          sortOrder: 3,
          optionSortOrder: 1
        }
      ]
    },
    {
      id: "aqua-four-pack",
      key: "tiger-aqua-package-4-pack-3-balls",
      name: "4 Pack + 3 Balls",
      priceCents: 8000,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package",
          displayName: "Package",
          value: "4-pack-3-balls",
          label: "4 Pack + 3 Balls",
          sortOrder: 4,
          optionSortOrder: 1
        }
      ]
    }
  ]
};
const part40Product = {
  key: "tiger-pingpong-replacement-part-40",
  slug: "tiger-pingpong-replacement-part-40",
  name: "Tiger PingPong Part 40",
  productKind: "replacement_part",
  purchaseMode: "online_checkout",
  priceCents: 700,
  currency: "CAD",
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  shippingReviewRequired: false,
  family: {
    key: "table-opening-parts",
    slug: "table-opening-parts",
    name: "Table-Opening Parts"
  },
  category: {
    key: "replacement-parts",
    slug: "replacement-parts",
    name: "Replacement Parts"
  },
  primaryMedia: {
    mediaKey: "tiger-pingpong-replacement-part-40-primary-01",
    role: "primary",
    cloudinaryPublicId: "tiger-pingpong/replacement-parts/part-40",
    cloudinarySecureUrl:
      "https://res.cloudinary.com/djfcisldm/image/upload/v1784409335/tiger-pingpong/replacement-parts/part-40.jpg",
    altText: "Black Tiger Part 40 replacement clip on a white background",
    title: "Tiger PingPong Part 40",
    caption: null,
    sortOrder: 1,
    isPrimary: true
  },
  media: [],
  variants: []
};
const standardReplacementNetPrimaryMedia = getReplacementNetPrimaryMedia(
  "tiger-replacement-net-primary-01"
);
const expoPortlandNetUpgradePrimaryMedia = getReplacementNetPrimaryMedia(
  "tiger-table-net-replacement-set-primary-01"
);
const replacementNetProducts = [
  {
    key: "tiger-replacement-net",
    slug: "tiger-replacement-net",
    name: "Tiger PingPong Standard Replacement Net",
    productKind: "replacement_part",
    purchaseMode: "online_checkout",
    priceCents: 2000,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: {
      key: "replacement-nets",
      slug: "replacement-nets",
      name: "Replacement Nets"
    },
    category: {
      key: "replacement-parts",
      slug: "replacement-parts",
      name: "Replacement Parts"
    },
    primaryMedia: standardReplacementNetPrimaryMedia,
    shortDescription: "A standard replacement net for any standard PingPong table.",
    description:
      "A standard replacement net for any standard PingPong table—Tiger or otherwise. Includes one replacement net. Posts and mounting hardware are not included.",
    media: [standardReplacementNetPrimaryMedia],
    variants: []
  },
  {
    key: "tiger-table-net-replacement-set",
    slug: "tiger-table-net-replacement-set",
    name: "Tiger PingPong Expo & Portland Net Upgrade System",
    productKind: "replacement_part",
    purchaseMode: "online_checkout",
    priceCents: 14999,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: {
      key: "replacement-nets",
      slug: "replacement-nets",
      name: "Replacement Nets"
    },
    category: {
      key: "replacement-parts",
      slug: "replacement-parts",
      name: "Replacement Parts"
    },
    primaryMedia: expoPortlandNetUpgradePrimaryMedia,
    shortDescription:
      "Complete current net-system upgrade for every Tiger Expo and Portland table.",
    description:
      "Fits every Tiger PingPong Expo and Portland table, indoor or outdoor. It does not fit Whistler or Plaza. Includes the replacement net, two triangular support pieces, the net-support assembly, all installation hardware, and two new side panels. The earlier removable-upright hardware and current hardware do not interchange piece by piece; if anything from the older setup is missing, use the complete upgrade.",
    media: [expoPortlandNetUpgradePrimaryMedia],
    variants: []
  }
];
const viceSinglePriceCents = 1500;
const whiteBallSixPackPriceCents = 800;
const viceBundlePriceCents = viceSinglePriceCents * 4 + whiteBallSixPackPriceCents;
const viceProduct = {
  key: "tiger-vice-paddle",
  slug: "tiger-vice-paddle",
  name: "Tiger PingPong Vice Ping Pong Paddle",
  productKind: "paddle",
  purchaseMode: "online_checkout",
  priceCents: viceSinglePriceCents,
  currency: "CAD",
  v1PublicNavigation: true,
  v1CheckoutScope: true,
  shippingReviewRequired: false,
  family: { key: "vice-paddle", slug: "vice-paddle", name: "Vice Paddle" },
  category: { key: "paddles", slug: "paddles", name: "Paddles" },
  primaryMedia: {
    mediaKey: "vice-primary",
    role: "primary",
    cloudinarySecureUrl:
      "https://res.cloudinary.com/djfcisldm/image/upload/v1781303652/tigerpingpong/products/tiger-vice-paddle/01-main.jpg",
    altText: "Tiger PingPong Vice paddle in pink with a white ball.",
    title: "Tiger PingPong Vice paddle",
    caption: null,
    sortOrder: 1,
    isPrimary: true
  },
  media: [],
  variants: [
    {
      id: "vice-package-single",
      key: "tiger-vice-package-single",
      name: "Single Vice Paddle",
      priceCents: viceSinglePriceCents,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package Options",
          displayName: "Package Options",
          value: "single-vice-paddle",
          label: "Single Vice Paddle",
          sortOrder: 1,
          optionSortOrder: 1
        }
      ]
    },
    {
      id: "vice-package-4-pack-6-white-balls",
      key: "tiger-vice-package-4-pack-6-white-balls",
      name: "4 Vice paddles + 6 white balls",
      priceCents: viceBundlePriceCents,
      currency: "CAD",
      purchaseModeOverride: null,
      isActive: true,
      options: [
        {
          name: "Package Options",
          displayName: "Package Options",
          value: "4-vice-paddles-6-white-balls",
          label: "4 Vice paddles + 6 white balls",
          sortOrder: 2,
          optionSortOrder: 1
        }
      ]
    }
  ]
};
const accessoryProducts = [
  aquaProduct,
  viceProduct,
  {
    key: "tiger-premium-balls-6-white",
    slug: "tiger-premium-balls-6-white",
    name: "Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack White",
    productKind: "ball",
    purchaseMode: "online_checkout",
    priceCents: 800,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "premium-balls", slug: "premium-balls", name: "Premium Balls" },
    category: { key: "ping-pong-balls", slug: "ping-pong-balls", name: "Ping Pong Balls" },
    primaryMedia: null
  },
  {
    key: "tiger-premium-balls-140",
    slug: "tiger-premium-balls-140",
    name: "Tiger PingPong Premium 3-Star Ping Pong Balls 140 Pack",
    productKind: "ball",
    purchaseMode: "online_checkout",
    priceCents: 9600,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "premium-balls", slug: "premium-balls", name: "Premium Balls" },
    category: { key: "ping-pong-balls", slug: "ping-pong-balls", name: "Ping Pong Balls" },
    primaryMedia: {
      mediaKey: "balls-140-primary",
      role: "primary",
      cloudinarySecureUrl:
        "https://res.cloudinary.com/djfcisldm/image/upload/v1781303661/tigerpingpong/products/tiger-premium-balls-140/01-main.jpg",
      altText: "Open box of 140 Tiger PingPong balls.",
      title: "Tiger PingPong 140-pack",
      caption: null,
      sortOrder: 1,
      isPrimary: true
    }
  },
  {
    key: "tiger-table-cover-black-polyester",
    slug: "tiger-table-cover-black-polyester",
    name: "Tiger PingPong Protective Ping Pong Table Cover Black Polyester",
    productKind: "cover",
    purchaseMode: "online_checkout",
    priceCents: 5500,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "table-covers", slug: "table-covers", name: "Table Covers" },
    category: { key: "covers", slug: "covers", name: "Covers" },
    primaryMedia: {
      mediaKey: "cover-primary",
      role: "primary",
      cloudinarySecureUrl:
        "https://res.cloudinary.com/djfcisldm/image/upload/v1781303672/tigerpingpong/products/tiger-table-cover-black-polyester/01-main.jpg",
      altText: "Black Tiger PingPong cover shown straight on over a folded table.",
      title: "Tiger PingPong Table Cover",
      caption: null,
      sortOrder: 1,
      isPrimary: true
    }
  },
  {
    key: "tiger-net-post-set",
    slug: "tiger-net-post-set",
    name: "Table Tennis Net & Post Set",
    productKind: "net",
    purchaseMode: "online_checkout",
    priceCents: 5900,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "net-sets", slug: "net-sets", name: "Net Sets" },
    category: { key: "nets", slug: "nets", name: "Nets" },
    primaryMedia: null
  }
];
const tableProducts = [
  {
    key: "tiger-expo-outdoor-table",
    slug: "tiger-expo-outdoor-table",
    name: "Tiger PingPong Expo Outdoor Ping Pong Table Grey or Blue",
    productKind: "table",
    purchaseMode: "online_checkout",
    priceCents: 130000,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "expo", slug: "expo", name: "Expo" },
    category: { key: "tables", slug: "tables", name: "Tables" },
    primaryMedia: null
  },
  {
    key: "tiger-portland-indoor-table",
    slug: "tiger-portland-indoor-table",
    name: "Tiger PingPong Portland Indoor Ping Pong Table Grey or Green",
    productKind: "table",
    purchaseMode: "online_checkout",
    priceCents: 130000,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "portland", slug: "portland", name: "Portland" },
    category: { key: "tables", slug: "tables", name: "Tables" },
    primaryMedia: null
  },
  {
    key: "tiger-portland-outdoor-table",
    slug: "tiger-portland-outdoor-table",
    name: "Tiger PingPong Portland Outdoor Ping Pong Table Grey or Blue",
    productKind: "table",
    purchaseMode: "online_checkout",
    priceCents: 150000,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "portland", slug: "portland", name: "Portland" },
    category: { key: "tables", slug: "tables", name: "Tables" },
    primaryMedia: null
  },
  {
    key: "tiger-whistler-indoor-table",
    slug: "tiger-whistler-indoor-table",
    name: "Tiger PingPong Whistler Indoor Ping Pong Table Green or Blue",
    productKind: "table",
    purchaseMode: "online_checkout",
    priceCents: 160000,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: process.env.MOCK_WHISTLER_OUT_OF_STOCK !== "1",
    shippingReviewRequired: false,
    family: { key: "whistler", slug: "whistler", name: "Whistler" },
    category: { key: "tables", slug: "tables", name: "Tables" },
    primaryMedia: null
  },
  {
    key: "tiger-plaza-outdoor-table-grey",
    slug: "tiger-plaza-outdoor-table-grey",
    name: "Tiger PingPong Plaza Outdoor Ping Pong Table Grey",
    productKind: "table",
    purchaseMode: "online_checkout",
    priceCents: 260000,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "plaza", slug: "plaza", name: "Plaza" },
    category: { key: "tables", slug: "tables", name: "Tables" },
    primaryMedia: null
  }
];
const tableVariantFixtures = {
  "tiger-expo-outdoor-table": [
    colorVariant("tiger-expo-outdoor-table-color-blue", "Blue", null),
    colorVariant("tiger-expo-outdoor-table-color-grey", "Grey", null)
  ],
  "tiger-portland-indoor-table": [
    colorVariant("tiger-portland-indoor-table-color-green", "Green", null),
    colorVariant("tiger-portland-indoor-table-color-grey", "Grey", null)
  ],
  "tiger-portland-outdoor-table": [
    portlandOutdoorVariant("tiger-portland-outdoor-table-v2-blue", "Blue"),
    portlandOutdoorVariant("tiger-portland-outdoor-table-v2-grey", "Grey")
  ],
  "tiger-whistler-indoor-table": [
    colorVariant("tiger-whistler-indoor-table-color-blue", "Blue", 160000),
    colorVariant("tiger-whistler-indoor-table-color-green", "Green", 160000)
  ],
  "tiger-plaza-outdoor-table-grey": [
    colorVariant("tiger-plaza-outdoor-table-grey-color-grey", "Grey", null)
  ]
};
const tableDetailProducts = tableProducts.map((tableProduct) => {
  const manifestProduct = tableGalleryManifest.products.find(
    (candidate) => candidate.productSlug === tableProduct.slug
  );
  if (!manifestProduct) throw new Error(`Missing table gallery fixture: ${tableProduct.slug}`);
  const media = manifestProduct.assets.map((asset) => ({
    altText: asset.altText,
    caption: null,
    cloudinaryPublicId: asset.cloudinary.publicId,
    cloudinarySecureUrl: asset.cloudinary.secureUrl,
    isPrimary: asset.isPrimary,
    mediaKey: asset.mediaKey,
    role: asset.role,
    sortOrder: asset.sortOrder,
    title: null,
    variantKey: asset.variantKey
  }));
  return {
    ...tableProduct,
    description: "Local manifest-backed table gallery fixture.",
    media,
    primaryMedia: media.find((asset) => asset.isPrimary) ?? null,
    shortDescription: `${tableProduct.name} local browser fixture.`,
    variants: tableVariantFixtures[tableProduct.slug]
  };
});
const failedTableAccessoryOfferSlugs = new Set();
let adminProductUpdatedAt = "2026-07-16T12:00:00.000Z";

function getTableAccessoryOffer(tableProduct) {
  const aquaTwoPack = aquaProduct.variants.find(
    (variant) => variant.key === "tiger-aqua-package-2-pack-3-balls"
  );
  const aquaFourPack = aquaProduct.variants.find(
    (variant) => variant.key === "tiger-aqua-package-4-pack-3-balls"
  );
  const viceBundle = viceProduct.variants.find(
    (variant) => variant.key === "tiger-vice-package-4-pack-6-white-balls"
  );
  const coverProduct = accessoryProducts.find(
    (candidate) => candidate.key === "tiger-table-cover-black-polyester"
  );
  const isPlaza = tableProduct.key === "tiger-plaza-outdoor-table-grey";
  const selectableItems = [
    toOfferVariantItem(aquaProduct, aquaTwoPack, "catalog_variant"),
    toOfferVariantItem(aquaProduct, aquaFourPack, "catalog_variant"),
    toOfferVariantItem(viceProduct, viceBundle, "component_derived")
  ];

  if (!isPlaza && coverProduct) {
    selectableItems.push({
      currency: coverProduct.currency,
      image: {
        alt: coverProduct.primaryMedia?.altText ?? coverProduct.name,
        url: coverProduct.primaryMedia?.cloudinarySecureUrl ?? null
      },
      priceCents: coverProduct.priceCents,
      pricingSource: "catalog_product",
      productKey: coverProduct.key,
      productName: coverProduct.name,
      productSlug: coverProduct.slug,
      role: "cover",
      selectedOptions: [],
      variantKey: null
    });
  }

  return {
    offer: {
      coverCompatibility: {
        isCompatible: !isPlaza,
        reason: isPlaza ? "not_compatible_with_plaza" : null
      },
      discountPercent: 30,
      pricingRuleVersion: "table_accessories_30_v1",
      selectableItems,
      tableProductKey: tableProduct.key,
      tableSlug: tableProduct.slug
    }
  };
}

function toOfferVariantItem(productFixture, variant, pricingSource) {
  if (!variant) {
    throw new Error(`Missing offer variant fixture for ${productFixture.slug}.`);
  }

  return {
    currency: variant.currency,
    image: {
      alt: productFixture.primaryMedia?.altText ?? productFixture.name,
      url: productFixture.primaryMedia?.cloudinarySecureUrl ?? null
    },
    priceCents: variant.priceCents,
    pricingSource,
    productKey: productFixture.key,
    productName: productFixture.name,
    productSlug: productFixture.slug,
    role: "play_set",
    selectedOptions: variant.options.map((option) => ({
      label: option.label ?? option.value,
      name: option.name,
      value: option.value
    })),
    variantKey: variant.key
  };
}

function getAdminProduct(catalogProduct = product, id = "product-local-1") {
  return {
    id,
    key: catalogProduct.key,
    slug: catalogProduct.slug,
    name: catalogProduct.name,
    sku: "LOCAL-TEST-SKU",
    category: { id: "category-local-1", ...catalogProduct.category },
    type: catalogProduct.productKind,
    priceCents: catalogProduct.priceCents,
    currency: catalogProduct.currency,
    status: catalogProduct.v1PublicNavigation ? "active" : "archived",
    visible: catalogProduct.v1PublicNavigation,
    v1CheckoutScope: catalogProduct.v1CheckoutScope,
    purchaseMode: catalogProduct.purchaseMode,
    checkoutEligible: catalogProduct.v1CheckoutScope,
    checkoutEligibilityReasons: [],
    stockWarnings: [],
    imageStatus: {
      primaryImageUrl: catalogProduct.media[0].cloudinarySecureUrl,
      status: "public_image_available"
    },
    primaryImageUrl: catalogProduct.media[0].cloudinarySecureUrl,
    variantCount: catalogProduct.variants.length,
    mediaCount: catalogProduct.media.length,
    updatedAt: id === "product-local-1" ? adminProductUpdatedAt : adminWhistlerUpdatedAt,
    brand: { key: "tiger", name: "Tiger Ping Pong", slug: "tiger" },
    family: { id: "family-local-1", ...catalogProduct.family, isPublic: true, isActive: true },
    variants: catalogProduct.variants.map((variant) => ({
      id: variant.id,
      key: variant.key,
      sku: null,
      name: variant.name,
      priceCents: variant.priceCents,
      currency: variant.currency,
      purchaseModeOverride: variant.purchaseModeOverride,
      isActive: variant.isActive,
      options: variant.options.map((option) => ({
        optionName: option.name,
        optionDisplayName: option.displayName,
        value: option.value,
        label: option.label
      }))
    }))
  };
}
const originalWhistler = structuredClone(
  tableDetailProducts.find((item) => item.slug === "tiger-whistler-indoor-table")
);
let adminWhistlerUpdatedAt = "2026-09-04T12:00:00.000Z";
const adminWhistler = structuredClone(originalWhistler);
adminWhistler.variants = adminWhistler.variants.map((variant, index) => ({
  ...variant,
  id: `whistler-local-${index}`
}));
adminWhistler.v1PublicNavigation = true;
adminWhistler.v1CheckoutScope = false;

const internalOrder = {
  publicReference: "TPP-TEST-001",
  status: "paid",
  customerName: "Local Test Customer",
  customerEmail: "customer@example.invalid",
  customerPhone: null,
  shippingName: "Local Test Customer",
  shippingPhone: null,
  shippingAddress: {
    city: "Vancouver",
    country: "CA",
    line1: "Local browser fixture",
    line2: null,
    postalCode: "V0V 0V0",
    state: "BC"
  },
  currency: "CAD",
  discountCents: 0,
  listSubtotalCents: 800,
  subtotalCents: 800,
  shippingCents: 1500,
  totalCents: 2300,
  taxAmountCents: 0,
  shippingRule: "flat_rate",
  checkoutSource: "local_browser_fixture",
  pricingRuleVersion: null,
  stripeCheckoutSessionId: null,
  stripePaymentIntentId: null,
  stripeCustomerId: null,
  stripeAmountTotalCents: null,
  stripeAmountTaxCents: null,
  stripeAutomaticTaxStatus: null,
  shipment: {
    carrier: "Canada Post",
    internalNote: "Local fixture only.",
    shippedAt: "2026-07-16T12:00:00.000Z",
    trackingNumber: "LOCAL-TEST-TRACKING",
    trackingUrl: "https://example.invalid/tracking/LOCAL-TEST-TRACKING"
  },
  emails: [
    {
      attemptCount: 1,
      kind: "order_received",
      lastError: null,
      sentAt: "2026-07-16T11:01:00.000Z",
      status: "sent"
    },
    {
      attemptCount: 1,
      kind: "shipment",
      lastError: null,
      sentAt: "2026-07-16T12:01:00.000Z",
      status: "sent"
    }
  ],
  paidAt: "2026-07-16T11:00:00.000Z",
  createdAt: "2026-07-16T10:00:00.000Z",
  updatedAt: "2026-07-16T12:00:00.000Z",
  items: [
    {
      productKey: product.key,
      productSlug: product.slug,
      variantKey: null,
      sku: "LOCAL-TEST-SKU",
      name: product.name,
      currency: "CAD",
      discountCents: 0,
      discountUnitCents: 0,
      listLineTotalCents: 800,
      listUnitPriceCents: 800,
      unitPriceCents: 800,
      quantity: 1,
      lineTotalCents: 800,
      promotionKey: null,
      createdAt: "2026-07-16T10:00:00.000Z"
    }
  ]
};

const unshippedOrder = {
  ...internalOrder,
  publicReference: "TPP-TEST-002",
  shipment: {
    carrier: null,
    internalNote: null,
    shippedAt: null,
    trackingNumber: null,
    trackingUrl: null
  },
  emails: [internalOrder.emails[0], { ...internalOrder.emails[0], kind: "staff_new_order" }]
};
const previewOrders = [unshippedOrder, internalOrder];

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader(
    "Access-Control-Allow-Origin",
    process.env.MOCK_CATALOG_ORIGIN ?? "http://127.0.0.1:3100"
  );
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, PATCH, POST, OPTIONS");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.url === "/catalog/health") {
    response.end(
      JSON.stringify({
        status: "ok",
        service: "local-mock-catalog",
        timestamp: new Date().toISOString(),
        counts: {
          brands: 1,
          categories: 5,
          productFamilies: 12,
          products: 15,
          variants: 0,
          media: 0
        }
      })
    );
    return;
  }

  if (request.url === "/catalog/products") {
    response.end(
      JSON.stringify({
        products: [
          product,
          part40Product,
          ...replacementNetProducts,
          ...accessoryProducts,
          ...tableProducts
        ]
      })
    );
    return;
  }

  if (request.url === "/__test/table-accessory-offer-failure" && request.method === "POST") {
    const body = await readJsonBody(request);

    if (body.fail === false) {
      failedTableAccessoryOfferSlugs.delete(body.slug);
    } else {
      failedTableAccessoryOfferSlugs.add(body.slug);
    }

    response.end(JSON.stringify({ ok: true }));
    return;
  }

  const tableAccessoryOfferPrefix = "/catalog/table-accessory-offer/";
  if (request.url?.startsWith(tableAccessoryOfferPrefix) && request.method === "GET") {
    const tableSlug = decodeURIComponent(request.url.slice(tableAccessoryOfferPrefix.length));
    const tableProduct = tableDetailProducts.find((candidate) => candidate.slug === tableSlug);

    if (!tableProduct) {
      response.statusCode = 404;
      response.end(JSON.stringify({ message: "Table accessory offer not found." }));
      return;
    }

    if (failedTableAccessoryOfferSlugs.has(tableSlug)) {
      response.statusCode = 503;
      response.end(JSON.stringify({ message: "Table accessory offer temporarily unavailable." }));
      return;
    }

    response.end(JSON.stringify(getTableAccessoryOffer(tableProduct)));
    return;
  }

  if (request.url === `/catalog/products/${product.slug}`) {
    response.end(JSON.stringify({ product }));
    return;
  }

  if (request.url === `/catalog/products/${aquaProduct.slug}`) {
    response.end(JSON.stringify({ product: aquaProduct }));
    return;
  }

  if (request.url === `/catalog/products/${part40Product.slug}`) {
    response.end(JSON.stringify({ product: part40Product }));
    return;
  }

  const replacementNetProduct = replacementNetProducts.find(
    (candidate) => request.url === `/catalog/products/${candidate.slug}`
  );
  if (replacementNetProduct) {
    response.end(JSON.stringify({ product: replacementNetProduct }));
    return;
  }

  const tableDetailProduct = tableDetailProducts.find(
    (candidate) => request.url === `/catalog/products/${candidate.slug}`
  );
  if (tableDetailProduct) {
    response.end(JSON.stringify({ product: tableDetailProduct }));
    return;
  }

  const simpleProduct = accessoryProducts.find(
    (candidate) => request.url === `/catalog/products/${candidate.slug}`
  );
  if (simpleProduct) {
    response.end(
      JSON.stringify({
        product: {
          ...simpleProduct,
          description: "Local catalog fixture for browser tests.",
          media: simpleProduct.media ?? [],
          shortDescription: `${simpleProduct.name} local browser fixture.`,
          variants: simpleProduct.variants ?? []
        }
      })
    );
    return;
  }

  if (request.url === "/__test/admin-whistler/reset" && request.method === "POST") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    Object.assign(adminWhistler, structuredClone(originalWhistler), {
      v1PublicNavigation: true,
      v1CheckoutScope: false
    });
    adminWhistler.variants = adminWhistler.variants.map((variant, index) => ({
      ...variant,
      id: `whistler-local-${index}`
    }));
    adminWhistlerUpdatedAt = "2026-09-04T12:00:00.000Z";
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.url === "/api/admin/dashboard/summary") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    const recent = previewOrders.map((order) => ({
      ...order,
      id: order.publicReference,
      orderReference: order.publicReference,
      orderStatus: order.status,
      customer: { name: order.customerName, email: order.customerEmail }
    }));
    response.end(
      JSON.stringify({
        orders: { status: "ok", paidCount: 2, pendingCheckoutCount: 0, recent },
        products: {
          status: "ok",
          totalCount: 2,
          activeCount: 2,
          checkoutScopeCount: 1,
          variantCount: 4,
          warnings: { missingCheckoutPriceCount: 0, missingPublicImageCount: 0 }
        },
        inventory: { status: "not_configured" },
        auditLog: { status: "not_configured" },
        payments: {
          status: "tracked",
          webhookEventsTracked: true,
          totalWebhookEventsCount: 2,
          unprocessedWebhookEventsCount: 0
        }
      })
    );
    return;
  }

  const orderRequestUrl = new URL(request.url, "http://127.0.0.1");
  if (orderRequestUrl.pathname === "/internal/orders" && request.method === "GET") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    const status = orderRequestUrl.searchParams.get("status") || "paid";
    const requestedLimit = Number(orderRequestUrl.searchParams.get("limit") || 50);
    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 50;
    response.end(
      JSON.stringify({
        status,
        limit,
        orders: previewOrders
          .filter((order) => order.status === status)
          .slice(0, limit)
          .map((order) => ({ ...order, itemCount: order.items.length }))
      })
    );
    return;
  }

  const previewOrder = previewOrders.find(
    (order) => orderRequestUrl.pathname === `/internal/orders/${order.publicReference}`
  );
  if (previewOrder && request.method === "GET") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    response.end(JSON.stringify({ order: previewOrder }));
    return;
  }

  if (request.url?.startsWith("/api/admin/products?") && request.method === "GET") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    response.end(
      JSON.stringify({
        count: 2,
        items: [getAdminProduct(), getAdminProduct(adminWhistler, "whistler-local")]
      })
    );
    return;
  }

  const adminProductId = request.url?.match(
    /^\/api\/admin\/products\/(product-local-1|whistler-local)$/
  )?.[1];
  if (adminProductId && ["GET", "PATCH"].includes(request.method)) {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    const target = adminProductId === "product-local-1" ? product : adminWhistler;
    if (request.method === "GET") {
      response.end(JSON.stringify({ product: getAdminProduct(target, adminProductId) }));
      return;
    }
    const body = await readJsonBody(request);
    if (
      typeof body.published !== "boolean" ||
      typeof body.inStock !== "boolean" ||
      "availableForSale" in body
    ) {
      response.statusCode = 400;
      response.end(JSON.stringify({ message: "Explicit publication and stock are required." }));
      return;
    }
    const currentUpdatedAt = getAdminProduct(target, adminProductId).updatedAt;
    if (body.expectedUpdatedAt !== currentUpdatedAt) {
      response.statusCode = 409;
      response.end(
        JSON.stringify({ message: "This product changed after the editor was opened." })
      );
      return;
    }
    if (
      body.inStock &&
      body.variants.length &&
      !body.variants.some((variant) => variant.isActive)
    ) {
      response.statusCode = 400;
      response.end(JSON.stringify({ message: "Set product out of stock." }));
      return;
    }
    target.name = body.name;
    target.priceCents = body.priceCents;
    target.v1PublicNavigation = body.published;
    target.v1CheckoutScope = body.inStock;
    for (const update of body.variants ?? []) {
      const variant = target.variants.find((item) => item.id === update.id);
      if (variant) {
        variant.priceCents = update.priceCents;
        variant.isActive = update.isActive;
      }
    }
    const nextUpdatedAt = new Date(Date.parse(currentUpdatedAt) + 1000).toISOString();
    if (adminProductId === "product-local-1") adminProductUpdatedAt = nextUpdatedAt;
    else adminWhistlerUpdatedAt = nextUpdatedAt;
    response.end(JSON.stringify({ product: getAdminProduct(target, adminProductId) }));
    return;
  }

  if (request.url === "/checkout/sessions" && request.method === "POST") {
    const body = await readJsonBody(request);
    const changes = [];
    let subtotalCents = 0;
    for (const item of body.items ?? []) {
      const catalogProduct = [
        product,
        part40Product,
        ...replacementNetProducts,
        ...accessoryProducts,
        ...tableDetailProducts
      ].find((candidate) => candidate.slug === item.productSlug);
      const variant = catalogProduct?.variants?.find(
        (candidate) => candidate.key === item.selectedVariantKey
      );
      const currentPrice = variant?.priceCents ?? catalogProduct?.priceCents ?? 0;
      const cartLineId = getMockCartLineId(item);
      if (!catalogProduct?.v1CheckoutScope || (variant && !variant.isActive)) {
        changes.push({ cartLineId, status: "unavailable" });
      } else if (item.expectedUnitPriceCents !== currentPrice) {
        changes.push({
          cartLineId,
          currency: "CAD",
          name: catalogProduct.name,
          status: "price_changed",
          unitPriceCents: currentPrice
        });
      } else {
        subtotalCents += currentPrice * (item.quantity ?? 1);
      }
    }
    if (changes.length > 0) {
      response.statusCode = 409;
      response.end(
        JSON.stringify({ code: "cart_changed", message: "Your cart changed.", items: changes })
      );
      return;
    }
    const shippingCents = subtotalCents > 10000 ? 0 : 1500;
    response.end(
      JSON.stringify({
        checkoutSessionId: "cs_test_local",
        checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_local",
        currency: "CAD",
        orderId: "order-local",
        publicReference: "TPP-LOCAL",
        shippingCents,
        shippingLabel: shippingCents === 0 ? "Free shipping" : "Flat-rate shipping",
        subtotalCents,
        totalCents: subtotalCents + shippingCents
      })
    );
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ message: "Not found in local mock catalog." }));
});

function isAdminAuthorized(request) {
  return request.headers["x-internal-orders-token"] === "local-test-token";
}

function unauthorized(response) {
  response.statusCode = 401;
  response.end(JSON.stringify({ message: "Unauthorized" }));
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function getMockCartLineId(item) {
  const options = [...(item.selectedOptions ?? [])]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((option) => `${option.name.trim().toLowerCase()}=${option.value.trim().toLowerCase()}`)
    .join("&");
  return options ? `${item.productSlug}::${options}` : item.productSlug;
}

function colorVariant(key, color, priceCents) {
  return {
    currency: "CAD",
    isActive: true,
    key,
    name: color,
    options: [
      {
        displayName: "Color",
        label: color,
        name: "Color",
        optionSortOrder: 10,
        sortOrder: 10,
        value: color
      }
    ],
    priceCents,
    purchaseModeOverride: null
  };
}

function portlandOutdoorVariant(key, color) {
  return {
    currency: "CAD",
    isActive: true,
    key,
    name: `V2 ${color}`,
    options: [
      {
        displayName: "Model",
        label: "V2",
        name: "Model",
        optionSortOrder: 10,
        sortOrder: 10,
        value: "V2"
      },
      {
        displayName: "Color",
        label: color,
        name: "Color",
        optionSortOrder: 20,
        sortOrder: 20,
        value: color
      }
    ],
    priceCents: null,
    purchaseModeOverride: null
  };
}

server.listen(port, "127.0.0.1", () => {
  console.log(`Local mock catalog listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
