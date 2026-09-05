import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { mockOrigin } from "../e2e-endpoints";

test("published out-of-stock Whistler stays visible and cannot be purchased", async ({
  page,
  request
}) => {
  test.skip(
    process.env.MOCK_WHISTLER_OUT_OF_STOCK !== "1",
    "Run with the dedicated out-of-stock fixture"
  );
  await page.goto("/tables");
  await expect(page.getByRole("link", { name: /Whistler/i }).first()).toBeVisible();
  await page.goto("/catalog/products/tiger-whistler-indoor-table");
  await expect(page.locator("h1")).toContainText("Whistler");
  await expect(
    page
      .getByRole("complementary", { name: /purchase panel/ })
      .getByText("Out of stock", { exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to cart", exact: true })).toHaveCount(0);
  // Only the local mock endpoint is contacted. Real checkout rejection is covered by unit tests.
  const rejected = await request.post(`${mockOrigin}/checkout/sessions`, {
    data: {
      items: [
        {
          productSlug: "tiger-whistler-indoor-table",
          quantity: 1,
          selectedOptions: [],
          expectedUnitPriceCents: 160000
        }
      ]
    }
  });
  expect(rejected.status()).toBe(409);
  expect(await rejected.json()).not.toHaveProperty("checkoutSessionId");
  await mkdir(path.resolve("output/admin-safety"), { recursive: true });
  await page.screenshot({
    path: path.resolve("output/admin-safety/whistler-storefront.png"),
    fullPage: true,
    style: "nextjs-portal { visibility: hidden; }"
  });
});
