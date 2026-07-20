import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const AQUA_PATH = "/catalog/products/tiger-aqua-outdoor-indoor-paddle";
const GALLERY = '[aria-label="Product images"]';

async function selectAqua(page: Page, value: string) {
  const input = page.locator(`input[value="${value}"]`);
  await input.check({ force: true });
  await expect(input).toBeChecked();
}

test("Aqua opens with the conversion-first story, metadata, and reviewed media", async ({
  page
}) => {
  const response = await page.goto(AQUA_PATH);

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Aqua Outdoor & Indoor PingPong Paddle | Tiger PingPong");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Meet Aqua, Tiger’s weather-resistant, ultra-durable PingPong paddle for patios, schools, community centres, rec rooms, and real life in Canada."
  );

  await expect(page.getByRole("heading", { level: 1, name: "Aqua Paddle" })).toBeVisible();
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByText("Built for the paddle someone forgot outside.")).toBeVisible();
  await expect(page.getByTestId("product-price")).toContainText("Starting at");
  await expect(page.getByTestId("product-price")).toContainText("$25.00");
  await expect(page.getByText("In stock. Ready to ship.", { exact: true })).toBeVisible();
  await expect(page.getByText("Over $100? Shipping’s on us.", { exact: true })).toBeVisible();
  await expect(
    page.getByText("$100 or less? Just $15 across Canada.", { exact: true })
  ).toBeVisible();
  await expect(page.getByTestId("product-main-image")).toHaveAttribute(
    "data-aqua-white-background",
    "true"
  );
  await expect(page.getByTestId("product-main-image")).toHaveAttribute("data-aqua-visual", "duo");
  await expect(page.locator(`${GALLERY} button`)).toHaveCount(5);
  await expect(
    page.locator('[data-purchase-presentation="tiger-v2"] [data-aqua-white-background="true"]')
  ).toHaveCount(4);

  await expect(
    page.getByRole("heading", { level: 2, name: "Something had to last longer." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Designed in Vancouver." })
  ).toBeVisible();
  await expect(page.getByText("The box works hard too. 100% recyclable packaging.")).toBeVisible();

  for (const anchor of ["buy-aqua", "why-aqua", "designed-in-vancouver"]) {
    await expect(page.locator(`#${anchor}`)).toHaveCount(1);
  }

  await expect(page.getByText(/vendor|quote information|weatherproof|true bounce/i)).toHaveCount(0);
});

test("all four Aqua options show live prices and the correct gallery image", async ({ page }) => {
  await page.goto(AQUA_PATH);

  const cases = [
    {
      label: "Single · Canada Red",
      value: "single-coral-red",
      price: "$25.00",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-02",
      visual: "single-canada-red"
    },
    {
      label: "Single · Ocean Blue",
      value: "single-ocean-blue",
      price: "$25.00",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-01",
      visual: "single-ocean-blue"
    },
    {
      label: "2 paddles + 3 balls",
      value: "2-pack-3-balls",
      price: "$45.00",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-03",
      visual: "two-pack"
    },
    {
      label: "4 paddles + 3 balls",
      value: "4-pack-3-balls",
      price: "$80.00",
      mediaKey: "tiger-aqua-outdoor-indoor-paddle-gallery-04",
      visual: "four-pack"
    }
  ];

  for (const option of cases) {
    await expect(page.getByText(option.label, { exact: true })).toBeVisible();
    await selectAqua(page, option.value);
    await expect(page.getByTestId("product-price")).toHaveText(option.price);
    await expect(page.getByTestId("product-main-image")).toHaveAttribute(
      "data-aqua-visual",
      option.visual
    );
    await expect(page.getByTestId("product-main-image")).toHaveCSS(
      "background-color",
      "rgb(255, 255, 255)"
    );
    await expect(page.locator(`${GALLERY} button`)).toHaveCount(5);
    await expect(
      page.locator(`${GALLERY} button[data-media-key="${option.mediaKey}"]`)
    ).toHaveAttribute("aria-pressed", "true");
  }
});

test("only the Aqua four-pack receives under-threshold free shipping", async ({ page }) => {
  await page.goto(AQUA_PATH);
  await selectAqua(page, "4-pack-3-balls");

  await expect(page.getByTestId("product-price")).toHaveText("$80.00");
  await expect(
    page.getByText("The Aqua 4-Pack w/ 3 Balls ships free across Canada.", { exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "Add to cart" }).click();
  await page
    .getByRole("dialog", { name: /is in your cart/i })
    .getByRole("link", { name: "View cart" })
    .click();

  const shippingRow = page.locator("dt", { hasText: /^Shipping$/ }).locator("..");
  await expect(shippingRow.locator("dd")).toHaveText("Free");

  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  await page.locator('label[for="tiger-premium-balls-6-orange-package-single-pack"]').click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page
    .getByRole("dialog", { name: /is in your cart/i })
    .getByRole("link", { name: "View cart" })
    .click();

  await expect(
    page
      .locator("dt", { hasText: /^Subtotal$/ })
      .locator("..")
      .locator("dd")
  ).toHaveText("$88.00");
  await expect(
    page
      .locator("dt", { hasText: /^Shipping$/ })
      .locator("..")
      .locator("dd")
  ).toHaveText("$15.00");
});

test("Aqua requires a choice, preserves the internal variant key, and sends it to checkout", async ({
  page
}) => {
  await page.goto(AQUA_PATH);

  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByText("Choose your Aqua first.", { exact: true })).toBeVisible();
  await expect(page.locator('input[value="single-coral-red"]')).toBeFocused();

  await selectAqua(page, "single-coral-red");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Package: Single · Canada Red")).toBeVisible();

  const storedCart = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("tigerpingpong.cart.v1") ?? "null")
  );
  expect(storedCart.items[0]).toMatchObject({
    selectedVariantKey: "tiger-aqua-package-single-coral",
    unitPriceCents: 2500
  });
  expect(storedCart.items[0].selectedOptions[0]).toMatchObject({
    label: "Single · Canada Red",
    value: "single-coral-red"
  });

  await page.goto("/cart");
  await expect(page.getByRole("heading", { level: 1, name: "Review your cart." })).toBeVisible();
  const checkoutRequest = page.waitForRequest("**/checkout/sessions");
  await page.getByRole("button", { name: "Checkout" }).click();
  const request = await checkoutRequest;
  const checkoutBody = request.postDataJSON();

  expect(checkoutBody.items[0]).toMatchObject({
    expectedUnitPriceCents: 2500,
    productSlug: "tiger-aqua-outdoor-indoor-paddle",
    selectedVariantKey: "tiger-aqua-package-single-coral"
  });
});

test("Aqua is overflow-free and keeps its two-column option grid on mobile", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 417, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
    { width: 1440, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(AQUA_PATH);

    const layout = await page.evaluate(() => {
      const optionGrid = document.querySelector(
        '[data-purchase-presentation="tiger-v2"] fieldset > div'
      );
      const columns = optionGrid ? getComputedStyle(optionGrid).gridTemplateColumns.split(" ") : [];

      return {
        columns: columns.length,
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.columns).toBe(2);
  }
});

test("Aqua keeps its heading, image, focus, and reduced-motion contracts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(AQUA_PATH);

  const accessibility = await page.evaluate(() => ({
    headingOrder: Array.from(document.querySelectorAll("main h1, main h2")).map((heading) =>
      heading.textContent?.replace(/\s+/g, " ").trim()
    ),
    imagesWithoutAlt: document.querySelectorAll("main img:not([alt])").length,
    lazyStoryImages: document.querySelectorAll("main section img[loading='lazy']").length,
    transitionDurations: ["why-aqua", "designed-in-vancouver"].map(
      (id) => getComputedStyle(document.getElementById(id)!).transitionDuration
    )
  }));

  expect(accessibility.headingOrder).toEqual([
    "Aqua Paddle",
    "Weather-resistant",
    "Made for hard use",
    "Indoor works too",
    "Something had to last longer.",
    "Designed in Vancouver.",
    "Ready for real life."
  ]);
  expect(accessibility.imagesWithoutAlt).toBe(0);
  expect(accessibility.lazyStoryImages).toBe(2);
  expect(
    accessibility.transitionDurations.every((value) => Number.parseFloat(value) <= 0.00001)
  ).toBe(true);

  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.locator('input[value="single-coral-red"]')).toBeFocused();
});

test("tables use Purchasing Rail V2 while non-table accessories retain the legacy rail", async ({
  page
}) => {
  await page.goto("/catalog/products/tiger-expo-outdoor-table");
  await expect(page.locator('[data-purchase-presentation="tiger-v2"]')).toHaveCount(1);
  await expect(page.locator("h1")).toHaveCount(1);

  await page.goto("/catalog/products/tiger-vice-paddle");
  await expect(page.locator('[data-purchase-presentation="tiger-v2"]')).toHaveCount(0);
  await expect(page.locator("h1")).toHaveCount(1);
});

test("capture Aqua V2 visual evidence", async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(process.env.CAPTURE_AQUA_SCREENSHOTS !== "1", "Local evidence capture only.");

  const outputDirectory = path.resolve("exports/aqua-product-qa/playwright");
  await mkdir(outputDirectory, { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const viewport of [
    { height: 1000, name: "desktop-1440", width: 1440 },
    { height: 1024, name: "tablet-768", width: 768 },
    { height: 844, name: "mobile-390", width: 390 }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(AQUA_PATH);
    await page.getByTestId("product-main-image").waitFor();

    await page.screenshot({
      path: path.join(outputDirectory, `${viewport.name}-viewport.png`)
    });

    const lazyImages = page.locator("main img[loading='lazy']");
    for (let index = 0; index < (await lazyImages.count()); index += 1) {
      await lazyImages.nth(index).scrollIntoViewIfNeeded();
    }

    await page.screenshot({
      fullPage: true,
      path: path.join(outputDirectory, `${viewport.name}-full-page.png`)
    });
  }
});
