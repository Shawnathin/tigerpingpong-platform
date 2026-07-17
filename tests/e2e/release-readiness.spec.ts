import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

test("public and policy routes render with baseline security headers", async ({ page }) => {
  for (const path of [
    "/",
    "/cart",
    "/privacy-policy",
    "/terms-and-conditions",
    "/returns-policy"
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    expect(response?.headers()["x-frame-options"], path).toBe("DENY");
    await expect(page.locator("h1")).toBeVisible();
  }

  await page.goto("/privacy-policy");
  await expect(page.getByRole("link", { name: "Terms & Conditions" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Returns Policy" }).first()).toBeVisible();
  await expect(page.getByText(/do not sell personal information/i)).toBeVisible();
  await expect(page.getByText(/owner review draft/i)).toHaveCount(0);

  await page.goto("/terms-and-conditions");
  await expect(page.getByText(/checkout redirect alone does not confirm payment/i)).toBeVisible();
  await expect(page.getByText(/orders over \$100 CAD ship free/i)).toBeVisible();
  await expect(page.getByText(/Stripe calculates and displays applicable taxes/i)).toBeVisible();

  await page.goto("/returns-policy");
  await expect(page.getByText(/within five days of receiving the product/i)).toBeVisible();
  await expect(
    page.getByText(/return shipping charges may apply to returned tables/i)
  ).toBeVisible();
  await expect(page.getByText(/14 days/i)).toHaveCount(0);
});

test("homepage promotions balance desktop headlines and keep one complete panel in view", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");

  const aquaPanel = page.locator('article[data-tone="aqua"]');
  await expect(aquaPanel.getByRole("heading", { level: 1 })).toHaveText("Make a splash.");
  await expect(page.locator('article[data-tone="portland"] h2')).toHaveText("Take it outside.");
  await expect(page.locator('article[data-tone="cover"] h2')).toHaveText("Ultra durable.");

  const aquaBounds = await aquaPanel.boundingBox();
  expect(aquaBounds).not.toBeNull();
  expect((aquaBounds?.y ?? 0) + (aquaBounds?.height ?? 0)).toBeLessThanOrEqual(720);
});

test("staff routes fail closed when credentials are absent", async ({ request }) => {
  for (const path of ["/admin", "/internal/orders"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
    expect(response.headers()["cache-control"], path).toContain("no-store");
    expect(response.headers()["x-robots-tag"], path).toContain("noindex");
  }
});

test("Nest 11 runtime preserves health, CORS, headers, auth, safe errors, and raw webhook bodies", async ({
  request
}) => {
  const health = await request.get("http://127.0.0.1:3102/health");
  expect(health.status()).toBe(200);
  expect(health.headers()["x-frame-options"]).toBe("DENY");
  expect(health.headers()["x-content-type-options"]).toBe("nosniff");
  expect(health.headers()["x-powered-by"]).toBeUndefined();

  const cors = await request.fetch("http://127.0.0.1:3102/checkout/sessions", {
    headers: {
      "Access-Control-Request-Method": "POST",
      Origin: "http://127.0.0.1:3100"
    },
    method: "OPTIONS"
  });
  expect(cors.ok()).toBeTruthy();
  expect(cors.headers()["access-control-allow-origin"]).toBe("http://127.0.0.1:3100");

  for (const token of [undefined, "wrong-token"]) {
    const protectedResponse = await request.get("http://127.0.0.1:3102/internal/orders", {
      headers: token ? { "x-internal-orders-token": token } : undefined
    });
    expect(protectedResponse.status()).toBe(401);
    expect(protectedResponse.headers()["cache-control"]).toContain("no-store");
    expect(await protectedResponse.text()).not.toContain("stack");
  }

  for (const token of [undefined, "wrong-token", "local-test-token"]) {
    const productWrite = await request.patch(
      "http://127.0.0.1:3102/api/admin/products/product-local-1",
      {
        data: {},
        headers: token ? { "x-internal-orders-token": token } : undefined
      }
    );
    expect(productWrite.status(), `product write token ${token ?? "missing"}`).toBe(
      token === "local-test-token" ? 400 : 401
    );
  }

  const webhook = await request.post("http://127.0.0.1:3102/webhooks/stripe", {
    data: { type: "checkout.session.completed" },
    headers: { "stripe-signature": "invalid-local-signature" }
  });
  const webhookBody = await webhook.text();
  expect(webhook.status()).toBe(400);
  expect(webhookBody).toContain("signature verification failed");
  expect(webhookBody).not.toContain("whsec_local_test");

  const removedShipmentEmail = await request.post(
    "http://127.0.0.1:3102/internal/orders/TPP-TEST-001/shipment-email",
    { headers: { "x-internal-orders-token": "local-test-token" } }
  );
  expect(removedShipmentEmail.status()).toBe(404);
});

test("add-to-cart dialog traps focus, closes on Escape, and restores focus", async ({ page }) => {
  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  await page.locator('label[for="tiger-premium-balls-6-orange-package-single-pack"]').click();
  const addButton = page.getByRole("button", { name: "Add to cart" });
  await addButton.click();

  const dialog = page.getByRole("dialog", { name: /is in your cart/i });
  const closeButton = page.getByRole("button", { name: "Close added to cart dialog" });
  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "View cart" })).toBeFocused();
  await expect(page.getByText("Recommended add-ons")).toHaveCount(0);
  await expect(dialog.locator('a[href="/cart"]')).toHaveCount(1);
  await page.keyboard.press("Escape");

  await expect(dialog).toBeHidden();
  await expect(addButton).toBeFocused();
});

test("priced product options update the displayed price and shipping message", async ({ page }) => {
  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  const displayedPrice = page.getByTestId("product-price");
  const mainImage = page.getByTestId("product-main-image");

  await expect(displayedPrice).toHaveText("$8.00");
  await expect(page.getByText("In stock — ships within 24 business hours.")).toBeVisible();
  await expect(mainImage).toHaveAttribute("src", /red-paddle-single-cutout/);
  await page.locator('label[for="tiger-premium-balls-6-orange-package-family-pack"]').click();
  await expect(displayedPrice).toHaveText("$120.00");
  await expect(mainImage).toHaveAttribute("src", /aqua-4count-box-angle/);
  await expect(page.getByText("Orders over $100 CAD ship free across Canada.")).toBeVisible();
});

test("staff can safely edit an existing product and stale carts require review", async ({
  page
}) => {
  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  await page.locator('label[for="tiger-premium-balls-6-orange-package-family-pack"]').click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page
    .getByRole("dialog", { name: /is in your cart/i })
    .getByRole("link", { name: "View cart" })
    .click();
  await expect(page.getByText("$120.00 each")).toBeVisible();

  await page.setExtraHTTPHeaders({
    Authorization: `Basic ${Buffer.from("local-admin:local-password").toString("base64")}`
  });
  await page.goto("/admin/products");
  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: /Edit Tiger PingPong/i })).toBeVisible();

  await page.locator('input[name="expectedUpdatedAt"]').evaluate((element) => {
    (element as HTMLInputElement).value = "2026-07-16T11:00:00.000Z";
  });
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText(/changed elsewhere/i)).toBeVisible();

  await page
    .getByLabel("Product name")
    .fill("Tiger PingPong Premium 3-Star Ping Pong Balls 6 Pack Orange Updated");
  await page.locator('input[name="variantPrice:variant-family-pack"]').fill("99.99");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.getByText("Product changes were saved.")).toBeVisible();

  await page.setExtraHTTPHeaders({});
  await page.goto("/cart");
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page.getByText(/Your cart changed/i)).toBeVisible();
  await expect(page.getByText("$99.99 each")).toBeVisible();
  await expect(page.getByText("$15.00", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Checkout" })).toBeEnabled();
});

test("primary discovery and shipping routes retain factual storefront behavior", async ({
  page
}) => {
  await page.goto("/");
  const publicNavigation = page.getByRole("navigation", { name: "Public navigation" });
  await expect(publicNavigation.getByRole("link", { name: "All Tables" })).toHaveCount(0);
  await expect(publicNavigation.getByRole("link", { name: "All Accessories" })).toHaveCount(0);
  await page.getByRole("link", { name: "Balls" }).first().click();
  await expect(page).toHaveURL(/\/accessories\/ping-pong-balls\/?$/);
  await expect(
    page.getByRole("link", { name: /View product details.*6 Pack Orange/i })
  ).toBeVisible();

  for (const path of ["/shipping", "/shipping-returns"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText("Orders $100 CAD or under use $15 CAD flat-rate shipping.")
    ).toBeVisible();
  }

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Shipping & Returns" }).first()).toBeVisible();
  await expect(footer.getByRole("link", { name: "Shipping", exact: true })).toHaveCount(0);
});

test("critical public routes do not overflow at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const path of [
    "/",
    "/cart",
    "/privacy-policy",
    "/terms-and-conditions",
    "/returns-policy"
  ]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(dimensions.scrollWidth, path).toBe(dimensions.clientWidth);
  }
});

test("capture local PR evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_RELEASE_SCREENSHOTS !== "1", "Local evidence capture only.");
  const outputDirectory = path.resolve("docs/qa/release-readiness-local-remediation");
  await mkdir(outputDirectory, { recursive: true });

  await page.goto("/");
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "storefront-home-desktop.png")
  });

  await page.goto("/accessories/ping-pong-balls");
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "category-balls-desktop.png")
  });

  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "product-purchase-panel-desktop.png")
  });

  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog", { name: /is in your cart/i })).toBeVisible();
  await page.screenshot({
    fullPage: false,
    path: path.join(outputDirectory, "add-to-cart-dialog-desktop.png")
  });

  await page
    .getByRole("dialog", { name: /is in your cart/i })
    .getByRole("link", { name: "View cart" })
    .click();
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "cart-desktop.png")
  });

  await page.goto("/shipping");
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "shipping-desktop.png")
  });

  await page.setExtraHTTPHeaders({
    Authorization: `Basic ${Buffer.from("local-admin:local-password").toString("base64")}`
  });
  await page.goto("/admin/orders/TPP-TEST-001");
  await expect(page.getByRole("heading", { name: "Order TPP-TEST-001" })).toBeVisible();
  await expect(page.getByText("Customer notification")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Shipment record" })).toBeVisible();
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "admin-order-detail-desktop.png")
  });
  await page.setExtraHTTPHeaders({});

  await page.goto("/privacy-policy");
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "privacy-policy-desktop.png")
  });

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/returns-policy");
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, "returns-policy-mobile.png")
  });

  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  await page.locator('label[for="tiger-premium-balls-6-orange-package-single-pack"]').click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog", { name: /is in your cart/i })).toBeVisible();
  await page.screenshot({
    fullPage: false,
    path: path.join(outputDirectory, "add-to-cart-dialog-mobile.png")
  });
});
