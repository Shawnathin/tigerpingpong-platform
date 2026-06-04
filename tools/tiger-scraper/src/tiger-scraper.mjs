import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const BASE_ORIGIN = "https://tigerpingpong.ca";
const BASE_HOST = "tigerpingpong.ca";
const DEFAULT_OUTPUT_DIR = "var/scrapes/tigerpingpong/latest";
const DEFAULT_DELAY_MS = 750;
const DEFAULT_LIMIT = 60;
const DEFAULT_MAX_DEPTH = 3;

const DEFAULT_SEEDS = [
  "/",
  "/sitemap.php",
  "/tables/",
  "/tables/indoor-tables/",
  "/tables/outdoor-tables/",
  "/accessories/",
  "/accessories/paddles/",
  "/accessories/ping-pong-balls/",
  "/accessories/covers/",
  "/accessories/nets/",
  "/resources/",
  "/shipping-returns",
  "/about",
  "/contact"
];

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "igshid",
  "ref",
  "ref_src"
]);

const EXCLUDED_PATH_PATTERNS = [
  /\/(account|admin|cart|checkout|compare|login|logout|search|wishlist)(\/|$)/i,
  /\/(cdn-cgi|wp-admin|wp-login|xmlrpc)(\/|$)/i,
  /\/api(\/|$)/i
];

const NON_HTML_EXTENSIONS = [
  ".avif",
  ".css",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".js",
  ".json",
  ".pdf",
  ".png",
  ".svg",
  ".webp",
  ".xml",
  ".zip"
];

const V1_PUBLIC_CATEGORIES = [
  "Tables",
  "Paddles",
  "Balls",
  "Nets",
  "Covers",
  "Accessories"
];

function parseArgs(argv) {
  const options = {
    delayMs: DEFAULT_DELAY_MS,
    full: false,
    limit: DEFAULT_LIMIT,
    maxDepth: DEFAULT_MAX_DEPTH,
    outputDir: DEFAULT_OUTPUT_DIR,
    seeds: []
  };

  for (const arg of argv) {
    if (arg === "--full") {
      options.full = true;
      options.limit = 200;
      options.maxDepth = 4;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("--delay-ms=")) {
      options.delayMs = Number(arg.slice("--delay-ms=".length));
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.slice("--limit=".length));
    } else if (arg.startsWith("--max-depth=")) {
      options.maxDepth = Number(arg.slice("--max-depth=".length));
    } else if (arg.startsWith("--output=")) {
      options.outputDir = arg.slice("--output=".length);
    } else if (arg.startsWith("--seed=")) {
      options.seeds.push(arg.slice("--seed=".length));
    }
  }

  options.seeds = options.seeds.length > 0 ? options.seeds : DEFAULT_SEEDS;
  options.delayMs = saneNumber(options.delayMs, DEFAULT_DELAY_MS);
  options.limit = saneNumber(options.limit, DEFAULT_LIMIT);
  options.maxDepth = saneNumber(options.maxDepth, DEFAULT_MAX_DEPTH);

  return options;
}

function saneNumber(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function printHelp() {
  console.log(`Tiger Ping Pong scraper

Usage:
  pnpm scrape:tiger
  pnpm scrape:tiger:test
  pnpm scrape:tiger -- --limit=40 --max-depth=3 --delay-ms=750

Options:
  --limit=N        Maximum fetched HTML pages. Default: ${DEFAULT_LIMIT}
  --max-depth=N    Crawl depth from seed URLs. Default: ${DEFAULT_MAX_DEPTH}
  --delay-ms=N     Delay between page fetches. Default: ${DEFAULT_DELAY_MS}
  --output=PATH    Output folder. Default: ${DEFAULT_OUTPUT_DIR}
  --seed=PATH      Add a seed URL or path. Can be repeated.
  --full           Use a larger, still bounded crawl profile.
`);
}

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#([0-9]+);/g, (_, num) =>
      String.fromCodePoint(Number.parseInt(num, 10))
    )
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeWhitespace(value) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function cleanExtractedText(value) {
  const text = normalizeWhitespace(value);
  if (!/%[0-9a-f]{2}/i.test(text)) {
    return text;
  }

  try {
    return normalizeWhitespace(decodeURIComponent(text));
  } catch {
    return text;
  }
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");
}

function stripTags(html) {
  return normalizeWhitespace(stripScriptsAndStyles(html).replace(/<[^>]+>/g, " "));
}

function normalizeUrl(rawValue, fromUrl = BASE_ORIGIN) {
  if (!rawValue) {
    return null;
  }

  const trimmed = decodeHtmlEntities(String(rawValue)).trim();
  if (
    trimmed.startsWith("#") ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed) ||
    /^javascript:/i.test(trimmed)
  ) {
    return null;
  }

  let url;
  try {
    url = new URL(trimmed, fromUrl);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== BASE_HOST) {
    return null;
  }

  url.protocol = "https:";
  url.hostname = BASE_HOST;
  url.hash = "";
  url.pathname = url.pathname.replace(/\/{2,}/g, "/");
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/g, "");
  }

  for (const param of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(param.toLowerCase()) || param.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(param);
    }
  }
  url.searchParams.sort();

  return url.toString();
}

function isExcludedUrl(urlValue) {
  const url = new URL(urlValue);
  const path = url.pathname.toLowerCase();

  if (EXCLUDED_PATH_PATTERNS.some((pattern) => pattern.test(path))) {
    return true;
  }

  return NON_HTML_EXTENSIONS.some((extension) => path.endsWith(extension));
}

function slugCandidate(value, fallbackUrl) {
  const text = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (text) {
    return text;
  }

  const url = new URL(fallbackUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  return segments.at(-1) ?? "home";
}

function fileExtensionFromUrl(urlValue) {
  const path = new URL(urlValue).pathname;
  const match = path.match(/\.([a-z0-9]{2,5})$/i);
  const extension = match?.[1]?.toLowerCase() ?? "jpg";
  return extension === "jpeg" ? "jpg" : extension;
}

function imageRoleForIndex(index) {
  return index === 0 ? "primary" : "gallery";
}

function cloudinaryFolderForProduct(product) {
  const category = product.categoryGuess || product.productTypeGuess || "uncategorized";
  return `tigerpingpong/products/${slugCandidate(category, product.sourceUrl)}`;
}

function cloudinaryPublicIdForImage(product, imageUrl, index) {
  const productSlug = product.slugCandidate || slugCandidate(product.productName, product.sourceUrl);
  const extension = fileExtensionFromUrl(imageUrl);
  const imageSlug = slugCandidate(new URL(imageUrl).pathname.split("/").pop() ?? `image-${index + 1}`, imageUrl)
    .replace(new RegExp(`-${extension}$`, "i"), "")
    .replace(new RegExp(`\\.${extension}$`, "i"), "");
  return `${cloudinaryFolderForProduct(product)}/${productSlug}-${String(index + 1).padStart(2, "0")}-${imageSlug}`;
}

function finalFilenameForImage(product, imageUrl, index) {
  const extension = fileExtensionFromUrl(imageUrl);
  const productSlug = product.slugCandidate || slugCandidate(product.productName, product.sourceUrl);
  return `${productSlug}-${String(index + 1).padStart(2, "0")}.${extension}`;
}

function extractAttribute(tag, attributeName) {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*["']([^"']+)["']`, "i");
  return decodeHtmlEntities(tag.match(pattern)?.[1] ?? "");
}

function extractMeta(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta\\b[^>]*(?:name|property)=["']${escapedName}["'][^>]*>`, "i"),
    new RegExp(`<meta\\b[^>]*content=["'][^"']*["'][^>]*(?:name|property)=["']${escapedName}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const tag = html.match(pattern)?.[0];
    if (tag) {
      return normalizeWhitespace(extractAttribute(tag, "content"));
    }
  }

  return "";
}

function extractFirstTagText(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return normalizeWhitespace(stripTags(html.match(pattern)?.[1] ?? ""));
}

function extractTitle(html) {
  return extractMeta(html, "og:title") || extractFirstTagText(html, "title");
}

function extractLinks(html, fromUrl) {
  const links = new Set();
  const linkPattern = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let match = linkPattern.exec(html);

  while (match) {
    const normalized = normalizeUrl(match[1], fromUrl);
    if (normalized) {
      links.add(normalized);
    }
    match = linkPattern.exec(html);
  }

  return [...links];
}

function extractImages(html, fromUrl) {
  const images = [];
  const seen = new Set();
  const imagePattern = /<img\b[^>]*>/gi;
  let match = imagePattern.exec(html);

  while (match) {
    const tag = match[0];
    const rawSrc =
      extractAttribute(tag, "src") ||
      extractAttribute(tag, "data-src") ||
      extractAttribute(tag, "data-original");
    const src = normalizeAssetUrl(rawSrc, fromUrl);

    if (src && !seen.has(src)) {
      seen.add(src);
      images.push({
        altText: normalizeWhitespace(extractAttribute(tag, "alt")),
        imageUrl: src
      });
    }

    match = imagePattern.exec(html);
  }

  const ogImage = normalizeAssetUrl(extractMeta(html, "og:image"), fromUrl);
  if (ogImage && !seen.has(ogImage)) {
    images.unshift({
      altText: "",
      imageUrl: ogImage
    });
  }

  return images.slice(0, 25);
}

function normalizeAssetUrl(rawValue, fromUrl) {
  if (!rawValue) {
    return "";
  }

  let url;
  try {
    url = new URL(decodeHtmlEntities(rawValue).trim(), fromUrl);
  } catch {
    return "";
  }

  url.hash = "";
  for (const param of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMS.has(param.toLowerCase()) || param.toLowerCase().startsWith("utm_")) {
      url.searchParams.delete(param);
    }
  }

  return url.toString();
}

function filterProductImages(images, productName) {
  const productWords = slugCandidate(productName, BASE_ORIGIN)
    .split("-")
    .filter((word) => word.length >= 4);

  const filtered = images.filter((image) => {
    const imageUrl = image.imageUrl.toLowerCase();
    const altText = image.altText.toLowerCase();

    if (/logo|icon|sprite|payment|visa|mastercard|paypal|search|loading/.test(imageUrl)) {
      return false;
    }
    if (/logo|icon|payment|search/.test(altText)) {
      return false;
    }
    if (/\/products?\//.test(imageUrl)) {
      return true;
    }
    return productWords.some((word) => imageUrl.includes(word) || altText.includes(word));
  });

  return filtered.length > 0 ? filtered : images;
}

function extractJsonLd(html) {
  const blocks = [];
  const pattern = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = pattern.exec(html);

  while (match) {
    try {
      blocks.push(JSON.parse(decodeHtmlEntities(match[1]).trim()));
    } catch {
      // Keep crawling when a page has invalid or escaped structured data.
    }
    match = pattern.exec(html);
  }

  return blocks.flatMap((block) => collectJsonLdNodes(block));
}

function collectJsonLdNodes(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectJsonLdNodes(item));
  }

  if (typeof value === "object") {
    const nodes = [value];
    if (Array.isArray(value["@graph"])) {
      nodes.push(...value["@graph"].flatMap((item) => collectJsonLdNodes(item)));
    }
    return nodes;
  }

  return [];
}

function schemaTypeIncludes(node, expectedType) {
  const type = node?.["@type"];
  if (Array.isArray(type)) {
    return type.some((item) => String(item).toLowerCase() === expectedType);
  }
  return String(type ?? "").toLowerCase() === expectedType;
}

function extractProductSchema(nodes) {
  return nodes.find((node) => schemaTypeIncludes(node, "product")) ?? {};
}

function extractBreadcrumbs(html, nodes) {
  const schemaBreadcrumbs = [];
  for (const node of nodes) {
    if (schemaTypeIncludes(node, "breadcrumblist") && Array.isArray(node.itemListElement)) {
      for (const item of node.itemListElement) {
        const name = item?.name || item?.item?.name || "";
        if (name) {
          schemaBreadcrumbs.push(normalizeWhitespace(name));
        }
      }
    }
  }

  if (schemaBreadcrumbs.length > 0) {
    return schemaBreadcrumbs;
  }

  const breadcrumbMatch = html.match(/<[^>]+class=["'][^"']*breadcrumb[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i);
  if (!breadcrumbMatch) {
    return [];
  }

  return stripTags(breadcrumbMatch[1])
    .split(/\s*[>/]\s*|\s{2,}/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);
}

function extractPrice(text, productSchema) {
  const offer = firstArrayValue(productSchema.offers);
  const schemaPrice = offer?.price || productSchema.price;
  const schemaCurrency = offer?.priceCurrency || productSchema.priceCurrency || "CAD";

  if (schemaPrice) {
    const priceText = `$${schemaPrice}`;
    return {
      priceCents: parsePriceCents(priceText),
      priceText,
      currency: schemaCurrency
    };
  }

  const priceMatch = text.match(/\$\s*[0-9][0-9,]*(?:\.[0-9]{2})?/);
  const priceText = normalizeWhitespace(priceMatch?.[0] ?? "");
  return {
    priceCents: parsePriceCents(priceText),
    priceText,
    currency: "CAD"
  };
}

function parsePriceCents(priceText) {
  if (!priceText) {
    return "";
  }

  const normalized = priceText.replace(/[^0-9.]/g, "");
  if (!normalized) {
    return "";
  }

  return Math.round(Number(normalized) * 100);
}

function firstArrayValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function extractSku(text, productSchema) {
  const schemaSku = productSchema.sku || firstArrayValue(productSchema.offers)?.sku;
  if (schemaSku) {
    return normalizeWhitespace(schemaSku);
  }

  const skuMatch = text.match(/\b(?:sku|item|model)\s*(?:#|number|no\.?|:)?\s*([a-z0-9._-]{3,})\b/i);
  const candidate = normalizeWhitespace(skuMatch?.[1] ?? "");
  return /^(has|upc|none|n\/a)$/i.test(candidate) ? "" : candidate;
}

function extractAvailability(text, productSchema) {
  const offer = firstArrayValue(productSchema.offers);
  const availability = offer?.availability || productSchema.availability || "";
  if (availability) {
    return normalizeWhitespace(String(availability).split("/").at(-1));
  }

  const match = text.match(/\b(in stock|out of stock|available|unavailable|sold out|backorder|pre-order)\b/i);
  return normalizeWhitespace(match?.[1] ?? "");
}

function extractBrand(productSchema, text) {
  const brand = productSchema.brand;
  if (typeof brand === "string") {
    return normalizeWhitespace(brand);
  }
  if (brand?.name) {
    return normalizeWhitespace(brand.name);
  }
  if (/\btiger\b/i.test(text)) {
    return "Tiger";
  }
  return "";
}

function extractOptionCandidates(html, sourceUrl, productName) {
  const options = [];
  const selectPattern = /<select\b[^>]*>([\s\S]*?)<\/select>/gi;
  let selectMatch = selectPattern.exec(html);

  while (selectMatch) {
    const selectTag = selectMatch[0].match(/<select\b[^>]*>/i)?.[0] ?? "";
    const optionName =
      extractAttribute(selectTag, "aria-label") ||
      extractAttribute(selectTag, "name") ||
      extractAttribute(selectTag, "id") ||
      "Option";
    const optionPattern = /<option\b[^>]*>([\s\S]*?)<\/option>/gi;
    let optionMatch = optionPattern.exec(selectMatch[1]);

    while (optionMatch) {
      const value = normalizeWhitespace(stripTags(optionMatch[1]));
      if (value && !/choose|select|please/i.test(value)) {
        options.push({
          sourceUrl,
          productName,
          optionName: normalizeWhitespace(optionName),
          optionValue: value,
          evidence: "select",
          confidence: "medium"
        });
      }
      optionMatch = optionPattern.exec(selectMatch[1]);
    }

    selectMatch = selectPattern.exec(html);
  }

  const labelPattern = /<label\b[^>]*>([\s\S]*?)<\/label>/gi;
  let labelMatch = labelPattern.exec(html);
  while (labelMatch) {
    const label = normalizeWhitespace(stripTags(labelMatch[1]));
    if (label && label.length <= 80 && /color|finish|size|style|option|surface|quantity/i.test(label)) {
      options.push({
        sourceUrl,
        productName,
        optionName: "Detected label",
        optionValue: label,
        evidence: "label",
        confidence: "low"
      });
    }
    labelMatch = labelPattern.exec(html);
  }

  return dedupeBy(
    options,
    (option) => `${option.sourceUrl}|${option.optionName}|${option.optionValue}`
  );
}

function classifyPage(page) {
  if (isExcludedUrl(page.url)) {
    return "ignored";
  }

  const url = new URL(page.url);
  const path = url.pathname.toLowerCase();
  const text = page.text.toLowerCase();

  if (isKnownCategoryPath(path)) {
    return "category";
  }

  if (["/about", "/contact", "/shipping-returns"].includes(path)) {
    return "static_page";
  }

  if (path.startsWith("/resources/")) {
    return "resource_article";
  }

  const hasProductSchema = page.jsonLdNodes.some((node) => schemaTypeIncludes(node, "product"));
  const hasAddToCart = /\b(add to cart|buy now)\b/i.test(page.text);
  const hasChooseOptions = /\bchoose options\b/i.test(page.text);
  const hasPrice = /\$\s*[0-9]/.test(page.text);
  const h1 = extractFirstTagText(page.html, "h1");
  const pathSegments = path.split("/").filter(Boolean);

  if (hasProductSchema || (h1 && hasPrice && (hasAddToCart || hasChooseOptions) && pathSegments.length >= 2)) {
    return "product";
  }

  if (
    path.startsWith("/tables") ||
    path.startsWith("/accessories") ||
    V1_PUBLIC_CATEGORIES.some((category) => text.includes(category.toLowerCase()))
  ) {
    return "category";
  }

  return "static_page";
}

function isKnownCategoryPath(path) {
  return new Set([
    "/",
    "/sitemap.php",
    "/tables",
    "/tables/indoor-tables",
    "/tables/outdoor-tables",
    "/accessories",
    "/accessories/paddles",
    "/accessories/ping-pong-balls",
    "/accessories/covers",
    "/accessories/nets",
    "/resources"
  ]).has(path);
}

function looksLikeProductPath(urlValue) {
  const path = new URL(urlValue).pathname.toLowerCase();
  if (isKnownCategoryPath(path)) {
    return false;
  }

  return path.startsWith("/tables/") || path.startsWith("/accessories/");
}

function guessProductType(urlValue, breadcrumbs, productName, text) {
  const url = new URL(urlValue);
  const path = url.pathname.toLowerCase();
  const directSignals = `${path} ${breadcrumbs.join(" ")} ${productName}`.toLowerCase();
  const joined = `${directSignals} ${text}`.toLowerCase();

  if (/replacement|replacement parts|\/parts(\/|$)|spare parts/.test(directSignals)) {
    return "replacement_part";
  }
  if (/paddles?|racquets?|rackets?/.test(joined)) {
    return "paddle";
  }
  if (/balls?/.test(joined)) {
    return "ball";
  }
  if (/nets?/.test(joined)) {
    return "net";
  }
  if (/covers?/.test(joined)) {
    return "cover";
  }
  if (/tables?|indoor|outdoor/.test(joined)) {
    return "table";
  }
  if (/accessories|accessory/.test(joined)) {
    return "accessory";
  }

  return "unknown";
}

function primaryCategoryGuess(productType, breadcrumbs) {
  const lookup = {
    accessory: "Accessories",
    ball: "Balls",
    cover: "Covers",
    net: "Nets",
    paddle: "Paddles",
    replacement_part: "Replacement Parts",
    table: "Tables",
    unknown: ""
  };

  const fromBreadcrumb = breadcrumbs.find((crumb) =>
    [...V1_PUBLIC_CATEGORIES, "Replacement Parts"].some(
      (category) => category.toLowerCase() === crumb.toLowerCase()
    )
  );

  return fromBreadcrumb || lookup[productType] || "";
}

function hasManualReviewText(text) {
  return /\b(call for price|request a quote|request quote|quote required|contact us for pricing|contact for pricing|discontinued|special order|unavailable|out of stock|outofstock|sold out)\b/i.test(
    text
  );
}

function guessPurchaseMode({ addToCartVisible, chooseOptionsVisible, priceCents, productType, sku, text }) {
  const notes = [];
  const manualReviewText = hasManualReviewText(text);

  if (productType === "replacement_part") {
    return {
      mode: "deferred_from_v1",
      notes: "Replacement Parts are preserved for future review and excluded from v1 public launch checkout."
    };
  }

  if (productType === "table") {
    notes.push("table_shipping_review_required");
    if (manualReviewText) {
      notes.push("manual review text detected");
    }
    if (!sku) {
      notes.push("missing sku");
    }
    if (!priceCents) {
      notes.push("missing price");
    }
    return {
      mode: notes.length > 1 ? "needs_manual_review" : "online_checkout_candidate",
      notes: notes.join("; ")
    };
  }

  if (["paddle", "ball", "net", "cover", "accessory"].includes(productType) && addToCartVisible) {
    return {
      mode: "online_checkout_candidate",
      notes: chooseOptionsVisible ? "Options detected; review variant mapping." : ""
    };
  }

  if (!priceCents || !sku || manualReviewText) {
    return {
      mode: "needs_manual_review",
      notes: "Missing SKU, missing price, or manual-review language detected."
    };
  }

  return {
    mode: addToCartVisible ? "online_checkout_candidate" : "needs_manual_review",
    notes: addToCartVisible ? "" : "No add-to-cart signal detected."
  };
}

function buildConfidenceNotes(product) {
  const notes = [];
  if (!product.sku) {
    notes.push("missing_sku");
  }
  if (!product.priceCents) {
    notes.push("missing_price");
  }
  if (product.images.length === 0) {
    notes.push("missing_images");
  }
  if (!product.description) {
    notes.push("missing_description");
  }
  if (product.optionCandidates.length > 0) {
    notes.push("option_candidates_detected");
  }
  if (product.productTypeGuess === "unknown") {
    notes.push("unknown_product_type");
  }
  return notes.join("; ");
}

function extractPageData(crawledPage) {
  const productSchema = extractProductSchema(crawledPage.jsonLdNodes);
  const title = extractTitle(crawledPage.html);
  const h1 = extractFirstTagText(crawledPage.html, "h1");
  const pageTitle = h1 || title || new URL(crawledPage.url).pathname;
  const metaDescription = extractMeta(crawledPage.html, "description") || extractMeta(crawledPage.html, "og:description");
  const breadcrumbs = extractBreadcrumbs(crawledPage.html, crawledPage.jsonLdNodes);
  const text = crawledPage.text;
  const lowerText = text.toLowerCase();
  const description =
    cleanExtractedText(productSchema.description) ||
    metaDescription ||
    text.slice(0, 500);
  const price = extractPrice(text, productSchema);
  const sku = extractSku(text, productSchema);
  const productTypeGuess = guessProductType(crawledPage.url, breadcrumbs, pageTitle, text);
  const addToCartVisible = /\b(add to cart|buy now)\b/i.test(text);
  const chooseOptionsVisible = /\bchoose options\b/i.test(text);
  const purchaseMode = guessPurchaseMode({
    addToCartVisible,
    chooseOptionsVisible,
    priceCents: price.priceCents,
    productType: productTypeGuess,
    sku,
    text
  });
  const shippingMatch = text.match(/\b(?:shipping|delivery|freight|curbside)[^.]{0,180}/i);
  const relatedUrls = extractLinks(crawledPage.html, crawledPage.url)
    .filter((link) => !isExcludedUrl(link))
    .slice(0, 30);
  const warrantyMatch = text.match(/\b(?:warranty|guarantee)[^.]{0,220}/i);
  const productName = normalizeWhitespace(productSchema.name) || pageTitle;
  const images = filterProductImages(extractImages(crawledPage.html, crawledPage.url), productName);

  const product = {
    addToCartVisible,
    availability: extractAvailability(text, productSchema),
    brand: extractBrand(productSchema, text),
    breadcrumb: breadcrumbs.join(" > "),
    categoryGuess: primaryCategoryGuess(productTypeGuess, breadcrumbs),
    chooseOptionsVisible,
    currency: price.currency,
    description,
    imageUrls: images.map((image) => image.imageUrl),
    images,
    legacyPath: new URL(crawledPage.url).pathname,
    optionCandidates: extractOptionCandidates(crawledPage.html, crawledPage.url, productName),
    parsedPriceCents: price.priceCents,
    priceCents: price.priceCents,
    productName,
    productTypeGuess,
    purchaseModeGuess: purchaseMode.mode,
    purchaseModeNotes: purchaseMode.notes,
    relatedUrls,
    shippingSummary: normalizeWhitespace(shippingMatch?.[0] ?? ""),
    sku,
    slugCandidate: slugCandidate(productName, crawledPage.url),
    sourceUrl: crawledPage.url,
    specsText: extractSpecsText(crawledPage.html),
    visiblePrice: price.priceText,
    warrantyText: normalizeWhitespace(warrantyMatch?.[0] ?? ""),
    confidenceNotes: ""
  };

  if (lowerText.includes("replacement") && productTypeGuess !== "replacement_part") {
    product.purchaseModeNotes = appendNote(product.purchaseModeNotes, "replacement keyword detected");
  }

  product.confidenceNotes = buildConfidenceNotes(product);
  return product;
}

function extractSpecsText(html) {
  const specSections = [];
  const tablePattern = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch = tablePattern.exec(html);
  while (tableMatch) {
    const text = stripTags(tableMatch[1]);
    if (/dimension|weight|size|surface|frame|spec|sku|model/i.test(text)) {
      specSections.push(text);
    }
    tableMatch = tablePattern.exec(html);
  }

  const listPattern = /<(?:ul|ol)\b[^>]*>([\s\S]*?)<\/(?:ul|ol)>/gi;
  let listMatch = listPattern.exec(html);
  while (listMatch) {
    const text = stripTags(listMatch[1]);
    if (/dimension|weight|size|surface|frame|spec|shipping|warranty|model/i.test(text)) {
      specSections.push(text);
    }
    listMatch = listPattern.exec(html);
  }

  return dedupeBy(specSections, (item) => item).slice(0, 8).join(" | ");
}

function appendNote(current, note) {
  return current ? `${current}; ${note}` : note;
}

function extractCategoryData(page) {
  const title = extractFirstTagText(page.html, "h1") || extractTitle(page.html);
  const productLinks = extractLinks(page.html, page.url).filter((link) => {
    const path = new URL(link).pathname;
    return /\/(tables|accessories)\//i.test(path) && path !== new URL(page.url).pathname;
  });

  return {
    categoryName: title || new URL(page.url).pathname,
    confidenceNotes: productLinks.length > 0 ? "" : "no_product_links_detected",
    description: extractMeta(page.html, "description"),
    legacyPath: new URL(page.url).pathname,
    parentGuess: guessParentCategory(page.url),
    productLinkCount: productLinks.length,
    slugCandidate: slugCandidate(title, page.url),
    sourceUrl: page.url
  };
}

function guessParentCategory(urlValue) {
  const path = new URL(urlValue).pathname.toLowerCase();
  if (path.startsWith("/tables/")) {
    return "Tables";
  }
  if (path.startsWith("/accessories/")) {
    return "Accessories";
  }
  return "";
}

function extractContentPageData(page) {
  const title = extractFirstTagText(page.html, "h1") || extractTitle(page.html);
  const text = page.text;

  return {
    contentExcerpt: text.slice(0, 500),
    legacyPath: new URL(page.url).pathname,
    metaDescription: extractMeta(page.html, "description"),
    pageTitle: title,
    slugCandidate: slugCandidate(title, page.url),
    sourceUrl: page.url
  };
}

function buildRedirectCandidate(page, title) {
  const legacyPath = new URL(page.url).pathname;
  const slug = slugCandidate(title || legacyPath, page.url);
  const candidates = {
    category: `/categories/${slug}`,
    product: `/products/${slug}`,
    resource_article: `/resources/${slug}`,
    static_page: legacyPath
  };

  return {
    legacyPath,
    newPathCandidate: candidates[page.classification] || "",
    notes: "Draft only. Confirm final frontend route shape before importing redirects.",
    pageType: page.classification,
    title
  };
}

function addProductFlags(product, flags) {
  const addFlag = (flag, severity, notes) => {
    flags.push({
      entityName: product.productName,
      entityType: "product",
      flag,
      notes,
      severity,
      sourceUrl: product.sourceUrl
    });
  };

  if (!product.sku) {
    addFlag("missing_sku", "medium", "Review whether the legacy page exposes a SKU or model number.");
  }
  if (!product.priceCents) {
    addFlag("missing_price", "high", "Required before online checkout candidate import.");
  }
  if (product.images.length === 0) {
    addFlag("missing_images", "medium", "Review media source before launch product page.");
  }
  if (product.productTypeGuess === "replacement_part") {
    addFlag("replacement_part_deferred", "info", "Preserve for future review, redirects, and v1.5/v2 planning.");
  }
  if (product.productTypeGuess === "table") {
    addFlag("table_shipping_review_required", "high", "Confirm freight, curbside, tax, region, and shipping policy before public checkout.");
  }
  if (product.purchaseModeGuess === "needs_manual_review") {
    addFlag("needs_manual_review", "high", product.purchaseModeNotes || "Purchase mode was not confidently inferred.");
  }
  if (product.optionCandidates.length > 0) {
    addFlag("option_candidates_detected", "medium", "Review option labels and variant mapping before import.");
  }
}

function addDuplicateFlags(products, flags) {
  const bySlug = new Map();
  for (const product of products) {
    const list = bySlug.get(product.slugCandidate) ?? [];
    list.push(product);
    bySlug.set(product.slugCandidate, list);
  }

  for (const [slug, duplicates] of bySlug) {
    if (duplicates.length > 1) {
      for (const product of duplicates) {
        flags.push({
          entityName: product.productName,
          entityType: "product",
          flag: "duplicate_slug_candidate",
          notes: `Slug ${slug} appears on ${duplicates.length} products.`,
          severity: "medium",
          sourceUrl: product.sourceUrl
        });
      }
    }
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows, columns) {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((column) => csvEscape(row[column])).join(","));
  return [header, ...body].join("\n") + "\n";
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TigerPingPongImportPrep/1.0 (+local development review)"
    },
    redirect: "follow"
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  return {
    body,
    contentType,
    finalUrl: normalizeUrl(response.url, url) ?? url,
    statusCode: response.status
  };
}

async function crawl(options) {
  const discovered = new Map();
  const queue = [];
  const pages = [];

  for (const seed of options.seeds) {
    const normalized = normalizeUrl(seed);
    if (normalized && !discovered.has(normalized)) {
      discovered.set(normalized, {
        classification: "",
        depth: 0,
        discoveredFrom: "seed",
        fetchStatus: "",
        ignoredReason: "",
        included: true,
        normalizedUrl: normalized
      });
      queue.push({ depth: 0, url: normalized });
    }
  }

  while (queue.length > 0 && pages.length < options.limit) {
    const next = queue.shift();
    const discoveredRecord = discovered.get(next.url);

    if (!discoveredRecord || discoveredRecord.fetchStatus) {
      continue;
    }

    if (isExcludedUrl(next.url)) {
      discoveredRecord.classification = "ignored";
      discoveredRecord.ignoredReason = "excluded_url";
      discoveredRecord.included = false;
      continue;
    }

    if (pages.length > 0 && options.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }

    try {
      const fetched = await fetchPage(next.url);
      discoveredRecord.fetchStatus = fetched.statusCode;
      discoveredRecord.contentType = fetched.contentType;

      if (!fetched.contentType.includes("html")) {
        discoveredRecord.classification = "ignored";
        discoveredRecord.ignoredReason = "non_html_response";
        discoveredRecord.included = false;
        continue;
      }

      const html = fetched.body;
      const text = stripTags(html);
      const jsonLdNodes = extractJsonLd(html);
      const page = {
        classification: "",
        depth: next.depth,
        html,
        jsonLdNodes,
        statusCode: fetched.statusCode,
        text,
        url: fetched.finalUrl
      };
      page.classification = classifyPage(page);
      discoveredRecord.classification = page.classification;
      pages.push(page);

      if (next.depth < options.maxDepth) {
        for (const link of extractLinks(html, page.url)) {
          const ignored = isExcludedUrl(link);
          if (!discovered.has(link)) {
            discovered.set(link, {
              classification: ignored ? "ignored" : "",
              depth: next.depth + 1,
              discoveredFrom: page.url,
              fetchStatus: "",
              ignoredReason: ignored ? "excluded_url" : "",
              included: !ignored,
              normalizedUrl: link
            });
            if (!ignored) {
              const nextQueueItem = { depth: next.depth + 1, url: link };
              if (looksLikeProductPath(link)) {
                queue.unshift(nextQueueItem);
              } else {
                queue.push(nextQueueItem);
              }
            }
          }
        }
      }
    } catch (error) {
      discoveredRecord.fetchStatus = "error";
      discoveredRecord.classification = "ignored";
      discoveredRecord.ignoredReason = error instanceof Error ? error.message : "fetch_error";
      discoveredRecord.included = false;
    }
  }

  return { discovered: [...discovered.values()], pages };
}

function buildOutputs(crawlResult, options, generatedAt) {
  const products = [];
  const categories = [];
  const staticPages = [];
  const resourceArticles = [];
  const redirectMap = [];
  const flags = [];

  for (const page of crawlResult.pages) {
    if (page.classification === "product") {
      const product = extractPageData(page);
      products.push(product);
      addProductFlags(product, flags);
      redirectMap.push(buildRedirectCandidate(page, product.productName));
    } else if (page.classification === "category") {
      const category = extractCategoryData(page);
      categories.push(category);
      redirectMap.push(buildRedirectCandidate(page, category.categoryName));
    } else if (page.classification === "resource_article") {
      const article = extractContentPageData(page);
      resourceArticles.push(article);
      redirectMap.push(buildRedirectCandidate(page, article.pageTitle));
    } else if (page.classification === "static_page") {
      const staticPage = extractContentPageData(page);
      staticPages.push(staticPage);
      redirectMap.push(buildRedirectCandidate(page, staticPage.pageTitle));
    }
  }

  addDuplicateFlags(products, flags);

  const productOptions = products.flatMap((product) => product.optionCandidates);
  const productImages = products.flatMap((product) =>
    product.images.map((image, index) => ({
      alt_text: image.altText,
      is_primary: index === 0,
      notes: "Original TigerPingPong.ca image URL only. Upload to Cloudinary in a later explicit media task.",
      product_name: product.productName,
      product_url: product.sourceUrl,
      role: imageRoleForIndex(index),
      sort_order: index + 1,
      source_url: image.imageUrl,
      source_image_url: image.imageUrl,
      suggested_cloudinary_folder: cloudinaryFolderForProduct(product),
      suggested_cloudinary_public_id: cloudinaryPublicIdForImage(product, image.imageUrl, index),
      suggested_final_filename: finalFilenameForImage(product, image.imageUrl, index)
    }))
  );

  return {
    categories,
    flags,
    productImages,
    productOptions,
    products,
    redirectMap,
    reportMarkdown: buildReport({
      categories,
      crawlResult,
      flags,
      generatedAt,
      options,
      products,
      resourceArticles,
      staticPages
    }),
    resourceArticles,
    staticPages,
    urlsDiscovered: crawlResult.discovered
  };
}

function buildReport({ categories, crawlResult, flags, generatedAt, options, products, resourceArticles, staticPages }) {
  const pagesByType = countBy(crawlResult.pages, (page) => page.classification);
  const purchaseModes = countBy(products, (product) => product.purchaseModeGuess);
  const productTypes = countBy(products, (product) => product.productTypeGuess);
  const highFlags = flags.filter((flag) => flag.severity === "high");

  return `# Tiger Ping Pong Scrape Run Report

Generated: ${generatedAt}
Source site: ${BASE_ORIGIN}
Output folder: ${options.outputDir}

## Scope

This local/dev-only run crawled public same-domain pages from approved seeds and
wrote review files for catalog import planning. It did not write to Supabase,
Prisma, migrations, API routes, frontend pages, checkout, Stripe, auth, or admin
code.

## Crawl Settings

- Limit: ${options.limit}
- Max depth: ${options.maxDepth}
- Delay between page fetches: ${options.delayMs}ms
- Full mode: ${options.full ? "yes" : "no"}
- Seeds:
${options.seeds.map((seed) => `  - ${seed}`).join("\n")}

## Results

- URLs discovered: ${crawlResult.discovered.length}
- HTML pages fetched: ${crawlResult.pages.length}
- Products extracted: ${products.length}
- Categories extracted: ${categories.length}
- Static pages extracted: ${staticPages.length}
- Resource articles extracted: ${resourceArticles.length}
- QA flags: ${flags.length}
- High severity flags: ${highFlags.length}

## Pages By Type

${formatCountMap(pagesByType)}

## Products By Type Guess

${formatCountMap(productTypes)}

## Purchase Mode Guesses

${formatCountMap(purchaseModes)}

## V1 Business Rules Applied

- Tables are treated as online checkout candidates by default.
- Every table product is flagged for freight, curbside, tax, regional, and
  shipping policy review before public checkout.
- Paddles, Balls, Nets, Covers, and Accessories are checkout candidates when an
  add-to-cart signal is visible.
- Replacement Parts are preserved but marked deferred from v1 public navigation
  and checkout scope.
- Missing SKU, missing price, options, manual-review language, and uncertain
  product type produce QA flags.

## Review Notes

- Treat all generated files as import prep, not approved product data.
- Review scrape_flags.csv before creating schema seeds or imports.
- Confirm final frontend route patterns before using redirect_map_draft.csv.
- Confirm table shipping, freight, curbside, tax, region, and shipping policy
  before exposing table checkout publicly.
`;
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item) || "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatCountMap(counts) {
  if (counts.size === 0) {
    return "- None";
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
}

async function writeOutputFile(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

async function writeOutputs(outputs, options, generatedAt) {
  const dir = options.outputDir.replace(/\/+$/g, "");

  await mkdir(dir, { recursive: true });
  await writeOutputFile(`${dir}/scrape_run_report.md`, outputs.reportMarkdown);
  await writeOutputFile(
    `${dir}/urls_discovered.csv`,
    toCsv(outputs.urlsDiscovered, [
      "normalizedUrl",
      "discoveredFrom",
      "depth",
      "included",
      "classification",
      "fetchStatus",
      "contentType",
      "ignoredReason"
    ])
  );
  await writeOutputFile(
    `${dir}/products_raw.json`,
    JSON.stringify(
      {
        generatedAt,
        sourceSite: BASE_ORIGIN,
        products: outputs.products
      },
      null,
      2
    )
  );
  await writeOutputFile(
    `${dir}/products_clean.csv`,
    toCsv(outputs.products, [
      "sourceUrl",
      "legacyPath",
      "slugCandidate",
      "productName",
      "categoryGuess",
      "productTypeGuess",
      "brand",
      "sku",
      "visiblePrice",
      "priceCents",
      "currency",
      "availability",
      "shippingSummary",
      "description",
      "specsText",
      "warrantyText",
      "addToCartVisible",
      "chooseOptionsVisible",
      "purchaseModeGuess",
      "purchaseModeNotes",
      "confidenceNotes"
    ])
  );
  await writeOutputFile(
    `${dir}/product_options.csv`,
    toCsv(outputs.productOptions, [
      "sourceUrl",
      "productName",
      "optionName",
      "optionValue",
      "evidence",
      "confidence"
    ])
  );
  await writeOutputFile(
    `${dir}/product_images_manifest.csv`,
    toCsv(outputs.productImages, [
      "product_url",
      "source_url",
      "source_image_url",
      "alt_text",
      "sort_order",
      "suggested_cloudinary_public_id",
      "suggested_cloudinary_folder",
      "suggested_final_filename",
      "role",
      "is_primary",
      "notes"
    ])
  );
  await writeOutputFile(
    `${dir}/categories.csv`,
    toCsv(outputs.categories, [
      "sourceUrl",
      "legacyPath",
      "slugCandidate",
      "categoryName",
      "parentGuess",
      "description",
      "productLinkCount",
      "confidenceNotes"
    ])
  );
  await writeOutputFile(
    `${dir}/pages_static.csv`,
    toCsv(outputs.staticPages, [
      "sourceUrl",
      "legacyPath",
      "slugCandidate",
      "pageTitle",
      "metaDescription",
      "contentExcerpt"
    ])
  );
  await writeOutputFile(
    `${dir}/resources_articles.csv`,
    toCsv(outputs.resourceArticles, [
      "sourceUrl",
      "legacyPath",
      "slugCandidate",
      "pageTitle",
      "metaDescription",
      "contentExcerpt"
    ])
  );
  await writeOutputFile(
    `${dir}/redirect_map_draft.csv`,
    toCsv(outputs.redirectMap, [
      "legacyPath",
      "newPathCandidate",
      "pageType",
      "title",
      "notes"
    ])
  );
  await writeOutputFile(
    `${dir}/scrape_flags.csv`,
    toCsv(outputs.flags, [
      "sourceUrl",
      "entityType",
      "entityName",
      "flag",
      "severity",
      "notes"
    ])
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const crawlResult = await crawl(options);
  const outputs = buildOutputs(crawlResult, options, generatedAt);
  await writeOutputs(outputs, options, generatedAt);

  console.log(`Tiger scrape finished.
Output folder: ${options.outputDir}
URLs discovered: ${outputs.urlsDiscovered.length}
Pages fetched: ${crawlResult.pages.length}
Products extracted: ${outputs.products.length}
QA flags: ${outputs.flags.length}`);
}

await main();
