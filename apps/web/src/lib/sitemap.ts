import { getProducts } from "./catalog-api";
import { RESOURCE_ARTICLES } from "./resource-articles";
import { getCanonicalUrl } from "./seo";
import type { CatalogProductSummary, CatalogSummary } from "../types/catalog";

export interface SitemapEntry {
  pathname: string;
  url: string;
}

const STATIC_PUBLIC_ROUTES = [
  "/",
  "/catalog",
  "/about",
  "/contact",
  "/replacement-parts",
  "/shipping-returns",
  "/returns-policy",
  "/privacy-policy",
  "/paddlebuddy/privacy-policy",
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
  const products = await getProducts();

  return products
    .filter(isSitemapProduct)
    .map((product) => `/catalog/products/${product.slug}`)
    .sort((left, right) => left.localeCompare(right));
}

function toSitemapEntry(pathname: string): SitemapEntry {
  return {
    pathname,
    url: getCanonicalUrl(pathname)
  };
}

export async function getSitemapEntries(): Promise<SitemapEntry[]> {
  const articleRoutes = RESOURCE_ARTICLES.map((article) => `/resources/${article.slug}`);
  const productRoutes = await getProductRoutes();

  return [
    ...STATIC_PUBLIC_ROUTES.map(toSitemapEntry),
    ...articleRoutes.map(toSitemapEntry),
    ...productRoutes.map(toSitemapEntry)
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
      return ["  <url>", `    <loc>${escapeXml(entry.url)}</loc>`, "  </url>"].join("\n");
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
