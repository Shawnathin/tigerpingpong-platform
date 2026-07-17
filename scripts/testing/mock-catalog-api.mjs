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
  media: [],
  variants: []
};
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

const server = createServer((request, response) => {
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  if (request.url === "/catalog/health") {
    response.end(
      JSON.stringify({
        status: "ok",
        service: "local-mock-catalog",
        timestamp: new Date().toISOString(),
        counts: { brands: 1, categories: 1, productFamilies: 1, products: 1, variants: 0, media: 0 }
      })
    );
    return;
  }

  if (request.url === "/catalog/products") {
    response.end(JSON.stringify({ products: [product] }));
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

  response.statusCode = 404;
  response.end(JSON.stringify({ message: "Not found in local mock catalog." }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local mock catalog listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
