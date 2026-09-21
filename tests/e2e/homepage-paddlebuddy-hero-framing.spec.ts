import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

async function expectNoHorizontalOverflow(page: Page) {
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(layout.scrollWidth).toBe(layout.clientWidth);
}

test("keeps the Club Night image as one continuous mobile hero scene", async ({ page }) => {
  for (const viewport of [
    { height: 900, width: 1440 },
    { height: 1024, width: 900 },
    { height: 844, width: 390 },
    { height: 844, width: 375 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const heroImage = page.locator("#home img");
    const framing = await heroImage.evaluate((image) => {
      const style = getComputedStyle(image);
      return { objectFit: style.objectFit, objectPosition: style.objectPosition };
    });

    expect(framing.objectFit).toBe("cover");

    if (viewport.width < 900) {
      expect(await heroImage.evaluate((image) => getComputedStyle(image).maskImage)).toBe("none");
    }

    await expectNoHorizontalOverflow(page);
  }
});

test("offers the Paddle Buddy Reddit community before the FAQ", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/paddlebuddy");

  const communityLink = page.getByRole("link", {
    name: "Join the conversation r/ProjectPaddleBuddy"
  });
  await expect(communityLink).toHaveAttribute(
    "href",
    "https://www.reddit.com/r/ProjectPaddleBuddy/"
  );
  await expect(communityLink).toHaveAttribute("target", "_blank");

  const order = await page.evaluate(() => {
    const community = document.getElementById("community-title")?.closest("section");
    const faq = document.getElementById("faq-title")?.closest("section");
    return {
      communityTop: community?.getBoundingClientRect().top ?? -1,
      faqTop: faq?.getBoundingClientRect().top ?? -1
    };
  });

  expect(order.communityTop).toBeGreaterThanOrEqual(0);
  expect(order.faqTop).toBeGreaterThan(order.communityTop);
  await expectNoHorizontalOverflow(page);
});

test("matches the Paddle Buddy mobile capture to the phone aperture", async ({ page }) => {
  for (const viewport of [
    { height: 900, width: 1440 },
    { height: 900, width: 900 },
    { height: 844, width: 390 },
    { height: 844, width: 375 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/paddlebuddy");

    const capture = page.getByRole("img", {
      name: "Paddle Buddy home and connect screen in the iPhone simulator"
    });
    const framing = await capture.evaluate((image) => {
      const style = getComputedStyle(image);
      return { objectFit: style.objectFit, objectPosition: style.objectPosition };
    });

    if (viewport.width <= 620) {
      expect(framing).toEqual({ objectFit: "cover", objectPosition: "50% 50%" });
      const aspectRatio = await capture.evaluate((image) => ({
        rendered: image.clientWidth / image.clientHeight,
        source: image.naturalWidth / image.naturalHeight
      }));
      expect(aspectRatio.rendered).toBeCloseTo(aspectRatio.source, 2);
    } else {
      expect(framing.objectFit).toBe("cover");
    }

    await expectNoHorizontalOverflow(page);
  }
});

test("capture Issue 191 hero framing evidence", async ({ page }) => {
  test.skip(process.env.CAPTURE_ISSUE_191_EVIDENCE !== "1", "Local evidence capture only.");

  const outputDirectory = path.resolve(
    process.env.ISSUE_191_EVIDENCE_DIR ?? "exports/issue-191-visual-qa"
  );
  await mkdir(outputDirectory, { recursive: true });

  for (const surface of [
    { name: "homepage", path: "/" },
    { name: "paddlebuddy", path: "/paddlebuddy" }
  ]) {
    for (const viewport of [
      { height: 900, name: "desktop-1440", width: 1440 },
      { height: 844, name: "mobile-390", width: 390 }
    ]) {
      await page.setViewportSize({ height: viewport.height, width: viewport.width });
      await page.goto(surface.path);
      await page.screenshot({
        fullPage: false,
        path: path.join(outputDirectory, `${surface.name}-${viewport.name}.png`)
      });

      if (surface.name === "paddlebuddy") {
        await page.getByRole("heading", { name: "Build it with us." }).scrollIntoViewIfNeeded();
        await page.screenshot({
          fullPage: false,
          path: path.join(outputDirectory, `${surface.name}-community-${viewport.name}.png`)
        });
      }
    }
  }
});
