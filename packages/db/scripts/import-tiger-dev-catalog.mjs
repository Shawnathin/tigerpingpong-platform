#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_DIR = path.resolve(SCRIPT_DIR, "..");
const REPO_ROOT = path.resolve(PACKAGE_DIR, "../..");
const INPUT_DIR = path.join(REPO_ROOT, "data/import-review/tigerpingpong/v1");
const TIGER_BRAND_KEY = "tiger-pingpong";
const CONFIRM_FLAG = "--confirm-dev-import";
const DRY_RUN_FLAG = "--dry-run";
const HELP_FLAG = "--help";

const PRODUCT_KINDS = new Set([
  "table",
  "paddle",
  "ball",
  "net",
  "cover",
  "accessory",
  "replacement_part"
]);
const PRODUCT_STATUSES = new Set(["draft", "active", "archived"]);
const PURCHASE_MODES = new Set([
  "online_checkout_candidate",
  "online_checkout",
  "quote_required",
  "dealer_contact",
  "needs_manual_review",
  "deferred_from_v1",
  "coming_soon",
  "disabled"
]);
const SOURCE_REVIEW_STATUSES = new Set([
  "needs_review",
  "approved_for_schema_planning",
  "deferred"
]);
const MEDIA_ROLES = new Set([
  "primary",
  "gallery",
  "detail",
  "lifestyle",
  "variant",
  "source_reference"
]);
const REDIRECT_STATUSES = new Set(["draft", "approved", "deferred"]);
const REVIEW_SEVERITIES = new Set(["info", "medium", "high", "blocker"]);
const REVIEW_RESOLUTION_STATUSES = new Set([
  "open",
  "resolved",
  "deferred"
]);

const FILE_CONFIGS = [
  {
    id: "brands",
    file: "brands_import_v1.csv",
    keyColumn: "brand_key",
    requiredColumns: [
      "brand_key",
      "name",
      "slug",
      "source_evidence",
      "is_active",
      "notes"
    ],
    requiredValueColumns: ["brand_key", "name", "slug", "is_active"],
    booleanColumns: ["is_active"],
    uniqueColumns: ["brand_key", "slug"]
  },
  {
    id: "categories",
    file: "categories_import_v1.csv",
    keyColumn: "category_key",
    requiredColumns: [
      "category_key",
      "parent_category_key",
      "name",
      "slug",
      "description",
      "sort_order",
      "v1_public_navigation",
      "v1_checkout_scope",
      "source_url",
      "notes"
    ],
    requiredValueColumns: [
      "category_key",
      "name",
      "slug",
      "sort_order",
      "v1_public_navigation",
      "v1_checkout_scope"
    ],
    booleanColumns: ["v1_public_navigation", "v1_checkout_scope"],
    integerColumns: ["sort_order"],
    uniqueColumns: ["category_key", "slug"]
  },
  {
    id: "families",
    file: "product_families_import_v1.csv",
    keyColumn: "family_key",
    requiredColumns: [
      "family_key",
      "brand_key",
      "primary_category_key",
      "name",
      "slug",
      "description",
      "source_evidence",
      "notes"
    ],
    requiredValueColumns: [
      "family_key",
      "brand_key",
      "primary_category_key",
      "name",
      "slug"
    ],
    uniqueColumns: ["family_key", "slug"]
  },
  {
    id: "products",
    file: "products_import_v1.csv",
    keyColumn: "product_key",
    requiredColumns: [
      "product_key",
      "family_key",
      "brand_key",
      "primary_category_key",
      "name",
      "slug",
      "source_url",
      "legacy_path",
      "sku",
      "product_kind",
      "status",
      "v1_public_navigation",
      "v1_checkout_scope",
      "purchase_mode",
      "price_cents",
      "currency",
      "shipping_review_required",
      "short_description",
      "description",
      "source_review_status",
      "notes"
    ],
    requiredValueColumns: [
      "product_key",
      "family_key",
      "brand_key",
      "primary_category_key",
      "name",
      "slug",
      "source_url",
      "legacy_path",
      "product_kind",
      "status",
      "v1_public_navigation",
      "v1_checkout_scope",
      "purchase_mode",
      "currency",
      "shipping_review_required",
      "source_review_status"
    ],
    booleanColumns: [
      "v1_public_navigation",
      "v1_checkout_scope",
      "shipping_review_required"
    ],
    integerColumns: ["price_cents"],
    enumColumns: {
      product_kind: PRODUCT_KINDS,
      status: PRODUCT_STATUSES,
      purchase_mode: PURCHASE_MODES,
      source_review_status: SOURCE_REVIEW_STATUSES
    },
    uniqueColumns: ["product_key", "slug"]
  },
  {
    id: "variants",
    file: "product_variants_import_v1.csv",
    keyColumn: "variant_key",
    requiredColumns: [
      "variant_key",
      "product_key",
      "sku",
      "name",
      "option_1_name",
      "option_1_value",
      "option_2_name",
      "option_2_value",
      "price_cents",
      "currency",
      "purchase_mode_override",
      "is_active",
      "source_url",
      "notes"
    ],
    requiredValueColumns: [
      "variant_key",
      "product_key",
      "currency",
      "is_active",
      "source_url"
    ],
    booleanColumns: ["is_active"],
    integerColumns: ["price_cents"],
    enumColumns: {
      purchase_mode_override: PURCHASE_MODES
    },
    uniqueColumns: ["variant_key"]
  },
  {
    id: "media",
    file: "product_media_import_v1.csv",
    keyColumn: "media_key",
    requiredColumns: [
      "media_key",
      "product_key",
      "variant_key",
      "source_url",
      "cloudinary_public_id",
      "cloudinary_secure_url",
      "suggested_cloudinary_folder",
      "suggested_final_filename",
      "alt_text",
      "title",
      "caption",
      "width",
      "height",
      "format",
      "role",
      "sort_order",
      "is_primary",
      "notes"
    ],
    requiredValueColumns: [
      "media_key",
      "product_key",
      "source_url",
      "role",
      "sort_order",
      "is_primary"
    ],
    booleanColumns: ["is_primary"],
    integerColumns: ["width", "height", "sort_order"],
    enumColumns: {
      role: MEDIA_ROLES
    },
    uniqueColumns: ["media_key"]
  },
  {
    id: "redirects",
    file: "redirects_draft_v1.csv",
    keyColumn: "legacy_path",
    requiredColumns: [
      "legacy_path",
      "new_path_candidate",
      "entity_type",
      "entity_key",
      "redirect_status",
      "notes"
    ],
    requiredValueColumns: [
      "legacy_path",
      "new_path_candidate",
      "entity_type",
      "redirect_status"
    ],
    enumColumns: {
      redirect_status: REDIRECT_STATUSES
    },
    uniqueColumns: ["legacy_path"]
  },
  {
    id: "flags",
    file: "import_review_flags_v1.csv",
    keyColumn: null,
    requiredColumns: [
      "entity_type",
      "entity_key",
      "source_url",
      "flag",
      "severity",
      "resolution_owner",
      "resolution_status",
      "notes"
    ],
    requiredValueColumns: [
      "entity_type",
      "entity_key",
      "flag",
      "severity",
      "resolution_status"
    ],
    enumColumns: {
      severity: REVIEW_SEVERITIES,
      resolution_status: REVIEW_RESOLUTION_STATUSES
    },
    uniqueColumns: []
  }
];

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

  printDevBanner(safety.dryRun);

  const importData = loadImportData();

  if (importData.issues.length > 0) {
    printValidationFailure(importData.issues);
    process.exitCode = 1;
    return;
  }

  if (safety.dryRun) {
    printDryRunSummary(importData);
    return;
  }

  const result = await runPrismaImport(importData);
  printImportSummary(result);
}

function validateSafety(args) {
  const issues = [];
  const allowedFlags = new Set(["--", CONFIRM_FLAG, DRY_RUN_FLAG]);

  for (const arg of args) {
    if (!allowedFlags.has(arg)) {
      issues.push(`Unknown argument: ${arg}`);
    }
  }

  if (!process.env.DATABASE_URL) {
    issues.push("DATABASE_URL is required.");
  }

  if (!args.includes(CONFIRM_FLAG)) {
    issues.push(`Explicit dev confirmation flag is required: ${CONFIRM_FLAG}`);
  }

  if (process.env.NODE_ENV === "production") {
    issues.push("NODE_ENV=production is not allowed for this dev import.");
  }

  if (process.env.VERCEL_ENV === "production") {
    issues.push("VERCEL_ENV=production is not allowed for this dev import.");
  }

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const normalizedDatabaseUrl = databaseUrl.toLowerCase();

  if (/(^|[^a-z])prod(uction)?([^a-z]|$)/.test(normalizedDatabaseUrl)) {
    issues.push(
      "DATABASE_URL appears to reference production. Refusing to import."
    );
  }

  return {
    dryRun: args.includes(DRY_RUN_FLAG),
    issues
  };
}

function printHelp() {
  console.log(`Tiger PingPong DEV catalog import v1

Development-only command:
  pnpm import:tiger:dev -- ${CONFIRM_FLAG}

Dry run without opening a database connection:
  DATABASE_URL=postgresql://dev-placeholder.invalid/tigerpingpong_platform_dev pnpm import:tiger:dev -- ${CONFIRM_FLAG} ${DRY_RUN_FLAG}

Safety:
  - Requires DATABASE_URL.
  - Requires ${CONFIRM_FLAG}.
  - Refuses production-like environment signals.
  - Reads only data/import-review/tigerpingpong/v1/.
`);
}

function printSafetyRefusal(issues) {
  console.error("Tiger PingPong DEV catalog import refused to run.");
  console.error("This command is development-only and did not open Prisma.");

  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
}

function printDevBanner(isDryRun) {
  console.log("Tiger PingPong DEV catalog import v1");
  console.log("Target: development database only.");
  console.log(`Mode: ${isDryRun ? "dry run, no database connection" : "Prisma import"}`);
  console.log(`CSV source: ${relativePath(INPUT_DIR)}`);
}

function loadImportData() {
  const issues = [];
  const files = new Map();

  if (!relativePath(INPUT_DIR).startsWith("data/import-review/")) {
    issues.push({
      file: relativePath(INPUT_DIR),
      message: "Importer input directory must stay under data/import-review/."
    });
  }

  if (relativePath(INPUT_DIR).startsWith("var/scrapes/")) {
    issues.push({
      file: relativePath(INPUT_DIR),
      message: "Importer must not read generated scrape output from var/scrapes/."
    });
  }

  for (const config of FILE_CONFIGS) {
    files.set(config.id, loadCsvFile(config, issues));
  }

  validateCsvRows(files, issues);

  return {
    files,
    issues
  };
}

function loadCsvFile(config, issues) {
  const filePath = path.join(INPUT_DIR, config.file);
  const fileInfo = {
    config,
    path: filePath,
    relativePath: relativePath(filePath),
    headers: [],
    rows: [],
    index: new Map()
  };

  if (!fs.existsSync(filePath)) {
    issues.push({
      file: fileInfo.relativePath,
      message: `Expected CSV file is missing: ${config.file}`
    });
    return fileInfo;
  }

  const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));

  if (parsed.length === 0) {
    issues.push({
      file: fileInfo.relativePath,
      message: `Expected CSV file is empty: ${config.file}`
    });
    return fileInfo;
  }

  fileInfo.headers = parsed[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  );

  fileInfo.rows = parsed.slice(1).map((values, index) => {
    const row = {};

    for (const [headerIndex, header] of fileInfo.headers.entries()) {
      row[header] = values[headerIndex] ?? "";
    }

    row.__rowNumber = index + 2;
    row.__extraValues = values.slice(fileInfo.headers.length);
    return row;
  });

  validateHeaderShape(fileInfo, issues);
  return fileInfo;
}

function validateHeaderShape(fileInfo, issues) {
  const headerSet = new Set(fileInfo.headers);
  const duplicateHeaders = fileInfo.headers.filter(
    (header, index) => fileInfo.headers.indexOf(header) !== index
  );

  for (const header of new Set(duplicateHeaders)) {
    issues.push({
      file: fileInfo.relativePath,
      message: `Column appears more than once: ${header}`
    });
  }

  for (const column of fileInfo.config.requiredColumns) {
    if (!headerSet.has(column)) {
      issues.push({
        file: fileInfo.relativePath,
        message: `Required column is missing: ${column}`
      });
    }
  }

  for (const row of fileInfo.rows) {
    if (row.__extraValues.length > 0) {
      issues.push({
        file: fileInfo.relativePath,
        row: row.__rowNumber,
        message: "CSV row has more values than the header defines."
      });
    }
  }
}

function validateCsvRows(files, issues) {
  for (const fileInfo of files.values()) {
    validateRequiredValues(fileInfo, issues);
    validateTypedValues(fileInfo, issues);
    validateEnumValues(fileInfo, issues);
    buildFileIndex(fileInfo, issues);
    validateUniqueColumns(fileInfo, issues);
  }

  validateReferences(files, issues);
  validateBusinessRules(files, issues);
}

function validateRequiredValues(fileInfo, issues) {
  for (const row of fileInfo.rows) {
    for (const column of fileInfo.config.requiredValueColumns) {
      if (value(row, column) === "") {
        issues.push({
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          message: `Required value is blank: ${column}`
        });
      }
    }
  }
}

function validateTypedValues(fileInfo, issues) {
  for (const row of fileInfo.rows) {
    for (const column of fileInfo.config.booleanColumns ?? []) {
      if (value(row, column) !== "" && !isBooleanText(value(row, column))) {
        issues.push({
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          message: `Column must be true or false: ${column}`
        });
      }
    }

    for (const column of fileInfo.config.integerColumns ?? []) {
      if (value(row, column) !== "" && !isIntegerText(value(row, column))) {
        issues.push({
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          message: `Column must be an integer: ${column}`
        });
      }
    }
  }
}

function validateEnumValues(fileInfo, issues) {
  for (const row of fileInfo.rows) {
    for (const [column, allowedValues] of Object.entries(
      fileInfo.config.enumColumns ?? {}
    )) {
      const rowValue = value(row, column);

      if (rowValue !== "" && !allowedValues.has(rowValue)) {
        issues.push({
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          message: `Column ${column} has an unsupported enum value: ${rowValue}`
        });
      }
    }
  }
}

function buildFileIndex(fileInfo, issues) {
  const { keyColumn } = fileInfo.config;

  if (!keyColumn) {
    return;
  }

  for (const row of fileInfo.rows) {
    const rowKey = value(row, keyColumn);

    if (rowKey === "") {
      continue;
    }

    if (fileInfo.index.has(rowKey)) {
      issues.push({
        file: fileInfo.relativePath,
        row: row.__rowNumber,
        message: `Duplicate stable key: ${rowKey}`
      });
      continue;
    }

    fileInfo.index.set(rowKey, row);
  }
}

function validateUniqueColumns(fileInfo, issues) {
  for (const column of fileInfo.config.uniqueColumns) {
    const seen = new Map();

    for (const row of fileInfo.rows) {
      const rowValue = value(row, column);

      if (rowValue === "") {
        continue;
      }

      if (seen.has(rowValue)) {
        issues.push({
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          message: `Duplicate unique value in ${column}: ${rowValue}`
        });
      } else {
        seen.set(rowValue, row);
      }
    }
  }
}

function validateReferences(files, issues) {
  const brands = files.get("brands");
  const categories = files.get("categories");
  const families = files.get("families");
  const products = files.get("products");
  const variants = files.get("variants");
  const media = files.get("media");
  const redirects = files.get("redirects");

  for (const row of categories.rows) {
    const parentKey = value(row, "parent_category_key");

    if (parentKey !== "" && !categories.index.has(parentKey)) {
      addReferenceIssue(categories, row, "parent_category_key", parentKey, issues);
    }
  }

  for (const row of families.rows) {
    requireIndexedValue(families, row, "brand_key", brands, issues);
    requireIndexedValue(
      families,
      row,
      "primary_category_key",
      categories,
      issues
    );
  }

  for (const row of products.rows) {
    requireIndexedValue(products, row, "family_key", families, issues);
    requireIndexedValue(products, row, "brand_key", brands, issues);
    requireIndexedValue(
      products,
      row,
      "primary_category_key",
      categories,
      issues
    );
  }

  for (const row of variants.rows) {
    requireIndexedValue(variants, row, "product_key", products, issues);
    validateOptionPair(variants, row, 1, issues);
    validateOptionPair(variants, row, 2, issues);
  }

  for (const row of media.rows) {
    requireIndexedValue(media, row, "product_key", products, issues);

    const variantKey = value(row, "variant_key");

    if (variantKey !== "" && !variants.index.has(variantKey)) {
      addReferenceIssue(media, row, "variant_key", variantKey, issues);
    }
  }

  for (const row of redirects.rows) {
    const entityType = value(row, "entity_type");
    const entityKey = value(row, "entity_key");

    if (entityType === "product" && !products.index.has(entityKey)) {
      addReferenceIssue(redirects, row, "entity_key", entityKey, issues);
    }

    if (entityType === "category" && !categories.index.has(entityKey)) {
      addReferenceIssue(redirects, row, "entity_key", entityKey, issues);
    }
  }
}

function requireIndexedValue(sourceFile, row, column, targetFile, issues) {
  const rowValue = value(row, column);

  if (rowValue !== "" && !targetFile.index.has(rowValue)) {
    addReferenceIssue(sourceFile, row, column, rowValue, issues);
  }
}

function addReferenceIssue(fileInfo, row, column, rowValue, issues) {
  issues.push({
    file: fileInfo.relativePath,
    row: row.__rowNumber,
    message: `Reference in ${column} does not exist in reviewed CSVs: ${rowValue}`
  });
}

function validateOptionPair(fileInfo, row, number, issues) {
  const nameColumn = `option_${number}_name`;
  const valueColumn = `option_${number}_value`;
  const optionName = value(row, nameColumn);
  const optionValue = value(row, valueColumn);

  if (optionName !== "" && optionValue === "") {
    issues.push({
      file: fileInfo.relativePath,
      row: row.__rowNumber,
      message: `${valueColumn} is required when ${nameColumn} is populated.`
    });
  }

  if (optionName === "" && optionValue !== "") {
    issues.push({
      file: fileInfo.relativePath,
      row: row.__rowNumber,
      message: `${nameColumn} is required when ${valueColumn} is populated.`
    });
  }
}

function validateBusinessRules(files, issues) {
  const brands = files.get("brands");
  const categories = files.get("categories");
  const products = files.get("products");
  const media = files.get("media");

  if (brands.rows.length !== 1 || value(brands.rows[0], "brand_key") !== TIGER_BRAND_KEY) {
    issues.push({
      file: brands.relativePath,
      message: `V1 import must contain exactly one brand: ${TIGER_BRAND_KEY}`
    });
  }

  const replacementPartsCategory = categories.index.get("replacement-parts");

  if (
    replacementPartsCategory &&
    (asBoolean(replacementPartsCategory, "v1_public_navigation") ||
      asBoolean(replacementPartsCategory, "v1_checkout_scope"))
  ) {
    issues.push({
      file: categories.relativePath,
      row: replacementPartsCategory.__rowNumber,
      message:
        "Replacement Parts category must stay out of v1 public navigation and checkout."
    });
  }

  for (const row of products.rows) {
    const productKind = value(row, "product_kind");
    const primaryCategoryKey = value(row, "primary_category_key");
    const purchaseMode = value(row, "purchase_mode");

    if (
      productKind === "replacement_part" ||
      primaryCategoryKey === "replacement-parts"
    ) {
      if (asBoolean(row, "v1_public_navigation")) {
        issues.push({
          file: products.relativePath,
          row: row.__rowNumber,
          message: "Replacement Parts must not be public in v1 navigation."
        });
      }

      if (asBoolean(row, "v1_checkout_scope")) {
        issues.push({
          file: products.relativePath,
          row: row.__rowNumber,
          message: "Replacement Parts must not be checkout-enabled in v1."
        });
      }

      if (purchaseMode !== "deferred_from_v1") {
        issues.push({
          file: products.relativePath,
          row: row.__rowNumber,
          message: "Replacement Parts must use purchase_mode=deferred_from_v1."
        });
      }
    }

    if (productKind === "table") {
      if (!asBoolean(row, "shipping_review_required")) {
        issues.push({
          file: products.relativePath,
          row: row.__rowNumber,
          message:
            "Table products must keep shipping_review_required=true before public checkout."
        });
      }

      if (purchaseMode === "online_checkout") {
        issues.push({
          file: products.relativePath,
          row: row.__rowNumber,
          message:
            "Table products must not be imported as fully checkout-ready."
        });
      }
    }
  }

  for (const row of media.rows) {
    if (value(row, "cloudinary_secure_url") !== "") {
      issues.push({
        file: media.relativePath,
        row: row.__rowNumber,
        message:
          "cloudinary_secure_url must stay blank until an explicit Cloudinary upload task."
      });
    }
  }
}

async function runPrismaImport(importData) {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
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

        await importBrands(tx, importData, state, result);
        await importCategories(tx, importData, state, result);
        await importFamilies(tx, importData, state, result);
        await importProducts(tx, importData, state, result);
        await importVariants(tx, importData, state, result);
        await importMedia(tx, importData, state, result);
        await importRedirects(tx, importData, result);
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

function createImportResult() {
  return {
    brands: 0,
    categories: 0,
    families: 0,
    products: 0,
    variants: 0,
    optionRecords: 0,
    media: 0,
    redirects: 0,
    reviewFlags: 0
  };
}

async function importBrands(tx, importData, state, result) {
  for (const row of rows(importData, "brands")) {
    const brand = await tx.brand.upsert({
      where: {
        key: value(row, "brand_key")
      },
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
      where: {
        key: value(row, "category_key")
      },
      update: {
        name: value(row, "name"),
        slug: value(row, "slug"),
        description: nullIfBlank(value(row, "description")),
        sortOrder: asInteger(row, "sort_order"),
        v1PublicNavigation: asBoolean(row, "v1_public_navigation"),
        v1CheckoutScope: asBoolean(row, "v1_checkout_scope"),
        sourceUrl,
        legacyPath: pathFromUrl(sourceUrl),
        notes: nullIfBlank(value(row, "notes")),
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
        notes: nullIfBlank(value(row, "notes")),
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
      where: {
        key: value(row, "category_key")
      },
      data: {
        parent: parent
          ? {
              connect: {
                id: parent.id
              }
            }
          : {
              disconnect: true
            }
      }
    });

    state.categories.set(value(row, "category_key"), category);
  }
}

async function importFamilies(tx, importData, state, result) {
  let sortOrder = 0;

  for (const row of rows(importData, "families")) {
    sortOrder += 10;

    const primaryCategory = state.categories.get(
      value(row, "primary_category_key")
    );
    const brand = state.brands.get(value(row, "brand_key"));
    const family = await tx.productFamily.upsert({
      where: {
        key: value(row, "family_key")
      },
      update: {
        brand: {
          connect: {
            id: brand.id
          }
        },
        primaryCategory: {
          connect: {
            id: primaryCategory.id
          }
        },
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
        brand: {
          connect: {
            id: brand.id
          }
        },
        primaryCategory: {
          connect: {
            id: primaryCategory.id
          }
        },
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
    const primaryCategory = state.categories.get(
      value(row, "primary_category_key")
    );
    const product = await tx.product.upsert({
      where: {
        key: value(row, "product_key")
      },
      update: {
        family: {
          connect: {
            id: family.id
          }
        },
        brand: {
          connect: {
            id: brand.id
          }
        },
        primaryCategory: {
          connect: {
            id: primaryCategory.id
          }
        },
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
      },
      create: {
        key: value(row, "product_key"),
        family: {
          connect: {
            id: family.id
          }
        },
        brand: {
          connect: {
            id: brand.id
          }
        },
        primaryCategory: {
          connect: {
            id: primaryCategory.id
          }
        },
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
      }
    });

    state.products.set(value(row, "product_key"), product);
    result.products += 1;
  }
}

async function importVariants(tx, importData, state, result) {
  for (const row of rows(importData, "variants")) {
    const product = state.products.get(value(row, "product_key"));
    const variant = await tx.productVariant.upsert({
      where: {
        key: value(row, "variant_key")
      },
      update: {
        product: {
          connect: {
            id: product.id
          }
        },
        sku: nullIfBlank(value(row, "sku")),
        name: nullIfBlank(value(row, "name")),
        priceCents: optionalInteger(row, "price_cents"),
        currency: value(row, "currency"),
        purchaseModeOverride: nullIfBlank(value(row, "purchase_mode_override")),
        isActive: asBoolean(row, "is_active"),
        sourceUrl: nullIfBlank(value(row, "source_url")),
        notes: nullIfBlank(value(row, "notes"))
      },
      create: {
        key: value(row, "variant_key"),
        product: {
          connect: {
            id: product.id
          }
        },
        sku: nullIfBlank(value(row, "sku")),
        name: nullIfBlank(value(row, "name")),
        priceCents: optionalInteger(row, "price_cents"),
        currency: value(row, "currency"),
        purchaseModeOverride: nullIfBlank(value(row, "purchase_mode_override")),
        isActive: asBoolean(row, "is_active"),
        sourceUrl: nullIfBlank(value(row, "source_url")),
        notes: nullIfBlank(value(row, "notes"))
      }
    });

    await tx.productVariantOptionValue.deleteMany({
      where: {
        productVariantId: variant.id
      }
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
          product: {
            connect: {
              id: product.id
            }
          },
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
          option: {
            connect: {
              id: option.id
            }
          },
          value: optionPair.value,
          label: optionPair.value,
          sortOrder: optionPair.sortOrder
        }
      });

      await tx.productVariantOptionValue.create({
        data: {
          productVariant: {
            connect: {
              id: variant.id
            }
          },
          productOptionValue: {
            connect: {
              id: optionValue.id
            }
          }
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
    const product = state.products.get(value(row, "product_key"));
    const variantKey = value(row, "variant_key");
    const variant = variantKey === "" ? null : state.variants.get(variantKey);
    const mediaNotes = combineNotes([
      value(row, "notes"),
      prefixNote("Suggested Cloudinary folder", value(row, "suggested_cloudinary_folder")),
      prefixNote("Suggested final filename", value(row, "suggested_final_filename")),
      prefixNote("Source format", value(row, "format"))
    ]);

    await tx.productMedia.upsert({
      where: {
        mediaKey: value(row, "media_key")
      },
      update: {
        product: {
          connect: {
            id: product.id
          }
        },
        variant: variant
          ? {
              connect: {
                id: variant.id
              }
            }
          : {
              disconnect: true
            },
        role: value(row, "role"),
        cloudinaryPublicId: nullIfBlank(value(row, "cloudinary_public_id")),
        cloudinarySecureUrl: null,
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
        isPublic: false,
        isActive: true,
        reviewStatus: "needs_review",
        notes: mediaNotes
      },
      create: {
        mediaKey: value(row, "media_key"),
        product: {
          connect: {
            id: product.id
          }
        },
        ...(variant
          ? {
              variant: {
                connect: {
                  id: variant.id
                }
              }
            }
          : {}),
        role: value(row, "role"),
        cloudinaryPublicId: nullIfBlank(value(row, "cloudinary_public_id")),
        cloudinarySecureUrl: null,
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
        isPublic: false,
        isActive: true,
        reviewStatus: "needs_review",
        notes: mediaNotes
      }
    });

    result.media += 1;
  }
}

async function importRedirects(tx, importData, result) {
  for (const row of rows(importData, "redirects")) {
    await tx.redirect.upsert({
      where: {
        legacyPath: value(row, "legacy_path")
      },
      update: {
        newPathCandidate: value(row, "new_path_candidate"),
        entityType: value(row, "entity_type"),
        entityKey: nullIfBlank(value(row, "entity_key")),
        redirectStatus: value(row, "redirect_status"),
        notes: nullIfBlank(value(row, "notes"))
      },
      create: {
        legacyPath: value(row, "legacy_path"),
        newPathCandidate: value(row, "new_path_candidate"),
        entityType: value(row, "entity_type"),
        entityKey: nullIfBlank(value(row, "entity_key")),
        redirectStatus: value(row, "redirect_status"),
        notes: nullIfBlank(value(row, "notes"))
      }
    });

    result.redirects += 1;
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
        where: {
          id: existingFlag.id
        },
        data
      });
    } else {
      await tx.importReviewFlag.create({
        data
      });
    }

    result.reviewFlags += 1;
  }
}

function rows(importData, fileId) {
  return importData.files.get(fileId).rows;
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

function isBooleanText(rowValue) {
  return rowValue === "true" || rowValue === "false";
}

function isIntegerText(rowValue) {
  return /^-?\d+$/.test(rowValue);
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

function printValidationFailure(issues) {
  console.error("Reviewed CSV validation failed. No database connection opened.");

  for (const issue of issues) {
    const rowText = issue.row ? `:${issue.row}` : "";
    console.error(`- ${issue.file}${rowText} ${issue.message}`);
  }
}

function printDryRunSummary(importData) {
  console.log("Dry run passed. No database connection was opened.");
  console.log("Reviewed CSV row counts:");

  for (const config of FILE_CONFIGS) {
    console.log(`- ${config.file}: ${rows(importData, config.id).length}`);
  }
}

function printImportSummary(result) {
  console.log("DEV catalog import completed through Prisma.");
  console.log(`- brands: ${result.brands}`);
  console.log(`- categories: ${result.categories}`);
  console.log(`- product families: ${result.families}`);
  console.log(`- products: ${result.products}`);
  console.log(`- product variants: ${result.variants}`);
  console.log(`- option/value/link records touched: ${result.optionRecords}`);
  console.log(`- product media: ${result.media}`);
  console.log(`- redirects: ${result.redirects}`);
  console.log(`- import review flags: ${result.reviewFlags}`);
}

main().catch((error) => {
  console.error("Tiger PingPong DEV catalog import failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
