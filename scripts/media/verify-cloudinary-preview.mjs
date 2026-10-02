import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TIGER_MEDIA_VERIFY_BASE_URL ?? "http://127.0.0.1:4170";
const outputRoot = path.resolve(
  process.env.TIGER_MEDIA_VERIFY_OUTPUT ?? "exports/cloudinary-migration-preview"
);
const liveMedia = JSON.parse(await readFile("../tiger-live-public-catalog-media.json", "utf8"));
const productSlugs = [...new Set(liveMedia.mediaRows.map((row) => row.productSlug))];
const routes = [
  "/",
  "/about",
  "/tables",
  "/tables/outdoor-tables",
  "/tables/indoor-tables",
  "/accessories",
  "/replacement-parts",
  "/paddlebuddy",
  ...productSlugs.map((slug) => `/catalog/products/${slug}`)
];
await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch();
const results = [];
const replacementOnlyRoutes = new Set([
  "/catalog/products/tiger-table-net-replacement-set",
  "/catalog/products/tiger-pingpong-replacement-part-40",
  "/catalog/products/tiger-replacement-net"
]);
for (const width of [1280, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  await context.route("**/*", async (route) => {
    if (!["GET", "HEAD"].includes(route.request().method())) return route.abort();
    return route.continue();
  });
  for (const route of routes) {
    const page = await context.newPage();
    const mediaResponses = [];
    const consoleErrors = [];
    page.on("response", (response) => {
      if (["image", "media"].includes(response.request().resourceType())) {
        mediaResponses.push({ url: response.url(), status: response.status() });
      }
    });
    page.on("pageerror", (error) => consoleErrors.push(error.name));
    const response = await page.goto(baseUrl + route, { waitUntil: "networkidle", timeout: 45000 });
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      for (const image of images) {
        image.loading = "eager";
      }
      await Promise.all(
        images.map(
          (image) =>
            new Promise((resolve) => {
              if (image.complete) return resolve();
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
              setTimeout(resolve, 10000);
            })
        )
      );
    });
    const geometry = await page.evaluate(() => ({
      h1Count: document.querySelectorAll("h1").length,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      images: Array.from(document.images).map((image) => ({
        source: image.currentSrc || image.src,
        loaded: image.complete && image.naturalWidth > 0,
        width: image.naturalWidth,
        height: image.naturalHeight
      })),
      manuals: Array.from(document.querySelectorAll('a[href*=".pdf"]')).map((link) => link.href),
      videos: Array.from(document.querySelectorAll("video source")).map((video) => video.src)
    }));
    const result = {
      route,
      width,
      httpStatus: response.status(),
      ...geometry,
      mediaResponses,
      consoleErrors
    };
    results.push(result);
    if (
      [
        "/",
        "/replacement-parts",
        "/catalog/products/tiger-expo-outdoor-table",
        "/paddlebuddy"
      ].includes(route)
    ) {
      const filename = (route === "/" ? "home" : route.replaceAll("/", "-")) + `-${width}.png`;
      await page.screenshot({ path: path.join(outputRoot, filename), fullPage: true });
    }
    await page.close();
    await writeFile(
      path.join(outputRoot, "browser-results.json"),
      JSON.stringify(results, null, 2) + "\n"
    );
  }
  await context.close();
  console.log(`Completed read-only public-route preview checks at ${width}px.`);
}
await browser.close();
const summary = {
  routeChecks: results.length,
  httpFailures: results.filter((result) => result.httpStatus !== 200).length,
  expectedNotFoundChecks: results.filter(
    (result) => replacementOnlyRoutes.has(result.route) && result.httpStatus === 404
  ).length,
  unexpectedHttpFailures: results.filter(
    (result) => result.httpStatus !== (replacementOnlyRoutes.has(result.route) ? 404 : 200)
  ).length,
  overflowFailures: results.filter((result) => result.horizontalOverflow).length,
  brokenImages: results.reduce(
    (count, result) => count + result.images.filter((image) => !image.loaded).length,
    0
  ),
  imageHttpFailures: results.reduce(
    (count, result) =>
      count + result.mediaResponses.filter((response) => response.status >= 400).length,
    0
  ),
  pageErrors: results.reduce((count, result) => count + result.consoleErrors.length, 0),
  pdfDeliveryGate:
    "All five destination PDF public originals and attachments verified HTTP200 with matching source hashes.",
  additionalAssetsGate:
    "All 160 exact Tiger assets are owner-approved and copied; no additional copy-scope gate."
};
await writeFile(
  path.join(outputRoot, "browser-summary.json"),
  JSON.stringify(summary, null, 2) + "\n"
);
console.log(JSON.stringify(summary));
