import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const HOMEPAGE_DESCRIPTION =
  "Shop Tiger PingPong tables, paddles, balls, and outdoor gear from a Vancouver company serving players across Canada for more than 15 years.";

test("homepage opens on established Vancouver roots and a summer-in-Canada campaign", async ({
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
    name: "Raised on the West Coast."
  });
  const heroImage = hero.getByRole("img");
  const findTable = hero.getByRole("link", { name: "Find Your Table" });
  const callTiger = hero.getByRole("link", { name: "Call 1-888-552-5259" });

  await expect(heroHeading).toBeInViewport();
  await expect(heroImage).toHaveAttribute("src", /category-heroes(?:%2F|\/)ping-pong-tables/);
  await expect(heroImage).toHaveAttribute(
    "alt",
    "Blue Tiger Expo Outdoor table on a Vancouver terrace overlooking the water and North Shore mountains."
  );
  await expect(hero.getByText(/For more than 15 years/)).toBeVisible();
  await expect(findTable).toHaveAttribute("href", "/tables/");
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
  ).toContainText("Made for summer");
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

  await expect(page.getByText("Summer in Canada", { exact: true })).toBeVisible();
  await expect(page.getByText(/Aqua was made for summer in Canada/)).toBeVisible();
  await expect(page.getByText("Our Story", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/now heading across Canada/i)).toHaveCount(0);
  await expect(page.getByText("Need a hand? We’ve got you.", { exact: true })).toHaveCount(0);
  await expect(page.locator('main section[aria-label="Support"]')).toHaveCount(0);

  await expect(page.locator("main h1")).toHaveCount(1);
  await expect(page.locator("main h2")).toHaveText([
    "Shop Your Summer",
    "Make a Splash.",
    "Take it Outside.",
    "The city was our product test.",
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
  await expect(page.getByAltText("Red and blue Tiger Aqua outdoor PingPong paddles.")).toHaveCount(
    1
  );
  await expect(
    page.getByAltText("Tiger Portland Outdoor PingPong table in black and grey.")
  ).toHaveAttribute("src", /e_background_removal(?:%2F|\/)f_png/);
  await expect(page.locator('#portland > img[alt=""]')).toHaveAttribute(
    "src",
    /portland-summer-lifestyle-background-v1/
  );
  await expect(
    page.getByAltText("Black Tiger PingPong table cover with a white logo.")
  ).toHaveCount(1);
});

test("homepage keeps the hero actions immediate and never overflows", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1280, height: 900 },
    { width: 1440, height: 900 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const hero = page.locator("#home");
    const heroHeading = hero.getByRole("heading", {
      level: 1,
      name: "Raised on the West Coast."
    });
    const actions = [
      hero.getByRole("link", { name: "Find Your Table" }),
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

  const findTable = page.locator("#home").getByRole("link", { name: "Find Your Table" });
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

test("capture Summer in Canada homepage evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_HOMEPAGE_SCREENSHOTS !== "1", "Local evidence capture only.");
  const outputDirectory = path.resolve("exports/homepage-summer-qa/playwright");
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
