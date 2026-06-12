#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const IMAGES_DIR = path.join(REPO_ROOT, "images");
const CATALOG_DIR = path.join(REPO_ROOT, "data/import-review/tigerpingpong/v1");
const PRODUCTS_CSV = path.join(CATALOG_DIR, "products_import_v1.csv");
const MEDIA_CSV = path.join(CATALOG_DIR, "product_media_import_v1.csv");
const DEFAULT_MANIFEST = path.join(
  REPO_ROOT,
  "docs/media/043-cloudinary-upload-manifest-v1.json"
);
const CLOUDINARY_FOLDER_PREFIX = "tigerpingpong/products";
const COMMIT_FLAG = "--commit";
const HELP_FLAG = "--help";
const INCLUDE_DEFERRED_FLAG = "--include-deferred";
const MANIFEST_FLAG = "--manifest";
const CHECKOUT_PURCHASE_MODES = new Set([
  "online_checkout",
  "online_checkout_candidate"
]);
const SUPPORTED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);
const REQUIRED_CLOUDINARY_ENV = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET"
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

  const plan = await buildPlan(args);

  if (args.commit) {
    const refusal = getCommitRefusal(plan);

    if (refusal.length > 0) {
      printPlan(plan, args);
      console.error("\nCommit mode refused:");
      for (const issue of refusal) {
        console.error(`- ${issue}`);
      }
      await writeManifest(plan, args, []);
      process.exitCode = 1;
      return;
    }

    const credentials = getCloudinaryCredentials();

    if (credentials.issues.length > 0) {
      printPlan(plan, args);
      console.error("\nCommit mode refused:");
      for (const issue of credentials.issues) {
        console.error(`- ${issue}`);
      }
      await writeManifest(plan, args, []);
      process.exitCode = 1;
      return;
    }

    const uploadResults = await uploadPlan(plan, credentials);
    printPlan(plan, args, uploadResults);
    await writeManifest(plan, args, uploadResults);
    return;
  }

  printPlan(plan, args);
  await writeManifest(plan, args, []);
}

function parseArgs(argv) {
  const parsed = {
    commit: false,
    errors: [],
    help: false,
    includeDeferred: false,
    manifestPath: DEFAULT_MANIFEST
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === HELP_FLAG) {
      parsed.help = true;
      continue;
    }

    if (arg === COMMIT_FLAG) {
      parsed.commit = true;
      continue;
    }

    if (arg === INCLUDE_DEFERRED_FLAG) {
      parsed.includeDeferred = true;
      continue;
    }

    if (arg === MANIFEST_FLAG) {
      const value = argv[index + 1];

      if (!value) {
        parsed.errors.push(`${MANIFEST_FLAG} requires a path.`);
      } else {
        parsed.manifestPath = path.resolve(REPO_ROOT, value);
        index += 1;
      }
      continue;
    }

    if (arg.startsWith(`${MANIFEST_FLAG}=`)) {
      parsed.manifestPath = path.resolve(REPO_ROOT, arg.slice(MANIFEST_FLAG.length + 1));
      continue;
    }

    parsed.errors.push(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong Cloudinary product media upload v1

Dry run, default:
  node scripts/upload-product-media-to-cloudinary.mjs

Real upload:
  CLOUDINARY_CLOUD_NAME=... CLOUDINARY_API_KEY=... CLOUDINARY_API_SECRET=... \\
    node scripts/upload-product-media-to-cloudinary.mjs --commit

Options:
  --commit             Upload planned, mapped product media to Cloudinary.
  --include-deferred   Also include mapped draft/deferred catalog products.
  --manifest <path>    Write manifest to a custom path.

Safety:
  - Dry run is the default.
  - Commit mode requires Cloudinary credentials.
  - Commit mode uses stable public IDs and overwrite=false.
  - Unmapped and deferred image folders are listed and skipped by default.
  - Duplicate files, unsupported files, ambiguous main images, or missing catalog
    products refuse commit mode.
`);
}

async function buildPlan(args) {
  const issues = [];
  const catalog = await loadCatalog();
  const imageLibrary = await loadImageLibrary();
  const duplicateGroups = await findDuplicateImages(imageLibrary.imageFiles);
  const unsupportedFiles = imageLibrary.allFiles.filter(
    (filePath) =>
      !filePath.endsWith("images.json") &&
      !filePath.endsWith("variants.json") &&
      !SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
  );

  if (!fs.existsSync(IMAGES_DIR)) {
    issues.push({
      kind: "missing_images_directory",
      message: "images/ directory is missing."
    });
  }

  for (const group of duplicateGroups) {
    issues.push({
      kind: "duplicate_file",
      message: "Duplicate image file content detected.",
      files: group.map(relativePath)
    });
  }

  for (const filePath of unsupportedFiles) {
    issues.push({
      kind: "unsupported_file_type",
      message: `Unsupported file type: ${relativePath(filePath)}`,
      file: relativePath(filePath)
    });
  }

  const plannedProducts = [];
  const deferredProducts = [];
  const unmappedFolders = [];
  const ambiguousFolders = [];

  for (const folder of imageLibrary.productFolders) {
    const mappedProductKey = catalog.productKeyByLegacyProductId.get(folder.productId) ?? null;
    const product = mappedProductKey ? catalog.productsByKey.get(mappedProductKey) : null;
    const folderIssues = validateImageFolder(folder, mappedProductKey, product);

    if (folderIssues.length > 0) {
      ambiguousFolders.push({
        folder: relativePath(folder.path),
        productId: folder.productId,
        productKey: mappedProductKey,
        issues: folderIssues
      });
      continue;
    }

    if (!mappedProductKey || !product) {
      unmappedFolders.push(folderSummary(folder));
      continue;
    }

    if (isDeferredProduct(product) && !args.includeDeferred) {
      deferredProducts.push({
        ...folderSummary(folder),
        productKey: product.product_key,
        slug: product.slug,
        status: product.status,
        v1PublicNavigation: product.v1_public_navigation,
        v1CheckoutScope: product.v1_checkout_scope,
        purchaseMode: product.purchase_mode,
        productKind: product.product_kind
      });
      continue;
    }

    plannedProducts.push(createProductUploadPlan(folder, product));
  }

  const uploadItems = plannedProducts.flatMap((productPlan) => productPlan.images);
  const plannedProductKeys = new Set(plannedProducts.map((product) => product.productKey));
  const checkoutProductsMissingImages = catalog.products.filter(
    (product) => isCheckoutEnabledProduct(product) && !plannedProductKeys.has(product.product_key)
  );

  return {
    ambiguousFolders,
    catalog,
    checkoutProductsMissingImages,
    deferredProducts,
    duplicateGroups,
    generatedAt: new Date().toISOString(),
    imageLibrary,
    issues,
    plannedProducts,
    unmappedFolders,
    uploadItems,
    unsupportedFiles
  };
}

async function loadCatalog() {
  const products = parseCsv(await fsp.readFile(PRODUCTS_CSV, "utf8"));
  const media = parseCsv(await fsp.readFile(MEDIA_CSV, "utf8"));
  const productsByKey = new Map(products.map((product) => [product.product_key, product]));
  const productKeyByLegacyProductId = new Map();

  for (const row of media) {
    const productId = getLegacyProductIdFromUrl(row.source_url);

    if (!productId) {
      continue;
    }

    const existing = productKeyByLegacyProductId.get(productId);

    if (existing && existing !== row.product_key) {
      throw new Error(
        `Legacy product id ${productId} maps to both ${existing} and ${row.product_key}.`
      );
    }

    productKeyByLegacyProductId.set(productId, row.product_key);
  }

  return {
    media,
    products,
    productsByKey,
    productKeyByLegacyProductId
  };
}

async function loadImageLibrary() {
  const allFiles = [];
  const productFolders = [];

  if (!fs.existsSync(IMAGES_DIR)) {
    return {
      allFiles,
      imageFiles: [],
      productFolders
    };
  }

  await walk(IMAGES_DIR, async (filePath, dirent) => {
    if (dirent.isFile()) {
      allFiles.push(filePath);
    }
  });

  const candidateDirs = new Set(allFiles.map((filePath) => path.dirname(filePath)));

  for (const dir of [...candidateDirs].sort(comparePaths)) {
    const files = (await fsp.readdir(dir, { withFileTypes: true }))
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name)
      .sort(comparePaths);
    const hasMapping = files.includes("images.json") || files.includes("variants.json");

    if (!hasMapping) {
      continue;
    }

    const folderName = path.basename(dir);
    const productIdMatch = folderName.match(/^(\d+)-/);
    const imageFiles = files
      .filter((file) => SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
      .map((file) => path.join(dir, file));
    const imagesJsonPath = path.join(dir, "images.json");
    const variantsJsonPath = path.join(dir, "variants.json");
    const imagesJson = fs.existsSync(imagesJsonPath)
      ? JSON.parse(await fsp.readFile(imagesJsonPath, "utf8"))
      : [];
    const variantsJson = fs.existsSync(variantsJsonPath)
      ? JSON.parse(await fsp.readFile(variantsJsonPath, "utf8"))
      : [];

    productFolders.push({
      path: dir,
      category: path.relative(IMAGES_DIR, dir).split(path.sep)[0] ?? "",
      folderName,
      imageFiles,
      imagesJson: Array.isArray(imagesJson) ? imagesJson : [],
      productId: productIdMatch ? Number(productIdMatch[1]) : null,
      variantsJson: Array.isArray(variantsJson) ? variantsJson : []
    });
  }

  return {
    allFiles,
    imageFiles: allFiles.filter((filePath) =>
      SUPPORTED_IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase())
    ),
    productFolders
  };
}

async function walk(directory, visit) {
  const entries = await fsp.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    await visit(entryPath, entry);

    if (entry.isDirectory()) {
      await walk(entryPath, visit);
    }
  }
}

async function findDuplicateImages(imageFiles) {
  const hashes = new Map();

  for (const filePath of imageFiles) {
    const buffer = await fsp.readFile(filePath);
    const stat = await fsp.stat(filePath);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");
    const key = `${hash}:${stat.size}`;

    if (!hashes.has(key)) {
      hashes.set(key, []);
    }

    hashes.get(key).push(filePath);
  }

  return [...hashes.values()].filter((paths) => paths.length > 1);
}

function validateImageFolder(folder, mappedProductKey, product) {
  const issues = [];
  const mainImages = folder.imageFiles.filter((filePath) => isMainFile(filePath));
  const imageProductIds = new Set(
    folder.imagesJson.map((image) => image.product_id).filter((productId) => productId !== undefined)
  );
  const variantProductIds = new Set(
    folder.variantsJson
      .map((variant) => variant.product_id)
      .filter((productId) => productId !== undefined)
  );

  if (!folder.productId) {
    issues.push("Folder name does not start with a legacy product id.");
  }

  if (folder.imageFiles.length === 0) {
    issues.push("Folder has no supported image files.");
  }

  if (mainImages.length !== 1) {
    issues.push(`Expected exactly one *-main image; found ${mainImages.length}.`);
  }

  if (folder.imagesJson.length !== folder.imageFiles.length) {
    issues.push(
      `images.json count (${folder.imagesJson.length}) does not match image file count (${folder.imageFiles.length}).`
    );
  }

  if (imageProductIds.size > 1 || variantProductIds.size > 1) {
    issues.push("JSON mapping references multiple legacy product ids.");
  }

  if (
    folder.productId &&
    imageProductIds.size === 1 &&
    !imageProductIds.has(folder.productId)
  ) {
    issues.push("images.json product_id does not match folder legacy product id.");
  }

  if (
    folder.productId &&
    variantProductIds.size === 1 &&
    !variantProductIds.has(folder.productId)
  ) {
    issues.push("variants.json product_id does not match folder legacy product id.");
  }

  if (mappedProductKey && !product) {
    issues.push(`Mapped product key is missing from catalog CSV: ${mappedProductKey}.`);
  }

  return issues;
}

function createProductUploadPlan(folder, product) {
  const orderedFiles = getDisplayOrderedImageFiles(folder);

  return {
    productKey: product.product_key,
    slug: product.slug,
    name: product.name,
    status: product.status,
    productKind: product.product_kind,
    sourceFolder: relativePath(folder.path),
    legacyProductId: folder.productId,
    imageCount: orderedFiles.length,
    images: orderedFiles.map((filePath, index) =>
      createUploadItem(folder, product, filePath, index)
    )
  };
}

function createUploadItem(folder, product, filePath, displayIndex) {
  const originalIndex = folder.imageFiles.findIndex((candidate) => candidate === filePath);
  const sourceMetadata = originalIndex >= 0 ? folder.imagesJson[originalIndex] : null;
  const role = displayIndex === 0 ? "primary" : "gallery";
  const displayOrder = displayIndex + 1;
  const publicId = `${CLOUDINARY_FOLDER_PREFIX}/${product.slug}/${String(displayOrder).padStart(
    2,
    "0"
  )}-${role === "primary" ? "main" : "gallery"}`;
  const sourceDescription =
    typeof sourceMetadata?.description === "string" && sourceMetadata.description.trim()
      ? sourceMetadata.description.trim()
      : null;

  return {
    absoluteFilePath: filePath,
    altText: sourceDescription ?? product.name,
    cloudinaryPublicId: publicId,
    cloudinarySecureUrl: null,
    error: null,
    expectedCloudinaryFolder: `${CLOUDINARY_FOLDER_PREFIX}/${product.slug}`,
    isPrimary: displayIndex === 0,
    legacyProductId: folder.productId,
    localFilePath: relativePath(filePath),
    order: displayOrder,
    originalFileName: path.basename(filePath),
    productKey: product.product_key,
    productName: product.name,
    productSlug: product.slug,
    role,
    sourceImageId: sourceMetadata?.id ?? null,
    sourceIsThumbnail: Boolean(sourceMetadata?.is_thumbnail),
    sourceSortOrder: sourceMetadata?.sort_order ?? null,
    timestamp: null,
    title: displayIndex === 0 ? product.name : `${product.name} image ${displayOrder}`,
    uploadStatus: "planned"
  };
}

function getDisplayOrderedImageFiles(folder) {
  const mainFiles = folder.imageFiles.filter((filePath) => isMainFile(filePath));
  const mainFile = mainFiles[0] ?? folder.imageFiles[0];
  const rest = folder.imageFiles.filter((filePath) => filePath !== mainFile);
  return [mainFile, ...rest];
}

function folderSummary(folder) {
  return {
    category: folder.category,
    folder: relativePath(folder.path),
    imageCount: folder.imageFiles.length,
    mainFiles: folder.imageFiles
      .filter((filePath) => isMainFile(filePath))
      .map((filePath) => path.basename(filePath)),
    productId: folder.productId,
    skuRefs: [
      ...new Set(folder.variantsJson.map((variant) => variant.sku).filter(Boolean))
    ]
  };
}

function isMainFile(filePath) {
  return /(^|-)main\.[^.]+$/i.test(path.basename(filePath));
}

function isDeferredProduct(product) {
  return (
    product.status !== "active" ||
    product.v1_public_navigation !== "true" ||
    product.v1_checkout_scope !== "true" ||
    product.product_kind === "replacement_part" ||
    product.purchase_mode === "deferred_from_v1"
  );
}

function isCheckoutEnabledProduct(product) {
  return (
    product.status === "active" &&
    product.v1_public_navigation === "true" &&
    product.v1_checkout_scope === "true" &&
    product.product_kind !== "replacement_part" &&
    CHECKOUT_PURCHASE_MODES.has(product.purchase_mode) &&
    product.price_cents !== "" &&
    Number(product.price_cents) > 0 &&
    product.currency === "CAD"
  );
}

function getCommitRefusal(plan) {
  const issues = [];

  if (plan.uploadItems.length === 0) {
    issues.push("No mapped upload items were planned.");
  }

  if (plan.issues.length > 0) {
    issues.push("Plan-level issues exist.");
  }

  if (plan.ambiguousFolders.length > 0) {
    issues.push("Ambiguous image folders exist.");
  }

  if (plan.duplicateGroups.length > 0) {
    issues.push("Duplicate image files exist.");
  }

  if (plan.unsupportedFiles.length > 0) {
    issues.push("Unsupported files exist in images/.");
  }

  if (plan.checkoutProductsMissingImages.length > 0) {
    issues.push("At least one checkout-enabled product has no mapped primary image.");
  }

  return issues;
}

function getCloudinaryCredentials() {
  const credentials = getCredentialsFromCloudinaryUrl(process.env.CLOUDINARY_URL) ?? {
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  };
  const issues = [];

  if (!credentials.cloudName || !credentials.apiKey || !credentials.apiSecret) {
    issues.push(
      `Cloudinary credentials are required for commit mode: ${REQUIRED_CLOUDINARY_ENV.join(", ")} or CLOUDINARY_URL.`
    );
  }

  return {
    ...credentials,
    issues
  };
}

function getCredentialsFromCloudinaryUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "cloudinary:") {
      return null;
    }

    return {
      apiKey: decodeURIComponent(url.username),
      apiSecret: decodeURIComponent(url.password),
      cloudName: url.hostname
    };
  } catch {
    return null;
  }
}

async function uploadPlan(plan, credentials) {
  const results = [];

  for (const item of plan.uploadItems) {
    results.push(await uploadItem(item, credentials));
  }

  return results;
}

async function uploadItem(item, credentials) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const uploadParams = {
    overwrite: "false",
    public_id: item.cloudinaryPublicId,
    timestamp,
    unique_filename: "false"
  };
  const signature = signCloudinaryParams(uploadParams, credentials.apiSecret);
  const form = new FormData();
  const buffer = await fsp.readFile(item.absoluteFilePath);
  const blob = new Blob([buffer], {
    type: mimeTypeForPath(item.absoluteFilePath)
  });

  form.set("file", blob, path.basename(item.absoluteFilePath));
  form.set("api_key", credentials.apiKey);
  form.set("signature", signature);

  for (const [key, value] of Object.entries(uploadParams)) {
    form.set(key, value);
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(credentials.cloudName)}/image/upload`,
      {
        body: form,
        method: "POST"
      }
    );
    const body = await response.json().catch(() => ({}));
    const timestampIso = new Date().toISOString();

    if (!response.ok) {
      const message =
        body?.error?.message ??
        body?.message ??
        `Cloudinary upload failed with HTTP ${response.status}`;
      return {
        ...item,
        cloudinarySecureUrl: null,
        error: message,
        timestamp: timestampIso,
        uploadStatus: message.toLowerCase().includes("already exists")
          ? "skipped_existing"
          : "failed"
      };
    }

    return {
      ...item,
      bytes: body.bytes ?? null,
      cloudinaryAssetId: body.asset_id ?? null,
      cloudinaryFormat: body.format ?? null,
      cloudinaryResourceType: body.resource_type ?? "image",
      cloudinarySecureUrl: body.secure_url ?? null,
      cloudinaryVersion: body.version ?? null,
      error: null,
      height: body.height ?? null,
      timestamp: timestampIso,
      uploadStatus: "uploaded",
      width: body.width ?? null
    };
  } catch (error) {
    return {
      ...item,
      cloudinarySecureUrl: null,
      error: error instanceof Error ? error.message : "Unknown upload error.",
      timestamp: new Date().toISOString(),
      uploadStatus: "failed"
    };
  }
}

function signCloudinaryParams(params, apiSecret) {
  const serialized = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${serialized}${apiSecret}`)
    .digest("hex");
}

function mimeTypeForPath(filePath) {
  return path.extname(filePath).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
}

function printPlan(plan, args, uploadResults = []) {
  const mode = args.commit ? "commit" : "dry-run";
  const uploadCount = uploadResults.length > 0 ? uploadResults.length : plan.uploadItems.length;

  console.log("Tiger PingPong Cloudinary product media upload v1");
  console.log(`Mode: ${mode}`);
  console.log(`Images directory: ${relativePath(IMAGES_DIR)}`);
  console.log(`Manifest: ${relativePath(args.manifestPath)}`);
  console.log(
    `Cloudinary public ID convention: ${CLOUDINARY_FOLDER_PREFIX}/<product-slug>/<order>-<role>`
  );
  console.log(`Products planned: ${plan.plannedProducts.length}`);
  console.log(`Files planned: ${uploadCount}`);
  console.log(`Deferred mapped folders skipped: ${plan.deferredProducts.length}`);
  console.log(`Unmapped folders skipped: ${plan.unmappedFolders.length}`);
  console.log(`Ambiguous folders: ${plan.ambiguousFolders.length}`);
  console.log(
    `Checkout-enabled products missing mapped images: ${plan.checkoutProductsMissingImages.length}`
  );

  if (plan.plannedProducts.length > 0) {
    console.log("\nProducts to update:");

    for (const product of plan.plannedProducts) {
      console.log(`- ${product.slug}: ${product.imageCount} image(s)`);
    }
  }

  if (plan.uploadItems.length > 0) {
    console.log("\nFiles to upload:");

    for (const item of plan.uploadItems) {
      console.log(
        `- ${item.productSlug} #${String(item.order).padStart(2, "0")} ${item.role}: ${item.localFilePath} -> ${item.cloudinaryPublicId}`
      );
    }
  }

  if (plan.checkoutProductsMissingImages.length > 0) {
    console.log("\nCheckout-enabled products missing mapped images:");

    for (const product of plan.checkoutProductsMissingImages) {
      console.log(`- ${product.slug}`);
    }
  }

  if (plan.deferredProducts.length > 0) {
    console.log("\nDeferred mapped folders skipped:");

    for (const folder of plan.deferredProducts) {
      console.log(`- ${folder.folder} -> ${folder.slug}`);
    }
  }

  if (plan.unmappedFolders.length > 0) {
    console.log("\nUnmapped folders skipped:");

    for (const folder of plan.unmappedFolders) {
      console.log(`- ${folder.folder}`);
    }
  }

  if (plan.ambiguousFolders.length > 0) {
    console.log("\nAmbiguous folders:");

    for (const folder of plan.ambiguousFolders) {
      console.log(`- ${folder.folder}: ${folder.issues.join("; ")}`);
    }
  }

  if (uploadResults.length > 0) {
    const uploaded = uploadResults.filter((item) => item.uploadStatus === "uploaded").length;
    const skipped = uploadResults.filter((item) => item.uploadStatus === "skipped_existing").length;
    const failed = uploadResults.filter((item) => item.uploadStatus === "failed").length;

    console.log("\nUpload result:");
    console.log(`- Uploaded: ${uploaded}`);
    console.log(`- Skipped existing: ${skipped}`);
    console.log(`- Failed: ${failed}`);
  }
}

async function writeManifest(plan, args, uploadResults) {
  const resultByKey = new Map(
    uploadResults.map((item) => [`${item.productSlug}:${item.order}:${item.localFilePath}`, item])
  );
  const manifestItems = plan.uploadItems.map((item) => {
    const result = resultByKey.get(`${item.productSlug}:${item.order}:${item.localFilePath}`);
    const output = result ?? {
      ...item,
      timestamp: plan.generatedAt,
      uploadStatus: args.commit ? "not_started" : "dry_run"
    };

    return sanitizeManifestItem(output);
  });
  const manifest = {
    schemaVersion: "043-cloudinary-upload-manifest-v1",
    generatedAt: new Date().toISOString(),
    mode: args.commit ? "commit" : "dry-run",
    cloudinary: {
      folderConvention: `${CLOUDINARY_FOLDER_PREFIX}/<product-slug>/<order>-<role>`,
      overwrite: false
    },
    summary: {
      ambiguousFolders: plan.ambiguousFolders.length,
      checkoutEnabledProductsMissingMappedImages: plan.checkoutProductsMissingImages.length,
      deferredMappedFoldersSkipped: plan.deferredProducts.length,
      failed: manifestItems.filter((item) => item.uploadStatus === "failed").length,
      filesPlanned: plan.uploadItems.length,
      imageFilesFound: plan.imageLibrary.imageFiles.length,
      productFoldersFound: plan.imageLibrary.productFolders.length,
      productsPlanned: plan.plannedProducts.length,
      skippedExisting: manifestItems.filter((item) => item.uploadStatus === "skipped_existing").length,
      unmappedFoldersSkipped: plan.unmappedFolders.length,
      uploaded: manifestItems.filter((item) => item.uploadStatus === "uploaded").length
    },
    products: plan.plannedProducts.map((product) => ({
      imageCount: product.imageCount,
      legacyProductId: product.legacyProductId,
      name: product.name,
      productKey: product.productKey,
      slug: product.slug,
      sourceFolder: product.sourceFolder
    })),
    uploads: manifestItems,
    skipped: {
      ambiguousFolders: plan.ambiguousFolders,
      checkoutProductsMissingMappedImages: plan.checkoutProductsMissingImages.map((product) => ({
        name: product.name,
        productKey: product.product_key,
        slug: product.slug
      })),
      deferredMappedFolders: plan.deferredProducts,
      duplicateGroups: plan.duplicateGroups.map((group) => group.map(relativePath)),
      unmappedFolders: plan.unmappedFolders,
      unsupportedFiles: plan.unsupportedFiles.map(relativePath)
    }
  };

  await fsp.mkdir(path.dirname(args.manifestPath), { recursive: true });
  await fsp.writeFile(args.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nManifest written: ${relativePath(args.manifestPath)}`);
}

function sanitizeManifestItem(item) {
  return {
    altText: item.altText,
    bytes: item.bytes ?? null,
    cloudinaryAssetId: item.cloudinaryAssetId ?? null,
    cloudinaryFormat: item.cloudinaryFormat ?? null,
    cloudinaryPublicId: item.cloudinaryPublicId,
    cloudinaryResourceType: item.cloudinaryResourceType ?? null,
    cloudinarySecureUrl: item.cloudinarySecureUrl ?? null,
    cloudinaryVersion: item.cloudinaryVersion ?? null,
    error: item.error ?? null,
    height: item.height ?? null,
    imageOrder: item.order,
    imageRole: item.role,
    isPrimary: item.isPrimary,
    localFilePath: item.localFilePath,
    originalFileName: item.originalFileName,
    productKey: item.productKey,
    productName: item.productName,
    productSlug: item.productSlug,
    sourceImageId: item.sourceImageId,
    sourceIsThumbnail: item.sourceIsThumbnail,
    sourceSortOrder: item.sourceSortOrder,
    timestamp: item.timestamp ?? null,
    title: item.title,
    uploadStatus: item.uploadStatus,
    width: item.width ?? null
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header
  );

  return rows
    .slice(1)
    .filter((values) => values.some((value) => value.trim() !== ""))
    .map((values) =>
      Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
    );
}

function getLegacyProductIdFromUrl(url) {
  const match = String(url ?? "").match(/\/products\/(\d+)\//);
  return match ? Number(match[1]) : null;
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function comparePaths(left, right) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
