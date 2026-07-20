#!/usr/bin/env node

import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = path.join(
  REPO_ROOT,
  "data/import-review/tigerpingpong/v1/aqua_product_media_v1.json"
);
const RESULTS_PATH = path.join(REPO_ROOT, "exports/aqua-product-media/upload-results.json");
const REQUIRED_ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Aqua media upload failed.");
  process.exitCode = 1;
});

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const selectedAssets =
    args.mediaKeys.length > 0
      ? manifest.assets.filter((asset) => args.mediaKeys.includes(asset.mediaKey))
      : manifest.assets;
  const missingMediaKeys = args.mediaKeys.filter(
    (mediaKey) => !selectedAssets.some((asset) => asset.mediaKey === mediaKey)
  );

  if (missingMediaKeys.length > 0) {
    throw new Error(`Unknown Aqua media keys: ${missingMediaKeys.join(", ")}`);
  }

  const verified = [];

  for (const asset of selectedAssets) {
    const sourcePath = resolveSourcePath(args.sourceRoot, asset.file);
    if (!existsSync(sourcePath)) {
      throw new Error(`Missing processed Aqua final: ${asset.file}`);
    }

    const sourceBuffer = await readFile(sourcePath);
    const sha256 = crypto.createHash("sha256").update(sourceBuffer).digest("hex");

    if (sha256 !== asset.sha256) {
      throw new Error(`Hash mismatch for ${asset.mediaKey}; refusing an unreviewed file.`);
    }

    verified.push({ asset, sourceBuffer, sourcePath });
  }

  console.log(
    JSON.stringify(
      {
        mode: args.commit ? "commit" : "dry-run",
        assetCount: verified.length,
        assets: verified.map(({ asset, sourceBuffer }) => ({
          mediaKey: asset.mediaKey,
          bytes: sourceBuffer.byteLength,
          publicId: asset.cloudinaryPublicId,
          sha256: asset.sha256,
          variantKey: asset.variantKey
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
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  };

  const collisions = [];
  for (const { asset } of verified) {
    if (await cloudinaryAssetExists(asset.cloudinaryPublicId, credentials)) {
      collisions.push(asset.cloudinaryPublicId);
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `Cloudinary collision preflight failed; refusing overwrite:\n- ${collisions.join("\n- ")}`
    );
  }

  const results = [];
  try {
    for (const [index, item] of verified.entries()) {
      const result = await uploadAsset(item, credentials);
      results.push(result);
      console.log(`Uploaded ${index + 1}/${verified.length}: ${result.publicId}`);
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
  console.log(JSON.stringify({ resultsPath: relativePath(RESULTS_PATH), status: "complete" }));
}

function parseArgs(argv) {
  const parsed = {
    commit: false,
    envFile: path.join(REPO_ROOT, ".env"),
    help: false,
    mediaKeys: [],
    sourceRoot: REPO_ROOT
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--commit") parsed.commit = true;
    else if (arg === "--help") parsed.help = true;
    else if (arg === "--env-file" || arg === "--media-key" || arg === "--source-root") {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value.`);
      if (arg === "--env-file") parsed.envFile = path.resolve(value);
      else if (arg === "--media-key") parsed.mediaKeys.push(value);
      else parsed.sourceRoot = path.resolve(value);
      index += 1;
    } else if (arg.startsWith("--env-file=")) parsed.envFile = path.resolve(arg.slice(11));
    else if (arg.startsWith("--media-key=")) parsed.mediaKeys.push(arg.slice(12));
    else if (arg.startsWith("--source-root=")) parsed.sourceRoot = path.resolve(arg.slice(14));
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Tiger PingPong Aqua product media uploader

Dry run (default):
  node scripts/media/upload-aqua-product-media.mjs --source-root <processed-media-worktree>

Real upload:
  node scripts/media/upload-aqua-product-media.mjs --source-root <path> --commit

Options:
  --source-root <path>  Root containing the ignored, processed Aqua finals.
  --env-file <path>     Environment file containing Cloudinary credentials.
  --media-key <key>     Select one hash-locked asset; repeat for more.
  --commit              Upload after hash and collision preflight.
  --help                Show this help.

Safety: dry-run is the default; hashes are mandatory; commit refuses collisions and overwrite.
`);
}

function resolveSourcePath(sourceRoot, relativeFile) {
  const resolved = path.resolve(sourceRoot, relativeFile);
  const relative = path.relative(sourceRoot, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Processed file escapes the source root: ${relativeFile}`);
  }

  return resolved;
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

async function uploadAsset({ asset, sourceBuffer, sourcePath }, credentials) {
  const uploadParams = {
    context: `media_key=${asset.mediaKey}|role=${asset.role}|variant_key=${asset.variantKey ?? "shared"}|rights_status=owner-cleared`,
    overwrite: "false",
    public_id: asset.cloudinaryPublicId,
    tags: "tiger-aqua-product,storefront,owner-cleared",
    timestamp: String(Math.floor(Date.now() / 1000)),
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
    bytes: body.bytes,
    format: body.format,
    height: body.height,
    mediaKey: asset.mediaKey,
    publicId: body.public_id,
    secureUrl: body.secure_url,
    sha256: asset.sha256,
    variantKey: asset.variantKey,
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
  const responseText = await response.text();
  if (!responseText) return {};
  try {
    return JSON.parse(responseText);
  } catch {
    return { raw: responseText };
  }
}

async function writeResults(result) {
  await mkdir(path.dirname(RESULTS_PATH), { recursive: true });
  await writeFile(RESULTS_PATH, `${JSON.stringify(result, null, 2)}\n`);
}

function relativePath(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}
