#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const DEFAULT_MANIFEST = path.join(REPO_ROOT, "data/media/table-product-gallery-manifest-v1.json");
const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://tigerpingpong-platform.onrender.com";
const REPORT_PATH = path.join(REPO_ROOT, "exports/table-gallery-media/catalog-repair-report.json");
const SNAPSHOT_DIR = path.join(REPO_ROOT, "exports/table-gallery-media/rollback-snapshots");
const PRISMA_ENTRY = path.join(REPO_ROOT, "packages/db/node_modules/@prisma/client/default.js");
const EXPECTED_PRODUCTS = new Set([
  "tiger-expo-outdoor-table",
  "tiger-portland-indoor-table",
  "tiger-portland-outdoor-table",
  "tiger-whistler-indoor-table",
  "tiger-plaza-outdoor-table-grey"
]);
const ALLOWED_ROLES = new Set(["primary", "gallery", "detail", "lifestyle", "variant"]);

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Table gallery repair failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.envFile) loadEnvFile(args.envFile);

  if (args.rollback) {
    requireDatabaseUrl("--rollback");
    const result = await rollbackSnapshot(args.rollback);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const manifest = JSON.parse(readFileSync(args.manifest, "utf8"));
  const report = await buildValidationReport(manifest, args);

  if (args.apply) {
    requireDatabaseUrl("--apply");
    report.apply = await applyManifest(manifest);
  } else if (args.verify) {
    requireDatabaseUrl("--verify");
    report.database = await verifyDatabase(manifest);
  }

  await writeJson(REPORT_PATH, report);
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Report: ${relativePath(REPORT_PATH)}`);

  if (report.summary.errors > 0 || report.database?.verified === false) process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    apiBaseUrl: DEFAULT_API_BASE_URL,
    apply: false,
    envFile: null,
    help: false,
    manifest: DEFAULT_MANIFEST,
    rollback: null,
    verify: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--verify") parsed.verify = true;
    else if (arg === "--help") parsed.help = true;
    else if (["--api-base-url", "--env-file", "--manifest", "--rollback"].includes(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      if (arg === "--api-base-url") parsed.apiBaseUrl = value;
      if (arg === "--env-file") parsed.envFile = path.resolve(value);
      if (arg === "--manifest") parsed.manifest = path.resolve(value);
      if (arg === "--rollback") parsed.rollback = path.resolve(value);
      index += 1;
    } else if (arg.startsWith("--api-base-url=")) parsed.apiBaseUrl = arg.slice(15);
    else if (arg.startsWith("--env-file=")) parsed.envFile = path.resolve(arg.slice(11));
    else if (arg.startsWith("--manifest=")) parsed.manifest = path.resolve(arg.slice(11));
    else if (arg.startsWith("--rollback=")) parsed.rollback = path.resolve(arg.slice(11));
    else throw new Error(`Unknown argument: ${arg}`);
  }

  const modes = [parsed.apply, parsed.verify, Boolean(parsed.rollback)].filter(Boolean);
  if (modes.length > 1) throw new Error("Use only one of --apply, --verify, or --rollback.");
  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong table gallery catalog repair

Dry run (default):
  node scripts/media/repair-table-product-galleries.mjs

Verify applied database state:
  node scripts/media/repair-table-product-galleries.mjs --verify --env-file <path>

Apply after visual approval:
  node scripts/media/repair-table-product-galleries.mjs --apply --env-file <path>

Rollback an applied snapshot:
  node scripts/media/repair-table-product-galleries.mjs --rollback <snapshot> --env-file <path>

Safety:
  - Dry run validates the manifest, live variants, and Cloudinary delivery URLs.
  - Apply and rollback require explicit flags and DATABASE_URL.
  - Existing variants are resolved by exact key; variants are never created.
  - Apply captures a complete ProductMedia snapshot before one transaction.
  - Replaced rows are deactivated, never deleted. Cloudinary assets are never deleted.
`);
}

async function buildValidationReport(manifest, args) {
  const errors = [];
  const warnings = [];
  const mediaKeys = new Set();
  const publicIds = new Set();
  const assetIds = new Set();
  const productSlugs = new Set(manifest.products.map((product) => product.productSlug));

  for (const expectedSlug of EXPECTED_PRODUCTS) {
    if (!productSlugs.has(expectedSlug)) errors.push(`Missing expected product: ${expectedSlug}`);
  }
  for (const slug of productSlugs) {
    if (!EXPECTED_PRODUCTS.has(slug)) errors.push(`Unexpected table product: ${slug}`);
  }

  const products = [];
  for (const product of manifest.products) {
    const productErrors = [];
    if (!product.approvedVariantKeys.includes(product.catalogLeadVariantKey)) {
      productErrors.push("Catalog lead variant is not approved.");
    }
    if (product.assets[0]?.variantKey !== product.catalogLeadVariantKey) {
      productErrors.push("First asset does not match the catalog lead variant.");
    }
    if (product.assets.filter((asset) => asset.isPrimary).length !== 1) {
      productErrors.push("Exactly one primary asset is required.");
    }

    let previousSortOrder = -1;
    for (const asset of product.assets) {
      if (mediaKeys.has(asset.mediaKey)) errors.push(`Duplicate media key: ${asset.mediaKey}`);
      mediaKeys.add(asset.mediaKey);
      if (!ALLOWED_ROLES.has(asset.role)) productErrors.push(`Unsupported role: ${asset.role}`);
      if (asset.variantKey && !product.approvedVariantKeys.includes(asset.variantKey)) {
        productErrors.push(`${asset.mediaKey} has an unapproved variant key.`);
      }
      if (asset.sortOrder <= previousSortOrder) {
        productErrors.push("Asset sort order must be strictly increasing.");
      }
      previousSortOrder = asset.sortOrder;
      if (!asset.cloudinary.assetId || !asset.cloudinary.publicId || !asset.cloudinary.secureUrl) {
        productErrors.push(`${asset.mediaKey} is missing verified Cloudinary metadata.`);
      }
      if (assetIds.has(asset.cloudinary.assetId)) {
        errors.push(`Duplicate Cloudinary asset ID: ${asset.cloudinary.assetId}`);
      }
      if (publicIds.has(asset.cloudinary.publicId)) {
        errors.push(`Duplicate Cloudinary public ID: ${asset.cloudinary.publicId}`);
      }
      assetIds.add(asset.cloudinary.assetId);
      publicIds.add(asset.cloudinary.publicId);
      const longestEdge = Math.max(asset.source.width, asset.source.height);
      if (
        longestEdge < manifest.delivery.minimumUsefulSourceEdge &&
        asset.qualityStatus !== "best_available_current_model"
      ) {
        productErrors.push(`${asset.mediaKey} is below the source minimum without an exception.`);
      }
      if (/portland outdoor v1/i.test(JSON.stringify(asset))) {
        productErrors.push(`${asset.mediaKey} references prohibited Portland Outdoor V1 media.`);
      }
    }

    const catalog = await fetchCatalogProduct(args.apiBaseUrl, product.productSlug);
    const liveVariantKeys = new Set((catalog.variants ?? []).map((variant) => variant.key));
    for (const variantKey of product.approvedVariantKeys) {
      if (!liveVariantKeys.has(variantKey)) {
        productErrors.push(`Live catalog is missing variant key: ${variantKey}`);
      }
    }

    const deliveries = [];
    for (const asset of product.assets) {
      const response = await fetch(asset.cloudinary.secureUrl, { method: "HEAD" });
      const delivery = {
        mediaKey: asset.mediaKey,
        ok: response.ok,
        status: response.status,
        type: response.headers.get("content-type")
      };
      deliveries.push(delivery);
      if (!response.ok || !delivery.type?.startsWith("image/")) {
        productErrors.push(`${asset.mediaKey} failed Cloudinary delivery verification.`);
      }
    }

    errors.push(...productErrors.map((error) => `${product.productSlug}: ${error}`));
    products.push({
      assetCount: product.assets.length,
      catalogLeadVariantKey: product.catalogLeadVariantKey,
      deliveries,
      errors: productErrors,
      livePriceCents: catalog.priceCents,
      liveVariantKeys: [...liveVariantKeys],
      productSlug: product.productSlug
    });
  }

  if (manifest.products.length !== 5) errors.push("Manifest must contain exactly five tables.");
  if (manifest.safety.productionCatalogWritten) {
    warnings.push("Manifest reports a previous production catalog write.");
  }

  return {
    database: null,
    generatedAt: new Date().toISOString(),
    mode: args.apply ? "apply" : args.verify ? "verify" : "dry-run",
    products,
    safety: {
      cloudinaryAssetsDeleted: false,
      databaseHistoryDeleted: false,
      dryRunDefault: !args.apply,
      variantsCreated: false
    },
    summary: {
      assets: manifest.products.reduce((sum, product) => sum + product.assets.length, 0),
      errors: errors.length,
      products: manifest.products.length,
      warnings: warnings.length
    },
    errors,
    warnings
  };
}

async function fetchCatalogProduct(apiBaseUrl, slug) {
  const url = `${apiBaseUrl.replace(/\/$/, "")}/catalog/products/${encodeURIComponent(slug)}`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok)
    throw new Error(`Catalog validation failed for ${slug}: HTTP ${response.status}`);
  const body = await response.json();
  if (!body.product || body.product.slug !== slug) {
    throw new Error(`Catalog validation returned the wrong product for ${slug}.`);
  }
  return body.product;
}

async function applyManifest(manifest) {
  const { PrismaClient } = await loadPrismaClient();
  const prisma = new PrismaClient();
  try {
    const slugs = manifest.products.map((product) => product.productSlug);
    const beforeRows = await prisma.productMedia.findMany({
      orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
      where: { product: { slug: { in: slugs } } }
    });
    const snapshot = {
      capturedAt: new Date().toISOString(),
      manifest: relativePath(DEFAULT_MANIFEST),
      productSlugs: slugs,
      rows: beforeRows.map(serializeRow),
      schemaVersion: 1
    };
    const snapshotPath = path.join(
      SNAPSHOT_DIR,
      `table-gallery-before-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.json`
    );
    await writeJson(snapshotPath, snapshot);

    const result = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        select: {
          id: true,
          slug: true,
          variants: { select: { id: true, key: true } }
        },
        where: { slug: { in: slugs } }
      });
      const productsBySlug = new Map(products.map((product) => [product.slug, product]));
      const approvedIds = [];

      for (const manifestProduct of manifest.products) {
        const product = productsBySlug.get(manifestProduct.productSlug);
        if (!product) throw new Error(`Database product not found: ${manifestProduct.productSlug}`);
        const variantsByKey = new Map(product.variants.map((variant) => [variant.key, variant.id]));
        for (const variantKey of manifestProduct.approvedVariantKeys) {
          if (!variantsByKey.has(variantKey)) throw new Error(`Variant not found: ${variantKey}`);
        }

        for (const asset of manifestProduct.assets) {
          const matches = await tx.productMedia.findMany({
            where: {
              OR: [
                { mediaKey: asset.mediaKey },
                { cloudinaryAssetId: asset.cloudinary.assetId },
                { cloudinaryPublicId: asset.cloudinary.publicId }
              ]
            }
          });
          const matchIds = new Set(matches.map((row) => row.id));
          if (matchIds.size > 1) {
            throw new Error(`${asset.mediaKey} resolves to multiple database media rows.`);
          }
          const data = toMediaData(asset, product.id, variantsByKey);
          const row = matches[0]
            ? await tx.productMedia.update({ data, where: { id: matches[0].id } })
            : await tx.productMedia.create({ data });
          approvedIds.push(row.id);
        }
      }

      const deactivated = await tx.productMedia.updateMany({
        data: {
          isActive: false,
          isPrimary: false,
          isPublic: false,
          notes: "Deactivated by table gallery restoration v1; retained for rollback/history."
        },
        where: {
          id: { notIn: approvedIds },
          product: { slug: { in: slugs } }
        }
      });
      return { approvedRows: approvedIds.length, deactivatedRows: deactivated.count };
    });

    return { applied: true, ...result, snapshotPath: relativePath(snapshotPath) };
  } finally {
    await prisma.$disconnect();
  }
}

function toMediaData(asset, productId, variantsByKey) {
  return {
    altText: asset.altText,
    bytes: asset.cloudinary.bytes === undefined ? undefined : BigInt(asset.cloudinary.bytes),
    caption: null,
    cloudinaryAssetId: asset.cloudinary.assetId,
    cloudinaryFormat: asset.cloudinary.format,
    cloudinaryPublicId: asset.cloudinary.publicId,
    cloudinaryResourceType: "image",
    cloudinarySecureUrl: asset.cloudinary.secureUrl,
    cloudinaryVersion: asset.cloudinary.version,
    height: asset.source.height,
    isActive: true,
    isPrimary: asset.isPrimary,
    isPublic: true,
    mediaKey: asset.mediaKey,
    notes: `Table gallery restoration v1; ${asset.modelVerification}; ${asset.qualityStatus}.`,
    productId,
    reviewStatus: "approved",
    role: asset.role,
    sortOrder: asset.sortOrder,
    sourceChecksum: asset.source.sha256,
    sourceProvider: "cloudinary",
    sourceUrl: asset.source.url ?? asset.cloudinary.secureUrl,
    title: null,
    variantId: asset.variantKey ? variantsByKey.get(asset.variantKey) : null,
    width: asset.source.width
  };
}

async function verifyDatabase(manifest) {
  const { PrismaClient } = await loadPrismaClient();
  const prisma = new PrismaClient();
  const errors = [];
  try {
    for (const product of manifest.products) {
      const rows = await prisma.productMedia.findMany({
        include: { variant: { select: { key: true } } },
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        where: { isActive: true, isPublic: true, product: { slug: product.productSlug } }
      });
      if (rows.length !== product.assets.length) {
        errors.push(
          `${product.productSlug}: expected ${product.assets.length} active rows, found ${rows.length}.`
        );
      }
      for (const asset of product.assets) {
        const row = rows.find((candidate) => candidate.mediaKey === asset.mediaKey);
        if (!row) errors.push(`${product.productSlug}: missing ${asset.mediaKey}.`);
        else if ((row.variant?.key ?? null) !== asset.variantKey) {
          errors.push(`${asset.mediaKey}: variant mapping does not match the manifest.`);
        } else if (row.cloudinaryPublicId !== asset.cloudinary.publicId) {
          errors.push(`${asset.mediaKey}: Cloudinary public ID does not match the manifest.`);
        }
      }
    }
    return { errors, verified: errors.length === 0 };
  } finally {
    await prisma.$disconnect();
  }
}

async function rollbackSnapshot(snapshotPath) {
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  if (snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.rows)) {
    throw new Error("Unsupported or invalid rollback snapshot.");
  }
  const { PrismaClient } = await loadPrismaClient();
  const prisma = new PrismaClient();
  try {
    const beforeIds = new Set(snapshot.rows.map((row) => row.id));
    const currentRows = await prisma.productMedia.findMany({
      where: { product: { slug: { in: snapshot.productSlugs } } }
    });
    await prisma.$transaction(async (tx) => {
      for (const row of currentRows.filter((candidate) => !beforeIds.has(candidate.id))) {
        await tx.productMedia.update({
          data: {
            cloudinaryAssetId: null,
            cloudinaryPublicId: null,
            isActive: false,
            isPrimary: false,
            isPublic: false,
            mediaKey: `rollback-retired-${row.id}`,
            notes: "Retired by table gallery restoration rollback; retained for history."
          },
          where: { id: row.id }
        });
      }
      for (const row of snapshot.rows) {
        await tx.productMedia.update({ data: deserializeRow(row), where: { id: row.id } });
      }
    });
    return {
      restoredRows: snapshot.rows.length,
      retiredNewRows: currentRows.length - beforeIds.size
    };
  } finally {
    await prisma.$disconnect();
  }
}

function serializeRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (typeof value === "bigint") return [key, value.toString()];
      if (value instanceof Date) return [key, value.toISOString()];
      return [key, value];
    })
  );
}

function deserializeRow(row) {
  const restored = { ...row };
  delete restored.id;
  delete restored.createdAt;
  delete restored.updatedAt;
  if (restored.bytes !== null && restored.bytes !== undefined)
    restored.bytes = BigInt(restored.bytes);
  return restored;
}

async function loadPrismaClient() {
  if (!existsSync(PRISMA_ENTRY)) {
    throw new Error("Generated Prisma client is missing. Run pnpm db:generate first.");
  }
  const module = await import(pathToFileURL(PRISMA_ENTRY).href);
  if (typeof module.PrismaClient !== "function") throw new Error("PrismaClient is unavailable.");
  return module;
}

function requireDatabaseUrl(mode) {
  if (!process.env.DATABASE_URL?.trim()) throw new Error(`DATABASE_URL is required for ${mode}.`);
}

function loadEnvFile(envFile) {
  if (!existsSync(envFile)) throw new Error(`Environment file not found: ${envFile}`);
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const separatorIndex = trimmed.indexOf("=");
    const name = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[name]) process.env[name] = value;
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}
