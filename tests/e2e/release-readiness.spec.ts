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
  await expect(mainImage).toHaveAttribute("src", /red-paddle-single-cutout/);
  await page.locator('label[for="tiger-premium-balls-6-orange-package-family-pack"]').click();
  await expect(displayedPrice).toHaveText("$120.00");
  await expect(mainImage).toHaveAttribute("src", /aqua-4count-box-angle/);
  await expect(page.getByText("Orders over $100 CAD ship free across Canada.")).toBeVisible();
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

  for (const path of ["/", "/cart", "/privacy-policy", "/returns-policy"]) {
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
