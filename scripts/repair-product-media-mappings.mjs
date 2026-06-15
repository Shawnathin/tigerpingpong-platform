#!/usr/bin/env node

import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const CATALOG_DIR = path.join(REPO_ROOT, "data/import-review/tigerpingpong/v1");
const PRODUCTS_CSV = path.join(CATALOG_DIR, "products_import_v1.csv");
const MEDIA_CSV = path.join(CATALOG_DIR, "product_media_import_v1.csv");
const FALLBACK_MEDIA_TS = path.join(REPO_ROOT, "apps/web/src/lib/public-storefront-demo.ts");
const DEFAULT_MANIFEST = path.join(REPO_ROOT, "docs/media/043-cloudinary-upload-manifest-v1.json");
const REPORT_DIR = path.join(REPO_ROOT, "var/reports");
const CLOUDINARY_PRODUCT_PREFIX = "tigerpingpong/products";
const PRISMA_CLIENT_ENTRY = path.join(
  REPO_ROOT,
  "packages/db/node_modules/@prisma/client/default.js"
);
const PRISMA_GENERATE_COMMAND = "pnpm --filter @tigerpingpong/db prisma:generate";
const APPLY_FLAG = "--apply";
const HELP_FLAG = "--help";
const MANIFEST_FLAG = "--manifest";
const REPORT_FLAG = "--report";

const FAMILY_WORDS = [
  "expo",
  "portland",
  "whistler",
  "plaza",
  "vice",
  "viper",
  "aqua",
  "balls",
  "ball",
  "cover",
  "net",
  "paddle",
  "table"
];

const REVIEWED_DRIVE_PRODUCT_FOLDERS = [
  driveFolder("Tables", "117-Tiger PingPong Plaza Outdoor Ping Pong Table Grey"),
  driveFolder("Tables", "113-Tiger PingPong Expo Indoor Ping Pong Table Grey, Green or Blue"),
  driveFolder("Tables", "116-Tiger PingPong Whistler Indoor Ping Pong Table Green or Blue"),
  driveFolder("Tables", "112-Tiger PingPong Portland Outdoor Ping Pong Table Grey or Blue"),
  driveFolder("Tables", "114-Tiger PingPong Expo Outdoor Ping Pong Table Grey, Green or Blue"),
  driveFolder("Tables", "115-Tiger PingPong Portland Indoor Ping Pong Table Grey, Green or Blue"),
  driveFolder("Accessories", "122-Tiger PingPong Vice Ping Pong Paddle"),
  driveFolder("Accessories", "123-Tiger PingPong Viper Ping Pong Paddle"),
  driveFolder(
    "Accessories",
    "126-Tiger PingPong Premium 3-Star Ping Pong Balls 140 Balls White or Orange"
  ),
  driveFolder("Accessories", "125-Tiger PingPong Premium 3-Star Ping Pong Balls 6 Balls White"),
  driveFolder("Accessories", "135-Tiger PingPong Premium 3-Star Ping Pong Balls 6 Balls Orange"),
  driveFolder("Accessories", "140-Tiger PingPong Protective Ping Pong Table Cover Black Polyester"),
  driveFolder("Accessories", "128-Table Tennis Net & Post Set"),
  driveFolder("Accessories", "136-Tiger PingPong Table Net Replacement Set"),
  driveFolder("Accessories", "129-Replacement Net"),
  driveFolder("Accessories", "141-Aqua Outdoor Indoor Paddle"),
  driveFolder("Replacement Parts", "137-Tiger PingPong Replacement Part #40")
];

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.errors.length > 0) {
    for (const error of args.errors) {
      console.error(`Error: ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  const context = await loadContext(args);
  const report = buildReport(context, args);

  if (args.apply) {
    await applyHighConfidenceMappings(report);
  }

  await writeReport(report, report.reportPath);
  printSummary(report);

  if (args.apply && !report.applyResult?.applied) {
    process.exitCode = 1;
  }
}

function parseArgs(argv) {
  const parsed = {
    apply: false,
    errors: [],
    help: false,
    manifestPath: DEFAULT_MANIFEST,
    reportPath: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === HELP_FLAG) {
      parsed.help = true;
      continue;
    }

    if (arg === APPLY_FLAG) {
      parsed.apply = true;
      continue;
    }

    if (arg === MANIFEST_FLAG || arg === REPORT_FLAG) {
      const value = argv[index + 1];

      if (!value) {
        parsed.errors.push(`${arg} requires a path.`);
      } else if (arg === MANIFEST_FLAG) {
        parsed.manifestPath = path.resolve(REPO_ROOT, value);
      } else {
        parsed.reportPath = path.resolve(REPO_ROOT, value);
      }

      index += 1;
      continue;
    }

    if (arg.startsWith(`${MANIFEST_FLAG}=`)) {
      parsed.manifestPath = path.resolve(REPO_ROOT, arg.slice(MANIFEST_FLAG.length + 1));
      continue;
    }

    if (arg.startsWith(`${REPORT_FLAG}=`)) {
      parsed.reportPath = path.resolve(REPO_ROOT, arg.slice(REPORT_FLAG.length + 1));
      continue;
    }

    parsed.errors.push(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong product media mapping repair

Dry run, default:
  node scripts/repair-product-media-mappings.mjs

Apply high-confidence database changes:
  pnpm --filter @tigerpingpong/db prisma:generate
  DATABASE_URL='<postgres connection string>' node scripts/repair-product-media-mappings.mjs --apply

Options:
  --apply             Write only high-confidence Cloudinary mappings to ProductMedia.
  --manifest <path>   Use a custom Cloudinary upload manifest.
  --report <path>     Write the report to a custom JSON path.

Safety:
  - Dry run is the default and writes only var/reports/*.json.
  - Apply mode requires --apply and DATABASE_URL.
  - Cloudinary public IDs from the reviewed manifest are preferred over fallback images.
  - Existing rows are updated or created; Cloudinary assets are never deleted.
  - Suspicious or lower-confidence mappings are report-only.
`);
}

async function loadContext(args) {
  const [productsCsv, mediaCsv, manifestRaw, fallbackSource] = await Promise.all([
    fsp.readFile(PRODUCTS_CSV, "utf8"),
    fsp.readFile(MEDIA_CSV, "utf8"),
    fsp.readFile(args.manifestPath, "utf8"),
    fsp.readFile(FALLBACK_MEDIA_TS, "utf8")
  ]);
  const products = parseCsv(productsCsv);
  const mediaRows = parseCsv(mediaCsv);
  const manifest = JSON.parse(manifestRaw);
  const fallbackMediaBySlug = parseFallbackMedia(fallbackSource);
  const dbMediaRows = await readDatabaseMediaRows(args.apply);

  return {
    dbMediaRows,
    fallbackMediaBySlug,
    manifest,
    mediaRows,
    products,
    productsByKey: new Map(products.map((product) => [product.product_key, product])),
    productsBySlug: new Map(products.map((product) => [product.slug, product]))
  };
}

async function readDatabaseMediaRows(isApply) {
  if (!process.env.DATABASE_URL) {
    return {
      available: false,
      error: isApply ? "DATABASE_URL is required for --apply." : null,
      rows: []
    };
  }

  let prisma = null;

  try {
    const { PrismaClient } = await loadPrismaClient();
    prisma = new PrismaClient();
    const rows = await prisma.productMedia.findMany({
      orderBy: [{ product: { slug: "asc" } }, { isPrimary: "desc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        mediaKey: true,
        productId: true,
        variantId: true,
        role: true,
        cloudinaryPublicId: true,
        cloudinarySecureUrl: true,
        cloudinaryResourceType: true,
        cloudinaryFormat: true,
        cloudinaryVersion: true,
        width: true,
        height: true,
        sourceUrl: true,
        sourceProvider: true,
        altText: true,
        title: true,
        caption: true,
        sortOrder: true,
        isPrimary: true,
        isPublic: true,
        isActive: true,
        reviewStatus: true,
        notes: true,
        updatedAt: true,
        product: {
          select: {
            key: true,
            name: true,
            slug: true,
            productKind: true,
            status: true
          }
        }
      }
    });

    return {
      available: true,
      error: null,
      rows: rows.map(serializeDbMediaRow)
    };
  } catch (error) {
    return {
      available: false,
      error: `Unable to read database media rows: ${error.message}`,
      rows: []
    };
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

async function loadPrismaClient() {
  try {
    await fsp.access(PRISMA_CLIENT_ENTRY);
  } catch {
    throw new Error(
      `Prisma client is not available at ${relativePath(PRISMA_CLIENT_ENTRY)}. Run ${PRISMA_GENERATE_COMMAND} first.`
    );
  }

  try {
    const prismaClientModule = await import(pathToFileURL(PRISMA_CLIENT_ENTRY).href);

    if (typeof prismaClientModule.PrismaClient === "function") {
      return {
        PrismaClient: prismaClientModule.PrismaClient
      };
    }
  } catch (error) {
    throw new Error(
      `Unable to load generated Prisma client from ${relativePath(
        PRISMA_CLIENT_ENTRY
      )}: ${error.message}. Run ${PRISMA_GENERATE_COMMAND} first.`
    );
  }

  throw new Error(
    `Generated Prisma client at ${relativePath(
      PRISMA_CLIENT_ENTRY
    )} did not export PrismaClient. Run ${PRISMA_GENERATE_COMMAND} first.`
  );
}

function buildReport(context, args) {
  const generatedAt = new Date();
  const manifestAssets = getManifestAssets(context.manifest);
  const scannedProducts = context.products.map((product) => scanProduct(product, context));
  const scannedMediaAssets = manifestAssets.map((asset) => scanManifestAsset(asset));
  const currentMediaRows = getCurrentMediaRows(context);
  const proposedMappings = buildProposedMappings(context, manifestAssets, currentMediaRows);
  const suspiciousConflicts = proposedMappings.flatMap((mapping) => mapping.suspiciousConflicts);
  const unmatchedProducts = scannedProducts.filter(
    (product) => !product.hasProposedCloudinaryPrimary
  );
  const matchedAssetIds = new Set(
    proposedMappings.flatMap((mapping) => mapping.gallery.map((asset) => asset.cloudinaryPublicId))
  );
  const unmatchedImages = scannedMediaAssets.filter(
    (asset) => !matchedAssetIds.has(asset.cloudinaryPublicId)
  );
  const recommendedManualReviewList = buildManualReviewList({
    proposedMappings,
    suspiciousConflicts,
    unmatchedImages,
    unmatchedProducts
  });
  const reportPath = args.reportPath ?? defaultReportPath(generatedAt);

  return {
    schemaVersion: 1,
    generatedAt: generatedAt.toISOString(),
    mode: args.apply ? "apply" : "dry-run",
    safety: {
      dryRunDefault: !args.apply,
      applied: false,
      databaseWritesRequireApplyFlag: true,
      cloudinaryAssetsDeleted: false,
      migrationsRun: false
    },
    sources: {
      cloudinaryManifest: relativePath(args.manifestPath),
      productsCsv: relativePath(PRODUCTS_CSV),
      productMediaCsv: relativePath(MEDIA_CSV),
      fallbackMediaSource: relativePath(FALLBACK_MEDIA_TS),
      reviewedDriveFolderTitles: REVIEWED_DRIVE_PRODUCT_FOLDERS
    },
    database: {
      attemptedRead: Boolean(process.env.DATABASE_URL),
      available: context.dbMediaRows.available,
      error: context.dbMediaRows.error,
      currentRowsSource: context.dbMediaRows.available ? "database" : "csv"
    },
    summary: {
      scannedProducts: scannedProducts.length,
      scannedMediaAssets: scannedMediaAssets.length,
      currentMediaRows: currentMediaRows.length,
      proposedMappings: proposedMappings.length,
      highConfidenceMappings: proposedMappings.filter(
        (mapping) => mapping.confidenceLevel === "high"
      ).length,
      suspiciousConflicts: suspiciousConflicts.length,
      unmatchedProducts: unmatchedProducts.length,
      unmatchedImages: unmatchedImages.length,
      recommendedManualReviews: recommendedManualReviewList.length,
      reportPath: relativePath(reportPath)
    },
    scannedProducts,
    scannedMediaAssets,
    currentMediaRows,
    proposedMappings,
    suspiciousConflicts,
    unmatchedProducts,
    unmatchedImages,
    recommendedManualReviewList,
    applyResult: null,
    reportPath
  };
}

function scanProduct(product, context) {
  const fallbackMedia = context.fallbackMediaBySlug.get(product.slug) ?? [];
  const fallbackConflict = getFallbackConflict(product, fallbackMedia);
  const publicIds = context.mediaRows
    .filter((row) => row.product_key === product.product_key && row.cloudinary_public_id)
    .map((row) => row.cloudinary_public_id);
  const hasManifestPrimary = getManifestAssets(context.manifest).some(
    (asset) =>
      asset.productSlug === product.slug &&
      asset.isPrimary &&
      asset.cloudinaryPublicId === `${CLOUDINARY_PRODUCT_PREFIX}/${product.slug}/01-main`
  );

  return {
    productKey: product.product_key,
    slug: product.slug,
    title: product.name,
    legacyProductId: getLegacyProductIdForProduct(context, product),
    categoryKey: product.primary_category_key,
    productKind: product.product_kind,
    status: product.status,
    v1PublicNavigation: product.v1_public_navigation === "true",
    v1CheckoutScope: product.v1_checkout_scope === "true",
    purchaseMode: product.purchase_mode,
    currentFallbackImage: fallbackMedia[0] ?? null,
    fallbackConflict,
    csvCloudinaryPublicIds: publicIds,
    hasProposedCloudinaryPrimary: hasManifestPrimary
  };
}

function scanManifestAsset(asset) {
  return {
    productKey: asset.productKey,
    productSlug: asset.productSlug,
    productName: asset.productName,
    legacyProductId: asset.legacyProductId,
    localFilePath: asset.localFilePath,
    originalFileName: asset.originalFileName,
    cloudinaryPublicId: asset.cloudinaryPublicId,
    cloudinarySecureUrl: asset.cloudinarySecureUrl,
    hasBlankSecureUrl: Boolean(asset.cloudinaryPublicId && !asset.cloudinarySecureUrl),
    isPrimary: asset.isPrimary,
    role: asset.imageRole,
    order: asset.imageOrder,
    width: asset.width ?? null,
    height: asset.height ?? null,
    format: asset.cloudinaryFormat ?? null
  };
}

function getCurrentMediaRows(context) {
  if (context.dbMediaRows.available) {
    return context.dbMediaRows.rows;
  }

  return context.mediaRows.map((row) => ({
    source: "csv",
    id: null,
    mediaKey: row.media_key,
    productKey: row.product_key,
    productSlug: context.productsByKey.get(row.product_key)?.slug ?? null,
    role: row.role,
    cloudinaryPublicId: blankToNull(row.cloudinary_public_id),
    cloudinarySecureUrl: blankToNull(row.cloudinary_secure_url),
    sourceUrl: blankToNull(row.source_url),
    altText: blankToNull(row.alt_text),
    title: blankToNull(row.title),
    sortOrder: numberOrNull(row.sort_order),
    isPrimary: row.is_primary === "true",
    isPublic: Boolean(row.cloudinary_secure_url),
    reviewStatus: row.cloudinary_secure_url ? "approved" : "needs_review"
  }));
}

function buildProposedMappings(context, manifestAssets, currentMediaRows) {
  const assetsBySlug = groupBy(manifestAssets, (asset) => asset.productSlug);
  const currentByPublicId = new Map(
    currentMediaRows
      .filter((row) => row.cloudinaryPublicId)
      .map((row) => [row.cloudinaryPublicId, row])
  );
  const currentByMediaKey = new Map(currentMediaRows.map((row) => [row.mediaKey, row]));

  return context.products.map((product) => {
    const assets = (assetsBySlug.get(product.slug) ?? []).sort(compareManifestAssets);
    const primary = assets.find((asset) => asset.isPrimary) ?? null;
    const fallbackMedia = context.fallbackMediaBySlug.get(product.slug) ?? [];
    const driveFolder = findBestDriveFolder(context, product);
    const reasons = getMatchReasons(product, driveFolder, assets);
    const suspiciousConflicts = [];
    const fallbackConflict = getFallbackConflict(product, fallbackMedia);

    if (fallbackConflict) {
      suspiciousConflicts.push({
        type: "wrong_family_fallback",
        productSlug: product.slug,
        message: fallbackConflict,
        currentFallbackImage: fallbackMedia[0] ?? null
      });
    }

    for (const asset of assets) {
      const conflictingRow = currentByPublicId.get(asset.cloudinaryPublicId);

      if (conflictingRow && conflictingRow.productSlug !== product.slug) {
        suspiciousConflicts.push({
          type: "cloudinary_public_id_assigned_to_other_product",
          productSlug: product.slug,
          cloudinaryPublicId: asset.cloudinaryPublicId,
          currentProductSlug: conflictingRow.productSlug,
          currentMediaKey: conflictingRow.mediaKey
        });
      }

      if (asset.cloudinaryPublicId && !asset.cloudinarySecureUrl) {
        suspiciousConflicts.push({
          type: "blank_cloudinary_secure_url",
          productSlug: product.slug,
          cloudinaryPublicId: asset.cloudinaryPublicId,
          message: "Cloudinary public ID exists but secure URL is blank."
        });
      }
    }

    if (!primary) {
      suspiciousConflicts.push({
        type: "no_usable_primary_image",
        productSlug: product.slug,
        message: "No primary asset was found in the Cloudinary manifest."
      });
    }

    const gallery = assets.map((asset, index) => {
      const role = index === 0 ? "primary" : "gallery";
      const mediaKey = createMediaKey(product.slug, role, index + 1);
      const currentRow =
        currentByMediaKey.get(mediaKey) ?? currentByPublicId.get(asset.cloudinaryPublicId);

      return {
        mediaKey,
        role,
        sortOrder: index + 1,
        isPrimary: index === 0,
        cloudinaryPublicId: asset.cloudinaryPublicId,
        cloudinarySecureUrl: asset.cloudinarySecureUrl,
        cloudinaryResourceType: asset.cloudinaryResourceType ?? "image",
        cloudinaryFormat: asset.cloudinaryFormat ?? null,
        cloudinaryVersion: asset.cloudinaryVersion ? String(asset.cloudinaryVersion) : null,
        width: asset.width ?? null,
        height: asset.height ?? null,
        sourceUrl: findCsvSourceUrl(context.mediaRows, product.product_key, asset),
        altText: asset.altText ?? product.name,
        title: asset.title ?? (index === 0 ? product.name : `${product.name} image ${index + 1}`),
        currentRow: currentRow ?? null
      };
    });
    const confidenceLevel = getConfidenceLevel({
      assets,
      driveFolder,
      product,
      suspiciousConflicts
    });

    return {
      productKey: product.product_key,
      productSlug: product.slug,
      productTitle: product.name,
      legacyProductId: getLegacyProductIdForProduct(context, product),
      categoryKey: product.primary_category_key,
      productKind: product.product_kind,
      confidenceLevel,
      reasons,
      currentFallbackImage: fallbackMedia[0] ?? null,
      driveFolder,
      proposedPrimary: primary
        ? {
            cloudinaryPublicId: primary.cloudinaryPublicId,
            cloudinarySecureUrl: primary.cloudinarySecureUrl,
            mediaKey: createMediaKey(product.slug, "primary", 1)
          }
        : null,
      gallery,
      suspiciousConflicts
    };
  });
}

function getConfidenceLevel({ assets, driveFolder, product, suspiciousConflicts }) {
  const hasBlockingConflict = suspiciousConflicts.some((conflict) =>
    [
      "cloudinary_public_id_assigned_to_other_product",
      "no_usable_primary_image",
      "blank_cloudinary_secure_url"
    ].includes(conflict.type)
  );

  if (hasBlockingConflict || assets.length === 0) {
    return "review";
  }

  const primary = assets.find((asset) => asset.isPrimary);
  const publicIdMatchesSlug =
    primary?.cloudinaryPublicId === `${CLOUDINARY_PRODUCT_PREFIX}/${product.slug}/01-main`;
  const driveTitleMatches = driveFolder
    ? tokenOverlap(product.name, driveFolder.title) >= 1
    : false;

  if (publicIdMatchesSlug && (driveTitleMatches || product.product_kind === "replacement_part")) {
    return "high";
  }

  if (publicIdMatchesSlug) {
    return "medium";
  }

  return "review";
}

function getMatchReasons(product, driveFolder, assets) {
  const reasons = [];
  const primary = assets.find((asset) => asset.isPrimary);

  if (primary?.cloudinaryPublicId === `${CLOUDINARY_PRODUCT_PREFIX}/${product.slug}/01-main`) {
    reasons.push("Cloudinary public ID matches the product slug and 01-main convention.");
  }

  if (primary?.productKey === product.product_key) {
    reasons.push("Cloudinary manifest product key matches catalog product key.");
  }

  if (primary?.legacyProductId && driveFolder?.legacyProductId === primary.legacyProductId) {
    reasons.push("Legacy product ID matches source URL.");
  }

  if (driveFolder) {
    reasons.push(`Reviewed Drive folder candidate: ${driveFolder.group}/${driveFolder.title}.`);
  }

  const familyWords = commonFamilyWords(product.name, [
    primary?.cloudinaryPublicId,
    driveFolder?.title
  ]);

  if (familyWords.length > 0) {
    reasons.push(`Family/model words matched: ${familyWords.join(", ")}.`);
  }

  return reasons;
}

function buildManualReviewList({
  proposedMappings,
  suspiciousConflicts,
  unmatchedImages,
  unmatchedProducts
}) {
  const items = [];

  for (const conflict of suspiciousConflicts) {
    items.push({
      priority: conflict.productSlug === "tiger-vice-paddle" ? "high" : "medium",
      productSlug: conflict.productSlug,
      reason: conflict.message ?? conflict.type,
      type: conflict.type
    });
  }

  for (const product of unmatchedProducts) {
    items.push({
      priority: product.v1CheckoutScope ? "high" : "low",
      productSlug: product.slug,
      reason: "Product has no proposed Cloudinary primary image.",
      type: "unmatched_product"
    });
  }

  for (const mapping of proposedMappings.filter((item) => item.confidenceLevel !== "high")) {
    items.push({
      priority: mapping.productKind === "replacement_part" ? "low" : "medium",
      productSlug: mapping.productSlug,
      reason: `Mapping confidence is ${mapping.confidenceLevel}.`,
      type: "non_high_confidence_mapping"
    });
  }

  for (const image of unmatchedImages) {
    items.push({
      priority: "low",
      productSlug: image.productSlug,
      reason: "Manifest image was not included in a proposed product gallery.",
      type: "unmatched_image",
      cloudinaryPublicId: image.cloudinaryPublicId
    });
  }

  return dedupeReviewItems(items);
}

async function applyHighConfidenceMappings(report) {
  if (!process.env.DATABASE_URL) {
    report.applyResult = {
      applied: false,
      error: "DATABASE_URL is required for --apply.",
      changes: []
    };
    report.safety.applied = false;
    return;
  }

  const highConfidenceMappings = report.proposedMappings.filter(
    (mapping) => mapping.confidenceLevel === "high"
  );
  const reviewMappings = report.proposedMappings.filter(
    (mapping) => mapping.confidenceLevel !== "high"
  );
  const highConfidenceProductSlugs = highConfidenceMappings.map((mapping) => mapping.productSlug);

  console.log(`High-confidence mappings to apply: ${highConfidenceMappings.length}`);
  console.log(
    highConfidenceProductSlugs.length > 0
      ? `Product slugs to update: ${highConfidenceProductSlugs.join(", ")}`
      : "Product slugs to update: none"
  );
  console.log(`Review mappings skipped: ${reviewMappings.length}`);

  let prisma = null;
  const changes = [];

  try {
    const { PrismaClient } = await loadPrismaClient();
    prisma = new PrismaClient();

    await prisma.$transaction(async (transaction) => {
      for (const mapping of highConfidenceMappings) {
        const product = await transaction.product.findUnique({
          where: {
            slug: mapping.productSlug
          },
          select: {
            id: true,
            slug: true
          }
        });

        if (!product) {
          changes.push({
            action: "skipped",
            productSlug: mapping.productSlug,
            reason: "Product was not found in the database."
          });
          continue;
        }

        const publicIds = mapping.gallery.map((item) => item.cloudinaryPublicId);
        const conflictingRows = await transaction.productMedia.findMany({
          where: {
            cloudinaryPublicId: {
              in: publicIds
            },
            productId: {
              not: product.id
            }
          },
          select: applyMediaSelect()
        });

        if (conflictingRows.length > 0) {
          changes.push({
            action: "skipped",
            productSlug: mapping.productSlug,
            reason: "One or more public IDs are already assigned to another product.",
            conflicts: conflictingRows.map(serializeApplyMediaRow)
          });
          continue;
        }

        if (mapping.proposedPrimary) {
          const primaryRowsBefore = await transaction.productMedia.findMany({
            where: {
              productId: product.id,
              isPrimary: true
            },
            select: applyMediaSelect()
          });

          await transaction.productMedia.updateMany({
            where: {
              productId: product.id,
              isPrimary: true,
              mediaKey: {
                not: mapping.proposedPrimary.mediaKey
              }
            },
            data: {
              isPrimary: false
            }
          });

          const primaryRowsAfter = await transaction.productMedia.findMany({
            where: {
              id: {
                in: primaryRowsBefore.map((row) => row.id)
              }
            },
            select: applyMediaSelect()
          });

          for (const before of primaryRowsBefore) {
            const after = primaryRowsAfter.find((row) => row.id === before.id);

            if (after && before.isPrimary !== after.isPrimary) {
              changes.push({
                action: "updated_existing_primary_flag",
                productSlug: mapping.productSlug,
                before: serializeApplyMediaRow(before),
                after: serializeApplyMediaRow(after)
              });
            }
          }
        }

        for (const item of mapping.gallery) {
          const existing = await transaction.productMedia.findFirst({
            where: {
              OR: [
                {
                  mediaKey: item.mediaKey
                },
                {
                  cloudinaryPublicId: item.cloudinaryPublicId
                }
              ],
              productId: product.id
            },
            select: applyMediaSelect()
          });
          const data = {
            altText: item.altText,
            cloudinaryFormat: item.cloudinaryFormat,
            cloudinaryPublicId: item.cloudinaryPublicId,
            cloudinaryResourceType: item.cloudinaryResourceType,
            cloudinarySecureUrl: item.cloudinarySecureUrl,
            cloudinaryVersion: item.cloudinaryVersion,
            height: item.height,
            isActive: true,
            isPrimary: item.isPrimary,
            isPublic: Boolean(item.cloudinaryPublicId || item.cloudinarySecureUrl),
            mediaKey: item.mediaKey,
            productId: product.id,
            reviewStatus: "approved",
            role: item.role,
            sortOrder: item.sortOrder,
            sourceProvider: "cloudinary",
            sourceUrl: item.sourceUrl,
            title: item.title,
            width: item.width
          };

          if (existing) {
            await transaction.productMedia.update({
              where: {
                id: existing.id
              },
              data
            });
          } else {
            await transaction.productMedia.create({
              data
            });
          }

          const after = await transaction.productMedia.findFirst({
            where: {
              productId: product.id,
              mediaKey: item.mediaKey
            },
            select: applyMediaSelect()
          });

          changes.push({
            action: existing ? "updated" : "created",
            productSlug: mapping.productSlug,
            cloudinaryPublicId: item.cloudinaryPublicId,
            before: existing ? serializeApplyMediaRow(existing) : null,
            after: after ? serializeApplyMediaRow(after) : null
          });
        }
      }
    });

    report.applyResult = {
      applied: true,
      error: null,
      highConfidenceProductCount: highConfidenceMappings.length,
      changes
    };
    report.safety.applied = true;
  } catch (error) {
    report.applyResult = {
      applied: false,
      error: error.message,
      changes
    };
    report.safety.applied = false;
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

function applyMediaSelect() {
  return {
    id: true,
    mediaKey: true,
    productId: true,
    role: true,
    cloudinaryPublicId: true,
    cloudinarySecureUrl: true,
    cloudinaryResourceType: true,
    cloudinaryFormat: true,
    cloudinaryVersion: true,
    width: true,
    height: true,
    sourceUrl: true,
    sourceProvider: true,
    altText: true,
    title: true,
    sortOrder: true,
    isPrimary: true,
    isPublic: true,
    isActive: true,
    reviewStatus: true,
    updatedAt: true
  };
}

async function writeReport(report, reportPath) {
  await fsp.mkdir(path.dirname(reportPath), { recursive: true });
  const serializableReport = {
    ...report,
    reportPath: relativePath(reportPath)
  };

  await fsp.writeFile(reportPath, `${JSON.stringify(serializableReport, null, 2)}\n`);
}

function printSummary(report) {
  console.log(`Product media mapping repair ${report.mode} complete.`);
  console.log(`Report: ${report.reportPath}`);
  console.log(`Products scanned: ${report.summary.scannedProducts}`);
  console.log(`Media assets scanned: ${report.summary.scannedMediaAssets}`);
  console.log(`Proposed mappings: ${report.summary.proposedMappings}`);
  console.log(`High-confidence mappings: ${report.summary.highConfidenceMappings}`);
  console.log(`Suspicious conflicts: ${report.summary.suspiciousConflicts}`);

  if (report.applyResult) {
    console.log(
      report.applyResult.applied
        ? `Applied changes: ${report.applyResult.changes.length}`
        : `Apply skipped/failed: ${report.applyResult.error}`
    );
  }
}

function getManifestAssets(manifest) {
  return Array.isArray(manifest.uploads)
    ? manifest.uploads.map((asset) => ({
        ...asset,
        isPrimary: Boolean(asset.isPrimary),
        imageOrder: Number(asset.imageOrder ?? asset.order ?? 0),
        imageRole: asset.imageRole ?? asset.role ?? (asset.isPrimary ? "primary" : "gallery")
      }))
    : [];
}

function parseFallbackMedia(source) {
  const result = new Map();
  const slugPattern = /^\s+"([^"]+)": \[/gm;
  const matches = [...source.matchAll(slugPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const slug = matches[index][1];
    const blockStart = matches[index].index ?? 0;
    const nextStart = matches[index + 1]?.index ?? source.indexOf("\n};", blockStart);
    const block = source.slice(blockStart, nextStart > blockStart ? nextStart : undefined);
    const items = [...block.matchAll(/\{([\s\S]*?)\n\s+\}/g)].map((itemMatch) => {
      const item = itemMatch[1];

      return {
        alt: matchStringProperty(item, "alt"),
        caption: matchStringProperty(item, "caption"),
        role: matchStringProperty(item, "role"),
        src: matchStringProperty(item, "src"),
        title: matchStringProperty(item, "title")
      };
    });

    result.set(
      slug,
      items.filter((item) => item.src)
    );
  }

  return result;
}

function getFallbackConflict(product, fallbackMedia) {
  if (fallbackMedia.length === 0) {
    return null;
  }

  const productWords = commonFamilyWords(product.name, [product.slug]);
  const fallbackText = fallbackMedia
    .map((item) => [item.alt, item.caption, item.src, item.title].filter(Boolean).join(" "))
    .join(" ");
  const fallbackWords = FAMILY_WORDS.filter((word) => normalizeText(fallbackText).includes(word));
  const unexpectedWords = fallbackWords.filter((word) => !productWords.includes(word));

  if (product.slug === "tiger-vice-paddle" && unexpectedWords.includes("aqua")) {
    return "tiger-vice-paddle is using Aqua fallback media.";
  }

  if (unexpectedWords.length > 0 && !fallbackWords.some((word) => productWords.includes(word))) {
    return `Fallback image appears to belong to another product family: ${unexpectedWords.join(", ")}.`;
  }

  return null;
}

function findBestDriveFolder(context, product) {
  const legacyProductId = getLegacyProductIdForProduct(context, product);

  if (legacyProductId) {
    const byId = REVIEWED_DRIVE_PRODUCT_FOLDERS.find(
      (folder) => folder.legacyProductId === legacyProductId
    );

    if (byId) {
      return byId;
    }
  }

  const scored = REVIEWED_DRIVE_PRODUCT_FOLDERS.map((folder) => ({
    folder,
    score: tokenOverlap(product.name, folder.title)
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.folder ?? null;
}

function driveFolder(group, title) {
  const legacyProductId = Number(title.match(/^(\d+)-/)?.[1] ?? 0) || null;

  return {
    group,
    title,
    legacyProductId,
    familyWords: commonFamilyWords(title, [])
  };
}

function commonFamilyWords(text, otherTexts) {
  const normalized = normalizeText([text, ...otherTexts].filter(Boolean).join(" "));

  return FAMILY_WORDS.filter((word) => normalized.includes(word));
}

function tokenOverlap(left, right) {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  let score = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      score += 1;
    }
  }

  return score;
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2 && token !== "tiger" && token !== "pingpong");
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compareManifestAssets(left, right) {
  return (
    left.imageOrder - right.imageOrder ||
    left.cloudinaryPublicId.localeCompare(right.cloudinaryPublicId)
  );
}

function createMediaKey(slug, role, order) {
  return `${slug}-${role}-${String(order).padStart(2, "0")}`;
}

function findCsvSourceUrl(mediaRows, productKey, asset) {
  const direct = mediaRows.find(
    (row) =>
      row.product_key === productKey &&
      row.cloudinary_public_id === asset.cloudinaryPublicId &&
      row.source_url
  );
  const primary = mediaRows.find(
    (row) => row.product_key === productKey && row.is_primary === "true" && row.source_url
  );

  return blankToNull(direct?.source_url ?? primary?.source_url);
}

function serializeDbMediaRow(row) {
  return {
    source: "database",
    id: row.id,
    mediaKey: row.mediaKey,
    productKey: row.product?.key ?? null,
    productSlug: row.product?.slug ?? null,
    productTitle: row.product?.name ?? null,
    role: row.role,
    cloudinaryPublicId: row.cloudinaryPublicId,
    cloudinarySecureUrl: row.cloudinarySecureUrl,
    cloudinaryResourceType: row.cloudinaryResourceType,
    cloudinaryFormat: row.cloudinaryFormat,
    cloudinaryVersion: row.cloudinaryVersion,
    width: row.width,
    height: row.height,
    sourceUrl: row.sourceUrl,
    sourceProvider: row.sourceProvider,
    altText: row.altText,
    title: row.title,
    caption: row.caption,
    sortOrder: row.sortOrder,
    isPrimary: row.isPrimary,
    isPublic: row.isPublic,
    isActive: row.isActive,
    reviewStatus: row.reviewStatus,
    updatedAt: row.updatedAt?.toISOString?.() ?? null
  };
}

function serializeApplyMediaRow(row) {
  return {
    id: row.id,
    mediaKey: row.mediaKey,
    productId: row.productId,
    role: row.role,
    cloudinaryPublicId: row.cloudinaryPublicId,
    cloudinarySecureUrl: row.cloudinarySecureUrl,
    cloudinaryResourceType: row.cloudinaryResourceType,
    cloudinaryFormat: row.cloudinaryFormat,
    cloudinaryVersion: row.cloudinaryVersion,
    width: row.width,
    height: row.height,
    sourceUrl: row.sourceUrl,
    sourceProvider: row.sourceProvider,
    altText: row.altText,
    title: row.title,
    sortOrder: row.sortOrder,
    isPrimary: row.isPrimary,
    isPublic: row.isPublic,
    isActive: row.isActive,
    reviewStatus: row.reviewStatus,
    updatedAt: row.updatedAt?.toISOString?.() ?? null
  };
}

function matchStringProperty(block, key) {
  return blankToNull(block.match(new RegExp(`${key}:\\s+"([^"]*)"`))?.[1]);
}

function getLegacyProductIdFromUrl(url) {
  return Number(String(url ?? "").match(/\/products\/(\d+)\//)?.[1] ?? 0) || null;
}

function getLegacyProductIdForProduct(context, product) {
  const productSourceId = getLegacyProductIdFromUrl(product.source_url);

  if (productSourceId) {
    return productSourceId;
  }

  for (const row of context.mediaRows) {
    if (row.product_key !== product.product_key) {
      continue;
    }

    const mediaSourceId = getLegacyProductIdFromUrl(row.source_url);

    if (mediaSourceId) {
      return mediaSourceId;
    }
  }

  return null;
}

function groupBy(items, getKey) {
  const groups = new Map();

  for (const item of items) {
    const key = getKey(item);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(item);
  }

  return groups;
}

function dedupeReviewItems(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = `${item.type}:${item.productSlug}:${item.reason}:${item.cloudinaryPublicId ?? ""}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(item);
  }

  return result;
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...dataRows] = rows.filter((candidate) =>
    candidate.some((cell) => cell.trim() !== "")
  );

  return dataRows.map((dataRow) =>
    Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ""]))
  );
}

function defaultReportPath(date) {
  const stamp = date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")
    .replace("T", "-");

  return path.join(REPORT_DIR, `product-media-mapping-repair-${stamp}.json`);
}

function blankToNull(value) {
  const normalized = String(value ?? "").trim();

  return normalized ? normalized : null;
}

function numberOrNull(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).replaceAll(path.sep, "/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
