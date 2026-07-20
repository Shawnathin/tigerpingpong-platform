import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

test("public and policy routes render with baseline security headers", async ({ page }) => {
  test.setTimeout(60_000);

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

test("about story opens on present-day Vancouver and follows the West Coast rally", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/about");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("About Tiger PingPong | Raised on the West Coast");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "From questionable first tables and Vancouver game nights to German-made gear shipped across Canada: meet Tiger PingPong."
  );

  const hero = page.getByTestId("about-current-hero");
  const heroHeading = page.getByRole("heading", {
    level: 1,
    name: "Raised on the West Coast."
  });
  const heroImage = hero.locator("img");
  const firstTable = page.getByAltText(
    "People playing on Tiger's first imported PingPong table at an outdoor Vancouver event."
  );

  await expect(hero).toBeInViewport();
  await expect(heroHeading).toBeInViewport();
  await expect(heroImage).toHaveAttribute("src", /category-heroes(?:%2F|\/)ping-pong-tables/);
  await expect(firstTable).toHaveAttribute("loading", "lazy");
  await expect(
    page.getByAltText(
      "People playing on an early Tiger table in the rain beneath a white event tent."
    )
  ).toHaveAttribute("src", /f_auto,q_auto,w_640/);
  await expect(
    page.getByAltText(
      "Two players smiling and tapping paddles after a game in a crowded Vancouver venue."
    )
  ).toHaveAttribute("src", /f_auto,q_auto,w_750/);

  const landingPositions = await page.evaluate(() => {
    const heroElement = document.querySelector('[data-testid="about-current-hero"]');
    const firstTableImage = document.querySelector(
      'img[alt="People playing on Tiger\'s first imported PingPong table at an outdoor Vancouver event."]'
    );

    return {
      firstTableTop: firstTableImage?.getBoundingClientRect().top ?? 0,
      heroBottom: heroElement?.getBoundingClientRect().bottom ?? 0,
      heroTop: heroElement?.getBoundingClientRect().top ?? 0,
      viewportHeight: window.innerHeight
    };
  });
  expect(landingPositions.heroTop).toBeLessThan(landingPositions.viewportHeight);
  expect(landingPositions.heroBottom).toBeGreaterThan(landingPositions.viewportHeight * 0.7);
  expect(landingPositions.firstTableTop).toBeGreaterThanOrEqual(landingPositions.viewportHeight);

  const anchorOrder = await page.evaluate(() =>
    ["start", "vancouver", "built-better", "names", "across-canada"].map((id) => {
      const section = document.getElementById(id);
      return { id, top: section?.offsetTop ?? -1 };
    })
  );
  expect(anchorOrder.map(({ id }) => id)).toEqual([
    "start",
    "vancouver",
    "built-better",
    "names",
    "across-canada"
  ]);
  expect(anchorOrder.every(({ top }) => top >= 0)).toBeTruthy();
  expect(anchorOrder.map(({ top }) => top)).toEqual(
    [...anchorOrder.map(({ top }) => top)].sort((a, b) => a - b)
  );

  await expect(page.locator('a[href="#first-serve"]')).toHaveText(
    "The story starts with a much worse table."
  );
  await expect(page.locator('a[href="/catalog/products/tiger-expo-outdoor-table"]')).toHaveText(
    "Meet Expo"
  );
  await expect(page.locator('a[href="/catalog/products/tiger-whistler-indoor-table"]')).toHaveText(
    "Meet Whistler"
  );
  await expect(page.locator('a[href="/catalog/products/tiger-portland-outdoor-table"]')).toHaveText(
    "Meet Portland"
  );
  await expect(page.locator('main a[href="/tables/"]')).toHaveText("Find your table");
  await expect(page.locator('main a[href="/contact"]')).toHaveText("Talk to a real person");

  const expoLink = page.locator('a[href="/catalog/products/tiger-expo-outdoor-table"]');
  const whistlerLink = page.locator('a[href="/catalog/products/tiger-whistler-indoor-table"]');
  const portlandLink = page.locator('a[href="/catalog/products/tiger-portland-outdoor-table"]');
  const findTableLink = page.locator('main a[href="/tables/"]');
  const contactLink = page.locator('main a[href="/contact"]');
  await expoLink.focus();
  await expect(expoLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(whistlerLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(portlandLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(findTableLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(contactLink).toBeFocused();

  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.locator("main h2")).toHaveCount(7);
  const imageAlternatives = await page
    .locator("main img")
    .evaluateAll((images) => images.map((image) => image.getAttribute("alt")?.trim() ?? ""));
  expect(imageAlternatives).toHaveLength(12);
  expect(imageAlternatives.every(Boolean)).toBeTruthy();

  const aboutLinks = page.locator(
    'main a[href="#first-serve"], main a[href^="/catalog/products/"], main a[href="/tables/"], main a[href="/contact"]'
  );
  expect(
    await aboutLinks.evaluateAll((links) => links.every((link) => link.tabIndex >= 0))
  ).toBeTruthy();
});

test("about story stays deliberate and overflow-free from mobile through desktop", async ({
  page
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { level: 1, name: "Raised on the West Coast." })
    ).toBeInViewport();

    const layout = await page.evaluate(() => {
      const firstTable = document.querySelector(
        'img[alt="People playing on Tiger\'s first imported PingPong table at an outdoor Vancouver event."]'
      );
      const originCopy = document.querySelector("#first-serve header");

      return {
        clientWidth: document.documentElement.clientWidth,
        firstTableTop: firstTable?.getBoundingClientRect().top ?? 0,
        originCopyPosition: originCopy ? getComputedStyle(originCopy).position : "",
        scrollWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight
      };
    });

    expect(layout.scrollWidth, `${viewport.width}px`).toBe(layout.clientWidth);
    expect(layout.firstTableTop, `${viewport.width}px first table`).toBeGreaterThanOrEqual(
      layout.viewportHeight
    );
    expect(layout.originCopyPosition, `${viewport.width}px origin layout`).toBe(
      viewport.width <= 900 ? "static" : "sticky"
    );
  }
});

test("about story honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");

  const motion = await page.evaluate(() => {
    const heroImage = document.querySelector('[data-testid="about-current-hero"] img');
    const heroCopy = document.querySelector('[data-testid="about-current-hero"] h1')?.parentElement;
    const firstTable = document.querySelector(
      'img[alt="People playing on Tiger\'s first imported PingPong table at an outdoor Vancouver event."]'
    );
    const revealFigure = firstTable?.closest("figure");

    return [heroImage, heroCopy, revealFigure].map((element) =>
      element ? getComputedStyle(element).animationName : "missing"
    );
  });

  expect(motion).toEqual(["none", "none", "none"]);
});

test("capture About West Coast Rally evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_ABOUT_SCREENSHOTS !== "1", "Local About evidence capture only.");
  const outputDirectory = path.resolve("exports/about-story-qa");
  await mkdir(outputDirectory, { recursive: true });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 }
  ]) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(viewport);
    await page.goto("/about");
    const heroImage = page.getByTestId("about-current-hero").locator("img");
    await expect(heroImage).toBeVisible();
    await heroImage.evaluate((image: HTMLImageElement) =>
      image.complete ? undefined : new Promise((resolve) => image.addEventListener("load", resolve))
    );
    await page.screenshot({
      fullPage: false,
      path: path.join(outputDirectory, `about-${viewport.name}-viewport.png`)
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.75) {
        window.scrollTo(0, y);
        await new Promise((resolve) => window.setTimeout(resolve, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      fullPage: true,
      path: path.join(outputDirectory, `about-${viewport.name}-full.png`)
    });
  }
});

test("contact page makes real Vancouver help immediate and useful", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/contact");

  await expect(page).toHaveTitle("Contact Tiger PingPong | Real Help from Vancouver");
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    "content",
    "Tiger PingPong"
  );

  const hero = page.getByTestId("contact-hero");
  const heroCall = page.getByTestId("contact-hero-call");
  const heroEmail = page.getByTestId("contact-hero-email");
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("Need a hand? We’ve got you.");
  await expect(heroCall).toHaveAttribute("href", "tel:+18885525259");
  await expect(heroEmail).toHaveAttribute("href", "mailto:info@tigerpingpong.com");
  const heroImage = hero.getByRole("img");
  await expect(heroImage).toHaveAttribute(
    "alt",
    "Two players smiling and tapping paddles after a game in a crowded Vancouver venue."
  );
  const imageBounds = await heroImage.boundingBox();
  expect(imageBounds).not.toBeNull();
  expect(imageBounds?.width ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(750);

  for (const action of [heroCall, heroEmail]) {
    const bounds = await action.boundingBox();
    expect(bounds).not.toBeNull();
    expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(900);
  }

  await heroCall.focus();
  await expect(heroCall).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(heroEmail).toBeFocused();

  const topics = page.getByTestId("contact-topics");
  const orderHelp = page.getByTestId("contact-order-help");
  const closing = page.getByTestId("contact-closing");
  await expect(topics.getByRole("heading", { level: 2 })).toHaveText("Start wherever you are.");
  await expect(topics.getByRole("heading", { level: 3 })).toHaveText([
    "Help me choose.",
    "Where’s my order?",
    "Something needs fixing.",
    "Canada is large."
  ]);
  await expect(
    topics.getByText(
      "Basement, patio, school, community centre—we’ll help you find the right setup."
    )
  ).toBeVisible();
  await expect(topics.getByText(/brewery/i)).toHaveCount(0);
  await expect(orderHelp.getByRole("heading", { level: 2 })).toHaveAttribute(
    "id",
    "order-help-title"
  );
  await expect(orderHelp.getByRole("link", { name: "Email the details" })).toHaveAttribute(
    "href",
    "mailto:info@tigerpingpong.com"
  );
  await expect(closing.getByRole("link", { name: "Call Tiger" })).toHaveAttribute(
    "href",
    "tel:+18885525259"
  );
  await expect(closing.getByRole("link", { name: "Email Tiger" })).toHaveAttribute(
    "href",
    "mailto:info@tigerpingpong.com"
  );
  await expect(page.locator("main form")).toHaveCount(0);
  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.locator("main h2")).toHaveCount(3);
  await expect(page.locator("main h3")).toHaveCount(4);

  const sectionTops = await page
    .locator(
      '[data-testid="contact-hero"], [data-testid="contact-topics"], [data-testid="contact-order-help"], [data-testid="contact-closing"]'
    )
    .evaluateAll((sections) => sections.map((section) => section.getBoundingClientRect().top));
  expect(sectionTops).toEqual([...sectionTops].sort((left, right) => left - right));
});

test("contact page stays deliberate and overflow-free from mobile through desktop", async ({
  page
}) => {
  for (const width of [390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: width < 900 ? 844 : 900 });
    await page.goto("/contact");

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    expect(dimensions.scrollWidth, `${width}px contact page`).toBe(dimensions.clientWidth);

    if (width === 390) {
      for (const testId of ["contact-hero-call", "contact-hero-email"]) {
        const bounds = await page.getByTestId(testId).boundingBox();
        expect(bounds).not.toBeNull();
        expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(844);
      }
    }
  }
});

test("contact page honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/contact");

  for (const testId of [
    "contact-hero",
    "contact-topics",
    "contact-order-help",
    "contact-closing"
  ]) {
    const animationName = await page
      .getByTestId(testId)
      .evaluate((element) => getComputedStyle(element).animationName);
    expect(animationName, testId).toBe("none");
  }
});

test("capture Contact Real Help evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_CONTACT_SCREENSHOTS !== "1", "Local evidence capture only.");
  const outputDirectory = path.resolve("exports/contact-real-help-qa");
  await mkdir(outputDirectory, { recursive: true });

  for (const viewport of [
    { height: 900, name: "desktop-1440", width: 1440 },
    { height: 844, name: "mobile-390", width: 390 }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/contact");
    await page.getByTestId("contact-hero").getByRole("img").waitFor();
    await page.screenshot({
      fullPage: false,
      path: path.join(outputDirectory, `${viewport.name}-viewport.png`)
    });
    await page.screenshot({
      fullPage: true,
      path: path.join(outputDirectory, `${viewport.name}-full-page.png`)
    });
  }
});

test("tablet product pages use compact navigation and a proportioned purchase panel", async ({
  page
}) => {
  await page.setViewportSize({ width: 1020, height: 801 });
  await page.goto("/catalog/products/tiger-premium-balls-6-orange");

  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(page.locator(".publicMobileCartButton")).toBeVisible();
  await expect(page.locator(".publicCartButton")).toBeHidden();

  const layout = await page.evaluate(() => {
    const productHero = document.querySelector("main section");
    const purchasePanel = document.querySelector('aside[aria-label$="purchase panel"]');
    const addButton = purchasePanel?.querySelector("button");

    return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      heroColumns: productHero ? getComputedStyle(productHero).gridTemplateColumns : "",
      purchaseWidth: purchasePanel?.getBoundingClientRect().width ?? 0,
      addButtonWidth: addButton?.getBoundingClientRect().width ?? 0
    };
  });

  expect(layout.scrollWidth).toBe(layout.clientWidth);
  expect(layout.heroColumns.split(" ")).toHaveLength(2);
  expect(layout.purchaseWidth).toBeGreaterThanOrEqual(340);
  expect(layout.purchaseWidth).toBeLessThanOrEqual(440);
  expect(layout.addButtonWidth).toBeLessThan(400);
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

test("cart summary clarifies tax timing and keeps the checkout encouragement concise", async ({
  page
}) => {
  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  await page.locator('label[for="tiger-premium-balls-6-orange-package-single-pack"]').click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page
    .getByRole("dialog", { name: /is in your cart/i })
    .getByRole("link", { name: "View cart" })
    .click();

  await expect(page.getByText("Taxes", { exact: true })).toBeVisible();
  await expect(page.getByText("Calculated at checkout", { exact: true })).toBeVisible();
  await expect(page.getByText("You’re so close to the next rally!", { exact: true })).toBeVisible();
  await expect(
    page.getByText("One more step and we’ll take it from there.", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("TigerPingPong.ca cart", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Orders over $100 CAD ship free across Canada.", { exact: true })
  ).toHaveCount(0);
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
  await Promise.all([
    page.waitForURL(/\/admin\/products\/[^/]+$/),
    page.getByRole("link", { name: "Edit" }).click()
  ]);
  await expect(page.getByRole("heading", { name: /Edit Tiger PingPong/i })).toBeVisible({
    timeout: 15_000
  });

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
