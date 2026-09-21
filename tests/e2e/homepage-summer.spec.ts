import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const HOMEPAGE_DESCRIPTION =
  "Shop Tiger PingPong tables, paddles, balls, and outdoor gear from a Vancouver company serving players across Canada for more than 15 years.";

test("homepage keeps the existing structure with the fall game-night campaign", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Tiger PingPong | Tables, Paddles, Balls & Accessories");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    HOMEPAGE_DESCRIPTION
  );

  const hero = page.locator("#home");
  const heroHeading = hero.getByRole("heading", {
    level: 1,
    name: "Good nights. Great rallies."
  });
  const heroImage = hero.getByRole("img");
  const findTable = hero.getByRole("link", { name: "Shop indoor tables" });
  const callTiger = hero.getByRole("link", { name: "Call 1-888-552-5259" });

  await expect(heroHeading).toBeInViewport();
  await expect(heroImage).toHaveAttribute("src", /homepage(?:%2F|\/)game-night-paddle-tap/);
  await expect(heroImage).toHaveAttribute(
    "alt",
    "Two players tapping red paddles together across an indoor PingPong table."
  );
  await expect(
    hero.getByText("PingPong for basements, rec rooms, and getting together.")
  ).toBeVisible();
  await expect(findTable).toHaveAttribute("href", "/tables/indoor-tables/");
  await expect(callTiger).toHaveAttribute("href", "tel:+18885525259");

  const heroCrop = await heroImage.evaluate((image) => {
    const style = getComputedStyle(image);
    return { objectFit: style.objectFit, objectPosition: style.objectPosition };
  });
  expect(heroCrop.objectFit).toBe("cover");
  expect(heroCrop.objectPosition).toBe("50% 62%");

  await expect(page.locator('#shop a[href="/tables/"]')).toContainText("Find the right table");
  await expect(
    page.locator('#shop a[href="/catalog/products/tiger-aqua-outdoor-indoor-paddle"]')
  ).toContainText("Ready for game night");
  await expect(page.locator('#shop a[href="/accessories/"]')).toContainText("Ready for real life");
  await expect(page.locator('#vancouver a[href="/about#vancouver"]')).toHaveText(
    "See where we’ve played"
  );
  await expect(page.locator('#aqua a[href$="tiger-aqua-outdoor-indoor-paddle"]')).toHaveText(
    "Meet Aqua"
  );
  await expect(page.locator('#portland a[href$="tiger-portland-outdoor-table"]')).toHaveText(
    "Meet Portland"
  );
  await expect(page.locator('#cover a[href$="tiger-table-cover-black-polyester"]')).toHaveText(
    "Cover It Up"
  );

  await expect(page.locator("main")).not.toContainText(/summer|poolside|BBQs/i);
  await expect(page.getByText("Our Story", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/now heading across Canada/i)).toHaveCount(0);
  await expect(page.getByText("Need a hand? We’ve got you.", { exact: true })).toHaveCount(0);
  await expect(page.locator('main section[aria-label="Support"]')).toHaveCount(0);

  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.locator("main h2")).toHaveText([
    "Find your next rally",
    "Who’s up for a game?",
    "Tough outside. Smart inside.",
    "Raised on the West Coast.",
    "Ultra Protection."
  ]);

  const anchorOrder = await page.evaluate(() =>
    ["shop", "aqua", "portland", "vancouver", "cover"].map((id) => ({
      id,
      top: document.getElementById(id)?.offsetTop ?? -1
    }))
  );
  expect(anchorOrder.every(({ top }) => top >= 0)).toBeTruthy();
  expect(anchorOrder.map(({ top }) => top)).toEqual(
    [...anchorOrder.map(({ top }) => top)].sort((left, right) => left - right)
  );

  await expect(
    page.getByAltText("People rallying on Tiger tables outdoors at Vancouver's Food Cart Fest.")
  ).toBeVisible();
  await expect(
    page.getByAltText(
      "People playing on an early Tiger table in the rain beneath a white event tent."
    )
  ).toHaveAttribute("src", /f_auto%2Cq_auto%2Cw_640|f_auto,q_auto,w_640/);
  await expect(page.getByAltText("Two Tiger Aqua paddles with three white balls.")).toHaveCount(1);
  await expect(
    page.getByAltText("Tiger Portland Outdoor PingPong table in black and grey.")
  ).toHaveAttribute("src", /e_background_removal(?:%2F|\/)f_png/);
  await expect(page.locator('#portland > img[alt=""], #aqua > img[alt=""]')).toHaveCount(0);
  await expect(page.locator("#aqua img")).toHaveAttribute(
    "src",
    /two-paddles-three-balls-original/
  );
  await expect(
    page.getByAltText("Black Tiger PingPong cover fitted over a table with natural fabric folds.")
  ).toHaveAttribute("src", /tiger-table-cover-black-polyester(?:%2F|\/)01-main/);
});

test("homepage keeps the hero actions immediate and never overflows", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 417, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
    { width: 1440, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const hero = page.locator("#home");
    const heroHeading = hero.getByRole("heading", {
      level: 1,
      name: "Good nights. Great rallies."
    });
    const actions = [
      hero.getByRole("link", { name: "Shop indoor tables" }),
      hero.getByRole("link", { name: "Call 1-888-552-5259" })
    ];

    await expect(heroHeading).toBeInViewport();
    for (const action of actions) {
      const bounds = await action.boundingBox();
      expect(bounds, `${viewport.width}px ${await action.innerText()}`).not.toBeNull();
      expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
    }

    const layout = await page.evaluate(() => {
      const shopGrid = document.querySelector("#shop > div:last-child");
      return {
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        shopColumns: shopGrid ? getComputedStyle(shopGrid).gridTemplateColumns : ""
      };
    });

    expect(layout.scrollWidth, `${viewport.width}px`).toBe(layout.clientWidth);
    expect(layout.shopColumns.split(" ")).toHaveLength(viewport.width < 900 ? 1 : 3);
  }
});

test("homepage focus and reduced-motion behavior stay accessible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");

  const findTable = page.locator("#home").getByRole("link", { name: "Shop indoor tables" });
  const callTiger = page.locator("#home").getByRole("link", { name: "Call 1-888-552-5259" });
  await findTable.focus();
  await expect(findTable).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(callTiger).toBeFocused();

  const focusStyle = await callTiger.evaluate((link) => {
    const style = getComputedStyle(link);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });
  expect(focusStyle.outlineStyle).toBe("solid");
  expect(focusStyle.outlineWidth).toBe("3px");

  for (const id of ["shop", "aqua", "portland", "vancouver", "cover"]) {
    const animationName = await page
      .locator(`#${id}`)
      .evaluate((element) => getComputedStyle(element).animationName);
    expect(animationName, id).toBe("none");
  }
});

test("capture fall homepage evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_HOMEPAGE_SCREENSHOTS !== "1", "Local evidence capture only.");
  const outputDirectory = path.resolve("exports/homepage-fall-qa/playwright");
  await mkdir(outputDirectory, { recursive: true });

  for (const viewport of [
    { height: 1000, name: "desktop-1440", width: 1440 },
    { height: 1024, name: "tablet-768", width: 768 },
    { height: 844, name: "mobile-390", width: 390 }
  ]) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await page.locator("#home img").waitFor();
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
