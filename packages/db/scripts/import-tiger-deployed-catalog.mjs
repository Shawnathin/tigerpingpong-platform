#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(PACKAGE_DIR, "../..");
const INPUT_DIR = path.join(REPO_ROOT, "data/import-review/tigerpingpong/v1");

const CONFIRM_FLAG = "--confirm-deployed-import";
const DRY_RUN_FLAG = "--dry-run";
const WRITE_FLAG = "--write";
const HELP_FLAG = "--help";
const TARGET_PREFIX = "--target=";
const ALLOWED_TARGETS = new Set(["staging", "production"]);

const FILE_CONFIGS = [
  {
    id: "brands",
    file: "brands_import_v1.csv",
    table: "brands",
    keyColumn: "brand_key"
  },
  {
    id: "categories",
    file: "categories_import_v1.csv",
    table: "categories",
    keyColumn: "category_key"
  },
  {
    id: "families",
    file: "product_families_import_v1.csv",
    table: "product_families",
    keyColumn: "family_key"
  },
  {
    id: "products",
    file: "products_import_v1.csv",
    table: "products",
    keyColumn: "product_key"
  },
  {
    id: "variants",
    file: "product_variants_import_v1.csv",
    table: "product_variants",
    keyColumn: "variant_key"
  },
  {
    id: "media",
    file: "product_media_import_v1.csv",
    table: "product_media",
    keyColumn: "media_key"
  },
  {
    id: "redirects",
    file: "redirects_launch_v1.csv",
    table: "redirects",
    keyColumn: "legacy_path",
    writeMode: "skipped"
  },
  {
    id: "flags",
    file: "import_review_flags_v1.csv",
    table: "import_review_flags",
    keyColumn: null
  }
];

const OPTION_TABLES = ["product_options", "product_option_values", "product_variant_option_values"];

async function main() {
  const args = process.argv.slice(2);

  if (args.includes(HELP_FLAG)) {
    printHelp();
    return;
  }

  const safety = validateSafety(args);

  if (safety.issues.length > 0) {
    printSafetyRefusal(safety.issues);
    process.exitCode = 1;
    return;
  }

  printBanner(safety);

  const validator = runValidator();

  if (!validator.passed) {
    printValidatorFailure(validator);
    process.exitCode = 1;
    return;
  }

  const importData = loadImportData();

  if (importData.issues.length > 0) {
    printCsvFailure(importData.issues);
    process.exitCode = 1;
    return;
  }

  const plan = createPlan(importData);
  printPlan(plan);

  if (safety.dryRun) {
    console.log("");
    console.log("Dry run complete. No database connection was opened and no rows were written.");
    return;
  }

  const result = await runPrismaImport(importData, safety);
  printImportSummary(result);
}

function validateSafety(args) {
  const issues = [];
  const targets = args
    .filter((arg) => arg.startsWith(TARGET_PREFIX))
    .map((arg) => arg.slice(TARGET_PREFIX.length));
  const dryRun = args.includes(DRY_RUN_FLAG);
  const write = args.includes(WRITE_FLAG);

  for (const arg of args) {
    if (
      arg !== "--" &&
      arg !== CONFIRM_FLAG &&
      arg !== DRY_RUN_FLAG &&
      arg !== WRITE_FLAG &&
      !arg.startsWith(TARGET_PREFIX)
    ) {
      issues.push(`Unknown argument: ${arg}`);
    }
  }

  if (!process.env.DATABASE_URL) {
    issues.push("DATABASE_URL is required for deployed import planning or writes.");
  }

  if (!args.includes(CONFIRM_FLAG)) {
    issues.push(`Explicit deployed confirmation flag is required: ${CONFIRM_FLAG}`);
  }

  if (targets.length === 0) {
    issues.push("Explicit deployed target is required: --target=staging or --target=production");
  }

  if (targets.length > 1) {
    issues.push("Exactly one deployed target is allowed.");
  }

  if (targets.length === 1 && !ALLOWED_TARGETS.has(targets[0])) {
    issues.push(`Unsupported deployed target: ${targets[0]}. Use staging or production.`);
  }

  if (dryRun && write) {
    issues.push(`Choose exactly one mode: ${DRY_RUN_FLAG} or ${WRITE_FLAG}.`);
  }

  if (!dryRun && !write) {
    issues.push(`Explicit mode is required: ${DRY_RUN_FLAG} or ${WRITE_FLAG}.`);
  }

  return {
    dryRun,
    write,
    target: targets[0] ?? null,
    issues
  };
}

function runValidator() {
  const result = spawnSync("pnpm", ["validate:tiger-import"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  return {
    passed: result.status === 0,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    error: result.error
  };
}

function loadImportData() {
  const issues = [];
  const files = new Map();

  for (const config of FILE_CONFIGS) {
    const filePath = path.join(INPUT_DIR, config.file);
    const fileInfo = {
      config,
      relativePath: relativePath(filePath),
      headers: [],
      rows: []
    };

    if (!fs.existsSync(filePath)) {
      issues.push(`Expected CSV file is missing: ${fileInfo.relativePath}`);
      files.set(config.id, fileInfo);
      continue;
    }

    const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));

    if (parsed.length === 0) {
      issues.push(`Expected CSV file is empty: ${fileInfo.relativePath}`);
      files.set(config.id, fileInfo);
      continue;
    }

    fileInfo.headers = parsed[0].map((header, index) =>
      index === 0 ? header.replace(/^\uFEFF/, "") : header
    );

    fileInfo.rows = parsed.slice(1).map((values) => {
      const row = {};

      for (const [headerIndex, header] of fileInfo.headers.entries()) {
        row[header] = values[headerIndex] ?? "";
      }

      return row;
    });

    files.set(config.id, fileInfo);
  }

  return { files, issues };
}

function createPlan(importData) {
  const products = rows(importData, "products");
  const variants = rows(importData, "variants");
  const media = rows(importData, "media");
  const redirects = rows(importData, "redirects");
  const flags = rows(importData, "flags");
  const aquaProduct = products.find(
    (row) => value(row, "product_key") === "tiger-aqua-outdoor-indoor-paddle"
  );
  const aquaVariants = variants.filter(
    (row) => value(row, "product_key") === "tiger-aqua-outdoor-indoor-paddle"
  );
  const archivedAquaPackages = products.filter(
    (row) =>
      value(row, "family_key") === "aqua-paddles" &&
      value(row, "product_key") !== "tiger-aqua-outdoor-indoor-paddle"
  );

  return {
    filePlans: FILE_CONFIGS.map((config) => {
      const fileInfo = importData.files.get(config.id);
      return {
        table: config.table,
        file: config.file,
        rowCount: fileInfo.rows.length,
        writeMode: config.writeMode ?? "upsert",
        sampleKeys: config.keyColumn
          ? fileInfo.rows.slice(0, 5).map((row) => value(row, config.keyColumn))
          : []
      };
    }),
    writableRows: {
      brands: rows(importData, "brands").length,
      categories: rows(importData, "categories").length,
      families: rows(importData, "families").length,
      products: products.length,
      variants: variants.length,
      media: media.length,
      reviewFlags: flags.length,
      redirectsSkipped: redirects.length
    },
    aqua: {
      productKey: value(aquaProduct ?? {}, "product_key"),
      productSlug: value(aquaProduct ?? {}, "slug"),
      status: value(aquaProduct ?? {}, "status"),
      purchaseMode: value(aquaProduct ?? {}, "purchase_mode"),
      variantCount: aquaVariants.length,
      variants: aquaVariants.map((row) => ({
        key: value(row, "variant_key"),
        label: value(row, "option_1_value"),
        sku: value(row, "sku"),
        priceCents: value(row, "price_cents")
      })),
      archivedPackageProductKeys: archivedAquaPackages.map((row) => value(row, "product_key")),
      sourceMediaRows: media.filter(
        (row) =>
          value(row, "product_key") === "tiger-aqua-outdoor-indoor-paddle" &&
          value(row, "cloudinary_secure_url") === ""
      ).length,
      draftRedirectRows: redirects.filter((row) =>
        value(row, "new_path_candidate").includes(
          "/catalog/products/tiger-aqua-outdoor-indoor-paddle"
        )
      ).length,
      openReviewFlags: flags.filter(
        (row) =>
          value(row, "entity_key") === "aqua-paddles" && value(row, "resolution_status") === "open"
      ).length
    }
  };
}

async function runPrismaImport(importData, safety) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const existing = await summarizeExistingRows(prisma, importData);
    printWritePreflight(safety, importData, existing);

    return await prisma.$transaction(
      async (tx) => {
        const state = {
          brands: new Map(),
          categories: new Map(),
          families: new Map(),
          products: new Map(),
          variants: new Map()
        };
        const result = createImportResult();
        result.redirects = rows(importData, "redirects").length;

        await importBrands(tx, importData, state, result);
        await importCategories(tx, importData, state, result);
        await importFamilies(tx, importData, state, result);
        await importProducts(tx, importData, state, result);
        await importVariants(tx, importData, state, result);
        await importMedia(tx, importData, state, result);
        await importReviewFlags(tx, importData, result);

        return result;
      },
      {
        maxWait: 15_000,
        timeout: 120_000
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function summarizeExistingRows(prisma, importData) {
  const productKeys = stableKeys(importData, "products", "product_key");
  const variantKeys = stableKeys(importData, "variants", "variant_key");

  return {
    brands: await prisma.brand.count({
      where: { key: { in: stableKeys(importData, "brands", "brand_key") } }
    }),
    categories: await prisma.category.count({
      where: {
        key: { in: stableKeys(importData, "categories", "category_key") }
      }
    }),
    families: await prisma.productFamily.count({
      where: { key: { in: stableKeys(importData, "families", "family_key") } }
    }),
    products: await prisma.product.count({
      where: { key: { in: productKeys } }
    }),
    variants: await prisma.productVariant.count({
      where: { key: { in: variantKeys } }
    }),
    media: await prisma.productMedia.count({
      where: { mediaKey: { in: stableKeys(importData, "media", "media_key") } }
    }),
    optionLinksForImportedVariants: await prisma.productVariantOptionValue.count({
      where: { productVariant: { key: { in: variantKeys } } }
    }),
    reviewFlags: await countExistingReviewFlags(prisma, importData),
    redirectsSkipped: rows(importData, "redirects").length
  };
}

async function countExistingReviewFlags(prisma, importData) {
  let count = 0;

  for (const row of rows(importData, "flags")) {
    const existing = await prisma.importReviewFlag.findFirst({
      where: {
        entityType: value(row, "entity_type"),
        entityKey: value(row, "entity_key"),
        sourceUrl: nullIfBlank(value(row, "source_url")),
        flag: value(row, "flag")
      },
      select: { id: true }
    });

    if (existing) {
      count += 1;
    }
  }

  return count;
}

function createImportResult() {
  return {
    brands: 0,
    categories: 0,
    families: 0,
    products: 0,
    variants: 0,
    optionRecords: 0,
    media: 0,
    reviewFlags: 0,
    redirects: 0
  };
}

async function importBrands(tx, importData, state, result) {
  for (const row of rows(importData, "brands")) {
    const brand = await tx.brand.upsert({
      where: { key: value(row, "brand_key") },
      update: {
        name: value(row, "name"),
        slug: value(row, "slug"),
        isActive: asBoolean(row, "is_active"),
        notes: combineNotes([
          value(row, "notes"),
          prefixNote("Source evidence", value(row, "source_evidence"))
        ])
      },
      create: {
        key: value(row, "brand_key"),
        name: value(row, "name"),
        slug: value(row, "slug"),
        isActive: asBoolean(row, "is_active"),
        notes: combineNotes([
          value(row, "notes"),
          prefixNote("Source evidence", value(row, "source_evidence"))
        ])
      }
    });

    state.brands.set(value(row, "brand_key"), brand);
    result.brands += 1;
  }
}

async function importCategories(tx, importData, state, result) {
  for (const row of rows(importData, "categories")) {
    const sourceUrl = nullIfBlank(value(row, "source_url"));
    const category = await tx.category.upsert({
      where: { key: value(row, "category_key") },
      update: {
        name: value(row, "name"),
        slug: value(row, "slug"),
        description: nullIfBlank(value(row, "description")),
        sortOrder: asInteger(row, "sort_order"),
        v1PublicNavigation: asBoolean(row, "v1_public_navigation"),
        v1CheckoutScope: asBoolean(row, "v1_checkout_scope"),
        sourceUrl,
        legacyPath: pathFromUrl(sourceUrl),
        isActive: true
      },
      create: {
        key: value(row, "category_key"),
        name: value(row, "name"),
        slug: value(row, "slug"),
        description: nullIfBlank(value(row, "description")),
        sortOrder: asInteger(row, "sort_order"),
        v1PublicNavigation: asBoolean(row, "v1_public_navigation"),
        v1CheckoutScope: asBoolean(row, "v1_checkout_scope"),
        sourceUrl,
        legacyPath: pathFromUrl(sourceUrl),
        isActive: true
      }
    });

    state.categories.set(value(row, "category_key"), category);
    result.categories += 1;
  }

  for (const row of rows(importData, "categories")) {
    const parentKey = value(row, "parent_category_key");
    const parent = parentKey === "" ? null : state.categories.get(parentKey);
    const category = await tx.category.update({
      where: { key: value(row, "category_key") },
      data: {
        parent: parent ? { connect: { id: parent.id } } : { disconnect: true }
      }
    });

    state.categories.set(value(row, "category_key"), category);
  }
}

async function importFamilies(tx, importData, state, result) {
  let sortOrder = 0;

  for (const row of rows(importData, "families")) {
    sortOrder += 10;

    const primaryCategory = state.categories.get(value(row, "primary_category_key"));
    const brand = state.brands.get(value(row, "brand_key"));
    const family = await tx.productFamily.upsert({
      where: { key: value(row, "family_key") },
      update: {
        brand: { connect: { id: brand.id } },
        primaryCategory: { connect: { id: primaryCategory.id } },
        name: value(row, "name"),
        slug: value(row, "slug"),
        description: nullIfBlank(value(row, "description")),
        sourceEvidence: nullIfBlank(value(row, "source_evidence")),
        sortOrder,
        isPublic: primaryCategory.v1PublicNavigation,
        isActive: true
      },
      create: {
        key: value(row, "family_key"),
        brand: { connect: { id: brand.id } },
        primaryCategory: { connect: { id: primaryCategory.id } },
        name: value(row, "name"),
        slug: value(row, "slug"),
        description: nullIfBlank(value(row, "description")),
        sourceEvidence: nullIfBlank(value(row, "source_evidence")),
        sortOrder,
        isPublic: primaryCategory.v1PublicNavigation,
        isActive: true
      }
    });

    state.families.set(value(row, "family_key"), family);
    result.families += 1;
  }
}

async function importProducts(tx, importData, state, result) {
  for (const row of rows(importData, "products")) {
    const family = state.families.get(value(row, "family_key"));
    const brand = state.brands.get(value(row, "brand_key"));
    const primaryCategory = state.categories.get(value(row, "primary_category_key"));
    const data = {
      family: { connect: { id: family.id } },
      brand: { connect: { id: brand.id } },
      primaryCategory: { connect: { id: primaryCategory.id } },
      name: value(row, "name"),
      slug: value(row, "slug"),
      sourceUrl: nullIfBlank(value(row, "source_url")),
      legacyPath: nullIfBlank(value(row, "legacy_path")),
      sku: nullIfBlank(value(row, "sku")),
      productKind: value(row, "product_kind"),
      status: value(row, "status"),
      v1PublicNavigation: asBoolean(row, "v1_public_navigation"),
      v1CheckoutScope: asBoolean(row, "v1_checkout_scope"),
      purchaseMode: value(row, "purchase_mode"),
      priceCents: optionalInteger(row, "price_cents"),
      currency: value(row, "currency"),
      shippingReviewRequired: asBoolean(row, "shipping_review_required"),
      shortDescription: nullIfBlank(value(row, "short_description")),
      description: nullIfBlank(value(row, "description")),
      sourceReviewStatus: value(row, "source_review_status"),
      importReviewStatus: value(row, "source_review_status"),
      notes: nullIfBlank(value(row, "notes"))
    };
    const product = await tx.product.upsert({
      where: { key: value(row, "product_key") },
      update: data,
      create: { key: value(row, "product_key"), ...data }
    });

    state.products.set(value(row, "product_key"), product);
    result.products += 1;
  }
}

async function importVariants(tx, importData, state, result) {
  for (const row of rows(importData, "variants")) {
    const product = state.products.get(value(row, "product_key"));
    const data = {
      product: { connect: { id: product.id } },
      sku: nullIfBlank(value(row, "sku")),
      name: nullIfBlank(value(row, "name")),
      priceCents: optionalInteger(row, "price_cents"),
      currency: value(row, "currency"),
      purchaseModeOverride: nullIfBlank(value(row, "purchase_mode_override")),
      isActive: asBoolean(row, "is_active"),
      sourceUrl: nullIfBlank(value(row, "source_url")),
      notes: nullIfBlank(value(row, "notes"))
    };
    const variant = await tx.productVariant.upsert({
      where: { key: value(row, "variant_key") },
      update: data,
      create: { key: value(row, "variant_key"), ...data }
    });

    await tx.productVariantOptionValue.deleteMany({
      where: { productVariantId: variant.id }
    });

    for (const optionPair of optionPairs(row)) {
      const option = await tx.productOption.upsert({
        where: {
          productId_name: {
            productId: product.id,
            name: optionPair.name
          }
        },
        update: {
          displayName: optionPair.name,
          sortOrder: optionPair.sortOrder,
          isRequired: true
        },
        create: {
          product: { connect: { id: product.id } },
          name: optionPair.name,
          displayName: optionPair.name,
          sortOrder: optionPair.sortOrder,
          isRequired: true
        }
      });
      const optionValue = await tx.productOptionValue.upsert({
        where: {
          optionId_value: {
            optionId: option.id,
            value: optionPair.value
          }
        },
        update: {
          label: optionPair.value,
          sortOrder: optionPair.sortOrder
        },
        create: {
          option: { connect: { id: option.id } },
          value: optionPair.value,
          label: optionPair.value,
          sortOrder: optionPair.sortOrder
        }
      });

      await tx.productVariantOptionValue.create({
        data: {
          productVariant: { connect: { id: variant.id } },
          productOptionValue: { connect: { id: optionValue.id } }
        }
      });

      result.optionRecords += 2;
    }

    state.variants.set(value(row, "variant_key"), variant);
    result.variants += 1;
  }
}

async function importMedia(tx, importData, state, result) {
  for (const row of rows(importData, "media")) {
    const sourceUrl = nullIfBlank(value(row, "source_url"));
    const cloudinarySecureUrl = nullIfBlank(value(row, "cloudinary_secure_url"));
    const product = state.products.get(value(row, "product_key"));
    const variantKey = value(row, "variant_key");
    const variant = variantKey === "" ? null : state.variants.get(variantKey);
    const mediaNotes = combineNotes([
      value(row, "notes"),
      prefixNote("Suggested Cloudinary folder", value(row, "suggested_cloudinary_folder")),
      prefixNote("Suggested final filename", value(row, "suggested_final_filename")),
      prefixNote("Source format", value(row, "format"))
    ]);
    const data = {
      product: { connect: { id: product.id } },
      role: value(row, "role"),
      cloudinaryPublicId: nullIfBlank(value(row, "cloudinary_public_id")),
      cloudinarySecureUrl,
      cloudinaryResourceType: null,
      cloudinaryFormat: null,
      width: optionalInteger(row, "width"),
      height: optionalInteger(row, "height"),
      sourceUrl,
      sourceProvider: sourceProviderForUrl(sourceUrl),
      altText: nullIfBlank(value(row, "alt_text")),
      title: nullIfBlank(value(row, "title")),
      caption: nullIfBlank(value(row, "caption")),
      sortOrder: asInteger(row, "sort_order"),
      isPrimary: asBoolean(row, "is_primary"),
      isPublic: Boolean(cloudinarySecureUrl),
      isActive: true,
      reviewStatus: cloudinarySecureUrl ? "approved" : "needs_review",
      notes: mediaNotes
    };

    await tx.productMedia.upsert({
      where: { mediaKey: value(row, "media_key") },
      update: {
        ...data,
        variant: variant ? { connect: { id: variant.id } } : { disconnect: true }
      },
      create: {
        mediaKey: value(row, "media_key"),
        ...data,
        ...(variant ? { variant: { connect: { id: variant.id } } } : {})
      }
    });

    result.media += 1;
  }
}

async function importReviewFlags(tx, importData, result) {
  for (const row of rows(importData, "flags")) {
    const sourceUrl = nullIfBlank(value(row, "source_url"));
    const data = {
      entityType: value(row, "entity_type"),
      entityKey: value(row, "entity_key"),
      sourceUrl,
      flag: value(row, "flag"),
      severity: value(row, "severity"),
      resolutionOwner: nullIfBlank(value(row, "resolution_owner")),
      resolutionStatus: value(row, "resolution_status"),
      notes: nullIfBlank(value(row, "notes"))
    };
    const existingFlag = await tx.importReviewFlag.findFirst({
      where: {
        entityType: data.entityType,
        entityKey: data.entityKey,
        sourceUrl,
        flag: data.flag
      }
    });

    if (existingFlag) {
      await tx.importReviewFlag.update({
        where: { id: existingFlag.id },
        data
      });
    } else {
      await tx.importReviewFlag.create({ data });
    }

    result.reviewFlags += 1;
  }
}

function printHelp() {
  console.log(`Tiger PingPong deployed catalog import v1

Dry-run planning command:
  DATABASE_URL=postgresql://... pnpm import:tiger:deployed -- ${CONFIRM_FLAG} --target=staging ${DRY_RUN_FLAG}

Actual write command:
  DATABASE_URL=postgresql://... pnpm import:tiger:deployed -- ${CONFIRM_FLAG} --target=staging ${WRITE_FLAG}

Targets:
  --target=staging
  --target=production

Safety:
  - Requires DATABASE_URL.
  - Requires ${CONFIRM_FLAG}.
  - Requires exactly one explicit target.
  - Requires exactly one mode: ${DRY_RUN_FLAG} or ${WRITE_FLAG}.
  - Runs pnpm validate:tiger-import before planning or writes.
  - Refuses to write when validation fails.
  - Opens no database connection in dry-run mode.
  - Skips redirect writes until URL structure is explicitly approved.
`);
}

function printSafetyRefusal(issues) {
  console.error("Tiger PingPong deployed catalog import refused to run.");
  console.error("No validator, database connection, or write path was opened.");

  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
}

function printBanner(safety) {
  console.log("Tiger PingPong deployed catalog import v1");
  console.log(`Target: ${safety.target}`);
  console.log(`Mode: ${safety.dryRun ? "dry run, no database connection" : "Prisma write"}`);
  console.log(`CSV source: ${relativePath(INPUT_DIR)}`);
  console.log("Validator: pnpm validate:tiger-import");
}

function printValidatorFailure(validator) {
  console.error("");
  console.error("Validator failed. Deployed import stopped before any database write.");

  if (validator.error) {
    console.error(`- ${validator.error.message}`);
  }

  if (validator.stdout) {
    console.error("");
    console.error(validator.stdout);
  }

  if (validator.stderr) {
    console.error("");
    console.error(validator.stderr);
  }
}

function printCsvFailure(issues) {
  console.error("");
  console.error("CSV planning failed after validator pass.");

  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
}

function printPlan(plan) {
  console.log("");
  console.log("Planned deployed catalog areas:");

  for (const filePlan of plan.filePlans) {
    const keySummary =
      filePlan.sampleKeys.length > 0 ? `; sample keys: ${filePlan.sampleKeys.join(", ")}` : "";
    const writeSummary = filePlan.writeMode === "skipped" ? "; deployed writes skipped" : "";
    console.log(
      `- ${filePlan.table}: ${filePlan.rowCount} reviewed CSV rows from ${filePlan.file}${keySummary}${writeSummary}`
    );
  }

  console.log(`- ${OPTION_TABLES.join(", ")}: refreshed from variant option columns`);
  console.log("");
  console.log("Writable affected-row summary:");
  console.log(`- brands: ${plan.writableRows.brands}`);
  console.log(`- categories: ${plan.writableRows.categories}`);
  console.log(`- product_families: ${plan.writableRows.families}`);
  console.log(`- products: ${plan.writableRows.products}`);
  console.log(`- product_variants: ${plan.writableRows.variants}`);
  console.log(`- product_media: ${plan.writableRows.media}`);
  console.log(`- import_review_flags: ${plan.writableRows.reviewFlags}`);
  console.log(
    `- redirects: ${plan.writableRows.redirectsSkipped} reviewed rows, skipped in deployed writes`
  );

  console.log("");
  console.log("Aqua planning snapshot:");
  console.log(
    `- Parent product: ${plan.aqua.productKey} (${plan.aqua.productSlug}), status=${plan.aqua.status}, purchase_mode=${plan.aqua.purchaseMode}`
  );
  console.log(`- Package options: ${plan.aqua.variantCount}`);

  for (const variant of plan.aqua.variants) {
    console.log(
      `  - ${variant.label}: ${variant.key}, sku=${variant.sku}, price_cents=${variant.priceCents}`
    );
  }

  console.log(
    `- Archived package product rows preserved for traceability: ${plan.aqua.archivedPackageProductKeys.join(", ")}`
  );
  console.log(
    `- Aqua source-only media rows with no Cloudinary secure URL: ${plan.aqua.sourceMediaRows}`
  );
  console.log(
    `- Draft redirect rows pointing at the Aqua parent product but skipped: ${plan.aqua.draftRedirectRows}`
  );
  console.log(`- Open Aqua review flags: ${plan.aqua.openReviewFlags}`);
}

function printWritePreflight(safety, importData, existing) {
  console.log("");
  console.log("Write preflight passed. About to write deployed catalog rows.");
  console.log(`Target: ${safety.target}`);
  console.log("Affected existing rows matched by stable keys before write:");
  console.log(
    `- brands: ${existing.brands} existing / ${rows(importData, "brands").length} reviewed`
  );
  console.log(
    `- categories: ${existing.categories} existing / ${rows(importData, "categories").length} reviewed`
  );
  console.log(
    `- product_families: ${existing.families} existing / ${rows(importData, "families").length} reviewed`
  );
  console.log(
    `- products: ${existing.products} existing / ${rows(importData, "products").length} reviewed`
  );
  console.log(
    `- product_variants: ${existing.variants} existing / ${rows(importData, "variants").length} reviewed`
  );
  console.log(
    `- product_media: ${existing.media} existing / ${rows(importData, "media").length} reviewed`
  );
  console.log(
    `- option links for imported variants: ${existing.optionLinksForImportedVariants} existing, refreshed per imported variant`
  );
  console.log(
    `- import_review_flags: ${existing.reviewFlags} existing / ${rows(importData, "flags").length} reviewed`
  );
  console.log(`- redirects: ${existing.redirectsSkipped} reviewed rows skipped`);
}

function printImportSummary(result) {
  console.log("");
  console.log("Deployed catalog import completed through Prisma.");
  console.log(`- brands upserted: ${result.brands}`);
  console.log(`- categories upserted: ${result.categories}`);
  console.log(`- product families upserted: ${result.families}`);
  console.log(`- products upserted: ${result.products}`);
  console.log(`- product variants upserted: ${result.variants}`);
  console.log(`- option/value/link records refreshed: ${result.optionRecords}`);
  console.log(`- product media upserted: ${result.media}`);
  console.log(`- import review flags upserted: ${result.reviewFlags}`);
  console.log(`- redirects skipped: ${result.redirects}`);
}

function rows(importData, fileId) {
  return importData.files.get(fileId)?.rows ?? [];
}

function stableKeys(importData, fileId, column) {
  return rows(importData, fileId)
    .map((row) => value(row, column))
    .filter((rowValue) => rowValue !== "");
}

function value(row, column) {
  return String(row[column] ?? "").trim();
}

function nullIfBlank(rowValue) {
  return rowValue === "" ? null : rowValue;
}

function asBoolean(row, column) {
  return value(row, column).toLowerCase() === "true";
}

function asInteger(row, column) {
  return Number.parseInt(value(row, column), 10);
}

function optionalInteger(row, column) {
  const rowValue = value(row, column);
  return rowValue === "" ? null : Number.parseInt(rowValue, 10);
}

function optionPairs(row) {
  return [
    {
      name: value(row, "option_1_name"),
      value: value(row, "option_1_value"),
      sortOrder: 10
    },
    {
      name: value(row, "option_2_name"),
      value: value(row, "option_2_value"),
      sortOrder: 20
    }
  ].filter((optionPair) => optionPair.name !== "" && optionPair.value !== "");
}

function prefixNote(label, noteValue) {
  return noteValue === "" ? null : `${label}: ${noteValue}`;
}

function combineNotes(noteParts) {
  const combined = noteParts.filter((notePart) => notePart && notePart !== "");
  return combined.length === 0 ? null : combined.join("\n");
}

function sourceProviderForUrl(sourceUrl) {
  if (!sourceUrl) {
    return "unknown";
  }

  return sourceUrl.includes("bigcommerce.com") ? "bigcommerce" : "unknown";
}

function pathFromUrl(sourceUrl) {
  if (!sourceUrl) {
    return null;
  }

  try {
    return new URL(sourceUrl).pathname;
  } catch {
    return null;
  }
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath);
}

function parseCsv(raw) {
  const text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      pushParsedRow(rows, row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    pushParsedRow(rows, row);
  }

  return rows;
}

function pushParsedRow(parsedRows, row) {
  if (row.some((field) => field.trim() !== "")) {
    parsedRows.push(row);
  }
}

main().catch((error) => {
  console.error("Tiger PingPong deployed catalog import failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
