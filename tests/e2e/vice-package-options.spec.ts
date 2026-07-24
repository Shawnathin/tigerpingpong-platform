import { expect, test } from "@playwright/test";

const VICE_PATH = "/catalog/products/tiger-vice-paddle";
const VICE_SINGLE_VARIANT_KEY = "tiger-vice-package-single";
const VICE_BUNDLE_VARIANT_KEY = "tiger-vice-package-4-pack-6-white-balls";

test("Vice keeps the legacy rail while preserving its exact package choice", async ({ page }) => {
  await page.goto(VICE_PATH);

  await expect(page.locator('[data-purchase-presentation="tiger-v2"]')).toHaveCount(0);
  await expect(page.getByTestId("product-price")).toHaveText("$15.00");

  const singleChoice = page.locator('input[value="single-vice-paddle"]');
  const bundleChoice = page.locator('input[value="4-vice-paddles-6-white-balls"]');

  await expect(singleChoice).toHaveCount(1);
  await expect(bundleChoice).toHaveCount(1);
  await expect(
    page.locator('label:has(input[value="single-vice-paddle"]) [data-vice-package-visual="single"]')
  ).toHaveCount(1);
  await expect(
    page.locator(
      'label:has(input[value="4-vice-paddles-6-white-balls"]) [data-vice-package-visual="bundle"]'
    )
  ).toHaveCount(1);
  await expect(bundleChoice).toHaveAccessibleName("4 Vice paddles + 6 white balls $68.00");
  const bundleVisual = page.locator(
    'label:has(input[value="4-vice-paddles-6-white-balls"]) [data-vice-package-visual="bundle"]'
  );
  await expect(bundleVisual.locator("img")).toHaveCount(5);
  await expect(bundleVisual.locator("img").nth(1)).toHaveAttribute("src", /res\.cloudinary\.com/);

  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(
    page.getByText("Select package options to add this item.", { exact: true })
  ).toBeVisible();
  await expect(singleChoice).toBeFocused();
  await expect(singleChoice.locator("..")).toHaveCSS("outline-style", "solid");

  await bundleChoice.evaluate((element: HTMLInputElement) => element.click());
  await expect(bundleChoice).toBeChecked();
  await expect(page.getByTestId("product-price")).toHaveText("$68.00");

  await page.getByRole("button", { name: "Add to cart" }).click();
  const dialog = page.getByRole("dialog", { name: /is in your cart/i });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("Package Options: 4 Vice paddles + 6 white balls", { exact: true })
  ).toBeVisible();
  await expect(dialog.locator('[data-vice-package-visual="bundle"]')).toHaveCount(1);

  const storedCart = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("tigerpingpong.cart.v1") ?? "null")
  );
  expect(storedCart.items[0]).toMatchObject({
    productSlug: "tiger-vice-paddle",
    selectedVariantKey: VICE_BUNDLE_VARIANT_KEY,
    unitPriceCents: 6800
  });
  expect(storedCart.items[0].selectedOptions[0]).toMatchObject({
    label: "4 Vice paddles + 6 white balls",
    name: "Package Options",
    value: "4-vice-paddles-6-white-balls"
  });

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("Vice package choices remain visible and overflow-free at supported widths", async ({
  page
}) => {
  await page.goto(VICE_PATH);

  for (const width of [390, 417, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('input[value="single-vice-paddle"]')).toHaveCount(1);
    await expect(page.locator('input[value="4-vice-paddles-6-white-balls"]')).toHaveCount(1);

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));

    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  }
});

test("an optionless legacy Vice cart line checks out as the single variant", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    ({ productSlug }) => {
      window.localStorage.setItem(
        "tigerpingpong.cart.v1",
        JSON.stringify({
          version: 1,
          items: [
            {
              cartLineId: productSlug,
              categoryName: "Paddles",
              currency: "CAD",
              imageUrl: null,
              name: "Tiger PingPong Vice Ping Pong Paddle",
              productKind: "paddle",
              productSlug,
              quantity: 1,
              selectedOptions: [],
              unitPriceCents: 1500
            }
          ]
        })
      );
    },
    { productSlug: "tiger-vice-paddle" }
  );

  await page.goto("/cart");
  await expect(
    page.getByText("Package Options: Single Vice Paddle", { exact: true })
  ).toBeVisible();

  const checkoutRequest = page.waitForRequest("**/checkout/sessions");
  await page.getByRole("button", { name: "Checkout" }).click();
  const checkoutBody = (await checkoutRequest).postDataJSON();

  expect(checkoutBody.items[0]).toMatchObject({
    expectedUnitPriceCents: 1500,
    productSlug: "tiger-vice-paddle",
    selectedVariantKey: VICE_SINGLE_VARIANT_KEY,
    selectedOptions: [
      {
        name: "Package Options",
        value: "single-vice-paddle"
      }
    ]
  });
});
