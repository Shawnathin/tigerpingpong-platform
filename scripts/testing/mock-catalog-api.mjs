#!/usr/bin/env node

import { createServer } from "node:http";

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
const tableProducts = [
  {
    key: "tiger-expo-outdoor-table",
    slug: "tiger-expo-outdoor-table",
    name: "Tiger Expo Outdoor Table",
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
    name: "Tiger Portland Indoor Table",
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
    name: "Tiger Portland Outdoor Table",
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
    name: "Tiger Whistler Indoor Table",
    productKind: "table",
    purchaseMode: "online_checkout",
    priceCents: 160000,
    currency: "CAD",
    v1PublicNavigation: true,
    v1CheckoutScope: true,
    shippingReviewRequired: false,
    family: { key: "whistler", slug: "whistler", name: "Whistler" },
    category: { key: "tables", slug: "tables", name: "Tables" },
    primaryMedia: null
  },
  {
    key: "tiger-plaza-outdoor-table-grey",
    slug: "tiger-plaza-outdoor-table-grey",
    name: "Tiger Plaza Outdoor Table Grey",
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
let adminProductUpdatedAt = "2026-07-16T12:00:00.000Z";

function getAdminProduct() {
  return {
    id: "product-local-1",
    key: product.key,
    slug: product.slug,
    name: product.name,
    sku: "LOCAL-TEST-SKU",
    category: { id: "category-local-1", ...product.category },
    type: product.productKind,
    priceCents: product.priceCents,
    currency: product.currency,
    status: product.v1CheckoutScope ? "active" : "archived",
    visible: product.v1PublicNavigation,
    v1CheckoutScope: product.v1CheckoutScope,
    purchaseMode: product.purchaseMode,
    checkoutEligible: product.v1CheckoutScope,
    checkoutEligibilityReasons: [],
    imageStatus: {
      primaryImageUrl: product.media[0].cloudinarySecureUrl,
      status: "public_image_available"
    },
    primaryImageUrl: product.media[0].cloudinarySecureUrl,
    variantCount: product.variants.length,
    mediaCount: product.media.length,
    updatedAt: adminProductUpdatedAt,
    brand: { key: "tiger", name: "Tiger Ping Pong", slug: "tiger" },
    family: { id: "family-local-1", ...product.family, isPublic: true, isActive: true },
    variants: product.variants.map((variant) => ({
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
  subtotalCents: 800,
  shippingCents: 1500,
  totalCents: 2300,
  taxAmountCents: 0,
  shippingRule: "flat_rate",
  checkoutSource: "local_browser_fixture",
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
      unitPriceCents: 800,
      quantity: 1,
      lineTotalCents: 800,
      createdAt: "2026-07-16T10:00:00.000Z"
    }
  ]
};

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3100");
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
        counts: { brands: 1, categories: 2, productFamilies: 6, products: 6, variants: 0, media: 0 }
      })
    );
    return;
  }

  if (request.url === "/catalog/products") {
    response.end(JSON.stringify({ products: [product, ...tableProducts] }));
    return;
  }

  if (request.url === `/catalog/products/${product.slug}`) {
    response.end(JSON.stringify({ product }));
    return;
  }

  if (request.url === `/internal/orders/${internalOrder.publicReference}`) {
    if (request.headers["x-internal-orders-token"] !== "local-test-token") {
      response.statusCode = 401;
      response.end(JSON.stringify({ message: "Unauthorized" }));
      return;
    }

    response.end(JSON.stringify({ order: internalOrder }));
    return;
  }

  if (request.url?.startsWith("/api/admin/products?") && request.method === "GET") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    response.end(JSON.stringify({ count: 1, items: [getAdminProduct()] }));
    return;
  }

  if (request.url === "/api/admin/products/product-local-1" && request.method === "GET") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    response.end(JSON.stringify({ product: getAdminProduct() }));
    return;
  }

  if (request.url === "/api/admin/products/product-local-1" && request.method === "PATCH") {
    if (!isAdminAuthorized(request)) return unauthorized(response);
    const body = await readJsonBody(request);
    if (body.expectedUpdatedAt !== adminProductUpdatedAt) {
      response.statusCode = 409;
      response.end(
        JSON.stringify({ message: "This product changed after the editor was opened." })
      );
      return;
    }
    product.name = body.name;
    product.priceCents = body.priceCents;
    product.v1PublicNavigation = body.availableForSale;
    product.v1CheckoutScope = body.availableForSale;
    for (const update of body.variants ?? []) {
      const variant = product.variants.find((item) => item.id === update.id);
      if (variant) {
        variant.priceCents = update.priceCents;
        variant.isActive = update.isActive;
      }
    }
    adminProductUpdatedAt = new Date(Date.parse(adminProductUpdatedAt) + 1000).toISOString();
    response.end(JSON.stringify({ product: getAdminProduct() }));
    return;
  }

  if (request.url === "/checkout/sessions" && request.method === "POST") {
    const body = await readJsonBody(request);
    const changes = [];
    for (const item of body.items ?? []) {
      const variant = product.variants.find(
        (candidate) => candidate.key === item.selectedVariantKey
      );
      const currentPrice = variant?.priceCents ?? product.priceCents;
      const cartLineId = getMockCartLineId(item);
      if (!product.v1CheckoutScope || (variant && !variant.isActive)) {
        changes.push({ cartLineId, status: "unavailable" });
      } else if (item.expectedUnitPriceCents !== currentPrice) {
        changes.push({
          cartLineId,
          currency: "CAD",
          name: product.name,
          status: "price_changed",
          unitPriceCents: currentPrice
        });
      }
    }
    if (changes.length > 0) {
      response.statusCode = 409;
      response.end(
        JSON.stringify({ code: "cart_changed", message: "Your cart changed.", items: changes })
      );
      return;
    }
    response.end(
      JSON.stringify({
        checkoutSessionId: "cs_test_local",
        checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_local",
        currency: "CAD",
        orderId: "order-local",
        publicReference: "TPP-LOCAL",
        shippingCents: 1500,
        shippingLabel: "Flat-rate shipping",
        subtotalCents: 800,
        totalCents: 2300
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

server.listen(port, "127.0.0.1", () => {
  console.log(`Local mock catalog listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
