import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";

interface TableCase {
  colorValues: string[];
  descriptor: string;
  heading: string;
  manualRevision: string;
  manualTitle: string;
  manualUrl: string;
  price: string;
  slug: string;
  videoUrl?: string;
}

const TABLES: TableCase[] = [
  {
    colorValues: ["Blue", "Grey"],
    descriptor: "Easygoing outdoor.",
    heading: "Expo Outdoor",
    manualRevision: "MA 212 - v.14.05.13-03",
    manualTitle: "Expo Outdoor",
    manualUrl:
      "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Expo-Outdoor-Installation-Guide/v1784409337/tiger-pingpong/resources/manuals/expo-outdoor-installation-guide.pdf",
    price: "$1,300.00",
    slug: "tiger-expo-outdoor-table",
    videoUrl: "https://www.youtube.com/watch?v=3WAdtN03EJ4"
  },
  {
    colorValues: ["Green", "Grey"],
    descriptor: "Home-court feel.",
    heading: "Portland Indoor",
    manualRevision: "MA 205 - v.25.05.16-01",
    manualTitle: "Portland Indoor",
    manualUrl:
      "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Portland-Indoor-Installation-Guide/v1784409346/tiger-pingpong/resources/manuals/portland-indoor-installation-guide.pdf",
    price: "$1,300.00",
    slug: "tiger-portland-indoor-table",
    videoUrl: "https://www.youtube.com/watch?v=EDCxiCuWoIo"
  },
  {
    colorValues: ["Blue", "Grey"],
    descriptor: "Tough outside. Smart inside.",
    heading: "Portland Outdoor",
    manualRevision: "MA 213 - v.30.04.13-03",
    manualTitle: "Portland Outdoor",
    manualUrl:
      "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Portland-Outdoor-Installation-Guide/v1784409348/tiger-pingpong/resources/manuals/portland-outdoor-installation-guide.pdf",
    price: "$1,500.00",
    slug: "tiger-portland-outdoor-table",
    videoUrl: "https://www.youtube.com/watch?v=mUmB-HPWHHs"
  },
  {
    colorValues: ["Blue", "Green"],
    descriptor: "For the serious rallies.",
    heading: "Whistler",
    manualRevision: "MA 258.4-7 - v.30.07.09-01",
    manualTitle: "Whistler Indoor",
    manualUrl:
      "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Whistler-Indoor-Assembly-Guide/v1784409349/tiger-pingpong/resources/manuals/whistler-indoor-installation-guide.pdf",
    price: "$1,600.00",
    slug: "tiger-whistler-indoor-table",
    videoUrl: "https://www.youtube.com/watch?v=tuvacihKUCk"
  },
  {
    colorValues: ["Grey"],
    descriptor: "Made for shared spaces.",
    heading: "Plaza",
    manualRevision: "MA 244 - v.25.05.16-01",
    manualTitle: "Plaza Outdoor",
    manualUrl:
      "https://res.cloudinary.com/djfcisldm/raw/upload/fl_attachment:Tiger-Plaza-Outdoor-Installation-and-Parts-Guide/v1784409350/tiger-pingpong/resources/manuals/plaza-outdoor-installation-guide.pdf",
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

test("each table specification section contains its matching manual and setup video", async ({
  page
}) => {
  for (const table of TABLES) {
    await page.goto(productPath(table.slug));

    const resources = page.getByTestId("table-support-resources");
    const manualLink = resources.getByRole("link", {
      name: `Download ${table.manualTitle} assembly guide PDF`
    });
    const sectionOrder = await page.locator("main > section").evaluateAll((sections) => {
      return sections.map((section) => section.getAttribute("aria-label"));
    });

    await expect(resources).toHaveAttribute("data-product-slug", table.slug);
    await expect(resources).not.toContainText(table.manualRevision);
    await expect(manualLink).toHaveAttribute("href", table.manualUrl);
    await expect(manualLink).toHaveAttribute("download", "");
    await expect(
      resources.getByRole("link", { name: "Replacement parts", exact: true })
    ).toHaveAttribute("href", "/replacement-parts/");
    expect(sectionOrder.indexOf("Table comparison")).toBeLessThan(
      sectionOrder.indexOf("Specifications")
    );

    if (table.videoUrl) {
      const videoLink = resources.getByRole("link", {
        name: `Watch ${table.manualTitle} setup video on YouTube`
      });
      await expect(videoLink).toHaveAttribute("href", table.videoUrl);
      await expect(videoLink).toHaveAttribute("target", "_blank");
    } else {
      await expect(resources.getByRole("link", { name: /setup video/i })).toHaveCount(0);
    }
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

test("multi-colour tables require a colour and preserve the exact variant key in the cart", async ({
  page
}) => {
  for (const table of TABLES.filter((candidate) => candidate.colorValues.length > 1)) {
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

  await expect(page.locator('input[value="Grey"]')).toBeChecked();

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
      const resources = page.getByTestId("table-support-resources");
      await expect(resources).toBeVisible();
      const accessibility = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        imagesWithoutAlt: document.querySelectorAll("main img:not([alt])").length,
        viewportWidth: window.innerWidth
      }));
      const resourceLayout = await resources.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        const linkHeights = Array.from(node.querySelectorAll("a")).map(
          (link) => link.getBoundingClientRect().height
        );

        return {
          left: bounds.left,
          linkHeights,
          right: bounds.right,
          viewportWidth: window.innerWidth
        };
      });
      expect(accessibility.documentWidth).toBeLessThanOrEqual(accessibility.viewportWidth);
      expect(accessibility.imagesWithoutAlt).toBe(0);
      expect(resourceLayout.left).toBeGreaterThanOrEqual(0);
      expect(resourceLayout.right).toBeLessThanOrEqual(resourceLayout.viewportWidth);
      expect(resourceLayout.linkHeights.every((height) => height >= 44)).toBe(true);
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
