import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const TABLES_DESCRIPTION =
  "Shop indoor and outdoor Tiger PingPong tables for homes, patios, schools, community centres, and shared spaces across Canada.";

const products = [
  {
    body: "We made Expo for backyards that want more playing and less overthinking. It’s the easy yes when you want a real outdoor table and a good time.",
    cta: "Meet Expo",
    descriptor: "Easygoing outdoor.",
    heading: "Expo Outdoor",
    href: "/catalog/products/tiger-expo-outdoor-table",
    id: "product-tiger-expo-outdoor-table",
    image: /expo-outdoor-grey-v1/,
    price: "$1,300.00"
  },
  {
    body: "We made Portland Indoor for basements, rec rooms, and community centres that see plenty of rallies and very little rain. Serious table, relaxed room.",
    cta: "Meet Portland Indoor",
    descriptor: "Home-court feel.",
    heading: "Portland Indoor",
    href: "/catalog/products/tiger-portland-indoor-table",
    id: "product-tiger-portland-indoor-table",
    image: /portland-indoor-grey-v1/,
    price: "$1,300.00"
  },
  {
    body: "We made Portland Outdoor for patios, garages, and busy game rooms where weather, kids, and spilled drinks all happen. It’s the table you worry about less.",
    cta: "Meet Portland Outdoor",
    descriptor: "Tough outside. Smart inside.",
    heading: "Portland Outdoor",
    href: "/catalog/products/tiger-portland-outdoor-table",
    id: "product-tiger-portland-outdoor-table",
    image: /portland-outdoor-clean-v1/,
    price: "$1,500.00"
  },
  {
    body: "We made Whistler for players who notice the bounce, even if nobody is keeping score. A little more game, zero extra attitude.",
    cta: "Meet Whistler",
    descriptor: "For the serious rallies.",
    heading: "Whistler Indoor",
    href: "/catalog/products/tiger-whistler-indoor-table",
    id: "product-tiger-whistler-indoor-table",
    image: /whistler-indoor-blue-v1/,
    price: "$1,600.00"
  },
  {
    body: "We made Plaza for parks, campuses, and community centres where the table belongs to everyone. The whole neighbourhood is invited.",
    cta: "Meet Plaza",
    descriptor: "Made for shared spaces.",
    heading: "Plaza Outdoor",
    href: "/catalog/products/tiger-plaza-outdoor-table-grey",
    id: "product-tiger-plaza-outdoor-table-grey",
    image: /plaza-outdoor-grey-v1/,
    price: "$2,600.00"
  }
];

test("tables page quickly answers where the table will live", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = await page.goto("/tables");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("PingPong Tables | Tiger PingPong");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    TABLES_DESCRIPTION
  );

  const hero = page.locator("main section").first();
  await expect(hero.getByRole("heading", { level: 1, name: "Find your table." })).toBeVisible();
  await expect(hero.getByText(/fits how you actually play/)).toBeVisible();
  await expect(hero.getByRole("link", { name: "Need a hand? Call us." })).toHaveAttribute(
    "href",
    "tel:+18885525259"
  );

  const heroImage = hero.getByRole("img");
  await expect(heroImage).toHaveAttribute("src", /hero-portland-patio/);
  await expect(heroImage).toHaveAttribute(
    "alt",
    "Tiger Portland Outdoor table on a shaded garden patio."
  );
  const heroCrop = await heroImage.evaluate((image) => {
    const style = getComputedStyle(image);
    return { objectFit: style.objectFit, objectPosition: style.objectPosition };
  });
  expect(heroCrop).toEqual({ objectFit: "cover", objectPosition: "58% 58%" });

  const chooser = page.locator("#choose");
  await expect(
    chooser.getByRole("heading", { level: 2, name: "Where will it live?" })
  ).toBeVisible();
  await expect(chooser.getByRole("link", { name: /Indoor Best playing feel/ })).toHaveAttribute(
    "href",
    "/tables/indoor-tables/"
  );
  await expect(chooser.getByRole("link", { name: /Outdoor Built for weather/ })).toHaveAttribute(
    "href",
    "/tables/outdoor-tables/"
  );
  await expect(chooser.getByRole("link", { name: "Compare indoor and outdoor" })).toHaveAttribute(
    "href",
    "/resources/indoor-vs-outdoor-ping-pong-tables"
  );

  const chooserImages = chooser.locator("img");
  await expect(chooserImages).toHaveCount(2);
  await expect(chooserImages.nth(0)).toHaveAttribute("src", /indoor-whistler-lifestyle-v1/);
  await expect(chooserImages.nth(1)).toHaveAttribute("src", /outdoor-portland-patio-v1/);

  const shipping = page.getByRole("complementary", { name: "Table shipping" });
  await expect(shipping.getByText("Every table ships free across Canada.")).toBeVisible();
  await expect(shipping.getByText("Yes, even to cottage country.")).toBeVisible();
  expect(
    await shipping.evaluate((element) => {
      const style = getComputedStyle(element);
      return { display: style.display, position: style.position };
    })
  ).toEqual({ display: "grid", position: "sticky" });

  await page.locator("#product-tiger-portland-outdoor-table").scrollIntoViewIfNeeded();
  const shippingBounds = await shipping.boundingBox();
  expect(shippingBounds?.y).toBeGreaterThanOrEqual(102);
  expect(shippingBounds?.y).toBeLessThanOrEqual(106);
});

test("tables retain live catalog order, prices, product links, and outdoor education", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/tables");

  const productStages = page.locator("main article[id^='product-']");
  await expect(productStages).toHaveCount(5);
  expect(await productStages.evaluateAll((stages) => stages.map((stage) => stage.id))).toEqual(
    products.map((product) => product.id)
  );

  for (const product of products) {
    const stage = page.locator(`#${product.id}`);
    await expect(stage.getByRole("heading", { level: 2, name: product.heading })).toBeVisible();
    await expect(stage.getByText(product.price, { exact: true })).toBeVisible();
    await expect(stage.getByText(product.descriptor, { exact: true })).toBeVisible();
    await expect(stage.getByText(product.body, { exact: true })).toBeVisible();
    await expect(stage.getByRole("img")).toHaveAttribute("src", product.image);
    await expect(stage.getByRole("link", { name: product.cta })).toHaveAttribute(
      "href",
      product.href
    );
  }

  const education = page.locator("#outdoor-indoors");
  await expect(
    education.getByRole("heading", { level: 2, name: "Outdoor doesn’t mean outdoors only." })
  ).toBeVisible();
  await expect(
    education.getByText(/kids, parties, a damp garage, or spilled drinks/)
  ).toBeVisible();
  await expect(education.getByRole("link", { name: "Compare indoor and outdoor" })).toHaveAttribute(
    "href",
    "/resources/indoor-vs-outdoor-ping-pong-tables"
  );
  await expect(
    education.getByAltText(
      "White PingPong ball with the black Tiger scratches and wordmark beside a net on a deep navy table."
    )
  ).toHaveAttribute("src", /outdoor-inside-net-ball-real-logo-v3/);

  const sectionOrder = await page.evaluate(() => {
    const ids = [
      "product-tiger-portland-outdoor-table",
      "outdoor-indoors",
      "product-tiger-whistler-indoor-table"
    ];
    return ids.map((id) => document.getElementById(id)?.offsetTop ?? -1);
  });
  expect(sectionOrder.every((top) => top >= 0)).toBeTruthy();
  expect(sectionOrder).toEqual([...sectionOrder].sort((left, right) => left - right));

  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.locator("main h2")).toHaveText([
    "Where will it live?",
    "Expo Outdoor",
    "Portland Indoor",
    "Portland Outdoor",
    "Outdoor doesn’t mean outdoors only.",
    "Whistler Indoor",
    "Plaza Outdoor"
  ]);
  await expect(page.locator("main nav[aria-label$='products']")).toHaveCount(0);

  const belowFoldImages = page.locator(
    'main img:not([alt="Tiger Portland Outdoor table on a shaded garden patio."])'
  );
  const loadingValues = await belowFoldImages.evaluateAll((images) =>
    images.map((image) => image.getAttribute("loading"))
  );
  expect(loadingValues.every((value) => value === "lazy")).toBeTruthy();
});

test("tables use a distinct hero while home and about keep the Vancouver mountain image", async ({
  page
}) => {
  await page.goto("/tables");
  await expect(page.locator("main img").first()).toHaveAttribute("src", /hero-portland-patio/);
  await expect(page.locator("main img").first()).not.toHaveAttribute(
    "src",
    /category-heroes(?:%2F|\/)ping-pong-tables/
  );

  await page.goto("/");
  await expect(page.locator("#home img").first()).toHaveAttribute(
    "src",
    /category-heroes(?:%2F|\/)ping-pong-tables/
  );

  await page.goto("/about");
  await expect(page.locator("#start img").first()).toHaveAttribute(
    "src",
    /category-heroes(?:%2F|\/)ping-pong-tables/
  );
});

test("tables keep the hero action immediate and never overflow", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
    { width: 1440, height: 1000 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/tables");

    const heading = page.getByRole("heading", { level: 1, name: "Find your table." });
    const action = page.getByRole("link", { name: "Need a hand? Call us." });
    await expect(heading).toBeInViewport();
    const actionBounds = await action.boundingBox();
    expect(actionBounds, `${viewport.width}px phone action`).not.toBeNull();
    expect((actionBounds?.y ?? 0) + (actionBounds?.height ?? 0)).toBeLessThanOrEqual(
      viewport.height
    );

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      chooserColumns: getComputedStyle(document.querySelector("#choose")!).gridTemplateColumns,
      firstProductColumns: getComputedStyle(
        document.querySelector("#product-tiger-expo-outdoor-table")!
      ).gridTemplateColumns
    }));

    expect(layout.scrollWidth, `${viewport.width}px`).toBe(layout.clientWidth);
    expect(layout.chooserColumns.split(" ")).toHaveLength(viewport.width < 900 ? 1 : 2);
    expect(layout.firstProductColumns.split(" ")).toHaveLength(viewport.width < 900 ? 1 : 2);
  }
});

test("tables focus and reduced-motion behavior stay accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tables");

  const phone = page.getByRole("link", { name: "Need a hand? Call us." });
  const indoor = page.locator("#choose").getByRole("link", { name: /Indoor Best playing feel/ });
  await phone.focus();
  await expect(phone).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(indoor).toBeFocused();

  const focusStyle = await indoor.evaluate((link) => {
    const style = getComputedStyle(link);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle).toEqual({ outlineStyle: "solid", outlineWidth: "3px" });

  for (const selector of ["#choose", "#product-tiger-expo-outdoor-table", "#outdoor-indoors"]) {
    const animationName = await page
      .locator(selector)
      .evaluate((element) => getComputedStyle(element).animationName);
    expect(animationName, selector).toBe("none");
  }
});

test("capture Find Your Table evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_TABLES_SCREENSHOTS !== "1", "Local evidence capture only.");
  const outputDirectory = path.resolve("exports/tables-category-qa/playwright");
  await mkdir(outputDirectory, { recursive: true });

  for (const viewport of [
    { height: 1000, name: "desktop-1440", width: 1440 },
    { height: 1024, name: "tablet-768", width: 768 },
    { height: 844, name: "mobile-390", width: 390 }
  ]) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/tables");
    await page.locator("main img").first().waitFor();
    await page.screenshot({
      fullPage: false,
      path: path.join(outputDirectory, `${viewport.name}-viewport.png`)
    });

    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.72) {
        window.scrollTo(0, y);
        await new Promise((resolve) => window.setTimeout(resolve, 70));
      }
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      fullPage: true,
      path: path.join(outputDirectory, `${viewport.name}-full-page.png`)
    });
  }
});
