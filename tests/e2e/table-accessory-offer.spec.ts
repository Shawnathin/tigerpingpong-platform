import { expect, test } from "@playwright/test";

const CART_STORAGE_KEY = "tigerpingpong.cart.v1";
const EXPO_PATH = "/catalog/products/tiger-expo-outdoor-table";
const PLAZA_PATH = "/catalog/products/tiger-plaza-outdoor-table-grey";
const TABLE_NOTICE = "Now pick the paddles and balls that fit your game.";
const AQUA_TWO_PACK_VARIANT_KEY = "tiger-aqua-package-2-pack-3-balls";
const AQUA_FOUR_PACK_VARIANT_KEY = "tiger-aqua-package-4-pack-3-balls";
const COVER_PRODUCT_KEY = "tiger-table-cover-black-polyester";

test("table confirmation starts unselected and allows a cover-only offer", async ({ page }) => {
  await page.goto(EXPO_PATH);
  await expect(page.getByText(TABLE_NOTICE, { exact: true })).toBeVisible();

  await page.locator('input[value="Blue"]').evaluate((input: HTMLInputElement) => input.click());
  await page.getByRole("button", { name: "Add to cart" }).click();

  const dialog = page.getByRole("dialog", { name: /is in/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(TABLE_NOTICE, { exact: true })).toBeVisible();
  await expect(
    dialog.getByText("Pick a play set. Add a cover if you need one.", { exact: true })
  ).toHaveCount(0);
  await expect(
    dialog.getByRole("radio", { name: "Aqua — 2 paddles + 3 balls", exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByRole("radio", { name: "Aqua — 4 paddles + 3 balls", exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByRole("radio", { name: "Vice — 4 paddles + 6 white balls", exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByText("Outdoor + indoor · 2 paddles + 3 balls", { exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByText("Outdoor + indoor · 4 paddles + 3 balls", { exact: true })
  ).toBeVisible();
  await expect(dialog.getByText("4 paddles + 6 white balls", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Outdoor fabric · Snug fit", { exact: true })).toBeVisible();
  await expect(dialog.locator('[data-vice-package-visual="bundle"]')).toHaveCount(1);
  await expect(dialog.locator('[data-vice-package-visual="bundle"] img')).toHaveCount(5);

  const playSetChoices = dialog.getByRole("radio");
  await expect(playSetChoices).toHaveCount(3);
  for (const choice of await playSetChoices.all()) {
    await expect(choice).not.toBeChecked();
  }

  const coverChoice = dialog.getByRole("checkbox");
  await expect(coverChoice).not.toBeChecked();
  await expect(dialog.getByRole("button", { name: "Add selected extras" })).toBeDisabled();
  await expect(dialog.getByRole("link", { name: "Go to cart" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep shopping" })).toBeVisible();

  await coverChoice.check();
  const totals = dialog.locator("dl");
  await expect(totals).not.toContainText("Regular");
  await expect(totals).toContainText("You save$16.50");
  await expect(totals).toContainText("Your extras$38.50");

  await dialog.getByRole("button", { name: "Add selected extras" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole("heading", { name: /Tiger Expo Outdoor Table/ })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Tiger PingPong Protective Ping Pong Table Cover/ })
  ).toBeVisible();
  await expect(page.getByText("You save $16.50", { exact: true })).toBeVisible();
});

test("each play-set row keeps the regular price secondary and emphasizes the table price", async ({
  page
}) => {
  await page.goto(EXPO_PATH);
  await page.locator('input[value="Blue"]').evaluate((input: HTMLInputElement) => input.click());
  await page.getByRole("button", { name: "Add to cart" }).click();

  const dialog = page.getByRole("dialog");
  const totals = dialog.locator("dl");
  const choices = [
    {
      label: "Aqua — 2 paddles + 3 balls",
      regular: "$45.00",
      savings: "You save$13.50",
      tablePrice: "$31.50 with your table",
      total: "Your extras$31.50",
      variantKey: AQUA_TWO_PACK_VARIANT_KEY
    },
    {
      label: "Aqua — 4 paddles + 3 balls",
      regular: "$80.00",
      savings: "You save$24.00",
      tablePrice: "$56.00 with your table",
      total: "Your extras$56.00",
      variantKey: AQUA_FOUR_PACK_VARIANT_KEY
    },
    {
      label: "Vice — 4 paddles + 6 white balls",
      regular: "$68.00",
      savings: "You save$20.40",
      tablePrice: "$47.60 with your table",
      total: "Your extras$47.60",
      variantKey: "tiger-vice-package-4-pack-6-white-balls"
    }
  ];

  for (const choice of choices) {
    const choiceRow = dialog.locator(`label:has(input[value$="${choice.variantKey}"])`);
    await expect(choiceRow).toContainText(choice.regular);
    await expect(choiceRow).toContainText(choice.tablePrice);
    await expect(choiceRow).not.toContainText("Save");
    await dialog.getByRole("radio", { name: choice.label, exact: true }).check();
    await expect(totals).toContainText(choice.savings);
    await expect(totals).toContainText(choice.total);
    await expect(totals).not.toContainText("Regular");
  }
});

test("cart pricing is automatic, reversible, and checkout sends list-price hints", async ({
  page
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ cartStorageKey, coverProductKey }) => {
      window.localStorage.setItem(
        cartStorageKey,
        JSON.stringify({
          version: 1,
          items: [
            {
              cartLineId: "tiger-expo-outdoor-table::color=blue",
              categoryName: "Tables",
              currency: "CAD",
              imageUrl: null,
              name: "Tiger Expo Outdoor Table",
              productKey: "tiger-expo-outdoor-table",
              productKind: "table",
              productSlug: "tiger-expo-outdoor-table",
              quantity: 1,
              selectedOptions: [
                {
                  displayName: "Top colour",
                  label: "Blue",
                  name: "Color",
                  value: "Blue"
                }
              ],
              selectedVariantKey: "tiger-expo-outdoor-table-color-blue",
              unitPriceCents: 130000
            },
            {
              cartLineId: coverProductKey,
              categoryName: "Accessories",
              currency: "CAD",
              imageUrl: null,
              name: "Tiger PingPong Protective Ping Pong Table Cover Black Polyester",
              productKey: coverProductKey,
              productKind: "cover",
              productSlug: coverProductKey,
              quantity: 1,
              selectedOptions: [],
              unitPriceCents: 5500
            }
          ]
        })
      );
    },
    { cartStorageKey: CART_STORAGE_KEY, coverProductKey: COVER_PRODUCT_KEY }
  );
  await page.goto("/cart");

  const summary = page.getByRole("complementary", { name: /order summary/i });
  await expect(summary).toContainText("Regular subtotal$1,355.00");
  await expect(summary).toContainText("Table accessory savings-$16.50");
  await expect(summary).toContainText("Subtotal$1,338.50");

  await page.route("**/checkout/sessions", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "Checkout unavailable in this browser test." })
    });
  });
  const checkoutRequest = page.waitForRequest("**/checkout/sessions");
  await page.getByRole("button", { name: "Checkout" }).click();
  const checkoutBody = (await checkoutRequest).postDataJSON();
  expect(checkoutBody.pricingRuleVersion).toBe("table_accessories_30_v1");
  expect(checkoutBody.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        expectedUnitPriceCents: 130000,
        productSlug: "tiger-expo-outdoor-table"
      }),
      expect.objectContaining({
        expectedUnitPriceCents: 5500,
        productSlug: COVER_PRODUCT_KEY
      })
    ])
  );

  await expect(page.getByRole("status")).toHaveText(
    "Checkout could not be started. Please try again or contact us."
  );
  const tableLine = page.locator("article").filter({ hasText: "Tiger Expo Outdoor Table" });
  await tableLine.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("You save $16.50", { exact: true })).toHaveCount(0);
  await expect(summary).toContainText("Subtotal$55.00");
  await expect(summary).not.toContainText("Table accessory savings");
});

test("existing higher-priced play set prevents an inaccurate new 30%-off promise", async ({
  page
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ cartStorageKey, variantKey }) => {
      window.localStorage.setItem(
        cartStorageKey,
        JSON.stringify({
          version: 1,
          items: [
            {
              cartLineId: `tiger-aqua-outdoor-indoor-paddle::package=4-pack-3-balls`,
              categoryName: "Paddles",
              currency: "CAD",
              imageUrl: null,
              name: "Aqua Outdoor / Indoor Paddle",
              productKey: "tiger-aqua-outdoor-indoor-paddle",
              productKind: "paddle",
              productSlug: "tiger-aqua-outdoor-indoor-paddle",
              quantity: 1,
              selectedOptions: [
                {
                  displayName: "Package",
                  label: "4 Pack + 3 Balls",
                  name: "Package",
                  value: "4-pack-3-balls"
                }
              ],
              selectedVariantKey: variantKey,
              unitPriceCents: 8000
            }
          ]
        })
      );
    },
    { cartStorageKey: CART_STORAGE_KEY, variantKey: AQUA_FOUR_PACK_VARIANT_KEY }
  );

  await page.goto(EXPO_PATH);
  await page.locator('input[value="Blue"]').evaluate((input: HTMLInputElement) => input.click());
  await page.getByRole("button", { name: "Add to cart" }).click();

  const dialog = page.getByRole("dialog");
  const aquaTwoPackChoice = dialog
    .locator(`label:has(input[value$="${AQUA_TWO_PACK_VARIANT_KEY}"])`)
    .first();
  await expect(aquaTwoPackChoice).toContainText("Cart price · $45.00");
  await expect(aquaTwoPackChoice).toContainText("Offer already used in your cart.");

  await aquaTwoPackChoice.getByRole("radio").check();
  await expect(dialog.locator("dl")).toContainText("Your extras$45.00");
  await expect(dialog.locator("dl")).not.toContainText("You save");
});

test("Plaza omits the cover, and offer failure never blocks the confirmed table", async ({
  page,
  request
}) => {
  await page.goto(PLAZA_PATH);
  await page.getByRole("button", { name: "Add to cart" }).click();

  const plazaDialog = page.getByRole("dialog");
  await expect(plazaDialog.getByRole("checkbox")).toHaveCount(0);
  await expect(
    plazaDialog.getByText("The current Tiger Table Cover is not compatible with Plaza.", {
      exact: true
    })
  ).toBeVisible();
  await page.keyboard.press("Escape");

  const failedSlug = "tiger-whistler-indoor-table";
  await request.post("http://127.0.0.1:3101/__test/table-accessory-offer-failure", {
    data: { fail: true, slug: failedSlug }
  });

  try {
    await page.goto(`/catalog/products/${failedSlug}`);
    await page.locator('input[value="Blue"]').evaluate((input: HTMLInputElement) => input.click());
    await page.getByRole("button", { name: "Add to cart" }).click();

    const failedDialog = page.getByRole("dialog");
    await expect(failedDialog.getByText(TABLE_NOTICE, { exact: true })).toBeVisible();
    await expect(
      failedDialog.getByText(
        "Accessory choices are temporarily unavailable. Your table is still in your cart.",
        { exact: true }
      )
    ).toBeVisible();
    await expect(failedDialog.getByRole("button", { name: "Add selected extras" })).toHaveCount(0);
    await expect(failedDialog.getByRole("link", { name: "Go to cart" })).toBeVisible();

    const storedCart = await page.evaluate((key) => {
      return JSON.parse(window.localStorage.getItem(key) ?? "null");
    }, CART_STORAGE_KEY);
    expect(storedCart.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          productKey: failedSlug,
          productSlug: failedSlug
        })
      ])
    );
  } finally {
    await request.post("http://127.0.0.1:3101/__test/table-accessory-offer-failure", {
      data: { fail: false, slug: failedSlug }
    });
  }
});

test("table offer modal is keyboard-contained, reduced-motion safe, and responsive", async ({
  page
}) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [390, 417, 768, 1280, 1440]) {
    await page.setViewportSize({ height: 900, width });
    await page.goto(EXPO_PATH);
    await page.evaluate((key) => window.localStorage.removeItem(key), CART_STORAGE_KEY);
    await page.reload();
    await page.locator('input[value="Blue"]').evaluate((input: HTMLInputElement) => input.click());

    const addToCartButton = page.getByRole("button", { name: "Add to cart" });
    await addToCartButton.click();

    const dialog = page.getByRole("dialog");
    const closeButton = dialog.getByRole("button", { name: "Close added to cart dialog" });
    const keepShoppingButton = dialog.getByRole("button", { name: "Keep shopping" });
    const viewCartLink = dialog.getByRole("link", { name: "Go to cart" });
    await expect(closeButton).toBeFocused();
    await viewCartLink.scrollIntoViewIfNeeded();
    await expect(viewCartLink).toBeInViewport();
    await expect(keepShoppingButton).toBeInViewport();

    const overflow = await dialog.evaluate((element) => ({
      clientWidth: element.clientWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      scrollWidth: element.scrollWidth
    }));
    expect(overflow.documentScrollWidth).toBeLessThanOrEqual(overflow.documentClientWidth);
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    const transitionDuration = await dialog
      .locator("label")
      .first()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.001);

    await closeButton.focus();
    await page.keyboard.press("Shift+Tab");
    await expect(keepShoppingButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(closeButton).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(addToCartButton).toBeFocused();
  }
});

test("non-table products keep the original two-action confirmation", async ({ page }) => {
  await page.goto("/catalog/products/tiger-premium-balls-6-orange");
  await page
    .locator('input[value="single-pack"]')
    .evaluate((input: HTMLInputElement) => input.click());
  await page.getByRole("button", { name: "Add to cart" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Keep shopping" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "View cart", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Add selected extras" })).toHaveCount(0);
  await expect(dialog.getByText(TABLE_NOTICE, { exact: true })).toHaveCount(0);
});
