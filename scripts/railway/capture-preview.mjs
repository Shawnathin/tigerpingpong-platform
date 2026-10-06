import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { assertPreviewEnvironment } from "./preview-environment.mjs";

assertPreviewEnvironment(process.env, "web");
const base = process.env.NEXT_PUBLIC_SITE_URL;
const response = await fetch(base);
if (response.headers.get("x-tiger-preview") !== "synthetic-read-only")
  throw new Error("Preview marker is missing.");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TIGER_PREVIEW_CHROME_PATH
    ? { executablePath: process.env.TIGER_PREVIEW_CHROME_PATH }
    : {})
});
const results = [];
await mkdir("exports/railway-preview", { recursive: true });
try {
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    await context.route("**/*", (route) => {
      if (!["GET", "HEAD"].includes(route.request().method())) return route.abort();
      return route.continue();
    });
    for (const [label, path] of [
      ["home", "/"],
      ["synthetic-product", "/catalog/products/preview-fixture-paddle"],
      ["paddlebuddy", "/paddlebuddy"]
    ]) {
      const page = await context.newPage();
      const response = await page.goto(new URL(path, base).href, {
        waitUntil: "networkidle",
        timeout: 45000
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1
      );
      await page.screenshot({
        path: `exports/railway-preview/${label}-${width}.png`,
        fullPage: true
      });
      results.push({ label, width, httpStatus: response.status(), horizontalOverflow: overflow });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(
  "exports/railway-preview/browser-results.json",
  JSON.stringify(results, null, 2) + "\n"
);
if (results.some((r) => r.httpStatus !== 200 || r.horizontalOverflow))
  throw new Error("Preview browser check failed.");
console.log("Six desktop/mobile read-only browser checks passed.");
