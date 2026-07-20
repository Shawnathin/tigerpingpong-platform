import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

test("about story opens on present-day Vancouver and follows the West Coast rally", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/about");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("About Tiger PingPong | Raised on the West Coast");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "From questionable first tables and Vancouver game nights to German-made gear shipped across Canada: meet Tiger PingPong."
  );

  const hero = page.getByTestId("about-current-hero");
  const heroHeading = page.getByRole("heading", {
    level: 1,
    name: "Raised on the West Coast."
  });
  const heroImage = hero.locator("img");
  const firstTable = page.getByAltText(
    "Tiger's first pre-Expo PingPong table with a green top and skinny legs."
  );

  await expect(hero).toBeInViewport();
  await expect(heroHeading).toBeInViewport();
  await expect(heroImage).toHaveAttribute("src", /category-heroes(?:%2F|\/)ping-pong-tables/);
  await expect(firstTable).toHaveAttribute("loading", "lazy");
  await expect(
    page.getByAltText(
      "People playing on an early Tiger table in the rain beneath a white event tent."
    )
  ).toHaveAttribute("src", /f_auto,q_auto,w_640/);
  await expect(
    page.getByAltText(
      "Two players smiling and tapping paddles after a game in a crowded Vancouver venue."
    )
  ).toHaveAttribute("src", /f_auto,q_auto,w_750/);

  const landingPositions = await page.evaluate(() => {
    const heroElement = document.querySelector('[data-testid="about-current-hero"]');
    const firstTableImage = document.querySelector(
      'img[alt="Tiger\'s first pre-Expo PingPong table with a green top and skinny legs."]'
    );

    return {
      firstTableTop: firstTableImage?.getBoundingClientRect().top ?? 0,
      heroBottom: heroElement?.getBoundingClientRect().bottom ?? 0,
      heroTop: heroElement?.getBoundingClientRect().top ?? 0,
      viewportHeight: window.innerHeight
    };
  });
  expect(landingPositions.heroTop).toBeLessThan(landingPositions.viewportHeight);
  expect(landingPositions.heroBottom).toBeGreaterThan(landingPositions.viewportHeight * 0.7);
  expect(landingPositions.firstTableTop).toBeGreaterThanOrEqual(landingPositions.viewportHeight);

  const anchorOrder = await page.evaluate(() =>
    [
      "start",
      "early-days",
      "first-serve",
      "vancouver",
      "built-better",
      "names",
      "across-canada"
    ].map((id) => {
      const section = document.getElementById(id);
      return { id, top: section?.offsetTop ?? -1 };
    })
  );
  expect(anchorOrder.map(({ id }) => id)).toEqual([
    "start",
    "early-days",
    "first-serve",
    "vancouver",
    "built-better",
    "names",
    "across-canada"
  ]);
  expect(anchorOrder.every(({ top }) => top >= 0)).toBeTruthy();
  expect(anchorOrder.map(({ top }) => top)).toEqual(
    [...anchorOrder.map(({ top }) => top)].sort((a, b) => a - b)
  );

  await expect(page.locator('a[href="#early-days"]')).toHaveText(
    "The story starts with a very skinny table."
  );
  await expect(page.locator('a[href="/catalog/products/tiger-expo-outdoor-table"]')).toHaveText(
    "Meet Expo"
  );
  await expect(page.locator('a[href="/catalog/products/tiger-whistler-indoor-table"]')).toHaveText(
    "Meet Whistler"
  );
  await expect(page.locator('a[href="/catalog/products/tiger-portland-outdoor-table"]')).toHaveText(
    "Meet Portland"
  );
  await expect(page.locator('main a[href="/tables/"]')).toHaveText("Find your table");
  await expect(page.locator('main a[href="/contact"]')).toHaveText("Talk to a real person");

  const expoLink = page.locator('a[href="/catalog/products/tiger-expo-outdoor-table"]');
  const whistlerLink = page.locator('a[href="/catalog/products/tiger-whistler-indoor-table"]');
  const portlandLink = page.locator('a[href="/catalog/products/tiger-portland-outdoor-table"]');
  const findTableLink = page.locator('main a[href="/tables/"]');
  const contactLink = page.locator('main a[href="/contact"]');
  await expoLink.focus();
  await expect(expoLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(whistlerLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(portlandLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(findTableLink).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(contactLink).toBeFocused();

  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.locator("main h2")).toHaveCount(8);
  const imageAlternatives = await page
    .locator("main img")
    .evaluateAll((images) => images.map((image) => image.getAttribute("alt")?.trim() ?? ""));
  expect(imageAlternatives).toHaveLength(14);
  expect(imageAlternatives.every(Boolean)).toBeTruthy();

  const aboutLinks = page.locator(
    'main a[href="#early-days"], main a[href^="/catalog/products/"], main a[href="/tables/"], main a[href="/contact"]'
  );
  expect(
    await aboutLinks.evaluateAll((links) => links.every((link) => link.tabIndex >= 0))
  ).toBeTruthy();
});

test("about story stays deliberate and overflow-free from mobile through desktop", async ({
  page
}) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/about");
    await expect(
      page.getByRole("heading", { level: 1, name: "Raised on the West Coast." })
    ).toBeInViewport();

    const layout = await page.evaluate(() => {
      const firstTable = document.querySelector(
        'img[alt="Tiger\'s first pre-Expo PingPong table with a green top and skinny legs."]'
      );
      const originCopy = document.querySelector("#first-serve header");

      return {
        clientWidth: document.documentElement.clientWidth,
        firstTableTop: firstTable?.getBoundingClientRect().top ?? 0,
        originCopyPosition: originCopy ? getComputedStyle(originCopy).position : "",
        scrollWidth: document.documentElement.scrollWidth,
        viewportHeight: window.innerHeight
      };
    });

    expect(layout.scrollWidth, `${viewport.width}px`).toBe(layout.clientWidth);
    expect(layout.firstTableTop, `${viewport.width}px first table`).toBeGreaterThanOrEqual(
      layout.viewportHeight
    );
    expect(layout.originCopyPosition, `${viewport.width}px origin layout`).toBe(
      viewport.width <= 900 ? "static" : "sticky"
    );
  }
});

test("about story honors reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/about");

  const motion = await page.evaluate(() => {
    const heroImage = document.querySelector('[data-testid="about-current-hero"] img');
    const heroCopy = document.querySelector('[data-testid="about-current-hero"] h1')?.parentElement;
    const firstTable = document.querySelector(
      'img[alt="Tiger\'s first pre-Expo PingPong table with a green top and skinny legs."]'
    );
    const revealFigure = firstTable?.closest("figure");

    return [heroImage, heroCopy, revealFigure].map((element) =>
      element ? getComputedStyle(element).animationName : "missing"
    );
  });

  expect(motion).toEqual(["none", "none", "none"]);
});

test("capture About West Coast Rally evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_ABOUT_SCREENSHOTS !== "1", "Local About evidence capture only.");
  const outputDirectory = path.resolve("exports/about-story-qa");
  await mkdir(outputDirectory, { recursive: true });

  for (const viewport of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 }
  ]) {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize(viewport);
    await page.goto("/about");
    const heroImage = page.getByTestId("about-current-hero").locator("img");
    await expect(heroImage).toBeVisible();
    await heroImage.evaluate((image: HTMLImageElement) =>
      image.complete ? undefined : new Promise((resolve) => image.addEventListener("load", resolve))
    );
    await page.screenshot({
      fullPage: false,
      path: path.join(outputDirectory, `about-${viewport.name}-viewport.png`)
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.75) {
        window.scrollTo(0, y);
        await new Promise((resolve) => window.setTimeout(resolve, 80));
      }
      window.scrollTo(0, 0);
    });
    await page.screenshot({
      fullPage: true,
      path: path.join(outputDirectory, `about-${viewport.name}-full.png`)
    });
  }
});
