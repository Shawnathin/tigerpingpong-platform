import { getProducts } from "./catalog-api";
import { RESOURCE_ARTICLES } from "./resource-articles";
import { getCanonicalUrl } from "./seo";
import type { CatalogProductSummary, CatalogSummary } from "../types/catalog";

export type SitemapChangeFrequency = "weekly" | "monthly";

export interface SitemapEntry {
  changeFrequency: SitemapChangeFrequency;
  lastModified: string;
  pathname: string;
  priority: number;
  url: string;
}

const STATIC_PUBLIC_ROUTES = [
  "/",
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

function hasReplacementPartsMarker(...values: Array<string | null | undefined>): boolean {
  return values.some((value) => {
    if (!value) {
      return false;
    }

    const normalized = value.toLowerCase().replace(/[_\s]+/g, "-");
    return normalized === "replacement-parts" || normalized.includes("replacement-part");
  });
}

function isReplacementPartsSummary(summary: CatalogSummary): boolean {
  return hasReplacementPartsMarker(summary.key, summary.slug, summary.name);
}

function isSitemapProduct(product: CatalogProductSummary): boolean {
  return (
    product.v1PublicNavigation &&
    !hasReplacementPartsMarker(product.productKind, product.key, product.slug, product.name) &&
    !isReplacementPartsSummary(product.category) &&
    !isReplacementPartsSummary(product.family)
  );
}

async function getProductRoutes(): Promise<string[]> {
  try {
    const products = await getProducts();
    return products
      .filter(isSitemapProduct)
      .map((product) => `/catalog/products/${product.slug}`)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

function toSitemapEntry(
  pathname: string,
  priority: number,
  changeFrequency: SitemapChangeFrequency,
  lastModified: string
): SitemapEntry {
  return {
    pathname,
    url: getCanonicalUrl(pathname),
    lastModified,
    changeFrequency,
    priority
  };
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const lastModified = new Date().toISOString();
  const articleRoutes = RESOURCE_ARTICLES.map((article) => `/resources/${article.slug}`);
  const productRoutes = await getProductRoutes();

  return [
    ...STATIC_PUBLIC_ROUTES.map((route) =>
      toSitemapEntry(route, route === "/" ? 1 : 0.8, "weekly", lastModified)
    ),
    ...articleRoutes.map((route) => toSitemapEntry(route, 0.7, "monthly", lastModified)),
    ...productRoutes.map((route) => toSitemapEntry(route, 0.8, "weekly", lastModified))
  ];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function serializeSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        `    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`,
        `    <changefreq>${entry.changeFrequency}</changefreq>`,
        `    <priority>${entry.priority.toFixed(1)}</priority>`,
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    ""
  ].join("\n");
}
