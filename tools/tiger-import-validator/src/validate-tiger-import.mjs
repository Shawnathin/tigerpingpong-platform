#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "../../..");
const INPUT_DIR = process.env.TIGER_IMPORT_INPUT_DIR
  ? path.resolve(process.env.TIGER_IMPORT_INPUT_DIR)
  : path.join(REPO_ROOT, "data/import-review/tigerpingpong/v1");
const OUTPUT_DIR = process.env.TIGER_IMPORT_OUTPUT_DIR
  ? path.resolve(process.env.TIGER_IMPORT_OUTPUT_DIR)
  : path.join(REPO_ROOT, "var/import-validation/tigerpingpong/latest");
const SCHEMA_PATH = path.join(REPO_ROOT, "packages/db/prisma/schema.prisma");
const TIGER_BRAND_KEY = "tiger-pingpong";
const CLOUDINARY_DELIVERY_HOST = "res.cloudinary.com";
const ACCEPTED_CLOUDINARY_FOLDER_PREFIXES = [
  "tigerpingpong/products/",
  "tiger-pingpong/products/",
  "tigerpingpong/replacement-parts/",
  "tiger-pingpong/replacement-parts/"
];

const EXPECTED_FILES = [
  {
    id: "brands",
    file: "brands_import_v1.csv",
    entityType: "brand",
    keyColumn: "brand_key",
    requiredColumns: ["brand_key", "name", "slug", "source_evidence", "is_active", "notes"],
    requiredValueColumns: ["brand_key", "name", "slug", "is_active"],
    booleanColumns: ["is_active"],
    uniqueColumns: ["brand_key", "slug"]
  },
  {
    id: "categories",
    file: "categories_import_v1.csv",
    entityType: "category",
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
    entityType: "family",
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
    requiredValueColumns: ["family_key", "brand_key", "primary_category_key", "name", "slug"],
    uniqueColumns: ["family_key", "slug"]
  },
  {
    id: "products",
    file: "products_import_v1.csv",
    entityType: "product",
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
    booleanColumns: ["v1_public_navigation", "v1_checkout_scope", "shipping_review_required"],
    integerColumns: ["price_cents"],
    uniqueColumns: ["product_key", "slug"]
  },
  {
    id: "variants",
    file: "product_variants_import_v1.csv",
    entityType: "variant",
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
    requiredValueColumns: ["variant_key", "product_key", "currency", "is_active", "source_url"],
    booleanColumns: ["is_active"],
    integerColumns: ["price_cents"],
    uniqueColumns: ["variant_key"]
  },
  {
    id: "media",
    file: "product_media_import_v1.csv",
    entityType: "media",
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
    uniqueColumns: ["media_key"]
  },
  {
    id: "redirects",
    file: "redirects_launch_v1.csv",
    entityType: "redirect",
    keyColumn: "legacy_path",
    requiredColumns: [
      "legacy_path",
      "new_path_candidate",
      "entity_type",
      "entity_key",
      "redirect_status",
      "notes"
    ],
    requiredValueColumns: ["legacy_path", "new_path_candidate", "entity_type", "redirect_status"],
    uniqueColumns: ["legacy_path"]
  },
  {
    id: "flags",
    file: "import_review_flags_v1.csv",
    entityType: "review_flag",
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
    requiredValueColumns: ["entity_type", "entity_key", "flag", "severity", "resolution_status"],
    uniqueColumns: []
  }
];

const REQUIRED_CATEGORY_KEYS = [
  "tables",
  "indoor-tables",
  "outdoor-tables",
  "accessories",
  "paddles",
  "balls",
  "nets",
  "covers",
  "replacement-parts"
];

const FLAG_SEVERITIES = new Set(["info", "medium", "high", "blocker"]);
const FLAG_STATUSES = new Set(["open", "resolved", "deferred"]);
const OPEN_REVIEW_FLAGS = new Set([
  "table_shipping_policy_required",
  "cloudinary_upload_required",
  "checkout_policy_required",
  "source_url_review_required",
  "resource_article_crawl_required"
]);

const CONFIRMED_PRODUCT_VALUES = new Map([
  [
    "tiger-aqua-outdoor-paddle-pack-4",
    {
      sku: "15888",
      priceCents: "8000"
    }
  ],
  [
    "tiger-aqua-outdoor-paddle-pack-2",
    {
      sku: "15889",
      priceCents: "4500"
    }
  ],
  [
    "tiger-aqua-single-coral",
    {
      sku: "15891",
      priceCents: "2500"
    }
  ],
  [
    "tiger-aqua-single-ocean-blue",
    {
      sku: "15890",
      priceCents: "2500"
    }
  ],
  [
    "tiger-net-post-set",
    {
      sku: "6989-B",
      priceCents: "5900",
      checkoutReady: true
    }
  ],
  [
    "tiger-pingpong-replacement-part-40",
    {
      sku: "8123",
      priceCents: "700",
      checkoutReady: true,
      allowDeferredRollback: true
    }
  ]
]);

const VICE_PACKAGE_RULES = {
  productKey: "tiger-vice-paddle",
  singleVariantKey: "tiger-vice-package-single",
  singleLabel: "Single Vice Paddle",
  singleOptionValue: "single-vice-paddle",
  bundleVariantKey: "tiger-vice-package-4-pack-6-white-balls",
  bundleLabel: "4 Vice paddles + 6 white balls",
  bundleOptionValue: "4-vice-paddles-6-white-balls",
  optionName: "Package Options",
  whiteBallsProductKey: "tiger-premium-balls-6-white",
  whiteBallsSku: "9157",
  blockerFlag: "owner_sku_required"
};
const FORBIDDEN_OPERATIONAL_SKUS = new Set([
  "N/A",
  "NA",
  "NONE",
  "PENDING",
  "PLACEHOLDER",
  "TBD",
  "TEMP",
  "TEST",
  "TODO",
  "UNKNOWN"
]);

const SCHEMA_ENUMS = {
  ProductKind: "product_kind",
  ProductStatus: "status",
  PurchaseMode: "purchase_mode",
  SourceReviewStatus: "source_review_status",
  MediaRole: "role",
  RedirectStatus: "redirect_status"
};

const issues = [];
const csvFiles = new Map();
const indexes = new Map();

function main() {
  const schemaEnums = loadSchemaEnums();

  for (const config of EXPECTED_FILES) {
    loadCsvFile(config);
  }

  validateFilesAndRows(schemaEnums);
  writeOutputs(schemaEnums);
  printResult();

  if (issueCount("error") > 0) {
    process.exitCode = 1;
  }
}

function loadSchemaEnums() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    addIssue({
      level: "error",
      code: "missing_schema",
      file: relativePath(SCHEMA_PATH),
      message: "Prisma schema source file is missing."
    });
    return {};
  }

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
  const enums = {};
  const enumPattern = /enum\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let match = enumPattern.exec(schema);

  while (match) {
    const [, enumName, body] = match;
    enums[enumName] = body
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("@@") && !line.startsWith("//"))
      .map((line) => line.split(/\s+/)[0]);
    match = enumPattern.exec(schema);
  }

  for (const enumName of Object.keys(SCHEMA_ENUMS)) {
    if (!Array.isArray(enums[enumName]) || enums[enumName].length === 0) {
      addIssue({
        level: "error",
        code: "missing_schema_enum",
        file: relativePath(SCHEMA_PATH),
        message: `Expected Prisma enum ${enumName} was not found.`
      });
    }
  }

  return enums;
}

function loadCsvFile(config) {
  const filePath = path.join(INPUT_DIR, config.file);
  const fileInfo = {
    config,
    path: filePath,
    relativePath: relativePath(filePath),
    exists: fs.existsSync(filePath),
    headers: [],
    rows: [],
    missingColumns: []
  };

  csvFiles.set(config.id, fileInfo);

  if (!fileInfo.exists) {
    addIssue({
      level: "error",
      code: "missing_file",
      file: fileInfo.relativePath,
      entityType: config.entityType,
      message: `Expected CSV file ${config.file} is missing.`
    });
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseCsv(raw);

  if (parsed.length === 0) {
    addIssue({
      level: "error",
      code: "empty_file",
      file: fileInfo.relativePath,
      entityType: config.entityType,
      message: `Expected CSV file ${config.file} is empty.`
    });
    return;
  }

  const headers = parsed[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  );

  fileInfo.headers = headers;
  fileInfo.rows = parsed.slice(1).map((values, index) => {
    const row = {};

    for (const [headerIndex, header] of headers.entries()) {
      row[header] = values[headerIndex] ?? "";
    }

    row.__rowNumber = index + 2;
    row.__extraValues = values.slice(headers.length);
    return row;
  });

  validateHeaderShape(fileInfo);
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

function pushParsedRow(rows, row) {
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }
}

function validateHeaderShape(fileInfo) {
  const { config, headers } = fileInfo;
  const headerSet = new Set(headers);
  const duplicateHeaders = headers.filter((header, index) => headers.indexOf(header) !== index);

  for (const duplicateHeader of new Set(duplicateHeaders)) {
    addIssue({
      level: "error",
      code: "duplicate_column",
      file: fileInfo.relativePath,
      entityType: config.entityType,
      message: `Column ${duplicateHeader} appears more than once.`
    });
  }

  fileInfo.missingColumns = config.requiredColumns.filter((column) => !headerSet.has(column));

  for (const column of fileInfo.missingColumns) {
    addIssue({
      level: "error",
      code: "missing_column",
      file: fileInfo.relativePath,
      entityType: config.entityType,
      message: `Required column ${column} is missing.`
    });
  }

  for (const row of fileInfo.rows) {
    if (row.__extraValues.length > 0) {
      addIssue({
        level: "error",
        code: "row_has_extra_values",
        file: fileInfo.relativePath,
        row: row.__rowNumber,
        entityType: config.entityType,
        entityKey: getEntityKey(config, row),
        message: "CSV row has more values than the header defines.",
        details: row.__extraValues.join(" | ")
      });
    }
  }
}

function validateFilesAndRows(schemaEnums) {
  for (const fileInfo of csvFiles.values()) {
    if (!fileInfo.exists) {
      continue;
    }

    validateRequiredValues(fileInfo);
    validateTypedValues(fileInfo);
    buildKeyIndex(fileInfo);
  }

  for (const fileInfo of csvFiles.values()) {
    if (!fileInfo.exists) {
      continue;
    }

    validateUniqueColumns(fileInfo);
  }

  validateSchemaEnums(schemaEnums);
  validateForeignKeys();
  validateOneBrandRule();
  validateReplacementPartRules();
  validateTableRules();
  validateMediaRules();
  validateConfirmedBusinessUpdates();
  validateVicePackageRules();
  validateRedirectRules();
  validateReviewFlags();
}

function validateRequiredValues(fileInfo) {
  const { config } = fileInfo;

  for (const row of fileInfo.rows) {
    for (const column of config.requiredValueColumns) {
      if (!fileInfo.headers.includes(column)) {
        continue;
      }

      if (value(row, column) === "") {
        addIssue({
          level: "error",
          code: "missing_required_value",
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          entityType: config.entityType,
          entityKey: getEntityKey(config, row),
          message: `Required value ${column} is blank.`
        });
      }
    }
  }
}

function validateTypedValues(fileInfo) {
  const { config } = fileInfo;

  for (const row of fileInfo.rows) {
    for (const column of config.booleanColumns ?? []) {
      if (value(row, column) !== "" && !isBooleanText(value(row, column))) {
        addIssue({
          level: "error",
          code: "invalid_boolean",
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          entityType: config.entityType,
          entityKey: getEntityKey(config, row),
          message: `Column ${column} must be true or false.`,
          details: value(row, column)
        });
      }
    }

    for (const column of config.integerColumns ?? []) {
      if (value(row, column) !== "" && !/^-?\d+$/.test(value(row, column))) {
        addIssue({
          level: "error",
          code: "invalid_integer",
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          entityType: config.entityType,
          entityKey: getEntityKey(config, row),
          message: `Column ${column} must be an integer when populated.`,
          details: value(row, column)
        });
      }
    }
  }
}

function buildKeyIndex(fileInfo) {
  const { config } = fileInfo;

  if (!config.keyColumn || !fileInfo.headers.includes(config.keyColumn)) {
    return;
  }

  const index = new Map();

  for (const row of fileInfo.rows) {
    const key = value(row, config.keyColumn);

    if (key === "") {
      continue;
    }

    if (index.has(key)) {
      const first = index.get(key);
      addIssue({
        level: "error",
        code: "duplicate_key",
        file: fileInfo.relativePath,
        row: row.__rowNumber,
        entityType: config.entityType,
        entityKey: key,
        message: `${config.keyColumn} must be unique.`,
        details: `First seen on row ${first.__rowNumber}.`
      });
      continue;
    }

    index.set(key, row);
  }

  indexes.set(config.id, index);
}

function validateUniqueColumns(fileInfo) {
  const { config } = fileInfo;

  for (const column of config.uniqueColumns) {
    if (!fileInfo.headers.includes(column)) {
      continue;
    }

    const seen = new Map();

    for (const row of fileInfo.rows) {
      const columnValue = value(row, column);

      if (columnValue === "") {
        continue;
      }

      if (seen.has(columnValue)) {
        addIssue({
          level: "error",
          code: "duplicate_unique_value",
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          entityType: config.entityType,
          entityKey: getEntityKey(config, row),
          message: `Column ${column} must not contain duplicates.`,
          details: `Value ${columnValue} first seen on row ${seen.get(columnValue).__rowNumber}.`
        });
        continue;
      }

      seen.set(columnValue, row);
    }
  }
}

function validateSchemaEnums(schemaEnums) {
  validateEnumColumn("products", "product_kind", schemaEnums.ProductKind);
  validateEnumColumn("products", "status", schemaEnums.ProductStatus);
  validateEnumColumn("products", "purchase_mode", schemaEnums.PurchaseMode);
  validateEnumColumn("products", "source_review_status", schemaEnums.SourceReviewStatus);
  validateEnumColumn("variants", "purchase_mode_override", schemaEnums.PurchaseMode, {
    optional: true
  });
  validateEnumColumn("media", "role", schemaEnums.MediaRole);
  validateEnumColumn("redirects", "redirect_status", schemaEnums.RedirectStatus);
}

function validateEnumColumn(fileId, column, allowedValues, options = {}) {
  const fileInfo = csvFiles.get(fileId);

  if (!fileInfo?.exists || !fileInfo.headers.includes(column)) {
    return;
  }

  const allowed = new Set(allowedValues ?? []);

  for (const row of fileInfo.rows) {
    const columnValue = value(row, column);

    if (options.optional && columnValue === "") {
      continue;
    }

    if (columnValue !== "" && !allowed.has(columnValue)) {
      addIssue({
        level: "error",
        code: "invalid_schema_enum",
        file: fileInfo.relativePath,
        row: row.__rowNumber,
        entityType: fileInfo.config.entityType,
        entityKey: getEntityKey(fileInfo.config, row),
        message: `Column ${column} must match the Prisma schema enum.`,
        details: `Value ${columnValue}; allowed values: ${[...allowed].join(", ")}.`
      });
    }
  }
}

function validateForeignKeys() {
  const brands = indexes.get("brands") ?? new Map();
  const categories = indexes.get("categories") ?? new Map();
  const families = indexes.get("families") ?? new Map();
  const products = indexes.get("products") ?? new Map();
  const variants = indexes.get("variants") ?? new Map();
  const media = indexes.get("media") ?? new Map();

  const categoryFile = csvFiles.get("categories");
  for (const row of categoryFile?.rows ?? []) {
    validateReference({
      sourceFile: categoryFile,
      row,
      column: "parent_category_key",
      targetIndex: categories,
      targetName: "category",
      optional: true
    });
  }

  const familyFile = csvFiles.get("families");
  for (const row of familyFile?.rows ?? []) {
    validateReference({
      sourceFile: familyFile,
      row,
      column: "brand_key",
      targetIndex: brands,
      targetName: "brand"
    });
    validateReference({
      sourceFile: familyFile,
      row,
      column: "primary_category_key",
      targetIndex: categories,
      targetName: "category"
    });
  }

  const productFile = csvFiles.get("products");
  for (const row of productFile?.rows ?? []) {
    validateReference({
      sourceFile: productFile,
      row,
      column: "family_key",
      targetIndex: families,
      targetName: "family"
    });
    validateReference({
      sourceFile: productFile,
      row,
      column: "brand_key",
      targetIndex: brands,
      targetName: "brand"
    });
    validateReference({
      sourceFile: productFile,
      row,
      column: "primary_category_key",
      targetIndex: categories,
      targetName: "category"
    });

    const family = families.get(value(row, "family_key"));
    if (family && value(family, "brand_key") !== value(row, "brand_key")) {
      addIssue({
        level: "error",
        code: "product_family_brand_mismatch",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: value(row, "product_key"),
        message: "Product brand_key must match its product family brand_key.",
        details: `Product brand_key ${value(row, "brand_key")}; family brand_key ${value(
          family,
          "brand_key"
        )}.`
      });
    }
  }

  const variantFile = csvFiles.get("variants");
  for (const row of variantFile?.rows ?? []) {
    validateReference({
      sourceFile: variantFile,
      row,
      column: "product_key",
      targetIndex: products,
      targetName: "product"
    });
  }

  const mediaFile = csvFiles.get("media");
  for (const row of mediaFile?.rows ?? []) {
    validateReference({
      sourceFile: mediaFile,
      row,
      column: "product_key",
      targetIndex: products,
      targetName: "product"
    });
    validateReference({
      sourceFile: mediaFile,
      row,
      column: "variant_key",
      targetIndex: variants,
      targetName: "variant",
      optional: true
    });

    const variant = variants.get(value(row, "variant_key"));
    if (
      variant &&
      value(row, "product_key") !== "" &&
      value(row, "product_key") !== value(variant, "product_key")
    ) {
      addIssue({
        level: "error",
        code: "media_variant_product_mismatch",
        file: mediaFile.relativePath,
        row: row.__rowNumber,
        entityType: "media",
        entityKey: value(row, "media_key"),
        message: "Media product_key must match the referenced variant product_key.",
        details: `Media product_key ${value(row, "product_key")}; variant product_key ${value(
          variant,
          "product_key"
        )}.`
      });
    }
  }

  validateEntityReferences(csvFiles.get("redirects"), {
    brand: brands,
    category: categories,
    family: families,
    product: products,
    variant: variants,
    media
  });
  validateEntityReferences(csvFiles.get("flags"), {
    brand: brands,
    category: categories,
    family: families,
    product: products,
    variant: variants,
    media
  });
}

function validateReference({ sourceFile, row, column, targetIndex, targetName, optional = false }) {
  if (!sourceFile.headers.includes(column)) {
    return;
  }

  const key = value(row, column);

  if (key === "" && optional) {
    return;
  }

  if (key !== "" && !targetIndex.has(key)) {
    addIssue({
      level: "error",
      code: "missing_reference",
      file: sourceFile.relativePath,
      row: row.__rowNumber,
      entityType: sourceFile.config.entityType,
      entityKey: getEntityKey(sourceFile.config, row),
      message: `Column ${column} references a missing ${targetName}.`,
      details: key
    });
  }
}

function validateEntityReferences(fileInfo, entityIndexes) {
  if (!fileInfo?.exists) {
    return;
  }

  for (const row of fileInfo.rows) {
    const entityType = value(row, "entity_type");
    const entityKey = value(row, "entity_key");
    const targetIndex = entityIndexes[entityType];

    if (!targetIndex || entityKey === "" || isAggregateReviewKey(entityKey)) {
      continue;
    }

    if (!targetIndex.has(entityKey)) {
      addIssue({
        level: "error",
        code: "missing_entity_reference",
        file: fileInfo.relativePath,
        row: row.__rowNumber,
        entityType,
        entityKey,
        message: "Entity key does not map to a known reviewed entity.",
        details: `entity_type=${entityType}`
      });
    }
  }
}

function validateOneBrandRule() {
  const brandFile = csvFiles.get("brands");
  const brandRows = brandFile?.rows ?? [];

  if (brandRows.length !== 1) {
    addIssue({
      level: "error",
      code: "one_brand_rule",
      file: brandFile?.relativePath,
      entityType: "brand",
      message: "Tiger PingPong v1 must contain exactly one brand row.",
      details: `Found ${brandRows.length} rows.`
    });
  }

  for (const row of brandRows) {
    if (value(row, "brand_key") !== TIGER_BRAND_KEY) {
      addIssue({
        level: "error",
        code: "one_brand_rule",
        file: brandFile.relativePath,
        row: row.__rowNumber,
        entityType: "brand",
        entityKey: value(row, "brand_key"),
        message: `The only allowed v1 brand_key is ${TIGER_BRAND_KEY}.`
      });
    }
  }

  for (const fileId of ["families", "products"]) {
    const fileInfo = csvFiles.get(fileId);

    for (const row of fileInfo?.rows ?? []) {
      if (value(row, "brand_key") !== TIGER_BRAND_KEY) {
        addIssue({
          level: "error",
          code: "one_brand_rule",
          file: fileInfo.relativePath,
          row: row.__rowNumber,
          entityType: fileInfo.config.entityType,
          entityKey: getEntityKey(fileInfo.config, row),
          message: `All reviewed family/product rows must use brand_key ${TIGER_BRAND_KEY}.`,
          details: value(row, "brand_key")
        });
      }
    }
  }
}

function validateReplacementPartRules() {
  const categoryFile = csvFiles.get("categories");
  const replacementCategory = indexes.get("categories")?.get("replacement-parts");
  const productFile = csvFiles.get("products");
  const mediaRows = csvFiles.get("media")?.rows ?? [];
  const replacementProducts = (productFile?.rows ?? []).filter(
    (row) =>
      value(row, "product_kind") === "replacement_part" ||
      value(row, "primary_category_key") === "replacement-parts"
  );
  const publicReplacementProducts = replacementProducts.filter(
    (row) =>
      asBoolean(value(row, "v1_public_navigation")) === true ||
      asBoolean(value(row, "v1_checkout_scope")) === true
  );

  if (!replacementCategory) {
    addIssue({
      level: "error",
      code: "missing_replacement_parts_category",
      file: categoryFile?.relativePath,
      entityType: "category",
      entityKey: "replacement-parts",
      message: "Required replacement-parts category is missing."
    });
  } else if (publicReplacementProducts.length > 0) {
    if (asBoolean(value(replacementCategory, "v1_public_navigation")) !== true) {
      addIssue({
        level: "error",
        code: "replacement_part_category_not_public",
        file: categoryFile.relativePath,
        row: replacementCategory.__rowNumber,
        entityType: "category",
        entityKey: "replacement-parts",
        message:
          "Replacement Parts category must be public when it contains an approved public part."
      });
    }

    if (asBoolean(value(replacementCategory, "v1_checkout_scope")) !== true) {
      addIssue({
        level: "error",
        code: "replacement_part_category_not_checkoutable",
        file: categoryFile.relativePath,
        row: replacementCategory.__rowNumber,
        entityType: "category",
        entityKey: "replacement-parts",
        message:
          "Replacement Parts category must be checkout-capable when it contains an approved public part."
      });
    }
  }

  const replacementFlags = new Set(
    (csvFiles.get("flags")?.rows ?? [])
      .filter((row) => value(row, "flag") === "replacement_part_deferred")
      .map((row) => value(row, "entity_key"))
  );

  for (const row of replacementProducts) {
    const productKey = value(row, "product_key");
    const isPublic =
      asBoolean(value(row, "v1_public_navigation")) === true ||
      asBoolean(value(row, "v1_checkout_scope")) === true;
    if (value(row, "product_kind") !== "replacement_part") {
      addIssue({
        level: "error",
        code: "replacement_part_kind_mismatch",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message: "Product assigned to replacement-parts should use product_kind replacement_part."
      });
    }

    if (
      asBoolean(value(row, "v1_public_navigation")) !== asBoolean(value(row, "v1_checkout_scope"))
    ) {
      addIssue({
        level: "error",
        code: "replacement_part_scope_mismatch",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message: "Replacement Parts must use matching public-navigation and checkout-scope flags."
      });
    }

    if (isPublic) {
      if (value(row, "status") !== "active") {
        addIssue({
          level: "error",
          code: "public_replacement_part_not_active",
          file: productFile.relativePath,
          row: row.__rowNumber,
          entityType: "product",
          entityKey: productKey,
          message: "A public Replacement Part must have status=active."
        });
      }

      if (value(row, "purchase_mode") !== "online_checkout") {
        addIssue({
          level: "error",
          code: "public_replacement_part_purchase_mode",
          file: productFile.relativePath,
          row: row.__rowNumber,
          entityType: "product",
          entityKey: productKey,
          message: "A public Replacement Part must use purchase_mode=online_checkout.",
          details: value(row, "purchase_mode")
        });
      }

      const priceCents = Number(value(row, "price_cents"));
      if (!Number.isInteger(priceCents) || priceCents <= 0) {
        addIssue({
          level: "error",
          code: "public_replacement_part_price_invalid",
          file: productFile.relativePath,
          row: row.__rowNumber,
          entityType: "product",
          entityKey: productKey,
          message: "A public Replacement Part must have a positive integer price_cents value."
        });
      }

      if (value(row, "currency") !== "CAD") {
        addIssue({
          level: "error",
          code: "public_replacement_part_currency_invalid",
          file: productFile.relativePath,
          row: row.__rowNumber,
          entityType: "product",
          entityKey: productKey,
          message: "A public Replacement Part must use CAD currency."
        });
      }

      if (value(row, "sku") === "") {
        addIssue({
          level: "error",
          code: "public_replacement_part_sku_missing",
          file: productFile.relativePath,
          row: row.__rowNumber,
          entityType: "product",
          entityKey: productKey,
          message: "A public Replacement Part must have an internal SKU."
        });
      }

      if (value(row, "source_review_status") !== "approved_for_schema_planning") {
        addIssue({
          level: "error",
          code: "public_replacement_part_not_approved",
          file: productFile.relativePath,
          row: row.__rowNumber,
          entityType: "product",
          entityKey: productKey,
          message:
            "A public Replacement Part must have source_review_status=approved_for_schema_planning."
        });
      }

      const approvedPrimaryMedia = mediaRows.find(
        (mediaRow) =>
          value(mediaRow, "product_key") === productKey &&
          asBoolean(value(mediaRow, "is_primary")) === true &&
          value(mediaRow, "cloudinary_public_id") !== "" &&
          value(mediaRow, "cloudinary_secure_url") !== "" &&
          value(mediaRow, "alt_text") !== ""
      );

      if (!approvedPrimaryMedia) {
        addIssue({
          level: "error",
          code: "public_replacement_part_primary_media_missing",
          file: csvFiles.get("media")?.relativePath,
          entityType: "product",
          entityKey: productKey,
          message:
            "A public Replacement Part must have primary Cloudinary media with approved delivery fields and alt text."
        });
      }

      continue;
    }

    if (["online_checkout_candidate", "online_checkout"].includes(value(row, "purchase_mode"))) {
      addIssue({
        level: "error",
        code: "private_replacement_part_checkout_mode",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message: "A private Replacement Part must not use an online checkout purchase mode."
      });
    }

    if (
      ["deferred_from_v1", "disabled"].includes(value(row, "purchase_mode")) &&
      !replacementFlags.has(productKey)
    ) {
      addIssue({
        level: "warning",
        code: "replacement_part_flag_missing",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message: "Replacement Part is deferred but has no replacement_part_deferred review flag."
      });
    }
  }
}

function validateTableRules() {
  const productFile = csvFiles.get("products");
  const variantFile = csvFiles.get("variants");
  const products = indexes.get("products") ?? new Map();
  const openTablePolicyFlags = new Set(
    (csvFiles.get("flags")?.rows ?? [])
      .filter(
        (row) =>
          value(row, "flag") === "table_shipping_policy_required" &&
          value(row, "resolution_status") === "open"
      )
      .map((row) => value(row, "entity_key"))
  );
  const hasCheckoutPolicyFlag = (csvFiles.get("flags")?.rows ?? []).some(
    (row) =>
      value(row, "flag") === "checkout_policy_required" &&
      value(row, "resolution_status") === "open"
  );

  for (const row of productFile?.rows ?? []) {
    if (!isTableProduct(row)) {
      continue;
    }

    const productKey = value(row, "product_key");
    const shippingReviewRequired = asBoolean(value(row, "shipping_review_required"));
    const hasOpenShippingFlag = openTablePolicyFlags.has(productKey);

    if (!shippingReviewRequired && !hasOpenShippingFlag) {
      addIssue({
        level: "error",
        code: "table_shipping_review_missing",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message:
          "Table products must be marked shipping_review_required or have an open table shipping policy flag."
      });
    }

    if (
      asBoolean(value(row, "v1_checkout_scope")) === true &&
      value(row, "purchase_mode") === "online_checkout"
    ) {
      addIssue({
        level: "error",
        code: "table_checkout_approved_without_policy",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message:
          "Table products must not be treated as fully approved online checkout before policy review."
      });
    }

    if (shippingReviewRequired || hasOpenShippingFlag) {
      addIssue({
        level: "warning",
        code: "table_shipping_policy_open",
        file: productFile.relativePath,
        row: row.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message:
          "Table remains a checkout candidate only after freight, curbside, tax, regional, and shipping policy review."
      });
    }
  }

  for (const row of variantFile?.rows ?? []) {
    const product = products.get(value(row, "product_key"));

    if (
      product &&
      isTableProduct(product) &&
      value(row, "purchase_mode_override") === "online_checkout"
    ) {
      addIssue({
        level: "error",
        code: "table_variant_checkout_approved_without_policy",
        file: variantFile.relativePath,
        row: row.__rowNumber,
        entityType: "variant",
        entityKey: value(row, "variant_key"),
        message:
          "Table variants must not override purchase mode to fully approved online checkout before policy review."
      });
    }
  }

  if (!hasCheckoutPolicyFlag) {
    addIssue({
      level: "warning",
      code: "checkout_policy_flag_missing",
      file: csvFiles.get("flags")?.relativePath,
      entityType: "review_flag",
      entityKey: "all-v1-checkout-candidates",
      message: "Expected an open checkout_policy_required review flag for v1 checkout candidates."
    });
  }
}

function validateMediaRules() {
  const mediaFile = csvFiles.get("media");
  const primaryByProduct = new Map();

  for (const row of mediaFile?.rows ?? []) {
    const cloudinaryPublicId = value(row, "cloudinary_public_id");
    const cloudinarySecureUrl = value(row, "cloudinary_secure_url");
    const parsedCloudinaryUrl =
      cloudinarySecureUrl === "" ? null : parseCloudinaryDeliveryUrl(cloudinarySecureUrl);

    if (cloudinarySecureUrl !== "" && !parsedCloudinaryUrl) {
      addIssue({
        level: "error",
        code: "cloudinary_secure_url_invalid",
        file: mediaFile.relativePath,
        row: row.__rowNumber,
        entityType: "media",
        entityKey: value(row, "media_key"),
        message:
          "cloudinary_secure_url must be blank or a valid HTTPS Cloudinary image delivery URL."
      });
    }

    if (cloudinarySecureUrl !== "" && cloudinaryPublicId === "") {
      addIssue({
        level: "error",
        code: "cloudinary_public_id_missing_for_secure_url",
        file: mediaFile.relativePath,
        row: row.__rowNumber,
        entityType: "media",
        entityKey: value(row, "media_key"),
        message: "cloudinary_public_id is required when cloudinary_secure_url is populated."
      });
    }

    if (
      parsedCloudinaryUrl?.publicId &&
      cloudinaryPublicId !== "" &&
      parsedCloudinaryUrl.publicId !== cloudinaryPublicId
    ) {
      addIssue({
        level: "error",
        code: "cloudinary_public_id_url_mismatch",
        file: mediaFile.relativePath,
        row: row.__rowNumber,
        entityType: "media",
        entityKey: value(row, "media_key"),
        message: "cloudinary_public_id must match the public ID in cloudinary_secure_url.",
        details: `URL public ID ${parsedCloudinaryUrl.publicId}; CSV public ID ${cloudinaryPublicId}.`
      });
    }

    if (value(row, "source_url") !== "" && !isHttpUrl(value(row, "source_url"))) {
      addIssue({
        level: "warning",
        code: "media_source_url_not_http",
        file: mediaFile.relativePath,
        row: row.__rowNumber,
        entityType: "media",
        entityKey: value(row, "media_key"),
        message: "Media source_url should be an HTTP(S) source metadata URL.",
        details: value(row, "source_url")
      });
    }

    if (
      value(row, "suggested_cloudinary_folder") !== "" &&
      !hasAcceptedCloudinaryFolderPrefix(value(row, "suggested_cloudinary_folder"))
    ) {
      addIssue({
        level: "warning",
        code: "cloudinary_folder_brand_prefix",
        file: mediaFile.relativePath,
        row: row.__rowNumber,
        entityType: "media",
        entityKey: value(row, "media_key"),
        message:
          "Suggested Cloudinary folder should stay under an accepted Tiger PingPong product media prefix."
      });
    }

    if (asBoolean(value(row, "is_primary")) === true) {
      const productKey = value(row, "product_key");
      const existing = primaryByProduct.get(productKey) ?? [];
      existing.push(row);
      primaryByProduct.set(productKey, existing);
    }
  }

  for (const [productKey, rows] of primaryByProduct.entries()) {
    if (rows.length > 1) {
      addIssue({
        level: "warning",
        code: "multiple_primary_media",
        file: mediaFile.relativePath,
        row: rows[1].__rowNumber,
        entityType: "media",
        entityKey: productKey,
        message:
          "More than one primary media row exists for this product; review before final import.",
        details: `Primary media rows: ${rows.map((row) => value(row, "media_key")).join(", ")}.`
      });
    }
  }
}

function validateConfirmedBusinessUpdates() {
  const productFile = csvFiles.get("products");
  const products = indexes.get("products") ?? new Map();
  const flagFile = csvFiles.get("flags");

  for (const [productKey, expected] of CONFIRMED_PRODUCT_VALUES.entries()) {
    const product = products.get(productKey);

    if (!product) {
      addIssue({
        level: "error",
        code: "confirmed_product_missing",
        file: productFile?.relativePath,
        entityType: "product",
        entityKey: productKey,
        message: "Confirmed business product is missing from products_import_v1.csv."
      });
      continue;
    }

    if (value(product, "sku") !== expected.sku) {
      addIssue({
        level: "error",
        code: "confirmed_sku_mismatch",
        file: productFile.relativePath,
        row: product.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message: "Product SKU does not match the confirmed business update.",
        details: `Expected ${expected.sku}; found ${value(product, "sku")}.`
      });
    }

    if (value(product, "price_cents") !== expected.priceCents) {
      addIssue({
        level: "error",
        code: "confirmed_price_mismatch",
        file: productFile.relativePath,
        row: product.__rowNumber,
        entityType: "product",
        entityKey: productKey,
        message: "Product price_cents does not match the confirmed business update.",
        details: `Expected ${expected.priceCents}; found ${value(product, "price_cents")}.`
      });
    }

    const isExplicitDeferredRollback =
      expected.allowDeferredRollback &&
      value(product, "status") === "draft" &&
      asBoolean(value(product, "v1_public_navigation")) === false &&
      asBoolean(value(product, "v1_checkout_scope")) === false &&
      value(product, "purchase_mode") === "deferred_from_v1";

    if (expected.checkoutReady && !isExplicitDeferredRollback) {
      validateConfirmedCheckoutReadyProduct(productFile, product, productKey);
    }
  }

  const aquaPriceFlag = (flagFile?.rows ?? []).find(
    (row) =>
      value(row, "entity_type") === "family" &&
      value(row, "entity_key") === "aqua-paddles" &&
      value(row, "flag") === "price_review_required"
  );

  if (!aquaPriceFlag) {
    addIssue({
      level: "warning",
      code: "aqua_price_resolution_flag_missing",
      file: flagFile?.relativePath,
      entityType: "family",
      entityKey: "aqua-paddles",
      message:
        "Aqua prices are confirmed; expected a resolved price_review_required flag for traceability."
    });
  } else if (value(aquaPriceFlag, "resolution_status") !== "resolved") {
    addIssue({
      level: "error",
      code: "aqua_price_review_not_resolved",
      file: flagFile.relativePath,
      row: aquaPriceFlag.__rowNumber,
      entityType: "family",
      entityKey: "aqua-paddles",
      message: "Aqua price review should be resolved after confirmed prices.",
      details: value(aquaPriceFlag, "resolution_status")
    });
  }

  for (const row of flagFile?.rows ?? []) {
    if (
      value(row, "entity_key") !== "tiger-net-post-set" ||
      value(row, "resolution_status") !== "open"
    ) {
      continue;
    }

    const searchableFlagText = `${value(row, "flag")} ${value(row, "notes")}`;

    if (/checkout|readiness|unknown|manual review/i.test(searchableFlagText)) {
      addIssue({
        level: "error",
        code: "net_post_checkout_readiness_flag_open",
        file: flagFile.relativePath,
        row: row.__rowNumber,
        entityType: value(row, "entity_type"),
        entityKey: "tiger-net-post-set",
        message:
          "Net & Post checkout readiness is confirmed; any readiness-unknown flag should be resolved."
      });
    }
  }
}

function validateVicePackageRules() {
  const productFile = csvFiles.get("products");
  const variantFile = csvFiles.get("variants");
  const flagFile = csvFiles.get("flags");
  const products = indexes.get("products") ?? new Map();
  const variants = indexes.get("variants") ?? new Map();
  const viceProduct = products.get(VICE_PACKAGE_RULES.productKey);
  const whiteBallsProduct = products.get(VICE_PACKAGE_RULES.whiteBallsProductKey);
  const singleVariant = variants.get(VICE_PACKAGE_RULES.singleVariantKey);
  const bundleVariant = variants.get(VICE_PACKAGE_RULES.bundleVariantKey);
  const bundleSkuFlags = (flagFile?.rows ?? []).filter(
    (row) =>
      value(row, "entity_type") === "variant" &&
      value(row, "entity_key") === VICE_PACKAGE_RULES.bundleVariantKey &&
      value(row, "flag") === VICE_PACKAGE_RULES.blockerFlag
  );
  const bundleSkuFlag = bundleSkuFlags[0];

  if (!viceProduct) {
    addIssue({
      level: "error",
      code: "vice_product_missing",
      file: productFile?.relativePath,
      entityType: "product",
      entityKey: VICE_PACKAGE_RULES.productKey,
      message: "The Vice parent product is missing."
    });
  } else {
    for (const [column, expected] of [
      ["sku", ""],
      ["price_cents", "1500"],
      ["currency", "CAD"]
    ]) {
      validateExactReviewedValue({
        fileInfo: productFile,
        row: viceProduct,
        column,
        expected,
        code: "vice_product_package_model_mismatch",
        entityType: "product",
        entityKey: VICE_PACKAGE_RULES.productKey,
        message:
          "The Vice parent must keep a blank SKU and the reconciled base price for its required package-option model."
      });
    }
  }

  if (!whiteBallsProduct) {
    addIssue({
      level: "error",
      code: "vice_bundle_component_missing",
      file: productFile?.relativePath,
      entityType: "product",
      entityKey: VICE_PACKAGE_RULES.whiteBallsProductKey,
      message: "The Vice bundle white-ball component product is missing."
    });
  } else {
    for (const [column, expected] of [
      ["sku", VICE_PACKAGE_RULES.whiteBallsSku],
      ["currency", "CAD"]
    ]) {
      validateExactReviewedValue({
        fileInfo: productFile,
        row: whiteBallsProduct,
        column,
        expected,
        code: "vice_bundle_component_mismatch",
        entityType: "product",
        entityKey: VICE_PACKAGE_RULES.whiteBallsProductKey,
        message: "The Vice bundle white-ball component does not match the approved input."
      });
    }

    const whiteBallsPriceCents = Number.parseInt(value(whiteBallsProduct, "price_cents"), 10);

    if (!Number.isInteger(whiteBallsPriceCents) || whiteBallsPriceCents <= 0) {
      addIssue({
        level: "error",
        code: "vice_bundle_component_price_missing",
        file: productFile?.relativePath,
        row: whiteBallsProduct.__rowNumber,
        entityType: "product",
        entityKey: VICE_PACKAGE_RULES.whiteBallsProductKey,
        message: "The white six-ball component needs a positive durable price input."
      });
    }
  }

  if (!singleVariant) {
    addIssue({
      level: "error",
      code: "vice_single_variant_missing",
      file: variantFile?.relativePath,
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.singleVariantKey,
      message: "The required Single Vice Paddle package variant is missing."
    });
  } else {
    for (const [column, expected] of [
      ["product_key", VICE_PACKAGE_RULES.productKey],
      ["sku", "9174"],
      ["name", VICE_PACKAGE_RULES.singleLabel],
      ["option_1_name", VICE_PACKAGE_RULES.optionName],
      ["option_1_value", VICE_PACKAGE_RULES.singleOptionValue],
      ["currency", "CAD"],
      ["purchase_mode_override", ""],
      ["is_active", "true"]
    ]) {
      validateExactReviewedValue({
        fileInfo: variantFile,
        row: singleVariant,
        column,
        expected,
        code: "vice_single_variant_mismatch",
        entityType: "variant",
        entityKey: VICE_PACKAGE_RULES.singleVariantKey,
        message: "The Single Vice Paddle package variant does not match the approved model."
      });
    }

    if (viceProduct) {
      validateExactReviewedValue({
        fileInfo: variantFile,
        row: singleVariant,
        column: "price_cents",
        expected: value(viceProduct, "price_cents"),
        code: "vice_single_variant_price_mismatch",
        entityType: "variant",
        entityKey: VICE_PACKAGE_RULES.singleVariantKey,
        message: "The Single Vice Paddle variant price must match the durable Vice product price."
      });
    }
  }

  if (!bundleVariant) {
    addIssue({
      level: "error",
      code: "vice_bundle_variant_missing",
      file: variantFile?.relativePath,
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message: "The approved four-Vice/six-white-ball package variant is missing."
    });
    return;
  }

  for (const [column, expected] of [
    ["product_key", VICE_PACKAGE_RULES.productKey],
    ["name", VICE_PACKAGE_RULES.bundleLabel],
    ["option_1_name", VICE_PACKAGE_RULES.optionName],
    ["option_1_value", VICE_PACKAGE_RULES.bundleOptionValue],
    ["currency", "CAD"]
  ]) {
    validateExactReviewedValue({
      fileInfo: variantFile,
      row: bundleVariant,
      column,
      expected,
      code: "vice_bundle_variant_mismatch",
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message: "The Vice bundle variant does not match the approved package model."
    });
  }

  validateExactReviewedValue({
    fileInfo: variantFile,
    row: bundleVariant,
    column: "price_cents",
    expected: "",
    code: "vice_bundle_price_must_be_derived",
    entityType: "variant",
    entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
    message:
      "The durable Vice bundle price must remain blank so the importer derives it from live component inputs."
  });

  const bundleSku = value(bundleVariant, "sku");

  if (bundleSkuFlags.length !== 1) {
    addIssue({
      level: "error",
      code: "vice_bundle_sku_blocker_flag_count_mismatch",
      file: flagFile?.relativePath,
      row: bundleSkuFlag?.__rowNumber,
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message: "The Vice bundle requires exactly one owner_sku_required review flag.",
      details: `found ${bundleSkuFlags.length}`
    });
  }

  if (bundleSku === "") {
    for (const [column, expected] of [
      ["purchase_mode_override", "deferred_from_v1"],
      ["is_active", "false"]
    ]) {
      validateExactReviewedValue({
        fileInfo: variantFile,
        row: bundleVariant,
        column,
        expected,
        code: "vice_bundle_unassigned_sku_not_deferred",
        entityType: "variant",
        entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
        message: "The Vice bundle must remain inactive and deferred while its exact SKU is unknown."
      });
    }

    if (bundleSkuFlag) {
      for (const [column, expected] of [
        ["severity", "blocker"],
        ["resolution_owner", "business"],
        ["resolution_status", "open"]
      ]) {
        validateExactReviewedValue({
          fileInfo: flagFile,
          row: bundleSkuFlag,
          column,
          expected,
          code: "vice_bundle_sku_blocker_flag_mismatch",
          entityType: "variant",
          entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
          message: "The missing Vice bundle SKU must remain an owner-facing open blocker."
        });
      }
    }

    addIssue({
      level: "warning",
      code: "vice_bundle_sku_required",
      file: variantFile?.relativePath,
      row: bundleVariant.__rowNumber,
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message:
        "Owner or operations must assign the exact Vice bundle SKU before any scoped or all-catalog deployed write can include this variant."
    });
    return;
  }

  const normalizedBundleSku = bundleSku.trim().toUpperCase();

  if (
    FORBIDDEN_OPERATIONAL_SKUS.has(normalizedBundleSku) ||
    /^(?:PENDING|PLACEHOLDER|TBD|TEMP|TEST|TODO|UNKNOWN)[-_ ]/u.test(normalizedBundleSku)
  ) {
    addIssue({
      level: "error",
      code: "vice_bundle_sku_placeholder",
      file: variantFile?.relativePath,
      row: bundleVariant.__rowNumber,
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message:
        "The Vice bundle SKU must be the exact operations-assigned value, not a placeholder.",
      details: bundleSku
    });
  }

  const duplicateSkuEntities = [
    ...(productFile?.rows ?? []).map((row) => ({
      entityKey: value(row, "product_key"),
      entityType: "product",
      sku: value(row, "sku")
    })),
    ...(variantFile?.rows ?? []).map((row) => ({
      entityKey: value(row, "variant_key"),
      entityType: "variant",
      sku: value(row, "sku")
    }))
  ].filter(
    (entity) =>
      entity.sku === bundleSku &&
      !(entity.entityType === "variant" && entity.entityKey === VICE_PACKAGE_RULES.bundleVariantKey)
  );

  if (duplicateSkuEntities.length > 0) {
    addIssue({
      level: "error",
      code: "vice_bundle_sku_duplicate",
      file: variantFile?.relativePath,
      row: bundleVariant.__rowNumber,
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message: "The Vice bundle SKU must not duplicate another catalog product or variant SKU.",
      details: duplicateSkuEntities
        .map((entity) => `${entity.entityType}:${entity.entityKey}`)
        .join(", ")
    });
  }

  for (const [column, expected] of [
    ["purchase_mode_override", ""],
    ["is_active", "true"]
  ]) {
    validateExactReviewedValue({
      fileInfo: variantFile,
      row: bundleVariant,
      column,
      expected,
      code: "vice_bundle_assigned_sku_not_active",
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message: "A SKU-assigned Vice bundle must be active and use the parent purchase mode."
    });
  }

  if (!bundleSkuFlag || value(bundleSkuFlag, "resolution_status") !== "resolved") {
    addIssue({
      level: "error",
      code: "vice_bundle_sku_blocker_not_resolved",
      file: flagFile?.relativePath,
      row: bundleSkuFlag?.__rowNumber,
      entityType: "variant",
      entityKey: VICE_PACKAGE_RULES.bundleVariantKey,
      message: "Resolve the owner_sku_required flag after assigning the exact Vice bundle SKU."
    });
  }
}

function validateExactReviewedValue({
  fileInfo,
  row,
  column,
  expected,
  code,
  entityType,
  entityKey,
  message
}) {
  if (value(row, column) === expected) {
    return;
  }

  addIssue({
    level: "error",
    code,
    file: fileInfo?.relativePath,
    row: row?.__rowNumber,
    entityType,
    entityKey,
    message,
    details: `${column}: expected ${expected || "(blank)"}; found ${value(row, column) || "(blank)"}.`
  });
}

function validateConfirmedCheckoutReadyProduct(productFile, product, productKey) {
  if (value(product, "status") !== "active") {
    addIssue({
      level: "error",
      code: "checkout_ready_product_not_active",
      file: productFile.relativePath,
      row: product.__rowNumber,
      entityType: "product",
      entityKey: productKey,
      message: "Confirmed checkout-ready product should be active."
    });
  }

  if (asBoolean(value(product, "v1_public_navigation")) !== true) {
    addIssue({
      level: "error",
      code: "checkout_ready_product_not_public",
      file: productFile.relativePath,
      row: product.__rowNumber,
      entityType: "product",
      entityKey: productKey,
      message: "Confirmed checkout-ready product should remain in public catalog scope."
    });
  }

  if (asBoolean(value(product, "v1_checkout_scope")) !== true) {
    addIssue({
      level: "error",
      code: "checkout_ready_product_out_of_scope",
      file: productFile.relativePath,
      row: product.__rowNumber,
      entityType: "product",
      entityKey: productKey,
      message: "Confirmed checkout-ready product should remain in v1 checkout scope."
    });
  }

  if (!["online_checkout_candidate", "online_checkout"].includes(value(product, "purchase_mode"))) {
    addIssue({
      level: "error",
      code: "checkout_ready_purchase_mode",
      file: productFile.relativePath,
      row: product.__rowNumber,
      entityType: "product",
      entityKey: productKey,
      message: "Confirmed checkout-ready product should use an online checkout purchase mode.",
      details: value(product, "purchase_mode")
    });
  }
}

function validateRedirectRules() {
  const redirectFile = csvFiles.get("redirects");

  for (const row of redirectFile?.rows ?? []) {
    if (!value(row, "legacy_path").startsWith("/")) {
      addIssue({
        level: "warning",
        code: "redirect_legacy_path_shape",
        file: redirectFile.relativePath,
        row: row.__rowNumber,
        entityType: "redirect",
        entityKey: value(row, "legacy_path"),
        message: "Redirect legacy_path should be a path beginning with /."
      });
    }

    if (!value(row, "new_path_candidate").startsWith("/")) {
      addIssue({
        level: "warning",
        code: "redirect_new_path_shape",
        file: redirectFile.relativePath,
        row: row.__rowNumber,
        entityType: "redirect",
        entityKey: value(row, "legacy_path"),
        message: "Redirect new_path_candidate should be a path beginning with /."
      });
    }
  }
}

function validateReviewFlags() {
  const flagFile = csvFiles.get("flags");
  const flagRows = flagFile?.rows ?? [];

  for (const row of flagRows) {
    const flag = value(row, "flag");
    const status = value(row, "resolution_status");
    const severity = value(row, "severity");

    if (!FLAG_SEVERITIES.has(severity)) {
      addIssue({
        level: "error",
        code: "invalid_review_flag_severity",
        file: flagFile.relativePath,
        row: row.__rowNumber,
        entityType: value(row, "entity_type"),
        entityKey: value(row, "entity_key"),
        message: "Review flag severity must be info, medium, high, or blocker.",
        details: severity
      });
    }

    if (!FLAG_STATUSES.has(status)) {
      addIssue({
        level: "error",
        code: "invalid_review_flag_status",
        file: flagFile.relativePath,
        row: row.__rowNumber,
        entityType: value(row, "entity_type"),
        entityKey: value(row, "entity_key"),
        message: "Review flag status must be open, resolved, or deferred.",
        details: status
      });
    }

    if (OPEN_REVIEW_FLAGS.has(flag) && status !== "open") {
      addIssue({
        level: "warning",
        code: "expected_open_review_flag_not_open",
        file: flagFile.relativePath,
        row: row.__rowNumber,
        entityType: value(row, "entity_type"),
        entityKey: value(row, "entity_key"),
        message: `${flag} is normally expected to remain open at this dry-run stage.`,
        details: status
      });
    }

    if (status === "open") {
      addIssue({
        level: "warning",
        code: "open_review_flag",
        file: flagFile.relativePath,
        row: row.__rowNumber,
        entityType: value(row, "entity_type"),
        entityKey: value(row, "entity_key"),
        message: `${flag} remains open for ${value(row, "resolution_owner") || "review"}.`,
        details: `severity=${severity}`
      });
    }
  }

  const flagsByName = new Set(flagRows.map((row) => value(row, "flag")));

  for (const expectedFlag of ["cloudinary_upload_required", "checkout_policy_required"]) {
    if (!flagsByName.has(expectedFlag)) {
      addIssue({
        level: "warning",
        code: "expected_review_flag_missing",
        file: flagFile?.relativePath,
        entityType: "review_flag",
        entityKey: expectedFlag,
        message: `Expected review flag ${expectedFlag} is missing.`
      });
    }
  }

  for (const categoryKey of REQUIRED_CATEGORY_KEYS) {
    if (!(indexes.get("categories") ?? new Map()).has(categoryKey)) {
      addIssue({
        level: "error",
        code: "missing_required_category",
        file: csvFiles.get("categories")?.relativePath,
        entityType: "category",
        entityKey: categoryKey,
        message: `Required category row ${categoryKey} is missing.`
      });
    }
  }
}

function isTableProduct(row) {
  return (
    value(row, "product_kind") === "table" ||
    ["tables", "indoor-tables", "outdoor-tables"].includes(value(row, "primary_category_key"))
  );
}

function addIssue({
  level,
  code,
  file = "",
  row = "",
  entityType = "",
  entityKey = "",
  message,
  details = ""
}) {
  issues.push({
    level,
    code,
    file,
    row,
    entity_type: entityType,
    entity_key: entityKey,
    message,
    details
  });
}

function issueCount(level) {
  return issues.filter((issue) => issue.level === level).length;
}

function getEntityKey(config, row) {
  if (!config.keyColumn) {
    return value(row, "entity_key");
  }

  return value(row, config.keyColumn);
}

function value(row, column) {
  return (row?.[column] ?? "").trim();
}

function isBooleanText(text) {
  return text === "true" || text === "false";
}

function asBoolean(text) {
  if (text === "true") {
    return true;
  }

  if (text === "false") {
    return false;
  }

  return null;
}

function isHttpUrl(url) {
  return /^https?:\/\//.test(url);
}

function hasAcceptedCloudinaryFolderPrefix(folder) {
  const normalizedFolder = folder.replace(/^\/+/, "");

  return ACCEPTED_CLOUDINARY_FOLDER_PREFIXES.some(
    (prefix) =>
      normalizedFolder === prefix.replace(/\/$/, "") || normalizedFolder.startsWith(prefix)
  );
}

function parseCloudinaryDeliveryUrl(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== CLOUDINARY_DELIVERY_HOST) {
    return null;
  }

  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  const uploadIndex = parts.indexOf("upload");

  if (parts.length < 4 || parts[1] !== "image" || uploadIndex < 0) {
    return null;
  }

  const publicPathParts = parts.slice(uploadIndex + 1);

  if (publicPathParts[0]?.match(/^v\d+$/)) {
    publicPathParts.shift();
  }

  const publicPath = publicPathParts.join("/");

  if (!publicPath) {
    return null;
  }

  return {
    cloudName: parts[0],
    publicId: decodeURIComponent(publicPath.replace(/\.[A-Za-z0-9]+$/, ""))
  };
}

function isAggregateReviewKey(entityKey) {
  return (
    entityKey.startsWith("all-") || entityKey.endsWith("-v1") || entityKey.includes("articles")
  );
}

function relativePath(filePath) {
  if (!filePath) {
    return "";
  }

  return path.relative(REPO_ROOT, filePath);
}

function writeOutputs(schemaEnums) {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const summary = buildSummary(schemaEnums);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "import_validation_summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "import_validation_errors.csv"),
    formatIssuesCsv(issues.filter((issue) => issue.level === "error"))
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "import_validation_warnings.csv"),
    formatIssuesCsv(issues.filter((issue) => issue.level === "warning"))
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, "import_validation_report.md"), formatReport(summary));
}

function buildSummary(schemaEnums) {
  const files = {};

  for (const [id, fileInfo] of csvFiles.entries()) {
    files[id] = {
      file: fileInfo.relativePath,
      exists: fileInfo.exists,
      rowCount: fileInfo.rows.length,
      columnCount: fileInfo.headers.length,
      missingColumns: fileInfo.missingColumns
    };
  }

  return {
    generatedAt: new Date().toISOString(),
    result: issueCount("error") === 0 ? "pass" : "fail",
    inputDir: relativePath(INPUT_DIR),
    outputDir: relativePath(OUTPUT_DIR),
    schemaPath: relativePath(SCHEMA_PATH),
    totals: {
      expectedFiles: EXPECTED_FILES.length,
      loadedFiles: [...csvFiles.values()].filter((fileInfo) => fileInfo.exists).length,
      errors: issueCount("error"),
      warnings: issueCount("warning")
    },
    files,
    schemaEnums: Object.fromEntries(
      Object.keys(SCHEMA_ENUMS).map((enumName) => [enumName, schemaEnums[enumName] ?? []])
    ),
    boundaries: {
      writesToDatabase: false,
      runsMigrations: false,
      insertsRows: false,
      seedsProductData: false,
      uploadsCloudinaryMedia: false,
      buildsApiRoutes: false,
      buildsFrontendPages: false
    },
    issues: {
      errors: issues.filter((issue) => issue.level === "error"),
      warnings: issues.filter((issue) => issue.level === "warning")
    }
  };
}

function formatIssuesCsv(issueRows) {
  const headers = [
    "level",
    "code",
    "file",
    "row",
    "entity_type",
    "entity_key",
    "message",
    "details"
  ];
  const rows = issueRows.map((issue) =>
    headers.map((header) => csvEscape(issue[header] ?? "")).join(",")
  );

  return `${headers.join(",")}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`;
}

function csvEscape(input) {
  const text = String(input);

  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function formatReport(summary) {
  const lines = [
    "# Tiger PingPong Import Validation Report",
    "",
    `Generated: ${summary.generatedAt}`,
    `Result: ${summary.result.toUpperCase()}`,
    "",
    "## Scope",
    "",
    "This is a local dry-run report for reviewed CSV artifacts. It reads local CSV files and the Prisma schema only. It does not write to Supabase, run migrations, insert rows, seed data, upload media, or build API/frontend/checkout/admin work.",
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Expected files | ${summary.totals.expectedFiles} |`,
    `| Loaded files | ${summary.totals.loadedFiles} |`,
    `| Errors | ${summary.totals.errors} |`,
    `| Warnings | ${summary.totals.warnings} |`,
    "",
    "## Input Files",
    "",
    "| File | Rows | Missing columns |",
    "| --- | ---: | --- |"
  ];

  for (const file of Object.values(summary.files)) {
    lines.push(
      `| \`${file.file}\` | ${file.rowCount} | ${
        file.missingColumns.length > 0 ? file.missingColumns.join(", ") : "None"
      } |`
    );
  }

  lines.push("", "## Errors", "");
  lines.push(...formatIssueList(summary.issues.errors));
  lines.push("", "## Warnings", "");
  lines.push(...formatIssueList(summary.issues.warnings));
  lines.push(
    "",
    "## Generated Outputs",
    "",
    "- `import_validation_report.md`",
    "- `import_validation_summary.json`",
    "- `import_validation_errors.csv`",
    "- `import_validation_warnings.csv`",
    "",
    "Generated output is intentionally written under `var/import-validation/tigerpingpong/latest/` and should not be committed."
  );

  return `${lines.join("\n")}\n`;
}

function formatIssueList(issueRows) {
  if (issueRows.length === 0) {
    return ["None."];
  }

  return issueRows.map((issue) => {
    const location = [issue.file, issue.row ? `row ${issue.row}` : ""].filter(Boolean).join(": ");
    const entity = [issue.entity_type, issue.entity_key].filter(Boolean).join("/");
    const details = issue.details ? ` Details: ${issue.details}` : "";
    return `- ${issue.code}${location ? ` (${location})` : ""}${
      entity ? ` [${entity}]` : ""
    }: ${issue.message}${details}`;
  });
}

function printResult() {
  const reportPath = path.join(OUTPUT_DIR, "import_validation_report.md");
  const result = issueCount("error") === 0 ? "PASS" : "FAIL";
  console.log(
    `Tiger import validation ${result}: ${issueCount("error")} errors, ${issueCount(
      "warning"
    )} warnings.`
  );
  console.log(`Report: ${relativePath(reportPath)}`);
}

main();
