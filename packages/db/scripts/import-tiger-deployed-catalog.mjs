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
const HELP_FLAG = "--help";
const TARGET_PREFIX = "--target=";
const ALLOWED_TARGETS = new Set(["staging", "production"]);

const FILE_CONFIGS = [
  { id: "brands", file: "brands_import_v1.csv", table: "brands", keyColumn: "brand_key" },
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
  { id: "products", file: "products_import_v1.csv", table: "products", keyColumn: "product_key" },
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
  { id: "redirects", file: "redirects_draft_v1.csv", table: "redirects", keyColumn: "legacy_path" },
  { id: "flags", file: "import_review_flags_v1.csv", table: "import_review_flags", keyColumn: null }
];

const OPTION_TABLES = ["product_options", "product_option_values", "product_variant_option_values"];

function main() {
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

  console.log("");
  console.log("Dry run complete. No database connection was opened and no rows were written.");
}

function validateSafety(args) {
  const issues = [];
  const targets = args
    .filter((arg) => arg.startsWith(TARGET_PREFIX))
    .map((arg) => arg.slice(TARGET_PREFIX.length));

  for (const arg of args) {
    if (
      arg !== "--" &&
      arg !== CONFIRM_FLAG &&
      arg !== DRY_RUN_FLAG &&
      !arg.startsWith(TARGET_PREFIX)
    ) {
      issues.push(`Unknown argument: ${arg}`);
    }
  }

  if (!process.env.DATABASE_URL) {
    issues.push("DATABASE_URL is required for deployed import planning.");
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

  if (!args.includes(DRY_RUN_FLAG)) {
    issues.push(
      `${DRY_RUN_FLAG} is required because this deployed importer is planning-only in PR 083.`
    );
  }

  return {
    dryRun: args.includes(DRY_RUN_FLAG),
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
        sampleKeys: config.keyColumn
          ? fileInfo.rows.slice(0, 5).map((row) => value(row, config.keyColumn))
          : []
      };
    }),
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

function printHelp() {
  console.log(`Tiger PingPong deployed catalog import planner v1

Dry-run planning command:
  DATABASE_URL=postgresql://... pnpm import:tiger:deployed -- ${CONFIRM_FLAG} --target=staging ${DRY_RUN_FLAG}

Targets:
  --target=staging
  --target=production

Safety:
  - Requires DATABASE_URL.
  - Requires ${CONFIRM_FLAG}.
  - Requires exactly one explicit target.
  - Requires ${DRY_RUN_FLAG}; PR 083 does not implement deployed writes.
  - Runs pnpm validate:tiger-import before planning.
  - Opens no database connection in dry-run mode.
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
  console.log("Tiger PingPong deployed catalog import planner v1");
  console.log(`Target: ${safety.target}`);
  console.log("Mode: dry run, no database connection");
  console.log(`CSV source: ${relativePath(INPUT_DIR)}`);
  console.log("Validator: pnpm validate:tiger-import");
}

function printValidatorFailure(validator) {
  console.error("");
  console.error("Validator failed. Deployed import planning stopped.");

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
  console.log("Planned upsert/import areas:");

  for (const filePlan of plan.filePlans) {
    const keySummary =
      filePlan.sampleKeys.length > 0 ? `; sample keys: ${filePlan.sampleKeys.join(", ")}` : "";
    console.log(
      `- ${filePlan.table}: ${filePlan.rowCount} reviewed CSV rows from ${filePlan.file}${keySummary}`
    );
  }

  console.log(`- ${OPTION_TABLES.join(", ")}: refreshed from variant option columns`);

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
    `- Draft redirect rows pointing at the Aqua parent product: ${plan.aqua.draftRedirectRows}`
  );
  console.log(`- Open Aqua review flags: ${plan.aqua.openReviewFlags}`);
}

function rows(importData, fileId) {
  return importData.files.get(fileId)?.rows ?? [];
}

function value(row, column) {
  return String(row[column] ?? "").trim();
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

function pushParsedRow(rows, row) {
  if (row.some((field) => field.trim() !== "")) {
    rows.push(row);
  }
}

main();
