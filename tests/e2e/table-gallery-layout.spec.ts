import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Exercise intrinsic image sizing deterministically, without making this
  // geometry regression depend on CDN timing or format decoding. Other gallery tests and
  // the visual review still use the real product photos.
  await page.route("https://res.cloudinary.com/**", async (route) => {
    if (route.request().resourceType() !== "image") return route.continue();
    await route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#ddd"/></svg>'
    });
  });
});

async function expectContainedGallery(page: Page) {
  const gallery = page.locator('[data-gallery-presentation="table"]');
  const image = page.getByTestId("product-main-image");
  await expect(image).toBeVisible();
  await expect
    .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
    .toBeGreaterThan(0);

  const layout = await gallery.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    const frame = node.querySelector("figure")!.getBoundingClientRect();
    const image = node.querySelector("figure img")!.getBoundingClientRect();
    const rail = document
      .querySelector('[data-purchase-presentation="tiger-v2"]')!
      .getBoundingClientRect();
    return {
      galleryRight: bounds.right,
      frameLeft: frame.left,
      frameRight: frame.right,
      imageRight: image.right,
      railLeft: rail.left,
      viewportWidth: window.innerWidth
    };
  });

  // Document overflow alone misses a frame painted underneath its sibling rail.
  expect(layout.frameLeft).toBeGreaterThanOrEqual(0);
  expect(layout.frameRight).toBeLessThanOrEqual(layout.galleryRight + 1);
  expect(layout.imageRight).toBeLessThanOrEqual(layout.frameRight + 1);
  expect(layout.frameRight).toBeLessThanOrEqual(layout.viewportWidth);
  if (layout.viewportWidth >= 1100) {
    expect(layout.frameRight).toBeLessThan(layout.railLeft);
  }
}

for (const width of [390, 417, 768, 1280, 1440, 1920]) {
  test(`Expo photo stays inside its column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/catalog/products/tiger-expo-outdoor-table", {
      waitUntil: "domcontentloaded"
    });
    await expectContainedGallery(page);
    const greyOption = page.locator('input[type="radio"][value="Grey"]');
    await greyOption.locator("..").click();
    await expect(greyOption).toBeChecked();
    await expectContainedGallery(page);
  });
}

for (const slug of [
  "tiger-portland-indoor-table",
  "tiger-portland-outdoor-table",
  "tiger-whistler-indoor-table",
  "tiger-plaza-outdoor-table-grey"
]) {
  test(`${slug} photo does not overlap the purchase rail`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/catalog/products/${slug}`, { waitUntil: "domcontentloaded" });
    await expectContainedGallery(page);
  });
}
