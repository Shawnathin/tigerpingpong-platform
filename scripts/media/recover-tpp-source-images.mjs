import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";

const REQUESTED_SOURCE = "https://tigerpingpong.com";
const CANONICAL_SOURCE = "https://tigerpingpong.ca";
const SOURCE_HOSTS = new Set(["tigerpingpong.com", "www.tigerpingpong.com", "tigerpingpong.ca", "www.tigerpingpong.ca"]);
const OUTPUT_DIR = "exports/tpp-media-recovery-source";
const ORIGINALS_DIR = join(OUTPUT_DIR, "originals");
const BY_PRODUCT_DIR = join(OUTPUT_DIR, "by-product");
const REPORTS_DIR = join(OUTPUT_DIR, "reports");
const MANIFESTS_DIR = join(OUTPUT_DIR, "manifests");
const DELAY_MS = 450;
const MAX_PAGES = 90;
const MAX_DEPTH = 4;

const PRODUCT_KEYWORDS = [
  "expo",
  "portland",
  "whistler",
  "plaza",
  "vice",
  "aqua",
  "balls",
  "cover",
  "covers",
  "net",
  "nets",
  "replacement",
  "parts",
  "paddle",
  "table",
  "tables"
];

const SEEDS = [
  REQUESTED_SOURCE,
  `${CANONICAL_SOURCE}/`,
  `${CANONICAL_SOURCE}/tables/`,
  `${CANONICAL_SOURCE}/tables/indoor-tables/`,
  `${CANONICAL_SOURCE}/tables/outdoor-tables/`,
  `${CANONICAL_SOURCE}/accessories/`,
  `${CANONICAL_SOURCE}/accessories/paddles/`,
  `${CANONICAL_SOURCE}/accessories/ping-pong-balls/`,
  `${CANONICAL_SOURCE}/accessories/covers/`,
  `${CANONICAL_SOURCE}/accessories/nets/`,
  `${CANONICAL_SOURCE}/paddles/aqua-outdoor-indoor-paddle`,
  `${CANONICAL_SOURCE}/replacement-parts/`
];

const EXCLUDED_PAGE_PATTERNS = [
  /\/(account|cart|checkout|compare|login|logout|search|wishlist)(\/|$|\?)/i,
  /\/cart\.php/i,
  /\/cdn-cgi\//i
];

const EXCLUDED_IMAGE_PATTERNS = [
  /\/stencil\/[^/]+\/(icons|sprite)\//i,
  /logo|favicon|icon|sprite|payment|visa|mastercard|paypal|klarna|search|loading|spinner/i,
  /google|facebook|analytics|tracking/i
];

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const pageRecords = new Map();
const imageCandidateGroups = new Map();
const downloadRecords = [];
const duplicateGroups = [];
const fetchFailures = [];

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exitCode = 1;
});

async function main() {
  const runOptions = parseArgs(process.argv.slice(2));

  if (runOptions.help) {
    console.log(usage());
    return;
  }

  assertGeneratedOutputDir(OUTPUT_DIR);

  if (!runOptions.run) {
    printPlan();
    return;
  }

  if (existsSync(OUTPUT_DIR) && !runOptions.allowExisting) {
    throw new Error(
      `Output directory already exists: ${OUTPUT_DIR}. ` +
        "Rerun with --run --allow-existing after confirming it contains generated local output."
    );
  }

  await ensureDirs();

  const crawledPages = await crawlPages();
  collectImageCandidates(crawledPages);
  const selectedCandidates = selectBestCandidates();
  await downloadCandidates(selectedCandidates);
  await writeReports(crawledPages, selectedCandidates);

  const lowResolutionWarnings = downloadRecords.filter((record) => record.isLowResolutionWarning).length;
  const backgroundRemovalCandidates = downloadRecords.filter((record) => record.needsBackgroundRemovalCandidate).length;
  const fullResolutionProductImages = downloadRecords.filter(
    (record) =>
      ["primary", "gallery"].includes(record.imageRoleGuess) &&
      !record.isLikelyThumbnail &&
      record.width >= 800 &&
      record.height >= 800 &&
      Math.max(record.width, record.height) >= 1200
  ).length;

  console.log(
    JSON.stringify(
      {
        pagesCrawled: crawledPages.length,
        imagesFound: [...imageCandidateGroups.values()].reduce((sum, group) => sum + group.variants.length, 0),
        imagesDownloaded: downloadRecords.length,
        likelyFullResolutionProductImages: fullResolutionProductImages,
        lowResolutionWarnings,
        backgroundRemovalCandidates,
        manifest: join(MANIFESTS_DIR, "source-image-manifest.json")
      },
      null,
      2
    )
  );
}

function parseArgs(argv) {
  const parsed = {
    allowExisting: false,
    help: false,
    run: false
  };
  for (const arg of argv) {
    if (arg === "--run") {
      parsed.run = true;
    } else if (arg === "--allow-existing") {
      parsed.allowExisting = true;
    } else if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}\n\n${usage()}`);
    }
  }
  return parsed;
}

function usage() {
  return `Usage: node scripts/media/recover-tpp-source-images.mjs [--run] [--allow-existing]

Recover source media into ignored local exports.

Default mode is a dry run: no network calls and no file writes.

Options:
  --run             Crawl TigerPingPong pages, download source images, and write exports.
  --allow-existing  Allow writing into an existing generated output directory.
  -h, --help        Show this help text.

Output:
  ${OUTPUT_DIR}

This script does not call Cloudinary, read secrets, import data, or change app mappings.`;
}

function printPlan() {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        message: "No network calls or file writes were performed. Re-run with --run to crawl and download.",
        requestedSource: REQUESTED_SOURCE,
        canonicalSource: CANONICAL_SOURCE,
        outputDir: OUTPUT_DIR,
        maxPages: MAX_PAGES,
        maxDepth: MAX_DEPTH,
        willUpload: false,
        requiresSecrets: false
      },
      null,
      2
    )
  );
}

function assertGeneratedOutputDir(dir) {
  const exportsRoot = resolve("exports");
  const resolvedDir = resolve(dir);
  const relativePath = relative(exportsRoot, resolvedDir);
  if (!relativePath || relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Refusing output directory outside exports/: ${dir}`);
  }
}

async function ensureDirs() {
  await Promise.all([
    mkdir(ORIGINALS_DIR, { recursive: true }),
    mkdir(BY_PRODUCT_DIR, { recursive: true }),
    mkdir(REPORTS_DIR, { recursive: true }),
    mkdir(MANIFESTS_DIR, { recursive: true })
  ]);
}

async function crawlPages() {
  const queue = SEEDS.map((url) => ({ url, depth: 0 }));
  const seen = new Set();
  const crawled = [];

  while (queue.length > 0 && crawled.length < MAX_PAGES) {
    const next = queue.shift();
    const normalizedUrl = normalizePageUrl(next.url);
    if (!normalizedUrl || seen.has(normalizedUrl) || isExcludedPageUrl(normalizedUrl)) {
      continue;
    }

    seen.add(normalizedUrl);
    await delay(DELAY_MS);

    const page = await fetchHtml(normalizedUrl);
    if (!page) {
      continue;
    }

    const record = {
      requestedUrl: normalizedUrl,
      finalUrl: page.finalUrl,
      depth: next.depth,
      title: extractTitle(page.html),
      detectedProductName: detectProductName(page.html, page.finalUrl),
      detectedProductSlug: detectSlug(page.finalUrl),
      detectedCategory: detectCategory(page.html, page.finalUrl),
      html: page.html
    };
    pageRecords.set(page.finalUrl, record);
    crawled.push(record);

    if (next.depth >= MAX_DEPTH) {
      continue;
    }

    for (const link of extractLinks(page.html, page.finalUrl)) {
      if (!seen.has(link) && isRelevantPageUrl(link)) {
        queue.push({ url: link, depth: next.depth + 1 });
      }
    }
  }

  return crawled;
}

async function fetchHtml(url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36 TigerPingPongMediaRecovery/1.0"
      }
    });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.toLowerCase().includes("text/html")) {
      fetchFailures.push({ url, status: response.status, contentType });
      return null;
    }
    return { finalUrl: normalizePageUrl(response.url) ?? response.url, html: await response.text() };
  } catch (error) {
    fetchFailures.push({ url, error: error.message });
    return null;
  }
}

function collectImageCandidates(pages) {
  for (const page of pages) {
    const candidates = extractImageCandidates(page.html, page.finalUrl);
    for (const candidate of candidates) {
      if (!candidate.url || isExcludedImageUrl(candidate.url)) {
        continue;
      }

      const highUrl = preferOriginalImageUrl(candidate.url);
      const groupKey = canonicalImageKey(highUrl);
      const group =
        imageCandidateGroups.get(groupKey) ??
        {
          key: groupKey,
          bestUrl: highUrl,
          variants: [],
          pages: new Map()
        };

      group.variants.push({
        ...candidate,
        highUrl,
        sourcePageUrl: page.finalUrl,
        sourcePageTitle: page.title,
        detectedProductName: page.detectedProductName,
        detectedProductSlug: page.detectedProductSlug,
        detectedCategory: page.detectedCategory
      });
      group.pages.set(page.finalUrl, page);
      imageCandidateGroups.set(groupKey, group);
    }
  }
}

function selectBestCandidates() {
  const selected = [];
  for (const group of imageCandidateGroups.values()) {
    const variants = [...group.variants].sort((a, b) => {
      const scoreDiff = imageVariantScore(b) - imageVariantScore(a);
      return scoreDiff || b.url.length - a.url.length;
    });
    const best = variants[0];
    const bestUrl = preferOriginalImageUrl(best.highUrl || best.url);
    selected.push({ ...best, url: bestUrl, allVariants: variants });
  }
  return selected.sort((a, b) => {
    const pageCompare = a.sourcePageUrl.localeCompare(b.sourcePageUrl);
    return pageCompare || imageVariantScore(b) - imageVariantScore(a);
  });
}

async function downloadCandidates(candidates) {
  const contentHashToRecord = new Map();
  const indexesBySlugRole = new Map();

  for (const candidate of candidates) {
    await delay(DELAY_MS);
    const image = await fetchImage(candidate.url);
    if (!image) {
      continue;
    }

    const dimensions = getImageDimensions(image.buffer);
    const format = dimensions.format || formatFromContentType(image.contentType) || extensionFromUrl(candidate.url);
    const width = dimensions.width ?? null;
    const height = dimensions.height ?? null;
    const role = guessRole(candidate, width, height);
    const productSlug = candidate.detectedProductSlug || slugify(candidate.detectedProductName) || "unknown";
    const key = `${productSlug}:${role}`;
    const index = (indexesBySlugRole.get(key) ?? 0) + 1;
    indexesBySlugRole.set(key, index);

    const extension = normalizeExtension(format || extensionFromUrl(candidate.url));
    const filename = uniqueFilename(
      `tpp-source-${productSlug}-${role}-${String(index).padStart(2, "0")}-${width ?? "unknown"}x${height ?? "unknown"}.${extension}`
    );
    const localPath = join(ORIGINALS_DIR, filename);
    await writeFile(localPath, image.buffer, { flag: "wx" });
    const size = (await stat(localPath)).size;
    const sha256 = createHash("sha256").update(image.buffer).digest("hex");
    const existing = contentHashToRecord.get(sha256);

    const record = {
      sourcePageUrl: candidate.sourcePageUrl,
      sourcePageTitle: candidate.sourcePageTitle,
      detectedProductName: candidate.detectedProductName,
      detectedProductSlug: productSlug,
      detectedCategory: candidate.detectedCategory,
      originalImageUrl: candidate.url,
      downloadedFilename: filename,
      localPath,
      width,
      height,
      format: extension,
      fileSizeBytes: size,
      altTextFromSource: candidate.altText || "",
      imageRoleGuess: role,
      isLikelyThumbnail: isLikelyThumbnail(candidate.url, width, height),
      isLikelyProductOnWhiteBackground: guessWhiteBackgroundCandidate(candidate, role),
      needsBackgroundRemovalCandidate: false,
      notes: "",
      sha256
    };
    record.isLowResolutionWarning = lowResolutionWarning(record);
    record.needsBackgroundRemovalCandidate =
      record.isLikelyProductOnWhiteBackground && ["primary", "gallery"].includes(record.imageRoleGuess);

    if (existing) {
      record.notes = `Duplicate file hash of ${existing.downloadedFilename}. Kept for page/product traceability.`;
      duplicateGroups.push({
        kept: existing,
        skipped: record,
        reason: "identical file hash"
      });
    } else {
      contentHashToRecord.set(sha256, record);
    }

    const byProductDir = join(BY_PRODUCT_DIR, productSlug);
    await mkdir(byProductDir, { recursive: true });
    await copyFile(localPath, join(byProductDir, filename));

    downloadRecords.push(record);
  }
}

async function fetchImage(url) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36 TigerPingPongMediaRecovery/1.0"
      }
    });
    if (!response.ok) {
      fetchFailures.push({ url, status: response.status, contentType: response.headers.get("content-type") ?? "" });
      return null;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      fetchFailures.push({ url, status: response.status, contentType, error: "non-image response" });
      return null;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, contentType };
  } catch (error) {
    fetchFailures.push({ url, error: error.message });
    return null;
  }
}

async function writeReports(pages, selectedCandidates) {
  const manifestRecords = downloadRecords.map(toManifestRecord);
  await writeFile(join(MANIFESTS_DIR, "source-image-manifest.json"), `${JSON.stringify(manifestRecords, null, 2)}\n`);
  await writeFile(join(MANIFESTS_DIR, "source-image-manifest.csv"), toCsv(manifestRecords));
  await writeFile(join(REPORTS_DIR, "scrape-summary.md"), buildScrapeSummary(pages));
  await writeFile(join(REPORTS_DIR, "missing-or-low-res-report.md"), buildLowResReport(pages));
  await writeFile(join(REPORTS_DIR, "background-removal-candidates.md"), buildBackgroundReport());
  await writeFile(join(REPORTS_DIR, "duplicates-report.md"), buildDuplicatesReport(selectedCandidates));
}

function toManifestRecord(record) {
  const manifestRecord = { ...record };
  delete manifestRecord.sha256;
  delete manifestRecord.isLowResolutionWarning;
  return manifestRecord;
}

function buildScrapeSummary(pages) {
  const lines = [
    "# TigerPingPong Media Recovery Scrape Summary",
    "",
    `Source seed: ${REQUESTED_SOURCE}`,
    `Final crawled host: ${CANONICAL_SOURCE}`,
    `Pages crawled: ${pages.length}`,
    `Image URL candidates found: ${[...imageCandidateGroups.values()].reduce((sum, group) => sum + group.variants.length, 0)}`,
    `Images downloaded: ${downloadRecords.length}`,
    ""
  ];

  for (const page of pages) {
    const records = downloadRecords.filter((record) => record.sourcePageUrl === page.finalUrl);
    if (!isRelevantPageUrl(page.finalUrl) && records.length === 0) {
      continue;
    }
    const largest = records
      .filter((record) => record.width && record.height)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const primary = records.find((record) => record.imageRoleGuess === "primary") ?? records[0];
    const lowRes = records.filter((record) => record.isLowResolutionWarning);
    const bg = records.filter((record) => record.needsBackgroundRemovalCandidate);

    lines.push(`## ${page.detectedProductName || page.title || page.detectedProductSlug || page.finalUrl}`);
    lines.push("");
    lines.push(`Source page: ${page.finalUrl}`);
    lines.push(`Downloaded images: ${records.length}`);
    lines.push(
      `Largest image: ${largest ? `${largest.downloadedFilename} (${largest.width}x${largest.height})` : "None recovered"}`
    );
    lines.push(`Primary image candidate: ${primary ? primary.downloadedFilename : "None recovered"}`);
    lines.push(`Gallery image count: ${records.filter((record) => record.imageRoleGuess === "gallery").length}`);
    lines.push(`Low-resolution warnings: ${lowRes.length}`);
    lines.push(`Background-removal candidates: ${bg.length}`);
    lines.push(`Notes: ${records.length === 0 ? "No relevant images downloaded from this page." : "See manifest for image URLs and metadata."}`);
    lines.push("");
  }

  if (fetchFailures.length > 0) {
    lines.push("## Fetch Notes");
    lines.push("");
    for (const failure of fetchFailures.slice(0, 80)) {
      lines.push(`- ${failure.url}: ${failure.status ?? failure.error ?? "failed"} ${failure.contentType ?? ""}`.trim());
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildLowResReport(pages) {
  const lines = ["# Missing Or Low-Resolution Report", ""];
  const records = downloadRecords.filter((record) => record.isLowResolutionWarning);
  if (records.length === 0) {
    lines.push("No low-resolution warnings were detected among downloaded images.", "");
  } else {
    for (const record of records) {
      lines.push(
        `- ${record.downloadedFilename} (${record.width}x${record.height}) from ${record.sourcePageUrl} - ${lowResolutionReason(record)}`
      );
    }
    lines.push("");
  }

  const relevantPagesWithoutImages = pages.filter((page) => isRelevantPageUrl(page.finalUrl) && !downloadRecords.some((record) => record.sourcePageUrl === page.finalUrl));
  if (relevantPagesWithoutImages.length > 0) {
    lines.push("## Relevant Pages Without Downloaded Images", "");
    for (const page of relevantPagesWithoutImages) {
      lines.push(`- ${page.detectedProductName || page.title || page.finalUrl}: ${page.finalUrl}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function buildBackgroundReport() {
  const lines = ["# Background-Removal Candidates", ""];
  const records = downloadRecords.filter((record) => record.needsBackgroundRemovalCandidate);
  if (records.length === 0) {
    lines.push("No likely white-background product images were flagged.", "");
    return `${lines.join("\n")}\n`;
  }

  for (const record of records) {
    lines.push(`- ${record.downloadedFilename} (${record.width}x${record.height})`);
    lines.push(`  - Product/category: ${record.detectedProductName || record.detectedCategory || record.detectedProductSlug}`);
    lines.push(`  - Source: ${record.originalImageUrl}`);
  }
  lines.push("");
  lines.push("Note: this report is a heuristic inventory only. No backgrounds were removed.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildDuplicatesReport(selectedCandidates) {
  const lines = ["# Duplicates Report", ""];
  const variantGroups = selectedCandidates
    .map((candidate) => ({
      kept: candidate.url,
      skipped: candidate.allVariants.filter((variant) => variant.url !== candidate.url && variant.highUrl !== candidate.url)
    }))
    .filter((group) => group.skipped.length > 0);

  if (duplicateGroups.length === 0 && variantGroups.length === 0) {
    lines.push("No duplicate or resized image variants were detected.", "");
    return `${lines.join("\n")}\n`;
  }

  if (variantGroups.length > 0) {
    lines.push("## Resized URL Variants Skipped", "");
    for (const group of variantGroups) {
      lines.push(`- Kept image: ${group.kept}`);
      for (const skipped of group.skipped.slice(0, 12)) {
        lines.push(`  - Skipped variant: ${skipped.url} (${candidateSizeLabel(skipped)}) from ${skipped.sourcePageUrl}`);
      }
    }
    lines.push("");
  }

  if (duplicateGroups.length > 0) {
    lines.push("## Identical File Hashes", "");
    for (const group of duplicateGroups) {
      lines.push(`- Kept image: ${group.kept.downloadedFilename} (${group.kept.width}x${group.kept.height})`);
      lines.push(`  - Duplicate: ${group.skipped.downloadedFilename} (${group.skipped.width}x${group.skipped.height})`);
      lines.push(`  - Source URLs: ${group.kept.originalImageUrl} | ${group.skipped.originalImageUrl}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function extractImageCandidates(html, fromUrl) {
  const candidates = [];
  const seen = new Set();

  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const altText = normalizeWhitespace(extractAttribute(tag, "alt") || extractAttribute(tag, "title"));
    const fields = ["src", "data-src", "data-original", "data-lazy", "data-image-gallery-new-image-url", "data-image-gallery-zoom-image-url"];
    for (const field of fields) {
      addImageCandidate(candidates, seen, extractAttribute(tag, field), fromUrl, altText, "img");
    }
    for (const field of ["srcset", "data-srcset"]) {
      for (const item of parseSrcset(extractAttribute(tag, field))) {
        addImageCandidate(candidates, seen, item.url, fromUrl, altText, "srcset", item.descriptor);
      }
    }
  }

  for (const tag of html.match(/<source\b[^>]*>/gi) ?? []) {
    for (const item of parseSrcset(extractAttribute(tag, "srcset") || extractAttribute(tag, "data-srcset"))) {
      addImageCandidate(candidates, seen, item.url, fromUrl, "", "source-srcset", item.descriptor);
    }
  }

  for (const metaName of ["og:image", "og:image:secure_url", "twitter:image"]) {
    addImageCandidate(candidates, seen, extractMeta(html, metaName), fromUrl, "", "meta");
  }

  const backgroundPattern = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  for (const match of html.matchAll(backgroundPattern)) {
    addImageCandidate(candidates, seen, match[1], fromUrl, "", "background");
  }

  for (const node of extractJsonLd(html)) {
    if (schemaTypeIncludes(node, "product") || schemaTypeIncludes(node, "imageobject")) {
      const images = Array.isArray(node.image) ? node.image : [node.image, node.contentUrl, node.url];
      for (const image of images) {
        if (typeof image === "string") {
          addImageCandidate(candidates, seen, image, fromUrl, "", "json-ld");
        } else if (image && typeof image === "object") {
          addImageCandidate(candidates, seen, image.url || image.contentUrl, fromUrl, image.caption || "", "json-ld");
        }
      }
    }
  }

  return candidates;
}

function addImageCandidate(candidates, seen, rawUrl, fromUrl, altText, sourceKind, descriptor = "") {
  const url = normalizeAssetUrl(rawUrl, fromUrl);
  if (!url || seen.has(`${url}:${sourceKind}`)) {
    return;
  }
  if (!hasImageExtension(url)) {
    return;
  }
  seen.add(`${url}:${sourceKind}`);
  candidates.push({ url, altText, sourceKind, descriptor });
}

function extractLinks(html, fromUrl) {
  const links = new Set();
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const link = normalizePageUrl(extractAttribute(tag, "href"), fromUrl);
    if (link) {
      links.add(link);
    }
  }
  return [...links];
}

function extractJsonLd(html) {
  const blocks = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(decodeHtmlEntities(match[1]).trim()));
    } catch {
      // Some BigCommerce pages contain escaped or non-object JSON-LD. Ignore malformed blocks.
    }
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
    return [value, ...collectJsonLdNodes(value["@graph"])];
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

function normalizePageUrl(rawValue, fromUrl = CANONICAL_SOURCE) {
  if (!rawValue) {
    return "";
  }
  const value = decodeHtmlEntities(String(rawValue)).trim();
  if (!value || /^#|^mailto:|^tel:|^javascript:/i.test(value)) {
    return "";
  }
  let url;
  try {
    url = new URL(value, fromUrl);
  } catch {
    return "";
  }
  if (!SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
    return "";
  }
  url.protocol = "https:";
  url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (url.hostname === "tigerpingpong.com") {
    url.hostname = "tigerpingpong.ca";
  }
  url.hash = "";
  stripTrackingParams(url);
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/g, "");
  }
  return url.toString();
}

function normalizeAssetUrl(rawValue, fromUrl) {
  if (!rawValue) {
    return "";
  }
  const value = decodeHtmlEntities(String(rawValue)).trim();
  if (!value || value.startsWith("data:")) {
    return "";
  }
  try {
    const url = new URL(value, fromUrl);
    url.hash = "";
    stripTrackingParams(url);
    return url.toString();
  } catch {
    return "";
  }
}

function stripTrackingParams(url) {
  for (const key of [...url.searchParams.keys()]) {
    const lower = key.toLowerCase();
    if (lower.startsWith("utm_") || ["fbclid", "gclid", "mc_cid", "mc_eid", "ref"].includes(lower)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
}

function isExcludedPageUrl(urlValue) {
  return EXCLUDED_PAGE_PATTERNS.some((pattern) => pattern.test(urlValue));
}

function isRelevantPageUrl(urlValue) {
  const path = new URL(urlValue).pathname.toLowerCase();
  if (isExcludedPageUrl(urlValue)) {
    return false;
  }
  return (
    path === "/" ||
    /\/(tables|accessories|paddles|replacement-parts)(\/|$)/.test(path) ||
    PRODUCT_KEYWORDS.some((keyword) => path.includes(keyword))
  );
}

function isExcludedImageUrl(urlValue) {
  return EXCLUDED_IMAGE_PATTERNS.some((pattern) => pattern.test(urlValue));
}

function preferOriginalImageUrl(urlValue) {
  try {
    const url = new URL(urlValue);
    url.pathname = url.pathname.replace(/\/images\/stencil\/[^/]+\//, "/images/stencil/original/");
    return url.toString();
  } catch {
    return urlValue;
  }
}

function canonicalImageKey(urlValue) {
  try {
    const url = new URL(preferOriginalImageUrl(urlValue));
    url.search = "";
    return url.toString().toLowerCase();
  } catch {
    return urlValue.toLowerCase();
  }
}

function imageVariantScore(candidate) {
  const url = candidate.url || "";
  const descriptorScore = Number.parseInt(candidate.descriptor, 10) || 0;
  const originalScore = /\/stencil\/original\//i.test(url) ? 100000 : 0;
  const pathSizeMatch = url.match(/\/stencil\/(\d+)(?:x(\d+)|w)\//i);
  const pathScore = pathSizeMatch ? Number(pathSizeMatch[1]) * Number(pathSizeMatch[2] || pathSizeMatch[1]) : 0;
  const sourceScore = candidate.sourceKind === "json-ld" ? 5000 : candidate.sourceKind === "meta" ? 2500 : 0;
  return originalScore + Math.max(descriptorScore, pathScore) + sourceScore;
}

function candidateSizeLabel(candidate) {
  const pathSizeMatch = candidate.url.match(/\/stencil\/([^/]+)\//i);
  return candidate.descriptor || pathSizeMatch?.[1] || "unknown size";
}

function parseSrcset(value) {
  if (!value) {
    return [];
  }
  return decodeHtmlEntities(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [url, descriptor = ""] = part.split(/\s+/, 2);
      return { url, descriptor };
    });
}

function extractAttribute(tag, attributeName) {
  const pattern = new RegExp(`${attributeName}\\s*=\\s*["']([^"']*)["']`, "i");
  return decodeHtmlEntities(tag.match(pattern)?.[1] ?? "");
}

function extractMeta(html, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const property = extractAttribute(tag, "property") || extractAttribute(tag, "name");
    if (property.toLowerCase() === escapedName.toLowerCase()) {
      return extractAttribute(tag, "content");
    }
  }
  return "";
}

function extractTitle(html) {
  return normalizeWhitespace(extractMeta(html, "og:title") || html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
}

function detectProductName(html, pageUrl) {
  const productSchema = extractJsonLd(html).find((node) => schemaTypeIncludes(node, "product"));
  const schemaName = normalizeWhitespace(productSchema?.name || "");
  if (schemaName) {
    return schemaName;
  }
  const h1 = normalizeWhitespace(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ") || "");
  return h1 || titleToName(extractTitle(html)) || slugToTitle(detectSlug(pageUrl));
}

function detectCategory(html, pageUrl) {
  const path = new URL(pageUrl).pathname.toLowerCase();
  if (path.includes("indoor-tables")) return "Indoor tables";
  if (path.includes("outdoor-tables")) return "Outdoor tables";
  if (path.includes("tables")) return "Tables";
  if (path.includes("paddles")) return "Paddles";
  if (path.includes("ping-pong-balls")) return "Balls";
  if (path.includes("covers")) return "Covers";
  if (path.includes("nets")) return "Nets";
  if (path.includes("replacement-parts")) return "Replacement parts";
  if (path.includes("accessories")) return "Accessories";
  const title = extractTitle(html).toLowerCase();
  if (title.includes("table")) return "Tables";
  if (title.includes("paddle")) return "Paddles";
  if (title.includes("ball")) return "Balls";
  return "";
}

function detectSlug(pageUrl) {
  const segments = new URL(pageUrl).pathname.split("/").filter(Boolean);
  return slugify(segments.at(-1) || "home");
}

function guessRole(candidate, width, height) {
  if (candidate.sourceKind === "background") {
    return "hero";
  }
  const path = new URL(candidate.url).pathname.toLowerCase();
  if (path.includes("/image-manager/")) {
    return isProductPageUrl(candidate.sourcePageUrl) ? "gallery" : "category";
  }
  if (!isProductPageUrl(candidate.sourcePageUrl)) {
    return candidate.sourcePageUrl.endsWith("/tables") || candidate.sourcePageUrl.endsWith("/accessories") ? "category" : "thumbnail";
  }
  if (candidate.sourceKind === "meta" || candidate.sourceKind === "json-ld") {
    return "primary";
  }
  if (width && height && (width < 500 || height < 500)) {
    return "thumbnail";
  }
  return "gallery";
}

function isProductPageUrl(urlValue) {
  const path = new URL(urlValue).pathname.toLowerCase();
  const segments = path.split("/").filter(Boolean);
  return segments.length >= 2 && !["tables", "accessories", "paddles", "replacement-parts"].includes(segments.at(-1));
}

function guessWhiteBackgroundCandidate(candidate, role) {
  const text = `${candidate.url} ${candidate.altText || ""}`.toLowerCase();
  if (role === "hero" || role === "category" || /room|lifestyle|outdoor|patio|garage|family|background|image-manager/.test(text)) {
    return false;
  }
  return /product|asset|single|overhead|part|ball|paddle|net|cover|table|white|pack/.test(text);
}

function isLikelyThumbnail(urlValue, width, height) {
  if (/\/stencil\/(?:\d+w|(?:\d+x\d+))\//i.test(urlValue) && !/\/stencil\/original\//i.test(urlValue)) {
    return true;
  }
  return Boolean(width && height && (width < 500 || height < 500));
}

function lowResolutionWarning(record) {
  if (!record.width || !record.height) {
    return true;
  }
  if (record.width < 800 || record.height < 800 || record.isLikelyThumbnail) {
    return true;
  }
  return ["primary", "gallery"].includes(record.imageRoleGuess) && Math.max(record.width, record.height) < 1200;
}

function lowResolutionReason(record) {
  const reasons = [];
  if (!record.width || !record.height) reasons.push("dimensions missing");
  if (record.width < 800) reasons.push("width under 800px");
  if (record.height < 800) reasons.push("height under 800px");
  if (["primary", "gallery"].includes(record.imageRoleGuess) && Math.max(record.width ?? 0, record.height ?? 0) < 1200) {
    reasons.push("product image longest edge under 1200px");
  }
  if (record.isLikelyThumbnail) reasons.push("appears to be a thumbnail/cropped card image");
  return reasons.join("; ");
}

function getImageDimensions(buffer) {
  if (buffer.length < 12) {
    return {};
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { format: "png", width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        return { format: "jpg", height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
    return { format: "jpg" };
  }

  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    const chunk = buffer.subarray(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      return {
        format: "webp",
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3)
      };
    }
    if (chunk === "VP8 ") {
      return { format: "webp", width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return { format: "webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }

  if (buffer.subarray(0, 3).toString("ascii") === "GIF") {
    return { format: "gif", width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  return {};
}

function toCsv(records) {
  const headers = [
    "sourcePageUrl",
    "sourcePageTitle",
    "detectedProductName",
    "detectedProductSlug",
    "detectedCategory",
    "originalImageUrl",
    "downloadedFilename",
    "localPath",
    "width",
    "height",
    "format",
    "fileSizeBytes",
    "altTextFromSource",
    "imageRoleGuess",
    "isLikelyThumbnail",
    "isLikelyProductOnWhiteBackground",
    "needsBackgroundRemovalCandidate",
    "notes"
  ];
  const rows = [headers.join(",")];
  for (const record of records) {
    rows.push(headers.map((header) => csvCell(record[header])).join(","));
  }
  return `${rows.join("\n")}\n`;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function uniqueFilename(filename) {
  const extension = extname(filename);
  const base = basename(filename, extension);
  const existing = new Set(downloadRecords.map((record) => record.downloadedFilename));
  if (!existing.has(filename)) {
    return filename;
  }
  let index = 2;
  while (existing.has(`${base}-${index}${extension}`)) {
    index += 1;
  }
  return `${base}-${index}${extension}`;
}

function formatFromContentType(contentType) {
  const match = contentType.toLowerCase().match(/image\/([a-z0-9.+-]+)/);
  return match?.[1] || "";
}

function extensionFromUrl(urlValue) {
  try {
    const extension = extname(new URL(urlValue).pathname).replace(".", "").toLowerCase();
    return normalizeExtension(extension || "jpg");
  } catch {
    return "jpg";
  }
}

function hasImageExtension(urlValue) {
  try {
    const extension = extname(new URL(urlValue).pathname).replace(".", "").toLowerCase();
    return IMAGE_EXTENSIONS.has(normalizeExtension(extension));
  } catch {
    return false;
  }
}

function normalizeExtension(value) {
  const extension = String(value || "jpg").toLowerCase().replace(/^jpeg$/, "jpg");
  return extension === "x-png" ? "png" : extension;
}

function titleToName(value) {
  return normalizeWhitespace(value).replace(/\s*-\s*Tiger PingPong.*$/i, "");
}

function slugToTitle(value) {
  return normalizeWhitespace(String(value || "").replace(/-/g, " ")).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function decodeHtmlEntities(value) {
  return String(value ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, num) => String.fromCodePoint(Number.parseInt(num, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function normalizeWhitespace(value) {
  return decodeHtmlEntities(String(value ?? "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
