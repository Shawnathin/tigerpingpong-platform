import { mockOrigin } from "../e2e-endpoints";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { getVancouverDate } from "../../apps/web/src/components/staff-orders/shipment-date";

const fixtureHeaders = { "x-internal-orders-token": "local-test-token" };
const evidence = path.resolve("output/admin-safety");

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    Authorization: `Basic ${Buffer.from("local-admin:local-password").toString("base64")}`
  });
  // Shipment/email forms are never submitted, including against the fixture service.
  await page.route("**/admin/orders/**", (route) => {
    if (route.request().method() === "POST")
      throw new Error("Shipment/email submission is forbidden in this suite");
    return route.continue();
  });
  await mkdir(evidence, { recursive: true });
});

for (const width of [1440, 1200, 768, 390]) {
  test(`lean products remain readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto("/admin/products");
    await expect(page.getByRole("heading", { name: "Products", exact: true })).toBeVisible();
    const row = page
      .locator("tr")
      .filter({ has: page.locator('a[href="/admin/products/whistler-local"]') });
    await expect(row.getByText("Published", { exact: true })).toBeVisible();
    await expect(row.getByText("Out of stock", { exact: true })).toBeVisible();
    const edit = row.getByRole("link", { name: /^Edit / });
    await expect(edit).toBeVisible();
    const price = row.locator('[data-label="Price"]');
    expect(
      await price.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return Array.from(range.getClientRects()).length;
      })
    ).toBe(1);
    expect(await edit.evaluate((element) => getComputedStyle(element).whiteSpace)).toBe("nowrap");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    const details = row.locator("details");
    await details.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");
    await expect(details.getByText("Slug", { exact: true })).toBeVisible();
    await page.keyboard.press("Enter");
    await page.screenshot({
      path: path.join(evidence, `products-${width}.png`),
      fullPage: true,
      style: "nextjs-portal { visibility: hidden; }"
    });
  });
}

test("dashboard opens the selected order and shows Vancouver default without submitting", async ({
  page
}) => {
  await page.goto("/admin");
  await expect(page.getByText("TPP-TEST-002", { exact: true })).toHaveAttribute(
    "href",
    "/admin/orders/TPP-TEST-002"
  );
  await page.screenshot({
    path: path.join(evidence, "dashboard.png"),
    fullPage: true,
    style: "nextjs-portal { visibility: hidden; }"
  });
  const before = getVancouverDate();
  await page.getByRole("link", { name: "TPP-TEST-002", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Order TPP-TEST-002", exact: true })
  ).toBeVisible();
  expect([before, getVancouverDate()]).toContain(
    await page.getByLabel("Shipped date (Vancouver)").inputValue()
  );
  await expect(page.getByRole("button", { name: "Save and email tracking" })).toBeVisible();
  await page.screenshot({
    path: path.join(evidence, "order.png"),
    fullPage: true,
    style: "nextjs-portal { visibility: hidden; }"
  });
  await page.goto("/admin/orders/TPP-TEST-001");
  await expect(page.getByLabel("Shipped date (Vancouver)")).toHaveValue("2026-07-16");
});

test("Whistler publication and stock remain independent through fixture saves", async ({
  page,
  request
}) => {
  const reset = () =>
    request.post(`${mockOrigin}/__test/admin-whistler/reset`, { headers: fixtureHeaders });
  expect((await reset()).ok()).toBe(true);
  try {
    await page.goto("/admin/products/whistler-local");
    await expect(page.getByLabel("Publication", { exact: true })).toHaveValue("true");
    await expect(page.getByLabel("Stock", { exact: true })).toHaveValue("false");
    const variants = page.locator('input[name^="variantActive:"]');
    await expect(variants).toHaveCount(2);
    await expect(variants.nth(0)).toBeChecked();
    await expect(page.getByText("Blocked: product out of stock", { exact: true })).toHaveCount(2);
    await page.getByLabel("Product name").fill("Tiger PingPong Whistler — local fixture");
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByText("Product changes were saved.")).toBeVisible();
    await expect(page.getByLabel("Publication", { exact: true })).toHaveValue("true");
    await expect(page.getByLabel("Stock", { exact: true })).toHaveValue("false");
    await variants.nth(1).uncheck();
    await page.getByLabel("Stock", { exact: true }).selectOption("true");
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByText("Product changes were saved.")).toBeVisible();
    await expect(variants.nth(0)).toBeChecked();
    await expect(variants.nth(1)).not.toBeChecked();
    await page.getByLabel("Publication", { exact: true }).selectOption("false");
    await expect(page.getByText("Blocked: product hidden", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByLabel("Stock", { exact: true })).toHaveValue("true");
    await page.getByLabel("Publication", { exact: true }).selectOption("true");
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByLabel("Stock", { exact: true })).toHaveValue("true");
    await variants.nth(0).uncheck();
    await expect(
      page.getByRole("alert").filter({ hasText: "All variants are out of stock" })
    ).toBeVisible();
    await page.getByLabel("Stock", { exact: true }).selectOption("false");
    await expect(
      page.getByRole("alert").filter({ hasText: "All variants are out of stock" })
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByText("Product changes were saved.")).toBeVisible();
  } finally {
    await reset();
  }
  await page.goto("/admin/products/whistler-local");
  for (const width of [1200, 390]) {
    await page.setViewportSize({ width, height: 950 });
    await expect(page.getByLabel("Publication", { exact: true })).toHaveValue("true");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);
    await page.screenshot({
      path: path.join(evidence, `editor-${width}.png`),
      fullPage: true,
      style: "nextjs-portal { visibility: hidden; }"
    });
  }
});
