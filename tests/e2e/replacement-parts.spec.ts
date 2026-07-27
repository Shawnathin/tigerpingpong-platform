import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const resetMarker = "tigerpingpong.playwright.cart-reset";

    if (window.sessionStorage.getItem(resetMarker) === "done") {
      return;
    }

    window.localStorage.removeItem("tigerpingpong.cart.v1");
    window.sessionStorage.setItem(resetMarker, "done");
  });
});

test("replacement-parts page welcomes people into the parts finder before Part 40", async ({
  page
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const response = await page.goto("/replacement-parts/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Replacement Parts & Manuals | Tiger PingPong");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Shop Tiger PingPong Part 40, a standard replacement net, and the Expo & Portland net upgrade system—or find manuals and real help in Vancouver."
  );

  await expect(page.getByRole("heading", { level: 1, name: "Let's find the fix." })).toBeVisible();
  await expect(page.locator("main h1")).toHaveCount(1);

  const hero = page.getByTestId("replacement-parts-hero");
  await expect(hero).toContainText("Start with whatever you know");
  await expect(hero).not.toContainText("Most-requested fix");
  await expect(hero.locator("img")).toHaveCount(0);

  const finder = hero.getByTestId("parts-finder");
  await expect(
    finder.getByRole("heading", { level: 2, name: "Start with what you know." })
  ).toBeVisible();
  await expect(finder.getByRole("link", { name: "Shop common parts" })).toHaveAttribute(
    "href",
    "#part-40"
  );
  await expect(finder.getByRole("link", { name: "Find your manual" })).toHaveAttribute(
    "href",
    "#manuals"
  );

  const photoEmailHref = await finder
    .getByRole("link", { name: "Send us a photo" })
    .getAttribute("href");
  const decodedPhotoEmailHref = decodeURIComponent((photoEmailHref ?? "").replaceAll("+", " "));
  expect(decodedPhotoEmailHref).toContain("mailto:info@tigerpingpong.com");
  expect(decodedPhotoEmailHref).toContain("Replacement part help");
  expect(decodedPhotoEmailHref).toContain("I'll attach a photo of the part and the table label.");

  const part40 = page.getByTestId("part-40-feature");
  await expect(
    part40.getByRole("heading", { level: 2, name: "Part 40. Small clip. Big save." })
  ).toBeVisible();
  await expect(
    part40.getByText("Good news: Part 40 fits in an envelope. The nearly four-foot rod does not.", {
      exact: true
    })
  ).toBeVisible();
  await expect(
    part40.getByText(
      "Part 40 is used on selected Expo Indoor, Expo Outdoor, Portland Indoor, and Portland Outdoor tables.",
      { exact: true }
    )
  ).toBeVisible();

  const part40EmailHref = await part40
    .getByRole("link", { name: "Not sure? Send us a photo before ordering.", exact: true })
    .first()
    .getAttribute("href");
  const decodedPart40EmailHref = decodeURIComponent((part40EmailHref ?? "").replaceAll("+", " "));
  expect(decodedPart40EmailHref).toContain("Part 40 fit check");
  expect(decodedPart40EmailHref).toContain("Approximate purchase year:");
  expect(decodedPart40EmailHref).toContain("Order number (if available):");

  await expect(page.locator("main")).not.toContainText("TP03");
  await expect(part40.locator("form, input, select, fieldset")).toHaveCount(0);
});

test("Part 40 uses the live catalog price and the existing cart and shipping rules", async ({
  page
}) => {
  await page.goto("/replacement-parts/");

  const purchase = page.getByTestId("part-40-purchase");
  await expect(purchase.getByTestId("part-40-live-price")).toHaveText("$7.00 CAD");
  await expect(
    purchase.getByText("Orders $100 CAD or under use $15 CAD flat-rate shipping.", {
      exact: true
    })
  ).toBeVisible();

  const addButton = purchase.getByRole("button", { name: "Add to Cart" });
  await addButton.focus();
  await expect(addButton).toBeFocused();
  await page.keyboard.press("Enter");

  const confirmation = purchase.getByRole("status");
  await expect(confirmation).toContainText("Part 40 is in your cart.");
  const supportLink = purchase.getByRole("link", {
    name: "Not sure? Send us a photo before ordering."
  });
  await page.keyboard.press("Tab");
  await expect(supportLink).toBeFocused();
  await page.keyboard.press("Tab");

  const viewCart = confirmation.getByRole("link", { name: "View Cart" });
  await expect(viewCart).toBeFocused();
  await viewCart.click();
  await expect(page).toHaveURL(/\/cart\/?$/);
  await expect(page.getByRole("region", { name: "Cart review" })).toBeVisible({
    timeout: 15_000
  });

  const cartItem = page.locator("main article").filter({ hasText: "Tiger PingPong Part 40" });
  await expect(cartItem).toContainText("$7.00 each");
  await expect(
    cartItem.getByRole("link", { name: "Tiger PingPong Part 40", exact: true })
  ).toHaveAttribute("href", "/replacement-parts/#part-40");

  const orderSummary = page.getByRole("complementary", { name: "Order summary" });
  await expect(orderSummary).toContainText("Subtotal$7.00");
  await expect(orderSummary).toContainText("Shipping$15.00");
  await expect(orderSummary).toContainText("Total$22.00");
});

test("replacement-net cards distinguish the net-only fix from the complete upgrade", async ({
  page
}) => {
  await page.goto("/replacement-parts/");

  await expect(
    page.getByRole("heading", { level: 2, name: "What needs replacing?" })
  ).toBeVisible();
  await expect(page.getByTestId("replacement-nets-section")).not.toContainText(
    "Keep what still works, or update the whole table-side system."
  );

  const standardNet = page.locator("#standard-replacement-net");
  await expect(standardNet).toBeVisible();
  await expect(standardNet).toContainText("Keep the posts. Replace the net.");
  await expect(standardNet).toContainText(
    "A standard replacement net for any standard PingPong table—Tiger or otherwise."
  );
  await expect(standardNet.locator("li").filter({ hasText: "One replacement net" })).toBeVisible();
  await expect(
    standardNet.getByText("Posts and mounting hardware are not included.", { exact: true })
  ).toBeVisible();
  await expect(standardNet.locator("img")).toHaveAttribute(
    "alt",
    "Folded black standard PingPong replacement net with white top tape"
  );
  await expect(standardNet.locator("img")).toHaveAttribute(
    "src",
    /v1785178768\/tiger-pingpong\/products\/replacement-parts\/replacement-nets\/tiger-replacement-net-primary-01\.jpg/
  );

  const upgrade = page.locator("#expo-portland-net-upgrade");
  await expect(upgrade).toBeVisible();
  await expect(upgrade).toContainText("Replace the whole net setup.");
  await expect(upgrade).toContainText(
    "Fits every Tiger PingPong Expo and Portland table, indoor or outdoor."
  );
  await expect(upgrade).toContainText("It does not fit Whistler or Plaza.");
  for (const includedItem of [
    "Replacement net",
    "Two triangular support pieces",
    "Net-support assembly",
    "All installation hardware",
    "Two new side panels"
  ]) {
    await expect(upgrade.locator("li").filter({ hasText: includedItem })).toBeVisible();
  }
  await expect(upgrade).toContainText(
    "Older Expo and Portland tables used removable metal uprights, and those pieces were easy to misplace."
  );
  await expect(upgrade).toContainText(
    "The earlier and current hardware do not interchange piece by piece."
  );
  await expect(upgrade).toContainText(
    "If anything from the older setup is missing, this complete kit moves the table to the current system."
  );
  await expect(upgrade).toContainText("We know that's more than a little fix.");
  await expect(upgrade.locator("img")).toHaveAttribute(
    "alt",
    "Complete Expo and Portland net upgrade system with side panels, supports, net, and hardware on a white background"
  );
  await expect(upgrade.locator("img")).toHaveAttribute(
    "src",
    /v1785178770\/tiger-pingpong\/products\/replacement-parts\/replacement-nets\/tiger-table-net-replacement-set-primary-01\.jpg/
  );

  await expect(standardNet.locator("form, input, select, fieldset")).toHaveCount(0);
  await expect(upgrade.locator("form, input, select, fieldset")).toHaveCount(0);
});

test("Standard Replacement Net uses its live price and flat-rate cart total", async ({ page }) => {
  await page.goto("/replacement-parts/");

  const purchase = page.getByTestId("standard-replacement-net-purchase");
  await expect(purchase.getByTestId("standard-replacement-net-live-price")).toHaveText(
    "$20.00 CAD"
  );
  await expect(
    purchase.getByText("Orders $100 CAD or under use $15 CAD flat-rate shipping.", {
      exact: true
    })
  ).toBeVisible();

  await purchase.getByRole("button", { name: "Add to Cart" }).click();
  const confirmation = purchase.getByRole("status");
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("link", { name: "View Cart" }).click();

  await expect(page).toHaveURL(/\/cart\/?$/);
  const cartItem = page
    .locator("main article")
    .filter({ hasText: "Tiger PingPong Standard Replacement Net" });
  await expect(cartItem).toContainText("Regular price $20.00 each");

  const orderSummary = page.getByRole("complementary", { name: "Order summary" });
  await expect(orderSummary).toContainText("Subtotal$20.00");
  await expect(orderSummary).toContainText("Shipping$15.00");
  await expect(orderSummary).toContainText("Total$35.00");

  await cartItem.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
});

test("Expo and Portland upgrade uses its live price and free-shipping cart total", async ({
  page
}) => {
  await page.goto("/replacement-parts/");

  const purchase = page.getByTestId("expo-portland-net-upgrade-purchase");
  await expect(purchase.getByTestId("expo-portland-net-upgrade-live-price")).toHaveText(
    "$149.99 CAD"
  );
  await expect(
    purchase.getByText("Orders over $100 CAD ship free across Canada.", {
      exact: true
    })
  ).toBeVisible();

  await purchase.getByRole("button", { name: "Add to Cart" }).click();
  const confirmation = purchase.getByRole("status");
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("link", { name: "View Cart" }).click();

  await expect(page).toHaveURL(/\/cart\/?$/);
  const cartItem = page
    .locator("main article")
    .filter({ hasText: "Tiger PingPong Expo & Portland Net Upgrade System" });
  await expect(cartItem).toContainText("Regular price $149.99 each");

  const orderSummary = page.getByRole("complementary", { name: "Order summary" });
  await expect(orderSummary).toContainText("Subtotal$149.99");
  await expect(orderSummary).toContainText("ShippingFree");
  await expect(orderSummary).toContainText("Total$149.99");

  await cartItem.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty." })).toBeVisible();
});

test("Part 40 falls back to photo help when live catalog data is unavailable", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-tiger-test-catalog-mode": "unavailable" });
  await page.goto("/replacement-parts/");

  const part40 = page.getByTestId("part-40-feature");
  await expect(part40.getByTestId("part-40-purchase")).toHaveCount(0);
  await expect(part40.getByRole("link", { name: "Ask about Part 40" })).toHaveAttribute(
    "href",
    /^mailto:info@tigerpingpong\.com/
  );
  await expect(part40).not.toContainText("$7.00");
  await expect(part40.getByRole("button", { name: /add to cart/i })).toHaveCount(0);
});

test("replacement parts fall back to photo help when live catalog data is unavailable", async ({
  page
}) => {
  await page.setExtraHTTPHeaders({ "x-tiger-test-catalog-mode": "unavailable" });
  await page.goto("/replacement-parts/");

  const standardNet = page.locator("#standard-replacement-net");
  const upgrade = page.locator("#expo-portland-net-upgrade");

  await expect(standardNet.getByTestId("standard-replacement-net-purchase")).toHaveCount(0);
  await expect(upgrade.getByTestId("expo-portland-net-upgrade-purchase")).toHaveCount(0);
  await expect(standardNet).not.toContainText("$20.00");
  await expect(upgrade).not.toContainText("$149.99");
  await expect(standardNet.getByRole("button", { name: /add to cart/i })).toHaveCount(0);
  await expect(upgrade.getByRole("button", { name: /add to cart/i })).toHaveCount(0);
  await expect(standardNet.locator('a[href^="mailto:"]')).toHaveCount(1);
  await expect(upgrade.locator('a[href^="mailto:"]')).toHaveCount(1);
});

test("replacement parts stay on the dedicated support hub instead of generic discovery", async ({
  request
}) => {
  const replacementParts = [
    {
      name: "Tiger PingPong Part 40",
      slug: "tiger-pingpong-replacement-part-40"
    },
    {
      name: "Tiger PingPong Standard Replacement Net",
      slug: "tiger-replacement-net"
    },
    {
      name: "Tiger PingPong Expo & Portland Net Upgrade System",
      slug: "tiger-table-net-replacement-set"
    }
  ];

  const genericCatalog = await (await request.get("/catalog")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();

  for (const replacementPart of replacementParts) {
    const genericProductPage = await request.get(`/catalog/products/${replacementPart.slug}`);
    expect(genericProductPage.status(), replacementPart.slug).toBe(404);
    expect(genericCatalog).not.toContain(replacementPart.name);
    expect(sitemap).not.toContain(`/catalog/products/${replacementPart.slug}`);
  }
});

test("manual shelf exposes five downloads, four setup videos, and no dead controls", async ({
  page
}) => {
  await page.goto("/replacement-parts/");

  const manualCards = page.getByTestId("manual-card");
  await expect(manualCards).toHaveCount(5);

  for (const tableName of [
    "Expo Outdoor",
    "Portland Indoor",
    "Portland Outdoor",
    "Whistler Indoor",
    "Plaza Outdoor"
  ]) {
    await expect(page.getByRole("heading", { level: 3, name: tableName })).toBeVisible();
  }

  const manualLinks = page.locator('main a[download][href*="/raw/upload/"]');
  await expect(manualLinks).toHaveCount(5);

  for (const link of await manualLinks.all()) {
    await expect(link).toHaveAttribute("href", /fl_attachment:.*\.pdf/);
    await expect(link).toHaveAttribute("aria-label", /Download .* manual PDF/);
  }

  const videoLinks = page.locator('main a[href*="youtube.com/watch"]');
  await expect(videoLinks).toHaveCount(4);

  for (const link of await videoLinks.all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAttribute("aria-label", /Watch .* setup video on YouTube/);
  }

  const help = page.getByTestId("parts-help");
  await expect(help.getByRole("link", { name: "Call 1-888-552-5259" })).toHaveAttribute(
    "href",
    "tel:+18885525259"
  );
  await expect(help.getByRole("link", { name: "Email info@tigerpingpong.com" })).toHaveAttribute(
    "href",
    /^mailto:info@tigerpingpong\.com/
  );

  const focusTargets = [
    page.getByRole("link", { name: "Download Expo Outdoor manual PDF" }),
    page.getByRole("link", { name: "Watch Expo Outdoor setup video on YouTube" }),
    help.getByRole("link", { name: "Call 1-888-552-5259" })
  ];

  for (const target of focusTargets) {
    await target.focus();
    await expect(target).toBeFocused();
  }
});

test("replacement-parts experience stays readable and overflow-free across breakpoints", async ({
  page
}) => {
  for (const viewport of [
    { height: 844, width: 390 },
    { height: 844, width: 417 },
    { height: 1024, width: 768 },
    { height: 900, width: 1280 },
    { height: 900, width: 1440 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/replacement-parts/");

    await expect(
      page.getByRole("heading", { level: 1, name: "Let's find the fix." })
    ).toBeVisible();

    const layout = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="replacement-parts-hero"]');
      const finder = hero?.querySelector('[data-testid="parts-finder"]');
      const firstManual = document.querySelector('[data-testid="manual-card"]');

      return {
        clientWidth: document.documentElement.clientWidth,
        finderWidth: finder?.getBoundingClientRect().width ?? 0,
        firstManualWidth: firstManual?.getBoundingClientRect().width ?? 0,
        heroWidth: hero?.getBoundingClientRect().width ?? 0,
        scrollWidth: document.documentElement.scrollWidth
      };
    });

    expect(layout.scrollWidth, `${viewport.width}px`).toBe(layout.clientWidth);
    expect(layout.finderWidth, `${viewport.width}px parts finder`).toBeGreaterThan(250);
    expect(layout.finderWidth, `${viewport.width}px finder containment`).toBeLessThanOrEqual(
      layout.heroWidth
    );
    expect(layout.firstManualWidth, `${viewport.width}px manual card`).toBeGreaterThan(250);
  }
});

test("capture replacement-parts design evidence", async ({ page }) => {
  test.skip(
    process.env.CAPTURE_REPLACEMENT_PARTS_SCREENSHOTS !== "1",
    "Local replacement-parts evidence capture only."
  );
  const outputDirectory = path.resolve("exports/replacement-parts-qa");
  await mkdir(outputDirectory, { recursive: true });

  for (const viewport of [
    { height: 900, name: "desktop", width: 1440 },
    { height: 900, name: "desktop-1280", width: 1280 },
    { height: 1024, name: "tablet", width: 768 },
    { height: 844, name: "mobile-417", width: 417 },
    { height: 844, name: "mobile", width: 390 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/replacement-parts/");
    await expect(page.getByTestId("parts-finder")).toBeVisible();
    await page.screenshot({
      fullPage: false,
      path: path.join(outputDirectory, `replacement-parts-${viewport.name}-viewport.png`)
    });
    await page.screenshot({
      fullPage: true,
      path: path.join(outputDirectory, `replacement-parts-${viewport.name}-full.png`)
    });
  }
});
