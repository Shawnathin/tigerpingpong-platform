import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const routes = {
  all: {
    activeLabel: "All gear",
    description:
      "Shop Tiger PingPong paddles, balls, covers, nets, and everyday gear with real help from Vancouver and shipping across Canada.",
    heading: "Everything around the table.",
    path: "/accessories/",
    title: "PingPong Accessories | Tiger PingPong"
  },
  paddles: {
    activeLabel: "Paddles",
    description:
      "Shop Tiger PingPong paddles for patios, schools, rec rooms, young players, and everyday rallies across Canada.",
    heading: "Pick your paddle.",
    path: "/accessories/paddles/",
    title: "PingPong Paddles | Tiger PingPong"
  },
  balls: {
    activeLabel: "Balls",
    description:
      "Shop Tiger PingPong balls in six-packs and 140-packs for homes, schools, community centres, and shared spaces across Canada.",
    heading: "You’re going to lose a few.",
    path: "/accessories/ping-pong-balls/",
    title: "PingPong Balls | Tiger PingPong"
  },
  covers: {
    activeLabel: "Covers",
    description:
      "Shop Tiger PingPong table covers built for Canadian weather, with real fit help from Vancouver.",
    heading: "Weather happens.",
    path: "/accessories/covers/",
    title: "PingPong Table Covers | Tiger PingPong"
  },
  nets: {
    activeLabel: "Nets",
    description:
      "Shop Tiger PingPong nets and post sets with real fit help from Vancouver and shipping across Canada.",
    heading: "Meet in the middle.",
    path: "/accessories/nets/",
    title: "PingPong Nets & Post Sets | Tiger PingPong"
  },
  parts: {
    activeLabel: "Need a part?",
    description:
      "Shop Tiger PingPong Part 40, a standard replacement net, and the Expo & Portland net upgrade system—or find manuals and real help in Vancouver.",
    heading: "Let's find the fix.",
    path: "/replacement-parts/",
    title: "Replacement Parts & Manuals | Tiger PingPong"
  }
} as const;

const accessoryProductIds = [
  "product-tiger-table-cover-black-polyester",
  "product-tiger-net-post-set",
  "product-tiger-aqua-outdoor-indoor-paddle",
  "product-tiger-vice-paddle",
  "product-tiger-premium-balls-6-orange",
  "product-tiger-premium-balls-6-white",
  "product-tiger-premium-balls-140"
] as const;

async function expectShippingRule(page: Page) {
  const shipping = page.getByRole("complementary", { name: "Accessory shipping" });
  await expect(shipping.getByText("Over $100? Shipping’s on us.", { exact: true })).toBeVisible();
  await expect(
    shipping.getByText("At $100 or under, it’s $15 across Canada.", { exact: true })
  ).toBeVisible();
  expect(await shipping.evaluate((element) => getComputedStyle(element).position)).not.toBe(
    "sticky"
  );
}

test.describe("Tiger gear categories", () => {
  for (const [kind, route] of Object.entries(routes)) {
    if (kind === "parts") continue;

    test(`${kind} has its Tiger chapter, metadata, and gear switch`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const response = await page.goto(route.path);

      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(route.title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        route.description
      );
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
      await expect(page.locator("main h1")).toHaveCount(1);

      const switcher = page.getByRole("navigation", { name: "Gear categories" });
      const destinations = [
        ["All gear", "/accessories/"],
        ["Paddles", "/accessories/paddles/"],
        ["Balls", "/accessories/ping-pong-balls/"],
        ["Covers", "/accessories/covers/"],
        ["Nets", "/accessories/nets/"],
        ["Need a part?", "/replacement-parts/"]
      ] as const;

      for (const [name, href] of destinations) {
        await expect(switcher.getByRole("link", { name, exact: true })).toHaveAttribute(
          "href",
          href
        );
      }

      await expect(
        switcher.getByRole("link", {
          name: route.activeLabel,
          exact: true
        })
      ).toHaveAttribute("aria-current", "page");

      const heroImages = page.locator("main section").first().getByRole("img");
      expect(await heroImages.count()).toBeGreaterThan(0);
      for (let index = 0; index < (await heroImages.count()); index += 1) {
        expect(await heroImages.nth(index).getAttribute("alt")).toBeTruthy();
      }

      await expectShippingRule(page);
      await expect(page.getByText("Available online", { exact: true })).toHaveCount(0);
    });
  }

  test("Accessories leads with essentials before the intentionally repeated rally gear", async ({
    page
  }) => {
    await page.goto(routes.all.path);

    await expect(
      page.getByRole("heading", { level: 2, name: "Keep the rally ready." })
    ).toBeVisible();
    const essentials = page.locator("#choose");
    await expect(essentials.getByRole("link", { name: /Covers Keep it covered/ })).toHaveAttribute(
      "href",
      "/accessories/covers/"
    );
    await expect(essentials.getByRole("link", { name: /Nets Meet in the middle/ })).toHaveAttribute(
      "href",
      "/accessories/nets/"
    );
    await expect(
      essentials.getByRole("link", { name: /Replacement Parts Find the odd little bit/ })
    ).toHaveAttribute("href", "/replacement-parts/");

    await expect(
      page.getByRole("heading", { level: 2, name: "Paddles and balls, obviously." })
    ).toBeVisible();
    await expect(
      page.getByText(
        "Because an Accessories page without paddles and balls would be a weird little page."
      )
    ).toBeVisible();

    const productStages = page.locator("main article[id^='product-']");
    await expect(productStages).toHaveCount(accessoryProductIds.length);
    expect(await productStages.evaluateAll((items) => items.map((item) => item.id))).toEqual(
      accessoryProductIds
    );

    const sectionOrder = await page.evaluate(() =>
      [
        "product-tiger-table-cover-black-polyester",
        "product-tiger-net-post-set",
        "parts",
        "paddles",
        "balls"
      ].map((id) => {
        const element = document.getElementById(id);
        return element ? element.getBoundingClientRect().top + window.scrollY : -1;
      })
    );
    expect(sectionOrder).toEqual([...sectionOrder].sort((left, right) => left - right));
    await expect(page.locator("#product-tiger-aqua-outdoor-indoor-paddle")).toBeVisible();

    await page.setViewportSize({ width: 560, height: 801 });
    await expect(page.locator("#choose")).toBeHidden();
  });

  test("Paddles explains the two useful choices without a tournament speech", async ({ page }) => {
    await page.goto(routes.paddles.path);

    const chooser = page.locator("#choose");
    await expect(
      chooser.getByRole("heading", { level: 2, name: "Where will it play?" })
    ).toBeVisible();
    await expect(chooser.getByRole("link", { name: /Everywhere Aqua for patios/ })).toHaveAttribute(
      "href",
      "#product-tiger-aqua-outdoor-indoor-paddle"
    );
    await expect(
      chooser.getByRole("link", { name: /Smaller hands Vice for kids/ })
    ).toHaveAttribute("href", "#product-tiger-vice-paddle");

    const aqua = page.locator("#product-tiger-aqua-outdoor-indoor-paddle");
    await expect(aqua.getByText("Starting at $25.00", { exact: true })).toBeVisible();
    await expect(aqua.getByText("Built for the paddle someone forgot outside.")).toBeVisible();
    await expect(aqua.getByRole("link", { name: "Meet Aqua" })).toHaveAttribute(
      "href",
      "/catalog/products/tiger-aqua-outdoor-indoor-paddle"
    );

    const vice = page.locator("#product-tiger-vice-paddle");
    await expect(vice.getByText("$15.00", { exact: true })).toBeVisible();
    await expect(vice.getByText("Small hands. Big rallies.")).toBeVisible();
    await expect(vice.getByText(/slimmer handle that is easier to hold/)).toBeVisible();

    await page.setViewportSize({ width: 560, height: 801 });
    await expect(page.locator("#choose")).toBeHidden();
  });

  test("Balls keeps both six-packs distinct and gives 140 its own moment", async ({ page }) => {
    await page.goto(routes.balls.path);

    await expect(page.locator("#gear img")).toHaveAttribute(
      "src",
      "https://res.cloudinary.com/djfcisldm/image/upload/v1781745091/tigerpingpong/recovered/categorys/category-balls/tpp-category-balls-gallery-01.jpg"
    );

    await expect(
      page.getByRole("heading", { level: 2, name: "How many rematches?" })
    ).toBeVisible();
    await expect(
      page.getByText("White or orange? Pick your favourite.", { exact: true })
    ).toBeVisible();

    const orange = page.locator("#product-tiger-premium-balls-6-orange");
    const white = page.locator("#product-tiger-premium-balls-6-white");
    await expect(orange.getByText("$8.00", { exact: true })).toBeVisible();
    await expect(white.getByText("$8.00", { exact: true })).toBeVisible();
    await expect(orange.getByRole("link", { name: "Meet the orange six-pack" })).toHaveAttribute(
      "href",
      "/catalog/products/tiger-premium-balls-6-orange"
    );
    await expect(white.getByRole("link", { name: "Meet the white six-pack" })).toHaveAttribute(
      "href",
      "/catalog/products/tiger-premium-balls-6-white"
    );

    const largePack = page.locator("#product-tiger-premium-balls-140");
    await expect(largePack.getByText("$96.00", { exact: true })).toBeVisible();
    await expect(largePack.getByText("Commit to the bit.", { exact: true })).toBeVisible();
    await expect(largePack.getByText(/Fewer emergency searches under the sofa/)).toBeVisible();

    await page.setViewportSize({ width: 560, height: 801 });
    await expect(page.locator("#choose")).toBeHidden();
  });

  test("Cover and net pages give useful fit help", async ({ page }) => {
    await page.goto(routes.covers.path);
    const cover = page.locator("#product-tiger-table-cover-black-polyester");
    await expect(cover.getByText("Ultra Protection.", { exact: true })).toBeVisible();
    await expect(cover.getByText("$55.00", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Let’s make sure it fits." })
    ).toBeVisible();
    await expect(page.getByText(/not compatible with Plaza Outdoor/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Call Tiger" })).toHaveAttribute(
      "href",
      "tel:+18885525259"
    );

    await page.goto(routes.nets.path);
    const net = page.locator("#product-tiger-net-post-set");
    await expect(net.getByText("Set it. Start the rally.", { exact: true })).toBeVisible();
    await expect(net.getByText("$59.00", { exact: true })).toBeVisible();
    await expect(net.getByText(/little taste of Tiger quality/)).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "This one upgrades other tables." })
    ).toBeVisible();
    await expect(page.getByText(/not a replacement net for Tiger tables/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ask about a Tiger replacement net" })
    ).toHaveAttribute("href", "/replacement-parts/");

    await page.setViewportSize({ width: 523, height: 801 });
    const netHeroFigure = page.locator("#gear figure").first();
    const netHeroBox = await netHeroFigure.boundingBox();
    expect(netHeroBox).not.toBeNull();
    expect(Math.abs((netHeroBox?.width ?? 0) - (netHeroBox?.height ?? 0))).toBeLessThan(2);
    await expect(netHeroFigure.getByRole("img")).toHaveCSS("object-fit", "contain");
  });

  test("Replacement Parts stays human while approved common parts use the shared cart", async ({
    page
  }) => {
    const response = await page.goto(routes.parts.path);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(routes.parts.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      routes.parts.description
    );
    await expect(page.getByRole("heading", { level: 1, name: routes.parts.heading })).toBeVisible();
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("main article[id^='product-']")).toHaveCount(0);
    await expect(page.locator("main form, main input, main select")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 2, name: "Part 40. Small clip. Big save." })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Three things make this faster." })
    ).toBeVisible();

    for (const detail of ["Your table", "Two quick photos", "Anything you remember"]) {
      await expect(page.getByRole("heading", { level: 3, name: detail })).toBeVisible();
    }

    await expect(page.getByRole("link", { name: "Call 1-888-552-5259" })).toHaveAttribute(
      "href",
      "tel:+18885525259"
    );
    await expect(page.getByRole("link", { name: "Email info@tigerpingpong.com" })).toHaveAttribute(
      "href",
      /mailto:info@tigerpingpong\.com/
    );
    await expect(page.getByTestId("part-40-live-price")).toHaveText("$7.00");
    await expect(page.getByTestId("standard-replacement-net-live-price")).toHaveText("$20.00");
    await expect(page.getByTestId("expo-portland-net-upgrade-live-price")).toHaveText("$149.99");
    await expect(page.getByRole("button", { name: "Add one clip" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add full set of 8" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add to Cart" })).toHaveCount(2);
    await expect(page.locator("main select, main input, main form")).toHaveCount(0);
  });

  test("every route stays accessible and overflow-free at the promised widths", async ({
    page
  }) => {
    test.setTimeout(120_000);

    for (const route of Object.values(routes)) {
      for (const viewport of [
        { width: 390, height: 844 },
        { width: 417, height: 844 },
        { width: 768, height: 1024 },
        { width: 1280, height: 900 },
        { width: 1440, height: 1000 }
      ]) {
        await page.setViewportSize(viewport);
        await page.goto(route.path);

        const widths = await page.evaluate(() => ({
          client: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth
        }));
        expect(widths.scroll, `${route.path} at ${viewport.width}px`).toBe(widths.client);

        if (viewport.width <= 768 && route.path !== routes.parts.path) {
          const switcher = page.getByRole("navigation", { name: "Gear categories" });
          const switcherBox = await switcher.boundingBox();
          expect(switcherBox?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(100);

          const rowCounts = await switcher.getByRole("link").evaluateAll((links) => {
            const rows = new Map<number, number>();
            for (const link of links) {
              const top = Math.round(link.getBoundingClientRect().top);
              rows.set(top, (rows.get(top) ?? 0) + 1);
            }
            return [...rows.values()];
          });
          expect(rowCounts).toEqual([3, 3]);
        }

        if (viewport.width <= 417) {
          const stageHeights = await page
            .locator("main article[id^='product-']")
            .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().height));
          expect(
            stageHeights.every((height) => height <= 844),
            `${route.path} product stage at ${viewport.width}px: ${stageHeights.join(", ")}`
          ).toBeTruthy();
        }
      }
    }
  });

  test("focus, alternatives, lazy loading, and reduced motion stay intentional", async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(routes.paddles.path);

    const activeSwitch = page
      .getByRole("navigation", { name: "Gear categories" })
      .getByRole("link", { name: "Paddles", exact: true });
    await activeSwitch.focus();
    await expect(activeSwitch).toBeFocused();
    const focus = await activeSwitch.evaluate((link) => {
      const style = getComputedStyle(link);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(focus).toEqual({ style: "solid", width: "3px" });

    const images = page.locator("main img");
    for (let index = 0; index < (await images.count()); index += 1) {
      expect(await images.nth(index).getAttribute("alt")).toBeTruthy();
    }
    const productLoading = await page
      .locator("main article img")
      .evaluateAll((items) => items.map((item) => item.getAttribute("loading")));
    expect(productLoading.every((loading) => loading === "lazy")).toBeTruthy();

    const transition = await page
      .locator("#product-tiger-aqua-outdoor-indoor-paddle a")
      .last()
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(transition)).toBeLessThanOrEqual(0.001);
  });

  test("captures the five gear chapters and replacement-parts support page for visual QA", async ({
    page
  }) => {
    test.setTimeout(180_000);
    test.skip(
      process.env.CAPTURE_GEAR_SCREENSHOTS !== "1",
      "Run explicitly when refreshing visual evidence."
    );

    const outputDirectory = path.resolve(process.cwd(), "exports/gear-categories-qa/playwright");
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

        const lazyImages = page.locator("main img[loading='lazy']");
        for (let index = 0; index < (await lazyImages.count()); index += 1) {
          await lazyImages.nth(index).scrollIntoViewIfNeeded();
        }

        await page.screenshot({
          fullPage: true,
          path: path.join(outputDirectory, `${kind}-${viewport.label}-full.png`)
        });
      }
    }
  });
});
