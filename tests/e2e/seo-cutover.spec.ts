import { expect, test } from "@playwright/test";

import {
  CANONICAL_SITE_ORIGIN,
  LEGACY_PATH_REDIRECTS
} from "../../apps/web/src/lib/legacy-redirects";

const PRESERVED_LEGACY_PATHS = [
  "/",
  "/shipping-returns",
  "/resources",
  "/contact",
  "/about",
  "/accessories/paddles",
  "/accessories/covers",
  "/accessories",
  "/accessories/ping-pong-balls",
  "/accessories/nets",
  "/tables/indoor-tables",
  "/tables",
  "/tables/outdoor-tables",
  "/resources/choose-a-ping-pong-table",
  "/resources/indoor-vs-outdoor-ping-pong-tables",
  "/resources/ping-pong-rules",
  "/resources/room-size"
];

test("every approved legacy path is an exact direct 301", async ({ request }) => {
  for (const [source, destination] of LEGACY_PATH_REDIRECTS) {
    const response = await request.get(source, { maxRedirects: 0 });
    expect(response.status(), source).toBe(301);
    expect(response.headers().location, source).toBe(`${CANONICAL_SITE_ORIGIN}${destination}`);
  }

  const queryAlias = await request.get("/xmlsitemap.php?type=products&page=1", {
    maxRedirects: 0
  });
  expect(queryAlias.status()).toBe(301);
  expect(queryAlias.headers().location).toBe(`${CANONICAL_SITE_ORIGIN}/sitemap.xml`);
});

test("legacy hosts normalize paths and path rules still win in one hop", async ({ request }) => {
  for (const host of ["tigerpingpong.com", "www.tigerpingpong.com", "www.tigerpingpong.ca"]) {
    const response = await request.get("/tables?campaign=legacy", {
      headers: { "x-forwarded-host": host },
      maxRedirects: 0
    });
    expect(response.status(), host).toBe(301);
    expect(response.headers().location, host).toBe(
      `${CANONICAL_SITE_ORIGIN}/tables?campaign=legacy`
    );
  }

  const productRedirect = await request.get("/accessories/vice-ping-pong-paddle?old=1", {
    headers: { "x-forwarded-host": "tigerpingpong.com" },
    maxRedirects: 0
  });
  expect(productRedirect.status()).toBe(301);
  expect(productRedirect.headers().location).toBe(
    `${CANONICAL_SITE_ORIGIN}/catalog/products/tiger-vice-paddle`
  );
});

test("the 17 same-path legacy pages remain live and shop-all stays a real 404", async ({
  request
}) => {
  expect(PRESERVED_LEGACY_PATHS).toHaveLength(17);

  for (const path of PRESERVED_LEGACY_PATHS) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
  }

  const missingProduct = await request.get("/shop-all/-1", { maxRedirects: 0 });
  expect(missingProduct.status()).toBe(404);
});

test("sitemap contains the complete canonical inventory without fabricated freshness fields", async ({
  request
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/xml");

  const xml = await response.text();
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  expect(locations).toHaveLength(34);
  expect(new Set(locations).size).toBe(34);
  expect(locations.every((location) => location.startsWith(`${CANONICAL_SITE_ORIGIN}/`))).toBe(
    true
  );
  expect(locations).toContain(`${CANONICAL_SITE_ORIGIN}/catalog`);
  expect(locations).toContain(`${CANONICAL_SITE_ORIGIN}/shipping-returns`);
  expect(locations).toContain(
    `${CANONICAL_SITE_ORIGIN}/catalog/products/tiger-aqua-outdoor-indoor-paddle`
  );
  expect(xml).not.toMatch(/<lastmod>|<changefreq>|<priority>/);
});

test("canonical and utility-page robot directives are readable and correct", async ({ page }) => {
  test.setTimeout(60_000);

  for (const path of [
    "/catalog",
    "/shipping-returns",
    "/returns-policy",
    "/privacy-policy",
    "/terms-and-conditions"
  ]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${CANONICAL_SITE_ORIGIN}${path}`
    );
  }

  for (const [path, expected] of [
    ["/cart", /noindex,\s*follow/i],
    ["/checkout/success", /noindex,\s*nofollow/i],
    ["/checkout/cancel", /noindex,\s*nofollow/i],
    ["/catalog-preview", /noindex,\s*nofollow/i]
  ] as const) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", expected);
  }

  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /admin/");
  expect(robots).toContain("Disallow: /internal/");
  expect(robots).toContain("Disallow: /api/");
  expect(robots).not.toContain("/checkout/");
  expect(robots).not.toContain("/catalog-preview/");
  expect(robots).toContain(`Sitemap: ${CANONICAL_SITE_ORIGIN}/sitemap.xml`);
});

test("restored resource topics render at their preserved URLs", async ({ page }) => {
  for (const [path, headings] of [
    [
      "/resources/choose-a-ping-pong-table",
      [
        "Choose a colour and finish you can play on",
        "Folding versus one-piece tables",
        "Competition-table considerations",
        "Final table-buying checklist"
      ]
    ],
    [
      "/resources/room-size",
      [
        "Competition playing areas are much larger",
        "Ceiling height, lights, and net clearance",
        "Smaller table options",
        "Lighting, temperature, and flooring"
      ]
    ],
    [
      "/resources/ping-pong-rules",
      [
        "Equipment basics",
        "How to make a legal serve",
        "Lets, returns, and common point losses",
        "Games, matches, and doubles basics",
        "Common beginner questions"
      ]
    ]
  ] as const) {
    await page.goto(path);
    for (const heading of headings) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
    await expect(page.getByText("Updated July 20, 2026", { exact: false })).toBeVisible();
  }
});

test("all sitemap pages and their public internal links avoid unintended errors", async ({
  request
}) => {
  test.setTimeout(120_000);
  const sitemapXml = await (await request.get("/sitemap.xml")).text();
  const sitemapPaths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname
  );
  const internalPaths = new Set(sitemapPaths);

  for (const path of sitemapPaths) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);

    const contentType = response.headers()["content-type"] ?? "";
    if (!contentType.includes("text/html")) continue;

    const html = await response.text();
    for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

      const url = new URL(href, CANONICAL_SITE_ORIGIN);
      if (url.origin === CANONICAL_SITE_ORIGIN) internalPaths.add(url.pathname);
    }
  }

  for (const path of internalPaths) {
    const response = await request.get(path, { maxRedirects: 0 });
    if (response.status() === 308 && path.length > 1 && path.endsWith("/")) {
      const normalizedPath = path.slice(0, -1);
      expect(new URL(response.headers().location, "http://local.test").pathname, path).toBe(
        normalizedPath
      );
      expect((await request.get(normalizedPath, { maxRedirects: 0 })).status(), normalizedPath).toBe(
        200
      );
      continue;
    }

    expect(response.status(), path).toBe(200);
  }
});
