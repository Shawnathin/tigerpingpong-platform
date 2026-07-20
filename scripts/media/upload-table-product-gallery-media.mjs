#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const DEFAULT_MANIFEST = path.join(REPO_ROOT, "data/media/table-product-gallery-manifest-v1.json");
const DEFAULT_SOURCE_ROOT = path.join(REPO_ROOT, "exports/table-gallery-media");
const RESULTS_PATH = path.join(DEFAULT_SOURCE_ROOT, "upload-results.json");
const REQUIRED_ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Table gallery media upload failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const manifest = JSON.parse(readFileSync(args.manifest, "utf8"));
  const uploadEntries = manifest.products.flatMap((product) =>
    product.assets
      .filter(
        (asset) =>
          asset.uploadAction === "upload" &&
          (args.mediaKeys.length === 0 || args.mediaKeys.includes(asset.mediaKey))
      )
      .map((asset) => ({ asset, productSlug: product.productSlug }))
  );
  const foundKeys = new Set(uploadEntries.map(({ asset }) => asset.mediaKey));
  const unknownKeys = args.mediaKeys.filter((mediaKey) => !foundKeys.has(mediaKey));

  if (unknownKeys.length > 0) {
    throw new Error(`Unknown or non-upload media keys: ${unknownKeys.join(", ")}`);
  }

  const planned = [];
  for (const entry of uploadEntries) {
    const sourcePath = resolveSourcePath(args.sourceRoot, entry.asset.source.relativePath);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing source for ${entry.asset.mediaKey}: ${sourcePath}`);
    }

    const sourceBuffer = await readFile(sourcePath);
    const sha256 = crypto.createHash("sha256").update(sourceBuffer).digest("hex");
    if (sha256 !== entry.asset.source.sha256) {
      throw new Error(`Hash mismatch for ${entry.asset.mediaKey}; refusing an unreviewed source.`);
    }

    const dimensions = readImageDimensions(sourceBuffer);
    if (
      dimensions.width !== entry.asset.source.width ||
      dimensions.height !== entry.asset.source.height
    ) {
      throw new Error(
        `Dimension mismatch for ${entry.asset.mediaKey}: expected ${entry.asset.source.width}x${entry.asset.source.height}, found ${dimensions.width}x${dimensions.height}.`
      );
    }

    const longestEdge = Math.max(dimensions.width, dimensions.height);
    const isApprovedException = entry.asset.qualityStatus === "best_available_current_model";
    if (longestEdge < manifest.delivery.minimumUsefulSourceEdge && !isApprovedException) {
      throw new Error(
        `${entry.asset.mediaKey} is below the ${manifest.delivery.minimumUsefulSourceEdge}px minimum and is not an approved current-model exception.`
      );
    }

    planned.push({ ...entry, dimensions, sourceBuffer, sourcePath });
  }

  console.log(
    JSON.stringify(
      {
        mode: args.commit ? "commit" : "dry-run",
        uploadCount: planned.length,
        entries: planned.map(({ asset, dimensions, productSlug, sourceBuffer }) => ({
          bytes: sourceBuffer.byteLength,
          dimensions,
          mediaKey: asset.mediaKey,
          productSlug,
          publicId: asset.cloudinary.publicId,
          qualityStatus: asset.qualityStatus,
          sha256: asset.source.sha256
        }))
      },
      null,
      2
    )
  );

  if (!args.commit) {
    console.log("Dry run complete. No Cloudinary assets or repository files were changed.");
    return;
  }

  loadEnvFile(args.envFile);
  const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]?.trim());
  if (missingEnv.length > 0) {
    throw new Error(`Missing Cloudinary environment names: ${missingEnv.join(", ")}`);
  }

  const credentials = {
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  };
  const collisions = [];

  for (const { asset } of planned) {
    if (await cloudinaryAssetExists(asset.cloudinary.publicId, credentials)) {
      collisions.push(asset.cloudinary.publicId);
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `Cloudinary collision preflight failed; refusing overwrite:\n- ${collisions.join("\n- ")}`
    );
  }

  const results = [];
  try {
    for (const [index, item] of planned.entries()) {
      const result = await uploadEntry(item, credentials);
      results.push(result);
      console.log(`Uploaded ${index + 1}/${planned.length}: ${result.publicId}`);
    }
  } catch (error) {
    await writeResults({
      error: error instanceof Error ? error.message : "Unknown upload failure.",
      failedAt: new Date().toISOString(),
      results,
      status: "partial-failure"
    });
    throw error;
  }

  await writeResults({ completedAt: new Date().toISOString(), results, status: "complete" });
  console.log(`Upload complete. Public metadata written to ${relativePath(RESULTS_PATH)}.`);
}

function parseArgs(argv) {
  const parsed = {
    commit: false,
    envFile: path.join(REPO_ROOT, ".env"),
    help: false,
    manifest: DEFAULT_MANIFEST,
    mediaKeys: [],
    sourceRoot: DEFAULT_SOURCE_ROOT
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--commit") parsed.commit = true;
    else if (arg === "--help") parsed.help = true;
    else if (["--env-file", "--manifest", "--media-key", "--source-root"].includes(arg)) {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      if (arg === "--env-file") parsed.envFile = path.resolve(value);
      if (arg === "--manifest") parsed.manifest = path.resolve(value);
      if (arg === "--media-key") parsed.mediaKeys.push(value);
      if (arg === "--source-root") parsed.sourceRoot = path.resolve(value);
      index += 1;
    } else if (arg.startsWith("--media-key=")) parsed.mediaKeys.push(arg.slice(12));
    else if (arg.startsWith("--env-file=")) parsed.envFile = path.resolve(arg.slice(11));
    else if (arg.startsWith("--manifest=")) parsed.manifest = path.resolve(arg.slice(11));
    else if (arg.startsWith("--source-root=")) parsed.sourceRoot = path.resolve(arg.slice(14));
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong table product gallery uploader

Dry run (default):
  node scripts/media/upload-table-product-gallery-media.mjs

Real upload:
  node scripts/media/upload-table-product-gallery-media.mjs --commit --env-file <path>

Options:
  --source-root <path>  Folder containing approved, ignored source media.
  --manifest <path>     Table gallery manifest.
  --media-key <key>     Limit work to one approved media key; repeatable.
  --env-file <path>     Environment file containing Cloudinary credentials.
  --commit              Upload after all safety checks pass.

Safety:
  - Dry run is the default.
  - Source hashes and dimensions must match the tracked manifest.
  - Low-resolution media requires an explicit current-model exception.
  - Commit mode refuses Cloudinary public-ID collisions and never overwrites.
`);
}

function resolveSourcePath(sourceRoot, relativeSourcePath) {
  const resolved = path.resolve(sourceRoot, relativeSourcePath);
  const relative = path.relative(sourceRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Source path escapes the approved root: ${relativeSourcePath}`);
  }
  return resolved;
}

function readImageDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    throw new Error("Only reviewed JPEG sources are accepted by this focused uploader.");
  }

  let offset = 2;
  while (offset + 8 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) break;
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
        marker
      )
    ) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5)
      };
    }
    offset += length;
  }

  throw new Error("Unable to read JPEG dimensions.");
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

async function cloudinaryAssetExists(publicId, credentials) {
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/resources/image/upload/${encodeURIComponent(publicId)}`,
    {
      headers: {
        authorization: `Basic ${Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64")}`
      }
    }
  );
  if (response.status === 404) return false;
  if (response.ok) return true;
  const body = await safeJson(response);
  throw new Error(
    `Cloudinary collision check failed for ${publicId}: ${response.status} ${body.error?.message ?? ""}`
  );
}

async function uploadEntry({ asset, productSlug, sourceBuffer, sourcePath }, credentials) {
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    context: `media_key=${asset.mediaKey}|product_slug=${productSlug}|role=${asset.role}|rights_status=${asset.rightsStatus}`,
    overwrite: "false",
    public_id: asset.cloudinary.publicId,
    tags: `tiger-table-gallery,storefront,owner-cleared,${productSlug}`,
    timestamp: String(timestamp),
    unique_filename: "false"
  };
  const formData = new FormData();
  formData.append("file", new Blob([sourceBuffer]), path.basename(sourcePath));
  formData.append("api_key", credentials.apiKey);
  for (const [name, value] of Object.entries(uploadParams)) formData.append(name, value);
  formData.append("signature", signParams(uploadParams, credentials.apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`,
    { body: formData, method: "POST" }
  );
  const body = await safeJson(response);
  if (!response.ok) {
    throw new Error(
      `Cloudinary upload failed for ${asset.mediaKey}: ${response.status} ${body.error?.message ?? ""}`
    );
  }

  return {
    assetId: body.asset_id,
    bytes: body.bytes,
    format: body.format,
    height: body.height,
    mediaKey: asset.mediaKey,
    productSlug,
    publicId: body.public_id,
    secureUrl: body.secure_url,
    sourceSha256: asset.source.sha256,
    version: body.version,
    width: body.width
  };
}

function signParams(params, apiSecret) {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

async function safeJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function writeResults(result) {
  await mkdir(path.dirname(RESULTS_PATH), { recursive: true });
  await writeFile(RESULTS_PATH, `${JSON.stringify(result, null, 2)}\n`);
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}
