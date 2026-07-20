import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const routes = {
  indoor: {
    description:
      "Shop Tiger indoor PingPong tables for basements, rec rooms, schools, community centres, and other dry spaces across Canada.",
    heroAlt:
      "Tiger Whistler Indoor PingPong table beneath geometric lights in a modern shared lobby.",
    heroImage: /indoor-whistler-lifestyle-v2/,
    heading: "Bring the rally home.",
    path: "/tables/indoor-tables/",
    title: "Indoor PingPong Tables | Tiger PingPong"
  },
  outdoor: {
    description:
      "Shop durable Tiger outdoor PingPong tables for patios, backyards, schools, community centres, garages, and busy spaces across Canada.",
    heroAlt: "Tiger Portland Outdoor table on a shaded garden patio.",
    heroImage: /hero-portland-patio/,
    heading: "Take it outside.",
    path: "/tables/outdoor-tables/",
    title: "Outdoor PingPong Tables | Tiger PingPong"
  }
} as const;

const products = {
  indoor: [
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
      body: "We made Whistler for players who notice the bounce, even if nobody is keeping score. A little more game, zero extra attitude.",
      cta: "Meet Whistler",
      descriptor: "For the serious rallies.",
      heading: "Whistler Indoor",
      href: "/catalog/products/tiger-whistler-indoor-table",
      id: "product-tiger-whistler-indoor-table",
      image: /whistler-indoor-blue-v1/,
      price: "$1,600.00"
    }
  ],
  outdoor: [
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
      body: "We made Plaza for parks, campuses, and community centres where the table belongs to everyone. The whole neighbourhood is invited.",
      cta: "Meet Plaza",
      descriptor: "Made for shared spaces.",
      heading: "Plaza Outdoor",
      href: "/catalog/products/tiger-plaza-outdoor-table-grey",
      id: "product-tiger-plaza-outdoor-table-grey",
      image: /plaza-outdoor-grey-v1/,
      price: "$2,600.00"
    }
  ]
} as const;

test.describe("Tiger table subcategories", () => {
  for (const kind of ["indoor", "outdoor"] as const) {
    test(`${kind} page has its own Tiger hero and category navigation`, async ({ page }) => {
      const route = routes[kind];
      await page.setViewportSize({ width: 1440, height: 1000 });
      const response = await page.goto(route.path);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        route.description
      );

      const hero = page.locator("main section").first();
      await expect(hero.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(hero.getByRole("img", { name: route.heroAlt })).toHaveAttribute(
        "src",
        route.heroImage
      );

      const switcher = page.getByRole("navigation", { name: "Table categories" });
      await expect(switcher.getByRole("link", { name: "All tables" })).toHaveAttribute(
        "href",
        "/tables/"
      );
      await expect(switcher.getByRole("link", { name: "Indoor" })).toHaveAttribute(
        "href",
        "/tables/indoor-tables/"
      );
      await expect(switcher.getByRole("link", { name: "Outdoor" })).toHaveAttribute(
        "href",
        "/tables/outdoor-tables/"
      );
      await expect(
        switcher.getByRole("link", {
          name: kind === "indoor" ? "Indoor" : "Outdoor",
          exact: true
        })
      ).toHaveAttribute("aria-current", "page");

      const shipping = page.getByRole("complementary", { name: "Table shipping" });
      await expect(shipping.getByText("Every table ships free across Canada.")).toBeVisible();
      await expect(shipping.getByText("Yes, even to cottage country.")).toBeVisible();
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("main nav[aria-label$='products']")).toHaveCount(0);
    });
  }

  test("indoor keeps live models and places its guide between them", async ({ page }) => {
    await page.goto(routes.indoor.path);

    const stages = page.locator("main article[id^='product-']");
    await expect(stages).toHaveCount(products.indoor.length);
    expect(await stages.evaluateAll((items) => items.map((item) => item.id))).toEqual(
      products.indoor.map((product) => product.id)
    );

    for (const product of products.indoor) {
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

    const guide = page.locator("#indoor-guide");
    await expect(
      guide.getByRole("heading", { level: 2, name: "Keep it dry. Let it rip." })
    ).toBeVisible();
    await expect(guide.getByText(/players who notice the bounce/)).toBeVisible();

    const order = await page.evaluate(() =>
      [
        "product-tiger-portland-indoor-table",
        "indoor-guide",
        "product-tiger-whistler-indoor-table"
      ].map((id) => document.getElementById(id)?.offsetTop ?? -1)
    );
    expect(order).toEqual([...order].sort((left, right) => left - right));
  });

  test("outdoor keeps live models and education in the right place", async ({ page }) => {
    await page.goto(routes.outdoor.path);

    const stages = page.locator("main article[id^='product-']");
    await expect(stages).toHaveCount(products.outdoor.length);
    expect(await stages.evaluateAll((items) => items.map((item) => item.id))).toEqual(
      products.outdoor.map((product) => product.id)
    );

    for (const product of products.outdoor) {
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
      education.getByAltText(
        "White PingPong ball with the black Tiger scratches and wordmark beside a net on a deep navy table."
      )
    ).toHaveAttribute("src", /outdoor-inside-net-ball-real-logo-v3/);

    const order = await page.evaluate(() =>
      [
        "product-tiger-portland-outdoor-table",
        "outdoor-indoors",
        "product-tiger-plaza-outdoor-table-grey"
      ].map((id) => document.getElementById(id)?.offsetTop ?? -1)
    );
    expect(order).toEqual([...order].sort((left, right) => left - right));
  });

  test("both pages stay compact, clear of navigation, and overflow-free", async ({ page }) => {
    test.setTimeout(60_000);

    for (const route of Object.values(routes)) {
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 768, height: 1024 },
        { width: 1280, height: 900 },
        { width: 1440, height: 1000 }
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(route.path);

        const layout = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }));
        expect(layout.scrollWidth, `${route.path} at ${viewport.width}px`).toBe(layout.clientWidth);

        const shipping = page.getByRole("complementary", { name: "Table shipping" });
        const header = page.getByRole("banner");
        await page.locator("main article").first().scrollIntoViewIfNeeded();
        const [shippingBounds, headerBounds] = await Promise.all([
          shipping.boundingBox(),
          header.boundingBox()
        ]);
        expect((shippingBounds?.y ?? 0) + 1).toBeGreaterThanOrEqual(
          (headerBounds?.y ?? 0) + (headerBounds?.height ?? 0)
        );

        if (viewport.width <= 417) {
          const stageHeights = await page
            .locator("main article[id^='product-']")
            .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
          expect(
            stageHeights.every((height) => height <= viewport.height),
            `${route.path} product stage at ${viewport.width}px`
          ).toBeTruthy();
        }
      }
    }
  });

  test("focus, lazy loading, and reduced motion remain accessible", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(routes.indoor.path);

    const comparison = page.getByRole("link", {
      name: "Not sure? Compare indoor and outdoor."
    });
    await comparison.focus();
    await expect(comparison).toBeFocused();
    const focusStyle = await comparison.evaluate((link) => {
      const style = getComputedStyle(link);
      return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
    });
    expect(focusStyle).toEqual({ outlineStyle: "solid", outlineWidth: "3px" });

    const loadingValues = await page
      .locator("main article img")
      .evaluateAll((images) => images.map((image) => image.getAttribute("loading")));
    expect(loadingValues.every((value) => value === "lazy")).toBeTruthy();

    for (const selector of [
      "main section:first-child",
      "nav[aria-label='Table categories']",
      "#indoor-guide"
    ]) {
      const animationName = await page
        .locator(selector)
        .evaluate((element) => getComputedStyle(element).animationName);
      expect(animationName, selector).toBe("none");
    }
  });

  test("the category switch targets the outdoor page without browser errors", async ({ page }) => {
    const browserErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto(routes.indoor.path);
    const outdoorLink = page
      .getByRole("navigation", { name: "Table categories" })
      .getByRole("link", { name: "Outdoor", exact: true });

    const outdoorHref = await outdoorLink.getAttribute("href");
    expect(outdoorHref).toBe(routes.outdoor.path);
    await page.goto(outdoorHref!);
    await expect(page).toHaveURL(/\/tables\/outdoor-tables\/?$/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: routes.outdoor.heading })
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Table categories" })
        .getByRole("link", { name: "Outdoor", exact: true })
    ).toHaveAttribute("aria-current", "page");
    expect(browserErrors).toEqual([]);
  });

  test("captures table subcategory visual evidence", async ({ page }) => {
    test.skip(
      process.env.CAPTURE_TABLE_SUBCATEGORY_SCREENSHOTS !== "1",
      "Run explicitly when refreshing visual evidence."
    );

    const outputDirectory = path.resolve(
      process.cwd(),
      "exports/table-subcategories-qa/playwright"
    );
    await mkdir(outputDirectory, { recursive: true });
    await page.emulateMedia({ reducedMotion: "reduce" });

    for (const [kind, route] of Object.entries(routes)) {
      for (const viewport of [
        { label: "desktop-1440", width: 1440, height: 1000 },
        { label: "tablet-768", width: 768, height: 1024 },
        { label: "mobile-390", width: 390, height: 844 }
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(route.path);

        await page.screenshot({
          path: path.join(outputDirectory, `${kind}-${viewport.label}-viewport.png`)
        });

        const images = page.locator("main img[loading='lazy']");
        for (let index = 0; index < (await images.count()); index += 1) {
          await images.nth(index).scrollIntoViewIfNeeded();
        }

        await page.screenshot({
          fullPage: true,
          path: path.join(outputDirectory, `${kind}-${viewport.label}-full.png`)
        });
      }
    }
  });
});
