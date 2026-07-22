import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

test("replacement-parts page makes Part 40 and real help the clear starting points", async ({
  page
}) => {
  await page.setViewportSize({ height: 900, width: 1440 });
  const response = await page.goto("/replacement-parts/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Replacement Parts & Manuals | Tiger PingPong");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Find Tiger PingPong Part 40, download table manuals, watch setup videos, or send our Vancouver team a photo for replacement-part help."
  );

  await expect(
    page.getByRole("heading", { level: 1, name: "Keep the rally going." })
  ).toBeVisible();
  await expect(page.locator("main h1")).toHaveCount(1);

  const hero = page.getByTestId("replacement-parts-hero");
  await expect(hero.getByText("Most-requested fix", { exact: true })).toBeVisible();
  await expect(hero.locator("img")).toHaveAttribute(
    "alt",
    "Black Tiger Part 40 replacement clip on a white background"
  );
  await expect(hero.locator("img")).toHaveAttribute(
    "src",
    /res\.cloudinary\.com.*replacement-parts.*part-40/
  );
  await expect(hero.getByRole("link", { name: "Find Part 40" })).toHaveAttribute(
    "href",
    "#part-40"
  );

  const photoEmailHref = await hero
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

test("Part 40 stays on the dedicated support hub instead of generic discovery", async ({
  request
}) => {
  const genericProductPage = await request.get(
    "/catalog/products/tiger-pingpong-replacement-part-40"
  );
  expect(genericProductPage.status()).toBe(404);

  const genericCatalog = await (await request.get("/catalog")).text();
  expect(genericCatalog).not.toContain("Tiger PingPong Part 40");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/catalog/products/tiger-pingpong-replacement-part-40");
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
      page.getByRole("heading", { level: 1, name: "Keep the rally going." })
    ).toBeVisible();

    const layout = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="replacement-parts-hero"]');
      const heroImage = hero?.querySelector("img");
      const firstManual = document.querySelector('[data-testid="manual-card"]');

      return {
        clientWidth: document.documentElement.clientWidth,
        firstManualWidth: firstManual?.getBoundingClientRect().width ?? 0,
        heroImageWidth: heroImage?.getBoundingClientRect().width ?? 0,
        heroWidth: hero?.getBoundingClientRect().width ?? 0,
        scrollWidth: document.documentElement.scrollWidth
      };
    });

    expect(layout.scrollWidth, `${viewport.width}px`).toBe(layout.clientWidth);
    expect(layout.heroImageWidth, `${viewport.width}px hero image`).toBeGreaterThan(180);
    expect(layout.heroImageWidth, `${viewport.width}px hero containment`).toBeLessThanOrEqual(
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
    await expect(page.getByTestId("replacement-parts-hero").locator("img")).toBeVisible();
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
