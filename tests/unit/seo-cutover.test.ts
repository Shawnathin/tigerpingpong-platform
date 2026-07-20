import { readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProductsMock } = vi.hoisted(() => ({
  getProductsMock: vi.fn()
}));

vi.mock("../../apps/web/src/lib/catalog-api", () => ({
  getProducts: getProductsMock
}));

import { GET as getSitemapResponse } from "../../apps/web/src/app/sitemap.xml/route";
import {
  CANONICAL_SITE_ORIGIN,
  getLegacyPathRedirect,
  isLegacyRedirectHost,
  LEGACY_PATH_REDIRECTS,
  toCanonicalRedirectUrl
} from "../../apps/web/src/lib/legacy-redirects";
import { RESOURCE_ARTICLES, getResourceArticle } from "../../apps/web/src/lib/resource-articles";
import { getSitemapEntries, serializeSitemap } from "../../apps/web/src/lib/sitemap";
import type { CatalogProductSummary } from "../../apps/web/src/types/catalog";

const EXPECTED_LEGACY_REDIRECTS = {
  "/accessories/aqua-outdoor-paddle-pack-2-pack":
    "/catalog/products/tiger-aqua-outdoor-indoor-paddle",
  "/accessories/aqua-outdoor-paddle-pack-4-pack":
    "/catalog/products/tiger-aqua-outdoor-indoor-paddle",
  "/accessories/aqua-single-coral": "/catalog/products/tiger-aqua-outdoor-indoor-paddle",
  "/accessories/aqua-single-ocean-blue": "/catalog/products/tiger-aqua-outdoor-indoor-paddle",
  "/accessories/newgy-table-tennis-balls-orange": "/accessories/ping-pong-balls",
  "/accessories/ping-pong-balls-premium-3-star-140-balls-white-orange":
    "/catalog/products/tiger-premium-balls-140",
  "/accessories/ping-pong-balls-premium-3-star-6-balls-orange":
    "/catalog/products/tiger-premium-balls-6-orange",
  "/accessories/ping-pong-balls-premium-3-star-white":
    "/catalog/products/tiger-premium-balls-6-white",
  "/accessories/ping-pong-paddle-case": "/accessories/paddles",
  "/accessories/ping-pong-table-cover": "/catalog/products/tiger-table-cover-black-polyester",
  "/accessories/premium-table-cover": "/catalog/products/tiger-table-cover-black-polyester",
  "/accessories/replacement-net": "/accessories/nets",
  "/accessories/table-tennis-net-post-set": "/catalog/products/tiger-net-post-set",
  "/accessories/tiger-pingpong-table-net-replacement-set": "/accessories/nets",
  "/accessories/vice-ping-pong-paddle": "/catalog/products/tiger-vice-paddle",
  "/brands": "/catalog",
  "/paddles/aqua-outdoor-indoor-paddle": "/catalog/products/tiger-aqua-outdoor-indoor-paddle",
  "/replacement-parts/tiger-pingpong-replacement-part-40": "/replacement-parts#part-40",
  "/shipping": "/shipping-returns",
  "/sitemap.php": "/sitemap.xml",
  "/tables/expo-indoor-ping-pong-table-grey-green-blue": "/tables/indoor-tables",
  "/tables/expo-outdoor-ping-pong-table-grey-green-blue":
    "/catalog/products/tiger-expo-outdoor-table",
  "/tables/plaza-outdoor-ping-pong-table-grey": "/catalog/products/tiger-plaza-outdoor-table-grey",
  "/tables/portland-indoor-ping-pong-table-grey-green-blue":
    "/catalog/products/tiger-portland-indoor-table",
  "/tables/portland-outdoor-ping-pong-table-grey-blue":
    "/catalog/products/tiger-portland-outdoor-table",
  "/tables/whistler-indoor-ping-pong-table-in-green-blue":
    "/catalog/products/tiger-whistler-indoor-table",
  "/tiger-pingpong": "/catalog",
  "/xmlsitemap.php": "/sitemap.xml"
} as const;

const EXPECTED_STATIC_SITEMAP_PATHS = [
  "/",
  "/catalog",
  "/about",
  "/contact",
  "/replacement-parts",
  "/shipping-returns",
  "/returns-policy",
  "/privacy-policy",
  "/terms-and-conditions",
  "/tables",
  "/tables/indoor-tables",
  "/tables/outdoor-tables",
  "/accessories",
  "/accessories/paddles",
  "/accessories/ping-pong-balls",
  "/accessories/covers",
  "/accessories/nets",
  "/resources"
];

const PUBLIC_PRODUCT_SLUGS = [
  "tiger-aqua-outdoor-indoor-paddle",
  "tiger-expo-outdoor-table",
  "tiger-net-post-set",
  "tiger-plaza-outdoor-table-grey",
  "tiger-portland-indoor-table",
  "tiger-portland-outdoor-table",
  "tiger-premium-balls-140",
  "tiger-premium-balls-6-orange",
  "tiger-premium-balls-6-white",
  "tiger-table-cover-black-polyester",
  "tiger-vice-paddle",
  "tiger-whistler-indoor-table"
];

function productSummary(slug: string): CatalogProductSummary {
  return {
    category: { key: "public", name: "Public", slug: "public" },
    currency: "CAD",
    family: { key: "public", name: "Public", slug: "public" },
    key: slug,
    name: slug,
    priceCents: 1,
    primaryMedia: null,
    productKind: "table",
    purchaseMode: "online_checkout",
    shippingReviewRequired: false,
    slug,
    v1CheckoutScope: true,
    v1PublicNavigation: true
  };
}

beforeEach(() => {
  getProductsMock.mockReset();
  getProductsMock.mockResolvedValue(PUBLIC_PRODUCT_SLUGS.map(productSummary));
});

describe("approved legacy redirect contract", () => {
  it("maps every approved legacy path directly to its absolute .ca destination", () => {
    expect(Object.fromEntries(LEGACY_PATH_REDIRECTS)).toEqual(EXPECTED_LEGACY_REDIRECTS);

    for (const [source, destination] of Object.entries(EXPECTED_LEGACY_REDIRECTS)) {
      expect(getLegacyPathRedirect(source)).toBe(destination);
      expect(getLegacyPathRedirect(`${source}/`)).toBe(destination);
      expect(toCanonicalRedirectUrl(destination).toString()).toBe(
        `${CANONICAL_SITE_ORIGIN}${destination}`
      );
    }
  });

  it("keeps the approved CSV map aligned with the executable map", () => {
    const csv = readFileSync(
      path.resolve("data/import-review/tigerpingpong/v1/redirects_launch_v1.csv"),
      "utf8"
    );
    const csvMap = new Map(
      csv
        .trim()
        .split("\n")
        .slice(1)
        .map((line) => {
          const match = line.match(/^"([^"]+)","([^"]+)"/);
          if (!match) throw new Error(`Invalid redirect CSV row: ${line}`);
          return [match[1], match[2]] as const;
        })
    );

    expect(Object.fromEntries(csvMap)).toEqual(EXPECTED_LEGACY_REDIRECTS);
    expect(csv).not.toContain('"draft"');
  });

  it("normalizes only the approved hosts and leaves the intentional 404 unmapped", () => {
    expect(isLegacyRedirectHost("tigerpingpong.com")).toBe(true);
    expect(isLegacyRedirectHost("www.tigerpingpong.com")).toBe(true);
    expect(isLegacyRedirectHost("www.tigerpingpong.ca")).toBe(true);
    expect(isLegacyRedirectHost("tigerpingpong.ca")).toBe(false);
    expect(getLegacyPathRedirect("/shop-all/-1")).toBeNull();
  });
});

describe("canonical sitemap contract", () => {
  it("emits the complete 34-URL launch inventory with loc values only", async () => {
    const entries = await getSitemapEntries();
    const paths = entries.map((entry) => entry.pathname);
    const expectedArticlePaths = RESOURCE_ARTICLES.map((article) => `/resources/${article.slug}`);
    const expectedProductPaths = PUBLIC_PRODUCT_SLUGS.map((slug) => `/catalog/products/${slug}`);

    expect(entries).toHaveLength(34);
    expect(new Set(paths).size).toBe(34);
    expect(paths).toEqual([
      ...EXPECTED_STATIC_SITEMAP_PATHS,
      ...expectedArticlePaths,
      ...expectedProductPaths.sort((left, right) => left.localeCompare(right))
    ]);
    expect(
      entries.every((entry) => entry.url === `${CANONICAL_SITE_ORIGIN}${entry.pathname}`)
    ).toBe(true);

    const xml = serializeSitemap(entries);
    expect(xml.match(/<loc>/g)).toHaveLength(34);
    expect(xml).not.toMatch(/<lastmod>|<changefreq>|<priority>/);
  });

  it("returns a retryable 503 instead of a partial sitemap when catalog loading fails", async () => {
    getProductsMock.mockRejectedValueOnce(new Error("private catalog failure"));

    const response = await getSitemapResponse();

    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("300");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("Sitemap temporarily unavailable.");
  });
});

describe("restored resource coverage", () => {
  it.each([
    ["choose-a-ping-pong-table", "2022-08-12"],
    ["room-size", "2022-05-06"],
    ["ping-pong-rules", "2022-05-06"]
  ])("preserves %s publication history and records the launch update", (slug, publishedDate) => {
    const article = getResourceArticle(slug);
    expect(article?.publishedDate).toBe(publishedDate);
    expect(article?.updatedDate).toBe("2026-07-20");
    expect(JSON.stringify(article)).not.toContain("cdn11.bigcommerce.com");
  });

  it("covers every required buyer-guide topic", () => {
    const article = JSON.stringify(getResourceArticle("choose-a-ping-pong-table")).toLowerCase();
    for (const topic of [
      "prices vary",
      "colour",
      "storage",
      "folding versus one-piece",
      "competition-table considerations",
      "final table-buying checklist"
    ]) {
      expect(article).toContain(topic);
    }
  });

  it("covers net dimensions, competition space, compact tables, lighting, and temperature", () => {
    const article = JSON.stringify(getResourceArticle("room-size")).toLowerCase();
    for (const topic of [
      "15.25 centimetres",
      "14 metres long by 7 metres wide by 5 metres high",
      "smaller table options",
      "bright, even light",
      "20 to 25 degrees celsius"
    ]) {
      expect(article).toContain(topic);
    }
  });

  it("covers the current official-rule topics and links the governing source", () => {
    const article = JSON.stringify(getResourceArticle("ping-pong-rules")).toLowerCase();
    for (const topic of [
      "2.7 grams",
      "at least 16 centimetres",
      "let",
      "legal return",
      "obstruction",
      "11 points",
      "free hand",
      "odd number of games",
      "previous receiver becomes the server",
      "common beginner questions",
      "2026_Statutes_v1_consolidated_clean.pdf".toLowerCase()
    ]) {
      expect(article).toContain(topic);
    }
  });
});
