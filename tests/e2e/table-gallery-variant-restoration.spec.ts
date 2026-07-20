import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

interface TableCase {
  colorValues: string[];
  descriptor: string;
  heading: string;
  price: string;
  slug: string;
}

const TABLES: TableCase[] = [
  {
    colorValues: ["Blue", "Grey"],
    descriptor: "Easygoing outdoor.",
    heading: "Expo Outdoor",
    price: "$1,300.00",
    slug: "tiger-expo-outdoor-table"
  },
  {
    colorValues: ["Green", "Grey"],
    descriptor: "Home-court feel.",
    heading: "Portland Indoor",
    price: "$1,300.00",
    slug: "tiger-portland-indoor-table"
  },
  {
    colorValues: ["Blue", "Grey"],
    descriptor: "Tough outside. Smart inside.",
    heading: "Portland Outdoor",
    price: "$1,500.00",
    slug: "tiger-portland-outdoor-table"
  },
  {
    colorValues: ["Blue", "Green"],
    descriptor: "For the serious rallies.",
    heading: "Whistler",
    price: "$1,600.00",
    slug: "tiger-whistler-indoor-table"
  },
  {
    colorValues: ["Grey"],
    descriptor: "Made for shared spaces.",
    heading: "Plaza",
    price: "$2,600.00",
    slug: "tiger-plaza-outdoor-table-grey"
  }
];

const manifest = JSON.parse(
  readFileSync(path.resolve("data/media/table-product-gallery-manifest-v1.json"), "utf8")
);

function productPath(slug: string) {
  return `/catalog/products/${slug}`;
}

function manifestProduct(slug: string) {
  const product = manifest.products.find((candidate: { productSlug: string }) => {
    return candidate.productSlug === slug;
  });
  if (!product) throw new Error(`Missing table manifest fixture for ${slug}.`);
  return product;
}

function expectMainImageFor(page: Page, publicId: string) {
  return expect(page.getByTestId("product-main-image")).toHaveAttribute(
    "src",
    new RegExp(publicId)
  );
}

test("all five tables open with their complete curated gallery and catalogue lead colour", async ({
  page
}) => {
  test.setTimeout(60_000);

  for (const table of TABLES) {
    const product = manifestProduct(table.slug);
    const response = await page.goto(productPath(table.slug));

    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: table.heading })).toBeVisible();
    await expect(page.getByTestId("product-price")).toContainText(table.price);
    await expect(page.locator('[data-purchase-presentation="tiger-v2"]')).toHaveCount(1);
    await expect(page.getByText(table.descriptor, { exact: true })).toBeVisible();
    await expect(page.getByText("In stock. Ready to ship.", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Every table ships free across Canada.", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Yes, even to cottage country.", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Not sure which colour? Call Tiger.", { exact: true })
    ).toHaveAttribute("href", "tel:+18885525259");
    await expect(page.locator('[data-gallery-presentation="table"]')).toHaveCount(1);
    await expect(page.locator('[aria-label="Product images"] button')).toHaveCount(
      product.assets.length
    );
    await expectMainImageFor(page, product.assets[0].cloudinary.publicId);
    await expect(page.getByTestId("product-main-image")).toHaveAttribute(
      "srcset",
      /c_limit,w_480.*480w.*c_limit,w_1600.*1600w/
    );

    const canvas = await page
      .locator('[data-gallery-presentation="table"] figure')
      .evaluate((node) => {
        return getComputedStyle(node).backgroundColor;
      });
    expect(canvas).toBe("rgb(255, 255, 255)");
  }
});

test("each colour selects the matching image and removes other colours from view", async ({
  page
}) => {
  for (const table of TABLES) {
    const product = manifestProduct(table.slug);
    await page.goto(productPath(table.slug));

    for (const colorValue of table.colorValues) {
      const variant = product.approvedVariantKeys.find((key: string) => {
        return key.toLowerCase().endsWith(colorValue.toLowerCase());
      });
      expect(variant).toBeTruthy();
      const matching = product.assets.filter(
        (asset: { variantKey: string | null }) => asset.variantKey === variant
      );
      const shared = product.assets.filter(
        (asset: { variantKey: string | null }) => !asset.variantKey
      );

      const input = page.locator(`input[value="${colorValue}"]`);
      const optionCard = input.locator("..");
      await expect(optionCard.locator("img")).toHaveAttribute(
        "src",
        new RegExp(matching[0].cloudinary.publicId)
      );
      await input.evaluate((element: HTMLInputElement) => element.click());
      await expect(input).toBeChecked();
      await expectMainImageFor(page, matching[0].cloudinary.publicId);
      await expect(page.locator('[aria-label="Product images"] button')).toHaveCount(
        matching.length + shared.length
      );

      for (const asset of product.assets.filter((candidate: { variantKey: string | null }) => {
        return candidate.variantKey && candidate.variantKey !== variant;
      })) {
        await expect(
          page.locator(`[aria-label="Product images"] [data-media-key="${asset.mediaKey}"]`)
        ).toHaveCount(0);
      }
    }
  }
});

test("every table requires a colour and preserves the exact variant key in the cart", async ({
  page
}) => {
  for (const table of TABLES) {
    const product = manifestProduct(table.slug);
    await page.goto(productPath(table.slug));
    await page.evaluate(() => window.localStorage.removeItem("tigerpingpong.cart.v1"));

    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText("Choose your table colour first.", { exact: true })).toBeVisible();
    await expect(page.locator(`input[value="${table.colorValues[0]}"]`)).toBeFocused();

    const selectedColor = table.colorValues[0];
    const variantKey = product.approvedVariantKeys.find((key: string) => {
      return key.toLowerCase().endsWith(selectedColor.toLowerCase());
    });
    const selectedInput = page.locator(`input[value="${selectedColor}"]`);
    await selectedInput.evaluate((element: HTMLInputElement) => element.click());
    await expect(selectedInput).toBeChecked();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const storedCart = await page.evaluate(() => {
      return JSON.parse(window.localStorage.getItem("tigerpingpong.cart.v1") ?? "null");
    });
    expect(storedCart.items[0]).toMatchObject({
      productSlug: table.slug,
      selectedVariantKey: variantKey
    });
    expect(storedCart.items[0].selectedOptions[0]).toMatchObject({
      displayName: "Top colour",
      value: selectedColor
    });
    await page.keyboard.press("Escape");
  }
});

test("Plaza's single Grey choice fills the V2 selector", async ({ page }) => {
  await page.goto(productPath("tiger-plaza-outdoor-table-grey"));

  const dimensions = await page.locator("fieldset").evaluate((fieldset) => {
    const choices = fieldset.querySelector("div");
    const card = fieldset.querySelector("label");

    return {
      cardWidth: card?.getBoundingClientRect().width ?? 0,
      choicesWidth: choices?.getBoundingClientRect().width ?? 0
    };
  });

  expect(dimensions.cardWidth).toBeGreaterThan(dimensions.choicesWidth * 0.9);
});

test("table galleries stay accessible and overflow-free at the approved widths", async ({
  page
}) => {
  test.setTimeout(180_000);
  const viewports = [
    { height: 844, width: 390 },
    { height: 844, width: 417 },
    { height: 1024, width: 768 },
    { height: 900, width: 1280 },
    { height: 900, width: 1440 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const table of TABLES) {
      await page.goto(productPath(table.slug));
      const accessibility = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        imagesWithoutAlt: document.querySelectorAll("main img:not([alt])").length,
        viewportWidth: window.innerWidth
      }));
      expect(accessibility.documentWidth).toBeLessThanOrEqual(accessibility.viewportWidth);
      expect(accessibility.imagesWithoutAlt).toBe(0);
    }
  }
});

test("Aqua V2 and a non-table accessory keep their approved gallery presentations", async ({
  page
}) => {
  await page.goto("/catalog/products/tiger-aqua-outdoor-indoor-paddle");
  await expect(page.locator('[data-gallery-presentation="aqua"]')).toHaveCount(1);
  await expect(page.locator('[data-purchase-presentation="tiger-v2"]')).toHaveCount(1);
  await expect(page.locator('[aria-label="Product images"] button')).toHaveCount(5);

  await page.goto("/catalog/products/tiger-vice-paddle");
  await expect(page.locator('[data-gallery-presentation="default"]')).toHaveCount(1);
  await expect(page.locator('[data-purchase-presentation="tiger-v2"]')).toHaveCount(0);
});

test("capture table gallery visual evidence", async ({ page }) => {
  test.setTimeout(180_000);
  test.skip(process.env.CAPTURE_TABLE_GALLERY_SCREENSHOTS !== "1", "Local evidence capture only.");

  const outputDirectory = path.resolve("exports/table-gallery-qa/playwright");
  await mkdir(outputDirectory, { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const table of TABLES) {
    for (const viewport of [
      { height: 1000, name: "desktop-1440", width: 1440 },
      { height: 844, name: "mobile-390", width: 390 }
    ]) {
      await page.setViewportSize({ height: viewport.height, width: viewport.width });
      await page.goto(productPath(table.slug));
      await page.getByTestId("product-main-image").waitFor();
      await page.screenshot({
        path: path.join(outputDirectory, `${table.slug}-${viewport.name}-viewport.png`)
      });
      await page.screenshot({
        fullPage: true,
        path: path.join(outputDirectory, `${table.slug}-${viewport.name}-full-page.png`)
      });
    }
  }
});
